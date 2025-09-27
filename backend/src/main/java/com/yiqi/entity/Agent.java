package com.yiqi.entity;

import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * AI代理实体类
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@TableName("agents")
@Schema(description = "AI代理实体")
public class Agent {

    @TableId(type = IdType.AUTO)
    @Schema(description = "代理ID")
    private Long id;

    @Schema(description = "用户ID", required = true)
    private Long userId;

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

    @TableField(fill = FieldFill.INSERT_UPDATE)
    @Schema(description = "更新时间")
    private LocalDateTime updatedAt;

    public Agent() {
        this.status = "ACTIVE";
    }

    public Agent(Long userId, String name, String roleType, String systemPrompt, String aiModel) {
        this();
        this.userId = userId;
        this.name = name;
        this.roleType = roleType;
        this.systemPrompt = systemPrompt;
        this.aiModel = aiModel;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    /**
     * 检查代理是否处于活跃状态
     */
    public boolean isActive() {
        return "ACTIVE".equals(this.status);
    }

    /**
     * 激活代理
     */
    public void activate() {
        this.status = "ACTIVE";
    }

    /**
     * 停用代理
     */
    public void deactivate() {
        this.status = "INACTIVE";
    }

    /**
     * 标记代理为已删除
     */
    public void markAsDeleted() {
        this.status = "DELETED";
    }

    @Override
    public String toString() {
        return "Agent{" +
                "id=" + id +
                ", userId=" + userId +
                ", name='" + name + '\'' +
                ", roleType='" + roleType + '\'' +
                ", aiModel='" + aiModel + '\'' +
                ", status='" + status + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}