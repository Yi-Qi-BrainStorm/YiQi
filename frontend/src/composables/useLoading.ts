import { ref, computed, onUnmounted } from 'vue';
import { useLoadingStore } from '@/stores/loading';
import { NotificationService } from '@/services/notificationService';

export interface UseLoadingOptions {
  message?: string;
  showNotification?: boolean;
  autoStop?: boolean;
  timeout?: number;
}

export interface UseProgressOptions {
  total: number;
  message?: string;
  stage?: string;
  showNotification?: boolean;
}

/**
 * 加载状态管理组合式函数
 */
export function useLoading(id?: string, options: UseLoadingOptions = {}) {
  const loadingStore = useLoadingStore();
  const loadingId = id || `loading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timeoutId = ref<number | null>(null);

  // 计算属性
  const isLoading = computed(() => loadingStore.isLoadingById(loadingId));
  const loadingState = computed(() => loadingStore.getLoadingState(loadingId));
  const duration = computed(() => loadingStore.getLoadingDuration(loadingId));

  /**
   * 开始加载
   */
  const startLoading = (message?: string, showNotification: boolean = false) => {
    const loadingMessage = message || options.message || '加载中...';
    
    loadingStore.startLoading(loadingId, loadingMessage);
    
    if (showNotification || options.showNotification) {
      NotificationService.loading(loadingMessage);
    }

    // 设置超时
    if (options.timeout) {
      timeoutId.value = window.setTimeout(() => {
        stopLoading();
        NotificationService.warning('操作超时，请重试');
      }, options.timeout);
    }
  };

  /**
   * 更新加载消息
   */
  const updateMessage = (message: string) => {
    loadingStore.updateLoading(loadingId, { message });
  };

  /**
   * 停止加载
   */
  const stopLoading = () => {
    loadingStore.stopLoading(loadingId);
    
    if (timeoutId.value) {
      clearTimeout(timeoutId.value);
      timeoutId.value = null;
    }
  };

  /**
   * 异步操作包装器
   */
  const withLoading = async <T>(
    asyncFn: () => Promise<T>,
    message?: string,
    showNotification: boolean = false
  ): Promise<T> => {
    try {
      startLoading(message, showNotification);
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading();
    }
  };

  // 自动清理
  if (options.autoStop !== false) {
    onUnmounted(() => {
      stopLoading();
    });
  }

  return {
    isLoading,
    loadingState,
    duration,
    startLoading,
    updateMessage,
    stopLoading,
    withLoading,
  };
}

/**
 * 进度跟踪组合式函数
 */
export function useProgress(id?: string, options: UseProgressOptions = { total: 100 }) {
  const loadingStore = useLoadingStore();
  const progressId = id || `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 计算属性
  const hasProgress = computed(() => loadingStore.hasProgress(progressId));
  const progressState = computed(() => loadingStore.getProgressState(progressId));
  const percentage = computed(() => {
    const state = progressState.value;
    return state ? Math.round((state.current / state.total) * 100) : 0;
  });

  /**
   * 开始进度跟踪
   */
  const startProgress = (
    total?: number,
    message?: string,
    stage?: string,
    showNotification: boolean = false
  ) => {
    const progressTotal = total || options.total;
    const progressMessage = message || options.message;
    const progressStage = stage || options.stage;
    
    loadingStore.startProgress(progressId, progressTotal, progressMessage, progressStage);
    
    if (showNotification || options.showNotification) {
      NotificationService.info(progressMessage || '开始处理...');
    }
  };

  /**
   * 更新进度
   */
  const updateProgress = (
    current: number,
    message?: string,
    stage?: string
  ) => {
    loadingStore.updateProgress(progressId, current, {
      message,
      stage,
    });
  };

  /**
   * 增加进度
   */
  const incrementProgress = (
    increment: number = 1,
    message?: string,
    stage?: string
  ) => {
    const state = progressState.value;
    if (state) {
      const newCurrent = Math.min(state.current + increment, state.total);
      updateProgress(newCurrent, message, stage);
    }
  };

  /**
   * 设置进度阶段
   */
  const setStage = (stage: string, message?: string) => {
    const state = progressState.value;
    if (state) {
      loadingStore.updateProgress(progressId, state.current, {
        stage,
        message,
      });
    }
  };

  /**
   * 完成进度
   */
  const completeProgress = (message?: string, showNotification: boolean = false) => {
    loadingStore.completeProgress(progressId);
    
    if (showNotification || options.showNotification) {
      NotificationService.success(message || '处理完成');
    }
  };

  /**
   * 停止进度跟踪
   */
  const stopProgress = () => {
    loadingStore.stopProgress(progressId);
  };

  /**
   * 进度包装器
   */
  const withProgress = async <T>(
    asyncFn: (updateFn: (current: number, message?: string) => void) => Promise<T>,
    total?: number,
    message?: string
  ): Promise<T> => {
    try {
      startProgress(total, message);
      
      const updateFn = (current: number, msg?: string) => {
        updateProgress(current, msg);
      };
      
      const result = await asyncFn(updateFn);
      completeProgress();
      return result;
    } catch (error) {
      stopProgress();
      throw error;
    }
  };

  // 自动清理
  onUnmounted(() => {
    stopProgress();
  });

  return {
    hasProgress,
    progressState,
    percentage,
    startProgress,
    updateProgress,
    incrementProgress,
    setStage,
    completeProgress,
    stopProgress,
    withProgress,
  };
}

/**
 * 全局加载状态组合式函数
 */
export function useGlobalLoading() {
  const loadingStore = useLoadingStore();

  return {
    isLoading: computed(() => loadingStore.isLoading),
    loadingCount: computed(() => loadingStore.loadingCount),
    activeLoadings: computed(() => loadingStore.activeLoadings),
    activeProgresses: computed(() => loadingStore.activeProgresses),
    globalLoading: computed(() => loadingStore.globalLoading),
    globalMessage: computed(() => loadingStore.globalMessage),
    setGlobalLoading: loadingStore.setGlobalLoading,
    clearAllLoading: loadingStore.clearAllLoading,
    clearAllProgress: loadingStore.clearAllProgress,
  };
}