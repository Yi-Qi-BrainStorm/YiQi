/**
 * API服务的Mock实现
 */

// Mock数据
const mockUsers = [
  {
    id: 1,
    username: 'testuser',
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-01T12:00:00Z'
  }
];

const mockAgents = [
  {
    id: 1,
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
    userId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isActive: true
  },
  {
    id: 2,
    name: '工程师',
    role: 'Software Engineer',
    systemPrompt: 'You are an experienced software engineer with expertise in system architecture.',
    modelType: 'gpt-4',
    modelConfig: {
      temperature: 0.5,
      maxTokens: 2000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0
    },
    userId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isActive: true
  }
];

const mockSessions = [
  {
    id: 1,
    topic: '智能手环设计',
    userId: 1,
    agentIds: [1, 2],
    currentStage: 1,
    status: 'COMPLETED',
    agents: [
      { agentId: 1, agent: mockAgents[0] },
      { agentId: 2, agent: mockAgents[1] }
    ],
    phases: [
      {
        phaseType: 1,
        status: 'COMPLETED',
        summary: JSON.stringify({
          keyPoints: ['关键点1', '关键点2'],
          commonSuggestions: ['建议1', '建议2'],
          conflictingViews: [],
          overallAssessment: '整体评估',
          nextStepRecommendations: ['下一步建议']
        }),
        responses: []
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
          nextStepRecommendations: ['下一步建议']
        },
        completedAt: '2024-01-01T00:00:00Z'
      }
    ],
    finalReport: {
      sessionId: 1,
      topic: '智能手环设计',
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
          phases: [{ name: '设计阶段', duration: 30, dependencies: [] }],
          totalDuration: 90,
          unit: 'days'
        }
      },
      marketingStrategy: {
        positioningStatement: '面向年轻人的智能手环',
        channels: [{ name: '线上渠道', type: 'digital', budget: 10000, expectedReach: 100000 }],
        campaigns: [{
          name: '新品发布',
          description: '新品发布活动',
          channels: ['线上'],
          budget: 5000,
          duration: 7,
          expectedROI: 200
        }],
        budget: {
          total: 20000,
          breakdown: { advertising: 10000, content: 5000, events: 3000, other: 2000 },
          currency: 'CNY'
        },
        kpis: ['转化率', '品牌知名度']
      },
      implementationPlan: {
        phases: [{
          name: '第一阶段',
          description: '产品设计',
          duration: 30,
          tasks: ['需求分析', '概念设计'],
          dependencies: []
        }],
        resources: [{ type: 'human', name: '设计师', quantity: 2, cost: 20000 }],
        milestones: [{
          name: '设计完成',
          description: '完成产品设计',
          dueDate: '2024-03-01',
          deliverables: ['设计稿']
        }],
        totalDuration: 90
      },
      riskAssessment: {
        risks: [{
          id: 'R001',
          category: 'technical',
          description: '技术实现风险',
          probability: 'medium',
          impact: 'high',
          severity: 7
        }],
        mitigationStrategies: [{
          riskId: 'R001',
          strategy: '技术预研',
          cost: 5000,
          effectiveness: 8
        }],
        overallRiskLevel: 'medium'
      },
      generatedAt: '2024-01-01T00:00:00Z'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

let currentUserId = 1;
let currentAgentId = 3;
let currentSessionId = 2;

export class ApiService {
  /**
   * GET请求
   */
  static async get<T = any>(url: string, config?: any): Promise<T> {
    console.log(`Mock API GET: ${url}`);
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100));

    // 健康检查
    if (url === '/actuator/health') {
      return { status: 'UP' } as T;
    }

    // 服务器信息
    if (url === '/actuator/info') {
      return {
        build: { version: '1.0.0' },
        environment: 'development',
        timestamp: new Date().toISOString()
      } as T;
    }

    // 用户信息
    if (url === '/users/me') {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw { code: 'UNAUTHORIZED', message: 'No token provided' };
      }
      return mockUsers[0] as T;
    }

    // 代理列表
    if (url === '/agents') {
      return mockAgents as T;
    }

    // 会话列表
    if (url === '/sessions' || url.startsWith('/sessions?')) {
      return {
        data: mockSessions,
        total: mockSessions.length,
        page: 1,
        limit: 10,
        totalPages: 1
      } as T;
    }

    // 单个会话
    if (url.match(/^\/sessions\/\d+$/)) {
      const sessionId = parseInt(url.split('/')[2]);
      const session = mockSessions.find(s => s.id === sessionId);
      if (!session) {
        throw { code: 'NOT_FOUND', message: 'Session not found' };
      }
      return session as T;
    }

    throw { code: 'NOT_FOUND', message: `Mock endpoint not found: ${url}` };
  }

  /**
   * POST请求
   */
  static async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    console.log(`Mock API POST: ${url}`, data);
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200));

    // 用户注册
    if (url === '/users/register') {
      const existingUser = mockUsers.find(u => u.username === data.username);
      if (existingUser) {
        throw { code: 'CONFLICT', message: '用户名已存在' };
      }

      const newUser = {
        id: ++currentUserId,
        username: data.username,
        createdAt: new Date().toISOString(),
        lastLoginAt: null
      };
      mockUsers.push(newUser);
      return newUser as T;
    }

    // 用户登录
    if (url === '/users/login') {
      // 测试连接的无效凭据
      if (data.username === 'test_connection' && data.password === 'invalid_password') {
        throw { code: 'UNAUTHORIZED', message: 'Invalid credentials' };
      }

      const user = mockUsers.find(u => u.username === data.username);
      if (!user || data.password !== 'test123456') {
        throw { code: 'UNAUTHORIZED', message: 'Invalid credentials' };
      }

      const token = `mock_token_${Date.now()}`;
      return {
        accessToken: token,
        tokenType: 'Bearer',
        user: {
          ...user,
          lastLoginAt: new Date().toISOString()
        }
      } as T;
    }

    // 创建代理
    if (url === '/agents') {
      const newAgent = {
        id: ++currentAgentId,
        ...data,
        userId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };
      mockAgents.push(newAgent);
      return newAgent as T;
    }

    // 创建会话
    if (url === '/sessions') {
      const newSession = {
        id: ++currentSessionId,
        ...data,
        userId: 1,
        currentStage: 1,
        status: 'ACTIVE',
        agents: data.agentIds?.map((id: number) => ({
          agentId: id,
          agent: mockAgents.find(a => a.id === id)
        })) || [],
        phases: [],
        stageResults: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockSessions.push(newSession);
      return newSession as T;
    }

    throw { code: 'NOT_FOUND', message: `Mock endpoint not found: ${url}` };
  }

  /**
   * PUT请求
   */
  static async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    console.log(`Mock API PUT: ${url}`, data);
    await new Promise(resolve => setTimeout(resolve, 150));

    // 更新代理
    if (url.match(/^\/agents\/\d+$/)) {
      const agentId = parseInt(url.split('/')[2]);
      const agentIndex = mockAgents.findIndex(a => a.id === agentId);
      if (agentIndex === -1) {
        throw { code: 'NOT_FOUND', message: 'Agent not found' };
      }

      mockAgents[agentIndex] = {
        ...mockAgents[agentIndex],
        ...data,
        updatedAt: new Date().toISOString()
      };
      return mockAgents[agentIndex] as T;
    }

    throw { code: 'NOT_FOUND', message: `Mock endpoint not found: ${url}` };
  }

  /**
   * DELETE请求
   */
  static async delete<T = any>(url: string, config?: any): Promise<T> {
    console.log(`Mock API DELETE: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 100));

    // 删除代理
    if (url.match(/^\/agents\/\d+$/)) {
      const agentId = parseInt(url.split('/')[2]);
      const agentIndex = mockAgents.findIndex(a => a.id === agentId);
      if (agentIndex === -1) {
        throw { code: 'NOT_FOUND', message: 'Agent not found' };
      }

      mockAgents.splice(agentIndex, 1);
      return {} as T;
    }

    // 删除会话
    if (url.match(/^\/sessions\/\d+$/)) {
      const sessionId = parseInt(url.split('/')[2]);
      const sessionIndex = mockSessions.findIndex(s => s.id === sessionId);
      if (sessionIndex === -1) {
        throw { code: 'NOT_FOUND', message: 'Session not found' };
      }

      mockSessions.splice(sessionIndex, 1);
      return {} as T;
    }

    throw { code: 'NOT_FOUND', message: `Mock endpoint not found: ${url}` };
  }

  /**
   * PATCH请求
   */
  static async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.put<T>(url, data, config);
  }

  /**
   * 上传文件
   */
  static async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    console.log(`Mock API UPLOAD: ${url}`, file.name);
    
    // 模拟上传进度
    if (onProgress) {
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 50));
        onProgress(i);
      }
    }

    return {
      id: Date.now(),
      filename: file.name,
      size: file.size,
      url: `mock://uploads/${file.name}`
    } as T;
  }

  /**
   * 下载文件
   */
  static async download(url: string, filename?: string): Promise<void> {
    console.log(`Mock API DOWNLOAD: ${url}`);
    // 模拟下载
    const blob = new Blob(['Mock file content'], { type: 'text/plain' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'mock-download.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * 批量请求
   */
  static async batch<T = any>(requests: Array<() => Promise<any>>): Promise<T[]> {
    const results = await Promise.allSettled(requests.map(req => req()));
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`批量请求第${index + 1}个失败:`, result.reason);
        throw result.reason;
      }
    });
  }

  /**
   * 重试请求
   */
  static async retry<T = any>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // 如果是最后一次重试，抛出错误
        if (i === maxRetries) {
          throw lastError;
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }

    throw lastError!;
  }
}

export default {
  get: ApiService.get,
  post: ApiService.post,
  put: ApiService.put,
  patch: ApiService.patch,
  delete: ApiService.delete
};