import { ApiService } from './api';
import { isMockEnabled } from '@/utils/mockEnabler';
import type { 
  BrainstormSession, 
  Report,
  SessionStatus,
  PhaseType,
  CreateSessionRequest
} from '@/types/brainstorm';

/**
 * 头脑风暴会话相关API服务
 * 基于后端 /api/sessions 路径的API接口
 */
export class BrainstormService {
  /**
   * 获取头脑风暴会话列表
   */
  static async getBrainstormSessions(): Promise<BrainstormSession[]> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { BrainstormService: MockBrainstormService } = await import('./__mocks__/brainstormService');
      // 转换Mock服务的分页响应为简单数组
      const mockResponse = await MockBrainstormService.getBrainstormSessions();
      return mockResponse.items || mockResponse.content || [];
    }
    
    return ApiService.get<BrainstormSession[]>('/api/sessions');
  }

  /**
   * 获取单个会话详情
   */
  static async getBrainstormSession(id: number): Promise<BrainstormSession> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { BrainstormService: MockBrainstormService } = await import('./__mocks__/brainstormService');
      return await MockBrainstormService.getBrainstormSession(id);
    }
    
    // 通过获取会话状态来获取会话详情
    const status = await ApiService.get(`/api/sessions/${id}/status`);
    // 这里需要根据实际需要转换数据格式，暂时返回基本结构
    return {
      id,
      userId: 0, // 需要从其他地方获取
      title: '', // 需要从其他地方获取
      description: '',
      topic: '',
      status: status.sessionStatus as SessionStatus,
      currentPhase: status.currentPhase as PhaseType,
      agents: [],
      phases: [],
      createdAt: new Date().toISOString(),
      updatedAt: status.lastUpdated || new Date().toISOString(),
    };
  }

  /**
   * 创建头脑风暴会话
   */
  static async createBrainstormSession(data: CreateSessionRequest): Promise<BrainstormSession> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { BrainstormService: MockBrainstormService } = await import('./__mocks__/brainstormService');
      return await MockBrainstormService.createBrainstormSession(data);
    }
    
    return ApiService.post<BrainstormSession>('/api/sessions', data);
  }

  /**
   * 开始头脑风暴会话
   */
  static async startSession(id: number, topic: string): Promise<void> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { BrainstormService: MockBrainstormService } = await import('./__mocks__/brainstormService');
      return await MockBrainstormService.startSession(id, topic);
    }
    
    return ApiService.post<void>(`/api/sessions/${id}/start`, { topic });
  }

  /**
   * 暂停会话
   */
  static async pauseSession(id: number): Promise<void> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { BrainstormService: MockBrainstormService } = await import('./__mocks__/brainstormService');
      return await MockBrainstormService.pauseSession(id);
    }
    
    return ApiService.post<void>(`/api/sessions/${id}/pause`);
  }

  /**
   * 恢复会话
   */
  static async resumeSession(id: number): Promise<void> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { BrainstormService: MockBrainstormService } = await import('./__mocks__/brainstormService');
      return await MockBrainstormService.resumeSession(id);
    }
    
    return ApiService.post<void>(`/api/sessions/${id}/resume`);
  }

  /**
   * 取消会话
   */
  static async cancelSession(id: number): Promise<void> {
    // 如果启用了Mock模式，使用Mock服务
    if (isMockEnabled()) {
      const { BrainstormService: MockBrainstormService } = await import('./__mocks__/brainstormService');
      return await MockBrainstormService.cancelSession(id);
    }
    
    return ApiService.post<void>(`/api/sessions/${id}/cancel`);
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
  static async getPhase(sessionId: number, phaseType: PhaseType): Promise<SessionPhase> {
    return await sessionService.getPhase(sessionId, phaseType);
  }

  /**
   * 获取会话的所有阶段
   */
  static async getSessionPhases(sessionId: number): Promise<SessionPhase[]> {
    return await sessionService.getPhases(sessionId);
  }

  /**
   * 获取会话状态
   */
  static async getSessionStatus(sessionId: number) {
    return await sessionService.getSessionStatus(sessionId);
  }

  /**
   * 审核通过阶段
   */
  static async approvePhase(sessionId: number, phaseType: PhaseType): Promise<void> {
    return await sessionService.approvePhase(sessionId, phaseType);
  }

  /**
   * 审核拒绝阶段
   */
  static async rejectPhase(sessionId: number, phaseType: PhaseType): Promise<void> {
    return await sessionService.rejectPhase(sessionId, phaseType);
  }

  /**
   * 重新执行阶段
   */
  static async retryPhase(sessionId: number, phaseType: PhaseType): Promise<void> {
    return await sessionService.retryPhase(sessionId, phaseType);
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
  static async getUserSessions(): Promise<BrainstormSession[]> {
    return await this.getSessions();
  }

  /**
   * 获取活跃会话
   */
  static async getActiveSessions(): Promise<BrainstormSession[]> {
    return await sessionService.getActiveSessions();
  }

  /**
   * 测试AI服务
   */
  static async testAIService(): Promise<string> {
    return await aiInferenceService.testAIService();
  }

  /**
   * 获取推理状态
   */
  static async getInferenceStatus(sessionId: string, phaseType: string) {
    return await aiInferenceService.getInferenceStatus(sessionId, phaseType);
  }
}

export const brainstormService = BrainstormService;