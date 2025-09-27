package com.yiqi.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * 异步任务配置类
 * 配置用于AI推理的线程池
 */
@Configuration
@EnableAsync
@ConfigurationProperties(prefix = "yiqi.thread-pool")
public class AsyncConfig {
    
    private int coreSize = 10;
    private int maxSize = 50;
    private int queueCapacity = 100;
    private int keepAliveSeconds = 60;
    private String threadNamePrefix = "yiqi-async-";

    /**
     * AI推理专用线程池
     */
    @Bean("aiInferenceExecutor")
    public Executor aiInferenceExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // 核心线程数
        executor.setCorePoolSize(coreSize);
        
        // 最大线程数
        executor.setMaxPoolSize(maxSize);
        
        // 队列容量
        executor.setQueueCapacity(queueCapacity);
        
        // 线程空闲时间
        executor.setKeepAliveSeconds(keepAliveSeconds);
        
        // 线程名前缀
        executor.setThreadNamePrefix(threadNamePrefix);
        
        // 拒绝策略：调用者运行
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        
        // 等待任务完成后关闭
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        
        executor.initialize();
        return executor;
    }

    // Getters and Setters
    public int getCoreSize() {
        return coreSize;
    }

    public void setCoreSize(int coreSize) {
        this.coreSize = coreSize;
    }

    public int getMaxSize() {
        return maxSize;
    }

    public void setMaxSize(int maxSize) {
        this.maxSize = maxSize;
    }

    public int getQueueCapacity() {
        return queueCapacity;
    }

    public void setQueueCapacity(int queueCapacity) {
        this.queueCapacity = queueCapacity;
    }

    public int getKeepAliveSeconds() {
        return keepAliveSeconds;
    }

    public void setKeepAliveSeconds(int keepAliveSeconds) {
        this.keepAliveSeconds = keepAliveSeconds;
    }

    public String getThreadNamePrefix() {
        return threadNamePrefix;
    }

    public void setThreadNamePrefix(String threadNamePrefix) {
        this.threadNamePrefix = threadNamePrefix;
    }
}