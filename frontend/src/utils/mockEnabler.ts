/**
 * Mock数据启用器
 * 根据环境变量和后端连接状态决定是否启用Mock数据
 */

// 检查是否启用Mock模式
export function isMockEnabled(): boolean {
  // 1. 检查环境变量强制启用
  const envMockEnabled = import.meta.env.VITE_ENABLE_MOCK === 'true';
  if (envMockEnabled) {
    return true;
  }
  
  // 2. 检查localStorage设置（用于调试）
  const localMockEnabled = localStorage.getItem('enable_mock') === 'true';
  if (localMockEnabled) {
    return true;
  }
  
  // 3. 检查是否强制禁用Mock
  const envMockDisabled = import.meta.env.VITE_ENABLE_MOCK === 'false';
  const localMockDisabled = localStorage.getItem('enable_mock') === 'false';
  if (envMockDisabled || localMockDisabled) {
    return false;
  }
  
  // 4. 在开发模式下，默认启用Mock（可以通过后端连接状态动态调整）
  const isDev = import.meta.env.DEV;
  if (isDev) {
    return true;
  }
  
  return false;
}

// 动态切换Mock模式（用于调试）
export function toggleMockMode(): boolean {
  const currentState = localStorage.getItem('enable_mock');
  let newState: boolean;
  
  if (currentState === 'true') {
    newState = false;
    localStorage.setItem('enable_mock', 'false');
  } else if (currentState === 'false') {
    localStorage.removeItem('enable_mock'); // 移除设置，使用默认逻辑
    newState = isMockEnabled();
  } else {
    newState = true;
    localStorage.setItem('enable_mock', 'true');
  }
  
  console.log(`Mock mode ${newState ? 'enabled' : 'disabled'}`);
  return newState;
}

// 获取Mock状态信息
export async function getMockStatus(): Promise<{
  enabled: boolean;
  reason: string;
  backendConnected?: boolean;
}> {
  const envMockEnabled = import.meta.env.VITE_ENABLE_MOCK === 'true';
  const envMockDisabled = import.meta.env.VITE_ENABLE_MOCK === 'false';
  const localMockSetting = localStorage.getItem('enable_mock');
  const isDev = import.meta.env.DEV;
  
  if (envMockEnabled) {
    return { enabled: true, reason: 'Environment variable VITE_ENABLE_MOCK=true' };
  }
  
  if (envMockDisabled) {
    return { enabled: false, reason: 'Environment variable VITE_ENABLE_MOCK=false' };
  }
  
  if (localMockSetting === 'true') {
    return { enabled: true, reason: 'LocalStorage override (enable_mock=true)' };
  }
  
  if (localMockSetting === 'false') {
    return { enabled: false, reason: 'LocalStorage override (enable_mock=false)' };
  }
  
  if (isDev) {
    return {
      enabled: true,
      reason: 'Development mode (default enabled)',
    };
  }
  
  return { enabled: false, reason: 'Production mode' };
}