import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import type { 
  LoginCredentials, 
  RegisterData, 
  User,
  AuthResponse,
  RegisterResponse 
} from '@/types/user';

/**
 * 认证相关的组合式函数
 * 提供登录、注册、登出的响应式接口和认证状态的计算属性
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export function useAuth() {
  const authStore = useAuthStore();
  const router = useRouter();

  // 响应式状态
  const user = computed(() => authStore.user);
  const token = computed(() => authStore.token);
  const loading = computed(() => authStore.loading);
  const error = computed(() => authStore.error);
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const isLoading = computed(() => authStore.isLoading);

  /**
   * 用户登录
   * Requirement 1.3: 用户使用正确的凭据登录时验证身份并重定向到主工作台
   */
  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await authStore.login(credentials);
      
      // 登录成功后重定向到主工作台
      await router.push('/dashboard');
      
      return response;
    } catch (error) {
      // 错误已在store中处理，这里只需要重新抛出
      throw error;
    }
  };

  /**
   * 用户注册
   * Requirement 1.1: 用户访问注册页面时提供用户名、邮箱、密码输入字段
   * Requirement 1.2: 用户提交有效的注册信息时创建新用户账户
   */
  const register = async (userData: RegisterData): Promise<RegisterResponse> => {
    try {
      const response = await authStore.register(userData);
      
      // 注册成功后重定向到登录页面
      await router.push('/login');
      
      return response;
    } catch (error) {
      // 错误已在store中处理，这里只需要重新抛出
      throw error;
    }
  };

  /**
   * 用户登出
   * Requirement 1.5: 用户选择退出登录时清除会话并重定向到登录页面
   */
  const logout = async (): Promise<void> => {
    try {
      await authStore.logout();
      
      // 登出成功后重定向到登录页面
      await router.push('/login');
    } catch (error) {
      // 即使登出失败也要重定向到登录页面
      await router.push('/login');
      throw error;
    }
  };

  /**
   * 检查认证状态
   * Requirement 1.5: 验证用户身份状态
   */
  const checkAuth = async (): Promise<boolean> => {
    return await authStore.checkAuth();
  };

  /**
   * 刷新认证token
   * 当前后端不支持token刷新，过期后需要重新登录
   */
  const refreshToken = async (): Promise<void> => {
    try {
      await authStore.refreshToken();
    } catch (error) {
      // Token刷新失败，重定向到登录页面
      await router.push('/login');
      throw error;
    }
  };

  /**
   * 清除错误状态
   * Requirement 1.4: 处理登录失败时的错误信息
   */
  const clearError = (): void => {
    authStore.clearError();
  };

  /**
   * 初始化认证状态
   * 应用启动时检查本地存储的token是否有效
   */
  const initialize = async (): Promise<void> => {
    await authStore.initialize();
  };

  /**
   * 需要认证的路由守卫辅助函数
   * 检查用户是否已认证，未认证则重定向到登录页面
   */
  const requireAuth = async (): Promise<boolean> => {
    if (!isAuthenticated.value) {
      await router.push('/login');
      return false;
    }
    return true;
  };

  /**
   * 访客路由守卫辅助函数
   * 已认证用户访问登录/注册页面时重定向到主工作台
   */
  const requireGuest = async (): Promise<boolean> => {
    if (isAuthenticated.value) {
      await router.push('/dashboard');
      return false;
    }
    return true;
  };

  return {
    // 响应式状态
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isLoading,
    
    // 认证操作
    login,
    register,
    logout,
    checkAuth,
    refreshToken,
    clearError,
    initialize,
    
    // 路由守卫辅助函数
    requireAuth,
    requireGuest,
  };
}