import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * 认证路由守卫
 */
export const authGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore()
  
  // 检查是否需要认证
  const requiresAuth = to.meta.requiresAuth !== false
  const redirectIfAuth = to.meta.redirectIfAuth === true
  
  // 使用store中的认证状态而不是直接检查localStorage
  const isAuthenticated = authStore.isAuthenticated
  
  // 如果页面需要认证但用户未登录
  if (requiresAuth && !isAuthenticated) {
    // 保存用户想要访问的页面，登录后重定向
    const redirectPath = to.fullPath !== '/login' ? to.fullPath : '/dashboard'
    next({
      name: 'Login',
      query: { redirect: redirectPath },
    })
    return
  }
  
  // 如果用户已登录但访问登录/注册页面，重定向到dashboard
  if (redirectIfAuth && isAuthenticated) {
    const redirectPath = (to.query.redirect as string) || '/dashboard'
    next(redirectPath)
    return
  }
  
  // 其他情况正常导航
  next()
}

/**
 * 权限检查守卫
 */
export const permissionGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore()
  
  // 检查是否有特定权限要求
  const requiredPermissions = to.meta.permissions as string[] | undefined
  
  if (requiredPermissions && requiredPermissions.length > 0) {
    // 当前简化实现，所有已认证用户都有权限
    // 后续可以根据用户角色和权限进行更细粒度的控制
    if (!authStore.isAuthenticated) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
    
    // TODO: 实现基于角色的权限检查
    // const userPermissions = authStore.user?.permissions || []
    // const hasPermission = requiredPermissions.some(permission => 
    //   userPermissions.includes(permission)
    // )
    // 
    // if (!hasPermission) {
    //   next({ name: 'Forbidden' })
    //   return
    // }
  }
  
  next()
}

/**
 * 页面标题守卫
 */
export const titleGuard = (to: RouteLocationNormalized) => {
  const defaultTitle = 'AI头脑风暴平台'
  const routeTitle = to.meta.title as string
  
  // 动态标题处理
  let finalTitle = routeTitle
  
  // 处理带参数的路由标题
  if (routeTitle && to.params) {
    // 替换标题中的参数占位符
    Object.entries(to.params).forEach(([key, value]) => {
      if (typeof value === 'string') {
        finalTitle = finalTitle?.replace(`{${key}}`, value)
      }
    })
  }
  
  document.title = finalTitle ? `${finalTitle} - ${defaultTitle}` : defaultTitle
}

/**
 * 页面加载状态守卫
 */
export const loadingGuard = {
  beforeEach: () => {
    // 可以在这里显示全局加载状态
    // const loadingStore = useLoadingStore()
    // loadingStore.setLoading(true)
  },
  
  afterEach: () => {
    // 隐藏全局加载状态
    // const loadingStore = useLoadingStore()
    // loadingStore.setLoading(false)
  }
}