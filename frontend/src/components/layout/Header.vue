<template>
  <div class="main-header">
    <!-- 左侧区域 -->
    <div class="header-left">
      <!-- 侧边栏切换按钮 -->
      <a-button
        type="text"
        class="sidebar-trigger"
        @click="handleToggleSidebar"
      >
        <template #icon>
          <MenuUnfoldOutlined v-if="collapsed" />
          <MenuFoldOutlined v-else />
        </template>
      </a-button>

      <!-- 面包屑导航 -->
      <a-breadcrumb class="breadcrumb">
        <a-breadcrumb-item v-for="item in breadcrumbItems" :key="item.path">
          <router-link v-if="item.path && !item.disabled" :to="item.path">
            {{ item.title }}
          </router-link>
          <span v-else>{{ item.title }}</span>
        </a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <!-- 右侧区域 -->
    <div class="header-right">
      <!-- 通知铃铛 -->
      <a-badge :count="notificationCount" :offset="[10, 0]">
        <a-button type="text" class="header-action" @click="showNotifications">
          <template #icon>
            <BellOutlined />
          </template>
        </a-button>
      </a-badge>

      <!-- 帮助 -->
      <a-button type="text" class="header-action" @click="showHelp">
        <template #icon>
          <QuestionCircleOutlined />
        </template>
      </a-button>

      <!-- 用户下拉菜单 -->
      <a-dropdown placement="bottomRight">
        <div class="user-dropdown-trigger">
          <a-avatar :size="32" :src="userAvatar">
            <template #icon>
              <UserOutlined />
            </template>
          </a-avatar>
          <span class="username">{{ username }}</span>
          <DownOutlined class="dropdown-icon" />
        </div>
        <template #overlay>
          <a-menu @click="handleUserMenuClick">
            <a-menu-item key="profile">
              <UserOutlined />
              个人资料
            </a-menu-item>
            <a-menu-item key="settings">
              <SettingOutlined />
              账户设置
            </a-menu-item>
            <a-menu-divider />
            <a-menu-item key="logout">
              <LogoutOutlined />
              退出登录
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { message } from 'ant-design-vue'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  DownOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue'

interface Props {
  collapsed: boolean
}

interface BreadcrumbItem {
  title: string
  path?: string
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  toggleSidebar: []
}>()

const router = useRouter()
const route = useRoute()
const { user, logout } = useAuth()

// 通知数量
const notificationCount = ref(3)

// 用户信息
const username = computed(() => user.value?.username || '用户')
const userAvatar = computed(() => user.value?.avatar || '')

// 面包屑导航数据
const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const routeName = route.name as string
  const routeMap: Record<string, BreadcrumbItem[]> = {
    Dashboard: [
      { title: '首页', path: '/dashboard' }
    ],
    AgentManagement: [
      { title: '首页', path: '/dashboard' },
      { title: '代理管理', disabled: true }
    ],
    BrainstormSession: [
      { title: '首页', path: '/dashboard' },
      { title: '头脑风暴', disabled: true }
    ],
  }

  return routeMap[routeName] || [{ title: '首页', path: '/dashboard' }]
})

// 切换侧边栏
const handleToggleSidebar = () => {
  emit('toggleSidebar')
}

// 显示通知
const showNotifications = () => {
  message.info('暂无新通知')
}

// 显示帮助
const showHelp = () => {
  message.info('帮助文档正在完善中')
}

// 处理用户菜单点击
const handleUserMenuClick = async ({ key }: { key: string }) => {
  switch (key) {
    case 'profile':
      message.info('个人资料功能开发中')
      break
    case 'settings':
      message.info('账户设置功能开发中')
      break
    case 'logout':
      try {
        await logout()
        message.success('已成功退出登录')
        router.push('/login')
      } catch (error) {
        message.error('退出登录失败')
      }
      break
  }
}
</script>

<style lang="scss" scoped>
.main-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;

  .sidebar-trigger {
    font-size: 18px;
    color: #666;
    
    &:hover {
      color: #1890ff;
    }
  }

  .breadcrumb {
    :deep(.ant-breadcrumb-link) {
      color: #666;
      
      &:hover {
        color: #1890ff;
      }
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;

  .header-action {
    font-size: 16px;
    color: #666;
    
    &:hover {
      color: #1890ff;
    }
  }

  .user-dropdown-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f5f5f5;
    }

    .username {
      font-size: 14px;
      color: #333;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dropdown-icon {
      font-size: 12px;
      color: #999;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .main-header {
    padding: 0 16px;
  }

  .header-left {
    gap: 12px;

    .breadcrumb {
      display: none;
    }
  }

  .header-right {
    .username {
      display: none;
    }
  }
}
</style>