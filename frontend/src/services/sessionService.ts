import { ApiService } from './api';
import { handleError, type ErrorContext } from './errorHandler';
import { isMockEnabled } from '@/utils/mockEnabler';
import type { 
  BrainstormSession, 
  CreateSessionRequest,
  StartSessionRequest,
  SessionStatus,
  PhaseType,
  SessionPhase,
  SubmitPhaseRequest
} from '@/types/brainstorm';

/**
 * 头脑风暴会话管理API服务
 * 基于后端 /sessions 路径的API接口
 */
export class SessionService {
  /**
   * 创建头脑风暴会话
   */
  static async createSession(sessionData: CreateSessionRequest): Promise<BrainstormSession> {
    try {
      // 如果启用了Mock模式，使用Mock服务
      if (isMockEnabled()) {
        const { BrainstormService: MockBrainstormService } = await import('./__mocks__/brainstormService');
        return await MockBrainstormService.createSession(sessionData);
      }
      
      return await ApiService.post<BrainstormSession>('/sessions', sessionData);
    } catch (error) {
      const context: ErrorContext = {
        component: 'SessionService',
        action: 'createSession',
        metadata: { title: sessionData.title },
      };
      throw handleError(error, context);
    }
  }

  /**
   * 启动头脑风暴会话
   */
  static async startSession(sessionId: number, startData: StartSessionRequest): Promise<void> {
    try {
      // 如果启用了Mock模式，使用Mock服务
      if (isMockEnabled()) {
        const { BrainstormService: MockBrainstormService } = await import('./__mocks__/brainstormService');
        return await MockBrainstormService.startSession(sessionId, startData);
      }
      
      return await ApiService.post<void>(`/sessions/${sessionId}/start`, startData);
    } catch (error) {
      const context: ErrorContext = {
        component: 'SessionService',
        action: 'startSession',
        metadata: { sessionId, topic: startData.topic },
      };
      throw handleError(error, context);
    }
  }

  /**
   * 暂停头脑风暴会话
   */
  static async pauseSession(sessionId: number): Promise<void> {
    try {
      return await ApiService.post<void>(`/sessions/${sessionId}/pause`);
    } catch (error) {
      const context: ErrorContext = {
        component: 'SessionService',
        action: 'pauseSession',
        metadata: { sessionId },
      };
      throw handleError(error, context);
    }
  }

  /**
   * 恢复头脑风暴会话
   */
  static async resumeSession(sessionId: number): Promise<void> {
    try {
      return await ApiService.post<void>(`/sessions/${sessionId}/resume`);
    } catch (error) {
      const context: ErrorContext = {
        component: 'SessionService',
        action: 'resumeSession',
        metadata: { sessionId },
      };
      throw handleError(error, context);
    }
  }

  /**
   * 取消头脑风暴会话
   */
  static async cancelSession(sessionId: number): Promise<void> {
    try {
      return await ApiService.post<void>(`/sessions/${sessionId}/cancel`);
    } catch (error) {
      const context: ErrorContext = {
        component: 'SessionService',
        action: 'cancelSession',
        metadata: { sessionId },
      };
      throw handleError(error, context);
    }
  }

  /**
   * 获取会话状态
   */
  static async getSessionStatus(sessionId: number): Promise<SessionStatus> {
    try {
      // 如果启用了Mock模式，使用Mock服务
      if (isMockEnabled()) {
        const { BrainstormService: MockBrainstormService } = await import('./__mocks__/brainstormService');
        return await MockBrainstormService.getSessionStatus(sessionId);
      }
      
      return await ApiService.get<SessionStatus>(`/sessions/${sessionId}/status`);
    } catch (error) {
      const context: ErrorContext = {
        component: 'SessionService',
        action: 'getSessionStatus',
        metadata: { sessionId },
      };
      throw handleError(error, context);
    }
  }

  /**
   * 获取用户会话列表
   */
  static async getSessions(): Promise<BrainstormSession[]> {
    try {
      // 如果启用了Mock模式，使用Mock服务
      if (isMockEnabled()) {
        const { BrainstormService: MockBrainstormService } = await import('./__mocks__/brainstormService');
        return await MockBrainstormService.getSessions();
      }
      
      return await ApiService.get<BrainstormSession[]>('/sessions');
    } catch (error) {
      const context: ErrorContext = {
        component: 'SessionService',
        action: 'getSessions',
      };
      throw handleError(error, context);
    }
  }

  /**
   * 获取用户活跃会话
   */
  static async getActiveSessions(): Promise<BrainstormSession[]> {
    try {
      return await ApiService.get<BrainstormSession[]>('/sessions/active');
    } catch (error) {
      const context: ErrorContext = {
        component: 'SessionService',
        action: 'getActiveSessions',
      };
      throw handleError(error, context);
    }
  }

  /**
   * 审核通过阶段
   */
  static async approvePhase(sessionId: number, phaseType: PhaseType): Promise<void> {
    try {
      return await ApiService.post<void>(`/sessions/${sessionId}/phases/${phaseType}/approve`);
    } catch (error) {
      const context: ErrorContext = {
        component: 'SessionService',
        action: 'approvePhase',
        metadata: { sessionId, phaseType },
      };
      throw handleError(error, context);
    }
  }

  /**
   * 审核拒绝阶段
   */
  static async rejectPhase(sessionId: number, phaseType: PhaseType): Promise<void> {
    try {
      return await ApiService.post<void>(`/sessions/${sessionId}/phases/${phaseType}/reject`);
    } catch (error) {
      const context: ErrorContext = {
        component: 'SessionService',
        action: 'rejectPhase',
        metadata: { sessionId, phaseType },
      };
      throw handleError(error, context);
    }
  }

  /**
   * 重新执行阶段
   */
  static async retryPhase(sessionId: number, phaseType: PhaseType): Promise<void> {
    try {
      return await ApiService.post<void>(`/sessions/${sessionId}/phases/${phaseType}/retry`);
    } catch (error) {
      const context: ErrorContext = {
        component: 'SessionService',
        action: 'retryPhase',
        metadata: { sessionId, phaseType },
      };
      throw handleError(error, context);
    }
  }

  /**
   * 提交阶段审核
   */
  static async submitPhaseForApproval(
    sessionId: number, 
    phaseType: PhaseType, 
    submitData: SubmitPhaseRequest
  ): Promise<void> {
    try {
      return await ApiService.post<void>(
        `/sessions/${sessionId}/phases/${phaseType}/submit-for-approval`, 
        submitData
      );
    } catch (error) {
      const context: ErrorContext = {
        component: 'SessionService',
        action: 'submitPhaseForApproval',
        metadata: { sessionId, phaseType },
      };
      throw handleError(error, context);
    }
  }

  /**
   * 获取阶段详情
   */
  static async getPhase(sessionId: number, phaseType: PhaseType): Promise<SessionPhase> {
    try {
      return await ApiService.get<SessionPhase>(`/sessions/${sessionId}/phases/${phaseType}`);
    } catch (error) {
      const context: ErrorContext = {
        component: 'SessionService',
        action: 'getPhase',
        metadata: { sessionId, phaseType },
      };
      throw handleError(error, context);
    }
  }

  /**
   * 获取会话阶段列表
   */
  static async getPhases(sessionId: number): Promise<SessionPhase[]> {
    try {
      return await ApiService.get<SessionPhase[]>(`/sessions/${sessionId}/phases`);
    } catch (error) {
      const context: ErrorContext = {
        component: 'SessionService',
        action: 'getPhases',
        metadata: { sessionId },
      };
      throw handleError(error, context);
    }
  }

  /**
   * 添加代理到会话
   */
  static async addAgentToSession(sessionId: number, agentId: number): Promise<void> {
    try {
      return await ApiService.post<void>(`/sessions/${sessionId}/agents/${agentId}`);
    } catch (error) {
      const context: ErrorContext = {
        component: 'SessionService',
        action: 'addAgentToSession',
        metadata: { sessionId, agentId },
      };
      throw handleError(error, context);
    }
  }

  /**
   * 从会话中移除代理
   */
  static async removeAgentFromSession(sessionId: number, agentId: number): Promise<void> {
    try {
      return await ApiService.delete<void>(`/sessions/${sessionId}/agents/${agentId}`);
    } catch (error) {
      const context: ErrorContext = {
        component: 'SessionService',
        action: 'removeAgentFromSession',
        metadata: { sessionId, agentId },
      };
      throw handleError(error, context);
    }
  }
}

export const sessionService = SessionService;