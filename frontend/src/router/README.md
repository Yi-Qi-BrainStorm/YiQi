# 路由守卫和权限控制系统

本文档描述了AI头脑风暴平台的路由守卫和权限控制系统的实现。

## 功能概述

### 已实现功能

1. **认证路由守卫** - 保护需要登录的页面
2. **访客路由守卫** - 已登录用户自动重定向
3. **自动重定向逻辑** - 登录后跳转到原始目标页面
4. **登录状态持久化** - 刷新页面后保持登录状态
5. **Token过期监控** - 自动检测并处理token过期
6. **页面标题管理** - 根据路由自动设置页面标题

## 文件结构

```
src/router/
├── index.ts              # 主路由配置文件
├── guards.ts             # 路由守卫实现
├── __tests__/            # 测试文件
│   ├── guards.spec.ts    # 守卫单元测试
│   └── integration.spec.ts # 集成测试
└── README.md             # 本文档
```

## 路由配置

### 路由元信息 (meta)

每个路由可以配置以下元信息：

```typescript
interface RouteMeta {
  requiresAuth?: boolean      // 是否需要认证，默认true
  redirectIfAuth?: boolean    // 已认证用户是否重定向，默认false
  permissions?: string[]      // 需要的权限列表（预留）
  title?: string             // 页面标题
}
```

### 示例路由配置

```typescript
{
  path: '/dashboard',
  name: 'Dashboard',
  component: () => import('@/views/dashboard/Dashboard.vue'),
  meta: { 
    requiresAuth: true,    // 需要登录
    title: '工作台'        // 页面标题
  },
}
```

## 路由守卫

### 1. 认证守卫 (authGuard)

**功能：**
- 检查用户认证状态
- 保护需要登录的页面
- 处理登录后的重定向

**逻辑：**
1. 检查路由是否需要认证 (`requiresAuth`)
2. 如果需要认证但用户未登录，重定向到登录页面并保存原始路径
3. 如果用户已登录但访问登录/注册页面，重定向到dashboard或指定路径

### 2. 权限守卫 (permissionGuard)

**功能：**
- 检查用户权限（当前简化实现）
- 为后续基于角色的权限控制预留接口

**逻辑：**
1. 检查路由是否需要特定权限
2. 验证用户是否具有所需权限
3. 权限不足时重定向到相应页面

### 3. 标题守卫 (titleGuard)

**功能：**
- 根据路由配置自动设置页面标题

**逻辑：**
1. 从路由meta中获取title
2. 设置为 `{title} - AI头脑风暴平台` 格式

## 认证状态管理

### Token管理

使用 `TokenUtils` 类处理JWT token：

```typescript
// 检查token是否过期
TokenUtils.isTokenExpired(token)

// 获取token剩余时间
TokenUtils.getTokenRemainingTime(token)

// 检查token是否即将过期
TokenUtils.isTokenExpiringSoon(token, 5) // 5分钟内过期
```

### 认证监控

使用 `AuthMonitor` 单例类监控认证状态：

```typescript
// 开始监控
AuthMonitor.getInstance().startMonitoring()

// 停止监控
AuthMonitor.getInstance().stopMonitoring()
```

**监控功能：**
- 每分钟检查一次token状态
- Token过期时自动登出并重定向
- Token即将过期时尝试刷新（预留功能）

## 重定向处理

### 登录重定向

1. 用户访问受保护页面时，如果未登录会被重定向到登录页面
2. 原始路径保存在query参数中：`/login?redirect=/dashboard`
3. 登录成功后自动跳转到原始路径

### 实现示例

```typescript
// 保存重定向路径
const redirectPath = to.fullPath !== '/login' ? to.fullPath : '/dashboard'
next({
  name: 'Login',
  query: { redirect: redirectPath },
})

// 登录后重定向
const redirectPath = (router.currentRoute.value.query.redirect as string) || '/dashboard'
await router.push(redirectPath)
```

## 使用方法

### 1. 在组件中检查认证状态

```typescript
import { useAuth } from '@/composables/useAuth'

export default {
  setup() {
    const { isAuthenticated, requireAuth } = useAuth()
    
    // 检查是否已认证
    if (!isAuthenticated.value) {
      // 处理未认证状态
    }
    
    // 要求认证（会自动重定向）
    await requireAuth()
  }
}
```

### 2. 在路由配置中设置权限

```typescript
{
  path: '/admin',
  name: 'Admin',
  component: () => import('@/views/admin/Admin.vue'),
  meta: { 
    requiresAuth: true,
    permissions: ['admin'],  // 需要admin权限
    title: '管理后台'
  },
}
```

### 3. 手动检查权限

```typescript
import { PermissionUtils } from '@/utils/authUtils'

// 检查单个权限
if (PermissionUtils.hasPermission('admin')) {
  // 有权限
}

// 检查多个权限（任一）
if (PermissionUtils.hasAnyPermission(['admin', 'moderator'])) {
  // 有任一权限
}

// 检查多个权限（全部）
if (PermissionUtils.hasAllPermissions(['read', 'write'])) {
  // 有全部权限
}
```

## 错误处理

### Token过期处理

1. 自动检测token过期
2. 清除本地认证状态
3. 重定向到登录页面
4. 保存当前路径用于登录后重定向

### 网络错误处理

1. API请求失败时显示错误信息
2. 401错误自动触发登出流程
3. 其他错误显示用户友好的提示信息

## 测试

### 单元测试

测试各个守卫函数的逻辑：

```bash
npm run test -- guards.spec.ts
```

### 集成测试

测试完整的路由跳转流程：

```bash
npm run test -- integration.spec.ts
```

## 扩展指南

### 添加新的权限检查

1. 在 `PermissionUtils` 中添加新的权限检查方法
2. 在路由meta中配置所需权限
3. 在 `permissionGuard` 中实现权限验证逻辑

### 添加新的路由守卫

1. 在 `guards.ts` 中实现新的守卫函数
2. 在 `router/index.ts` 中注册守卫
3. 添加相应的测试用例

### 自定义重定向逻辑

1. 修改 `authGuard` 中的重定向逻辑
2. 使用 `RedirectUtils` 管理重定向路径
3. 在登录组件中处理重定向参数

## 注意事项

1. **Token安全性**：Token存储在localStorage中，注意XSS攻击防护
2. **路由懒加载**：所有页面组件都使用动态导入，支持代码分割
3. **错误边界**：使用ErrorBoundary组件包装路由组件
4. **性能优化**：认证检查使用缓存，避免重复API调用
5. **浏览器兼容性**：使用现代浏览器API，注意兼容性处理

## 相关需求

本实现满足以下需求：

- **Requirement 1.5**: 用户选择退出登录时清除会话并重定向到登录页面
- **Requirement 1.3**: 用户使用正确的凭据登录时验证身份并重定向到主工作台
- **Requirement 1.4**: 用户登录失败时显示相应的错误信息

## 更新日志

- **v1.0.0**: 初始实现，包含基础认证守卫和重定向功能
- **v1.1.0**: 添加权限检查和Token监控功能
- **v1.2.0**: 完善错误处理和测试覆盖