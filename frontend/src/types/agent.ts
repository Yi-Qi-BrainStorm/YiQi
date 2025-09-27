// AI代理相关类型定义

export type AIModelType = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'gemini-pro';

export interface ModelConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  modelType: AIModelType;
  modelConfig: ModelConfig;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentFormData {
  name: string;
  role: string;
  systemPrompt: string;
  modelType: AIModelType;
  modelConfig: ModelConfig;
}

export interface AIModel {
  id: AIModelType;
  name: string;
  description: string;
  maxTokens: number;
  costPerToken: number;
  provider: string;
}

export type AgentStatus = 'idle' | 'thinking' | 'completed' | 'error';

export interface AgentResult {
  agentId: string;
  agentName: string;
  agentRole: string;
  content: string;
  reasoning: string;
  suggestions: string[];
  confidence: number;
  processingTime: number;
  createdAt: string;
}