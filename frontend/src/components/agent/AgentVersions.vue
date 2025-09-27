<template>
  <div class="agent-versions">
    <!-- 版本列表 -->
    <div class="versions-content">
      <a-spin :spinning="loading">
        <div v-if="versions.length === 0 && !loading" class="no-versions">
          <a-empty description="暂无版本历史" />
        </div>
        
        <div v-else class="versions-list">
          <div
            v-for="version in versions"
            :key="version.id"
            class="version-item"
            :class="{ 'version-item--current': isCurrentVersion(version) }"
          >
            <!-- 版本头部 -->
            <div class="version-header">
              <div class="version-info">
                <div class="version-number">
                  v{{ version.versionNumber }}
                  <a-tag v-if="isCurrentVersion(version)" color="green" size="small">
                    当前版本
                  </a-tag>
                </div>
                <div class="version-date">
                  {{ formatDateTime(version.createdAt) }}
                </div>
              </div>
              
              <div class="version-actions">
                <a-button
                  size="small"
                  @click="viewDiff(version)"
                  :disabled="isCurrentVersion(version)"
                >
                  <DiffOutlined />
                  对比差异
                </a-button>
                
                <a-button
                  size="small"
                  type="primary"
                  @click="handleRestore(version)"
                  :disabled="isCurrentVersion(version)"
                  :loading="restoring === version.id"
                >
                  <HistoryOutlined />
                  恢复此版本
                </a-button>
              </div>
            </div>
            
            <!-- 版本详情 -->
            <div class="version-details">
              <div class="detail-grid">
                <div class="detail-item">
                  <label>名称:</label>
                  <span>{{ version.name }}</span>
                </div>
                
                <div class="detail-item">
                  <label>角色:</label>
                  <span>{{ version.roleType }}</span>
                </div>
                
                <div class="detail-item">
                  <label>模型:</label>
                  <a-tag :color="getModelColor(version.aiModel)">
                    {{ getModelDisplayName(version.aiModel) }}
                  </a-tag>
                </div>
              </div>
              
              <!-- 系统提示词预览 -->
              <div class="prompt-preview">
                <div class="prompt-header">
                  <span>系统提示词</span>
                  <a-button
                    type="link"
                    size="small"
                    @click="togglePromptExpand(version.id)"
                  >
                    {{ expandedPrompts.has(version.id) ? '收起' : '展开' }}
                  </a-button>
                </div>
                
                <div class="prompt-content">
                  <pre
                    class="prompt-text"
                    :class="{ 'prompt-text--expanded': expandedPrompts.has(version.id) }"
                  >{{ version.systemPrompt }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </a-spin>
    </div>

    <!-- 差异对比模态框 -->
    <a-modal
      v-model:open="diffModalVisible"
      title="版本差异对比"
      :width="1000"
      :footer="null"
      @cancel="diffModalVisible = false"
    >
      <div v-if="diffData" class="diff-content">
        <!-- 版本信息对比 -->
        <div class="diff-header">
          <div class="diff-version">
            <h4>当前版本 (v{{ getCurrentVersionNumber() }})</h4>
            <div class="version-meta">{{ formatDateTime(agent.updatedAt) }}</div>
          </div>
          <div class="diff-arrow">
            <ArrowRightOutlined />
          </div>
          <div class="diff-version">
            <h4>v{{ diffData.versionNumber }}</h4>
            <div class="version-meta">{{ formatDateTime(diffData.createdAt) }}</div>
          </div>
        </div>
        
        <!-- 字段差异 -->
        <div class="diff-fields">
          <div v-if="diffData.name !== agent.name" class="diff-field">
            <label>名称:</label>
            <div class="diff-values">
              <span class="current-value">{{ agent.name }}</span>
              <ArrowRightOutlined />
              <span class="target-value">{{ diffData.name }}</span>
            </div>
          </div>
          
          <div v-if="diffData.roleType !== agent.roleType" class="diff-field">
            <label>角色:</label>
            <div class="diff-values">
              <span class="current-value">{{ agent.roleType }}</span>
              <ArrowRightOutlined />
              <span class="target-value">{{ diffData.roleType }}</span>
            </div>
          </div>
          
          <div v-if="diffData.aiModel !== agent.aiModel" class="diff-field">
            <label>AI模型:</label>
            <div class="diff-values">
              <a-tag :color="getModelColor(agent.aiModel)">
                {{ getModelDisplayName(agent.aiModel) }}
              </a-tag>
              <ArrowRightOutlined />
              <a-tag :color="getModelColor(diffData.aiModel)">
                {{ getModelDisplayName(diffData.aiModel) }}
              </a-tag>
            </div>
          </div>
          
          <div v-if="diffData.systemPrompt !== agent.systemPrompt" class="diff-field">
            <label>系统提示词:</label>
            <div class="diff-prompts">
              <div class="prompt-diff">
                <div class="prompt-section">
                  <h5>当前版本</h5>
                  <pre class="prompt-text current">{{ agent.systemPrompt }}</pre>
                </div>
                <div class="prompt-section">
                  <h5>目标版本</h5>
                  <pre class="prompt-text target">{{ diffData.systemPrompt }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 底部操作 -->
    <div class="versions-footer">
      <a-button @click="handleClose">
        关闭
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  DiffOutlined,
  HistoryOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons-vue';
import { agentService } from '@/services/agentService';
import type { Agent, AgentVersion, AIModelType } from '@/types/agent';

interface Props {
  agent: Agent;
}

interface Emits {
  (e: 'restore', agent: Agent, versionId: number): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 状态
const loading = ref(false);
const restoring = ref<number | null>(null);
const versions = ref<AgentVersion[]>([]);
const expandedPrompts = ref(new Set<number>());

// 差异对比
const diffModalVisible = ref(false);
const diffData = ref<AgentVersion | null>(null);

// 事件处理
const handleRestore = (version: AgentVersion) => {
  Modal.confirm({
    title: '确认恢复版本',
    content: `确定要恢复到版本 v${version.versionNumber} 吗？当前的修改将会被覆盖。`,
    okText: '恢复',
    okType: 'primary',
    cancelText: '取消',
    onOk: async () => {
      restoring.value = version.id;
      try {
        emit('restore', props.agent, version.id);
      } finally {
        restoring.value = null;
      }
    },
  });
};

const handleClose = () => {
  emit('close');
};

const viewDiff = (version: AgentVersion) => {
  diffData.value = version;
  diffModalVisible.value = true;
};

const togglePromptExpand = (versionId: number) => {
  if (expandedPrompts.value.has(versionId)) {
    expandedPrompts.value.delete(versionId);
  } else {
    expandedPrompts.value.add(versionId);
  }
};

// 工具函数
const isCurrentVersion = (version: AgentVersion) => {
  return version.versionNumber === getCurrentVersionNumber();
};

const getCurrentVersionNumber = () => {
  if (versions.value.length === 0) return 1;
  return Math.max(...versions.value.map(v => v.versionNumber));
};

const getModelColor = (model: AIModelType) => {
  const colorMap: Record<AIModelType, string> = {
    'qwen-plus': 'blue',
    'qwen-turbo': 'cyan',
    'qwen-max': 'purple',
    'gpt-4': 'green',
    'gpt-3.5-turbo': 'orange',
    'claude-3': 'red',
    'gemini-pro': 'magenta',
  };
  return colorMap[model] || 'default';
};

const getModelDisplayName = (model: AIModelType) => {
  const nameMap: Record<AIModelType, string> = {
    'qwen-plus': 'Qwen Plus',
    'qwen-turbo': 'Qwen Turbo',
    'qwen-max': 'Qwen Max',
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5',
    'claude-3': 'Claude 3',
    'gemini-pro': 'Gemini Pro',
  };
  return nameMap[model] || model;
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN');
};

// 加载版本历史
const loadVersions = async () => {
  loading.value = true;
  try {
    versions.value = await agentService.getAgentVersions(props.agent.id);
    // 按版本号降序排列
    versions.value.sort((a, b) => b.versionNumber - a.versionNumber);
  } catch (error: any) {
    message.error(error.message || '获取版本历史失败');
  } finally {
    loading.value = false;
  }
};

// 初始化
onMounted(() => {
  loadVersions();
});
</script>

<style scoped lang="scss">
.agent-versions {
  .versions-content {
    margin-bottom: 24px;
    max-height: 500px;
    overflow-y: auto;
  }

  .versions-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }
}

.no-versions {
  padding: 48px 0;
  text-align: center;
}

.versions-list {
  .version-item {
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    margin-bottom: 16px;
    overflow: hidden;
    transition: all 0.3s ease;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      border-color: #d9d9d9;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &--current {
      border-color: #1890ff;
      background: #f6ffed;
    }
  }

  .version-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
  }

  .version-info {
    .version-number {
      font-size: 16px;
      font-weight: 600;
      color: #262626;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .version-date {
      font-size: 13px;
      color: #8c8c8c;
    }
  }

  .version-actions {
    display: flex;
    gap: 8px;
  }

  .version-details {
    padding: 16px;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .detail-item {
    label {
      display: block;
      font-size: 13px;
      color: #8c8c8c;
      margin-bottom: 4px;
    }

    span {
      font-size: 14px;
      color: #262626;
    }
  }

  .prompt-preview {
    .prompt-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      span {
        font-size: 14px;
        font-weight: 600;
        color: #595959;
      }
    }

    .prompt-content {
      border: 1px solid #e8e8e8;
      border-radius: 4px;
      overflow: hidden;
    }

    .prompt-text {
      margin: 0;
      padding: 12px;
      background: #fafafa;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      line-height: 1.5;
      color: #595959;
      white-space: pre-wrap;
      word-wrap: break-word;
      max-height: 100px;
      overflow: hidden;
      transition: max-height 0.3s ease;

      &--expanded {
        max-height: none;
      }
    }
  }
}

.diff-content {
  .diff-header {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 24px;
    padding: 16px;
    background: #fafafa;
    border-radius: 6px;

    .diff-version {
      flex: 1;
      text-align: center;

      h4 {
        margin: 0 0 4px;
        font-size: 16px;
        color: #262626;
      }

      .version-meta {
        font-size: 13px;
        color: #8c8c8c;
      }
    }

    .diff-arrow {
      color: #1890ff;
      font-size: 16px;
    }
  }

  .diff-fields {
    .diff-field {
      margin-bottom: 24px;
      padding: 16px;
      border: 1px solid #f0f0f0;
      border-radius: 6px;

      &:last-child {
        margin-bottom: 0;
      }

      label {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: #262626;
        margin-bottom: 12px;
      }
    }

    .diff-values {
      display: flex;
      align-items: center;
      gap: 12px;

      .current-value,
      .target-value {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 14px;
      }

      .current-value {
        background: #fff2f0;
        color: #a8071a;
      }

      .target-value {
        background: #f6ffed;
        color: #389e0d;
      }
    }

    .diff-prompts {
      .prompt-diff {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .prompt-section {
        h5 {
          margin: 0 0 8px;
          font-size: 13px;
          color: #8c8c8c;
        }

        .prompt-text {
          margin: 0;
          padding: 12px;
          border: 1px solid #e8e8e8;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-wrap: break-word;
          max-height: 200px;
          overflow-y: auto;

          &.current {
            background: #fff2f0;
            border-color: #ffccc7;
          }

          &.target {
            background: #f6ffed;
            border-color: #b7eb8f;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .version-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .version-actions {
    align-self: stretch;
    justify-content: space-between;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .diff-header {
    flex-direction: column;
    gap: 12px;

    .diff-arrow {
      transform: rotate(90deg);
    }
  }

  .diff-prompts .prompt-diff {
    grid-template-columns: 1fr;
  }
}
</style>