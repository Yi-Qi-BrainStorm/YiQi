package com.yiqi.service;

import com.yiqi.dto.AgentResponse;
import com.yiqi.dto.AgentSummaryResponse;
import com.yiqi.dto.CreateAgentRequest;
import com.yiqi.dto.UpdateAgentRequest;
import com.yiqi.entity.Agent;
import com.yiqi.enums.AgentStatus;
import com.yiqi.enums.RoleType;
import com.yiqi.exception.AgentNotFoundException;
import com.yiqi.exception.ValidationException;
import com.yiqi.mapper.AgentMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * AI代理服务层
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Service
@Transactional
public class AgentService {

    private static final Logger logger = LoggerFactory.getLogger(AgentService.class);

    @Autowired
    private AgentMapper agentMapper;

    @Autowired
    private AgentValidationService agentValidationService;

    @Autowired
    private AgentVersionService agentVersionService;

    /**
     * 创建新的AI代理
     * 
     * @param userId 用户ID
     * @param request 创建代理请求
     * @return 代理响应DTO
     * @throws ValidationException 如果验证失败
     */
    public AgentResponse createAgent(Long userId, CreateAgentRequest request) {
        logger.info("创建AI代理，用户ID: {}, 代理名称: {}", userId, request.getName());

        // 验证请求参数
        agentValidationService.validateCreateRequest(request);
        
        // 检查代理名称唯一性
        agentValidationService.validateNameUniqueness(userId, request.getName(), null);
        
        // 验证角色类型
        agentValidationService.validateRoleType(request.getRoleType());
        
        // 验证AI模型
        agentValidationService.validateAiModel(request.getAiModel());
        
        // 验证系统提示词
        agentValidationService.validateSystemPrompt(request.getSystemPrompt());

        // 创建代理实体
        Agent agent = new Agent(
            userId,
            request.getName().trim(),
            request.getRoleType().trim(),
            request.getSystemPrompt().trim(),
            request.getAiModel().trim()
        );

        // 保存到数据库
        int result = agentMapper.insert(agent);
        if (result <= 0) {
            throw new RuntimeException("创建代理失败");
        }

        // 创建版本记录
        agentVersionService.createVersion(agent);

        logger.info("成功创建AI代理，ID: {}", agent.getId());
        return AgentResponse.fromEntity(agent);
    }

    /**
     * 更新AI代理
     * 
     * @param userId 用户ID
     * @param agentId 代理ID
     * @param request 更新代理请求
     * @return 代理响应DTO
     * @throws AgentNotFoundException 如果代理不存在
     * @throws ValidationException 如果验证失败
     */
    public AgentResponse updateAgent(Long userId, Long agentId, UpdateAgentRequest request) {
        logger.info("更新AI代理，用户ID: {}, 代理ID: {}", userId, agentId);

        // 验证请求参数
        agentValidationService.validateUpdateRequest(request);
        
        // 获取现有代理
        Agent existingAgent = getAgentByIdAndUserId(agentId, userId);
        
        // 检查代理名称唯一性（排除当前代理）
        agentValidationService.validateNameUniqueness(userId, request.getName(), agentId);
        
        // 验证角色类型
        agentValidationService.validateRoleType(request.getRoleType());
        
        // 验证AI模型
        agentValidationService.validateAiModel(request.getAiModel());
        
        // 验证系统提示词
        agentValidationService.validateSystemPrompt(request.getSystemPrompt());
        
        // 验证状态（如果提供）
        if (request.getStatus() != null) {
            agentValidationService.validateStatus(request.getStatus());
        }

        // 创建版本记录（更新前）
        agentVersionService.createVersion(existingAgent);

        // 更新代理信息
        existingAgent.setName(request.getName().trim());
        existingAgent.setRoleType(request.getRoleType().trim());
        existingAgent.setSystemPrompt(request.getSystemPrompt().trim());
        existingAgent.setAiModel(request.getAiModel().trim());
        
        if (request.getStatus() != null) {
            existingAgent.setStatus(request.getStatus().trim());
        }

        // 保存更新
        int result = agentMapper.updateById(existingAgent);
        if (result <= 0) {
            throw new RuntimeException("更新代理失败");
        }

        logger.info("成功更新AI代理，ID: {}", agentId);
        return AgentResponse.fromEntity(existingAgent);
    }

    /**
     * 删除AI代理（软删除）
     * 
     * @param userId 用户ID
     * @param agentId 代理ID
     * @throws AgentNotFoundException 如果代理不存在
     * @throws ValidationException 如果代理正在被使用
     */
    public void deleteAgent(Long userId, Long agentId) {
        logger.info("删除AI代理，用户ID: {}, 代理ID: {}", userId, agentId);

        // 获取现有代理
        Agent existingAgent = getAgentByIdAndUserId(agentId, userId);
        
        // 检查代理是否被会话使用
        agentValidationService.validateAgentNotInUse(agentId);

        // 创建版本记录（删除前）
        agentVersionService.createVersion(existingAgent);

        // 软删除代理
        existingAgent.markAsDeleted();
        int result = agentMapper.updateById(existingAgent);
        if (result <= 0) {
            throw new RuntimeException("删除代理失败");
        }

        logger.info("成功删除AI代理，ID: {}", agentId);
    }

    /**
     * 根据用户ID获取代理列表
     * 
     * @param userId 用户ID
     * @return 代理摘要列表
     */
    @Transactional(readOnly = true)
    public List<AgentSummaryResponse> getAgentsByUserId(Long userId) {
        logger.debug("获取用户代理列表，用户ID: {}", userId);

        List<Agent> agents = agentMapper.findByUserId(userId);
        return agents.stream()
                .map(AgentSummaryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 根据用户ID和状态获取代理列表
     * 
     * @param userId 用户ID
     * @param status 代理状态
     * @return 代理摘要列表
     */
    @Transactional(readOnly = true)
    public List<AgentSummaryResponse> getAgentsByUserIdAndStatus(Long userId, String status) {
        logger.debug("获取用户代理列表，用户ID: {}, 状态: {}", userId, status);

        // 验证状态
        agentValidationService.validateStatus(status);

        List<Agent> agents = agentMapper.findByUserIdAndStatus(userId, status);
        return agents.stream()
                .map(AgentSummaryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 获取代理详情
     * 
     * @param userId 用户ID
     * @param agentId 代理ID
     * @return 代理响应DTO
     * @throws AgentNotFoundException 如果代理不存在
     */
    @Transactional(readOnly = true)
    public AgentResponse getAgentDetail(Long userId, Long agentId) {
        logger.debug("获取代理详情，用户ID: {}, 代理ID: {}", userId, agentId);

        Agent agent = getAgentByIdAndUserId(agentId, userId);
        return AgentResponse.fromEntity(agent);
    }

    /**
     * 激活代理
     * 
     * @param userId 用户ID
     * @param agentId 代理ID
     * @return 代理响应DTO
     */
    public AgentResponse activateAgent(Long userId, Long agentId) {
        logger.info("激活AI代理，用户ID: {}, 代理ID: {}", userId, agentId);

        Agent agent = getAgentByIdAndUserId(agentId, userId);
        
        if (agent.isActive()) {
            logger.warn("代理已经是活跃状态，ID: {}", agentId);
            return AgentResponse.fromEntity(agent);
        }

        agent.activate();
        int result = agentMapper.updateById(agent);
        if (result <= 0) {
            throw new RuntimeException("激活代理失败");
        }

        logger.info("成功激活AI代理，ID: {}", agentId);
        return AgentResponse.fromEntity(agent);
    }

    /**
     * 停用代理
     * 
     * @param userId 用户ID
     * @param agentId 代理ID
     * @return 代理响应DTO
     */
    public AgentResponse deactivateAgent(Long userId, Long agentId) {
        logger.info("停用AI代理，用户ID: {}, 代理ID: {}", userId, agentId);

        Agent agent = getAgentByIdAndUserId(agentId, userId);
        
        // 检查代理是否被会话使用
        agentValidationService.validateAgentNotInUse(agentId);

        agent.deactivate();
        int result = agentMapper.updateById(agent);
        if (result <= 0) {
            throw new RuntimeException("停用代理失败");
        }

        logger.info("成功停用AI代理，ID: {}", agentId);
        return AgentResponse.fromEntity(agent);
    }

    /**
     * 根据角色类型获取活跃代理
     * 
     * @param roleType 角色类型
     * @return 代理摘要列表
     */
    @Transactional(readOnly = true)
    public List<AgentSummaryResponse> getActiveAgentsByRoleType(String roleType) {
        logger.debug("根据角色类型获取活跃代理，角色类型: {}", roleType);

        // 验证角色类型
        agentValidationService.validateRoleType(roleType);

        List<Agent> agents = agentMapper.findByRoleType(roleType);
        return agents.stream()
                .map(AgentSummaryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 根据ID列表获取代理
     * 
     * @param agentIds 代理ID列表
     * @return 代理列表
     */
    @Transactional(readOnly = true)
    public List<Agent> getAgentsByIds(List<Long> agentIds) {
        logger.debug("根据ID列表获取代理，数量: {}", agentIds.size());
        
        if (agentIds == null || agentIds.isEmpty()) {
            return new ArrayList<>();
        }
        
        return agentMapper.findByIds(agentIds);
    }

    /**
     * 根据ID获取代理
     * 
     * @param agentId 代理ID
     * @return Agent实体
     * @throws AgentNotFoundException 如果代理不存在
     */
    @Transactional(readOnly = true)
    public Agent getAgentById(Long agentId) {
        Agent agent = agentMapper.selectById(agentId);
        if (agent == null) {
            throw new AgentNotFoundException("代理不存在，ID: " + agentId);
        }
        return agent;
    }

    /**
     * 根据ID和用户ID获取代理（内部方法）
     * 
     * @param agentId 代理ID
     * @param userId 用户ID
     * @return Agent实体
     * @throws AgentNotFoundException 如果代理不存在
     */
    private Agent getAgentByIdAndUserId(Long agentId, Long userId) {
        Agent agent = agentMapper.findByIdAndUserId(agentId, userId);
        if (agent == null) {
            throw new AgentNotFoundException("代理不存在或无权限访问，ID: " + agentId);
        }
        return agent;
    }
}
