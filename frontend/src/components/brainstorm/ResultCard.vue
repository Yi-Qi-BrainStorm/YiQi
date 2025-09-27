<template>
  <a-card 
    class="result-card"
    :hoverable="true"
    @click="$emit('view', result)"
  >
    <template #title>
      <div class="result-card__title">
        <span class="topic">{{ result.topic }}</span>
        <a-tag 
          :color="getStatusColor(result.status)"
          class="status-tag"
        >
          {{ getStatusText(result.status) }}
        </a-tag>
      </div>
    </template>

    <template #extra>
      <a-dropdown @click.stop>
        <a-button type="text" size="small">
          <MoreOutlined />
        </a-button>
        <template #overlay>
          <a-menu @click="handleMenuClick">
            <a-menu-item key="export">
              <ExportOutlined />
              导出结果
            </a-menu-item>
            <a-menu-item key="duplicate">
              <CopyOutlined />
              复制会话
            </a-menu-item>
            <a-menu-divider />
            <a-menu-item key="delete" class="danger-item">
              <DeleteOutlined />
              删除结果
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </template>

    <div class="result-card__content">
      <!-- 会话信息 -->
      <div class="session-info">
        <div class="info-item">
          <span class="label">参与代理:</span>
          <span class="value">{{ result.agentResults.length }} 个</span>
        </div>
        <div class="info-item">
          <span class="label">创建时间:</span>
          <span class="value">{{ formatDate(result.createdAt) }}</span>
        </div>
        <div class="info-item">
          <span class="label">完成阶段:</span>
          <span class="value">{{ result.completedStages }}/3</span>
        </div>
      </div>

      <!-- 结果摘要 -->
      <div class="result-summary">
        <p class="summary-text">
          {{ result.summary || '暂无摘要' }}
        </p>
      </div>

      <!-- 代理结果预览 -->
      <div class="agent-results-preview">
        <div class="preview-title">代理结果预览</div>
        <div class="agent-chips">
          <a-tag
            v-for="agentResult in result.agentResults.slice(0, 3)"
            :key="agentResult.agentId"
            class="agent-chip"
          >
            {{ agentResult.agentName }}
          </a-tag>
          <a-tag v-if="result.agentResults.length > 3" class="more-chip">
            +{{ result.agentResults.length - 3 }}
          </a-tag>
        </div>
      </div>

      <!-- 进度指示器 -->
      <div class="progress-section">
        <div class="progress-label">完成进度</div>
        <a-progress 
          :percent="(result.completedStages / 3) * 100" 
          :show-info="false"
          size="small"
        />
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { 
  MoreOutlined, 
  ExportOutlined, 
  CopyOutlined, 
  DeleteOutlined 
} from '@ant-design/icons-vue';
import type { BrainstormResult, BrainstormStatus } from '@/types/brainstorm';

interface Props {
  result: BrainstormResult;
}

interface Emits {
  (e: 'view', result: BrainstormResult): void;
  (e: 'export', result: BrainstormResult): void;
  (e: 'duplicate', result: BrainstormResult): void;
  (e: 'delete', resultId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 状态颜色映射
const getStatusColor = (status: BrainstormStatus): string => {
  const colorMap: Record<BrainstormStatus, string> = {
    completed: 'success',
    in_progress: 'processing',
    paused: 'warning',
    cancelled: 'error'
  };
  return colorMap[status] || 'default';
};

// 状态文本映射
const getStatusText = (status: BrainstormStatus): string => {
  const textMap: Record<BrainstormStatus, string> = {
    completed: '已完成',
    in_progress: '进行中',
    paused: '已暂停',
    cancelled: '已取消'
  };
  return textMap[status] || status;
};

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 菜单点击处理
const handleMenuClick = ({ key }: { key: string }) => {
  switch (key) {
    case 'export':
      emit('export', props.result);
      break;
    case 'duplicate':
      emit('duplicate', props.result);
      break;
    case 'delete':
      emit('delete', props.result.id);
      break;
  }
};
</script>

<style scoped lang="scss">
.result-card {
  height: 100%;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .result-card__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    .topic {
      font-weight: 600;
      color: #1890ff;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: 8px;
    }

    .status-tag {
      flex-shrink: 0;
    }
  }

  .result-card__content {
    .session-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 16px;

      .info-item {
        display: flex;
        align-items: center;
        font-size: 12px;

        .label {
          color: #666;
          margin-right: 4px;
        }

        .value {
          color: #333;
          font-weight: 500;
        }
      }
    }

    .result-summary {
      margin-bottom: 16px;

      .summary-text {
        color: #666;
        font-size: 13px;
        line-height: 1.4;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    .agent-results-preview {
      margin-bottom: 16px;

      .preview-title {
        font-size: 12px;
        color: #666;
        margin-bottom: 8px;
      }

      .agent-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;

        .agent-chip {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .more-chip {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          background: #f0f0f0;
          color: #666;
        }
      }
    }

    .progress-section {
      .progress-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
      }
    }
  }

  :deep(.ant-card-head) {
    padding: 12px 16px;
    min-height: auto;
  }

  :deep(.ant-card-body) {
    padding: 16px;
  }

  :deep(.ant-card-head-title) {
    padding: 0;
    width: 100%;
  }

  :deep(.ant-dropdown-trigger) {
    padding: 4px;
  }
}

.danger-item {
  color: #ff4d4f !important;

  &:hover {
    background-color: #fff2f0 !important;
  }
}

@media (max-width: 768px) {
  .result-card {
    .session-info {
      grid-template-columns: 1fr;
      gap: 4px;
    }
  }
}
</style>