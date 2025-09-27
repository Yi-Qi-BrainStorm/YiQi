package com.yiqi.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.yiqi.enums.PhaseStatus;
import com.yiqi.enums.PhaseType;

import java.time.LocalDateTime;

/**
 * 头脑风暴阶段实体类
 * 表示头脑风暴会话中的各个阶段（创意生成、技术可行性分析、缺点讨论）
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@TableName("phases")
public class Phase {

    /**
     * 阶段ID - 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 会话ID - 外键关联brainstorm_sessions表
     */
    @TableField("session_id")
    private Long sessionId;

    /**
     * 阶段类型
     */
    @TableField("phase_type")
    private PhaseType phaseType;

    /**
     * 阶段状态
     */
    @TableField("status")
    private PhaseStatus status;

    /**
     * 阶段总结内容
     */
    @TableField("summary")
    private String summary;

    /**
     * 阶段开始时间
     */
    @TableField("started_at")
    private LocalDateTime startedAt;

    /**
     * 阶段完成时间
     */
    @TableField("completed_at")
    private LocalDateTime completedAt;

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

    // 默认构造函数
    public Phase() {
        this.status = PhaseStatus.NOT_STARTED;
    }

    // 构造函数
    public Phase(Long sessionId, PhaseType phaseType) {
        this();
        this.sessionId = sessionId;
        this.phaseType = phaseType;
    }

    // Getter和Setter方法
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public PhaseType getPhaseType() {
        return phaseType;
    }

    public void setPhaseType(PhaseType phaseType) {
        this.phaseType = phaseType;
    }

    public PhaseStatus getStatus() {
        return status;
    }

    public void setStatus(PhaseStatus status) {
        this.status = status;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
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
     * 检查阶段是否可以开始
     * 
     * @return true如果可以开始
     */
    public boolean canStart() {
        return status != null && status.canStart();
    }

    /**
     * 检查阶段是否可以提交审核
     * 
     * @return true如果可以提交审核
     */
    public boolean canSubmitForApproval() {
        return status != null && status.canSubmitForApproval();
    }

    /**
     * 检查阶段是否可以审核
     * 
     * @return true如果可以审核
     */
    public boolean canReview() {
        return status != null && status.canReview();
    }

    /**
     * 检查阶段是否正在进行
     * 
     * @return true如果正在进行
     */
    public boolean isInProgress() {
        return status != null && status.isInProgress();
    }

    /**
     * 检查阶段是否已完成
     * 
     * @return true如果已完成
     */
    public boolean isCompleted() {
        return status == PhaseStatus.COMPLETED;
    }

    /**
     * 检查阶段是否需要用户操作
     * 
     * @return true如果需要用户操作
     */
    public boolean requiresUserAction() {
        return status != null && status.requiresUserAction();
    }

    /**
     * 开始阶段
     */
    public void start() {
        if (!canStart()) {
            throw new IllegalStateException("阶段当前状态不允许开始: " + status);
        }
        this.status = PhaseStatus.IN_PROGRESS;
        this.startedAt = LocalDateTime.now();
    }

    /**
     * 提交阶段审核
     * 
     * @param summary 阶段总结
     */
    public void submitForApproval(String summary) {
        if (!canSubmitForApproval()) {
            throw new IllegalStateException("阶段当前状态不允许提交审核: " + status);
        }
        this.status = PhaseStatus.WAITING_APPROVAL;
        this.summary = summary;
        this.completedAt = LocalDateTime.now();
    }

    /**
     * 审核通过
     */
    public void approve() {
        if (!canReview()) {
            throw new IllegalStateException("阶段当前状态不允许审核: " + status);
        }
        this.status = PhaseStatus.APPROVED;
    }

    /**
     * 审核拒绝
     */
    public void reject() {
        if (!canReview()) {
            throw new IllegalStateException("阶段当前状态不允许审核: " + status);
        }
        this.status = PhaseStatus.REJECTED;
        this.completedAt = null; // 重置完成时间
    }

    /**
     * 完成阶段
     */
    public void complete() {
        this.status = PhaseStatus.COMPLETED;
        if (this.completedAt == null) {
            this.completedAt = LocalDateTime.now();
        }
    }

    /**
     * 重置阶段状态（用于重新执行）
     */
    public void reset() {
        this.status = PhaseStatus.NOT_STARTED;
        this.summary = null;
        this.startedAt = null;
        this.completedAt = null;
    }

    /**
     * 计算阶段持续时间（分钟）
     * 
     * @return 持续时间，如果未开始或未完成则返回null
     */
    public Long getDurationInMinutes() {
        if (startedAt == null || completedAt == null) {
            return null;
        }
        return java.time.Duration.between(startedAt, completedAt).toMinutes();
    }

    @Override
    public String toString() {
        return "Phase{" +
                "id=" + id +
                ", sessionId=" + sessionId +
                ", phaseType=" + phaseType +
                ", status=" + status +
                ", summary='" + summary + '\'' +
                ", startedAt=" + startedAt +
                ", completedAt=" + completedAt +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}