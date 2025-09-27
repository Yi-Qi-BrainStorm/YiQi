/**
 * 生产环境配置管理器
 */
export class ProductionConfigManager {
  private static instance: ProductionConfigManager;
  private config: ProductionConfig = {};

  private constructor() {
    this.initializeConfig();
  }

  static getInstance(): ProductionConfigManager {
    if (!ProductionConfigManager.instance) {
      ProductionConfigManager.instance = new ProductionConfigManager();
    }
    return ProductionConfigManager.instance;
  }

  /**
   * 初始化生产环境配置
   */
  private initializeConfig(): void {
    this.config = {
      // API配置
      api: {
        baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
        timeout: 30000,
        retryAttempts: 3,
        enableMocking: false
      },

      // 缓存配置
      cache: {
        enableServiceWorker: true,
        cacheVersion: 'v1.0.0',
        staticCacheExpiry: 24 * 60 * 60 * 1000, // 24小时
        apiCacheExpiry: 5 * 60 * 1000, // 5分钟
        maxCacheSize: 50 * 1024 * 1024 // 50MB
      },

      // 性能配置
      performance: {
        enableLazyLoading: true,
        enableCodeSplitting: true,
        enablePreloading: true,
        chunkSizeLimit: 500 * 1024, // 500KB
        enableCompression: true,
        enableMinification: true
      },

      // 监控配置
      monitoring: {
        enableErrorTracking: true,
        enablePerformanceTracking: true,
        enableUserTracking: false,
        sampleRate: 0.1, // 10%采样率
        enableConsoleLogging: false
      },

      // 安全配置
      security: {
        enableCSP: true,
        enableHTTPS: true,
        enableSRI: true, // Subresource Integrity
        tokenExpiry: 24 * 60 * 60 * 1000, // 24小时
        enableXSSProtection: true
      },

      // 构建配置
      build: {
        enableSourceMaps: false,
        enableTreeShaking: true,
        enableDeadCodeElimination: true,
        targetBrowsers: ['> 1%', 'last 2 versions', 'not dead'],
        outputFormat: 'es2020'
      },

      // 部署配置
      deployment: {
        environment: 'production',
        cdnUrl: import.meta.env.VITE_CDN_URL || '',
        staticAssetsPath: '/assets/',
        enableGzip: true,
        enableBrotli: true,
        cacheControl: 'public, max-age=31536000' // 1年
      }
    };
  }

  /**
   * 获取配置
   */
  getConfig(): ProductionConfig {
    return { ...this.config };
  }

  /**
   * 获取API配置
   */
  getApiConfig(): ApiConfig {
    return { ...this.config.api };
  }

  /**
   * 获取缓存配置
   */
  getCacheConfig(): CacheConfig {
    return { ...this.config.cache };
  }

  /**
   * 获取性能配置
   */
  getPerformanceConfig(): PerformanceConfig {
    return { ...this.config.performance };
  }

  /**
   * 获取监控配置
   */
  getMonitoringConfig(): MonitoringConfig {
    return { ...this.config.monitoring };
  }

  /**
   * 获取安全配置
   */
  getSecurityConfig(): SecurityConfig {
    return { ...this.config.security };
  }

  /**
   * 获取构建配置
   */
  getBuildConfig(): BuildConfig {
    return { ...this.config.build };
  }

  /**
   * 获取部署配置
   */
  getDeploymentConfig(): DeploymentConfig {
    return { ...this.config.deployment };
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<ProductionConfig>): void {
    this.config = {
      ...this.config,
      ...updates
    };
  }

  /**
   * 验证配置
   */
  validateConfig(): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证API配置
    if (!this.config.api.baseUrl) {
      errors.push('API基础URL未配置');
    }

    if (this.config.api.timeout < 5000) {
      warnings.push('API超时时间可能过短');
    }

    // 验证缓存配置
    if (this.config.cache.maxCacheSize > 100 * 1024 * 1024) {
      warnings.push('缓存大小限制可能过大');
    }

    // 验证性能配置
    if (this.config.performance.chunkSizeLimit > 1024 * 1024) {
      warnings.push('代码块大小限制可能过大');
    }

    // 验证安全配置
    if (!this.config.security.enableHTTPS && this.config.deployment.environment === 'production') {
      errors.push('生产环境必须启用HTTPS');
    }

    if (!this.config.security.enableCSP) {
      warnings.push('建议启用内容安全策略(CSP)');
    }

    // 验证构建配置
    if (this.config.build.enableSourceMaps && this.config.deployment.environment === 'production') {
      warnings.push('生产环境不建议启用源码映射');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 生成Vite配置
   */
  generateViteConfig(): ViteConfigOptions {
    const config = this.config;

    return {
      build: {
        target: config.build.outputFormat,
        sourcemap: config.build.enableSourceMaps,
        minify: config.performance.enableMinification ? 'terser' : false,
        rollupOptions: {
          output: {
            manualChunks: config.performance.enableCodeSplitting ? {
              vendor: ['vue', 'vue-router', 'pinia'],
              ui: ['ant-design-vue'],
              utils: ['axios', 'lodash-es']
            } : undefined,
            chunkFileNames: 'assets/js/[name]-[hash].js',
            entryFileNames: 'assets/js/[name]-[hash].js',
            assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
          }
        },
        chunkSizeWarningLimit: config.performance.chunkSizeLimit / 1024 // 转换为KB
      },
      server: {
        proxy: {
          '/api': {
            target: config.api.baseUrl,
            changeOrigin: true,
            secure: config.security.enableHTTPS
          }
        }
      },
      define: {
        __PRODUCTION__: config.deployment.environment === 'production',
        __ENABLE_MONITORING__: config.monitoring.enableErrorTracking,
        __API_BASE_URL__: JSON.stringify(config.api.baseUrl),
        __CDN_URL__: JSON.stringify(config.deployment.cdnUrl)
      }
    };
  }

  /**
   * 生成Service Worker配置
   */
  generateServiceWorkerConfig(): ServiceWorkerConfig {
    const config = this.config;

    return {
      enabled: config.cache.enableServiceWorker,
      cacheVersion: config.cache.cacheVersion,
      staticCacheExpiry: config.cache.staticCacheExpiry,
      apiCacheExpiry: config.cache.apiCacheExpiry,
      maxCacheSize: config.cache.maxCacheSize,
      cacheStrategies: {
        static: 'CacheFirst',
        api: 'NetworkFirst',
        images: 'CacheFirst'
      },
      precacheManifest: [
        '/',
        '/index.html',
        '/assets/css/main.css',
        '/assets/js/main.js'
      ]
    };
  }

  /**
   * 生成安全头配置
   */
  generateSecurityHeaders(): SecurityHeaders {
    const config = this.config;

    const headers: SecurityHeaders = {};

    if (config.security.enableCSP) {
      headers['Content-Security-Policy'] = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' " + config.api.baseUrl,
        "frame-ancestors 'none'"
      ].join('; ');
    }

    if (config.security.enableXSSProtection) {
      headers['X-XSS-Protection'] = '1; mode=block';
      headers['X-Content-Type-Options'] = 'nosniff';
      headers['X-Frame-Options'] = 'DENY';
    }

    if (config.security.enableHTTPS) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
    }

    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()';

    return headers;
  }

  /**
   * 生成部署脚本
   */
  generateDeploymentScript(): string {
    const config = this.config;

    return `#!/bin/bash
# 自动生成的部署脚本

echo "🚀 开始部署到生产环境..."

# 1. 构建项目
echo "📦 构建项目..."
npm run build

# 2. 压缩资源
if [ "${config.deployment.enableGzip}" = "true" ]; then
  echo "🗜️ 启用Gzip压缩..."
  find dist -type f \\( -name "*.js" -o -name "*.css" -o -name "*.html" \\) -exec gzip -k {} \\;
fi

if [ "${config.deployment.enableBrotli}" = "true" ]; then
  echo "🗜️ 启用Brotli压缩..."
  find dist -type f \\( -name "*.js" -o -name "*.css" -o -name "*.html" \\) -exec brotli -k {} \\;
fi

# 3. 设置缓存头
echo "💾 配置缓存策略..."
# 这里需要根据具体的Web服务器配置

# 4. 部署到CDN（如果配置了CDN）
${config.deployment.cdnUrl ? `
echo "🌐 部署到CDN..."
# aws s3 sync dist/ s3://your-bucket/ --delete
# 或其他CDN部署命令
` : ''}

echo "✅ 部署完成！"
`;
  }

  /**
   * 生成配置报告
   */
  generateConfigReport(): string {
    const validation = this.validateConfig();
    
    let report = '\n=== 生产环境配置报告 ===\n';
    report += `生成时间: ${new Date().toISOString()}\n`;
    report += `环境: ${this.config.deployment.environment}\n\n`;

    // 配置验证结果
    report += '=== 配置验证 ===\n';
    report += `状态: ${validation.valid ? '✅ 通过' : '❌ 失败'}\n`;
    
    if (validation.errors.length > 0) {
      report += '\n错误:\n';
      validation.errors.forEach((error, index) => {
        report += `  ${index + 1}. ${error}\n`;
      });
    }

    if (validation.warnings.length > 0) {
      report += '\n警告:\n';
      validation.warnings.forEach((warning, index) => {
        report += `  ${index + 1}. ${warning}\n`;
      });
    }

    // 配置详情
    report += '\n=== 配置详情 ===\n';
    report += `API地址: ${this.config.api.baseUrl}\n`;
    report += `缓存策略: ${this.config.cache.enableServiceWorker ? '启用' : '禁用'}\n`;
    report += `代码分割: ${this.config.performance.enableCodeSplitting ? '启用' : '禁用'}\n`;
    report += `错误监控: ${this.config.monitoring.enableErrorTracking ? '启用' : '禁用'}\n`;
    report += `HTTPS: ${this.config.security.enableHTTPS ? '启用' : '禁用'}\n`;
    report += `CSP: ${this.config.security.enableCSP ? '启用' : '禁用'}\n`;
    report += `源码映射: ${this.config.build.enableSourceMaps ? '启用' : '禁用'}\n`;

    return report;
  }
}

// 类型定义
export interface ProductionConfig {
  api?: ApiConfig;
  cache?: CacheConfig;
  performance?: PerformanceConfig;
  monitoring?: MonitoringConfig;
  security?: SecurityConfig;
  build?: BuildConfig;
  deployment?: DeploymentConfig;
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  enableMocking: boolean;
}

export interface CacheConfig {
  enableServiceWorker: boolean;
  cacheVersion: string;
  staticCacheExpiry: number;
  apiCacheExpiry: number;
  maxCacheSize: number;
}

export interface PerformanceConfig {
  enableLazyLoading: boolean;
  enableCodeSplitting: boolean;
  enablePreloading: boolean;
  chunkSizeLimit: number;
  enableCompression: boolean;
  enableMinification: boolean;
}

export interface MonitoringConfig {
  enableErrorTracking: boolean;
  enablePerformanceTracking: boolean;
  enableUserTracking: boolean;
  sampleRate: number;
  enableConsoleLogging: boolean;
}

export interface SecurityConfig {
  enableCSP: boolean;
  enableHTTPS: boolean;
  enableSRI: boolean;
  tokenExpiry: number;
  enableXSSProtection: boolean;
}

export interface BuildConfig {
  enableSourceMaps: boolean;
  enableTreeShaking: boolean;
  enableDeadCodeElimination: boolean;
  targetBrowsers: string[];
  outputFormat: string;
}

export interface DeploymentConfig {
  environment: string;
  cdnUrl: string;
  staticAssetsPath: string;
  enableGzip: boolean;
  enableBrotli: boolean;
  cacheControl: string;
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ViteConfigOptions {
  build: any;
  server?: any;
  define?: Record<string, any>;
}

export interface ServiceWorkerConfig {
  enabled: boolean;
  cacheVersion: string;
  staticCacheExpiry: number;
  apiCacheExpiry: number;
  maxCacheSize: number;
  cacheStrategies: Record<string, string>;
  precacheManifest: string[];
}

export interface SecurityHeaders {
  [key: string]: string;
}

// 导出单例实例
export const productionConfigManager = ProductionConfigManager.getInstance();