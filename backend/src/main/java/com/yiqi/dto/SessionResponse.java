package com.yiqi.dto;

import com.yiqi.enums.PhaseType;
import com.yiqi.enums.SessionStatus;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 头脑风暴会话响应DTO
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public class SessionResponse {

    /**
     * 会话ID
     */
    private Long id;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 会话标题
     */
    private String title;

    /**
     * 会话描述
     */
    private String description;

    /**
     * 头脑风暴主题
     */
    private String topic;

    /**
     * 会话状态
     */
    private SessionStatus status;

    /**
     * 当前阶段
     */
    private PhaseType currentPhase;

    /**
     * 参与的代理列表
     */
    private List<SessionAgentInfo> agents;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;

    // 默认构造函数
    public SessionResponse() {}

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

    public List<SessionAgentInfo> getAgents() {
        return agents;
    }

    public void setAgents(List<SessionAgentInfo> agents) {
        this.agents = agents;
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
     * 会话代理信息内部类
     */
    public static class SessionAgentInfo {
        private Long agentId;
        private String agentName;
        private String roleType;
        private String status;
        private LocalDateTime joinedAt;

        // 默认构造函数
        public SessionAgentInfo() {}

        // 构造函数
        public SessionAgentInfo(Long agentId, String agentName, String roleType, String status, LocalDateTime joinedAt) {
            this.agentId = agentId;
            this.agentName = agentName;
            this.roleType = roleType;
            this.status = status;
            this.joinedAt = joinedAt;
        }

        // Getter和Setter方法
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

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public LocalDateTime getJoinedAt() {
            return joinedAt;
        }

        public void setJoinedAt(LocalDateTime joinedAt) {
            this.joinedAt = joinedAt;
        }
    }

    @Override
    public String toString() {
        return "SessionResponse{" +
                "id=" + id +
                ", userId=" + userId +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", topic='" + topic + '\'' +
                ", status=" + status +
                ", currentPhase=" + currentPhase +
                ", agents=" + agents +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}