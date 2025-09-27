import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface LoadingState {
  id: string;
  message: string;
  progress?: number;
  cancelable?: boolean;
  startTime: number;
}

export interface ProgressState {
  current: number;
  total: number;
  message?: string;
  stage?: string;
}

/**
 * 全局加载状态管理
 */
export const useLoadingStore = defineStore('loading', () => {
  // 加载状态映射
  const loadingStates = ref<Map<string, LoadingState>>(new Map());
  
  // 进度状态映射
  const progressStates = ref<Map<string, ProgressState>>(new Map());
  
  // 全局加载状态
  const globalLoading = ref(false);
  const globalMessage = ref('');

  // 计算属性
  const isLoading = computed(() => loadingStates.value.size > 0 || globalLoading.value);
  const loadingCount = computed(() => loadingStates.value.size);
  const activeLoadings = computed(() => Array.from(loadingStates.value.values()));
  const activeProgresses = computed(() => Array.from(progressStates.value.values()));

  /**
   * 开始加载
   */
  const startLoading = (
    id: string,
    message: string = '加载中...',
    options?: {
      progress?: number;
      cancelable?: boolean;
    }
  ) => {
    const loadingState: LoadingState = {
      id,
      message,
      progress: options?.progress,
      cancelable: options?.cancelable || false,
      startTime: Date.now(),
    };
    
    loadingStates.value.set(id, loadingState);
  };

  /**
   * 更新加载状态
   */
  const updateLoading = (
    id: string,
    updates: Partial<Pick<LoadingState, 'message' | 'progress'>>
  ) => {
    const existing = loadingStates.value.get(id);
    if (existing) {
      loadingStates.value.set(id, {
        ...existing,
        ...updates,
      });
    }
  };

  /**
   * 停止加载
   */
  const stopLoading = (id: string) => {
    loadingStates.value.delete(id);
  };

  /**
   * 清除所有加载状态
   */
  const clearAllLoading = () => {
    loadingStates.value.clear();
  };

  /**
   * 设置全局加载状态
   */
  const setGlobalLoading = (loading: boolean, message: string = '加载中...') => {
    globalLoading.value = loading;
    globalMessage.value = message;
  };

  /**
   * 开始进度跟踪
   */
  const startProgress = (
    id: string,
    total: number,
    message?: string,
    stage?: string
  ) => {
    progressStates.value.set(id, {
      current: 0,
      total,
      message,
      stage,
    });
  };

  /**
   * 更新进度
   */
  const updateProgress = (
    id: string,
    current: number,
    updates?: Partial<Pick<ProgressState, 'message' | 'stage' | 'total'>>
  ) => {
    const existing = progressStates.value.get(id);
    if (existing) {
      progressStates.value.set(id, {
        ...existing,
        current: Math.min(current, existing.total),
        ...updates,
      });
    }
  };

  /**
   * 完成进度
   */
  const completeProgress = (id: string) => {
    const existing = progressStates.value.get(id);
    if (existing) {
      progressStates.value.set(id, {
        ...existing,
        current: existing.total,
      });
      
      // 延迟移除，让用户看到完成状态
      setTimeout(() => {
        progressStates.value.delete(id);
      }, 1000);
    }
  };

  /**
   * 停止进度跟踪
   */
  const stopProgress = (id: string) => {
    progressStates.value.delete(id);
  };

  /**
   * 清除所有进度状态
   */
  const clearAllProgress = () => {
    progressStates.value.clear();
  };

  /**
   * 获取加载状态
   */
  const getLoadingState = (id: string) => {
    return loadingStates.value.get(id);
  };

  /**
   * 获取进度状态
   */
  const getProgressState = (id: string) => {
    return progressStates.value.get(id);
  };

  /**
   * 检查是否正在加载
   */
  const isLoadingById = (id: string) => {
    return loadingStates.value.has(id);
  };

  /**
   * 检查是否有进度跟踪
   */
  const hasProgress = (id: string) => {
    return progressStates.value.has(id);
  };

  /**
   * 获取加载持续时间
   */
  const getLoadingDuration = (id: string) => {
    const state = loadingStates.value.get(id);
    return state ? Date.now() - state.startTime : 0;
  };

  return {
    // 状态
    loadingStates,
    progressStates,
    globalLoading,
    globalMessage,
    
    // 计算属性
    isLoading,
    loadingCount,
    activeLoadings,
    activeProgresses,
    
    // 加载方法
    startLoading,
    updateLoading,
    stopLoading,
    clearAllLoading,
    setGlobalLoading,
    
    // 进度方法
    startProgress,
    updateProgress,
    completeProgress,
    stopProgress,
    clearAllProgress,
    
    // 查询方法
    getLoadingState,
    getProgressState,
    isLoadingById,
    hasProgress,
    getLoadingDuration,
  };
});