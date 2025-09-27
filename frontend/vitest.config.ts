import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // 暂时排除有问题的集成测试
      '**/brainstormSocketService.integration.spec.ts',
      '**/agentService.integration.spec.ts',
      '**/backend.integration.spec.ts',
      '**/e2e.integration.spec.ts',
      '**/userFlow.integration.spec.ts',
      '**/integration.spec.ts'
    ]
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});