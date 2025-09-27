import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { authGuard, permissionGuard, titleGuard, loadingGuard } from './guards'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { 
      requiresAuth: false, 
      redirectIfAuth: true,
      title: '登录'
    },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { 
      requiresAuth: false, 
      redirectIfAuth: true,
      title: '注册'
    },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/Dashboard.vue'),
    meta: { 
      requiresAuth: true,
      title: '工作台'
    },
  },
  {
    path: '/agents',
    name: 'AgentManagement',
    component: () => import('@/views/agents/AgentManagement.vue'),
    meta: { 
      requiresAuth: true,
      title: '代理管理'
    },
  },
  {
    path: '/brainstorm',
    name: 'BrainstormSession',
    component: () => import('@/views/brainstorm/BrainstormSession.vue'),
    meta: { 
      requiresAuth: true,
      title: '头脑风暴'
    },
  },
  {
    path: '/brainstorm/:sessionId',
    name: 'BrainstormSessionDetail',
    component: () => import('@/views/brainstorm/BrainstormSession.vue'),
    meta: { 
      requiresAuth: true,
      title: '头脑风暴会话'
    },
    props: true,
  },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
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