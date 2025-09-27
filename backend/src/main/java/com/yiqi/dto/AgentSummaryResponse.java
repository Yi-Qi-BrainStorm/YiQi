package com.yiqi.dto;

import com.yiqi.entity.Agent;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * AI代理摘要响应DTO（用于列表显示）
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Schema(description = "AI代理摘要响应")
public class AgentSummaryResponse {

    @Schema(description = "代理ID", example = "1")
    private Long id;

    @Schema(description = "代理名称", example = "产品设计师")
    private String name;

    @Schema(description = "角色类型", example = "DESIGNER")
    private String roleType;

    @Schema(description = "AI模型", example = "qwen-plus")
    private String aiModel;

    @Schema(description = "代理状态", example = "ACTIVE")
    private String status;

    @Schema(description = "创建时间", example = "2024-01-15T10:30:00")
    private LocalDateTime createdAt;

    @Schema(description = "更新时间", example = "2024-01-15T10:30:00")
    private LocalDateTime updatedAt;

    public AgentSummaryResponse() {}

    public AgentSummaryResponse(Agent agent) {
        this.id = agent.getId();
        this.name = agent.getName();
        this.roleType = agent.getRoleType();
        this.aiModel = agent.getAiModel();
        this.status = agent.getStatus();
        this.createdAt = agent.getCreatedAt();
        this.updatedAt = agent.getUpdatedAt();
    }

    /**
     * 从Agent实体创建摘要响应DTO
     * 
     * @param agent Agent实体
     * @return AgentSummaryResponse
     */
    public static AgentSummaryResponse fromEntity(Agent agent) {
        return new AgentSummaryResponse(agent);
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRoleType() {
        return roleType;
    }

    public void setRoleType(String roleType) {
        this.roleType = roleType;
    }

    public String getAiModel() {
        return aiModel;
    }

    public void setAiModel(String aiModel) {
        this.aiModel = aiModel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    @Override
    public String toString() {
        return "AgentSummaryResponse{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", roleType='" + roleType + '\'' +
                ", aiModel='" + aiModel + '\'' +
                ", status='" + status + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}