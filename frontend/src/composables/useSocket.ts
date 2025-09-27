import { ref, computed, onMounted, onUnmounted } from 'vue';
import { socketService } from '@/services/socketService';
import { 
  formatConnectionStatus, 
  getConnectionStatusColor, 
  isActiveConnection,
  generateRoomName,
  createSocketErrorHandler,
  createSocketLogger
} from '@/utils/socketUtils';
import type { 
  SocketConnectionStatus, 
  SocketInstance, 
  BrainstormSocketEvents,
  ClientSocketEvents,
  SocketConnectionInfo
} from '@/types/socket';

/**
 * WebSocket通信相关的组合式函数
 * 提供Socket连接管理和事件监听，添加连接状态和错误处理
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export function useSocket(namespace: string = '/') {
  // 响应式状态
  const connectionStatus = ref<SocketConnectionStatus>('disconnected');
  const isConnected = ref(false);
  const isConnecting = ref(false);
  const error = ref<string | null>(null);
  const reconnectAttempts = ref(0);
  const latency = ref(0);
  const socketId = ref<string>('');
  
  // Socket实例
  let socketInstance: SocketInstance | null = null;
  
  // 日志记录器
  const logger = createSocketLogger(namespace);
  
  // 错误处理器
  const errorHandler = createSocketErrorHandler(`useSocket:${namespace}`);

  // 计算属性
  const connectionStatusText = computed(() => formatConnectionStatus(connectionStatus.value));
  const connectionStatusColor = computed(() => getConnectionStatusColor(connectionStatus.value));
  const isActiveConnection = computed(() => isActiveConnection(connectionStatus.value));
  const connectionInfo = computed((): SocketConnectionInfo | null => {
    if (!socketInstance) return null;
    
    return {
      id: socketInstance.id,
      connected: socketInstance.connected,
      transport: 'websocket', // 简化处理
      namespace,
      userId: getCurrentUserId(),
      sessionId: getCurrentSessionId(),
    };
  });

  /**
   * 连接到Socket服务器
   * Requirement 4.1: 建立WebSocket连接用于实时通信
   */
  const connect = async (): Promise<void> => {
    if (isConnected.value || isConnecting.value) {
      logger.warn('Socket已连接或正在连接中');
      return;
    }

    try {
      isConnecting.value = true;
      connectionStatus.value = 'connecting';
      error.value = null;
      
      logger.info('开始连接Socket服务器');
      
      socketInstance = await socketService.connect(namespace);
      
      if (socketInstance) {
        socketId.value = socketInstance.id;
        isConnected.value = true;
        isConnecting.value = false;
        connectionStatus.value = 'connected';
        
        // 设置基础事件监听器
        setupBaseListeners();
        
        logger.info('Socket连接成功', { socketId: socketId.value });
      }
    } catch (err: any) {
      isConnecting.value = false;
      connectionStatus.value = 'error';
      error.value = err.message || 'Socket连接失败';
      
      logger.error('Socket连接失败', err);
      errorHandler(err);
      
      throw err;
    }
  };

  /**
   * 断开Socket连接
   * Requirement 4.2: 管理WebSocket连接状态
   */
  const disconnect = (): void => {
    if (socketInstance) {
      logger.info('断开Socket连接');
      
      socketInstance.disconnect();
      socketInstance = null;
      
      isConnected.value = false;
      isConnecting.value = false;
      connectionStatus.value = 'disconnected';
      socketId.value = '';
      reconnectAttempts.value = 0;
      
      logger.info('Socket已断开');
    }
  };

  /**
   * 重新连接
   */
  const reconnect = async (): Promise<void> => {
    logger.info('尝试重新连接Socket');
    
    disconnect();
    await connect();
  };

  /**
   * 监听Socket事件
   * Requirement 4.3: 监听服务器端事件
   */
  const on = <K extends keyof BrainstormSocketEvents>(
    event: K,
    listener: BrainstormSocketEvents[K]
  ): void => {
    if (!socketInstance) {
      logger.warn(`尝试监听事件 ${event} 但Socket未连接`);
      return;
    }

    socketInstance.on(event, listener);
    logger.debug(`添加事件监听器: ${event}`);
  };

  /**
   * 移除Socket事件监听器
   */
  const off = <K extends keyof BrainstormSocketEvents>(
    event: K,
    listener?: BrainstormSocketEvents[K]
  ): void => {
    if (!socketInstance) {
      return;
    }

    socketInstance.off(event, listener);
    logger.debug(`移除事件监听器: ${event}`);
  };

  /**
   * 监听一次性事件
   */
  const once = <K extends keyof BrainstormSocketEvents>(
    event: K,
    listener: BrainstormSocketEvents[K]
  ): void => {
    if (!socketInstance) {
      logger.warn(`尝试监听一次性事件 ${event} 但Socket未连接`);
      return;
    }

    socketInstance.once(event, listener);
    logger.debug(`添加一次性事件监听器: ${event}`);
  };

  /**
   * 发送Socket事件
   * Requirement 4.4: 向服务器发送事件
   */
  const emit = <K extends keyof ClientSocketEvents>(
    event: K,
    ...args: Parameters<ClientSocketEvents[K]>
  ): void => {
    if (!socketInstance || !isConnected.value) {
      logger.warn(`尝试发送事件 ${event} 但Socket未连接`);
      error.value = 'Socket未连接，无法发送事件';
      return;
    }

    try {
      socketInstance.emit(event, ...args);
      logger.debug(`发送事件: ${event}`, args);
    } catch (err: any) {
      logger.error(`发送事件失败: ${event}`, err);
      errorHandler(err);
    }
  };

  /**
   * 加入房间
   * Requirement 4.1: 加入特定的Socket房间以接收相关事件
   */
  const joinRoom = (sessionId: number): void => {
    const roomName = generateRoomName(sessionId.toString(), 'session');
    
    if (!socketInstance || !isConnected.value) {
      logger.warn(`尝试加入房间 ${roomName} 但Socket未连接`);
      return;
    }

    socketInstance.join(roomName);
    logger.info(`加入房间: ${roomName}`);
  };

  /**
   * 离开房间
   */
  const leaveRoom = (sessionId: number): void => {
    const roomName = generateRoomName(sessionId.toString(), 'session');
    
    if (!socketInstance) {
      return;
    }

    socketInstance.leave(roomName);
    logger.info(`离开房间: ${roomName}`);
  };

  /**
   * 测量连接延迟
   */
  const measureLatency = (): Promise<number> => {
    return new Promise((resolve) => {
      if (!socketInstance || !isConnected.value) {
        resolve(-1);
        return;
      }

      const startTime = Date.now();
      
      socketInstance.once('pong', () => {
        const endTime = Date.now();
        const measuredLatency = endTime - startTime;
        latency.value = measuredLatency;
        resolve(measuredLatency);
      });

      socketInstance.emit('ping');
    });
  };

  /**
   * 设置基础事件监听器
   */
  const setupBaseListeners = (): void => {
    if (!socketInstance) return;

    // 连接事件
    socketInstance.on('connect', () => {
      isConnected.value = true;
      connectionStatus.value = 'connected';
      reconnectAttempts.value = 0;
      error.value = null;
      
      logger.info('Socket连接成功');
    });

    // 断开连接事件
    socketInstance.on('disconnect', (reason: string) => {
      isConnected.value = false;
      connectionStatus.value = 'disconnected';
      
      logger.warn('Socket断开连接', { reason });
    });

    // 连接错误事件
    socketInstance.on('connect_error', (err: Error) => {
      connectionStatus.value = 'error';
      error.value = err.message;
      
      logger.error('Socket连接错误', err);
      errorHandler(err);
    });

    // 重连事件
    socketInstance.on('reconnect', (attemptNumber: number) => {
      isConnected.value = true;
      connectionStatus.value = 'connected';
      reconnectAttempts.value = attemptNumber;
      error.value = null;
      
      logger.info('Socket重连成功', { attemptNumber });
    });

    // 重连尝试事件
    socketInstance.on('reconnect_attempt', (attemptNumber: number) => {
      connectionStatus.value = 'reconnecting';
      reconnectAttempts.value = attemptNumber;
      
      logger.info('Socket重连尝试', { attemptNumber });
    });

    // 重连错误事件
    socketInstance.on('reconnect_error', (err: Error) => {
      connectionStatus.value = 'error';
      error.value = err.message;
      
      logger.error('Socket重连错误', err);
    });

    // 重连失败事件
    socketInstance.on('reconnect_failed', () => {
      connectionStatus.value = 'error';
      error.value = 'Socket重连失败';
      
      logger.error('Socket重连失败');
    });
  };

  /**
   * 清除错误状态
   */
  const clearError = (): void => {
    error.value = null;
  };

  /**
   * 获取当前用户ID
   */
  const getCurrentUserId = (): string | undefined => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || payload.sub;
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  /**
   * 获取当前会话ID
   */
  const getCurrentSessionId = (): string | undefined => {
    const path = window.location.pathname;
    const match = path.match(/\/brainstorm\/([^\/]+)/);
    return match ? match[1] : undefined;
  };

  // 生命周期钩子
  onMounted(() => {
    // 组件挂载时不自动连接，由使用方决定何时连接
    logger.info('useSocket组合式函数已初始化');
  });

  onUnmounted(() => {
    // 组件卸载时断开连接
    if (socketInstance) {
      logger.info('组件卸载，断开Socket连接');
      disconnect();
    }
  });

  return {
    // 响应式状态
    connectionStatus: computed(() => connectionStatus.value),
    isConnected: computed(() => isConnected.value),
    isConnecting: computed(() => isConnecting.value),
    error: computed(() => error.value),
    reconnectAttempts: computed(() => reconnectAttempts.value),
    latency: computed(() => latency.value),
    socketId: computed(() => socketId.value),
    
    // 计算属性
    connectionStatusText,
    connectionStatusColor,
    isActiveConnection,
    connectionInfo,
    
    // 连接管理
    connect,
    disconnect,
    reconnect,
    
    // 事件管理
    on,
    off,
    once,
    emit,
    
    // 房间管理
    joinRoom,
    leaveRoom,
    
    // 工具函数
    measureLatency,
    clearError,
  };
}