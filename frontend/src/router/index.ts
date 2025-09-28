import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { authGuard, permissionGuard, titleGuard, loadingGuard } from './guards'
import { ROUTES, ROUTE_NAMES } from '@/constants/routes'
import { preloadManager } from '@/utils/preloadUtils'

// 路由懒加载优化 - 使用webpackChunkName和prefetch/preload进行代码分割
const routes: RouteRecordRaw[] = [
  // 根路径重定向
  {
    path: '/',
    redirect: ROUTES.LOGIN,
  },
  
  // 认证相关路由 - 高优先级预加载
  {
    path: ROUTES.LOGIN,
    name: ROUTE_NAMES.LOGIN,
    component: () => import(
      /* webpackChunkName: "auth-pages" */
      /* webpackPreload: true */
      '@/views/auth/Login.vue'
    ),
    meta: { 
      requiresAuth: false, 
      redirectIfAuth: true,
      title: '登录',
      preloadPriority: 'high'
    },
  },
  {
    path: ROUTES.REGISTER,
    name: ROUTE_NAMES.REGISTER,
    component: () => import(
      /* webpackChunkName: "auth-pages" */
      /* webpackPrefetch: true */
      '@/views/auth/Register.vue'
    ),
    meta: { 
      requiresAuth: false, 
      redirectIfAuth: true,
      title: '注册',
      preloadPriority: 'low'
    },
  },
  
  // 主要功能路由 - 最高优先级
  {
    path: ROUTES.DASHBOARD,
    name: ROUTE_NAMES.DASHBOARD,
    component: () => import(
      /* webpackChunkName: "dashboard-page" */
      /* webpackPreload: true */
      '@/views/Dashboard.vue'
    ),
    meta: { 
      requiresAuth: true,
      title: '工作台',
      preloadPriority: 'high'
    },
  },
  
  // 代理管理路由 - 中等优先级预取
  {
    path: ROUTES.AGENTS,
    name: ROUTE_NAMES.AGENTS,
    component: () => import(
      /* webpackChunkName: "agent-pages" */
      /* webpackPrefetch: true */
      '@/views/agents/AgentManagement.vue'
    ),
    meta: { 
      requiresAuth: true,
      title: 'AI代理管理',
      preloadPriority: 'medium'
    },
  },
  {
    path: ROUTES.AGENT_DETAIL,
    name: ROUTE_NAMES.AGENT_DETAIL,
    component: () => import(
      /* webpackChunkName: "agent-pages" */
      /* webpackPrefetch: true */
      '@/views/agents/AgentDetail.vue'
    ),
    meta: { 
      requiresAuth: true,
      title: '代理详情',
      preloadPriority: 'low'
    },
    props: true,
  },
  
  // 头脑风暴路由 - 中等优先级预取
  {
    path: ROUTES.BRAINSTORM,
    name: ROUTE_NAMES.BRAINSTORM,
    component: () => import(
      /* webpackChunkName: "brainstorm-pages" */
      /* webpackPrefetch: true */
      '@/views/brainstorm/BrainstormSession.vue'
    ),
    meta: { 
      requiresAuth: true,
      title: '头脑风暴',
      preloadPriority: 'medium'
    },
  },
  {
    path: ROUTES.BRAINSTORM_SESSION,
    name: ROUTE_NAMES.BRAINSTORM_SESSION,
    component: () => import(
      /* webpackChunkName: "brainstorm-pages" */
      /* webpackPrefetch: true */
      '@/views/brainstorm/BrainstormSession.vue'
    ),
    meta: { 
      requiresAuth: true,
      title: '头脑风暴会话',
      preloadPriority: 'medium'
    },
    props: true,
  },
  {
    path: ROUTES.BRAINSTORM_HISTORY,
    name: ROUTE_NAMES.BRAINSTORM_HISTORY,
    component: () => import(
      /* webpackChunkName: "brainstorm-pages" */
      /* webpackPrefetch: true */
      '@/views/brainstorm/BrainstormHistory.vue'
    ),
    meta: { 
      requiresAuth: true,
      title: '历史记录',
      preloadPriority: 'low'
    },
  },
  {
    path: ROUTES.BRAINSTORM_RESULTS,
    name: ROUTE_NAMES.BRAINSTORM_RESULTS,
    component: () => import(
      /* webpackChunkName: "brainstorm-pages" */
      /* webpackPrefetch: true */
      '@/views/brainstorm/BrainstormResults.vue'
    ),
    meta: { 
      requiresAuth: true,
      title: '会话结果',
      preloadPriority: 'low'
    },
    props: true,
  },
  
  // 错误页面 - 低优先级懒加载
  // 调试页面路由
  {
    path: '/debug',
    name: 'Debug',
    component: () => import(
      /* webpackChunkName: "debug-page" */
      '@/views/DebugInfo.vue'
    ),
    meta: { 
      requiresAuth: false,
      title: '调试信息' 
    },
  },
  
  // 路由测试页面
  {
    path: '/test-routes',
    name: 'TestRoutes',
    component: () => import(
      /* webpackChunkName: "test-page" */
      '@/views/TestRoutes.vue'
    ),
    meta: { 
      requiresAuth: false,
      title: '路由测试' 
    },
  },

  {
    path: '/401',
    name: ROUTE_NAMES.UNAUTHORIZED,
    component: () => import(
      /* webpackChunkName: "error-pages" */
      '@/views/error/Unauthorized.vue'
    ),
    meta: { 
      requiresAuth: false,
      title: '未授权访问'
    },
  },
  {
    path: '/403',
    name: ROUTE_NAMES.FORBIDDEN,
    component: () => import(
      /* webpackChunkName: "error-pages" */
      '@/views/error/Forbidden.vue'
    ),
    meta: { 
      requiresAuth: false,
      title: '访问被拒绝'
    },
  },
  
  // 开发环境测试路由
  ...(import.meta.env.DEV ? [
    {
      path: '/dev',
      name: 'DevTest',
      component: () => import(
        /* webpackChunkName: "dev-pages" */
        '@/views/dev/TestPage.vue'
      ),
      meta: { 
        requiresAuth: false,
        title: '前端功能测试'
      },
    },
    {
      path: '/dev/mock',
      name: 'MockTest',
      component: () => import(
        /* webpackChunkName: "dev-pages" */
        '@/views/dev/MockTestPage.vue'
      ),
      meta: { 
        requiresAuth: false,
        title: 'Mock数据测试'
      },
    },
    {
      path: '/dev/backend-integration',
      name: 'BackendIntegrationTest',
      component: () => import(
        /* webpackChunkName: "dev-pages" */
        '@/views/dev/BackendIntegrationTest.vue'
      ),
      meta: { 
        requiresAuth: false,
        title: '前后端集成测试'
      },
    }
  ] : []),
  
  // 404 页面 - 必须放在最后
  {
    path: '/:pathMatch(.*)*',
    name: ROUTE_NAMES.NOT_FOUND,
    component: () => import(
      /* webpackChunkName: "error-pages" */
      '@/views/NotFound.vue'
    ),
    meta: { 
      requiresAuth: false,
      title: '页面未找到'
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 注册全局守卫
router.beforeEach(loadingGuard.beforeEach)
router.beforeEach(authGuard)
router.beforeEach(permissionGuard)

router.afterEach((to) => {
  titleGuard(to)
  loadingGuard.afterEach()
  
  // 智能预加载相关路由
  const preloadRoutes = getPreloadRoutes(to.name as string)
  if (preloadRoutes.length > 0) {
    preloadManager.preloadRoutes(preloadRoutes)
  }
})

/**
 * 根据当前路由获取需要预加载的路由
 */
function getPreloadRoutes(currentRoute: string): Array<{route: string, priority: 'high' | 'low', delay?: number}> {
  const preloadMap: Record<string, Array<{route: string, priority: 'high' | 'low', delay?: number}>> = {
    'Login': [
      { route: 'dashboard', priority: 'high', delay: 500 }
    ],
    'Dashboard': [
      { route: 'agents', priority: 'high', delay: 1000 },
      { route: 'brainstorm', priority: 'high', delay: 1500 }
    ],
    'AgentManagement': [
      { route: 'agent-detail', priority: 'high', delay: 500 },
      { route: 'brainstorm', priority: 'low', delay: 2000 }
    ],
    'BrainstormSession': [
      { route: 'brainstorm-results', priority: 'high', delay: 1000 },
      { route: 'brainstorm-history', priority: 'low', delay: 2000 }
    ]
  }
  
  return preloadMap[currentRoute] || []
}

export default router