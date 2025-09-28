package com.yiqi.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yiqi.entity.BrainstormSession;
import com.yiqi.entity.Phase;
import com.yiqi.entity.Report;
import com.yiqi.enums.PhaseType;
import com.yiqi.enums.ReportStatus;
import com.yiqi.enums.SessionStatus;
import com.yiqi.exception.SessionNotFoundException;
import com.yiqi.exception.ValidationException;
import com.yiqi.mapper.BrainstormSessionMapper;
import com.yiqi.mapper.ReportMapper;

/**
 * 报告生成服务
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@Service
public class ReportService {

    private static final Logger logger = LoggerFactory.getLogger(ReportService.class);

    @Autowired
    private ReportMapper reportMapper;

    @Autowired
    private SessionService sessionService;

    @Autowired
    private PhaseService phaseService;

    @Autowired
    private ReportQiniuService qiniuService;

    // @Autowired
    // private ReportAliyunService aliyunService; // 已移除阿里云图像生成功能

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BrainstormSessionMapper sessionMapper;

    /**
     * 根据会话ID生成报告
     * 
     * @param sessionId 会话ID
     * @return 报告ID
     */
    @Transactional
    public Long generateReport(Long sessionId) {
        try {
            logger.info("开始生成报告，会话ID: {}", sessionId);

            // 验证会话状态
            BrainstormSession session = validateSessionForReport(sessionId);

            // 检查是否已存在报告
            Report existingReport = reportMapper.findBySessionId(sessionId);
            if (existingReport != null) {
                if (existingReport.isGenerated()) {
                    logger.info("报告已存在且生成完成，报告ID: {}", existingReport.getId());
                    return existingReport.getId();
                } else if (existingReport.isGenerating()) {
                    logger.info("报告正在生成中，报告ID: {}", existingReport.getId());
                    return existingReport.getId();
                }
            }

            // 创建新报告记录
            Report report = createReportRecord(session);
            reportMapper.insert(report);

            // 异步生成报告内容
            generateReportContentAsync(report.getId());

            logger.info("报告生成任务已启动，报告ID: {}", report.getId());
            return report.getId();

        } catch (Exception e) {
            logger.error("生成报告失败，会话ID: {}", sessionId, e);
            throw new RuntimeException("生成报告失败: " + e.getMessage(), e);
        }
    }

    /**
     * 异步生成报告内容
     * 
     * @param reportId 报告ID
     */
    @Async
    public CompletableFuture<Void> generateReportContentAsync(Long reportId) {
        try {
            logger.info("开始异步生成报告内容，报告ID: {}", reportId);

            Report report = reportMapper.selectById(reportId);
            if (report == null) {
                throw new RuntimeException("报告不存在: " + reportId);
            }

            // 获取三个阶段的总结
            List<String> phaseSummaries = getPhaseSummaries(report.getSessionId());

            // 使用七牛云生成报告总结
            String reportSummary = qiniuService.generateReportSummary(phaseSummaries);

            // 构建完整报告内容（仅文本，不包含图像）
            Map<String, Object> reportContent = buildReportContent(
                phaseSummaries, reportSummary);

            // 更新报告
            report.setContent(objectMapper.writeValueAsString(reportContent));
            report.markAsGenerated();
            reportMapper.updateById(report);

            logger.info("报告内容生成完成，报告ID: {}", reportId);

        } catch (Exception e) {
            logger.error("异步生成报告内容失败，报告ID: {}", reportId, e);
            
            // 标记报告生成失败
            try {
                Report report = reportMapper.selectById(reportId);
                if (report != null) {
                    report.markAsFailed();
                    reportMapper.updateById(report);
                }
            } catch (Exception updateException) {
                logger.error("更新报告状态失败", updateException);
            }
        }

        return CompletableFuture.completedFuture(null);
    }

    /**
     * 获取报告详情
     * 
     * @param reportId 报告ID
     * @return 报告详情
     */
    public Report getReportById(Long reportId) {
        Report report = reportMapper.selectById(reportId);
        if (report == null) {
            throw new RuntimeException("报告不存在: " + reportId);
        }
        return report;
    }

    /**
     * 根据会话ID获取报告
     * 
     * @param sessionId 会话ID
     * @return 报告信息
     */
    public Report getReportBySessionId(Long sessionId) {
        return reportMapper.findBySessionId(sessionId);
    }

    // 已移除获取用户报告列表功能

    /**
     * 验证会话是否可以生成报告
     * 
     * @param sessionId 会话ID
     * @return 会话信息
     */
    private BrainstormSession validateSessionForReport(Long sessionId) {
        // 直接通过mapper获取会话信息
        BrainstormSession session = sessionMapper.selectById(sessionId);
        if (session == null) {
            throw new SessionNotFoundException("会话不存在: " + sessionId);
        }

        if (session.getStatus() != SessionStatus.COMPLETED) {
            throw new ValidationException("只有已完成的会话才能生成报告，当前状态: " + session.getStatus());
        }

        return session;
    }

    /**
     * 创建报告记录
     * 
     * @param session 会话信息
     * @return 报告记录
     */
    private Report createReportRecord(BrainstormSession session) {
        String title = "Report_" + session.getTitle() + "_" + LocalDateTime.now().toString().replace(":", "-");
        
        Report report = new Report(session.getId(), title);
        report.setStatus(ReportStatus.GENERATING);
        
        // 设置初始的空内容，避免数据库插入错误
        Map<String, Object> initialContent = new HashMap<>();
        initialContent.put("status", "generating");
        initialContent.put("message", "报告正在生成中...");
        initialContent.put("generatedAt", LocalDateTime.now().toString());
        
        try {
            report.setContent(objectMapper.writeValueAsString(initialContent));
        } catch (Exception e) {
            logger.warn("设置初始报告内容失败，使用默认值", e);
            report.setContent("{\"status\":\"generating\",\"message\":\"报告正在生成中...\"}");
        }
        
        return report;
    }

    /**
     * 获取三个阶段的总结
     * 
     * @param sessionId 会话ID
     * @return 阶段总结列表
     */
    private List<String> getPhaseSummaries(Long sessionId) {
        List<String> summaries = new ArrayList<>();

        // 按顺序获取三个阶段的总结
        PhaseType[] phaseTypes = {
            PhaseType.IDEA_GENERATION,
            PhaseType.FEASIBILITY_ANALYSIS,
            PhaseType.DRAWBACK_DISCUSSION
        };

        for (PhaseType phaseType : phaseTypes) {
            Phase phase = phaseService.getPhase(sessionId, phaseType);
            if (phase != null && phase.getSummary() != null) {
                summaries.add(phase.getSummary());
            } else {
                logger.warn("阶段 {} 的总结为空，会话ID: {}", phaseType, sessionId);
                summaries.add("该阶段暂无总结内容");
            }
        }

        return summaries;
    }

    /**
     * 构建完整报告内容（仅文本版本）
     * 
     * @param phaseSummaries 阶段总结
     * @param reportSummary 报告总结
     * @return 报告内容Map
     */
    private Map<String, Object> buildReportContent(
            List<String> phaseSummaries, 
            String reportSummary) {
        
        Map<String, Object> content = new HashMap<>();
        
        // 基本信息
        content.put("generatedAt", LocalDateTime.now().toString());
        content.put("version", "1.0");
        content.put("type", "text-only"); // 标记为纯文本报告
        
        // 阶段总结
        Map<String, String> phases = new HashMap<>();
        if (phaseSummaries.size() >= 1) {
            phases.put("ideaGeneration", phaseSummaries.get(0));
        }
        if (phaseSummaries.size() >= 2) {
            phases.put("feasibilityAnalysis", phaseSummaries.get(1));
        }
        if (phaseSummaries.size() >= 3) {
            phases.put("criticismDiscussion", phaseSummaries.get(2));
        }
        content.put("phaseSummaries", phases);
        
        // 最终报告总结
        content.put("finalSummary", reportSummary);
        
        // 报告统计信息
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("totalPhases", phaseSummaries.size());
        statistics.put("reportLength", reportSummary.length());
        content.put("statistics", statistics);
        
        return content;
    }

    // 已移除删除报告功能

    /**
     * 重新生成报告
     * 
     * @param reportId 报告ID
     * @return 新的报告ID
     */
    @Transactional
    public Long regenerateReport(Long reportId) {
        Report existingReport = reportMapper.selectById(reportId);
        if (existingReport == null) {
            throw new RuntimeException("报告不存在: " + reportId);
        }

        // 删除旧报告
        reportMapper.deleteById(reportId);

        // 生成新报告
        return generateReport(existingReport.getSessionId());
    }
}
