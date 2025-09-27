import { inject } from 'vue';
import type { ToastAction } from '@/components/common/FeedbackToast.vue';

export interface ToastOptions {
  title?: string;
  duration?: number;
  closable?: boolean;
  showProgress?: boolean;
  actions?: ToastAction[];
}

export interface ToastAPI {
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  loading: (message: string, options?: ToastOptions) => string;
  clear: () => void;
  update: (id: string, updates: any) => void;
}

/**
 * Toast通知组合式函数
 */
export function useToast(): ToastAPI {
  const toast = inject<ToastAPI>('$toast');
  
  if (!toast) {
    // 如果没有注入的toast，提供一个fallback实现
    console.warn('Toast service not available, using console fallback');
    
    return {
      success: (message: string) => {
        console.log('✅ Success:', message);
        return '';
      },
      error: (message: string) => {
        console.error('❌ Error:', message);
        return '';
      },
      warning: (message: string) => {
        console.warn('⚠️ Warning:', message);
        return '';
      },
      info: (message: string) => {
        console.info('ℹ️ Info:', message);
        return '';
      },
      loading: (message: string) => {
        console.log('⏳ Loading:', message);
        return '';
      },
      clear: () => {
        console.log('🧹 Clear all toasts');
      },
      update: (id: string, updates: any) => {
        console.log('🔄 Update toast:', id, updates);
      },
    };
  }
  
  return toast;
}

/**
 * 操作反馈助手
 */
export function useOperationFeedback() {
  const toast = useToast();
  
  /**
   * 显示操作成功反馈
   */
  const success = (operation: string, item?: string, options?: ToastOptions) => {
    const message = item ? `${operation}${item}成功` : `${operation}成功`;
    return toast.success(message, options);
  };
  
  /**
   * 显示操作失败反馈
   */
  const error = (operation: string, item?: string, errorMsg?: string, options?: ToastOptions) => {
    const baseMessage = item ? `${operation}${item}失败` : `${operation}失败`;
    const message = errorMsg ? `${baseMessage}: ${errorMsg}` : baseMessage;
    return toast.error(message, options);
  };
  
  /**
   * 显示操作警告反馈
   */
  const warning = (operation: string, item?: string, warningMsg?: string, options?: ToastOptions) => {
    const baseMessage = item ? `${operation}${item}` : operation;
    const message = warningMsg ? `${baseMessage}: ${warningMsg}` : baseMessage;
    return toast.warning(message, options);
  };
  
  /**
   * 显示保存状态反馈
   */
  const saveStatus = (success: boolean, autoSave: boolean = false, options?: ToastOptions) => {
    if (success) {
      const message = autoSave ? '已自动保存' : '保存成功';
      return toast.success(message, { duration: 2000, ...options });
    } else {
      const message = autoSave ? '自动保存失败' : '保存失败';
      return toast.error(message, options);
    }
  };
  
  /**
   * 显示复制成功反馈
   */
  const copySuccess = (content: string = '内容', options?: ToastOptions) => {
    return toast.success(`${content}已复制到剪贴板`, { duration: 2000, ...options });
  };
  
  /**
   * 显示批量操作结果
   */
  const batchResult = (
    operation: string,
    total: number,
    success: number,
    failed: number,
    options?: ToastOptions
  ) => {
    if (failed === 0) {
      return toast.success(
        `${operation}完成，共处理 ${total} 项，全部成功`,
        options
      );
    } else {
      return toast.warning(
        `${operation}完成，共处理 ${total} 项，成功 ${success} 项，失败 ${failed} 项`,
        options
      );
    }
  };
  
  /**
   * 显示网络状态变化
   */
  const networkStatus = (isOnline: boolean, options?: ToastOptions) => {
    if (isOnline) {
      return toast.success('网络连接已恢复', { duration: 3000, ...options });
    } else {
      return toast.warning('网络连接已断开，请检查网络设置', { duration: 0, ...options });
    }
  };
  
  /**
   * 显示上传进度
   */
  const uploadProgress = (filename: string, progress: number, options?: ToastOptions) => {
    return toast.info(
      `正在上传 ${filename}... ${progress}%`,
      { duration: 0, showProgress: true, ...options }
    );
  };
  
  /**
   * 显示加载状态
   */
  const loading = (message: string = '加载中...', options?: ToastOptions) => {
    return toast.loading(message, options);
  };
  
  /**
   * 显示确认操作反馈
   */
  const confirm = (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: ToastOptions
  ) => {
    const actions: ToastAction[] = [
      {
        key: 'confirm',
        label: '确定',
        type: 'primary',
        handler: onConfirm,
      },
      {
        key: 'cancel',
        label: '取消',
        type: 'default',
        handler: onCancel || (() => {}),
      },
    ];
    
    return toast.warning(message, {
      duration: 0,
      actions,
      ...options,
    });
  };
  
  return {
    success,
    error,
    warning,
    saveStatus,
    copySuccess,
    batchResult,
    networkStatus,
    uploadProgress,
    loading,
    confirm,
    toast,
  };
}