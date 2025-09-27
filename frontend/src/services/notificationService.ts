import { ElMessage, ElNotification, ElMessageBox } from 'element-plus';
import type { MessageOptions, NotificationOptions } from 'element-plus';

export interface NotificationConfig {
  title?: string;
  message: string;
  type?: 'success' | 'warning' | 'info' | 'error';
  duration?: number;
  showClose?: boolean;
  dangerouslyUseHTMLString?: boolean;
}

export interface ConfirmConfig {
  title?: string;
  message: string;
  type?: 'warning' | 'info' | 'success' | 'error';
  confirmButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
}

/**
 * 通知服务 - 统一管理用户反馈
 */
export class NotificationService {
  private static messageQueue: Array<() => void> = [];
  private static isProcessing = false;
  private static maxConcurrentMessages = 3;
  private static currentMessageCount = 0;

  /**
   * 显示成功消息
   */
  static success(message: string, duration: number = 3000) {
    this.showMessage({
      message,
      type: 'success',
      duration,
    });
  }

  /**
   * 显示警告消息
   */
  static warning(message: string, duration: number = 4000) {
    this.showMessage({
      message,
      type: 'warning',
      duration,
    });
  }

  /**
   * 显示信息消息
   */
  static info(message: string, duration: number = 3000) {
    this.showMessage({
      message,
      type: 'info',
      duration,
    });
  }

  /**
   * 显示错误消息
   */
  static error(message: string, duration: number = 5000) {
    this.showMessage({
      message,
      type: 'error',
      duration,
    });
  }

  /**
   * 显示加载消息
   */
  static loading(message: string = '加载中...') {
    return ElMessage({
      message,
      type: 'info',
      duration: 0,
      showClose: true,
      iconClass: 'el-icon-loading',
    });
  }

  /**
   * 显示消息（带队列管理）
   */
  private static showMessage(config: NotificationConfig) {
    const messageAction = () => {
      this.currentMessageCount++;
      
      const messageInstance = ElMessage({
        ...config,
        onClose: () => {
          this.currentMessageCount--;
          this.processMessageQueue();
        },
      });

      return messageInstance;
    };

    if (this.currentMessageCount >= this.maxConcurrentMessages) {
      this.messageQueue.push(messageAction);
    } else {
      messageAction();
    }
  }

  /**
   * 处理消息队列
   */
  private static processMessageQueue() {
    if (this.messageQueue.length > 0 && this.currentMessageCount < this.maxConcurrentMessages) {
      const nextMessage = this.messageQueue.shift();
      if (nextMessage) {
        nextMessage();
      }
    }
  }

  /**
   * 显示通知
   */
  static notify(config: NotificationConfig) {
    return ElNotification({
      title: config.title,
      message: config.message,
      type: config.type || 'info',
      duration: config.duration || 4500,
      showClose: config.showClose !== false,
      dangerouslyUseHTMLString: config.dangerouslyUseHTMLString || false,
    });
  }

  /**
   * 显示成功通知
   */
  static notifySuccess(title: string, message: string, duration: number = 4000) {
    return this.notify({
      title,
      message,
      type: 'success',
      duration,
    });
  }

  /**
   * 显示警告通知
   */
  static notifyWarning(title: string, message: string, duration: number = 5000) {
    return this.notify({
      title,
      message,
      type: 'warning',
      duration,
    });
  }

  /**
   * 显示错误通知
   */
  static notifyError(title: string, message: string, duration: number = 6000) {
    return this.notify({
      title,
      message,
      type: 'error',
      duration,
    });
  }

  /**
   * 显示信息通知
   */
  static notifyInfo(title: string, message: string, duration: number = 4000) {
    return this.notify({
      title,
      message,
      type: 'info',
      duration,
    });
  }

  /**
   * 显示确认对话框
   */
  static async confirm(config: ConfirmConfig): Promise<boolean> {
    try {
      await ElMessageBox.confirm(
        config.message,
        config.title || '确认操作',
        {
          confirmButtonText: config.confirmButtonText || '确定',
          cancelButtonText: config.cancelButtonText || '取消',
          type: config.type || 'warning',
          showCancelButton: config.showCancelButton !== false,
        }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 显示警告确认对话框
   */
  static async confirmWarning(message: string, title: string = '警告'): Promise<boolean> {
    return this.confirm({
      title,
      message,
      type: 'warning',
    });
  }

  /**
   * 显示删除确认对话框
   */
  static async confirmDelete(itemName: string = '此项'): Promise<boolean> {
    return this.confirm({
      title: '确认删除',
      message: `确定要删除${itemName}吗？此操作不可撤销。`,
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    });
  }

  /**
   * 显示输入对话框
   */
  static async prompt(
    message: string,
    title: string = '请输入',
    defaultValue: string = ''
  ): Promise<string | null> {
    try {
      const { value } = await ElMessageBox.prompt(message, title, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: defaultValue,
      });
      return value;
    } catch {
      return null;
    }
  }

  /**
   * 显示操作成功反馈
   */
  static operationSuccess(operation: string, item?: string) {
    const message = item ? `${operation}${item}成功` : `${operation}成功`;
    this.success(message);
  }

  /**
   * 显示操作失败反馈
   */
  static operationError(operation: string, item?: string, error?: string) {
    const baseMessage = item ? `${operation}${item}失败` : `${operation}失败`;
    const message = error ? `${baseMessage}: ${error}` : baseMessage;
    this.error(message);
  }

  /**
   * 显示网络状态变化通知
   */
  static networkStatusChange(isOnline: boolean) {
    if (isOnline) {
      this.notifySuccess('网络连接', '网络连接已恢复', 3000);
    } else {
      this.notifyWarning('网络连接', '网络连接已断开，请检查网络设置', 0);
    }
  }

  /**
   * 显示保存状态反馈
   */
  static saveStatus(success: boolean, autoSave: boolean = false) {
    if (success) {
      const message = autoSave ? '已自动保存' : '保存成功';
      this.success(message, 2000);
    } else {
      const message = autoSave ? '自动保存失败' : '保存失败';
      this.error(message);
    }
  }

  /**
   * 显示复制成功反馈
   */
  static copySuccess(content: string = '内容') {
    this.success(`${content}已复制到剪贴板`);
  }

  /**
   * 显示上传进度通知
   */
  static uploadProgress(filename: string, progress: number) {
    return this.notify({
      title: '文件上传',
      message: `正在上传 ${filename}... ${progress}%`,
      type: 'info',
      duration: 0,
    });
  }

  /**
   * 显示批量操作结果
   */
  static batchOperationResult(
    operation: string,
    total: number,
    success: number,
    failed: number
  ) {
    if (failed === 0) {
      this.notifySuccess(
        '批量操作完成',
        `${operation}完成，共处理 ${total} 项，全部成功`
      );
    } else {
      this.notifyWarning(
        '批量操作完成',
        `${operation}完成，共处理 ${total} 项，成功 ${success} 项，失败 ${failed} 项`
      );
    }
  }

  /**
   * 清除所有消息
   */
  static clearAll() {
    ElMessage.closeAll();
    this.messageQueue = [];
    this.currentMessageCount = 0;
  }

  /**
   * 设置最大并发消息数
   */
  static setMaxConcurrentMessages(count: number) {
    this.maxConcurrentMessages = Math.max(1, count);
  }
}

// 导出便捷方法
export const notify = NotificationService;
export default NotificationService;