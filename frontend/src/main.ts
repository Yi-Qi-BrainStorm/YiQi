import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import router from './router'
import App from './App.vue'
import { useAuthStore } from '@/stores/auth'
import { AuthMonitor } from '@/utils/authUtils'
import { setupGlobalErrorHandler } from '@/services/errorHandler'
import { vPreload, preloadManager } from '@/utils/preloadUtils'

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
  const authStore = useAuthStore()
  
  try {
    // 如果本地存储中有token，尝试验证并获取用户信息
    await authStore.initialize()
    
    // 如果用户已认证，开始监控认证状态
    if (authStore.isAuthenticated) {
      AuthMonitor.getInstance().startMonitoring()
    }
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