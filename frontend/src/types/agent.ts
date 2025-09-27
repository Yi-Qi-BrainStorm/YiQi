// AI代理相关类型定义

export type AIModelType = 'qwen-plus' | 'qwen-turbo' | 'qwen-max' | 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'gemini-pro';

export type AgentStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

export interface Agent {
  id: number;
  userId: number;
  name: string;
  roleType: string;
  systemPrompt: string;
  aiModel: AIModelType;
  status: AgentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AgentFormData {
  name: string;
  roleType: string;
  systemPrompt: string;
  aiModel: AIModelType;
}

export interface AgentVersion {
  id: number;
  agentId: number;
  versionNumber: number;
  name: string;
  roleType: string;
  systemPrompt: string;
  aiModel: AIModelType;
  createdAt: string;
}

export interface AIModel {
  id: AIModelType;
  name: string;
  description: string;
  maxTokens: number;
  costPerToken: number;
  provider: string;
}

// 代理运行时状态（用于头脑风暴会话中）
export type AgentRuntimeStatus = 'idle' | 'thinking' | 'completed' | 'error';

export interface AgentResponse {
  id: number;
  phaseId: number;
  agentId: number;
  content: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  processingTimeMs: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface AgentResult {
  agentId: number;
  agentName: string;
  agentRole: string;
  content: string;
  processingTime: number;
  createdAt: string;
}