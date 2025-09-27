package com.yiqi.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * 七牛云AI推理请求DTO类
 */
public class QiniuAIRequest {
    
    @JsonProperty("model")
    private String model;
    
    @JsonProperty("messages")
    private List<AIMessage> messages;
    
    @JsonProperty("stream")
    private boolean stream = false;
    
    @JsonProperty("temperature")
    private Double temperature;
    
    @JsonProperty("max_tokens")
    private Integer maxTokens;

    public QiniuAIRequest() {}

    public QiniuAIRequest(String model, List<AIMessage> messages) {
        this.model = model;
        this.messages = messages;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public List<AIMessage> getMessages() {
        return messages;
    }

    public void setMessages(List<AIMessage> messages) {
        this.messages = messages;
    }

    public boolean isStream() {
        return stream;
    }

    public void setStream(boolean stream) {
        this.stream = stream;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Integer getMaxTokens() {
        return maxTokens;
    }

    public void setMaxTokens(Integer maxTokens) {
        this.maxTokens = maxTokens;
    }
}