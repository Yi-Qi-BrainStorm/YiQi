package com.yiqi.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * AI服务健康监控器
 * 实现熔断器模式，监控AI服务的健康状态
 */
@Service
public class AIServiceHealthMonitor {
    
    private static final Logger logger = LoggerFactory.getLogger(AIServiceHealthMonitor.class);
    
    @Autowired
    @Lazy
    private QiniuAIService qiniuAIService;
    
    // 熔断器状态
    private volatile CircuitBreakerState state = CircuitBreakerState.CLOSED;
    
    // 失败计数器
    private final AtomicInteger failureCount = new AtomicInteger(0);
    
    // 成功计数器
    private final AtomicInteger successCount = new AtomicInteger(0);
    
    // 最后失败时间
    private volatile LocalDateTime lastFailureTime;
    
    // 最后健康检查时间
    private volatile LocalDateTime lastHealthCheckTime;
    
    // 配置参数
    private static final int FAILURE_THRESHOLD = 5; // 失败阈值
    private static final long TIMEOUT_DURATION_MS = 60000; // 超时时间（1分钟）
    private static final int SUCCESS_THRESHOLD = 3; // 恢复成功阈值
    
    /**
     * 熔断器状态枚举
     */
    public enum CircuitBreakerState {
        CLOSED,    // 关闭状态，正常工作
        OPEN,      // 开启状态，拒绝请求
        HALF_OPEN  // 半开状态，尝试恢复
    }
    
    /**
     * 检查服务是否可用
     */
    public boolean isServiceAvailable() {
        switch (state) {
            case CLOSED:
                return true;
            case OPEN:
                // 检查是否可以进入半开状态
                if (shouldAttemptReset()) {
                    state = CircuitBreakerState.HALF_OPEN;
                    logger.info("熔断器进入半开状态，尝试恢复服务");
                    return true;
                }
                return false;
            case HALF_OPEN:
                return true;
            default:
                return false;
        }
    }
    
    /**
     * 记录成功调用
     */
    public void recordSuccess() {
        successCount.incrementAndGet();
        
        if (state == CircuitBreakerState.HALF_OPEN) {
            if (successCount.get() >= SUCCESS_THRESHOLD) {
                reset();
                logger.info("熔断器恢复正常，成功次数: {}", successCount.get());
            }
        }
    }
    
    /**
     * 记录失败调用
     */
    public void recordFailure() {
        failureCount.incrementAndGet();
        lastFailureTime = LocalDateTime.now();
        
        if (state == CircuitBreakerState.CLOSED || state == CircuitBreakerState.HALF_OPEN) {
            if (failureCount.get() >= FAILURE_THRESHOLD) {
                trip();
                logger.warn("熔断器开启，失败次数: {}", failureCount.get());
            }
        }
    }
    
    /**
     * 获取服务健康状态
     */
    public ServiceHealthStatus getHealthStatus() {
        ServiceHealthStatus status = new ServiceHealthStatus();
        status.setState(state);
        status.setFailureCount(failureCount.get());
        status.setSuccessCount(successCount.get());
        status.setLastFailureTime(lastFailureTime);
        status.setLastHealthCheckTime(lastHealthCheckTime);
        status.setAvailable(isServiceAvailable());
        
        return status;
    }
    
    /**
     * 定期健康检查
     */
    @Scheduled(fixedRate = 30000) // 每30秒检查一次
    public void performHealthCheck() {
        lastHealthCheckTime = LocalDateTime.now();
        
        try {
            boolean isHealthy = qiniuAIService.validateConnection();
            
            if (isHealthy) {
                recordSuccess();
                logger.debug("AI服务健康检查通过");
            } else {
                recordFailure();
                logger.warn("AI服务健康检查失败");
            }
            
        } catch (Exception e) {
            recordFailure();
            logger.error("AI服务健康检查异常", e);
        }
    }
    
    /**
     * 手动重置熔断器
     */
    public void manualReset() {
        reset();
        logger.info("手动重置熔断器");
    }
    
    /**
     * 获取失败率
     */
    public double getFailureRate() {
        int total = failureCount.get() + successCount.get();
        if (total == 0) {
            return 0.0;
        }
        return (double) failureCount.get() / total;
    }
    
    /**
     * 重置熔断器到关闭状态
     */
    private void reset() {
        state = CircuitBreakerState.CLOSED;
        failureCount.set(0);
        successCount.set(0);
        lastFailureTime = null;
    }
    
    /**
     * 触发熔断器到开启状态
     */
    private void trip() {
        state = CircuitBreakerState.OPEN;
        successCount.set(0);
    }
    
    /**
     * 检查是否应该尝试重置
     */
    private boolean shouldAttemptReset() {
        return lastFailureTime != null && 
               LocalDateTime.now().isAfter(lastFailureTime.plusNanos(TIMEOUT_DURATION_MS * 1_000_000));
    }
    
    /**
     * 服务健康状态
     */
    public static class ServiceHealthStatus {
        private CircuitBreakerState state;
        private int failureCount;
        private int successCount;
        private LocalDateTime lastFailureTime;
        private LocalDateTime lastHealthCheckTime;
        private boolean available;
        
        // Getters and Setters
        public CircuitBreakerState getState() { return state; }
        public void setState(CircuitBreakerState state) { this.state = state; }
        
        public int getFailureCount() { return failureCount; }
        public void setFailureCount(int failureCount) { this.failureCount = failureCount; }
        
        public int getSuccessCount() { return successCount; }
        public void setSuccessCount(int successCount) { this.successCount = successCount; }
        
        public LocalDateTime getLastFailureTime() { return lastFailureTime; }
        public void setLastFailureTime(LocalDateTime lastFailureTime) { this.lastFailureTime = lastFailureTime; }
        
        public LocalDateTime getLastHealthCheckTime() { return lastHealthCheckTime; }
        public void setLastHealthCheckTime(LocalDateTime lastHealthCheckTime) { this.lastHealthCheckTime = lastHealthCheckTime; }
        
        public boolean isAvailable() { return available; }
        public void setAvailable(boolean available) { this.available = available; }
    }
}
