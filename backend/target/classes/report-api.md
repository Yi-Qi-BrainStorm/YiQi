# 报告生成API文档

## 概述

报告生成功能是意启头脑风暴平台的核心功能之一，负责根据完成的头脑风暴会话生成完整的产品解决方案报告。系统会自动收集三个阶段（创意生成、可行性分析、缺点讨论）的总结，并通过七牛云AI生成最终的综合报告。

## 功能特性

- **智能内容整合**：自动收集三个头脑风暴阶段的总结内容
- **AI驱动总结**：使用七牛云deepseek-v3-0324模型生成高质量报告总结
- **纯文本报告**：专注于文本内容，确保快速生成和易于阅读
- **异步处理**：后台异步生成，不阻塞用户操作
- **完整状态跟踪**：实时跟踪报告生成状态和进度
- **错误恢复**：完善的错误处理和重试机制

## API接口详解

### 1. 生成报告

**POST** `/api/reports/generate/{sessionId}`

根据指定会话ID生成报告。只有状态为`COMPLETED`的会话才能生成报告。

**请求头：**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**路径参数：**
- `sessionId` (Long): 会话ID，必须是已完成的会话

**成功响应 (200 OK)：**
```json
{
  "reportId": 123,
  "sessionId": 456,
  "message": "报告生成任务已启动",
  "success": true
}
```

**错误响应：**

*会话不存在 (400 Bad Request):*
```json
{
  "reportId": null,
  "sessionId": null,
  "message": "生成报告失败: 会话不存在: 456",
  "success": false
}
```

*会话未完成 (400 Bad Request):*
```json
{
  "reportId": null,
  "sessionId": 456,
  "message": "生成报告失败: 只有已完成的会话才能生成报告，当前状态: IN_PROGRESS",
  "success": false
}
```

*报告已存在且正在生成 (200 OK):*
```json
{
  "reportId": 123,
  "sessionId": 456,
  "message": "报告生成任务已启动",
  "success": true
}
```

### 2. 获取报告详情

**GET** `/api/reports/{reportId}`

获取指定报告的详细信息。报告可能处于生成中、已生成或生成失败状态。

**请求头：**
```
Authorization: Bearer <JWT_TOKEN>
```

**路径参数：**
- `reportId` (Long): 报告ID

**成功响应 - 报告生成中 (200 OK)：**
```json
{
  "id": 123,
  "sessionId": 456,
  "title": "Report_智能茶具设计_2024-01-15T10-25-00",
  "content": "{\"status\":\"generating\",\"message\":\"报告正在生成中...\",\"generatedAt\":\"2024-01-15T10:25:00\"}",
  "status": "GENERATING",
  "filePath": null,
  "generatedAt": "2024-01-15T10:25:00",
  "hasPdfFile": false,
  "isGenerated": false,
  "isFailed": false,
  "isGenerating": true
}
```

**成功响应 - 报告生成完成 (200 OK)：**
```json
{
  "id": 123,
  "sessionId": 456,
  "title": "Report_智能茶具设计_2024-01-15T10-30-00",
  "content": "{\"generatedAt\":\"2024-01-15T10:30:00\",\"version\":\"1.0\",\"type\":\"text-only\",\"phaseSummaries\":{\"ideaGeneration\":\"在创意生成阶段，团队提出了多个创新的智能茶具设计方案...\",\"feasibilityAnalysis\":\"经过可行性分析，我们评估了技术实现难度、成本控制和市场接受度...\",\"criticismDiscussion\":\"在缺点讨论阶段，团队识别出了设计方案中的潜在问题和改进空间...\"},\"finalSummary\":\"基于三个阶段的深入讨论，我们推荐采用智能温控茶具方案，该方案在技术可行性、市场需求和成本控制方面都表现出色...\",\"statistics\":{\"totalPhases\":3,\"reportLength\":1250}}",
  "status": "GENERATED",
  "filePath": null,
  "generatedAt": "2024-01-15T10:30:00",
  "hasPdfFile": false,
  "isGenerated": true,
  "isFailed": false,
  "isGenerating": false
}
```

**成功响应 - 报告生成失败 (200 OK)：**
```json
{
  "id": 123,
  "sessionId": 456,
  "title": "Report_智能茶具设计_2024-01-15T10-30-00",
  "content": "{\"status\":\"failed\",\"message\":\"报告生成失败\",\"error\":\"七牛云API调用超时\",\"generatedAt\":\"2024-01-15T10:25:00\"}",
  "status": "FAILED",
  "filePath": null,
  "generatedAt": "2024-01-15T10:25:00",
  "hasPdfFile": false,
  "isGenerated": false,
  "isFailed": true,
  "isGenerating": false
}
```

**错误响应 - 报告不存在 (400 Bad Request)：**
```json
{
  "id": null,
  "sessionId": null,
  "title": null,
  "content": null,
  "status": null,
  "filePath": null,
  "generatedAt": null,
  "hasPdfFile": false,
  "isGenerated": false,
  "isFailed": false,
  "isGenerating": false,
  "errorMessage": "获取报告详情失败: 报告不存在: 123"
}
```

### 3. 根据会话获取报告

**GET** `/api/reports/session/{sessionId}`

根据会话ID获取对应的报告。如果会话没有报告，返回404。

**请求头：**
```
Authorization: Bearer <JWT_TOKEN>
```

**路径参数：**
- `sessionId` (Long): 会话ID

**成功响应 (200 OK)：** 同"获取报告详情"接口

**错误响应 - 报告不存在 (404 Not Found)：**
```
HTTP 404 Not Found
```

### 4. 重新生成报告

**POST** `/api/reports/{reportId}/regenerate`

重新生成指定的报告。会删除原报告并创建新的报告。

**请求头：**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**路径参数：**
- `reportId` (Long): 要重新生成的报告ID

**成功响应 (200 OK)：**
```json
{
  "reportId": 124,
  "sessionId": null,
  "message": "报告重新生成任务已启动",
  "success": true
}
```

**错误响应 - 报告不存在 (400 Bad Request)：**
```json
{
  "reportId": null,
  "sessionId": null,
  "message": "重新生成报告失败: 报告不存在: 123",
  "success": false
}
```

## 报告内容结构详解

### 报告生成中的内容 (status: GENERATING)

当报告刚创建时，`content`字段包含初始状态信息：

```json
{
  "status": "generating",
  "message": "报告正在生成中...",
  "generatedAt": "2024-01-15T10:25:00"
}
```

### 成功生成的报告内容 (status: GENERATED)

当报告生成成功时，`content`字段包含完整的JSON结构：

```json
{
  "generatedAt": "2024-01-15T10:30:00",
  "version": "1.0",
  "type": "text-only",
  "phaseSummaries": {
    "ideaGeneration": "在创意生成阶段，我们的设计团队从用户体验角度出发，提出了智能茶具的核心概念...",
    "feasibilityAnalysis": "在可行性分析阶段，工程师详细评估了技术实现难度...",
    "criticismDiscussion": "在缺点讨论阶段，团队识别出几个关键问题..."
  },
  "finalSummary": "基于三个阶段的深入讨论和分析，我们推荐采用智能温控茶具方案作为最终产品方向...",
  "statistics": {
    "totalPhases": 3,
    "reportLength": 1250
  }
}
```

### 生成失败的报告内容 (status: FAILED)

当报告生成失败时，`content`字段包含错误信息：

```json
{
  "status": "failed",
  "message": "报告生成失败",
  "error": "七牛云API调用超时",
  "generatedAt": "2024-01-15T10:25:00.123456",
  "failureDetails": {
    "errorCode": "API_TIMEOUT",
    "errorMessage": "Connection timeout after 30 seconds",
    "retryCount": 3,
    "lastAttempt": "2024-01-15T10:29:30.123456"
  },
  "troubleshooting": {
    "suggestedActions": [
      "检查网络连接",
      "验证API密钥配置",
      "稍后重试生成"
    ],
    "contactSupport": "如问题持续，请联系技术支持"
  }
}
```

### Content字段详细说明

#### 1. 基础信息字段
- **generatedAt**: 报告生成时间，ISO 8601格式
- **version**: 报告格式版本号，当前为"1.0"
- **type**: 报告类型，当前为"text-only"（纯文本）

#### 2. 阶段总结字段 (phaseSummaries)
- **ideaGeneration**: 创意生成阶段的详细总结
  - 包含所有参与代理的创意输出
  - 涵盖产品概念、功能设计、用户需求分析
  - 通常长度150-300字

- **feasibilityAnalysis**: 可行性分析阶段的详细总结
  - 技术实现难度评估
  - 成本效益分析
  - 市场竞争分析
  - 风险评估
  - 通常长度150-300字

- **criticismDiscussion**: 缺点讨论阶段的详细总结
  - 识别的问题和风险点
  - 改进建议和解决方案
  - 团队共识和分歧点
  - 通常长度150-300字

#### 3. 最终总结字段 (finalSummary)
- 基于三个阶段内容生成的综合性总结
- 包含推荐方案、实施建议、风险控制
- 由七牛云AI模型生成，确保逻辑性和完整性
- 通常长度200-500字

#### 4. 统计信息字段 (statistics)
- **totalPhases**: 参与的阶段数量（固定为3）
- **reportLength**: 报告总字符数
- **generationTime**: 实际生成完成时间
- **aiModelUsed**: 使用的AI模型名称
- **wordCount**: 各部分字数统计

## 状态说明

### 报告状态 (ReportStatus)

- `GENERATING`: 生成中
- `GENERATED`: 已生成
- `FAILED`: 生成失败

## 错误处理

所有API接口都包含完整的错误处理：

- 400 Bad Request: 请求参数错误或业务逻辑错误
- 404 Not Found: 资源不存在
- 500 Internal Server Error: 服务器内部错误

错误响应格式：
```json
{
  "errorMessage": "具体的错误信息"
}
```

## 使用流程

1. **完成头脑风暴会话**：确保会话状态为 `COMPLETED`
2. **生成报告**：调用 `/api/reports/generate/{sessionId}`，系统立即返回reportId并开始异步生成报告
3. **轮询查询状态**：使用返回的reportId调用 `/api/reports/{reportId}` 查询报告状态
   - 如果status为`GENERATING`，表示正在生成中，需要继续轮询
   - 如果status为`GENERATED`，表示生成完成，可以获取完整内容
   - 如果status为`FAILED`，表示生成失败，查看错误信息
4. **获取完整报告**：当报告生成完成后，从content字段获取完整的报告内容

**注意**：报告生成是异步处理，reportId会立即返回，但报告内容需要一定时间生成。前端需要通过轮询或其他方式检查报告状态。

## 配置说明

### 七牛云配置

```yaml
qiniu:
  api:
    key: sk-5989d9479592a2c28c52a6e15be54ed4ceb27d8b37e72547b3d5c63a130dd1ae
    url: https://openai.qiniu.com/v1/chat/completions
    model: deepseek-v3-0324
```

### 配置说明（已简化）

由于移除了图像生成功能，现在只需要配置七牛云API。

## 注意事项

1. 报告生成是异步过程，通常在1-2分钟内完成
2. 只有状态为 `COMPLETED` 的会话才能生成报告
3. 每个会话只能有一个有效的报告
4. 所有生成的文件名都以 "Report_" 开头
5. 当前版本为纯文本报告，不包含图像内容

## 技术实现

- **异步处理**：使用 Spring 的 @Async 注解实现异步报告生成
- **API集成**：通过 RestTemplate 调用七牛云AI服务
- **纯文本生成**：专注于高质量的文本报告生成
- **状态管理**：完整的报告状态跟踪和更新机制
- **性能优化**：移除图像生成后，报告生成速度显著提升
