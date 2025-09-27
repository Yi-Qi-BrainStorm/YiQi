import type { LoginCredentials, RegisterData, AuthResponse, RegisterResponse } from '@/types/user';

/**
 * 认证服务的Mock实现
 */
export class AuthService {
  private static mockUsers = [
    {
      id: 1,
      username: 'testuser',
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-01T12:00:00Z'
    }
  ];

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('Mock AuthService.login:', credentials);
    
    await new Promise(resolve => setTimeout(resolve, 200));

    // 测试连接的无效凭据
    if (credentials.username === 'test_connection' && credentials.password === 'invalid_password') {
      throw { code: 'UNAUTHORIZED', message: 'Invalid credentials' };
    }

    // 无效凭据测试
    if (credentials.username === 'invalid_user' || credentials.password === 'wrong_password') {
      throw { code: 'UNAUTHORIZED', message: 'Invalid credentials' };
    }

    const user = this.mockUsers.find(u => u.username === credentials.username);
    if (!user || credentials.password !== 'test123456') {
      throw { code: 'UNAUTHORIZED', message: 'Invalid credentials' };
    }

    // 生成一个有效的 JWT token (Mock版本)
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: user.id.toString(),
      username: user.username,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24小时后过期
    };
    
    // 简单的Base64编码（仅用于Mock）
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = btoa(`mock_signature_${user.id}_${Date.now()}`);
    
    const token = `${encodedHeader}.${encodedPayload}.${signature}`;
    
    return {
      accessToken: token,
      tokenType: 'Bearer',
      user: {
        ...user,
        lastLoginAt: new Date().toISOString()
      }
    };
  }

  static async register(userData: RegisterData): Promise<RegisterResponse> {
    console.log('Mock AuthService.register:', userData);
    
    await new Promise(resolve => setTimeout(resolve, 300));

    const existingUser = this.mockUsers.find(u => u.username === userData.username);
    if (existingUser) {
      throw { code: 'CONFLICT', message: '用户名已存在' };
    }

    const newUser = {
      id: this.mockUsers.length + 1,
      username: userData.username,
      createdAt: new Date().toISOString(),
      lastLoginAt: null
    };

    this.mockUsers.push(newUser);
    return newUser;
  }

  static async getCurrentUser(): Promise<any> {
    console.log('Mock AuthService.getCurrentUser');
    
    await new Promise(resolve => setTimeout(resolve, 100));

    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw { code: 'UNAUTHORIZED', message: 'No token provided' };
    }

    return { user: this.mockUsers[0] };
  }

  static async logout(): Promise<void> {
    console.log('Mock AuthService.logout');
    await new Promise(resolve => setTimeout(resolve, 100));
    // Mock logout - 什么都不做
  }
}

export const authService = AuthService;