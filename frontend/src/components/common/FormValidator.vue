<template>
  <a-form
    ref="formRef"
    :model="formData"
    :rules="computedRules"
    :layout="layout"
    :label-col="labelCol"
    :wrapper-col="wrapperCol"
    :validate-trigger="validateTrigger"
    :scroll-to-first-error="scrollToFirstError"
    class="form-validator"
    @finish="handleFinish"
    @finish-failed="handleFinishFailed"
    @validate="handleValidate"
  >
    <slot :form-data="formData" :validate="validate" :reset="resetForm" />
    
    <!-- 默认提交按钮 -->
    <a-form-item v-if="showSubmitButton" :wrapper-col="submitButtonWrapperCol">
      <div class="form-actions">
        <a-button
          type="primary"
          html-type="submit"
          :loading="loading"
          :disabled="disabled"
          :size="buttonSize"
        >
          {{ submitText }}
        </a-button>
        
        <a-button
          v-if="showResetButton"
          :size="buttonSize"
          @click="resetForm"
        >
          {{ resetText }}
        </a-button>
      </div>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import type { ColProps } from 'ant-design-vue/es/grid'
import { message } from 'ant-design-vue'

interface Props {
  // 表单数据
  modelValue: Record<string, any>
  // 验证规则
  rules?: Record<string, Rule[]>
  // 表单布局
  layout?: 'horizontal' | 'vertical' | 'inline'
  // 标签列配置
  labelCol?: ColProps
  // 包装列配置
  wrapperCol?: ColProps
  // 验证触发方式
  validateTrigger?: string | string[]
  // 是否滚动到第一个错误字段
  scrollToFirstError?: boolean
  // 是否显示提交按钮
  showSubmitButton?: boolean
  // 是否显示重置按钮
  showResetButton?: boolean
  // 提交按钮文本
  submitText?: string
  // 重置按钮文本
  resetText?: string
  // 按钮尺寸
  buttonSize?: 'small' | 'middle' | 'large'
  // 加载状态
  loading?: boolean
  // 是否禁用
  disabled?: boolean
  // 自动验证
  autoValidate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'horizontal',
  validateTrigger: ['blur', 'change'],
  scrollToFirstError: true,
  showSubmitButton: true,
  showResetButton: false,
  submitText: '提交',
  resetText: '重置',
  buttonSize: 'middle',
  loading: false,
  disabled: false,
  autoValidate: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>]
  submit: [values: Record<string, any>]
  submitFailed: [errorInfo: any]
  validate: [name: string, status: boolean, errorMsgs: string[]]
  reset: []
}>()

// 表单引用
const formRef = ref<FormInstance>()

// 表单数据
const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// 计算验证规则
const computedRules = computed(() => {
  if (!props.rules) return {}
  
  // 可以在这里添加通用的验证规则处理逻辑
  return props.rules
})

// 提交按钮包装列配置
const submitButtonWrapperCol = computed(() => {
  if (props.layout === 'horizontal') {
    return props.wrapperCol || { offset: 4, span: 20 }
  }
  return undefined
})

// 监听表单数据变化，自动验证
watch(
  () => props.modelValue,
  () => {
    if (props.autoValidate && formRef.value) {
      // 延迟验证，避免频繁触发
      setTimeout(() => {
        formRef.value?.validate().catch(() => {
          // 忽略验证失败
        })
      }, 100)
    }
  },
  { deep: true }
)

// 表单提交成功
const handleFinish = (values: Record<string, any>) => {
  emit('submit', values)
}

// 表单提交失败
const handleFinishFailed = (errorInfo: any) => {
  console.warn('表单验证失败:', errorInfo)
  emit('submitFailed', errorInfo)
  
  // 显示错误提示
  const firstError = errorInfo.errorFields?.[0]
  if (firstError) {
    message.error(`${firstError.name[0]}: ${firstError.errors[0]}`)
  }
}

// 字段验证
const handleValidate = (name: string, status: boolean, errorMsgs: string[]) => {
  emit('validate', name, status, errorMsgs)
}

// 验证表单
const validate = async (nameList?: string[]) => {
  if (!formRef.value) return false
  
  try {
    await formRef.value.validate(nameList)
    return true
  } catch (error) {
    return false
  }
}

// 验证指定字段
const validateFields = async (nameList: string[]) => {
  if (!formRef.value) return false
  
  try {
    await formRef.value.validateFields(nameList)
    return true
  } catch (error) {
    return false
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
    emit('reset')
  }
}

// 清除验证
const clearValidate = (nameList?: string[]) => {
  if (formRef.value) {
    formRef.value.clearValidate(nameList)
  }
}

// 滚动到指定字段
const scrollToField = (name: string) => {
  if (formRef.value) {
    formRef.value.scrollToField(name)
  }
}

// 获取字段值
const getFieldValue = (name: string) => {
  return formRef.value?.getFieldValue(name)
}

// 设置字段值
const setFieldValue = (name: string, value: any) => {
  if (formRef.value) {
    formRef.value.setFieldValue(name, value)
  }
}

// 设置多个字段值
const setFieldsValue = (values: Record<string, any>) => {
  if (formRef.value) {
    formRef.value.setFieldsValue(values)
  }
}

// 组件挂载后的初始化
onMounted(() => {
  // 可以在这里添加初始化逻辑
})

// 暴露方法
defineExpose({
  validate,
  validateFields,
  resetForm,
  clearValidate,
  scrollToField,
  getFieldValue,
  setFieldValue,
  setFieldsValue,
  formRef,
})
</script>

<style lang="scss" scoped>
.form-validator {
  .form-actions {
    display: flex;
    gap: 12px;
    
    &.ant-form-item-control-input-content {
      justify-content: flex-start;
    }
  }
  
  // 垂直布局时的按钮样式
  &.ant-form-vertical {
    .form-actions {
      margin-top: 24px;
    }
  }
  
  // 内联布局时的按钮样式
  &.ant-form-inline {
    .form-actions {
      margin-left: 12px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .form-validator {
    .form-actions {
      flex-direction: column;
      width: 100%;
      
      .ant-btn {
        width: 100%;
      }
    }
  }
}
</style>