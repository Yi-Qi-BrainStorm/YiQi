package com.yiqi.dto.parallel;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 会话阶段推理请求
 */
public class SessionPhaseInferenceRequest {
    
    @NotBlank(message = "用户提示词不能为空")
    @Size(max = 2000, message = "用户提示词长度不能超过2000字符")
    private String userPrompt;
    
    @Size(max = 1000, message = "附加上下文长度不能超过1000字符")
    private String additionalContext;
    
    // Getters and Setters
    public String getUserPrompt() {
        return userPrompt;
    }
    
    public void setUserPrompt(String userPrompt) {
        this.userPrompt = userPrompt;
    }
    
    public String getAdditionalContext() {
        return additionalContext;
    }
    
    public void setAdditionalContext(String additionalContext) {
        this.additionalContext = additionalContext;
    }
}