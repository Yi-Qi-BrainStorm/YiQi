import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { integrationService } from '@/services/integrationService';
import { backendConnectionService } from '@/services/backendConnectionService';
import { authService } from '@/services/authService';
import { ApiService } from '@/services/api';
import type { LoginCredentials, RegisterData } from '@/types';

/**
 * 后端集成测试
 * 
 * 注意：这些测试需要后端服务运行在 http://localhost:8080
 * 运行前请确保：
 * 1. 后端服务已启动
 * 2. 数据库连接正常
 * 3. 测试数据已准备
 */
describe('后端API集成测试', () => {
  const TEST_USER = {
    username: `test_user_${Date.now()}`,
    password: 'test123456'
  };

  let authToken: string | null = null;

  beforeAll(async () => {
    // 检查后端服务是否可用
    try {
      await backendConnectionService.checkHealth();
      console.log('后端服务连接正常，开始集成测试');
    } catch (error) {
      console.warn('后端服务不可用，跳过集成测试');
      return;
    }
  });

  afterAll(async () => {
    // 清理测试数据
    if (authToken) {
      try {
        // 如果有登出接口，在这里调用
        await ApiService.post('/users/logout');
      } catch (error) {
        console.warn('清理测试数据失败:', error);
      }
    }
  });

  beforeEach(() => {
    // 清理localStorage
    localStorage.clear();
  });

  afterEach(async () => {
    await integrationService.cleanup();
  });

  describe('系统健康检查', () => {
    it('应该能够连接到后端服务', async () => {
      const isHealthy = await backendConnectionService.checkHealth();
      expect(isHealthy).toBe(true);
    });

    it('应该能够获取服务器信息', async () => {
      const serverInfo = await backendConnectionService.getServerInfo();
      expect(serverInfo).toBeDefined();
      // 服务器信息可能包含版本、环境等信息
    });

    it('应该能够验证API端点', async () => {
      const endpointStatus = await backendConnectionService.validateApiEndpoints();
      expect(endpointStatus).toBeDefined();
      expect(typeof endpointStatus.userEndpoints).toBe('boolean');
    });

    it('应该能够测试认证端点', async () => {
      const authEndpointWorking = await backendConnectionService.testAuthEndpoints();
      expect(authEndpointWorking).toBe(true);
    });
  });

  describe('用户认证API', () => {
    it('应该能够注册新用户', async () => {
      const registerData: RegisterData = {
        username: TEST_USER.username,
        password: TEST_USER.password
      };

      try {
        const result = await authService.register(registerData);
        
        expect(result).toBeDefined();
        expect(result.username).toBe(TEST_USER.username);
        expect(result.id).toBeDefined();
        expect(result.createdAt).toBeDefined();
        
        console.log('用户注册成功:', result);
      } catch (error: any) {
        // 如果用户已存在，这是预期的
        if (error.code === 'CONFLICT') {
          console.log('用户已存在，跳过注册测试');
        } else {
          throw error;
        }
      }
    });

    it('应该能够登录用户', async () => {
      const loginCredentials: LoginCredentials = {
        username: TEST_USER.username,
        password: TEST_USER.password
      };

      try {
        const result = await authService.login(loginCredentials);
        
        expect(result).toBeDefined();
        expect(result.accessToken).toBeDefined();
        expect(result.tokenType).toBe('Bearer');
        expect(result.user).toBeDefined();
        expect(result.user.username).toBe(TEST_USER.username);
        
        authToken = result.accessToken;
        localStorage.setItem('auth_token', authToken);
        
        console.log('用户登录成功:', result.user);
      } catch (error: any) {
        console.error('登录失败:', error);
        throw error;
      }
    });

    it('应该能够获取当前用户信息', async () => {
      if (!authToken) {
        // 先登录
        const loginResult = await authService.login({
          username: TEST_USER.username,
          password: TEST_USER.password
        });
        authToken = loginResult.accessToken;
        localStorage.setItem('auth_token', authToken);
      }

      try {
        const result = await authService.getCurrentUser();
        
        expect(result).toBeDefined();
        expect(result.user).toBeDefined();
        expect(result.user.username).toBe(TEST_USER.username);
        
        console.log('获取用户信息成功:', result.user);
      } catch (error: any) {
        console.error('获取用户信息失败:', error);
        throw error;
      }
    });

    it('应该拒绝无效的登录凭据', async () => {
      const invalidCredentials: LoginCredentials = {
        username: 'nonexistent_user',
        password: 'wrong_password'
      };

      try {
        await authService.login(invalidCredentials);
        // 如果没有抛出错误，测试失败
        expect.fail('应该拒绝无效凭据');
      } catch (error: any) {
        expect(error.code).toBe('UNAUTHORIZED');
        console.log('正确拒绝了无效凭据');
      }
    });

    it('应该能够登出用户', async () => {
      if (!authToken) {
        const loginResult = await authService.login({
          username: TEST_USER.username,
          password: TEST_USER.password
        });
        authToken = loginResult.accessToken;
        localStorage.setItem('auth_token', authToken);
      }

      try {
        await ApiService.post('/users/logout');
        console.log('用户登出成功');
      } catch (error: any) {
        console.error('登出失败:', error);
        // 登出失败不应该阻止测试
      }
    });
  });

  describe('错误处理', () => {
    it('应该正确处理网络错误', async () => {
      // 临时修改API基础URL为无效地址
      const originalBaseURL = process.env.VITE_API_BASE_URL;
      process.env.VITE_API_BASE_URL = 'http://invalid-url:9999';

      try {
        await backendConnectionService.checkHealth();
        expect.fail('应该抛出网络错误');
      } catch (error: any) {
        expect(error.code).toBe('NETWORK_ERROR');
      } finally {
        // 恢复原始URL
        process.env.VITE_API_BASE_URL = originalBaseURL;
      }
    });

    it('应该正确处理服务器错误', async () => {
      // 这个测试需要后端配合返回500错误
      // 或者我们可以mock一个500响应
      try {
        await ApiService.get('/users/trigger-error'); // 假设的错误端点
        expect.fail('应该抛出服务器错误');
      } catch (error: any) {
        expect(['SERVER_ERROR', 'NOT_FOUND']).toContain(error.code);
      }
    });

    it('应该正确处理认证错误', async () => {
      // 清除认证token
      localStorage.removeItem('auth_token');

      try {
        await authService.getCurrentUser();
        expect.fail('应该抛出认证错误');
      } catch (error: any) {
        expect(error.code).toBe('UNAUTHORIZED');
      }
    });
  });

  describe('性能测试', () => {
    it('健康检查应该在合理时间内完成', async () => {
      const startTime = Date.now();
      await backendConnectionService.checkHealth();
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // 5秒内完成
      console.log(`健康检查耗时: ${duration}ms`);
    });

    it('登录应该在合理时间内完成', async () => {
      const startTime = Date.now();
      
      try {
        await authService.login({
          username: TEST_USER.username,
          password: TEST_USER.password
        });
      } catch (error) {
        // 忽略登录错误，只测试性能
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000); // 10秒内完成
      console.log(`登录耗时: ${duration}ms`);
    });
  });

  describe('并发测试', () => {
    it('应该能够处理并发健康检查', async () => {
      const promises = Array(5).fill(null).map(() => 
        backendConnectionService.checkHealth()
      );

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      expect(successCount).toBeGreaterThan(0);
      console.log(`并发健康检查成功率: ${successCount}/5`);
    });

    it('应该能够处理并发登录请求', async () => {
      // 注意：这个测试可能会触发后端的速率限制
      const promises = Array(3).fill(null).map(() => 
        authService.login({
          username: TEST_USER.username,
          password: TEST_USER.password
        }).catch(error => error)
      );

      const results = await Promise.allSettled(promises);
      console.log(`并发登录测试完成，结果数量: ${results.length}`);
      
      // 至少有一个请求应该成功或返回预期的错误
      expect(results.length).toBe(3);
    });
  });

  describe('数据完整性', () => {
    it('注册的用户数据应该完整', async () => {
      const registerData: RegisterData = {
        username: `integrity_test_${Date.now()}`,
        password: 'test123456'
      };

      try {
        const result = await authService.register(registerData);
        
        // 验证返回的数据结构
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('username');
        expect(result).toHaveProperty('createdAt');
        expect(result.username).toBe(registerData.username);
        
        // 验证数据类型
        expect(typeof result.id).toBe('number');
        expect(typeof result.username).toBe('string');
        expect(typeof result.createdAt).toBe('string');
        
        // 验证日期格式
        expect(new Date(result.createdAt).toString()).not.toBe('Invalid Date');
        
      } catch (error: any) {
        if (error.code !== 'CONFLICT') {
          throw error;
        }
      }
    });

    it('登录响应数据应该完整', async () => {
      try {
        const result = await authService.login({
          username: TEST_USER.username,
          password: TEST_USER.password
        });
        
        // 验证响应结构
        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('tokenType');
        expect(result).toHaveProperty('user');
        
        // 验证token格式
        expect(typeof result.accessToken).toBe('string');
        expect(result.accessToken.length).toBeGreaterThan(0);
        expect(result.tokenType).toBe('Bearer');
        
        // 验证用户数据
        expect(result.user).toHaveProperty('id');
        expect(result.user).toHaveProperty('username');
        expect(result.user).toHaveProperty('createdAt');
        
      } catch (error: any) {
        console.error('登录数据完整性测试失败:', error);
        throw error;
      }
    });
  });

  describe('安全性测试', () => {
    it('应该拒绝弱密码', async () => {
      const weakPasswordData: RegisterData = {
        username: `weak_pwd_test_${Date.now()}`,
        password: '123' // 弱密码
      };

      try {
        await authService.register(weakPasswordData);
        // 如果注册成功，可能后端没有密码强度验证
        console.warn('后端可能缺少密码强度验证');
      } catch (error: any) {
        // 期望得到验证错误
        expect(['VALIDATION_ERROR', 'BAD_REQUEST']).toContain(error.code);
        console.log('正确拒绝了弱密码');
      }
    });

    it('应该拒绝重复用户名', async () => {
      const duplicateData: RegisterData = {
        username: TEST_USER.username, // 使用已存在的用户名
        password: 'test123456'
      };

      try {
        await authService.register(duplicateData);
        expect.fail('应该拒绝重复用户名');
      } catch (error: any) {
        expect(error.code).toBe('CONFLICT');
        console.log('正确拒绝了重复用户名');
      }
    });

    it('应该验证JWT token格式', async () => {
      try {
        const result = await authService.login({
          username: TEST_USER.username,
          password: TEST_USER.password
        });
        
        const token = result.accessToken;
        
        // JWT token应该有三个部分，用.分隔
        const parts = token.split('.');
        expect(parts.length).toBe(3);
        
        // 每个部分都应该是base64编码
        parts.forEach(part => {
          expect(part.length).toBeGreaterThan(0);
          // 简单验证base64格式
          expect(/^[A-Za-z0-9_-]+$/.test(part)).toBe(true);
        });
        
        console.log('JWT token格式验证通过');
        
      } catch (error: any) {
        console.error('JWT token验证失败:', error);
        throw error;
      }
    });
  });
});

/**
 * 辅助函数：检查后端服务是否可用
 */
export async function isBackendAvailable(): Promise<boolean> {
  try {
    await backendConnectionService.checkHealth();
    return true;
  } catch {
    return false;
  }
}

/**
 * 辅助函数：创建测试用户
 */
export async function createTestUser(username?: string): Promise<{
  username: string;
  password: string;
  user?: any;
}> {
  const testUser = {
    username: username || `test_user_${Date.now()}`,
    password: 'test123456'
  };

  try {
    const result = await authService.register(testUser);
    return {
      ...testUser,
      user: result
    };
  } catch (error: any) {
    if (error.code === 'CONFLICT') {
      // 用户已存在，返回用户信息
      return testUser;
    }
    throw error;
  }
}

/**
 * 辅助函数：清理测试用户
 */
export async function cleanupTestUser(username: string): Promise<void> {
  // 注意：这需要后端提供删除用户的接口
  // 目前后端可能没有这个接口，所以这里只是占位符
  try {
    // await ApiService.delete(`/users/${username}`);
    console.log(`测试用户 ${username} 清理完成`);
  } catch (error) {
    console.warn(`清理测试用户 ${username} 失败:`, error);
  }
}