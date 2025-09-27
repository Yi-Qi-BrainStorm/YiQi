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
  
  // 如果有token但用户信息为空，尝试获取用户信息
  if (authStore.token && !authStore.user && !authStore.isLoading) {
    try {
      await authStore.checkAuth()
    } catch (error) {
      console.warn('认证检查失败:', error)
    }
  }
  
  // 如果页面需要认证但用户未登录
  if (requiresAuth && !authStore.isAuthenticated) {
    // 保存用户想要访问的页面，登录后重定向
    const redirectPath = to.fullPath !== '/login' ? to.fullPath : '/dashboard'
    next({
      name: 'Login',
      query: { redirect: redirectPath },
    })
    return
  }
  
  // 如果用户已登录但访问登录/注册页面，重定向到dashboard
  if (redirectIfAuth && authStore.isAuthenticated) {
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
  
  document.title = routeTitle ? `${routeTitle} - ${defaultTitle}` : defaultTitle
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