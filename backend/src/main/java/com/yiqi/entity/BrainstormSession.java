package com.yiqi.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.yiqi.enums.PhaseType;
import com.yiqi.enums.SessionStatus;

import java.time.LocalDateTime;

/**
 * 头脑风暴会话实体类
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@TableName("brainstorm_sessions")
public class BrainstormSession {

    /**
     * 会话ID - 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 用户ID - 外键关联users表
     */
    @TableField("user_id")
    private Long userId;

    /**
     * 会话标题
     */
    @TableField("title")
    private String title;

    /**
     * 会话描述
     */
    @TableField("description")
    private String description;

    /**
     * 头脑风暴主题
     */
    @TableField("topic")
    private String topic;

    /**
     * 会话状态
     */
    @TableField("status")
    private SessionStatus status;

    /**
     * 当前阶段
     */
    @TableField("current_phase")
    private PhaseType currentPhase;

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
    public BrainstormSession() {
        this.status = SessionStatus.CREATED;
        this.currentPhase = PhaseType.IDEA_GENERATION;
    }

    // 构造函数
    public BrainstormSession(Long userId, String title, String description) {
        this();
        this.userId = userId;
        this.title = title;
        this.description = description;
    }

    // Getter和Setter方法
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public void setStatus(SessionStatus status) {
        this.status = status;
    }

    public PhaseType getCurrentPhase() {
        return currentPhase;
    }

    public void setCurrentPhase(PhaseType currentPhase) {
        this.currentPhase = currentPhase;
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
     * 检查会话是否可以启动
     * 
     * @return true如果可以启动
     */
    public boolean canStart() {
        return status != null && status.canStart();
    }

    /**
     * 检查会话是否可以暂停
     * 
     * @return true如果可以暂停
     */
    public boolean canPause() {
        return status != null && status.canPause();
    }

    /**
     * 检查会话是否为活跃状态
     * 
     * @return true如果是活跃状态
     */
    public boolean isActive() {
        return status != null && status.isActive();
    }

    /**
     * 检查会话是否已完成
     * 
     * @return true如果已完成
     */
    public boolean isCompleted() {
        return status == SessionStatus.COMPLETED;
    }

    /**
     * 启动会话
     */
    public void start() {
        if (!canStart()) {
            throw new IllegalStateException("会话当前状态不允许启动: " + status);
        }
        this.status = SessionStatus.IN_PROGRESS;
    }

    /**
     * 暂停会话
     */
    public void pause() {
        if (!canPause()) {
            throw new IllegalStateException("会话当前状态不允许暂停: " + status);
        }
        this.status = SessionStatus.PAUSED;
    }

    /**
     * 完成会话
     */
    public void complete() {
        this.status = SessionStatus.COMPLETED;
    }

    /**
     * 取消会话
     */
    public void cancel() {
        this.status = SessionStatus.CANCELLED;
    }

    /**
     * 进入下一阶段
     * 
     * @return true如果成功进入下一阶段，false如果已是最后阶段
     */
    public boolean moveToNextPhase() {
        if (currentPhase == null) {
            currentPhase = PhaseType.IDEA_GENERATION;
            return true;
        }
        
        PhaseType nextPhase = currentPhase.getNext();
        if (nextPhase != null) {
            currentPhase = nextPhase;
            return true;
        }
        
        return false; // 已是最后阶段
    }

    /**
     * 检查是否为最后阶段
     * 
     * @return true如果是最后阶段
     */
    public boolean isLastPhase() {
        return currentPhase != null && currentPhase.isLast();
    }

    @Override
    public String toString() {
        return "BrainstormSession{" +
                "id=" + id +
                ", userId=" + userId +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", topic='" + topic + '\'' +
                ", status=" + status +
                ", currentPhase=" + currentPhase +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}