package com.yiqi.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.yiqi.enums.AgentStatus;

import java.time.LocalDateTime;

/**
 * 会话代理关联实体类
 * 表示哪些AI代理参与了特定的头脑风暴会话
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@TableName("session_agents")
public class SessionAgent {

    /**
     * 关联ID - 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 会话ID - 外键关联brainstorm_sessions表
     */
    @TableField("session_id")
    private Long sessionId;

    /**
     * 代理ID - 外键关联agents表
     */
    @TableField("agent_id")
    private Long agentId;

    /**
     * 代理在此会话中的状态
     */
    @TableField("status")
    private AgentStatus status;

    /**
     * 加入会话时间
     */
    @TableField(value = "joined_at", fill = FieldFill.INSERT)
    private LocalDateTime joinedAt;

    /**
     * 最后活跃时间
     */
    @TableField(value = "last_active_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime lastActiveAt;

    // 默认构造函数
    public SessionAgent() {
        this.status = AgentStatus.ACTIVE;
    }

    // 构造函数
    public SessionAgent(Long sessionId, Long agentId) {
        this();
        this.sessionId = sessionId;
        this.agentId = agentId;
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

    public Long getAgentId() {
        return agentId;
    }

    public void setAgentId(Long agentId) {
        this.agentId = agentId;
    }

    public AgentStatus getStatus() {
        return status;
    }

    public void setStatus(AgentStatus status) {
        this.status = status;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }

    public LocalDateTime getLastActiveAt() {
        return lastActiveAt;
    }

    public void setLastActiveAt(LocalDateTime lastActiveAt) {
        this.lastActiveAt = lastActiveAt;
    }

    // 业务方法

    /**
     * 检查代理是否为活跃状态
     * 
     * @return true如果是活跃状态
     */
    public boolean isActive() {
        return status != null && status.isActive();
    }

    /**
     * 激活代理
     */
    public void activate() {
        this.status = AgentStatus.ACTIVE;
        this.lastActiveAt = LocalDateTime.now();
    }

    /**
     * 停用代理
     */
    public void deactivate() {
        this.status = AgentStatus.INACTIVE;
    }

    /**
     * 移除代理（软删除）
     */
    public void remove() {
        this.status = AgentStatus.DELETED;
    }

    /**
     * 更新最后活跃时间
     */
    public void updateLastActiveTime() {
        this.lastActiveAt = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "SessionAgent{" +
                "id=" + id +
                ", sessionId=" + sessionId +
                ", agentId=" + agentId +
                ", status=" + status +
                ", joinedAt=" + joinedAt +
                ", lastActiveAt=" + lastActiveAt +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        SessionAgent that = (SessionAgent) o;

        if (sessionId != null ? !sessionId.equals(that.sessionId) : that.sessionId != null) return false;
        return agentId != null ? agentId.equals(that.agentId) : that.agentId == null;
    }

    @Override
    public int hashCode() {
        int result = sessionId != null ? sessionId.hashCode() : 0;
        result = 31 * result + (agentId != null ? agentId.hashCode() : 0);
        return result;
    }
}