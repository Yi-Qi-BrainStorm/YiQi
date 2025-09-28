package com.yiqi.config;

import java.util.concurrent.Executor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.RestTemplate;

/**
 * 报告生成相关配置
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Configuration
@EnableAsync
public class ReportConfig {

    /**
     * RestTemplate Bean配置
     * 用于调用外部API（七牛云、阿里云）
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    /**
     * 异步任务执行器配置
     * 用于异步生成报告
     */
    @Bean(name = "reportTaskExecutor")
    public Executor reportTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("Report-");
        executor.initialize();
        return executor;
    }
}
