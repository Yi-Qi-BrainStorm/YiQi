package com.yiqi.exception;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

/**
 * 全局异常处理器
 * 
 * @author YiQi Team
 * @since 1.0.0
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 处理意启平台异常
     */
    @ExceptionHandler(YiQiException.class)
    public ResponseEntity<ErrorResponse> handleYiQiException(YiQiException ex, WebRequest request) {
        logger.error("业务异常: {}", ex.getMessage(), ex);
        
        ErrorResponse errorResponse = new ErrorResponse(
            false,
            ex.getErrorCode(),
            ex.getMessage(),
            LocalDateTime.now(),
            request.getDescription(false).replace("uri=", "")
        );
        
        HttpStatus status = getHttpStatusForErrorCode(ex.getErrorCode());
        return new ResponseEntity<>(errorResponse, status);
    }

    /**
     * 处理认证异常
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(AuthenticationException ex, WebRequest request) {
        logger.error("认证异常: {}", ex.getMessage(), ex);
        
        ErrorResponse errorResponse = new ErrorResponse(
            false,
            ex.getErrorCode(),
            ex.getMessage(),
            LocalDateTime.now(),
            request.getDescription(false).replace("uri=", "")
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

    /**
     * 处理验证异常
     */
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(ValidationException ex, WebRequest request) {
        logger.error("验证异常: {}", ex.getMessage(), ex);
        
        ErrorResponse errorResponse = new ErrorResponse(
            false,
            ex.getErrorCode(),
            ex.getMessage(),
            LocalDateTime.now(),
            request.getDescription(false).replace("uri=", "")
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * 处理用户未找到异常
     */
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFoundException(UserNotFoundException ex, WebRequest request) {
        logger.error("用户未找到异常: {}", ex.getMessage(), ex);
        
        ErrorResponse errorResponse = new ErrorResponse(
            false,
            ex.getErrorCode(),
            ex.getMessage(),
            LocalDateTime.now(),
            request.getDescription(false).replace("uri=", "")
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    /**
     * 处理参数验证异常
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException ex, WebRequest request) {
        
        logger.error("参数验证异常: {}", ex.getMessage());
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        ErrorResponse errorResponse = new ErrorResponse(
            false,
            "VALIDATION_ERROR",
            "请求参数验证失败",
            LocalDateTime.now(),
            request.getDescription(false).replace("uri=", "")
        );
        errorResponse.setDetails(errors);
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * 处理通用异常
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, WebRequest request) {
        logger.error("系统异常: {}", ex.getMessage(), ex);
        
        ErrorResponse errorResponse = new ErrorResponse(
            false,
            "INTERNAL_SERVER_ERROR",
            "系统内部错误",
            LocalDateTime.now(),
            request.getDescription(false).replace("uri=", "")
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * 根据错误代码获取HTTP状态码
     */
    private HttpStatus getHttpStatusForErrorCode(String errorCode) {
        switch (errorCode) {
            case "AUTHENTICATION_ERROR":
                return HttpStatus.UNAUTHORIZED;
            case "VALIDATION_ERROR":
                return HttpStatus.BAD_REQUEST;
            case "USER_NOT_FOUND":
                return HttpStatus.NOT_FOUND;
            default:
                return HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }

    /**
     * 错误响应类
     */
    public static class ErrorResponse {
        private boolean success;
        private String errorCode;
        private String message;
        private LocalDateTime timestamp;
        private String path;
        private Object details;

        public ErrorResponse(boolean success, String errorCode, String message, LocalDateTime timestamp, String path) {
            this.success = success;
            this.errorCode = errorCode;
            this.message = message;
            this.timestamp = timestamp;
            this.path = path;
        }

        // Getters and Setters
        public boolean isSuccess() {
            return success;
        }

        public void setSuccess(boolean success) {
            this.success = success;
        }

        public String getErrorCode() {
            return errorCode;
        }

        public void setErrorCode(String errorCode) {
            this.errorCode = errorCode;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public LocalDateTime getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }

        public String getPath() {
            return path;
        }

        public void setPath(String path) {
            this.path = path;
        }

        public Object getDetails() {
            return details;
        }

        public void setDetails(Object details) {
            this.details = details;
        }
    }
}
