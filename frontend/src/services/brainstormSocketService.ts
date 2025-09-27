import { socketService, type SocketWrapper } from './socketService';
import type { 
  BrainstormSocketEvents,
  ClientSocketEvents,
  SocketEventListener 
} from '@/types/socket';
import type { 
  AgentStatus, 
  AgentResult 
} from '@/types/agent';
import type { 
  AISummary, 
  FinalReport 
} from '@/types/brainstorm';

/**
 * 头脑风暴专用Socket服务
 */
export class BrainstormSocketService {
  private socket: SocketWrapper | null = null;
  private currentSessionId: string | null = null;
  private eventListeners: Map<string, Set<SocketEventListener>> = new Map();

  /**
   * 连接到头脑风暴命名空间
   */
  async connect(): Promise<void> {
    try {
      this.socket = await socketService.connect('/brainstorm');
      this.setupEventForwarding();
      console.log('头脑风暴Socket连接成功');
    } catch (error) {
      console.error('头脑风暴Socket连接失败:', error);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.currentSessionId) {
      this.leaveSession(this.currentSessionId);
    }
    
    socketService.disconnect('/brainstorm');
    this.socket = null;
    this.currentSessionId = null;
    this.eventListeners.clear();
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return socketService.isConnected('/brainstorm');
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus() {
    return socketService.getConnectionStatus('/brainstorm');
  }

  /**
   * 加入会话房间
   */
  joinSession(sessionId: string): void {
    if (!this.socket) {
      throw new Error('Socket未连接');
    }

    if (this.currentSessionId && this.currentSessionId !== sessionId) {
      this.leaveSession(this.currentSessionId);
    }

    this.socket.join(sessionId);
    this.currentSessionId = sessionId;
    console.log(`加入会话房间: ${sessionId}`);
  }

  /**
   * 离开会话房间
   */
  leaveSession(sessionId: string): void {
    if (!this.socket) {
      return;
    }

    this.socket.leave(sessionId);
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
    console.log(`离开会话房间: ${sessionId}`);
  }

  /**
   * 开始头脑风暴会话
   */
  startBrainstorm(sessionId: string, topic: string, agentIds: string[]): void {
    this.ensureConnected();
    this.socket!.emit('brainstorm:start', { sessionId, topic, agentIds });
  }

  /**
   * 暂停会话
   */
  pauseSession(sessionId: string): void {
    this.ensureConnected();
    this.socket!.emit('brainstorm:pause', { sessionId });
  }

  /**
   * 恢复会话
   */
  resumeSession(sessionId: string): void {
    this.ensureConnected();
    this.socket!.emit('brainstorm:resume', { sessionId });
  }

  /**
   * 停止会话
   */
  stopSession(sessionId: string): void {
    this.ensureConnected();
    this.socket!.emit('brainstorm:stop', { sessionId });
  }

  /**
   * 进入下一阶段
   */
  proceedToNextStage(sessionId: string, stage: number): void {
    this.ensureConnected();
    this.socket!.emit('brainstorm:proceed', { sessionId, stage });
  }

  /**
   * 重新开始当前阶段
   */
  restartCurrentStage(sessionId: string, stage: number): void {
    this.ensureConnected();
    this.socket!.emit('brainstorm:restart-stage', { sessionId, stage });
  }

  /**
   * 监听会话创建事件
   */
  onSessionCreated(listener: (data: { sessionId: string; topic: string }) => void): void {
    this.addEventListener('session:created', listener);
  }

  /**
   * 监听会话开始事件
   */
  onSessionStarted(listener: (data: { sessionId: string; stage: number }) => void): void {
    this.addEventListener('session:started', listener);
  }

  /**
   * 监听会话完成事件
   */
  onSessionCompleted(listener: (data: { sessionId: string; finalReport: FinalReport }) => void): void {
    this.addEventListener('session:completed', listener);
  }

  /**
   * 监听会话错误事件
   */
  onSessionError(listener: (data: { sessionId: string; error: string }) => void): void {
    this.addEventListener('session:error', listener);
  }

  /**
   * 监听阶段开始事件
   */
  onStageStarted(listener: (data: { sessionId: string; stage: number; stageName: string }) => void): void {
    this.addEventListener('stage:started', listener);
  }

  /**
   * 监听阶段完成事件
   */
  onStageCompleted(listener: (data: { sessionId: string; stage: number; summary: AISummary }) => void): void {
    this.addEventListener('stage:completed', listener);
  }

  /**
   * 监听阶段进度事件
   */
  onStageProgress(listener: (data: { sessionId: string; stage: number; progress: number }) => void): void {
    this.addEventListener('stage:progress', listener);
  }

  /**
   * 监听代理状态更新事件
   */
  onAgentStatusUpdate(listener: (data: { sessionId: string; agentId: string; status: AgentStatus }) => void): void {
    this.addEventListener('agent:status-update', listener);
  }

  /**
   * 监听代理开始思考事件
   */
  onAgentThinkingStart(listener: (data: { sessionId: string; agentId: string; stage: number }) => void): void {
    this.addEventListener('agent:thinking-start', listener);
  }

  /**
   * 监听代理思考进度事件
   */
  onAgentThinkingProgress(listener: (data: { sessionId: string; agentId: string; progress: number }) => void): void {
    this.addEventListener('agent:thinking-progress', listener);
  }

  /**
   * 监听代理结果事件
   */
  onAgentResult(listener: (data: { sessionId: string; agentId: string; result: AgentResult }) => void): void {
    this.addEventListener('agent:result', listener);
  }

  /**
   * 监听代理错误事件
   */
  onAgentError(listener: (data: { sessionId: string; agentId: string; error: string }) => void): void {
    this.addEventListener('agent:error', listener);
  }

  /**
   * 监听系统通知事件
   */
  onSystemNotification(listener: (data: { type: 'info' | 'warning' | 'error'; message: string }) => void): void {
    this.addEventListener('system:notification', listener);
  }

  /**
   * 监听系统维护事件
   */
  onSystemMaintenance(listener: (data: { message: string; estimatedDuration?: number }) => void): void {
    this.addEventListener('system:maintenance', listener);
  }

  /**
   * 移除事件监听器
   */
  off(event: string, listener?: SocketEventListener): void {
    if (!this.socket) {
      return;
    }

    if (listener) {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.eventListeners.delete(event);
        }
      }
      this.socket.off(event as any, listener);
    } else {
      this.eventListeners.delete(event);
      this.socket.off(event as any);
    }
  }

  /**
   * 移除所有事件监听器
   */
  offAll(): void {
    if (!this.socket) {
      return;
    }

    this.eventListeners.forEach((listeners, event) => {
      this.socket!.off(event as any);
    });
    this.eventListeners.clear();
  }

  /**
   * 获取当前会话ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * 发送心跳
   */
  ping(): void {
    if (this.socket) {
      this.socket.emit('ping');
    }
  }

  /**
   * 添加事件监听器
   */
  private addEventListener(event: string, listener: SocketEventListener): void {
    if (!this.socket) {
      throw new Error('Socket未连接');
    }

    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(listener);
    this.socket.on(event as any, listener);
  }

  /**
   * 确保Socket已连接
   */
  private ensureConnected(): void {
    if (!this.socket || !this.isConnected()) {
      throw new Error('Socket未连接，请先调用connect()方法');
    }
  }

  /**
   * 设置事件转发
   */
  private setupEventForwarding(): void {
    if (!this.socket) {
      return;
    }

    // 转发连接状态事件到Vue应用
    this.socket.on('connect', () => {
      window.dispatchEvent(new CustomEvent('brainstorm-socket:connected'));
    });

    this.socket.on('disconnect', (reason: string) => {
      window.dispatchEvent(new CustomEvent('brainstorm-socket:disconnected', {
        detail: { reason }
      }));
    });

    this.socket.on('connect_error', (error: Error) => {
      window.dispatchEvent(new CustomEvent('brainstorm-socket:error', {
        detail: { error: error.message }
      }));
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      window.dispatchEvent(new CustomEvent('brainstorm-socket:reconnected', {
        detail: { attemptNumber }
      }));
    });
  }
}

// 创建全局头脑风暴Socket服务实例
export const brainstormSocketService = new BrainstormSocketService();