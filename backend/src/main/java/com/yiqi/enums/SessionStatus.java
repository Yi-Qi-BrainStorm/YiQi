package com.yiqi.enums;

/**
 * 头脑风暴会话状态枚举
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public enum SessionStatus {
    
    /**
     * 已创建 - 会话已创建但未开始
     */
    CREATED("已创建"),
    
    /**
     * 进行中 - 会话正在进行
     */
    IN_PROGRESS("进行中"),
    
    /**
     * 已暂停 - 会话已暂停
     */
    PAUSED("已暂停"),
    
    /**
     * 已完成 - 会话已完成所有阶段
     */
    COMPLETED("已完成"),
    
    /**
     * 已取消 - 会话被用户取消
     */
    CANCELLED("已取消");

    private final String description;

    SessionStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    /**
     * 根据字符串值获取枚举
     * 
     * @param value 字符串值
     * @return SessionStatus枚举
     * @throws IllegalArgumentException 如果值无效
     */
    public static SessionStatus fromValue(String value) {
        if (value == null) {
            return CREATED; // 默认值
        }
        
        for (SessionStatus status : values()) {
            if (status.name().equals(value)) {
                return status;
            }
        }
        
        throw new IllegalArgumentException("无效的会话状态: " + value);
    }

    /**
     * 检查状态是否可以启动会话
     * 
     * @return true如果可以启动
     */
    public boolean canStart() {
        return this == CREATED || this == PAUSED;
    }

    /**
     * 检查状态是否可以暂停会话
     * 
     * @return true如果可以暂停
     */
    public boolean canPause() {
        return this == IN_PROGRESS;
    }

    /**
     * 检查状态是否为活跃状态（进行中或暂停）
     * 
     * @return true如果是活跃状态
     */
    public boolean isActive() {
        return this == IN_PROGRESS || this == PAUSED;
    }

    /**
     * 检查状态是否为终止状态（完成或取消）
     * 
     * @return true如果是终止状态
     */
    public boolean isTerminated() {
        return this == COMPLETED || this == CANCELLED;
    }
}