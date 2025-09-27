import { useAuthStore } from '@/stores/auth'
import router from '@/router'

/**
 * JWT Token 工具类
 */
export class TokenUtils {
  /**
   * 解析JWT token获取payload
   */
  static parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('解析JWT token失败:', error)
      return null
    }
  }

  /**
   * 检查token是否过期
   */
  static isTokenExpired(token: string): boolean {
    const payload = this.parseJWT(token)
    if (!payload || !payload.exp) {
      return true
    }
    
    const currentTime = Math.floor(Date.now() / 1000)
    return payload.exp < currentTime
  }

  /**
   * 获取token剩余有效时间（秒）
   */
  static getTokenRemainingTime(token: string): number {
    const payload = this.parseJWT(token)
    if (!payload || !payload.exp) {
      return 0
    }
    
    const currentTime = Math.floor(Date.now() / 1000)
    return Math.max(0, payload.exp - currentTime)
  }

  /**
   * 检查token是否即将过期（默认5分钟内）
   */
  static isTokenExpiringSoon(token: string, thresholdMinutes: number = 5): boolean {
    const remainingTime = this.getTokenRemainingTime(token)
    return remainingTime > 0 && remainingTime < (thresholdMinutes * 60)
  }
}

/**
 * 认证状态监控器
 */
export class AuthMonitor {
  private static instance: AuthMonitor
  private checkInterval: number | null = null
  private readonly CHECK_INTERVAL = 60000 // 每分钟检查一次

  static getInstance(): AuthMonitor {
    if (!this.instance) {
      this.instance = new AuthMonitor()
    }
    return this.instance
  }

  /**
   * 开始监控认证状态
   */
  startMonitoring(): void {
    if (this.checkInterval) {
      return // 已经在监控中
    }

    this.checkInterval = window.setInterval(() => {
      this.checkAuthStatus()
    }, this.CHECK_INTERVAL)

    // 立即执行一次检查
    this.checkAuthStatus()
  }

  /**
   * 停止监控认证状态
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * 检查认证状态
   */
  private async checkAuthStatus(): Promise<void> {
    const authStore = useAuthStore()
    
    if (!authStore.token) {
      return
    }

    // 检查token是否过期
    if (TokenUtils.isTokenExpired(authStore.token)) {
      console.warn('Token已过期，自动登出')
      await this.handleTokenExpired()
      return
    }

    // 检查token是否即将过期
    if (TokenUtils.isTokenExpiringSoon(authStore.token)) {
      console.warn('Token即将过期，尝试刷新')
      await this.handleTokenExpiringSoon()
    }
  }

  /**
   * 处理token过期
   */
  private async handleTokenExpired(): Promise<void> {
    const authStore = useAuthStore()
    
    try {
      await authStore.logout()
      
      // 重定向到登录页面，保存当前路径用于登录后重定向
      const currentPath = router.currentRoute.value.fullPath
      if (currentPath !== '/login' && currentPath !== '/register') {
        await router.push({
          name: 'Login',
          query: { redirect: currentPath }
        })
      }
    } catch (error) {
      console.error('处理token过期失败:', error)
    }
  }

  /**
   * 处理token即将过期
   */
  private async handleTokenExpiringSoon(): Promise<void> {
    const authStore = useAuthStore()
    
    try {
      // 当前后端不支持token刷新，这里只是预留接口
      // 实际项目中可以调用刷新token的API
      await authStore.refreshToken()
    } catch (error) {
      console.warn('刷新token失败，将在过期后自动登出:', error)
    }
  }
}

/**
 * 路由重定向工具
 */
export class RedirectUtils {
  private static readonly REDIRECT_KEY = 'auth_redirect_path'

  /**
   * 保存重定向路径
   */
  static saveRedirectPath(path: string): void {
    if (path && path !== '/login' && path !== '/register') {
      sessionStorage.setItem(this.REDIRECT_KEY, path)
    }
  }

  /**
   * 获取并清除重定向路径
   */
  static getAndClearRedirectPath(): string {
    const path = sessionStorage.getItem(this.REDIRECT_KEY) || '/dashboard'
    sessionStorage.removeItem(this.REDIRECT_KEY)
    return path
  }

  /**
   * 清除重定向路径
   */
  static clearRedirectPath(): void {
    sessionStorage.removeItem(this.REDIRECT_KEY)
  }
}

/**
 * 权限检查工具
 */
export class PermissionUtils {
  /**
   * 检查用户是否有指定权限
   * 当前简化实现，后续可以根据实际需求扩展
   */
  static hasPermission(permission: string): boolean {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) {
      return false
    }

    // TODO: 实现基于角色的权限检查
    // const userPermissions = authStore.user?.permissions || []
    // return userPermissions.includes(permission)
    
    // 当前所有已认证用户都有权限
    return true
  }

  /**
   * 检查用户是否有任一指定权限
   */
  static hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission))
  }

  /**
   * 检查用户是否有所有指定权限
   */
  static hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission))
  }
}