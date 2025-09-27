import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        // 优化的代码分割策略
        manualChunks: (id) => {
          // 第三方库分割
          if (id.includes('node_modules')) {
            // Vue 核心库
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
              return 'vue-vendor'
            }
            // UI 组件库
            if (id.includes('ant-design-vue') || id.includes('@ant-design/icons-vue')) {
              return 'ui-vendor'
            }
            // 网络和通信库
            if (id.includes('axios') || id.includes('socket.io-client')) {
              return 'network-vendor'
            }
            // 其他第三方库
            return 'vendor'
          }
          
          // 业务模块分割
          if (id.includes('/src/views/auth/')) {
            return 'auth-pages'
          }
          if (id.includes('/src/views/agents/')) {
            return 'agent-pages'
          }
          if (id.includes('/src/views/brainstorm/')) {
            return 'brainstorm-pages'
          }
          if (id.includes('/src/components/agent/')) {
            return 'agent-components'
          }
          if (id.includes('/src/components/brainstorm/')) {
            return 'brainstorm-components'
          }
          if (id.includes('/src/components/common/')) {
            return 'common-components'
          }
        },
        // 优化文件命名
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            if (facadeModuleId.includes('views')) {
              return 'pages/[name]-[hash].js'
            }
            if (facadeModuleId.includes('components')) {
              return 'components/[name]-[hash].js'
            }
          }
          return 'chunks/[name]-[hash].js'
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          const ext = info[info.length - 1]
          if (/\.(css|scss|sass|less|styl)$/.test(assetInfo.name || '')) {
            return 'css/[name]-[hash].[ext]'
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name || '')) {
            return 'images/[name]-[hash].[ext]'
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name || '')) {
            return 'fonts/[name]-[hash].[ext]'
          }
          return 'assets/[name]-[hash].[ext]'
        },
      },
    },
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 设置 chunk 大小警告限制
    chunkSizeWarningLimit: 1000,
  },
})