package com.yiqi.dto.parallel;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

/**
 * 批量多阶段推理请求
 */
public class BatchMultiPhaseInferenceRequest {
    
    @NotNull(message = "会话ID不能为空")
    private Long sessionId;
    
    @NotEmpty(message = "阶段配置列表不能为空")
    @Valid
    private List<PhaseInferenceConfig> phases;
    
    private boolean stopOnFailure = true; // 默认失败时停止
    
    // Getters and Setters
    public Long getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }
    
    public List<PhaseInferenceConfig> getPhases() {
        return phases;
    }
    
    public void setPhases(List<PhaseInferenceConfig> phases) {
        this.phases = phases;
    }
    
    public boolean isStopOnFailure() {
        return stopOnFailure;
    }
    
    public void setStopOnFailure(boolean stopOnFailure) {
        this.stopOnFailure = stopOnFailure;
    }
}