/**
 * 错误监控和日志记录系统
 */
export class ErrorMonitoringSystem {
  private static instance: ErrorMonitoringSystem;
  private errorQueue: ErrorReport[] = [];
  private performanceQueue: PerformanceReport[] = [];
  private isInitialized = false;
  private config: MonitoringConfig;

  private constructor() {
    this.config = {
      enableErrorTracking: true,
      enablePerformanceTracking: true,
      enableUserTracking: false,
      sampleRate: 0.1,
      maxQueueSize: 100,
      flushInterval: 30000, // 30秒
      endpoint: '/api/monitoring',
      enableConsoleLogging: import.meta.env.DEV
    };
  }

  static getInstance(): ErrorMonitoringSystem {
    if (!ErrorMonitoringSystem.instance) {
      ErrorMonitoringSystem.instance = new ErrorMonitoringSystem();
    }
    return ErrorMonitoringSystem.instance;
  }

  /**
   * 初始化错误监控系统
   */
  initialize(config?: Partial<MonitoringConfig>): void {
    if (this.isInitialized) return;

    // 更新配置
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // 设置全局错误处理
    this.setupGlobalErrorHandlers();

    // 设置性能监控
    if (this.config.enablePerformanceTracking) {
      this.setupPerformanceMonitoring();
    }

    // 设置定期上报
    this.setupPeriodicReporting();

    this.isInitialized = true;
    console.log('🔍 错误监控系统已初始化');
  }

  /**
   * 设置全局错误处理器
   */
  private setupGlobalErrorHandlers(): void {
    if (!this.config.enableErrorTracking) return;

    // JavaScript错误
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // Promise拒绝错误
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // 资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        this.captureError({
          type: 'resource',
          message: `Failed to load resource: ${target.tagName}`,
          filename: (target as any).src || (target as any).href,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        });
      }
    }, true);

    // Vue错误处理（如果使用Vue）
    if (typeof window !== 'undefined' && (window as any).Vue) {
      (window as any).Vue.config.errorHandler = (error: Error, vm: any, info: string) => {
        this.captureError({
          type: 'vue',
          message: error.message,
          stack: error.stack,
          componentInfo: info,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        });
      };
    }
  }

  /**
   * 设置性能监控
   */
  private setupPerformanceMonitoring(): void {
    // 页面加载性能
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.capturePerformance();
      }, 0);
    });

    // 路由变化性能（SPA）
    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        setTimeout(() => {
          this.captureNavigationPerformance();
        }, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 长任务监控
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.capturePerformanceEntry({
              type: 'longtask',
              name: entry.name,
              startTime: entry.startTime,
              duration: entry.duration,
              timestamp: Date.now()
            });
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Long task monitoring not supported');
      }
    }
  }

  /**
   * 设置定期上报
   */
  private setupPeriodicReporting(): void {
    setInterval(() => {
      this.flushReports();
    }, this.config.flushInterval);

    // 页面卸载时上报
    window.addEventListener('beforeunload', () => {
      this.flushReports(true);
    });

    // 页面隐藏时上报
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushReports();
      }
    });
  }

  /**
   * 捕获错误
   */
  captureError(error: Partial<ErrorReport>): void {
    if (!this.config.enableErrorTracking) return;

    // 采样控制
    if (Math.random() > this.config.sampleRate) return;

    const errorReport: ErrorReport = {
      id: this.generateId(),
      type: error.type || 'unknown',
      message: error.message || 'Unknown error',
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno,
      stack: error.stack,
      componentInfo: error.componentInfo,
      timestamp: error.timestamp || Date.now(),
      url: error.url || window.location.href,
      userAgent: error.userAgent || navigator.userAgent,
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      buildVersion: this.getBuildVersion(),
      environment: import.meta.env.MODE
    };

    this.errorQueue.push(errorReport);

    // 控制台日志
    if (this.config.enableConsoleLogging) {
      console.error('🚨 Error captured:', errorReport);
    }

    // 队列满时立即上报
    if (this.errorQueue.length >= this.config.maxQueueSize) {
      this.flushReports();
    }
  }

  /**
   * 捕获性能数据
   */
  capturePerformance(): void {
    if (!this.config.enablePerformanceTracking) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    const performanceReport: PerformanceReport = {
      id: this.generateId(),
      type: 'navigation',
      url: window.location.href,
      timestamp: Date.now(),
      metrics: {
        // 页面加载时间
        pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoadedTime: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        firstByteTime: navigation.responseStart - navigation.fetchStart,
        
        // 资源时间
        dnsLookupTime: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnectTime: navigation.connectEnd - navigation.connectStart,
        requestTime: navigation.responseEnd - navigation.requestStart,
        
        // 渲染时间
        domParseTime: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        resourceLoadTime: navigation.loadEventStart - navigation.domContentLoadedEventEnd
      },
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      buildVersion: this.getBuildVersion(),
      environment: import.meta.env.MODE
    };

    // 添加Core Web Vitals
    this.addCoreWebVitals(performanceReport);

    this.performanceQueue.push(performanceReport);

    if (this.config.enableConsoleLogging) {
      console.log('📊 Performance captured:', performanceReport);
    }
  }

  /**
   * 捕获导航性能
   */
  captureNavigationPerformance(): void {
    if (!this.config.enablePerformanceTracking) return;

    const performanceReport: PerformanceReport = {
      id: this.generateId(),
      type: 'spa-navigation',
      url: window.location.href,
      timestamp: Date.now(),
      metrics: {
        // SPA导航时间（简化版）
        navigationTime: performance.now()
      },
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      buildVersion: this.getBuildVersion(),
      environment: import.meta.env.MODE
    };

    this.performanceQueue.push(performanceReport);
  }

  /**
   * 捕获性能条目
   */
  capturePerformanceEntry(entry: Partial<PerformanceEntry>): void {
    if (!this.config.enablePerformanceTracking) return;

    const performanceReport: PerformanceReport = {
      id: this.generateId(),
      type: entry.type || 'performance-entry',
      url: window.location.href,
      timestamp: entry.timestamp || Date.now(),
      metrics: {
        name: entry.name,
        startTime: entry.startTime,
        duration: entry.duration
      },
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      buildVersion: this.getBuildVersion(),
      environment: import.meta.env.MODE
    };

    this.performanceQueue.push(performanceReport);
  }

  /**
   * 添加Core Web Vitals
   */
  private addCoreWebVitals(report: PerformanceReport): void {
    // First Contentful Paint
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcp) {
      report.metrics.firstContentfulPaint = fcp.startTime;
    }

    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          report.metrics.largestContentfulPaint = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.warn('LCP monitoring not supported');
      }
    }

    // Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          report.metrics.cumulativeLayoutShift = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('CLS monitoring not supported');
      }
    }
  }

  /**
   * 上报数据
   */
  private async flushReports(isBeforeUnload = false): Promise<void> {
    if (this.errorQueue.length === 0 && this.performanceQueue.length === 0) return;

    const payload = {
      errors: [...this.errorQueue],
      performance: [...this.performanceQueue],
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    };

    // 清空队列
    this.errorQueue = [];
    this.performanceQueue = [];

    try {
      if (isBeforeUnload && 'sendBeacon' in navigator) {
        // 使用sendBeacon确保数据能在页面卸载时发送
        navigator.sendBeacon(
          this.config.endpoint,
          JSON.stringify(payload)
        );
      } else {
        // 正常的fetch请求
        await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (this.config.enableConsoleLogging) {
        console.log('📤 Reports sent:', payload);
      }
    } catch (error) {
      console.error('Failed to send monitoring reports:', error);
      
      // 发送失败时，将数据重新加入队列（避免数据丢失）
      if (!isBeforeUnload) {
        this.errorQueue.unshift(...payload.errors);
        this.performanceQueue.unshift(...payload.performance);
      }
    }
  }

  /**
   * 手动捕获错误
   */
  captureException(error: Error, context?: Record<string, any>): void {
    this.captureError({
      type: 'manual',
      message: error.message,
      stack: error.stack,
      componentInfo: context ? JSON.stringify(context) : undefined
    });
  }

  /**
   * 手动记录性能指标
   */
  captureMetric(name: string, value: number, unit?: string): void {
    this.capturePerformanceEntry({
      type: 'custom-metric',
      name,
      startTime: value,
      duration: 0,
      timestamp: Date.now()
    });
  }

  /**
   * 设置用户信息
   */
  setUser(userId: string, userInfo?: Record<string, any>): void {
    sessionStorage.setItem('monitoring_user_id', userId);
    if (userInfo) {
      sessionStorage.setItem('monitoring_user_info', JSON.stringify(userInfo));
    }
  }

  /**
   * 设置会话信息
   */
  setSession(sessionId: string): void {
    sessionStorage.setItem('monitoring_session_id', sessionId);
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取会话ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('monitoring_session_id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('monitoring_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * 获取用户ID
   */
  private getUserId(): string | undefined {
    return sessionStorage.getItem('monitoring_user_id') || undefined;
  }

  /**
   * 获取构建版本
   */
  private getBuildVersion(): string {
    return import.meta.env.VITE_BUILD_VERSION || 'unknown';
  }

  /**
   * 获取监控统计
   */
  getStats(): MonitoringStats {
    return {
      errorsQueued: this.errorQueue.length,
      performanceQueued: this.performanceQueue.length,
      isInitialized: this.isInitialized,
      config: { ...this.config }
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.flushReports(true);
    this.errorQueue = [];
    this.performanceQueue = [];
    this.isInitialized = false;
  }
}

// 类型定义
export interface MonitoringConfig {
  enableErrorTracking: boolean;
  enablePerformanceTracking: boolean;
  enableUserTracking: boolean;
  sampleRate: number;
  maxQueueSize: number;
  flushInterval: number;
  endpoint: string;
  enableConsoleLogging: boolean;
}

export interface ErrorReport {
  id: string;
  type: string;
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  componentInfo?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  sessionId: string;
  userId?: string;
  buildVersion: string;
  environment: string;
}

export interface PerformanceReport {
  id: string;
  type: string;
  url: string;
  timestamp: number;
  metrics: Record<string, any>;
  sessionId: string;
  userId?: string;
  buildVersion: string;
  environment: string;
}

export interface PerformanceEntry {
  type: string;
  name?: string;
  startTime?: number;
  duration?: number;
  timestamp: number;
}

export interface MonitoringStats {
  errorsQueued: number;
  performanceQueued: number;
  isInitialized: boolean;
  config: MonitoringConfig;
}

// 导出单例实例
export const errorMonitoringSystem = ErrorMonitoringSystem.getInstance();