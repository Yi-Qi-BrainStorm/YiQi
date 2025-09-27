package com.yiqi.dto.ai;

/**
 * 代理推理请求DTO
 * 包含单个代理进行推理所需的所有信息
 */
public class AgentInferenceRequest {
    
    private Long agentId;
    private String agentName;
    private String roleType;
    private String systemPrompt;
    private String userPrompt;
    private String sessionContext;

    public AgentInferenceRequest() {}

    public AgentInferenceRequest(Long agentId, String agentName, String roleType, 
                               String systemPrompt, String userPrompt, String sessionContext) {
        this.agentId = agentId;
        this.agentName = agentName;
        this.roleType = roleType;
        this.systemPrompt = systemPrompt;
        this.userPrompt = userPrompt;
        this.sessionContext = sessionContext;
    }

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

    public String getSystemPrompt() {
        return systemPrompt;
    }

    public void setSystemPrompt(String systemPrompt) {
        this.systemPrompt = systemPrompt;
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
}