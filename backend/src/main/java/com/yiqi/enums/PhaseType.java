package com.yiqi.enums;

/**
 * 头脑风暴阶段类型枚举
 */
public enum PhaseType {
    
    IDEA_GENERATION("创意生成", "各代理从自己的职业角度进行独立头脑风暴"),
    FEASIBILITY_ANALYSIS("技术可行性分析", "各代理从自己的职业角度评判其他代理的创意想法"),
    DRAWBACK_DISCUSSION("缺点讨论", "各代理从自己的职业角度评判和讨论前面阶段的想法缺点");

    private final String displayName;
    private final String description;

    PhaseType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    /**
     * 获取阶段的系统提示词模板
     */
    public String getSystemPromptTemplate() {
        switch (this) {
            case IDEA_GENERATION:
                return "你是一名专业的{roleType}，现在进入头脑风暴的创意生成阶段。" +
                       "请从你的专业角度出发，针对用户提出的主题进行独立的创意思考。" +
                       "要求：1. 发挥你的专业优势 2. 提出具体可行的建议 3. 考虑实际应用场景";
            
            case FEASIBILITY_ANALYSIS:
                return "你是一名专业的{roleType}，现在进入头脑风暴的技术可行性分析阶段。" +
                       "请从你的专业角度出发，分析和评判前面创意生成阶段的各种想法。" +
                       "要求：1. 客观分析可行性 2. 指出潜在问题 3. 提出改进建议";
            
            case DRAWBACK_DISCUSSION:
                return "你是一名专业的{roleType}，现在进入头脑风暴的缺点讨论阶段。" +
                       "请从你的专业角度出发，批判性地分析前面阶段的想法和方案。" +
                       "要求：1. 指出明显缺陷 2. 分析风险因素 3. 提出优化方向";
            
            default:
                return "你是一名专业的{roleType}，请从你的专业角度参与头脑风暴讨论。";
        }
    }

    /**
     * 获取用户提示词模板
     */
    public String getUserPromptTemplate() {
        switch (this) {
            case IDEA_GENERATION:
                return "主题：{topic}\n\n会话背景：{context}\n\n" +
                       "请从你的专业角度为这个主题提出创新的想法和建议。";
            
            case FEASIBILITY_ANALYSIS:
                return "主题：{topic}\n\n会话背景：{context}\n\n" +
                       "前面阶段的创意想法：\n{previousResults}\n\n" +
                       "请分析这些想法的可行性，并提出你的专业意见。";
            
            case DRAWBACK_DISCUSSION:
                return "主题：{topic}\n\n会话背景：{context}\n\n" +
                       "前面阶段的想法和分析：\n{previousResults}\n\n" +
                       "请指出这些想法的缺点和不足，并提出改进建议。";
            
            default:
                return "主题：{topic}\n\n会话背景：{context}\n\n请参与讨论。";
        }
    }

    /**
     * 获取下一个阶段
     */
    public PhaseType getNextPhase() {
        switch (this) {
            case IDEA_GENERATION:
                return FEASIBILITY_ANALYSIS;
            case FEASIBILITY_ANALYSIS:
                return DRAWBACK_DISCUSSION;
            case DRAWBACK_DISCUSSION:
                return null; // 最后一个阶段
            default:
                return null;
        }
    }

    /**
     * 检查是否是最后一个阶段
     */
    public boolean isLastPhase() {
        return this == DRAWBACK_DISCUSSION;
    }

    /**
     * 检查是否是最后一个阶段（别名方法）
     */
    public boolean isLast() {
        return isLastPhase();
    }

    /**
     * 检查是否是第一个阶段
     */
    public boolean isFirst() {
        return this == IDEA_GENERATION;
    }

    /**
     * 获取前一个阶段
     */
    public PhaseType getPrevious() {
        switch (this) {
            case FEASIBILITY_ANALYSIS:
                return IDEA_GENERATION;
            case DRAWBACK_DISCUSSION:
                return FEASIBILITY_ANALYSIS;
            case IDEA_GENERATION:
            default:
                return null; // 第一个阶段没有前一个阶段
        }
    }

    /**
     * 获取下一个阶段（别名方法）
     */
    public PhaseType getNext() {
        return getNextPhase();
    }

    /**
     * 获取阶段顺序
     */
    public int getOrder() {
        switch (this) {
            case IDEA_GENERATION:
                return 1;
            case FEASIBILITY_ANALYSIS:
                return 2;
            case DRAWBACK_DISCUSSION:
                return 3;
            default:
                return 0;
        }
    }
}