package com.yiqi.enums;

/**
 * 头脑风暴阶段类型枚举
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public enum PhaseType {
    
    /**
     * 创意生成阶段 - 每个代理从自己的职业角度进行独立头脑风暴
     */
    IDEA_GENERATION("创意生成"),
    
    /**
     * 技术可行性分析阶段 - 每个代理从自己的职业角度评判其他代理的创意想法
     */
    FEASIBILITY_ANALYSIS("技术可行性分析"),
    
    /**
     * 缺点讨论阶段 - 每个代理从自己的职业角度评判和讨论前面阶段的想法缺点
     */
    CRITICISM_DISCUSSION("缺点讨论");

    private final String description;

    PhaseType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    /**
     * 根据字符串值获取枚举
     * 
     * @param value 字符串值
     * @return PhaseType枚举
     * @throws IllegalArgumentException 如果值无效
     */
    public static PhaseType fromValue(String value) {
        if (value == null) {
            return IDEA_GENERATION; // 默认值
        }
        
        for (PhaseType type : values()) {
            if (type.name().equals(value)) {
                return type;
            }
        }
        
        throw new IllegalArgumentException("无效的阶段类型: " + value);
    }

    /**
     * 获取下一个阶段类型
     * 
     * @return 下一个阶段类型，如果是最后一个阶段则返回null
     */
    public PhaseType getNext() {
        switch (this) {
            case IDEA_GENERATION:
                return FEASIBILITY_ANALYSIS;
            case FEASIBILITY_ANALYSIS:
                return CRITICISM_DISCUSSION;
            case CRITICISM_DISCUSSION:
                return null; // 最后一个阶段
            default:
                return null;
        }
    }

    /**
     * 获取前一个阶段类型
     * 
     * @return 前一个阶段类型，如果是第一个阶段则返回null
     */
    public PhaseType getPrevious() {
        switch (this) {
            case IDEA_GENERATION:
                return null; // 第一个阶段
            case FEASIBILITY_ANALYSIS:
                return IDEA_GENERATION;
            case CRITICISM_DISCUSSION:
                return FEASIBILITY_ANALYSIS;
            default:
                return null;
        }
    }

    /**
     * 检查是否为第一个阶段
     * 
     * @return true如果是第一个阶段
     */
    public boolean isFirst() {
        return this == IDEA_GENERATION;
    }

    /**
     * 检查是否为最后一个阶段
     * 
     * @return true如果是最后一个阶段
     */
    public boolean isLast() {
        return this == CRITICISM_DISCUSSION;
    }
}