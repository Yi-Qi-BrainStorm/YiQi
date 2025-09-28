# 前后端联调指南

## 概述

本文档描述了AI头脑风暴平台前后端的集成方式和联调步骤。

## 后端API信息

### 基础信息
- **后端框架**: Spring Boot 2.7.18
- **API基础路径**: `http://localhost:8080`
- **认证方式**: JWT Token (Bearer)
- **数据格式**: JSON

### 主要API端点

#### 1. 用户认证 (`/users`)
- `POST /users/login` - 用户登录
- `POST /users/register` - 用户注册  
- `GET /users/me` - 获取当前用户信息
- `POST /users/logout` - 用户登出

#### 2. 代理管理 (`/api/agents`)
- `GET /api/agents` - 获取代理列表
- `POST /api/agents` - 创建代理
- `GET /api/agents/{id}` - 获取代理详情
- `PUT /api/agents/{id}` - 更新代理
- `DELETE /api/agents/{id}` - 删除代理
- `POST /api/agents/{id}/activate` - 激活代理
- `POST /api/agents/{id}/deactivate` - 停用代理
- `GET /api/agents/role-types` - 获取角色类型
- `GET /api/agents/ai-models` - 获取AI模型列表

#### 3. 会话管理 (`/api/sessions`)
- `GET /api/sessions` - 获取会话列表
- `POST /api/sessions` - 创建会话
- `GET /api/sessions/{id}/status` - 获取会话状态
- `POST /api/sessions/{id}/start` - 启动会话
- `POST /api/sessions/{id}/pause` - 暂停会话
- `POST /api/sessions/{id}/resume` - 恢复会话
- `POST /api/sessions/{id}/cancel` - 取消会话

## 前端适配

### 1. API服务更新

前端已更新以下服务以匹配后端API：

- **AuthService**: 使用 `/users` 路径进行认证
- **AgentService**: 使用 `/api/agents` 路径管理代理
- **BrainstormService**: 使用 `/api/sessions` 路径管理会话

### 2. 数据格式适配

#### 登录响应格式
```typescript
interface LoginResponse {
  accessToken: string;
  tokenType: string;
  user: {
    id: number;
    username: string;
    createdAt: string;
    lastLoginAt: string | null;
  };
}
```

#### 代理响应格式
```typescript
interface Agent {
  id: number;
  userId: number;
  name: string;
  roleType: string;
  systemPrompt: string;
  aiModel: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 会话响应格式
```typescript
interface BrainstormSession {
  id: number;
  userId: number;
  title: string;
  description: string;
  topic: string;
  status: SessionStatus;
  currentPhase: PhaseType;
  agents: SessionAgentInfo[];
  createdAt: string;
  updatedAt: string;
}
```

### 3. Mock模式支持

前端支持智能Mock模式切换：
- 开发环境下，如果后端不可用自动启用Mock
- 可通过环境变量或localStorage手动控制
- 提供Mock/真实API无缝切换

## 联调步骤

### 1. 启动后端服务

```bash
cd backend
mvn spring-boot:run
```

后端将在 `http://localhost:8080` 启动。

### 2. 启动前端服务

```bash
cd frontend
npm run dev
```

前端将在 `http://localhost:5173` 启动。

### 3. 验证连接

访问前后端集成测试页面：
```
http://localhost:5173/dev/backend-integration
```

该页面提供：
- 后端连接状态检查
- API端点测试
- Mock模式切换
- 实时测试日志

### 4. 功能测试

#### 用户认证测试
1. 访问登录页面
2. 使用测试账号登录
3. 验证JWT token存储和使用

#### 代理管理测试
1. 创建新代理
2. 查看代理列表
3. 编辑代理信息
4. 测试代理激活/停用

#### 会话管理测试
1. 创建新会话
2. 启动头脑风暴
3. 查看会话状态
4. 测试会话控制功能

## 环境配置

### 前端环境变量

#### 开发环境 (`.env.development`)
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_ENABLE_MOCK=auto
VITE_DEBUG=true
```

#### 生产环境 (`.env.production`)
```env
VITE_API_BASE_URL=/api
VITE_ENABLE_MOCK=false
VITE_DEBUG=false
```

### 后端配置

#### 应用配置 (`application.yml`)
```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/yiqi_brainstorm
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:password}

yiqi:
  jwt:
    secret: ${JWT_SECRET:your-secret-key}
    expiration: 86400000
```

## 常见问题

### 1. CORS问题
如果遇到跨域问题，确保后端配置了正确的CORS设置。

### 2. 认证问题
- 检查JWT token是否正确存储
- 验证token格式和过期时间
- 确认请求头包含正确的Authorization

### 3. API路径问题
- 前端API路径: `/api/agents`, `/api/sessions`
- 用户认证路径: `/users`
- 健康检查: `/actuator/health`

### 4. Mock模式问题
- 检查Mock模式状态
- 验证Mock数据格式
- 确认Mock服务实现

## 调试工具

### 1. 浏览器开发者工具
- Network标签查看API请求
- Console查看错误日志
- Application标签检查localStorage

### 2. 后端日志
- 查看Spring Boot控制台输出
- 检查API请求日志
- 验证数据库连接

### 3. 集成测试页面
访问 `/dev/backend-integration` 进行实时测试和调试。

## 部署注意事项

### 1. 生产环境
- 确保API基础URL正确配置
- 禁用Mock模式
- 配置正确的CORS策略

### 2. 安全考虑
- 使用HTTPS
- 配置安全的JWT密钥
- 实施适当的API限流

### 3. 性能优化
- 启用API响应缓存
- 配置CDN
- 优化数据库查询

## 更新日志

- **v1.0.0** (2024-01-15): 初始版本，完成基础前后端集成
- 支持用户认证、代理管理、会话管理
- 实现Mock模式和真实API切换
- 提供集成测试工具