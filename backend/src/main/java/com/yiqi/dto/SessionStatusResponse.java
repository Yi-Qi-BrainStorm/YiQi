package com.yiqi.dto;

import com.yiqi.enums.PhaseStatus;
import com.yiqi.enums.PhaseType;
import com.yiqi.enums.SessionStatus;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 会话状态响应DTO
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public class SessionStatusResponse {

    /**
     * 会话ID
     */
    private Long sessionId;

    /**
     * 会话状态
     */
    private SessionStatus sessionStatus;

    /**
     * 当前阶段
     */
    private PhaseType currentPhase;

    /**
     * 阶段详情列表
     */
    private List<PhaseInfo> phases;

    /**
     * 参与代理数量
     */
    private Integer agentCount;

    /**
     * 活跃代理数量
     */
    private Integer activeAgentCount;

    /**
     * 会话进度百分比（0-100）
     */
    private Integer progressPercentage;

    /**
     * 最后更新时间
     */
    private LocalDateTime lastUpdated;

    // 默认构造函数
    public SessionStatusResponse() {}

    // Getter和Setter方法
    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public SessionStatus getSessionStatus() {
        return sessionStatus;
    }

    public void setSessionStatus(SessionStatus sessionStatus) {
        this.sessionStatus = sessionStatus;
    }

    public PhaseType getCurrentPhase() {
        return currentPhase;
    }

    public void setCurrentPhase(PhaseType currentPhase) {
        this.currentPhase = currentPhase;
    }

    public List<PhaseInfo> getPhases() {
        return phases;
    }

    public void setPhases(List<PhaseInfo> phases) {
        this.phases = phases;
    }

    public Integer getAgentCount() {
        return agentCount;
    }

    public void setAgentCount(Integer agentCount) {
        this.agentCount = agentCount;
    }

    public Integer getActiveAgentCount() {
        return activeAgentCount;
    }

    public void setActiveAgentCount(Integer activeAgentCount) {
        this.activeAgentCount = activeAgentCount;
    }

    public Integer getProgressPercentage() {
        return progressPercentage;
    }

    public void setProgressPercentage(Integer progressPercentage) {
        this.progressPercentage = progressPercentage;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    /**
     * 阶段信息内部类
     */
    public static class PhaseInfo {
        private PhaseType phaseType;
        private PhaseStatus status;
        private String summary;
        private LocalDateTime startedAt;
        private LocalDateTime completedAt;
        private Integer responseCount;
        private Integer successfulResponseCount;

        // 默认构造函数
        public PhaseInfo() {}

        // 构造函数
        public PhaseInfo(PhaseType phaseType, PhaseStatus status) {
            this.phaseType = phaseType;
            this.status = status;
        }

        // Getter和Setter方法
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

        public Integer getResponseCount() {
            return responseCount;
        }

        public void setResponseCount(Integer responseCount) {
            this.responseCount = responseCount;
        }

        public Integer getSuccessfulResponseCount() {
            return successfulResponseCount;
        }

        public void setSuccessfulResponseCount(Integer successfulResponseCount) {
            this.successfulResponseCount = successfulResponseCount;
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

        /**
         * 检查阶段是否需要用户操作
         * 
         * @return true如果需要用户操作
         */
        public boolean requiresUserAction() {
            return status == PhaseStatus.WAITING_APPROVAL;
        }
    }

    /**
     * 检查会话是否可以启动
     * 
     * @return true如果可以启动
     */
    public boolean canStart() {
        return sessionStatus != null && sessionStatus.canStart();
    }

    /**
     * 检查会话是否可以暂停
     * 
     * @return true如果可以暂停
     */
    public boolean canPause() {
        return sessionStatus != null && sessionStatus.canPause();
    }

    /**
     * 检查会话是否已完成
     * 
     * @return true如果已完成
     */
    public boolean isCompleted() {
        return sessionStatus == SessionStatus.COMPLETED;
    }

    /**
     * 检查是否有阶段需要用户操作
     * 
     * @return true如果有阶段需要用户操作
     */
    public boolean hasPhaseRequiringUserAction() {
        if (phases == null) {
            return false;
        }
        return phases.stream().anyMatch(PhaseInfo::requiresUserAction);
    }

    @Override
    public String toString() {
        return "SessionStatusResponse{" +
                "sessionId=" + sessionId +
                ", sessionStatus=" + sessionStatus +
                ", currentPhase=" + currentPhase +
                ", phases=" + phases +
                ", agentCount=" + agentCount +
                ", activeAgentCount=" + activeAgentCount +
                ", progressPercentage=" + progressPercentage +
                ", lastUpdated=" + lastUpdated +
                '}';
    }
}