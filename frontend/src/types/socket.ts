// WebSocket相关类型定义

import type { AgentStatus, AgentResult } from './agent';
import type { AISummary, FinalReport } from './brainstorm';

// Socket连接状态
export type SocketConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

// Socket连接配置
export interface SocketConfig {
  url?: string;
  namespace?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
}

// 基础Socket事件
export interface BaseSocketEvents {
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
  reconnect: (attemptNumber: number) => void;
  reconnect_attempt: (attemptNumber: number) => void;
  reconnect_error: (error: Error) => void;
  reconnect_failed: () => void;
}

// 头脑风暴相关Socket事件
export interface BrainstormSocketEvents extends BaseSocketEvents {
  // 会话事件
  'session:created': (data: { sessionId: string; topic: string }) => void;
  'session:started': (data: { sessionId: string; stage: number }) => void;
  'session:paused': (data: { sessionId: string }) => void;
  'session:resumed': (data: { sessionId: string }) => void;
  'session:stopped': (data: { sessionId: string }) => void;
  'session:completed': (data: { sessionId: string; finalReport: FinalReport }) => void;
  'session:error': (data: { sessionId: string; error: string }) => void;

  // 阶段事件
  'stage:started': (data: { sessionId: string; stage: number; stageName: string }) => void;
  'stage:completed': (data: { sessionId: string; stage: number; summary: AISummary }) => void;
  'stage:progress': (data: { sessionId: string; stage: number; progress: number }) => void;

  // 代理事件
  'agent:status-update': (data: { sessionId: string; agentId: string; status: AgentStatus }) => void;
  'agent:thinking-start': (data: { sessionId: string; agentId: string; stage: number }) => void;
  'agent:thinking-progress': (data: { sessionId: string; agentId: string; progress: number }) => void;
  'agent:result': (data: { sessionId: string; agentId: string; result: AgentResult }) => void;
  'agent:error': (data: { sessionId: string; agentId: string; error: string }) => void;

  // 系统事件
  'system:notification': (data: { type: 'info' | 'warning' | 'error'; message: string }) => void;
  'system:maintenance': (data: { message: string; estimatedDuration?: number }) => void;
}

// 客户端发送的事件
export interface ClientSocketEvents {
  // 会话控制
  'brainstorm:start': (data: { sessionId: string; topic: string; agentIds: string[] }) => void;
  'brainstorm:pause': (data: { sessionId: string }) => void;
  'brainstorm:resume': (data: { sessionId: string }) => void;
  'brainstorm:stop': (data: { sessionId: string }) => void;
  'brainstorm:proceed': (data: { sessionId: string; stage: number }) => void;
  'brainstorm:restart-stage': (data: { sessionId: string; stage: number }) => void;

  // 房间管理
  'room:join': (data: { sessionId: string }) => void;
  'room:leave': (data: { sessionId: string }) => void;

  // 心跳
  'ping': () => void;
}

// Socket错误类型
export interface SocketError {
  code: string;
  message: string;
  details?: any;
}

// Socket连接信息
export interface SocketConnectionInfo {
  id: string;
  connected: boolean;
  transport: string;
  namespace: string;
  userId?: string;
  sessionId?: string;
}

// Socket事件监听器类型
export type SocketEventListener<T = any> = (data: T) => void;

// Socket事件映射
export type SocketEventMap = BrainstormSocketEvents & ClientSocketEvents;

// Socket实例接口
export interface SocketInstance {
  id: string;
  connected: boolean;
  disconnected: boolean;
  
  // 连接管理
  connect(): void;
  disconnect(): void;
  
  // 事件监听
  on<K extends keyof SocketEventMap>(event: K, listener: SocketEventMap[K]): void;
  off<K extends keyof SocketEventMap>(event: K, listener?: SocketEventMap[K]): void;
  once<K extends keyof SocketEventMap>(event: K, listener: SocketEventMap[K]): void;
  
  // 事件发送
  emit<K extends keyof ClientSocketEvents>(event: K, ...args: Parameters<ClientSocketEvents[K]>): void;
  
  // 房间管理
  join(room: string): void;
  leave(room: string): void;
}

// Socket管理器接口
export interface SocketManager {
  // 连接管理
  connect(namespace?: string): Promise<SocketInstance>;
  disconnect(namespace?: string): void;
  disconnectAll(): void;
  
  // 获取连接
  getSocket(namespace?: string): SocketInstance | null;
  
  // 状态查询
  isConnected(namespace?: string): boolean;
  getConnectionStatus(namespace?: string): SocketConnectionStatus;
  
  // 事件管理
  onAny(listener: (event: string, ...args: any[]) => void): void;
  offAny(listener?: (event: string, ...args: any[]) => void): void;
}