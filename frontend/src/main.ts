import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import router from './router'
import App from './App.vue'
import { useAuthStore } from '@/stores/auth'
import { AuthMonitor } from '@/utils/authUtils'
import { setupGlobalErrorHandler } from '@/services/errorHandler'
import { vPreload, preloadManager } from '@/utils/preloadUtils'
import { isMockEnabled } from '@/utils/mockEnabler'
import './utils/clearAuth' // 导入认证清除工具

import 'ant-design-vue/dist/reset.css'
import './styles/main.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Antd)

// 注册全局指令
app.directive('preload', vPreload)

// 设置全局错误处理
setupGlobalErrorHandler(app)

// 初始化认证状态
const initializeApp = async () => {
  // 检查并初始化Mock服务
  if (isMockEnabled()) {
    console.log('🔧 Mock服务已启用，使用模拟数据')
    // 动态导入Mock服务初始化
    try {
      const { initializeMockServices } = await import('@/services/__mocks__/mockDataService')
      await initializeMockServices()
      console.log('✅ Mock服务初始化完成')
    } catch (error) {
      console.warn('⚠️ Mock服务初始化失败:', error)
    }
  } else {
    console.log('🌐 使用真实API服务')
  }
  
  const authStore = useAuthStore()
  
  try {
    // 简单初始化，只从localStorage恢复token
    await authStore.initialize()
  } catch (error) {
    console.warn('初始化认证状态失败:', error)
  }
  
  // 启动智能预加载
  preloadManager.setupSmartPreload()
  
  // 挂载应用
  app.mount('#app')
}

// 启动应用
initializeApp()