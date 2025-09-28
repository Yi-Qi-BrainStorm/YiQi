package com.yiqi.dto;

import java.time.LocalDateTime;

import com.yiqi.enums.ReportStatus;

/**
 * 报告响应DTO
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public class ReportResponse {

    private Long id;
    private Long sessionId;
    private String title;
    private String content;
    private ReportStatus status;
    private String filePath;
    private LocalDateTime generatedAt;
    private boolean hasPdfFile;
    private boolean isGenerated;
    private boolean isFailed;
    private boolean isGenerating;
    private String errorMessage;

    // 默认构造函数
    public ReportResponse() {
    }

    // 错误响应构造函数
    public static ReportResponse error(String errorMessage) {
        ReportResponse response = new ReportResponse();
        response.setErrorMessage(errorMessage);
        return response;
    }

    // Getters and Setters
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

    public boolean isHasPdfFile() {
        return hasPdfFile;
    }

    public void setHasPdfFile(boolean hasPdfFile) {
        this.hasPdfFile = hasPdfFile;
    }

    public boolean isIsGenerated() {
        return isGenerated;
    }

    public void setIsGenerated(boolean isGenerated) {
        this.isGenerated = isGenerated;
    }

    public boolean isIsFailed() {
        return isFailed;
    }

    public void setIsFailed(boolean isFailed) {
        this.isFailed = isFailed;
    }

    public boolean isIsGenerating() {
        return isGenerating;
    }

    public void setIsGenerating(boolean isGenerating) {
        this.isGenerating = isGenerating;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    @Override
    public String toString() {
        return "ReportResponse{" +
                "id=" + id +
                ", sessionId=" + sessionId +
                ", title='" + title + '\'' +
                ", status=" + status +
                ", filePath='" + filePath + '\'' +
                ", generatedAt=" + generatedAt +
                ", hasPdfFile=" + hasPdfFile +
                ", isGenerated=" + isGenerated +
                ", isFailed=" + isFailed +
                ", isGenerating=" + isGenerating +
                '}';
    }
}
