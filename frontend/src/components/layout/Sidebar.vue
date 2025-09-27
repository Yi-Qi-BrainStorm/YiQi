<template>
  <div class="sidebar">
    <!-- Logo区域 -->
    <div class="sidebar-logo">
      <div class="logo-content">
        <div class="logo-icon">
          <BulbOutlined />
        </div>
        <div v-if="!collapsed" class="logo-text">
          AI头脑风暴
        </div>
      </div>
    </div>

    <!-- 导航菜单 -->
    <a-menu
      v-model:selectedKeys="selectedKeys"
      mode="inline"
      theme="dark"
      class="sidebar-menu"
      :inline-collapsed="collapsed"
      @click="handleMenuClick"
    >
      <a-menu-item key="dashboard">
        <template #icon>
          <DashboardOutlined />
        </template>
        <span>工作台</span>
      </a-menu-item>

      <a-menu-item key="agents">
        <template #icon>
          <RobotOutlined />
        </template>
        <span>代理管理</span>
      </a-menu-item>

      <a-menu-item key="brainstorm">
        <template #icon>
          <BulbOutlined />
        </template>
        <span>头脑风暴</span>
      </a-menu-item>

      <a-menu-divider />

      <a-sub-menu key="history">
        <template #icon>
          <HistoryOutlined />
        </template>
        <template #title>历史记录</template>
        <a-menu-item key="sessions">
          <template #icon>
            <FileTextOutlined />
          </template>
          <span>会话记录</span>
        </a-menu-item>
        <a-menu-item key="reports">
          <template #icon>
            <FilePdfOutlined />
          </template>
          <span>报告导出</span>
        </a-menu-item>
      </a-sub-menu>

      <a-menu-item key="settings">
        <template #icon>
          <SettingOutlined />
        </template>
        <span>设置</span>
      </a-menu-item>
    </a-menu>

    <!-- 底部用户信息 -->
    <div class="sidebar-footer">
      <div v-if="!collapsed" class="user-info">
        <a-avatar :size="32" :src="userAvatar">
          <template #icon>
            <UserOutlined />
          </template>
        </a-avatar>
        <div class="user-details">
          <div class="username">{{ username }}</div>
          <div class="user-role">{{ userRole }}</div>
        </div>
      </div>
      <div v-else class="user-info-collapsed">
        <a-avatar :size="32" :src="userAvatar">
          <template #icon>
            <UserOutlined />
          </template>
        </a-avatar>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import {
  DashboardOutlined,
  RobotOutlined,
  BulbOutlined,
  HistoryOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'

interface Props {
  collapsed: boolean
}

const props = defineProps<Props>()
const router = useRouter()
const route = useRoute()
const { user } = useAuth()

// 当前选中的菜单项
const selectedKeys = ref<string[]>([])

// 用户信息
const username = computed(() => user.value?.username || '用户')
const userRole = computed(() => '创意设计师')
const userAvatar = computed(() => user.value?.avatar || '')

// 根据当前路由设置选中的菜单项
const updateSelectedKeys = () => {
  const routeName = route.name as string
  if (routeName) {
    selectedKeys.value = [routeName.toLowerCase()]
  }
}

// 监听路由变化
watch(
  () => route.name,
  () => {
    updateSelectedKeys()
  },
  { immediate: true }
)

// 处理菜单点击
const handleMenuClick = ({ key }: { key: string }) => {
  const routeMap: Record<string, string> = {
    dashboard: '/dashboard',
    agents: '/agents',
    brainstorm: '/brainstorm',
    sessions: '/history/sessions',
    reports: '/history/reports',
    settings: '/settings',
  }

  const path = routeMap[key]
  if (path && path !== route.path) {
    router.push(path)
  }
}
</script>

<style lang="scss" scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #001529;
}

.sidebar-logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #1f1f1f;
  margin-bottom: 8px;

  .logo-content {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #fff;
  }

  .logo-icon {
    font-size: 24px;
    color: #1890ff;
  }

  .logo-text {
    font-size: 16px;
    font-weight: 600;
    white-space: nowrap;
  }
}

.sidebar-menu {
  flex: 1;
  border-right: none;

  :deep(.ant-menu-item) {
    margin: 4px 8px;
    border-radius: 6px;
    height: 40px;
    line-height: 40px;

    &.ant-menu-item-selected {
      background-color: #1890ff;
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  :deep(.ant-menu-submenu) {
    .ant-menu-submenu-title {
      margin: 4px 8px;
      border-radius: 6px;
      height: 40px;
      line-height: 40px;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
  }
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #1f1f1f;

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #fff;

    .user-details {
      flex: 1;
      min-width: 0;

      .username {
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-role {
        font-size: 12px;
        color: #8c8c8c;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  .user-info-collapsed {
    display: flex;
    justify-content: center;
  }
}
</style>