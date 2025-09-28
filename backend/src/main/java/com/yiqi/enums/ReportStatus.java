package com.yiqi.enums;

/**
 * 报告状态枚举
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public enum ReportStatus {
    
    /**
     * 生成中
     */
    GENERATING("生成中"),
    
    /**
     * 已生成
     */
    GENERATED("已生成"),
    
    /**
     * 生成失败
     */
    FAILED("生成失败");

    private final String description;

    ReportStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    /**
     * 检查是否为最终状态
     * 
     * @return true如果是最终状态
     */
    public boolean isFinalStatus() {
        return this == GENERATED || this == FAILED;
    }

    /**
     * 检查是否为成功状态
     * 
     * @return true如果是成功状态
     */
    public boolean isSuccess() {
        return this == GENERATED;
    }

    /**
     * 检查是否为失败状态
     * 
     * @return true如果是失败状态
     */
    public boolean isFailed() {
        return this == FAILED;
    }

    /**
     * 检查是否正在处理中
     * 
     * @return true如果正在处理中
     */
    public boolean isProcessing() {
        return this == GENERATING;
    }
}
