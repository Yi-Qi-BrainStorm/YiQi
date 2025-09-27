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

<style scoped>
.main-layout {
  min-height: 100vh;
}

.layout-sider {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.layout-content {
  margin-left: 256px;
  transition: margin-left 0.2s;
}

.layout-sider.ant-layout-sider-collapsed + .layout-content {
  margin-left: 80px;
}

.layout-header {
  position: sticky;
  top: 0;
  z-index: 99;
  padding: 0;
  height: 64px;
  line-height: 64px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.page-content {
  min-height: calc(100vh - 64px - 70px);
  background: #f0f2f5;
}

.content-wrapper {
  position: relative;
  min-height: 100%;
}

.page-loading {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.layout-footer {
  background: #fff;
  border-top: 1px solid #f0f0f0;
  padding: 16px 24px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.footer-left {
  color: #666;
  font-size: 14px;
}

.footer-right {
  display: flex;
  align-items: center;
}

.footer-link {
  color: #666;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;

  &:hover {
    color: #1890ff;
  }
}

/* 页面切换动画 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .layout-content {
    margin-left: 0;
  }

  .layout-sider {
    position: fixed;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }

  .layout-sider:not(.ant-layout-sider-collapsed) {
    transform: translateX(0);
  }

  .footer-content {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }

  .footer-right {
    justify-content: center;
  }
}

@media (max-width: 576px) {
  .layout-header {
    position: relative;
  }

  .page-content {
    min-height: calc(100vh - 64px - 90px);
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