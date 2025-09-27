// API相关类型定义

// 通用API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// 分页相关类型
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 搜索和过滤类型
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
}

// 用户API类型
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface UpdateUserRequest {
  username?: string;
  avatar?: string;
  bio?: string;
  preferences?: import('./user').UserPreferences;
}

// 代理API类型
export interface CreateAgentRequest {
  name: string;
  roleType: string;
  systemPrompt: string;
  aiModel: import('./agent').AIModelType;
}

export interface UpdateAgentRequest extends Partial<CreateAgentRequest> {}

export interface GetAgentsRequest extends PaginationParams, SearchParams {
  aiModel?: import('./agent').AIModelType;
  roleType?: string;
  status?: import('./agent').AgentStatus;
}

// 头脑风暴API类型
export interface CreateBrainstormRequest {
  title: string;
  description?: string;
  topic: string;
  agentIds: number[];
}

export interface GetBrainstormSessionsRequest extends PaginationParams, SearchParams {
  status?: import('./brainstorm').SessionStatus;
  currentPhase?: import('./brainstorm').PhaseType;
}

export interface UpdateSessionRequest {
  title?: string;
  description?: string;
  topic?: string;
  status?: import('./brainstorm').SessionStatus;
}

// WebSocket连接类型
export interface SocketConnectionConfig {
  url: string;
  namespace?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

// 文件上传类型
export interface FileUploadRequest {
  file: File;
  type: 'avatar' | 'document' | 'image';
}

export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// 导出相关类型
export interface ExportRequest {
  sessionId: number;
  format: 'pdf' | 'docx' | 'html' | 'json';
  options?: {
    includeAgentDetails?: boolean;
    includeTimestamps?: boolean;
    template?: string;
  };
}

export interface ExportResponse {
  downloadUrl: string;
  filename: string;
  expiresAt: string;
}

// 统计和分析类型
export interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  averageCompletionTime: number;
  mostUsedAgents: {
    agentId: number;
    agentName: string;
    usageCount: number;
  }[];
  topicCategories: {
    category: string;
    count: number;
  }[];
}

export interface AgentPerformance {
  agentId: number;
  agentName: string;
  totalUsage: number;
  averageProcessingTime: number;
  successRate: number;
}

// 系统配置类型
export interface SystemConfig {
  maxAgentsPerSession: number;
  sessionTimeout: number;
  supportedModels: import('./agent').AIModel[];
  features: {
    exportEnabled: boolean;
    analyticsEnabled: boolean;
    collaborationEnabled: boolean;
  };
}