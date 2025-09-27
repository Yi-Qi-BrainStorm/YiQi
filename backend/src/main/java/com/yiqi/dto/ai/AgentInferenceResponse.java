package com.yiqi.dto.ai;

import java.time.LocalDateTime;

/**
 * 代理推理响应DTO
 * 包含单个代理推理的结果信息
 */
public class AgentInferenceResponse {
    
    private Long agentId;
    private String agentName;
    private String roleType;
    private String content;
    private String status;
    private String errorMessage;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long processingTimeMs;

    public AgentInferenceResponse() {}

    public AgentInferenceResponse(Long agentId, String agentName, String roleType) {
        this.agentId = agentId;
        this.agentName = agentName;
        this.roleType = roleType;
        this.startTime = LocalDateTime.now();
        this.status = "PROCESSING";
    }

    /**
     * 标记为成功
     */
    public void markSuccess(String content) {
        this.content = content;
        this.status = "SUCCESS";
        this.endTime = LocalDateTime.now();
        this.processingTimeMs = calculateProcessingTime();
    }

    /**
     * 标记为失败
     */
    public void markFailure(String errorMessage) {
        this.status = "FAILED";
        this.errorMessage = errorMessage;
        this.endTime = LocalDateTime.now();
        this.processingTimeMs = calculateProcessingTime();
    }

    /**
     * 标记为超时
     */
    public void markTimeout() {
        this.status = "TIMEOUT";
        this.errorMessage = "推理请求超时";
        this.endTime = LocalDateTime.now();
        this.processingTimeMs = calculateProcessingTime();
    }

    /**
     * 计算处理时长
     */
    private Long calculateProcessingTime() {
        if (startTime != null && endTime != null) {
            return java.time.Duration.between(startTime, endTime).toMillis();
        }
        return null;
    }

    /**
     * 检查是否成功
     */
    public boolean isSuccess() {
        return "SUCCESS".equals(status);
    }

    /**
     * 检查是否失败
     */
    public boolean isFailed() {
        return "FAILED".equals(status) || "TIMEOUT".equals(status);
    }

    // Getters and Setters
    public Long getAgentId() {
        return agentId;
    }

    public void setAgentId(Long agentId) {
        this.agentId = agentId;
    }

    public String getAgentName() {
        return agentName;
    }

    public void setAgentName(String agentName) {
        this.agentName = agentName;
    }

    public String getRoleType() {
        return roleType;
    }

    public void setRoleType(String roleType) {
        this.roleType = roleType;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public Long getProcessingTimeMs() {
        return processingTimeMs;
    }

    public void setProcessingTimeMs(Long processingTimeMs) {
        this.processingTimeMs = processingTimeMs;
    }
}