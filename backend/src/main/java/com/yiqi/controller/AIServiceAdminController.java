package com.yiqi.controller;

import com.yiqi.service.AIServiceHealthMonitor;
import com.yiqi.service.InferenceStatusService;
import com.yiqi.service.QiniuAIService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * AI服务管理控制器
 * 提供AI服务健康监控和管理功能
 */
@RestController
@RequestMapping("/api/admin/ai-service")
public class AIServiceAdminController {
    
    private static final Logger logger = LoggerFactory.getLogger(AIServiceAdminController.class);
    
    @Autowired
    private AIServiceHealthMonitor healthMonitor;
    
    @Autowired
    private QiniuAIService qiniuAIService;
    
    @Autowired
    private InferenceStatusService inferenceStatusService;

    /**
     * 获取AI服务健康状态
     */
    @GetMapping("/health")
    public ResponseEntity<AIServiceHealthMonitor.ServiceHealthStatus> getHealthStatus() {
        AIServiceHealthMonitor.ServiceHealthStatus status = healthMonitor.getHealthStatus();
        return ResponseEntity.ok(status);
    }

    /**
     * 获取系统推理统计信息
     */
    @GetMapping("/statistics")
    public ResponseEntity<InferenceStatusService.InferenceStatistics> getStatistics() {
        InferenceStatusService.InferenceStatistics statistics = 
            inferenceStatusService.getSystemStatistics();
        return ResponseEntity.ok(statistics);
    }

    /**
     * 手动重置熔断器
     */
    @PostMapping("/circuit-breaker/reset")
    public ResponseEntity<Void> resetCircuitBreaker() {
        logger.info("手动重置AI服务熔断器");
        healthMonitor.manualReset();
        return ResponseEntity.noContent().build();
    }

    /**
     * 验证AI服务连接
     */
    @PostMapping("/validate")
    public ResponseEntity<ValidationResult> validateConnection() {
        logger.info("验证AI服务连接");
        
        ValidationResult result = new ValidationResult();
        try {
            boolean isValid = qiniuAIService.validateConnection();
            result.setValid(isValid);
            result.setMessage(isValid ? "连接正常" : "连接失败");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("连接验证异常", e);
            result.setValid(false);
            result.setMessage("验证异常: " + e.getMessage());
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * 清理过期状态
     */
    @PostMapping("/cleanup")
    public ResponseEntity<Void> cleanupExpiredStatus() {
        logger.info("清理过期推理状态");
        inferenceStatusService.cleanupExpiredStatuses();
        return ResponseEntity.noContent().build();
    }

    /**
     * 验证结果DTO
     */
    public static class ValidationResult {
        private boolean valid;
        private String message;

        public boolean isValid() {
            return valid;
        }

        public void setValid(boolean valid) {
            this.valid = valid;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
