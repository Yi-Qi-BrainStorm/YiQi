package com.yiqi.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeoutException;

/**
 * 全局异常处理器
 * 统一处理应用中的各种异常
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    /**
     * 处理AI服务异常
     */
    @ExceptionHandler(AIServiceException.class)
    public ResponseEntity<ErrorResponse> handleAIServiceException(AIServiceException e, HttpServletRequest request) {
        logger.error("AI服务异常: {}", e.getMessage(), e);
        
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setSuccess(false);
        errorResponse.setErrorCode(e.getErrorCode());
        errorResponse.setMessage(e.getMessage());
        errorResponse.setTimestamp(LocalDateTime.now());
        errorResponse.setPath(request.getRequestURI());
        
        // 根据错误码确定HTTP状态码
        HttpStatus status = determineHttpStatus(e.getErrorCode());
        
        return ResponseEntity.status(status).body(errorResponse);
    }
    
    /**
     * 处理参数验证异常
     */
    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public ResponseEntity<ErrorResponse> handleValidationException(Exception e, HttpServletRequest request) {
        logger.warn("参数验证失败: {}", e.getMessage());
        
        Map<String, String> fieldErrors = new HashMap<>();
        
        if (e instanceof MethodArgumentNotValidException) {
            MethodArgumentNotValidException validException = (MethodArgumentNotValidException) e;
            for (FieldError fieldError : validException.getBindingResult().getFieldErrors()) {
                fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
            }
        } else if (e instanceof BindException) {
            BindException bindException = (BindException) e;
            for (FieldError fieldError : bindException.getBindingResult().getFieldErrors()) {
                fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
            }
        }
        
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setSuccess(false);
        errorResponse.setErrorCode("VALIDATION_FAILED");
        errorResponse.setMessage("参数验证失败");
        errorResponse.setTimestamp(LocalDateTime.now());
        errorResponse.setPath(request.getRequestURI());
        errorResponse.setDetails(fieldErrors);
        
        return ResponseEntity.badRequest().body(errorResponse);
    }
    
    /**
     * 处理超时异常
     */
    @ExceptionHandler(TimeoutException.class)
    public ResponseEntity<ErrorResponse> handleTimeoutException(TimeoutException e, HttpServletRequest request) {
        logger.error("请求超时: {}", e.getMessage(), e);
        
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setSuccess(false);
        errorResponse.setErrorCode("REQUEST_TIMEOUT");
        errorResponse.setMessage("请求处理超时，请稍后重试");
        errorResponse.setTimestamp(LocalDateTime.now());
        errorResponse.setPath(request.getRequestURI());
        
        return ResponseEntity.status(HttpStatus.REQUEST_TIMEOUT).body(errorResponse);
    }
    
    /**
     * 处理非法参数异常
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException e, HttpServletRequest request) {
        logger.warn("非法参数: {}", e.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setSuccess(false);
        errorResponse.setErrorCode("ILLEGAL_ARGUMENT");
        errorResponse.setMessage(e.getMessage());
        errorResponse.setTimestamp(LocalDateTime.now());
        errorResponse.setPath(request.getRequestURI());
        
        return ResponseEntity.badRequest().body(errorResponse);
    }
    
    /**
     * 处理通用异常
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception e, HttpServletRequest request) {
        logger.error("未处理的异常: {}", e.getMessage(), e);
        
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setSuccess(false);
        errorResponse.setErrorCode("INTERNAL_SERVER_ERROR");
        errorResponse.setMessage("服务器内部错误，请联系管理员");
        errorResponse.setTimestamp(LocalDateTime.now());
        errorResponse.setPath(request.getRequestURI());
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
    
    /**
     * 根据错误码确定HTTP状态码
     */
    private HttpStatus determineHttpStatus(String errorCode) {
        if (errorCode == null) {
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }
        
        switch (errorCode) {
            case "AI_SERVICE_UNAVAILABLE":
            case "AI_SERVICE_TIMEOUT":
                return HttpStatus.SERVICE_UNAVAILABLE;
            case "AI_REQUEST_FAILED":
            case "PARALLEL_INFERENCE_FAILED":
                return HttpStatus.BAD_GATEWAY;
            case "AI_EMPTY_RESPONSE":
            case "VALIDATION_FAILED":
                return HttpStatus.BAD_REQUEST;
            case "RETRY_EXHAUSTED":
            case "ASYNC_RETRY_EXHAUSTED":
                return HttpStatus.REQUEST_TIMEOUT;
            default:
                return HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }
    
    /**
     * 错误响应DTO
     */
    public static class ErrorResponse {
        private boolean success;
        private String errorCode;
        private String message;
        private LocalDateTime timestamp;
        private String path;
        private Object details;
        
        // Getters and Setters
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public String getErrorCode() { return errorCode; }
        public void setErrorCode(String errorCode) { this.errorCode = errorCode; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
        
        public String getPath() { return path; }
        public void setPath(String path) { this.path = path; }
        
        public Object getDetails() { return details; }
        public void setDetails(Object details) { this.details = details; }
    }
}