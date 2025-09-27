// Pinia stores导出文件

export { useAuthStore } from './auth';
export { useAgentStore } from './agents';
export { useBrainstormStore } from './brainstorm';
export { useLoadingStore } from './loading';

// 类型导出
export type { 
  User, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse,
  RegisterResponse 
} from '@/types/user';

export type { 
  Agent, 
  AgentFormData, 
  AIModel, 
  AgentStatus, 
  AgentResult 
} from '@/types/agent';

export type { 
  BrainstormSession, 
  StageResult, 
  AISummary, 
  FinalReport, 
  SessionStatus, 
  StageProgress 
} from '@/types/brainstorm';