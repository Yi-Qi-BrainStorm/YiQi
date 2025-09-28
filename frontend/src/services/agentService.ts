import { ApiService } from './api';
import { isMockEnabled } from '@/utils/mockEnabler';
import type { 
  Agent, 
  AgentFormData, 
  AIModel,
  AgentVersion,
  AgentStatus
} from '@/types/agent';
import type { PaginatedResponse } from '@/types/api';

/**
 * 代理相关API服务
 * 基于后端 /api/agents 路径的API接口
 */
export class AgentService {
  /**
   * 获取代理列表
   */
  static async getAgents(params?: {
    status?: string;
  }): Promise<Agent[]> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { AgentService: MockAgentService } = await import('./__mocks__/agentService');
      // 转换Mock服务的分页响应为简单数组
      const mockResponse = await MockAgentService.getAgents(params);
      return mockResponse.items || mockResponse.content || [];
    }
    
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    
    const url = `/api/agents${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return ApiService.get<Agent[]>(url);
  }

  /**
   * 获取单个代理详情
   */
  static async getAgent(id: number): Promise<Agent> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { AgentService: MockAgentService } = await import('./__mocks__/agentService');
      return await MockAgentService.getAgent(id);
    }
    
    return ApiService.get<Agent>(`/api/agents/${id}`);
  }

  /**
   * 创建代理
   */
  static async createAgent(agentData: AgentFormData): Promise<Agent> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { AgentService: MockAgentService } = await import('./__mocks__/agentService');
      return await MockAgentService.createAgent(agentData);
    }
    
    // 转换为后端期望的格式
    const createRequest = {
      name: agentData.name,
      roleType: agentData.roleType,
      systemPrompt: agentData.systemPrompt,
      aiModel: agentData.model
    };
    
    return ApiService.post<Agent>('/api/agents', createRequest);
  }

  /**
   * 更新代理
   */
  static async updateAgent(id: number, agentData: Partial<AgentFormData>): Promise<Agent> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { AgentService: MockAgentService } = await import('./__mocks__/agentService');
      return await MockAgentService.updateAgent(id, agentData);
    }
    
    // 转换为后端期望的格式
    const updateRequest: any = {};
    if (agentData.name) updateRequest.name = agentData.name;
    if (agentData.roleType) updateRequest.roleType = agentData.roleType;
    if (agentData.systemPrompt) updateRequest.systemPrompt = agentData.systemPrompt;
    if (agentData.model) updateRequest.aiModel = agentData.model;
    if (agentData.status) updateRequest.status = agentData.status;
    
    return ApiService.put<Agent>(`/api/agents/${id}`, updateRequest);
  }

  /**
   * 删除代理（软删除）
   */
  static async deleteAgent(id: number): Promise<void> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { AgentService: MockAgentService } = await import('./__mocks__/agentService');
      return await MockAgentService.deleteAgent(id);
    }
    
    return ApiService.delete<void>(`/api/agents/${id}`);
  }

  /**
   * 批量删除代理
   */
  static async deleteAgents(ids: number[]): Promise<void> {
    return ApiService.post<void>('/agents/batch-delete', { ids });
  }

  /**
   * 复制代理
   */
  static async duplicateAgent(id: number, name?: string): Promise<Agent> {
    return ApiService.post<Agent>(`/agents/${id}/duplicate`, { name });
  }

  /**
   * 测试代理配置
   */
  static async testAgent(id: number, testPrompt: string): Promise<{
    success: boolean;
    response?: string;
    error?: string;
    processingTime: number;
  }> {
    return ApiService.post(`/agents/${id}/test`, { prompt: testPrompt });
  }

  /**
   * 获取可用的AI模型列表
   */
  static async getAvailableModels(): Promise<AIModel[]> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { AgentService: MockAgentService } = await import('./__mocks__/agentService');
      return await MockAgentService.getAvailableModels();
    }
    
    return ApiService.get<string[]>('/api/agents/ai-models').then(models => 
      models.map(modelId => ({
        id: modelId,
        name: modelId,
        description: `${modelId} AI模型`,
        maxTokens: 8192,
        costPerToken: 0.01,
        provider: modelId.includes('qwen') ? 'Alibaba' : 
                  modelId.includes('gpt') ? 'OpenAI' : 
                  modelId.includes('claude') ? 'Anthropic' : 'Unknown'
      }))
    );
  }

  /**
   * 激活代理
   */
  static async activateAgent(id: number): Promise<Agent> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { AgentService: MockAgentService } = await import('./__mocks__/agentService');
      return await MockAgentService.activateAgent(id);
    }
    
    return ApiService.post<Agent>(`/api/agents/${id}/activate`);
  }

  /**
   * 停用代理
   */
  static async deactivateAgent(id: number): Promise<Agent> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { AgentService: MockAgentService } = await import('./__mocks__/agentService');
      return await MockAgentService.deactivateAgent(id);
    }
    
    return ApiService.post<Agent>(`/api/agents/${id}/deactivate`);
  }

  /**
   * 根据角色类型获取代理
   */
  static async getAgentsByRole(roleType: string): Promise<Agent[]> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { AgentService: MockAgentService } = await import('./__mocks__/agentService');
      return await MockAgentService.getAgentsByRole(roleType);
    }
    
    return ApiService.get<Agent[]>(`/api/agents/by-role/${roleType}`);
  }

  /**
   * 获取角色类型列表
   */
  static async getRoleTypes(): Promise<{roleTypes: any[], predefinedRoles: any[]}> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { AgentService: MockAgentService } = await import('./__mocks__/agentService');
      return await MockAgentService.getRoleTypes();
    }
    
    return ApiService.get<{roleTypes: any[], predefinedRoles: any[]}>('/api/agents/role-types');
  }

  /**
   * 获取代理状态列表
   */
  static async getStatuses(): Promise<{name: string, description: string}[]> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { AgentService: MockAgentService } = await import('./__mocks__/agentService');
      return await MockAgentService.getStatuses();
    }
    
    return ApiService.get<{name: string, description: string}[]>('/api/agents/statuses');
  }

  /**
   * 检查代理名称可用性
   */
  static async checkNameAvailability(name: string, excludeId?: number): Promise<{available: boolean}> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { AgentService: MockAgentService } = await import('./__mocks__/agentService');
      return await MockAgentService.checkNameAvailability(name, excludeId);
    }
    
    const params: any = { name };
    if (excludeId) {
      params.excludeId = excludeId;
    }
    return ApiService.get<{available: boolean}>('/api/agents/check-name', { params });
  }

  /**
   * 导出代理配置
   */
  static async exportAgent(id: number): Promise<Blob> {
    return ApiService.get(`/agents/${id}/export`, {
      responseType: 'blob',
    });
  }

  /**
   * 导入代理配置
   */
  static async importAgent(file: File): Promise<Agent> {
    return ApiService.upload<Agent>('/agents/import', file);
  }

  /**
   * 获取代理使用统计
   */
  static async getAgentStats(id: number, period?: '7d' | '30d' | '90d'): Promise<{
    totalSessions: number;
    totalTokens: number;
    averageResponseTime: number;
    successRate: number;
    usageHistory: Array<{
      date: string;
      sessions: number;
      tokens: number;
    }>;
  }> {
    return ApiService.get(`/agents/${id}/stats`, {
      params: { period },
    });
  }

  /**
   * 更新代理状态
   */
  static async updateAgentStatus(id: number, status: AgentStatus): Promise<Agent> {
    return ApiService.patch<Agent>(`/agents/${id}/status`, { status });
  }

  /**
   * 获取代理历史版本
   */
  static async getAgentVersions(id: number): Promise<AgentVersion[]> {
    return ApiService.get<AgentVersion[]>(`/agents/${id}/versions`);
  }

  /**
   * 恢复到指定版本
   */
  static async restoreAgentVersion(id: number, versionId: number): Promise<Agent> {
    return ApiService.post<Agent>(`/agents/${id}/versions/${versionId}/restore`);
  }
}

export const agentService = AgentService;