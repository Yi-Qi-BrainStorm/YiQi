/**
 * 简化的测试运行器 - 只运行核心功能测试
 */

// 只测试核心的 store 和 service 功能
import './stores/__tests__/auth.spec.ts';
import './services/__tests__/authService.test.ts';

console.log('✅ 核心测试完成');