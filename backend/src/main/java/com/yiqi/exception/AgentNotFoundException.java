package com.yiqi.exception;

/**
 * AI代理未找到异常
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public class AgentNotFoundException extends YiQiException {

    public AgentNotFoundException(String message) {
        super("AGENT_NOT_FOUND", message);
    }

    public AgentNotFoundException(String message, Throwable cause) {
        super("AGENT_NOT_FOUND", message, cause);
    }
}