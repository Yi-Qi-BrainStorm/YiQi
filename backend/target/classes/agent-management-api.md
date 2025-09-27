# AI 代理管理接口文档

## 概述

AI 代理管理模块提供了完整的代理生命周期管理功能，包括创建、查询、更新、删除和状态管理等操作。

**基础路径**: `/agents`

**认证方式**: Bearer Token (JWT)

---

## 接口列表

### 1. 创建 AI 代理

**接口地址**: `POST /api/agents`

**接口描述**: 创建一个新的 AI 代理

**请求头**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:

```json
{
  "name": "产品设计师",
  "roleType": "DESIGNER",
  "systemPrompt": "你是一名专业的产品设计师，擅长创新设计和用户体验优化。你需要从用户需求出发，提供创意的产品设计方案。",
  "aiModel": "qwen-plus"
}
```

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| name | String | 是 | 代理名称，2-100 个字符 | "产品设计师" |
| roleType | String | 是 | 角色类型，见角色类型枚举 | "DESIGNER" |
| systemPrompt | String | 是 | 系统提示词，10-2000 个字符 | "你是一名专业的产品设计师..." |
| aiModel | String | 是 | AI 模型名称 | "qwen-plus" |

**响应示例**:

```json
{
  "id": 1,
  "userId": 123,
  "name": "产品设计师",
  "roleType": "DESIGNER",
  "systemPrompt": "你是一名专业的产品设计师，擅长创新设计和用户体验优化。你需要从用户需求出发，提供创意的产品设计方案。",
  "aiModel": "qwen-plus",
  "status": "ACTIVE",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00"
}
```

**状态码**:

- `201`: 创建成功
- `400`: 请求参数无效
- `401`: 未授权
- `409`: 代理名称已存在

---

### 2. 获取代理列表

**接口地址**: `GET /api/agents`

**接口描述**: 获取当前用户的所有 AI 代理

**请求头**:

```
Authorization: Bearer {token}
```

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| status | String | 否 | 代理状态过滤 | "ACTIVE" |

**响应示例**:

```json
[
  {
    "id": 1,
    "name": "产品设计师",
    "roleType": "DESIGNER",
    "aiModel": "qwen-plus",
    "status": "ACTIVE",
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T10:30:00"
  },
  {
    "id": 2,
    "name": "市场调研员",
    "roleType": "MARKET_RESEARCHER",
    "aiModel": "qwen-turbo",
    "status": "ACTIVE",
    "createdAt": "2024-01-15T11:00:00",
    "updatedAt": "2024-01-15T11:00:00"
  }
]
```

**状态码**:

- `200`: 获取成功
- `401`: 未授权

---

### 3. 获取代理详情

**接口地址**: `GET /api/agents/{agentId}`

**接口描述**: 根据 ID 获取 AI 代理的详细信息

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| agentId | Long | 是 | 代理 ID |

**响应示例**:

```json
{
  "id": 1,
  "userId": 123,
  "name": "产品设计师",
  "roleType": "DESIGNER",
  "systemPrompt": "你是一名专业的产品设计师，擅长创新设计和用户体验优化。你需要从用户需求出发，提供创意的产品设计方案。",
  "aiModel": "qwen-plus",
  "status": "ACTIVE",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00"
}
```

**状态码**:

- `200`: 获取成功
- `401`: 未授权
- `404`: 代理不存在

---

### 4. 更新 AI 代理

**接口地址**: `PUT /api/agents/{agentId}`

**接口描述**: 更新指定 ID 的 AI 代理信息

**请求头**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| agentId | Long | 是 | 代理 ID |

**请求参数**:

```json
{
  "name": "高级产品设计师",
  "roleType": "DESIGNER",
  "systemPrompt": "你是一名资深的产品设计师，具有10年以上的设计经验，擅长创新设计和用户体验优化。",
  "aiModel": "qwen-max",
  "status": "ACTIVE"
}
```

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | String | 是 | 代理名称 |
| roleType | String | 是 | 角色类型 |
| systemPrompt | String | 是 | 系统提示词 |
| aiModel | String | 是 | AI 模型名称 |
| status | String | 否 | 代理状态 |

**响应示例**:

```json
{
  "id": 1,
  "userId": 123,
  "name": "高级产品设计师",
  "roleType": "DESIGNER",
  "systemPrompt": "你是一名资深的产品设计师，具有10年以上的设计经验，擅长创新设计和用户体验优化。",
  "aiModel": "qwen-max",
  "status": "ACTIVE",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T12:00:00"
}
```

**状态码**:

- `200`: 更新成功
- `400`: 请求参数无效
- `401`: 未授权
- `404`: 代理不存在
- `409`: 代理名称已存在

---

### 5. 删除 AI 代理

**接口地址**: `DELETE /api/agents/{agentId}`

**接口描述**: 删除指定 ID 的 AI 代理（软删除）

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| agentId | Long | 是 | 代理 ID |

**响应**: 无内容

**状态码**:

- `204`: 删除成功
- `401`: 未授权
- `404`: 代理不存在
- `409`: 代理正在被使用，无法删除

---

### 6. 激活代理

**接口地址**: `POST /api/agents/{agentId}/activate`

**接口描述**: 激活指定的 AI 代理

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| agentId | Long | 是 | 代理 ID |

**响应示例**:

```json
{
  "id": 1,
  "userId": 123,
  "name": "产品设计师",
  "roleType": "DESIGNER",
  "systemPrompt": "你是一名专业的产品设计师...",
  "aiModel": "qwen-plus",
  "status": "ACTIVE",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T12:30:00"
}
```

**状态码**:

- `200`: 激活成功
- `401`: 未授权
- `404`: 代理不存在

---

### 7. 停用代理

**接口地址**: `POST /api/agents/{agentId}/deactivate`

**接口描述**: 停用指定的 AI 代理

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| agentId | Long | 是 | 代理 ID |

**响应示例**:

```json
{
  "id": 1,
  "userId": 123,
  "name": "产品设计师",
  "roleType": "DESIGNER",
  "systemPrompt": "你是一名专业的产品设计师...",
  "aiModel": "qwen-plus",
  "status": "INACTIVE",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T12:35:00"
}
```

**状态码**:

- `200`: 停用成功
- `401`: 未授权
- `404`: 代理不存在
- `409`: 代理正在被使用，无法停用

---

### 8. 根据角色类型获取代理

**接口地址**: `GET /api/agents/by-role/{roleType}`

**接口描述**: 根据角色类型获取所有活跃的 AI 代理

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roleType | String | 是 | 角色类型 |

**响应示例**:

```json
[
  {
    "id": 1,
    "name": "产品设计师",
    "roleType": "DESIGNER",
    "aiModel": "qwen-plus",
    "status": "ACTIVE",
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T10:30:00"
  }
]
```

**状态码**:

- `200`: 获取成功
- `400`: 无效的角色类型

---

### 9. 获取角色类型列表

**接口地址**: `GET /api/agents/role-types`

**接口描述**: 获取所有支持的 AI 代理角色类型

**响应示例**:

```json
{
  "roleTypes": [
    {
      "name": "DESIGNER",
      "description": "设计师"
    },
    {
      "name": "MARKET_RESEARCHER",
      "description": "市场调研员"
    },
    {
      "name": "CULTURAL_RESEARCHER",
      "description": "文化调研员"
    },
    {
      "name": "ENGINEER",
      "description": "工程师"
    },
    {
      "name": "MARKETER",
      "description": "营销人员"
    },
    {
      "name": "PRODUCT_MANAGER",
      "description": "产品经理"
    },
    {
      "name": "UX_EXPERT",
      "description": "用户体验专家"
    },
    {
      "name": "BUSINESS_ANALYST",
      "description": "商业分析师"
    },
    {
      "name": "CREATIVE_DIRECTOR",
      "description": "创意总监"
    },
    {
      "name": "CUSTOM",
      "description": "自定义角色"
    }
  ],
  "predefinedRoles": [
    {
      "name": "DESIGNER",
      "description": "设计师"
    },
    {
      "name": "MARKET_RESEARCHER",
      "description": "市场调研员"
    }
  ]
}
```

**状态码**:

- `200`: 获取成功

---

### 10. 获取代理状态列表

**接口地址**: `GET /api/agents/statuses`

**接口描述**: 获取所有支持的 AI 代理状态

**响应示例**:

```json
[
  {
    "name": "ACTIVE",
    "description": "活跃"
  },
  {
    "name": "INACTIVE",
    "description": "非活跃"
  },
  {
    "name": "DELETED",
    "description": "已删除"
  }
]
```

**状态码**:

- `200`: 获取成功

---

### 11. 获取支持的 AI 模型列表

**接口地址**: `GET /api/agents/ai-models`

**接口描述**: 获取所有支持的 AI 模型

**响应示例**:

```json
[
  "qwen-plus",
  "qwen-turbo",
  "qwen-max",
  "qwen-max-longcontext",
  "gpt-3.5-turbo",
  "gpt-4",
  "gpt-4-turbo",
  "claude-3-sonnet",
  "claude-3-opus"
]
```

**状态码**:

- `200`: 获取成功

---

### 12. 检查代理名称可用性

**接口地址**: `GET /api/agents/check-name`

**接口描述**: 检查代理名称在用户下是否可用

**请求头**:

```
Authorization: Bearer {token}
```

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | String | 是 | 代理名称 |
| excludeId | Long | 否 | 排除的代理 ID（用于更新时检查） |

**响应示例**:

```json
{
  "available": true
}
```

**状态码**:

- `200`: 检查完成
- `401`: 未授权

---

## 数据模型

### AgentResponse (代理详情响应)

```json
{
  "id": "Long - 代理ID",
  "userId": "Long - 用户ID",
  "name": "String - 代理名称",
  "roleType": "String - 角色类型",
  "systemPrompt": "String - 系统提示词",
  "aiModel": "String - AI模型",
  "status": "String - 代理状态",
  "createdAt": "LocalDateTime - 创建时间",
  "updatedAt": "LocalDateTime - 更新时间"
}
```

### AgentSummaryResponse (代理摘要响应)

```json
{
  "id": "Long - 代理ID",
  "name": "String - 代理名称",
  "roleType": "String - 角色类型",
  "aiModel": "String - AI模型",
  "status": "String - 代理状态",
  "createdAt": "LocalDateTime - 创建时间",
  "updatedAt": "LocalDateTime - 更新时间"
}
```

### CreateAgentRequest (创建代理请求)

```json
{
  "name": "String - 代理名称 (必填, 2-100字符)",
  "roleType": "String - 角色类型 (必填)",
  "systemPrompt": "String - 系统提示词 (必填, 10-2000字符)",
  "aiModel": "String - AI模型 (必填)"
}
```

### UpdateAgentRequest (更新代理请求)

```json
{
  "name": "String - 代理名称 (必填, 2-100字符)",
  "roleType": "String - 角色类型 (必填)",
  "systemPrompt": "String - 系统提示词 (必填, 10-2000字符)",
  "aiModel": "String - AI模型 (必填)",
  "status": "String - 代理状态 (可选)"
}
```

---

## 错误码说明

| 状态码 | 说明               | 示例响应                                                            |
| ------ | ------------------ | ------------------------------------------------------------------- |
| 200    | 请求成功           | -                                                                   |
| 201    | 创建成功           | -                                                                   |
| 204    | 删除成功（无内容） | -                                                                   |
| 400    | 请求参数无效       | `{"error": "VALIDATION_ERROR", "message": "代理名称不能为空"}`      |
| 401    | 未授权             | `{"error": "UNAUTHORIZED", "message": "用户未认证"}`                |
| 404    | 资源不存在         | `{"error": "AGENT_NOT_FOUND", "message": "代理不存在或无权限访问"}` |
| 409    | 冲突               | `{"error": "CONFLICT", "message": "代理名称已存在"}`                |
| 500    | 服务器内部错误     | `{"error": "INTERNAL_ERROR", "message": "服务器内部错误"}`          |

---

## 使用示例

### 创建代理示例

```bash
curl -X POST "http://localhost:8080/api/agents" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "产品设计师",
    "roleType": "DESIGNER",
    "systemPrompt": "你是一名专业的产品设计师，擅长创新设计和用户体验优化。",
    "aiModel": "qwen-plus"
  }'
```

### 获取代理列表示例

```bash
curl -X GET "http://localhost:8080/api/agents?status=ACTIVE" \
  -H "Authorization: Bearer your-jwt-token"
```

### 更新代理示例

```bash
curl -X PUT "http://localhost:8080/api/agents/1" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "高级产品设计师",
    "roleType": "DESIGNER",
    "systemPrompt": "你是一名资深的产品设计师，具有10年以上的设计经验。",
    "aiModel": "qwen-max"
  }'
```

---

## 注意事项

1. **认证要求**: 所有接口都需要有效的 JWT Token
2. **权限控制**: 用户只能操作自己创建的代理
3. **软删除**: 删除操作为软删除，不会物理删除数据
4. **版本管理**: 代理更新时会自动创建版本记录
5. **依赖检查**: 删除或停用代理前会检查是否被会话使用
6. **名称唯一性**: 代理名称在用户范围内必须唯一
7. **状态管理**: 只有活跃状态的代理才能被会话使用

---

## 更新日志

- **v1.0.0** (2024-01-15): 初始版本，包含完整的代理管理功能
