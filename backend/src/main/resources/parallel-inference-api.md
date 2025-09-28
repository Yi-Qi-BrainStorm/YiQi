# 并行推理接口文档

## 概述

并行推理接口是意启头脑风暴平台的核心功能，支持多个 AI 代理同时进行推理，实现真正的多角色协作头脑风暴。该接口主要用于头脑风暴会话中的三个阶段：创意生成、技术可行性分析和缺点讨论。

**功能特点**:

- 支持多代理并行推理
- 三阶段头脑风暴流程
- 实时状态跟踪
- 自动结果汇总
- 智能错误处理

**版本**: v1.0.0

---

## 核心概念

### 1. 头脑风暴三阶段

#### 阶段 1: 创意生成 (IDEA_GENERATION)

- **目标**: 各代理从自己的职业角度进行独立头脑风暴
- **输入**: 用户主题 + 会话背景
- **输出**: 各代理的创意想法和建议

#### 阶段 2: 技术可行性分析 (FEASIBILITY_ANALYSIS)

- **目标**: 各代理从自己的职业角度评判其他代理的创意想法
- **输入**: 用户主题 + 前一阶段结果
- **输出**: 可行性分析和改进建议

#### 阶段 3: 缺点讨论 (CRITICISM_DISCUSSION)

- **目标**: 各代理从自己的职业角度评判和讨论前面阶段的想法缺点
- **输入**: 用户主题 + 前面阶段结果
- **输出**: 缺点分析和优化方向

### 2. 并行推理流程

```
用户发起请求
    ↓
构建代理推理任务
    ↓
并行执行推理 (多线程)
    ↓
收集推理结果
    ↓
生成阶段总结
    ↓
返回汇总结果
```

---

## REST API 接口

### 1. 会话阶段推理接口

#### 1.1 执行会话阶段推理

**接口地址**: `POST /api/parallel-inference/sessions/{sessionId}/phases/{phaseType}/execute`

**接口描述**: 触发指定会话和阶段的多代理并行推理，支持流式输出

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | Long | 是 | 会话 ID |
| phaseType | PhaseType | 是 | 阶段类型 (IDEA_GENERATION/FEASIBILITY_ANALYSIS/CRITICISM_DISCUSSION) |

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| stream | Boolean | 否 | 是否启用流式输出，默认为false |

**请求体**:

```json
{
  "userPrompt": "请为智能家居产品进行头脑风暴",
  "additionalContext": "目标用户：年轻家庭，预算：1000-5000元"
}
```

**响应示例**:

非流式响应 (200):

```json
{
  "agentResponses": [
    {
      "agentId": 1,
      "agentName": "产品设计师",
      "roleType": "DESIGNER",
      "content": "基于智能家居的需求，我建议设计一个多模态交互系统...",
      "status": "SUCCESS",
      "processingTimeMs": 5000
    }
  ],
  "startTime": "2024-01-15T14:30:00",
  "endTime": "2024-01-15T14:30:10",
  "totalProcessingTimeMs": 10000,
  "totalAgents": 5,
  "successfulAgents": 4,
  "failedAgents": 1,
  "phaseSummary": "本阶段各代理从不同专业角度提出了创新想法...",
  "successRate": 0.8
}
```

流式响应 (200):

当stream=true时，响应使用 Server-Sent Events (SSE) 格式，每个数据块包含以下字段：
| 字段名 | 类型 | 说明 |
|--------|------|------|
| agentId | Long | 代理 ID |
| agentName | String | 代理名称 |
| data | String | 流式数据块，格式同单代理流式响应 |

流式响应示例：

```
data: {"agentId":1,"agentName":"产品设计师","data":"{\"id\":\"chatcmpl-123\",\"object\":\"chat.completion.chunk\",\"created\":1704060000,\"model\":\"deepseek/deepseek-v3.1-terminus\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\"基于智能家居\"},\"finish_reason\":null}]}"}

data: {"agentId":2,"agentName":"市场分析师","data":"{\"id\":\"chatcmpl-124\",\"object\":\"chat.completion.chunk\",\"created\":1704060001,\"model\":\"deepseek/deepseek-v3.1-terminus\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\"从市场角度\"},\"finish_reason\":null}]}"}

data: {"agentId":1,"agentName":"产品设计师","data":"{\"id\":\"chatcmpl-123\",\"object\":\"chat.completion.chunk\",\"created\":1704060000,\"model\":\"deepseek/deepseek-v3.1-terminus\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\"的需求\"},\"finish_reason\":null}]}"}

data: [DONE]
```

#### 1.2 自定义代理并行推理

**接口地址**: `POST /api/parallel-inference/custom`

**接口描述**: 使用指定的代理列表进行并行推理，支持流式输出

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| stream | Boolean | 否 | 是否启用流式输出，默认为false |

**请求体**:

```json
{
  "agentIds": [1, 2, 3, 4, 5],
  "userPrompt": "请为智能家居产品进行头脑风暴",
  "sessionContext": "产品类型：智能家居，目标用户：年轻家庭",
  "sessionId": "custom-session-001",
  "phaseType": "IDEA_GENERATION"
}
```

**响应示例**:

非流式响应 (200):

```json
{
  "agentResponses": [
    {
      "agentId": 1,
      "agentName": "产品设计师",
      "roleType": "DESIGNER",
      "content": "基于智能家居的需求，我建议设计一个多模态交互系统...",
      "status": "SUCCESS",
      "processingTimeMs": 5000
    }
  ],
  "startTime": "2024-01-15T14:30:00",
  "endTime": "2024-01-15T14:30:10",
  "totalProcessingTimeMs": 10000,
  "totalAgents": 5,
  "successfulAgents": 4,
  "failedAgents": 1,
  "phaseSummary": "本阶段各代理从不同专业角度提出了创新想法...",
  "successRate": 0.8
}
```

流式响应 (200):

当stream=true时，响应使用 Server-Sent Events (SSE) 格式，每个数据块包含以下字段：
| 字段名 | 类型 | 说明 |
|--------|------|------|
| agentId | Long | 代理 ID |
| agentName | String | 代理名称 |
| data | String | 流式数据块，格式同单代理流式响应 |

流式响应示例：

```
data: {"agentId":1,"agentName":"产品设计师","data":"{\"id\":\"chatcmpl-123\",\"object\":\"chat.completion.chunk\",\"created\":1704060000,\"model\":\"deepseek/deepseek-v3.1-terminus\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\"基于智能家居\"},\"finish_reason\":null}]}"}

data: {"agentId":2,"agentName":"市场分析师","data":"{\"id\":\"chatcmpl-124\",\"object\":\"chat.completion.chunk\",\"created\":1704060001,\"model\":\"deepseek/deepseek-v3.1-terminus\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\"从市场角度\"},\"finish_reason\":null}]}"}

data: {"agentId":1,"agentName":"产品设计师","data":"{\"id\":\"chatcmpl-123\",\"object\":\"chat.completion.chunk\",\"created\":1704060000,\"model\":\"deepseek/deepseek-v3.1-terminus\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\"的需求\"},\"finish_reason\":null}]}"}

data: [DONE]
```

#### 1.3 获取推理结果详情

**接口地址**: `GET /api/parallel-inference/results/{sessionId}/{phaseType}`

**接口描述**: 获取指定会话和阶段的并行推理结果详情

**响应示例**:

```json
{
  "sessionId": "session-123",
  "phaseType": "IDEA_GENERATION",
  "status": {
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
    "successRate": 0.8
  },
  "resultSummary": "推理已完成，成功率: 80.0%",
  "createdTime": "2024-01-15T14:30:00",
  "lastUpdatedTime": "2024-01-15T14:32:00"
}
```

#### 1.4 批量多阶段推理

**接口地址**: `POST /api/parallel-inference/batch/multi-phase`

**接口描述**: 按顺序执行多个阶段的并行推理

**请求体**:

```json
{
  "sessionId": 123,
  "phases": [
    {
      "phaseType": "IDEA_GENERATION",
      "userPrompt": "请为智能家居产品提出创新想法",
      "additionalContext": "重点关注用户体验",
      "timeoutSeconds": 120
    },
    {
      "phaseType": "FEASIBILITY_ANALYSIS",
      "userPrompt": "请分析前面想法的可行性",
      "additionalContext": "考虑技术和成本因素",
      "timeoutSeconds": 120
    },
    {
      "phaseType": "CRITICISM_DISCUSSION",
      "userPrompt": "请指出方案的缺点和改进建议",
      "additionalContext": "批判性思考",
      "timeoutSeconds": 120
    }
  ],
  "stopOnFailure": true,
  "overallTimeoutSeconds": 600
}
```

**响应示例**:

```json
{
  "sessionId": 123,
  "startTime": "2024-01-15T14:30:00",
  "endTime": "2024-01-15T14:40:00",
  "totalProcessingTimeMs": 600000,
  "phaseResults": {
    "IDEA_GENERATION": {
      "successfulAgents": 4,
      "failedAgents": 1,
      "successRate": 0.8,
      "phaseSummary": "创意生成阶段完成..."
    },
    "FEASIBILITY_ANALYSIS": {
      "successfulAgents": 5,
      "failedAgents": 0,
      "successRate": 1.0,
      "phaseSummary": "可行性分析阶段完成..."
    },
    "CRITICISM_DISCUSSION": {
      "successfulAgents": 4,
      "failedAgents": 1,
      "successRate": 0.8,
      "phaseSummary": "缺点讨论阶段完成..."
    }
  },
  "totalPhases": 3,
  "completedPhases": 3,
  "successfulPhases": 3,
  "failedPhases": 0,
  "overallSuccessRate": 1.0,
  "batchSummary": "批量推理完成：总阶段数 3，成功 3，失败 0，成功率 100.0%，总耗时 600.0秒"
}
```

#### 1.5 获取推理性能统计

**接口地址**: `GET /api/parallel-inference/statistics/performance`

**接口描述**: 获取系统的推理性能统计信息

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| timeRange | String | 否 | 时间范围 (1h/24h/7d/30d) |

**响应示例**:

```json
{
  "totalInferences": 1250,
  "successfulInferences": 1187,
  "failedInferences": 63,
  "runningInferences": 5,
  "successRate": 0.9496,
  "averageResponseTime": 8500,
  "minResponseTime": 2100,
  "maxResponseTime": 28000,
  "errorDistribution": {
    "TIMEOUT": 25,
    "AI_SERVICE_ERROR": 20,
    "NETWORK_ERROR": 18
  },
  "phaseSuccessRates": {
    "IDEA_GENERATION": 0.96,
    "FEASIBILITY_ANALYSIS": 0.94,
    "CRITICISM_DISCUSSION": 0.95
  },
  "phaseAverageResponseTimes": {
    "IDEA_GENERATION": 7500,
    "FEASIBILITY_ANALYSIS": 9200,
    "CRITICISM_DISCUSSION": 8800
  },
  "statisticsTime": "2024-01-15T15:00:00",
  "timeRange": "24h"
}
```

---

## 数据模型

### 1. 并行推理请求

虽然没有直接的 REST 接口，但并行推理通过会话管理接口触发。以下是内部使用的数据结构：

```java
// 并行推理参数
{
  "agents": [
    {
      "id": 1,
      "name": "产品设计师",
      "roleType": "DESIGNER",
      "systemPrompt": "你是一名专业的产品设计师..."
    },
    {
      "id": 2,
      "name": "市场分析师",
      "roleType": "MARKET_ANALYST",
      "systemPrompt": "你是一名专业的市场分析师..."
    }
  ],
  "userPrompt": "请为智能家居产品进行头脑风暴",
  "sessionContext": "产品类型：智能家居，目标用户：年轻家庭",
  "sessionId": "session-123",
  "phaseType": "IDEA_GENERATION"
}
```

### 2. 并行推理结果

```json
{
  "agentResponses": [
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
    },
    {
      "agentId": 2,
      "agentName": "市场分析师",
      "roleType": "MARKET_ANALYST",
      "content": "从市场角度分析，智能家居产品需要考虑以下因素...",
      "status": "SUCCESS",
      "errorMessage": null,
      "startTime": "2024-01-15T14:30:00",
      "endTime": "2024-01-15T14:30:07",
      "processingTimeMs": 7000
    }
  ],
  "startTime": "2024-01-15T14:30:00",
  "endTime": "2024-01-15T14:30:10",
  "totalProcessingTimeMs": 10000,
  "totalAgents": 2,
  "successfulAgents": 2,
  "failedAgents": 0,
  "phaseSummary": "本阶段各代理从不同专业角度提出了创新想法...",
  "successRate": 1.0,
  "failureRate": 0.0
}
```

---

## 阶段提示词模板

### 1. 创意生成阶段

**系统提示词模板**:

```
你是一名专业的{roleType}，现在进入头脑风暴的创意生成阶段。
请从你的专业角度出发，针对用户提出的主题进行独立的创意思考。
要求：
1. 发挥你的专业优势
2. 提出具体可行的建议
3. 考虑实际应用场景
```

**用户提示词模板**:

```
主题：{topic}

会话背景：{context}

请从你的专业角度为这个主题提出创新的想法和建议。
```

### 2. 技术可行性分析阶段

**系统提示词模板**:

```
你是一名专业的{roleType}，现在进入头脑风暴的技术可行性分析阶段。
请从你的专业角度出发，分析和评判前面创意生成阶段的各种想法。
要求：
1. 客观分析可行性
2. 指出潜在问题
3. 提出改进建议
```

**用户提示词模板**:

```
主题：{topic}

会话背景：{context}

前面阶段的创意想法：
{previousResults}

请分析这些想法的可行性，并提出你的专业意见。
```

### 3. 缺点讨论阶段

**系统提示词模板**:

```
你是一名专业的{roleType}，现在进入头脑风暴的缺点讨论阶段。
请从你的专业角度出发，批判性地分析前面阶段的想法和方案。
要求：
1. 指出明显缺陷
2. 分析风险因素
3. 提出优化方向
```

**用户提示词模板**:

```
主题：{topic}

会话背景：{context}

前面阶段的想法和分析：
{previousResults}

请指出这些想法的缺点和不足，并提出改进建议。
```

---

## 性能特性

### 1. 并发处理

- **线程池配置**: 核心 10 线程，最大 50 线程
- **队列容量**: 100 个任务
- **并发代理数**: 最多 10 个代理同时推理
- **负载均衡**: 自动分配推理任务

### 2. 超时控制

- **单代理超时**: 60 秒
- **总体超时**: 120 秒
- **超时处理**: 自动标记超时，继续处理其他代理
- **优雅降级**: 部分失败不影响整体流程

### 3. 错误处理

- **重试机制**: 最多 3 次重试，指数退避
- **熔断保护**: 5 次连续失败触发熔断
- **错误隔离**: 单个代理失败不影响其他代理
- **状态跟踪**: 实时记录每个代理的状态

---

## 使用场景示例

### 1. 智能家居产品头脑风暴

**参与代理**:

- 产品设计师
- 市场分析师
- 技术工程师
- 用户体验专家
- 营销专员

**阶段 1 - 创意生成**:

```
主题: 设计一款面向年轻家庭的智能家居产品

产品设计师输出:
- 多模态交互界面设计
- 模块化产品架构
- 个性化定制方案

市场分析师输出:
- 目标用户画像分析
- 竞品对比研究
- 市场定位策略

技术工程师输出:
- 技术架构方案
- 硬件选型建议
- 开发可行性分析
```

**阶段 2 - 可行性分析**:

```
各代理对前面的创意进行评估:

产品设计师评估技术方案:
- 硬件选型是否支持设计需求
- 技术架构是否便于产品迭代

市场分析师评估设计方案:
- 设计是否符合目标用户需求
- 成本控制是否在可接受范围

技术工程师评估设计方案:
- 设计复杂度是否可实现
- 开发周期是否合理
```

**阶段 3 - 缺点讨论**:

```
各代理指出方案的不足:

产品设计师:
- 指出技术方案的用户体验问题
- 提出设计优化建议

市场分析师:
- 指出市场风险和竞争劣势
- 提出营销策略调整

技术工程师:
- 指出设计方案的技术难点
- 提出技术优化方向
```

### 2. 文创产品设计头脑风暴

**参与代理**:

- 文化研究员
- 创意设计师
- 工艺工程师
- 品牌营销师
- 成本分析师

**完整流程示例**:

```javascript
// 模拟并行推理流程
async function brainstormCulturalProduct() {
  const agents = [
    { id: 1, name: "文化研究员", roleType: "CULTURAL_RESEARCHER" },
    { id: 2, name: "创意设计师", roleType: "CREATIVE_DESIGNER" },
    { id: 3, name: "工艺工程师", roleType: "CRAFT_ENGINEER" },
    { id: 4, name: "品牌营销师", roleType: "BRAND_MARKETER" },
    { id: 5, name: "成本分析师", roleType: "COST_ANALYST" },
  ];

  const topic = "设计一款以故宫文化为背景的文创帆布袋";
  const context = "目标用户：文化爱好者，价格区间：50-200元";

  // 阶段1: 创意生成
  console.log("=== 阶段1: 创意生成 ===");
  const phase1Result = await processParallelInference(
    agents,
    topic,
    context,
    "session-001",
    "IDEA_GENERATION"
  );

  console.log("成功率:", (phase1Result.successRate * 100).toFixed(1) + "%");
  console.log("阶段总结:", phase1Result.phaseSummary);

  // 阶段2: 可行性分析
  console.log("\n=== 阶段2: 可行性分析 ===");
  const phase2Context =
    context +
    "\n\n前一阶段结果:\n" +
    phase1Result.agentResponses
      .map((r) => `${r.agentName}: ${r.content}`)
      .join("\n");

  const phase2Result = await processParallelInference(
    agents,
    topic,
    phase2Context,
    "session-001",
    "FEASIBILITY_ANALYSIS"
  );

  console.log("成功率:", (phase2Result.successRate * 100).toFixed(1) + "%");
  console.log("阶段总结:", phase2Result.phaseSummary);

  // 阶段3: 缺点讨论
  console.log("\n=== 阶段3: 缺点讨论 ===");
  const phase3Context =
    phase2Context +
    "\n\n可行性分析结果:\n" +
    phase2Result.agentResponses
      .map((r) => `${r.agentName}: ${r.content}`)
      .join("\n");

  const phase3Result = await processParallelInference(
    agents,
    topic,
    phase3Context,
    "session-001",
    "CRITICISM_DISCUSSION"
  );

  console.log("成功率:", (phase3Result.successRate * 100).toFixed(1) + "%");
  console.log("最终总结:", phase3Result.phaseSummary);

  return {
    phase1: phase1Result,
    phase2: phase2Result,
    phase3: phase3Result,
  };
}
```

---

## 监控和调试

### 1. 实时状态监控

```javascript
// 监控并行推理状态
async function monitorInferenceProgress(sessionId, phaseType) {
  const checkInterval = setInterval(async () => {
    try {
      const status = await fetch(
        `/api/ai-inference/status/${sessionId}/${phaseType}`
      ).then((res) => res.json());

      if (status) {
        console.log(`进度: ${(status.progress * 100).toFixed(1)}%`);
        console.log(`成功: ${status.successfulAgents}/${status.totalAgents}`);

        if (status.status === "COMPLETED" || status.status === "FAILED") {
          clearInterval(checkInterval);
          console.log("推理完成，状态:", status.status);
        }
      }
    } catch (error) {
      console.error("状态查询失败:", error);
    }
  }, 2000); // 每2秒检查一次
}
```

### 2. 性能分析

```javascript
// 分析推理性能
function analyzeInferencePerformance(result) {
  const responses = result.agentResponses;

  // 响应时间分析
  const processingTimes = responses
    .filter((r) => r.processingTimeMs)
    .map((r) => r.processingTimeMs);

  const avgTime =
    processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
  const maxTime = Math.max(...processingTimes);
  const minTime = Math.min(...processingTimes);

  console.log("性能分析:");
  console.log("- 平均响应时间:", (avgTime / 1000).toFixed(2) + "秒");
  console.log("- 最长响应时间:", (maxTime / 1000).toFixed(2) + "秒");
  console.log("- 最短响应时间:", (minTime / 1000).toFixed(2) + "秒");
  console.log(
    "- 总处理时间:",
    (result.totalProcessingTimeMs / 1000).toFixed(2) + "秒"
  );

  // 成功率分析
  console.log("- 成功率:", (result.successRate * 100).toFixed(1) + "%");
  console.log("- 失败代理:", result.failedAgents);

  // 失败原因分析
  const failedResponses = responses.filter((r) => r.status !== "SUCCESS");
  if (failedResponses.length > 0) {
    console.log("失败原因:");
    failedResponses.forEach((r) => {
      console.log(`- ${r.agentName}: ${r.errorMessage}`);
    });
  }
}
```

### 3. 错误诊断

```javascript
// 诊断推理错误
function diagnoseInferenceErrors(result) {
  const errors = result.agentResponses
    .filter((r) => r.status !== "SUCCESS")
    .map((r) => ({
      agent: r.agentName,
      status: r.status,
      error: r.errorMessage,
      processingTime: r.processingTimeMs,
    }));

  if (errors.length === 0) {
    console.log("✅ 所有代理推理成功");
    return;
  }

  console.log("❌ 推理错误诊断:");

  // 按错误类型分组
  const errorsByType = errors.reduce((acc, error) => {
    const type = error.status;
    if (!acc[type]) acc[type] = [];
    acc[type].push(error);
    return acc;
  }, {});

  Object.entries(errorsByType).forEach(([type, typeErrors]) => {
    console.log(`\n${type} (${typeErrors.length}个):`);
    typeErrors.forEach((error) => {
      console.log(`- ${error.agent}: ${error.error}`);
      if (error.processingTime) {
        console.log(
          `  处理时间: ${(error.processingTime / 1000).toFixed(2)}秒`
        );
      }
    });
  });

  // 提供解决建议
  console.log("\n🔧 解决建议:");
  if (errorsByType.TIMEOUT) {
    console.log("- 超时错误: 检查网络连接，考虑增加超时时间");
  }
  if (errorsByType.FAILED) {
    console.log("- 推理失败: 检查AI服务状态，验证提示词格式");
  }
}
```

---

## 最佳实践

### 1. 代理配置优化

```javascript
// 优化代理配置
const optimizedAgents = [
  {
    name: "产品设计师",
    roleType: "DESIGNER",
    systemPrompt:
      "你是一名有10年经验的产品设计师，擅长用户体验设计和创新产品开发。" +
      "请用简洁明了的语言表达你的观点，重点关注实用性和用户需求。",
  },
  {
    name: "市场分析师",
    roleType: "MARKET_ANALYST",
    systemPrompt:
      "你是一名专业的市场分析师，精通市场调研和竞品分析。" +
      "请基于数据和事实提供分析，避免过于主观的判断。",
  },
];
```

### 2. 提示词优化

```javascript
// 构建高质量提示词
function buildOptimizedPrompt(
  topic,
  context,
  phaseType,
  previousResults = null
) {
  let prompt = `主题: ${topic}\n\n`;

  if (context) {
    prompt += `背景信息: ${context}\n\n`;
  }

  if (previousResults && phaseType !== "IDEA_GENERATION") {
    prompt += `前面阶段的结果:\n${previousResults}\n\n`;
  }

  // 根据阶段添加具体要求
  switch (phaseType) {
    case "IDEA_GENERATION":
      prompt +=
        "请提出3-5个具体的创意想法，每个想法包含:\n" +
        "1. 核心概念描述\n" +
        "2. 实现方式\n" +
        "3. 预期效果";
      break;
    case "FEASIBILITY_ANALYSIS":
      prompt +=
        "请从以下角度分析可行性:\n" +
        "1. 技术可行性\n" +
        "2. 成本效益\n" +
        "3. 市场接受度\n" +
        "4. 实施难度";
      break;
    case "CRITICISM_DISCUSSION":
      prompt +=
        "请指出以下方面的问题:\n" +
        "1. 明显缺陷\n" +
        "2. 潜在风险\n" +
        "3. 改进建议\n" +
        "4. 替代方案";
      break;
  }

  return prompt;
}
```

### 3. 结果处理优化

```javascript
// 优化结果处理
function processInferenceResults(result) {
  // 过滤有效结果
  const validResults = result.agentResponses.filter(
    (r) => r.status === "SUCCESS" && r.content && r.content.trim().length > 50
  );

  if (validResults.length === 0) {
    throw new Error("没有获得有效的推理结果");
  }

  // 按角色类型分组
  const resultsByRole = validResults.reduce((acc, result) => {
    const role = result.roleType;
    if (!acc[role]) acc[role] = [];
    acc[role].push(result);
    return acc;
  }, {});

  // 生成结构化总结
  const summary = {
    totalAgents: result.totalAgents,
    successfulAgents: validResults.length,
    processingTime: result.totalProcessingTimeMs,
    resultsByRole: resultsByRole,
    keyInsights: extractKeyInsights(validResults),
    recommendations: generateRecommendations(validResults),
  };

  return summary;
}

function extractKeyInsights(results) {
  // 提取关键洞察
  return results.map((r) => ({
    agent: r.agentName,
    role: r.roleType,
    insight: r.content.substring(0, 200) + "...",
  }));
}

function generateRecommendations(results) {
  // 生成综合建议
  const recommendations = [];

  // 基于不同角色的输出生成建议
  const designResults = results.filter((r) => r.roleType.includes("DESIGN"));
  const marketResults = results.filter((r) => r.roleType.includes("MARKET"));
  const techResults = results.filter((r) => r.roleType.includes("TECH"));

  if (designResults.length > 0) {
    recommendations.push("设计建议: 重点关注用户体验和产品创新");
  }

  if (marketResults.length > 0) {
    recommendations.push("市场建议: 深入分析目标用户需求和竞争环境");
  }

  if (techResults.length > 0) {
    recommendations.push("技术建议: 确保技术方案的可行性和可扩展性");
  }

  return recommendations;
}
```

---

## 故障排查

### 1. 常见问题

| 问题         | 症状                   | 解决方案                     |
| ------------ | ---------------------- | ---------------------------- |
| 部分代理超时 | 某些代理状态为 TIMEOUT | 检查网络连接，增加超时时间   |
| 推理质量差   | 返回内容过短或无意义   | 优化提示词，检查代理配置     |
| 并发性能差   | 总处理时间过长         | 调整线程池配置，优化代理数量 |
| 内存使用过高 | 系统响应变慢           | 清理过期状态，优化缓存策略   |

### 2. 性能调优

```yaml
# 线程池优化配置
yiqi:
  thread-pool:
    core-size: 20 # 增加核心线程数
    max-size: 100 # 增加最大线程数
    queue-capacity: 200 # 增加队列容量
    keep-alive-seconds: 120 # 延长线程存活时间
```

### 3. 监控告警

```javascript
// 设置性能监控告警
function setupPerformanceAlerts() {
  // 响应时间告警
  if (avgResponseTime > 15000) {
    // 15秒
    alert("警告: 平均响应时间过长");
  }

  // 成功率告警
  if (successRate < 0.8) {
    // 80%
    alert("警告: 推理成功率过低");
  }

  // 并发数告警
  if (runningInferences > 50) {
    alert("警告: 并发推理数过多");
  }
}
```

---

## 新增接口使用示例

### 1. JavaScript/Fetch 示例

```javascript
// 执行会话阶段推理
async function executeSessionPhaseInference(sessionId, phaseType, userPrompt) {
  try {
    const response = await fetch(
      `/api/parallel-inference/sessions/${sessionId}/phases/${phaseType}/execute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          userPrompt: userPrompt,
          additionalContext: "重点关注创新性和实用性",
          waitForCompletion: true,
          timeoutSeconds: 120,
        }),
      }
    );

    const result = await response.json();

    if (result.successRate > 0.8) {
      console.log(
        "推理成功，成功率:",
        (result.successRate * 100).toFixed(1) + "%"
      );
      console.log("阶段总结:", result.phaseSummary);
    } else {
      console.warn(
        "推理成功率较低:",
        (result.successRate * 100).toFixed(1) + "%"
      );
    }

    return result;
  } catch (error) {
    console.error("推理执行失败:", error);
    throw error;
  }
}

// 自定义代理并行推理
async function executeCustomParallelInference(agentIds, userPrompt, phaseType) {
  try {
    const response = await fetch("/api/parallel-inference/custom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        agentIds: agentIds,
        userPrompt: userPrompt,
        sessionContext: "自定义推理会话",
        sessionId: `custom-${Date.now()}`,
        phaseType: phaseType,
        timeoutSeconds: 120,
      }),
    });

    const result = await response.json();
    console.log("自定义推理完成，参与代理数:", result.totalAgents);
    return result;
  } catch (error) {
    console.error("自定义推理失败:", error);
    throw error;
  }
}

// 批量多阶段推理
async function executeBatchMultiPhaseInference(sessionId, topic) {
  const phases = [
    {
      phaseType: "IDEA_GENERATION",
      userPrompt: `请为"${topic}"提出创新想法`,
      additionalContext: "重点关注创新性和可行性",
      timeoutSeconds: 120,
    },
    {
      phaseType: "FEASIBILITY_ANALYSIS",
      userPrompt: `请分析"${topic}"相关想法的可行性`,
      additionalContext: "考虑技术、成本、市场等因素",
      timeoutSeconds: 120,
    },
    {
      phaseType: "CRITICISM_DISCUSSION",
      userPrompt: `请指出"${topic}"方案的缺点和改进建议`,
      additionalContext: "批判性思考，提出具体改进方案",
      timeoutSeconds: 120,
    },
  ];

  try {
    const response = await fetch("/api/parallel-inference/batch/multi-phase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        sessionId: sessionId,
        phases: phases,
        stopOnFailure: false, // 即使某阶段失败也继续执行
        overallTimeoutSeconds: 600,
      }),
    });

    const result = await response.json();

    console.log("批量推理完成:");
    console.log("- 总阶段数:", result.totalPhases);
    console.log("- 成功阶段数:", result.successfulPhases);
    console.log(
      "- 总体成功率:",
      (result.overallSuccessRate * 100).toFixed(1) + "%"
    );
    console.log(
      "- 总耗时:",
      (result.totalProcessingTimeMs / 1000).toFixed(1) + "秒"
    );

    // 输出各阶段结果
    Object.entries(result.phaseResults).forEach(([phase, phaseResult]) => {
      console.log(
        `${phase}: 成功率 ${(phaseResult.successRate * 100).toFixed(1)}%`
      );
    });

    return result;
  } catch (error) {
    console.error("批量推理失败:", error);
    throw error;
  }
}

// 获取推理性能统计
async function getInferencePerformanceStats(timeRange = "24h") {
  try {
    const response = await fetch(
      `/api/parallel-inference/statistics/performance?timeRange=${timeRange}`,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    const stats = await response.json();

    console.log("推理性能统计:");
    console.log("- 总推理次数:", stats.totalInferences);
    console.log("- 成功率:", (stats.successRate * 100).toFixed(2) + "%");
    console.log(
      "- 平均响应时间:",
      (stats.averageResponseTime / 1000).toFixed(2) + "秒"
    );
    console.log("- 当前运行中:", stats.runningInferences);

    return stats;
  } catch (error) {
    console.error("获取性能统计失败:", error);
    throw error;
  }
}
```

### 2. Java/Spring 示例

```java
@Service
public class ParallelInferenceClient {

    @Autowired
    private RestTemplate restTemplate;

    private static final String BASE_URL = "http://localhost:8080/api/parallel-inference";

    /**
     * 执行会话阶段推理
     */
    public ParallelInferenceResult executeSessionPhaseInference(
            Long sessionId, PhaseType phaseType, String userPrompt, String token) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        SessionPhaseInferenceRequest request = new SessionPhaseInferenceRequest();
        request.setUserPrompt(userPrompt);
        request.setAdditionalContext("系统自动生成的推理请求");
        request.setWaitForCompletion(true);
        request.setTimeoutSeconds(120);

        HttpEntity<SessionPhaseInferenceRequest> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<ParallelInferenceResult> response = restTemplate.postForEntity(
                BASE_URL + "/sessions/" + sessionId + "/phases/" + phaseType + "/execute",
                entity, ParallelInferenceResult.class
            );

            ParallelInferenceResult result = response.getBody();
            log.info("会话阶段推理完成: sessionId={}, phaseType={}, 成功率={:.2f}%",
                    sessionId, phaseType, result.getSuccessRate() * 100);

            return result;
        } catch (Exception e) {
            log.error("会话阶段推理失败: sessionId={}, phaseType={}", sessionId, phaseType, e);
            throw new RuntimeException("推理执行失败: " + e.getMessage());
        }
    }

    /**
     * 自定义代理并行推理
     */
    public ParallelInferenceResult executeCustomParallelInference(
            List<Long> agentIds, String userPrompt, PhaseType phaseType, String token) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        CustomParallelInferenceRequest request = new CustomParallelInferenceRequest();
        request.setAgentIds(agentIds);
        request.setUserPrompt(userPrompt);
        request.setSessionContext("自定义推理会话");
        request.setSessionId("custom-" + System.currentTimeMillis());
        request.setPhaseType(phaseType);
        request.setTimeoutSeconds(120);

        HttpEntity<CustomParallelInferenceRequest> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<ParallelInferenceResult> response = restTemplate.postForEntity(
                BASE_URL + "/custom", entity, ParallelInferenceResult.class
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("自定义并行推理失败", e);
            throw new RuntimeException("自定义推理失败: " + e.getMessage());
        }
    }

    /**
     * 获取推理性能统计
     */
    public InferencePerformanceStats getPerformanceStats(String timeRange, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        HttpEntity<?> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<InferencePerformanceStats> response = restTemplate.exchange(
                BASE_URL + "/statistics/performance?timeRange=" + timeRange,
                HttpMethod.GET, entity, InferencePerformanceStats.class
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("获取性能统计失败", e);
            throw new RuntimeException("性能统计查询失败: " + e.getMessage());
        }
    }
}
```

### 3. 完整的头脑风暴流程示例

```javascript
// 完整的三阶段头脑风暴流程
class BrainstormWorkflow {
  constructor(sessionId, token) {
    this.sessionId = sessionId;
    this.token = token;
    this.results = {};
  }

  async executeFullWorkflow(topic) {
    console.log(`开始执行完整头脑风暴流程: ${topic}`);

    try {
      // 方式1: 使用批量多阶段推理（推荐）
      const batchResult = await this.executeBatchWorkflow(topic);
      return batchResult;

      // 方式2: 逐个阶段执行（更灵活的控制）
      // return await this.executeStepByStepWorkflow(topic);
    } catch (error) {
      console.error("头脑风暴流程执行失败:", error);
      throw error;
    }
  }

  async executeBatchWorkflow(topic) {
    const phases = [
      {
        phaseType: "IDEA_GENERATION",
        userPrompt: `请为"${topic}"进行创意头脑风暴，提出创新的想法和解决方案`,
        additionalContext: "重点关注创新性、实用性和市场潜力",
        timeoutSeconds: 120,
      },
      {
        phaseType: "FEASIBILITY_ANALYSIS",
        userPrompt: `请分析"${topic}"相关创意的技术可行性和实施难度`,
        additionalContext: "考虑技术成熟度、开发成本、时间周期等因素",
        timeoutSeconds: 120,
      },
      {
        phaseType: "CRITICISM_DISCUSSION",
        userPrompt: `请批判性地分析"${topic}"方案，指出潜在问题和改进方向`,
        additionalContext: "从风险控制、用户接受度、竞争优势等角度分析",
        timeoutSeconds: 120,
      },
    ];

    const response = await fetch("/api/parallel-inference/batch/multi-phase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + this.token,
      },
      body: JSON.stringify({
        sessionId: this.sessionId,
        phases: phases,
        stopOnFailure: false,
        overallTimeoutSeconds: 600,
      }),
    });

    const result = await response.json();

    // 生成最终报告
    const report = this.generateFinalReport(result);
    console.log("头脑风暴完成，生成最终报告");

    return { batchResult: result, finalReport: report };
  }

  async executeStepByStepWorkflow(topic) {
    // 阶段1: 创意生成
    console.log("执行阶段1: 创意生成");
    const phase1Result = await executeSessionPhaseInference(
      this.sessionId,
      "IDEA_GENERATION",
      `请为"${topic}"进行创意头脑风暴，提出创新的想法和解决方案`
    );
    this.results.ideaGeneration = phase1Result;

    // 阶段2: 可行性分析
    console.log("执行阶段2: 可行性分析");
    const phase2Result = await executeSessionPhaseInference(
      this.sessionId,
      "FEASIBILITY_ANALYSIS",
      `请分析以下创意的可行性：\n${phase1Result.phaseSummary}`
    );
    this.results.feasibilityAnalysis = phase2Result;

    // 阶段3: 缺点讨论
    console.log("执行阶段3: 缺点讨论");
    const phase3Result = await executeSessionPhaseInference(
      this.sessionId,
      "CRITICISM_DISCUSSION",
      `请批判性分析以下方案的缺点：\n${phase2Result.phaseSummary}`
    );
    this.results.criticismDiscussion = phase3Result;

    // 生成最终报告
    const report = this.generateStepByStepReport();

    return { stepResults: this.results, finalReport: report };
  }

  generateFinalReport(batchResult) {
    const report = {
      topic: "头脑风暴主题",
      executionTime: batchResult.totalProcessingTimeMs,
      overallSuccessRate: batchResult.overallSuccessRate,
      phases: {},
      summary: "",
      recommendations: [],
    };

    // 整理各阶段结果
    Object.entries(batchResult.phaseResults).forEach(([phase, result]) => {
      report.phases[phase] = {
        successRate: result.successRate,
        summary: result.phaseSummary,
        agentCount: result.totalAgents,
      };
    });

    // 生成总结
    report.summary =
      `本次头脑风暴共执行${batchResult.totalPhases}个阶段，` +
      `总体成功率${(batchResult.overallSuccessRate * 100).toFixed(1)}%，` +
      `耗时${(batchResult.totalProcessingTimeMs / 1000).toFixed(1)}秒。`;

    // 生成建议
    if (batchResult.overallSuccessRate >= 0.9) {
      report.recommendations.push("推理质量优秀，可以直接基于结果制定实施方案");
    } else if (batchResult.overallSuccessRate >= 0.7) {
      report.recommendations.push("推理质量良好，建议进一步完善部分细节");
    } else {
      report.recommendations.push(
        "推理质量需要改进，建议重新执行或调整代理配置"
      );
    }

    return report;
  }
}

// 使用示例
async function runBrainstormExample() {
  const workflow = new BrainstormWorkflow(123, "your-auth-token");

  try {
    const result = await workflow.executeFullWorkflow(
      "智能家居语音助手产品设计"
    );

    console.log("=== 头脑风暴最终报告 ===");
    console.log("主题:", result.finalReport.topic);
    console.log(
      "总体成功率:",
      (result.finalReport.overallSuccessRate * 100).toFixed(1) + "%"
    );
    console.log(
      "执行时间:",
      (result.finalReport.executionTime / 1000).toFixed(1) + "秒"
    );
    console.log("总结:", result.finalReport.summary);
    console.log("建议:", result.finalReport.recommendations.join("; "));
  } catch (error) {
    console.error("头脑风暴执行失败:", error);
  }
}
```

---

## 更新日志

- **v1.0.0** (2024-01-15): 初始版本发布

  - 多代理并行推理功能
  - 三阶段头脑风暴支持
  - 实时状态跟踪
  - 智能错误处理
  - 自动结果汇总

- **v1.1.0** (2024-01-15): 新增 REST API 接口
  - 会话阶段推理接口
  - 自定义代理并行推理接口
  - 推理结果详情查询接口
  - 批量多阶段推理接口
  - 推理性能统计接口

---

## 技术支持

如有问题或建议，请联系开发团队：

- **邮箱**: dev@yiqi-platform.com
- **技术文档**: [开发者中心](http://dev.yiqi-platform.com)
- **性能监控**: [监控面板](http://monitor.yiqi-platform.com)
