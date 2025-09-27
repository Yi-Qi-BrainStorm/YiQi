<template>
  <div v-if="hasError" class="error-boundary">
    <a-result
      :status="errorStatus"
      :title="errorTitle"
      :sub-title="errorSubTitle"
      class="error-result"
    >
      <!-- 错误详情 -->
      <template #extra>
        <div class="error-actions">
          <a-button type="primary" @click="handleRetry">
            <template #icon>
              <ReloadOutlined />
            </template>
            重试
          </a-button>
          
          <a-button @click="handleRefresh">
            <template #icon>
              <SyncOutlined />
            </template>
            刷新页面
          </a-button>
          
          <a-button v-if="showReportButton" @click="handleReport">
            <template #icon>
              <BugOutlined />
            </template>
            报告问题
          </a-button>
        </div>
        
        <!-- 错误详情展开 -->
        <div v-if="showDetails" class="error-details">
          <a-collapse v-model:activeKey="activeKey" ghost>
            <a-collapse-panel key="details" header="错误详情">
              <div class="error-info">
                <div class="error-message">
                  <strong>错误信息:</strong>
                  <pre>{{ errorMessage }}</pre>
                </div>
                
                <div v-if="errorStack" class="error-stack">
                  <strong>错误堆栈:</strong>
                  <pre>{{ errorStack }}</pre>
                </div>
                
                <div class="error-meta">
                  <strong>发生时间:</strong> {{ errorTime }}
                </div>
                
                <div v-if="errorInfo" class="error-context">
                  <strong>组件信息:</strong>
                  <pre>{{ errorInfo }}</pre>
                </div>
              </div>
            </a-collapse-panel>
          </a-collapse>
        </div>
      </template>
    </a-result>
  </div>
  
  <!-- 正常内容 -->
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  ReloadOutlined,
  SyncOutlined,
  BugOutlined,
} from '@ant-design/icons-vue'

interface Props {
  // 是否显示错误详情
  showDetails?: boolean
  // 是否显示报告按钮
  showReportButton?: boolean
  // 自定义错误标题
  customTitle?: string
  // 自定义错误描述
  customSubTitle?: string
  // 错误级别
  level?: 'error' | 'warning' | 'info'
}

interface ErrorInfo {
  message: string
  stack?: string
  componentStack?: string
  timestamp: string
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: true,
  showReportButton: true,
  level: 'error',
})

const emit = defineEmits<{
  error: [error: Error, errorInfo: ErrorInfo]
  retry: []
}>()

// 错误状态
const hasError = ref(false)
const errorInfo = ref<ErrorInfo | null>(null)
const activeKey = ref<string[]>([])

// 计算属性
const errorStatus = computed(() => {
  const statusMap = {
    error: '500',
    warning: 'warning',
    info: 'info',
  }
  return statusMap[props.level] as '500' | 'warning' | 'info'
})

const errorTitle = computed(() => {
  if (props.customTitle) return props.customTitle
  
  const titleMap = {
    error: '页面出现错误',
    warning: '页面警告',
    info: '页面提示',
  }
  return titleMap[props.level]
})

const errorSubTitle = computed(() => {
  if (props.customSubTitle) return props.customSubTitle
  
  const subTitleMap = {
    error: '抱歉，页面遇到了一些问题。请尝试刷新页面或联系技术支持。',
    warning: '页面运行中遇到了一些警告，可能影响部分功能。',
    info: '页面运行正常，但有一些信息需要您注意。',
  }
  return subTitleMap[props.level]
})

const errorMessage = computed(() => errorInfo.value?.message || '未知错误')
const errorStack = computed(() => errorInfo.value?.stack || '')
const errorTime = computed(() => errorInfo.value?.timestamp || '')

// 捕获错误
onErrorCaptured((error: Error, instance, info: string) => {
  console.error('ErrorBoundary 捕获到错误:', error)
  console.error('组件信息:', info)
  
  const errorData: ErrorInfo = {
    message: error.message,
    stack: error.stack,
    componentStack: info,
    timestamp: new Date().toLocaleString(),
  }
  
  hasError.value = true
  errorInfo.value = errorData
  
  // 触发错误事件
  emit('error', error, errorData)
  
  // 阻止错误继续传播
  return false
})

// 重试操作
const handleRetry = () => {
  hasError.value = false
  errorInfo.value = null
  activeKey.value = []
  emit('retry')
  message.info('正在重试...')
}

// 刷新页面
const handleRefresh = () => {
  window.location.reload()
}

// 报告问题
const handleReport = () => {
  const errorData = {
    message: errorMessage.value,
    stack: errorStack.value,
    timestamp: errorTime.value,
    userAgent: navigator.userAgent,
    url: window.location.href,
  }
  
  // 这里可以集成错误报告服务
  console.log('错误报告数据:', errorData)
  message.success('错误报告已提交，感谢您的反馈！')
}

// 暴露重置方法
const reset = () => {
  hasError.value = false
  errorInfo.value = null
  activeKey.value = []
}

defineExpose({
  reset,
})
</script>

<style lang="scss" scoped>
.error-boundary {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.error-result {
  max-width: 600px;
  width: 100%;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.error-details {
  margin-top: 24px;
  text-align: left;
  
  .error-info {
    font-size: 12px;
    color: #666;
    
    > div {
      margin-bottom: 16px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    strong {
      color: #333;
      display: block;
      margin-bottom: 8px;
    }
    
    pre {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 11px;
      line-height: 1.4;
      margin: 0;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .error-boundary {
    padding: 16px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
    
    .ant-btn {
      width: 100%;
      max-width: 200px;
    }
  }
}
</style>