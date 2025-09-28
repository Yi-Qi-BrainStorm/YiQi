// API端点常量定义

// 基础API配置
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
export const API_VERSION = 'v1';
export const API_TIMEOUT = 30000; // 30秒

// 健康检查端点
export const HEALTH_ENDPOINTS = {
  HEALTH: '/actuator/health',
  INFO: '/actuator/info',
  METRICS: '/actuator/metrics'
} as const;

// 认证相关端点 (基于后端实际实现)
export const AUTH_ENDPOINTS = {
  LOGIN: '/users/login',
  REGISTER: '/users/register',
  LOGOUT: '/users/logout',
  PROFILE: '/users/me',
  UPDATE_PROFILE: '/users/me',
  CHANGE_PASSWORD: '/users/change-password',
  FORGOT_PASSWORD: '/users/forgot-password',
  RESET_PASSWORD: '/users/reset-password'
} as const;

// 用户相关端点
export const USER_ENDPOINTS = {
  GET_USERS: '/users',
  GET_USER: '/users/:id',
  UPDATE_USER: '/users/:id',
  DELETE_USER: '/users/:id',
  UPLOAD_AVATAR: '/users/:id/avatar',
  GET_PREFERENCES: '/users/:id/preferences',
  UPDATE_PREFERENCES: '/users/:id/preferences'
} as const;

// 代理相关端点
export const AGENT_ENDPOINTS = {
  GET_AGENTS: '/agents',
  CREATE_AGENT: '/agents',
  GET_AGENT: '/agents/:id',
  UPDATE_AGENT: '/agents/:id',
  DELETE_AGENT: '/agents/:id',
  ACTIVATE_AGENT: '/agents/:id/activate',
  DEACTIVATE_AGENT: '/agents/:id/deactivate',
  GET_BY_ROLE: '/agents/by-role/:roleType',
  GET_ROLE_TYPES: '/agents/role-types',
  GET_STATUSES: '/agents/statuses',
  GET_AI_MODELS: '/agents/ai-models',
  CHECK_NAME: '/agents/check-name'
} as const;

// 头脑风暴会话相关端点
export const SESSION_ENDPOINTS = {
  GET_SESSIONS: '/sessions',
  CREATE_SESSION: '/sessions',
  GET_SESSION: '/sessions/:id',
  START_SESSION: '/sessions/:id/start',
  PAUSE_SESSION: '/sessions/:id/pause',
  RESUME_SESSION: '/sessions/:id/resume',
  CANCEL_SESSION: '/sessions/:id/cancel',
  GET_STATUS: '/sessions/:id/status',
  GET_ACTIVE: '/sessions/active',
  
  // 阶段管理
  APPROVE_PHASE: '/sessions/:sessionId/phases/:phaseType/approve',
  REJECT_PHASE: '/sessions/:sessionId/phases/:phaseType/reject',
  RETRY_PHASE: '/sessions/:sessionId/phases/:phaseType/retry',
  SUBMIT_PHASE: '/sessions/:sessionId/phases/:phaseType/submit-for-approval',
  GET_PHASE: '/sessions/:sessionId/phases/:phaseType',
  GET_PHASES: '/sessions/:sessionId/phases',
  
  // 代理管理
  ADD_AGENT: '/sessions/:sessionId/agents/:agentId',
  REMOVE_AGENT: '/sessions/:sessionId/agents/:agentId'
} as const;

// AI推理相关端点
export const AI_INFERENCE_ENDPOINTS = {
  AGENT_INFERENCE: '/ai-inference/agent',
  AGENT_STREAM: '/ai-inference/agent/stream',
  TEST_SERVICE: '/ai-inference/test',
  GET_STATUS: '/ai-inference/status/:sessionId/:phaseType',
  GET_STATISTICS: '/ai-inference/statistics'
} as const;

// 文件上传端点
export const FILE_ENDPOINTS = {
  UPLOAD: '/files/upload',
  DELETE: '/files/:id',
  GET_FILE: '/files/:id'
} as const;

// 统计和分析端点
export const ANALYTICS_ENDPOINTS = {
  SESSION_STATS: '/analytics/sessions',
  AGENT_PERFORMANCE: '/analytics/agents',
  USER_ACTIVITY: '/analytics/users',
  SYSTEM_METRICS: '/analytics/system'
} as const;

// WebSocket端点
export const WEBSOCKET_ENDPOINTS = {
  BRAINSTORM: '/ws/brainstorm',
  NOTIFICATIONS: '/ws/notifications'
} as const;

// HTTP请求头常量
export const HTTP_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  ACCEPT: 'Accept',
  USER_AGENT: 'User-Agent'
} as const;

// 内容类型常量
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain'
} as const;

// 请求方法常量
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE'
} as const;