/**
 * 认证状态修复工具
 */

export function clearInvalidAuthState() {
  // 清除可能存在的无效认证状态
  localStorage.removeItem('auth_token');
  console.log('已清除可能的无效认证状态');
}

export function hasValidAuthState(): boolean {
  const token = localStorage.getItem('auth_token');
  // 简单检查：如果token存在且不是空字符串
  return !!(token && token.trim().length > 0);
}

export function forceLogout() {
  localStorage.removeItem('auth_token');
  window.location.href = '/login';
}