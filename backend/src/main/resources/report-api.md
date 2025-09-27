# 报告生成API文档

## 概述

报告生成功能是意启头脑风暴平台的核心功能之一，负责根据完成的头脑风暴会话生成完整的产品解决方案报告。

## 功能特性

- 根据三个阶段的总结生成最终报告
- 使用七牛云AI进行文本总结
- 纯文本报告生成（已移除图像生成功能）
- 异步处理，支持大规模报告生成
- 完整的状态跟踪和错误处理

## API接口

### 1. 生成报告

**POST** `/api/reports/generate/{sessionId}`

根据指定会话ID生成报告。

**路径参数：**
- `sessionId` (Long): 会话ID

**响应：**
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

获取指定报告的详细信息。

**路径参数：**
- `reportId` (Long): 报告ID

**响应：**
```json
{
  "id": 123,
  "sessionId": 456,
  "title": "Report_智能茶具设计_2024-01-15T10-30-00",
  "content": "{...}", // JSON格式的报告内容
  "status": "GENERATED",
  "filePath": null,
  "generatedAt": "2024-01-15T10:30:00",
  "hasPdfFile": false,
  "isGenerated": true,
  "isFailed": false,
  "isGenerating": false
}
```

### 3. 根据会话获取报告

**GET** `/api/reports/session/{sessionId}`

根据会话ID获取对应的报告。

**路径参数：**
- `sessionId` (Long): 会话ID

**响应：** 同上

### 4. 重新生成报告

**POST** `/api/reports/{reportId}/regenerate`

重新生成指定的报告。

**路径参数：**
- `reportId` (Long): 报告ID

**响应：**
```json
{
  "reportId": 124,
  "message": "报告重新生成任务已启动",
  "success": true
}
```

## 测试接口

### 1. 测试七牛云报告总结

**POST** `/api/test/reports/test-qiniu-summary`

测试七牛云API的报告总结生成功能。

### 2. 检查API配置

**GET** `/api/test/reports/check-config`

检查七牛云和阿里云API的配置状态。

### 3. 完整流程测试

**POST** `/api/test/reports/test-full-flow`

测试完整的报告生成流程。

## 报告内容结构

生成的报告内容为JSON格式，包含以下字段：

```json
{
  "generatedAt": "2024-01-15T10:30:00",
  "version": "1.0",
  "type": "text-only",
  "phaseSummaries": {
    "ideaGeneration": "创意生成阶段的总结...",
    "feasibilityAnalysis": "可行性分析阶段的总结...",
    "criticismDiscussion": "缺点讨论阶段的总结..."
  },
  "finalSummary": "基于三个阶段生成的最终报告总结...",
  "statistics": {
    "totalPhases": 3,
    "reportLength": 1250
  }
}
```

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
2. **生成报告**：调用 `/api/reports/generate/{sessionId}`
3. **查询状态**：通过 `/api/reports/{reportId}` 查询生成状态
4. **获取结果**：报告生成完成后获取完整内容

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
