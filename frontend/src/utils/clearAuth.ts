/**
 * 清除认证状态的工具函数
 */

export function clearAllAuthData() {
  // 清除localStorage中的认证数据
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user')
  localStorage.removeItem('refresh_token')
  
  // 清除sessionStorage中的认证数据
  sessionStorage.removeItem('auth_token')
  sessionStorage.removeItem('user')
  
  console.log('所有认证数据已清除')
}

// 在开发环境中提供清除认证数据的全局方法
if (import.meta.env.DEV) {
  // 将清除方法挂载到window对象上，方便调试
  ;(window as any).clearAuth = clearAllAuthData
  
  // 检查是否需要清除认证数据
  const shouldClear = localStorage.getItem('dev_clear_auth')
  if (shouldClear === 'true') {
    clearAllAuthData()
    localStorage.removeItem('dev_clear_auth')
  }
}