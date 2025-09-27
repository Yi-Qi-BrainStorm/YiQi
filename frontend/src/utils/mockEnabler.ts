/**
 * Mock服务启用器
 * 用于在开发环境中启用Mock数据服务
 */

// 检查是否启用Mock服务
export function isMockEnabled(): boolean {
  // 在开发环境中默认启用Mock
  if (import.meta.env.DEV) {
    // 检查环境变量
    const mockEnabled = import.meta.env.VITE_ENABLE_MOCK;
    if (mockEnabled !== undefined) {
      return mockEnabled === 'true' || mockEnabled === '1';
    }
    
    // 检查localStorage设置
    const localSetting = localStorage.getItem('enableMock');
    if (localSetting !== null) {
      return localSetting === 'true';
    }
    
    // 默认在开发环境启用Mock
    return true;
  }
  
  // 生产环境默认不启用Mock
  return false;
}

// 启用Mock服务
export function enableMock(): void {
  localStorage.setItem('enableMock', 'true');
  console.log('✅ Mock服务已启用');
}

// 禁用Mock服务
export function disableMock(): void {
  localStorage.setItem('enableMock', 'false');
  console.log('❌ Mock服务已禁用');
}

// 切换Mock服务状态
export function toggleMock(): boolean {
  const currentState = isMockEnabled();
  if (currentState) {
    disableMock();
  } else {
    enableMock();
  }
  return !currentState;
}

// 获取Mock服务状态信息
export function getMockStatus() {
  const enabled = isMockEnabled();
  const envSetting = import.meta.env.VITE_ENABLE_MOCK;
  const localSetting = localStorage.getItem('enableMock');
  
  return {
    enabled,
    envSetting,
    localSetting,
    isDev: import.meta.env.DEV,
  };
}