import { ApiService } from './api';
import { isMockEnabled } from '@/utils/mockEnabler';
import type { 
  BrainstormSession, 
  Phase, 
  Report,
  FinalReport,
  SessionStatus,
  PhaseType
} from '@/types/brainstorm';
import type { PaginatedResponse } from '@/types/api';

/**
 * 头脑风暴相关API服务
 */
export class BrainstormService {
  /**
   * 获取头脑风暴会话列表
   */
  static async getSessions(params?: {
    page?: number;
    limit?: number;
    status?: SessionStatus;
    currentPhase?: PhaseType;
    search?: string;
  }): Promise<PaginatedResponse<BrainstormSession>> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { brainstormService: mockService } = await import('./__mocks__/brainstormService');
      return await mockService.getSessions(params);
    }
    
    return ApiService.get<PaginatedResponse<BrainstormSession>>('/sessions', { params });
  }

  /**
   * 获取单个会话详情
   */
  static async getSession(id: number): Promise<BrainstormSession> {
    return ApiService.get<BrainstormSession>(`/sessions/${id}`);
  }

  /**
   * 创建头脑风暴会话
   */
  static async createSession(data: {
    title: string;
    description?: string;
    topic: string;
    agentIds: number[];
  }): Promise<BrainstormSession> {
    return ApiService.post<BrainstormSession>('/sessions', data);
  }

  /**
   * 更新会话信息
   */
  static async updateSession(id: number, data: {
    title?: string;
    description?: string;
    topic?: string;
  }): Promise<BrainstormSession> {
    return ApiService.put<BrainstormSession>(`/sessions/${id}`, data);
  }

  /**
   * 删除会话
   */
  static async deleteSession(id: number): Promise<void> {
    return ApiService.delete<void>(`/sessions/${id}`);
  }

  /**
   * 开始头脑风暴会话
   */
  static async startSession(id: number): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>(`/sessions/${id}/start`);
  }

  /**
   * 暂停会话
   */
  static async pauseSession(id: number): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>(`/sessions/${id}/pause`);
  }

  /**
   * 恢复会话
   */
  static async resumeSession(id: number): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>(`/sessions/${id}/resume`);
  }

  /**
   * 停止会话
   */
  static async stopSession(id: number): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>(`/sessions/${id}/stop`);
  }

  /**
   * 进入下一阶段
   */
  static async proceedToNextPhase(id: number, phaseType: PhaseType): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>(`/sessions/${id}/proceed`, { phaseType });
  }

  /**
   * 重新开始当前阶段
   */
  static async restartCurrentPhase(id: number): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>(`/sessions/${id}/restart-phase`);
  }

  /**
   * 获取阶段详情
   */
  static async getPhase(sessionId: number, phaseId: number): Promise<Phase> {
    return ApiService.get<Phase>(`/sessions/${sessionId}/phases/${phaseId}`);
  }

  /**
   * 获取会话的所有阶段
   */
  static async getSessionPhases(sessionId: number): Promise<Phase[]> {
    return ApiService.get<Phase[]>(`/sessions/${sessionId}/phases`);
  }

  /**
   * 获取最终报告
   */
  static async getFinalReport(sessionId: number): Promise<Report> {
    return ApiService.get<Report>(`/sessions/${sessionId}/report`);
  }

  /**
   * 导出最终报告
   */
  static async exportReport(sessionId: number, format: 'pdf' | 'docx' | 'html'): Promise<Blob> {
    return ApiService.get(`/sessions/${sessionId}/export`, {
      params: { format },
      responseType: 'blob',
    });
  }

  /**
   * 获取会话统计信息
   */
  static async getSessionStats(id: number): Promise<{
    totalAgents: number;
    completedPhases: number;
    totalProcessingTime: number;
    averageAgentResponseTime: number;
  }> {
    return ApiService.get(`/sessions/${id}/stats`);
  }

  /**
   * 复制会话
   */
  static async duplicateSession(sessionId: number, newTitle?: string): Promise<BrainstormSession> {
    return ApiService.post<BrainstormSession>(`/sessions/${sessionId}/duplicate`, {
      title: newTitle,
    });
  }

  /**
   * 生成报告
   */
  static async generateReport(sessionId: number): Promise<Report> {
    return ApiService.post<Report>(`/sessions/${sessionId}/generate-report`);
  }

  /**
   * 获取用户的会话列表 (兼容性方法)
   */
  static async getUserSessions(userId: string, params?: {
    page?: number;
    limit?: number;
    status?: SessionStatus;
  }): Promise<BrainstormSession[]> {
    const response = await this.getSessions(params);
    return response.data || [];
  }
}

export const brainstormService = BrainstormService;