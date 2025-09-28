package com.yiqi.service;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * 七牛云AI推理服务 - 专门用于报告生成
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Service
public class ReportQiniuService {

    private static final Logger logger = LoggerFactory.getLogger(ReportQiniuService.class);

    @Value("${qiniu.api.key:sk-5989d9479592a2c28c52a6e15be54ed4ceb27d8b37e72547b3d5c63a130dd1ae}")
    private String qiniuApiKey;

    @Value("${qiniu.api.url:https://openai.qiniu.com/v1/chat/completions}")
    private String qiniuApiUrl;

    @Value("${qiniu.api.model:deepseek-v3-0324}")
    private String defaultModel;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public ReportQiniuService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * 生成报告总结
     * 
     * @param phaseSummaries 三个阶段的总结
     * @return 最终报告总结
     */
    public String generateReportSummary(List<String> phaseSummaries) {
        try {
            logger.info("开始生成报告总结，阶段数量: {}", phaseSummaries.size());

            String systemPrompt = buildReportSystemPrompt();
            String userPrompt = buildReportUserPrompt(phaseSummaries);

            String response = callQiniuApi(systemPrompt, userPrompt);
            
            logger.info("报告总结生成成功");
            return response;

        } catch (Exception e) {
            logger.error("生成报告总结失败", e);
            throw new RuntimeException("生成报告总结失败: " + e.getMessage(), e);
        }
    }

    // 已移除图像描述生成功能，专注于文本报告生成

    /**
     * 调用七牛云API
     * 
     * @param systemPrompt 系统提示词
     * @param userPrompt 用户提示词
     * @return API响应内容
     */
    private String callQiniuApi(String systemPrompt, String userPrompt) {
        try {
            // 构建请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(qiniuApiKey);

            // 构建请求体
            Map<String, Object> requestBody = Map.of(
                "stream", false,
                "model", defaultModel,
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userPrompt)
                )
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // 发送请求
            ResponseEntity<String> response = restTemplate.exchange(
                qiniuApiUrl,
                HttpMethod.POST,
                request,
                String.class
            );

            // 解析响应
            return parseQiniuResponse(response.getBody());

        } catch (Exception e) {
            logger.error("调用七牛云API失败", e);
            throw new RuntimeException("调用七牛云API失败: " + e.getMessage(), e);
        }
    }

    /**
     * 解析七牛云API响应
     * 
     * @param responseBody 响应体
     * @return 提取的内容
     */
    @SuppressWarnings("unchecked")
    private String parseQiniuResponse(String responseBody) {
        try {
            Map<String, Object> response = objectMapper.readValue(responseBody, Map.class);
            
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new RuntimeException("七牛云API响应中没有choices字段");
            }

            Map<String, Object> firstChoice = choices.get(0);
            Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");
            if (message == null) {
                throw new RuntimeException("七牛云API响应中没有message字段");
            }

            String content = (String) message.get("content");
            if (content == null || content.trim().isEmpty()) {
                throw new RuntimeException("七牛云API响应内容为空");
            }

            return content.trim();

        } catch (Exception e) {
            logger.error("解析七牛云API响应失败: {}", responseBody, e);
            throw new RuntimeException("解析七牛云API响应失败: " + e.getMessage(), e);
        }
    }

    /**
     * 构建报告生成的系统提示词
     */
    private String buildReportSystemPrompt() {
        return "你是一个专业的产品设计报告生成专家。你的任务是根据头脑风暴的三个阶段结果，生成一份完整的产品解决方案报告。\n\n" +
               "报告应该包含以下部分：\n" +
               "1. 执行摘要 - 简洁概述整个产品方案\n" +
               "2. 设计概念 - 基于创意生成阶段的核心设计理念\n" +
               "3. 技术方案 - 基于可行性分析阶段的技术实现方案\n" +
               "4. 风险评估 - 基于缺点讨论阶段的风险点和应对策略\n" +
               "5. 营销策略 - 产品推广和市场定位建议\n" +
               "6. 实施计划 - 具体的开发和上市时间表\n\n" +
               "请确保报告内容专业、结构清晰、逻辑严密，适合作为产品开发的指导文档。";
    }

    /**
     * 构建报告生成的用户提示词
     */
    private String buildReportUserPrompt(List<String> phaseSummaries) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("请根据以下头脑风暴三个阶段的总结，生成一份完整的产品解决方案报告：\n\n");

        if (phaseSummaries.size() >= 1) {
            prompt.append("**第一阶段 - 创意生成阶段总结：**\n");
            prompt.append(phaseSummaries.get(0)).append("\n\n");
        }

        if (phaseSummaries.size() >= 2) {
            prompt.append("**第二阶段 - 技术可行性分析阶段总结：**\n");
            prompt.append(phaseSummaries.get(1)).append("\n\n");
        }

        if (phaseSummaries.size() >= 3) {
            prompt.append("**第三阶段 - 缺点讨论阶段总结：**\n");
            prompt.append(phaseSummaries.get(2)).append("\n\n");
        }

        prompt.append("请生成一份结构完整、内容详实的产品解决方案报告。");

        return prompt.toString();
    }

    // 已移除图像描述相关的提示词构建方法
}
