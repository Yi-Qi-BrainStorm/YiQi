package com.yiqi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yiqi.config.AIServiceProperties;
import com.yiqi.dto.ai.AIMessage;
import com.yiqi.dto.ai.QiniuAIRequest;
import com.yiqi.dto.ai.QiniuAIResponse;
import com.yiqi.exception.AIServiceException;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.util.Arrays;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

/**
 * 七牛云AI推理服务
 * 负责与七牛云AI推理API的集成，提供AI推理功能
 */
@Service
public class QiniuAIService {
    
    private static final Logger logger = LoggerFactory.getLogger(QiniuAIService.class);
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    
    @Autowired
    private AIServiceProperties aiServiceProperties;
    
    @Autowired
    private RetryService retryService;
    
    @Autowired
    private AIServiceHealthMonitor healthMonitor;
    
    private OkHttpClient httpClient;
    private ObjectMapper objectMapper;
    
    @PostConstruct
    public void init() {
        // 初始化HTTP客户端
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(aiServiceProperties.getQiniu().getTimeout(), TimeUnit.MILLISECONDS)
                .readTimeout(aiServiceProperties.getQiniu().getTimeout(), TimeUnit.MILLISECONDS)
                .writeTimeout(aiServiceProperties.getQiniu().getTimeout(), TimeUnit.MILLISECONDS)
                .build();
        
        this.objectMapper = new ObjectMapper();
        
        logger.info("QiniuAIService initialized with base URL: {}", 
                   aiServiceProperties.getQiniu().getBaseUrl());
    }
    
    /**
     * 发送AI推理请求
     * 
     * @param systemPrompt 系统提示词
     * @param userPrompt 用户输入
     * @return 异步返回AI响应内容
     */
    public CompletableFuture<String> sendInferenceRequest(String systemPrompt, String userPrompt) {
        return CompletableFuture.supplyAsync(() -> {
            // 检查服务是否可用
            if (!healthMonitor.isServiceAvailable()) {
                throw new AIServiceException("AI_SERVICE_UNAVAILABLE", "AI服务当前不可用，熔断器已开启");
            }
            
            // 使用重试服务执行推理请求
            RetryService.RetryConfig retryConfig = retryService.createAIInferenceConfig();
            
            try {
                String result = retryService.executeWithRetry(() -> {
                    try {
                        // 构建请求消息
                        QiniuAIRequest request = new QiniuAIRequest();
                        request.setModel(aiServiceProperties.getQiniu().getModel());
                        request.setMessages(Arrays.asList(
                            AIMessage.system(systemPrompt),
                            AIMessage.user(userPrompt)
                        ));
                        request.setStream(false);
                        
                        // 发送请求并获取响应
                        QiniuAIResponse response;
                        try {
                            response = sendSingleRequestWithFallback(request);
                        } catch (IOException e) {
                            throw new AIServiceException("AI_IO_ERROR", "网络请求失败: " + e.getMessage(), e);
                        }
                        
                        // 提取响应内容
                        String content = response.getContent();
                        if (content == null || content.trim().isEmpty()) {
                            throw new AIServiceException("AI_EMPTY_RESPONSE", "AI服务返回空响应");
                        }
                        
                        logger.debug("AI推理成功，响应长度: {}", content.length());
                        return content;
                        
                    } catch (Exception e) {
                        logger.error("AI推理请求失败", e);
                        if (e instanceof AIServiceException) {
                            throw e;
                        }
                        throw new AIServiceException("AI_REQUEST_FAILED", "AI推理请求失败: " + e.getMessage(), e);
                    }
                }, retryConfig, "AI推理请求");
                
                // 记录成功
                healthMonitor.recordSuccess();
                return result;
                
            } catch (Exception e) {
                // 记录失败
                healthMonitor.recordFailure();
                throw e;
            }
        });
    }
    
    /**
     * 发送流式AI推理请求
     * 
     * @param systemPrompt 系统提示词
     * @param userPrompt 用户输入
     * @param responseHandler 响应处理回调
     */
    public void sendStreamingInferenceRequest(String systemPrompt, String userPrompt, StreamingResponseHandler responseHandler) {
        // 检查服务是否可用
        if (!healthMonitor.isServiceAvailable()) {
            responseHandler.onError(new AIServiceException("AI_SERVICE_UNAVAILABLE", "AI服务当前不可用，熔断器已开启"));
            return;
        }
        
        try {
            // 构建请求消息
            QiniuAIRequest request = new QiniuAIRequest();
            request.setModel(aiServiceProperties.getQiniu().getModel());
            request.setMessages(Arrays.asList(
                AIMessage.system(systemPrompt),
                AIMessage.user(userPrompt)
            ));
            request.setStream(true);
            
            // 发送流式请求
            sendStreamingRequestWithFallback(request, responseHandler);
            
            // 记录成功
            healthMonitor.recordSuccess();
            
        } catch (Exception e) {
            logger.error("流式AI推理请求失败", e);
            // 记录失败
            healthMonitor.recordFailure();
            responseHandler.onError(e);
        }
    }
    
    /**
     * 带备用URL的请求发送
     */
    private QiniuAIResponse sendSingleRequestWithFallback(QiniuAIRequest request) throws IOException {
        // 首先尝试主URL
        try {
            String primaryUrl = aiServiceProperties.getQiniu().getBaseUrl() + "/chat/completions";
            return sendSingleRequest(request, primaryUrl);
        } catch (IOException e) {
            logger.warn("主URL请求失败，尝试备用URL: {}", e.getMessage());
            
            // 如果主URL失败，尝试备用URL
            String backupUrl = aiServiceProperties.getQiniu().getBackupUrl() + "/chat/completions";
            return sendSingleRequest(request, backupUrl);
        }
    }
    
    /**
     * 发送单次请求
     */
    private QiniuAIResponse sendSingleRequest(QiniuAIRequest request, String url) throws IOException {
        // 序列化请求体
        String requestBody = objectMapper.writeValueAsString(request);
        logger.debug("发送AI推理请求到: {}", url);
        
        // 构建HTTP请求
        Request httpRequest = new Request.Builder()
                .url(url)
                .post(RequestBody.create(requestBody, JSON))
                .addHeader("Authorization", "Bearer " + aiServiceProperties.getQiniu().getApiKey())
                .addHeader("Content-Type", "application/json")
                .build();
        
        // 发送请求
        try (Response response = httpClient.newCall(httpRequest).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "无响应体";
                throw new IOException("HTTP请求失败: " + response.code() + " " + response.message() + 
                                    ", 响应体: " + errorBody);
            }
            
            String responseBody = response.body().string();
            logger.debug("收到AI推理响应，长度: {}", responseBody.length());
            
            // 解析响应
            QiniuAIResponse aiResponse = objectMapper.readValue(responseBody, QiniuAIResponse.class);
            
            // 验证响应
            if (aiResponse.getChoices() == null || aiResponse.getChoices().isEmpty()) {
                throw new IOException("AI响应格式错误：缺少choices字段");
            }
            
            return aiResponse;
        }
    }
    
    /**
     * 验证API连接
     */
    public boolean validateConnection() {
        try {
            CompletableFuture<String> future = sendInferenceRequest(
                "You are a helpful assistant.", 
                "Hello, this is a connection test."
            );
            
            String response = future.get(30, TimeUnit.SECONDS);
            return response != null && !response.trim().isEmpty();
            
        } catch (Exception e) {
            logger.error("API连接验证失败", e);
            return false;
        }
    }
    
    /**
     * 获取服务状态
     */
    public String getServiceStatus() {
        if (validateConnection()) {
            return "HEALTHY";
        } else {
            return "UNHEALTHY";
        }
    }
    
    /**
     * 流式响应处理器接口
     */
    public interface StreamingResponseHandler {
        /**
         * 处理流式响应数据
         * @param data 响应数据片段
         */
        void onData(String data);
        
        /**
         * 处理完成事件
         */
        void onComplete();
        
        /**
         * 处理错误事件
         * @param throwable 错误信息
         */
        void onError(Throwable throwable);
    }
    
    /**
     * 带备用URL的流式请求发送
     */
    private void sendStreamingRequestWithFallback(QiniuAIRequest request, StreamingResponseHandler responseHandler) {
        // 首先尝试主URL
        try {
            String primaryUrl = aiServiceProperties.getQiniu().getBaseUrl() + "/chat/completions";
            sendStreamingRequest(request, primaryUrl, responseHandler);
            return;
        } catch (Exception e) {
            logger.warn("主URL流式请求失败，尝试备用URL: {}", e.getMessage());
        }
        
        // 如果主URL失败，尝试备用URL
        try {
            String backupUrl = aiServiceProperties.getQiniu().getBackupUrl() + "/chat/completions";
            sendStreamingRequest(request, backupUrl, responseHandler);
        } catch (Exception e) {
            logger.error("备用URL流式请求失败", e);
            responseHandler.onError(e);
        }
    }
    
    /**
     * 发送流式请求
     */
    private void sendStreamingRequest(QiniuAIRequest request, String url, StreamingResponseHandler responseHandler) throws IOException {
        // 序列化请求体
        String requestBody = objectMapper.writeValueAsString(request);
        logger.debug("发送流式AI推理请求到: {}", url);
        
        // 构建HTTP请求
        Request httpRequest = new Request.Builder()
                .url(url)
                .post(RequestBody.create(requestBody, JSON))
                .addHeader("Authorization", "Bearer " + aiServiceProperties.getQiniu().getApiKey())
                .addHeader("Content-Type", "application/json")
                .build();
        
        // 发送流式请求
        httpClient.newCall(httpRequest).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                responseHandler.onError(e);
            }
            
            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (!response.isSuccessful()) {
                    String errorBody = response.body() != null ? response.body().string() : "无响应体";
                    responseHandler.onError(new IOException("HTTP请求失败: " + response.code() + " " + response.message() + 
                                    ", 响应体: " + errorBody));
                    return;
                }
                
                try (ResponseBody responseBody = response.body()) {
                    if (responseBody == null) {
                        responseHandler.onError(new IOException("响应体为空"));
                        return;
                    }
                    
                    // 处理流式响应
                    processStreamingResponse(responseBody, responseHandler);
                }
            }
        });
    }
    
    /**
     * 处理流式响应
     */
    private void processStreamingResponse(ResponseBody responseBody, StreamingResponseHandler responseHandler) throws IOException {
        // 这里需要根据七牛云AI API的流式响应格式来解析数据
        // 由于我们没有具体的API文档，这里只是一个示例实现
        // 实际实现需要根据API的具体格式来调整
        
        // 读取响应流
        /*
        BufferedReader reader = new BufferedReader(responseBody.charStream());
        String line;
        while ((line = reader.readLine()) != null) {
            // 解析流式响应数据
            if (line.startsWith("data: ")) {
                String data = line.substring(6);
                if ("[DONE]".equals(data)) {
                    // 流结束
                    responseHandler.onComplete();
                    break;
                } else {
                    // 处理数据片段
                    responseHandler.onData(data);
                }
            }
        }
        */
        
        // 由于我们没有具体的流式响应格式，这里暂时使用非流式的方式处理
        // 实际实现需要根据API的具体格式来调整
        String responseBodyString = responseBody.string();
        responseHandler.onData(responseBodyString);
        responseHandler.onComplete();
    }
}
