package com.yiqi.service;

import com.yiqi.dto.ai.AgentInferenceResponse;
import com.yiqi.dto.ai.ParallelInferenceResult;
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

    @Autowired
    private AIInferenceService aiInferenceService;

    @Autowired
    private AgentService agentService;

    /**
     * 执行创意生成阶段
     * 
     * @param sessionId 会话ID
     * @param topic 头脑风暴主题
     * @throws SessionNotFoundException 如果会话不存在
     * @throws PhaseNotFoundException 如果阶段不存在
     * @throws IllegalStateException 如果阶段状态不允许执行
     */
    @Transactional
    public void executeIdeaGenerationPhase(Long sessionId, String topic) {
        // 验证会话存在
        BrainstormSession session = getSessionById(sessionId);
        
        // 获取创意生成阶段
        Phase phase = phaseMapper.findBySessionIdAndPhaseType(sessionId, PhaseType.IDEA_GENERATION);
        if (phase == null) {
            throw new PhaseNotFoundException("创意生成阶段不存在");
        }
        
        // 检查阶段是否正在进行
        if (!phase.isInProgress()) {
            throw new IllegalStateException("创意生成阶段当前状态不允许执行: " + phase.getStatus());
        }
        
        // 获取会话的活跃代理
        List<SessionAgent> sessionAgents = sessionAgentMapper.findActiveAgentsBySessionId(sessionId);
        if (sessionAgents.isEmpty()) {
            throw new IllegalStateException("会话没有活跃的代理");
        }
        
        // 获取代理详细信息
        List<Agent> agents = new ArrayList<>();
        for (SessionAgent sessionAgent : sessionAgents) {
            Agent agent = agentService.getAgentById(sessionAgent.getAgentId());
            if (agent != null) {
                agents.add(agent);
            }
        }
        
        if (agents.isEmpty()) {
            throw new IllegalStateException("无法获取有效的代理信息");
        }
        
        // 构建会话上下文
        String sessionContext = buildSessionContext(session, topic);
        
        try {
            // 执行并行推理
            ParallelInferenceResult result = aiInferenceService.processParallelInference(
                agents, topic, sessionContext, sessionId.toString(), PhaseType.IDEA_GENERATION
            );
            
            // 保存代理响应结果
            saveAgentResponses(phase.getId(), result);
            
            // 如果有成功的响应，自动提交审核
            if (result.hasSuccessfulResponses()) {
                String summary = result.getPhaseSummary() != null ? 
                    result.getPhaseSummary() : 
                    generateDefaultSummary(result, PhaseType.IDEA_GENERATION);
                
                submitPhaseForApproval(sessionId, PhaseType.IDEA_GENERATION, summary);
            } else {
                // 如果没有成功的响应，标记阶段失败
                throw new IllegalStateException("创意生成阶段没有成功的代理响应");
            }
            
        } catch (Exception e) {
            // 处理执行失败的情况
            throw new IllegalStateException("创意生成阶段执行失败: " + e.getMessage(), e);
        }
    }

    /**
     * 执行技术可行性分析阶段
     * 
     * @param sessionId 会话ID
     * @param topic 头脑风暴主题
     * @throws SessionNotFoundException 如果会话不存在
     * @throws PhaseNotFoundException 如果阶段不存在
     * @throws IllegalStateException 如果阶段状态不允许执行
     */
    @Transactional
    public void executeFeasibilityAnalysisPhase(Long sessionId, String topic) {
        // 验证会话存在
        BrainstormSession session = getSessionById(sessionId);
        
        // 获取技术可行性分析阶段
        Phase phase = phaseMapper.findBySessionIdAndPhaseType(sessionId, PhaseType.FEASIBILITY_ANALYSIS);
        if (phase == null) {
            throw new PhaseNotFoundException("技术可行性分析阶段不存在");
        }
        
        // 检查阶段是否正在进行
        if (!phase.isInProgress()) {
            throw new IllegalStateException("技术可行性分析阶段当前状态不允许执行: " + phase.getStatus());
        }
        
        // 获取会话的活跃代理
        List<SessionAgent> sessionAgents = sessionAgentMapper.findActiveAgentsBySessionId(sessionId);
        if (sessionAgents.isEmpty()) {
            throw new IllegalStateException("会话没有活跃的代理");
        }
        
        // 获取代理详细信息
        List<Agent> agents = new ArrayList<>();
        for (SessionAgent sessionAgent : sessionAgents) {
            Agent agent = agentService.getAgentById(sessionAgent.getAgentId());
            if (agent != null) {
                agents.add(agent);
            }
        }
        
        if (agents.isEmpty()) {
            throw new IllegalStateException("无法获取有效的代理信息");
        }
        
        // 获取前面阶段的结果
        String previousResults = getPreviousPhaseResults(sessionId, PhaseType.FEASIBILITY_ANALYSIS);
        
        // 构建会话上下文，包含前面阶段的结果
        String sessionContext = buildSessionContextWithPreviousResults(session, topic, previousResults);
        
        try {
            // 执行并行推理
            ParallelInferenceResult result = aiInferenceService.processParallelInference(
                agents, topic, sessionContext, sessionId.toString(), PhaseType.FEASIBILITY_ANALYSIS
            );
            
            // 保存代理响应结果
            saveAgentResponses(phase.getId(), result);
            
            // 如果有成功的响应，自动提交审核
            if (result.hasSuccessfulResponses()) {
                String summary = result.getPhaseSummary() != null ? 
                    result.getPhaseSummary() : 
                    generateDefaultSummary(result, PhaseType.FEASIBILITY_ANALYSIS);
                
                submitPhaseForApproval(sessionId, PhaseType.FEASIBILITY_ANALYSIS, summary);
            } else {
                // 如果没有成功的响应，标记阶段失败
                throw new IllegalStateException("技术可行性分析阶段没有成功的代理响应");
            }
            
        } catch (Exception e) {
            // 处理执行失败的情况
            throw new IllegalStateException("技术可行性分析阶段执行失败: " + e.getMessage(), e);
        }
    }

    /**
     * 执行缺点讨论阶段
     * 
     * @param sessionId 会话ID
     * @param topic 头脑风暴主题
     * @throws SessionNotFoundException 如果会话不存在
     * @throws PhaseNotFoundException 如果阶段不存在
     * @throws IllegalStateException 如果阶段状态不允许执行
     */
    @Transactional
    public void executeDrawbackDiscussionPhase(Long sessionId, String topic) {
        // 验证会话存在
        BrainstormSession session = getSessionById(sessionId);
        
        // 获取缺点讨论阶段
        Phase phase = phaseMapper.findBySessionIdAndPhaseType(sessionId, PhaseType.DRAWBACK_DISCUSSION);
        if (phase == null) {
            throw new PhaseNotFoundException("缺点讨论阶段不存在");
        }
        
        // 检查阶段是否正在进行
        if (!phase.isInProgress()) {
            throw new IllegalStateException("缺点讨论阶段当前状态不允许执行: " + phase.getStatus());
        }
        
        // 获取会话的活跃代理
        List<SessionAgent> sessionAgents = sessionAgentMapper.findActiveAgentsBySessionId(sessionId);
        if (sessionAgents.isEmpty()) {
            throw new IllegalStateException("会话没有活跃的代理");
        }
        
        // 获取代理详细信息
        List<Agent> agents = new ArrayList<>();
        for (SessionAgent sessionAgent : sessionAgents) {
            Agent agent = agentService.getAgentById(sessionAgent.getAgentId());
            if (agent != null) {
                agents.add(agent);
            }
        }
        
        if (agents.isEmpty()) {
            throw new IllegalStateException("无法获取有效的代理信息");
        }
        
        // 获取前面阶段的结果
        String previousResults = getPreviousPhaseResults(sessionId, PhaseType.DRAWBACK_DISCUSSION);
        
        // 构建会话上下文，包含前面阶段的结果
        String sessionContext = buildSessionContextWithPreviousResults(session, topic, previousResults);
        
        try {
            // 执行并行推理
            ParallelInferenceResult result = aiInferenceService.processParallelInference(
                agents, topic, sessionContext, sessionId.toString(), PhaseType.DRAWBACK_DISCUSSION
            );
            
            // 保存代理响应结果
            saveAgentResponses(phase.getId(), result);
            
            // 如果有成功的响应，自动提交审核
            if (result.hasSuccessfulResponses()) {
                String summary = result.getPhaseSummary() != null ? 
                    result.getPhaseSummary() : 
                    generateDefaultSummary(result, PhaseType.DRAWBACK_DISCUSSION);
                
                submitPhaseForApproval(sessionId, PhaseType.DRAWBACK_DISCUSSION, summary);
            } else {
                // 如果没有成功的响应，标记阶段失败
                throw new IllegalStateException("缺点讨论阶段没有成功的代理响应");
            }
            
        } catch (Exception e) {
            // 处理执行失败的情况
            throw new IllegalStateException("缺点讨论阶段执行失败: " + e.getMessage(), e);
        }
    }

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
            if (previousPhase == null || 
                (previousPhase.getStatus() != PhaseStatus.APPROVED && 
                 previousPhase.getStatus() != PhaseStatus.COMPLETED)) {
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
        
        // 如果是创意生成阶段，需要额外的处理
        if (phaseType == PhaseType.IDEA_GENERATION) {
            // 创意生成阶段需要在启动后立即执行推理
            // 这里只是标记阶段已开始，实际的推理执行需要调用executeIdeaGenerationPhase方法
        }
    }

    /**
     * 执行指定阶段的推理处理
     * 
     * @param sessionId 会话ID
     * @param phaseType 阶段类型
     * @param topic 头脑风暴主题
     * @throws SessionNotFoundException 如果会话不存在
     * @throws PhaseNotFoundException 如果阶段不存在
     * @throws IllegalStateException 如果阶段状态不允许执行
     */
    @Transactional
    public void executePhase(Long sessionId, PhaseType phaseType, String topic) {
        switch (phaseType) {
            case IDEA_GENERATION:
                executeIdeaGenerationPhase(sessionId, topic);
                break;
            case FEASIBILITY_ANALYSIS:
                executeFeasibilityAnalysisPhase(sessionId, topic);
                break;
            case DRAWBACK_DISCUSSION:
                executeDrawbackDiscussionPhase(sessionId, topic);
                break;
            default:
                throw new IllegalArgumentException("不支持的阶段类型: " + phaseType);
        }
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
        
        // 查询该阶段下所有状态为SUCCESS的agent响应记录
        List<AgentResponse> successfulResponses = agentResponseMapper.findSuccessfulResponsesByPhaseId(phase.getId());
        
        // 将所有agent成功生成的content内容收集并存储在phases表的summary字段当中
        if (!successfulResponses.isEmpty()) {
            StringBuilder summary = new StringBuilder();
            summary.append("=== ").append(phaseType.getDisplayName()).append("阶段所有代理响应 ===\n\n");
            
            // 按顺序添加每个成功代理的响应内容
            for (AgentResponse response : successfulResponses) {
                // 获取代理信息
                Agent agent = agentService.getAgentById(response.getAgentId());
                if (agent != null) {
                    summary.append("【").append(agent.getRoleType()).append(" - ")
                           .append(agent.getName()).append("】\n");
                }
                summary.append(response.getContent()).append("\n\n");
            }
            
            // 更新阶段的summary字段
            phase.setSummary(summary.toString());
            phaseMapper.updateById(phase);
        }
        
        // 审核通过
        phase.approve();
        phaseMapper.updateById(phase);
        
        // 标记阶段为完成
        phase.complete();
        phaseMapper.updateById(phase);
        
        // 检查是否为最后阶段
        if (phaseType.isLast()) {
            // 完成整个会话
            session.complete();
            sessionMapper.updateById(session);
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

    /**
     * 获取阶段的代理响应结果
     * 
     * @param sessionId 会话ID
     * @param phaseType 阶段类型
     * @return 代理响应列表
     * @throws SessionNotFoundException 如果会话不存在
     * @throws PhaseNotFoundException 如果阶段不存在
     */
    public List<AgentResponse> getPhaseResponses(Long sessionId, PhaseType phaseType) {
        // 验证会话存在
        getSessionById(sessionId);
        
        // 获取阶段
        Phase phase = phaseMapper.findBySessionIdAndPhaseType(sessionId, phaseType);
        if (phase == null) {
            throw new PhaseNotFoundException("阶段不存在: " + phaseType);
        }
        
        return agentResponseMapper.findByPhaseId(phase.getId());
    }

    /**
     * 获取阶段的成功响应结果
     * 
     * @param sessionId 会话ID
     * @param phaseType 阶段类型
     * @return 成功的代理响应列表
     * @throws SessionNotFoundException 如果会话不存在
     * @throws PhaseNotFoundException 如果阶段不存在
     */
    public List<AgentResponse> getPhaseSuccessfulResponses(Long sessionId, PhaseType phaseType) {
        // 验证会话存在
        getSessionById(sessionId);
        
        // 获取阶段
        Phase phase = phaseMapper.findBySessionIdAndPhaseType(sessionId, phaseType);
        if (phase == null) {
            throw new PhaseNotFoundException("阶段不存在: " + phaseType);
        }
        
        return agentResponseMapper.findSuccessfulResponsesByPhaseId(phase.getId());
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

    /**
     * 构建会话上下文
     */
    private String buildSessionContext(BrainstormSession session, String topic) {
        StringBuilder context = new StringBuilder();
        context.append("会话标题: ").append(session.getTitle()).append("\n");
        if (session.getDescription() != null && !session.getDescription().trim().isEmpty()) {
            context.append("会话描述: ").append(session.getDescription()).append("\n");
        }
        context.append("讨论主题: ").append(topic).append("\n");
        context.append("会话创建时间: ").append(session.getCreatedAt()).append("\n");
        return context.toString();
    }

    /**
     * 保存代理响应结果
     */
    private void saveAgentResponses(Long phaseId, ParallelInferenceResult result) {
        for (AgentInferenceResponse response : result.getAgentResponses()) {
            // 查找现有的响应记录
            AgentResponse agentResponse = agentResponseMapper.findByPhaseIdAndAgentId(
                phaseId, response.getAgentId()
            );
            
            if (agentResponse != null) {
                // 更新现有记录
                if (response.isSuccess()) {
                    agentResponse.markSuccess(response.getContent(), response.getProcessingTimeMs());
                } else if ("TIMEOUT".equals(response.getStatus())) {
                    agentResponse.markTimeout(response.getProcessingTimeMs());
                } else {
                    agentResponse.markFailed(response.getErrorMessage(), response.getProcessingTimeMs());
                }
                agentResponseMapper.updateById(agentResponse);
            } else {
                // 创建新记录
                agentResponse = new AgentResponse(phaseId, response.getAgentId());
                if (response.isSuccess()) {
                    agentResponse.markSuccess(response.getContent(), response.getProcessingTimeMs());
                } else if ("TIMEOUT".equals(response.getStatus())) {
                    agentResponse.markTimeout(response.getProcessingTimeMs());
                } else {
                    agentResponse.markFailed(response.getErrorMessage(), response.getProcessingTimeMs());
                }
                agentResponseMapper.insert(agentResponse);
            }
        }
    }

    /**
     * 生成默认阶段总结
     */
    private String generateDefaultSummary(ParallelInferenceResult result, PhaseType phaseType) {
        StringBuilder summary = new StringBuilder();
        
        // 添加标题
        summary.append("=== ").append(phaseType.getDisplayName()).append("阶段所有代理响应 ===\n\n");
        
        // 按顺序添加每个成功代理的响应内容
        if (result.hasSuccessfulResponses()) {
            for (AgentInferenceResponse response : result.getSuccessfulResponses()) {
                summary.append("【").append(response.getRoleType()).append(" - ")
                       .append(response.getAgentName()).append("】\n");
                summary.append(response.getContent()).append("\n\n");
            }
        } else {
            summary.append("本阶段没有成功的代理响应。");
        }
        
        return summary.toString();
    }

    /**
     * 获取前面阶段的结果
     * 
     * @param sessionId 会话ID
     * @param currentPhaseType 当前阶段类型
     * @return 前面阶段的结果文本
     */
    private String getPreviousPhaseResults(Long sessionId, PhaseType currentPhaseType) {
        StringBuilder results = new StringBuilder();
        
        // 根据当前阶段获取需要的前面阶段
        List<PhaseType> previousPhases = new ArrayList<>();
        
        if (currentPhaseType == PhaseType.FEASIBILITY_ANALYSIS) {
            previousPhases.add(PhaseType.IDEA_GENERATION);
        } else if (currentPhaseType == PhaseType.DRAWBACK_DISCUSSION) {
            previousPhases.add(PhaseType.IDEA_GENERATION);
            previousPhases.add(PhaseType.FEASIBILITY_ANALYSIS);
        }
        
        for (PhaseType phaseType : previousPhases) {
            Phase phase = phaseMapper.findBySessionIdAndPhaseType(sessionId, phaseType);
            if (phase != null && phase.isCompleted()) {
                results.append("=== ").append(phaseType.getDisplayName()).append("阶段结果 ===\n");
                
                // 添加阶段总结
                if (phase.getSummary() != null && !phase.getSummary().trim().isEmpty()) {
                    results.append("阶段总结：\n").append(phase.getSummary()).append("\n\n");
                }
                
                // 添加成功的代理响应
                List<AgentResponse> responses = agentResponseMapper.findSuccessfulResponsesByPhaseId(phase.getId());
                for (AgentResponse response : responses) {
                    // 获取代理信息
                    Agent agent = agentService.getAgentById(response.getAgentId());
                    if (agent != null) {
                        results.append("【").append(agent.getRoleType()).append(" - ")
                               .append(agent.getName()).append("】\n");
                        results.append(response.getContent()).append("\n\n");
                    }
                }
                
                results.append("\n");
            }
        }
        
        return results.toString();
    }

    /**
     * 构建包含前面阶段结果的会话上下文
     * 
     * @param session 会话信息
     * @param topic 主题
     * @param previousResults 前面阶段的结果
     * @return 会话上下文
     */
    private String buildSessionContextWithPreviousResults(BrainstormSession session, String topic, String previousResults) {
        StringBuilder context = new StringBuilder();
        context.append("会话标题: ").append(session.getTitle()).append("\n");
        if (session.getDescription() != null && !session.getDescription().trim().isEmpty()) {
            context.append("会话描述: ").append(session.getDescription()).append("\n");
        }
        context.append("讨论主题: ").append(topic).append("\n");
        context.append("会话创建时间: ").append(session.getCreatedAt()).append("\n\n");
        
        if (previousResults != null && !previousResults.trim().isEmpty()) {
            context.append("前面阶段的讨论结果：\n").append(previousResults);
        }
        
        return context.toString();
    }
}
