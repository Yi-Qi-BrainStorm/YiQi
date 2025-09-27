import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '@/constants/api';
import { ApiErrorHandler, AppError } from './errorHandler';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 自动添加认证token和请求ID
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 添加请求ID用于追踪
    config.headers['X-Request-ID'] = generateRequestId();
    
    // 添加时间戳
    config.metadata = {
      startTime: Date.now(),
    };
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理和日志记录
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // 记录请求耗时
    const config = response.config as any;
    if (config.metadata?.startTime) {
      const duration = Date.now() - config.metadata.startTime;
      console.debug(`API请求完成: ${config.method?.toUpperCase()} ${config.url} - ${duration}ms`);
    }
    
    return response;
  },
  (error: AxiosError) => {
    // 使用统一错误处理器
    const appError = ApiErrorHandler.handleApiError(error);
    
    // 记录错误信息
    console.error('API请求失败:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      error: appError,
    });
    
    // 处理认证失效
    if (appError.code === 'UNAUTHORIZED') {
      // 清除本地token
      localStorage.removeItem('token');
      // 触发全局认证失效事件
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    
    // 抛出格式化的错误
    return Promise.reject(appError);
  }
);

// 生成请求ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// API基础服务类
export class ApiService {
  /**
   * GET请求
   */
  static async get<T = any>(url: string, config?: any): Promise<T> {
    try {
      const response = await api.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw error as AppError;
    }
  }

  /**
   * POST请求
   */
  static async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response = await api.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error as AppError;
    }
  }

  /**
   * PUT请求
   */
  static async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response = await api.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error as AppError;
    }
  }

  /**
   * PATCH请求
   */
  static async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response = await api.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error as AppError;
    }
  }

  /**
   * DELETE请求
   */
  static async delete<T = any>(url: string, config?: any): Promise<T> {
    try {
      const response = await api.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw error as AppError;
    }
  }

  /**
   * 上传文件
   */
  static async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post<T>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: any) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw error as AppError;
    }
  }

  /**
   * 下载文件
   */
  static async download(url: string, filename?: string): Promise<void> {
    try {
      const response = await api.get(url, {
        responseType: 'blob',
      });

      // 创建下载链接
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      throw error as AppError;
    }
  }

  /**
   * 批量请求
   */
  static async batch<T = any>(requests: Array<() => Promise<any>>): Promise<T[]> {
    try {
      const results = await Promise.allSettled(requests.map(req => req()));
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error(`批量请求第${index + 1}个失败:`, result.reason);
          throw result.reason;
        }
      });
    } catch (error) {
      throw error as AppError;
    }
  }

  /**
   * 重试请求
   */
  static async retry<T = any>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: AppError;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as AppError;
        
        // 如果不是可重试的错误，直接抛出
        if (!ApiErrorHandler.isRetryableError(lastError)) {
          throw lastError;
        }

        // 如果是最后一次重试，抛出错误
        if (i === maxRetries) {
          throw lastError;
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }

    throw lastError!;
  }
}

export default api;