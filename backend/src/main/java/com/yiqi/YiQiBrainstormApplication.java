package com.yiqi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * 意启头脑风暴平台主应用程序
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@SpringBootApplication
@EnableAsync
public class YiQiBrainstormApplication {

    public static void main(String[] args) {
        SpringApplication.run(YiQiBrainstormApplication.class, args);
    }
}
