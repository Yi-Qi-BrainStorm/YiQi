import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Simple test routes
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: { template: '<div>Login</div>' },
    meta: { requiresAuth: false, redirectIfAuth: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard', 
    component: { template: '<div>Dashboard</div>' },
    meta: { requiresAuth: true },
  },
]

describe('Router Integration', () => {
  let router: any
  
  beforeEach(async () => {
    setActivePinia(createPinia())
    
    router = createRouter({
      history: createWebHistory(),
      routes,
    })
    
    // Mock the guards (simplified for testing)
    router.beforeEach(async (to: any, from: any, next: any) => {
      const authStore = useAuthStore()
      const requiresAuth = to.meta.requiresAuth !== false
      const redirectIfAuth = to.meta.redirectIfAuth === true
      
      if (requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
        return
      }
      
      if (redirectIfAuth && authStore.isAuthenticated) {
        next('/dashboard')
        return
      }
      
      next()
    })
    
    vi.clearAllMocks()
  })

  it('should redirect unauthenticated users to login', async () => {
    const authStore = useAuthStore()
    authStore.user = null
    authStore.token = null

    await router.push('/dashboard')
    
    expect(router.currentRoute.value.name).toBe('Login')
    expect(router.currentRoute.value.query.redirect).toBe('/dashboard')
  })

  it('should allow authenticated users to access protected routes', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: '1', username: 'test', email: 'test@example.com' }
    authStore.token = 'valid-token'

    await router.push('/dashboard')
    
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('should redirect authenticated users away from login', async () => {
    const authStore = useAuthStore()
    authStore.user = { id: '1', username: 'test', email: 'test@example.com' }
    authStore.token = 'valid-token'

    await router.push('/login')
    
    expect(router.currentRoute.value.path).toBe('/dashboard')
  })
})