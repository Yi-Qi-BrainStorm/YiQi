package com.yiqi.exception;

/**
 * 验证异常
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public class ValidationException extends YiQiException {

    public ValidationException(String message) {
        super("VALIDATION_ERROR", message);
    }

    public ValidationException(String message, Throwable cause) {
        super("VALIDATION_ERROR", message, cause);
    }
}
