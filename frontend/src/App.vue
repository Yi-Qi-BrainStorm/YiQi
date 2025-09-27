<template>
  <div id="app" class="app-container theme-transition">
    <router-view />
    
    <!-- 全局加载覆盖层 -->
    <GlobalLoadingOverlay
      :show-task-list="true"
      :show-progress-list="true"
      :show-actions="true"
      :allow-minimize="true"
      :allow-hide="true"
      :blur-background="true"
      @cancel-all="handleCancelAllTasks"
    />
    
    <!-- 反馈提示组件 -->
    <FeedbackToast ref="feedbackToast" />
    
    <!-- 网络状态指示器 -->
    <NetworkStatusIndicator />
  </div>
</template>

<script setup lang="ts">
import { ref, provide, onMounted } from 'vue';
import { useTheme } from '@/composables/useTheme';
import GlobalLoadingOverlay from '@/components/common/GlobalLoadingOverlay.vue';
import FeedbackToast from '@/components/common/FeedbackToast.vue';
import NetworkStatusIndicator from '@/components/common/NetworkStatusIndicator.vue';

// 初始化主题系统
const { initializeTheme } = useTheme();

// 反馈提示组件引用
const feedbackToast = ref<InstanceType<typeof FeedbackToast>>();

// 提供全局反馈方法
provide('$toast', {
  success: (message: string, options?: any) => feedbackToast.value?.success(message, options),
  error: (message: string, options?: any) => feedbackToast.value?.error(message, options),
  warning: (message: string, options?: any) => feedbackToast.value?.warning(message, options),
  info: (message: string, options?: any) => feedbackToast.value?.info(message, options),
  loading: (message: string, options?: any) => feedbackToast.value?.loading(message, options),
  clear: () => feedbackToast.value?.clear(),
  update: (id: string, updates: any) => feedbackToast.value?.update(id, updates),
});

// 处理取消所有任务
const handleCancelAllTasks = () => {
  // 这里可以实现取消所有正在进行的任务的逻辑
  console.log('取消所有任务');
  feedbackToast.value?.warning('已取消所有正在进行的任务');
};

// 初始化应用
onMounted(() => {
  initializeTheme();
});
</script>

<style lang="scss">
// Import our design system
@import '@/styles/main.scss';

#app {
  font-family: var(--font-family-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--color-text-primary);
  background-color: var(--color-background);
  min-height: 100vh;
  transition: background-color var(--transition-base), color var(--transition-base);
}

// Global component overrides for Ant Design
:deep(.ant-layout) {
  background-color: var(--color-background);
}

:deep(.ant-layout-header) {
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

:deep(.ant-layout-sider) {
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
}

:deep(.ant-layout-content) {
  background-color: var(--color-background-secondary);
}

:deep(.ant-layout-footer) {
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

:deep(.ant-menu) {
  background-color: transparent;
  border-right: none;
  
  .ant-menu-item,
  .ant-menu-submenu-title {
    color: var(--color-text-primary);
    
    &:hover {
      color: var(--color-primary-600);
      background-color: var(--color-surface-hover);
    }
  }
  
  .ant-menu-item-selected {
    background-color: var(--color-primary-50);
    color: var(--color-primary-600);
    
    [data-theme="dark"] & {
      background-color: var(--color-primary-900);
      color: var(--color-primary-400);
    }
  }
}

:deep(.ant-card) {
  background-color: var(--color-surface);
  border-color: var(--color-border);
  
  .ant-card-head {
    background-color: var(--color-background-secondary);
    border-bottom-color: var(--color-border);
    
    .ant-card-head-title {
      color: var(--color-text-primary);
    }
  }
  
  .ant-card-body {
    color: var(--color-text-primary);
  }
}

:deep(.ant-table) {
  background-color: var(--color-surface);
  
  .ant-table-thead > tr > th {
    background-color: var(--color-background-secondary);
    border-bottom-color: var(--color-border);
    color: var(--color-text-primary);
  }
  
  .ant-table-tbody > tr > td {
    border-bottom-color: var(--color-border);
    color: var(--color-text-primary);
  }
  
  .ant-table-tbody > tr:hover > td {
    background-color: var(--color-surface-hover);
  }
}

:deep(.ant-modal) {
  .ant-modal-content {
    background-color: var(--color-surface);
    border-radius: var(--radius-xl);
  }
  
  .ant-modal-header {
    background-color: var(--color-background-secondary);
    border-bottom-color: var(--color-border);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    
    .ant-modal-title {
      color: var(--color-text-primary);
    }
  }
  
  .ant-modal-body {
    color: var(--color-text-primary);
  }
  
  .ant-modal-footer {
    border-top-color: var(--color-border);
  }
}

:deep(.ant-drawer) {
  .ant-drawer-content {
    background-color: var(--color-surface);
  }
  
  .ant-drawer-header {
    background-color: var(--color-background-secondary);
    border-bottom-color: var(--color-border);
    
    .ant-drawer-title {
      color: var(--color-text-primary);
    }
  }
  
  .ant-drawer-body {
    color: var(--color-text-primary);
  }
}

:deep(.ant-notification) {
  .ant-notification-notice {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
  }
}

:deep(.ant-message) {
  .ant-message-notice {
    .ant-message-notice-content {
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      color: var(--color-text-primary);
    }
  }
}
</style>