import type { Router } from 'vue-router'
import { ROUTES, ROUTE_NAMES } from '@/constants/routes'

/**
 * 导航工具类
 * 提供类型安全的路由导航方法
 */
export class NavigationUtils {
  private router: Router

  constructor(router: Router) {
    this.router = router
  }

  /**
   * 导航到仪表板
   */
  toDashboard() {
    return this.router.push(ROUTES.DASHBOARD)
  }

  /**
   * 导航到代理管理页面
   */
  toAgents() {
    return this.router.push(ROUTES.AGENTS)
  }

  /**
   * 导航到代理详情页面
   * @param agentId 代理ID
   */
  toAgentDetail(agentId: string) {
    return this.router.push({
      name: ROUTE_NAMES.AGENT_DETAIL,
      params: { id: agentId }
    })
  }

  /**
   * 导航到代理编辑页面
   * @param agentId 代理ID
   */
  toAgentEdit(agentId: string) {
    return this.router.push({
      name: ROUTE_NAMES.AGENT_EDIT,
      params: { id: agentId }
    })
  }

  /**
   * 导航到头脑风暴页面
   */
  toBrainstorm() {
    return this.router.push(ROUTES.BRAINSTORM)
  }

  /**
   * 导航到头脑风暴会话页面
   * @param sessionId 会话ID
   */
  toBrainstormSession(sessionId: string) {
    return this.router.push({
      name: ROUTE_NAMES.BRAINSTORM_SESSION,
      params: { id: sessionId }
    })
  }

  /**
   * 导航到头脑风暴结果页面
   * @param sessionId 会话ID
   */
  toBrainstormResults(sessionId: string) {
    return this.router.push({
      name: ROUTE_NAMES.BRAINSTORM_RESULTS,
      params: { id: sessionId }
    })
  }

  /**
   * 导航到历史记录页面
   */
  toBrainstormHistory() {
    return this.router.push(ROUTES.BRAINSTORM_HISTORY)
  }

  /**
   * 导航到登录页面
   * @param redirect 登录后重定向的路径
   */
  toLogin(redirect?: string) {
    const query = redirect ? { redirect } : undefined
    return this.router.push({
      name: ROUTE_NAMES.LOGIN,
      query
    })
  }

  /**
   * 导航到注册页面
   */
  toRegister() {
    return this.router.push(ROUTES.REGISTER)
  }

  /**
   * 返回上一页
   */
  goBack() {
    return this.router.back()
  }

  /**
   * 前进到下一页
   */
  goForward() {
    return this.router.forward()
  }

  /**
   * 替换当前路由（不会在历史记录中留下记录）
   * @param to 目标路由
   */
  replace(to: string | { name: string; params?: any; query?: any }) {
    return this.router.replace(to)
  }

  /**
   * 检查当前路由是否匹配指定路径
   * @param path 路径
   */
  isCurrentRoute(path: string): boolean {
    return this.router.currentRoute.value.path === path
  }

  /**
   * 检查当前路由是否以指定路径开头
   * @param path 路径前缀
   */
  isCurrentRouteStartsWith(path: string): boolean {
    return this.router.currentRoute.value.path.startsWith(path)
  }

  /**
   * 获取当前路由信息
   */
  getCurrentRoute() {
    return this.router.currentRoute.value
  }

  /**
   * 获取路由历史记录
   */
  getHistory() {
    return this.router.options.history
  }
}

/**
 * 面包屑导航工具
 */
export class BreadcrumbUtils {
  /**
   * 根据路由生成面包屑数据
   * @param route 当前路由
   */
  static generateBreadcrumb(route: any) {
    const segments = route.path.split('/').filter(Boolean)
    const breadcrumb = []

    // 添加首页
    breadcrumb.push({
      title: '首页',
      path: ROUTES.DASHBOARD,
      icon: 'home'
    })

    // 根据路径段生成面包屑
    let currentPath = ''
    segments.forEach((segment: string, index: number) => {
      currentPath += `/${segment}`
      
      const title = this.getSegmentTitle(segment, route)
      if (title) {
        breadcrumb.push({
          title,
          path: index === segments.length - 1 ? undefined : currentPath,
          icon: this.getSegmentIcon(segment)
        })
      }
    })

    return breadcrumb
  }

  /**
   * 获取路径段对应的标题
   */
  private static getSegmentTitle(segment: string, route: any): string {
    const titleMap: Record<string, string> = {
      'agents': 'AI代理管理',
      'brainstorm': '头脑风暴',
      'history': '历史记录',
      'session': '会话',
      'results': '结果',
      'create': '创建',
      'edit': '编辑'
    }

    // 如果是ID参数，使用路由元信息中的标题
    if (/^[a-f0-9-]{36}$/.test(segment) || /^\d+$/.test(segment)) {
      return route.meta?.title || '详情'
    }

    return titleMap[segment] || segment
  }

  /**
   * 获取路径段对应的图标
   */
  private static getSegmentIcon(segment: string): string {
    const iconMap: Record<string, string> = {
      'agents': 'robot',
      'brainstorm': 'bulb',
      'history': 'history',
      'session': 'file-text',
      'results': 'bar-chart'
    }

    return iconMap[segment] || 'folder'
  }
}

/**
 * 路由参数工具
 */
export class RouteParamsUtils {
  /**
   * 安全地获取路由参数
   * @param route 路由对象
   * @param key 参数键
   * @param defaultValue 默认值
   */
  static getParam(route: any, key: string, defaultValue?: string): string | undefined {
    const value = route.params[key]
    return typeof value === 'string' ? value : defaultValue
  }

  /**
   * 安全地获取查询参数
   * @param route 路由对象
   * @param key 参数键
   * @param defaultValue 默认值
   */
  static getQuery(route: any, key: string, defaultValue?: string): string | undefined {
    const value = route.query[key]
    return typeof value === 'string' ? value : defaultValue
  }

  /**
   * 构建带参数的路由对象
   * @param name 路由名称
   * @param params 路由参数
   * @param query 查询参数
   */
  static buildRoute(name: string, params?: Record<string, any>, query?: Record<string, any>) {
    return {
      name,
      ...(params && { params }),
      ...(query && { query })
    }
  }
}

/**
 * 创建导航工具实例
 * @param router Vue Router实例
 */
export function createNavigationUtils(router: Router) {
  return new NavigationUtils(router)
}

/**
 * 路由守卫工具
 */
export class RouteGuardUtils {
  /**
   * 检查路由是否需要认证
   * @param route 路由对象
   */
  static requiresAuth(route: any): boolean {
    return route.meta?.requiresAuth !== false
  }

  /**
   * 检查路由是否需要特定权限
   * @param route 路由对象
   * @param userPermissions 用户权限列表
   */
  static hasPermission(route: any, userPermissions: string[]): boolean {
    const requiredPermissions = route.meta?.permissions as string[]
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    return requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    )
  }

  /**
   * 获取重定向路径
   * @param route 目标路由
   * @param fallback 备用路径
   */
  static getRedirectPath(route: any, fallback = ROUTES.DASHBOARD): string {
    const redirect = route.query?.redirect as string
    return redirect && redirect !== ROUTES.LOGIN ? redirect : fallback
  }
}