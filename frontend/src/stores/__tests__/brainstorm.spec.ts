import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useBrainstormStore } from '../brainstorm';
import { brainstormService } from '@/services/brainstormService';
import { NotificationService } from '@/services/notificationService';
import type { BrainstormSession, AgentResult, AISummary, FinalReport } from '@/types/brainstorm';

// Mock dependencies
vi.mock('@/services/brainstormService', () => ({
  brainstormService: {
    createSession: vi.fn(),
    getSession: vi.fn(),
    getSessions: vi.fn(),
    deleteSession: vi.fn(),
  },
}));

vi.mock('@/services/notificationService', () => ({
  NotificationService: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useBrainstormStore', () => {
  let pinia: any;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  const mockSession: BrainstormSession = {
    id: '1',
    title: '智能手环设计会话',
    description: '设计智能手环的头脑风暴会话',
    topic: '智能手环设计',
    userId: '1',
    currentPhase: 'IDEA_GENERATION',
    currentStage: 1,
    status: 'ACTIVE',
    agents: [
      { agentId: 1, agent: { id: '1', name: '设计师', role: 'UI/UX Designer' } as any },
      { agentId: 2, agent: { id: '2', name: '工程师', role: 'Engineer' } as any }
    ],
    phases: [
      {
        id: '1',
        sessionId: '1',
        phaseType: 'IDEA_GENERATION',
        status: 'IN_PROGRESS',
        startedAt: '2024-01-01T00:00:00Z',
        summary: null,
        completedAt: null
      }
    ],
    stageResults: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockAgentResult: AgentResult = {
    agentId: 1,
    agentName: '设计师',
    agentRole: 'UI/UX Designer',
    content: '这是设计建议',
    processingTime: 5000,
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockSummary: AISummary = {
    keyPoints: ['关键点1', '关键点2'],
    commonSuggestions: ['建议1', '建议2'],
    conflictingViews: [],
    overallAssessment: '整体评估',
    nextStepRecommendations: ['下一步建议'],
  };

  it('should initialize with default state', () => {
    const brainstormStore = useBrainstormStore();

    expect(brainstormStore.currentSession).toBeNull();
    expect(brainstormStore.agentStatuses).toEqual({});
    expect(brainstormStore.realTimeResults).toEqual({});
    expect(brainstormStore.loading).toBe(false);
    expect(brainstormStore.error).toBeNull();
    expect(brainstormStore.stageProgress).toBeNull();
  });

  it('should create session successfully', async () => {
    (brainstormService.createSession as any).mockResolvedValue(mockSession);

    const brainstormStore = useBrainstormStore();

    const result = await brainstormStore.createSession('智能手环设计会话', '智能手环设计', [1, 2]);

    expect(brainstormService.createSession).toHaveBeenCalledWith({
      title: '智能手环设计会话',
      description: undefined,
      topic: '智能手环设计',
      agentIds: [1, 2]
    });
    expect(brainstormStore.currentSession).toEqual(mockSession);
    expect(brainstormStore.agentStatuses).toEqual({ 1: 'idle', 2: 'idle' });
    expect(result).toEqual(mockSession);
  });

  it('should handle create session error', async () => {
    const mockError = new Error('Create failed');
    (brainstormService.createSession as any).mockRejectedValue(mockError);

    const brainstormStore = useBrainstormStore();

    await expect(brainstormStore.createSession('智能手环设计会话', '智能手环设计', [1, 2])).rejects.toThrow('Create failed');
    expect(brainstormStore.error).toBe('Create failed');
    expect(brainstormStore.loading).toBe(false);
  });

  it('should load session successfully', async () => {
    (brainstormService.getSession as any).mockResolvedValue(mockSession);

    const brainstormStore = useBrainstormStore();

    await brainstormStore.loadSession('1');

    expect(brainstormService.getSession).toHaveBeenCalledWith('1');
    expect(brainstormStore.currentSession).toEqual(mockSession);
  });

  it('should handle load session error', async () => {
    const mockError = new Error('Load failed');
    (brainstormService.getSession as any).mockRejectedValue(mockError);

    const brainstormStore = useBrainstormStore();

    await expect(brainstormStore.loadSession('1')).rejects.toThrow('Load failed');
    expect(brainstormStore.error).toBe('Load failed');
    expect(brainstormStore.loading).toBe(false);
  });

  it('should update agent status', () => {
    const brainstormStore = useBrainstormStore();

    brainstormStore.updateAgentStatus(1, 'thinking');

    expect(brainstormStore.agentStatuses[1]).toBe('thinking');
  });

  it('should set agent result', () => {
    const brainstormStore = useBrainstormStore();

    brainstormStore.setAgentResult(1, mockAgentResult);

    expect(brainstormStore.realTimeResults[1]).toEqual(mockAgentResult);
    expect(brainstormStore.agentStatuses[1]).toBe('completed');
  });

  it('should set stage summary', () => {
    const brainstormStore = useBrainstormStore();
    brainstormStore.currentSession = mockSession;
    brainstormStore.realTimeResults = { 1: mockAgentResult };

    brainstormStore.setStageSummary(1, mockSummary);

    // 检查stageResults是否存在且有内容
    expect(brainstormStore.currentSession?.stageResults).toBeDefined();
    expect(brainstormStore.currentSession?.stageResults?.length).toBeGreaterThan(0);
    
    if (brainstormStore.currentSession?.stageResults?.[0]) {
      expect(brainstormStore.currentSession.stageResults[0]).toMatchObject({
        stage: 1,
        stageName: '创意生成',
        aiSummary: mockSummary
      });
      expect(brainstormStore.currentSession.stageResults[0].completedAt).toBeDefined();
    }
  });

  it('should set final report', () => {
    const mockReport: FinalReport = {
      sessionId: 1,
      topic: '智能手环设计',
      executiveSummary: '执行摘要',
      designConcept: {
        productType: '智能穿戴设备',
        culturalBackground: '现代科技文化',
        designElements: ['简约', '科技感'],
        visualDescription: '简洁的圆形设计',
        targetAudience: '年轻人群',
      },
      technicalSolution: {
        materials: ['硅胶', '铝合金'],
        productionProcess: ['设计', '制造', '测试'],
        qualityStandards: ['ISO9001'],
        costEstimation: {
          materials: 100,
          labor: 200,
          overhead: 50,
          total: 350,
          currency: 'CNY',
        },
        timeline: {
          phases: [{
            name: '设计阶段',
            duration: 30,
            dependencies: [],
          }],
          totalDuration: 90,
          unit: 'days',
        },
      },
      marketingStrategy: {
        positioningStatement: '面向年轻人的智能手环',
        channels: [{
          name: '线上渠道',
          type: 'digital',
          budget: 10000,
          expectedReach: 100000,
        }],
        campaigns: [{
          name: '新品发布',
          description: '新品发布活动',
          channels: ['线上'],
          budget: 5000,
          duration: 7,
          expectedROI: 200,
        }],
        budget: {
          total: 20000,
          breakdown: {
            advertising: 10000,
            content: 5000,
            events: 3000,
            other: 2000,
          },
          currency: 'CNY',
        },
        kpis: ['转化率', '品牌知名度'],
      },
      implementationPlan: {
        phases: [{
          name: '第一阶段',
          description: '产品设计',
          duration: 30,
          tasks: ['需求分析', '概念设计'],
          dependencies: [],
        }],
        resources: [{
          type: 'human',
          name: '设计师',
          quantity: 2,
          cost: 20000,
        }],
        milestones: [{
          name: '设计完成',
          description: '完成产品设计',
          dueDate: '2024-03-01',
          deliverables: ['设计稿'],
        }],
        totalDuration: 90,
      },
      riskAssessment: {
        risks: [{
          id: 'R001',
          category: 'technical',
          description: '技术实现风险',
          probability: 'medium',
          impact: 'high',
          severity: 7,
        }],
        mitigationStrategies: [{
          riskId: 'R001',
          strategy: '技术预研',
          cost: 5000,
          effectiveness: 8,
        }],
        overallRiskLevel: 'medium',
      },
      generatedAt: '2024-01-01T00:00:00Z',
    };

    const brainstormStore = useBrainstormStore();
    brainstormStore.currentSession = mockSession;

    brainstormStore.setFinalReport(mockReport);

    expect(brainstormStore.currentSession.finalReport).toEqual(mockReport);
    expect(brainstormStore.currentSession.status).toBe('COMPLETED');
  });

  it('should clear session', () => {
    const brainstormStore = useBrainstormStore();
    brainstormStore.currentSession = mockSession;
    brainstormStore.agentStatuses = { 1: 'thinking' };
    brainstormStore.realTimeResults = { 1: mockAgentResult };

    brainstormStore.clearSession();

    expect(brainstormStore.currentSession).toBeNull();
    expect(brainstormStore.agentStatuses).toEqual({});
    expect(brainstormStore.realTimeResults).toEqual({});
  });

  it('should compute stage progress correctly', () => {
    const brainstormStore = useBrainstormStore();
    brainstormStore.currentSession = {
      ...mockSession,
      currentPhase: 'FEASIBILITY_ANALYSIS',
      currentStage: 2,
      phases: [
        {
          id: '1',
          sessionId: '1',
          phaseType: 'IDEA_GENERATION',
          status: 'COMPLETED',
          startedAt: '2024-01-01T00:00:00Z',
          summary: JSON.stringify(mockSummary),
          completedAt: '2024-01-01T01:00:00Z'
        },
        {
          id: '2',
          sessionId: '1',
          phaseType: 'FEASIBILITY_ANALYSIS',
          status: 'IN_PROGRESS',
          startedAt: '2024-01-01T01:00:00Z',
          summary: null,
          completedAt: null
        }
      ],
      stageResults: [
        {
          stage: 1,
          stageName: '创意生成',
          agentResults: [],
          aiSummary: mockSummary,
          completedAt: '2024-01-01T00:00:00Z',
        },
      ],
    };

    expect(brainstormStore.stageProgress).toEqual({
      current: 2,
      total: 3,
      stages: ['创意生成', '技术可行性分析', '缺点讨论'],
      completed: [true, false],
    });
  });

  it('should return null stage progress when no session', () => {
    const brainstormStore = useBrainstormStore();

    expect(brainstormStore.stageProgress).toBeNull();
  });

  it('should fetch sessions successfully', async () => {
    const mockSessions = [mockSession];
    const mockResponse = {
      items: mockSessions,
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      }
    };
    (brainstormService.getSessions as any).mockResolvedValue(mockResponse);

    const brainstormStore = useBrainstormStore();

    await brainstormStore.fetchSessions();

    expect(brainstormService.getSessions).toHaveBeenCalled();
    expect(brainstormStore.sessions).toEqual(mockSessions);
  });

  it('should delete session successfully', async () => {
    (brainstormService.deleteSession as any).mockResolvedValue();

    const brainstormStore = useBrainstormStore();
    brainstormStore.sessions = [mockSession];

    await brainstormStore.deleteSession('1');

    expect(brainstormService.deleteSession).toHaveBeenCalledWith('1');
    expect(brainstormStore.sessions).toEqual([]);
    expect(NotificationService.success).toHaveBeenCalledWith('会话删除成功');
  });

  it('should clear error', () => {
    const brainstormStore = useBrainstormStore();
    brainstormStore.error = 'Some error';

    brainstormStore.clearError();

    expect(brainstormStore.error).toBeNull();
  });
});