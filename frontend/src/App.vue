<template>
  <div id="app">
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
import { ref, provide } from 'vue';
import GlobalLoadingOverlay from '@/components/common/GlobalLoadingOverlay.vue';
import FeedbackToast from '@/components/common/FeedbackToast.vue';
import NetworkStatusIndicator from '@/components/common/NetworkStatusIndicator.vue';

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
</script>

<style lang="scss">
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
    'Noto Color Emoji';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>