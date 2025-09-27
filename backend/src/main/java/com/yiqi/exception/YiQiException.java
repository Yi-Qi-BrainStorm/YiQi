package com.yiqi.exception;

/**
 * 意启平台基础异常类
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public class YiQiException extends RuntimeException {

    private final String errorCode;

    public YiQiException(String message) {
        super(message);
        this.errorCode = "GENERAL_ERROR";
    }

    public YiQiException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public YiQiException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "GENERAL_ERROR";
    }

    public YiQiException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
