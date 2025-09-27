// 用户相关类型定义

export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

// Backend API compatible register data (without email for now)
export interface BackendRegisterData {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

// 注册响应类型（注册成功后直接返回用户信息，不包含token）
export interface RegisterResponse {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
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