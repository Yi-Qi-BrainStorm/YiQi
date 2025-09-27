// 路由路径常量定义

// 主要路由路径
export const ROUTES = {
  // 认证相关路由
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // 主要功能路由
  HOME: '/',
  DASHBOARD: '/dashboard',
  
  // 代理管理路由
  AGENTS: '/agents',
  AGENT_CREATE: '/agents/create',
  AGENT_EDIT: '/agents/:id/edit',
  AGENT_DETAIL: '/agents/:id',
  
  // 头脑风暴路由
  BRAINSTORM: '/brainstorm',
  BRAINSTORM_CREATE: '/brainstorm/create',
  BRAINSTORM_SESSION: '/brainstorm/session/:id',
  BRAINSTORM_HISTORY: '/brainstorm/history',
  BRAINSTORM_RESULTS: '/brainstorm/results/:id',
  
  // 用户相关路由
  PROFILE: '/profile',
  SETTINGS: '/settings',
  
  // 其他路由
  ABOUT: '/about',
  HELP: '/help',
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/401',
  FORBIDDEN: '/403'
} as const;

// 路由名称常量
export const ROUTE_NAMES = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  RESET_PASSWORD: 'ResetPassword',
  HOME: 'Home',
  DASHBOARD: 'Dashboard',
  AGENTS: 'Agents',
  AGENT_CREATE: 'AgentCreate',
  AGENT_EDIT: 'AgentEdit',
  AGENT_DETAIL: 'AgentDetail',
  BRAINSTORM: 'Brainstorm',
  BRAINSTORM_CREATE: 'BrainstormCreate',
  BRAINSTORM_SESSION: 'BrainstormSession',
  BRAINSTORM_HISTORY: 'BrainstormHistory',
  BRAINSTORM_RESULTS: 'BrainstormResults',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  ABOUT: 'About',
  HELP: 'Help',
  NOT_FOUND: 'NotFound',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden'
} as const;

// 导航菜单项
export const NAVIGATION_ITEMS = [
  {
    key: 'dashboard',
    label: '仪表板',
    path: ROUTES.DASHBOARD,
    icon: 'dashboard'
  },
  {
    key: 'agents',
    label: 'AI代理管理',
    path: ROUTES.AGENTS,
    icon: 'robot'
  },
  {
    key: 'brainstorm',
    label: '头脑风暴',
    path: ROUTES.BRAINSTORM,
    icon: 'bulb'
  },
  {
    key: 'history',
    label: '历史记录',
    path: ROUTES.BRAINSTORM_HISTORY,
    icon: 'history'
  }
] as const;

// 面包屑配置
export const BREADCRUMB_CONFIG = {
  [ROUTES.DASHBOARD]: [
    { label: '首页', path: ROUTES.HOME },
    { label: '仪表板' }
  ],
  [ROUTES.AGENTS]: [
    { label: '首页', path: ROUTES.HOME },
    { label: 'AI代理管理' }
  ],
  [ROUTES.AGENT_CREATE]: [
    { label: '首页', path: ROUTES.HOME },
    { label: 'AI代理管理', path: ROUTES.AGENTS },
    { label: '创建代理' }
  ],
  [ROUTES.BRAINSTORM]: [
    { label: '首页', path: ROUTES.HOME },
    { label: '头脑风暴' }
  ],
  [ROUTES.BRAINSTORM_CREATE]: [
    { label: '首页', path: ROUTES.HOME },
    { label: '头脑风暴', path: ROUTES.BRAINSTORM },
    { label: '创建会话' }
  ],
  [ROUTES.PROFILE]: [
    { label: '首页', path: ROUTES.HOME },
    { label: '个人资料' }
  ],
  [ROUTES.SETTINGS]: [
    { label: '首页', path: ROUTES.HOME },
    { label: '设置' }
  ]
} as const;

// 需要认证的路由
export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.AGENTS,
  ROUTES.AGENT_CREATE,
  ROUTES.AGENT_EDIT,
  ROUTES.AGENT_DETAIL,
  ROUTES.BRAINSTORM,
  ROUTES.BRAINSTORM_CREATE,
  ROUTES.BRAINSTORM_SESSION,
  ROUTES.BRAINSTORM_HISTORY,
  ROUTES.BRAINSTORM_RESULTS,
  ROUTES.PROFILE,
  ROUTES.SETTINGS
] as const;

// 公开路由（不需要认证）
export const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.ABOUT,
  ROUTES.HELP
] as const;