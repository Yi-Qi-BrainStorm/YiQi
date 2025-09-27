import { ApiService } from './api';
import { authService } from './authService';
import { agentService } from './agentService';
import { brainstormService } from './brainstormService';
import { socketService } from './socketService';
import { exportService } from './exportService';
import { notificationService } from './notificationService';
import { backendConnectionService } from './backendConnectionService';
import type { 
  User, 
  Agent, 
  BrainstormSession, 
  LoginCredentials, 
  RegisterData,
  AgentFormData,
  SessionCreateData 
} from '@/types';

/**
 * 集成服务 - 统一管理前后端API集成
 * 提供完整的用户流程支持和错误处理
 */
export class IntegrationService {
  private static instance: IntegrationService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): IntegrationService {
    if (!IntegrationService.instance) {
      IntegrationService.instance = new IntegrationService();
    }
    return IntegrationService.instance;
  }

  /**
   * 初始化集成服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('正在初始化集成服务...');

      // 1. 检查后端连接
      await this.checkBackendHealth();

      // 2. 初始化WebSocket连接
      await this.initializeWebSocket();

      // 3. 检查用户认证状态
      await this.checkAuthenticationStatus();

      // 4. 初始化通知服务
      notificationService.initialize();

      // 5. 启动后端健康检查
      backendConnectionService.startHealthCheck();

      this.isInitialized = true;
      console.log('集成服务初始化完成');

      // 发送初始化完成事件
      window.dispatchEvent(new CustomEvent('integration:initialized'));

    } catch (error) {
      console.error('集成服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 检查后端健康状态
   */
  private async checkBackendHealth(): Promise<void> {
    try {
      const isHealthy = await backendConnectionService.checkHealth();
      if (!isHealthy) {
        throw new Error('Backend service unavailable');
      }
      
      // 验证API端点
      const endpointStatus = await backendConnectionService.validateApiEndpoints();
      console.log('API端点状态:', endpointStatus);
      
      // 测试认证端点
      const authEndpointWorking = await backendConnectionService.testAuthEndpoints();
      if (!authEndpointWorking) {
        console.warn('认证端点可能存在问题');
      }
      
      console.log('后端服务连接正常');
    } catch (error) {
      console.error('后端服务连接失败:', error);
      notificationService.error('无法连接到服务器，请检查网络连接');
      throw new Error('Backend service unavailable');
    }
  }

  /**
   * 初始化WebSocket连接
   */
  private async initializeWebSocket(): Promise<void> {
    try {
      await socketService.connect();
      console.log('WebSocket连接已建立');
    } catch (error) {
      console.warn('WebSocket连接失败，将使用轮询模式:', error);
      // WebSocket失败不阻止应用启动，但会影响实时功能
    }
  }

  /**
   * 检查认证状态
   */
  private async checkAuthenticationStatus(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        await authService.getCurrentUser();
        console.log('用户认证状态有效');
      } catch (error) {
        console.log('用户认证状态无效，清除本地token');
        localStorage.removeItem('auth_token');
      }
    }
  }

  /**
   * 完整的用户注册流程
   */
  async registerUser(userData: RegisterData): Promise<User> {
    try {
      console.log('开始用户注册流程');
      
      // 1. 调用注册API
      const response = await authService.register(userData);
      
      // 2. 显示成功通知
      notificationService.success('注册成功！请登录您的账户');
      
      // 3. 记录用户行为
      this.trackUserAction('user_registered', { username: userData.username });
      
      return response.user;
    } catch (error: any) {
      console.error('用户注册失败:', error);
      notificationService.error(error.message || '注册失败，请重试');
      throw error;
    }
  }

  /**
   * 完整的用户登录流程
   */
  async loginUser(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      console.log('开始用户登录流程');
      
      // 1. 调用登录API
      const response = await authService.login(credentials);
      
      // 2. 存储认证token
      localStorage.setItem('auth_token', response.token);
      
      // 3. 初始化用户相关服务
      await this.initializeUserServices(response.user);
      
      // 4. 显示成功通知
      notificationService.success(`欢迎回来，${response.user.username}！`);
      
      // 5. 记录用户行为
      this.trackUserAction('user_logged_in', { userId: response.user.id });
      
      return response;
    } catch (error: any) {
      console.error('用户登录失败:', error);
      notificationService.error(error.message || '登录失败，请检查用户名和密码');
      throw error;
    }
  }

  /**
   * 初始化用户相关服务
   */
  private async initializeUserServices(user: User): Promise<void> {
    try {
      // 1. 重新连接WebSocket（带认证）
      await socketService.reconnect();
      
      // 2. 预加载用户数据
      await this.preloadUserData(user.id);
      
      console.log('用户服务初始化完成');
    } catch (error) {
      console.warn('用户服务初始化部分失败:', error);
      // 不阻止登录流程
    }
  }

  /**
   * 预加载用户数据
   */
  private async preloadUserData(userId: string): Promise<void> {
    try {
      // 并行加载用户的代理和会话历史
      await Promise.allSettled([
        agentService.getAgents(),
        brainstormService.getUserSessions(userId)
      ]);
    } catch (error) {
      console.warn('预加载用户数据失败:', error);
    }
  }

  /**
   * 完整的代理创建流程
   */
  async createAgent(agentData: AgentFormData): Promise<Agent> {
    try {
      console.log('开始创建代理流程');
      
      // 1. 验证代理数据
      this.validateAgentData(agentData);
      
      // 2. 调用创建API
      const agent = await agentService.createAgent(agentData);
      
      // 3. 显示成功通知
      notificationService.success(`代理 "${agent.name}" 创建成功！`);
      
      // 4. 记录用户行为
      this.trackUserAction('agent_created', { agentId: agent.id, agentName: agent.name });
      
      return agent;
    } catch (error: any) {
      console.error('创建代理失败:', error);
      notificationService.error(error.message || '创建代理失败，请重试');
      throw error;
    }
  }

  /**
   * 完整的头脑风暴会话创建流程
   */
  async createBrainstormSession(sessionData: SessionCreateData): Promise<BrainstormSession> {
    try {
      console.log('开始创建头脑风暴会话流程');
      
      // 1. 验证会话数据
      this.validateSessionData(sessionData);
      
      // 2. 检查代理可用性
      await this.checkAgentsAvailability(sessionData.agentIds);
      
      // 3. 创建会话
      const session = await brainstormService.createSession(sessionData.topic, sessionData.agentIds);
      
      // 4. 初始化WebSocket监听
      await this.setupSessionWebSocket(session.id);
      
      // 5. 显示成功通知
      notificationService.success('头脑风暴会话创建成功！');
      
      // 6. 记录用户行为
      this.trackUserAction('session_created', { 
        sessionId: session.id, 
        topic: sessionData.topic,
        agentCount: sessionData.agentIds.length 
      });
      
      return session;
    } catch (error: any) {
      console.error('创建头脑风暴会话失败:', error);
      notificationService.error(error.message || '创建会话失败，请重试');
      throw error;
    }
  }

  /**
   * 完整的会话导出流程
   */
  async exportSession(sessionId: string, format: 'pdf' | 'word' | 'html'): Promise<void> {
    try {
      console.log(`开始导出会话 ${sessionId} 为 ${format} 格式`);
      
      // 1. 获取会话数据
      const session = await brainstormService.getSession(sessionId);
      
      // 2. 检查会话完整性
      if (!session.finalReport) {
        throw new Error('会话尚未完成，无法导出');
      }
      
      // 3. 执行导出
      await exportService.exportSession(session, format);
      
      // 4. 显示成功通知
      notificationService.success(`会话报告已成功导出为 ${format.toUpperCase()} 格式`);
      
      // 5. 记录用户行为
      this.trackUserAction('session_exported', { sessionId, format });
      
    } catch (error: any) {
      console.error('导出会话失败:', error);
      notificationService.error(error.message || '导出失败，请重试');
      throw error;
    }
  }

  /**
   * 验证代理数据
   */
  private validateAgentData(agentData: AgentFormData): void {
    if (!agentData.name?.trim()) {
      throw new Error('代理名称不能为空');
    }
    if (!agentData.role?.trim()) {
      throw new Error('代理角色不能为空');
    }
    if (!agentData.systemPrompt?.trim()) {
      throw new Error('系统提示词不能为空');
    }
    if (!agentData.modelType) {
      throw new Error('请选择AI模型');
    }
  }

  /**
   * 验证会话数据
   */
  private validateSessionData(sessionData: SessionCreateData): void {
    if (!sessionData.topic?.trim()) {
      throw new Error('头脑风暴主题不能为空');
    }
    if (!sessionData.agentIds?.length) {
      throw new Error('请至少选择一个代理');
    }
    if (sessionData.agentIds.length > 10) {
      throw new Error('最多只能选择10个代理');
    }
  }

  /**
   * 检查代理可用性
   */
  private async checkAgentsAvailability(agentIds: string[]): Promise<void> {
    try {
      const agents = await agentService.getAgents();
      const availableAgentIds = agents.map(agent => agent.id);
      
      const unavailableAgents = agentIds.filter(id => !availableAgentIds.includes(id));
      if (unavailableAgents.length > 0) {
        throw new Error(`以下代理不可用: ${unavailableAgents.join(', ')}`);
      }
    } catch (error) {
      console.error('检查代理可用性失败:', error);
      throw error;
    }
  }

  /**
   * 设置会话WebSocket监听
   */
  private async setupSessionWebSocket(sessionId: string): Promise<void> {
    try {
      // 加入会话房间
      socketService.joinRoom(`session_${sessionId}`);
      
      // 设置会话相关事件监听
      socketService.on('agent_status_update', (data) => {
        console.log('代理状态更新:', data);
        window.dispatchEvent(new CustomEvent('brainstorm:agent-status', { detail: data }));
      });
      
      socketService.on('stage_complete', (data) => {
        console.log('阶段完成:', data);
        window.dispatchEvent(new CustomEvent('brainstorm:stage-complete', { detail: data }));
      });
      
      socketService.on('session_complete', (data) => {
        console.log('会话完成:', data);
        window.dispatchEvent(new CustomEvent('brainstorm:session-complete', { detail: data }));
        notificationService.success('头脑风暴会话已完成！');
      });
      
    } catch (error) {
      console.warn('设置会话WebSocket监听失败:', error);
    }
  }

  /**
   * 记录用户行为
   */
  private trackUserAction(action: string, data?: any): void {
    try {
      // 发送用户行为事件
      window.dispatchEvent(new CustomEvent('user:action', {
        detail: {
          action,
          data,
          timestamp: new Date().toISOString(),
        }
      }));
      
      // 可以在这里添加分析服务调用
      console.log('用户行为记录:', { action, data });
    } catch (error) {
      console.warn('记录用户行为失败:', error);
    }
  }

  /**
   * 处理全局错误
   */
  handleGlobalError(error: any, context?: string): void {
    console.error(`全局错误 ${context ? `(${context})` : ''}:`, error);
    
    // 根据错误类型显示不同的通知
    if (error.code === 'NETWORK_ERROR') {
      notificationService.error('网络连接失败，请检查网络设置');
    } else if (error.code === 'UNAUTHORIZED') {
      notificationService.error('登录已过期，请重新登录');
      // 触发登录过期处理
      window.dispatchEvent(new CustomEvent('auth:expired'));
    } else if (error.code === 'SERVER_ERROR') {
      notificationService.error('服务器暂时不可用，请稍后重试');
    } else {
      notificationService.error(error.message || '操作失败，请重试');
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    try {
      console.log('正在清理集成服务资源...');
      
      // 断开WebSocket连接
      socketService.disconnect();
      
      // 清理本地存储
      localStorage.removeItem('auth_token');
      
      // 重置初始化状态
      this.isInitialized = false;
      
      console.log('集成服务资源清理完成');
    } catch (error) {
      console.error('清理集成服务资源失败:', error);
    }
  }

  /**
   * 获取系统状态
   */
  getSystemStatus(): {
    initialized: boolean;
    backendConnected: boolean;
    websocketConnected: boolean;
    authenticated: boolean;
    backendConnectionDetails?: any;
  } {
    const backendStatus = backendConnectionService.getConnectionStatus();
    
    return {
      initialized: this.isInitialized,
      backendConnected: backendStatus.connected,
      websocketConnected: socketService.isConnected(),
      authenticated: !!localStorage.getItem('auth_token'),
      backendConnectionDetails: backendStatus,
    };
  }

  /**
   * 测试完整系统连接
   */
  async testSystemConnection(): Promise<{
    backend: any;
    websocket: boolean;
    authentication: boolean;
    overall: boolean;
  }> {
    try {
      const [backendTest, websocketTest] = await Promise.allSettled([
        backendConnectionService.testConnection(),
        this.testWebSocketConnection(),
      ]);

      const backend = backendTest.status === 'fulfilled' ? backendTest.value : null;
      const websocket = websocketTest.status === 'fulfilled' ? websocketTest.value : false;
      const authentication = await this.testAuthentication();

      const overall = !!(backend?.health && websocket && authentication);

      return {
        backend,
        websocket,
        authentication,
        overall,
      };
    } catch (error) {
      console.error('系统连接测试失败:', error);
      return {
        backend: null,
        websocket: false,
        authentication: false,
        overall: false,
      };
    }
  }

  /**
   * 测试WebSocket连接
   */
  private async testWebSocketConnection(): Promise<boolean> {
    try {
      if (!socketService.isConnected()) {
        await socketService.connect();
      }
      return socketService.isConnected();
    } catch (error) {
      console.error('WebSocket连接测试失败:', error);
      return false;
    }
  }

  /**
   * 测试认证状态
   */
  private async testAuthentication(): Promise<boolean> {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;

    try {
      await authService.getCurrentUser();
      return true;
    } catch (error) {
      console.error('认证测试失败:', error);
      return false;
    }
  }
}

// 导出单例实例
export const integrationService = IntegrationService.getInstance();

// 类型定义
export interface SessionCreateData {
  topic: string;
  agentIds: string[];
}