package com.yiqi.service;

import com.yiqi.entity.*;
import com.yiqi.enums.*;
import com.yiqi.exception.*;
import com.yiqi.mapper.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 阶段服务类
 * 管理头脑风暴的三阶段流程控制
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Service
public class PhaseService {

    @Autowired
    private PhaseMapper phaseMapper;

    @Autowired
    private BrainstormSessionMapper sessionMapper;

    @Autowired
    private AgentResponseMapper agentResponseMapper;

    @Autowired
    private SessionAgentMapper sessionAgentMapper;

    /**
     * 开始指定阶段
     * 
     * @param sessionId 会话ID
     * @param phaseType 阶段类型
     * @throws SessionNotFoundException 如果会话不存在
     * @throws PhaseNotFoundException 如果阶段不存在
     * @throws IllegalStateException 如果阶段状态不允许开始
     */
    @Transactional
    public void startPhase(Long sessionId, PhaseType phaseType) {
        // 验证会话存在
        BrainstormSession session = getSessionById(sessionId);
        
        // 获取阶段
        Phase phase = phaseMapper.findBySessionIdAndPhaseType(sessionId, phaseType);
        if (phase == null) {
            throw new PhaseNotFoundException("阶段不存在: " + phaseType);
        }
        
        // 检查阶段是否可以开始
        if (!phase.canStart()) {
            throw new IllegalStateException("阶段当前状态不允许开始: " + phase.getStatus());
        }
        
        // 检查前置阶段是否已完成（除了第一个阶段）
        if (!phaseType.isFirst()) {
            PhaseType previousPhaseType = phaseType.getPrevious();
            Phase previousPhase = phaseMapper.findBySessionIdAndPhaseType(sessionId, previousPhaseType);
            if (previousPhase == null || previousPhase.getStatus() != PhaseStatus.APPROVED) {
                throw new IllegalStateException("前置阶段未完成，无法开始当前阶段");
            }
        }
        
        // 开始阶段
        phase.start();
        phaseMapper.updateById(phase);
        
        // 更新会话的当前阶段
        session.setCurrentPhase(phaseType);
        sessionMapper.updateById(session);
        
        // 为所有活跃代理创建响应记录
        createAgentResponseRecords(phase.getId(), sessionId);
    }

    /**
     * 提交阶段审核
     * 
     * @param sessionId 会话ID
     * @param phaseType 阶段类型
     * @param summary 阶段总结
     * @throws SessionNotFoundException 如果会话不存在
     * @throws PhaseNotFoundException 如果阶段不存在
     * @throws IllegalStateException 如果阶段状态不允许提交审核
     */
    @Transactional
    public void submitPhaseForApproval(Long sessionId, PhaseType phaseType, String summary) {
        // 验证会话存在
        getSessionById(sessionId);
        
        // 获取阶段
        Phase phase = phaseMapper.findBySessionIdAndPhaseType(sessionId, phaseType);
        if (phase == null) {
            throw new PhaseNotFoundException("阶段不存在: " + phaseType);
        }
        
        // 检查阶段是否可以提交审核
        if (!phase.canSubmitForApproval()) {
            throw new IllegalStateException("阶段当前状态不允许提交审核: " + phase.getStatus());
        }
        
        // 检查是否有足够的成功响应
        Long successfulResponses = agentResponseMapper.countByPhaseIdAndStatus(phase.getId(), AgentResponse.STATUS_SUCCESS);
        if (successfulResponses == 0) {
            throw new IllegalStateException("阶段没有成功的代理响应，无法提交审核");
        }
        
        // 提交审核
        phase.submitForApproval(summary);
        phaseMapper.updateById(phase);
    }

    /**
     * 审核通过阶段
     * 
     * @param sessionId 会话ID
     * @param phaseType 阶段类型
     * @throws SessionNotFoundException 如果会话不存在
     * @throws PhaseNotFoundException 如果阶段不存在
     * @throws IllegalStateException 如果阶段状态不允许审核
     */
    @Transactional
    public void approvePhase(Long sessionId, PhaseType phaseType) {
        // 验证会话存在
        BrainstormSession session = getSessionById(sessionId);
        
        // 获取阶段
        Phase phase = phaseMapper.findBySessionIdAndPhaseType(sessionId, phaseType);
        if (phase == null) {
            throw new PhaseNotFoundException("阶段不存在: " + phaseType);
        }
        
        // 检查阶段是否可以审核
        if (!phase.canReview()) {
            throw new IllegalStateException("阶段当前状态不允许审核: " + phase.getStatus());
        }
        
        // 审核通过
        phase.approve();
        phaseMapper.updateById(phase);
        
        // 检查是否为最后阶段
        if (phaseType.isLast()) {
            // 完成整个会话
            session.complete();
            sessionMapper.updateById(session);
            
            // 标记最后阶段为完成
            phase.complete();
            phaseMapper.updateById(phase);
        } else {
            // 准备下一阶段
            PhaseType nextPhaseType = phaseType.getNext();
            if (nextPhaseType != null) {
                // 自动开始下一阶段
                startPhase(sessionId, nextPhaseType);
            }
        }
    }

    /**
     * 审核拒绝阶段
     * 
     * @param sessionId 会话ID
     * @param phaseType 阶段类型
     * @throws SessionNotFoundException 如果会话不存在
     * @throws PhaseNotFoundException 如果阶段不存在
     * @throws IllegalStateException 如果阶段状态不允许审核
     */
    @Transactional
    public void rejectPhase(Long sessionId, PhaseType phaseType) {
        // 验证会话存在
        getSessionById(sessionId);
        
        // 获取阶段
        Phase phase = phaseMapper.findBySessionIdAndPhaseType(sessionId, phaseType);
        if (phase == null) {
            throw new PhaseNotFoundException("阶段不存在: " + phaseType);
        }
        
        // 检查阶段是否可以审核
        if (!phase.canReview()) {
            throw new IllegalStateException("阶段当前状态不允许审核: " + phase.getStatus());
        }
        
        // 审核拒绝
        phase.reject();
        phaseMapper.updateById(phase);
        
        // 清除该阶段的所有代理响应，准备重新执行
        clearPhaseResponses(phase.getId());
    }

    /**
     * 重新执行阶段
     * 
     * @param sessionId 会话ID
     * @param phaseType 阶段类型
     * @throws SessionNotFoundException 如果会话不存在
     * @throws PhaseNotFoundException 如果阶段不存在
     * @throws IllegalStateException 如果阶段状态不允许重新执行
     */
    @Transactional
    public void retryPhase(Long sessionId, PhaseType phaseType) {
        // 验证会话存在
        getSessionById(sessionId);
        
        // 获取阶段
        Phase phase = phaseMapper.findBySessionIdAndPhaseType(sessionId, phaseType);
        if (phase == null) {
            throw new PhaseNotFoundException("阶段不存在: " + phaseType);
        }
        
        // 检查阶段是否可以重新执行
        if (phase.getStatus() != PhaseStatus.REJECTED) {
            throw new IllegalStateException("只有被拒绝的阶段才能重新执行: " + phase.getStatus());
        }
        
        // 重置阶段状态
        phase.reset();
        phaseMapper.updateById(phase);
        
        // 重新开始阶段
        startPhase(sessionId, phaseType);
    }

    /**
     * 获取阶段详情
     * 
     * @param sessionId 会话ID
     * @param phaseType 阶段类型
     * @return 阶段实体
     * @throws SessionNotFoundException 如果会话不存在
     * @throws PhaseNotFoundException 如果阶段不存在
     */
    public Phase getPhase(Long sessionId, PhaseType phaseType) {
        // 验证会话存在
        getSessionById(sessionId);
        
        // 获取阶段
        Phase phase = phaseMapper.findBySessionIdAndPhaseType(sessionId, phaseType);
        if (phase == null) {
            throw new PhaseNotFoundException("阶段不存在: " + phaseType);
        }
        
        return phase;
    }

    /**
     * 获取会话的所有阶段
     * 
     * @param sessionId 会话ID
     * @return 阶段列表
     * @throws SessionNotFoundException 如果会话不存在
     */
    public List<Phase> getSessionPhases(Long sessionId) {
        // 验证会话存在
        getSessionById(sessionId);
        
        return phaseMapper.findBySessionId(sessionId);
    }

    /**
     * 获取当前进行中的阶段
     * 
     * @param sessionId 会话ID
     * @return 当前阶段，如果没有则返回null
     * @throws SessionNotFoundException 如果会话不存在
     */
    public Phase getCurrentPhase(Long sessionId) {
        // 验证会话存在
        getSessionById(sessionId);
        
        return phaseMapper.findCurrentPhaseBySessionId(sessionId);
    }

    /**
     * 获取等待审核的阶段
     * 
     * @param sessionId 会话ID
     * @return 等待审核的阶段列表
     * @throws SessionNotFoundException 如果会话不存在
     */
    public List<Phase> getPendingApprovalPhases(Long sessionId) {
        // 验证会话存在
        getSessionById(sessionId);
        
        return phaseMapper.findPendingApprovalPhasesBySessionId(sessionId);
    }

    /**
     * 检查阶段是否可以进入下一步
     * 
     * @param sessionId 会话ID
     * @param phaseType 阶段类型
     * @return true如果可以进入下一步
     */
    public boolean canProceedToNext(Long sessionId, PhaseType phaseType) {
        Phase phase = phaseMapper.findBySessionIdAndPhaseType(sessionId, phaseType);
        if (phase == null) {
            return false;
        }
        
        return phase.getStatus() == PhaseStatus.APPROVED || phase.getStatus() == PhaseStatus.COMPLETED;
    }

    /**
     * 获取阶段进度统计
     * 
     * @param sessionId 会话ID
     * @return 阶段进度统计
     */
    public PhaseMapper.PhaseProgressStats getPhaseProgressStats(Long sessionId) {
        // 验证会话存在
        getSessionById(sessionId);
        
        return phaseMapper.getPhaseProgressStats(sessionId);
    }

    // 私有辅助方法

    /**
     * 根据ID获取会话
     */
    private BrainstormSession getSessionById(Long sessionId) {
        BrainstormSession session = sessionMapper.selectById(sessionId);
        if (session == null) {
            throw new SessionNotFoundException("会话不存在: " + sessionId);
        }
        return session;
    }

    /**
     * 为阶段创建代理响应记录
     */
    private void createAgentResponseRecords(Long phaseId, Long sessionId) {
        List<SessionAgent> activeAgents = sessionAgentMapper.findActiveAgentsBySessionId(sessionId);
        
        for (SessionAgent sessionAgent : activeAgents) {
            // 检查是否已存在响应记录
            AgentResponse existingResponse = agentResponseMapper.findByPhaseIdAndAgentId(phaseId, sessionAgent.getAgentId());
            if (existingResponse == null) {
                AgentResponse response = new AgentResponse(phaseId, sessionAgent.getAgentId());
                agentResponseMapper.insert(response);
            }
        }
    }

    /**
     * 清除阶段的所有响应记录
     */
    private void clearPhaseResponses(Long phaseId) {
        List<AgentResponse> responses = agentResponseMapper.findByPhaseId(phaseId);
        for (AgentResponse response : responses) {
            agentResponseMapper.deleteById(response.getId());
        }
    }
}