<template>
  <a-layout class="main-layout">
    <!-- 侧边栏 -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      class="layout-sider"
      :width="256"
      :collapsed-width="80"
    >
      <Sidebar :collapsed="collapsed" />
    </a-layout-sider>

    <!-- 主内容区 -->
    <a-layout class="layout-content">
      <!-- 顶部导航 -->
      <a-layout-header class="layout-header">
        <Header :collapsed="collapsed" @toggle-sidebar="handleToggleSidebar" />
      </a-layout-header>

      <!-- 页面内容 -->
      <a-layout-content class="page-content">
        <div class="content-wrapper">
          <!-- 页面加载状态 -->
          <a-spin :spinning="pageLoading" size="large" class="page-loading">
            <router-view v-slot="{ Component, route }">
              <transition name="page-fade" mode="out-in">
                <keep-alive :include="keepAliveComponents">
                  <component :is="Component" :key="route.path" />
                </keep-alive>
              </transition>
            </router-view>
          </a-spin>
        </div>
      </a-layout-content>

      <!-- 页脚 -->
      <a-layout-footer class="layout-footer">
        <div class="footer-content">
          <div class="footer-left">
            <span>© 2024 AI头脑风暴平台. All rights reserved.</span>
          </div>
          <div class="footer-right">
            <a href="#" class="footer-link">帮助文档</a>
            <a-divider type="vertical" />
            <a href="#" class="footer-link">意见反馈</a>
            <a-divider type="vertical" />
            <a href="#" class="footer-link">关于我们</a>
          </div>
        </div>
      </a-layout-footer>
    </a-layout>

    <!-- 回到顶部按钮 -->
    <a-back-top :visibility-height="300" />
  </a-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePageTitle } from '@/composables/usePageTitle'
import Header from './Header.vue'
import Sidebar from './Sidebar.vue'

const route = useRoute()
const { watchRouteTitle } = usePageTitle()

// 布局状态
const collapsed = ref(false)
const pageLoading = ref(false)

// 需要缓存的组件
const keepAliveComponents = ref([
  'Dashboard',
  'AgentManagement',
  'BrainstormHistory'
])

// 切换侧边栏
const handleToggleSidebar = () => {
  collapsed.value = !collapsed.value
}

// 监听路由变化显示加载状态
watch(
  () => route.path,
  () => {
    pageLoading.value = true
    // 模拟页面加载时间
    setTimeout(() => {
      pageLoading.value = false
    }, 300)
  }
)

// 响应式处理
const handleResize = () => {
  const width = window.innerWidth
  if (width < 768) {
    collapsed.value = true
  }
}

onMounted(() => {
  // 启动页面标题监听
  watchRouteTitle()
  
  // 初始化响应式
  handleResize()
  window.addEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.main-layout {
  min-height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text-primary);
}

.layout-sider {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: var(--z-index-fixed);
  box-shadow: var(--shadow-lg);
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
  transition: all var(--transition-base);

  @include mobile-only {
    transform: translateX(-100%);
    z-index: var(--z-index-modal);
    
    &:not(.ant-layout-sider-collapsed) {
      transform: translateX(0);
    }
  }
}

.layout-content {
  margin-left: 256px;
  transition: margin-left var(--transition-base);
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  @include mobile-only {
    margin-left: 0;
  }
}

.layout-sider.ant-layout-sider-collapsed + .layout-content {
  margin-left: 80px;

  @include mobile-only {
    margin-left: 0;
  }
}

.layout-header {
  position: sticky;
  top: 0;
  z-index: var(--z-index-sticky);
  padding: 0;
  height: 64px;
  line-height: 64px;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
  transition: all var(--transition-base);

  @include mobile-only {
    position: relative;
    box-shadow: var(--shadow-base);
  }
}

.page-content {
  flex: 1;
  min-height: calc(100vh - 64px - 70px);
  background-color: var(--color-background-secondary);
  padding: var(--spacing-6);
  transition: background-color var(--transition-base);

  @include mobile-only {
    padding: var(--spacing-4);
    min-height: calc(100vh - 64px - 90px);
  }

  @include tablet-up {
    padding: var(--spacing-8);
  }
}

.content-wrapper {
  position: relative;
  min-height: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.page-loading {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  :deep(.ant-spin-dot) {
    color: var(--color-primary-500);
  }
}

.layout-footer {
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: var(--spacing-4) var(--spacing-6);
  margin-top: auto;
  transition: all var(--transition-base);

  @include mobile-only {
    padding: var(--spacing-4);
  }
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;

  @include mobile-only {
    flex-direction: column;
    gap: var(--spacing-2);
    text-align: center;
  }
}

.footer-left {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.footer-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);

  @include mobile-only {
    justify-content: center;
  }
}

.footer-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  transition: color var(--transition-fast);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-base);

  &:hover {
    color: var(--color-primary-600);
    background-color: var(--color-surface-hover);
  }

  &:focus {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
}

/* 页面切换动画 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity var(--transition-base), transform var(--transition-base);
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 移动端侧边栏遮罩 */
@include mobile-only {
  .layout-sider:not(.ant-layout-sider-collapsed)::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: -1;
    animation: fadeIn var(--transition-base);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 滚动条样式 */
.page-content {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--color-background-secondary);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: var(--radius-full);

    &:hover {
      background: var(--color-text-tertiary);
    }
  }
}
</style>

<style>
/* 全局样式覆盖 */
.ant-layout-sider-trigger {
  display: none;
}

.ant-back-top {
  right: 50px;
  bottom: 50px;
}

@media (max-width: 768px) {
  .ant-back-top {
    right: 20px;
    bottom: 20px;
  }
}
</style>