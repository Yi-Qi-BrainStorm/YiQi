package com.yiqi.dto.parallel;

import com.yiqi.enums.PhaseType;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.List;

/**
 * 自定义并行推理请求
 */
public class CustomParallelInferenceRequest {
    
    @NotEmpty(message = "代理ID列表不能为空")
    private List<Long> agentIds;
    
    @NotBlank(message = "用户提示词不能为空")
    @Size(max = 2000, message = "用户提示词长度不能超过2000字符")
    private String userPrompt;
    
    @Size(max = 1000, message = "会话上下文长度不能超过1000字符")
    private String sessionContext;
    
    private String sessionId;
    
    @NotNull(message = "阶段类型不能为空")
    private PhaseType phaseType;
    
    // Getters and Setters
    public List<Long> getAgentIds() {
        return agentIds;
    }
    
    public void setAgentIds(List<Long> agentIds) {
        this.agentIds = agentIds;
    }
    
    public String getUserPrompt() {
        return userPrompt;
    }
    
    public void setUserPrompt(String userPrompt) {
        this.userPrompt = userPrompt;
    }
    
    public String getSessionContext() {
        return sessionContext;
    }
    
    public void setSessionContext(String sessionContext) {
        this.sessionContext = sessionContext;
    }
    
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
}