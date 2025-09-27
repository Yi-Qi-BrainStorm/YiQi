package com.yiqi.service;

import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 推理状态服务
 * 用于跟踪和管理AI推理任务的状态信息
 */
@Service
public class InferenceStatusService {
    
    // 会话推理状态缓存
    private final ConcurrentHashMap<String, SessionInferenceStatus> sessionStatusMap = new ConcurrentHashMap<>();
    
    // 系统统计信息
    private final AtomicInteger totalSessions = new AtomicInteger(0);
    private final AtomicInteger completedSessions = new AtomicInteger(0);
    private final AtomicInteger failedSessions = new AtomicInteger(0);
    private final AtomicLong totalProcessingTimeMs = new AtomicLong(0);
    
    /**
     * 获取会话推理状态
     */
    public SessionInferenceStatus getSessionInferenceStatus(String sessionId, String phaseType) {
        String key = sessionId + "_" + phaseType;
        return sessionStatusMap.get(key);
    }

    /**
     * 获取推理状态 (API兼容方法)
     */
    public SessionInferenceStatus getInferenceStatus(String sessionId, String phaseType) {
        return getSessionInferenceStatus(sessionId, phaseType);
    }
    
    /**
     * 更新会话推理状态
     */
    public void updateSessionInferenceStatus(String sessionId, String phaseType, SessionInferenceStatus status) {
        String key = sessionId + "_" + phaseType;
        sessionStatusMap.put(key, status);
        
        // 更新系统统计
        if ("COMPLETED".equals(status.getStatus())) {
            completedSessions.incrementAndGet();
            totalProcessingTimeMs.addAndGet(status.getProcessingTimeMs());
        } else if ("FAILED".equals(status.getStatus())) {
            failedSessions.incrementAndGet();
        }
    }
    
    /**
     * 创建新的推理状态
     */
    public SessionInferenceStatus createInferenceStatus(String sessionId, String phaseType, int totalAgents) {
        SessionInferenceStatus status = new SessionInferenceStatus();
        status.setSessionId(sessionId);
        status.setPhaseType(phaseType);
        status.setStatus("IN_PROGRESS");
        status.setTotalAgents(totalAgents);
        status.setCompletedAgents(0);
        status.setSuccessfulAgents(0);
        status.setFailedAgents(0);
        status.setStartTime(LocalDateTime.now());
        
        updateSessionInferenceStatus(sessionId, phaseType, status);
        totalSessions.incrementAndGet();
        
        return status;
    }

    /**
     * 开始跟踪推理状态 (API兼容方法)
     */
    public void startTracking(String sessionId, String phaseType, int totalAgents) {
        createInferenceStatus(sessionId, phaseType, totalAgents);
    }
    
    /**
     * 更新代理完成状态
     */
    public void updateAgentCompletion(String sessionId, String phaseType, boolean success) {
        SessionInferenceStatus status = getSessionInferenceStatus(sessionId, phaseType);
        if (status != null) {
            status.setCompletedAgents(status.getCompletedAgents() + 1);
            if (success) {
                status.setSuccessfulAgents(status.getSuccessfulAgents() + 1);
            } else {
                status.setFailedAgents(status.getFailedAgents() + 1);
            }
            
            // 计算成功率
            status.setSuccessRate((double) status.getSuccessfulAgents() / status.getTotalAgents());
            
            // 检查是否全部完成
            if (status.getCompletedAgents() >= status.getTotalAgents()) {
                status.setStatus("COMPLETED");
                status.setEndTime(LocalDateTime.now());
                
                // 计算处理时间
                if (status.getStartTime() != null && status.getEndTime() != null) {
                    long processingTime = java.time.Duration.between(status.getStartTime(), status.getEndTime()).toMillis();
                    status.setProcessingTimeMs(processingTime);
                }
            }
            
            updateSessionInferenceStatus(sessionId, phaseType, status);
        }
    }

    /**
     * 更新推理进度 (API兼容方法)
     */
    public void updateProgress(String sessionId, String phaseType, com.yiqi.dto.ai.ParallelInferenceResult result) {
        if (result.getAgentResponses() != null) {
            for (com.yiqi.dto.ai.AgentInferenceResponse response : result.getAgentResponses()) {
                // 更新每个代理的完成状态
                updateAgentCompletion(sessionId, phaseType, response.isSuccess());
            }
        }
    }
    
    /**
     * 标记推理失败
     */
    public void markInferenceFailed(String sessionId, String phaseType, String errorMessage) {
        SessionInferenceStatus status = getSessionInferenceStatus(sessionId, phaseType);
        if (status != null) {
            status.setStatus("FAILED");
            status.setErrorMessage(errorMessage);
            status.setEndTime(LocalDateTime.now());
            updateSessionInferenceStatus(sessionId, phaseType, status);
        }
    }
    
    /**
     * 获取系统统计信息
     */
    public InferenceStatistics getSystemStatistics() {
        InferenceStatistics stats = new InferenceStatistics();
        stats.setTotalSessions(totalSessions.get());
        stats.setCompletedSessions(completedSessions.get());
        stats.setFailedSessions(failedSessions.get());
        
        // 计算平均处理时间
        int completed = completedSessions.get();
        if (completed > 0) {
            stats.setAverageProcessingTimeMs(totalProcessingTimeMs.get() / completed);
        } else {
            stats.setAverageProcessingTimeMs(0);
        }
        
        return stats;
    }
    
    /**
     * 清理过期的状态记录
     */
    public void cleanupExpiredStatuses() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24); // 保留24小时内的记录
        
        sessionStatusMap.entrySet().removeIf(entry -> {
            SessionInferenceStatus status = entry.getValue();
            return status.getEndTime() != null && status.getEndTime().isBefore(cutoff);
        });
    }
    
    /**
     * 会话推理状态类
     */
    public static class SessionInferenceStatus {
        private String sessionId;
        private String phaseType;
        private String status; // IN_PROGRESS, COMPLETED, FAILED
        private int totalAgents;
        private int completedAgents;
        private int successfulAgents;
        private int failedAgents;
        private double successRate;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private long processingTimeMs;
        private String errorMessage;
        
        // Getters and Setters
        public String getSessionId() {
            return sessionId;
        }
        
        public void setSessionId(String sessionId) {
            this.sessionId = sessionId;
        }
        
        public String getPhaseType() {
            return phaseType;
        }
        
        public void setPhaseType(String phaseType) {
            this.phaseType = phaseType;
        }
        
        public String getStatus() {
            return status;
        }
        
        public void setStatus(String status) {
            this.status = status;
        }
        
        public int getTotalAgents() {
            return totalAgents;
        }
        
        public void setTotalAgents(int totalAgents) {
            this.totalAgents = totalAgents;
        }
        
        public int getCompletedAgents() {
            return completedAgents;
        }
        
        public void setCompletedAgents(int completedAgents) {
            this.completedAgents = completedAgents;
        }
        
        public int getSuccessfulAgents() {
            return successfulAgents;
        }
        
        public void setSuccessfulAgents(int successfulAgents) {
            this.successfulAgents = successfulAgents;
        }
        
        public int getFailedAgents() {
            return failedAgents;
        }
        
        public void setFailedAgents(int failedAgents) {
            this.failedAgents = failedAgents;
        }
        
        public double getSuccessRate() {
            return successRate;
        }
        
        public void setSuccessRate(double successRate) {
            this.successRate = successRate;
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
        
        public long getProcessingTimeMs() {
            return processingTimeMs;
        }
        
        public void setProcessingTimeMs(long processingTimeMs) {
            this.processingTimeMs = processingTimeMs;
        }
        
        public String getErrorMessage() {
            return errorMessage;
        }
        
        public void setErrorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
        }
    }
    
    /**
     * 推理统计信息类
     */
    public static class InferenceStatistics {
        private int totalSessions;
        private int completedSessions;
        private int failedSessions;
        private long averageProcessingTimeMs;
        
        // Getters and Setters
        public int getTotalSessions() {
            return totalSessions;
        }
        
        public void setTotalSessions(int totalSessions) {
            this.totalSessions = totalSessions;
        }
        
        public int getCompletedSessions() {
            return completedSessions;
        }
        
        public void setCompletedSessions(int completedSessions) {
            this.completedSessions = completedSessions;
        }
        
        public int getFailedSessions() {
            return failedSessions;
        }
        
        public void setFailedSessions(int failedSessions) {
            this.failedSessions = failedSessions;
        }
        
        public long getAverageProcessingTimeMs() {
            return averageProcessingTimeMs;
        }
        
        public void setAverageProcessingTimeMs(long averageProcessingTimeMs) {
            this.averageProcessingTimeMs = averageProcessingTimeMs;
        }
    }
}
