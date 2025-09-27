import { ApiService } from './api';
import { NotificationService } from './notificationService';
import type { AppError } from './errorHandler';

/**
 * 后端连接服务 - 管理与后端API的连接和健康检查
 */
export class BackendConnectionService {
  private static instance: BackendConnectionService;
  private isConnected = false;
  private lastHealthCheck = 0;
  private healthCheckInterval = 30000; // 30秒
  private retryAttempts = 0;
  private maxRetryAttempts = 5;
  private retryDelay = 2000; // 2秒

  private constructor() {}

  static getInstance(): BackendConnectionService {
    if (!BackendConnectionService.instance) {
      BackendConnectionService.instance = new BackendConnectionService();
    }
    return BackendConnectionService.instance;
  }

  /**
   * 检查后端健康状态
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await ApiService.get('/actuator/health');
      
      // Spring Boot Actuator health endpoint 返回格式: { status: "UP" }
      if (response && (response.status === 'UP' || response === 'UP')) {
        this.isConnected = true;
        this.retryAttempts = 0;
        this.lastHealthCheck = Date.now();
        
        console.log('后端服务健康检查通过');
        return true;
      } else {
        throw new Error(`Backend health check failed: ${JSON.stringify(response)}`);
      }
    } catch (error: any) {
      this.isConnected = false;
      console.error('后端健康检查失败:', error);
      
      // 如果是网络错误，尝试重连
      if (this.shouldRetry(error)) {
        await this.attemptReconnection();
      }
      
      return false;
    }
  }

  /**
   * 尝试重新连接
   */
  private async attemptReconnection(): Promise<void> {
    if (this.retryAttempts >= this.maxRetryAttempts) {
      console.error('达到最大重试次数，停止重连');
      NotificationService.error('无法连接到服务器，请检查网络连接或联系技术支持');
      return;
    }

    this.retryAttempts++;
    console.log(`尝试重连后端服务 (${this.retryAttempts}/${this.maxRetryAttempts})`);

    await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.retryAttempts));

    try {
      await this.checkHealth();
      if (this.isConnected) {
        NotificationService.success('服务器连接已恢复');
        console.log('后端服务重连成功');
      }
    } catch (error) {
      console.error('重连失败:', error);
      // 继续重试
      await this.attemptReconnection();
    }
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: AppError): boolean {
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'SERVICE_UNAVAILABLE'];
    return retryableCodes.includes(error.code);
  }

  /**
   * 启动定期健康检查
   */
  startHealthCheck(): void {
    setInterval(async () => {
      if (Date.now() - this.lastHealthCheck > this.healthCheckInterval) {
        await this.checkHealth();
      }
    }, this.healthCheckInterval);
  }

  /**
   * 验证API端点可用性
   */
  async validateApiEndpoints(): Promise<{
    userEndpoints: boolean;
    agentEndpoints: boolean;
    brainstormEndpoints: boolean;
  }> {
    const results = {
      userEndpoints: false,
      agentEndpoints: false,
      brainstormEndpoints: false,
    };

    try {
      // 测试用户端点 - 使用无效凭据测试登录端点，期望得到401错误
      await ApiService.post('/users/login', {
        username: 'test_connection',
        password: 'invalid_password'
      });
      // 如果没有抛出错误，说明端点可能有问题
      results.userEndpoints = false;
    } catch (error: any) {
      // 如果得到401错误，说明端点正常工作
      if (error.code === 'UNAUTHORIZED' || error.message?.includes('401')) {
        results.userEndpoints = true;
      } else {
        console.warn('用户API端点测试失败:', error);
      }
    }

    // 注意：代理和头脑风暴端点需要认证，这里只做基础连接测试
    // 实际的端点验证会在用户登录后进行
    try {
      // 测试代理端点 - 不带认证访问，期望得到401错误
      await ApiService.get('/agents');
      results.agentEndpoints = false;
    } catch (error: any) {
      if (error.code === 'UNAUTHORIZED' || error.message?.includes('401')) {
        results.agentEndpoints = true;
      }
    }

    try {
      // 测试头脑风暴端点 - 不带认证访问，期望得到401错误
      await ApiService.get('/brainstorm/sessions');
      results.brainstormEndpoints = false;
    } catch (error: any) {
      if (error.code === 'UNAUTHORIZED' || error.message?.includes('401')) {
        results.brainstormEndpoints = true;
      }
    }

    return results;
  }

  /**
   * 测试认证端点
   */
  async testAuthEndpoints(): Promise<boolean> {
    try {
      // 使用无效凭据测试登录端点，期望得到401错误
      await ApiService.post('/users/login', {
        username: 'test_connection',
        password: 'invalid_password'
      });
      return false; // 不应该成功
    } catch (error: any) {
      // 如果得到401错误，说明端点正常工作
      if (error.code === 'UNAUTHORIZED') {
        console.log('认证端点工作正常');
        return true;
      }
      console.error('认证端点测试失败:', error);
      return false;
    }
  }

  /**
   * 获取后端服务信息
   */
  async getServerInfo(): Promise<{
    version?: string;
    environment?: string;
    timestamp?: string;
  }> {
    try {
      const response = await ApiService.get('/actuator/info');
      return {
        version: response.build?.version,
        environment: response.environment,
        timestamp: response.timestamp,
      };
    } catch (error) {
      console.warn('无法获取服务器信息:', error);
      return {};
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): {
    connected: boolean;
    lastHealthCheck: number;
    retryAttempts: number;
  } {
    return {
      connected: this.isConnected,
      lastHealthCheck: this.lastHealthCheck,
      retryAttempts: this.retryAttempts,
    };
  }

  /**
   * 手动触发连接测试
   */
  async testConnection(): Promise<{
    health: boolean;
    auth: boolean;
    serverInfo: any;
    latency: number;
  }> {
    const startTime = Date.now();
    
    const [health, auth, serverInfo] = await Promise.allSettled([
      this.checkHealth(),
      this.testAuthEndpoints(),
      this.getServerInfo(),
    ]);

    const latency = Date.now() - startTime;

    return {
      health: health.status === 'fulfilled' ? health.value : false,
      auth: auth.status === 'fulfilled' ? auth.value : false,
      serverInfo: serverInfo.status === 'fulfilled' ? serverInfo.value : {},
      latency,
    };
  }

  /**
   * 重置连接状态
   */
  reset(): void {
    this.isConnected = false;
    this.lastHealthCheck = 0;
    this.retryAttempts = 0;
  }
}

// 导出单例实例
export const backendConnectionService = BackendConnectionService.getInstance();