package com.yiqi.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yiqi.dto.ReportResponse;
import com.yiqi.entity.Report;
import com.yiqi.entity.User;
import com.yiqi.service.ReportService;
import com.yiqi.service.UserService;

/**
 * 报告控制器
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private static final Logger logger = LoggerFactory.getLogger(ReportController.class);

    @Autowired
    private ReportService reportService;

    @Autowired
    private UserService userService;

    /**
     * 根据会话ID生成报告
     * 
     * @param sessionId 会话ID
     * @param authentication 认证信息
     * @return 报告生成响应
     */
    @PostMapping("/generate/{sessionId}")
    public ResponseEntity<ReportGenerateResponse> generateReport(
            @PathVariable Long sessionId,
            Authentication authentication) {
        try {
            logger.info("用户请求生成报告，会话ID: {}", sessionId);

            // 获取当前用户
            User currentUser = getCurrentUser(authentication);

            // 生成报告
            Long reportId = reportService.generateReport(sessionId);

            // 构建响应
            ReportGenerateResponse response = new ReportGenerateResponse();
            response.setReportId(reportId);
            response.setSessionId(sessionId);
            response.setMessage("报告生成任务已启动");

            logger.info("报告生成任务启动成功，报告ID: {}", reportId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("生成报告失败，会话ID: {}", sessionId, e);
            return ResponseEntity.badRequest().body(
                ReportGenerateResponse.error("生成报告失败: " + e.getMessage())
            );
        }
    }

    /**
     * 获取报告详情
     * 
     * @param reportId 报告ID
     * @param authentication 认证信息
     * @return 报告详情
     */
    @GetMapping("/{reportId}")
    public ResponseEntity<ReportResponse> getReport(
            @PathVariable Long reportId,
            Authentication authentication) {
        try {
            logger.info("用户请求获取报告详情，报告ID: {}", reportId);

            // 获取当前用户
            User currentUser = getCurrentUser(authentication);

            // 获取报告
            Report report = reportService.getReportById(reportId);

            // 构建响应
            ReportResponse response = buildReportResponse(report);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("获取报告详情失败，报告ID: {}", reportId, e);
            return ResponseEntity.badRequest().body(
                ReportResponse.error("获取报告详情失败: " + e.getMessage())
            );
        }
    }

    /**
     * 根据会话ID获取报告
     * 
     * @param sessionId 会话ID
     * @param authentication 认证信息
     * @return 报告信息
     */
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<ReportResponse> getReportBySession(
            @PathVariable Long sessionId,
            Authentication authentication) {
        try {
            logger.info("用户请求获取会话报告，会话ID: {}", sessionId);

            // 获取当前用户
            User currentUser = getCurrentUser(authentication);

            // 获取报告
            Report report = reportService.getReportBySessionId(sessionId);
            if (report == null) {
                return ResponseEntity.notFound().build();
            }

            // 构建响应
            ReportResponse response = buildReportResponse(report);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("获取会话报告失败，会话ID: {}", sessionId, e);
            return ResponseEntity.badRequest().body(
                ReportResponse.error("获取会话报告失败: " + e.getMessage())
            );
        }
    }

    // 已移除获取报告列表和删除报告功能

    /**
     * 重新生成报告
     * 
     * @param reportId 报告ID
     * @param authentication 认证信息
     * @return 重新生成响应
     */
    @PostMapping("/{reportId}/regenerate")
    public ResponseEntity<ReportGenerateResponse> regenerateReport(
            @PathVariable Long reportId,
            Authentication authentication) {
        try {
            logger.info("用户请求重新生成报告，报告ID: {}", reportId);

            // 获取当前用户
            User currentUser = getCurrentUser(authentication);

            // 重新生成报告
            Long newReportId = reportService.regenerateReport(reportId);

            // 构建响应
            ReportGenerateResponse response = new ReportGenerateResponse();
            response.setReportId(newReportId);
            response.setMessage("报告重新生成任务已启动");

            logger.info("报告重新生成任务启动成功，新报告ID: {}", newReportId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("重新生成报告失败，报告ID: {}", reportId, e);
            return ResponseEntity.badRequest().body(
                ReportGenerateResponse.error("重新生成报告失败: " + e.getMessage())
            );
        }
    }

    // 私有辅助方法

    /**
     * 获取当前用户
     */
    private User getCurrentUser(Authentication authentication) {
        String username = authentication.getName();
        return userService.findByUsername(username);
    }

    /**
     * 构建报告响应
     */
    private ReportResponse buildReportResponse(Report report) {
        ReportResponse response = new ReportResponse();
        response.setId(report.getId());
        response.setSessionId(report.getSessionId());
        response.setTitle(report.getTitle());
        response.setContent(report.getContent());
        response.setStatus(report.getStatus());
        response.setFilePath(report.getFilePath());
        response.setGeneratedAt(report.getGeneratedAt());
        response.setHasPdfFile(report.hasPdfFile());
        response.setIsGenerated(report.isGenerated());
        response.setIsFailed(report.isFailed());
        response.setIsGenerating(report.isGenerating());
        return response;
    }

    // 内部响应类

    /**
     * 报告生成响应类
     */
    public static class ReportGenerateResponse {
        private Long reportId;
        private Long sessionId;
        private String message;
        private boolean success = true;

        public static ReportGenerateResponse error(String message) {
            ReportGenerateResponse response = new ReportGenerateResponse();
            response.setMessage(message);
            response.setSuccess(false);
            return response;
        }

        // Getters and Setters
        public Long getReportId() {
            return reportId;
        }

        public void setReportId(Long reportId) {
            this.reportId = reportId;
        }

        public Long getSessionId() {
            return sessionId;
        }

        public void setSessionId(Long sessionId) {
            this.sessionId = sessionId;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public boolean isSuccess() {
            return success;
        }

        public void setSuccess(boolean success) {
            this.success = success;
        }
    }
}
