<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    :width="width"
    :centered="centered"
    :mask-closable="maskClosable"
    :keyboard="keyboard"
    :destroy-on-close="destroyOnClose"
    :class="['confirm-dialog', `confirm-dialog--${type}`]"
    @cancel="handleCancel"
  >
    <!-- 内容区域 -->
    <div class="confirm-content">
      <!-- 图标 -->
      <div class="confirm-icon">
        <ExclamationCircleOutlined v-if="type === 'warning'" class="icon-warning" />
        <QuestionCircleOutlined v-else-if="type === 'info'" class="icon-info" />
        <CheckCircleOutlined v-else-if="type === 'success'" class="icon-success" />
        <CloseCircleOutlined v-else-if="type === 'error'" class="icon-error" />
        <DeleteOutlined v-else-if="type === 'delete'" class="icon-delete" />
        <component :is="customIcon" v-else-if="customIcon" class="icon-custom" />
      </div>
      
      <!-- 文本内容 -->
      <div class="confirm-text">
        <div class="confirm-message">{{ message }}</div>
        <div v-if="description" class="confirm-description">{{ description }}</div>
        
        <!-- 自定义内容插槽 -->
        <div v-if="$slots.content" class="confirm-custom-content">
          <slot name="content" />
        </div>
      </div>
    </div>
    
    <!-- 底部按钮 -->
    <template #footer>
      <div class="confirm-footer">
        <a-button
          v-if="showCancelButton"
          :loading="cancelLoading"
          @click="handleCancel"
        >
          {{ cancelText }}
        </a-button>
        
        <a-button
          :type="confirmButtonType"
          :loading="confirmLoading"
          :danger="type === 'delete' || type === 'error'"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  ExclamationCircleOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'

interface Props {
  // 是否显示对话框
  open?: boolean
  // 对话框标题
  title?: string
  // 主要消息
  message: string
  // 描述信息
  description?: string
  // 对话框类型
  type?: 'info' | 'success' | 'warning' | 'error' | 'delete'
  // 自定义图标
  customIcon?: any
  // 对话框宽度
  width?: number | string
  // 是否居中显示
  centered?: boolean
  // 点击遮罩是否可以关闭
  maskClosable?: boolean
  // 是否支持键盘 esc 关闭
  keyboard?: boolean
  // 关闭时销毁子元素
  destroyOnClose?: boolean
  // 确认按钮文本
  confirmText?: string
  // 取消按钮文本
  cancelText?: string
  // 是否显示取消按钮
  showCancelButton?: boolean
  // 确认按钮加载状态
  confirmLoading?: boolean
  // 取消按钮加载状态
  cancelLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  type: 'warning',
  width: 416,
  centered: true,
  maskClosable: false,
  keyboard: true,
  destroyOnClose: true,
  confirmText: '确定',
  cancelText: '取消',
  showCancelButton: true,
  confirmLoading: false,
  cancelLoading: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()

// 内部可见状态
const visible = ref(props.open)

// 监听外部 open 变化
watch(
  () => props.open,
  (newValue) => {
    visible.value = newValue
  }
)

// 监听内部 visible 变化
watch(visible, (newValue) => {
  emit('update:open', newValue)
})

// 计算对话框标题
const title = computed(() => {
  if (props.title) return props.title
  
  const titleMap = {
    info: '提示',
    success: '成功',
    warning: '警告',
    error: '错误',
    delete: '删除确认',
  }
  return titleMap[props.type]
})

// 计算确认按钮类型
const confirmButtonType = computed(() => {
  const typeMap = {
    info: 'primary',
    success: 'primary',
    warning: 'primary',
    error: 'primary',
    delete: 'primary',
  }
  return typeMap[props.type] as 'primary'
})

// 处理确认
const handleConfirm = () => {
  emit('confirm')
}

// 处理取消
const handleCancel = () => {
  visible.value = false
  emit('cancel')
}

// 暴露方法
const show = () => {
  visible.value = true
}

const hide = () => {
  visible.value = false
}

defineExpose({
  show,
  hide,
})
</script>

<style lang="scss" scoped>
.confirm-dialog {
  :deep(.ant-modal-body) {
    padding: 24px;
  }
}

.confirm-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.confirm-icon {
  flex-shrink: 0;
  font-size: 22px;
  margin-top: 2px;
  
  .icon-warning {
    color: #faad14;
  }
  
  .icon-info {
    color: #1890ff;
  }
  
  .icon-success {
    color: #52c41a;
  }
  
  .icon-error,
  .icon-delete {
    color: #ff4d4f;
  }
  
  .icon-custom {
    color: #666;
  }
}

.confirm-text {
  flex: 1;
  
  .confirm-message {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    line-height: 1.5;
    margin-bottom: 8px;
  }
  
  .confirm-description {
    font-size: 14px;
    color: #666;
    line-height: 1.5;
    margin-bottom: 16px;
  }
  
  .confirm-custom-content {
    margin-top: 16px;
  }
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

// 不同类型的样式
.confirm-dialog--delete {
  :deep(.ant-modal-header) {
    border-bottom-color: #ffebee;
  }
}

.confirm-dialog--error {
  :deep(.ant-modal-header) {
    border-bottom-color: #ffebee;
  }
}

.confirm-dialog--warning {
  :deep(.ant-modal-header) {
    border-bottom-color: #fff7e6;
  }
}

.confirm-dialog--success {
  :deep(.ant-modal-header) {
    border-bottom-color: #f6ffed;
  }
}

.confirm-dialog--info {
  :deep(.ant-modal-header) {
    border-bottom-color: #e6f7ff;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .confirm-dialog {
    :deep(.ant-modal) {
      margin: 16px;
      max-width: calc(100vw - 32px);
    }
  }
  
  .confirm-content {
    gap: 12px;
  }
  
  .confirm-icon {
    font-size: 20px;
  }
  
  .confirm-text {
    .confirm-message {
      font-size: 15px;
    }
    
    .confirm-description {
      font-size: 13px;
    }
  }
  
  .confirm-footer {
    flex-direction: column-reverse;
    gap: 12px;
    
    .ant-btn {
      width: 100%;
    }
  }
}
</style>