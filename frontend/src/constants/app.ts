// 应用程序常量定义

// 应用基本信息
export const APP_INFO = {
  NAME: 'AI头脑风暴平台',
  VERSION: '1.0.0',
  DESCRIPTION: '基于多AI代理的协作头脑风暴平台',
  AUTHOR: 'AI Brainstorm Team',
  COPYRIGHT: '© 2024 AI Brainstorm Platform. All rights reserved.'
} as const;

// 本地存储键名
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'ai_brainstorm_auth_token',
  REFRESH_TOKEN: 'ai_brainstorm_refresh_token',
  USER_INFO: 'ai_brainstorm_user_info',
  USER_PREFERENCES: 'ai_brainstorm_user_preferences',
  THEME: 'ai_brainstorm_theme',
  LANGUAGE: 'ai_brainstorm_language',
  SIDEBAR_COLLAPSED: 'ai_brainstorm_sidebar_collapsed',
  RECENT_SESSIONS: 'ai_brainstorm_recent_sessions',
  DRAFT_SESSION: 'ai_brainstorm_draft_session',
  AGENT_FILTERS: 'ai_brainstorm_agent_filters',
  SESSION_FILTERS: 'ai_brainstorm_session_filters'
} as const;

// 主题配置
export const THEME_CONFIG = {
  LIGHT: {
    name: 'light',
    label: '浅色主题',
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
    background: '#ffffff',
    surface: '#f5f5f5'
  },
  DARK: {
    name: 'dark',
    label: '深色主题',
    primary: '#177ddc',
    success: '#49aa19',
    warning: '#d89614',
    error: '#dc4446',
    background: '#141414',
    surface: '#1f1f1f'
  }
} as const;

// 语言配置
export const LANGUAGE_CONFIG = {
  'zh-CN': {
    name: 'zh-CN',
    label: '简体中文',
    flag: '🇨🇳'
  },
  'en-US': {
    name: 'en-US',
    label: 'English',
    flag: '🇺🇸'
  }
} as const;

// 分页配置
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
  SHOW_SIZE_CHANGER: true,
  SHOW_QUICK_JUMPER: true,
  SHOW_TOTAL: true
} as const;

// 文件上传配置
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  MAX_FILES_PER_UPLOAD: 5,
  CHUNK_SIZE: 1024 * 1024 // 1MB chunks
} as const;

// 表单验证规则
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]+$/,
    MESSAGE: '用户名长度为3-20个字符，只能包含字母、数字和下划线'
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 50,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]/,
    MESSAGE: '密码长度为8-50个字符，必须包含大小写字母和数字'
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: '请输入有效的邮箱地址'
  },
  AGENT_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    MESSAGE: '代理名称长度为2-50个字符'
  },
  AGENT_ROLE: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 30,
    MESSAGE: '代理角色长度为2-30个字符'
  },
  SYSTEM_PROMPT: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 2000,
    MESSAGE: '系统提示词长度为10-2000个字符'
  },
  SESSION_TOPIC: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 200,
    MESSAGE: '会话主题长度为5-200个字符'
  }
} as const;

// 通知配置
export const NOTIFICATION_CONFIG = {
  DURATION: 4500, // 4.5秒
  MAX_COUNT: 5,
  PLACEMENT: 'topRight',
  CLOSE_ICON: true,
  RTLSUPPORT: false
} as const;

// 动画配置
export const ANIMATION_CONFIG = {
  DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500
  },
  EASING: {
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
} as const;

// 图标配置
export const ICON_CONFIG = {
  SIZE: {
    SMALL: 16,
    MEDIUM: 20,
    LARGE: 24,
    EXTRA_LARGE: 32
  },
  COLORS: {
    PRIMARY: '#1890ff',
    SUCCESS: '#52c41a',
    WARNING: '#faad14',
    ERROR: '#f5222d',
    DISABLED: '#d9d9d9'
  }
} as const;

// 布局配置
export const LAYOUT_CONFIG = {
  SIDEBAR_WIDTH: 240,
  SIDEBAR_COLLAPSED_WIDTH: 80,
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 48,
  CONTENT_PADDING: 24,
  BREAKPOINTS: {
    XS: 480,
    SM: 576,
    MD: 768,
    LG: 992,
    XL: 1200,
    XXL: 1600
  }
} as const;

// 性能配置
export const PERFORMANCE_CONFIG = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  VIRTUAL_LIST_ITEM_HEIGHT: 50,
  LAZY_LOAD_THRESHOLD: 100,
  CACHE_TTL: 5 * 60 * 1000, // 5分钟
  MAX_CACHE_SIZE: 100
} as const;

// 错误代码映射
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

// 错误消息映射
export const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
  [ERROR_CODES.TIMEOUT_ERROR]: '请求超时，请稍后重试',
  [ERROR_CODES.UNAUTHORIZED]: '未授权访问，请重新登录',
  [ERROR_CODES.FORBIDDEN]: '权限不足，无法访问该资源',
  [ERROR_CODES.NOT_FOUND]: '请求的资源不存在',
  [ERROR_CODES.VALIDATION_ERROR]: '输入数据验证失败',
  [ERROR_CODES.SERVER_ERROR]: '服务器内部错误，请稍后重试',
  [ERROR_CODES.UNKNOWN_ERROR]: '未知错误，请联系技术支持'
} as const;

// 默认用户偏好设置
export const DEFAULT_USER_PREFERENCES = {
  theme: 'light',
  language: 'zh-CN',
  notifications: {
    email: true,
    browser: true,
    sound: false
  },
  dashboard: {
    showRecentSessions: true,
    showAgentStats: true,
    showQuickActions: true
  },
  editor: {
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    lineNumbers: true
  }
} as const;