import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const DEFAULT_TITLE = 'AI头脑风暴平台'
const TITLE_SEPARATOR = ' - '

// 全局页面标题状态
const pageTitle = ref(DEFAULT_TITLE)

/**
 * 页面标题管理组合式函数
 */
export function usePageTitle() {
  const route = useRoute()

  /**
   * 设置页面标题
   * @param title 页面标题
   * @param append 是否追加到默认标题后面
   */
  const setTitle = (title: string, append = true) => {
    const finalTitle = append ? `${title}${TITLE_SEPARATOR}${DEFAULT_TITLE}` : title
    document.title = finalTitle
    pageTitle.value = finalTitle
  }

  /**
   * 重置为默认标题
   */
  const resetTitle = () => {
    document.title = DEFAULT_TITLE
    pageTitle.value = DEFAULT_TITLE
  }

  /**
   * 根据路由元信息自动设置标题
   */
  const setTitleFromRoute = () => {
    const routeTitle = route.meta?.title as string
    if (routeTitle) {
      setTitle(routeTitle)
    } else {
      resetTitle()
    }
  }

  /**
   * 根据路由名称生成标题
   */
  const generateTitleFromRouteName = () => {
    const routeName = route.name as string
    const titleMap: Record<string, string> = {
      'Dashboard': '工作台',
      'Agents': 'AI代理管理',
      'AgentDetail': '代理详情',
      'Brainstorm': '头脑风暴',
      'BrainstormSession': '头脑风暴会话',
      'BrainstormHistory': '历史记录',
      'BrainstormResults': '会话结果',
      'Login': '登录',
      'Register': '注册',
      'Profile': '个人资料',
      'Settings': '设置',
      'NotFound': '页面未找到',
      'Unauthorized': '未授权访问',
      'Forbidden': '访问被拒绝'
    }

    const title = titleMap[routeName] || routeName
    if (title) {
      setTitle(title)
    }
  }

  /**
   * 动态设置标题（支持参数替换）
   * @param template 标题模板，如 "编辑代理 - {agentName}"
   * @param params 参数对象
   */
  const setDynamicTitle = (template: string, params: Record<string, string>) => {
    let title = template
    Object.entries(params).forEach(([key, value]) => {
      title = title.replace(`{${key}}`, value)
    })
    setTitle(title)
  }

  /**
   * 监听路由变化自动更新标题
   */
  const watchRouteTitle = () => {
    watch(
      () => route.meta?.title,
      () => {
        setTitleFromRoute()
      },
      { immediate: true }
    )

    // 如果路由元信息没有标题，尝试从路由名称生成
    watch(
      () => route.name,
      () => {
        if (!route.meta?.title) {
          generateTitleFromRouteName()
        }
      },
      { immediate: true }
    )
  }

  return {
    pageTitle,
    setTitle,
    resetTitle,
    setTitleFromRoute,
    setDynamicTitle,
    watchRouteTitle
  }
}

/**
 * 页面标题装饰器
 * 用于在组件中自动设置页面标题
 */
export function withPageTitle(title: string) {
  return function (target: any) {
    const { setTitle } = usePageTitle()
    
    // 在组件挂载时设置标题
    const originalMounted = target.mounted
    target.mounted = function () {
      setTitle(title)
      if (originalMounted) {
        originalMounted.call(this)
      }
    }
    
    return target
  }
}

/**
 * 根据业务上下文生成标题的工具函数
 */
export const TitleUtils = {
  /**
   * 生成代理相关页面标题
   */
  agent: {
    list: () => 'AI代理管理',
    detail: (agentName: string) => `${agentName} - 代理详情`,
    create: () => '创建代理',
    edit: (agentName: string) => `编辑 ${agentName}`
  },

  /**
   * 生成头脑风暴相关页面标题
   */
  brainstorm: {
    session: (topic?: string) => topic ? `${topic} - 头脑风暴` : '头脑风暴',
    results: (topic?: string) => topic ? `${topic} - 会话结果` : '会话结果',
    history: () => '历史记录'
  },

  /**
   * 生成用户相关页面标题
   */
  user: {
    profile: () => '个人资料',
    settings: () => '账户设置'
  },

  /**
   * 生成错误页面标题
   */
  error: {
    notFound: () => '页面未找到',
    unauthorized: () => '未授权访问',
    forbidden: () => '访问被拒绝',
    serverError: () => '服务器错误'
  }
}