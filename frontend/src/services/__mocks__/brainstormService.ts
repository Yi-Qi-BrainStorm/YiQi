import { vi } from 'vitest';
import { mockDataService } from './mockDataService';
import type { BrainstormSession, CreateSessionRequest } from '@/types/brainstorm';

/**
 * BrainstormService的Mock实现
 */
export const brainstormService = {
  /**
   * 获取会话列表
   */
  getSessions: vi.fn().mockImplementation(async (params?: any) => {
    const sessions = await mockDataService.getSessions();
    return {
      items: sessions,
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: sessions.length,
        totalPages: Math.ceil(sessions.length / (params?.limit || 20)),
        hasNext: false,
        hasPrev: false,
      }
    };
  }),

  /**
   * 创建新会话
   */
  createSession: vi.fn().mockImplementation(async (request: CreateSessionRequest): Promise<BrainstormSession> => {
    return await mockDataService.createSession(request.topic, request.agentIds);
  }),

  /**
   * 获取单个会话
   */
  getSession: vi.fn().mockImplementation(async (id: string): Promise<BrainstormSession> => {
    return await mockDataService.getSession(id);
  }),

  /**
   * 删除会话
   */
  deleteSession: vi.fn().mockImplementation(async (id: string): Promise<void> => {
    await mockDataService.deleteSession(id);
  }),

  /**
   * 开始头脑风暴
   */
  startBrainstorm: vi.fn().mockImplementation(async (sessionId: string): Promise<void> => {
    // Mock implementation - 模拟开始头脑风暴
    await new Promise(resolve => setTimeout(resolve, 500));
  }),

  /**
   * 停止头脑风暴
   */
  stopBrainstorm: vi.fn().mockImplementation(async (sessionId: string): Promise<void> => {
    // Mock implementation - 模拟停止头脑风暴
    await new Promise(resolve => setTimeout(resolve, 300));
  }),

  /**
   * 获取会话结果
   */
  getSessionResults: vi.fn().mockImplementation(async (sessionId: string) => {
    // Mock implementation - 返回模拟结果
    return {
      sessionId,
      results: [
        mockDataService.generateMockAgentResult('1', '这是设计师的建议...'),
        mockDataService.generateMockAgentResult('2', '这是工程师的建议...')
      ],
      summary: {
        keyPoints: ['关键点1', '关键点2'],
        commonSuggestions: ['建议1', '建议2'],
        conflictingViews: [],
        overallAssessment: '整体评估',
        nextStepRecommendations: ['下一步建议1', '下一步建议2']
      }
    };
  }),

  /**
   * 生成最终报告
   */
  generateFinalReport: vi.fn().mockImplementation(async (sessionId: string) => {
    const session = await mockDataService.getSession(sessionId);
    return mockDataService.generateMockFinalReport(sessionId, session.topic || '默认主题');
  }),

  /**
   * 导出会话
   */
  exportSession: vi.fn().mockImplementation(async (sessionId: string, format: string) => {
    // Mock implementation - 模拟导出
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      downloadUrl: `mock://export/${sessionId}.${format}`,
      filename: `session-${sessionId}.${format}`
    };
  })
};

export default brainstormService;