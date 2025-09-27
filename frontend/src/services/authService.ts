import { ApiService } from './api';
import { handleError, type ErrorContext } from './errorHandler';
import type { 
  LoginCredentials, 
  RegisterData, 
  BackendRegisterData,
  User, 
  AuthResponse,
  RegisterResponse 
} from '@/types/user';

/**
 * 认证相关API服务
 * 基于后端 /users 路径的API接口
 */
export class AuthService {
  /**
   * 用户登录
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      return await ApiService.post<AuthResponse>('/users/login', credentials);
    } catch (error) {
      const context: ErrorContext = {
        component: 'AuthService',
        action: 'login',
        metadata: { username: credentials.username },
      };
      throw handleError(error, context);
    }
  }

  /**
   * 用户注册
   */
  static async register(userData: RegisterData): Promise<RegisterResponse> {
    try {
      // Convert to backend-compatible format (remove email for now)
      const backendData: BackendRegisterData = {
        username: userData.username,
        password: userData.password,
      };
      return await ApiService.post<RegisterResponse>('/users/register', backendData);
    } catch (error) {
      const context: ErrorContext = {
        component: 'AuthService',
        action: 'register',
        metadata: { username: userData.username },
      };
      throw handleError(error, context);
    }
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(): Promise<User> {
    try {
      return await ApiService.get<User>('/users/me');
    } catch (error) {
      const context: ErrorContext = {
        component: 'AuthService',
        action: 'getCurrentUser',
      };
      throw handleError(error, context);
    }
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<void> {
    try {
      return await ApiService.post<void>('/users/logout');
    } catch (error) {
      const context: ErrorContext = {
        component: 'AuthService',
        action: 'logout',
      };
      throw handleError(error, context);
    }
  }

  // 注意：以下功能在当前后端API中暂未实现，保留接口以备将来扩展
  
  /**
   * 发送密码重置邮件（暂未实现）
   */
  static async forgotPassword(email: string): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>('/users/forgot-password', { email });
  }

  /**
   * 重置密码（暂未实现）
   */
  static async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>('/users/reset-password', {
      token,
      password,
    });
  }

  /**
   * 验证邮箱（暂未实现）
   */
  static async verifyEmail(token: string): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>('/users/verify-email', { token });
  }

  /**
   * 重新发送验证邮件（暂未实现）
   */
  static async resendVerificationEmail(): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>('/users/resend-verification');
  }
}

export const authService = AuthService;