package com.yiqi.dto.ai;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 并行推理结果DTO
 * 包含多个代理并行推理的汇总结果
 */
public class ParallelInferenceResult {
    
    private List<AgentInferenceResponse> agentResponses;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long totalProcessingTimeMs;
    private int totalAgents;
    private int successfulAgents;
    private int failedAgents;
    private String phaseSummary;

    public ParallelInferenceResult() {}

    public ParallelInferenceResult(List<AgentInferenceResponse> agentResponses) {
        this.agentResponses = agentResponses;
        this.startTime = LocalDateTime.now();
        calculateStatistics();
    }

    /**
     * 完成推理并计算统计信息
     */
    public void complete() {
        this.endTime = LocalDateTime.now();
        calculateStatistics();
        calculateTotalProcessingTime();
    }

    /**
     * 计算统计信息
     */
    private void calculateStatistics() {
        if (agentResponses != null) {
            this.totalAgents = agentResponses.size();
            this.successfulAgents = (int) agentResponses.stream()
                .filter(AgentInferenceResponse::isSuccess)
                .count();
            this.failedAgents = (int) agentResponses.stream()
                .filter(AgentInferenceResponse::isFailed)
                .count();
        }
    }

    /**
     * 计算总处理时长
     */
    private void calculateTotalProcessingTime() {
        if (startTime != null && endTime != null) {
            this.totalProcessingTimeMs = java.time.Duration.between(startTime, endTime).toMillis();
        }
    }

    /**
     * 获取成功率
     */
    public double getSuccessRate() {
        if (totalAgents == 0) {
            return 0.0;
        }
        return (double) successfulAgents / totalAgents;
    }

    /**
     * 获取失败率
     */
    public double getFailureRate() {
        if (totalAgents == 0) {
            return 0.0;
        }
        return (double) failedAgents / totalAgents;
    }

    /**
     * 检查是否有成功的响应
     */
    public boolean hasSuccessfulResponses() {
        return successfulAgents > 0;
    }

    /**
     * 获取成功的响应列表
     */
    public List<AgentInferenceResponse> getSuccessfulResponses() {
        if (agentResponses == null) {
            return new ArrayList<>();
        }
        return agentResponses.stream()
            .filter(AgentInferenceResponse::isSuccess)
            .collect(Collectors.toList());
    }

    /**
     * 获取失败的响应列表
     */
    public List<AgentInferenceResponse> getFailedResponses() {
        if (agentResponses == null) {
            return new ArrayList<>();
        }
        return agentResponses.stream()
            .filter(AgentInferenceResponse::isFailed)
            .collect(Collectors.toList());
    }

    /**
     * 检查是否全部成功
     */
    public boolean isAllSuccess() {
        return totalAgents > 0 && successfulAgents == totalAgents;
    }

    /**
     * 检查是否全部失败
     */
    public boolean isAllFailed() {
        return totalAgents > 0 && failedAgents == totalAgents;
    }

    // Getters and Setters
    public List<AgentInferenceResponse> getAgentResponses() {
        return agentResponses;
    }

    public void setAgentResponses(List<AgentInferenceResponse> agentResponses) {
        this.agentResponses = agentResponses;
        calculateStatistics();
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

    public Long getTotalProcessingTimeMs() {
        return totalProcessingTimeMs;
    }

    public void setTotalProcessingTimeMs(Long totalProcessingTimeMs) {
        this.totalProcessingTimeMs = totalProcessingTimeMs;
    }

    public int getTotalAgents() {
        return totalAgents;
    }

    public void setTotalAgents(int totalAgents) {
        this.totalAgents = totalAgents;
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

    public String getPhaseSummary() {
        return phaseSummary;
    }

    public void setPhaseSummary(String phaseSummary) {
        this.phaseSummary = phaseSummary;
    }
}