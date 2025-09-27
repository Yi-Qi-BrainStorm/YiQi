# 用户认证与管理功能文档

## 概述

意启头脑风暴平台的用户认证与管理模块已成功实现，提供了完整的用户注册、登录和JWT认证功能。

## 功能特性

### 1. 用户注册
- **接口**: `POST /api/users/register`
- **功能**: 创建新用户账户
- **密码加密**: 使用BCrypt算法加密存储
- **验证**: 用户名唯一性检查

### 2. 用户登录
- **接口**: `POST /api/users/login`
- **功能**: 用户身份验证
- **JWT令牌**: 生成24小时有效期的访问令牌
- **安全**: 密码验证和登录失败次数跟踪

### 3. 用户注销
- **接口**: `POST /api/users/logout`
- **功能**: 用户安全退出
- **认证**: 需要Bearer Token

## API接口详情

### 用户注册

**请求**:
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**响应**:
```json
{
  "id": 1,
  "username": "testuser",
  "createdAt": "2025-09-27T12:40:59.707365"
}
```

### 用户登录

**请求**:
```http
POST /api/users/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**响应**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "username": "testuser",
    "createdAt": "2025-09-27T12:41:00",
    "lastLoginAt": "2025-09-27T12:46:18.811299"
  }
}
```

### 用户注销

**请求**:
```http
POST /api/users/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**响应**:
```http
HTTP/1.1 200 OK
```

## 数据库配置

### 连接信息
- **数据库**: MySQL 8.0
- **数据库名**: yiqi_brainstorm
- **用户名**: root
- **密码**: mayuhao666.
- **端口**: 3306

### 用户表结构
```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL
);
```

## 安全特性

### 1. 密码安全
- 使用BCrypt算法进行密码哈希
- 密码强度要求（可配置）
- 密码不会在响应中返回

### 2. JWT认证
- 使用HS256算法签名
- 24小时令牌有效期
- 包含用户名和过期时间

### 3. 登录保护
- 登录失败次数跟踪
- 账户锁定机制（5次失败后锁定15分钟）
- 最后登录时间记录

### 4. API安全
- CORS配置
- 请求头验证
- 异常统一处理

## 技术实现

### 核心组件
- **UserController**: REST API控制器
- **UserService**: 业务逻辑服务
- **JwtService**: JWT令牌管理
- **UserMapper**: MyBatis Plus数据访问
- **SecurityConfig**: Spring Security配置

### 依赖框架
- Spring Boot 2.7.18
- Spring Security
- MyBatis Plus
- JWT (jjwt)
- BCrypt

## 测试结果

### 功能测试
✅ 用户注册功能正常
✅ 用户登录功能正常
✅ JWT令牌生成正常
✅ 数据库连接正常
✅ 密码加密存储正常

### 测试用例
1. **注册新用户**: 成功创建用户ID为1的testuser
2. **用户登录**: 成功生成JWT令牌并返回用户信息
3. **数据库存储**: 用户信息正确存储到MySQL数据库

## 配置文件

用户认证相关配置位于 `application.yml`:

```yaml
# JWT配置
yiqi:
  jwt:
    secret: yiqi-brainstorm-platform-secret-key-2024
    expiration: 86400000 # 24小时
    header: Authorization
    prefix: Bearer

# 数据库配置
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/yiqi_brainstorm
    username: root
    password: mayuhao666.
```

## 后续扩展

### 计划功能
- [ ] 用户个人资料管理
- [ ] 密码重置功能
- [ ] 邮箱验证
- [ ] 多因素认证
- [ ] 用户权限管理
- [ ] 社交登录集成

### 性能优化
- [ ] Redis缓存用户会话
- [ ] 数据库连接池优化
- [ ] JWT令牌刷新机制
- [ ] 登录日志记录

## 部署说明

1. 确保MySQL服务运行
2. 创建数据库 `yiqi_brainstorm`
3. 执行 `schema.sql` 创建表结构
4. 配置 `application.yml` 中的数据库连接
5. 启动Spring Boot应用

## 故障排除

### 常见问题
1. **数据库连接失败**: 检查MySQL服务状态和密码配置
2. **JWT令牌无效**: 检查密钥配置和令牌格式
3. **用户名重复**: 数据库唯一约束，需要使用不同用户名
4. **登录失败**: 检查用户名和密码是否正确

### 日志位置
- 应用日志: `backend/logs/yiqi-brainstorm.log`
- 控制台输出: Spring Boot启动日志

---

**文档版本**: 1.0  
**最后更新**: 2025-09-27  
**状态**: 已完成并测试通过
