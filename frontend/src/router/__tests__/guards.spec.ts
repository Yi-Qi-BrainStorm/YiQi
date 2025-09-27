import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { authGuard, permissionGuard, titleGuard } from '../guards'
import { useAuthStore } from '@/stores/auth'
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'

// Mock route objects
const createMockRoute = (
  path: string,
  meta: Record<string, any> = {}
): RouteLocationNormalized => ({
  path,
  name: undefined,
  params: {},
  query: {},
  hash: '',
  fullPath: path,
  matched: [],
  meta,
  redirectedFrom: undefined,
})

// Mock next function
const createMockNext = () => {
  const next = vi.fn() as NavigationGuardNext
  return next
}

describe('Route Guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('authGuard', () => {
    it('should allow access to public routes when not authenticated', async () => {
      const authStore = useAuthStore()
      authStore.user = null
      authStore.token = null

      const to = createMockRoute('/login', { requiresAuth: false })
      const from = createMockRoute('/')
      const next = createMockNext()

      await authGuard(to, from, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should redirect to login when accessing protected route without authentication', async () => {
      const authStore = useAuthStore()
      authStore.user = null
      authStore.token = null

      const to = createMockRoute('/dashboard', { requiresAuth: true })
      const from = createMockRoute('/')
      const next = createMockNext()

      await authGuard(to, from, next)

      expect(next).toHaveBeenCalledWith({
        name: 'Login',
        query: { redirect: '/dashboard' },
      })
    })

    it('should allow access to protected routes when authenticated', async () => {
      const authStore = useAuthStore()
      authStore.user = { id: '1', username: 'testuser', email: 'test@example.com' }
      authStore.token = 'valid-token'

      const to = createMockRoute('/dashboard', { requiresAuth: true })
      const from = createMockRoute('/')
      const next = createMockNext()

      await authGuard(to, from, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should redirect authenticated users away from login page', async () => {
      const authStore = useAuthStore()
      authStore.user = { id: '1', username: 'testuser', email: 'test@example.com' }
      authStore.token = 'valid-token'

      const to = createMockRoute('/login', { requiresAuth: false, redirectIfAuth: true })
      const from = createMockRoute('/')
      const next = createMockNext()

      await authGuard(to, from, next)

      expect(next).toHaveBeenCalledWith('/dashboard')
    })

    it('should redirect to query redirect path when authenticated user visits login', async () => {
      const authStore = useAuthStore()
      authStore.user = { id: '1', username: 'testuser', email: 'test@example.com' }
      authStore.token = 'valid-token'

      const to = createMockRoute('/login', { requiresAuth: false, redirectIfAuth: true })
      to.query = { redirect: '/agents' }
      const from = createMockRoute('/')
      const next = createMockNext()

      await authGuard(to, from, next)

      expect(next).toHaveBeenCalledWith('/agents')
    })
  })

  describe('permissionGuard', () => {
    it('should allow access when no permissions required', () => {
      const to = createMockRoute('/dashboard')
      const from = createMockRoute('/')
      const next = createMockNext()

      permissionGuard(to, from, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should redirect to login when permissions required but not authenticated', () => {
      const authStore = useAuthStore()
      authStore.user = null
      authStore.token = null

      const to = createMockRoute('/admin', { permissions: ['admin'] })
      const from = createMockRoute('/')
      const next = createMockNext()

      permissionGuard(to, from, next)

      expect(next).toHaveBeenCalledWith({
        name: 'Login',
        query: { redirect: '/admin' },
      })
    })

    it('should allow access when authenticated and permissions required', () => {
      const authStore = useAuthStore()
      authStore.user = { id: '1', username: 'testuser', email: 'test@example.com' }
      authStore.token = 'valid-token'

      const to = createMockRoute('/admin', { permissions: ['admin'] })
      const from = createMockRoute('/')
      const next = createMockNext()

      permissionGuard(to, from, next)

      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('titleGuard', () => {
    it('should set default title when no route title', () => {
      const to = createMockRoute('/dashboard')
      
      titleGuard(to)

      expect(document.title).toBe('AI头脑风暴平台')
    })

    it('should set route title when provided', () => {
      const to = createMockRoute('/dashboard', { title: '工作台' })
      
      titleGuard(to)

      expect(document.title).toBe('工作台 - AI头脑风暴平台')
    })
  })
})