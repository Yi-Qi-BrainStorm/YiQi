<template>
  <div class="stage-progress-indicator">
    <a-card :bordered="false" class="progress-card">
      <template #title>
        <div class="progress-header">
          <span class="progress-title">头脑风暴进度</span>
          <a-tag 
            :color="getSessionStatusColor(sessionStatus)"
            class="session-status-tag"
          >
            {{ getSessionStatusText(sessionStatus) }}
          </a-tag>
        </div>
      </template>

      <!-- 进度条 -->
      <div class="progress-bar-container">
        <a-progress
          :percent="overallProgress"
          :status="progressStatus"
          :stroke-color="progressColor"
          :trail-color="'#f0f0f0'"
          :stroke-width="8"
          class="overall-progress"
        />
        <div class="progress-text">
          总体进度: {{ currentStage }}/{{ totalStages }} 阶段完成
        </div>
      </div>

      <!-- 阶段步骤 -->
      <div class="stages-container">
        <a-steps
          :current="currentStage - 1"
          :status="stepsStatus"
          direction="horizontal"
          size="small"
          class="stage-steps"
        >
          <a-step
            v-for="(stage, index) in stageNames"
            :key="index"
            :title="stage"
            :description="getStageDescription(index + 1)"
            :status="getStageStatus(index + 1)"
          >
            <template #icon>
              <div class="stage-icon">
                <component 
                  :is="getStageIcon(index + 1)" 
                  :class="getStageIconClass(index + 1)"
                />
              </div>
            </template>
          </a-step>
        </a-steps>
      </div>

      <!-- 当前阶段详情 -->
      <div class="current-stage-details" v-if="currentStageInfo">
        <a-divider orientation="left">
          <span class="current-stage-title">
            当前阶段: {{ currentStageInfo.name }}
          </span>
        </a-divider>
        
        <div class="stage-info-grid">
          <div class="stage-info-item">
            <div class="info-label">阶段描述</div>
            <div class="info-value">{{ currentStageInfo.description }}</div>
          </div>
          
          <div class="stage-info-item" v-if="currentStageInfo.duration">
            <div class="info-label">预计用时</div>
            <div class="info-value">{{ formatDuration(currentStageInfo.duration) }}</div>
          </div>
          
          <div class="stage-info-item" v-if="stageStartTime">
            <div class="info-label">开始时间</div>
            <div class="info-value">{{ formatTime(stageStartTime) }}</div>
          </div>
          
          <div class="stage-info-item" v-if="estimatedEndTime">
            <div class="info-label">预计完成</div>
            <div class="info-value">{{ formatTime(estimatedEndTime) }}</div>
          </div>
        </div>

        <!-- 阶段进度条 -->
        <div class="stage-progress" v-if="stageProgress !== null">
          <div class="stage-progress-header">
            <span>阶段进度</span>
            <span class="progress-percentage">{{ Math.round(stageProgress) }}%</span>
          </div>
          <a-progress
            :percent="stageProgress"
            :status="stageProgressStatus"
            :stroke-color="stageProgressColor"
            :show-info="false"
            size="small"
          />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="stage-actions" v-if="showActions">
        <a-space>
          <a-button
            v-if="canProceedToNext"
            type="primary"
            :loading="proceeding"
            @click="handleProceedToNext"
          >
            进入下一阶段
          </a-button>
          
          <a-button
            v-if="canRestartStage"
            :loading="restarting"
            @click="handleRestartStage"
          >
            重新开始当前阶段
          </a-button>
          
          <a-button
            v-if="canPauseSession"
            :loading="pausing"
            @click="handlePauseSession"
          >
            暂停会话
          </a-button>
          
          <a-button
            v-if="canResumeSession"
            type="primary"
            :loading="resuming"
            @click="handleResumeSession"
          >
            恢复会话
          </a-button>
        </a-space>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { 
  BulbOutlined, 
  ToolOutlined, 
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons-vue';
import type { SessionStatus, PhaseType } from '@/types/brainstorm';
import { BRAINSTORM_STAGES } from '@/constants/brainstorm';

interface Props {
  currentStage: number;
  totalStages: number;
  stageNames: string[];
  completedStages: boolean[];
  sessionStatus: SessionStatus;
  stageProgress?: number | null;
  stageStartTime?: string | null;
  showActions?: boolean;
  canProceedToNext?: boolean;
  canRestartStage?: boolean;
  canPauseSession?: boolean;
  canResumeSession?: boolean;
}

interface Emits {
  (e: 'proceed-to-next'): void;
  (e: 'restart-stage'): void;
  (e: 'pause-session'): void;
  (e: 'resume-session'): void;
}

const props = withDefaults(defineProps<Props>(), {
  currentStage: 1,
  totalStages: 3,
  stageNames: () => ['创意生成阶段', '技术可行性分析', '问题讨论与优化'],
  completedStages: () => [false, false, false],
  sessionStatus: 'CREATED',
  stageProgress: null,
  stageStartTime: null,
  showActions: true,
  canProceedToNext: false,
  canRestartStage: false,
  canPauseSession: false,
  canResumeSession: false,
});

const emit = defineEmits<Emits>();

// 操作状态
const proceeding = ref(false);
const restarting = ref(false);
const pausing = ref(false);
const resuming = ref(false);

// 计算属性
const overallProgress = computed(() => {
  const completedCount = props.completedStages.filter(Boolean).length;
  return Math.round((completedCount / props.totalStages) * 100);
});

const progressStatus = computed(() => {
  if (props.sessionStatus === 'COMPLETED') return 'success';
  if (props.sessionStatus === 'CANCELLED') return 'exception';
  if (props.sessionStatus === 'PAUSED') return 'normal';
  return 'active';
});

const progressColor = computed(() => {
  switch (props.sessionStatus) {
    case 'COMPLETED': return '#52c41a';
    case 'CANCELLED': return '#ff4d4f';
    case 'PAUSED': return '#faad14';
    default: return '#1890ff';
  }
});

const stepsStatus = computed(() => {
  if (props.sessionStatus === 'CANCELLED') return 'error';
  if (props.sessionStatus === 'COMPLETED') return 'finish';
  return 'process';
});

const currentStageInfo = computed(() => {
  const stageConfig = BRAINSTORM_STAGES[props.currentStage as keyof typeof BRAINSTORM_STAGES];
  if (!stageConfig) return null;
  
  return {
    name: props.stageNames[props.currentStage - 1] || stageConfig.name,
    description: stageConfig.description,
    duration: stageConfig.duration,
  };
});

const estimatedEndTime = computed(() => {
  if (!props.stageStartTime || !currentStageInfo.value?.duration) return null;
  
  const startTime = new Date(props.stageStartTime);
  const endTime = new Date(startTime.getTime() + currentStageInfo.value.duration * 1000);
  return endTime.toISOString();
});

const stageProgressStatus = computed(() => {
  if (props.stageProgress === null) return 'normal';
  if (props.stageProgress >= 100) return 'success';
  if (props.stageProgress < 30) return 'normal';
  return 'active';
});

const stageProgressColor = computed(() => {
  if (props.stageProgress === null) return '#d9d9d9';
  if (props.stageProgress >= 100) return '#52c41a';
  if (props.stageProgress >= 70) return '#1890ff';
  if (props.stageProgress >= 30) return '#faad14';
  return '#ff4d4f';
});

// 方法
const getSessionStatusColor = (status: SessionStatus): string => {
  switch (status) {
    case 'CREATED': return 'blue';
    case 'IN_PROGRESS': return 'processing';
    case 'PAUSED': return 'warning';
    case 'COMPLETED': return 'success';
    case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

const getSessionStatusText = (status: SessionStatus): string => {
  switch (status) {
    case 'CREATED': return '已创建';
    case 'IN_PROGRESS': return '进行中';
    case 'PAUSED': return '已暂停';
    case 'COMPLETED': return '已完成';
    case 'CANCELLED': return '已取消';
    default: return '未知状态';
  }
};

const getStageDescription = (stageNumber: number): string => {
  const stageConfig = BRAINSTORM_STAGES[stageNumber as keyof typeof BRAINSTORM_STAGES];
  return stageConfig?.description || '';
};

const getStageStatus = (stageNumber: number) => {
  if (props.completedStages[stageNumber - 1]) return 'finish';
  if (stageNumber === props.currentStage) {
    if (props.sessionStatus === 'CANCELLED') return 'error';
    return 'process';
  }
  return 'wait';
};

const getStageIcon = (stageNumber: number) => {
  if (props.completedStages[stageNumber - 1]) return CheckCircleOutlined;
  
  switch (stageNumber) {
    case 1: return BulbOutlined;
    case 2: return ToolOutlined;
    case 3: return ExclamationCircleOutlined;
    default: return ClockCircleOutlined;
  }
};

const getStageIconClass = (stageNumber: number): string => {
  if (props.completedStages[stageNumber - 1]) return 'stage-icon-completed';
  if (stageNumber === props.currentStage) return 'stage-icon-current';
  return 'stage-icon-waiting';
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`;
  }
  return `${remainingSeconds}秒`;
};

const formatTime = (timeString: string): string => {
  const date = new Date(timeString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// 事件处理
const handleProceedToNext = async () => {
  proceeding.value = true;
  try {
    emit('proceed-to-next');
  } finally {
    proceeding.value = false;
  }
};

const handleRestartStage = async () => {
  restarting.value = true;
  try {
    emit('restart-stage');
  } finally {
    restarting.value = false;
  }
};

const handlePauseSession = async () => {
  pausing.value = true;
  try {
    emit('pause-session');
  } finally {
    pausing.value = false;
  }
};

const handleResumeSession = async () => {
  resuming.value = true;
  try {
    emit('resume-session');
  } finally {
    resuming.value = false;
  }
};
</script>

<style scoped lang="scss">
.stage-progress-indicator {
  .progress-card {
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .progress-title {
        font-size: 16px;
        font-weight: 600;
        color: #262626;
      }

      .session-status-tag {
        font-weight: 500;
      }
    }
  }

  .progress-bar-container {
    margin-bottom: 24px;

    .overall-progress {
      margin-bottom: 8px;
    }

    .progress-text {
      text-align: center;
      color: #595959;
      font-size: 14px;
    }
  }

  .stages-container {
    margin-bottom: 24px;

    .stage-steps {
      .stage-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        
        &.stage-icon-completed {
          color: #52c41a;
          background: #f6ffed;
        }
        
        &.stage-icon-current {
          color: #1890ff;
          background: #e6f7ff;
        }
        
        &.stage-icon-waiting {
          color: #8c8c8c;
          background: #f5f5f5;
        }
      }
    }
  }

  .current-stage-details {
    .current-stage-title {
      font-size: 16px;
      font-weight: 600;
      color: #1890ff;
    }

    .stage-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 16px;

      .stage-info-item {
        .info-label {
          font-size: 12px;
          color: #8c8c8c;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 14px;
          color: #262626;
          font-weight: 500;
        }
      }
    }

    .stage-progress {
      margin-bottom: 16px;

      .stage-progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .progress-percentage {
          font-weight: 600;
          color: #1890ff;
        }
      }
    }
  }

  .stage-actions {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
    text-align: center;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .stage-progress-indicator {
    .stages-container .stage-steps {
      :deep(.ant-steps-item-title) {
        font-size: 12px;
      }
      
      :deep(.ant-steps-item-description) {
        font-size: 11px;
      }
    }

    .current-stage-details .stage-info-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }
}

@media (max-width: 576px) {
  .stage-progress-indicator {
    .stages-container .stage-steps {
      :deep(.ant-steps) {
        flex-direction: column;
      }
    }
  }
}
</style>