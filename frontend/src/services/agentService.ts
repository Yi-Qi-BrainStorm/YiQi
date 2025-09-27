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
 */
export class AgentService {
  /**
   * 获取代理列表
   */
  static async getAgents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    roleType?: string;
    status?: AgentStatus;
  }): Promise<PaginatedResponse<Agent>> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { AgentService: MockAgentService } = await import('./__mocks__/agentService');
      return await MockAgentService.getAgents(params);
    }
    
    return ApiService.get<PaginatedResponse<Agent>>('/agents', { params });
  }

  /**
   * 获取单个代理详情
   */
  static async getAgent(id: number): Promise<Agent> {
    return ApiService.get<Agent>(`/agents/${id}`);
  }

  /**
   * 创建代理
   */
  static async createAgent(agentData: AgentFormData): Promise<Agent> {
    return ApiService.post<Agent>('/agents', agentData);
  }

  /**
   * 更新代理
   */
  static async updateAgent(id: number, agentData: Partial<AgentFormData>): Promise<Agent> {
    return ApiService.put<Agent>(`/agents/${id}`, agentData);
  }

  /**
   * 删除代理（软删除，设置状态为DELETED）
   */
  static async deleteAgent(id: number): Promise<void> {
    return ApiService.patch<void>(`/agents/${id}`, { status: 'DELETED' });
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
    
    return ApiService.get<AIModel[]>('/agents/models');
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