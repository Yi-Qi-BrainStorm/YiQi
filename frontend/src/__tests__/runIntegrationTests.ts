import { frontendBackendIntegration } from '@/services/frontendBackendIntegration';
import { integrationValidator } from '@/utils/integrationValidator';
import { integrationTestRunner } from '@/services/integrationTestRunner';

/**
 * 运行完整的集成测试套件
 * 这个文件用于执行任务17.1的集成测试
 */
export async function runCompleteIntegrationTests(): Promise<{
  success: boolean;
  integrationResult: any;
  validationResult: any;
  testResult: any;
  report: string;
}> {
  console.log('🚀 开始执行完整的前后端集成测试...');
  
  let integrationResult: any = null;
  let validationResult: any = null;
  let testResult: any = null;
  let success = false;

  try {
    // 1. 执行前后端集成
    console.log('\n📡 步骤1: 执行前后端集成...');
    integrationResult = await frontendBackendIntegration.integrateAllModules();
    
    if (!integrationResult.success) {
      console.error('❌ 前后端集成失败');
      console.error('错误:', integrationResult.errors);
    } else {
      console.log('✅ 前后端集成成功');
    }

    // 2. 运行集成验证
    console.log('\n🔍 步骤2: 运行集成验证...');
    validationResult = await integrationValidator.validate();
    
    if (validationResult.overallStatus === 'CRITICAL') {
      console.error('❌ 集成验证发现关键问题');
    } else {
      console.log('✅ 集成验证完成');
    }

    // 3. 运行详细测试
    console.log('\n🧪 步骤3: 运行详细集成测试...');
    testResult = await integrationTestRunner.runFullIntegrationTests();
    
    if (testResult.failed > 0) {
      console.warn(`⚠️ 有 ${testResult.failed} 个测试失败`);
    } else {
      console.log('✅ 所有集成测试通过');
    }

    // 4. 判断整体成功状态
    success = integrationResult.success && 
              validationResult.overallStatus !== 'CRITICAL' && 
              testResult.failed === 0;

    // 5. 生成综合报告
    const report = generateComprehensiveReport(integrationResult, validationResult, testResult);
    
    console.log('\n📊 集成测试完成');
    console.log(`整体状态: ${success ? '✅ 成功' : '❌ 失败'}`);
    
    return {
      success,
      integrationResult,
      validationResult,
      testResult,
      report
    };

  } catch (error: any) {
    console.error('❌ 集成测试执行失败:', error);
    
    const errorReport = `
=== 集成测试执行失败 ===
错误: ${error.message}
时间: ${new Date().toISOString()}

集成结果: ${integrationResult ? '已完成' : '未完成'}
验证结果: ${validationResult ? '已完成' : '未完成'}  
测试结果: ${testResult ? '已完成' : '未完成'}
`;

    return {
      success: false,
      integrationResult,
      validationResult,
      testResult,
      report: errorReport
    };
  }
}

/**
 * 生成综合报告
 */
function generateComprehensiveReport(
  integrationResult: any,
  validationResult: any,
  testResult: any
): string {
  let report = '\n=== 前后端集成测试综合报告 ===\n';
  report += `生成时间: ${new Date().toISOString()}\n\n`;

  // 1. 集成结果
  if (integrationResult) {
    report += '=== 前后端集成结果 ===\n';
    report += `状态: ${integrationResult.success ? '✅ 成功' : '❌ 失败'}\n`;
    report += `错误数量: ${integrationResult.errors?.length || 0}\n`;
    
    if (integrationResult.errors?.length > 0) {
      report += '错误详情:\n';
      integrationResult.errors.forEach((error: string, index: number) => {
        report += `  ${index + 1}. ${error}\n`;
      });
    }
    report += '\n';
  }

  // 2. 验证结果
  if (validationResult) {
    report += '=== 集成验证结果 ===\n';
    report += `整体状态: ${validationResult.overallStatus}\n`;
    report += `总测试数: ${validationResult.summary.totalTests}\n`;
    report += `通过数: ${validationResult.summary.passedTests}\n`;
    report += `失败数: ${validationResult.summary.failedTests}\n`;
    report += `成功率: ${validationResult.summary.successRate.toFixed(1)}%\n`;
    
    report += '\n问题统计:\n';
    report += `  关键问题: ${validationResult.issues.critical}\n`;
    report += `  高优先级: ${validationResult.issues.high}\n`;
    report += `  中优先级: ${validationResult.issues.medium}\n`;
    report += `  低优先级: ${validationResult.issues.low}\n`;
    
    if (validationResult.recommendations?.length > 0) {
      report += '\n建议:\n';
      validationResult.recommendations.forEach((rec: string, index: number) => {
        report += `  ${index + 1}. ${rec}\n`;
      });
    }
    report += '\n';
  }

  // 3. 测试结果
  if (testResult) {
    report += '=== 详细测试结果 ===\n';
    report += `通过: ${testResult.passed} 个\n`;
    report += `失败: ${testResult.failed} 个\n`;
    report += `跳过: ${testResult.skipped} 个\n`;
    
    if (testResult.results?.length > 0) {
      report += '\n测试详情:\n';
      testResult.results.forEach((result: any) => {
        const status = result.status === 'passed' ? '✅' : 
                      result.status === 'failed' ? '❌' : '⏭️';
        report += `  ${status} ${result.name}`;
        
        if (result.duration) {
          report += ` (${result.duration}ms)`;
        }
        
        if (result.error) {
          report += `\n     错误: ${result.error}`;
        }
        
        report += '\n';
      });
    }
    report += '\n';
  }

  // 4. 总结
  report += '=== 总结 ===\n';
  
  const integrationSuccess = integrationResult?.success || false;
  const validationGood = validationResult?.overallStatus !== 'CRITICAL';
  const testsPass = (testResult?.failed || 1) === 0;
  
  const overallSuccess = integrationSuccess && validationGood && testsPass;
  
  report += `整体状态: ${overallSuccess ? '✅ 成功' : '❌ 需要修复'}\n`;
  
  if (!overallSuccess) {
    report += '\n需要关注的问题:\n';
    
    if (!integrationSuccess) {
      report += '  - 前后端集成存在问题\n';
    }
    
    if (!validationGood) {
      report += '  - 集成验证发现关键问题\n';
    }
    
    if (!testsPass) {
      report += '  - 部分集成测试失败\n';
    }
  }

  return report;
}

/**
 * 修复集成问题
 */
export async function fixIntegrationIssues(): Promise<{
  success: boolean;
  fixed: string[];
  remaining: string[];
}> {
  console.log('🔧 开始修复集成问题...');
  
  try {
    const result = await frontendBackendIntegration.fixIntegrationIssues();
    
    console.log(`✅ 修复完成: ${result.fixed.length} 个问题已修复`);
    if (result.remaining.length > 0) {
      console.log(`⚠️ 仍有 ${result.remaining.length} 个问题需要手动处理`);
    }
    
    return {
      success: result.remaining.length === 0,
      fixed: result.fixed,
      remaining: result.remaining
    };
    
  } catch (error: any) {
    console.error('❌ 修复集成问题失败:', error);
    return {
      success: false,
      fixed: [],
      remaining: [`修复过程失败: ${error.message}`]
    };
  }
}

/**
 * 清理集成测试资源
 */
export async function cleanupIntegrationTests(): Promise<void> {
  console.log('🧹 清理集成测试资源...');
  
  try {
    await integrationTestRunner.cleanup();
    await frontendBackendIntegration.cleanup();
    
    console.log('✅ 集成测试资源清理完成');
  } catch (error: any) {
    console.error('❌ 清理集成测试资源失败:', error);
  }
}

// 如果直接运行此文件，执行集成测试
if (import.meta.env.MODE === 'test') {
  runCompleteIntegrationTests()
    .then(result => {
      console.log('\n' + result.report);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('集成测试执行失败:', error);
      process.exit(1);
    });
}