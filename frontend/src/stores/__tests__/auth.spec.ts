import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '../auth';
import { authService } from '@/services/authService';
import { useLoadingStore } from '../loading';
import { NotificationService } from '@/services/notificationService';
import type { LoginCredentials, RegisterData } from '@/types/user';

// Mock dependencies
vi.mock('@/services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

vi.mock('../loading', () => ({
  useLoadingStore: () => ({
    startLoading: vi.fn(),
    stopLoading: vi.fn(),
  }),
}));

vi.mock('@/services/notificationService', () => ({
  NotificationService: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/utils/authUtils', () => ({
  AuthMonitor: {
    getInstance: () => ({
      startMonitoring: vi.fn(),
      stopMonitoring: vi.fn(),
    }),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useAuthStore', () => {
  let pinia: any;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should initialize with default state', () => {
    const authStore = useAuthStore();

    expect(authStore.user).toBeNull();
    expect(authStore.token).toBeNull();
    expect(authStore.loading).toBe(false);
    expect(authStore.error).toBeNull();
    expect(authStore.isAuthenticated).toBe(false);
    expect(authStore.isLoading).toBe(false);
  });

  it('should initialize with token from localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('stored-token');
    
    const authStore = useAuthStore();

    expect(authStore.token).toBe('stored-token');
  });

  it('should login successfully', async () => {
    const mockResponse = {
      user: { id: 1, username: 'testuser', createdAt: '2024-01-01', lastLoginAt: '2024-01-01' },
      accessToken: 'mock-token',
      tokenType: 'Bearer',
    };

    (authService.login as any).mockResolvedValue(mockResponse);

    const authStore = useAuthStore();
    const credentials: LoginCredentials = { username: 'testuser', password: 'password123' };

    const result = await authStore.login(credentials);

    expect(authService.login).toHaveBeenCalledWith(credentials);
    expect(authStore.user).toEqual(mockResponse.user);
    expect(authStore.token).toBe(mockResponse.accessToken);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', mockResponse.accessToken);
    expect(NotificationService.success).toHaveBeenCalledWith('欢迎回来，testuser！');
    expect(result).toEqual(mockResponse);
  });

  it('should handle login error', async () => {
    const mockError = new Error('Invalid credentials');
    (authService.login as any).mockRejectedValue(mockError);

    const authStore = useAuthStore();
    const credentials: LoginCredentials = { username: 'testuser', password: 'wrong' };

    await expect(authStore.login(credentials)).rejects.toThrow('Invalid credentials');
    expect(authStore.error).toBe('Invalid credentials');
    expect(authStore.loading).toBe(false);
  });

  it('should register successfully', async () => {
    const mockResponse = {
      id: 1,
      username: 'testuser',
      createdAt: '2024-01-01',
      lastLoginAt: null,
    };

    (authService.register as any).mockResolvedValue(mockResponse);

    const authStore = useAuthStore();
    const userData: RegisterData = {
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
    };

    const result = await authStore.register(userData);

    expect(authService.register).toHaveBeenCalledWith(userData);
    expect(NotificationService.success).toHaveBeenCalledWith('注册成功！请使用您的账户登录。');
    expect(result).toEqual(mockResponse);
  });

  it('should handle register error', async () => {
    const mockError = new Error('Username already exists');
    (authService.register as any).mockRejectedValue(mockError);

    const authStore = useAuthStore();
    const userData: RegisterData = {
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
    };

    await expect(authStore.register(userData)).rejects.toThrow('Username already exists');
    expect(authStore.error).toBe('Username already exists');
    expect(authStore.loading).toBe(false);
  });

  it('should logout successfully', async () => {
    (authService.logout as any).mockResolvedValue();

    const authStore = useAuthStore();
    // Set initial state
    authStore.user = { id: 1, username: 'testuser', createdAt: '2024-01-01', lastLoginAt: '2024-01-01' };
    authStore.token = 'mock-token';

    await authStore.logout();

    expect(authService.logout).toHaveBeenCalled();
    expect(authStore.user).toBeNull();
    expect(authStore.token).toBeNull();
    expect(authStore.error).toBeNull();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
    expect(NotificationService.success).toHaveBeenCalledWith('已安全登出');
  });

  it('should logout even when backend fails', async () => {
    const mockError = new Error('Logout failed');
    (authService.logout as any).mockRejectedValue(mockError);

    const authStore = useAuthStore();
    // Set initial state
    authStore.user = { id: 1, username: 'testuser', createdAt: '2024-01-01', lastLoginAt: '2024-01-01' };
    authStore.token = 'mock-token';

    await authStore.logout();

    expect(authStore.user).toBeNull();
    expect(authStore.token).toBeNull();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
    expect(NotificationService.warning).toHaveBeenCalledWith('登出时发生错误，但已清除本地登录状态');
  });

  it('should check auth successfully', async () => {
    const mockUser = { id: 1, username: 'testuser', createdAt: '2024-01-01', lastLoginAt: '2024-01-01' };
    (authService.getCurrentUser as any).mockResolvedValue(mockUser);

    const authStore = useAuthStore();
    authStore.token = 'mock-token';

    const result = await authStore.checkAuth();

    expect(authService.getCurrentUser).toHaveBeenCalled();
    expect(authStore.user).toEqual(mockUser);
    expect(result).toBe(true);
  });

  it('should handle invalid token during auth check', async () => {
    const mockError = new Error('Invalid token');
    (authService.getCurrentUser as any).mockRejectedValue(mockError);

    const authStore = useAuthStore();
    authStore.token = 'invalid-token';
    authStore.user = { id: 1, username: 'testuser', createdAt: '2024-01-01', lastLoginAt: '2024-01-01' };

    const result = await authStore.checkAuth();

    expect(result).toBe(false);
    expect(authStore.user).toBeNull();
    expect(authStore.token).toBeNull();
  });

  it('should return false when no token exists', async () => {
    const authStore = useAuthStore();

    const result = await authStore.checkAuth();

    expect(result).toBe(false);
    expect(authService.getCurrentUser).not.toHaveBeenCalled();
  });

  it('should refresh token by logging out', async () => {
    const authStore = useAuthStore();
    authStore.token = 'expired-token';

    await expect(authStore.refreshToken()).rejects.toThrow('Token已过期，请重新登录');
    expect(authStore.token).toBeNull();
  });

  it('should clear error', () => {
    const authStore = useAuthStore();
    authStore.error = 'Some error';

    authStore.clearError();

    expect(authStore.error).toBeNull();
  });

  it('should initialize with existing token', async () => {
    const mockUser = { id: 1, username: 'testuser', createdAt: '2024-01-01', lastLoginAt: '2024-01-01' };
    (authService.getCurrentUser as any).mockResolvedValue(mockUser);

    const authStore = useAuthStore();
    authStore.token = 'existing-token';

    await authStore.initialize();

    expect(authService.getCurrentUser).toHaveBeenCalled();
    expect(authStore.user).toEqual(mockUser);
  });

  it('should not initialize without token', async () => {
    const authStore = useAuthStore();

    await authStore.initialize();

    expect(authService.getCurrentUser).not.toHaveBeenCalled();
  });

  it('should compute isAuthenticated correctly', () => {
    const authStore = useAuthStore();

    // Not authenticated initially
    expect(authStore.isAuthenticated).toBe(false);

    // Set token but no user
    authStore.token = 'mock-token';
    expect(authStore.isAuthenticated).toBe(false);

    // Set user but no token
    authStore.token = null;
    authStore.user = { id: 1, username: 'testuser', createdAt: '2024-01-01', lastLoginAt: '2024-01-01' };
    expect(authStore.isAuthenticated).toBe(false);

    // Set both token and user
    authStore.token = 'mock-token';
    expect(authStore.isAuthenticated).toBe(true);
  });
});