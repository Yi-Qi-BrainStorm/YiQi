import type { Agent, AgentFormData, AgentStatus } from '@/types/agent';
import type { PaginatedResponse } from '@/types/api';

/**
 * 代理服务的Mock实现
 */
export class AgentService {
  private static mockAgents: Agent[] = [
    {
      id: 1,
      name: '创意设计师',
      roleType: 'UI/UX Designer',
      systemPrompt: '你是一位富有创意的UI/UX设计师，擅长用户界面和用户体验设计。你能够提供创新的设计理念、用户友好的界面方案，并关注设计的美观性和实用性。',
      aiModel: 'gpt-4',
      userId: 1,
      status: 'ACTIVE',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: '技术架构师',
      roleType: 'Software Engineer',
      systemPrompt: '你是一位经验丰富的软件工程师和技术架构师，擅长系统架构设计、技术选型和工程实践。你能够提供技术可行性分析、架构建议和最佳实践指导。',
      aiModel: 'gpt-4',
      userId: 1,
      status: 'ACTIVE',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 3,
      name: '产品经理',
      roleType: 'Product Manager',
      systemPrompt: '你是一位资深的产品经理，擅长市场分析、用户需求挖掘和产品规划。你能够从商业角度分析问题，提供产品策略建议和用户价值分析。',
      aiModel: 'gpt-3.5-turbo',
      userId: 1,
      status: 'ACTIVE',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 4,
      name: '市场分析师',
      roleType: 'Market Analyst',
      systemPrompt: '你是一位专业的市场分析师，擅长市场调研、竞品分析和商业模式设计。你能够提供市场洞察、竞争分析和商业化建议。',
      aiModel: 'qwen-plus',
      userId: 1,
      status: 'ACTIVE',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 5,
      name: '用户研究员',
      roleType: 'User Researcher',
      systemPrompt: '你是一位专业的用户研究员，擅长用户行为分析、用户体验研究和用户画像构建。你能够从用户角度分析问题，提供用户洞察和体验优化建议。',
      aiModel: 'claude-3',
      userId: 1,
      status: 'INACTIVE',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ];

  static async getAgents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    roleType?: string;
    status?: AgentStatus;
  }): Promise<PaginatedResponse<Agent>> {
    console.log('Mock AgentService.getAgents', params);
    await new Promise(resolve => setTimeout(resolve, 150));
    
    let filteredAgents = [...this.mockAgents];
    
    // 应用过滤器
    if (params?.search) {
      const search = params.search.toLowerCase();
      filteredAgents = filteredAgents.filter(agent => 
        agent.name.toLowerCase().includes(search) ||
        agent.roleType.toLowerCase().includes(search)
      );
    }
    
    if (params?.roleType) {
      filteredAgents = filteredAgents.filter(agent => 
        agent.roleType === params.roleType
      );
    }
    
    if (params?.status) {
      filteredAgents = filteredAgents.filter(agent => 
        agent.status === params.status
      );
    }
    
    // 分页
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAgents = filteredAgents.slice(startIndex, endIndex);
    
    const totalPages = Math.ceil(filteredAgents.length / limit);
    
    return {
      items: paginatedAgents,
      pagination: {
        page,
        limit,
        total: filteredAgents.length,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  static async getAgent(id: number): Promise<Agent> {
    console.log('Mock AgentService.getAgent:', id);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const agent = this.mockAgents.find(a => a.id === id);
    if (!agent) {
      throw { code: 'NOT_FOUND', message: 'Agent not found' };
    }
    return { ...agent };
  }

  static async createAgent(agentData: AgentFormData): Promise<Agent> {
    console.log('Mock AgentService.createAgent:', agentData);
    await new Promise(resolve => setTimeout(resolve, 300));

    const newAgent: Agent = {
      id: Math.max(...this.mockAgents.map(a => a.id)) + 1,
      ...agentData,
      userId: 1,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.mockAgents.push(newAgent);
    return newAgent;
  }

  static async updateAgent(id: number, agentData: Partial<AgentFormData>): Promise<Agent> {
    console.log('Mock AgentService.updateAgent:', id, agentData);
    await new Promise(resolve => setTimeout(resolve, 250));

    const agentIndex = this.mockAgents.findIndex(a => a.id === id);
    if (agentIndex === -1) {
      throw { code: 'NOT_FOUND', message: 'Agent not found' };
    }

    this.mockAgents[agentIndex] = {
      ...this.mockAgents[agentIndex],
      ...agentData,
      updatedAt: new Date().toISOString()
    };

    return { ...this.mockAgents[agentIndex] };
  }

  static async deleteAgent(id: number): Promise<void> {
    console.log('Mock AgentService.deleteAgent:', id);
    await new Promise(resolve => setTimeout(resolve, 200));

    const agentIndex = this.mockAgents.findIndex(a => a.id === id);
    if (agentIndex === -1) {
      throw { code: 'NOT_FOUND', message: 'Agent not found' };
    }

    this.mockAgents.splice(agentIndex, 1);
  }

  static async duplicateAgent(id: number): Promise<Agent> {
    console.log('Mock AgentService.duplicateAgent:', id);
    await new Promise(resolve => setTimeout(resolve, 250));

    const originalAgent = this.mockAgents.find(a => a.id === id);
    if (!originalAgent) {
      throw { code: 'NOT_FOUND', message: 'Agent not found' };
    }

    const duplicatedAgent: Agent = {
      ...originalAgent,
      id: Math.max(...this.mockAgents.map(a => a.id)) + 1,
      name: `${originalAgent.name} (副本)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.mockAgents.push(duplicatedAgent);
    return duplicatedAgent;
  }

  static async testAgent(id: number, testPrompt: string): Promise<{ response: string; processingTime: number }> {
    console.log('Mock AgentService.testAgent:', id, testPrompt);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const agent = this.mockAgents.find(a => a.id === id);
    if (!agent) {
      throw { code: 'NOT_FOUND', message: 'Agent not found' };
    }

    return {
      response: `这是来自${agent.name}的测试响应：${testPrompt}`,
      processingTime: 1000
    };
  }

  static async toggleAgentStatus(id: number): Promise<Agent> {
    console.log('Mock AgentService.toggleAgentStatus:', id);
    await new Promise(resolve => setTimeout(resolve, 150));

    const agentIndex = this.mockAgents.findIndex(a => a.id === id);
    if (agentIndex === -1) {
      throw { code: 'NOT_FOUND', message: 'Agent not found' };
    }

    this.mockAgents[agentIndex].status = this.mockAgents[agentIndex].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.mockAgents[agentIndex].updatedAt = new Date().toISOString();

    return { ...this.mockAgents[agentIndex] };
  }

  static async getAvailableModels(): Promise<import('@/types/agent').AIModel[]> {
    console.log('Mock AgentService.getAvailableModels');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'OpenAI',
        description: 'OpenAI的最新大型语言模型，具有强大的推理和创作能力',
        maxTokens: 8192,
        costPerToken: 0.03
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'OpenAI',
        description: '快速且经济的GPT模型，适合大多数对话和文本生成任务',
        maxTokens: 4096,
        costPerToken: 0.001
      },
      {
        id: 'claude-3',
        name: 'Claude 3',
        provider: 'Anthropic',
        description: 'Anthropic的Claude 3模型，擅长分析和推理任务',
        maxTokens: 100000,
        costPerToken: 0.015
      },
      {
        id: 'qwen-plus',
        name: 'Qwen Plus',
        provider: 'Alibaba',
        description: '阿里云通义千问Plus模型，支持中文优化',
        maxTokens: 8192,
        costPerToken: 0.008
      }
    ];
  }
}

export const agentService = AgentService;