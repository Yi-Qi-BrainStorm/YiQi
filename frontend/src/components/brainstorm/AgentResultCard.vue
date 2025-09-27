<template>
  <div class="agent-result-card">
    <a-card
      :title="cardTitle"
      :class="['result-card', { 'expanded': isExpanded }]"
      :hoverable="true"
    >
      <template #extra>
        <div class="card-actions">
          <a-tooltip title="展开/折叠">
            <a-button
              type="text"
              :icon="isExpanded ? h(UpOutlined) : h(DownOutlined)"
              @click="toggleExpanded"
              data-testid="toggle-expand-button"
            />
          </a-tooltip>
          <a-tooltip title="保存结果">
            <a-button
              type="text"
              :icon="h(SaveOutlined)"
              @click="handleSave"
              :loading="saving"
              data-testid="save-button"
            />
          </a-tooltip>
          <a-tooltip title="复制内容">
            <a-button
              type="text"
              :icon="h(CopyOutlined)"
              @click="handleCopy"
              data-testid="copy-button"
            />
          </a-tooltip>
        </div>
      </template>

      <!-- 代理信息头部 -->
      <div class="agent-info">
        <a-avatar
          :size="40"
          :style="{ backgroundColor: getAgentColor(result.agentRole) }"
        >
          {{ getAgentInitials(result.agentName) }}
        </a-avatar>
        <div class="agent-details">
          <h4 class="agent-name">{{ result.agentName }}</h4>
          <p class="agent-role">{{ result.agentRole }}</p>
          <div class="processing-info">
            <a-tag color="blue" size="small">
              <ClockCircleOutlined />
              处理时间: {{ formatProcessingTime(result.processingTime) }}
            </a-tag>
            <a-tag color="green" size="small">
              <CalendarOutlined />
              {{ formatDateTime(result.createdAt) }}
            </a-tag>
          </div>
        </div>
      </div>

      <!-- 结果内容 -->
      <div class="result-content" :class="{ 'collapsed': !isExpanded }">
        <div class="content-preview" v-if="!isExpanded">
          <p class="preview-text">{{ contentPreview }}</p>
          <a-button type="link" @click="toggleExpanded" size="small">
            查看完整内容
          </a-button>
        </div>
        
        <div class="content-full" v-else>
          <div class="content-section">
            <h5>分析结果</h5>
            <div class="content-text" v-html="formattedContent"></div>
          </div>
          
          <!-- 如果有结构化数据，显示额外信息 -->
          <div v-if="structuredData" class="structured-data">
            <a-divider />
            <div v-if="structuredData.suggestions?.length" class="suggestions-section">
              <h5>建议要点</h5>
              <ul class="suggestions-list">
                <li v-for="(suggestion, index) in structuredData.suggestions" :key="index">
                  {{ suggestion }}
                </li>
              </ul>
            </div>
            
            <div v-if="structuredData.confidence" class="confidence-section">
              <h5>置信度</h5>
              <a-progress
                :percent="structuredData.confidence"
                :stroke-color="getConfidenceColor(structuredData.confidence)"
                size="small"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 操作区域 -->
      <div class="result-actions" v-if="isExpanded">
        <a-divider />
        <div class="action-buttons">
          <a-button type="primary" @click="handleSave" :loading="saving">
            <SaveOutlined />
            保存结果
          </a-button>
          <a-button @click="handleExport">
            <ExportOutlined />
            导出
          </a-button>
          <a-button @click="handleShare">
            <ShareAltOutlined />
            分享
          </a-button>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import { message } from 'ant-design-vue';
import {
  UpOutlined,
  DownOutlined,
  SaveOutlined,
  CopyOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ExportOutlined,
  ShareAltOutlined,
} from '@ant-design/icons-vue';
import type { AgentResult } from '@/types/agent';

interface Props {
  result: AgentResult;
  defaultExpanded?: boolean;
}

interface Emits {
  (e: 'save', result: AgentResult): void;
  (e: 'export', result: AgentResult): void;
  (e: 'share', result: AgentResult): void;
}

const props = withDefaults(defineProps<Props>(), {
  defaultExpanded: false,
});

const emit = defineEmits<Emits>();

// 响应式状态
const isExpanded = ref(props.defaultExpanded);
const saving = ref(false);

// 计算属性
const cardTitle = computed(() => `${props.result.agentName} - 分析结果`);

const contentPreview = computed(() => {
  const content = props.result.content;
  return content.length > 150 ? content.substring(0, 150) + '...' : content;
});

const formattedContent = computed(() => {
  // 将换行符转换为HTML换行
  return props.result.content.replace(/\n/g, '<br>');
});

// 尝试解析结构化数据
const structuredData = computed(() => {
  try {
    // 如果内容是JSON格式，尝试解析
    const parsed = JSON.parse(props.result.content);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
  } catch {
    // 不是JSON格式，返回null
  }
  return null;
});

// 方法
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

const handleSave = async () => {
  saving.value = true;
  try {
    emit('save', props.result);
    message.success('结果已保存');
  } catch (error) {
    message.error('保存失败');
  } finally {
    saving.value = false;
  }
};

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.result.content);
    message.success('内容已复制到剪贴板');
  } catch (error) {
    message.error('复制失败');
  }
};

const handleExport = () => {
  emit('export', props.result);
};

const handleShare = () => {
  emit('share', props.result);
};

const getAgentColor = (role: string): string => {
  // 根据角色生成颜色
  const colors = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
    '#13c2c2', '#eb2f96', '#fa541c', '#a0d911', '#2f54eb'
  ];
  const hash = role.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getAgentInitials = (name: string): string => {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
};

const formatProcessingTime = (timeMs: number): string => {
  if (timeMs < 1000) {
    return `${timeMs}ms`;
  } else if (timeMs < 60000) {
    return `${(timeMs / 1000).toFixed(1)}s`;
  } else {
    return `${(timeMs / 60000).toFixed(1)}min`;
  }
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 80) return '#52c41a';
  if (confidence >= 60) return '#faad14';
  return '#f5222d';
};
</script>

<style scoped lang="scss">
.agent-result-card {
  margin-bottom: 16px;

  .result-card {
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    &.expanded {
      .ant-card-body {
        padding-bottom: 24px;
      }
    }
  }

  .card-actions {
    display: flex;
    gap: 4px;
  }

  .agent-info {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;

    .agent-details {
      flex: 1;

      .agent-name {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
        color: #262626;
      }

      .agent-role {
        margin: 0 0 8px 0;
        color: #8c8c8c;
        font-size: 14px;
      }

      .processing-info {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        .ant-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          margin: 0;
        }
      }
    }
  }

  .result-content {
    .content-preview {
      .preview-text {
        margin-bottom: 8px;
        color: #595959;
        line-height: 1.6;
      }
    }

    .content-full {
      .content-section {
        h5 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #262626;
        }

        .content-text {
          line-height: 1.6;
          color: #595959;
          white-space: pre-wrap;
          word-break: break-word;
        }
      }

      .structured-data {
        margin-top: 16px;

        .suggestions-section,
        .confidence-section {
          margin-bottom: 16px;

          h5 {
            margin: 0 0 8px 0;
            font-size: 14px;
            font-weight: 600;
            color: #262626;
          }

          .suggestions-list {
            margin: 0;
            padding-left: 20px;

            li {
              margin-bottom: 4px;
              color: #595959;
              line-height: 1.5;
            }
          }
        }
      }
    }

    &.collapsed {
      .content-full {
        display: none;
      }
    }
  }

  .result-actions {
    .action-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .agent-result-card {
    .agent-info {
      flex-direction: column;
      gap: 8px;

      .agent-details {
        .processing-info {
          .ant-tag {
            font-size: 12px;
          }
        }
      }
    }

    .result-actions {
      .action-buttons {
        flex-direction: column;

        .ant-btn {
          width: 100%;
        }
      }
    }
  }
}
</style>