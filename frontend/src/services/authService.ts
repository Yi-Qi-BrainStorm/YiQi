import { ApiService } from './api';
import type { 
  LoginCredentials, 
  RegisterData, 
  User, 
  AuthResponse 
} from '@/types/user';

/**
 * 认证相关API服务
 */
export class AuthService {
  /**
   * 用户登录
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return ApiService.post<AuthResponse>('/auth/login', credentials);
  }

  /**
   * 用户注册
   */
  static async register(userData: RegisterData): Promise<AuthResponse> {
    return ApiService.post<AuthResponse>('/auth/register', userData);
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(): Promise<{ user: User }> {
    return ApiService.get<{ user: User }>('/auth/me');
  }

  /**
   * 刷新token
   */
  static async refreshToken(): Promise<{ token: string }> {
    return ApiService.post<{ token: string }>('/auth/refresh');
  }

  /**
   * 用户登出
   */
  static async logout(): Promise<void> {
    return ApiService.post<void>('/auth/logout');
  }

  /**
   * 发送密码重置邮件
   */
  static async forgotPassword(email: string): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>('/auth/forgot-password', { email });
  }

  /**
   * 重置密码
   */
  static async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>('/auth/reset-password', {
      token,
      password,
    });
  }

  /**
   * 验证邮箱
   */
  static async verifyEmail(token: string): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>('/auth/verify-email', { token });
  }

  /**
   * 重新发送验证邮件
   */
  static async resendVerificationEmail(): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>('/auth/resend-verification');
  }
}

export const authService = AuthService;