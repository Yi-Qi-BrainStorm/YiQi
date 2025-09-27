<template>
  <div class="agent-thinking-panel">
    <a-card 
      :class="['agent-card', `status-${status}`]"
      :bordered="true"
      size="small"
    >
      <!-- 代理头部信息 -->
      <template #title>
        <div class="agent-header">
          <div class="agent-info">
            <div class="agent-avatar">
              <a-avatar 
                :size="32"
                :style="{ backgroundColor: getAgentColor(agent.id) }"
              >
                {{ getAgentInitials(agent.name) }}
              </a-avatar>
            </div>
            <div class="agent-details">
              <div class="agent-name">{{ agent.name }}</div>
              <div class="agent-role">{{ agent.roleType }}</div>
            </div>
          </div>
          <div class="agent-status">
            <a-badge 
              :status="getStatusBadgeType(status)"
              :text="getStatusText(status)"
              class="status-badge"
            />
          </div>
        </div>
      </template>

      <!-- 代理状态内容 -->
      <div class="agent-content">
        <!-- 思考中状态 -->
        <div v-if="status === 'thinking'" class="thinking-state">
          <div class="thinking-animation">
            <a-spin size="small" />
            <span class="thinking-text">{{ thinkingText }}</span>
          </div>
          
          <!-- 思考进度 -->
          <div class="thinking-progress" v-if="thinkingProgress !== null">
            <a-progress
              :percent="thinkingProgress"
              :stroke-color="progressColor"
              :trail-color="'#f0f0f0'"
              :show-info="false"
              size="small"
            />
            <div class="progress-text">
              思考进度: {{ Math.round(thinkingProgress) }}%
            </div>
          </div>

          <!-- 预计完成时间 -->
          <div class="estimated-time" v-if="estimatedCompletionTime">
            <ClockCircleOutlined />
            <span>预计完成: {{ formatTime(estimatedCompletionTime) }}</span>
          </div>
        </div>

        <!-- 已完成状态 -->
        <div v-else-if="status === 'completed' && result" class="completed-state">
          <div class="completion-info">
            <CheckCircleOutlined class="success-icon" />
            <span class="completion-text">
              思考完成 (用时: {{ formatDuration(result.processingTime) }})
            </span>
          </div>

          <!-- 结果预览 -->
          <div class="result-preview">
            <div class="preview-header">
              <span class="preview-title">分析结果预览</span>
              <a-button 
                type="link" 
                size="small"
                @click="togglePreview"
              >
                {{ showPreview ? '收起' : '展开' }}
                <component :is="showPreview ? 'UpOutlined' : 'DownOutlined'" />
              </a-button>
            </div>
            
            <div v-show="showPreview" class="preview-content">
              <div class="content-summary">
                {{ getContentSummary(result.content) }}
              </div>
              
              <div class="result-actions">
                <a-space>
                  <a-button 
                    size="small" 
                    @click="handleViewDetails"
                  >
                    <EyeOutlined />
                    查看详情
                  </a-button>
                  <a-button 
                    size="small" 
                    @click="handleCopyResult"
                  >
                    <CopyOutlined />
                    复制结果
                  </a-button>
                  <a-button 
                    size="small" 
                    @click="handleExportResult"
                  >
                    <DownloadOutlined />
                    导出
                  </a-button>
                </a-space>
              </div>
            </div>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="status === 'error'" class="error-state">
          <div class="error-info">
            <ExclamationCircleOutlined class="error-icon" />
            <span class="error-text">处理失败</span>
          </div>
          
          <div class="error-details" v-if="errorMessage">
            <a-alert
              :message="errorMessage"
              type="error"
              show-icon
              :closable="false"
            />
          </div>

          <div class="error-actions">
            <a-space>
              <a-button 
                size="small" 
                type="primary"
                @click="handleRetry"
                :loading="retrying"
              >
                <RedoOutlined />
                重试
              </a-button>
              <a-button 
                size="small"
                @click="handleSkip"
              >
                跳过此代理
              </a-button>
            </a-space>
          </div>
        </div>

        <!-- 空闲状态 -->
        <div v-else-if="status === 'idle'" class="idle-state">
          <div class="idle-info">
            <PauseCircleOutlined class="idle-icon" />
            <span class="idle-text">等待开始</span>
          </div>
        </div>
      </div>

      <!-- 代理模型信息 -->
      <template #extra>
        <a-tooltip :title="`AI模型: ${agent.aiModel}`">
          <a-tag size="small" color="blue">
            {{ agent.aiModel }}
          </a-tag>
        </a-tooltip>
      </template>
    </a-card>

    <!-- 详情模态框 -->
    <a-modal
      v-model:open="detailsVisible"
      :title="`${agent.name} - 分析结果详情`"
      width="800px"
      :footer="null"
      class="result-details-modal"
    >
      <div v-if="result" class="result-details">
        <a-descriptions :column="2" bordered size="small">
          <a-descriptions-item label="代理名称">
            {{ result.agentName }}
          </a-descriptions-item>
          <a-descriptions-item label="角色类型">
            {{ result.agentRole }}
          </a-descriptions-item>
          <a-descriptions-item label="处理时间">
            {{ formatDuration(result.processingTime) }}
          </a-descriptions-item>
          <a-descriptions-item label="完成时间">
            {{ formatTime(result.createdAt) }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider orientation="left">分析内容</a-divider>
        <div class="result-content">
          <pre class="content-text">{{ result.content }}</pre>
        </div>

        <div class="modal-actions">
          <a-space>
            <a-button @click="handleCopyResult">
              <CopyOutlined />
              复制内容
            </a-button>
            <a-button @click="handleExportResult">
              <DownloadOutlined />
              导出结果
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  EyeOutlined,
  CopyOutlined,
  DownloadOutlined,
  RedoOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons-vue';
import type { Agent, AgentRuntimeStatus, AgentResult } from '@/types/agent';

interface Props {
  agent: Agent;
  status: AgentRuntimeStatus;
  result?: AgentResult;
  thinkingProgress?: number | null;
  estimatedCompletionTime?: string | null;
  errorMessage?: string | null;
}

interface Emits {
  (e: 'view-details', result: AgentResult): void;
  (e: 'retry-agent', agentId: number): void;
  (e: 'skip-agent', agentId: number): void;
  (e: 'copy-result', result: AgentResult): void;
  (e: 'export-result', result: AgentResult): void;
}

const props = withDefaults(defineProps<Props>(), {
  status: 'idle',
  thinkingProgress: null,
  estimatedCompletionTime: null,
  errorMessage: null,
});

const emit = defineEmits<Emits>();

// 响应式数据
const showPreview = ref(false);
const detailsVisible = ref(false);
const retrying = ref(false);

// 思考状态文本轮换
const thinkingTexts = [
  '正在分析问题...',
  '收集相关信息...',
  '生成创意方案...',
  '评估可行性...',
  '完善解决方案...',
];
const thinkingTextIndex = ref(0);
const thinkingText = computed(() => thinkingTexts[thinkingTextIndex.value]);

// 定时更新思考文本
let thinkingTextTimer: NodeJS.Timeout | null = null;

watch(() => props.status, (newStatus) => {
  if (newStatus === 'thinking') {
    startThinkingTextRotation();
  } else {
    stopThinkingTextRotation();
  }
}, { immediate: true });

const startThinkingTextRotation = () => {
  if (thinkingTextTimer) return;
  
  thinkingTextTimer = setInterval(() => {
    thinkingTextIndex.value = (thinkingTextIndex.value + 1) % thinkingTexts.length;
  }, 2000);
};

const stopThinkingTextRotation = () => {
  if (thinkingTextTimer) {
    clearInterval(thinkingTextTimer);
    thinkingTextTimer = null;
  }
};

// 计算属性
const progressColor = computed(() => {
  if (props.thinkingProgress === null) return '#d9d9d9';
  if (props.thinkingProgress >= 80) return '#52c41a';
  if (props.thinkingProgress >= 50) return '#1890ff';
  if (props.thinkingProgress >= 20) return '#faad14';
  return '#ff4d4f';
});

// 方法
const getAgentColor = (agentId: number): string => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];
  return colors[agentId % colors.length];
};

const getAgentInitials = (name: string): string => {
  return name.slice(0, 2).toUpperCase();
};

const getStatusBadgeType = (status: AgentRuntimeStatus) => {
  switch (status) {
    case 'thinking': return 'processing';
    case 'completed': return 'success';
    case 'error': return 'error';
    case 'idle': return 'default';
    default: return 'default';
  }
};

const getStatusText = (status: AgentRuntimeStatus): string => {
  switch (status) {
    case 'thinking': return '思考中';
    case 'completed': return '已完成';
    case 'error': return '处理失败';
    case 'idle': return '等待中';
    default: return '未知状态';
  }
};

const getContentSummary = (content: string): string => {
  if (!content) return '';
  
  // 提取前200个字符作为摘要
  const summary = content.slice(0, 200);
  return content.length > 200 ? `${summary}...` : summary;
};

const formatTime = (timeString: string): string => {
  const date = new Date(timeString);
  return date.toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`;
  }
  return `${remainingSeconds}秒`;
};

// 事件处理
const togglePreview = () => {
  showPreview.value = !showPreview.value;
};

const handleViewDetails = () => {
  if (props.result) {
    detailsVisible.value = true;
    emit('view-details', props.result);
  }
};

const handleCopyResult = async () => {
  if (!props.result) return;
  
  try {
    await navigator.clipboard.writeText(props.result.content);
    message.success('结果已复制到剪贴板');
    emit('copy-result', props.result);
  } catch (error) {
    message.error('复制失败');
  }
};

const handleExportResult = () => {
  if (props.result) {
    emit('export-result', props.result);
  }
};

const handleRetry = async () => {
  retrying.value = true;
  try {
    emit('retry-agent', props.agent.id);
  } finally {
    retrying.value = false;
  }
};

const handleSkip = () => {
  emit('skip-agent', props.agent.id);
};

// 清理定时器
const cleanup = () => {
  stopThinkingTextRotation();
};

// 组件卸载时清理
import { onUnmounted } from 'vue';
onUnmounted(cleanup);
</script>

<style scoped lang="scss">
.agent-thinking-panel {
  .agent-card {
    transition: all 0.3s ease;
    border-radius: 8px;
    
    &.status-thinking {
      border-color: #1890ff;
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
    }
    
    &.status-completed {
      border-color: #52c41a;
      box-shadow: 0 2px 8px rgba(82, 196, 26, 0.2);
    }
    
    &.status-error {
      border-color: #ff4d4f;
      box-shadow: 0 2px 8px rgba(255, 77, 79, 0.2);
    }
    
    &.status-idle {
      border-color: #d9d9d9;
    }

    .agent-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;

      .agent-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .agent-details {
          .agent-name {
            font-size: 14px;
            font-weight: 600;
            color: #262626;
            margin-bottom: 2px;
          }

          .agent-role {
            font-size: 12px;
            color: #8c8c8c;
          }
        }
      }

      .agent-status {
        .status-badge {
          font-size: 12px;
        }
      }
    }
  }

  .agent-content {
    min-height: 120px;

    .thinking-state {
      .thinking-animation {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;

        .thinking-text {
          color: #1890ff;
          font-size: 14px;
        }
      }

      .thinking-progress {
        margin-bottom: 12px;

        .progress-text {
          font-size: 12px;
          color: #8c8c8c;
          margin-top: 4px;
        }
      }

      .estimated-time {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #8c8c8c;

        .anticon {
          color: #1890ff;
        }
      }
    }

    .completed-state {
      .completion-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;

        .success-icon {
          color: #52c41a;
          font-size: 16px;
        }

        .completion-text {
          color: #52c41a;
          font-weight: 500;
        }
      }

      .result-preview {
        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .preview-title {
            font-size: 13px;
            font-weight: 500;
            color: #595959;
          }
        }

        .preview-content {
          .content-summary {
            background: #fafafa;
            padding: 12px;
            border-radius: 4px;
            font-size: 13px;
            line-height: 1.5;
            color: #595959;
            margin-bottom: 12px;
            max-height: 100px;
            overflow-y: auto;
          }

          .result-actions {
            text-align: center;
          }
        }
      }
    }

    .error-state {
      .error-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;

        .error-icon {
          color: #ff4d4f;
          font-size: 16px;
        }

        .error-text {
          color: #ff4d4f;
          font-weight: 500;
        }
      }

      .error-details {
        margin-bottom: 12px;
      }

      .error-actions {
        text-align: center;
      }
    }

    .idle-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 80px;

      .idle-info {
        display: flex;
        align-items: center;
        gap: 8px;

        .idle-icon {
          color: #8c8c8c;
          font-size: 16px;
        }

        .idle-text {
          color: #8c8c8c;
          font-size: 14px;
        }
      }
    }
  }
}

.result-details-modal {
  .result-details {
    .result-content {
      margin: 16px 0;

      .content-text {
        background: #fafafa;
        padding: 16px;
        border-radius: 4px;
        font-size: 13px;
        line-height: 1.6;
        white-space: pre-wrap;
        word-wrap: break-word;
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid #e8e8e8;
      }
    }

    .modal-actions {
      text-align: center;
      margin-top: 16px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .agent-thinking-panel {
    .agent-card .agent-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;

      .agent-status {
        align-self: flex-end;
      }
    }
  }

  .result-details-modal {
    :deep(.ant-modal) {
      margin: 16px;
      max-width: calc(100vw - 32px);
    }
  }
}
</style>