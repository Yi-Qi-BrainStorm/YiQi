<template>
  <teleport to="body">
    <div class="feedback-toast-container">
      <transition-group name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="feedback-toast"
          :class="[
            `toast-${toast.type}`,
            { 'toast-closable': toast.closable }
          ]"
          @mouseenter="handleMouseEnter(toast)"
          @mouseleave="handleMouseLeave(toast)"
        >
          <!-- 图标 -->
          <div class="toast-icon">
            <i :class="getIconClass(toast.type)"></i>
          </div>

          <!-- 内容 -->
          <div class="toast-content">
            <div v-if="toast.title" class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
            
            <!-- 操作按钮 -->
            <div v-if="toast.actions && toast.actions.length > 0" class="toast-actions">
              <a-button
                v-for="action in toast.actions"
                :key="action.key"
                :type="action.type || 'text'"
                size="small"
                @click="handleActionClick(toast, action)"
              >
                {{ action.label }}
              </a-button>
            </div>
          </div>

          <!-- 进度条 -->
          <div
            v-if="toast.showProgress && toast.duration > 0"
            class="toast-progress"
            :style="{ width: `${getProgressWidth(toast)}%` }"
          ></div>

          <!-- 关闭按钮 -->
          <div
            v-if="toast.closable"
            class="toast-close"
            @click="removeToast(toast.id)"
          >
            <i class="anticon anticon-close"></i>
          </div>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

export interface ToastAction {
  key: string;
  label: string;
  type?: 'primary' | 'default' | 'text' | 'link';
  handler: () => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title?: string;
  message: string;
  duration: number;
  closable: boolean;
  showProgress: boolean;
  actions?: ToastAction[];
  createdAt: number;
  pausedAt?: number;
  remainingTime?: number;
}

// 全局toast管理
const toasts = ref<Toast[]>([]);
const timers = ref<Map<string, number>>(new Map());

// 默认配置
const defaultConfig = {
  duration: 4000,
  closable: true,
  showProgress: false,
  maxToasts: 5,
};

// 计算属性
const visibleToasts = computed(() => {
  return toasts.value.slice(0, defaultConfig.maxToasts);
});

// 方法
const generateId = () => {
  return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getIconClass = (type: Toast['type']) => {
  const iconMap = {
    success: 'anticon anticon-check-circle',
    error: 'anticon anticon-close-circle',
    warning: 'anticon anticon-exclamation-circle',
    info: 'anticon anticon-info-circle',
    loading: 'anticon anticon-loading',
  };
  return iconMap[type];
};

const getProgressWidth = (toast: Toast) => {
  if (toast.duration <= 0) return 0;
  
  const elapsed = toast.pausedAt 
    ? toast.pausedAt - toast.createdAt
    : Date.now() - toast.createdAt;
  
  const progress = Math.max(0, 100 - (elapsed / toast.duration) * 100);
  return progress;
};

const addToast = (options: Partial<Toast> & { message: string; type: Toast['type'] }) => {
  const toast: Toast = {
    id: generateId(),
    type: options.type,
    title: options.title,
    message: options.message,
    duration: options.duration ?? defaultConfig.duration,
    closable: options.closable ?? defaultConfig.closable,
    showProgress: options.showProgress ?? defaultConfig.showProgress,
    actions: options.actions,
    createdAt: Date.now(),
  };

  toasts.value.unshift(toast);

  // 如果超过最大数量，移除最旧的
  if (toasts.value.length > defaultConfig.maxToasts) {
    const removed = toasts.value.splice(defaultConfig.maxToasts);
    removed.forEach(t => clearTimer(t.id));
  }

  // 设置自动移除定时器
  if (toast.duration > 0) {
    setTimer(toast);
  }

  return toast.id;
};

const removeToast = (id: string) => {
  const index = toasts.value.findIndex(t => t.id === id);
  if (index > -1) {
    toasts.value.splice(index, 1);
    clearTimer(id);
  }
};

const setTimer = (toast: Toast) => {
  if (toast.duration <= 0) return;

  const timerId = window.setTimeout(() => {
    removeToast(toast.id);
  }, toast.duration);

  timers.value.set(toast.id, timerId);
};

const clearTimer = (id: string) => {
  const timerId = timers.value.get(id);
  if (timerId) {
    clearTimeout(timerId);
    timers.value.delete(id);
  }
};

const handleMouseEnter = (toast: Toast) => {
  if (toast.duration > 0) {
    toast.pausedAt = Date.now();
    clearTimer(toast.id);
  }
};

const handleMouseLeave = (toast: Toast) => {
  if (toast.duration > 0 && toast.pausedAt) {
    const elapsed = toast.pausedAt - toast.createdAt;
    const remaining = toast.duration - elapsed;
    
    if (remaining > 0) {
      toast.createdAt = Date.now();
      toast.pausedAt = undefined;
      
      const timerId = window.setTimeout(() => {
        removeToast(toast.id);
      }, remaining);
      
      timers.value.set(toast.id, timerId);
    } else {
      removeToast(toast.id);
    }
  }
};

const handleActionClick = (toast: Toast, action: ToastAction) => {
  action.handler();
  // 执行操作后可以选择是否关闭toast
  // removeToast(toast.id);
};

// 公共API方法
const success = (message: string, options?: Partial<Toast>) => {
  return addToast({ ...options, message, type: 'success' });
};

const error = (message: string, options?: Partial<Toast>) => {
  return addToast({ 
    ...options, 
    message, 
    type: 'error',
    duration: options?.duration ?? 6000 // 错误消息显示更久
  });
};

const warning = (message: string, options?: Partial<Toast>) => {
  return addToast({ ...options, message, type: 'warning' });
};

const info = (message: string, options?: Partial<Toast>) => {
  return addToast({ ...options, message, type: 'info' });
};

const loading = (message: string, options?: Partial<Toast>) => {
  return addToast({ 
    ...options, 
    message, 
    type: 'loading',
    duration: 0, // 加载消息不自动消失
    closable: options?.closable ?? false
  });
};

const clear = () => {
  toasts.value.forEach(toast => clearTimer(toast.id));
  toasts.value = [];
};

const update = (id: string, updates: Partial<Toast>) => {
  const toast = toasts.value.find(t => t.id === id);
  if (toast) {
    Object.assign(toast, updates);
  }
};

// 清理定时器
onUnmounted(() => {
  timers.value.forEach(timerId => clearTimeout(timerId));
  timers.value.clear();
});

// 暴露API
defineExpose({
  success,
  error,
  warning,
  info,
  loading,
  clear,
  update,
  removeToast,
});
</script>

<style lang="scss" scoped>
.feedback-toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  pointer-events: none;
}

.feedback-toast {
  position: relative;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 12px;
  padding: 16px;
  min-width: 320px;
  max-width: 400px;
  pointer-events: auto;
  overflow: hidden;
  
  display: flex;
  align-items: flex-start;
  gap: 12px;
  
  // 类型样式
  &.toast-success {
    border-left: 4px solid #52c41a;
    
    .toast-icon {
      color: #52c41a;
    }
    
    .toast-progress {
      background-color: #52c41a;
    }
  }
  
  &.toast-error {
    border-left: 4px solid #ff4d4f;
    
    .toast-icon {
      color: #ff4d4f;
    }
    
    .toast-progress {
      background-color: #ff4d4f;
    }
  }
  
  &.toast-warning {
    border-left: 4px solid #faad14;
    
    .toast-icon {
      color: #faad14;
    }
    
    .toast-progress {
      background-color: #faad14;
    }
  }
  
  &.toast-info {
    border-left: 4px solid #1890ff;
    
    .toast-icon {
      color: #1890ff;
    }
    
    .toast-progress {
      background-color: #1890ff;
    }
  }
  
  &.toast-loading {
    border-left: 4px solid #1890ff;
    
    .toast-icon {
      color: #1890ff;
      
      i {
        animation: spin 1s linear infinite;
      }
    }
    
    .toast-progress {
      background-color: #1890ff;
    }
  }
  
  &.toast-closable {
    padding-right: 40px;
  }
  
  .toast-icon {
    font-size: 18px;
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  .toast-content {
    flex: 1;
    
    .toast-title {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }
    
    .toast-message {
      font-size: 13px;
      color: #666;
      line-height: 1.4;
    }
    
    .toast-actions {
      margin-top: 8px;
      display: flex;
      gap: 8px;
    }
  }
  
  .toast-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    transition: width 0.1s linear;
  }
  
  .toast-close {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #999;
    font-size: 12px;
    
    &:hover {
      color: #666;
    }
  }
}

// 过渡动画
.toast-enter-active {
  transition: all 0.3s ease;
}

.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>