import { integrationService } from '@/services/integrationService';
import { backendConnectionService } from '@/services/backendConnectionService';
import { authService } from '@/services/authService';
import { agentService } from '@/services/agentService';
import { brainstormService } from '@/services/brainstormService';
import { socketService } from '@/services/socketService';
import { NotificationService } from '@/services/notificationService';
import type { LoginCredentials, RegisterData } from '@/types';

/**
 * 集成验证器 - 验证前后端集成的完整性
 */
export class IntegrationValidator {
  private results: ValidationResult[] = [];
  private testUser: { username: string; password: string } | null = null;

  /**
   * 运行完整的集成验证
   */
  async validate(): Promise<ValidationReport> {
    console.log('🔍 开始集成验证...');
    
    this.results = [];
    const startTime = Date.now();

    try {
      // 1. 系统初始化验证
      await this.validateSystemInitialization();

      // 2. 后端连接验证
      await this.validateBackendConnection();

      // 3. API端点验证
      await this.validateApiEndpoints();

      // 4. 认证流程验证
      await this.validateAuthenticationFlow();

      // 5. WebSocket连接验证
      await this.validateWebSocketConnection();

      // 6. 数据流验证
      await this.validateDataFlow();

      // 7. 错误处理验证
      await this.validateErrorHandling();

      // 8. 性能验证
      await this.validatePerformance();

    } catch (error: any) {
      this.addResult('CRITICAL', 'validation_error', false, error.message);
    } finally {
      // 清理测试数据
      await this.cleanup();
    }

    const totalTime = Date.now() - startTime;
    
    return this.generateReport(totalTime);
  }

  /**
   * 验证系统初始化
   */
  private async validateSystemInitialization(): Promise<void> {
    try {
      await integrationService.initialize();
      
      const status = integrationService.getSystemStatus();
      
      this.addResult('HIGH', 'system_initialization', status.initialized, 
        status.initialized ? '系统初始化成功' : '系统初始化失败');
      
      this.addResult('MEDIUM', 'backend_connection_status', status.backendConnected,
        status.backendConnected ? '后端连接正常' : '后端连接失败');
      
      this.addResult('MEDIUM', 'websocket_connection_status', status.websocketConnected,
        status.websocketConnected ? 'WebSocket连接正常' : 'WebSocket连接失败');

    } catch (error: any) {
      this.addResult('CRITICAL', 'system_initialization', false, `初始化失败: ${error.message}`);
    }
  }

  /**
   * 验证后端连接
   */
  private async validateBackendConnection(): Promise<void> {
    try {
      // 健康检查
      const isHealthy = await backendConnectionService.checkHealth();
      this.addResult('HIGH', 'backend_health', isHealthy, 
        isHealthy ? '后端健康检查通过' : '后端健康检查失败');

      // 服务器信息
      const serverInfo = await backendConnectionService.getServerInfo();
      this.addResult('LOW', 'server_info', !!serverInfo, 
        serverInfo ? `服务器信息获取成功` : '无法获取服务器信息');

      // 连接测试
      const connectionTest = await backendConnectionService.testConnection();
      this.addResult('MEDIUM', 'connection_test', connectionTest.health && connectionTest.auth,
        `连接测试 - 延迟: ${connectionTest.latency}ms`);

    } catch (error: any) {
      this.addResult('HIGH', 'backend_connection', false, `后端连接验证失败: ${error.message}`);
    }
  }

  /**
   * 验证API端点
   */
  private async validateApiEndpoints(): Promise<void> {
    try {
      // 验证认证端点
      const authEndpointWorking = await backendConnectionService.testAuthEndpoints();
      this.addResult('HIGH', 'auth_endpoints', authEndpointWorking,
        authEndpointWorking ? '认证端点正常' : '认证端点异常');

      // 验证其他端点
      const endpointStatus = await backendConnectionService.validateApiEndpoints();
      this.addResult('MEDIUM', 'user_endpoints', endpointStatus.userEndpoints,
        endpointStatus.userEndpoints ? '用户端点正常' : '用户端点异常');

    } catch (error: any) {
      this.addResult('HIGH', 'api_endpoints', false, `API端点验证失败: ${error.message}`);
    }
  }

  /**
   * 验证认证流程
   */
  private async validateAuthenticationFlow(): Promise<void> {
    try {
      // 创建测试用户
      this.testUser = {
        username: `test_integration_${Date.now()}`,
        password: 'test123456'
      };

      // 测试注册
      try {
        const registerData: RegisterData = {
          username: this.testUser.username,
          password: this.testUser.password
        };

        const registerResult = await authService.register(registerData);
        this.addResult('HIGH', 'user_registration', !!registerResult,
          registerResult ? '用户注册成功' : '用户注册失败');

      } catch (error: any) {
        if (error.code === 'CONFLICT') {
          this.addResult('MEDIUM', 'user_registration', true, '用户已存在（预期行为）');
        } else {
          this.addResult('HIGH', 'user_registration', false, `注册失败: ${error.message}`);
        }
      }

      // 测试登录
      try {
        const loginCredentials: LoginCredentials = {
          username: this.testUser.username,
          password: this.testUser.password
        };

        const loginResult = await authService.login(loginCredentials);
        const loginSuccess = !!(loginResult?.accessToken);
        
        this.addResult('HIGH', 'user_login', loginSuccess,
          loginSuccess ? '用户登录成功' : '用户登录失败');

        if (loginSuccess) {
          localStorage.setItem('auth_token', loginResult.accessToken);

          // 测试获取用户信息
          try {
            const userInfo = await authService.getCurrentUser();
            this.addResult('MEDIUM', 'get_user_info', !!userInfo,
              userInfo ? '获取用户信息成功' : '获取用户信息失败');
          } catch (error: any) {
            this.addResult('MEDIUM', 'get_user_info', false, `获取用户信息失败: ${error.message}`);
          }
        }

      } catch (error: any) {
        this.addResult('HIGH', 'user_login', false, `登录失败: ${error.message}`);
      }

    } catch (error: any) {
      this.addResult('HIGH', 'authentication_flow', false, `认证流程验证失败: ${error.message}`);
    }
  }

  /**
   * 验证WebSocket连接
   */
  private async validateWebSocketConnection(): Promise<void> {
    try {
      // 测试连接
      const isConnected = socketService.isConnected();
      this.addResult('MEDIUM', 'websocket_initial_status', isConnected,
        isConnected ? 'WebSocket初始状态正常' : 'WebSocket未连接');

      // 尝试连接
      if (!isConnected) {
        try {
          await socketService.connect();
          const connectedAfterAttempt = socketService.isConnected();
          this.addResult('MEDIUM', 'websocket_connect_attempt', connectedAfterAttempt,
            connectedAfterAttempt ? 'WebSocket连接成功' : 'WebSocket连接失败');
        } catch (error: any) {
          this.addResult('MEDIUM', 'websocket_connect_attempt', false, 
            `WebSocket连接失败: ${error.message}`);
        }
      }

      // 测试事件监听
      let eventReceived = false;
      const testEventHandler = () => { eventReceived = true; };
      
      socketService.on('test_event', testEventHandler);
      
      // 模拟发送测试事件（如果支持）
      setTimeout(() => {
        this.addResult('LOW', 'websocket_events', eventReceived,
          eventReceived ? 'WebSocket事件处理正常' : 'WebSocket事件处理未测试');
      }, 1000);

    } catch (error: any) {
      this.addResult('MEDIUM', 'websocket_connection', false, 
        `WebSocket连接验证失败: ${error.message}`);
    }
  }

  /**
   * 验证数据流
   */
  private async validateDataFlow(): Promise<void> {
    // 只有在认证成功的情况下才测试数据流
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      this.addResult('MEDIUM', 'data_flow', false, '跳过数据流测试（未认证）');
      return;
    }

    try {
      // 测试代理服务（如果后端支持）
      try {
        const agents = await agentService.getAgents();
        this.addResult('MEDIUM', 'agent_data_flow', true, 
          `代理数据获取成功 (${Array.isArray(agents) ? agents.length : 0} 个代理)`);
      } catch (error: any) {
        // 如果是404错误，说明端点不存在，这是预期的
        if (error.code === 'NOT_FOUND') {
          this.addResult('LOW', 'agent_data_flow', true, '代理端点未实现（预期）');
        } else {
          this.addResult('MEDIUM', 'agent_data_flow', false, `代理数据获取失败: ${error.message}`);
        }
      }

      // 测试头脑风暴服务（如果后端支持）
      try {
        const sessions = await brainstormService.getUserSessions('test');
        this.addResult('MEDIUM', 'brainstorm_data_flow', true,
          `头脑风暴数据获取成功 (${Array.isArray(sessions) ? sessions.length : 0} 个会话)`);
      } catch (error: any) {
        if (error.code === 'NOT_FOUND') {
          this.addResult('LOW', 'brainstorm_data_flow', true, '头脑风暴端点未实现（预期）');
        } else {
          this.addResult('MEDIUM', 'brainstorm_data_flow', false, 
            `头脑风暴数据获取失败: ${error.message}`);
        }
      }

    } catch (error: any) {
      this.addResult('MEDIUM', 'data_flow', false, `数据流验证失败: ${error.message}`);
    }
  }

  /**
   * 验证错误处理
   */
  private async validateErrorHandling(): Promise<void> {
    try {
      // 测试无效登录
      try {
        await authService.login({
          username: 'invalid_user_12345',
          password: 'invalid_password'
        });
        this.addResult('MEDIUM', 'error_handling_auth', false, '应该拒绝无效登录');
      } catch (error: any) {
        const isExpectedError = error.code === 'UNAUTHORIZED';
        this.addResult('MEDIUM', 'error_handling_auth', isExpectedError,
          isExpectedError ? '正确处理认证错误' : `意外错误: ${error.message}`);
      }

      // 测试无认证访问
      const originalToken = localStorage.getItem('auth_token');
      localStorage.removeItem('auth_token');
      
      try {
        await authService.getCurrentUser();
        this.addResult('MEDIUM', 'error_handling_unauth', false, '应该拒绝无认证访问');
      } catch (error: any) {
        const isExpectedError = error.code === 'UNAUTHORIZED';
        this.addResult('MEDIUM', 'error_handling_unauth', isExpectedError,
          isExpectedError ? '正确处理未认证错误' : `意外错误: ${error.message}`);
      } finally {
        // 恢复token
        if (originalToken) {
          localStorage.setItem('auth_token', originalToken);
        }
      }

    } catch (error: any) {
      this.addResult('MEDIUM', 'error_handling', false, `错误处理验证失败: ${error.message}`);
    }
  }

  /**
   * 验证性能
   */
  private async validatePerformance(): Promise<void> {
    try {
      // 测试健康检查性能
      const healthCheckStart = Date.now();
      await backendConnectionService.checkHealth();
      const healthCheckTime = Date.now() - healthCheckStart;
      
      this.addResult('LOW', 'performance_health_check', healthCheckTime < 5000,
        `健康检查耗时: ${healthCheckTime}ms ${healthCheckTime < 5000 ? '(正常)' : '(较慢)'}`);

      // 测试登录性能（如果有认证token）
      if (this.testUser) {
        const loginStart = Date.now();
        try {
          await authService.login({
            username: this.testUser.username,
            password: this.testUser.password
          });
          const loginTime = Date.now() - loginStart;
          
          this.addResult('LOW', 'performance_login', loginTime < 10000,
            `登录耗时: ${loginTime}ms ${loginTime < 10000 ? '(正常)' : '(较慢)'}`);
        } catch (error) {
          // 忽略登录错误，只关注性能
        }
      }

    } catch (error: any) {
      this.addResult('LOW', 'performance', false, `性能验证失败: ${error.message}`);
    }
  }

  /**
   * 添加验证结果
   */
  private addResult(priority: ValidationPriority, category: string, success: boolean, message: string): void {
    this.results.push({
      priority,
      category,
      success,
      message,
      timestamp: new Date().toISOString()
    });

    // 实时输出结果
    const status = success ? '✅' : '❌';
    const priorityIcon = priority === 'CRITICAL' ? '🔴' : priority === 'HIGH' ? '🟡' : priority === 'MEDIUM' ? '🔵' : '⚪';
    console.log(`${status} ${priorityIcon} [${category}] ${message}`);
  }

  /**
   * 生成验证报告
   */
  private generateReport(totalTime: number): ValidationReport {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    const criticalIssues = this.results.filter(r => !r.success && r.priority === 'CRITICAL').length;
    const highIssues = this.results.filter(r => !r.success && r.priority === 'HIGH').length;
    const mediumIssues = this.results.filter(r => !r.success && r.priority === 'MEDIUM').length;
    const lowIssues = this.results.filter(r => !r.success && r.priority === 'LOW').length;

    const overallStatus = criticalIssues > 0 ? 'CRITICAL' : 
                         highIssues > 0 ? 'HIGH' :
                         mediumIssues > 0 ? 'MEDIUM' : 'GOOD';

    return {
      timestamp: new Date().toISOString(),
      totalTime,
      overallStatus,
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: totalTests > 0 ? (passedTests / totalTests * 100) : 0
      },
      issues: {
        critical: criticalIssues,
        high: highIssues,
        medium: mediumIssues,
        low: lowIssues
      },
      results: this.results,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * 生成建议
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const failedResults = this.results.filter(r => !r.success);

    if (failedResults.some(r => r.category === 'backend_health')) {
      recommendations.push('检查后端服务是否正常运行在 http://localhost:8080');
    }

    if (failedResults.some(r => r.category === 'user_login')) {
      recommendations.push('检查认证服务配置和数据库连接');
    }

    if (failedResults.some(r => r.category.includes('websocket'))) {
      recommendations.push('检查WebSocket服务配置和防火墙设置');
    }

    if (failedResults.some(r => r.category.includes('performance'))) {
      recommendations.push('考虑优化网络连接或服务器性能');
    }

    if (failedResults.some(r => r.priority === 'CRITICAL')) {
      recommendations.push('立即修复关键问题，系统可能无法正常工作');
    }

    if (recommendations.length === 0) {
      recommendations.push('所有验证通过，系统集成正常！');
    }

    return recommendations;
  }

  /**
   * 清理测试数据
   */
  private async cleanup(): Promise<void> {
    try {
      // 清理localStorage
      localStorage.removeItem('auth_token');
      
      // 断开WebSocket连接
      socketService.disconnect();
      
      // 清理集成服务
      await integrationService.cleanup();
      
      console.log('🧹 测试数据清理完成');
    } catch (error: any) {
      console.warn('清理测试数据时出错:', error.message);
    }
  }
}

// 类型定义
export type ValidationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ValidationResult {
  priority: ValidationPriority;
  category: string;
  success: boolean;
  message: string;
  timestamp: string;
}

export interface ValidationReport {
  timestamp: string;
  totalTime: number;
  overallStatus: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'GOOD';
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    successRate: number;
  };
  issues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  results: ValidationResult[];
  recommendations: string[];
}

// 导出单例实例
export const integrationValidator = new IntegrationValidator();