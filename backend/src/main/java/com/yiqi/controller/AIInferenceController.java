package com.yiqi.controller;

import com.yiqi.dto.ai.AgentInferenceRequest;
import com.yiqi.dto.ai.AgentInferenceResponse;
import com.yiqi.dto.ai.ParallelInferenceResult;
import com.yiqi.service.AIInferenceService;
import com.yiqi.service.AIServiceHealthMonitor;
import com.yiqi.service.InferenceStatusService;
import com.yiqi.service.QiniuAIService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;

import java.util.concurrent.CompletableFuture;

/**
 * AI推理控制器
 * 提供AI推理相关的REST API接口
 */
@RestController
@RequestMapping("/api/ai-inference")
public class AIInferenceController {
    
    private static final Logger logger = LoggerFactory.getLogger(AIInferenceController.class);
    
    @Autowired
    private AIInferenceService aiInferenceService;
    
    @Autowired
    private QiniuAIService qiniuAIService;
    
    @Autowired
    private AIServiceHealthMonitor healthMonitor;
    
    @Autowired
    private InferenceStatusService inferenceStatusService;

    /**
     * 处理单个代理推理请求
     */
    @PostMapping("/agent")
    public Object processAgentInference(
            @RequestBody AgentInferenceRequest request,
            @RequestParam(defaultValue = "false") boolean stream) {
        
        if (stream) {
            // 流式输出
            logger.info("收到单代理流式推理请求: agentId={}", request.getAgentId());
            
            // 设置较长的超时时间（300秒）
            ResponseBodyEmitter emitter = new ResponseBodyEmitter(300000L);
            
            // 使用原子布尔值跟踪emitter是否已完成
            java.util.concurrent.atomic.AtomicBoolean emitterCompleted = new java.util.concurrent.atomic.AtomicBoolean(false);
            
            // 注册超时和完成的回调
            emitter.onTimeout(() -> {
                logger.warn("流式输出超时: agentId={}", request.getAgentId());
                if (!emitterCompleted.getAndSet(true)) {
                    emitter.complete();
                }
            });
            
            emitter.onError((throwable) -> {
                logger.error("流式输出错误: agentId={}", request.getAgentId(), throwable);
                emitterCompleted.set(true);
            });
            
            emitter.onCompletion(() -> {
                logger.info("流式输出完成: agentId={}", request.getAgentId());
                emitterCompleted.set(true);
            });
            
            // 使用流式AI服务处理请求
            qiniuAIService.sendStreamingInferenceRequest(
                request.getSystemPrompt(),
                request.getUserPrompt(),
                new QiniuAIService.StreamingResponseHandler() {
                    @Override
                    public void onData(String data) {
                        // 检查emitter是否已经完成
                        if (emitterCompleted.get()) {
                            logger.debug("emitter已完成后收到数据，忽略: agentId={}", request.getAgentId());
                            return;
                        }
                        
                        try {
                            // 发送数据片段
                            emitter.send(data);
                        } catch (IllegalStateException e) {
                            logger.warn("发送流式数据时emitter已关闭: agentId={}", request.getAgentId());
                            emitterCompleted.set(true);
                        } catch (Exception e) {
                            logger.error("发送流式数据失败: agentId={}", request.getAgentId(), e);
                            if (!emitterCompleted.getAndSet(true)) {
                                try {
                                    emitter.completeWithError(e);
                                } catch (Exception ex) {
                                    logger.error("完成emitter时发生异常: agentId={}", request.getAgentId(), ex);
                                }
                            }
                        }
                    }
                    
                    @Override
                    public void onComplete() {
                        // 完成流式输出
                        if (!emitterCompleted.getAndSet(true)) {
                            try {
                                emitter.send("[DONE]");
                                emitter.complete();
                            } catch (IllegalStateException e) {
                                logger.warn("完成流式输出时emitter已关闭: agentId={}", request.getAgentId());
                            } catch (Exception e) {
                                logger.error("完成流式输出失败: agentId={}", request.getAgentId(), e);
                            }
                        }
                    }
                    
                    @Override
                    public void onError(Throwable throwable) {
                        // 处理错误
                        logger.error("流式推理处理异常: agentId={}", request.getAgentId(), throwable);
                        if (!emitterCompleted.getAndSet(true)) {
                            try {
                                emitter.completeWithError(throwable);
                            } catch (IllegalStateException e) {
                                logger.warn("完成emitter时emitter已关闭: agentId={}", request.getAgentId());
                            } catch (Exception e) {
                                logger.error("完成emitter时发生异常: agentId={}", request.getAgentId(), e);
                            }
                        }
                    }
                }
            );
            
            return emitter;
        } else {
            // 普通输出
            logger.info("收到单代理推理请求: agentId={}", request.getAgentId());
            
            return aiInferenceService.processAgentInference(request)
                .thenApply(response -> {
                    if (response.isSuccess()) {
                        return ResponseEntity.ok(response);
                    } else {
                        return ResponseEntity.status(500).body(response);
                    }
                })
                .exceptionally(throwable -> {
                    logger.error("单代理推理处理异常", throwable);
                    AgentInferenceResponse errorResponse = new AgentInferenceResponse();
                    errorResponse.markFailure("处理异常: " + throwable.getMessage());
                    return ResponseEntity.status(500).body(errorResponse);
                });
        }
    }

    /**
     * 测试AI服务连接
     */
    @PostMapping("/test")
    public ResponseEntity<String> testAIService(@RequestBody TestRequest request) {
        logger.info("收到AI服务测试请求");
        
        try {
            CompletableFuture<String> future = qiniuAIService.sendInferenceRequest(
                request.getSystemPrompt() != null ? request.getSystemPrompt() : "You are a helpful assistant.",
                request.getUserPrompt() != null ? request.getUserPrompt() : "Hello, this is a test."
            );
            
            String response = future.get(30, java.util.concurrent.TimeUnit.SECONDS);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("AI服务测试失败", e);
            return ResponseEntity.status(500).body("测试失败: " + e.getMessage());
        }
    }

    /**
     * 获取推理状态
     */
    @GetMapping("/status/{sessionId}/{phaseType}")
    public ResponseEntity<?> getInferenceStatus(
            @PathVariable String sessionId,
            @PathVariable String phaseType) {
        
        InferenceStatusService.SessionInferenceStatus status = 
            inferenceStatusService.getSessionInferenceStatus(sessionId, phaseType);
        
        if (status != null) {
            return ResponseEntity.ok(status);
        } else {
            ErrorResponse errorResponse = new ErrorResponse();
            errorResponse.setError("推理状态未找到");
            return ResponseEntity.status(404).body(errorResponse);
        }
    }

    /**
     * 获取系统推理统计
     */
    @GetMapping("/statistics")
    public ResponseEntity<InferenceStatusService.InferenceStatistics> getSystemStatistics() {
        InferenceStatusService.InferenceStatistics statistics = 
            inferenceStatusService.getSystemStatistics();
        return ResponseEntity.ok(statistics);
    }

    /**
     * 处理单个代理流式推理请求
     */
    @PostMapping(value = "/agent/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseBodyEmitter processAgentStreamingInference(@RequestBody AgentInferenceRequest request) {
        logger.info("收到单代理流式推理请求: agentId={}", request.getAgentId());
        
        ResponseBodyEmitter emitter = new ResponseBodyEmitter();
        
        // 使用原子布尔值跟踪emitter是否已完成
        java.util.concurrent.atomic.AtomicBoolean emitterCompleted = new java.util.concurrent.atomic.AtomicBoolean(false);
        
        // 使用流式AI服务处理请求
        qiniuAIService.sendStreamingInferenceRequest(
            request.getSystemPrompt(),
            request.getUserPrompt(),
            new QiniuAIService.StreamingResponseHandler() {
                @Override
                public void onData(String data) {
                    // 检查emitter是否已经完成
                    if (emitterCompleted.get()) {
                        return;
                    }
                    
                    try {
                        // 发送数据片段
                        emitter.send(data);
                    } catch (Exception e) {
                        logger.error("发送流式数据失败", e);
                        if (!emitterCompleted.getAndSet(true)) {
                            emitter.completeWithError(e);
                        }
                    }
                }
                
                @Override
                public void onComplete() {
                    // 完成流式输出
                    if (!emitterCompleted.getAndSet(true)) {
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
                    // 处理错误
                    logger.error("流式推理处理异常", throwable);
                    if (!emitterCompleted.getAndSet(true)) {
                        emitter.completeWithError(throwable);
                    }
                }
            }
        );
        
        return emitter;
    }

    /**
     * 测试请求DTO
     */
    public static class TestRequest {
        private String systemPrompt;
        private String userPrompt;

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
    }
    
    /**
     * 错误响应DTO
     */
    public static class ErrorResponse {
        private String error;

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }
    }
}
