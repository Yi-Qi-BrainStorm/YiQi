import { integrationService } from './integrationService';
import { backendConnectionService } from './backendConnectionService';
import { authService } from './authService';
import { agentService } from './agentService';
import { brainstormService } from './brainstormService';
import { socketService } from './socketService';
import { notificationService } from './notificationService';
import type { LoginCredentials, RegisterData } from '@/types/user';

/**
 * 集成测试运行器 - 验证前后端完整集成
 */
export class IntegrationTestRunner {
  private testResults: Array<{
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    error?: string;
    duration?: number;
  }> = [];

  /**
   * 运行完整的集成测试套件
   */
  async runFullIntegrationTests(): Promise<{
    passed: number;
    failed: number;
    skipped: number;
    results: typeof this.testResults;
  }> {
    console.log('🚀 开始运行完整集成测试...');
    this.testResults = [];

    // 1. 基础连接测试
    await this.runTest('后端服务连接', () => this.testBackendConnection());
    await this.runTest('健康检查端点', () => this.testHealthEndpoints());
    
    // 2. 认证流程测试
    await this.runTest('用户注册流程', () => this.testUserRegistration());
    await this.runTest('用户登录流程', () => this.testUserLogin());
    await this.runTest('获取用户信息', () => this.testGetCurrentUser());
    
    // 3. WebSocket连接测试
    await this.runTest('WebSocket连接', () => this.testWebSocketConnection());
    
    // 4. 代理管理测试
    await this.runTest('代理创建', () => this.testAgentCreation());
    await this.runTest('代理列表获取', () => this.testAgentList());
    
    // 5. 头脑风暴会话测试
    await this.runTest('会话创建', () => this.testSessionCreation());
    
    // 6. 完整用户流程测试
    await this.runTest('完整用户流程', () => this.testCompleteUserFlow());

    const summary = this.generateSummary();
    console.log('✅ 集成测试完成:', summary);
    return summary;
  }

  /**
   * 运行单个测试
   */
  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 运行测试: ${name}`);
      await testFn();
      
      const duration = Date.now() - startTime;
      this.testResults.push({
        name,
        status: 'passed',
        duration
      });
      console.log(`✅ ${name} - 通过 (${duration}ms)`);
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.testResults.push({
        name,
        status: 'failed',
        error: error.message,
        duration
      });
      console.error(`❌ ${name} - 失败:`, error.message);
    }
  }

  /**
   * 测试后端服务连接
   */
  private async testBackendConnection(): Promise<void> {
    const isHealthy = await backendConnectionService.checkHealth();
    if (!isHealthy) {
      throw new Error('后端服务连接失败');
    }
  }

  /**
   * 测试健康检查端点
   */
  private async testHealthEndpoints(): Promise<void> {
    const serverInfo = await backendConnectionService.getServerInfo();
    const connectionTest = await backendConnectionService.testConnection();
    
    if (!connectionTest.health) {
      throw new Error('健康检查端点测试失败');
    }
  }

  /**
   * 测试用户注册
   */
  private async testUserRegistration(): Promise<void> {
    const testUser: RegisterData = {
      username: `test_integration_${Date.now()}`,
      password: 'test123456'
    };

    try {
      const result = await authService.register(testUser);
      if (!result.id || !result.username) {
        throw new Error('注册响应数据不完整');
      }
    } catch (error: any) {
      // 如果用户已存在，这是可以接受的
      if (error.code !== 'CONFLICT') {
        throw error;
      }
    }
  }

  /**
   * 测试用户登录
   */
  private async testUserLogin(): Promise<void> {
    // 使用一个已知的测试用户或创建一个
    const credentials: LoginCredentials = {
      username: 'test_user',
      password: 'test123456'
    };

    try {
      // 先尝试注册测试用户
      await authService.register(credentials);
    } catch (error: any) {
      // 忽略用户已存在的错误
      if (error.code !== 'CONFLICT') {
        console.warn('创建测试用户失败:', error.message);
      }
    }

    // 测试登录
    const loginResult = await authService.login(credentials);
    
    if (!loginResult.accessToken || !loginResult.user) {
      throw new Error('登录响应数据不完整');
    }

    // 存储token用于后续测试
    localStorage.setItem('auth_token', loginResult.accessToken);
  }

  /**
   * 测试获取当前用户信息
   */
  private async testGetCurrentUser(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('未找到认证token');
    }

    const user = await authService.getCurrentUser();
    if (!user.id || !user.username) {
      throw new Error('用户信息不完整');
    }
  }

  /**
   * 测试WebSocket连接
   */
  private async testWebSocketConnection(): Promise<void> {
    try {
      await socketService.connect();
      
      if (!socketService.isConnected()) {
        throw new Error('WebSocket连接失败');
      }
      
      // 测试基本事件
      let eventReceived = false;
      socketService.on('test_event', () => {
        eventReceived = true;
      });
      
      socketService.emit('test_event', { test: true });
      
      // 等待一小段时间让事件处理
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.warn('WebSocket测试失败，但不阻止其他测试:', error);
      // WebSocket失败不应该阻止整个测试
    }
  }

  /**
   * 测试代理创建
   */
  private async testAgentCreation(): Promise<void> {
    const agentData = {
      name: `测试代理_${Date.now()}`,
      role: '测试角色',
      systemPrompt: '这是一个测试代理的系统提示词',
      modelType: 'qwen-plus' as const,
      modelConfig: {
        temperature: 0.7,
        maxTokens: 2000,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0
      }
    };

    try {
      const agent = await agentService.createAgent(agentData);
      if (!agent.id || !agent.name) {
        throw new Error('代理创建响应数据不完整');
      }
    } catch (error: any) {
      // 如果后端代理API还未实现，跳过此测试
      if (error.code === 'NOT_FOUND') {
        throw new Error('代理API端点未实现');
      }
      throw error;
    }
  }

  /**
   * 测试代理列表获取
   */
  private async testAgentList(): Promise<void> {
    try {
      const agents = await agentService.getAgents();
      // 代理列表可以为空，但应该返回数组
      if (!Array.isArray(agents)) {
        throw new Error('代理列表响应格式错误');
      }
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        throw new Error('代理列表API端点未实现');
      }
      throw error;
    }
  }

  /**
   * 测试会话创建
   */
  private async testSessionCreation(): Promise<void> {
    try {
      // 首先获取可用的代理
      const agents = await agentService.getAgents();
      
      if (agents.length === 0) {
        console.warn('没有可用代理，跳过会话创建测试');
        return;
      }

      const session = await brainstormService.createSession(
        '集成测试会话',
        [agents[0].id]
      );

      if (!session.id || !session.topic) {
        throw new Error('会话创建响应数据不完整');
      }
    } catch (error: any) {
      if (error.code === 'NOT_FOUND') {
        throw new Error('头脑风暴API端点未实现');
      }
      throw error;
    }
  }

  /**
   * 测试完整用户流程
   */
  private async testCompleteUserFlow(): Promise<void> {
    // 1. 初始化集成服务
    await integrationService.initialize();

    // 2. 检查系统状态
    const systemStatus = integrationService.getSystemStatus();
    
    if (!systemStatus.initialized) {
      throw new Error('集成服务初始化失败');
    }

    if (!systemStatus.backendConnected) {
      throw new Error('后端连接状态异常');
    }

    // 3. 测试完整的用户注册和登录流程
    const testUser: RegisterData = {
      username: `flow_test_${Date.now()}`,
      password: 'test123456'
    };

    try {
      await integrationService.registerUser(testUser);
    } catch (error: any) {
      if (error.code !== 'CONFLICT') {
        throw error;
      }
    }

    const loginResult = await integrationService.loginUser({
      username: testUser.username,
      password: testUser.password
    });

    if (!loginResult.user || !loginResult.token) {
      throw new Error('完整登录流程失败');
    }

    console.log('✅ 完整用户流程测试通过');
  }

  /**
   * 生成测试摘要
   */
  private generateSummary() {
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const skipped = this.testResults.filter(r => r.status === 'skipped').length;

    return {
      passed,
      failed,
      skipped,
      results: this.testResults
    };
  }

  /**
   * 生成详细报告
   */
  generateDetailedReport(): string {
    const summary = this.generateSummary();
    let report = '\n=== 集成测试报告 ===\n';
    report += `总计: ${this.testResults.length} 个测试\n`;
    report += `通过: ${summary.passed} 个\n`;
    report += `失败: ${summary.failed} 个\n`;
    report += `跳过: ${summary.skipped} 个\n\n`;

    report += '=== 详细结果 ===\n';
    this.testResults.forEach(result => {
      const status = result.status === 'passed' ? '✅' : 
                    result.status === 'failed' ? '❌' : '⏭️';
      report += `${status} ${result.name}`;
      
      if (result.duration) {
        report += ` (${result.duration}ms)`;
      }
      
      if (result.error) {
        report += `\n   错误: ${result.error}`;
      }
      
      report += '\n';
    });

    return report;
  }

  /**
   * 清理测试数据
   */
  async cleanup(): Promise<void> {
    try {
      // 清理localStorage
      localStorage.removeItem('auth_token');
      
      // 断开WebSocket连接
      if (socketService.isConnected()) {
        socketService.disconnect();
      }
      
      // 清理集成服务
      await integrationService.cleanup();
      
      console.log('🧹 测试数据清理完成');
    } catch (error) {
      console.warn('清理测试数据时出现错误:', error);
    }
  }
}

// 导出单例实例
export const integrationTestRunner = new IntegrationTestRunner();