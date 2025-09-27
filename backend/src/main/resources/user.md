# 用户认证与管理接口文档

## 概述

本文档描述了 YiQi 头脑风暴系统的用户认证与管理相关接口，包括用户注册、登录、获取用户信息和登出功能。

**基础 URL**:

- 认证接口: `/auth`
- 用户管理接口: `/users`

**认证方式**: JWT Bearer Token

## 接口列表

### 1. 用户注册

**接口地址**:

- `POST /auth/register`
- `POST /users/register`

**接口描述**: 创建新用户账户

**请求参数**:

```json
{
  "username": "string",
  "password": "string"
}
```

**参数说明**:

| 参数名   | 类型   | 必填 | 长度限制   | 说明             |
| -------- | ------ | ---- | ---------- | ---------------- |
| username | string | 是   | 3-50 字符  | 用户名，必须唯一 |
| password | string | 是   | 6-100 字符 | 用户密码         |

**请求示例**:

```json
{
  "username": "testuser",
  "password": "password123"
}
```

**响应参数**:

```json
{
  "id": "number",
  "username": "string",
  "createdAt": "string",
  "lastLoginAt": "string"
}
```

**响应示例**:

```json
{
  "id": 1,
  "username": "testuser",
  "createdAt": "2024-01-01T10:00:00",
  "lastLoginAt": null
}
```

**状态码**:

| 状态码 | 说明                         |
| ------ | ---------------------------- |
| 200    | 注册成功 (`/users/register`) |
| 201    | 注册成功 (`/auth/register`)  |
| 400    | 请求参数错误                 |
| 409    | 用户名已存在                 |

---

### 2. 用户登录

**接口地址**:

- `POST /auth/login`

**接口描述**: 用户身份验证并获取访问令牌

**请求参数**:

```json
{
  "username": "string",
  "password": "string"
}
```

**参数说明**:

| 参数名   | 类型   | 必填 | 说明     |
| -------- | ------ | ---- | -------- |
| username | string | 是   | 用户名   |
| password | string | 是   | 用户密码 |

**请求示例**:

```json
{
  "username": "testuser",
  "password": "password123"
}
```

**响应参数**:

```json
{
  "accessToken": "string",
  "tokenType": "string",
  "user": {
    "id": "number",
    "username": "string",
    "createdAt": "string",
    "lastLoginAt": "string"
  }
}
```

**响应示例**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "username": "testuser",
    "createdAt": "2024-01-01T10:00:00",
    "lastLoginAt": "2024-01-01T11:00:00"
  }
}
```

**状态码**:

| 状态码 | 说明             |
| ------ | ---------------- |
| 200    | 登录成功         |
| 400    | 请求参数错误     |
| 401    | 用户名或密码错误 |
| 423    | 账户已被锁定     |

**安全机制**:

- 连续登录失败 5 次后，账户将被锁定 15 分钟
- 锁定期间无法登录，需等待锁定时间结束

---

### 3. 获取当前用户信息

**接口地址**: `GET /users/me`

**接口描述**: 获取当前登录用户的详细信息

**请求头**:

```
Authorization: Bearer <access_token>
```

**请求参数**: 无

**响应参数**:

```json
{
  "id": "number",
  "username": "string",
  "createdAt": "string",
  "lastLoginAt": "string"
}
```

**响应示例**:

```json
{
  "id": 1,
  "username": "testuser",
  "createdAt": "2024-01-01T10:00:00",
  "lastLoginAt": "2024-01-01T11:00:00"
}
```

**状态码**:

| 状态码 | 说明                           |
| ------ | ------------------------------ |
| 200    | 获取成功                       |
| 401    | 未授权访问（Token 无效或过期） |

---

### 4. 用户登出

**接口地址**: `POST /users/logout`

**接口描述**: 用户登出系统

**请求头**:

```
Authorization: Bearer <access_token>
```

**请求参数**: 无

**响应参数**: 无

**状态码**:

| 状态码 | 说明                           |
| ------ | ------------------------------ |
| 200    | 登出成功                       |
| 401    | 未授权访问（Token 无效或过期） |

**说明**:

- JWT 是无状态的，客户端删除令牌即可实现登出
- 服务端不维护令牌黑名单（可根据需要扩展）

---

## 错误响应格式

当接口调用失败时，会返回统一的错误响应格式：

```json
{
  "timestamp": "string",
  "status": "number",
  "error": "string",
  "message": "string",
  "path": "string"
}
```

**错误响应示例**:

```json
{
  "timestamp": "2024-01-01T10:00:00.000+00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "用户名不能为空",
  "path": "/auth/register"
}
```

## 数据模型

### User 用户实体

| 字段名              | 类型          | 说明                             |
| ------------------- | ------------- | -------------------------------- |
| id                  | Long          | 用户 ID（主键，自增）            |
| username            | String        | 用户名（唯一）                   |
| password            | String        | 密码（加密存储，不返回给客户端） |
| createdAt           | LocalDateTime | 创建时间                         |
| lastLoginAt         | LocalDateTime | 最后登录时间                     |
| failedLoginAttempts | Integer       | 登录失败次数                     |
| lockedUntil         | LocalDateTime | 账户锁定到期时间                 |

## 接口差异说明

系统提供两套认证接口：

1. **认证接口 (`/auth`)**:

   - 专门用于用户认证操作
   - 注册成功返回 201 状态码
   - 适用于纯认证场景

2. **用户管理接口 (`/users`)**:
   - 提供完整的用户管理功能
   - 包含获取用户信息和登出功能
   - 注册成功返回 200 状态码
   - 适用于用户管理场景

## 使用说明

1. **注册流程**:

   - 可选择使用 `/auth/register` 或 `/users/register` 接口创建账户
   - 用户名必须唯一，密码会被加密存储
   - 推荐使用 `/auth/register` 进行用户注册

2. **登录流程**:

   - 可选择使用 `/auth/login` 或 `/users/login` 接口登录
   - 调用登录接口获取 JWT 令牌
   - 将令牌保存在客户端（如 localStorage）
   - 推荐使用 `/auth/login` 进行用户登录

3. **认证流程**:

   - 需要认证的接口在请求头中添加：`Authorization: Bearer <token>`
   - 令牌过期后需要重新登录

4. **用户信息管理**:

   - 使用 `/users/me` 获取当前用户信息
   - 使用 `/users/logout` 进行用户登出

5. **安全注意事项**:
   - 密码传输建议使用 HTTPS
   - JWT 令牌应妥善保存，避免泄露
   - 登录失败次数过多会触发账户锁定机制

## 使用示例

### 认证接口示例

```bash
# 用户注册
curl -X POST "http://localhost:8080/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

# 用户登录
curl -X POST "http://localhost:8080/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 用户管理接口示例

```bash
# 用户注册
curl -X POST "http://localhost:8080/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

# 用户登录
curl -X POST "http://localhost:8080/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

# 获取当前用户信息
curl -X GET "http://localhost:8080/users/me" \
  -H "Authorization: Bearer your-jwt-token"

# 用户登出
curl -X POST "http://localhost:8080/users/logout" \
  -H "Authorization: Bearer your-jwt-token"
```

## 版本信息

- **API 版本**: v1.0.0
- **文档更新时间**: 2024-01-01
- **维护团队**: YiQi Team
