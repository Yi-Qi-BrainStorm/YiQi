# 后端API集成更新说明

## 概述

根据后端用户管理接口文档 (`backend/src/main/resources/user.md`)，已更新前端认证相关的接口和实现。

## 主要变更

### 1. API端点更新

- **基础路径**: 从 `/auth` 更改为 `/users`
- **登录**: `POST /users/login`
- **注册**: `POST /users/register`  
- **获取用户信息**: `GET /users/me`
- **登出**: `POST /users/logout`

### 2. 数据类型更新

#### User 接口
```typescript
// 旧版本
interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// 新版本 - 匹配后端API
interface User {
  id: number;           // 改为number类型
  username: string;
  createdAt: string;
  lastLoginAt: string | null;  // 新增字段，替换updatedAt
}
```

#### RegisterData 接口
```typescript
// 旧版本
interface RegisterData {
  username: string;
  email: string;        // 移除email字段
  password: string;
  confirmPassword: string;  // 移除确认密码字段
}

// 新版本 - 匹配后端API
interface RegisterData {
  username: string;
  password: string;
}
```

#### AuthResponse 接口
```typescript
// 旧版本
interface AuthResponse {
  user: User;
  token: string;
}

// 新版本 - 匹配后端API
interface AuthResponse {
  accessToken: string;   // 改为accessToken
  tokenType: string;     // 新增tokenType字段
  user: User;
}
```

#### 新增 RegisterResponse 接口
```typescript
interface RegisterResponse {
  id: number;
  username: string;
  createdAt: string;
  lastLoginAt: string | null;
}
```

### 3. 服务层更新

#### AuthService 变更
- 更新所有API端点路径
- 注册接口现在返回 `RegisterResponse` 而不是 `AuthResponse`
- 移除了token刷新功能（后端暂不支持）
- 保留了扩展功能接口但标记为暂未实现

#### 认证流程变更
- 注册成功后不再自动登录，需要用户手动登录
- Token刷新功能暂时禁用，过期后需要重新登录

### 4. Store层更新

#### AuthStore 变更
- 更新登录逻辑以处理新的响应格式 (`accessToken` 而不是 `token`)
- 更新注册逻辑，不再自动登录
- 更新用户信息获取逻辑
- 禁用token刷新功能

### 5. API配置更新

- 修复了token存储键的不一致问题（统一使用 `auth_token`）
- 更新了错误处理中的token清理逻辑

## 安全特性

根据后端API文档，系统包含以下安全特性：

1. **账户锁定机制**: 连续登录失败5次后，账户将被锁定15分钟
2. **JWT认证**: 使用Bearer Token进行身份验证
3. **密码加密**: 后端对密码进行加密存储

## 错误处理

后端返回统一的错误响应格式：
```json
{
  "timestamp": "string",
  "status": "number", 
  "error": "string",
  "message": "string",
  "path": "string"
}
```

前端错误处理器已配置为正确处理这种格式。

## 状态码映射

| 状态码 | 说明 | 前端处理 |
|--------|------|----------|
| 200 | 成功 | 正常处理响应 |
| 400 | 请求参数错误 | 显示验证错误信息 |
| 401 | 认证失败 | 清除本地token，跳转登录 |
| 409 | 用户名已存在 | 显示冲突错误信息 |
| 423 | 账户被锁定 | 显示锁定提示信息 |

## 测试

已创建基础的单元测试文件 `frontend/src/services/__tests__/authService.test.ts` 来验证API调用的正确性。

## 向后兼容性

为了保持向后兼容性，以下功能接口被保留但标记为暂未实现：
- 密码重置
- 邮箱验证
- 重新发送验证邮件

这些功能可以在后端实现后轻松启用。

## 下一步

1. 测试所有认证流程
2. 更新相关的UI组件以适应新的数据结构
3. 实现账户锁定状态的用户提示
4. 考虑添加token过期的自动处理逻辑