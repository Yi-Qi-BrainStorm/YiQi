package com.yiqi.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Size;
import java.util.List;

/**
 * 创建头脑风暴会话请求DTO
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public class CreateSessionRequest {

    /**
     * 会话标题
     */
    @NotBlank(message = "会话标题不能为空")
    @Size(max = 200, message = "会话标题长度不能超过200个字符")
    private String title;

    /**
     * 会话描述
     */
    @Size(max = 1000, message = "会话描述长度不能超过1000个字符")
    private String description;

    /**
     * 参与会话的代理ID列表
     */
    @NotEmpty(message = "必须选择至少一个AI代理参与会话")
    private List<Long> agentIds;

    // 默认构造函数
    public CreateSessionRequest() {}

    // 构造函数
    public CreateSessionRequest(String title, String description, List<Long> agentIds) {
        this.title = title;
        this.description = description;
        this.agentIds = agentIds;
    }

    // Getter和Setter方法
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<Long> getAgentIds() {
        return agentIds;
    }

    public void setAgentIds(List<Long> agentIds) {
        this.agentIds = agentIds;
    }

    @Override
    public String toString() {
        return "CreateSessionRequest{" +
                "title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", agentIds=" + agentIds +
                '}';
    }
}