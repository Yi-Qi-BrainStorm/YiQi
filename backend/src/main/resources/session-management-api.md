# 头脑风暴会话管理接口文档

## 概述

头脑风暴会话管理模块提供了完整的会话生命周期管理功能，包括创建、启动、暂停、恢复、取消会话，以及三阶段流程控制（创意生成、技术可行性分析、缺点讨论）和代理管理等操作。

## 流程

- 初始化时：NOT_STARTED
- 开始执行时：IN_PROGRESS
- 完成等待审核时：WAITING_APPROVAL
- 审核通过时：APPROVED
- 最终完成时：COMPLETED

**基础路径**: `/sessions`

**认证方式**: Bearer Token (JWT)

---

## 接口列表

### 1. 创建头脑风暴会话

**接口地址**: `POST /api/sessions`

**接口描述**: 创建一个新的头脑风暴会话，并选择参与的 AI 代理

**请求头**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:

```json
{
  "title": "产品创新头脑风暴",
  "description": "针对新产品功能的创新思考和讨论",
  "agentIds": [1, 2, 3]
}
```

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| title | String | 是 | 会话标题，不超过 200 个字符 | "产品创新头脑风暴" |
| description | String | 否 | 会话描述，不超过 1000 个字符 | "针对新产品功能的创新思考和讨论" |
| agentIds | List<Long> | 是 | 参与会话的代理 ID 列表，至少 1 个，最多 10 个 | [1, 2, 3] |

**响应示例**:

```json
{
  "id": 1,
  "userId": 123,
  "title": "产品创新头脑风暴",
  "description": "针对新产品功能的创新思考和讨论",
  "topic": null,
  "status": "CREATED",
  "currentPhase": "IDEA_GENERATION",
  "agents": [
    {
      "agentId": 1,
      "agentName": "产品设计师",
      "roleType": "DESIGNER",
      "status": "ACTIVE",
      "joinedAt": "2024-01-15T10:30:00"
    },
    {
      "agentId": 2,
      "agentName": "市场调研员",
      "roleType": "MARKET_RESEARCHER",
      "status": "ACTIVE",
      "joinedAt": "2024-01-15T10:30:00"
    }
  ],
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00"
}
```

**状态码**:

- `200`: 创建成功
- `400`: 请求参数无效
- `401`: 未授权
- `404`: 指定的代理不存在

---

### 2. 启动头脑风暴会话

**接口地址**: `POST /api/sessions/{sessionId}/start`

**接口描述**: 设置头脑风暴主题并启动会话

**请求头**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |

**请求参数**:

```json
{
  "topic": "如何设计一个更好的移动应用用户界面"
}
```

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| topic | String | 是 | 头脑风暴主题，不超过 500 个字符 | "如何设计一个更好的移动应用用户界面" |

**响应**: 无内容

**状态码**:

- `200`: 启动成功
- `400`: 请求参数无效或会话状态不允许启动
- `401`: 未授权
- `404`: 会话不存在

---

### 3. 暂停头脑风暴会话

**接口地址**: `POST /api/sessions/{sessionId}/pause`

**接口描述**: 暂停正在进行的头脑风暴会话

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |

**响应**: 无内容

**状态码**:

- `200`: 暂停成功
- `400`: 会话状态不允许暂停
- `401`: 未授权
- `404`: 会话不存在

---

### 4. 恢复头脑风暴会话

**接口地址**: `POST /api/sessions/{sessionId}/resume`

**接口描述**: 恢复已暂停的头脑风暴会话

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |

**响应**: 无内容

**状态码**:

- `200`: 恢复成功
- `400`: 会话状态不允许恢复
- `401`: 未授权
- `404`: 会话不存在

---

### 5. 取消头脑风暴会话

**接口地址**: `POST /api/sessions/{sessionId}/cancel`

**接口描述**: 取消头脑风暴会话

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |

**响应**: 无内容

**状态码**:

- `200`: 取消成功
- `401`: 未授权
- `404`: 会话不存在

---

### 6. 获取会话状态

**接口地址**: `GET /api/sessions/{sessionId}/status`

**接口描述**: 获取头脑风暴会话的详细状态信息

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |

**响应示例**:

```json
{
  "sessionId": 1,
  "sessionStatus": "IN_PROGRESS",
  "currentPhase": "IDEA_GENERATION",
  "phases": [
    {
      "phaseType": "IDEA_GENERATION",
      "status": "IN_PROGRESS",
      "summary": null,
      "startedAt": "2024-01-15T10:35:00",
      "completedAt": null,
      "responseCount": 3,
      "successfulResponseCount": 2
    },
    {
      "phaseType": "FEASIBILITY_ANALYSIS",
      "status": "NOT_STARTED",
      "summary": null,
      "startedAt": null,
      "completedAt": null,
      "responseCount": 0,
      "successfulResponseCount": 0
    },
    {
      "phaseType": "CRITICISM_DISCUSSION",
      "status": "NOT_STARTED",
      "summary": null,
      "startedAt": null,
      "completedAt": null,
      "responseCount": 0,
      "successfulResponseCount": 0
    }
  ],
  "agentCount": 3,
  "activeAgentCount": 3,
  "progressPercentage": 33,
  "lastUpdated": "2024-01-15T10:40:00"
}
```

**状态码**:

- `200`: 获取成功
- `401`: 未授权
- `404`: 会话不存在

---

### 7. 获取用户会话列表

**接口地址**: `GET /api/sessions`

**接口描述**: 获取当前用户的所有头脑风暴会话

**请求头**:

```
Authorization: Bearer {token}
```

**响应示例**:

```json
[
  {
    "id": 1,
    "userId": 123,
    "title": "产品创新头脑风暴",
    "description": "针对新产品功能的创新思考和讨论",
    "topic": "如何设计一个更好的移动应用用户界面",
    "status": "IN_PROGRESS",
    "currentPhase": "IDEA_GENERATION",
    "agents": [
      {
        "agentId": 1,
        "agentName": "产品设计师",
        "roleType": "DESIGNER",
        "status": "ACTIVE",
        "joinedAt": "2024-01-15T10:30:00"
      }
    ],
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T10:35:00"
  }
]
```

**状态码**:

- `200`: 获取成功
- `401`: 未授权

---

### 8. 获取用户活跃会话

**接口地址**: `GET /api/sessions/active`

**接口描述**: 获取当前用户正在进行或暂停的会话

**请求头**:

```
Authorization: Bearer {token}
```

**响应示例**:

```json
[
  {
    "id": 1,
    "userId": 123,
    "title": "产品创新头脑风暴",
    "description": "针对新产品功能的创新思考和讨论",
    "topic": "如何设计一个更好的移动应用用户界面",
    "status": "IN_PROGRESS",
    "currentPhase": "IDEA_GENERATION",
    "agents": [
      {
        "agentId": 1,
        "agentName": "产品设计师",
        "roleType": "DESIGNER",
        "status": "ACTIVE",
        "joinedAt": "2024-01-15T10:30:00"
      }
    ],
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T10:35:00"
  }
]
```

**状态码**:

- `200`: 获取成功
- `401`: 未授权

---

### 9. 审核通过阶段

**接口地址**: `POST /api/sessions/{sessionId}/phases/{phaseType}/approve`

**接口描述**: 审核通过指定的头脑风暴阶段

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |
| phaseType | String | 是 | 阶段类型 (IDEA_GENERATION, FEASIBILITY_ANALYSIS, CRITICISM_DISCUSSION) |

**响应**: 无内容

**状态码**:

- `200`: 审核通过成功
- `400`: 阶段状态不允许审核
- `401`: 未授权
- `404`: 会话或阶段不存在

---

### 10. 审核拒绝阶段

**接口地址**: `POST /api/sessions/{sessionId}/phases/{phaseType}/reject`

**接口描述**: 审核拒绝指定的头脑风暴阶段，需要重新执行

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |
| phaseType | String | 是 | 阶段类型 |

**响应**: 无内容

**状态码**:

- `200`: 审核拒绝成功
- `400`: 阶段状态不允许审核
- `401`: 未授权
- `404`: 会话或阶段不存在

---

### 11. 重新执行阶段

**接口地址**: `POST /api/sessions/{sessionId}/phases/{phaseType}/retry`

**接口描述**: 重新执行被拒绝的头脑风暴阶段

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |
| phaseType | String | 是 | 阶段类型 |

**响应**: 无内容

**状态码**:

- `200`: 重新执行成功
- `400`: 阶段状态不允许重新执行
- `401`: 未授权
- `404`: 会话或阶段不存在

---

### 11.5. 提交阶段审核

**接口地址**: `POST /api/sessions/{sessionId}/phases/{phaseType}/submit-for-approval`

**接口描述**: 提交头脑风暴阶段的结果等待用户审核（通常由 AI 代理或系统自动调用）

**请求头**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |
| phaseType | String | 是 | 阶段类型 |

**请求参数**:

```json
{
  "summary": "各代理从不同角度提出了创新的设计想法，包括用户界面优化、交互体验改进等方面的建议。"
}
```

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| summary | String | 是 | 阶段总结，不超过 2000 个字符 | "各代理从不同角度提出了创新的设计想法..." |

**响应**: 无内容

**状态码**:

- `200`: 提交成功
- `400`: 请求参数无效或阶段状态不允许提交
- `401`: 未授权
- `404`: 会话或阶段不存在

---

### 12. 获取阶段详情

**接口地址**: `GET /api/sessions/{sessionId}/phases/{phaseType}`

**接口描述**: 获取指定头脑风暴阶段的详细信息

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |
| phaseType | String | 是 | 阶段类型 |

**响应示例**:

```json
{
  "id": 1,
  "sessionId": 1,
  "phaseType": "IDEA_GENERATION",
  "status": "WAITING_APPROVAL",
  "summary": "各代理从不同角度提出了创新的设计想法，包括用户界面优化、交互体验改进等方面的建议。",
  "startedAt": "2024-01-15T10:35:00",
  "completedAt": "2024-01-15T11:00:00",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T11:00:00"
}
```

**状态码**:

- `200`: 获取成功
- `401`: 未授权
- `404`: 会话或阶段不存在

---

### 13. 获取会话阶段列表

**接口地址**: `GET /api/sessions/{sessionId}/phases`

**接口描述**: 获取会话的所有头脑风暴阶段

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |

**响应示例**:

```json
[
  {
    "id": 1,
    "sessionId": 1,
    "phaseType": "IDEA_GENERATION",
    "status": "COMPLETED",
    "summary": "各代理从不同角度提出了创新的设计想法。",
    "startedAt": "2024-01-15T10:35:00",
    "completedAt": "2024-01-15T11:00:00",
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T11:00:00"
  },
  {
    "id": 2,
    "sessionId": 1,
    "phaseType": "FEASIBILITY_ANALYSIS",
    "status": "IN_PROGRESS",
    "summary": null,
    "startedAt": "2024-01-15T11:00:00",
    "completedAt": null,
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T11:00:00"
  },
  {
    "id": 3,
    "sessionId": 1,
    "phaseType": "CRITICISM_DISCUSSION",
    "status": "NOT_STARTED",
    "summary": null,
    "startedAt": null,
    "completedAt": null,
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T10:30:00"
  }
]
```

**状态码**:

- `200`: 获取成功
- `401`: 未授权
- `404`: 会话不存在

---

### 14. 添加代理到会话

**接口地址**: `POST /api/sessions/{sessionId}/agents/{agentId}`

**接口描述**: 向头脑风暴会话中添加新的 AI 代理

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |
| agentId | Long | 是 | 代理 ID |

**响应**: 无内容

**状态码**:

- `200`: 添加成功
- `400`: 代理已在会话中
- `401`: 未授权
- `404`: 会话或代理不存在

---

### 15. 从会话中移除代理

**接口地址**: `DELETE /api/sessions/{sessionId}/agents/{agentId}`

**接口描述**: 从头脑风暴会话中移除指定的 AI 代理

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |
| agentId | Long | 是 | 代理 ID |

**响应**: 无内容

**状态码**:

- `200`: 移除成功
- `400`: 代理不在会话中
- `401`: 未授权
- `404`: 会话不存在

---

### 16. 执行创意生成阶段

**接口地址**: `POST /api/sessions/{sessionId}/phases/IDEA_GENERATION/execute`

**接口描述**: 执行创意生成阶段的AI代理推理过程，调用AI生成创意想法并自动提交审核

**请求头**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |

**请求参数**:

```json
{
  "topic": "如何设计一个更好的移动应用用户界面"
}
```

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| topic | String | 是 | 头脑风暴主题，不超过 500 个字符 | "如何设计一个更好的移动应用用户界面" |

**响应**: 无内容

**状态码**:

- `200`: 执行成功，AI推理完成并自动提交审核
- `400`: 请求参数无效或会话状态不允许执行
- `401`: 未授权
- `404`: 会话不存在
- `500`: AI推理执行失败

**说明**:
- 该接口会调用所有参与会话的AI代理执行创意生成任务
- 所有代理的响应内容会被收集并存储到phases表的summary字段中
- 执行完成后会自动调用submit-for-approval接口提交审核
- 阶段状态会从IN_PROGRESS变为WAITING_APPROVAL

---

### 17. 执行技术可行性分析阶段

**接口地址**: `POST /api/sessions/{sessionId}/phases/FEASIBILITY_ANALYSIS/execute`

**接口描述**: 执行技术可行性分析阶段的AI代理推理过程，调用AI评估前面阶段想法的技术可行性

**请求头**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |

**请求参数**:

```json
{
  "topic": "评估前面创意想法的技术可行性"
}
```

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| topic | String | 是 | 分析主题，不超过 500 个字符 | "评估前面创意想法的技术可行性" |

**响应**: 无内容

**状态码**:

- `200`: 执行成功，AI推理完成并自动提交审核
- `400`: 请求参数无效或会话状态不允许执行
- `401`: 未授权
- `404`: 会话不存在
- `500`: AI推理执行失败

**说明**:
- 该接口会调用所有参与会话的AI代理执行技术可行性分析任务
- 所有代理的响应内容会被收集并存储到phases表的summary字段中
- 执行完成后会自动调用submit-for-approval接口提交审核
- 阶段状态会从IN_PROGRESS变为WAITING_APPROVAL

---

### 18. 执行缺点讨论阶段

**接口地址**: `POST /api/sessions/{sessionId}/phases/DRAWBACK_DISCUSSION/execute`

**接口描述**: 执行缺点讨论阶段的AI代理推理过程，调用AI讨论前面阶段想法的潜在缺点和改进建议

**请求头**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |

**请求参数**:

```json
{
  "topic": "讨论前面想法的潜在缺点和改进建议"
}
```

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| topic | String | 是 | 讨论主题，不超过 500 个字符 | "讨论前面想法的潜在缺点和改进建议" |

**响应**: 无内容

**状态码**:

- `200`: 执行成功，AI推理完成并自动提交审核
- `400`: 请求参数无效或会话状态不允许执行
- `401`: 未授权
- `404`: 会话不存在
- `500`: AI推理执行失败

**说明**:
- 该接口会调用所有参与会话的AI代理执行缺点讨论任务
- 所有代理的响应内容会被收集并存储到phases表的summary字段中
- 执行完成后会自动调用submit-for-approval接口提交审核
- 阶段状态会从IN_PROGRESS变为WAITING_APPROVAL

---

## 数据模型

### SessionResponse (会话详情响应)

```json
{
  "id": "Long - 会话ID",
  "userId": "Long - 用户ID",
  "title": "String - 会话标题",
  "description": "String - 会话描述",
  "topic": "String - 头脑风暴主题",
  "status": "String - 会话状态",
  "currentPhase": "String - 当前阶段",
  "agents": "List<SessionAgentInfo> - 参与代理列表",
  "createdAt": "LocalDateTime - 创建时间",
  "updatedAt": "LocalDateTime - 更新时间"
}
```

### SessionStatusResponse (会话状态响应)

```json
{
  "sessionId": "Long - 会话ID",
  "sessionStatus": "String - 会话状态",
  "currentPhase": "String - 当前阶段",
  "phases": "List<PhaseInfo> - 阶段详情列表",
  "agentCount": "Integer - 参与代理数量",
  "activeAgentCount": "Integer - 活跃代理数量",
  "progressPercentage": "Integer - 会话进度百分比",
  "lastUpdated": "LocalDateTime - 最后更新时间"
}
```

### CreateSessionRequest (创建会话请求)

```json
{
  "title": "String - 会话标题 (必填, 不超过200字符)",
  "description": "String - 会话描述 (可选, 不超过1000字符)",
  "agentIds": "List<Long> - 参与代理ID列表 (必填, 1-10个)"
}
```

### StartSessionRequest (启动会话请求)

```json
{
  "topic": "String - 头脑风暴主题 (必填, 不超过500字符)"
}
```

### SubmitPhaseForApprovalRequest (提交阶段审核请求)

```json
{
  "summary": "String - 阶段总结 (必填, 不超过2000字符)"
}
```

### SessionAgentInfo (会话代理信息)

```json
{
  "agentId": "Long - 代理ID",
  "agentName": "String - 代理名称",
  "roleType": "String - 角色类型",
  "status": "String - 代理状态",
  "joinedAt": "LocalDateTime - 加入时间"
}
```

### PhaseInfo (阶段信息)

```json
{
  "phaseType": "String - 阶段类型",
  "status": "String - 阶段状态",
  "summary": "String - 阶段总结",
  "startedAt": "LocalDateTime - 开始时间",
  "completedAt": "LocalDateTime - 完成时间",
  "responseCount": "Integer - 响应数量",
  "successfulResponseCount": "Integer - 成功响应数量"
}
```

---

## 枚举说明

### SessionStatus (会话状态)

| 状态        | 说明                        |
| ----------- | --------------------------- |
| CREATED     | 已创建 - 会话已创建但未开始 |
| IN_PROGRESS | 进行中 - 会话正在进行       |
| PAUSED      | 已暂停 - 会话已暂停         |
| COMPLETED   | 已完成 - 会话已完成所有阶段 |
| CANCELLED   | 已取消 - 会话被用户取消     |

### PhaseType (阶段类型)

| 阶段                 | 说明                                                            |
| -------------------- | --------------------------------------------------------------- |
| IDEA_GENERATION      | 创意生成 - 每个代理从自己的职业角度进行独立头脑风暴             |
| FEASIBILITY_ANALYSIS | 技术可行性分析 - 每个代理从自己的职业角度评判其他代理的创意想法 |
| CRITICISM_DISCUSSION | 缺点讨论 - 每个代理从自己的职业角度评判和讨论前面阶段的想法缺点 |

### PhaseStatus (阶段状态)

| 状态             | 说明                                    |
| ---------------- | --------------------------------------- |
| NOT_STARTED      | 未开始 - 阶段尚未开始                   |
| IN_PROGRESS      | 进行中 - 阶段正在进行，代理正在思考     |
| WAITING_APPROVAL | 等待审核 - 阶段完成，等待用户审核       |
| APPROVED         | 已通过 - 用户审核通过，可以进入下一阶段 |
| REJECTED         | 已拒绝 - 用户审核拒绝，需要重新执行     |
| COMPLETED        | 已完成 - 阶段最终完成                   |

---

## 错误码说明

| 状态码 | 说明           | 示例响应                                                              |
| ------ | -------------- | --------------------------------------------------------------------- |
| 200    | 请求成功       | -                                                                     |
| 400    | 请求参数无效   | `{"error": "VALIDATION_ERROR", "message": "会话标题不能为空"}`        |
| 401    | 未授权         | `{"error": "UNAUTHORIZED", "message": "用户未认证"}`                  |
| 404    | 资源不存在     | `{"error": "SESSION_NOT_FOUND", "message": "会话不存在或无权限访问"}` |
| 409    | 冲突           | `{"error": "CONFLICT", "message": "代理已在会话中"}`                  |
| 500    | 服务器内部错误 | `{"error": "INTERNAL_ERROR", "message": "服务器内部错误"}`            |

---

## 使用示例

### 创建会话示例

```bash
curl -X POST "http://localhost:8080/api/sessions" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "产品创新头脑风暴",
    "description": "针对新产品功能的创新思考和讨论",
    "agentIds": [1, 2, 3]
  }'
```

### 启动会话示例

```bash
curl -X POST "http://localhost:8080/api/sessions/1/start" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "如何设计一个更好的移动应用用户界面"
  }'
```

### 获取会话状态示例

```bash
curl -X GET "http://localhost:8080/api/sessions/1/status" \
  -H "Authorization: Bearer your-jwt-token"
```

### 提交阶段审核示例

```bash
curl -X POST "http://localhost:8080/api/sessions/1/phases/IDEA_GENERATION/submit-for-approval" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "各代理从不同角度提出了创新的设计想法，包括用户界面优化、交互体验改进等方面的建议。"
  }'
```

### 审核通过阶段示例

```bash
curl -X POST "http://localhost:8080/api/sessions/1/phases/IDEA_GENERATION/approve" \
  -H "Authorization: Bearer your-jwt-token"
```

### 执行创意生成阶段示例

```bash
curl -X POST "http://localhost:8080/api/sessions/1/phases/IDEA_GENERATION/execute" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "如何设计一个更好的移动应用用户界面"
  }'
```

### 执行技术可行性分析阶段示例

```bash
curl -X POST "http://localhost:8080/api/sessions/1/phases/FEASIBILITY_ANALYSIS/execute" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "评估前面创意想法的技术可行性"
  }'
```

### 执行缺点讨论阶段示例

```bash
curl -X POST "http://localhost:8080/api/sessions/1/phases/DRAWBACK_DISCUSSION/execute" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "讨论前面想法的潜在缺点和改进建议"
  }'
```

---

## 业务流程说明

### 头脑风暴会话流程

1. **创建会话**: 用户创建会话并选择参与的 AI 代理
2. **启动会话**: 设置头脑风暴主题，会话进入进行中状态，自动开始第一阶段
3. **阶段执行**: 三个阶段按顺序执行
   - **创意生成阶段**: 各代理独立提出创意想法
   - **技术可行性分析阶段**: 各代理评估前一阶段的想法
   - **缺点讨论阶段**: 各代理讨论想法的缺点和改进建议
4. **提交审核**: 每个阶段完成后，系统调用 submit-for-approval 接口提交总结
5. **用户审核**: 用户审核阶段结果，决定通过或拒绝
6. **阶段流转**: 审核通过后自动进入下一阶段，拒绝则需要重新执行
7. **会话完成**: 所有阶段完成后，会话状态变为已完成

### 阶段状态流转

```
NOT_STARTED → IN_PROGRESS → [submit-for-approval] → WAITING_APPROVAL → APPROVED → COMPLETED
                                                           ↓
                                                       REJECTED → [retry] → IN_PROGRESS
```

**说明**:

- `[submit-for-approval]`: 系统或 AI 代理调用提交审核接口
- `[retry]`: 用户调用重新执行接口

### 会话状态流转

```
CREATED → IN_PROGRESS ⇄ PAUSED
            ↓
        COMPLETED / CANCELLED
```

### 阶段执行说明

每个阶段的执行可以通过以下两种方式完成：

1. **手动执行**: 使用对应的执行接口触发AI推理
   - `POST /api/sessions/{sessionId}/phases/IDEA_GENERATION/execute`
   - `POST /api/sessions/{sessionId}/phases/FEASIBILITY_ANALYSIS/execute`
   - `POST /api/sessions/{sessionId}/phases/DRAWBACK_DISCUSSION/execute`

2. **自动执行**: 系统在特定条件下自动触发执行（如审核通过后自动进入下一阶段）

当使用手动执行接口时，系统会：
- 调用所有参与会话的AI代理执行对应任务
- 收集所有代理的响应内容并存储到phases表的summary字段中
- 自动调用submit-for-approval接口提交审核
- 将阶段状态更新为WAITING_APPROVAL

这种方式确保了所有AI推理结果都能被正确记录和审核。

</final_file_content>

IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.



<environment_details>
# VSCode Visible Files
YiQi/backend/src/main/resources/session-management-api.md

# VSCode Open Tabs
YiQi/backend/src/main/java/com/yiqi/controller/AIServiceAdminController.java
YiQi/backend/src/main/java/com/yiqi/service/InferenceStatusService.java
YiQi/backend/src/main/java/com/yiqi/service/SessionService.java
YiQi/backend/src/main/java/com/yiqi/service/AgentService.java
YiQi/backend/src/main/java/com/yiqi/service/AIServiceHealthMonitor.java
YiQi/backend/src/main/java/com/yiqi/dto/ai/QiniuAIResponse.java
YiQi/backend/src/main/java/com/yiqi/dto/ai/AgentInferenceRequest.java
YiQi/backend/src/main/java/com/yiqi/enums/PhaseType.java
YiQi/backend/src/main/java/com/yiqi/dto/parallel/SessionPhaseInferenceRequest.java
YiQi/backend/src/main/java/com/yiqi/service/AIInferenceService.java
YiQi/backend/src/main/java/com/yiqi/dto/parallel/CustomParallelInferenceRequest.java
YiQi/backend/src/main/java/com/yiqi/dto/parallel/BatchMultiPhaseInferenceRequest.java
YiQi/backend/src/main/java/com/yiqi/dto/parallel/PhaseInferenceConfig.java
YiQi/backend/src/main/java/com/yiqi/exception/TestException.java
YiQi/backend/src/main/java/com/yiqi/service/QiniuAIService.java
YiQi/backend/src/main/resources/ai-inference-controller-api.md
YiQi/backend/src/main/resources/parallel-inference-api.md
YiQi/backend/src/main/java/com/yiqi/service/PhaseService.java
YiQi/backend/src/main/resources/session-management-api.md
YiQi/backend/src/main/java/com/yiqi/controller/AIInferenceController.java
YiQi/backend/src/main/java/com/yiqi/controller/ParallelInferenceController.java

# Current Time
2025/9/28 下午12:20:23 (Asia/Shanghai, UTC+8:00)

# Current Mode
ACT MODE
# 头脑风暴会话管理接口文档

## 概述

头脑风暴会话管理模块提供了完整的会话生命周期管理功能，包括创建、启动、暂停、恢复、取消会话，以及三阶段流程控制（创意生成、技术可行性分析、缺点讨论）和代理管理等操作。

## 流程

- 初始化时：NOT_STARTED
- 开始执行时：IN_PROGRESS
- 完成等待审核时：WAITING_APPROVAL
- 审核通过时：APPROVED
- 最终完成时：COMPLETED

**基础路径**: `/sessions`

**认证方式**: Bearer Token (JWT)

---

## 接口列表

### 1. 创建头脑风暴会话

**接口地址**: `POST /api/sessions`

**接口描述**: 创建一个新的头脑风暴会话，并选择参与的 AI 代理

**请求头**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:

```json
{
  "title": "产品创新头脑风暴",
  "description": "针对新产品功能的创新思考和讨论",
  "agentIds": [1, 2, 3]
}
```

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| title | String | 是 | 会话标题，不超过 200 个字符 | "产品创新头脑风暴" |
| description | String | 否 | 会话描述，不超过 1000 个字符 | "针对新产品功能的创新思考和讨论" |
| agentIds | List<Long> | 是 | 参与会话的代理 ID 列表，至少 1 个，最多 10 个 | [1, 2, 3] |

**响应示例**:

```json
{
  "id": 1,
  "userId": 123,
  "title": "产品创新头脑风暴",
  "description": "针对新产品功能的创新思考和讨论",
  "topic": null,
  "status": "CREATED",
  "currentPhase": "IDEA_GENERATION",
  "agents": [
    {
      "agentId": 1,
      "agentName": "产品设计师",
      "roleType": "DESIGNER",
      "status": "ACTIVE",
      "joinedAt": "2024-01-15T10:30:00"
    },
    {
      "agentId": 2,
      "agentName": "市场调研员",
      "roleType": "MARKET_RESEARCHER",
      "status": "ACTIVE",
      "joinedAt": "2024-01-15T10:30:00"
    }
  ],
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00"
}
```

**状态码**:

- `200`: 创建成功
- `400`: 请求参数无效
- `401`: 未授权
- `404`: 指定的代理不存在

---

### 2. 启动头脑风暴会话

**接口地址**: `POST /api/sessions/{sessionId}/start`

**接口描述**: 设置头脑风暴主题并启动会话

**请求头**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |

**请求参数**:

```json
{
  "topic": "如何设计一个更好的移动应用用户界面"
}
```

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| topic | String | 是 | 头脑风暴主题，不超过 500 个字符 | "如何设计一个更好的移动应用用户界面" |

**响应**: 无内容

**状态码**:

- `200`: 启动成功
- `400`: 请求参数无效或会话状态不允许启动
- `401`: 未授权
- `404`: 会话不存在

---

### 3. 暂停头脑风暴会话

**接口地址**: `POST /api/sessions/{sessionId}/pause`

**接口描述**: 暂停正在进行的头脑风暴会话

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |

**响应**: 无内容

**状态码**:

- `200`: 暂停成功
- `400`: 会话状态不允许暂停
- `401`: 未授权
- `404`: 会话不存在

---

### 4. 恢复头脑风暴会话

**接口地址**: `POST /api/sessions/{sessionId}/resume`

**接口描述**: 恢复已暂停的头脑风暴会话

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |

**响应**: 无内容

**状态码**:

- `200`: 恢复成功
- `400`: 会话状态不允许恢复
- `401`: 未授权
- `404`: 会话不存在

---

### 5. 取消头脑风暴会话

**接口地址**: `POST /api/sessions/{sessionId}/cancel`

**接口描述**: 取消头脑风暴会话

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |

**响应**: 无内容

**状态码**:

- `200`: 取消成功
- `401`: 未授权
- `404`: 会话不存在

---

### 6. 获取会话状态

**接口地址**: `GET /api/sessions/{sessionId}/status`

**接口描述**: 获取头脑风暴会话的详细状态信息

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |

**响应示例**:

```json
{
  "sessionId": 1,
  "sessionStatus": "IN_PROGRESS",
  "currentPhase": "IDEA_GENERATION",
  "phases": [
    {
      "phaseType": "IDEA_GENERATION",
      "status": "IN_PROGRESS",
      "summary": null,
      "startedAt": "2024-01-15T10:35:00",
      "completedAt": null,
      "responseCount": 3,
      "successfulResponseCount": 2
    },
    {
      "phaseType": "FEASIBILITY_ANALYSIS",
      "status": "NOT_STARTED",
      "summary": null,
      "startedAt": null,
      "completedAt": null,
      "responseCount": 0,
      "successfulResponseCount": 0
    },
    {
      "phaseType": "CRITICISM_DISCUSSION",
      "status": "NOT_STARTED",
      "summary": null,
      "startedAt": null,
      "completedAt": null,
      "responseCount": 0,
      "successfulResponseCount": 0
    }
  ],
  "agentCount": 3,
  "activeAgentCount": 3,
  "progressPercentage": 33,
  "lastUpdated": "2024-01-15T10:40:00"
}
```

**状态码**:

- `200`: 获取成功
- `401`: 未授权
- `404`: 会话不存在

---

### 7. 获取用户会话列表

**接口地址**: `GET /api/sessions`

**接口描述**: 获取当前用户的所有头脑风暴会话

**请求头**:

```
Authorization: Bearer {token}
```

**响应示例**:

```json
[
  {
    "id": 1,
    "userId": 123,
    "title": "产品创新头脑风暴",
    "description": "针对新产品功能的创新思考和讨论",
    "topic": "如何设计一个更好的移动应用用户界面",
    "status": "IN_PROGRESS",
    "currentPhase": "IDEA_GENERATION",
    "agents": [
      {
        "agentId": 1,
        "agentName": "产品设计师",
        "roleType": "DESIGNER",
        "status": "ACTIVE",
        "joinedAt": "2024-01-15T10:30:00"
      }
    ],
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T10:35:00"
  }
]
```

**状态码**:

- `200`: 获取成功
- `401`: 未授权

---

### 8. 获取用户活跃会话

**接口地址**: `GET /api/sessions/active`

**接口描述**: 获取当前用户正在进行或暂停的会话

**请求头**:

```
Authorization: Bearer {token}
```

**响应示例**:

```json
[
  {
    "id": 1,
    "userId": 123,
    "title": "产品创新头脑风暴",
    "description": "针对新产品功能的创新思考和讨论",
    "topic": "如何设计一个更好的移动应用用户界面",
    "status": "IN_PROGRESS",
    "currentPhase": "IDEA_GENERATION",
    "agents": [
      {
        "agentId": 1,
        "agentName": "产品设计师",
        "roleType": "DESIGNER",
        "status": "ACTIVE",
        "joinedAt": "2024-01-15T10:30:00"
      }
    ],
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T10:35:00"
  }
]
```

**状态码**:

- `200`: 获取成功
- `401`: 未授权

---

### 9. 审核通过阶段

**接口地址**: `POST /api/sessions/{sessionId}/phases/{phaseType}/approve`

**接口描述**: 审核通过指定的头脑风暴阶段

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |
| phaseType | String | 是 | 阶段类型 (IDEA_GENERATION, FEASIBILITY_ANALYSIS, CRITICISM_DISCUSSION) |

**响应**: 无内容

**状态码**:

- `200`: 审核通过成功
- `400`: 阶段状态不允许审核
- `401`: 未授权
- `404`: 会话或阶段不存在

---

### 10. 审核拒绝阶段

**接口地址**: `POST /api/sessions/{sessionId}/phases/{phaseType}/reject`

**接口描述**: 审核拒绝指定的头脑风暴阶段，需要重新执行

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |
| phaseType | String | 是 | 阶段类型 |

**响应**: 无内容

**状态码**:

- `200`: 审核拒绝成功
- `400`: 阶段状态不允许审核
- `401`: 未授权
- `404`: 会话或阶段不存在

---

### 11. 重新执行阶段

**接口地址**: `POST /api/sessions/{sessionId}/phases/{phaseType}/retry`

**接口描述**: 重新执行被拒绝的头脑风暴阶段

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |
| phaseType | String | 是 | 阶段类型 |

**响应**: 无内容

**状态码**:

- `200`: 重新执行成功
- `400`: 阶段状态不允许重新执行
- `401`: 未授权
- `404`: 会话或阶段不存在

---

### 11.5. 提交阶段审核

**接口地址**: `POST /api/sessions/{sessionId}/phases/{phaseType}/submit-for-approval`

**接口描述**: 提交头脑风暴阶段的结果等待用户审核（通常由 AI 代理或系统自动调用）

**请求头**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |
| phaseType | String | 是 | 阶段类型 |

**请求参数**:

```json
{
  "summary": "各代理从不同角度提出了创新的设计想法，包括用户界面优化、交互体验改进等方面的建议。"
}
```

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| summary | String | 是 | 阶段总结，不超过 2000 个字符 | "各代理从不同角度提出了创新的设计想法..." |

**响应**: 无内容

**状态码**:

- `200`: 提交成功
- `400`: 请求参数无效或阶段状态不允许提交
- `401`: 未授权
- `404`: 会话或阶段不存在

---

### 12. 获取阶段详情

**接口地址**: `GET /api/sessions/{sessionId}/phases/{phaseType}`

**接口描述**: 获取指定头脑风暴阶段的详细信息

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |
| phaseType | String | 是 | 阶段类型 |

**响应示例**:

```json
{
  "id": 1,
  "sessionId": 1,
  "phaseType": "IDEA_GENERATION",
  "status": "WAITING_APPROVAL",
  "summary": "各代理从不同角度提出了创新的设计想法，包括用户界面优化、交互体验改进等方面的建议。",
  "startedAt": "2024-01-15T10:35:00",
  "completedAt": "2024-01-15T11:00:00",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T11:00:00"
}
```

**状态码**:

- `200`: 获取成功
- `401`: 未授权
- `404`: 会话或阶段不存在

---

### 13. 获取会话阶段列表

**接口地址**: `GET /api/sessions/{sessionId}/phases`

**接口描述**: 获取会话的所有头脑风暴阶段

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |

**响应示例**:

```json
[
  {
    "id": 1,
    "sessionId": 1,
    "phaseType": "IDEA_GENERATION",
    "status": "COMPLETED",
    "summary": "各代理从不同角度提出了创新的设计想法。",
    "startedAt": "2024-01-15T10:35:00",
    "completedAt": "2024-01-15T11:00:00",
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T11:00:00"
  },
  {
    "id": 2,
    "sessionId": 1,
    "phaseType": "FEASIBILITY_ANALYSIS",
    "status": "IN_PROGRESS",
    "summary": null,
    "startedAt": "2024-01-15T11:00:00",
    "completedAt": null,
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T11:00:00"
  },
  {
    "id": 3,
    "sessionId": 1,
    "phaseType": "CRITICISM_DISCUSSION",
    "status": "NOT_STARTED",
    "summary": null,
    "startedAt": null,
    "completedAt": null,
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T10:30:00"
  }
]
```

**状态码**:

- `200`: 获取成功
- `401`: 未授权
- `404`: 会话不存在

---

### 14. 添加代理到会话

**接口地址**: `POST /api/sessions/{sessionId}/agents/{agentId}`

**接口描述**: 向头脑风暴会话中添加新的 AI 代理

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |
| agentId | Long | 是 | 代理 ID |

**响应**: 无内容

**状态码**:

- `200`: 添加成功
- `400`: 代理已在会话中
- `401`: 未授权
- `404`: 会话或代理不存在

---

### 15. 从会话中移除代理

**接口地址**: `DELETE /api/sessions/{sessionId}/agents/{agentId}`

**接口描述**: 从头脑风暴会话中移除指定的 AI 代理

**请求头**:

```
Authorization: Bearer {token}
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |
| agentId | Long | 是 | 代理 ID |

**响应**: 无内容

**状态码**:

- `200`: 移除成功
- `400`: 代理不在会话中
- `401`: 未授权
- `404`: 会话不存在

---

### 16. 执行创意生成阶段

**接口地址**: `POST /api/sessions/{sessionId}/phases/IDEA_GENERATION/execute`

**接口描述**: 执行创意生成阶段的AI代理推理过程，调用AI生成创意想法并自动提交审核

**请求头**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |

**请求参数**:

```json
{
  "topic": "如何设计一个更好的移动应用用户界面"
}
```

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| topic | String | 是 | 头脑风暴主题，不超过 500 个字符 | "如何设计一个更好的移动应用用户界面" |

**响应**: 无内容

**状态码**:

- `200`: 执行成功，AI推理完成并自动提交审核
- `400`: 请求参数无效或会话状态不允许执行
- `401`: 未授权
- `404`: 会话不存在
- `500`: AI推理执行失败

**说明**:
- 该接口会调用所有参与会话的AI代理执行创意生成任务
- 所有代理的响应内容会被收集并存储到phases表的summary字段中
- 执行完成后会自动调用submit-for-approval接口提交审核
- 阶段状态会从IN_PROGRESS变为WAITING_APPROVAL

---

### 17. 执行技术可行性分析阶段

**接口地址**: `POST /api/sessions/{sessionId}/phases/FEASIBILITY_ANALYSIS/execute`

**接口描述**: 执行技术可行性分析阶段的AI代理推理过程，调用AI评估前面阶段想法的技术可行性

**请求头**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |

**请求参数**:

```json
{
  "topic": "评估前面创意想法的技术可行性"
}
```

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| topic | String | 是 | 分析主题，不超过 500 个字符 | "评估前面创意想法的技术可行性" |

**响应**: 无内容

**状态码**:

- `200`: 执行成功，AI推理完成并自动提交审核
- `400`: 请求参数无效或会话状态不允许执行
- `401`: 未授权
- `404`: 会话不存在
- `500`: AI推理执行失败

**说明**:
- 该接口会调用所有参与会话的AI代理执行技术可行性分析任务
- 所有代理的响应内容会被收集并存储到phases表的summary字段中
- 执行完成后会自动调用submit-for-approval接口提交审核
- 阶段状态会从IN_PROGRESS变为WAITING_APPROVAL

---

### 18. 执行缺点讨论阶段

**接口地址**: `POST /api/sessions/{sessionId}/phases/DRAWBACK_DISCUSSION/execute`

**接口描述**: 执行缺点讨论阶段的AI代理推理过程，调用AI讨论前面阶段想法的潜在缺点和改进建议

**请求头**:

```
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |

**请求参数**:

```json
{
  "topic": "讨论前面想法的潜在缺点和改进建议"
}
```

**参数说明**:
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| topic | String | 是 | 讨论主题，不超过 500 个字符 | "讨论前面想法的潜在缺点和改进建议" |

**响应**: 无内容

**状态码**:

- `200`: 执行成功，AI推理完成并自动提交审核
- `400`: 请求参数无效或会话状态不允许执行
- `401`: 未授权
- `404`: 会话不存在
- `500`: AI推理执行失败

**说明**:
- 该接口会调用所有参与会话的AI代理执行缺点讨论任务
- 所有代理的响应内容会被收集并存储到phases表的summary字段中
- 执行完成后会自动调用submit-for-approval接口提交审核
- 阶段状态会从IN_PROGRESS变为WAITING_APPROVAL

---

## 数据模型

### SessionResponse (会话详情响应)

```json
{
  "id": "Long - 会话ID",
  "userId": "Long - 用户ID",
  "title": "String - 会话标题",
  "description": "String - 会话描述",
  "topic": "String - 头脑风暴主题",
  "status": "String - 会话状态",
  "currentPhase": "String - 当前阶段",
  "agents": "List<SessionAgentInfo> - 参与代理列表",
  "createdAt": "LocalDateTime - 创建时间",
  "updatedAt": "LocalDateTime - 更新时间"
}
```

### SessionStatusResponse (会话状态响应)

```json
{
  "sessionId": "Long - 会话ID",
  "sessionStatus": "String - 会话状态",
  "currentPhase": "String - 当前阶段",
  "phases": "List<PhaseInfo> - 阶段详情列表",
  "agentCount": "Integer - 参与代理数量",
  "activeAgentCount": "Integer - 活跃代理数量",
  "progressPercentage": "Integer - 会话进度百分比",
  "lastUpdated": "LocalDateTime - 最后更新时间"
}
```

### CreateSessionRequest (创建会话请求)

```json
{
  "title": "String - 会话标题 (必填, 不超过200字符)",
  "description": "String - 会话描述 (可选, 不超过1000字符)",
  "agentIds": "List<Long> - 参与代理ID列表 (必填, 1-10个)"
}
```

### StartSessionRequest (启动会话请求)

```json
{
  "topic": "String - 头脑风暴主题 (必填, 不超过500字符)"
}
```

### SubmitPhaseForApprovalRequest (提交阶段审核请求)

```json
{
  "summary": "String - 阶段总结 (必填, 不超过2000字符)"
}
```

### SessionAgentInfo (会话代理信息)

```json
{
  "agentId": "Long - 代理ID",
  "agentName": "String - 代理名称",
  "roleType": "String - 角色类型",
  "status": "String - 代理状态",
  "joinedAt": "LocalDateTime - 加入时间"
}
```

### PhaseInfo (阶段信息)

```json
{
  "phaseType": "String - 阶段类型",
  "status": "String - 阶段状态",
  "summary": "String - 阶段总结",
  "startedAt": "LocalDateTime - 开始时间",
  "completedAt": "LocalDateTime - 完成时间",
  "responseCount": "Integer - 响应数量",
  "successfulResponseCount": "Integer - 成功响应数量"
}
```

---

## 枚举说明

### SessionStatus (会话状态)

| 状态        | 说明                        |
| ----------- | --------------------------- |
| CREATED     | 已创建 - 会话已创建但未开始 |
| IN_PROGRESS | 进行中 - 会话正在进行       |
| PAUSED      | 已暂停 - 会话已暂停         |
| COMPLETED   | 已完成 - 会话已完成所有阶段 |
| CANCELLED   | 已取消 - 会话被用户取消     |

### PhaseType (阶段类型)

| 阶段                 | 说明                                                            |
| -------------------- | --------------------------------------------------------------- |
| IDEA_GENERATION      | 创意生成 - 每个代理从自己的职业角度进行独立头脑风暴             |
| FEASIBILITY_ANALYSIS | 技术可行性分析 - 每个代理从自己的职业角度评判其他代理的创意想法 |
| CRITICISM_DISCUSSION | 缺点讨论 - 每个代理从自己的职业角度评判和讨论前面阶段的想法缺点 |

### PhaseStatus (阶段状态)

| 状态             | 说明                                    |
| ---------------- | --------------------------------------- |
| NOT_STARTED      | 未开始 - 阶段尚未开始                   |
| IN_PROGRESS      | 进行中 - 阶段正在进行，代理正在思考     |
| WAITING_APPROVAL | 等待审核 - 阶段完成，等待用户审核       |
| APPROVED         | 已通过 - 用户审核通过，可以进入下一阶段 |
| REJECTED         | 已拒绝 - 用户审核拒绝，需要重新执行     |
| COMPLETED        | 已完成 - 阶段最终完成                   |

---

## 错误码说明

| 状态码 | 说明           | 示例响应                                                              |
| ------ | -------------- | --------------------------------------------------------------------- |
| 200    | 请求成功       | -                                                                     |
| 400    | 请求参数无效   | `{"error": "VALIDATION_ERROR", "message": "会话标题不能为空"}`        |
| 401    | 未授权         | `{"error": "UNAUTHORIZED", "message": "用户未认证"}`                  |
| 404    | 资源不存在     | `{"error": "SESSION_NOT_FOUND", "message": "会话不存在或无权限访问"}` |
| 409    | 冲突           | `{"error": "CONFLICT", "message": "代理已在会话中"}`                  |
| 500    | 服务器内部错误 | `{"error": "INTERNAL_ERROR", "message": "服务器内部错误"}`            |

---

## 使用示例

### 创建会话示例

```bash
curl -X POST "http://localhost:8080/api/sessions" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "产品创新头脑风暴",
    "description": "针对新产品功能的创新思考和讨论",
    "agentIds": [1, 2, 3]
  }'
```

### 启动会话示例

```bash
curl -X POST "http://localhost:8080/api/sessions/1/start" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "如何设计一个更好的移动应用用户界面"
  }'
```

### 获取会话状态示例

```bash
curl -X GET "http://localhost:8080/api/sessions/1/status" \
  -H "Authorization: Bearer your-jwt-token"
```

### 提交阶段审核示例

```bash
curl -X POST "http://localhost:8080/api/sessions/1/phases/IDEA_GENERATION/submit-for-approval" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "各代理从不同角度提出了创新的设计想法，包括用户界面优化、交互体验改进等方面的建议。"
  }'
```

### 审核通过阶段示例

```bash
curl -X POST "http://localhost:8080/api/sessions/1/phases/IDEA_GENERATION/approve" \
  -H "Authorization: Bearer your-jwt-token"
```

### 执行创意生成阶段示例

```bash
curl -X POST "http://localhost:8080/api/sessions/1/phases/IDEA_GENERATION/execute" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "如何设计一个更好的移动应用用户界面"
  }'
```

### 执行技术可行性分析阶段示例

```bash
curl -X POST "http://localhost:8080/api/sessions/1/phases/FEASIBILITY_ANALYSIS/execute" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "评估前面创意想法的技术可行性"
  }'
```

### 执行缺点讨论阶段示例

```bash
curl -X POST "http://localhost:8080/api/sessions/1/phases/DRAWBACK_DISCUSSION/execute" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "讨论前面想法的潜在缺点和改进建议"
  }'
```

---

## 业务流程说明

### 头脑风暴会话流程

1. **创建会话**: 用户创建会话并选择参与的 AI 代理
2. **启动会话**: 设置头脑风暴主题，会话进入进行中状态，自动开始第一阶段
3. **阶段执行**: 三个阶段按顺序执行
   - **创意生成阶段**: 各代理独立提出创意想法
   - **技术可行性分析阶段**: 各代理评估前一阶段的想法
   - **缺点讨论阶段**: 各代理讨论想法的缺点和改进建议
4. **提交审核**: 每个阶段完成后，系统调用 submit-for-approval 接口提交总结
5. **用户审核**: 用户审核阶段结果，决定通过或拒绝
6. **阶段流转**: 审核通过后自动进入下一阶段，拒绝则需要重新执行
7. **会话完成**: 所有阶段完成后，会话状态变为已完成

### 阶段状态流转

```
NOT_STARTED → IN_PROGRESS → [submit-for-approval] → WAITING_APPROVAL → APPROVED → COMPLETED
                                                           ↓
                                                       REJECTED → [retry] → IN_PROGRESS
```

**说明**:

- `[submit-for-approval]`: 系统或 AI 代理调用提交审核接口
- `[retry]`: 用户调用重新执行接口

### 会话状态流转

```
CREATED → IN_PROGRESS ⇄ PAUSED
            ↓
        COMPLETED / CANCELLED
```

---

## 注意事项

1. **认证要求**: 所有接口都需要有效的 JWT Token
2. **权限控制**: 用户只能操作自己创建的会话
3. **阶段顺序**: 阶段必须按顺序执行，不能跳过
4. **代理管理**: 可以在会话进行中动态添加或移除代理
5. **状态验证**: 所有操作都会验证当前状态是否允许执行
6. **并发控制**: 同一会话同时只能有一个阶段处于进行中状态
7. **数据持久化**: 所有会话数据和阶段结果都会持久化保存

---

## 更新日志

- **v1.0.0** (2024-01-15): 初始版本，包含完整的会话管理和三阶段流程控制功能
- **v1.1.0** (2025-09-28): 新增三个阶段执行接口，支持自动调用AI推理并更新phases表的summary字段
  - `POST /api/sessions/{sessionId}/phases/IDEA_GENERATION/execute`
  - `POST /api/sessions/{sessionId}/phases/FEASIBILITY_ANALYSIS/execute`
  - `POST /api/sessions/{sessionId}/phases/DRAWBACK_DISCUSSION/execute`
