package com.yiqi.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 提交阶段审核请求DTO
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public class SubmitPhaseForApprovalRequest {

    /**
     * 阶段总结
     */
    @NotBlank(message = "阶段总结不能为空")
    @Size(max = 2000, message = "阶段总结长度不能超过2000个字符")
    private String summary;

    // 默认构造函数
    public SubmitPhaseForApprovalRequest() {}

    // 构造函数
    public SubmitPhaseForApprovalRequest(String summary) {
        this.summary = summary;
    }

    // Getter和Setter方法
    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    @Override
    public String toString() {
        return "SubmitPhaseForApprovalRequest{" +
                "summary='" + summary + '\'' +
                '}';
    }
}