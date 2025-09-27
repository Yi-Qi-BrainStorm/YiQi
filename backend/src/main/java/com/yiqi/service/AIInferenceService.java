package com.yiqi.service;

import com.yiqi.dto.ai.AgentInferenceRequest;
import com.yiqi.dto.ai.AgentInferenceResponse;
import com.yiqi.dto.ai.ParallelInferenceResult;
import com.yiqi.entity.Agent;
import com.yiqi.enums.PhaseType;
import com.yiqi.enums.RoleType;
import com.yiqi.exception.AIServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * AI推理服务
 * 负责管理多代理并行推理、错误处理和结果汇总
 */
@Service
public class AIInferenceService {
    
    private static final Logger logger = LoggerFactory.getLogger(AIInferenceService.class);
    
    @Autowired
    private QiniuAIService qiniuAIService;
    
    @Autowired
    private InferenceStatusService inferenceStatusService;
    
    @Autowired
    @Qualifier("aiInferenceExecutor")
    private Executor aiInferenceExecutor;
    
    // 推理超时时间（秒）
    private static final int INFERENCE_TIMEOUT_SECONDS = 60;
    private static final int TOTAL_TIMEOUT_SECONDS = 120;

    /**
     * 处理单个代理推理
     */
    public CompletableFuture<AgentInferenceResponse> processAgentInference(AgentInferenceRequest request) {
        logger.info("开始处理代理推理: agentId={}, agentName={}", request.getAgentId(), request.getAgentName());
        
        AgentInferenceResponse response = new AgentInferenceResponse(
            request.getAgentId(), 
            request.getAgentName(), 
            request.getRoleType()
        );
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                // 发送推理请求
                CompletableFuture<String> inferenceResult = qiniuAIService.sendInferenceRequest(
                    request.getSystemPrompt(), 
                    request.getUserPrompt()
                );
                
                // 等待结果，设置超时
                String content = inferenceResult.get(INFERENCE_TIMEOUT_SECONDS, TimeUnit.SECONDS);
                
                // 标记成功
                response.markSuccess(content);
                logger.info("代理推理成功: agentId={}, 处理时长={}ms", 
                           request.getAgentId(), response.getProcessingTimeMs());
                
                return response;
                
            } catch (java.util.concurrent.TimeoutException e) {
                logger.warn("代理推理超时: agentId={}", request.getAgentId());
                response.markTimeout();
                return response;
                
            } catch (Exception e) {
                logger.error("代理推理失败: agentId={}, 错误: {}", request.getAgentId(), e.getMessage(), e);
                response.markFailure("推理失败: " + e.getMessage());
                return response;
            }
        }, aiInferenceExecutor);
    }

    /**
     * 处理多代理并行推理
     */
    public ParallelInferenceResult processParallelInference(
            List<Agent> agents,
            String userPrompt,
            String sessionContext,
            String sessionId,
            PhaseType phaseType) {
        
        logger.info("开始并行推理: sessionId={}, phaseType={}, agentCount={}", 
                   sessionId, phaseType, agents.size());
        
        // 开始状态跟踪
        inferenceStatusService.startTracking(sessionId, phaseType.name(), agents.size());
        
        try {
            // 构建推理请求列表
            List<AgentInferenceRequest> requests = buildInferenceRequests(
                agents, userPrompt, sessionContext, phaseType
            );
            
            // 创建并行推理任务
            List<CompletableFuture<AgentInferenceResponse>> futures = requests.stream()
                .map(this::processAgentInference)
                .collect(Collectors.toList());
            
            // 等待所有任务完成
            CompletableFuture<Void> allFutures = CompletableFuture.allOf(
                futures.toArray(new CompletableFuture[0])
            );
            
            // 设置总体超时
            try {
                allFutures.get(TOTAL_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            } catch (java.util.concurrent.TimeoutException e) {
                logger.warn("并行推理总体超时: sessionId={}", sessionId);
                // 取消未完成的任务
                futures.forEach(future -> future.cancel(true));
            }
            
            // 收集结果
            List<AgentInferenceResponse> responses = new ArrayList<>();
            for (CompletableFuture<AgentInferenceResponse> future : futures) {
                try {
                    if (future.isDone() && !future.isCancelled()) {
                        responses.add(future.get());
                    } else {
                        // 创建超时响应
                        AgentInferenceResponse timeoutResponse = new AgentInferenceResponse();
                        timeoutResponse.markTimeout();
                        responses.add(timeoutResponse);
                    }
                } catch (Exception e) {
                    logger.error("获取推理结果失败", e);
                    AgentInferenceResponse errorResponse = new AgentInferenceResponse();
                    errorResponse.markFailure("获取结果失败: " + e.getMessage());
                    responses.add(errorResponse);
                }
            }
            
            // 创建结果对象
            ParallelInferenceResult result = new ParallelInferenceResult(responses);
            result.complete();
            
            // 生成阶段总结
            if (result.hasSuccessfulResponses()) {
                try {
                    CompletableFuture<String> summaryFuture = generatePhaseSummary(
                        result.getSuccessfulResponses(), phaseType
                    );
                    String summary = summaryFuture.get(30, TimeUnit.SECONDS);
                    result.setPhaseSummary(summary);
                } catch (Exception e) {
                    logger.error("生成阶段总结失败: sessionId={}", sessionId, e);
                    result.setPhaseSummary("总结生成失败: " + e.getMessage());
                }
            }
            
            // 更新状态跟踪
            inferenceStatusService.updateProgress(sessionId, phaseType.name(), result);
            
            logger.info("并行推理完成: sessionId={}, 成功率={:.2f}%, 总时长={}ms", 
                       sessionId, result.getSuccessRate() * 100, result.getTotalProcessingTimeMs());
            
            return result;
            
        } catch (Exception e) {
            logger.error("并行推理处理失败: sessionId={}", sessionId, e);
            throw new AIServiceException("PARALLEL_INFERENCE_FAILED", 
                                       "并行推理处理失败: " + e.getMessage(), e);
        }
    }

    /**
     * 生成阶段总结
     */
    public CompletableFuture<String> generatePhaseSummary(
            List<AgentInferenceResponse> responses,
            PhaseType phaseType) {
        
        logger.debug("开始生成阶段总结: phaseType={}, responseCount={}", phaseType, responses.size());
        
        // 构建总结提示词
        StringBuilder contentBuilder = new StringBuilder();
        contentBuilder.append("以下是").append(phaseType.getDisplayName()).append("阶段各代理的输出结果：\n\n");
        
        for (AgentInferenceResponse response : responses) {
            if (response.isSuccess()) {
                contentBuilder.append("【").append(response.getRoleType()).append(" - ")
                             .append(response.getAgentName()).append("】\n");
                contentBuilder.append(response.getContent()).append("\n\n");
            }
        }
        
        String systemPrompt = "你是一个专业的头脑风暴总结助手。请根据各代理的输出，生成一份简洁明了的阶段总结。" +
                             "总结应该：1. 提炼关键观点 2. 整理共同建议 3. 突出创新想法 4. 保持客观中立";
        
        String userPrompt = contentBuilder.toString() + 
                           "\n请为以上" + phaseType.getDisplayName() + "阶段的讨论结果生成一份总结报告。";
        
        return qiniuAIService.sendInferenceRequest(systemPrompt, userPrompt);
    }

    /**
     * 获取推理状态
     */
    public InferenceStatusService.SessionInferenceStatus getInferenceStatus(String sessionId, String phaseType) {
        return inferenceStatusService.getInferenceStatus(sessionId, phaseType);
    }

    /**
     * 获取系统统计信息
     */
    public InferenceStatusService.InferenceStatistics getSystemStatistics() {
        return inferenceStatusService.getSystemStatistics();
    }

    /**
     * 构建推理请求列表
     */
    private List<AgentInferenceRequest> buildInferenceRequests(
            List<Agent> agents,
            String userPrompt,
            String sessionContext,
            PhaseType phaseType) {
        
        List<AgentInferenceRequest> requests = new ArrayList<>();
        
        for (Agent agent : agents) {
            // 获取角色类型的显示名称
            String roleDisplayName;
            try {
                RoleType roleType = RoleType.fromValue(agent.getRoleType());
                roleDisplayName = roleType.getDescription();
            } catch (IllegalArgumentException e) {
                // 如果无法解析为枚举，直接使用字符串值
                roleDisplayName = agent.getRoleType();
            }
            
            // 构建系统提示词
            String systemPrompt = phaseType.getSystemPromptTemplate()
                .replace("{roleType}", roleDisplayName);
            
            // 如果代理有自定义系统提示词，则追加
            if (agent.getSystemPrompt() != null && !agent.getSystemPrompt().trim().isEmpty()) {
                systemPrompt += "\n\n" + agent.getSystemPrompt();
            }
            
            // 构建用户提示词
            String finalUserPrompt = phaseType.getUserPromptTemplate()
                .replace("{topic}", userPrompt)
                .replace("{context}", sessionContext != null ? sessionContext : "");
            
            // 创建请求
            AgentInferenceRequest request = new AgentInferenceRequest(
                agent.getId(),
                agent.getName(),
                agent.getRoleType(), // 直接使用String类型的roleType
                systemPrompt,
                finalUserPrompt,
                sessionContext
            );
            
            requests.add(request);
        }
        
        return requests;
    }
}
