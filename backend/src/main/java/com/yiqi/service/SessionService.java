package com.yiqi.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.yiqi.dto.CreateSessionRequest;
import com.yiqi.dto.SessionResponse;
import com.yiqi.dto.SessionStatusResponse;
import com.yiqi.dto.StartSessionRequest;
import com.yiqi.entity.*;
import com.yiqi.enums.*;
import com.yiqi.exception.*;
import com.yiqi.mapper.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 头脑风暴会话服务类
 * 管理会话的创建、配置、状态管理和生命周期
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Service
public class SessionService {

    @Autowired
    private BrainstormSessionMapper sessionMapper;

    @Autowired
    private SessionAgentMapper sessionAgentMapper;

    @Autowired
    private PhaseMapper phaseMapper;

    @Autowired
    private AgentResponseMapper agentResponseMapper;

    @Autowired
    private AgentMapper agentMapper;

    /**
     * 创建新的头脑风暴会话
     * 
     * @param userId 用户ID
     * @param request 创建会话请求
     * @return 会话响应
     * @throws ValidationException 如果请求参数无效
     * @throws AgentNotFoundException 如果指定的代理不存在
     */
    @Transactional
    public SessionResponse createSession(Long userId, CreateSessionRequest request) {
        // 验证请求参数
        validateCreateSessionRequest(request);
        
        // 验证代理是否存在且属于用户
        validateAgentsExistAndBelongToUser(userId, request.getAgentIds());
        
        // 创建会话
        BrainstormSession session = new BrainstormSession(userId, request.getTitle(), request.getDescription());
        sessionMapper.insert(session);
        
        // 添加参与代理
        List<SessionAgent> sessionAgents = new ArrayList<>();
        for (Long agentId : request.getAgentIds()) {
            SessionAgent sessionAgent = new SessionAgent(session.getId(), agentId);
            sessionAgentMapper.insert(sessionAgent);
            sessionAgents.add(sessionAgent);
        }
        
        // 初始化三个阶段
        initializePhases(session.getId());
        
        return buildSessionResponse(session, sessionAgents);
    }

    /**
     * 启动头脑风暴会话
     * 
     * @param sessionId 会话ID
     * @param request 启动会话请求
     * @throws SessionNotFoundException 如果会话不存在
     * @throws IllegalStateException 如果会话状态不允许启动
     */
    @Transactional
    public void startSession(Long sessionId, StartSessionRequest request) {
        BrainstormSession session = getSessionById(sessionId);
        
        // 检查会话是否可以启动
        if (!session.canStart()) {
            throw new IllegalStateException("会话当前状态不允许启动: " + session.getStatus());
        }
        
        // 检查是否有活跃的代理
        List<SessionAgent> activeAgents = sessionAgentMapper.findActiveAgentsBySessionId(sessionId);
        if (activeAgents.isEmpty()) {
            throw new IllegalStateException("会话中没有活跃的代理，无法启动");
        }
        
        // 更新会话状态和主题
        session.setTopic(request.getTopic());
        session.start();
        sessionMapper.updateById(session);
        
        // 启动第一个阶段（创意生成）
        Phase firstPhase = phaseMapper.findBySessionIdAndPhaseType(sessionId, PhaseType.IDEA_GENERATION);
        if (firstPhase != null && firstPhase.canStart()) {
            firstPhase.start();
            phaseMapper.updateById(firstPhase);
        }
    }

    /**
     * 暂停头脑风暴会话
     * 
     * @param sessionId 会话ID
     * @throws SessionNotFoundException 如果会话不存在
     * @throws IllegalStateException 如果会话状态不允许暂停
     */
    @Transactional
    public void pauseSession(Long sessionId) {
        BrainstormSession session = getSessionById(sessionId);
        
        // 检查会话是否可以暂停
        if (!session.canPause()) {
            throw new IllegalStateException("会话当前状态不允许暂停: " + session.getStatus());
        }
        
        // 暂停会话
        session.pause();
        sessionMapper.updateById(session);
        
        // 暂停当前进行中的阶段
        Phase currentPhase = phaseMapper.findCurrentPhaseBySessionId(sessionId);
        if (currentPhase != null && currentPhase.isInProgress()) {
            // 注意：这里不改变阶段状态，只是暂停会话
            // 阶段状态保持IN_PROGRESS，恢复时可以继续
        }
    }

    /**
     * 恢复头脑风暴会话
     * 
     * @param sessionId 会话ID
     * @throws SessionNotFoundException 如果会话不存在
     * @throws IllegalStateException 如果会话状态不允许恢复
     */
    @Transactional
    public void resumeSession(Long sessionId) {
        BrainstormSession session = getSessionById(sessionId);
        
        // 检查会话是否可以恢复（从暂停状态）
        if (session.getStatus() != SessionStatus.PAUSED) {
            throw new IllegalStateException("只有暂停状态的会话才能恢复: " + session.getStatus());
        }
        
        // 恢复会话
        session.start(); // 设置为进行中状态
        sessionMapper.updateById(session);
    }

    /**
     * 取消头脑风暴会话
     * 
     * @param sessionId 会话ID
     * @throws SessionNotFoundException 如果会话不存在
     */
    @Transactional
    public void cancelSession(Long sessionId) {
        BrainstormSession session = getSessionById(sessionId);
        
        // 取消会话
        session.cancel();
        sessionMapper.updateById(session);
    }

    /**
     * 获取会话状态
     * 
     * @param sessionId 会话ID
     * @return 会话状态响应
     * @throws SessionNotFoundException 如果会话不存在
     */
    public SessionStatusResponse getSessionStatus(Long sessionId) {
        BrainstormSession session = getSessionById(sessionId);
        
        // 获取阶段信息
        List<Phase> phases = phaseMapper.findBySessionId(sessionId);
        
        // 获取代理统计
        Long totalAgents = sessionAgentMapper.countBySessionId(sessionId);
        Long activeAgents = sessionAgentMapper.countBySessionIdAndStatus(sessionId, AgentStatus.ACTIVE);
        
        // 构建响应
        SessionStatusResponse response = new SessionStatusResponse();
        response.setSessionId(sessionId);
        response.setSessionStatus(session.getStatus());
        response.setCurrentPhase(session.getCurrentPhase());
        response.setAgentCount(totalAgents.intValue());
        response.setActiveAgentCount(activeAgents.intValue());
        response.setLastUpdated(session.getUpdatedAt());
        
        // 构建阶段信息
        List<SessionStatusResponse.PhaseInfo> phaseInfos = phases.stream()
                .map(this::buildPhaseInfo)
                .collect(Collectors.toList());
        response.setPhases(phaseInfos);
        
        // 计算进度百分比
        response.setProgressPercentage(calculateProgressPercentage(phases));
        
        return response;
    }

    /**
     * 获取用户的会话列表
     * 
     * @param userId 用户ID
     * @return 会话列表
     */
    public List<SessionResponse> getUserSessions(Long userId) {
        List<BrainstormSession> sessions = sessionMapper.findByUserId(userId);
        return sessions.stream()
                .map(session -> {
                    List<SessionAgent> sessionAgents = sessionAgentMapper.findBySessionId(session.getId());
                    return buildSessionResponse(session, sessionAgents);
                })
                .collect(Collectors.toList());
    }

    /**
     * 获取用户的活跃会话
     * 
     * @param userId 用户ID
     * @return 活跃会话列表
     */
    public List<SessionResponse> getUserActiveSessions(Long userId) {
        List<BrainstormSession> sessions = sessionMapper.findActiveSessionsByUserId(userId);
        return sessions.stream()
                .map(session -> {
                    List<SessionAgent> sessionAgents = sessionAgentMapper.findBySessionId(session.getId());
                    return buildSessionResponse(session, sessionAgents);
                })
                .collect(Collectors.toList());
    }

    /**
     * 添加代理到会话
     * 
     * @param sessionId 会话ID
     * @param agentId 代理ID
     * @throws SessionNotFoundException 如果会话不存在
     * @throws AgentNotFoundException 如果代理不存在
     * @throws IllegalStateException 如果代理已在会话中
     */
    @Transactional
    public void addAgentToSession(Long sessionId, Long agentId) {
        // 验证会话存在
        BrainstormSession session = getSessionById(sessionId);
        
        // 验证代理存在
        Agent agent = agentMapper.selectById(agentId);
        if (agent == null) {
            throw new AgentNotFoundException("代理不存在: " + agentId);
        }
        
        // 检查代理是否已在会话中
        SessionAgent existingSessionAgent = sessionAgentMapper.findBySessionIdAndAgentId(sessionId, agentId);
        if (existingSessionAgent != null) {
            throw new IllegalStateException("代理已在会话中: " + agentId);
        }
        
        // 添加代理到会话
        SessionAgent sessionAgent = new SessionAgent(sessionId, agentId);
        sessionAgentMapper.insert(sessionAgent);
    }

    /**
     * 从会话中移除代理
     * 
     * @param sessionId 会话ID
     * @param agentId 代理ID
     * @throws SessionNotFoundException 如果会话不存在
     * @throws IllegalStateException 如果代理不在会话中
     */
    @Transactional
    public void removeAgentFromSession(Long sessionId, Long agentId) {
        // 验证会话存在
        getSessionById(sessionId);
        
        // 检查代理是否在会话中
        SessionAgent sessionAgent = sessionAgentMapper.findBySessionIdAndAgentId(sessionId, agentId);
        if (sessionAgent == null) {
            throw new IllegalStateException("代理不在会话中: " + agentId);
        }
        
        // 软删除代理（标记为已删除）
        sessionAgent.remove();
        sessionAgentMapper.updateById(sessionAgent);
    }

    // 私有辅助方法

    /**
     * 验证创建会话请求
     */
    private void validateCreateSessionRequest(CreateSessionRequest request) {
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new ValidationException("会话标题不能为空");
        }
        if (request.getAgentIds() == null || request.getAgentIds().isEmpty()) {
            throw new ValidationException("必须选择至少一个AI代理参与会话");
        }
        if (request.getAgentIds().size() > 10) {
            throw new ValidationException("参与会话的代理数量不能超过10个");
        }
    }

    /**
     * 验证代理是否存在且属于用户
     */
    private void validateAgentsExistAndBelongToUser(Long userId, List<Long> agentIds) {
        for (Long agentId : agentIds) {
            Agent agent = agentMapper.selectById(agentId);
            if (agent == null) {
                throw new AgentNotFoundException("代理不存在: " + agentId);
            }
            if (!agent.getUserId().equals(userId)) {
                throw new ValidationException("代理不属于当前用户: " + agentId);
            }
            if (!"ACTIVE".equals(agent.getStatus())) {
                throw new ValidationException("代理状态不可用: " + agentId);
            }
        }
    }

    /**
     * 初始化会话的三个阶段
     */
    private void initializePhases(Long sessionId) {
        PhaseType[] phaseTypes = {PhaseType.IDEA_GENERATION, PhaseType.FEASIBILITY_ANALYSIS, PhaseType.DRAWBACK_DISCUSSION};
        
        for (PhaseType phaseType : phaseTypes) {
            Phase phase = new Phase(sessionId, phaseType);
            phaseMapper.insert(phase);
        }
    }

    /**
     * 构建会话响应
     */
    private SessionResponse buildSessionResponse(BrainstormSession session, List<SessionAgent> sessionAgents) {
        SessionResponse response = new SessionResponse();
        response.setId(session.getId());
        response.setUserId(session.getUserId());
        response.setTitle(session.getTitle());
        response.setDescription(session.getDescription());
        response.setTopic(session.getTopic());
        response.setStatus(session.getStatus());
        response.setCurrentPhase(session.getCurrentPhase());
        response.setCreatedAt(session.getCreatedAt());
        response.setUpdatedAt(session.getUpdatedAt());
        
        // 构建代理信息
        List<SessionResponse.SessionAgentInfo> agentInfos = sessionAgents.stream()
                .map(this::buildSessionAgentInfo)
                .collect(Collectors.toList());
        response.setAgents(agentInfos);
        
        return response;
    }

    /**
     * 构建会话代理信息
     */
    private SessionResponse.SessionAgentInfo buildSessionAgentInfo(SessionAgent sessionAgent) {
        Agent agent = agentMapper.selectById(sessionAgent.getAgentId());
        return new SessionResponse.SessionAgentInfo(
                sessionAgent.getAgentId(),
                agent != null ? agent.getName() : "未知代理",
                agent != null ? agent.getRoleType() : "UNKNOWN",
                sessionAgent.getStatus().name(),
                sessionAgent.getJoinedAt()
        );
    }

    /**
     * 构建阶段信息
     */
    private SessionStatusResponse.PhaseInfo buildPhaseInfo(Phase phase) {
        SessionStatusResponse.PhaseInfo phaseInfo = new SessionStatusResponse.PhaseInfo(
                phase.getPhaseType(), phase.getStatus());
        phaseInfo.setSummary(phase.getSummary());
        phaseInfo.setStartedAt(phase.getStartedAt());
        phaseInfo.setCompletedAt(phase.getCompletedAt());
        
        // 获取响应统计
        Long totalResponses = agentResponseMapper.countByPhaseId(phase.getId());
        Long successfulResponses = agentResponseMapper.countByPhaseIdAndStatus(phase.getId(), com.yiqi.entity.AgentResponse.STATUS_SUCCESS);
        
        phaseInfo.setResponseCount(totalResponses.intValue());
        phaseInfo.setSuccessfulResponseCount(successfulResponses.intValue());
        
        return phaseInfo;
    }

    /**
     * 验证会话所有权
     * 
     * @param sessionId 会话ID
     * @param userId 用户ID
     * @throws SessionNotFoundException 如果会话不存在
     * @throws IllegalStateException 如果用户无权访问该会话
     */
    public void validateSessionOwnership(Long sessionId, Long userId) {
        BrainstormSession session = getSessionById(sessionId);
        if (!session.getUserId().equals(userId)) {
            throw new IllegalStateException("用户无权访问该会话: " + sessionId);
        }
    }

    /**
     * 根据ID获取会话（公共方法）
     * 
     * @param sessionId 会话ID
     * @return 会话实体
     * @throws SessionNotFoundException 如果会话不存在
     */
    public BrainstormSession getSessionById(Long sessionId) {
        BrainstormSession session = sessionMapper.selectById(sessionId);
        if (session == null) {
            throw new SessionNotFoundException("会话不存在: " + sessionId);
        }
        return session;
    }

    /**
     * 获取会话的代理列表
     * 
     * @param sessionId 会话ID
     * @return 代理列表
     * @throws SessionNotFoundException 如果会话不存在
     */
    public List<Agent> getSessionAgents(Long sessionId) {
        // 验证会话存在
        getSessionById(sessionId);
        
        // 获取会话代理关联
        List<SessionAgent> sessionAgents = sessionAgentMapper.findActiveAgentsBySessionId(sessionId);
        
        // 获取代理详情
        List<Long> agentIds = sessionAgents.stream()
                .map(SessionAgent::getAgentId)
                .collect(Collectors.toList());
        
        if (agentIds.isEmpty()) {
            return new ArrayList<>();
        }
        
        return agentMapper.findByIds(agentIds);
    }

    /**
     * 计算会话进度百分比
     */
    private Integer calculateProgressPercentage(List<Phase> phases) {
        if (phases.isEmpty()) {
            return 0;
        }
        
        int totalPhases = phases.size();
        int completedPhases = 0;
        
        for (Phase phase : phases) {
            if (phase.getStatus() == PhaseStatus.COMPLETED) {
                completedPhases++;
            } else if (phase.getStatus() == PhaseStatus.APPROVED) {
                completedPhases++; // 已通过的阶段也算完成
            }
        }
        
        return (completedPhases * 100) / totalPhases;
    }
}
