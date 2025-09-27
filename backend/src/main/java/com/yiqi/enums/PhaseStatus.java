package com.yiqi.enums;

/**
 * 头脑风暴阶段状态枚举
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public enum PhaseStatus {
    
    /**
     * 未开始 - 阶段尚未开始
     */
    NOT_STARTED("未开始"),
    
    /**
     * 进行中 - 阶段正在进行，代理正在思考
     */
    IN_PROGRESS("进行中"),
    
    /**
     * 等待审核 - 阶段完成，等待用户审核
     */
    WAITING_APPROVAL("等待审核"),
    
    /**
     * 已通过 - 用户审核通过，可以进入下一阶段
     */
    APPROVED("已通过"),
    
    /**
     * 已拒绝 - 用户审核拒绝，需要重新执行
     */
    REJECTED("已拒绝"),
    
    /**
     * 已完成 - 阶段最终完成
     */
    COMPLETED("已完成");

    private final String description;

    PhaseStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    /**
     * 根据字符串值获取枚举
     * 
     * @param value 字符串值
     * @return PhaseStatus枚举
     * @throws IllegalArgumentException 如果值无效
     */
    public static PhaseStatus fromValue(String value) {
        if (value == null) {
            return NOT_STARTED; // 默认值
        }
        
        for (PhaseStatus status : values()) {
            if (status.name().equals(value)) {
                return status;
            }
        }
        
        throw new IllegalArgumentException("无效的阶段状态: " + value);
    }

    /**
     * 检查状态是否可以开始执行
     * 
     * @return true如果可以开始执行
     */
    public boolean canStart() {
        return this == NOT_STARTED || this == REJECTED;
    }

    /**
     * 检查状态是否可以提交审核
     * 
     * @return true如果可以提交审核
     */
    public boolean canSubmitForApproval() {
        return this == IN_PROGRESS;
    }

    /**
     * 检查状态是否可以审核
     * 
     * @return true如果可以审核
     */
    public boolean canReview() {
        return this == WAITING_APPROVAL;
    }

    /**
     * 检查状态是否为进行中
     * 
     * @return true如果正在进行
     */
    public boolean isInProgress() {
        return this == IN_PROGRESS;
    }

    /**
     * 检查状态是否为终止状态（已完成）
     * 
     * @return true如果是终止状态
     */
    public boolean isTerminated() {
        return this == COMPLETED;
    }

    /**
     * 检查状态是否需要用户操作
     * 
     * @return true如果需要用户操作
     */
    public boolean requiresUserAction() {
        return this == WAITING_APPROVAL;
    }
}