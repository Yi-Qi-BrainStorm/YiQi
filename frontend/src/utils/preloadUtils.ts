/**
 * 预加载工具类
 * 实现智能预加载策略，提升用户体验
 */

interface PreloadOptions {
  priority?: 'high' | 'low'
  crossOrigin?: 'anonymous' | 'use-credentials'
  timeout?: number
}

interface RoutePreloadConfig {
  route: string
  condition?: () => boolean
  delay?: number
  priority?: 'high' | 'low'
}

class PreloadManager {
  private preloadedRoutes = new Set<string>()
  private preloadPromises = new Map<string, Promise<any>>()
  private observer?: IntersectionObserver

  constructor() {
    this.setupIntersectionObserver()
  }

  /**
   * 预加载路由组件
   */
  async preloadRoute(routeName: string, options: PreloadOptions = {}): Promise<void> {
    if (this.preloadedRoutes.has(routeName)) {
      return this.preloadPromises.get(routeName)
    }

    const { timeout = 5000 } = options

    const preloadPromise = this.createPreloadPromise(routeName, timeout)
    this.preloadPromises.set(routeName, preloadPromise)

    try {
      await preloadPromise
      this.preloadedRoutes.add(routeName)
    } catch (error) {
      console.warn(`预加载路由 ${routeName} 失败:`, error)
      this.preloadPromises.delete(routeName)
    }
  }

  /**
   * 批量预加载路由
   */
  async preloadRoutes(configs: RoutePreloadConfig[]): Promise<void> {
    const validConfigs = configs.filter(config => 
      !config.condition || config.condition()
    )

    const preloadTasks = validConfigs.map(async (config) => {
      if (config.delay) {
        await this.delay(config.delay)
      }
      return this.preloadRoute(config.route, { priority: config.priority })
    })

    await Promise.allSettled(preloadTasks)
  }

  /**
   * 预加载资源文件
   */
  preloadResource(url: string, type: 'script' | 'style' | 'image' | 'font', options: PreloadOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = url
      link.as = type

      if (options.crossOrigin) {
        link.crossOrigin = options.crossOrigin
      }

      if (type === 'font') {
        link.type = 'font/woff2'
        link.crossOrigin = 'anonymous'
      }

      link.onload = () => resolve()
      link.onerror = () => reject(new Error(`Failed to preload ${type}: ${url}`))

      document.head.appendChild(link)

      // 超时处理
      if (options.timeout) {
        setTimeout(() => {
          reject(new Error(`Preload timeout for ${type}: ${url}`))
        }, options.timeout)
      }
    })
  }

  /**
   * 智能预加载 - 基于用户行为预测
   */
  setupSmartPreload(): void {
    // 预加载常用路由
    this.preloadCommonRoutes()

    // 基于鼠标悬停预加载
    this.setupHoverPreload()

    // 基于滚动位置预加载
    this.setupScrollPreload()
  }

  /**
   * 预加载常用路由
   */
  private async preloadCommonRoutes(): Promise<void> {
    const commonRoutes: RoutePreloadConfig[] = [
      {
        route: 'dashboard',
        condition: () => this.isAuthenticated(),
        priority: 'high'
      },
      {
        route: 'agents',
        condition: () => this.isAuthenticated(),
        delay: 1000,
        priority: 'low'
      },
      {
        route: 'brainstorm',
        condition: () => this.isAuthenticated(),
        delay: 2000,
        priority: 'low'
      }
    ]

    await this.preloadRoutes(commonRoutes)
  }

  /**
   * 设置悬停预加载
   */
  private setupHoverPreload(): void {
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement
      const link = target.closest('a[data-preload]') as HTMLAnchorElement
      
      if (link && link.dataset.preload) {
        const routeName = link.dataset.preload
        this.preloadRoute(routeName, { priority: 'high' })
      }
    })
  }

  /**
   * 设置滚动预加载
   */
  private setupScrollPreload(): void {
    if (!this.observer) return

    // 观察带有预加载标记的元素
    const preloadElements = document.querySelectorAll('[data-scroll-preload]')
    preloadElements.forEach(element => {
      this.observer!.observe(element)
    })
  }

  /**
   * 设置交叉观察器
   */
  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement
            const routeName = element.dataset.scrollPreload
            if (routeName) {
              this.preloadRoute(routeName, { priority: 'low' })
              this.observer!.unobserve(element)
            }
          }
        })
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    )
  }

  /**
   * 创建预加载Promise
   */
  private createPreloadPromise(routeName: string, timeout: number): Promise<any> {
    const routeMap: Record<string, () => Promise<any>> = {
      'dashboard': () => import('@/views/dashboard/Dashboard.vue'),
      'agents': () => import('@/views/agents/AgentManagement.vue'),
      'agent-detail': () => import('@/views/agents/AgentDetail.vue'),
      'brainstorm': () => import('@/views/brainstorm/BrainstormSession.vue'),
      'brainstorm-history': () => import('@/views/brainstorm/BrainstormHistory.vue'),
      'brainstorm-results': () => import('@/views/brainstorm/BrainstormResults.vue'),
      'login': () => import('@/views/auth/Login.vue'),
      'register': () => import('@/views/auth/Register.vue'),
    }

    const importFn = routeMap[routeName]
    if (!importFn) {
      return Promise.reject(new Error(`Unknown route: ${routeName}`))
    }

    return Promise.race([
      importFn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Preload timeout')), timeout)
      )
    ])
  }

  /**
   * 检查用户是否已认证
   */
  private isAuthenticated(): boolean {
    // 简单检查，实际应该从store获取
    return !!localStorage.getItem('token')
  }

  /**
   * 延迟工具函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 清理资源
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = undefined
    }
    this.preloadedRoutes.clear()
    this.preloadPromises.clear()
  }
}

// 创建全局预加载管理器实例
export const preloadManager = new PreloadManager()

/**
 * 预加载指令 - 用于Vue组件
 */
export const vPreload = {
  mounted(el: HTMLElement, binding: { value: string | RoutePreloadConfig }) {
    if (typeof binding.value === 'string') {
      el.dataset.preload = binding.value
    } else {
      el.dataset.scrollPreload = binding.value.route
    }
  },
  unmounted(el: HTMLElement) {
    delete el.dataset.preload
    delete el.dataset.scrollPreload
  }
}

/**
 * 预加载Composable
 */
export function usePreload() {
  const preloadRoute = (routeName: string, options?: PreloadOptions) => {
    return preloadManager.preloadRoute(routeName, options)
  }

  const preloadRoutes = (configs: RoutePreloadConfig[]) => {
    return preloadManager.preloadRoutes(configs)
  }

  const preloadResource = (url: string, type: 'script' | 'style' | 'image' | 'font', options?: PreloadOptions) => {
    return preloadManager.preloadResource(url, type, options)
  }

  return {
    preloadRoute,
    preloadRoutes,
    preloadResource
  }
}

// 自动启动智能预加载
if (typeof window !== 'undefined') {
  // 页面加载完成后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      preloadManager.setupSmartPreload()
    })
  } else {
    preloadManager.setupSmartPreload()
  }
}