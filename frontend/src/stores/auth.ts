import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services/authService';
import { useLoadingStore } from './loading';
import { NotificationService } from '@/services/notificationService';
import type { 
  User, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse,
  RegisterResponse 
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
    const loadingStore = useLoadingStore();
    const loadingId = 'auth-login';
    
    loading.value = true;
    error.value = null;
    loadingStore.startLoading(loadingId, '正在登录...');
    
    try {
      const response = await authService.login(credentials);
      
      // 保存用户信息和token
      user.value = response.user;
      token.value = response.accessToken;
      
      // 持久化token
      localStorage.setItem('auth_token', response.accessToken);
      
      // 延迟开始监控认证状态，避免立即检查导致登出
      setTimeout(async () => {
        const { AuthMonitor } = await import('@/utils/authUtils');
        AuthMonitor.getInstance().startMonitoring();
      }, 3000);
      
      // 显示成功提示
      NotificationService.success(`欢迎回来，${response.user.username}！`);
      
      return response;
    } catch (err: any) {
      error.value = err.message || '登录失败';
      // 错误已经在service层处理，这里不需要重复显示
      throw err;
    } finally {
      loading.value = false;
      loadingStore.stopLoading(loadingId);
    }
  };

  /**
   * 用户注册
   */
  const register = async (userData: RegisterData): Promise<RegisterResponse> => {
    const loadingStore = useLoadingStore();
    const loadingId = 'auth-register';
    
    loading.value = true;
    error.value = null;
    loadingStore.startLoading(loadingId, '正在注册账户...');
    
    try {
      const response = await authService.register(userData);
      
      // 注册成功后不自动登录，需要用户手动登录
      // 根据后端API，注册接口只返回用户信息，不包含token
      NotificationService.success('注册成功！请使用您的账户登录。');
      
      return response;
    } catch (err: any) {
      error.value = err.message || '注册失败';
      // 错误已经在service层处理
      throw err;
    } finally {
      loading.value = false;
      loadingStore.stopLoading(loadingId);
    }
  };

  /**
   * 用户登出
   */
  const logout = async (): Promise<void> => {
    const loadingStore = useLoadingStore();
    const loadingId = 'auth-logout';
    
    loadingStore.startLoading(loadingId, '正在登出...');
    
    try {
      // 调用后端登出接口
      await authService.logout();
      NotificationService.success('已安全登出');
    } catch (err) {
      // 即使后端登出失败，也要清除本地状态
      console.warn('后端登出失败:', err);
      NotificationService.warning('登出时发生错误，但已清除本地登录状态');
    } finally {
      // 停止监控认证状态
      const { AuthMonitor } = await import('@/utils/authUtils');
      AuthMonitor.getInstance().stopMonitoring();
      
      // 清除本地状态
      user.value = null;
      token.value = null;
      error.value = null;
      
      // 清除持久化数据
      localStorage.removeItem('auth_token');
      
      loadingStore.stopLoading(loadingId);
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
      const userData = await authService.getCurrentUser();
      user.value = userData;
      return true;
    } catch (err) {
      // token无效，直接清除本地状态，不调用logout避免循环
      console.warn('Token验证失败，清除本地认证状态:', err);
      user.value = null;
      token.value = null;
      localStorage.removeItem('auth_token');
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 刷新token（当前后端API暂不支持token刷新）
   * JWT是无状态的，过期后需要重新登录
   */
  const refreshToken = async (): Promise<void> => {
    // 当前后端不支持token刷新，直接抛出错误要求重新登录
    await logout();
    throw new Error('Token已过期，请重新登录');
  };

  /**
   * 清除错误状态
   */
  const clearError = (): void => {
    error.value = null;
  };

  /**
   * 清除所有认证状态
   */
  const clearAuth = (): void => {
    user.value = null;
    token.value = null;
    error.value = null;
    localStorage.removeItem('auth_token');
  };

  /**
   * 初始化认证状态
   */
  const initialize = async (): Promise<void> => {
    // 简化初始化，只检查token是否存在
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      token.value = storedToken;
      // 不在初始化时验证token，让路由守卫处理
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
    clearAuth,
    initialize,
  };
});