import { message, notification, Modal } from 'ant-design-vue';

export interface NotificationConfig {
  title?: string;
  message: string;
  type?: 'success' | 'warning' | 'info' | 'error';
  duration?: number;
  showClose?: boolean;
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
  private static maxConcurrentMessages = 3;
  private static currentMessageCount = 0;

  /**
   * 显示成功消息
   */
  static success(msg: string, duration: number = 3) {
    message.success(msg, duration);
  }

  /**
   * 显示警告消息
   */
  static warning(msg: string, duration: number = 4) {
    message.warning(msg, duration);
  }

  /**
   * 显示信息消息
   */
  static info(msg: string, duration: number = 3) {
    message.info(msg, duration);
  }

  /**
   * 显示错误消息
   */
  static error(msg: string, duration: number = 5) {
    message.error(msg, duration);
  }

  /**
   * 显示加载消息
   */
  static loading(msg: string = '加载中...') {
    return message.loading(msg, 0);
  }

  /**
   * 显示通知
   */
  static notify(config: NotificationConfig) {
    return notification[config.type || 'info']({
      message: config.title || '通知',
      description: config.message,
      duration: config.duration || 4.5,
    });
  }

  /**
   * 显示成功通知
   */
  static notifySuccess(title: string, msg: string, duration: number = 4) {
    return notification.success({
      message: title,
      description: msg,
      duration,
    });
  }

  /**
   * 显示警告通知
   */
  static notifyWarning(title: string, msg: string, duration: number = 5) {
    return notification.warning({
      message: title,
      description: msg,
      duration,
    });
  }

  /**
   * 显示错误通知
   */
  static notifyError(title: string, msg: string, duration: number = 6) {
    return notification.error({
      message: title,
      description: msg,
      duration,
    });
  }

  /**
   * 显示信息通知
   */
  static notifyInfo(title: string, msg: string, duration: number = 4) {
    return notification.info({
      message: title,
      description: msg,
      duration,
    });
  }

  /**
   * 显示确认对话框
   */
  static async confirm(config: ConfirmConfig): Promise<boolean> {
    return new Promise((resolve) => {
      Modal.confirm({
        title: config.title || '确认操作',
        content: config.message,
        okText: config.confirmButtonText || '确定',
        cancelText: config.cancelButtonText || '取消',
        onOk() {
          resolve(true);
        },
        onCancel() {
          resolve(false);
        },
      });
    });
  }

  /**
   * 显示警告确认对话框
   */
  static async confirmWarning(msg: string, title: string = '警告'): Promise<boolean> {
    return this.confirm({
      title,
      message: msg,
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
   * 显示操作成功反馈
   */
  static operationSuccess(operation: string, item?: string) {
    const msg = item ? `${operation}${item}成功` : `${operation}成功`;
    this.success(msg);
  }

  /**
   * 显示操作失败反馈
   */
  static operationError(operation: string, item?: string, error?: string) {
    const baseMessage = item ? `${operation}${item}失败` : `${operation}失败`;
    const msg = error ? `${baseMessage}: ${error}` : baseMessage;
    this.error(msg);
  }

  /**
   * 显示网络状态变化通知
   */
  static networkStatusChange(isOnline: boolean) {
    if (isOnline) {
      this.notifySuccess('网络连接', '网络连接已恢复', 3);
    } else {
      this.notifyWarning('网络连接', '网络连接已断开，请检查网络设置', 0);
    }
  }

  /**
   * 显示保存状态反馈
   */
  static saveStatus(success: boolean, autoSave: boolean = false) {
    if (success) {
      const msg = autoSave ? '已自动保存' : '保存成功';
      this.success(msg, 2);
    } else {
      const msg = autoSave ? '自动保存失败' : '保存失败';
      this.error(msg);
    }
  }

  /**
   * 显示复制成功反馈
   */
  static copySuccess(content: string = '内容') {
    this.success(`${content}已复制到剪贴板`);
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
    message.destroy();
    notification.destroy();
  }
}

// 导出便捷方法
export const notify = NotificationService;
export default NotificationService;