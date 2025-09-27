import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '../useAuth';
import { useAuthStore } from '@/stores/auth';
import type { LoginCredentials, RegisterData } from '@/types/user';

// Mock router
const mockRouter = {
  push: vi.fn(),
};

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
}));

describe('useAuth', () => {
  let pinia: any;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  it('should provide reactive auth state', () => {
    const { user, token, loading, error, isAuthenticated } = useAuth();

    expect(user.value).toBeNull();
    expect(token.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(isAuthenticated.value).toBe(false);
  });

  it('should login successfully', async () => {
    const authStore = useAuthStore();
    const mockResponse = {
      user: { id: 1, username: 'testuser', createdAt: '2024-01-01', lastLoginAt: '2024-01-01' },
      accessToken: 'mock-token',
      tokenType: 'Bearer',
    };

    // Mock store login method
    vi.spyOn(authStore, 'login').mockResolvedValue(mockResponse);

    const { login } = useAuth();
    const credentials: LoginCredentials = { username: 'testuser', password: 'password123' };

    const result = await login(credentials);

    expect(authStore.login).toHaveBeenCalledWith(credentials);
    expect(result).toEqual(mockResponse);
  });

  it('should handle login error', async () => {
    const authStore = useAuthStore();
    const mockError = new Error('Invalid credentials');

    vi.spyOn(authStore, 'login').mockRejectedValue(mockError);

    const { login } = useAuth();
    const credentials: LoginCredentials = { username: 'testuser', password: 'wrong' };

    await expect(login(credentials)).rejects.toThrow('Invalid credentials');
  });

  it('should register successfully and redirect to login', async () => {
    const authStore = useAuthStore();
    const mockResponse = {
      id: 1,
      username: 'testuser',
      createdAt: '2024-01-01',
      lastLoginAt: null,
    };

    vi.spyOn(authStore, 'register').mockResolvedValue(mockResponse);

    const { register } = useAuth();
    const userData: RegisterData = {
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
    };

    const result = await register(userData);

    expect(authStore.register).toHaveBeenCalledWith(userData);
    expect(result).toEqual(mockResponse);
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('should logout successfully and redirect to login', async () => {
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'logout').mockResolvedValue();

    const { logout } = useAuth();

    await logout();

    expect(authStore.logout).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('should redirect to login even if logout fails', async () => {
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'logout').mockRejectedValue(new Error('Logout failed'));

    const { logout } = useAuth();

    await expect(logout()).rejects.toThrow('Logout failed');
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('should check auth status', async () => {
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'checkAuth').mockResolvedValue(true);

    const { checkAuth } = useAuth();

    const result = await checkAuth();

    expect(authStore.checkAuth).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should refresh token and redirect on failure', async () => {
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'refreshToken').mockRejectedValue(new Error('Token expired'));

    const { refreshToken } = useAuth();

    await expect(refreshToken()).rejects.toThrow('Token expired');
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('should clear error', () => {
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'clearError').mockImplementation(() => {});

    const { clearError } = useAuth();

    clearError();

    expect(authStore.clearError).toHaveBeenCalled();
  });

  it('should initialize auth state', async () => {
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'initialize').mockResolvedValue();

    const { initialize } = useAuth();

    await initialize();

    expect(authStore.initialize).toHaveBeenCalled();
  });

  it('should require auth and redirect if not authenticated', async () => {
    const { requireAuth, isAuthenticated } = useAuth();

    // Mock unauthenticated state
    const authStore = useAuthStore();
    authStore.token = null;
    authStore.user = null;

    const result = await requireAuth();

    expect(result).toBe(false);
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  it('should require guest and redirect if authenticated', async () => {
    const { requireGuest } = useAuth();

    // Mock authenticated state
    const authStore = useAuthStore();
    authStore.token = 'mock-token';
    authStore.user = { id: 1, username: 'testuser', createdAt: '2024-01-01', lastLoginAt: '2024-01-01' };

    const result = await requireGuest();

    expect(result).toBe(false);
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });
});