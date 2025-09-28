package com.yiqi.controller;

import com.yiqi.dto.ai.ParallelInferenceResult;
import com.yiqi.dto.parallel.*;
import com.yiqi.entity.Agent;
import com.yiqi.entity.BrainstormSession;
import com.yiqi.enums.PhaseType;
import com.yiqi.service.AIInferenceService;
import com.yiqi.service.AgentService;
import com.yiqi.service.SessionService;
import com.yiqi.service.InferenceStatusService;
import com.yiqi.service.QiniuAIService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.springframework.http.MediaType;
import org.springframework.web.context.request.async.DeferredResult;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;

/**
 * 并行推理控制器
 * 提供多代理并行推理的REST API接口
 */
@RestController
@RequestMapping("/api/parallel-inference")
@Tag(name = "并行推理", description = "多代理并行推理相关API")
public class ParallelInferenceController {
    
    private static final Logger logger = LoggerFactory.getLogger(ParallelInferenceController.class);
    
    @Autowired
    private AIInferenceService aiInferenceService;
    
    @Autowired
    private SessionService sessionService;
    
    @Autowired
    private AgentService agentService;
    
    @Autowired
    private InferenceStatusService inferenceStatusService;
    
    @Autowired
    private QiniuAIService qiniuAIService;

    /**
     * 触发会话阶段的并行推理
     */
    @PostMapping("/sessions/{sessionId}/phases/{phaseType}/execute")
    @Operation(summary = "执行会话阶段推理", description = "触发指定会话和阶段的多代理并行推理")
    public Object executeSessionPhaseInference(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            @Parameter(description = "阶段类型") @PathVariable PhaseType phaseType,
            @Valid @RequestBody SessionPhaseInferenceRequest request,
            @RequestParam(defaultValue = "false") boolean stream,
            Authentication authentication) {
        
        if (stream) {
            // 流式输出
            logger.info("收到会话阶段流式推理请求: sessionId={}, phaseType={}", sessionId, phaseType);
            
            // 验证会话所有权
            validateSessionOwnership(sessionId, authentication);
            
            // 设置较长的超时时间（300秒）
            ResponseBodyEmitter emitter = new ResponseBodyEmitter(300000L);
            
            // 使用原子计数器跟踪完成的代理数量
            java.util.concurrent.atomic.AtomicInteger completedAgents = new java.util.concurrent.atomic.AtomicInteger(0);
            java.util.concurrent.atomic.AtomicBoolean emitterCompleted = new java.util.concurrent.atomic.AtomicBoolean(false);
            
            // 注册超时和完成的回调
            emitter.onTimeout(() -> {
                logger.warn("会话阶段流式输出超时: sessionId={}, phaseType={}", sessionId, phaseType);
                if (!emitterCompleted.getAndSet(true)) {
                    emitter.complete();
                }
            });
            
            emitter.onError((throwable) -> {
                logger.error("会话阶段流式输出错误: sessionId={}, phaseType={}", sessionId, phaseType, throwable);
                emitterCompleted.set(true);
            });
            
            emitter.onCompletion(() -> {
                logger.info("会话阶段流式输出完成: sessionId={}, phaseType={}", sessionId, phaseType);
                emitterCompleted.set(true);
            });
            
            // 在新线程中执行流式推理任务
            CompletableFuture.runAsync(() -> {
                try {
                    // 获取会话信息
                    BrainstormSession session = sessionService.getSessionById(sessionId);
                    
                    // 获取会话的活跃代理
                    List<Agent> agents = sessionService.getSessionAgents(sessionId);
                    
                    if (agents.isEmpty()) {
                        throw new IllegalStateException("会话没有配置任何代理");
                    }
                    
                    // 构建会话上下文
                    String sessionContext = buildSessionContext(session, request.getAdditionalContext());
                    
                    // 为每个代理创建流式推理请求
                    for (Agent agent : agents) {
                        // 构建系统提示词
                        String systemPrompt = phaseType.getSystemPromptTemplate()
                            .replace("{roleType}", agent.getRoleType());
                        
                        // 如果代理有自定义系统提示词，则追加
                        if (agent.getSystemPrompt() != null && !agent.getSystemPrompt().trim().isEmpty()) {
                            systemPrompt += "\n\n" + agent.getSystemPrompt();
                        }
                        
                        // 构建用户提示词
                        String finalUserPrompt = phaseType.getUserPromptTemplate()
                            .replace("{topic}", request.getUserPrompt())
                            .replace("{context}", sessionContext != null ? sessionContext : "");
                        
                        // 发送流式推理请求
                        qiniuAIService.sendStreamingInferenceRequest(
                            systemPrompt,
                            finalUserPrompt,
                            new QiniuAIService.StreamingResponseHandler() {
                                @Override
                                public void onData(String data) {
                                    // 检查emitter是否已经完成
                                    if (emitterCompleted.get()) {
                                        logger.debug("emitter已完成后收到数据，忽略: agentId={}", agent.getId());
                                        return;
                                    }
                                    
                                    try {
                                        // 发送数据片段，包含代理ID和名称
                                        String response = String.format("{\"agentId\":%d,\"agentName\":\"%s\",\"data\":%s}",
                                            agent.getId(), agent.getName(), data);
                                        emitter.send(response);
                                    } catch (IllegalStateException e) {
                                        logger.warn("发送流式数据时emitter已关闭: agentId={}", agent.getId());
                                        emitterCompleted.set(true);
                                    } catch (Exception e) {
                                        logger.error("发送流式数据失败: agentId={}", agent.getId(), e);
                                        if (!emitterCompleted.getAndSet(true)) {
                                            try {
                                                emitter.completeWithError(e);
                                            } catch (Exception ex) {
                                                logger.error("完成emitter时发生异常: agentId={}", agent.getId(), ex);
                                            }
                                        }
                                    }
                                }
                                
                                @Override
                                public void onComplete() {
                                    // 检查是否所有代理都已完成
                                    int completed = completedAgents.incrementAndGet();
                                    if (completed == agents.size() && !emitterCompleted.getAndSet(true)) {
                                        try {
                                            emitter.send("[DONE]");
                                            emitter.complete();
                                        } catch (IllegalStateException e) {
                                            logger.warn("完成流式输出时emitter已关闭: sessionId={}", sessionId);
                                        } catch (Exception e) {
                                            logger.error("完成流式输出失败: sessionId={}", sessionId, e);
                                        }
                                    }
                                }
                                
                                @Override
                                public void onError(Throwable throwable) {
                                    logger.error("代理{}流式推理处理异常", agent.getId(), throwable);
                                    // 检查是否所有代理都已完成或出错
                                    int completed = completedAgents.incrementAndGet();
                                    if (completed == agents.size() && !emitterCompleted.getAndSet(true)) {
                                        try {
                                            emitter.complete();
                                        } catch (IllegalStateException e) {
                                            logger.warn("完成emitter时emitter已关闭: sessionId={}", sessionId);
                                        } catch (Exception e) {
                                            logger.error("完成emitter时发生异常: sessionId={}", sessionId, e);
                                        }
                                    }
                                }
                            }
                        );
                    }
                    
                } catch (Exception e) {
                    logger.error("会话阶段流式推理失败: sessionId={}, phaseType={}", sessionId, phaseType, e);
                    // 确保emitter被完成
                    if (!emitterCompleted.getAndSet(true)) {
                        try {
                            emitter.completeWithError(e);
                        } catch (IllegalStateException ex) {
                            logger.warn("完成emitter时emitter已关闭: sessionId={}", sessionId);
                        } catch (Exception ex) {
                            logger.error("完成emitter时发生异常: sessionId={}", sessionId, ex);
                        }
                    }
                }
            });
            
            return emitter;
        } else {
            // 普通输出
            logger.info("收到会话阶段推理请求: sessionId={}, phaseType={}", sessionId, phaseType);
            
            // 验证会话所有权
            validateSessionOwnership(sessionId, authentication);
            
            // 创建DeferredResult，设置120秒超时时间
            DeferredResult<ResponseEntity<ParallelInferenceResult>> deferredResult = new DeferredResult<>(120000L);
            
            // 在新线程中执行推理任务
            CompletableFuture.supplyAsync(() -> {
                try {
                    // 获取会话信息
                    BrainstormSession session = sessionService.getSessionById(sessionId);
                    
                    // 获取会话的活跃代理
                    List<Agent> agents = sessionService.getSessionAgents(sessionId);
                    
                    if (agents.isEmpty()) {
                        throw new IllegalStateException("会话没有配置任何代理");
                    }
                    
                    // 构建会话上下文
                    String sessionContext = buildSessionContext(session, request.getAdditionalContext());
                    
                    // 执行并行推理
                    ParallelInferenceResult result = aiInferenceService.processParallelInference(
                        agents,
                        request.getUserPrompt(),
                        sessionContext,
                        sessionId.toString(),
                        phaseType
                    );
                    
                    logger.info("会话阶段推理完成: sessionId={}, phaseType={}, 成功率={:.2f}%", 
                               sessionId, phaseType, result.getSuccessRate() * 100);
                    
                    return ResponseEntity.ok(result);
                    
                } catch (Exception e) {
                    logger.error("会话阶段推理失败: sessionId={}, phaseType={}", sessionId, phaseType, e);
                    return ResponseEntity.status(500).<ParallelInferenceResult>body(null);
                }
            }).whenComplete((result, throwable) -> {
                if (throwable != null) {
                    logger.error("异步处理异常", throwable);
                    deferredResult.setErrorResult(throwable);
                } else {
                    deferredResult.setResult(result);
                }
            });
            
            return deferredResult;
        }
    }

    /**
     * 自定义代理并行推理
     */
    @PostMapping("/custom")
    @Operation(summary = "自定义代理并行推理", description = "使用指定的代理列表进行并行推理")
    public Object executeCustomParallelInference(
            @Valid @RequestBody CustomParallelInferenceRequest request,
            @RequestParam(defaultValue = "false") boolean stream,
            Authentication authentication) {
        
        if (stream) {
            // 流式输出
            logger.info("收到自定义流式并行推理请求: agentCount={}, phaseType={}", 
                       request.getAgentIds().size(), request.getPhaseType());
            
            // 设置较长的超时时间（300秒）
            ResponseBodyEmitter emitter = new ResponseBodyEmitter(300000L);
            
            // 使用原子计数器跟踪完成的代理数量
            java.util.concurrent.atomic.AtomicInteger completedAgents = new java.util.concurrent.atomic.AtomicInteger(0);
            java.util.concurrent.atomic.AtomicBoolean emitterCompleted = new java.util.concurrent.atomic.AtomicBoolean(false);
            
            // 注册超时和完成的回调
            emitter.onTimeout(() -> {
                logger.warn("自定义流式并行推理超时: agentCount={}, phaseType={}", 
                           request.getAgentIds().size(), request.getPhaseType());
                if (!emitterCompleted.getAndSet(true)) {
                    emitter.complete();
                }
            });
            
            emitter.onError((throwable) -> {
                logger.error("自定义流式并行推理错误: agentCount={}, phaseType={}", 
                           request.getAgentIds().size(), request.getPhaseType(), throwable);
                emitterCompleted.set(true);
            });
            
            emitter.onCompletion(() -> {
                logger.info("自定义流式并行推理完成: agentCount={}, phaseType={}", 
                           request.getAgentIds().size(), request.getPhaseType());
                emitterCompleted.set(true);
            });
            
            // 在新线程中执行流式推理任务
            CompletableFuture.runAsync(() -> {
                try {
                    // 获取指定的代理列表
                    List<Agent> agents = agentService.getAgentsByIds(request.getAgentIds());
                    
                    if (agents.isEmpty()) {
                        throw new IllegalArgumentException("未找到指定的代理");
                    }
                    
                    // 验证代理所有权
                    validateAgentsOwnership(agents, authentication);
                    
                    // 为每个代理创建流式推理请求
                    for (Agent agent : agents) {
                        // 发送流式推理请求
                        qiniuAIService.sendStreamingInferenceRequest(
                            agent.getSystemPrompt(),
                            request.getUserPrompt(),
                            new QiniuAIService.StreamingResponseHandler() {
                                @Override
                                public void onData(String data) {
                                    // 检查emitter是否已经完成
                                    if (emitterCompleted.get()) {
                                        logger.debug("emitter已完成后收到数据，忽略: agentId={}", agent.getId());
                                        return;
                                    }
                                    
                                    try {
                                        // 发送数据片段，包含代理ID和名称
                                        String response = String.format("{\"agentId\":%d,\"agentName\":\"%s\",\"data\":%s}",
                                            agent.getId(), agent.getName(), data);
                                        emitter.send(response);
                                    } catch (IllegalStateException e) {
                                        logger.warn("发送流式数据时emitter已关闭: agentId={}", agent.getId());
                                        emitterCompleted.set(true);
                                    } catch (Exception e) {
                                        logger.error("发送流式数据失败: agentId={}", agent.getId(), e);
                                        if (!emitterCompleted.getAndSet(true)) {
                                            try {
                                                emitter.completeWithError(e);
                                            } catch (Exception ex) {
                                                logger.error("完成emitter时发生异常: agentId={}", agent.getId(), ex);
                                            }
                                        }
                                    }
                                }
                                
                                @Override
                                public void onComplete() {
                                    // 检查是否所有代理都已完成
                                    int completed = completedAgents.incrementAndGet();
                                    if (completed == agents.size() && !emitterCompleted.getAndSet(true)) {
                                        try {
                                            emitter.send("[DONE]");
                                            emitter.complete();
                                        } catch (IllegalStateException e) {
                                            logger.warn("完成流式输出时emitter已关闭: agentCount={}", request.getAgentIds().size());
                                        } catch (Exception e) {
                                            logger.error("完成流式输出失败: agentCount={}", request.getAgentIds().size(), e);
                                        }
                                    }
                                }
                                
                                @Override
                                public void onError(Throwable throwable) {
                                    logger.error("代理{}流式推理处理异常", agent.getId(), throwable);
                                    // 检查是否所有代理都已完成或出错
                                    int completed = completedAgents.incrementAndGet();
                                    if (completed == agents.size() && !emitterCompleted.getAndSet(true)) {
                                        try {
                                            emitter.complete();
                                        } catch (IllegalStateException e) {
                                            logger.warn("完成emitter时emitter已关闭: agentCount={}", request.getAgentIds().size());
                                        } catch (Exception e) {
                                            logger.error("完成emitter时发生异常: agentCount={}", request.getAgentIds().size(), e);
                                        }
                                    }
                                }
                            }
                        );
                    }
                    
                } catch (Exception e) {
                    logger.error("自定义流式并行推理失败: sessionId={}", request.getSessionId(), e);
                    // 确保emitter被完成
                    if (!emitterCompleted.getAndSet(true)) {
                        try {
                            emitter.completeWithError(e);
                        } catch (IllegalStateException ex) {
                            logger.warn("完成emitter时emitter已关闭: sessionId={}", request.getSessionId());
                        } catch (Exception ex) {
                            logger.error("完成emitter时发生异常: sessionId={}", request.getSessionId(), ex);
                        }
                    }
                }
            });
            
            return emitter;
        } else {
            // 普通输出
            logger.info("收到自定义并行推理请求: agentCount={}, phaseType={}", 
                       request.getAgentIds().size(), request.getPhaseType());
            
            // 创建DeferredResult，设置120秒超时时间
            DeferredResult<ResponseEntity<ParallelInferenceResult>> deferredResult = new DeferredResult<>(120000L);
            
            // 在新线程中执行推理任务
            CompletableFuture.supplyAsync(() -> {
                try {
                    // 获取指定的代理列表
                    List<Agent> agents = agentService.getAgentsByIds(request.getAgentIds());
                    
                    if (agents.isEmpty()) {
                        throw new IllegalArgumentException("未找到指定的代理");
                    }
                    
                    // 验证代理所有权
                    validateAgentsOwnership(agents, authentication);
                    
                    // 执行并行推理
                    ParallelInferenceResult result = aiInferenceService.processParallelInference(
                        agents,
                        request.getUserPrompt(),
                        request.getSessionContext(),
                        request.getSessionId(),
                        request.getPhaseType()
                    );
                    
                    logger.info("自定义并行推理完成: sessionId={}, 成功率={:.2f}%", 
                               request.getSessionId(), result.getSuccessRate() * 100);
                    
                    return ResponseEntity.ok(result);
                    
                } catch (Exception e) {
                    logger.error("自定义并行推理失败: sessionId={}", request.getSessionId(), e);
                    return ResponseEntity.status(500).<ParallelInferenceResult>body(null);
                }
            }).whenComplete((result, throwable) -> {
                if (throwable != null) {
                    logger.error("异步处理异常", throwable);
                    deferredResult.setErrorResult(throwable);
                } else {
                    deferredResult.setResult(result);
                }
            });
            
            return deferredResult;
        }
    }

    /**
     * 获取并行推理结果详情
     */
    @GetMapping("/results/{sessionId}/{phaseType}")
    @Operation(summary = "获取推理结果详情", description = "获取指定会话和阶段的并行推理结果详情")
    public ResponseEntity<ParallelInferenceResultDetail> getInferenceResultDetail(
            @Parameter(description = "会话ID") @PathVariable String sessionId,
            @Parameter(description = "阶段类型") @PathVariable PhaseType phaseType,
            Authentication authentication) {
        
        try {
            // 验证会话所有权（如果是数字会话ID）
            if (sessionId.matches("\\d+")) {
                validateSessionOwnership(Long.parseLong(sessionId), authentication);
            }
            
            // 获取推理状态
            InferenceStatusService.SessionInferenceStatus status = inferenceStatusService.getSessionInferenceStatus(sessionId, phaseType.name());
            
            if (status == null) {
                return ResponseEntity.notFound().build();
            }
            
            // 构建详细结果
            ParallelInferenceResultDetail detail = new ParallelInferenceResultDetail();
            detail.setSessionId(sessionId);
            detail.setPhaseType(phaseType);
            detail.setStatus(status);
            
            // 如果推理已完成，获取详细结果
            if ("COMPLETED".equals(status.getStatus())) {
                // 这里可以从数据库或缓存中获取详细的推理结果
                // 暂时返回基本信息
                detail.setResultSummary("推理已完成，成功率: " + 
                    String.format("%.1f%%", status.getSuccessRate() * 100));
            }
            
            return ResponseEntity.ok(detail);
            
        } catch (Exception e) {
            logger.error("获取推理结果详情失败: sessionId={}, phaseType={}", sessionId, phaseType, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * 批量执行多阶段推理
     */
    @PostMapping("/batch/multi-phase")
    @Operation(summary = "批量多阶段推理", description = "按顺序执行多个阶段的并行推理")
    public DeferredResult<ResponseEntity<BatchInferenceResult>> executeBatchMultiPhaseInference(
            @Valid @RequestBody BatchMultiPhaseInferenceRequest request,
            Authentication authentication) {
        
        logger.info("收到批量多阶段推理请求: sessionId={}, phaseCount={}", 
                   request.getSessionId(), request.getPhases().size());
        
        // 创建DeferredResult，设置120秒超时时间
        DeferredResult<ResponseEntity<BatchInferenceResult>> deferredResult = new DeferredResult<>(120000L);
        
        // 在新线程中执行推理任务
        CompletableFuture.supplyAsync(() -> {
            try {
                // 验证会话所有权
                validateSessionOwnership(request.getSessionId(), authentication);
                
                BatchInferenceResult batchResult = new BatchInferenceResult();
                batchResult.setSessionId(request.getSessionId());
                batchResult.setStartTime(java.time.LocalDateTime.now());
                
                // 获取会话代理
                List<Agent> agents = sessionService.getSessionAgents(request.getSessionId());
                BrainstormSession session = sessionService.getSessionById(request.getSessionId());
                
                String previousResults = "";
                
                // 按顺序执行各个阶段
                for (PhaseInferenceConfig phaseConfig : request.getPhases()) {
                    logger.info("执行阶段: {}", phaseConfig.getPhaseType());
                    
                    // 构建阶段上下文
                    String phaseContext = buildPhaseContext(session, phaseConfig, previousResults);
                    
                    // 执行阶段推理
                    ParallelInferenceResult phaseResult = aiInferenceService.processParallelInference(
                        agents,
                        phaseConfig.getUserPrompt(),
                        phaseContext,
                        request.getSessionId().toString(),
                        phaseConfig.getPhaseType()
                    );
                    
                    // 添加到批量结果
                    batchResult.addPhaseResult(phaseConfig.getPhaseType(), phaseResult);
                    
                    // 更新前一阶段结果，用于下一阶段
                    if (phaseResult.hasSuccessfulResponses()) {
                        previousResults = phaseResult.getPhaseSummary();
                    }
                    
                    // 如果当前阶段失败且配置为失败时停止，则中断执行
                    if (!phaseResult.hasSuccessfulResponses() && request.isStopOnFailure()) {
                        logger.warn("阶段{}失败，停止后续阶段执行", phaseConfig.getPhaseType());
                        break;
                    }
                }
                
                batchResult.setEndTime(java.time.LocalDateTime.now());
                batchResult.calculateOverallStats();
                
                logger.info("批量多阶段推理完成: sessionId={}, 总成功率={:.2f}%", 
                           request.getSessionId(), batchResult.getOverallSuccessRate() * 100);
                
                return ResponseEntity.ok(batchResult);
                
            } catch (Exception e) {
                logger.error("批量多阶段推理失败: sessionId={}", request.getSessionId(), e);
                return ResponseEntity.status(500).<BatchInferenceResult>body(null);
            }
        }).whenComplete((result, throwable) -> {
            if (throwable != null) {
                logger.error("异步处理异常", throwable);
                deferredResult.setErrorResult(throwable);
            } else {
                deferredResult.setResult(result);
            }
        });
        
        return deferredResult;
    }

    /**
     * 获取推理性能统计
     */
    @GetMapping("/statistics/performance")
    @Operation(summary = "获取推理性能统计", description = "获取系统的推理性能统计信息")
    public ResponseEntity<InferencePerformanceStats> getInferencePerformanceStats(
            @RequestParam(required = false) String timeRange,
            Authentication authentication) {
        
        try {
            // 获取性能统计（这里需要实现具体的统计逻辑）
            InferencePerformanceStats stats = new InferencePerformanceStats();
            
            // 从InferenceStatusService获取基础统计
            InferenceStatusService.InferenceStatistics systemStats = inferenceStatusService.getSystemStatistics();
            stats.setTotalInferences(systemStats.getTotalSessions());
            stats.setSuccessfulInferences(systemStats.getCompletedSessions());
            stats.setFailedInferences(systemStats.getFailedSessions());
            stats.setAverageResponseTime(systemStats.getAverageProcessingTimeMs());
            
            // 计算成功率
            if (stats.getTotalInferences() > 0) {
                stats.setSuccessRate((double) stats.getSuccessfulInferences() / stats.getTotalInferences());
            }
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            logger.error("获取推理性能统计失败", e);
            return ResponseEntity.status(500).build();
        }
    }

    // 私有辅助方法

    /**
     * 验证会话所有权
     */
    private void validateSessionOwnership(Long sessionId, Authentication authentication) {
        // 这里应该实现会话所有权验证逻辑
        // 暂时简化处理
        if (authentication == null || authentication.getName() == null) {
            throw new SecurityException("用户未认证");
        }
    }

    /**
     * 验证代理所有权
     */
    private void validateAgentsOwnership(List<Agent> agents, Authentication authentication) {
        // 这里应该实现代理所有权验证逻辑
        // 暂时简化处理
        if (authentication == null || authentication.getName() == null) {
            throw new SecurityException("用户未认证");
        }
    }

    /**
     * 构建会话上下文
     */
    private String buildSessionContext(BrainstormSession session, String additionalContext) {
        StringBuilder context = new StringBuilder();
        
        context.append("会话标题: ").append(session.getTitle()).append("\n");
        if (session.getDescription() != null) {
            context.append("会话描述: ").append(session.getDescription()).append("\n");
        }
        
        if (additionalContext != null && !additionalContext.trim().isEmpty()) {
            context.append("附加信息: ").append(additionalContext).append("\n");
        }
        
        return context.toString();
    }

    /**
     * 构建阶段上下文
     */
    private String buildPhaseContext(BrainstormSession session, PhaseInferenceConfig phaseConfig, String previousResults) {
        StringBuilder context = new StringBuilder();
        
        context.append("会话标题: ").append(session.getTitle()).append("\n");
        if (session.getDescription() != null) {
            context.append("会话描述: ").append(session.getDescription()).append("\n");
        }
        
        if (phaseConfig.getAdditionalContext() != null) {
            context.append("阶段信息: ").append(phaseConfig.getAdditionalContext()).append("\n");
        }
        
        if (previousResults != null && !previousResults.trim().isEmpty()) {
            context.append("前面阶段结果: ").append(previousResults).append("\n");
        }
        
        return context.toString();
    }
    
    /**
     * 触发会话阶段的流式并行推理
     */
    @PostMapping(value = "/sessions/{sessionId}/phases/{phaseType}/execute/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "执行会话阶段流式推理", description = "触发指定会话和阶段的多代理流式并行推理")
    public ResponseBodyEmitter executeSessionPhaseStreamingInference(
            @Parameter(description = "会话ID") @PathVariable Long sessionId,
            @Parameter(description = "阶段类型") @PathVariable PhaseType phaseType,
            @Valid @RequestBody SessionPhaseInferenceRequest request,
            Authentication authentication) {
        
        logger.info("收到会话阶段流式推理请求: sessionId={}, phaseType={}", sessionId, phaseType);
        
        // 验证会话所有权
        validateSessionOwnership(sessionId, authentication);
        
        ResponseBodyEmitter emitter = new ResponseBodyEmitter();
        
        // 在新线程中执行流式推理任务
        CompletableFuture.runAsync(() -> {
            try {
                // 获取会话信息
                BrainstormSession session = sessionService.getSessionById(sessionId);
                
                // 获取会话的活跃代理
                List<Agent> agents = sessionService.getSessionAgents(sessionId);
                
                if (agents.isEmpty()) {
                    throw new IllegalStateException("会话没有配置任何代理");
                }
                
                // 构建会话上下文
                String sessionContext = buildSessionContext(session, request.getAdditionalContext());
                
                // 使用原子计数器跟踪完成的代理数量
                java.util.concurrent.atomic.AtomicInteger completedAgents = new java.util.concurrent.atomic.AtomicInteger(0);
                java.util.concurrent.atomic.AtomicBoolean emitterCompleted = new java.util.concurrent.atomic.AtomicBoolean(false);
                
                // 为每个代理创建流式推理请求
                for (Agent agent : agents) {
                    // 构建系统提示词
                    String systemPrompt = phaseType.getSystemPromptTemplate()
                        .replace("{roleType}", agent.getRoleType());
                    
                    // 如果代理有自定义系统提示词，则追加
                    if (agent.getSystemPrompt() != null && !agent.getSystemPrompt().trim().isEmpty()) {
                        systemPrompt += "\n\n" + agent.getSystemPrompt();
                    }
                    
                    // 构建用户提示词
                    String finalUserPrompt = phaseType.getUserPromptTemplate()
                        .replace("{topic}", request.getUserPrompt())
                        .replace("{context}", sessionContext != null ? sessionContext : "");
                    
                    // 发送流式推理请求
                    qiniuAIService.sendStreamingInferenceRequest(
                        systemPrompt,
                        finalUserPrompt,
                        new QiniuAIService.StreamingResponseHandler() {
                            @Override
                            public void onData(String data) {
                                // 检查emitter是否已经完成
                                if (emitterCompleted.get()) {
                                    return;
                                }
                                
                                try {
                                    // 发送数据片段，包含代理ID和名称
                                    String response = String.format("{\"agentId\":%d,\"agentName\":\"%s\",\"data\":%s}",
                                        agent.getId(), agent.getName(), data);
                                    emitter.send(response);
                                } catch (Exception e) {
                                    logger.error("发送流式数据失败", e);
                                    if (!emitterCompleted.getAndSet(true)) {
                                        emitter.completeWithError(e);
                                    }
                                }
                            }
                            
                            @Override
                            public void onComplete() {
                                // 检查是否所有代理都已完成
                                int completed = completedAgents.incrementAndGet();
                                if (completed == agents.size() && !emitterCompleted.getAndSet(true)) {
                                    try {
                                        emitter.send("[DONE]");
                                        emitter.complete();
                                    } catch (Exception e) {
                                        logger.error("完成流式输出失败", e);
                                    }
                                }
                            }
                            
                            @Override
                            public void onError(Throwable throwable) {
                                logger.error("代理{}流式推理处理异常", agent.getId(), throwable);
                                // 检查是否所有代理都已完成或出错
                                int completed = completedAgents.incrementAndGet();
                                if (completed == agents.size() && !emitterCompleted.getAndSet(true)) {
                                    emitter.complete();
                                }
                            }
                        }
                    );
                }
                
            } catch (Exception e) {
                logger.error("会话阶段流式推理失败: sessionId={}, phaseType={}", sessionId, phaseType, e);
                // 确保emitter被完成
                try {
                    emitter.completeWithError(e);
                } catch (Exception ex) {
                    logger.error("完成emitter时发生异常", ex);
                }
            }
        });
        
        return emitter;
    }
    
    /**
     * 自定义代理流式并行推理
     */
    @PostMapping(value = "/custom/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "自定义代理流式并行推理", description = "使用指定的代理列表进行流式并行推理")
    public ResponseBodyEmitter executeCustomStreamingParallelInference(
            @Valid @RequestBody CustomParallelInferenceRequest request,
            Authentication authentication) {
        
        logger.info("收到自定义流式并行推理请求: agentCount={}, phaseType={}", 
                   request.getAgentIds().size(), request.getPhaseType());
        
        ResponseBodyEmitter emitter = new ResponseBodyEmitter();
        
        // 在新线程中执行流式推理任务
        CompletableFuture.runAsync(() -> {
            try {
                // 获取指定的代理列表
                List<Agent> agents = agentService.getAgentsByIds(request.getAgentIds());
                
                if (agents.isEmpty()) {
                    throw new IllegalArgumentException("未找到指定的代理");
                }
                
                // 验证代理所有权
                validateAgentsOwnership(agents, authentication);
                
                // 使用原子计数器跟踪完成的代理数量
                java.util.concurrent.atomic.AtomicInteger completedAgents = new java.util.concurrent.atomic.AtomicInteger(0);
                java.util.concurrent.atomic.AtomicBoolean emitterCompleted = new java.util.concurrent.atomic.AtomicBoolean(false);
                
                // 为每个代理创建流式推理请求
                for (Agent agent : agents) {
                    // 发送流式推理请求
                    qiniuAIService.sendStreamingInferenceRequest(
                        agent.getSystemPrompt(),
                        request.getUserPrompt(),
                        new QiniuAIService.StreamingResponseHandler() {
                            @Override
                            public void onData(String data) {
                                // 检查emitter是否已经完成
                                if (emitterCompleted.get()) {
                                    return;
                                }
                                
                                try {
                                    // 发送数据片段，包含代理ID和名称
                                    String response = String.format("{\"agentId\":%d,\"agentName\":\"%s\",\"data\":%s}",
                                        agent.getId(), agent.getName(), data);
                                    emitter.send(response);
                                } catch (Exception e) {
                                    logger.error("发送流式数据失败", e);
                                    if (!emitterCompleted.getAndSet(true)) {
                                        emitter.completeWithError(e);
                                    }
                                }
                            }
                            
                            @Override
                            public void onComplete() {
                                // 检查是否所有代理都已完成
                                int completed = completedAgents.incrementAndGet();
                                if (completed == agents.size() && !emitterCompleted.getAndSet(true)) {
                                    try {
                                        emitter.send("[DONE]");
                                        emitter.complete();
                                    } catch (Exception e) {
                                        logger.error("完成流式输出失败", e);
                                    }
                                }
                            }
                            
                            @Override
                            public void onError(Throwable throwable) {
                                logger.error("代理{}流式推理处理异常", agent.getId(), throwable);
                                // 检查是否所有代理都已完成或出错
                                int completed = completedAgents.incrementAndGet();
                                if (completed == agents.size() && !emitterCompleted.getAndSet(true)) {
                                    emitter.complete();
                                }
                            }
                        }
                    );
                }
                
            } catch (Exception e) {
                logger.error("自定义流式并行推理失败: sessionId={}", request.getSessionId(), e);
                // 确保emitter被完成
                try {
                    emitter.completeWithError(e);
                } catch (Exception ex) {
                    logger.error("完成emitter时发生异常", ex);
                }
            }
        });
        
        return emitter;
    }
}
