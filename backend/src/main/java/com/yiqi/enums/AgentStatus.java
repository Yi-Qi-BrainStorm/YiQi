package com.yiqi.enums;

/**
 * AI代理状态枚举
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public enum AgentStatus {
    
    /**
     * 活跃状态 - 代理可以正常使用
     */
    ACTIVE("活跃"),
    
    /**
     * 非活跃状态 - 代理暂时停用
     */
    INACTIVE("非活跃"),
    
    /**
     * 已删除状态 - 代理已被删除（软删除）
     */
    DELETED("已删除");

    private final String description;

    AgentStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    /**
     * 根据字符串值获取枚举
     * 
     * @param value 字符串值
     * @return AgentStatus枚举
     * @throws IllegalArgumentException 如果值无效
     */
    public static AgentStatus fromValue(String value) {
        if (value == null) {
            return ACTIVE; // 默认值
        }
        
        for (AgentStatus status : values()) {
            if (status.name().equals(value)) {
                return status;
            }
        }
        
        throw new IllegalArgumentException("无效的代理状态: " + value);
    }

    /**
     * 检查状态是否为活跃状态
     * 
     * @return true如果是活跃状态
     */
    public boolean isActive() {
        return this == ACTIVE;
    }

    /**
     * 检查状态是否为已删除状态
     * 
     * @return true如果是已删除状态
     */
    public boolean isDeleted() {
        return this == DELETED;
    }
}