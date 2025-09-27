package com.yiqi.dto.parallel;

/**
 * 推理性能统计
 */
public class InferencePerformanceStats {
    
    private int totalInferences;
    private int successfulInferences;
    private int failedInferences;
    private double successRate;
    private long averageResponseTime; // 毫秒
    
    // Getters and Setters
    public int getTotalInferences() {
        return totalInferences;
    }
    
    public void setTotalInferences(int totalInferences) {
        this.totalInferences = totalInferences;
    }
    
    public int getSuccessfulInferences() {
        return successfulInferences;
    }
    
    public void setSuccessfulInferences(int successfulInferences) {
        this.successfulInferences = successfulInferences;
    }
    
    public int getFailedInferences() {
        return failedInferences;
    }
    
    public void setFailedInferences(int failedInferences) {
        this.failedInferences = failedInferences;
    }
    
    public double getSuccessRate() {
        return successRate;
    }
    
    public void setSuccessRate(double successRate) {
        this.successRate = successRate;
    }
    
    public long getAverageResponseTime() {
        return averageResponseTime;
    }
    
    public void setAverageResponseTime(long averageResponseTime) {
        this.averageResponseTime = averageResponseTime;
    }
}