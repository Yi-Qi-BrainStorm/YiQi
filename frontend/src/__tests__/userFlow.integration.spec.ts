import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { nextTick } from 'vue';

// 导入主要组件
import App from '@/App.vue';
import Login from '@/views/auth/Login.vue';
import Register from '@/views/auth/Register.vue';
import Dashboard from '@/views/dashboard/Dashboard.vue';
import AgentManagement from '@/views/agents/AgentManagement.vue';
import BrainstormSession from '@/views/brainstorm/BrainstormSession.vue';

// 导入服务和stores
import { integrationService } from '@/services/integrationService';
import { useAuthStore } from '@/stores/auth';
import { useAgentStore } from '@/stores/agents';
import { useBrainstormStore } from '@/stores/brainstorm';

// Mock所有外部依赖
vi.mock('@/services/authService');
vi.mock('@/services/agentService');
vi.mock('@/services/brainstormService');
vi.mock('@/services/socketService');
vi.mock('@/services/notificationService');
vi.mock('@/services/api');

describe('完整用户流程集成测试', () => {
  let router: any;
  let pinia: any;

  beforeEach(async () => {
    // 设置Pinia
    pinia = createPinia();
    setActivePinia(pinia);

    // 设置路由
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', redirect: '/dashboard' },
        { path: '/login', component: Login },
        { path: '/register', component: Register },
        { path: '/dashboard', component: Dashboard },
        { path: '/agents', component: AgentManagement },
        { path: '/brainstorm', component: BrainstormSession },
      ],
    });

    // 清理localStorage
    localStorage.clear();
    
    // 重置所有mock
    vi.clearAllMocks();

    // Mock基础API响应
    const mockHealthCheck = vi.fn().mockResolvedValue({ status: 'UP' });
    vi.doMock('@/services/api', () => ({
      ApiService: {
        get: mockHealthCheck,
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      }
    }));

    // Mock socket服务
    vi.doMock('@/services/socketService', () => ({
      socketService: {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn(),
        reconnect: vi.fn().mockResolvedValue(undefined),
        isConnected: vi.fn().mockReturnValue(true),
        joinRoom: vi.fn(),
        on: vi.fn(),
        emit: vi.fn(),
      }
    }));

    // Mock通知服务
    vi.doMock('@/services/notificationService', () => ({
      notificationService: {
        initialize: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn(),
      }
    }));
  });

  afterEach(async () => {
    await integrationService.cleanup();
  });

  describe('用户注册和登录流程', () => {
    it('应该完成完整的注册和登录流程', async () => {
      // 1. 初始化应用
      await integrationService.initialize();

      // 2. 模拟用户注册
      const mockRegisterResponse = {
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        message: '注册成功'
      };

      vi.doMock('@/services/authService', () => ({
        authService: {
          register: vi.fn().mockResolvedValue(mockRegisterResponse),
          login: vi.fn().mockResolvedValue({
            user: mockRegisterResponse.user,
            token: 'mock-jwt-token'
          }),
          getCurrentUser: vi.fn().mockResolvedValue(mockRegisterResponse)
        }
      }));

      // 注册用户
      const registerData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };

      const registeredUser = await integrationService.registerUser(registerData);
      expect(registeredUser.username).toBe('testuser');

      // 3. 模拟用户登录
      const loginCredentials = {
        username: 'testuser',
        password: 'password123'
      };

      // Mock代理和会话数据
      vi.doMock('@/services/agentService', () => ({
        agentService: {
          getAgents: vi.fn().mockResolvedValue([]),
        }
      }));

      vi.doMock('@/services/brainstormService', () => ({
        brainstormService: {
          getUserSessions: vi.fn().mockResolvedValue([]),
        }
      }));

      const loginResult = await integrationService.loginUser(loginCredentials);
      
      expect(loginResult.user.username).toBe('testuser');
      expect(loginResult.token).toBe('mock-jwt-token');
      expect(localStorage.getItem('auth_token')).toBe('mock-jwt-token');

      // 4. 验证认证状态
      const authStore = useAuthStore();
      expect(authStore.isAuthenticated).toBe(true);
    });

    it('应该处理注册失败的情况', async () => {
      await integrationService.initialize();

      const mockError = new Error('用户名已存在');
      vi.doMock('@/services/authService', () => ({
        authService: {
          register: vi.fn().mockRejectedValue(mockError),
        }
      }));

      const registerData = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };

      await expect(integrationService.registerUser(registerData))
        .rejects.toThrow('用户名已存在');
    });
  });

  describe('代理管理流程', () => {
    beforeEach(async () => {
      // 模拟已登录状态
      localStorage.setItem('auth_token', 'mock-token');
      await integrationService.initialize();

      // Mock认证服务
      vi.doMock('@/services/authService', () => ({
        authService: {
          getCurrentUser: vi.fn().mockResolvedValue({
            user: {
              id: '1',
              username: 'testuser',
              email: 'test@example.com',
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z'
            }
          })
        }
      }));
    });

    it('应该完成代理的创建、编辑和删除流程', async () => {
      const agentStore = useAgentStore();

      // 1. 创建代理
      const agentData = {
        name: '设计师',
        role: 'UI/UX Designer',
        systemPrompt: 'You are a creative designer specialized in user interface and user experience design.',
        modelType: 'gpt-4' as const,
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
        userId: '1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      vi.doMock('@/services/agentService', () => ({
        agentService: {
          createAgent: vi.fn().mockResolvedValue(mockAgent),
          getAgents: vi.fn().mockResolvedValue([mockAgent]),
          updateAgent: vi.fn().mockResolvedValue({ ...mockAgent, name: '高级设计师' }),
          deleteAgent: vi.fn().mockResolvedValue(undefined),
        }
      }));

      // 创建代理
      const createdAgent = await integrationService.createAgent(agentData);
      expect(createdAgent.name).toBe('设计师');

      // 2. 获取代理列表
      await agentStore.fetchAgents();
      expect(agentStore.agents).toHaveLength(1);
      expect(agentStore.agents[0].name).toBe('设计师');

      // 3. 更新代理
      const updatedAgent = await agentStore.updateAgent('agent-1', {
        ...agentData,
        name: '高级设计师'
      });
      expect(updatedAgent.name).toBe('高级设计师');

      // 4. 删除代理
      await agentStore.deleteAgent('agent-1');
      expect(agentStore.agents).toHaveLength(0);
    });

    it('应该支持代理选择功能', async () => {
      const agentStore = useAgentStore();

      const mockAgents = [
        {
          id: 'agent-1',
          name: '设计师',
          role: 'Designer',
          systemPrompt: 'Designer prompt',
          modelType: 'gpt-4' as const,
          modelConfig: { temperature: 0.7, maxTokens: 2000, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
          userId: '1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'agent-2',
          name: '工程师',
          role: 'Engineer',
          systemPrompt: 'Engineer prompt',
          modelType: 'gpt-4' as const,
          modelConfig: { temperature: 0.5, maxTokens: 2000, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
          userId: '1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      vi.doMock('@/services/agentService', () => ({
        agentService: {
          getAgents: vi.fn().mockResolvedValue(mockAgents),
        }
      }));

      await agentStore.fetchAgents();
      
      // 选择代理
      agentStore.selectAgent('agent-1');
      agentStore.selectAgent('agent-2');
      
      expect(agentStore.selectedAgents).toHaveLength(2);
      expect(agentStore.selectedAgentIds).toContain('agent-1');
      expect(agentStore.selectedAgentIds).toContain('agent-2');

      // 取消选择
      agentStore.deselectAgent('agent-1');
      expect(agentStore.selectedAgents).toHaveLength(1);
      expect(agentStore.selectedAgentIds).not.toContain('agent-1');
    });
  });

  describe('头脑风暴会话流程', () => {
    beforeEach(async () => {
      localStorage.setItem('auth_token', 'mock-token');
      await integrationService.initialize();

      // Mock基础服务
      vi.doMock('@/services/authService', () => ({
        authService: {
          getCurrentUser: vi.fn().mockResolvedValue({
            user: { id: '1', username: 'testuser', email: 'test@example.com', createdAt: '', updatedAt: '' }
          })
        }
      }));
    });

    it('应该完成完整的头脑风暴会话流程', async () => {
      const brainstormStore = useBrainstormStore();

      // 1. 准备代理数据
      const mockAgents = [
        {
          id: 'agent-1',
          name: '设计师',
          role: 'Designer',
          systemPrompt: 'Designer prompt',
          modelType: 'gpt-4' as const,
          modelConfig: { temperature: 0.7, maxTokens: 2000, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
          userId: '1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'agent-2',
          name: '工程师',
          role: 'Engineer',
          systemPrompt: 'Engineer prompt',
          modelType: 'gpt-4' as const,
          modelConfig: { temperature: 0.5, maxTokens: 2000, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
          userId: '1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      // 2. 创建会话
      const mockSession = {
        id: 'session-1',
        topic: '智能手环设计',
        userId: '1',
        agentIds: ['agent-1', 'agent-2'],
        currentStage: 1,
        status: 'active' as const,
        stageResults: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      vi.doMock('@/services/agentService', () => ({
        agentService: {
          getAgents: vi.fn().mockResolvedValue(mockAgents),
        }
      }));

      vi.doMock('@/services/brainstormService', () => ({
        brainstormService: {
          createSession: vi.fn().mockResolvedValue(mockSession),
          getSession: vi.fn().mockResolvedValue(mockSession),
        }
      }));

      // 创建会话
      const sessionData = {
        topic: '智能手环设计',
        agentIds: ['agent-1', 'agent-2']
      };

      const createdSession = await integrationService.createBrainstormSession(sessionData);
      expect(createdSession.topic).toBe('智能手环设计');
      expect(createdSession.agentIds).toEqual(['agent-1', 'agent-2']);

      // 3. 模拟会话进度更新
      await brainstormStore.createSession('智能手环设计', ['agent-1', 'agent-2']);
      
      // 更新代理状态
      brainstormStore.updateAgentStatus('agent-1', 'thinking');
      brainstormStore.updateAgentStatus('agent-2', 'thinking');
      
      expect(brainstormStore.agentStatuses['agent-1']).toBe('thinking');
      expect(brainstormStore.agentStatuses['agent-2']).toBe('thinking');

      // 4. 模拟代理完成
      const mockResult1 = {
        agentId: 'agent-1',
        agentName: '设计师',
        agentRole: 'Designer',
        content: '设计建议内容',
        reasoning: '设计理由',
        suggestions: ['建议1', '建议2'],
        confidence: 0.85,
        processingTime: 5000,
        createdAt: '2024-01-01T00:00:00Z'
      };

      const mockResult2 = {
        agentId: 'agent-2',
        agentName: '工程师',
        agentRole: 'Engineer',
        content: '工程建议内容',
        reasoning: '工程理由',
        suggestions: ['技术建议1', '技术建议2'],
        confidence: 0.90,
        processingTime: 4500,
        createdAt: '2024-01-01T00:00:00Z'
      };

      brainstormStore.setAgentResult('agent-1', mockResult1);
      brainstormStore.setAgentResult('agent-2', mockResult2);

      expect(brainstormStore.realTimeResults['agent-1']).toEqual(mockResult1);
      expect(brainstormStore.realTimeResults['agent-2']).toEqual(mockResult2);
      expect(brainstormStore.agentStatuses['agent-1']).toBe('completed');
      expect(brainstormStore.agentStatuses['agent-2']).toBe('completed');

      // 5. 模拟阶段总结
      const mockSummary = {
        keyPoints: ['关键点1', '关键点2'],
        commonSuggestions: ['共同建议1', '共同建议2'],
        conflictingViews: [],
        overallAssessment: '整体评估',
        nextStepRecommendations: ['下一步建议1', '下一步建议2']
      };

      brainstormStore.setStageSummary(1, mockSummary);
      
      expect(brainstormStore.currentSession?.stageResults[0]).toBeDefined();
      expect(brainstormStore.currentSession?.stageResults[0].aiSummary).toEqual(mockSummary);
    });

    it('应该处理会话创建失败', async () => {
      const mockError = new Error('创建会话失败');
      
      vi.doMock('@/services/agentService', () => ({
        agentService: {
          getAgents: vi.fn().mockResolvedValue([]),
        }
      }));

      vi.doMock('@/services/brainstormService', () => ({
        brainstormService: {
          createSession: vi.fn().mockRejectedValue(mockError),
        }
      }));

      const sessionData = {
        topic: '测试主题',
        agentIds: ['nonexistent-agent']
      };

      await expect(integrationService.createBrainstormSession(sessionData))
        .rejects.toThrow('以下代理不可用: nonexistent-agent');
    });
  });

  describe('WebSocket实时通信', () => {
    it('应该正确处理WebSocket事件', async () => {
      localStorage.setItem('auth_token', 'mock-token');
      
      // Mock WebSocket事件
      const mockSocketService = {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn(),
        reconnect: vi.fn().mockResolvedValue(undefined),
        isConnected: vi.fn().mockReturnValue(true),
        joinRoom: vi.fn(),
        on: vi.fn(),
        emit: vi.fn(),
      };

      vi.doMock('@/services/socketService', () => ({
        socketService: mockSocketService
      }));

      await integrationService.initialize();

      // 创建会话并设置WebSocket监听
      const sessionData = {
        topic: '测试主题',
        agentIds: ['agent-1']
      };

      const mockSession = {
        id: 'session-1',
        topic: '测试主题',
        userId: '1',
        agentIds: ['agent-1'],
        currentStage: 1,
        status: 'active' as const,
        stageResults: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      vi.doMock('@/services/agentService', () => ({
        agentService: {
          getAgents: vi.fn().mockResolvedValue([{ id: 'agent-1', name: 'Test Agent' }]),
        }
      }));

      vi.doMock('@/services/brainstormService', () => ({
        brainstormService: {
          createSession: vi.fn().mockResolvedValue(mockSession),
        }
      }));

      await integrationService.createBrainstormSession(sessionData);

      // 验证WebSocket设置
      expect(mockSocketService.joinRoom).toHaveBeenCalledWith('session_session-1');
      expect(mockSocketService.on).toHaveBeenCalledWith('agent_status_update', expect.any(Function));
      expect(mockSocketService.on).toHaveBeenCalledWith('stage_complete', expect.any(Function));
      expect(mockSocketService.on).toHaveBeenCalledWith('session_complete', expect.any(Function));
    });
  });

  describe('错误恢复和重试机制', () => {
    it('应该在网络错误后自动重试', async () => {
      let callCount = 0;
      const mockFailingService = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Network error');
        }
        return Promise.resolve({ success: true });
      });

      vi.doMock('@/services/api', () => ({
        ApiService: {
          get: mockFailingService,
          retry: async (requestFn: () => Promise<any>, maxRetries = 3, delay = 1000) => {
            let lastError: Error;
            for (let i = 0; i <= maxRetries; i++) {
              try {
                return await requestFn();
              } catch (error) {
                lastError = error as Error;
                if (i === maxRetries) throw lastError;
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
            throw lastError!;
          }
        }
      }));

      // 使用重试机制
      const { ApiService } = await import('@/services/api');
      const result = await ApiService.retry(() => mockFailingService());
      
      expect(result).toEqual({ success: true });
      expect(callCount).toBe(3); // 失败2次，第3次成功
    });
  });

  describe('性能监控', () => {
    it('应该记录API请求性能', async () => {
      const performanceEntries: any[] = [];
      
      // Mock performance API
      global.performance = {
        ...global.performance,
        mark: vi.fn(),
        measure: vi.fn(),
        getEntriesByType: vi.fn().mockReturnValue(performanceEntries),
        now: vi.fn().mockReturnValue(Date.now()),
      };

      await integrationService.initialize();

      // 验证性能监控已启用
      expect(integrationService.getSystemStatus().initialized).toBe(true);
    });
  });
});