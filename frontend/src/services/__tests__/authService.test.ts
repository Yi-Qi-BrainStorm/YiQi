import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../authService';
import { ApiService } from '../api';

// Mock ApiService
vi.mock('../api', () => ({
  ApiService: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should call correct endpoint with credentials', async () => {
      const mockResponse = {
        accessToken: 'mock-token',
        tokenType: 'Bearer',
        user: {
          id: 1,
          username: 'testuser',
          createdAt: '2024-01-01T10:00:00',
          lastLoginAt: '2024-01-01T11:00:00',
        },
      };

      (ApiService.post as any).mockResolvedValue(mockResponse);

      const credentials = { username: 'testuser', password: 'password123' };
      const result = await AuthService.login(credentials);

      expect(ApiService.post).toHaveBeenCalledWith('/users/login', credentials);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('register', () => {
    it('should call correct endpoint with user data', async () => {
      const mockResponse = {
        id: 1,
        username: 'testuser',
        createdAt: '2024-01-01T10:00:00',
        lastLoginAt: null,
      };

      (ApiService.post as any).mockResolvedValue(mockResponse);

      const userData = { username: 'testuser', password: 'password123' };
      const result = await AuthService.register(userData);

      expect(ApiService.post).toHaveBeenCalledWith('/users/register', userData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCurrentUser', () => {
    it('should call correct endpoint and return user data', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        createdAt: '2024-01-01T10:00:00',
        lastLoginAt: '2024-01-01T11:00:00',
      };

      (ApiService.get as any).mockResolvedValue(mockUser);

      const result = await AuthService.getCurrentUser();

      expect(ApiService.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should call correct endpoint', async () => {
      (ApiService.post as any).mockResolvedValue(undefined);

      await AuthService.logout();

      expect(ApiService.post).toHaveBeenCalledWith('/users/logout');
    });
  });
});