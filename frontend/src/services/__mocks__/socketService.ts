import { vi } from 'vitest';

/**
 * Socket服务的Mock实现
 */
export class MockSocketWrapper {
  private listeners: Map<string, Function[]> = new Map();
  private _connected = false;
  private _id = 'mock-socket-id';

  get id(): string {
    return this._id;
  }

  get connected(): boolean {
    return this._connected;
  }

  get disconnected(): boolean {
    return !this._connected;
  }

  connect(): void {
    this._connected = true;
    this.emit('connect');
  }

  disconnect(): void {
    this._connected = false;
    this.emit('disconnect');
  }

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  once(event: string, listener: Function): void {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  off(event: string, listener?: Function): void {
    if (!this.listeners.has(event)) return;
    
    if (listener) {
      const listeners = this.listeners.get(event)!;
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  emit(event: string, ...args: any[]): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error('Mock socket listener error:', error);
        }
      });
    }
  }

  join(room: string): void {
    this.emit('room:join', { sessionId: room });
  }

  leave(room: string): void {
    this.emit('room:leave', { sessionId: room });
  }

  getRawSocket(): any {
    return {
      id: this._id,
      connected: this._connected,
      disconnected: !this._connected,
      on: this.on.bind(this),
      once: this.once.bind(this),
      off: this.off.bind(this),
      emit: this.emit.bind(this),
      onAny: vi.fn(),
      offAny: vi.fn(),
      io: {
        engine: {
          transport: { name: 'websocket' }
        }
      }
    };
  }
}

export class MockSocketServiceManager {
  private sockets: Map<string, MockSocketWrapper> = new Map();
  private _isConnected = false;

  async connect(namespace: string = 'default'): Promise<MockSocketWrapper> {
    let socket = this.sockets.get(namespace);
    if (!socket) {
      socket = new MockSocketWrapper();
      this.sockets.set(namespace, socket);
    }
    
    socket.connect();
    this._isConnected = true;
    return socket;
  }

  async reconnect(namespace: string = 'default'): Promise<MockSocketWrapper> {
    return this.connect(namespace);
  }

  disconnect(namespace?: string): void {
    if (namespace) {
      const socket = this.sockets.get(namespace);
      if (socket) {
        socket.disconnect();
      }
    } else {
      this.sockets.forEach(socket => socket.disconnect());
      this._isConnected = false;
    }
  }

  isConnected(namespace: string = 'default'): boolean {
    const socket = this.sockets.get(namespace);
    return socket ? socket.connected : this._isConnected;
  }

  getSocket(namespace: string = 'default'): MockSocketWrapper | undefined {
    return this.sockets.get(namespace);
  }

  // 兼容性方法
  on(event: string, listener: Function): void {
    const defaultSocket = this.sockets.get('default');
    if (defaultSocket) {
      defaultSocket.on(event, listener);
    }
  }

  once(event: string, listener: Function): void {
    const defaultSocket = this.sockets.get('default');
    if (defaultSocket) {
      defaultSocket.once(event, listener);
    }
  }

  off(event: string, listener?: Function): void {
    const defaultSocket = this.sockets.get('default');
    if (defaultSocket) {
      defaultSocket.off(event, listener);
    }
  }

  emit(event: string, ...args: any[]): void {
    const defaultSocket = this.sockets.get('default');
    if (defaultSocket) {
      defaultSocket.emit(event, ...args);
    }
  }

  joinRoom(room: string): void {
    const defaultSocket = this.sockets.get('default');
    if (defaultSocket) {
      defaultSocket.join(room);
    }
  }

  leaveRoom(room: string): void {
    const defaultSocket = this.sockets.get('default');
    if (defaultSocket) {
      defaultSocket.leave(room);
    }
  }

  // 添加 waitForConnection 方法
  async waitForConnection(namespace: string = 'default'): Promise<void> {
    const socket = await this.connect(namespace);
    return Promise.resolve();
  }
}

// 导出mock实例
export const socketService = new MockSocketServiceManager();
export { MockSocketServiceManager as SocketServiceManager };
export { MockSocketWrapper as SocketWrapper };

// 为了兼容性，也导出一个简单的mock对象
export const mockSocket = {
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  once: vi.fn(),
  emit: vi.fn(),
  connected: true,
  id: 'mock-socket-id'
};