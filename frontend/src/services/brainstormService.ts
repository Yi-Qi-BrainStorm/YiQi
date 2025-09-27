import { ApiService } from './api';
import type { 
  BrainstormSession, 
  StageResult, 
  FinalReport,
  PaginatedResponse 
} from '@/types/brainstorm';

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
    status?: string;
    search?: string;
  }): Promise<PaginatedResponse<BrainstormSession>> {
    return ApiService.get<PaginatedResponse<BrainstormSession>>('/brainstorm/sessions', { params });
  }

  /**
   * 获取单个会话详情
   */
  static async getSession(id: string): Promise<BrainstormSession> {
    return ApiService.get<BrainstormSession>(`/brainstorm/sessions/${id}`);
  }

  /**
   * 创建头脑风暴会话
   */
  static async createSession(data: {
    topic: string;
    agentIds: string[];
    description?: string;
  }): Promise<BrainstormSession> {
    return ApiService.post<BrainstormSession>('/brainstorm/sessions', data);
  }

  /**
   * 更新会话信息
   */
  static async updateSession(id: string, data: {
    topic?: string;
    description?: string;
  }): Promise<BrainstormSession> {
    return ApiService.put<BrainstormSession>(`/brainstorm/sessions/${id}`, data);
  }

  /**
   * 删除会话
   */
  static async deleteSession(id: string): Promise<void> {
    return ApiService.delete<void>(`/brainstorm/sessions/${id}`);
  }

  /**
   * 开始头脑风暴会话
   */
  static async startSession(id: string): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>(`/brainstorm/sessions/${id}/start`);
  }

  /**
   * 暂停会话
   */
  static async pauseSession(id: string): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>(`/brainstorm/sessions/${id}/pause`);
  }

  /**
   * 恢复会话
   */
  static async resumeSession(id: string): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>(`/brainstorm/sessions/${id}/resume`);
  }

  /**
   * 停止会话
   */
  static async stopSession(id: string): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>(`/brainstorm/sessions/${id}/stop`);
  }

  /**
   * 进入下一阶段
   */
  static async proceedToNextStage(id: string): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>(`/brainstorm/sessions/${id}/proceed`);
  }

  /**
   * 重新开始当前阶段
   */
  static async restartCurrentStage(id: string): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>(`/brainstorm/sessions/${id}/restart-stage`);
  }

  /**
   * 获取阶段结果
   */
  static async getStageResult(sessionId: string, stage: number): Promise<StageResult> {
    return ApiService.get<StageResult>(`/brainstorm/sessions/${sessionId}/stages/${stage}`);
  }

  /**
   * 获取最终报告
   */
  static async getFinalReport(sessionId: string): Promise<FinalReport> {
    return ApiService.get<FinalReport>(`/brainstorm/sessions/${sessionId}/report`);
  }

  /**
   * 导出最终报告
   */
  static async exportReport(sessionId: string, format: 'pdf' | 'docx' | 'html'): Promise<Blob> {
    return ApiService.get(`/brainstorm/sessions/${sessionId}/export`, {
      params: { format },
      responseType: 'blob',
    });
  }

  /**
   * 获取会话统计信息
   */
  static async getSessionStats(id: string): Promise<{
    totalAgents: number;
    completedStages: number;
    totalProcessingTime: number;
    averageAgentResponseTime: number;
    tokenUsage: {
      total: number;
      byStage: number[];
    };
  }> {
    return ApiService.get(`/brainstorm/sessions/${id}/stats`);
  }

  /**
   * 添加会话备注
   */
  static async addSessionNote(sessionId: string, note: string): Promise<{ message: string }> {
    return ApiService.post<{ message: string }>(`/brainstorm/sessions/${sessionId}/notes`, { note });
  }

  /**
   * 获取会话备注列表
   */
  static async getSessionNotes(sessionId: string): Promise<Array<{
    id: string;
    note: string;
    createdAt: string;
  }>> {
    return ApiService.get(`/brainstorm/sessions/${sessionId}/notes`);
  }

  /**
   * 收藏/取消收藏会话
   */
  static async toggleSessionFavorite(sessionId: string): Promise<{ isFavorite: boolean }> {
    return ApiService.post<{ isFavorite: boolean }>(`/brainstorm/sessions/${sessionId}/favorite`);
  }

  /**
   * 复制会话
   */
  static async duplicateSession(sessionId: string, newTopic?: string): Promise<BrainstormSession> {
    return ApiService.post<BrainstormSession>(`/brainstorm/sessions/${sessionId}/duplicate`, {
      topic: newTopic,
    });
  }
}

export const brainstormService = BrainstormService;