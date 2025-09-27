import type { SocketConnectionStatus } from '@/types/socket';

/**
 * Socket连接工具函数
 */

/**
 * 格式化连接状态为用户友好的文本
 */
export function formatConnectionStatus(status: SocketConnectionStatus): string {
  const statusMap: Record<SocketConnectionStatus, string> = {
    disconnected: '已断开',
    connecting: '连接中',
    connected: '已连接',
    reconnecting: '重连中',
    error: '连接错误',
  };
  
  return statusMap[status] || '未知状态';
}

/**
 * 获取连接状态对应的颜色
 */
export function getConnectionStatusColor(status: SocketConnectionStatus): string {
  const colorMap: Record<SocketConnectionStatus, string> = {
    disconnected: '#ff4d4f',
    connecting: '#faad14',
    connected: '#52c41a',
    reconnecting: '#1890ff',
    error: '#ff4d4f',
  };
  
  return colorMap[status] || '#d9d9d9';
}

/**
 * 检查连接状态是否为活跃状态
 */
export function isActiveConnection(status: SocketConnectionStatus): boolean {
  return status === 'connected' || status === 'connecting' || status === 'reconnecting';
}

/**
 * 生成Socket房间名称
 */
export function generateRoomName(sessionId: string, type: 'session' | 'user' = 'session'): string {
  return `${type}:${sessionId}`;
}

/**
 * 解析Socket房间名称
 */
export function parseRoomName(roomName: string): { type: string; id: string } | null {
  const match = roomName.match(/^(\w+):(.+)$/);
  if (match) {
    return {
      type: match[1],
      id: match[2],
    };
  }
  return null;
}

/**
 * 创建重连延迟计算函数
 */
export function createReconnectDelay(baseDelay: number = 1000, maxDelay: number = 30000) {
  return (attemptNumber: number): number => {
    const delay = baseDelay * Math.pow(2, attemptNumber - 1);
    return Math.min(delay, maxDelay);
  };
}

/**
 * 创建Socket事件防抖函数
 */
export function debounceSocketEvent<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

/**
 * 创建Socket事件节流函数
 */
export function throttleSocketEvent<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T {
  let lastCall = 0;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}

/**
 * 验证Socket事件数据
 */
export function validateSocketEventData(data: any, requiredFields: string[]): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  return requiredFields.every(field => {
    const keys = field.split('.');
    let current = data;
    
    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return false;
      }
      current = current[key];
    }
    
    return true;
  });
}

/**
 * 创建Socket错误处理器
 */
export function createSocketErrorHandler(context: string) {
  return (error: Error | string) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    console.error(`Socket错误 [${context}]:`, errorMessage);
    
    // 触发全局错误事件
    window.dispatchEvent(new CustomEvent('socket:error', {
      detail: {
        context,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }
    }));
  };
}

/**
 * 创建Socket日志记录器
 */
export function createSocketLogger(namespace: string) {
  const isDevelopment = import.meta.env.DEV;
  
  return {
    info: (message: string, data?: any) => {
      if (isDevelopment) {
        console.log(`[Socket:${namespace}] ${message}`, data || '');
      }
    },
    
    warn: (message: string, data?: any) => {
      if (isDevelopment) {
        console.warn(`[Socket:${namespace}] ${message}`, data || '');
      }
    },
    
    error: (message: string, error?: any) => {
      console.error(`[Socket:${namespace}] ${message}`, error || '');
    },
    
    debug: (message: string, data?: any) => {
      if (isDevelopment) {
        console.debug(`[Socket:${namespace}] ${message}`, data || '');
      }
    },
  };
}

/**
 * 获取Socket连接质量指标
 */
export interface ConnectionQuality {
  latency: number;
  stability: 'excellent' | 'good' | 'fair' | 'poor';
  reconnectCount: number;
  uptime: number;
}

export function calculateConnectionQuality(
  latency: number,
  reconnectCount: number,
  uptime: number
): ConnectionQuality {
  let stability: ConnectionQuality['stability'];
  
  if (latency < 100 && reconnectCount === 0) {
    stability = 'excellent';
  } else if (latency < 300 && reconnectCount < 3) {
    stability = 'good';
  } else if (latency < 1000 && reconnectCount < 10) {
    stability = 'fair';
  } else {
    stability = 'poor';
  }
  
  return {
    latency,
    stability,
    reconnectCount,
    uptime,
  };
}