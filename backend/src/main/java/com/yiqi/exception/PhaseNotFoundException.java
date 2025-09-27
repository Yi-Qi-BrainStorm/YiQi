package com.yiqi.exception;

/**
 * 阶段未找到异常
 * 当指定的头脑风暴阶段不存在时抛出
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
public class PhaseNotFoundException extends YiQiException {

    public PhaseNotFoundException(String message) {
        super("PHASE_NOT_FOUND", message);
    }

    public PhaseNotFoundException(String message, Throwable cause) {
        super("PHASE_NOT_FOUND", message, cause);
    }
}