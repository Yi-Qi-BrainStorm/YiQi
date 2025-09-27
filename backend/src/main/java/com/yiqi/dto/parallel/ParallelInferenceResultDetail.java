package com.yiqi.dto.parallel;

import com.yiqi.enums.PhaseType;
import com.yiqi.service.InferenceStatusService;

/**
 * 并行推理结果详情
 */
public class ParallelInferenceResultDetail {
    
    private String sessionId;
    private PhaseType phaseType;
    private InferenceStatusService.SessionInferenceStatus status;
    private String resultSummary;
    
    // Getters and Setters
    public String getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
    
    public PhaseType getPhaseType() {
        return phaseType;
    }
    
    public void setPhaseType(PhaseType phaseType) {
        this.phaseType = phaseType;
    }
    
    public InferenceStatusService.SessionInferenceStatus getStatus() {
        return status;
    }
    
    public void setStatus(InferenceStatusService.SessionInferenceStatus status) {
        this.status = status;
    }
    
    public String getResultSummary() {
        return resultSummary;
    }
    
    public void setResultSummary(String resultSummary) {
        this.resultSummary = resultSummary;
    }
}