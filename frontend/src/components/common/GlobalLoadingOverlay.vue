<template>
  <teleport to="body">
    <transition name="loading-fade">
      <div v-if="showOverlay" class="global-loading-overlay" :class="{ 'is-blur': blurBackground }">
        <div class="loading-content">
          <!-- 主加载指示器 -->
          <div class="loading-main">
            <ProgressIndicator
              :type="loadingType"
              :loading-type="spinnerType"
              :message="currentMessage"
              :show-info="true"
              :show-details="false"
            />
          </div>

          <!-- 多任务加载列表 -->
          <div v-if="showTaskList && activeLoadings.length > 1" class="loading-tasks">
            <div class="loading-tasks-header">
              <span>正在处理 {{ activeLoadings.length }} 个任务</span>
              <a-button 
                v-if="allowMinimize" 
                type="text" 
                size="small" 
                @click="minimizeOverlay"
              >
                最小化
              </a-button>
            </div>
            <div class="loading-tasks-list">
              <div 
                v-for="loading in activeLoadings" 
                :key="loading.id"
                class="loading-task-item"
              >
                <div class="task-info">
                  <span class="task-message">{{ loading.message }}</span>
                  <span class="task-duration">{{ formatDuration(getDuration(loading)) }}</span>
                </div>
                <div v-if="loading.progress !== undefined" class="task-progress">
                  <ProgressIndicator
                    type="bar"
                    :percentage="loading.progress"
                    :show-info="false"
                    compact
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 进度任务列表 -->
          <div v-if="showProgressList && activeProgresses.length > 0" class="loading-progresses">
            <div class="loading-progresses-header">
              <span>进度详情</span>
            </div>
            <div class="loading-progresses-list">
              <div 
                v-for="progress in activeProgresses" 
                :key="`progress_${progress.current}_${progress.total}`"
                class="loading-progress-item"
              >
                <div class="progress-info">
                  <span class="progress-message">{{ progress.message || '处理中...' }}</span>
                  <span v-if="progress.stage" class="progress-stage">{{ progress.stage }}</span>
                </div>
                <ProgressIndicator
                  type="bar"
                  :current="progress.current"
                  :total="progress.total"
                  :show-info="true"
                  :show-details="false"
                  compact
                />
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div v-if="showActions" class="loading-actions">
            <a-button 
              v-if="allowCancel" 
              @click="handleCancelAll"
            >
              取消所有
            </a-button>
            <a-button 
              v-if="allowHide" 
              type="primary" 
              @click="hideOverlay"
            >
              后台运行
            </a-button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 最小化状态指示器 -->
    <transition name="minimized-fade">
      <div v-if="isMinimized && (activeLoadings.length > 0 || activeProgresses.length > 0)" 
           class="loading-minimized" 
           @click="restoreOverlay">
        <div class="minimized-content">
          <div class="minimized-spinner">
            <div class="spinner"></div>
          </div>
          <div class="minimized-info">
            <span class="minimized-count">{{ totalTasks }}</span>
            <span class="minimized-text">个任务进行中</span>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useGlobalLoading } from '@/composables/useLoading';
import ProgressIndicator from './ProgressIndicator.vue';

interface Props {
  // 显示控制
  showTaskList?: boolean;
  showProgressList?: boolean;
  showActions?: boolean;
  
  // 功能控制
  allowMinimize?: boolean;
  allowCancel?: boolean;
  allowHide?: boolean;
  
  // 样式控制
  blurBackground?: boolean;
  loadingType?: 'loading' | 'circle';
  spinnerType?: 'spinner' | 'dots' | 'pulse';
  
  // 自动隐藏
  autoHide?: boolean;
  autoHideDelay?: number;
}

interface Emits {
  (e: 'cancel-all'): void;
  (e: 'hide'): void;
  (e: 'minimize'): void;
  (e: 'restore'): void;
}

const props = withDefaults(defineProps<Props>(), {
  showTaskList: true,
  showProgressList: true,
  showActions: true,
  allowMinimize: true,
  allowCancel: false,
  allowHide: true,
  blurBackground: true,
  loadingType: 'loading',
  spinnerType: 'spinner',
  autoHide: false,
  autoHideDelay: 3000,
});

const emit = defineEmits<Emits>();

// 使用全局加载状态
const {
  isLoading,
  activeLoadings,
  activeProgresses,
  globalLoading,
  globalMessage,
} = useGlobalLoading();

// 本地状态
const isMinimized = ref(false);
const isHidden = ref(false);
const autoHideTimer = ref<number | null>(null);

// 计算属性
const showOverlay = computed(() => {
  return (isLoading.value || globalLoading.value) && !isMinimized.value && !isHidden.value;
});

const currentMessage = computed(() => {
  if (globalMessage.value) {
    return globalMessage.value;
  }
  if (activeLoadings.value.length === 1) {
    return activeLoadings.value[0].message;
  }
  if (activeLoadings.value.length > 1) {
    return `正在处理 ${activeLoadings.value.length} 个任务...`;
  }
  return '加载中...';
});

const totalTasks = computed(() => {
  return activeLoadings.value.length + activeProgresses.value.length;
});

// 方法
const getDuration = (loading: any) => {
  return Date.now() - loading.startTime;
};

const formatDuration = (duration: number) => {
  const seconds = Math.floor(duration / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const minimizeOverlay = () => {
  isMinimized.value = true;
  emit('minimize');
};

const restoreOverlay = () => {
  isMinimized.value = false;
  isHidden.value = false;
  emit('restore');
};

const hideOverlay = () => {
  isHidden.value = true;
  emit('hide');
};

const handleCancelAll = () => {
  emit('cancel-all');
};

// 自动隐藏逻辑
watch(
  () => isLoading.value,
  (newValue, oldValue) => {
    if (props.autoHide) {
      if (newValue && !oldValue) {
        // 开始加载，清除自动隐藏定时器
        if (autoHideTimer.value) {
          clearTimeout(autoHideTimer.value);
          autoHideTimer.value = null;
        }
      } else if (!newValue && oldValue) {
        // 加载完成，设置自动隐藏定时器
        autoHideTimer.value = window.setTimeout(() => {
          isHidden.value = true;
        }, props.autoHideDelay);
      }
    }
  }
);

// 当没有任务时重置状态
watch(
  () => totalTasks.value,
  (newValue) => {
    if (newValue === 0) {
      isMinimized.value = false;
      isHidden.value = false;
      if (autoHideTimer.value) {
        clearTimeout(autoHideTimer.value);
        autoHideTimer.value = null;
      }
    }
  }
);
</script>

<style lang="scss" scoped>
.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  
  &.is-blur {
    backdrop-filter: blur(4px);
  }
  
  .loading-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 24px;
    min-width: 320px;
    max-width: 500px;
    max-height: 70vh;
    overflow-y: auto;
    
    .loading-main {
      text-align: center;
      margin-bottom: 16px;
    }
    
    .loading-tasks {
      margin-top: 16px;
      
      .loading-tasks-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        font-size: 14px;
        font-weight: 500;
        color: #333;
      }
      
      .loading-tasks-list {
        max-height: 200px;
        overflow-y: auto;
        
        .loading-task-item {
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
          
          &:last-child {
            border-bottom: none;
          }
          
          .task-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
            
            .task-message {
              font-size: 13px;
              color: #666;
              flex: 1;
            }
            
            .task-duration {
              font-size: 12px;
              color: #999;
            }
          }
          
          .task-progress {
            margin-top: 4px;
          }
        }
      }
    }
    
    .loading-progresses {
      margin-top: 16px;
      
      .loading-progresses-header {
        margin-bottom: 12px;
        font-size: 14px;
        font-weight: 500;
        color: #333;
      }
      
      .loading-progresses-list {
        max-height: 200px;
        overflow-y: auto;
        
        .loading-progress-item {
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
          
          &:last-child {
            border-bottom: none;
          }
          
          .progress-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            
            .progress-message {
              font-size: 13px;
              color: #666;
              flex: 1;
            }
            
            .progress-stage {
              font-size: 12px;
              color: #999;
            }
          }
        }
      }
    }
    
    .loading-actions {
      margin-top: 16px;
      display: flex;
      gap: 8px;
      justify-content: center;
    }
  }
}

.loading-minimized {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 8px 16px;
  cursor: pointer;
  z-index: 9998;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }
  
  .minimized-content {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .minimized-spinner {
      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #f0f0f0;
        border-top: 2px solid #1890ff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    }
    
    .minimized-info {
      font-size: 12px;
      color: #666;
      
      .minimized-count {
        font-weight: 500;
        color: #1890ff;
      }
    }
  }
}

// 过渡动画
.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.3s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}

.minimized-fade-enter-active,
.minimized-fade-leave-active {
  transition: all 0.3s ease;
}

.minimized-fade-enter-from,
.minimized-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>