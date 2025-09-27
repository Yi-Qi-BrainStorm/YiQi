package com.yiqi.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 创建AI代理请求DTO
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Schema(description = "创建AI代理请求")
public class CreateAgentRequest {

    @NotBlank(message = "代理名称不能为空")
    @Size(max = 100, message = "代理名称长度不能超过100个字符")
    @Schema(description = "代理名称", required = true, example = "产品设计师")
    private String name;

    @NotBlank(message = "角色类型不能为空")
    @Size(max = 50, message = "角色类型长度不能超过50个字符")
    @Schema(description = "角色类型", required = true, example = "DESIGNER")
    private String roleType;

    @NotBlank(message = "系统提示词不能为空")
    @Size(max = 2000, message = "系统提示词长度不能超过2000个字符")
    @Schema(description = "系统提示词", required = true, example = "你是一名专业的产品设计师，擅长创新设计和用户体验...")
    private String systemPrompt;

    @NotBlank(message = "AI模型不能为空")
    @Size(max = 50, message = "AI模型长度不能超过50个字符")
    @Schema(description = "AI模型", required = true, example = "qwen-plus")
    private String aiModel;

    public CreateAgentRequest() {}

    public CreateAgentRequest(String name, String roleType, String systemPrompt, String aiModel) {
        this.name = name;
        this.roleType = roleType;
        this.systemPrompt = systemPrompt;
        this.aiModel = aiModel;
    }

    // Getters and Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public String getAiModel() {
        return aiModel;
    }

    public void setAiModel(String aiModel) {
        this.aiModel = aiModel;
    }

    @Override
    public String toString() {
        return "CreateAgentRequest{" +
                "name='" + name + '\'' +
                ", roleType='" + roleType + '\'' +
                ", aiModel='" + aiModel + '\'' +
                '}';
    }
}