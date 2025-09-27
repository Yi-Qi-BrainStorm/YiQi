package com.yiqi.entity;

import com.baomidou.mybatisplus.annotation.*;

import java.time.LocalDateTime;

/**
 * 代理响应实体类
 * 存储AI代理在各个阶段的思考和响应内容
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@TableName("agent_responses")
public class AgentResponse {

    /**
     * 响应ID - 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 阶段ID - 外键关联phases表
     */
    @TableField("phase_id")
    private Long phaseId;

    /**
     * 代理ID - 外键关联agents表
     */
    @TableField("agent_id")
    private Long agentId;

    /**
     * 响应内容
     */
    @TableField("content")
    private String content;

    /**
     * 响应状态（SUCCESS, FAILED, TIMEOUT等）
     */
    @TableField("status")
    private String status;

    /**
     * 错误信息（如果响应失败）
     */
    @TableField("error_message")
    private String errorMessage;

    /**
     * 响应时间（毫秒）
     */
    @TableField("response_time_ms")
    private Long responseTimeMs;

    /**
     * 创建时间
     */
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // 响应状态常量
    public static final String STATUS_SUCCESS = "SUCCESS";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_TIMEOUT = "TIMEOUT";
    public static final String STATUS_PROCESSING = "PROCESSING";

    // 默认构造函数
    public AgentResponse() {
        this.status = STATUS_PROCESSING;
    }

    // 构造函数
    public AgentResponse(Long phaseId, Long agentId) {
        this();
        this.phaseId = phaseId;
        this.agentId = agentId;
    }

    // 构造函数（包含内容）
    public AgentResponse(Long phaseId, Long agentId, String content) {
        this(phaseId, agentId);
        this.content = content;
        this.status = STATUS_SUCCESS;
    }

    // Getter和Setter方法
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPhaseId() {
        return phaseId;
    }

    public void setPhaseId(Long phaseId) {
        this.phaseId = phaseId;
    }

    public Long getAgentId() {
        return agentId;
    }

    public void setAgentId(Long agentId) {
        this.agentId = agentId;
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

    public Long getResponseTimeMs() {
        return responseTimeMs;
    }

    public void setResponseTimeMs(Long responseTimeMs) {
        this.responseTimeMs = responseTimeMs;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // 业务方法

    /**
     * 检查响应是否成功
     * 
     * @return true如果响应成功
     */
    public boolean isSuccess() {
        return STATUS_SUCCESS.equals(status);
    }

    /**
     * 检查响应是否失败
     * 
     * @return true如果响应失败
     */
    public boolean isFailed() {
        return STATUS_FAILED.equals(status);
    }

    /**
     * 检查响应是否超时
     * 
     * @return true如果响应超时
     */
    public boolean isTimeout() {
        return STATUS_TIMEOUT.equals(status);
    }

    /**
     * 检查响应是否正在处理
     * 
     * @return true如果正在处理
     */
    public boolean isProcessing() {
        return STATUS_PROCESSING.equals(status);
    }

    /**
     * 标记响应成功
     * 
     * @param content 响应内容
     * @param responseTimeMs 响应时间
     */
    public void markSuccess(String content, Long responseTimeMs) {
        this.content = content;
        this.status = STATUS_SUCCESS;
        this.responseTimeMs = responseTimeMs;
        this.errorMessage = null;
    }

    /**
     * 标记响应失败
     * 
     * @param errorMessage 错误信息
     * @param responseTimeMs 响应时间
     */
    public void markFailed(String errorMessage, Long responseTimeMs) {
        this.status = STATUS_FAILED;
        this.errorMessage = errorMessage;
        this.responseTimeMs = responseTimeMs;
    }

    /**
     * 标记响应超时
     * 
     * @param responseTimeMs 响应时间
     */
    public void markTimeout(Long responseTimeMs) {
        this.status = STATUS_TIMEOUT;
        this.errorMessage = "响应超时";
        this.responseTimeMs = responseTimeMs;
    }

    /**
     * 检查响应内容是否为空
     * 
     * @return true如果内容为空
     */
    public boolean hasContent() {
        return content != null && !content.trim().isEmpty();
    }

    /**
     * 获取响应内容长度
     * 
     * @return 内容长度，如果内容为空则返回0
     */
    public int getContentLength() {
        return content != null ? content.length() : 0;
    }

    @Override
    public String toString() {
        return "AgentResponse{" +
                "id=" + id +
                ", phaseId=" + phaseId +
                ", agentId=" + agentId +
                ", content='" + (content != null ? content.substring(0, Math.min(content.length(), 100)) + "..." : null) + '\'' +
                ", status='" + status + '\'' +
                ", errorMessage='" + errorMessage + '\'' +
                ", responseTimeMs=" + responseTimeMs +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}