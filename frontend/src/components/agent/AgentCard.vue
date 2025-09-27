<template>
  <div 
    class="agent-card"
    :class="{
      'agent-card--selected': selected,
      'agent-card--inactive': agent.status === 'INACTIVE'
    }"
  >
    <!-- 选择框 -->
    <div class="agent-card__checkbox">
      <a-checkbox
        :checked="selected"
        @change="handleSelect"
      />
    </div>

    <!-- 状态指示器 -->
    <div class="agent-card__status">
      <a-badge
        :status="getStatusBadgeType(agent.status)"
        :text="getStatusText(agent.status)"
      />
    </div>

    <!-- 代理信息 -->
    <div class="agent-card__header">
      <div class="agent-card__avatar">
        <a-avatar
          :size="48"
          :style="{ backgroundColor: getAvatarColor(agent.roleType) }"
        >
          {{ agent.name.charAt(0).toUpperCase() }}
        </a-avatar>
      </div>
      
      <div class="agent-card__info">
        <h3 class="agent-card__name" :title="agent.name">
          {{ agent.name }}
        </h3>
        <p class="agent-card__role" :title="agent.roleType">
          {{ agent.roleType }}
        </p>
      </div>
    </div>

    <!-- AI模型信息 -->
    <div class="agent-card__model">
      <a-tag :color="getModelColor(agent.aiModel)">
        {{ getModelDisplayName(agent.aiModel) }}
      </a-tag>
    </div>

    <!-- 系统提示词预览 -->
    <div class="agent-card__prompt">
      <p class="agent-card__prompt-text" :title="agent.systemPrompt">
        {{ truncateText(agent.systemPrompt, 100) }}
      </p>
    </div>

    <!-- 元数据 -->
    <div class="agent-card__meta">
      <div class="agent-card__meta-item">
        <CalendarOutlined />
        <span>{{ formatDate(agent.createdAt) }}</span>
      </div>
      <div class="agent-card__meta-item">
        <ClockCircleOutlined />
        <span>{{ formatDate(agent.updatedAt) }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="agent-card__actions">
      <a-button-group size="small">
        <a-button
          @click="handleEdit"
          :icon="h(EditOutlined)"
          title="编辑"
        />
        <a-button
          @click="handleTest"
          :icon="h(ExperimentOutlined)"
          title="测试"
        />
        <a-button
          @click="handleDuplicate"
          :icon="h(CopyOutlined)"
          title="复制"
        />
        <a-button
          @click="handleToggleStatus"
          :icon="h(agent.status === 'ACTIVE' ? StopOutlined : PlayCircleOutlined)"
          :title="agent.status === 'ACTIVE' ? '停用' : '激活'"
        />
      </a-button-group>
      
      <a-dropdown placement="bottomRight">
        <a-button size="small" :icon="h(MoreOutlined)" />
        <template #overlay>
          <a-menu @click="handleMenuAction">
            <a-menu-item key="view-details">
              <EyeOutlined />
              查看详情
            </a-menu-item>
            <a-menu-item key="export">
              <ExportOutlined />
              导出配置
            </a-menu-item>
            <a-menu-item key="versions">
              <HistoryOutlined />
              版本历史
            </a-menu-item>
            <a-menu-divider />
            <a-menu-item key="delete" class="danger-item">
              <DeleteOutlined />
              删除代理
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>

    <!-- 运行时状态指示器（用于头脑风暴会话中） -->
    <div v-if="runtimeStatus" class="agent-card__runtime-status">
      <a-spin v-if="runtimeStatus === 'thinking'" size="small" />
      <CheckCircleOutlined v-else-if="runtimeStatus === 'completed'" class="status-completed" />
      <ExclamationCircleOutlined v-else-if="runtimeStatus === 'error'" class="status-error" />
      <span class="status-text">{{ getRuntimeStatusText(runtimeStatus) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  ExperimentOutlined,
  MoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ExportOutlined,
  HistoryOutlined,
  StopOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons-vue';
import type { Agent, AgentStatus, AgentRuntimeStatus, AIModelType } from '@/types/agent';

interface Props {
  agent: Agent;
  selected?: boolean;
  runtimeStatus?: AgentRuntimeStatus;
}

interface Emits {
  (e: 'select', agentId: number, selected: boolean): void;
  (e: 'edit', agent: Agent): void;
  (e: 'delete', agentId: number): void;
  (e: 'duplicate', agent: Agent): void;
  (e: 'test', agent: Agent): void;
  (e: 'toggle-status', agent: Agent): void;
  (e: 'view-details', agent: Agent): void;
  (e: 'export', agent: Agent): void;
  (e: 'view-versions', agent: Agent): void;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
});

const emit = defineEmits<Emits>();

// 事件处理
const handleSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit('select', props.agent.id, target.checked);
};

const handleEdit = () => {
  emit('edit', props.agent);
};

const handleDelete = () => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除代理 "${props.agent.name}" 吗？此操作不可恢复。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      emit('delete', props.agent.id);
    },
  });
};

const handleDuplicate = () => {
  emit('duplicate', props.agent);
};

const handleTest = () => {
  emit('test', props.agent);
};

const handleToggleStatus = () => {
  emit('toggle-status', props.agent);
};

const handleMenuAction = ({ key }: { key: string }) => {
  switch (key) {
    case 'view-details':
      emit('view-details', props.agent);
      break;
    case 'export':
      emit('export', props.agent);
      break;
    case 'versions':
      emit('view-versions', props.agent);
      break;
    case 'delete':
      handleDelete();
      break;
  }
};

// 工具函数
const getStatusBadgeType = (status: AgentStatus) => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'INACTIVE':
      return 'default';
    case 'DELETED':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusText = (status: AgentStatus) => {
  switch (status) {
    case 'ACTIVE':
      return '活跃';
    case 'INACTIVE':
      return '非活跃';
    case 'DELETED':
      return '已删除';
    default:
      return '未知';
  }
};

const getRuntimeStatusText = (status: AgentRuntimeStatus) => {
  switch (status) {
    case 'idle':
      return '待命中';
    case 'thinking':
      return '思考中';
    case 'completed':
      return '已完成';
    case 'error':
      return '出错';
    default:
      return '';
  }
};

const getAvatarColor = (roleType: string) => {
  // 根据角色类型生成颜色
  const colors = [
    '#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#87d068',
    '#108ee9', '#f50', '#2db7f5', '#52c41a', '#eb2f96'
  ];
  const hash = roleType.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
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

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return '今天';
  } else if (diffDays <= 7) {
    return `${diffDays}天前`;
  } else if (diffDays <= 30) {
    return `${Math.ceil(diffDays / 7)}周前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
};
</script>

<style scoped lang="scss">
.agent-card {
  position: relative;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
  transition: all var(--transition-base);
  cursor: pointer;
  overflow: hidden;

  // Hover effects with enhanced animation
  &:hover {
    border-color: var(--color-primary-500);
    box-shadow: var(--shadow-lg);
    transform: translateY(-4px) scale(1.02);
    
    .agent-card__avatar {
      transform: scale(1.1);
    }
    
    .agent-card__actions {
      opacity: 1;
      transform: translateY(0);
    }
  }

  // Selected state
  &--selected {
    border-color: var(--color-primary-500);
    background-color: var(--color-primary-50);
    box-shadow: var(--shadow-md);
    
    [data-theme="dark"] & {
      background-color: var(--color-primary-900);
      border-color: var(--color-primary-400);
    }
  }

  // Inactive state
  &--inactive {
    opacity: 0.6;
    filter: grayscale(0.3);
    
    .agent-card__name,
    .agent-card__role {
      color: var(--color-text-tertiary);
    }
    
    &:hover {
      opacity: 0.8;
      filter: grayscale(0.1);
    }
  }

  // Checkbox positioning
  &__checkbox {
    position: absolute;
    top: var(--spacing-4);
    left: var(--spacing-4);
    z-index: 2;
    
    :deep(.ant-checkbox-wrapper) {
      .ant-checkbox {
        border-radius: var(--radius-base);
        
        &:hover .ant-checkbox-inner {
          border-color: var(--color-primary-500);
        }
        
        &.ant-checkbox-checked .ant-checkbox-inner {
          background-color: var(--color-primary-600);
          border-color: var(--color-primary-600);
        }
      }
    }
  }

  // Status badge
  &__status {
    position: absolute;
    top: var(--spacing-4);
    right: var(--spacing-4);
    z-index: 2;
    
    :deep(.ant-badge) {
      .ant-badge-status-dot {
        width: 8px;
        height: 8px;
      }
      
      .ant-badge-status-text {
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
        margin-left: var(--spacing-2);
      }
    }
  }

  // Header section
  &__header {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    margin: var(--spacing-8) 0 var(--spacing-5);
    
    @include mobile-only {
      margin: var(--spacing-6) 0 var(--spacing-4);
    }
  }

  &__avatar {
    flex-shrink: 0;
    transition: transform var(--transition-base);
    
    :deep(.ant-avatar) {
      border: 2px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      font-weight: var(--font-weight-semibold);
      
      @include mobile-only {
        width: 40px !important;
        height: 40px !important;
        font-size: var(--font-size-lg);
      }
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    margin: 0 0 var(--spacing-1);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: var(--line-height-tight);
    @include truncate;
    
    @include mobile-only {
      font-size: var(--font-size-base);
    }
  }

  &__role {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-medium);
    @include truncate;
    
    @include mobile-only {
      font-size: var(--font-size-xs);
    }
  }

  // Model tag
  &__model {
    margin-bottom: var(--spacing-4);
    
    :deep(.ant-tag) {
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      padding: var(--spacing-1) var(--spacing-3);
      border: none;
      
      @include mobile-only {
        font-size: 10px;
        padding: 2px var(--spacing-2);
      }
    }
  }

  // Prompt preview
  &__prompt {
    margin-bottom: var(--spacing-5);
    
    &-text {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      line-height: var(--line-height-relaxed);
      @include line-clamp-3;
      
      @include mobile-only {
        font-size: var(--font-size-xs);
        @include line-clamp-2;
      }
    }
  }

  // Metadata
  &__meta {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    margin-bottom: var(--spacing-5);
    
    @include mobile-only {
      gap: var(--spacing-1);
      margin-bottom: var(--spacing-4);
    }
    
    &-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);
      
      .anticon {
        font-size: var(--font-size-xs);
        color: var(--color-text-tertiary);
      }
      
      @include mobile-only {
        font-size: 10px;
        gap: var(--spacing-1);
      }
    }
  }

  // Actions
  &__actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    opacity: 0.7;
    transform: translateY(4px);
    transition: all var(--transition-base);
    
    @include mobile-only {
      opacity: 1;
      transform: translateY(0);
    }
    
    :deep(.ant-btn-group) {
      .ant-btn {
        border-radius: var(--radius-md);
        border-color: var(--color-border);
        color: var(--color-text-secondary);
        transition: all var(--transition-fast);
        
        &:hover {
          color: var(--color-primary-600);
          border-color: var(--color-primary-500);
          transform: translateY(-1px);
        }
        
        &:first-child {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
        }
        
        &:last-child {
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }
        
        &:not(:first-child):not(:last-child) {
          border-radius: 0;
        }
        
        @include mobile-only {
          padding: var(--spacing-1) var(--spacing-2);
          
          .anticon {
            font-size: var(--font-size-xs);
          }
        }
      }
    }
    
    :deep(.ant-dropdown-trigger) {
      border-radius: var(--radius-md);
      border-color: var(--color-border);
      color: var(--color-text-secondary);
      transition: all var(--transition-fast);
      
      &:hover {
        color: var(--color-primary-600);
        border-color: var(--color-primary-500);
        transform: translateY(-1px);
      }
    }
  }

  // Runtime status indicator
  &__runtime-status {
    position: absolute;
    bottom: var(--spacing-4);
    right: var(--spacing-4);
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(8px);
    
    .status-completed {
      color: var(--color-success-600);
    }
    
    .status-error {
      color: var(--color-error-600);
    }
    
    .status-text {
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-medium);
    }
    
    :deep(.ant-spin) {
      .ant-spin-dot-item {
        background-color: var(--color-primary-500);
      }
    }
  }
}

// Dropdown menu styling
:deep(.ant-dropdown) {
  .ant-dropdown-menu {
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--color-border);
    background-color: var(--color-surface);
    padding: var(--spacing-2);
    min-width: 160px;

    .ant-dropdown-menu-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
      padding: var(--spacing-3) var(--spacing-4);
      border-radius: var(--radius-md);
      color: var(--color-text-primary);
      font-size: var(--font-size-sm);
      transition: all var(--transition-fast);

      &:hover {
        background-color: var(--color-surface-hover);
        color: var(--color-primary-600);
        transform: translateX(2px);
      }

      .anticon {
        font-size: var(--font-size-base);
        color: var(--color-text-secondary);
        transition: color var(--transition-fast);
      }

      &:hover .anticon {
        color: var(--color-primary-600);
      }
      
      &.danger-item {
        color: var(--color-error-600) !important;
        
        &:hover {
          background-color: var(--color-error-50) !important;
          color: var(--color-error-700) !important;
        }
        
        .anticon {
          color: var(--color-error-600) !important;
        }
      }
    }

    .ant-dropdown-menu-item-divider {
      background-color: var(--color-border);
      margin: var(--spacing-2) 0;
    }
  }
}

// Loading animation
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: var(--shadow-sm);
  }
  50% {
    box-shadow: var(--shadow-lg), 0 0 20px rgba(59, 130, 246, 0.3);
  }
}

.agent-card--thinking {
  animation: pulse-glow 2s infinite;
}

// Responsive enhancements
@include mobile-only {
  .agent-card {
    padding: var(--spacing-4);
    border-radius: var(--radius-lg);
    
    &:hover {
      transform: translateY(-2px) scale(1.01);
    }
  }
}

@include tablet-up {
  .agent-card {
    &:hover {
      transform: translateY(-6px) scale(1.03);
    }
  }
}
</style>