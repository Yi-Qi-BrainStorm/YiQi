import { AxiosError } from 'axios';
import { message, notification } from 'ant-design-vue';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp?: string;
  requestId?: string;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
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
 * 全局错误处理器
 */
export class GlobalErrorHandler {
  private static errorQueue: AppError[] = [];
  private static maxQueueSize = 50;
  private static isOnline = navigator.onLine;

  /**
   * 初始化全局错误处理
   */
  static init() {
    // 监听网络状态
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineErrors();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // 监听未捕获的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      console.error('未处理的Promise错误:', event.reason);
      this.handleError(event.reason, { component: 'Global', action: 'UnhandledPromise' });
      event.preventDefault();
    });

    // 监听JavaScript错误
    window.addEventListener('error', (event) => {
      console.error('JavaScript错误:', event.error);
      this.handleError(event.error, { component: 'Global', action: 'JavaScriptError' });
    });

    // 监听认证失效事件
    window.addEventListener('auth:expired', () => {
      this.handleAuthExpired();
    });
  }

  /**
   * 处理错误
   */
  static handleError(error: any, context?: ErrorContext): AppError {
    const appError = this.normalizeError(error);
    
    // 添加上下文信息
    if (context) {
      appError.details = {
        ...appError.details,
        context,
      };
    }

    // 记录错误
    this.logError(appError, context);

    // 如果离线，加入队列
    if (!this.isOnline) {
      this.queueError(appError);
      this.showOfflineMessage();
      return appError;
    }

    // 显示用户友好的错误提示
    this.showErrorToUser(appError, context);

    // 上报错误（如果需要）
    this.reportError(appError, context);

    return appError;
  }

  /**
   * 标准化错误格式
   */
  private static normalizeError(error: any): AppError {
    if (error.isAxiosError) {
      return ApiErrorHandler.handleApiError(error as AxiosError);
    }
    
    if (error.code && error.message) {
      return {
        ...error,
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || '发生未知错误',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 记录错误日志
   */
  private static logError(error: AppError, context?: ErrorContext) {
    const logData = {
      error,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('应用错误:', logData);

    // 在开发环境下显示详细信息
    if (import.meta.env.DEV) {
      console.group('错误详情');
      console.error('错误代码:', error.code);
      console.error('错误消息:', error.message);
      console.error('错误详情:', error.details);
      console.error('上下文:', context);
      console.groupEnd();
    }
  }

  /**
   * 向用户显示错误
   */
  private static showErrorToUser(error: AppError, context?: ErrorContext) {
    const errorMessage = ApiErrorHandler.formatErrorMessage(error);

    switch (error.code) {
      case 'NETWORK_ERROR':
        message.error('网络连接失败，请检查网络设置', 5);
        break;

      case 'TIMEOUT':
        message.warning('请求超时，请稍后重试', 3);
        break;

      case 'VALIDATION_ERROR':
        message.warning(errorMessage, 4);
        break;

      case 'UNAUTHORIZED':
        // 认证错误由专门的处理函数处理
        break;

      case 'FORBIDDEN':
        message.error('权限不足，无法执行此操作', 4);
        break;

      case 'NOT_FOUND':
        message.warning('请求的资源不存在', 3);
        break;

      case 'SERVER_ERROR':
      case 'SERVICE_UNAVAILABLE':
        notification.error({
          message: '系统错误',
          description: '服务暂时不可用，请稍后重试',
          duration: 6,
        });
        break;

      case 'RATE_LIMIT':
        message.warning('操作过于频繁，请稍后重试', 4);
        break;

      default:
        // 对于未知错误，显示通用消息
        if (context?.component) {
          notification.error({
            message: '操作失败',
            description: errorMessage || '操作失败，请重试',
            duration: 5,
          });
        } else {
          message.error(errorMessage || '发生未知错误', 4);
        }
    }
  }

  /**
   * 处理认证失效
   */
  private static handleAuthExpired() {
    notification.warning({
      message: '登录已过期',
      description: '您的登录已过期，请重新登录',
      duration: 0, // 不自动关闭
      onClick: () => {
        window.location.href = '/login';
      },
    });

    // 3秒后自动跳转
    setTimeout(() => {
      window.location.href = '/login';
    }, 3000);
  }

  /**
   * 显示离线消息
   */
  private static showOfflineMessage() {
    message.warning('网络连接已断开，操作将在网络恢复后重试', 5);
  }

  /**
   * 将错误加入离线队列
   */
  private static queueError(error: AppError) {
    if (this.errorQueue.length >= this.maxQueueSize) {
      this.errorQueue.shift(); // 移除最旧的错误
    }
    this.errorQueue.push(error);
  }

  /**
   * 处理离线期间的错误
   */
  private static processOfflineErrors() {
    if (this.errorQueue.length > 0) {
      message.success('网络已恢复连接', 3);

      // 清空队列
      this.errorQueue = [];
    }
  }

  /**
   * 上报错误到监控系统
   */
  private static reportError(error: AppError, context?: ErrorContext) {
    // 在生产环境中，这里可以集成错误监控服务
    if (import.meta.env.PROD) {
      // 示例：发送到错误监控服务
      // errorMonitoringService.report(error, context);
    }
  }

  /**
   * 获取错误统计
   */
  static getErrorStats() {
    return {
      queueSize: this.errorQueue.length,
      isOnline: this.isOnline,
    };
  }

  /**
   * 清除错误队列
   */
  static clearErrorQueue() {
    this.errorQueue = [];
  }
}

/**
 * 通用错误处理函数
 */
export function handleError(error: any, context?: ErrorContext): AppError {
  return GlobalErrorHandler.handleError(error, context);
}

/**
 * Vue错误处理插件
 */
export function setupGlobalErrorHandler(app: any) {
  // 初始化全局错误处理
  GlobalErrorHandler.init();

  // Vue错误处理
  app.config.errorHandler = (error: Error, instance: any, info: string) => {
    console.error('Vue错误:', error, info);
    GlobalErrorHandler.handleError(error, {
      component: instance?.$options.name || 'Unknown',
      action: 'VueError',
      metadata: { info },
    });
  };

  // 警告处理
  app.config.warnHandler = (msg: string, instance: any, trace: string) => {
    if (import.meta.env.DEV) {
      console.warn('Vue警告:', msg, trace);
    }
  };
}