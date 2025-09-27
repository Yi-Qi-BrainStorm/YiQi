package com.yiqi.exception;

/**
 * 会话未找到异常
 * 当指定的头脑风暴会话不存在时抛出
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public class SessionNotFoundException extends YiQiException {

    public SessionNotFoundException(String message) {
        super("SESSION_NOT_FOUND", message);
    }

    public SessionNotFoundException(String message, Throwable cause) {
        super("SESSION_NOT_FOUND", message, cause);
    }
}