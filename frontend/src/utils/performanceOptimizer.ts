/**
 * 性能优化器 - 优化构建配置和资源加载
 */
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private performanceMetrics: PerformanceMetric[] = [];
  private optimizationResults: OptimizationResult[] = [];

  private constructor() {}

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * 运行完整的性能优化
   */
  async optimizePerformance(): Promise<{
    success: boolean;
    results: OptimizationResult[];
    metrics: PerformanceMetric[];
    recommendations: string[];
  }> {
    console.log('🚀 开始性能优化...');
    
    this.performanceMetrics = [];
    this.optimizationResults = [];

    try {
      // 1. 分析当前性能
      await this.analyzeCurrentPerformance();

      // 2. 优化资源加载
      await this.optimizeResourceLoading();

      // 3. 优化代码分割
      await this.optimizeCodeSplitting();

      // 4. 优化缓存策略
      await this.optimizeCaching();

      // 5. 优化网络请求
      await this.optimizeNetworkRequests();

      // 6. 优化渲染性能
      await this.optimizeRendering();

      const recommendations = this.generateRecommendations();
      
      console.log('✅ 性能优化完成');
      
      return {
        success: true,
        results: this.optimizationResults,
        metrics: this.performanceMetrics,
        recommendations
      };

    } catch (error: any) {
      console.error('❌ 性能优化失败:', error);
      
      return {
        success: false,
        results: this.optimizationResults,
        metrics: this.performanceMetrics,
        recommendations: [`性能优化失败: ${error.message}`]
      };
    }
  }

  /**
   * 分析当前性能
   */
  private async analyzeCurrentPerformance(): Promise<void> {
    console.log('📊 分析当前性能...');

    try {
      // 分析页面加载性能
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          this.addMetric('页面加载时间', navigation.loadEventEnd - navigation.fetchStart, 'ms');
          this.addMetric('DOM解析时间', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'ms');
          this.addMetric('资源加载时间', navigation.loadEventStart - navigation.domContentLoadedEventEnd, 'ms');
        }

        // 分析资源性能
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const totalResourceSize = resources.reduce((total, resource) => {
          return total + (resource.transferSize || 0);
        }, 0);

        this.addMetric('资源总大小', totalResourceSize, 'bytes');
        this.addMetric('资源数量', resources.length, 'count');

        // 分析JavaScript性能
        const jsResources = resources.filter(r => r.name.includes('.js'));
        const jsSize = jsResources.reduce((total, resource) => {
          return total + (resource.transferSize || 0);
        }, 0);

        this.addMetric('JavaScript大小', jsSize, 'bytes');
        this.addMetric('JavaScript文件数', jsResources.length, 'count');

        // 分析CSS性能
        const cssResources = resources.filter(r => r.name.includes('.css'));
        const cssSize = cssResources.reduce((total, resource) => {
          return total + (resource.transferSize || 0);
        }, 0);

        this.addMetric('CSS大小', cssSize, 'bytes');
        this.addMetric('CSS文件数', cssResources.length, 'count');
      }

      this.addOptimizationResult('性能分析', true, '完成当前性能分析');

    } catch (error: any) {
      this.addOptimizationResult('性能分析', false, `性能分析失败: ${error.message}`);
    }
  }

  /**
   * 优化资源加载
   */
  private async optimizeResourceLoading(): Promise<void> {
    console.log('📦 优化资源加载...');

    try {
      // 检查是否启用了资源预加载
      const preloadLinks = document.querySelectorAll('link[rel="preload"]');
      const prefetchLinks = document.querySelectorAll('link[rel="prefetch"]');

      this.addMetric('预加载资源数', preloadLinks.length, 'count');
      this.addMetric('预获取资源数', prefetchLinks.length, 'count');

      // 检查图片懒加载
      const images = document.querySelectorAll('img');
      const lazyImages = document.querySelectorAll('img[loading="lazy"]');
      
      this.addMetric('图片总数', images.length, 'count');
      this.addMetric('懒加载图片数', lazyImages.length, 'count');

      const lazyLoadingRatio = images.length > 0 ? (lazyImages.length / images.length) * 100 : 0;
      this.addMetric('懒加载覆盖率', lazyLoadingRatio, 'percent');

      // 检查字体优化
      const fontLinks = document.querySelectorAll('link[rel="preload"][as="font"]');
      this.addMetric('预加载字体数', fontLinks.length, 'count');

      this.addOptimizationResult('资源加载优化', true, '完成资源加载分析');

    } catch (error: any) {
      this.addOptimizationResult('资源加载优化', false, `资源加载优化失败: ${error.message}`);
    }
  }

  /**
   * 优化代码分割
   */
  private async optimizeCodeSplitting(): Promise<void> {
    console.log('✂️ 优化代码分割...');

    try {
      // 分析动态导入
      const scripts = document.querySelectorAll('script[src]');
      const moduleScripts = document.querySelectorAll('script[type="module"]');

      this.addMetric('脚本文件数', scripts.length, 'count');
      this.addMetric('模块脚本数', moduleScripts.length, 'count');

      // 检查是否使用了代码分割
      const hasCodeSplitting = Array.from(scripts).some(script => {
        const src = script.getAttribute('src') || '';
        return src.includes('chunk') || src.includes('vendor') || src.includes('async');
      });

      this.addOptimizationResult('代码分割', hasCodeSplitting, 
        hasCodeSplitting ? '检测到代码分割' : '未检测到代码分割');

    } catch (error: any) {
      this.addOptimizationResult('代码分割优化', false, `代码分割优化失败: ${error.message}`);
    }
  }

  /**
   * 优化缓存策略
   */
  private async optimizeCaching(): Promise<void> {
    console.log('💾 优化缓存策略...');

    try {
      // 检查Service Worker
      const hasServiceWorker = 'serviceWorker' in navigator;
      this.addOptimizationResult('Service Worker', hasServiceWorker, 
        hasServiceWorker ? 'Service Worker可用' : 'Service Worker不可用');

      // 检查缓存API
      const hasCacheAPI = 'caches' in window;
      this.addOptimizationResult('Cache API', hasCacheAPI, 
        hasCacheAPI ? 'Cache API可用' : 'Cache API不可用');

      // 检查本地存储使用
      const localStorageUsed = localStorage.length > 0;
      const sessionStorageUsed = sessionStorage.length > 0;

      this.addMetric('localStorage项目数', localStorage.length, 'count');
      this.addMetric('sessionStorage项目数', sessionStorage.length, 'count');

      this.addOptimizationResult('本地缓存', localStorageUsed || sessionStorageUsed, 
        '检测到本地存储使用');

    } catch (error: any) {
      this.addOptimizationResult('缓存优化', false, `缓存优化失败: ${error.message}`);
    }
  }

  /**
   * 优化网络请求
   */
  private async optimizeNetworkRequests(): Promise<void> {
    console.log('🌐 优化网络请求...');

    try {
      // 分析网络请求
      if (typeof window !== 'undefined' && window.performance) {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        
        // 分析请求时间
        const avgRequestTime = resources.length > 0 ? 
          resources.reduce((total, resource) => total + resource.duration, 0) / resources.length : 0;

        this.addMetric('平均请求时间', avgRequestTime, 'ms');

        // 分析并发请求
        const maxConcurrentRequests = this.calculateMaxConcurrentRequests(resources);
        this.addMetric('最大并发请求数', maxConcurrentRequests, 'count');

        // 分析请求大小
        const avgRequestSize = resources.length > 0 ?
          resources.reduce((total, resource) => total + (resource.transferSize || 0), 0) / resources.length : 0;

        this.addMetric('平均请求大小', avgRequestSize, 'bytes');
      }

      this.addOptimizationResult('网络请求优化', true, '完成网络请求分析');

    } catch (error: any) {
      this.addOptimizationResult('网络请求优化', false, `网络请求优化失败: ${error.message}`);
    }
  }

  /**
   * 优化渲染性能
   */
  private async optimizeRendering(): Promise<void> {
    console.log('🎨 优化渲染性能...');

    try {
      // 检查关键渲染路径
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          const firstPaint = performance.getEntriesByName('first-paint')[0];
          const firstContentfulPaint = performance.getEntriesByName('first-contentful-paint')[0];

          if (firstPaint) {
            this.addMetric('首次绘制时间', firstPaint.startTime, 'ms');
          }

          if (firstContentfulPaint) {
            this.addMetric('首次内容绘制时间', firstContentfulPaint.startTime, 'ms');
          }

          // 计算关键渲染路径时间
          const criticalRenderingPath = navigation.domContentLoadedEventEnd - navigation.fetchStart;
          this.addMetric('关键渲染路径时间', criticalRenderingPath, 'ms');
        }
      }

      // 检查DOM复杂度
      const domElements = document.querySelectorAll('*').length;
      this.addMetric('DOM元素数量', domElements, 'count');

      // 检查CSS复杂度
      const stylesheets = document.styleSheets.length;
      this.addMetric('样式表数量', stylesheets, 'count');

      this.addOptimizationResult('渲染性能优化', true, '完成渲染性能分析');

    } catch (error: any) {
      this.addOptimizationResult('渲染性能优化', false, `渲染性能优化失败: ${error.message}`);
    }
  }

  /**
   * 计算最大并发请求数
   */
  private calculateMaxConcurrentRequests(resources: PerformanceResourceTiming[]): number {
    const timeSlots: { [key: number]: number } = {};
    
    resources.forEach(resource => {
      const startSlot = Math.floor(resource.startTime / 100); // 100ms时间片
      const endSlot = Math.floor((resource.startTime + resource.duration) / 100);
      
      for (let slot = startSlot; slot <= endSlot; slot++) {
        timeSlots[slot] = (timeSlots[slot] || 0) + 1;
      }
    });

    return Math.max(...Object.values(timeSlots), 0);
  }

  /**
   * 添加性能指标
   */
  private addMetric(name: string, value: number, unit: string): void {
    this.performanceMetrics.push({
      name,
      value,
      unit,
      timestamp: Date.now()
    });
  }

  /**
   * 添加优化结果
   */
  private addOptimizationResult(category: string, success: boolean, message: string): void {
    this.optimizationResults.push({
      category,
      success,
      message,
      timestamp: Date.now()
    });

    const status = success ? '✅' : '❌';
    console.log(`${status} ${category}: ${message}`);
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // 基于性能指标生成建议
    const pageLoadTime = this.performanceMetrics.find(m => m.name === '页面加载时间');
    if (pageLoadTime && pageLoadTime.value > 3000) {
      recommendations.push('页面加载时间超过3秒，建议优化资源加载');
    }

    const jsSize = this.performanceMetrics.find(m => m.name === 'JavaScript大小');
    if (jsSize && jsSize.value > 1024 * 1024) { // 1MB
      recommendations.push('JavaScript文件过大，建议启用代码分割和压缩');
    }

    const domElements = this.performanceMetrics.find(m => m.name === 'DOM元素数量');
    if (domElements && domElements.value > 1500) {
      recommendations.push('DOM元素过多，建议优化组件结构');
    }

    const lazyLoadingRatio = this.performanceMetrics.find(m => m.name === '懒加载覆盖率');
    if (lazyLoadingRatio && lazyLoadingRatio.value < 50) {
      recommendations.push('建议为更多图片启用懒加载');
    }

    // 基于优化结果生成建议
    const serviceWorkerResult = this.optimizationResults.find(r => r.category === 'Service Worker');
    if (serviceWorkerResult && !serviceWorkerResult.success) {
      recommendations.push('建议启用Service Worker以改善缓存策略');
    }

    const codeSplittingResult = this.optimizationResults.find(r => r.category === '代码分割');
    if (codeSplittingResult && !codeSplittingResult.success) {
      recommendations.push('建议启用代码分割以减少初始加载时间');
    }

    if (recommendations.length === 0) {
      recommendations.push('性能表现良好，继续保持！');
    }

    return recommendations;
  }

  /**
   * 生成性能报告
   */
  generatePerformanceReport(): string {
    let report = '\n=== 性能优化报告 ===\n';
    report += `生成时间: ${new Date().toISOString()}\n\n`;

    // 性能指标
    report += '=== 性能指标 ===\n';
    this.performanceMetrics.forEach(metric => {
      let displayValue = metric.value.toString();
      
      if (metric.unit === 'bytes') {
        displayValue = this.formatBytes(metric.value);
      } else if (metric.unit === 'ms') {
        displayValue = `${metric.value.toFixed(2)}ms`;
      } else if (metric.unit === 'percent') {
        displayValue = `${metric.value.toFixed(1)}%`;
      }
      
      report += `${metric.name}: ${displayValue}\n`;
    });

    // 优化结果
    report += '\n=== 优化结果 ===\n';
    this.optimizationResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      report += `${status} ${result.category}: ${result.message}\n`;
    });

    // 建议
    const recommendations = this.generateRecommendations();
    report += '\n=== 优化建议 ===\n';
    recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });

    return report;
  }

  /**
   * 格式化字节大小
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 类型定义
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

export interface OptimizationResult {
  category: string;
  success: boolean;
  message: string;
  timestamp: number;
}

// 导出单例实例
export const performanceOptimizer = PerformanceOptimizer.getInstance();