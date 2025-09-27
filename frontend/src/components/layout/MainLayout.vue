<template>
  <a-layout class="main-layout">
    <!-- 侧边栏 -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      class="main-sidebar"
      :width="240"
      :collapsed-width="80"
    >
      <Sidebar :collapsed="collapsed" />
    </a-layout-sider>

    <!-- 主内容区域 -->
    <a-layout class="main-content-layout">
      <!-- 顶部导航栏 -->
      <a-layout-header class="main-header">
        <Header :collapsed="collapsed" @toggle-sidebar="toggleSidebar" />
      </a-layout-header>

      <!-- 内容区域 -->
      <a-layout-content class="main-content">
        <div class="content-wrapper">
          <router-view />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

// 侧边栏折叠状态
const collapsed = ref(false)

// 切换侧边栏折叠状态
const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}
</script>

<style lang="scss" scoped>
.main-layout {
  min-height: 100vh;
}

.main-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);

  :deep(.ant-layout-sider-children) {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
}

.main-content-layout {
  margin-left: 240px;
  transition: margin-left 0.2s;

  .main-layout.ant-layout-sider-collapsed + & {
    margin-left: 80px;
  }
}

.main-header {
  background: #fff;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 99;
}

.main-content {
  padding: 24px;
  background: #f0f2f5;
  min-height: calc(100vh - 64px);
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

// 响应式设计
@media (max-width: 768px) {
  .main-sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s;

    &.ant-layout-sider-collapsed {
      transform: translateX(0);
    }
  }

  .main-content-layout {
    margin-left: 0;
  }
}
</style>