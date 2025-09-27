import { ApiService } from './api';
import type { 
  Agent, 
  AgentFormData, 
  AIModel,
  PaginatedResponse 
} from '@/types/agent';

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
    role?: string;
  }): Promise<PaginatedResponse<Agent>> {
    return ApiService.get<PaginatedResponse<Agent>>('/agents', { params });
  }

  /**
   * 获取单个代理详情
   */
  static async getAgent(id: string): Promise<Agent> {
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
  static async updateAgent(id: string, agentData: Partial<AgentFormData>): Promise<Agent> {
    return ApiService.put<Agent>(`/agents/${id}`, agentData);
  }

  /**
   * 删除代理
   */
  static async deleteAgent(id: string): Promise<void> {
    return ApiService.delete<void>(`/agents/${id}`);
  }

  /**
   * 批量删除代理
   */
  static async deleteAgents(ids: string[]): Promise<void> {
    return ApiService.post<void>('/agents/batch-delete', { ids });
  }

  /**
   * 复制代理
   */
  static async duplicateAgent(id: string, name?: string): Promise<Agent> {
    return ApiService.post<Agent>(`/agents/${id}/duplicate`, { name });
  }

  /**
   * 测试代理配置
   */
  static async testAgent(id: string, testPrompt: string): Promise<{
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
    return ApiService.get<AIModel[]>('/agents/models');
  }

  /**
   * 导出代理配置
   */
  static async exportAgent(id: string): Promise<Blob> {
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
  static async getAgentStats(id: string, period?: '7d' | '30d' | '90d'): Promise<{
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
   * 更新代理状态（启用/禁用）
   */
  static async updateAgentStatus(id: string, enabled: boolean): Promise<Agent> {
    return ApiService.patch<Agent>(`/agents/${id}/status`, { enabled });
  }
}

export const agentService = AgentService;