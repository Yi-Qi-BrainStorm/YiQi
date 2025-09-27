package com.yiqi.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * AI代理版本实体类
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@TableName("agent_versions")
@Schema(description = "AI代理版本实体")
public class AgentVersion {

    @TableId(type = IdType.AUTO)
    @Schema(description = "版本记录ID")
    private Long id;

    @Schema(description = "代理ID", required = true)
    private Long agentId;

    @Schema(description = "版本号", required = true)
    private Integer versionNumber;

    @Schema(description = "代理名称", required = true)
    private String name;

    @Schema(description = "角色类型", required = true)
    private String roleType;

    @Schema(description = "系统提示词", required = true)
    private String systemPrompt;

    @Schema(description = "AI模型", required = true)
    private String aiModel;

    @Schema(description = "代理状态")
    private String status;

    @TableField(fill = FieldFill.INSERT)
    @Schema(description = "创建时间")
    private LocalDateTime createdAt;

    public AgentVersion() {}

    public AgentVersion(Long agentId, Integer versionNumber, String name, String roleType, 
                       String systemPrompt, String aiModel, String status) {
        this.agentId = agentId;
        this.versionNumber = versionNumber;
        this.name = name;
        this.roleType = roleType;
        this.systemPrompt = systemPrompt;
        this.aiModel = aiModel;
        this.status = status;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAgentId() {
        return agentId;
    }

    public void setAgentId(Long agentId) {
        this.agentId = agentId;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
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

    public String getSystemPrompt() {
        return systemPrompt;
    }

    public void setSystemPrompt(String systemPrompt) {
        this.systemPrompt = systemPrompt;
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

    @Override
    public String toString() {
        return "AgentVersion{" +
                "id=" + id +
                ", agentId=" + agentId +
                ", versionNumber=" + versionNumber +
                ", name='" + name + '\'' +
                ", roleType='" + roleType + '\'' +
                ", aiModel='" + aiModel + '\'' +
                ", status='" + status + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}