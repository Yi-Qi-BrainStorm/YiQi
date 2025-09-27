package com.yiqi.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * AI消息DTO类
 * 用于构建发送给AI服务的消息
 */
public class AIMessage {
    
    @JsonProperty("role")
    private String role;
    
    @JsonProperty("content")
    private String content;

    public AIMessage() {}

    public AIMessage(String role, String content) {
        this.role = role;
        this.content = content;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    /**
     * 创建系统消息
     */
    public static AIMessage system(String content) {
        return new AIMessage("system", content);
    }

    /**
     * 创建用户消息
     */
    public static AIMessage user(String content) {
        return new AIMessage("user", content);
    }

    /**
     * 创建助手消息
     */
    public static AIMessage assistant(String content) {
        return new AIMessage("assistant", content);
    }
}