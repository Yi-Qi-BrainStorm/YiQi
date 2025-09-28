/**
 * 后端连接服务
 * 用于测试和验证与后端API的连接状态
 */

import { ApiService } from './api';
import { authService } from './authService';
import { agentService } from './agentService';
import { sessionService } from './sessionService';
import { aiInferenceService } from './aiInferenceService';

export interface ConnectionTestResult {
  service: string;
  status: 'success' | 'error';
  message: string;
  responseTime?: number;
  error?: any;
}

export class BackendConnectionService {
  /**
   * 测试基础API连接
   */
  static async testBasicConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // 先尝试用户端点（如果已登录）
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          await ApiService.get('/users/me');
          return {
            service: 'Basic API',
            status: 'success',
            message: '后端API连接正常（已认证）',
            responseTime: Date.now() - startTime
          };
        } catch (authError: any) {
          // 如果是401错误，说明后端可用但token无效
          if (authError.response?.status === 401) {
            return {
              service: 'Basic API',
              status: 'success',
              message: '后端API连接正常（需要重新登录）',
              responseTime: Date.now() - startTime
            };
          }
          throw authError;
        }
      }

      // 尝试健康检查端点
      try {
        await ApiService.get('/actuator/health');
        return {
          service: 'Basic API',
          status: 'success',
          message: '后端API连接正常',
          responseTime: Date.now() - startTime
        };
      } catch (healthError) {
        // 如果健康检查失败，尝试其他端点
        await ApiService.get('/api/agents/role-types');
        return {
          service: 'Basic API',
          status: 'success',
          message: '后端API连接正常',
          responseTime: Date.now() - startTime
        };
      }
    } catch (error: any) {
      return {
        service: 'Basic API',
        status: 'error',
        message: `连接失败: ${error.message}`,
        responseTime: Date.now() - startTime,
        error
      };
    }
  }

  /**
   * 测试认证服务
   */
  static async testAuthService(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // 尝试获取当前用户信息（如果已登录）
      const token = localStorage.getItem('auth_token');
      if (token) {
        await authService.getCurrentUser();
        return {
          service: 'Auth Service',
          status: 'success',
          message: '认证服务连接正常，用户已登录',
          responseTime: Date.now() - startTime
        };
      } else {
        return {
          service: 'Auth Service',
          status: 'success',
          message: '认证服务可用，用户未登录',
          responseTime: Date.now() - startTime
        };
      }
    } catch (error: any) {
      return {
        service: 'Auth Service',
        status: 'error',
        message: `认证服务测试失败: ${error.message}`,
        responseTime: Date.now() - startTime,
        error
      };
    }
  }

  /**
   * 测试代理服务
   */
  static async testAgentService(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // 测试获取角色类型（不需要认证）
      await agentService.getRoleTypes();

      return {
        service: 'Agent Service',
        status: 'success',
        message: '代理服务连接正常',
        responseTime: Date.now() - startTime
      };
    } catch (error: any) {
      // 如果角色类型接口失败，尝试获取代理列表
      try {
        await agentService.getAgents();
        return {
          service: 'Agent Service',
          status: 'success',
          message: '代理服务连接正常（需要认证）',
          responseTime: Date.now() - startTime
        };
      } catch (listError: any) {
        // 如果是401错误，说明服务可用但需要认证
        if (listError.response?.status === 401) {
          return {
            service: 'Agent Service',
            status: 'success',
            message: '代理服务可用（需要认证）',
            responseTime: Date.now() - startTime
          };
        }

        return {
          service: 'Agent Service',
          status: 'error',
          message: `代理服务测试失败: ${error.message}`,
          responseTime: Date.now() - startTime,
          error
        };
      }
    }
  }

  /**
   * 测试会话服务
   */
  static async testSessionService(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // 测试获取会话列表
      const brainstormService = await import('./brainstormService');
      await brainstormService.BrainstormService.getBrainstormSessions();

      return {
        service: 'Session Service',
        status: 'success',
        message: '会话服务连接正常',
        responseTime: Date.now() - startTime
      };
    } catch (error: any) {
      // 如果是401错误，说明服务可用但需要认证
      if (error.response?.status === 401) {
        return {
          service: 'Session Service',
          status: 'success',
          message: '会话服务可用（需要认证）',
          responseTime: Date.now() - startTime
        };
      }

      return {
        service: 'Session Service',
        status: 'error',
        message: `会话服务测试失败: ${error.message}`,
        responseTime: Date.now() - startTime,
        error
      };
    }
  }

  /**
   * 测试AI推理服务
   */
  static async testAIInferenceService(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      // 测试AI服务连接
      await aiInferenceService.testAIService();

      return {
        service: 'AI Inference Service',
        status: 'success',
        message: 'AI推理服务连接正常',
        responseTime: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        service: 'AI Inference Service',
        status: 'error',
        message: `AI推理服务测试失败: ${error.message}`,
        responseTime: Date.now() - startTime,
        error
      };
    }
  }

  /**
   * 运行所有连接测试
   */
  static async runAllTests(): Promise<ConnectionTestResult[]> {
    const tests = [
      this.testBasicConnection(),
      this.testAuthService(),
      this.testAgentService(),
      this.testSessionService(),
      this.testAIInferenceService()
    ];

    return await Promise.all(tests);
  }

  /**
   * 获取连接状态摘要
   */
  static async getConnectionSummary(): Promise<{
    totalTests: number;
    successfulTests: number;
    failedTests: number;
    averageResponseTime: number;
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  }> {
    const results = await this.runAllTests();

    const totalTests = results.length;
    const successfulTests = results.filter(r => r.status === 'success').length;
    const failedTests = totalTests - successfulTests;
    const averageResponseTime = results
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + (r.responseTime || 0), 0) / totalTests;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (successfulTests === totalTests) {
      overallStatus = 'healthy';
    } else if (successfulTests > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    return {
      totalTests,
      successfulTests,
      failedTests,
      averageResponseTime,
      overallStatus
    };
  }
}

export const backendConnectionService = BackendConnectionService;