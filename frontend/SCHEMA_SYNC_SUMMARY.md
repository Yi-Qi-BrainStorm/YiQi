# 前端类型定义与后端数据库表结构同步总结

## 概述
根据后端数据库表结构 (`backend/src/main/resources/schema.sql`)，对前端的类型定义、服务层和状态管理进行了全面同步更新。

## 主要变更

### 1. 用户相关类型 (`frontend/src/types/user.ts`)
- 添加了 `failedLoginAttempts` 和 `lockedUntil` 字段
- 更新了 `RegisterResponse` 接口以匹配数据库结构

### 2. 代理相关类型 (`frontend/src/types/agent.ts`)
**重大变更：**
- `id` 类型从 `string` 改为 `number`
- `role` 字段重命名为 `roleType`
- `modelType` 字段重命名为 `aiModel`
- 移除了 `modelConfig` 字段（数据库中不存在）
- 添加了 `status` 字段 (`'ACTIVE' | 'INACTIVE' | 'DELETED'`)
- 添加了 `AgentVersion` 接口用于版本管理
- 添加了 `AgentResponse` 接口对应数据库的 `agent_responses` 表
- 区分了 `AgentStatus`（数据库状态）和 `AgentRuntimeStatus`（运行时状态）

### 3. 头脑风暴相关类型 (`frontend/src/types/brainstorm.ts`)
**重大变更：**
- `id` 类型从 `string` 改为 `number`
- 添加了 `title` 和 `description` 字段
- `currentStage` 重命名为 `currentPhase`，类型改为 `PhaseType`
- 状态枚举更新为匹配数据库：`'CREATED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'`
- 添加了 `PhaseType` 和 `PhaseStatus` 枚举
- 重构了会话结构，添加了 `SessionAgent` 和 `Phase` 接口
- 更新了 WebSocket 事件类型以使用新的数据结构

### 4. API 类型更新 (`frontend/src/types/api.ts`)
- 更新了所有相关的请求和响应类型
- ID 类型从 `string` 改为 `number`
- 字段名称同步更新

### 5. 服务层更新

#### 代理服务 (`frontend/src/services/agentService.ts`)
- 所有方法的 ID 参数类型从 `string` 改为 `number`
- 更新了查询参数以匹配新的字段名
- 添加了版本管理相关方法
- 删除操作改为软删除（更新状态）

#### 头脑风暴服务 (`frontend/src/services/brainstormService.ts`)
- API 路径从 `/brainstorm/sessions` 简化为 `/sessions`
- 所有方法的 ID 参数类型从 `string` 改为 `number`
- 更新了创建会话的参数结构
- 阶段相关方法重命名（stage → phase）

### 6. 状态管理更新

#### 代理 Store (`frontend/src/stores/agents.ts`)
- 更新了所有方法签名以使用 `number` 类型的 ID
- 字段名称同步更新（`role` → `roleType`，`modelType` → `aiModel`）

#### 头脑风暴 Store (`frontend/src/stores/brainstorm.ts`)
- 重构了会话数据结构处理
- 更新了阶段进度计算逻辑
- 修改了代理状态管理以适应新的数据结构
- 更新了所有方法以使用新的类型定义

### 7. 组合式函数更新

#### useAgents (`frontend/src/composables/useAgents.ts`)
- 更新了所有方法签名
- 修改了验证逻辑以移除不存在的字段
- 更新了过滤和统计逻辑

#### useBrainstorm (`frontend/src/composables/useBrainstorm.ts`)
- 重构了会话创建方法以支持新的参数结构
- 更新了 WebSocket 事件处理
- 修改了状态检查逻辑

#### useSocket (`frontend/src/composables/useSocket.ts`)
- 更新了房间管理方法以处理数字类型的会话 ID

## 数据库表对应关系

| 前端接口 | 数据库表 | 主要字段映射 |
|---------|---------|-------------|
| `User` | `users` | `id`, `username`, `createdAt`, `lastLoginAt`, `failedLoginAttempts`, `lockedUntil` |
| `Agent` | `agents` | `id`, `userId`, `name`, `roleType`, `systemPrompt`, `aiModel`, `status` |
| `BrainstormSession` | `brainstorm_sessions` | `id`, `userId`, `title`, `description`, `topic`, `status`, `currentPhase` |
| `SessionAgent` | `session_agents` | `sessionId`, `agentId`, `status`, `joinedAt` |
| `Phase` | `phases` | `id`, `sessionId`, `phaseType`, `status`, `summary`, `startedAt`, `completedAt` |
| `AgentResponse` | `agent_responses` | `id`, `phaseId`, `agentId`, `content`, `status`, `processingTimeMs` |
| `Report` | `reports` | `id`, `sessionId`, `title`, `content`, `status`, `filePath` |

## 注意事项

1. **ID 类型变更**：所有实体的 ID 从 `string` 改为 `number`，这是一个破坏性变更
2. **字段重命名**：多个字段进行了重命名以匹配数据库命名约定
3. **数据结构重构**：头脑风暴会话的数据结构进行了重大重构以匹配关系型数据库设计
4. **状态枚举更新**：所有状态枚举都更新为匹配数据库中的值
5. **WebSocket 事件**：相关的 WebSocket 事件类型也进行了相应更新

## 后续工作

1. 更新相关的 Vue 组件以使用新的类型定义
2. 更新测试文件以匹配新的接口
3. 验证所有 API 调用是否正确
4. 更新文档和示例代码