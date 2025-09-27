import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { authGuard, permissionGuard, titleGuard, loadingGuard } from './guards'
import { ROUTES, ROUTE_NAMES } from '@/constants/routes'

// 路由懒加载优化 - 使用webpackChunkName进行代码分割
const routes: RouteRecordRaw[] = [
  // 根路径重定向
  {
    path: '/',
    redirect: ROUTES.DASHBOARD,
  },
  
  // 认证相关路由
  {
    path: ROUTES.LOGIN,
    name: ROUTE_NAMES.LOGIN,
    component: () => import(/* webpackChunkName: "auth" */ '@/views/auth/Login.vue'),
    meta: { 
      requiresAuth: false, 
      redirectIfAuth: true,
      title: '登录'
    },
  },
  {
    path: ROUTES.REGISTER,
    name: ROUTE_NAMES.REGISTER,
    component: () => import(/* webpackChunkName: "auth" */ '@/views/auth/Register.vue'),
    meta: { 
      requiresAuth: false, 
      redirectIfAuth: true,
      title: '注册'
    },
  },
  
  // 主要功能路由
  {
    path: ROUTES.DASHBOARD,
    name: ROUTE_NAMES.DASHBOARD,
    component: () => import(/* webpackChunkName: "dashboard" */ '@/views/dashboard/Dashboard.vue'),
    meta: { 
      requiresAuth: true,
      title: '工作台'
    },
  },
  
  // 代理管理路由
  {
    path: ROUTES.AGENTS,
    name: ROUTE_NAMES.AGENTS,
    component: () => import(/* webpackChunkName: "agents" */ '@/views/agents/AgentManagement.vue'),
    meta: { 
      requiresAuth: true,
      title: 'AI代理管理'
    },
  },
  {
    path: ROUTES.AGENT_DETAIL,
    name: ROUTE_NAMES.AGENT_DETAIL,
    component: () => import(/* webpackChunkName: "agents" */ '@/views/agents/AgentDetail.vue'),
    meta: { 
      requiresAuth: true,
      title: '代理详情'
    },
    props: true,
  },
  
  // 头脑风暴路由
  {
    path: ROUTES.BRAINSTORM,
    name: ROUTE_NAMES.BRAINSTORM,
    component: () => import(/* webpackChunkName: "brainstorm" */ '@/views/brainstorm/BrainstormSession.vue'),
    meta: { 
      requiresAuth: true,
      title: '头脑风暴'
    },
  },
  {
    path: ROUTES.BRAINSTORM_SESSION,
    name: ROUTE_NAMES.BRAINSTORM_SESSION,
    component: () => import(/* webpackChunkName: "brainstorm" */ '@/views/brainstorm/BrainstormSession.vue'),
    meta: { 
      requiresAuth: true,
      title: '头脑风暴会话'
    },
    props: true,
  },
  {
    path: ROUTES.BRAINSTORM_HISTORY,
    name: ROUTE_NAMES.BRAINSTORM_HISTORY,
    component: () => import(/* webpackChunkName: "brainstorm" */ '@/views/brainstorm/BrainstormHistory.vue'),
    meta: { 
      requiresAuth: true,
      title: '历史记录'
    },
  },
  {
    path: ROUTES.BRAINSTORM_RESULTS,
    name: ROUTE_NAMES.BRAINSTORM_RESULTS,
    component: () => import(/* webpackChunkName: "brainstorm" */ '@/views/brainstorm/BrainstormResults.vue'),
    meta: { 
      requiresAuth: true,
      title: '会话结果'
    },
    props: true,
  },
  
  // 错误页面
  {
    path: '/401',
    name: ROUTE_NAMES.UNAUTHORIZED,
    component: () => import(/* webpackChunkName: "error" */ '@/views/error/Unauthorized.vue'),
    meta: { 
      requiresAuth: false,
      title: '未授权访问'
    },
  },
  {
    path: '/403',
    name: ROUTE_NAMES.FORBIDDEN,
    component: () => import(/* webpackChunkName: "error" */ '@/views/error/Forbidden.vue'),
    meta: { 
      requiresAuth: false,
      title: '访问被拒绝'
    },
  },
  
  // 404 页面 - 必须放在最后
  {
    path: '/:pathMatch(.*)*',
    name: ROUTE_NAMES.NOT_FOUND,
    component: () => import(/* webpackChunkName: "error" */ '@/views/NotFound.vue'),
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
})

export default router