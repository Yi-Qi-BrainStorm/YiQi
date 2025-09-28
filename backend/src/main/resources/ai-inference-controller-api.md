# AI 推理控制器接口文档

## 概述

AI 推理控制器提供了意启头脑风暴平台的 AI 推理相关 REST API 接口，包括单代理推理、推理状态查询、AI 服务测试等功能。

**基础路径**: `/api/ai-inference`

**版本**: v1.0.0

---

## 接口列表

### 1. 单代理推理接口

#### 1.1 处理单个代理推理请求

**接口地址**: `POST /api/ai-inference/agent`

**接口描述**: 处理单个 AI 代理的推理请求，支持异步处理和流式输出

**请求头**:

```
Content-Type: application/json
Authorization: Bearer {token}
```

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| stream | Boolean | 否 | 是否启用流式输出，默认为false |

**请求体**:

```json
{
  "agentId": 1,
  "agentName": "产品设计师",
  "roleType": "DESIGNER",
  "systemPrompt": "你是一名专业的产品设计师，擅长创新设计和用户体验优化。",
  "userPrompt": "请为智能家居产品设计一个创新的交互方案。",
  "sessionContext": "产品类型：智能家居，目标用户：年轻家庭"
}
```

**请求参数说明**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| agentId | Long | 是 | 代理 ID |
| agentName | String | 是 | 代理名称 |
| roleType | String | 是 | 角色类型 |
| systemPrompt | String | 是 | 系统提示词 |
| userPrompt | String | 是 | 用户输入 |
| sessionContext | String | 否 | 会话上下文 |

**响应示例**:

非流式响应 (200):

成功响应 (200):

```json
{
  "agentId": 1,
  "agentName": "产品设计师",
  "roleType": "DESIGNER",
  "content": "基于智能家居的需求，我建议设计一个多模态交互系统...",
  "status": "SUCCESS",
  "errorMessage": null,
  "startTime": "2024-01-15T14:30:00",
  "endTime": "2024-01-15T14:30:05",
  "processingTimeMs": 5000
}
```

失败响应 (500):

```json
{
  "agentId": 1,
  "agentName": "产品设计师",
  "roleType": "DESIGNER",
  "content": null,
  "status": "FAILED",
  "errorMessage": "推理失败: 网络连接超时",
  "startTime": "2024-01-15T14:30:00",
  "endTime": "2024-01-15T14:30:30",
  "processingTimeMs": 30000
}
```

**响应字段说明**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| agentId | Long | 代理 ID |
| agentName | String | 代理名称 |
| roleType | String | 角色类型 |
| content | String | 推理结果内容 |
| status | String | 状态: SUCCESS/FAILED/TIMEOUT |
| errorMessage | String | 错误信息（失败时） |
| startTime | String | 开始时间 |
| endTime | String | 结束时间 |
| processingTimeMs | Long | 处理时长（毫秒） |

流式响应 (200):

当stream=true时，响应使用 Server-Sent Events (SSE) 格式，每个数据块包含以下字段：
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | String | 响应 ID |
| object | String | 对象类型 |
| created | Long | 创建时间戳 |
| model | String | 使用的模型 |
| choices | Array | 选择项数组 |
| choices[index] | Integer | 选择项索引 |
| choices[delta] | Object | 增量内容 |
| choices[delta][content] | String | 增量内容片段 |
| choices[finish_reason] | String | 完成原因 (null表示未完成，"stop"表示完成) |

流式响应示例：

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1704060000,"model":"deepseek/deepseek-v3.1-terminus","choices":[{"index":0,"delta":{"content":"基于智能家居"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1704060000,"model":"deepseek/deepseek-v3.1-terminus","choices":[{"index":0,"delta":{"content":"的需求"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1704060000,"model":"deepseek/deepseek-v3.1-terminus","choices":[{"index":0,"delta":{"content":"，我建议"},"finish_reason":null}]}

data: [DONE]
```

---

#### 1.2 处理单个代理流式推理请求

**接口地址**: `POST /api/ai-inference/agent/stream`

**接口描述**: 处理单个 AI 代理的流式推理请求，实时返回推理结果

**请求头**:

```
Content-Type: application/json
Accept: text/event-stream
Authorization: Bearer {token}
```

**请求体**:

```json
{
  "agentId": 1,
  "agentName": "产品设计师",
  "roleType": "DESIGNER",
  "systemPrompt": "你是一名专业的产品设计师，擅长创新设计和用户体验优化。",
  "userPrompt": "请为智能家居产品设计一个创新的交互方案。",
  "sessionContext": "产品类型：智能家居，目标用户：年轻家庭"
}
```

**请求参数说明**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| agentId | Long | 是 | 代理 ID |
| agentName | String | 是 | 代理名称 |
| roleType | String | 是 | 角色类型 |
| systemPrompt | String | 是 | 系统提示词 |
| userPrompt | String | 是 | 用户输入 |
| sessionContext | String | 否 | 会话上下文 |

**响应示例**:

流式响应 (200):

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1704060000,"model":"deepseek/deepseek-v3.1-terminus","choices":[{"index":0,"delta":{"content":"基于智能家居"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1704060000,"model":"deepseek/deepseek-v3.1-terminus","choices":[{"index":0,"delta":{"content":"的需求"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1704060000,"model":"deepseek/deepseek-v3.1-terminus","choices":[{"index":0,"delta":{"content":"，我建议"},"finish_reason":null}]}

data: [DONE]
```

**响应字段说明**:
流式响应使用 Server-Sent Events (SSE) 格式，每个数据块包含以下字段：
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | String | 响应 ID |
| object | String | 对象类型 |
| created | Long | 创建时间戳 |
| model | String | 使用的模型 |
| choices | Array | 选择项数组 |
| choices[index] | Integer | 选择项索引 |
| choices[delta] | Object | 增量内容 |
| choices[delta][content] | String | 增量内容片段 |
| choices[finish_reason] | String | 完成原因 (null表示未完成，"stop"表示完成) |

---

### 2. AI 服务测试接口

#### 2.1 测试 AI 服务连接

**接口地址**: `POST /api/ai-inference/test`

**接口描述**: 测试与 AI 服务的连接状态和基本功能

**请求头**:

```
Content-Type: application/json
Authorization: Bearer {token}
```

**请求体**:

```json
{
  "systemPrompt": "You are a helpful assistant.",
  "userPrompt": "Hello, this is a test."
}
```

**请求参数说明**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| systemPrompt | String | 否 | 系统提示词（默认值提供） |
| userPrompt | String | 否 | 用户输入（默认值提供） |

**响应示例**:

成功响应 (200):

```json
"Hello! This is a test response from the AI service. The connection is working properly."
```

失败响应 (500):

```json
"测试失败: 连接超时"
```

---

### 3. 推理状态查询接口

#### 3.1 获取推理状态

**接口地址**: `GET /api/ai-inference/status/{sessionId}/{phaseType}`

**接口描述**: 获取指定会话和阶段的推理状态信息

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | String | 是 | 会话 ID |
| phaseType | String | 是 | 阶段类型 (IDEA_GENERATION/FEASIBILITY_ANALYSIS/CRITICISM_DISCUSSION) |

**请求头**:

```
Authorization: Bearer {token}
```

**响应示例**:

成功响应 (200):

```json
{
  "sessionId": "session-123",
  "phaseType": "IDEA_GENERATION",
  "startTime": "2024-01-15T14:30:00",
  "endTime": "2024-01-15T14:32:00",
  "totalAgents": 5,
  "completedAgents": 5,
  "successfulAgents": 4,
  "failedAgents": 1,
  "status": "COMPLETED",
  "progress": 1.0,
  "successRate": 0.8,
  "processingTimeMs": 120000
}
```

未找到响应 (404):

```json
{
  "error": "推理状态未找到"
}
```

**响应字段说明**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| sessionId | String | 会话 ID |
| phaseType | String | 阶段类型 |
| startTime | String | 开始时间 |
| endTime | String | 结束时间 |
| totalAgents | Integer | 总代理数 |
| completedAgents | Integer | 已完成代理数 |
| successfulAgents | Integer | 成功代理数 |
| failedAgents | Integer | 失败代理数 |
| status | String | 状态: RUNNING/COMPLETED/FAILED |
| progress | Double | 进度百分比 (0.0-1.0) |
| successRate | Double | 成功率 (0.0-1.0) |
| processingTimeMs | Long | 处理时长（毫秒） |

---

### 4. 系统统计接口

#### 4.1 获取系统推理统计

**接口地址**: `GET /api/ai-inference/statistics`

**接口描述**: 获取系统级别的推理统计信息

**请求头**:

```
Authorization: Bearer {token}
```

**响应示例**:

```json
{
  "totalSessions": 156,
  "runningSessions": 3,
  "completedSessions": 145,
  "failedSessions": 8,
  "averageProcessingTimeMs": 15420
}
```

**响应字段说明**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| totalSessions | Integer | 总会话数 |
| runningSessions | Integer | 运行中会话数 |
| completedSessions | Integer | 已完成会话数 |
| failedSessions | Integer | 失败会话数 |
| averageProcessingTimeMs | Long | 平均处理时长（毫秒） |

---

## 错误处理

### HTTP 状态码

| 状态码 | 说明           |
| ------ | -------------- |
| 200    | 请求成功       |
| 400    | 请求参数错误   |
| 401    | 未授权访问     |
| 404    | 资源未找到     |
| 500    | 服务器内部错误 |
| 503    | 服务不可用     |

### 错误响应格式

```json
{
  "success": false,
  "errorCode": "AI_SERVICE_UNAVAILABLE",
  "message": "AI服务当前不可用，熔断器已开启",
  "timestamp": "2024-01-15T14:30:00",
  "path": "/api/ai-inference/agent"
}
```

### 常见错误码

| 错误码                    | 说明           | HTTP 状态码 |
| ------------------------- | -------------- | ----------- |
| AI_SERVICE_UNAVAILABLE    | AI 服务不可用  | 503         |
| AI_REQUEST_FAILED         | AI 请求失败    | 502         |
| AI_EMPTY_RESPONSE         | AI 返回空响应  | 400         |
| PARALLEL_INFERENCE_FAILED | 并行推理失败   | 502         |
| RETRY_EXHAUSTED           | 重试次数用尽   | 408         |
| INVALID_AGENT_REQUEST     | 无效的代理请求 | 400         |
| SESSION_NOT_FOUND         | 会话未找到     | 404         |

