package com.yiqi.service;

import com.yiqi.exception.AIServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Supplier;

/**
 * 重试服务
 * 提供各种重试策略和错误处理机制
 */
@Service
public class RetryService {
    
    private static final Logger logger = LoggerFactory.getLogger(RetryService.class);
    
    private final ScheduledExecutorService scheduledExecutor = Executors.newScheduledThreadPool(2);
    
    /**
     * 重试配置
     */
    public static class RetryConfig {
        private int maxAttempts = 3;
        private long baseDelayMs = 1000;
        private long maxDelayMs = 30000;
        private double backoffMultiplier = 2.0;
        private boolean useJitter = true;
        
        public RetryConfig() {}
        
        public RetryConfig(int maxAttempts, long baseDelayMs) {
            this.maxAttempts = maxAttempts;
            this.baseDelayMs = baseDelayMs;
        }
        
        // Getters and Setters
        public int getMaxAttempts() { return maxAttempts; }
        public void setMaxAttempts(int maxAttempts) { this.maxAttempts = maxAttempts; }
        
        public long getBaseDelayMs() { return baseDelayMs; }
        public void setBaseDelayMs(long baseDelayMs) { this.baseDelayMs = baseDelayMs; }
        
        public long getMaxDelayMs() { return maxDelayMs; }
        public void setMaxDelayMs(long maxDelayMs) { this.maxDelayMs = maxDelayMs; }
        
        public double getBackoffMultiplier() { return backoffMultiplier; }
        public void setBackoffMultiplier(double backoffMultiplier) { this.backoffMultiplier = backoffMultiplier; }
        
        public boolean isUseJitter() { return useJitter; }
        public void setUseJitter(boolean useJitter) { this.useJitter = useJitter; }
    }
    
    /**
     * 执行带重试的操作
     * 
     * @param operation 要执行的操作
     * @param config 重试配置
     * @param operationName 操作名称（用于日志）
     * @return 操作结果
     */
    public <T> T executeWithRetry(Supplier<T> operation, RetryConfig config, String operationName) {
        Exception lastException = null;
        
        for (int attempt = 1; attempt <= config.getMaxAttempts(); attempt++) {
            try {
                logger.debug("执行操作: {}, 尝试次数: {}/{}", operationName, attempt, config.getMaxAttempts());
                
                T result = operation.get();
                
                if (attempt > 1) {
                    logger.info("操作成功: {}, 尝试次数: {}", operationName, attempt);
                }
                
                return result;
                
            } catch (Exception e) {
                lastException = e;
                
                logger.warn("操作失败: {}, 尝试次数: {}/{}, 错误: {}", 
                           operationName, attempt, config.getMaxAttempts(), e.getMessage());
                
                // 如果不是最后一次尝试，则等待后重试
                if (attempt < config.getMaxAttempts()) {
                    long delay = calculateDelay(attempt, config);
                    
                    try {
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new AIServiceException("RETRY_INTERRUPTED", "重试被中断", ie);
                    }
                }
            }
        }
        
        // 所有重试都失败了
        logger.error("操作最终失败: {}, 已重试 {} 次", operationName, config.getMaxAttempts());
        throw new AIServiceException("RETRY_EXHAUSTED", 
                                   String.format("操作失败，已重试%d次: %s", config.getMaxAttempts(), operationName), 
                                   lastException);
    }
    
    /**
     * 异步执行带重试的操作
     * 
     * @param operation 要执行的异步操作
     * @param config 重试配置
     * @param operationName 操作名称
     * @return 异步操作结果
     */
    public <T> CompletableFuture<T> executeWithRetryAsync(Supplier<CompletableFuture<T>> operation, 
                                                        RetryConfig config, 
                                                        String operationName) {
        return executeWithRetryAsyncInternal(operation, config, operationName, 1);
    }
    
    /**
     * 内部递归异步重试方法
     */
    private <T> CompletableFuture<T> executeWithRetryAsyncInternal(Supplier<CompletableFuture<T>> operation,
                                                                 RetryConfig config,
                                                                 String operationName,
                                                                 int attempt) {
        logger.debug("异步执行操作: {}, 尝试次数: {}/{}", operationName, attempt, config.getMaxAttempts());
        
        return operation.get()
            .handle((result, throwable) -> {
                if (throwable == null) {
                    // 成功
                    if (attempt > 1) {
                        logger.info("异步操作成功: {}, 尝试次数: {}", operationName, attempt);
                    }
                    return CompletableFuture.completedFuture(result);
                } else {
                    // 失败
                    logger.warn("异步操作失败: {}, 尝试次数: {}/{}, 错误: {}", 
                               operationName, attempt, config.getMaxAttempts(), throwable.getMessage());
                    
                    if (attempt < config.getMaxAttempts()) {
                        // 还有重试机会
                        long delay = calculateDelay(attempt, config);
                        
                        // 使用ScheduledExecutorService来实现延迟
                        CompletableFuture<T> delayedFuture = new CompletableFuture<>();
                        scheduledExecutor.schedule(() -> {
                            executeWithRetryAsyncInternal(operation, config, operationName, attempt + 1)
                                .whenComplete((retryResult, ex) -> {
                                    if (ex != null) {
                                        delayedFuture.completeExceptionally(ex);
                                    } else {
                                        delayedFuture.complete(retryResult);
                                    }
                                });
                        }, delay, java.util.concurrent.TimeUnit.MILLISECONDS);
                        return delayedFuture;
                    } else {
                        // 重试次数用完
                        logger.error("异步操作最终失败: {}, 已重试 {} 次", operationName, config.getMaxAttempts());
                        CompletableFuture<T> failedFuture = new CompletableFuture<>();
                        failedFuture.completeExceptionally(
                            new AIServiceException("ASYNC_RETRY_EXHAUSTED", 
                                                 String.format("异步操作失败，已重试%d次: %s", config.getMaxAttempts(), operationName), 
                                                 throwable)
                        );
                        return failedFuture;
                    }
                }
            })
            .thenCompose(future -> future);
    }
    
    /**
     * 计算延迟时间（指数退避 + 抖动）
     */
    private long calculateDelay(int attempt, RetryConfig config) {
        // 指数退避
        long delay = (long) (config.getBaseDelayMs() * Math.pow(config.getBackoffMultiplier(), attempt - 1));
        
        // 限制最大延迟
        delay = Math.min(delay, config.getMaxDelayMs());
        
        // 添加抖动以避免雷群效应
        if (config.isUseJitter()) {
            double jitterFactor = 0.1; // 10%的抖动
            long jitter = (long) (delay * jitterFactor * ThreadLocalRandom.current().nextDouble());
            delay += ThreadLocalRandom.current().nextBoolean() ? jitter : -jitter;
        }
        
        return Math.max(delay, 0);
    }
    
    /**
     * 判断异常是否可重试
     */
    public boolean isRetryableException(Throwable throwable) {
        if (throwable == null) {
            return false;
        }
        
        // 网络相关异常通常可以重试
        if (throwable instanceof java.net.SocketTimeoutException ||
            throwable instanceof java.net.ConnectException ||
            throwable instanceof java.io.IOException) {
            return true;
        }
        
        // AI服务异常根据错误码判断
        if (throwable instanceof AIServiceException) {
            AIServiceException aiException = (AIServiceException) throwable;
            String errorCode = aiException.getErrorCode();
            
            // 这些错误码通常可以重试
            return "AI_REQUEST_FAILED".equals(errorCode) ||
                   "AI_SERVICE_TIMEOUT".equals(errorCode) ||
                   "AI_SERVICE_UNAVAILABLE".equals(errorCode);
        }
        
        // 其他异常通常不重试
        return false;
    }
    
    /**
     * 创建默认重试配置
     */
    public RetryConfig createDefaultConfig() {
        return new RetryConfig(3, 1000);
    }
    
    /**
     * 创建AI推理专用重试配置
     */
    public RetryConfig createAIInferenceConfig() {
        RetryConfig config = new RetryConfig();
        config.setMaxAttempts(3);
        config.setBaseDelayMs(2000);
        config.setMaxDelayMs(30000);
        config.setBackoffMultiplier(2.0);
        config.setUseJitter(true);
        return config;
    }
}