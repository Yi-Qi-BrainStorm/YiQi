package com.yiqi.exception;

/**
 * 认证异常
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public class AuthenticationException extends YiQiException {

    public AuthenticationException(String message) {
        super("AUTHENTICATION_ERROR", message);
    }

    public AuthenticationException(String message, Throwable cause) {
        super("AUTHENTICATION_ERROR", message, cause);
    }
}
