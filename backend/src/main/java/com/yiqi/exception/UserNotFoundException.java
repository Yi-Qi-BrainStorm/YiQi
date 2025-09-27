package com.yiqi.exception;

/**
 * 用户未找到异常
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public class UserNotFoundException extends YiQiException {

    public UserNotFoundException(String message) {
        super("USER_NOT_FOUND", message);
    }

    public UserNotFoundException(String message, Throwable cause) {
        super("USER_NOT_FOUND", message, cause);
    }
}
