import { io, Socket } from 'socket.io-client';
import type {
    SocketConfig,
    SocketConnectionStatus,
    SocketInstance,
    SocketManager,
    BrainstormSocketEvents,
    ClientSocketEvents,
    SocketError,
    SocketConnectionInfo
} from '@/types/socket';

/**
 * Socket连接包装器
 */
class SocketWrapper implements SocketInstance {
    private socket: Socket;

    constructor(socket: Socket) {
        this.socket = socket;
    }

    get id(): string {
        return this.socket.id || '';
    }

    get connected(): boolean {
        return this.socket.connected;
    }

    get disconnected(): boolean {
        return this.socket.disconnected;
    }

    connect(): void {
        this.socket.connect();
    }

    disconnect(): void {
        this.socket.disconnect();
    }

    on<K extends keyof BrainstormSocketEvents>(
        event: K,
        listener: BrainstormSocketEvents[K]
    ): void {
        this.socket.on(event as string, listener);
    }

    off<K extends keyof BrainstormSocketEvents>(
        event: K,
        listener?: BrainstormSocketEvents[K]
    ): void {
        if (listener) {
            this.socket.off(event as string, listener);
        } else {
            this.socket.off(event as string);
        }
    }

    once<K extends keyof BrainstormSocketEvents>(
        event: K,
        listener: BrainstormSocketEvents[K]
    ): void {
        this.socket.once(event as string, listener);
    }

    emit<K extends keyof ClientSocketEvents>(
        event: K,
        ...args: Parameters<ClientSocketEvents[K]>
    ): void {
        this.socket.emit(event as string, ...args);
    }

    join(room: string): void {
        this.socket.emit('room:join', { sessionId: room });
    }

    leave(room: string): void {
        this.socket.emit('room:leave', { sessionId: room });
    }

    // 获取原始socket实例（用于高级操作）
    getRawSocket(): Socket {
        return this.socket;
    }
}

/**
 * Socket连接管理器
 */
class SocketServiceManager implements SocketManager {
    private sockets: Map<string, SocketWrapper> = new Map();
    private config: Required<SocketConfig>;
    private globalListeners: Array<(event: string, ...args: any[]) => void> = [];

    constructor(config: SocketConfig = {}) {
        this.config = {
            url: config.url || (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'),
            namespace: config.namespace || '/',
            autoConnect: config.autoConnect ?? true,
            reconnection: config.reconnection ?? true,
            reconnectionAttempts: config.reconnectionAttempts ?? 5,
            reconnectionDelay: config.reconnectionDelay ?? 1000,
            timeout: config.timeout ?? 20000,
        };
    }

    /**
     * 连接到指定命名空间
     */
    async connect(namespace: string = this.config.namespace): Promise<SocketWrapper> {
        if (this.sockets.has(namespace)) {
            const existingSocket = this.sockets.get(namespace)!;
            if (existingSocket.connected) {
                return existingSocket;
            }
        }

        const socketUrl = `${this.config.url}${namespace}`;

        const socket = io(socketUrl, {
            autoConnect: this.config.autoConnect,
            reconnection: this.config.reconnection,
            reconnectionAttempts: this.config.reconnectionAttempts,
            reconnectionDelay: this.config.reconnectionDelay,
            timeout: this.config.timeout,
            auth: {
                token: localStorage.getItem('token'),
            },
        });

        const wrapper = new SocketWrapper(socket);
        this.sockets.set(namespace, wrapper);

        // 设置基础事件监听器
        this.setupBaseListeners(wrapper, namespace);

        // 如果需要自动连接，等待连接完成
        if (this.config.autoConnect) {
            await this.waitForConnection(wrapper);
        }

        return wrapper;
    }

    /**
     * 断开指定命名空间的连接
     */
    disconnect(namespace: string = this.config.namespace): void {
        const socket = this.sockets.get(namespace);
        if (socket) {
            socket.disconnect();
            this.sockets.delete(namespace);
        }
    }

    /**
     * 断开所有连接
     */
    disconnectAll(): void {
        this.sockets.forEach((socket, namespace) => {
            socket.disconnect();
        });
        this.sockets.clear();
    }

    /**
     * 获取指定命名空间的socket
     */
    getSocket(namespace: string = this.config.namespace): SocketWrapper | null {
        return this.sockets.get(namespace) || null;
    }

    /**
     * 检查指定命名空间是否已连接
     */
    isConnected(namespace: string = this.config.namespace): boolean {
        const socket = this.sockets.get(namespace);
        return socket ? socket.connected : false;
    }

    /**
     * 获取连接状态
     */
    getConnectionStatus(namespace: string = this.config.namespace): SocketConnectionStatus {
        const socket = this.sockets.get(namespace);
        if (!socket) {
            return 'disconnected';
        }

        const rawSocket = socket.getRawSocket();
        if (rawSocket.connected) {
            return 'connected';
        } else if (rawSocket.connecting) {
            return 'connecting';
        } else {
            return 'disconnected';
        }
    }

    /**
     * 监听所有事件
     */
    onAny(listener: (event: string, ...args: any[]) => void): void {
        this.globalListeners.push(listener);
        this.sockets.forEach(socket => {
            socket.getRawSocket().onAny(listener);
        });
    }

    /**
     * 移除全局事件监听器
     */
    offAny(listener?: (event: string, ...args: any[]) => void): void {
        if (listener) {
            const index = this.globalListeners.indexOf(listener);
            if (index > -1) {
                this.globalListeners.splice(index, 1);
            }
            this.sockets.forEach(socket => {
                socket.getRawSocket().offAny(listener);
            });
        } else {
            this.globalListeners = [];
            this.sockets.forEach(socket => {
                socket.getRawSocket().offAny();
            });
        }
    }

    /**
     * 获取所有连接信息
     */
    getConnectionsInfo(): SocketConnectionInfo[] {
        return Array.from(this.sockets.entries()).map(([namespace, socket]) => ({
            id: socket.id,
            connected: socket.connected,
            transport: socket.getRawSocket().io.engine?.transport?.name || 'unknown',
            namespace,
            userId: this.getUserId(),
            sessionId: this.getCurrentSessionId(),
        }));
    }

    /**
     * 设置基础事件监听器
     */
    private setupBaseListeners(socket: SocketWrapper, namespace: string): void {
        const rawSocket = socket.getRawSocket();

        rawSocket.on('connect', () => {
            console.log(`Socket连接成功: ${namespace}`);
            this.handleConnectionSuccess(socket, namespace);
        });

        rawSocket.on('disconnect', (reason: string) => {
            console.log(`Socket断开连接: ${namespace}, 原因: ${reason}`);
            this.handleDisconnection(socket, namespace, reason);
        });

        rawSocket.on('connect_error', (error: Error) => {
            console.error(`Socket连接错误: ${namespace}`, error);
            this.handleConnectionError(socket, namespace, error);
        });

        rawSocket.on('reconnect', (attemptNumber: number) => {
            console.log(`Socket重连成功: ${namespace}, 尝试次数: ${attemptNumber}`);
            this.handleReconnection(socket, namespace, attemptNumber);
        });

        rawSocket.on('reconnect_attempt', (attemptNumber: number) => {
            console.log(`Socket重连尝试: ${namespace}, 第${attemptNumber}次`);
        });

        rawSocket.on('reconnect_error', (error: Error) => {
            console.error(`Socket重连错误: ${namespace}`, error);
        });

        rawSocket.on('reconnect_failed', () => {
            console.error(`Socket重连失败: ${namespace}`);
            this.handleReconnectionFailed(socket, namespace);
        });

        // 应用全局监听器
        this.globalListeners.forEach(listener => {
            rawSocket.onAny(listener);
        });
    }

    /**
     * 等待连接完成
     */
    private waitForConnection(socket: SocketWrapper): Promise<void> {
        return new Promise((resolve, reject) => {
            if (socket.connected) {
                resolve();
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Socket连接超时'));
            }, this.config.timeout);

            socket.once('connect', () => {
                clearTimeout(timeout);
                resolve();
            });

            socket.once('connect_error', (error: Error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    /**
     * 处理连接成功
     */
    private handleConnectionSuccess(socket: SocketWrapper, namespace: string): void {
        // 更新认证token
        const token = localStorage.getItem('token');
        if (token) {
            socket.getRawSocket().auth = { token };
        }

        // 触发全局连接成功事件
        window.dispatchEvent(new CustomEvent('socket:connected', {
            detail: { namespace, socketId: socket.id }
        }));
    }

    /**
     * 处理断开连接
     */
    private handleDisconnection(socket: SocketWrapper, namespace: string, reason: string): void {
        // 触发全局断开连接事件
        window.dispatchEvent(new CustomEvent('socket:disconnected', {
            detail: { namespace, reason }
        }));
    }

    /**
     * 处理连接错误
     */
    private handleConnectionError(socket: SocketWrapper, namespace: string, error: Error): void {
        // 如果是认证错误，清除token并重定向
        if (error.message.includes('Authentication')) {
            localStorage.removeItem('token');
            window.dispatchEvent(new CustomEvent('auth:expired'));
        }

        // 触发全局连接错误事件
        window.dispatchEvent(new CustomEvent('socket:error', {
            detail: { namespace, error: error.message }
        }));
    }

    /**
     * 处理重连成功
     */
    private handleReconnection(socket: SocketWrapper, namespace: string, attemptNumber: number): void {
        // 触发全局重连成功事件
        window.dispatchEvent(new CustomEvent('socket:reconnected', {
            detail: { namespace, attemptNumber }
        }));
    }

    /**
     * 处理重连失败
     */
    private handleReconnectionFailed(socket: SocketWrapper, namespace: string): void {
        // 触发全局重连失败事件
        window.dispatchEvent(new CustomEvent('socket:reconnection-failed', {
            detail: { namespace }
        }));
    }

    /**
     * 获取当前用户ID
     */
    private getUserId(): string | undefined {
        // 从token或其他地方获取用户ID
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.userId;
            } catch {
                return undefined;
            }
        }
        return undefined;
    }

    /**
     * 获取当前会话ID
     */
    private getCurrentSessionId(): string | undefined {
        // 从路由或状态管理中获取当前会话ID
        const path = window.location.pathname;
        const match = path.match(/\/brainstorm\/([^\/]+)/);
        return match ? match[1] : undefined;
    }
}

// 创建全局Socket服务实例
export const socketService = new SocketServiceManager();

// 导出类型和服务
export { SocketServiceManager };
export type { SocketWrapper };