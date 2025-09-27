// 枚举类型定义

// AI模型相关枚举
export enum AIModelType {
  GPT4 = 'gpt-4',
  GPT35_TURBO = 'gpt-3.5-turbo',
  CLAUDE3 = 'claude-3',
  GEMINI_PRO = 'gemini-pro'
}

export enum ModelProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google'
}

// 会话状态枚举
export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// 代理状态枚举
export enum AgentStatus {
  IDLE = 'idle',
  THINKING = 'thinking',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// 头脑风暴阶段枚举
export enum BrainstormStage {
  IDEA_GENERATION = 1,
  TECHNICAL_FEASIBILITY = 2,
  PROBLEM_DISCUSSION = 3
}

// 用户主题枚举
export enum UserTheme {
  LIGHT = 'light',
  DARK = 'dark'
}

// 语言枚举
export enum Language {
  ZH_CN = 'zh-CN',
  EN_US = 'en-US'
}

// 通知类型枚举
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

// 文件类型枚举
export enum FileType {
  AVATAR = 'avatar',
  DOCUMENT = 'document',
  IMAGE = 'image'
}

// 导出格式枚举
export enum ExportFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  HTML = 'html',
  JSON = 'json'
}

// 营销渠道类型枚举
export enum MarketingChannelType {
  DIGITAL = 'digital',
  TRADITIONAL = 'traditional',
  SOCIAL = 'social',
  DIRECT = 'direct'
}

// 风险类别枚举
export enum RiskCategory {
  TECHNICAL = 'technical',
  MARKET = 'market',
  FINANCIAL = 'financial',
  OPERATIONAL = 'operational'
}

// 风险等级枚举
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// 资源类型枚举
export enum ResourceType {
  HUMAN = 'human',
  EQUIPMENT = 'equipment',
  MATERIAL = 'material',
  FINANCIAL = 'financial'
}

// 时间单位枚举
export enum TimeUnit {
  DAYS = 'days',
  WEEKS = 'weeks',
  MONTHS = 'months'
}

// 组件尺寸枚举
export enum ComponentSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

// 表单字段类型枚举
export enum FormFieldType {
  TEXT = 'text',
  EMAIL = 'email',
  PASSWORD = 'password',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  DATE = 'date',
  NUMBER = 'number'
}

// 图表类型枚举
export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  AREA = 'area',
  SCATTER = 'scatter'
}

// 排序方向枚举
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

// WebSocket事件枚举
export enum SocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  BRAINSTORM_START = 'brainstorm:start',
  BRAINSTORM_PROCEED = 'brainstorm:proceed',
  BRAINSTORM_RESTART_STAGE = 'brainstorm:restart-stage',
  AGENT_STATUS_UPDATE = 'agent:status-update',
  AGENT_RESULT = 'agent:result',
  STAGE_SUMMARY = 'stage:summary',
  SESSION_COMPLETE = 'session:complete'
}

// HTTP状态码枚举
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

// 本地存储键枚举
export enum StorageKey {
  AUTH_TOKEN = 'auth_token',
  USER_PREFERENCES = 'user_preferences',
  THEME = 'theme',
  LANGUAGE = 'language',
  SIDEBAR_COLLAPSED = 'sidebar_collapsed'
}