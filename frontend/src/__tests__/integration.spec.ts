import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { integrationService } from '@/services/integrationService';
import { authService } from '@/services/authService';
import { agentService } from '@/services/agentService';
import { brainstormService } from '@/services/brainstormService';
import { socketService } from '@/services/socketService';
import { notificationService } from '@/services/notificationService';
import type { LoginCredentials, RegisterData, AgentFormData } from '@/types';

// Mock所有外部依赖
vi.mock('@/services/authService');
vi.mock('@/services/agentService');
vi.mock('@/services/brainstormService');
vi.mock('@/services/socketService');
vi.mock('@/services/notificationService');
vi.mock('@/services/api');

describe('Integration Tests - 完整用户流程', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    
    // 重置所有mock
    vi.clearAllMocks();
    
    // 清理localStorage
    localStorage.clear();
    
    // Mock基础服务方法
    vi.mocked(socketService.connect).mockResolvedValue(undefined);
    vi.mocked(socketService.isConnected).mockReturnValue(true);
    vi.mocked(notificationService.initialize).mockReturnValue(undefined);
  });

  afterEach(async () => {
    await integrationService.cleanup();
  });

  describe('系统初始化', () => {
    it('应该成功初始化所有服务', async () => {
      // Mock健康检查
      const mockHealthCheck = vi.fn().mockResolvedValue({ status: 'UP' });
      vi.doMock('@/services/api', () => ({
        ApiService: {
          get: mockHealthCheck
        }
      }));

      await integrationService.initialize();

      expect(mockHealthCheck).toHaveBeenCalledWith('/actuator/health');
      expect(socketService.connect).toHaveBeenCalled();
      expect(notificationService.initialize).toHaveBeenCalled();
      
      const status = integrationService.getSystemStatus();
      expect(status.initialized).toBe(true);
    });

    it('应该处理后端连接失败', async () => {
      const mockHealthCheck = vi.fn().mockRejectedValue(new Error('Connection failed'));
      vi.doMock('@/services/api', () => ({
        ApiService: {
          get: mockHealthCheck
        }
      }));

      await expect(integrationService.initialize()).rejects.toThrow('Backend service unavailable');
      expect(notificationService.error).toHaveBeenCalledWith('无法连接到服务器，请检查网络连接');
    });
  });

  describe('用户认证流程', () => {
    beforeEach(async () => {
      // 初始化服务
      vi.mocked(authService.getCurrentUser).mockResolvedValue({
        user: { id: '1', username: 'testuser', email: 'test@example.com', createdAt: '', updatedAt: '' }
      });
      
      const mockHealthCheck = vi.fn().mockResolvedValue({ status: 'UP' });
      vi.doMock('@/services/api', () => ({
        ApiService: {
          get: mockHealthCheck
        }
      }));
      
      await integrationService.initialize();
    });

    it('应该成功完成用户注册流程', async () => {
      const registerData: RegisterData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };

      const mockUser = {
        id: '2',
        username: 'newuser',
        email: 'newuser@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      vi.mocked(authService.register).mockResolvedValue({
        user: mockUser,
        message: '注册成功'
      });

      const result = await integrationService.registerUser(registerData);

      expect(authService.register).toHaveBeenCalledWith(registerData);
      expect(notificationService.success).toHaveBeenCalledWith('注册成功！请登录您的账户');
      expect(result).toEqual(mockUser);
    });

    it('应该成功完成用户登录流程', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123'
      };

      const mockResponse = {
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        token: 'mock-jwt-token'
      };

      vi.mocked(authService.login).mockResolvedValue(mockResponse);
      vi.mocked(socketService.reconnect).mockResolvedValue(undefined);
      vi.mocked(agentService.getAgents).mockResolvedValue([]);
      vi.mocked(brainstormService.getUserSessions).mockResolvedValue([]);

      const result = await integrationService.loginUser(credentials);

      expect(authService.login).toHaveBeenCalledWith(credentials);
      expect(localStorage.getItem('auth_token')).toBe('mock-jwt-token');
      expect(socketService.reconnect).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalledWith('欢迎回来，testuser！');
      expect(result).toEqual(mockResponse);
    });

    it('应该处理登录失败', async () => {
      const credentials: LoginCredentials = {
        username: 'wronguser',
        password: 'wrongpassword'
      };

      const mockError = new Error('用户名或密码错误');
      vi.mocked(authService.login).mockRejectedValue(mockError);

      await expect(integrationService.loginUser(credentials)).rejects.toThrow('用户名或密码错误');
      expect(notificationService.error).toHaveBeenCalledWith('用户名或密码错误');
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('代理管理流程', () => {
    beforeEach(async () => {
      // 模拟已登录状态
      localStorage.setItem('auth_token', 'mock-token');
      
      const mockHealthCheck = vi.fn().mockResolvedValue({ status: 'UP' });
      vi.doMock('@/services/api', () => ({
        ApiService: {
          get: mockHealthCheck
        }
      }));
      
      await integrationService.initialize();
    });

    it('应该成功创建代理', async () => {
      const agentData: AgentFormData = {
        name: '设计师',
        role: 'UI/UX Designer',
        systemPrompt: 'You are a creative designer...',
        modelType: 'gpt-4',
        modelConfig: {
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0
        }
      };

      const mockAgent = {
        id: 'agent-1',
        ...agentData,
        userId: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      vi.mocked(agentService.createAgent).mockResolvedValue(mockAgent);

      const result = await integrationService.createAgent(agentData);

      expect(agentService.createAgent).toHaveBeenCalledWith(agentData);
      expect(notificationService.success).toHaveBeenCalledWith('代理 "设计师" 创建成功！');
      expect(result).toEqual(mockAgent);
    });

    it('应该验证代理数据', async () => {
      const invalidAgentData: AgentFormData = {
        name: '',
        role: 'Designer',
        systemPrompt: 'Prompt',
        modelType: 'gpt-4',
        modelConfig: {
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0
        }
      };

      await expect(integrationService.createAgent(invalidAgentData)).rejects.toThrow('代理名称不能为空');
      expect(notificationService.error).toHaveBeenCalledWith('代理名称不能为空');
    });
  });

  describe('头脑风暴会话流程', () => {
    beforeEach(async () => {
      // 模拟已登录状态
      localStorage.setItem('auth_token', 'mock-token');
      
      const mockHealthCheck = vi.fn().mockResolvedValue({ status: 'UP' });
      vi.doMock('@/services/api', () => ({
        ApiService: {
          get: mockHealthCheck
        }
      }));
      
      await integrationService.initialize();
    });

    it('应该成功创建头脑风暴会话', async () => {
      const sessionData = {
        topic: '智能手环设计',
        agentIds: ['agent-1', 'agent-2']
      };

      const mockSession = {
        id: 'session-1',
        topic: '智能手环设计',
        userId: 'user-1',
        agentIds: ['agent-1', 'agent-2'],
        currentStage: 1,
        status: 'active' as const,
        stageResults: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const mockAgents = [
        { id: 'agent-1', name: 'Designer' },
        { id: 'agent-2', name: 'Engineer' }
      ];

      vi.mocked(agentService.getAgents).mockResolvedValue(mockAgents as any);
      vi.mocked(brainstormService.createSession).mockResolvedValue(mockSession);
      vi.mocked(socketService.joinRoom).mockReturnValue(undefined);
      vi.mocked(socketService.on).mockReturnValue(undefined);

      const result = await integrationService.createBrainstormSession(sessionData);

      expect(agentService.getAgents).toHaveBeenCalled();
      expect(brainstormService.createSession).toHaveBeenCalledWith(sessionData.topic, sessionData.agentIds);
      expect(socketService.joinRoom).toHaveBeenCalledWith('session_session-1');
      expect(notificationService.success).toHaveBeenCalledWith('头脑风暴会话创建成功！');
      expect(result).toEqual(mockSession);
    });

    it('应该验证会话数据', async () => {
      const invalidSessionData = {
        topic: '',
        agentIds: []
      };

      await expect(integrationService.createBrainstormSession(invalidSessionData))
        .rejects.toThrow('头脑风暴主题不能为空');
      expect(notificationService.error).toHaveBeenCalledWith('头脑风暴主题不能为空');
    });

    it('应该检查代理可用性', async () => {
      const sessionData = {
        topic: '测试主题',
        agentIds: ['agent-1', 'nonexistent-agent']
      };

      const mockAgents = [
        { id: 'agent-1', name: 'Designer' }
      ];

      vi.mocked(agentService.getAgents).mockResolvedValue(mockAgents as any);

      await expect(integrationService.createBrainstormSession(sessionData))
        .rejects.toThrow('以下代理不可用: nonexistent-agent');
    });
  });

  describe('会话导出流程', () => {
    beforeEach(async () => {
      localStorage.setItem('auth_token', 'mock-token');
      
      const mockHealthCheck = vi.fn().mockResolvedValue({ status: 'UP' });
      vi.doMock('@/services/api', () => ({
        ApiService: {
          get: mockHealthCheck
        }
      }));
      
      await integrationService.initialize();
    });

    it('应该成功导出完成的会话', async () => {
      const sessionId = 'session-1';
      const format = 'pdf';

      const mockSession = {
        id: sessionId,
        topic: '测试主题',
        finalReport: {
          sessionId,
          topic: '测试主题',
          executiveSummary: '测试总结',
          generatedAt: '2024-01-01T00:00:00Z'
        }
      };

      vi.mocked(brainstormService.getSession).mockResolvedValue(mockSession as any);
      
      // Mock导出服务
      const mockExportService = {
        exportSession: vi.fn().mockResolvedValue(undefined)
      };
      vi.doMock('@/services/exportService', () => ({
        exportService: mockExportService
      }));

      await integrationService.exportSession(sessionId, format);

      expect(brainstormService.getSession).toHaveBeenCalledWith(sessionId);
      expect(notificationService.success).toHaveBeenCalledWith('会话报告已成功导出为 PDF 格式');
    });

    it('应该拒绝导出未完成的会话', async () => {
      const sessionId = 'session-1';
      const format = 'pdf';

      const mockSession = {
        id: sessionId,
        topic: '测试主题',
        finalReport: null // 未完成的会话
      };

      vi.mocked(brainstormService.getSession).mockResolvedValue(mockSession as any);

      await expect(integrationService.exportSession(sessionId, format))
        .rejects.toThrow('会话尚未完成，无法导出');
      expect(notificationService.error).toHaveBeenCalledWith('会话尚未完成，无法导出');
    });
  });

  describe('错误处理', () => {
    it('应该处理网络错误', () => {
      const networkError = { code: 'NETWORK_ERROR', message: 'Network failed' };
      
      integrationService.handleGlobalError(networkError, 'test context');
      
      expect(notificationService.error).toHaveBeenCalledWith('网络连接失败，请检查网络设置');
    });

    it('应该处理认证过期', () => {
      const authError = { code: 'UNAUTHORIZED', message: 'Token expired' };
      
      // 监听认证过期事件
      const eventListener = vi.fn();
      window.addEventListener('auth:expired', eventListener);
      
      integrationService.handleGlobalError(authError);
      
      expect(notificationService.error).toHaveBeenCalledWith('登录已过期，请重新登录');
      expect(eventListener).toHaveBeenCalled();
      
      window.removeEventListener('auth:expired', eventListener);
    });

    it('应该处理服务器错误', () => {
      const serverError = { code: 'SERVER_ERROR', message: 'Internal server error' };
      
      integrationService.handleGlobalError(serverError);
      
      expect(notificationService.error).toHaveBeenCalledWith('服务器暂时不可用，请稍后重试');
    });
  });

  describe('系统状态监控', () => {
    it('应该正确报告系统状态', async () => {
      localStorage.setItem('auth_token', 'mock-token');
      vi.mocked(socketService.isConnected).mockReturnValue(true);
      
      const mockHealthCheck = vi.fn().mockResolvedValue({ status: 'UP' });
      vi.doMock('@/services/api', () => ({
        ApiService: {
          get: mockHealthCheck
        }
      }));
      
      await integrationService.initialize();
      
      const status = integrationService.getSystemStatus();
      
      expect(status).toEqual({
        initialized: true,
        backendConnected: true,
        websocketConnected: true,
        authenticated: true
      });
    });
  });

  describe('资源清理', () => {
    it('应该正确清理所有资源', async () => {
      localStorage.setItem('auth_token', 'mock-token');
      
      const mockHealthCheck = vi.fn().mockResolvedValue({ status: 'UP' });
      vi.doMock('@/services/api', () => ({
        ApiService: {
          get: mockHealthCheck
        }
      }));
      
      await integrationService.initialize();
      
      vi.mocked(socketService.disconnect).mockReturnValue(undefined);
      
      await integrationService.cleanup();
      
      expect(socketService.disconnect).toHaveBeenCalled();
      expect(localStorage.getItem('auth_token')).toBeNull();
      
      const status = integrationService.getSystemStatus();
      expect(status.initialized).toBe(false);
    });
  });
});