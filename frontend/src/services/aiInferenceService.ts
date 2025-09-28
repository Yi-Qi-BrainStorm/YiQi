import { ApiService } from './api';
import { handleError, type ErrorContext } from './errorHandler';

/**
 * AI推理请求接口
 */
export interface AgentInferenceRequest {
  agentId: number;
  agentName: string;
  roleType: string;
  systemPrompt: string;
  userPrompt: string;
  sessionContext?: string;
}

/**
 * AI推理响应接口
 */
export interface AgentInferenceResponse {
  agentId: number;
  agentName: string;
  roleType: string;
  content: string | null;
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  errorMessage: string | null;
  startTime: string;
  endTime: string;
  processingTimeMs: number;
}

/**
 * 会话推理状态接口
 */
export interface SessionInferenceStatus {
  sessionId: string;
  phaseType: string;
  startTime: string;
  endTime: string | null;
  totalAgents: number;
  completedAgents: number;
  successfulAgents: number;
  failedAgents: number;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress: number;
  successRate: number;
  processingTimeMs: number;
}

/**
 * 系统推理统计接口
 */
export interface InferenceStatistics {
  totalSessions: number;
  runningSessions: number;
  completedSessions: number;
  failedSessions: number;
  averageProcessingTimeMs: number;
}

/**
 * AI服务测试请求接口
 */
export interface AIServiceTestRequest {
  systemPrompt?: string;
  userPrompt?: string;
}

/**
 * AI推理服务
 * 基于后端 /ai-inference 路径的API接口
 */
export class AIInferenceService {
  /**
   * 处理单个代理推理请求
   */
  static async processAgentInference(request: AgentInferenceRequest): Promise<AgentInferenceResponse> {
    try {
      return await ApiService.post<AgentInferenceResponse>('/ai-inference/agent', request);
    } catch (error) {
      const context: ErrorContext = {
        component: 'AIInferenceService',
        action: 'processAgentInference',
        metadata: { agentId: request.agentId, agentName: request.agentName },
      };
      throw handleError(error, context);
    }
  }

  /**
   * 处理单个代理流式推理请求
   * 返回一个ReadableStream用于处理Server-Sent Events
   */
  static async processAgentStreamInference(request: AgentInferenceRequest): Promise<ReadableStream> {
    try {
      const response = await fetch(`${ApiService.getBaseURL()}/ai-inference/agent/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Authorization': `Bearer ${ApiService.getToken()}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      return response.body;
    } catch (error) {
      const context: ErrorContext = {
        component: 'AIInferenceService',
        action: 'processAgentStreamInference',
        metadata: { agentId: request.agentId, agentName: request.agentName },
      };
      throw handleError(error, context);
    }
  }

  /**
   * 测试AI服务连接
   */
  static async testAIService(testRequest?: AIServiceTestRequest): Promise<string> {
    try {
      const request = testRequest || {
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: 'Hello, this is a test.'
      };
      
      return await ApiService.post<string>('/ai-inference/test', request);
    } catch (error) {
      const context: ErrorContext = {
        component: 'AIInferenceService',
        action: 'testAIService',
      };
      throw handleError(error, context);
    }
  }

  /**
   * 获取推理状态
   */
  static async getInferenceStatus(sessionId: string, phaseType: string): Promise<SessionInferenceStatus | null> {
    try {
      return await ApiService.get<SessionInferenceStatus>(`/ai-inference/status/${sessionId}/${phaseType}`);
    } catch (error: any) {
      // 如果是404错误，返回null表示状态未找到
      if (error.status === 404) {
        return null;
      }
      
      const context: ErrorContext = {
        component: 'AIInferenceService',
        action: 'getInferenceStatus',
        metadata: { sessionId, phaseType },
      };
      throw handleError(error, context);
    }
  }

  /**
   * 获取系统推理统计
   */
  static async getInferenceStatistics(): Promise<InferenceStatistics> {
    try {
      return await ApiService.get<InferenceStatistics>('/ai-inference/statistics');
    } catch (error) {
      const context: ErrorContext = {
        component: 'AIInferenceService',
        action: 'getInferenceStatistics',
      };
      throw handleError(error, context);
    }
  }

  /**
   * 解析流式响应
   * 用于处理Server-Sent Events流
   */
  static parseStreamResponse(stream: ReadableStream): AsyncGenerator<string, void, unknown> {
    return this.parseSSEStream(stream);
  }

  /**
   * 解析Server-Sent Events流
   */
  private static async *parseSSEStream(stream: ReadableStream): AsyncGenerator<string, void, unknown> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const aiInferenceService = AIInferenceService;