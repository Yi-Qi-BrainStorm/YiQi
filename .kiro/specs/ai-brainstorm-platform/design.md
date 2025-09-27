# Design Document

## Overview

本设计文档描述了AI头脑风暴文创产品设计平台的前端架构。该平台采用现代Vue 3技术栈，提供响应式的单页应用体验，支持实时的多代理头脑风暴流程管理。

前端将实现用户认证、代理管理、头脑风暴会话控制、实时状态监控和结果展示等核心功能，通过WebSocket与后端保持实时通信，确保多代理并行处理过程的流畅用户体验。

## Architecture

### 技术栈选择

- **框架**: Vue 3 with TypeScript
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **UI组件库**: Ant Design Vue 4.x
- **样式方案**: SCSS + CSS Modules
- **实时通信**: Socket.IO Client
- **构建工具**: Vite
- **代码质量**: ESLint + Prettier + Husky

### 架构模式

采用分层架构模式：

```
┌─────────────────────────────────────┐
│           Presentation Layer        │
│      (Vue Components + Views)       │
├─────────────────────────────────────┤
│          Business Logic Layer       │
│       (Composables + Utils)         │
├─────────────────────────────────────┤
│           Data Access Layer         │
│        (API Services + Socket)      │
├─────────────────────────────────────┤
│            State Layer              │
│           (Pinia Stores)            │
└─────────────────────────────────────┘
```

### 目录结构

```
frontend/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── common/         # 通用组件
│   │   ├── agent/          # 代理相关组件
│   │   ├── brainstorm/     # 头脑风暴相关组件
│   │   └── layout/         # 布局组件
│   ├── views/              # 页面视图
│   │   ├── auth/           # 认证页面
│   │   ├── dashboard/      # 主工作台
│   │   ├── agents/         # 代理管理
│   │   └── brainstorm/     # 头脑风暴
│   ├── composables/        # 组合式函数
│   ├── stores/             # Pinia状态管理
│   ├── services/           # API服务
│   ├── utils/              # 工具函数
│   ├── types/              # TypeScript类型定义
│   ├── constants/          # 常量定义
│   ├── router/             # 路由配置
│   └── styles/             # 全局样式
├── public/                 # 静态资源
└── package.json
```

## Components and Interfaces

### 核心组件设计

#### 1. 认证组件 (Auth Components)

**LoginForm.vue**
```vue
<script setup lang="ts">
interface Props {
  loading?: boolean;
  error?: string;
}

interface Emits {
  (e: 'submit', credentials: LoginCredentials): void;
}

interface LoginCredentials {
  username: string;
  password: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();
</script>
```

**RegisterForm.vue**
```vue
<script setup lang="ts">
interface Props {
  loading?: boolean;
  error?: string;
}

interface Emits {
  (e: 'submit', userData: RegisterData): void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();
</script>
```

#### 2. 代理管理组件 (Agent Components)

**AgentCard.vue**
```vue
<script setup lang="ts">
interface Props {
  agent: Agent;
}

interface Emits {
  (e: 'edit', agent: Agent): void;
  (e: 'delete', agentId: string): void;
  (e: 'duplicate', agent: Agent): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
</script>
```

**AgentForm.vue**
```vue
<script setup lang="ts">
interface Props {
  agent?: Agent;
  availableModels: AIModel[];
}

interface Emits {
  (e: 'submit', agentData: AgentFormData): void;
  (e: 'cancel'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
</script>
```

**AgentList.vue**
```vue
<script setup lang="ts">
interface Props {
  agents: Agent[];
  loading?: boolean;
}

interface Emits {
  (e: 'create-new'): void;
  (e: 'edit', agent: Agent): void;
  (e: 'delete', agentId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();
</script>
```

#### 3. 头脑风暴组件 (Brainstorm Components)

**BrainstormSession.vue**
```vue
<script setup lang="ts">
interface Props {
  sessionId: string;
  currentStage: BrainstormStage;
  agents: Agent[];
}

interface Emits {
  (e: 'stage-complete', results: StageResults): void;
  (e: 'restart-stage'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
</script>
```

**AgentThinkingPanel.vue**
```vue
<script setup lang="ts">
interface Props {
  agent: Agent;
  status: AgentStatus;
  result?: AgentResult;
}

interface Emits {
  (e: 'view-details', result: AgentResult): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
</script>
```

**StageProgressIndicator.vue**
```vue
<script setup lang="ts">
interface Props {
  currentStage: number;
  totalStages: number;
  stageNames: string[];
  completedStages: boolean[];
}

const props = defineProps<Props>();
</script>
```

**StageSummary.vue**
```vue
<script setup lang="ts">
interface Props {
  summary: AISummary;
  agentResults: AgentResult[];
  isLastStage?: boolean;
}

interface Emits {
  (e: 'proceed-to-next'): void;
  (e: 'restart-stage'): void;
}

const props = withDefaults(defineProps<Props>(), {
  isLastStage: false,
});

const emit = defineEmits<Emits>();
</script>
```

### Composables设计

#### 1. 认证相关Composables

**useAuth.ts**
```typescript
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

export function useAuth() {
  const authStore = useAuthStore();

  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const user = computed(() => authStore.user);
  const loading = computed(() => authStore.loading);

  const login = async (credentials: LoginCredentials) => {
    return await authStore.login(credentials);
  };

  const register = async (userData: RegisterData) => {
    return await authStore.register(userData);
  };

  const logout = () => {
    authStore.logout();
  };

  return {
    isAuthenticated,
    user,
    loading,
    login,
    register,
    logout,
  };
}
```

#### 2. 代理管理Composables

**useAgents.ts**
```typescript
import { ref, computed } from 'vue';
import { useAgentStore } from '@/stores/agents';

export function useAgents() {
  const agentStore = useAgentStore();
  const loading = ref(false);

  const agents = computed(() => agentStore.agents);
  const selectedAgents = computed(() => agentStore.selectedAgents);

  const fetchAgents = async () => {
    loading.value = true;
    try {
      await agentStore.fetchAgents();
    } finally {
      loading.value = false;
    }
  };

  const createAgent = async (agentData: AgentFormData) => {
    return await agentStore.createAgent(agentData);
  };

  const updateAgent = async (id: string, agentData: AgentFormData) => {
    return await agentStore.updateAgent(id, agentData);
  };

  const deleteAgent = async (id: string) => {
    return await agentStore.deleteAgent(id);
  };

  const selectAgent = (agentId: string) => {
    agentStore.selectAgent(agentId);
  };

  const deselectAgent = (agentId: string) => {
    agentStore.deselectAgent(agentId);
  };

  return {
    agents,
    selectedAgents,
    loading: computed(() => loading.value),
    fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    selectAgent,
    deselectAgent,
  };
}
```

#### 3. 头脑风暴Composables

**useBrainstorm.ts**
```typescript
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useBrainstormStore } from '@/stores/brainstorm';
import { useSocket } from '@/composables/useSocket';

export function useBrainstorm(sessionId?: string) {
  const brainstormStore = useBrainstormStore();
  const { socket, connect, disconnect } = useSocket('/brainstorm');

  const currentSession = computed(() => brainstormStore.currentSession);
  const agentStatuses = computed(() => brainstormStore.agentStatuses);
  const stageProgress = computed(() => brainstormStore.stageProgress);

  const startBrainstorm = async (topic: string, agentIds: string[]) => {
    const session = await brainstormStore.createSession(topic, agentIds);
    
    if (socket.value) {
      socket.value.emit('brainstorm:start', {
        sessionId: session.id,
        topic,
        agentIds,
      });
    }
    
    return session;
  };

  const proceedToNextStage = () => {
    if (currentSession.value && socket.value) {
      socket.value.emit('brainstorm:proceed', {
        sessionId: currentSession.value.id,
        stage: currentSession.value.currentStage + 1,
      });
    }
  };

  const restartCurrentStage = () => {
    if (currentSession.value && socket.value) {
      socket.value.emit('brainstorm:restart-stage', {
        sessionId: currentSession.value.id,
        stage: currentSession.value.currentStage,
      });
    }
  };

  // Socket事件监听
  const setupSocketListeners = () => {
    if (!socket.value) return;

    socket.value.on('agent:status-update', (data) => {
      brainstormStore.updateAgentStatus(data.agentId, data.status);
    });

    socket.value.on('agent:result', (data) => {
      brainstormStore.setAgentResult(data.agentId, data.result);
    });

    socket.value.on('stage:summary', (data) => {
      brainstormStore.setStageSummary(data.stage, data.summary);
    });

    socket.value.on('session:complete', (data) => {
      brainstormStore.setFinalReport(data.finalReport);
    });
  };

  onMounted(() => {
    connect();
    setupSocketListeners();
    
    if (sessionId) {
      brainstormStore.loadSession(sessionId);
    }
  });

  onUnmounted(() => {
    disconnect();
  });

  return {
    currentSession,
    agentStatuses,
    stageProgress,
    startBrainstorm,
    proceedToNextStage,
    restartCurrentStage,
  };
}
```

#### 4. WebSocket Composable

**useSocket.ts**
```typescript
import { ref, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';

export function useSocket(namespace: string = '/') {
  const socket = ref<Socket | null>(null);
  const connected = ref(false);

  const connect = () => {
    if (socket.value?.connected) return;

    socket.value = io(namespace, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.value.on('connect', () => {
      connected.value = true;
    });

    socket.value.on('disconnect', () => {
      connected.value = false;
    });

    socket.value.on('connect_error', (error) => {
      console.error('Socket连接错误:', error);
    });
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      connected.value = false;
    }
  };

  onUnmounted(() => {
    disconnect();
  });

  return {
    socket,
    connected,
    connect,
    disconnect,
  };
}
```

### Pinia状态管理

#### 1. 认证Store

**stores/auth.ts**
```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  const login = async (credentials: LoginCredentials) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await authService.login(credentials);
      user.value = response.user;
      token.value = response.token;
      localStorage.setItem('token', response.token);
      return response;
    } catch (err: any) {
      error.value = err.message || '登录失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const register = async (userData: RegisterData) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await authService.register(userData);
      return response;
    } catch (err: any) {
      error.value = err.message || '注册失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
  };

  const checkAuth = async () => {
    if (!token.value) return false;
    
    try {
      const response = await authService.getCurrentUser();
      user.value = response.user;
      return true;
    } catch {
      logout();
      return false;
    }
  };

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  };
});
```

#### 2. 代理Store

**stores/agents.ts**
```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { agentService } from '@/services/agents';

export const useAgentStore = defineStore('agents', () => {
  const agents = ref<Agent[]>([]);
  const selectedAgentIds = ref<string[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const selectedAgents = computed(() => 
    agents.value.filter(agent => selectedAgentIds.value.includes(agent.id))
  );

  const fetchAgents = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await agentService.getAgents();
      agents.value = response;
    } catch (err: any) {
      error.value = err.message || '获取代理列表失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createAgent = async (agentData: AgentFormData) => {
    try {
      const newAgent = await agentService.createAgent(agentData);
      agents.value.push(newAgent);
      return newAgent;
    } catch (err: any) {
      error.value = err.message || '创建代理失败';
      throw err;
    }
  };

  const updateAgent = async (id: string, agentData: AgentFormData) => {
    try {
      const updatedAgent = await agentService.updateAgent(id, agentData);
      const index = agents.value.findIndex(agent => agent.id === id);
      if (index !== -1) {
        agents.value[index] = updatedAgent;
      }
      return updatedAgent;
    } catch (err: any) {
      error.value = err.message || '更新代理失败';
      throw err;
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      await agentService.deleteAgent(id);
      agents.value = agents.value.filter(agent => agent.id !== id);
      selectedAgentIds.value = selectedAgentIds.value.filter(agentId => agentId !== id);
    } catch (err: any) {
      error.value = err.message || '删除代理失败';
      throw err;
    }
  };

  const selectAgent = (agentId: string) => {
    if (!selectedAgentIds.value.includes(agentId)) {
      selectedAgentIds.value.push(agentId);
    }
  };

  const deselectAgent = (agentId: string) => {
    selectedAgentIds.value = selectedAgentIds.value.filter(id => id !== agentId);
  };

  const clearSelection = () => {
    selectedAgentIds.value = [];
  };

  return {
    agents,
    selectedAgents,
    selectedAgentIds,
    loading,
    error,
    fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    selectAgent,
    deselectAgent,
    clearSelection,
  };
});
```

#### 3. 头脑风暴Store

**stores/brainstorm.ts**
```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { brainstormService } from '@/services/brainstorm';

export const useBrainstormStore = defineStore('brainstorm', () => {
  const currentSession = ref<BrainstormSession | null>(null);
  const agentStatuses = ref<Record<string, AgentStatus>>({});
  const realTimeResults = ref<Record<string, AgentResult>>({});
  const loading = ref(false);
  const error = ref<string | null>(null);

  const stageProgress = computed(() => {
    if (!currentSession.value) return null;
    
    return {
      current: currentSession.value.currentStage,
      total: 3,
      stages: ['创意生成', '技术可行性分析', '缺点讨论'],
      completed: currentSession.value.stageResults.map(result => !!result),
    };
  });

  const createSession = async (topic: string, agentIds: string[]) => {
    loading.value = true;
    error.value = null;
    
    try {
      const session = await brainstormService.createSession(topic, agentIds);
      currentSession.value = session;
      
      // 初始化代理状态
      agentIds.forEach(agentId => {
        agentStatuses.value[agentId] = 'idle';
      });
      
      return session;
    } catch (err: any) {
      error.value = err.message || '创建会话失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const loadSession = async (sessionId: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      const session = await brainstormService.getSession(sessionId);
      currentSession.value = session;
    } catch (err: any) {
      error.value = err.message || '加载会话失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateAgentStatus = (agentId: string, status: AgentStatus) => {
    agentStatuses.value[agentId] = status;
  };

  const setAgentResult = (agentId: string, result: AgentResult) => {
    realTimeResults.value[agentId] = result;
    agentStatuses.value[agentId] = 'completed';
  };

  const setStageSummary = (stage: number, summary: AISummary) => {
    if (currentSession.value) {
      const stageResult: StageResult = {
        stage,
        stageName: ['创意生成', '技术可行性分析', '缺点讨论'][stage - 1],
        agentResults: Object.values(realTimeResults.value),
        aiSummary: summary,
        completedAt: new Date().toISOString(),
      };
      
      currentSession.value.stageResults[stage - 1] = stageResult;
    }
  };

  const setFinalReport = (report: FinalReport) => {
    if (currentSession.value) {
      currentSession.value.finalReport = report;
      currentSession.value.status = 'completed';
    }
  };

  const clearSession = () => {
    currentSession.value = null;
    agentStatuses.value = {};
    realTimeResults.value = {};
  };

  return {
    currentSession,
    agentStatuses,
    realTimeResults,
    stageProgress,
    loading,
    error,
    createSession,
    loadSession,
    updateAgentStatus,
    setAgentResult,
    setStageSummary,
    setFinalReport,
    clearSession,
  };
});
```

## Data Models

### 核心数据模型

```typescript
// 用户模型
interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// AI代理模型
interface Agent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  modelType: AIModelType;
  modelConfig: ModelConfig;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// AI模型配置
interface ModelConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

// 头脑风暴会话
interface BrainstormSession {
  id: string;
  topic: string;
  userId: string;
  agentIds: string[];
  currentStage: number;
  status: SessionStatus;
  stageResults: StageResult[];
  finalReport?: FinalReport;
  createdAt: string;
  updatedAt: string;
}

// 阶段结果
interface StageResult {
  stage: number;
  stageName: string;
  agentResults: AgentResult[];
  aiSummary: AISummary;
  completedAt: string;
}

// 代理结果
interface AgentResult {
  agentId: string;
  agentName: string;
  agentRole: string;
  content: string;
  reasoning: string;
  suggestions: string[];
  confidence: number;
  processingTime: number;
  createdAt: string;
}

// AI总结
interface AISummary {
  keyPoints: string[];
  commonSuggestions: string[];
  conflictingViews: ConflictingView[];
  overallAssessment: string;
  nextStepRecommendations: string[];
}

// 冲突观点
interface ConflictingView {
  topic: string;
  agentViews: {
    agentId: string;
    agentName: string;
    viewpoint: string;
  }[];
  analysis: string;
}

// 最终报告
interface FinalReport {
  sessionId: string;
  topic: string;
  executiveSummary: string;
  designConcept: DesignConcept;
  technicalSolution: TechnicalSolution;
  marketingStrategy: MarketingStrategy;
  implementationPlan: ImplementationPlan;
  riskAssessment: RiskAssessment;
  generatedAt: string;
}

// 设计概念
interface DesignConcept {
  productType: string;
  culturalBackground: string;
  designElements: string[];
  visualDescription: string;
  targetAudience: string;
}

// 技术方案
interface TechnicalSolution {
  materials: string[];
  productionProcess: string[];
  qualityStandards: string[];
  costEstimation: CostBreakdown;
  timeline: ProductionTimeline;
}

// 营销策略
interface MarketingStrategy {
  positioningStatement: string;
  channels: MarketingChannel[];
  campaigns: MarketingCampaign[];
  budget: MarketingBudget;
  kpis: string[];
}

// 枚举类型
type AIModelType = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'gemini-pro';
type SessionStatus = 'active' | 'paused' | 'completed' | 'cancelled';
type AgentStatus = 'idle' | 'thinking' | 'completed' | 'error';
type BrainstormStage = 1 | 2 | 3;
```

## Error Handling

### 错误处理策略

#### 1. API错误处理

**services/api.ts**
```typescript
import axios, { AxiosError, AxiosResponse } from 'axios';
import { useAuthStore } from '@/stores/auth';
import { ElMessage } from 'element-plus';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const authStore = useAuthStore();
    
    if (error.response?.status === 401) {
      // 认证失效，清除登录状态
      authStore.logout();
      ElMessage.error('登录已过期，请重新登录');
      window.location.href = '/login';
    } else if (error.response?.status >= 500) {
      // 服务器错误
      ElMessage.error('服务器暂时不可用，请稍后重试');
    } else if (error.code === 'ECONNABORTED') {
      // 请求超时
      ElMessage.error('请求超时，请检查网络连接');
    } else {
      // 其他错误
      const message = error.response?.data?.message || '请求失败';
      ElMessage.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

#### 2. 全局错误处理

**utils/errorHandler.ts**
```typescript
import { ElMessage, ElNotification } from 'element-plus';

export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export class ErrorHandler {
  static handle(error: Error | AppError | any) {
    console.error('应用错误:', error);
    
    if (this.isAppError(error)) {
      this.handleAppError(error);
    } else if (error instanceof Error) {
      this.handleGenericError(error);
    } else {
      this.handleUnknownError(error);
    }
  }
  
  private static isAppError(error: any): error is AppError {
    return error && typeof error.code === 'string' && typeof error.message === 'string';
  }
  
  private static handleAppError(error: AppError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        ElMessage.error('网络连接失败，请检查网络设置');
        break;
      case 'VALIDATION_ERROR':
        ElMessage.warning(error.message);
        break;
      case 'PERMISSION_DENIED':
        ElMessage.error('权限不足，无法执行此操作');
        break;
      default:
        ElMessage.error(error.message);
    }
  }
  
  private static handleGenericError(error: Error) {
    ElNotification({
      title: '系统错误',
      message: error.message,
      type: 'error',
      duration: 5000,
    });
  }
  
  private static handleUnknownError(error: any) {
    ElMessage.error('发生未知错误，请刷新页面重试');
  }
}

// Vue全局错误处理
export function setupGlobalErrorHandler(app: any) {
  app.config.errorHandler = (error: Error, instance: any, info: string) => {
    console.error('Vue错误:', error, info);
    ErrorHandler.handle(error);
  };
  
  // 处理未捕获的Promise错误
  window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise错误:', event.reason);
    ErrorHandler.handle(event.reason);
    event.preventDefault();
  });
}
```

#### 3. 组件错误边界

**components/common/ErrorBoundary.vue**
```vue
<template>
  <div v-if="hasError" class="error-boundary">
    <a-result
      status="error"
      title="页面出现错误"
      sub-title="请刷新页面重试，如果问题持续存在请联系技术支持"
    >
      <template #extra>
        <a-button type="primary" @click="handleRefresh">
          刷新页面
        </a-button>
        <a-button @click="handleRetry">
          重试
        </a-button>
      </template>
    </a-result>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';

const hasError = ref(false);

onErrorCaptured((error: Error) => {
  console.error('组件错误:', error);
  hasError.value = true;
  return false; // 阻止错误继续传播
});

const handleRefresh = () => {
  window.location.reload();
};

const handleRetry = () => {
  hasError.value = false;
};
</script>
```

## Testing Strategy

### 测试金字塔

#### 1. 单元测试 (70%)

**组件测试示例**
```typescript
// tests/components/AgentCard.spec.ts
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import AgentCard from '@/components/agent/AgentCard.vue';

describe('AgentCard', () => {
  const mockAgent = {
    id: '1',
    name: '设计师',
    role: 'UI/UX Designer',
    systemPrompt: 'You are a creative designer...',
    modelType: 'gpt-4' as const,
    modelConfig: {
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    userId: 'user1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('should render agent information correctly', () => {
    const wrapper = mount(AgentCard, {
      props: { agent: mockAgent },
    });

    expect(wrapper.text()).toContain('设计师');
    expect(wrapper.text()).toContain('UI/UX Designer');
  });

  it('should emit edit event when edit button is clicked', async () => {
    const wrapper = mount(AgentCard, {
      props: { agent: mockAgent },
    });

    await wrapper.find('[data-testid="edit-button"]').trigger('click');
    
    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')?.[0]).toEqual([mockAgent]);
  });
});
```

**Composable测试示例**
```typescript
// tests/composables/useAuth.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuth } from '@/composables/useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should login successfully', async () => {
    const { login, isAuthenticated } = useAuth();
    
    // Mock API response
    vi.mock('@/services/auth', () => ({
      authService: {
        login: vi.fn().mockResolvedValue({
          user: { id: '1', username: 'testuser' },
          token: 'mock-token',
        }),
      },
    }));

    await login({ username: 'testuser', password: 'password' });
    
    expect(isAuthenticated.value).toBe(true);
  });
});
```

#### 2. 集成测试 (20%)

**Store集成测试**
```typescript
// tests/stores/agents.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAgentStore } from '@/stores/agents';

describe('AgentStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should fetch agents successfully', async () => {
    const agentStore = useAgentStore();
    const mockAgents = [
      { id: '1', name: 'Designer', role: 'UI/UX Designer' },
    ];

    // Mock service
    vi.mock('@/services/agents', () => ({
      agentService: {
        getAgents: vi.fn().mockResolvedValue(mockAgents),
      },
    }));

    await agentStore.fetchAgents();
    
    expect(agentStore.agents).toEqual(mockAgents);
  });
});
```

#### 3. 端到端测试 (10%)

**Cypress测试示例**
```typescript
// cypress/e2e/brainstorm-flow.cy.ts
describe('Brainstorm Flow', () => {
  beforeEach(() => {
    cy.login('testuser', 'password');
  });

  it('should complete a full brainstorm session', () => {
    cy.visit('/brainstorm/new');
    
    // 输入主题
    cy.get('[data-testid="topic-input"]').type('智能手环设计');
    
    // 选择代理
    cy.get('[data-testid="agent-selector"]').click();
    cy.get('[data-testid="agent-option-designer"]').click();
    
    // 开始头脑风暴
    cy.get('[data-testid="start-brainstorm"]').click();
    
    // 验证第一阶段
    cy.get('[data-testid="stage-progress"]').should('contain', '创意生成阶段');
    cy.get('[data-testid="agent-status"]').should('contain', '思考中');
    
    // 等待代理完成并进入下一阶段
    cy.get('[data-testid="proceed-button"]', { timeout: 30000 }).click();
    
    // 验证第二阶段
    cy.get('[data-testid="stage-progress"]').should('contain', '技术可行性分析阶段');
  });
});
```

### 测试配置

**vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

**tests/setup.ts**
```typescript
import { config } from '@vue/test-utils';
import { createPinia } from 'pinia';

// 全局测试配置
config.global.plugins = [createPinia()];

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});
```

## 性能优化策略

### 1. 代码分割和懒加载

**router/index.ts**
```typescript
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/Dashboard.vue'),
  },
  {
    path: '/agents',
    name: 'AgentManagement',
    component: () => import('@/views/agents/AgentManagement.vue'),
  },
  {
    path: '/brainstorm',
    name: 'BrainstormSession',
    component: () => import('@/views/brainstorm/BrainstormSession.vue'),
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
```

### 2. 组件优化

```vue
<!-- 使用v-memo优化列表渲染 -->
<template>
  <div class="agent-list">
    <AgentCard
      v-for="agent in agents"
      :key="agent.id"
      v-memo="[agent.id, agent.updatedAt]"
      :agent="agent"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
// 使用shallowRef优化大对象
import { shallowRef, computed } from 'vue';

const agents = shallowRef<Agent[]>([]);
const filteredAgents = computed(() => 
  agents.value.filter(agent => agent.name.includes(searchTerm.value))
);
</script>
```

### 3. 虚拟滚动

**components/common/VirtualList.vue**
```vue
<template>
  <div ref="containerRef" class="virtual-list" @scroll="handleScroll">
    <div :style="{ height: totalHeight + 'px' }" class="virtual-list-phantom">
      <div
        :style="{ transform: `translateY(${startOffset}px)` }"
        class="virtual-list-content"
      >
        <div
          v-for="item in visibleItems"
          :key="item.id"
          :style="{ height: itemHeight + 'px' }"
          class="virtual-list-item"
        >
          <slot :item="item" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface Props {
  items: any[];
  itemHeight: number;
  containerHeight: number;
}

const props = defineProps<Props>();
const containerRef = ref<HTMLElement>();
const scrollTop = ref(0);

const totalHeight = computed(() => props.items.length * props.itemHeight);
const visibleCount = computed(() => Math.ceil(props.containerHeight / props.itemHeight) + 2);
const startIndex = computed(() => Math.floor(scrollTop.value / props.itemHeight));
const endIndex = computed(() => Math.min(startIndex.value + visibleCount.value, props.items.length));
const startOffset = computed(() => startIndex.value * props.itemHeight);

const visibleItems = computed(() => 
  props.items.slice(startIndex.value, endIndex.value)
);

const handleScroll = (e: Event) => {
  scrollTop.value = (e.target as HTMLElement).scrollTop;
};
</script>
```

### 4. 图片优化

**components/common/OptimizedImage.vue**
```vue
<template>
  <picture>
    <source :srcset="`${src}.webp`" type="image/webp" />
    <source :srcset="`${src}.avif`" type="image/avif" />
    <img 
      :src="src" 
      :alt="alt" 
      loading="lazy"
      decoding="async"
      @load="handleLoad"
      @error="handleError"
    />
  </picture>
</template>

<script setup lang="ts">
interface Props {
  src: string;
  alt: string;
}

const props = defineProps<Props>();

const handleLoad = () => {
  console.log('图片加载完成');
};

const handleError = () => {
  console.error('图片加载失败');
};
</script>
```