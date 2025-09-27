// 头脑风暴相关常量定义

// 头脑风暴阶段配置
export const BRAINSTORM_STAGES = {
  1: {
    name: '创意生成阶段',
    description: '各AI代理基于主题生成初步创意和想法',
    duration: 300, // 5分钟（秒）
    prompt: '请基于给定主题，从你的专业角度生成创新的产品创意和解决方案。'
  },
  2: {
    name: '技术可行性分析',
    description: '分析创意的技术实现可能性和挑战',
    duration: 420, // 7分钟（秒）
    prompt: '请分析前一阶段提出的创意，从技术角度评估其可行性，并提出具体的实现方案。'
  },
  3: {
    name: '问题讨论与优化',
    description: '识别潜在问题并提出改进建议',
    duration: 360, // 6分钟（秒）
    prompt: '请识别前面阶段中提到的潜在问题和挑战，并提出具体的解决方案和优化建议。'
  }
} as const;

// 阶段名称数组
export const STAGE_NAMES = [
  BRAINSTORM_STAGES[1].name,
  BRAINSTORM_STAGES[2].name,
  BRAINSTORM_STAGES[3].name
] as const;

// 会话配置常量
export const SESSION_CONFIG = {
  MAX_AGENTS_PER_SESSION: 6,
  MIN_AGENTS_PER_SESSION: 2,
  MAX_TOPIC_LENGTH: 200,
  MIN_TOPIC_LENGTH: 10,
  SESSION_TIMEOUT: 3600, // 1小时（秒）
  AUTO_SAVE_INTERVAL: 30, // 30秒
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000 // 5秒
} as const;

// AI模型配置
export const AI_MODEL_CONFIGS = {
  'gpt-4': {
    name: 'GPT-4',
    provider: 'OpenAI',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    costPerToken: 0.00003
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    costPerToken: 0.000002
  },
  'claude-3': {
    name: 'Claude 3',
    provider: 'Anthropic',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    costPerToken: 0.000015
  },
  'gemini-pro': {
    name: 'Gemini Pro',
    provider: 'Google',
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    costPerToken: 0.000001
  }
} as const;

// 代理角色预设
export const AGENT_ROLE_PRESETS = [
  {
    role: '产品经理',
    systemPrompt: '你是一位经验丰富的产品经理，擅长市场分析、用户需求挖掘和产品规划。请从产品角度分析问题，关注用户体验和市场可行性。',
    icon: 'user-tie'
  },
  {
    role: '技术专家',
    systemPrompt: '你是一位资深的技术专家，精通各种技术栈和架构设计。请从技术实现角度分析问题，关注技术可行性、性能和安全性。',
    icon: 'code'
  },
  {
    role: '设计师',
    systemPrompt: '你是一位创意设计师，擅长用户界面设计和用户体验优化。请从设计角度分析问题，关注美观性、易用性和创新性。',
    icon: 'palette'
  },
  {
    role: '市场营销专家',
    systemPrompt: '你是一位市场营销专家，精通品牌推广、渠道运营和用户增长。请从营销角度分析问题，关注市场定位、推广策略和商业价值。',
    icon: 'megaphone'
  },
  {
    role: '财务分析师',
    systemPrompt: '你是一位财务分析师，擅长成本控制、投资回报分析和风险评估。请从财务角度分析问题，关注成本效益、盈利模式和财务风险。',
    icon: 'calculator'
  },
  {
    role: '用户研究员',
    systemPrompt: '你是一位用户研究专家，精通用户行为分析和需求调研。请从用户角度分析问题，关注用户痛点、使用场景和满意度。',
    icon: 'users'
  }
] as const;

// 导出格式配置
export const EXPORT_FORMATS = {
  pdf: {
    name: 'PDF文档',
    extension: '.pdf',
    mimeType: 'application/pdf',
    icon: 'file-pdf'
  },
  docx: {
    name: 'Word文档',
    extension: '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    icon: 'file-word'
  },
  html: {
    name: 'HTML网页',
    extension: '.html',
    mimeType: 'text/html',
    icon: 'file-code'
  },
  json: {
    name: 'JSON数据',
    extension: '.json',
    mimeType: 'application/json',
    icon: 'file-code'
  }
} as const;

// WebSocket事件常量
export const WEBSOCKET_EVENTS = {
  // 连接事件
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // 头脑风暴事件
  BRAINSTORM_START: 'brainstorm:start',
  BRAINSTORM_PROCEED: 'brainstorm:proceed',
  BRAINSTORM_RESTART_STAGE: 'brainstorm:restart-stage',
  BRAINSTORM_PAUSE: 'brainstorm:pause',
  BRAINSTORM_RESUME: 'brainstorm:resume',
  BRAINSTORM_CANCEL: 'brainstorm:cancel',
  
  // 代理事件
  AGENT_STATUS_UPDATE: 'agent:status-update',
  AGENT_RESULT: 'agent:result',
  AGENT_ERROR: 'agent:error',
  
  // 阶段事件
  STAGE_START: 'stage:start',
  STAGE_COMPLETE: 'stage:complete',
  STAGE_SUMMARY: 'stage:summary',
  
  // 会话事件
  SESSION_UPDATE: 'session:update',
  SESSION_COMPLETE: 'session:complete',
  SESSION_ERROR: 'session:error'
} as const;

// 通知消息模板
export const NOTIFICATION_MESSAGES = {
  SESSION_CREATED: '头脑风暴会话已创建',
  SESSION_STARTED: '头脑风暴会话已开始',
  STAGE_COMPLETED: '阶段 {stage} 已完成',
  SESSION_COMPLETED: '头脑风暴会话已完成',
  AGENT_ERROR: '代理 {agentName} 出现错误',
  SESSION_TIMEOUT: '会话超时，已自动保存',
  EXPORT_SUCCESS: '报告导出成功',
  EXPORT_FAILED: '报告导出失败'
} as const;

// 默认配置值
export const DEFAULT_VALUES = {
  SESSION_TOPIC: '',
  SELECTED_AGENTS: [],
  MODEL_TEMPERATURE: 0.7,
  MODEL_MAX_TOKENS: 2048,
  MODEL_TOP_P: 0.9,
  MODEL_FREQUENCY_PENALTY: 0.1,
  MODEL_PRESENCE_PENALTY: 0.1
} as const;