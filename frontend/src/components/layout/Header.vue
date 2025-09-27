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
      <Breadcrumb />
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

      <!-- 主题切换 -->
      <ThemeSwitcher />

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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { message } from 'ant-design-vue'
import Breadcrumb from './Breadcrumb.vue'
import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue'
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

const props = defineProps<Props>()
const emit = defineEmits<{
  toggleSidebar: []
}>()

const router = useRouter()
const { user, logout } = useAuth()

// 通知数量
const notificationCount = ref(3)

// 用户信息
const username = computed(() => user.value?.username || '用户')
const userAvatar = computed(() => user.value?.avatar || '')

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
@import '@/styles/responsive.scss';
@import '@/styles/utilities.scss';

.main-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-6);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  transition: all var(--transition-base);

  @include mobile-only {
    padding: 0 var(--spacing-4);
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  flex: 1;

  @include mobile-only {
    gap: var(--spacing-3);
  }

  .sidebar-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    border-radius: var(--radius-lg);
    transition: all var(--transition-fast);
    
    &:hover {
      color: var(--color-primary-600);
      background-color: var(--color-surface-hover);
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }

    &:focus {
      outline: 2px solid var(--color-primary-500);
      outline-offset: 2px;
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);

  .header-action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    border-radius: var(--radius-lg);
    transition: all var(--transition-fast);
    position: relative;
    
    &:hover {
      color: var(--color-primary-600);
      background-color: var(--color-surface-hover);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }

    &:focus {
      outline: 2px solid var(--color-primary-500);
      outline-offset: 2px;
    }
  }

  :deep(.ant-badge) {
    .ant-badge-count {
      background-color: var(--color-error-500);
      border-color: var(--color-surface);
      box-shadow: var(--shadow-sm);
      font-size: var(--font-size-xs);
      min-width: 18px;
      height: 18px;
      line-height: 18px;
      border-radius: var(--radius-full);
    }
  }

  .user-dropdown-trigger {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-fast);
    border: 1px solid transparent;

    &:hover {
      background-color: var(--color-surface-hover);
      border-color: var(--color-border);
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    &:active {
      transform: translateY(0);
    }

    &:focus {
      outline: 2px solid var(--color-primary-500);
      outline-offset: 2px;
    }

    :deep(.ant-avatar) {
      border: 2px solid var(--color-border);
      transition: border-color var(--transition-fast);

      &:hover {
        border-color: var(--color-primary-500);
      }
    }

    .username {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: color var(--transition-fast);

      @include mobile-only {
        display: none;
      }
    }

    .dropdown-icon {
      font-size: var(--font-size-xs);
      color: var(--color-text-tertiary);
      transition: all var(--transition-fast);
    }

    &:hover .dropdown-icon {
      color: var(--color-primary-600);
      transform: rotate(180deg);
    }
  }
}

// 用户菜单样式
:deep(.ant-dropdown) {
  .ant-dropdown-menu {
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--color-border);
    background-color: var(--color-surface);
    padding: var(--spacing-2);
    min-width: 180px;

    .ant-dropdown-menu-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
      padding: var(--spacing-3) var(--spacing-4);
      border-radius: var(--radius-md);
      color: var(--color-text-primary);
      font-size: var(--font-size-sm);
      transition: all var(--transition-fast);

      &:hover {
        background-color: var(--color-surface-hover);
        color: var(--color-primary-600);
        transform: translateX(2px);
      }

      &:active {
        transform: translateX(0);
      }

      .anticon {
        font-size: var(--font-size-base);
        color: var(--color-text-secondary);
        transition: color var(--transition-fast);
      }

      &:hover .anticon {
        color: var(--color-primary-600);
      }
    }

    .ant-dropdown-menu-item-divider {
      background-color: var(--color-border);
      margin: var(--spacing-2) 0;
    }
  }
}

// 面包屑样式增强
:deep(.breadcrumb) {
  .ant-breadcrumb {
    font-size: var(--font-size-sm);

    .ant-breadcrumb-link {
      color: var(--color-text-secondary);
      transition: color var(--transition-fast);
      
      &:hover {
        color: var(--color-primary-600);
      }
    }

    .ant-breadcrumb-separator {
      color: var(--color-text-tertiary);
    }
  }
}

// 动画效果
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.header-action {
  &.has-notification {
    animation: pulse 2s infinite;
  }
}

// 响应式增强
@include tablet-up {
  .header-right {
    gap: var(--spacing-3);
  }
}

@include desktop-up {
  .main-header {
    padding: 0 var(--spacing-8);
  }
  
  .header-left {
    gap: var(--spacing-6);
  }
}
</style>