package com.yiqi.dto.parallel;

import com.yiqi.dto.ai.ParallelInferenceResult;
import com.yiqi.enums.PhaseType;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 批量推理结果
 */
public class BatchInferenceResult {
    
    private Long sessionId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Map<PhaseType, ParallelInferenceResult> phaseResults = new HashMap<>();
    private double overallSuccessRate;
    private int totalPhases;
    private int completedPhases;
    private int successfulPhases;
    
    // 添加阶段结果
    public void addPhaseResult(PhaseType phaseType, ParallelInferenceResult result) {
        phaseResults.put(phaseType, result);
        completedPhases++;
        if (result.hasSuccessfulResponses()) {
            successfulPhases++;
        }
    }
    
    // 计算总体统计
    public void calculateOverallStats() {
        totalPhases = phaseResults.size();
        if (totalPhases > 0) {
            overallSuccessRate = (double) successfulPhases / totalPhases;
        }
    }
    
    // Getters and Setters
    public Long getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
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
    
    public Map<PhaseType, ParallelInferenceResult> getPhaseResults() {
        return phaseResults;
    }
    
    public void setPhaseResults(Map<PhaseType, ParallelInferenceResult> phaseResults) {
        this.phaseResults = phaseResults;
    }
    
    public double getOverallSuccessRate() {
        return overallSuccessRate;
    }
    
    public void setOverallSuccessRate(double overallSuccessRate) {
        this.overallSuccessRate = overallSuccessRate;
    }
    
    public int getTotalPhases() {
        return totalPhases;
    }
    
    public void setTotalPhases(int totalPhases) {
        this.totalPhases = totalPhases;
    }
    
    public int getCompletedPhases() {
        return completedPhases;
    }
    
    public void setCompletedPhases(int completedPhases) {
        this.completedPhases = completedPhases;
    }
    
    public int getSuccessfulPhases() {
        return successfulPhases;
    }
    
    public void setSuccessfulPhases(int successfulPhases) {
        this.successfulPhases = successfulPhases;
    }
}