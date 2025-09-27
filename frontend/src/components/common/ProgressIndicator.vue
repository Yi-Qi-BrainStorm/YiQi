<template>
  <div class="progress-indicator" :class="{ 'is-compact': compact }">
    <!-- 基础进度条 -->
    <div v-if="type === 'bar'" class="progress-bar-container">
      <div class="progress-info" v-if="showInfo">
        <span class="progress-text">{{ displayText }}</span>
        <span class="progress-percentage">{{ percentage }}%</span>
      </div>
      <div class="progress-bar" :class="`progress-${status}`">
        <div 
          class="progress-bar-fill" 
          :style="{ width: `${percentage}%` }"
        ></div>
      </div>
      <div v-if="showDetails && stage" class="progress-stage">
        {{ stage }}
      </div>
    </div>

    <!-- 圆形进度条 -->
    <div v-else-if="type === 'circle'" class="progress-circle-container">
      <div class="progress-circle" :style="{ width: `${size}px`, height: `${size}px` }">
        <svg :width="size" :height="size" class="progress-circle-svg">
          <circle
            :cx="size / 2"
            :cy="size / 2"
            :r="radius"
            class="progress-circle-bg"
            :stroke-width="strokeWidth"
          />
          <circle
            :cx="size / 2"
            :cy="size / 2"
            :r="radius"
            class="progress-circle-fill"
            :class="`progress-${status}`"
            :stroke-width="strokeWidth"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeDashoffset"
          />
        </svg>
        <div class="progress-circle-content">
          <div class="progress-percentage">{{ percentage }}%</div>
          <div v-if="showDetails && stage" class="progress-stage">{{ stage }}</div>
        </div>
      </div>
      <div v-if="showInfo && displayText" class="progress-text">{{ displayText }}</div>
    </div>

    <!-- 步骤进度条 -->
    <div v-else-if="type === 'steps'" class="progress-steps-container">
      <div class="progress-info" v-if="showInfo">
        <span class="progress-text">{{ displayText }}</span>
        <span class="progress-step-count">{{ current }} / {{ total }}</span>
      </div>
      <div class="progress-steps">
        <div 
          v-for="step in total" 
          :key="step"
          class="progress-step"
          :class="{
            'is-completed': step <= current,
            'is-active': step === current,
            'is-error': status === 'error' && step === current
          }"
        >
          <div class="progress-step-icon">
            <i v-if="step < current" class="anticon anticon-check"></i>
            <i v-else-if="status === 'error' && step === current" class="anticon anticon-close"></i>
            <span v-else>{{ step }}</span>
          </div>
          <div v-if="step < total" class="progress-step-line"></div>
        </div>
      </div>
      <div v-if="showDetails && stage" class="progress-stage">
        {{ stage }}
      </div>
    </div>

    <!-- 加载动画 -->
    <div v-else-if="type === 'loading'" class="progress-loading-container">
      <div class="progress-loading" :class="`loading-${loadingType}`">
        <div v-if="loadingType === 'spinner'" class="loading-spinner"></div>
        <div v-else-if="loadingType === 'dots'" class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div v-else-if="loadingType === 'pulse'" class="loading-pulse"></div>
      </div>
      <div v-if="showInfo && displayText" class="progress-text">{{ displayText }}</div>
    </div>

    <!-- 操作按钮 -->
    <div v-if="showActions" class="progress-actions">
      <a-button 
        v-if="cancelable && status !== 'completed'" 
        size="small" 
        @click="handleCancel"
      >
        取消
      </a-button>
      <a-button 
        v-if="status === 'error'" 
        size="small" 
        type="primary" 
        @click="handleRetry"
      >
        重试
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  // 基础属性
  current?: number;
  total?: number;
  percentage?: number;
  message?: string;
  stage?: string;
  
  // 样式属性
  type?: 'bar' | 'circle' | 'steps' | 'loading';
  status?: 'normal' | 'active' | 'success' | 'error' | 'warning';
  size?: number;
  strokeWidth?: number;
  compact?: boolean;
  
  // 显示控制
  showInfo?: boolean;
  showDetails?: boolean;
  showActions?: boolean;
  
  // 功能属性
  cancelable?: boolean;
  loadingType?: 'spinner' | 'dots' | 'pulse';
}

interface Emits {
  (e: 'cancel'): void;
  (e: 'retry'): void;
}

const props = withDefaults(defineProps<Props>(), {
  current: 0,
  total: 100,
  type: 'bar',
  status: 'normal',
  size: 120,
  strokeWidth: 6,
  compact: false,
  showInfo: true,
  showDetails: true,
  showActions: false,
  cancelable: false,
  loadingType: 'spinner',
});

const emit = defineEmits<Emits>();

// 计算属性
const displayPercentage = computed(() => {
  if (props.percentage !== undefined) {
    return Math.round(props.percentage);
  }
  return Math.round((props.current / props.total) * 100);
});

const percentage = computed(() => {
  return Math.min(100, Math.max(0, displayPercentage.value));
});

const displayText = computed(() => {
  return props.message || '';
});

const radius = computed(() => {
  return (props.size - props.strokeWidth) / 2;
});

const circumference = computed(() => {
  return 2 * Math.PI * radius.value;
});

const strokeDashoffset = computed(() => {
  return circumference.value - (percentage.value / 100) * circumference.value;
});

// 事件处理
const handleCancel = () => {
  emit('cancel');
};

const handleRetry = () => {
  emit('retry');
};
</script>

<style lang="scss" scoped>
.progress-indicator {
  &.is-compact {
    .progress-info {
      margin-bottom: 4px;
    }
    
    .progress-text {
      font-size: 12px;
    }
    
    .progress-stage {
      font-size: 11px;
      margin-top: 2px;
    }
  }
}

// 进度条样式
.progress-bar-container {
  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    
    .progress-text {
      font-size: 14px;
      color: #666;
    }
    
    .progress-percentage {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }
  }
  
  .progress-bar {
    height: 8px;
    background-color: #f5f5f5;
    border-radius: 4px;
    overflow: hidden;
    
    &.progress-active {
      .progress-bar-fill {
        background: linear-gradient(90deg, #1890ff, #40a9ff);
        animation: progress-active 2s ease-in-out infinite;
      }
    }
    
    &.progress-success {
      .progress-bar-fill {
        background-color: #52c41a;
      }
    }
    
    &.progress-error {
      .progress-bar-fill {
        background-color: #ff4d4f;
      }
    }
    
    &.progress-warning {
      .progress-bar-fill {
        background-color: #faad14;
      }
    }
    
    .progress-bar-fill {
      height: 100%;
      background-color: #1890ff;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
  }
  
  .progress-stage {
    margin-top: 4px;
    font-size: 12px;
    color: #999;
  }
}

// 圆形进度条样式
.progress-circle-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .progress-circle {
    position: relative;
    
    .progress-circle-svg {
      transform: rotate(-90deg);
      
      .progress-circle-bg {
        fill: none;
        stroke: #f5f5f5;
      }
      
      .progress-circle-fill {
        fill: none;
        stroke: #1890ff;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.3s ease;
        
        &.progress-success {
          stroke: #52c41a;
        }
        
        &.progress-error {
          stroke: #ff4d4f;
        }
        
        &.progress-warning {
          stroke: #faad14;
        }
        
        &.progress-active {
          animation: progress-circle-active 2s linear infinite;
        }
      }
    }
    
    .progress-circle-content {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      
      .progress-percentage {
        font-size: 16px;
        font-weight: 500;
        color: #333;
      }
      
      .progress-stage {
        font-size: 10px;
        color: #999;
        margin-top: 2px;
      }
    }
  }
  
  .progress-text {
    margin-top: 8px;
    font-size: 14px;
    color: #666;
    text-align: center;
  }
}

// 步骤进度条样式
.progress-steps-container {
  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    .progress-text {
      font-size: 14px;
      color: #666;
    }
    
    .progress-step-count {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }
  }
  
  .progress-steps {
    display: flex;
    align-items: center;
    
    .progress-step {
      display: flex;
      align-items: center;
      flex: 1;
      
      .progress-step-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: #f5f5f5;
        color: #999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;
      }
      
      .progress-step-line {
        flex: 1;
        height: 2px;
        background-color: #f5f5f5;
        margin: 0 8px;
        transition: background-color 0.3s ease;
      }
      
      &.is-completed {
        .progress-step-icon {
          background-color: #52c41a;
          color: white;
        }
        
        .progress-step-line {
          background-color: #52c41a;
        }
      }
      
      &.is-active {
        .progress-step-icon {
          background-color: #1890ff;
          color: white;
        }
      }
      
      &.is-error {
        .progress-step-icon {
          background-color: #ff4d4f;
          color: white;
        }
      }
    }
  }
  
  .progress-stage {
    margin-top: 8px;
    font-size: 12px;
    color: #999;
    text-align: center;
  }
}

// 加载动画样式
.progress-loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .progress-loading {
    margin-bottom: 8px;
    
    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #f5f5f5;
      border-top: 3px solid #1890ff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    .loading-dots {
      display: flex;
      gap: 4px;
      
      span {
        width: 8px;
        height: 8px;
        background-color: #1890ff;
        border-radius: 50%;
        animation: loading-dots 1.4s ease-in-out infinite both;
        
        &:nth-child(1) { animation-delay: -0.32s; }
        &:nth-child(2) { animation-delay: -0.16s; }
        &:nth-child(3) { animation-delay: 0s; }
      }
    }
    
    .loading-pulse {
      width: 32px;
      height: 32px;
      background-color: #1890ff;
      border-radius: 50%;
      animation: loading-pulse 1.5s ease-in-out infinite;
    }
  }
  
  .progress-text {
    font-size: 14px;
    color: #666;
    text-align: center;
  }
}

// 操作按钮样式
.progress-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  justify-content: center;
}

// 动画
@keyframes progress-active {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 40px 0;
  }
}

@keyframes progress-circle-active {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -124;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes loading-dots {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes loading-pulse {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}
</style>