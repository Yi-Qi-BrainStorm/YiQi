package com.yiqi.entity;

import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.yiqi.enums.ReportStatus;

/**
 * 报告实体类
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@TableName("reports")
public class Report {

    /**
     * 报告ID - 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 会话ID - 外键关联brainstorm_sessions表
     */
    @TableField("session_id")
    private Long sessionId;

    /**
     * 报告标题
     */
    @TableField("title")
    private String title;

    /**
     * 报告内容(JSON格式)
     */
    @TableField("content")
    private String content;

    /**
     * 报告状态
     */
    @TableField("status")
    private ReportStatus status;

    /**
     * PDF文件路径
     */
    @TableField("file_path")
    private String filePath;

    /**
     * 生成时间
     */
    @TableField(value = "generated_at", fill = FieldFill.INSERT)
    private LocalDateTime generatedAt;

    // 默认构造函数
    public Report() {
        this.status = ReportStatus.GENERATING;
    }

    // 构造函数
    public Report(Long sessionId, String title) {
        this();
        this.sessionId = sessionId;
        this.title = title;
    }

    // Getter和Setter方法
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public ReportStatus getStatus() {
        return status;
    }

    public void setStatus(ReportStatus status) {
        this.status = status;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    // 业务方法

    /**
     * 检查报告是否生成完成
     * 
     * @return true如果生成完成
     */
    public boolean isGenerated() {
        return status != null && status.isSuccess();
    }

    /**
     * 检查报告是否生成失败
     * 
     * @return true如果生成失败
     */
    public boolean isFailed() {
        return status != null && status.isFailed();
    }

    /**
     * 检查报告是否正在生成中
     * 
     * @return true如果正在生成中
     */
    public boolean isGenerating() {
        return status != null && status.isProcessing();
    }

    /**
     * 标记报告生成成功
     */
    public void markAsGenerated() {
        this.status = ReportStatus.GENERATED;
    }

    /**
     * 标记报告生成失败
     */
    public void markAsFailed() {
        this.status = ReportStatus.FAILED;
    }

    /**
     * 检查是否有PDF文件
     * 
     * @return true如果有PDF文件
     */
    public boolean hasPdfFile() {
        return filePath != null && !filePath.trim().isEmpty();
    }

    @Override
    public String toString() {
        return "Report{" +
                "id=" + id +
                ", sessionId=" + sessionId +
                ", title='" + title + '\'' +
                ", status=" + status +
                ", filePath='" + filePath + '\'' +
                ", generatedAt=" + generatedAt +
                '}';
    }
}
