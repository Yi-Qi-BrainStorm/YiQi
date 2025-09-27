<template>
  <div class="file-upload">
    <a-upload
      v-model:file-list="fileList"
      :action="uploadUrl"
      :headers="uploadHeaders"
      :data="uploadData"
      :name="uploadName"
      :multiple="multiple"
      :accept="accept"
      :max-count="maxCount"
      :before-upload="handleBeforeUpload"
      :custom-request="customRequest || undefined"
      :show-upload-list="showUploadList"
      :list-type="listType"
      :disabled="disabled"
      :directory="directory"
      class="upload-component"
      @change="handleChange"
      @preview="handlePreview"
      @remove="handleRemove"
    >
      <!-- 上传按钮/区域 -->
      <div v-if="listType === 'picture-card'" class="upload-card">
        <div v-if="fileList.length < maxCount" class="upload-card-content">
          <PlusOutlined />
          <div class="upload-text">{{ uploadText }}</div>
        </div>
      </div>
      
      <a-button v-else-if="listType === 'text'" :disabled="disabled">
        <template #icon>
          <UploadOutlined />
        </template>
        {{ uploadText }}
      </a-button>
      
      <div v-else class="upload-dragger-content">
        <p class="upload-drag-icon">
          <InboxOutlined />
        </p>
        <p class="upload-drag-text">{{ uploadText }}</p>
        <p class="upload-drag-hint">{{ uploadHint }}</p>
      </div>
    </a-upload>
    
    <!-- 文件预览模态框 -->
    <a-modal
      v-model:open="previewVisible"
      :title="previewTitle"
      :footer="null"
      :width="800"
      centered
    >
      <img
        v-if="isImageFile(previewFile)"
        :src="previewImage"
        :alt="previewTitle"
        style="width: 100%"
      />
      <div v-else class="file-preview">
        <div class="file-info">
          <FileOutlined class="file-icon" />
          <div class="file-details">
            <div class="file-name">{{ previewTitle }}</div>
            <div class="file-size">{{ formatFileSize(previewFile?.size) }}</div>
          </div>
        </div>
        <a-button type="primary" @click="downloadFile(previewFile)">
          <template #icon>
            <DownloadOutlined />
          </template>
          下载文件
        </a-button>
      </div>
    </a-modal>
    
    <!-- 上传进度 -->
    <div v-if="showProgress && uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
      <a-progress :percent="uploadProgress" :status="uploadStatus" />
    </div>
    
    <!-- 错误信息 -->
    <div v-if="errorMessage" class="upload-error">
      <a-alert :message="errorMessage" type="error" show-icon closable @close="clearError" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { UploadProps, UploadFile } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  UploadOutlined,
  InboxOutlined,
  FileOutlined,
  DownloadOutlined,
} from '@ant-design/icons-vue'

interface Props {
  // 文件列表
  modelValue?: UploadFile[]
  // 上传地址
  action?: string
  // 上传请求头
  headers?: Record<string, string>
  // 上传额外数据
  data?: Record<string, any>
  // 上传文件字段名
  name?: string
  // 是否支持多选
  multiple?: boolean
  // 接受的文件类型
  accept?: string
  // 最大文件数量
  maxCount?: number
  // 最大文件大小 (MB)
  maxSize?: number
  // 列表类型
  listType?: 'text' | 'picture' | 'picture-card'
  // 是否显示上传列表
  showUploadList?: boolean | UploadProps['showUploadList']
  // 是否禁用
  disabled?: boolean
  // 是否支持文件夹上传
  directory?: boolean
  // 上传按钮文本
  uploadText?: string
  // 上传提示文本
  uploadHint?: string
  // 是否显示进度条
  showProgress?: boolean
  // 自定义上传请求
  customRequest?: (options: any) => void
  // 文件类型限制
  fileTypes?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  name: 'file',
  multiple: false,
  maxCount: 1,
  maxSize: 10,
  listType: 'text',
  showUploadList: true,
  disabled: false,
  directory: false,
  uploadText: '点击上传',
  uploadHint: '支持单个或批量上传',
  showProgress: true,
})

const emit = defineEmits<{
  'update:modelValue': [files: UploadFile[]]
  change: [info: { file: UploadFile; fileList: UploadFile[] }]
  success: [file: UploadFile, response: any]
  error: [file: UploadFile, error: any]
  remove: [file: UploadFile]
  preview: [file: UploadFile]
}>()

// 文件列表
const fileList = computed({
  get: () => props.modelValue || [],
  set: (value) => emit('update:modelValue', value),
})

// 上传相关状态
const uploadProgress = ref(0)
const uploadStatus = ref<'normal' | 'active' | 'success' | 'exception'>('normal')
const errorMessage = ref('')

// 预览相关状态
const previewVisible = ref(false)
const previewImage = ref('')
const previewTitle = ref('')
const previewFile = ref<UploadFile | null>(null)

// 计算上传地址
const uploadUrl = computed(() => props.action || '/api/upload')

// 计算上传请求头
const uploadHeaders = computed(() => {
  const headers = { ...props.headers }
  // 可以在这里添加认证头等
  return headers
})

// 计算上传数据
const uploadData = computed(() => props.data || {})

// 计算上传字段名
const uploadName = computed(() => props.name)

// 上传前检查
const handleBeforeUpload = (file: UploadFile) => {
  // 检查文件类型
  if (props.fileTypes && props.fileTypes.length > 0) {
    const fileType = file.name?.split('.').pop()?.toLowerCase()
    if (fileType && !props.fileTypes.includes(fileType)) {
      message.error(`只支持 ${props.fileTypes.join(', ')} 格式的文件`)
      return false
    }
  }
  
  // 检查文件大小
  if (file.size && file.size > props.maxSize * 1024 * 1024) {
    message.error(`文件大小不能超过 ${props.maxSize}MB`)
    return false
  }
  
  // 清除之前的错误信息
  clearError()
  
  return true
}

// 文件变化处理
const handleChange = (info: { file: UploadFile; fileList: UploadFile[] }) => {
  const { file, fileList: newFileList } = info
  
  // 更新进度
  if (file.percent !== undefined) {
    uploadProgress.value = file.percent
  }
  
  // 更新状态
  if (file.status === 'uploading') {
    uploadStatus.value = 'active'
  } else if (file.status === 'done') {
    uploadStatus.value = 'success'
    uploadProgress.value = 100
    message.success(`${file.name} 上传成功`)
    emit('success', file, file.response)
  } else if (file.status === 'error') {
    uploadStatus.value = 'exception'
    errorMessage.value = `${file.name} 上传失败`
    emit('error', file, file.error)
  }
  
  // 更新文件列表
  fileList.value = newFileList
  emit('change', info)
}

// 文件预览
const handlePreview = async (file: UploadFile) => {
  previewFile.value = file
  previewTitle.value = file.name || '文件预览'
  
  if (isImageFile(file)) {
    // 图片预览
    if (file.url) {
      previewImage.value = file.url
    } else if (file.originFileObj) {
      previewImage.value = await getBase64(file.originFileObj)
    }
  }
  
  previewVisible.value = true
  emit('preview', file)
}

// 文件移除
const handleRemove = (file: UploadFile) => {
  emit('remove', file)
  return true
}

// 判断是否为图片文件
const isImageFile = (file?: UploadFile | null) => {
  if (!file) return false
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  return imageTypes.includes(file.type || '') || 
         /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || '')
}

// 获取文件 base64
const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// 格式化文件大小
const formatFileSize = (size?: number) => {
  if (!size) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let index = 0
  let fileSize = size
  
  while (fileSize >= 1024 && index < units.length - 1) {
    fileSize /= 1024
    index++
  }
  
  return `${fileSize.toFixed(1)} ${units[index]}`
}

// 下载文件
const downloadFile = (file?: UploadFile | null) => {
  if (!file?.url) return
  
  const link = document.createElement('a')
  link.href = file.url
  link.download = file.name || 'download'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 清除错误信息
const clearError = () => {
  errorMessage.value = ''
}

// 重置上传状态
const resetUpload = () => {
  uploadProgress.value = 0
  uploadStatus.value = 'normal'
  clearError()
}

// 暴露方法
defineExpose({
  resetUpload,
  clearError,
})
</script>

<style lang="scss" scoped>
.file-upload {
  .upload-component {
    width: 100%;
  }
  
  .upload-card {
    .upload-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      background: #fafafa;
      cursor: pointer;
      transition: border-color 0.3s;
      
      &:hover {
        border-color: #1890ff;
      }
      
      .anticon {
        font-size: 32px;
        color: #999;
        margin-bottom: 8px;
      }
      
      .upload-text {
        color: #666;
        font-size: 14px;
      }
    }
  }
  
  .upload-dragger-content {
    text-align: center;
    padding: 40px 20px;
    
    .upload-drag-icon {
      font-size: 48px;
      color: #1890ff;
      margin-bottom: 16px;
    }
    
    .upload-drag-text {
      font-size: 16px;
      color: #333;
      margin-bottom: 8px;
    }
    
    .upload-drag-hint {
      font-size: 14px;
      color: #999;
    }
  }
  
  .upload-progress {
    margin-top: 16px;
  }
  
  .upload-error {
    margin-top: 16px;
  }
  
  .file-preview {
    text-align: center;
    padding: 40px 20px;
    
    .file-info {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      gap: 16px;
      
      .file-icon {
        font-size: 48px;
        color: #1890ff;
      }
      
      .file-details {
        text-align: left;
        
        .file-name {
          font-size: 16px;
          font-weight: 500;
          color: #333;
          margin-bottom: 4px;
        }
        
        .file-size {
          font-size: 14px;
          color: #666;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .file-upload {
    .upload-dragger-content {
      padding: 30px 15px;
      
      .upload-drag-icon {
        font-size: 36px;
      }
      
      .upload-drag-text {
        font-size: 14px;
      }
      
      .upload-drag-hint {
        font-size: 12px;
      }
    }
    
    .file-preview {
      padding: 30px 15px;
      
      .file-info {
        flex-direction: column;
        gap: 12px;
        
        .file-details {
          text-align: center;
        }
      }
    }
  }
}
</style>