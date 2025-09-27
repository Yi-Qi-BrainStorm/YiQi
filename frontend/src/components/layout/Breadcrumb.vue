<template>
  <a-breadcrumb class="app-breadcrumb">
    <a-breadcrumb-item v-for="item in breadcrumbItems" :key="item.path || item.title">
      <router-link 
        v-if="item.path && !item.disabled" 
        :to="item.path"
        class="breadcrumb-link"
      >
        <component v-if="item.icon" :is="item.icon" class="breadcrumb-icon" />
        {{ item.title }}
      </router-link>
      <span v-else class="breadcrumb-current">
        <component v-if="item.icon" :is="item.icon" class="breadcrumb-icon" />
        {{ item.title }}
      </span>
    </a-breadcrumb-item>
  </a-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { BREADCRUMB_CONFIG } from '@/constants/routes'
import {
  HomeOutlined,
  DashboardOutlined,
  RobotOutlined,
  BulbOutlined,
  HistoryOutlined,
  UserOutlined,
  SettingOutlined
} from '@ant-design/icons-vue'

interface BreadcrumbItem {
  title: string
  path?: string
  disabled?: boolean
  icon?: any
}

const route = useRoute()

// 图标映射
const iconMap: Record<string, any> = {
  '首页': HomeOutlined,
  '工作台': DashboardOutlined,
  'AI代理管理': RobotOutlined,
  '代理管理': RobotOutlined,
  '头脑风暴': BulbOutlined,
  '历史记录': HistoryOutlined,
  '个人资料': UserOutlined,
  '设置': SettingOutlined
}

// 动态生成面包屑
const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const currentPath = route.path
  const routeName = route.name as string
  
  // 首先尝试从配置中获取
  let items = BREADCRUMB_CONFIG[currentPath as keyof typeof BREADCRUMB_CONFIG]
  
  // 如果配置中没有，根据路由动态生成
  if (!items) {
    items = generateDynamicBreadcrumb()
  }
  
  // 添加图标并处理最后一项
  return items.map((item, index) => ({
    ...item,
    icon: iconMap[item.title],
    disabled: index === items.length - 1 // 最后一项不可点击
  }))
})

// 动态生成面包屑
const generateDynamicBreadcrumb = (): BreadcrumbItem[] => {
  const pathSegments = route.path.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = [
    { title: '首页', path: '/dashboard' }
  ]
  
  // 根据路径段生成面包屑
  let currentPath = ''
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`
    
    // 跳过参数段（如 :id）
    if (segment.startsWith(':')) return
    
    const title = getSegmentTitle(segment, index, pathSegments)
    if (title) {
      items.push({
        title,
        path: index === pathSegments.length - 1 ? undefined : currentPath
      })
    }
  })
  
  return items
}

// 获取路径段对应的标题
const getSegmentTitle = (segment: string, index: number, segments: string[]): string => {
  const titleMap: Record<string, string> = {
    'dashboard': '工作台',
    'agents': 'AI代理管理',
    'brainstorm': '头脑风暴',
    'session': '会话',
    'history': '历史记录',
    'results': '结果',
    'create': '创建',
    'edit': '编辑',
    'profile': '个人资料',
    'settings': '设置'
  }
  
  // 处理特殊情况
  if (segment === 'session' && segments[index - 1] === 'brainstorm') {
    return '会话详情'
  }
  
  if (segment === 'results' && segments[index - 1] === 'brainstorm') {
    return '会话结果'
  }
  
  // 如果是ID参数，使用上下文生成标题
  if (/^[a-f0-9-]{36}$/.test(segment) || /^\d+$/.test(segment)) {
    const prevSegment = segments[index - 1]
    if (prevSegment === 'agents') {
      return '代理详情'
    }
    if (prevSegment === 'session') {
      return route.meta?.title as string || '会话详情'
    }
    return '详情'
  }
  
  return titleMap[segment] || segment
}
</script>

<style scoped>
.app-breadcrumb {
  :deep(.ant-breadcrumb-link) {
    color: #666;
    text-decoration: none;
    transition: color 0.2s;
    
    &:hover {
      color: #1890ff;
    }
  }
  
  .breadcrumb-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #666;
    text-decoration: none;
    transition: color 0.2s;
    
    &:hover {
      color: #1890ff;
    }
  }
  
  .breadcrumb-current {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #333;
    font-weight: 500;
  }
  
  .breadcrumb-icon {
    font-size: 14px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-breadcrumb {
    display: none;
  }
}
</style>