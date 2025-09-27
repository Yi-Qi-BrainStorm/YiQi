package com.yiqi.enums;

/**
 * AI代理角色类型枚举
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public enum RoleType {
    
    /**
     * 设计师 - 负责产品设计和创意
     */
    DESIGNER("设计师"),
    
    /**
     * 市场调研员 - 负责市场分析和用户研究
     */
    MARKET_RESEARCHER("市场调研员"),
    
    /**
     * 文化调研员 - 负责文化背景和趋势分析
     */
    CULTURAL_RESEARCHER("文化调研员"),
    
    /**
     * 工程师 - 负责技术可行性分析
     */
    ENGINEER("工程师"),
    
    /**
     * 营销人员 - 负责营销策略和推广方案
     */
    MARKETER("营销人员"),
    
    /**
     * 产品经理 - 负责产品规划和管理
     */
    PRODUCT_MANAGER("产品经理"),
    
    /**
     * 用户体验专家 - 负责用户体验设计和优化
     */
    UX_EXPERT("用户体验专家"),
    
    /**
     * 商业分析师 - 负责商业模式和盈利分析
     */
    BUSINESS_ANALYST("商业分析师"),
    
    /**
     * 创意总监 - 负责创意指导和品牌策略
     */
    CREATIVE_DIRECTOR("创意总监"),
    
    /**
     * 自定义角色 - 用户自定义的角色类型
     */
    CUSTOM("自定义角色");

    private final String description;

    RoleType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    /**
     * 根据字符串值获取枚举
     * 
     * @param value 字符串值
     * @return RoleType枚举
     * @throws IllegalArgumentException 如果值无效
     */
    public static RoleType fromValue(String value) {
        if (value == null) {
            return CUSTOM; // 默认为自定义角色
        }
        
        for (RoleType roleType : values()) {
            if (roleType.name().equals(value)) {
                return roleType;
            }
        }
        
        throw new IllegalArgumentException("无效的角色类型: " + value);
    }

    /**
     * 获取所有预定义角色类型（排除自定义）
     * 
     * @return 预定义角色类型数组
     */
    public static RoleType[] getPredefinedRoles() {
        RoleType[] allRoles = values();
        RoleType[] predefinedRoles = new RoleType[allRoles.length - 1];
        int index = 0;
        for (RoleType role : allRoles) {
            if (role != CUSTOM) {
                predefinedRoles[index++] = role;
            }
        }
        return predefinedRoles;
    }
}