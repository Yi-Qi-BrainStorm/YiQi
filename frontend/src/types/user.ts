// 用户相关类型定义 (基于后端DTO结构)

export interface User {
  id: number;
  username: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  // 前端可能需要的额外字段
  confirmPassword?: string;
  email?: string; // 可选，后端暂不支持
}

// Backend API compatible register data
export interface BackendRegisterData {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

// 注册响应类型（基于后端UserResponse）
export interface RegisterResponse {
  id: number;
  username: string;
  createdAt: string;
  lastLoginAt: string | null;
}

// 扩展的用户配置文件（可选功能）
export interface UserProfile extends User {
  avatar?: string;
  bio?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'en-US';
  notifications: {
    email: boolean;
    browser: boolean;
  };
}