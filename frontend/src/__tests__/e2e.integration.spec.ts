import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { integrationService } from '@/services/integrationService';
import { backendConnectionService } from '@/services/backendConnectionService';
import { authService } from '@/services/authService';
import { agentService } from '@/services/agentService';
import { brainstormService } from '@/services/brainstormService';
import { socketService } from '@/services/socketService';
import { notificationService } from '@/services/notificationService';
import { useAuthStore } from '@/stores/auth';
import { useAgentStore } from '@/stores/agents';
import { useBrainstormStore } from '@/stores/brainstorm';
import type { 
  LoginCredentials, 
  RegisterData, 
  AgentFormData,
  BrainstormSession,
  Agent,
  User 
} from '@/types';

// Mock所有外部依赖
vi.mock('@/services/authService');
vi.mock('@/services/agentService');
vi.mock('@/services/brainstormService');
vi.mock('@/services/socketService');
vi.mock('@/services/notificationService');
vi.mock('@/services/api');

describe('端到端集成测试 - 完整用户流程', () => {
  let pinia: any;

  // 模拟数据
  const mockUser: User = {
    id: 1,
    username: 'testuser',
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-01T00:00:00Z'
  };

  const mockAgent: Agent = {
    id: 'agent-1',
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
    },
    userId: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockSession: BrainstormSession = {
    id: 'session-1',
    topic: '智能手环设计',
    userId: '1',
    agentIds: ['agent-1'],
    currentStage: 1,
    status: 'active',
    stageResults: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  beforeAll(() => {
    // 设置全局mock
    global.fetch = vi.fn();
    global.WebSocket = vi.fn();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Mock navigator
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  beforeEach(() => {
    // 设置Pinia
    pinia = createPinia();
    setActivePinia(pinia);

    // 清理localStorage
    vi.mocked(localStorage.clear).mockClear();
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(localStorage.setItem).mockClear();
    vi.mocked(localStorage.removeItem).mockClear();

    // 重置所有mock
    vi.clearAllMocks();

    // Mock基础服务
    setupBasicMocks();
  });

  afterEach(async () => {
    await integrationService.cleanup();
    backendConnectionService.reset();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  function setupBasicMocks() {
    // Mock API健康检查
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
    vi.mocked(socketService.connect).mockResolvedValue(undefined);
    vi.mocked(socketService.disconnect).mockReturnValue(undefined);
    vi.mocked(socketService.reconnect).mockResolvedValue(undefined);
    vi.mocked(socketService.isConnected).mockReturnValue(true);
    vi.mocked(socketService.joinRoom).mockReturnValue(undefined);
    vi.mocked(socketService.on).mockReturnValue(undefined);
    vi.mocked(socketService.emit).mockReturnValue(undefined);

    // Mock通知服务
    vi.mocked(notificationService.initialize).mockReturnValue(undefined);
    vi.mocked(notificationService.success).mockReturnValue(undefined);
    vi.mocked(notificationService.error).mockReturnValue(undefined);
    vi.mocked(notificationService.warning).mockReturnValue(undefined);
    vi.mocked(notificationService.info).mockReturnValue(undefined);
  }

  describe('系统初始化和连接测试', () => {
    it('应该成功初始化所有系统组件', async () => {
      // 初始化系统
      await integrationService.initialize();

      // 验证系统状态
      const status = integrationService.getSystemStatus();
      expect(status.initialized).toBe(true);
      expect(status.backendConnected).toBe(true);
      expect(status.websocketConnected).toBe(true);

      // 验证服务调用
      expect(socketService.connect).toHaveBeenCalled();
      expect(notificationService.initialize).toHaveBeenCalled();
    });

    it('应该能够测试完整系统连接', async () => {
      await integrationService.initialize();

      // Mock认证服务
      vi.mocked(authService.getCurrentUser).mockResolvedValue({
        user: mockUser
      });

      const connectionTest = await integrationService.testSystemConnection();

      expect(connectionTest.backend).toBeDefined();
      expect(connectionTest.websocket).toBe(true);
      expect(connectionTest.overall).toBe(true);
    });

    it('应该处理后端连接失败', async () => {
      // Mock健康检查失败
      const mockFailedHealthCheck = vi.fn().mockRejectedValue(new Error('Connection failed'));
      vi.doMock('@/services/api', () => ({
        ApiService: {
          get: mockFailedHealthCheck,
        }
      }));

      await expect(integrationService.initialize()).rejects.toThrow('Backend service unavailable');
      expect(notificationService.error).toHaveBeenCalledWith('无法连接到服务器，请检查网络连接');
    });
  });

  describe('完整用户认证流程', () => {
    beforeEach(async () => {
      await integrationService.initialize();
    });

    it('应该完成用户注册到登录的完整流程', async () => {
      const authStore = useAuthStore();

      // 1. 用户注册
      const registerData: RegisterData = {
        username: 'newuser',
        password: 'password123'
      };

      vi.mocked(authService.register).mockResolvedValue({
        id: 2,
        username: 'newuser',
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: null
      });

      const registeredUser = await integrationService.registerUser(registerData);
      expect(registeredUser.username).toBe('newuser');
      expect(notificationService.success).toHaveBeenCalledWith('注册成功！请登录您的账户');

      // 2. 用户登录
      const loginCredentials: LoginCredentials = {
        username: 'newuser',
        password: 'password123'
      };

      vi.mocked(authService.login).mockResolvedValue({
        accessToken: 'mock-jwt-token',
        tokenType: 'Bearer',
        user: {
          id: 2,
          username: 'newuser',
          createdAt: '2024-01-01T00:00:00Z',
          lastLoginAt: '2024-01-01T00:00:00Z'
        }
      });

      // Mock预加载数据
      vi.mocked(agentService.getAgents).mockResolvedValue([]);
      vi.mocked(brainstormService.getUserSessions).mockResolvedValue([]);

      const loginResult = await integrationService.loginUser(loginCredentials);

      expect(loginResult.accessToken).toBe('mock-jwt-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'mock-jwt-token');
      expect(socketService.reconnect).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalledWith('欢迎回来，newuser！');

      // 3. 验证认证状态
      expect(authStore.isAuthenticated).toBe(true);
    });

    it('应该处理登录失败和重试', async () => {
      const credentials: LoginCredentials = {
        username: 'wronguser',
        password: 'wrongpassword'
      };

      // 第一次失败
      vi.mocked(authService.login)
        .mockRejectedValueOnce(new Error('用户名或密码错误'))
        .mockResolvedValueOnce({
          accessToken: 'mock-jwt-token',
          tokenType: 'Bearer',
          user: mockUser
        });

      // 第一次登录失败
      await expect(integrationService.loginUser(credentials)).rejects.toThrow('用户名或密码错误');
      expect(notificationService.error).toHaveBeenCalledWith('用户名或密码错误');

      // 修正凭据后重试成功
      const correctCredentials: LoginCredentials = {
        username: 'testuser',
        password: 'correctpassword'
      };

      vi.mocked(agentService.getAgents).mockResolvedValue([]);
      vi.mocked(brainstormService.getUserSessions).mockResolvedValue([]);

      const result = await integrationService.loginUser(correctCredentials);
      expect(result.accessToken).toBe('mock-jwt-token');
    });
  });

  describe('代理管理完整流程', () => {
    beforeEach(async () => {
      // 模拟已登录状态
      vi.mocked(localStorage.getItem).mockReturnValue('mock-token');
      await integrationService.initialize();
    });

    it('应该完成代理的完整生命周期管理', async () => {
      const agentStore = useAgentStore();

      // 1. 创建代理
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

      vi.mocked(agentService.createAgent).mockResolvedValue(mockAgent);

      const createdAgent = await integrationService.createAgent(agentData);
      expect(createdAgent.name).toBe('设计师');
      expect(notificationService.success).toHaveBeenCalledWith('代理 "设计师" 创建成功！');

      // 2. 获取代理列表
      vi.mocked(agentService.getAgents).mockResolvedValue([mockAgent]);
      await agentStore.fetchAgents();
      expect(agentStore.agents).toHaveLength(1);

      // 3. 编辑代理
      const updatedAgent = { ...mockAgent, name: '高级设计师' };
      vi.mocked(agentService.updateAgent).mockResolvedValue(updatedAgent);

      const result = await agentStore.updateAgent(mockAgent.id, {
        ...agentData,
        name: '高级设计师'
      });
      expect(result.name).toBe('高级设计师');

      // 4. 选择代理用于头脑风暴
      agentStore.selectAgent(mockAgent.id);
      expect(agentStore.selectedAgentIds).toContain(mockAgent.id);

      // 5. 删除代理
      vi.mocked(agentService.deleteAgent).mockResolvedValue(undefined);
      await agentStore.deleteAgent(mockAgent.id);
      expect(agentStore.agents).toHaveLength(0);
    });

    it('应该验证代理数据完整性', async () => {
      const invalidAgentData: AgentFormData = {
        name: '', // 空名称
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

      await expect(integrationService.createAgent(invalidAgentData))
        .rejects.toThrow('代理名称不能为空');
      expect(notificationService.error).toHaveBeenCalledWith('代理名称不能为空');
    });
  });

  describe('头脑风暴会话完整流程', () => {
    beforeEach(async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('mock-token');
      await integrationService.initialize();

      // 准备代理数据
      vi.mocked(agentService.getAgents).mockResolvedValue([mockAgent]);
    });

    it('应该完成完整的头脑风暴会话流程', async () => {
      const brainstormStore = useBrainstormStore();

      // 1. 创建会话
      const sessionData = {
        topic: '智能手环设计',
        agentIds: [mockAgent.id]
      };

      vi.mocked(brainstormService.createSession).mockResolvedValue(mockSession);

      const createdSession = await integrationService.createBrainstormSession(sessionData);
      expect(createdSession.topic).toBe('智能手环设计');
      expect(socketService.joinRoom).toHaveBeenCalledWith('session_session-1');

      // 2. 模拟会话进度
      await brainstormStore.createSession(sessionData.topic, sessionData.agentIds);

      // 3. 模拟代理开始思考
      brainstormStore.updateAgentStatus(mockAgent.id, 'thinking');
      expect(brainstormStore.agentStatuses[mockAgent.id]).toBe('thinking');

      // 4. 模拟代理完成第一阶段
      const mockResult = {
        agentId: mockAgent.id,
        agentName: mockAgent.name,
        agentRole: mockAgent.role,
        content: '设计建议内容',
        reasoning: '设计理由',
        suggestions: ['建议1', '建议2'],
        confidence: 0.85,
        processingTime: 5000,
        createdAt: '2024-01-01T00:00:00Z'
      };

      brainstormStore.setAgentResult(mockAgent.id, mockResult);
      expect(brainstormStore.agentStatuses[mockAgent.id]).toBe('completed');

      // 5. 模拟阶段总结
      const mockSummary = {
        keyPoints: ['关键点1', '关键点2'],
        commonSuggestions: ['共同建议1'],
        conflictingViews: [],
        overallAssessment: '整体评估',
        nextStepRecommendations: ['下一步建议']
      };

      brainstormStore.setStageSummary(1, mockSummary);
      expect(brainstormStore.currentSession?.stageResults[0]).toBeDefined();

      // 6. 模拟完成所有阶段
      const mockFinalReport = {
        sessionId: mockSession.id,
        topic: mockSession.topic,
        executiveSummary: '执行摘要',
        designConcept: {
          productType: '智能手环',
          culturalBackground: '现代科技',
          designElements: ['简约', '科技感'],
          visualDescription: '简约现代的智能手环',
          targetAudience: '年轻专业人士'
        },
        technicalSolution: {
          materials: ['硅胶', '铝合金'],
          productionProcess: ['注塑', '组装'],
          qualityStandards: ['ISO9001'],
          costEstimation: {
            materials: 50,
            labor: 30,
            overhead: 20,
            total: 100
          },
          timeline: {
            design: 30,
            prototype: 45,
            production: 60,
            total: 135
          }
        },
        marketingStrategy: {
          positioningStatement: '智能生活的完美伴侣',
          channels: [{
            name: '线上销售',
            description: '电商平台销售',
            budget: 50000,
            expectedReach: 100000
          }],
          campaigns: [{
            name: '新品发布',
            description: '新品发布活动',
            budget: 30000,
            duration: 30,
            expectedResults: '提升品牌知名度'
          }],
          budget: {
            advertising: 50000,
            promotion: 30000,
            pr: 20000,
            total: 100000
          },
          kpis: ['销售额', '市场份额', '品牌知名度']
        },
        implementationPlan: {
          phases: [{
            name: '设计阶段',
            duration: 30,
            tasks: ['概念设计', '详细设计'],
            deliverables: ['设计图纸', '原型']
          }],
          timeline: 135,
          budget: 500000,
          risks: ['技术风险', '市场风险']
        },
        riskAssessment: {
          risks: [{
            category: '技术风险',
            description: '技术实现难度',
            probability: 0.3,
            impact: 0.7,
            mitigation: '技术预研'
          }],
          overallRisk: 'medium'
        },
        generatedAt: '2024-01-01T00:00:00Z'
      };

      brainstormStore.setFinalReport(mockFinalReport);
      expect(brainstormStore.currentSession?.finalReport).toBeDefined();
    });

    it('应该处理会话创建失败', async () => {
      const sessionData = {
        topic: '测试主题',
        agentIds: ['nonexistent-agent']
      };

      // Mock代理不存在
      vi.mocked(agentService.getAgents).mockResolvedValue([]);

      await expect(integrationService.createBrainstormSession(sessionData))
        .rejects.toThrow('以下代理不可用: nonexistent-agent');
    });

    it('应该支持会话导出', async () => {
      const sessionWithReport = {
        ...mockSession,
        finalReport: {
          sessionId: mockSession.id,
          topic: mockSession.topic,
          executiveSummary: '测试摘要',
          generatedAt: '2024-01-01T00:00:00Z'
        }
      };

      vi.mocked(brainstormService.getSession).mockResolvedValue(sessionWithReport as any);
      
      // Mock导出服务
      const mockExportService = {
        exportSession: vi.fn().mockResolvedValue(undefined)
      };
      vi.doMock('@/services/exportService', () => ({
        exportService: mockExportService
      }));

      await integrationService.exportSession(mockSession.id, 'pdf');
      expect(notificationService.success).toHaveBeenCalledWith('会话报告已成功导出为 PDF 格式');
    });
  });

  describe('WebSocket实时通信集成', () => {
    beforeEach(async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('mock-token');
      await integrationService.initialize();
    });

    it('应该正确处理实时事件', async () => {
      // 创建会话
      const sessionData = {
        topic: '测试主题',
        agentIds: [mockAgent.id]
      };

      vi.mocked(agentService.getAgents).mockResolvedValue([mockAgent]);
      vi.mocked(brainstormService.createSession).mockResolvedValue(mockSession);

      await integrationService.createBrainstormSession(sessionData);

      // 验证WebSocket事件监听设置
      expect(socketService.joinRoom).toHaveBeenCalledWith('session_session-1');
      expect(socketService.on).toHaveBeenCalledWith('agent_status_update', expect.any(Function));
      expect(socketService.on).toHaveBeenCalledWith('stage_complete', expect.any(Function));
      expect(socketService.on).toHaveBeenCalledWith('session_complete', expect.any(Function));
    });

    it('应该处理WebSocket连接失败', async () => {
      // Mock WebSocket连接失败
      vi.mocked(socketService.connect).mockRejectedValue(new Error('WebSocket connection failed'));
      vi.mocked(socketService.isConnected).mockReturnValue(false);

      // 系统应该仍能初始化，但WebSocket功能不可用
      await integrationService.initialize();

      const status = integrationService.getSystemStatus();
      expect(status.initialized).toBe(true);
      expect(status.websocketConnected).toBe(false);
    });
  });

  describe('错误处理和恢复', () => {
    it('应该处理网络中断和恢复', async () => {
      await integrationService.initialize();

      // 模拟网络中断
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));

      // 模拟网络恢复
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));

      // 系统应该能够恢复
      const status = integrationService.getSystemStatus();
      expect(status.initialized).toBe(true);
    });

    it('应该处理认证过期', async () => {
      await integrationService.initialize();

      // 模拟认证过期
      const authError = { code: 'UNAUTHORIZED', message: 'Token expired' };
      
      const eventListener = vi.fn();
      window.addEventListener('auth:expired', eventListener);

      integrationService.handleGlobalError(authError);

      expect(notificationService.error).toHaveBeenCalledWith('登录已过期，请重新登录');
      expect(eventListener).toHaveBeenCalled();

      window.removeEventListener('auth:expired', eventListener);
    });

    it('应该支持操作重试', async () => {
      let callCount = 0;
      const mockFailingOperation = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw { code: 'NETWORK_ERROR', message: 'Network failed' };
        }
        return Promise.resolve({ success: true });
      });

      // 模拟重试逻辑
      const retryOperation = async (operation: () => Promise<any>, maxRetries = 3) => {
        let lastError;
        for (let i = 0; i <= maxRetries; i++) {
          try {
            return await operation();
          } catch (error) {
            lastError = error;
            if (i === maxRetries) throw lastError;
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        throw lastError;
      };

      const result = await retryOperation(mockFailingOperation);
      expect(result).toEqual({ success: true });
      expect(callCount).toBe(3);
    });
  });

  describe('性能和监控', () => {
    it('应该记录用户行为', async () => {
      await integrationService.initialize();

      const eventListener = vi.fn();
      window.addEventListener('user:action', eventListener);

      // 执行一些操作
      vi.mocked(authService.register).mockResolvedValue({
        id: 1,
        username: 'testuser',
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: null
      });

      await integrationService.registerUser({
        username: 'testuser',
        password: 'password123'
      });

      expect(eventListener).toHaveBeenCalled();
      const eventData = eventListener.mock.calls[0][0].detail;
      expect(eventData.action).toBe('user_registered');
      expect(eventData.data.username).toBe('testuser');

      window.removeEventListener('user:action', eventListener);
    });

    it('应该监控系统性能', async () => {
      const startTime = Date.now();
      await integrationService.initialize();
      const endTime = Date.now();

      const initTime = endTime - startTime;
      expect(initTime).toBeLessThan(5000); // 初始化应在5秒内完成

      // 测试系统连接性能
      const connectionTest = await integrationService.testSystemConnection();
      expect(connectionTest.backend?.latency).toBeDefined();
    });
  });

  describe('数据一致性和同步', () => {
    it('应该保持前端状态与后端数据同步', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('mock-token');
      await integrationService.initialize();

      const authStore = useAuthStore();
      const agentStore = useAgentStore();
      const brainstormStore = useBrainstormStore();

      // 模拟登录
      vi.mocked(authService.login).mockResolvedValue({
        accessToken: 'mock-token',
        tokenType: 'Bearer',
        user: mockUser
      });

      vi.mocked(agentService.getAgents).mockResolvedValue([mockAgent]);
      vi.mocked(brainstormService.getUserSessions).mockResolvedValue([mockSession]);

      await integrationService.loginUser({
        username: 'testuser',
        password: 'password123'
      });

      // 验证状态同步
      expect(authStore.isAuthenticated).toBe(true);
      
      await agentStore.fetchAgents();
      expect(agentStore.agents).toHaveLength(1);
      expect(agentStore.agents[0].id).toBe(mockAgent.id);
    });

    it('应该处理并发操作', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('mock-token');
      await integrationService.initialize();

      const agentStore = useAgentStore();

      // 模拟并发创建代理
      const agentData1: AgentFormData = {
        name: '设计师1',
        role: 'Designer',
        systemPrompt: 'Prompt 1',
        modelType: 'gpt-4',
        modelConfig: {
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0
        }
      };

      const agentData2: AgentFormData = {
        name: '设计师2',
        role: 'Designer',
        systemPrompt: 'Prompt 2',
        modelType: 'gpt-4',
        modelConfig: {
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0
        }
      };

      vi.mocked(agentService.createAgent)
        .mockResolvedValueOnce({ ...mockAgent, id: 'agent-1', name: '设计师1' })
        .mockResolvedValueOnce({ ...mockAgent, id: 'agent-2', name: '设计师2' });

      // 并发创建
      const [agent1, agent2] = await Promise.all([
        integrationService.createAgent(agentData1),
        integrationService.createAgent(agentData2)
      ]);

      expect(agent1.name).toBe('设计师1');
      expect(agent2.name).toBe('设计师2');
    });
  });
});