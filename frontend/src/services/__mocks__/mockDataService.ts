import type { User, Agent, BrainstormSession, AgentResult, FinalReport } from '@/types';

/**
 * Mock数据服务 - 提供完整的模拟数据
 */
export class MockDataService {
  private static instance: MockDataService;
  private users: User[] = [];
  private agents: Agent[] = [];
  private sessions: BrainstormSession[] = [];
  private currentUserId: number | null = null;

  private constructor() {
    this.initializeMockData();
  }

  static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  /**
   * 初始化模拟数据
   */
  private initializeMockData(): void {
    // 创建模拟用户
    this.users = [
      {
        id: 1,
        username: 'testuser',
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        username: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-01-15T09:00:00Z'
      }
    ];

    // 创建模拟代理
    this.agents = [
      {
        id: '1',
        name: '设计师',
        role: 'UI/UX Designer',
        systemPrompt: 'You are a creative designer with expertise in user interface and user experience design.',
        modelType: 'gpt-4',
        modelConfig: {
          temperature: 0.7,
          maxTokens: 2000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0
        },
        userId: '1',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: '工程师',
        role: 'Software Engineer',
        systemPrompt: 'You are an experienced software engineer with expertise in full-stack development.',
        modelType: 'gpt-4',
        modelConfig: {
          temperature: 0.5,
          maxTokens: 2000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0
        },
        userId: '1',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        name: '产品经理',
        role: 'Product Manager',
        systemPrompt: 'You are a strategic product manager with expertise in product planning and market analysis.',
        modelType: 'gpt-4',
        modelConfig: {
          temperature: 0.6,
          maxTokens: 2000,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0
        },
        userId: '1',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];

    // 创建模拟会话
    this.sessions = [
      {
        id: '1',
        topic: '智能手环设计',
        userId: '1',
        agentIds: ['1', '2'],
        agents: [
          { agentId: '1', agentName: '设计师', agentRole: 'UI/UX Designer' },
          { agentId: '2', agentName: '工程师', agentRole: 'Software Engineer' }
        ],
        currentStage: 1,
        status: 'ACTIVE',
        phases: [
          {
            id: '1',
            phaseType: 'IDEATION',
            phaseName: '创意生成',
            status: 'COMPLETED',
            summary: JSON.stringify({
              keyPoints: ['关键点1', '关键点2'],
              commonSuggestions: ['建议1', '建议2'],
              conflictingViews: [],
              overallAssessment: '整体评估',
              nextStepRecommendations: ['下一步建议1', '下一步建议2']
            }),
            completedAt: '2024-01-01T01:00:00Z'
          },
          {
            id: '2',
            phaseType: 'ANALYSIS',
            phaseName: '技术可行性分析',
            status: 'IN_PROGRESS',
            summary: null,
            completedAt: null
          },
          {
            id: '3',
            phaseType: 'CRITIQUE',
            phaseName: '缺点讨论',
            status: 'PENDING',
            summary: null,
            completedAt: null
          }
        ],
        stageResults: [
          {
            stage: 1,
            stageName: '创意生成',
            aiSummary: {
              keyPoints: ['关键点1', '关键点2'],
              commonSuggestions: ['建议1', '建议2'],
              conflictingViews: [],
              overallAssessment: '整体评估',
              nextStepRecommendations: ['下一步建议1', '下一步建议2']
            },
            completedAt: '2024-01-01T01:00:00Z'
          }
        ],
        finalReport: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:30:00Z'
      }
    ];
  }

  /**
   * 用户认证相关
   */
  async login(username: string, password: string): Promise<{ user: User; accessToken: string; tokenType: string }> {
    await this.delay(500); // 模拟网络延迟
    
    const user = this.users.find(u => u.username === username);
    if (!user || password !== 'test123456') {
      throw new Error('Invalid credentials');
    }

    this.currentUserId = user.id;
    
    return {
      user,
      accessToken: `mock-token-${user.id}-${Date.now()}`,
      tokenType: 'Bearer'
    };
  }

  async register(username: string, password: string): Promise<User> {
    await this.delay(500);
    
    // 检查用户名是否已存在
    if (this.users.find(u => u.username === username)) {
      throw new Error('Username already exists');
    }

    const newUser: User = {
      id: this.users.length + 1,
      username,
      createdAt: new Date().toISOString(),
      lastLoginAt: null
    };

    this.users.push(newUser);
    return newUser;
  }

  async getCurrentUser(): Promise<User> {
    await this.delay(200);
    
    if (!this.currentUserId) {
      throw new Error('Not authenticated');
    }

    const user = this.users.find(u => u.id === this.currentUserId);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * 代理相关
   */
  async getAgents(): Promise<Agent[]> {
    await this.delay(300);
    return [...this.agents];
  }

  async createAgent(agentData: Partial<Agent>): Promise<Agent> {
    await this.delay(500);
    
    const newAgent: Agent = {
      id: String(this.agents.length + 1),
      name: agentData.name || 'New Agent',
      role: agentData.role || 'Assistant',
      systemPrompt: agentData.systemPrompt || 'You are a helpful assistant.',
      modelType: agentData.modelType || 'gpt-4',
      modelConfig: agentData.modelConfig || {
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0
      },
      userId: String(this.currentUserId || 1),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.agents.push(newAgent);
    return newAgent;
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    await this.delay(400);
    
    const agentIndex = this.agents.findIndex(a => a.id === id);
    if (agentIndex === -1) {
      throw new Error('Agent not found');
    }

    this.agents[agentIndex] = {
      ...this.agents[agentIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return this.agents[agentIndex];
  }

  async deleteAgent(id: string): Promise<void> {
    await this.delay(300);
    
    const agentIndex = this.agents.findIndex(a => a.id === id);
    if (agentIndex === -1) {
      throw new Error('Agent not found');
    }

    this.agents.splice(agentIndex, 1);
  }

  /**
   * 头脑风暴会话相关
   */
  async getSessions(): Promise<BrainstormSession[]> {
    await this.delay(400);
    return [...this.sessions];
  }

  async createSession(topic: string, agentIds: string[]): Promise<BrainstormSession> {
    await this.delay(600);
    
    const selectedAgents = this.agents.filter(a => agentIds.includes(a.id));
    
    const newSession: BrainstormSession = {
      id: String(this.sessions.length + 1),
      topic,
      userId: String(this.currentUserId || 1),
      agentIds,
      agents: selectedAgents.map(a => ({
        agentId: a.id,
        agentName: a.name,
        agentRole: a.role
      })),
      currentStage: 1,
      status: 'ACTIVE',
      phases: [
        {
          id: '1',
          phaseType: 'IDEATION',
          phaseName: '创意生成',
          status: 'IN_PROGRESS',
          summary: null,
          completedAt: null
        },
        {
          id: '2',
          phaseType: 'ANALYSIS',
          phaseName: '技术可行性分析',
          status: 'PENDING',
          summary: null,
          completedAt: null
        },
        {
          id: '3',
          phaseType: 'CRITIQUE',
          phaseName: '缺点讨论',
          status: 'PENDING',
          summary: null,
          completedAt: null
        }
      ],
      stageResults: [],
      finalReport: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.sessions.push(newSession);
    return newSession;
  }

  async getSession(id: string): Promise<BrainstormSession> {
    await this.delay(300);
    
    const session = this.sessions.find(s => s.id === id);
    if (!session) {
      throw new Error('Session not found');
    }

    return session;
  }

  async deleteSession(id: string): Promise<void> {
    await this.delay(300);
    
    const sessionIndex = this.sessions.findIndex(s => s.id === id);
    if (sessionIndex === -1) {
      throw new Error('Session not found');
    }

    this.sessions.splice(sessionIndex, 1);
  }

  /**
   * 生成模拟的代理结果
   */
  generateMockAgentResult(agentId: string, content: string): AgentResult {
    const agent = this.agents.find(a => a.id === agentId);
    
    return {
      agentId,
      agentName: agent?.name || 'Unknown Agent',
      agentRole: agent?.role || 'Assistant',
      content,
      reasoning: `基于${agent?.role || '助手'}的专业知识和经验，我认为...`,
      suggestions: [
        '建议1：考虑用户体验的优化',
        '建议2：注重技术实现的可行性',
        '建议3：关注市场需求和竞争分析'
      ],
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0之间
      processingTime: Math.floor(Math.random() * 3000) + 2000, // 2-5秒
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 生成模拟的最终报告
   */
  generateMockFinalReport(sessionId: string, topic: string): FinalReport {
    return {
      sessionId: parseInt(sessionId),
      topic,
      executiveSummary: '执行摘要',
      designConcept: {
        productType: '智能穿戴设备',
        culturalBackground: '现代科技文化',
        designElements: ['简约', '科技感'],
        visualDescription: '简洁的圆形设计',
        targetAudience: '年轻人群'
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
          currency: 'CNY'
        },
        timeline: {
          phases: [
            {
              name: '设计阶段',
              duration: 30,
              dependencies: []
            }
          ],
          totalDuration: 90,
          unit: 'days'
        }
      },
      marketingStrategy: {
        positioningStatement: '面向年轻人的智能手环',
        channels: [
          {
            name: '线上渠道',
            type: 'digital',
            budget: 10000,
            expectedReach: 100000
          }
        ],
        campaigns: [
          {
            name: '新品发布',
            description: '新品发布活动',
            channels: ['线上'],
            budget: 5000,
            duration: 7,
            expectedROI: 200
          }
        ],
        budget: {
          total: 20000,
          breakdown: {
            advertising: 10000,
            content: 5000,
            events: 3000,
            other: 2000
          },
          currency: 'CNY'
        },
        kpis: ['转化率', '品牌知名度']
      },
      implementationPlan: {
        phases: [
          {
            name: '第一阶段',
            description: '产品设计',
            duration: 30,
            tasks: ['需求分析', '概念设计'],
            dependencies: []
          }
        ],
        resources: [
          {
            type: 'human',
            name: '设计师',
            quantity: 2,
            cost: 20000
          }
        ],
        milestones: [
          {
            name: '设计完成',
            description: '完成产品设计',
            dueDate: '2024-03-01',
            deliverables: ['设计稿']
          }
        ],
        totalDuration: 90
      },
      riskAssessment: {
        risks: [
          {
            id: 'R001',
            category: 'technical',
            description: '技术实现风险',
            probability: 'medium',
            impact: 'high',
            severity: 7
          }
        ],
        mitigationStrategies: [
          {
            riskId: 'R001',
            strategy: '技术预研',
            cost: 5000,
            effectiveness: 8
          }
        ],
        overallRiskLevel: 'medium'
      },
      generatedAt: '2024-01-01T00:00:00Z'
    };
  }

  /**
   * 模拟网络延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 重置数据
   */
  reset(): void {
    this.currentUserId = null;
    this.initializeMockData();
  }

  /**
   * 获取当前用户ID
   */
  getCurrentUserId(): number | null {
    return this.currentUserId;
  }
}

// 导出单例实例
export const mockDataService = MockDataService.getInstance();

/**
 * 初始化Mock服务
 */
export async function initializeMockServices(): Promise<void> {
  console.log('🔧 正在初始化Mock服务...');
  
  // 确保Mock数据服务已初始化
  const service = MockDataService.getInstance();
  
  // 可以在这里添加其他Mock服务的初始化
  console.log('✅ Mock数据服务已准备就绪');
  console.log(`📊 Mock数据统计: ${service.getUsers().length} 用户, ${service.getAgents().length} 代理`);
}