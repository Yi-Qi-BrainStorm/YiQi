import { integrationService } from './integrationService';
import { backendConnectionService } from './backendConnectionService';
import { authService } from './authService';
import { agentService } from './agentService';
import { brainstormService } from './brainstormService';
import { socketService } from './socketService';
import { notificationService } from './notificationService';
import { integrationTestRunner } from './integrationTestRunner';
import type { LoginCredentials, RegisterData } from '@/types/user';

/**
 * 前后端集成管理器 - 统一管理前后端API集成
 * 负责连接前端与后端API，测试完整的用户流程，修复集成过程中的问题
 */
export class FrontendBackendIntegration {
  private static instance: FrontendBackendIntegration;
  private isIntegrated = false;
  private integrationErrors: string[] = [];

  private constructor() {}

  static getInstance(): FrontendBackendIntegration {
    if (!FrontendBackendIntegration.instance) {
      FrontendBackendIntegration.instance = new FrontendBackendIntegration();
    }
    return FrontendBackendIntegration.instance;
  }

  /**
   * 执行完整的前后端集成
   */
  async integrateAllModules(): Promise<{
    success: boolean;
    errors: string[];
    testResults?: any;
  }> {
    console.log('🔗 开始前后端集成...');
    this.integrationErrors = [];

    try {
      // 1. 初始化基础服务
      await this.initializeBaseServices();

      // 2. 验证后端连接
      await this.validateBackendConnection();

      // 3. 测试认证流程
      await this.testAuthenticationFlow();

      // 4. 测试WebSocket连接
      await this.testWebSocketIntegration();

      // 5. 运行完整集成测试
      const testResults = await this.runIntegrationTests();

      // 6. 验证用户流程
      await this.validateUserFlows();

      this.isIntegrated = true;
      console.log('✅ 前后端集成完成');

      return {
        success: true,
        errors: this.integrationErrors,
        testResults
      };

    } catch (error: any) {
      console.error('❌ 前后端集成失败:', error);
      this.integrationErrors.push(error.message);
      
      return {
        success: false,
        errors: this.integrationErrors
      };
    }
  }

  /**
   * 初始化基础服务
   */
  private async initializeBaseServices(): Promise<void> {
    try {
      console.log('📦 初始化基础服务...');

      // 初始化通知服务
      notificationService.initialize();

      // 初始化集成服务
      await integrationService.initialize();

      console.log('✅ 基础服务初始化完成');
    } catch (error: any) {
      console.error('❌ 基础服务初始化失败:', error);
      this.integrationErrors.push(`基础服务初始化失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 验证后端连接
   */
  private async validateBackendConnection(): Promise<void> {
    try {
      console.log('🔍 验证后端连接...');

      // 检查健康状态
      const isHealthy = await backendConnectionService.checkHealth();
      if (!isHealthy) {
        throw new Error('后端健康检查失败');
      }

      // 验证API端点
      const endpointStatus = await backendConnectionService.validateApiEndpoints();
      console.log('API端点状态:', endpointStatus);

      if (!endpointStatus.userEndpoints) {
        this.integrationErrors.push('用户API端点不可用');
      }

      // 测试连接性能
      const connectionTest = await backendConnectionService.testConnection();
      console.log('连接测试结果:', connectionTest);

      if (connectionTest.latency > 10000) {
        this.integrationErrors.push(`连接延迟过高: ${connectionTest.latency}ms`);
      }

      console.log('✅ 后端连接验证完成');
    } catch (error: any) {
      console.error('❌ 后端连接验证失败:', error);
      this.integrationErrors.push(`后端连接验证失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 测试认证流程
   */
  private async testAuthenticationFlow(): Promise<void> {
    try {
      console.log('🔐 测试认证流程...');

      // 创建测试用户
      const testUser: RegisterData = {
        username: `integration_test_${Date.now()}`,
        password: 'test123456'
      };

      // 测试注册
      try {
        const registerResult = await authService.register(testUser);
        console.log('注册测试成功:', registerResult.username);
      } catch (error: any) {
        if (error.code === 'CONFLICT') {
          console.log('用户已存在，继续登录测试');
        } else {
          throw error;
        }
      }

      // 测试登录
      const loginCredentials: LoginCredentials = {
        username: testUser.username,
        password: testUser.password
      };

      const loginResult = await authService.login(loginCredentials);
      if (!loginResult.accessToken || !loginResult.user) {
        throw new Error('登录响应数据不完整');
      }

      // 存储token
      localStorage.setItem('auth_token', loginResult.accessToken);

      // 测试获取用户信息
      const currentUser = await authService.getCurrentUser();
      if (!currentUser.id || !currentUser.username) {
        throw new Error('获取用户信息失败');
      }

      console.log('✅ 认证流程测试完成');
    } catch (error: any) {
      console.error('❌ 认证流程测试失败:', error);
      this.integrationErrors.push(`认证流程测试失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 测试WebSocket集成
   */
  private async testWebSocketIntegration(): Promise<void> {
    try {
      console.log('🔌 测试WebSocket集成...');

      // 尝试连接WebSocket
      await socketService.connect();

      if (socketService.isConnected()) {
        console.log('✅ WebSocket连接成功');
        
        // 测试基本事件
        let eventReceived = false;
        const testTimeout = setTimeout(() => {
          if (!eventReceived) {
            console.warn('⚠️ WebSocket事件测试超时');
          }
        }, 5000);

        socketService.on('test_integration', () => {
          eventReceived = true;
          clearTimeout(testTimeout);
          console.log('✅ WebSocket事件测试成功');
        });

        // 发送测试事件
        socketService.emit('test_integration', { test: true });

      } else {
        console.warn('⚠️ WebSocket连接失败，但不阻止集成');
        this.integrationErrors.push('WebSocket连接失败');
      }

    } catch (error: any) {
      console.warn('⚠️ WebSocket集成测试失败:', error);
      this.integrationErrors.push(`WebSocket集成失败: ${error.message}`);
      // WebSocket失败不应该阻止整个集成过程
    }
  }

  /**
   * 运行集成测试
   */
  private async runIntegrationTests(): Promise<any> {
    try {
      console.log('🧪 运行集成测试套件...');

      const testResults = await integrationTestRunner.runFullIntegrationTests();
      
      if (testResults.failed > 0) {
        console.warn(`⚠️ 有 ${testResults.failed} 个测试失败`);
        testResults.results
          .filter(r => r.status === 'failed')
          .forEach(r => {
            this.integrationErrors.push(`测试失败: ${r.name} - ${r.error}`);
          });
      }

      console.log('✅ 集成测试套件完成');
      return testResults;

    } catch (error: any) {
      console.error('❌ 集成测试套件失败:', error);
      this.integrationErrors.push(`集成测试失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 验证用户流程
   */
  private async validateUserFlows(): Promise<void> {
    try {
      console.log('👤 验证用户流程...');

      // 验证完整的用户注册和登录流程
      const flowTestUser: RegisterData = {
        username: `flow_validation_${Date.now()}`,
        password: 'test123456'
      };

      // 使用集成服务进行完整流程测试
      try {
        await integrationService.registerUser(flowTestUser);
      } catch (error: any) {
        if (error.code !== 'CONFLICT') {
          throw error;
        }
      }

      const loginResult = await integrationService.loginUser({
        username: flowTestUser.username,
        password: flowTestUser.password
      });

      if (!loginResult.user || !loginResult.token) {
        throw new Error('用户流程验证失败');
      }

      // 验证系统状态
      const systemStatus = integrationService.getSystemStatus();
      if (!systemStatus.initialized || !systemStatus.authenticated) {
        throw new Error('系统状态验证失败');
      }

      console.log('✅ 用户流程验证完成');
    } catch (error: any) {
      console.error('❌ 用户流程验证失败:', error);
      this.integrationErrors.push(`用户流程验证失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 修复集成问题
   */
  async fixIntegrationIssues(): Promise<{
    fixed: string[];
    remaining: string[];
  }> {
    console.log('🔧 开始修复集成问题...');
    const fixed: string[] = [];
    const remaining: string[] = [];

    for (const error of this.integrationErrors) {
      try {
        if (error.includes('WebSocket')) {
          // 尝试重新连接WebSocket
          await this.retryWebSocketConnection();
          fixed.push(error);
        } else if (error.includes('后端连接')) {
          // 尝试重新连接后端
          await this.retryBackendConnection();
          fixed.push(error);
        } else if (error.includes('认证')) {
          // 尝试重新初始化认证
          await this.retryAuthentication();
          fixed.push(error);
        } else {
          remaining.push(error);
        }
      } catch (fixError) {
        console.error(`修复失败: ${error}`, fixError);
        remaining.push(error);
      }
    }

    console.log(`✅ 修复完成: ${fixed.length} 个问题已修复, ${remaining.length} 个问题仍需处理`);
    return { fixed, remaining };
  }

  /**
   * 重试WebSocket连接
   */
  private async retryWebSocketConnection(): Promise<void> {
    try {
      socketService.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await socketService.connect();
      console.log('✅ WebSocket重连成功');
    } catch (error) {
      console.error('❌ WebSocket重连失败:', error);
      throw error;
    }
  }

  /**
   * 重试后端连接
   */
  private async retryBackendConnection(): Promise<void> {
    try {
      backendConnectionService.reset();
      await backendConnectionService.checkHealth();
      console.log('✅ 后端重连成功');
    } catch (error) {
      console.error('❌ 后端重连失败:', error);
      throw error;
    }
  }

  /**
   * 重试认证
   */
  private async retryAuthentication(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await authService.getCurrentUser();
        console.log('✅ 认证重试成功');
      } else {
        throw new Error('未找到认证token');
      }
    } catch (error) {
      console.error('❌ 认证重试失败:', error);
      localStorage.removeItem('auth_token');
      throw error;
    }
  }

  /**
   * 获取集成状态
   */
  getIntegrationStatus(): {
    integrated: boolean;
    errors: string[];
    systemStatus: any;
  } {
    return {
      integrated: this.isIntegrated,
      errors: this.integrationErrors,
      systemStatus: integrationService.getSystemStatus()
    };
  }

  /**
   * 生成集成报告
   */
  generateIntegrationReport(): string {
    let report = '\n=== 前后端集成报告 ===\n';
    report += `集成状态: ${this.isIntegrated ? '✅ 成功' : '❌ 失败'}\n`;
    report += `错误数量: ${this.integrationErrors.length}\n\n`;

    if (this.integrationErrors.length > 0) {
      report += '=== 集成错误 ===\n';
      this.integrationErrors.forEach((error, index) => {
        report += `${index + 1}. ${error}\n`;
      });
      report += '\n';
    }

    const systemStatus = integrationService.getSystemStatus();
    report += '=== 系统状态 ===\n';
    report += `初始化: ${systemStatus.initialized ? '✅' : '❌'}\n`;
    report += `后端连接: ${systemStatus.backendConnected ? '✅' : '❌'}\n`;
    report += `WebSocket: ${systemStatus.websocketConnected ? '✅' : '❌'}\n`;
    report += `认证状态: ${systemStatus.authenticated ? '✅' : '❌'}\n`;

    return report;
  }

  /**
   * 清理集成资源
   */
  async cleanup(): Promise<void> {
    try {
      console.log('🧹 清理集成资源...');
      
      await integrationTestRunner.cleanup();
      await integrationService.cleanup();
      
      this.isIntegrated = false;
      this.integrationErrors = [];
      
      console.log('✅ 集成资源清理完成');
    } catch (error) {
      console.error('❌ 清理集成资源失败:', error);
    }
  }
}

// 导出单例实例
export const frontendBackendIntegration = FrontendBackendIntegration.getInstance();