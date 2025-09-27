package com.yiqi.service;

import com.yiqi.dto.CreateAgentRequest;
import com.yiqi.dto.UpdateAgentRequest;
import com.yiqi.enums.AgentStatus;
import com.yiqi.enums.RoleType;
import com.yiqi.exception.ValidationException;
import com.yiqi.mapper.AgentMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * AI代理验证服务
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Service
public class AgentValidationService {

    private static final Logger logger = LoggerFactory.getLogger(AgentValidationService.class);

    // 支持的AI模型列表
    private static final Set<String> SUPPORTED_AI_MODELS = new HashSet<>(Arrays.asList(
        "qwen-plus", "qwen-turbo", "qwen-max", "qwen-max-longcontext",
        "gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "claude-3-sonnet", "claude-3-opus"
    ));

    // 系统提示词最小长度
    private static final int MIN_SYSTEM_PROMPT_LENGTH = 10;
    
    // 系统提示词最大长度
    private static final int MAX_SYSTEM_PROMPT_LENGTH = 2000;

    @Autowired
    private AgentMapper agentMapper;

    /**
     * 验证创建代理请求
     * 
     * @param request 创建代理请求
     * @throws ValidationException 如果验证失败
     */
    public void validateCreateRequest(CreateAgentRequest request) {
        if (request == null) {
            throw new ValidationException("请求不能为空");
        }

        validateName(request.getName());
        validateRoleType(request.getRoleType());
        validateSystemPrompt(request.getSystemPrompt());
        validateAiModel(request.getAiModel());
    }

    /**
     * 验证更新代理请求
     * 
     * @param request 更新代理请求
     * @throws ValidationException 如果验证失败
     */
    public void validateUpdateRequest(UpdateAgentRequest request) {
        if (request == null) {
            throw new ValidationException("请求不能为空");
        }

        validateName(request.getName());
        validateRoleType(request.getRoleType());
        validateSystemPrompt(request.getSystemPrompt());
        validateAiModel(request.getAiModel());
        
        if (request.getStatus() != null) {
            validateStatus(request.getStatus());
        }
    }

    /**
     * 验证代理名称
     * 
     * @param name 代理名称
     * @throws ValidationException 如果验证失败
     */
    public void validateName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new ValidationException("代理名称不能为空");
        }

        String trimmedName = name.trim();
        if (trimmedName.length() < 2) {
            throw new ValidationException("代理名称长度不能少于2个字符");
        }

        if (trimmedName.length() > 100) {
            throw new ValidationException("代理名称长度不能超过100个字符");
        }

        // 检查特殊字符
        if (!trimmedName.matches("^[\\u4e00-\\u9fa5a-zA-Z0-9\\s\\-_]+$")) {
            throw new ValidationException("代理名称只能包含中文、英文、数字、空格、连字符和下划线");
        }
    }

    /**
     * 验证角色类型
     * 
     * @param roleType 角色类型
     * @throws ValidationException 如果验证失败
     */
    public void validateRoleType(String roleType) {
        if (!StringUtils.hasText(roleType)) {
            throw new ValidationException("角色类型不能为空");
        }

        try {
            RoleType.fromValue(roleType.trim());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("无效的角色类型: " + roleType);
        }
    }

    /**
     * 验证系统提示词
     * 
     * @param systemPrompt 系统提示词
     * @throws ValidationException 如果验证失败
     */
    public void validateSystemPrompt(String systemPrompt) {
        if (!StringUtils.hasText(systemPrompt)) {
            throw new ValidationException("系统提示词不能为空");
        }

        String trimmedPrompt = systemPrompt.trim();
        if (trimmedPrompt.length() < MIN_SYSTEM_PROMPT_LENGTH) {
            throw new ValidationException("系统提示词长度不能少于" + MIN_SYSTEM_PROMPT_LENGTH + "个字符");
        }

        if (trimmedPrompt.length() > MAX_SYSTEM_PROMPT_LENGTH) {
            throw new ValidationException("系统提示词长度不能超过" + MAX_SYSTEM_PROMPT_LENGTH + "个字符");
        }

        // 检查是否包含基本的角色描述
        if (!containsRoleDescription(trimmedPrompt)) {
            logger.warn("系统提示词可能缺少角色描述: {}", trimmedPrompt.substring(0, Math.min(50, trimmedPrompt.length())));
        }
    }

    /**
     * 验证AI模型
     * 
     * @param aiModel AI模型
     * @throws ValidationException 如果验证失败
     */
    public void validateAiModel(String aiModel) {
        if (!StringUtils.hasText(aiModel)) {
            throw new ValidationException("AI模型不能为空");
        }

        String trimmedModel = aiModel.trim();
        if (!SUPPORTED_AI_MODELS.contains(trimmedModel)) {
            throw new ValidationException("不支持的AI模型: " + aiModel + "。支持的模型: " + SUPPORTED_AI_MODELS);
        }
    }

    /**
     * 验证代理状态
     * 
     * @param status 代理状态
     * @throws ValidationException 如果验证失败
     */
    public void validateStatus(String status) {
        if (!StringUtils.hasText(status)) {
            throw new ValidationException("代理状态不能为空");
        }

        try {
            AgentStatus.fromValue(status.trim());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("无效的代理状态: " + status);
        }
    }

    /**
     * 验证代理名称唯一性
     * 
     * @param userId 用户ID
     * @param name 代理名称
     * @param excludeId 排除的代理ID（用于更新时检查）
     * @throws ValidationException 如果名称不唯一
     */
    public void validateNameUniqueness(Long userId, String name, Long excludeId) {
        if (!StringUtils.hasText(name)) {
            return; // 名称为空的情况由其他验证方法处理
        }

        int count = agentMapper.countByUserIdAndName(userId, name.trim(), excludeId);
        if (count > 0) {
            throw new ValidationException("代理名称已存在: " + name);
        }
    }

    /**
     * 验证代理未被使用
     * 
     * @param agentId 代理ID
     * @throws ValidationException 如果代理正在被使用
     */
    public void validateAgentNotInUse(Long agentId) {
        int activeSessionCount = agentMapper.countActiveSessionsByAgentId(agentId);
        if (activeSessionCount > 0) {
            throw new ValidationException("代理正在被 " + activeSessionCount + " 个活跃会话使用，无法删除或停用");
        }
    }

    /**
     * 检查系统提示词是否包含角色描述
     * 
     * @param systemPrompt 系统提示词
     * @return true如果包含角色描述
     */
    private boolean containsRoleDescription(String systemPrompt) {
        String lowerPrompt = systemPrompt.toLowerCase();
        return lowerPrompt.contains("你是") || lowerPrompt.contains("作为") || 
               lowerPrompt.contains("you are") || lowerPrompt.contains("as a") ||
               lowerPrompt.contains("角色") || lowerPrompt.contains("role");
    }

    /**
     * 获取支持的AI模型列表
     * 
     * @return 支持的AI模型集合
     */
    public Set<String> getSupportedAiModels() {
        return new HashSet<>(SUPPORTED_AI_MODELS);
    }

    /**
     * 添加支持的AI模型
     * 
     * @param model AI模型名称
     */
    public void addSupportedAiModel(String model) {
        if (StringUtils.hasText(model)) {
            SUPPORTED_AI_MODELS.add(model.trim());
            logger.info("添加支持的AI模型: {}", model);
        }
    }

    /**
     * 移除支持的AI模型
     * 
     * @param model AI模型名称
     */
    public void removeSupportedAiModel(String model) {
        if (StringUtils.hasText(model)) {
            SUPPORTED_AI_MODELS.remove(model.trim());
            logger.info("移除支持的AI模型: {}", model);
        }
    }
}