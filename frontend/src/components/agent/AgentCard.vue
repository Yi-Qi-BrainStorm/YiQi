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
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: #1890ff;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
    transform: translateY(-2px);
  }

  &--selected {
    border-color: #1890ff;
    background: #f6ffed;
  }

  &--inactive {
    opacity: 0.7;
    
    .agent-card__name,
    .agent-card__role {
      color: #999;
    }
  }

  &__checkbox {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 1;
  }

  &__status {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 1;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 24px 0 16px;
  }

  &__avatar {
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 600;
    color: #262626;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__role {
    margin: 0;
    font-size: 14px;
    color: #8c8c8c;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__model {
    margin-bottom: 12px;
  }

  &__prompt {
    margin-bottom: 16px;
    
    &-text {
      margin: 0;
      font-size: 13px;
      color: #595959;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 16px;
    
    &-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #8c8c8c;
      
      .anticon {
        font-size: 12px;
      }
    }
  }

  &__actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__runtime-status {
    position: absolute;
    bottom: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 4px;
    font-size: 12px;
    
    .status-completed {
      color: #52c41a;
    }
    
    .status-error {
      color: #ff4d4f;
    }
    
    .status-text {
      color: #595959;
    }
  }
}

:deep(.danger-item) {
  color: #ff4d4f !important;
  
  &:hover {
    background-color: #fff2f0 !important;
  }
}
</style>