package com.yiqi.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 启动头脑风暴会话请求DTO
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public class StartSessionRequest {

    /**
     * 头脑风暴主题
     */
    @NotBlank(message = "头脑风暴主题不能为空")
    @Size(max = 500, message = "头脑风暴主题长度不能超过500个字符")
    private String topic;

    // 默认构造函数
    public StartSessionRequest() {}

    // 构造函数
    public StartSessionRequest(String topic) {
        this.topic = topic;
    }

    // Getter和Setter方法
    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    @Override
    public String toString() {
        return "StartSessionRequest{" +
                "topic='" + topic + '\'' +
                '}';
    }
}