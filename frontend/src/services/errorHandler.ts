import { AxiosError } from 'axios';

export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export class ApiErrorHandler {
  /**
   * 处理API错误
   */
  static handleApiError(error: AxiosError): AppError {
    if (error.response) {
      // 服务器响应错误
      const status = error.response.status;
      const data = error.response.data as any;
      
      switch (status) {
        case 400:
          return {
            code: 'VALIDATION_ERROR',
            message: data?.message || '请求参数错误',
            details: data?.errors,
          };
        case 401:
          return {
            code: 'UNAUTHORIZED',
            message: '认证失败，请重新登录',
          };
        case 403:
          return {
            code: 'FORBIDDEN',
            message: '权限不足，无法执行此操作',
          };
        case 404:
          return {
            code: 'NOT_FOUND',
            message: '请求的资源不存在',
          };
        case 409:
          return {
            code: 'CONFLICT',
            message: data?.message || '资源冲突',
          };
        case 422:
          return {
            code: 'VALIDATION_ERROR',
            message: data?.message || '数据验证失败',
            details: data?.errors,
          };
        case 429:
          return {
            code: 'RATE_LIMIT',
            message: '请求过于频繁，请稍后重试',
          };
        case 500:
          return {
            code: 'SERVER_ERROR',
            message: '服务器内部错误，请稍后重试',
          };
        case 502:
        case 503:
        case 504:
          return {
            code: 'SERVICE_UNAVAILABLE',
            message: '服务暂时不可用，请稍后重试',
          };
        default:
          return {
            code: 'UNKNOWN_ERROR',
            message: data?.message || '未知错误',
          };
      }
    } else if (error.request) {
      // 网络错误
      if (error.code === 'ECONNABORTED') {
        return {
          code: 'TIMEOUT',
          message: '请求超时，请检查网络连接',
        };
      }
      return {
        code: 'NETWORK_ERROR',
        message: '网络连接失败，请检查网络设置',
      };
    } else {
      // 其他错误
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || '发生未知错误',
      };
    }
  }

  /**
   * 格式化错误消息用于用户显示
   */
  static formatErrorMessage(error: AppError): string {
    if (error.details && Array.isArray(error.details)) {
      // 如果有详细的验证错误，显示第一个
      return error.details[0]?.message || error.message;
    }
    return error.message;
  }

  /**
   * 判断是否为可重试的错误
   */
  static isRetryableError(error: AppError): boolean {
    const retryableCodes = [
      'TIMEOUT',
      'NETWORK_ERROR',
      'SERVER_ERROR',
      'SERVICE_UNAVAILABLE',
      'RATE_LIMIT',
    ];
    return retryableCodes.includes(error.code);
  }
}

/**
 * 通用错误处理函数
 */
export function handleError(error: any): AppError {
  if (error.isAxiosError) {
    return ApiErrorHandler.handleApiError(error as AxiosError);
  }
  
  if (error.code && error.message) {
    return error as AppError;
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || '发生未知错误',
  };
}