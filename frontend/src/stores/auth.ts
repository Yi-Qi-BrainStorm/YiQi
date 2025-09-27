import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services/authService';
import type { 
  User, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse 
} from '@/types/user';

/**
 * 认证状态管理Store
 */
export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('auth_token'));
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isLoading = computed(() => loading.value);

  /**
   * 用户登录
   */
  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await authService.login(credentials);
      
      // 保存用户信息和token
      user.value = response.user;
      token.value = response.token;
      
      // 持久化token
      localStorage.setItem('auth_token', response.token);
      
      return response;
    } catch (err: any) {
      error.value = err.message || '登录失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 用户注册
   */
  const register = async (userData: RegisterData): Promise<AuthResponse> => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await authService.register(userData);
      
      // 注册成功后自动登录
      user.value = response.user;
      token.value = response.token;
      
      // 持久化token
      localStorage.setItem('auth_token', response.token);
      
      return response;
    } catch (err: any) {
      error.value = err.message || '注册失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 用户登出
   */
  const logout = async (): Promise<void> => {
    try {
      // 调用后端登出接口
      await authService.logout();
    } catch (err) {
      // 即使后端登出失败，也要清除本地状态
      console.warn('后端登出失败:', err);
    } finally {
      // 清除本地状态
      user.value = null;
      token.value = null;
      error.value = null;
      
      // 清除持久化数据
      localStorage.removeItem('auth_token');
    }
  };

  /**
   * 检查认证状态
   */
  const checkAuth = async (): Promise<boolean> => {
    if (!token.value) {
      return false;
    }
    
    loading.value = true;
    
    try {
      const response = await authService.getCurrentUser();
      user.value = response.user;
      return true;
    } catch (err) {
      // token无效，清除认证状态
      await logout();
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 刷新token
   */
  const refreshToken = async (): Promise<void> => {
    try {
      const response = await authService.refreshToken();
      token.value = response.token;
      localStorage.setItem('auth_token', response.token);
    } catch (err) {
      // 刷新失败，清除认证状态
      await logout();
      throw err;
    }
  };

  /**
   * 清除错误状态
   */
  const clearError = (): void => {
    error.value = null;
  };

  /**
   * 初始化认证状态
   */
  const initialize = async (): Promise<void> => {
    if (token.value) {
      await checkAuth();
    }
  };

  return {
    // 状态
    user,
    token,
    loading,
    error,
    
    // 计算属性
    isAuthenticated,
    isLoading,
    
    // 方法
    login,
    register,
    logout,
    checkAuth,
    refreshToken,
    clearError,
    initialize,
  };
});