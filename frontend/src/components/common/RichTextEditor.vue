<template>
  <div class="rich-text-editor">
    <!-- 工具栏 -->
    <div v-if="showToolbar" class="editor-toolbar">
      <a-space wrap>
        <!-- 文本格式 -->
        <a-button-group>
          <a-button
            size="small"
            :type="isActive('bold') ? 'primary' : 'default'"
            @click="toggleFormat('bold')"
          >
            <template #icon>
              <BoldOutlined />
            </template>
          </a-button>
          <a-button
            size="small"
            :type="isActive('italic') ? 'primary' : 'default'"
            @click="toggleFormat('italic')"
          >
            <template #icon>
              <ItalicOutlined />
            </template>
          </a-button>
          <a-button
            size="small"
            :type="isActive('underline') ? 'primary' : 'default'"
            @click="toggleFormat('underline')"
          >
            <template #icon>
              <UnderlineOutlined />
            </template>
          </a-button>
        </a-button-group>

        <!-- 标题 -->
        <a-select
          v-model:value="currentHeading"
          size="small"
          style="width: 100px"
          @change="setHeading"
        >
          <a-select-option value="">正文</a-select-option>
          <a-select-option value="h1">标题 1</a-select-option>
          <a-select-option value="h2">标题 2</a-select-option>
          <a-select-option value="h3">标题 3</a-select-option>
        </a-select>

        <!-- 对齐方式 -->
        <a-button-group>
          <a-button
            size="small"
            :type="isActive('justifyLeft') ? 'primary' : 'default'"
            @click="setAlignment('left')"
          >
            <template #icon>
              <AlignLeftOutlined />
            </template>
          </a-button>
          <a-button
            size="small"
            :type="isActive('justifyCenter') ? 'primary' : 'default'"
            @click="setAlignment('center')"
          >
            <template #icon>
              <AlignCenterOutlined />
            </template>
          </a-button>
          <a-button
            size="small"
            :type="isActive('justifyRight') ? 'primary' : 'default'"
            @click="setAlignment('right')"
          >
            <template #icon>
              <AlignRightOutlined />
            </template>
          </a-button>
        </a-button-group>

        <!-- 列表 -->
        <a-button-group>
          <a-button
            size="small"
            :type="isActive('insertUnorderedList') ? 'primary' : 'default'"
            @click="toggleList('ul')"
          >
            <template #icon>
              <UnorderedListOutlined />
            </template>
          </a-button>
          <a-button
            size="small"
            :type="isActive('insertOrderedList') ? 'primary' : 'default'"
            @click="toggleList('ol')"
          >
            <template #icon>
              <OrderedListOutlined />
            </template>
          </a-button>
        </a-button-group>

        <!-- 链接和图片 -->
        <a-button-group>
          <a-button size="small" @click="insertLink">
            <template #icon>
              <LinkOutlined />
            </template>
          </a-button>
          <a-button size="small" @click="insertImage">
            <template #icon>
              <PictureOutlined />
            </template>
          </a-button>
        </a-button-group>

        <!-- 撤销重做 -->
        <a-button-group>
          <a-button size="small" @click="undo">
            <template #icon>
              <UndoOutlined />
            </template>
          </a-button>
          <a-button size="small" @click="redo">
            <template #icon>
              <RedoOutlined />
            </template>
          </a-button>
        </a-button-group>

        <!-- 清除格式 -->
        <a-button size="small" @click="clearFormat">
          <template #icon>
            <ClearOutlined />
          </template>
        </a-button>
      </a-space>
    </div>

    <!-- 编辑器内容区域 -->
    <div
      ref="editorRef"
      class="editor-content"
      :class="{
        'editor-disabled': disabled,
        'editor-readonly': readonly,
      }"
      :style="{ height: height }"
      contenteditable="true"
      @input="handleInput"
      @paste="handlePaste"
      @keydown="handleKeydown"
      @focus="handleFocus"
      @blur="handleBlur"
    ></div>

    <!-- 字数统计 -->
    <div v-if="showWordCount" class="editor-footer">
      <span class="word-count">字数: {{ wordCount }}</span>
      <span v-if="maxLength" class="word-limit">/ {{ maxLength }}</span>
    </div>

    <!-- 链接插入对话框 -->
    <a-modal
      v-model:open="linkModalVisible"
      title="插入链接"
      @ok="confirmInsertLink"
      @cancel="cancelInsertLink"
    >
      <a-form layout="vertical">
        <a-form-item label="链接文本">
          <a-input v-model:value="linkText" placeholder="请输入链接文本" />
        </a-form-item>
        <a-form-item label="链接地址">
          <a-input v-model:value="linkUrl" placeholder="请输入链接地址" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 图片插入对话框 -->
    <a-modal
      v-model:open="imageModalVisible"
      title="插入图片"
      @ok="confirmInsertImage"
      @cancel="cancelInsertImage"
    >
      <a-form layout="vertical">
        <a-form-item label="图片地址">
          <a-input v-model:value="imageUrl" placeholder="请输入图片地址" />
        </a-form-item>
        <a-form-item label="图片描述">
          <a-input v-model:value="imageAlt" placeholder="请输入图片描述" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  LinkOutlined,
  PictureOutlined,
  UndoOutlined,
  RedoOutlined,
  ClearOutlined,
} from '@ant-design/icons-vue'

interface Props {
  // 编辑器内容
  modelValue?: string
  // 编辑器高度
  height?: string
  // 是否显示工具栏
  showToolbar?: boolean
  // 是否显示字数统计
  showWordCount?: boolean
  // 最大字数限制
  maxLength?: number
  // 是否禁用
  disabled?: boolean
  // 是否只读
  readonly?: boolean
  // 占位符
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  height: '300px',
  showToolbar: true,
  showWordCount: true,
  disabled: false,
  readonly: false,
  placeholder: '请输入内容...',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

// 编辑器引用
const editorRef = ref<HTMLDivElement>()

// 编辑器状态
const currentHeading = ref('')
const linkModalVisible = ref(false)
const imageModalVisible = ref(false)
const linkText = ref('')
const linkUrl = ref('')
const imageUrl = ref('')
const imageAlt = ref('')

// 计算字数
const wordCount = computed(() => {
  if (!editorRef.value) return 0
  const text = editorRef.value.innerText || ''
  return text.length
})

// 监听内容变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (editorRef.value && editorRef.value.innerHTML !== newValue) {
      editorRef.value.innerHTML = newValue
    }
  }
)

// 组件挂载后初始化
onMounted(() => {
  if (editorRef.value) {
    editorRef.value.innerHTML = props.modelValue
    
    // 设置占位符
    if (!props.modelValue && props.placeholder) {
      editorRef.value.setAttribute('data-placeholder', props.placeholder)
    }
  }
})

// 处理输入
const handleInput = () => {
  if (!editorRef.value) return
  
  const content = editorRef.value.innerHTML
  
  // 检查字数限制
  if (props.maxLength && wordCount.value > props.maxLength) {
    message.warning(`内容长度不能超过 ${props.maxLength} 个字符`)
    return
  }
  
  emit('update:modelValue', content)
  emit('change', content)
}

// 处理粘贴
const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  
  const text = event.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}

// 处理键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl+B 加粗
  if (event.ctrlKey && event.key === 'b') {
    event.preventDefault()
    toggleFormat('bold')
  }
  // Ctrl+I 斜体
  else if (event.ctrlKey && event.key === 'i') {
    event.preventDefault()
    toggleFormat('italic')
  }
  // Ctrl+U 下划线
  else if (event.ctrlKey && event.key === 'u') {
    event.preventDefault()
    toggleFormat('underline')
  }
  // Ctrl+Z 撤销
  else if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
    event.preventDefault()
    undo()
  }
  // Ctrl+Shift+Z 重做
  else if (event.ctrlKey && event.shiftKey && event.key === 'Z') {
    event.preventDefault()
    redo()
  }
}

// 处理焦点
const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

// 检查格式是否激活
const isActive = (command: string) => {
  try {
    return document.queryCommandState(command)
  } catch {
    return false
  }
}

// 切换格式
const toggleFormat = (command: string) => {
  document.execCommand(command, false)
  editorRef.value?.focus()
}

// 设置标题
const setHeading = (heading: string) => {
  if (heading) {
    document.execCommand('formatBlock', false, heading)
  } else {
    document.execCommand('formatBlock', false, 'div')
  }
  editorRef.value?.focus()
}

// 设置对齐方式
const setAlignment = (align: string) => {
  const commandMap: Record<string, string> = {
    left: 'justifyLeft',
    center: 'justifyCenter',
    right: 'justifyRight',
  }
  
  const command = commandMap[align]
  if (command) {
    document.execCommand(command, false)
    editorRef.value?.focus()
  }
}

// 切换列表
const toggleList = (type: 'ul' | 'ol') => {
  const command = type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList'
  document.execCommand(command, false)
  editorRef.value?.focus()
}

// 插入链接
const insertLink = () => {
  const selection = window.getSelection()
  if (selection && selection.toString()) {
    linkText.value = selection.toString()
  }
  linkModalVisible.value = true
}

const confirmInsertLink = () => {
  if (!linkUrl.value) {
    message.error('请输入链接地址')
    return
  }
  
  const html = `<a href="${linkUrl.value}" target="_blank">${linkText.value || linkUrl.value}</a>`
  document.execCommand('insertHTML', false, html)
  
  linkText.value = ''
  linkUrl.value = ''
  linkModalVisible.value = false
  editorRef.value?.focus()
}

const cancelInsertLink = () => {
  linkText.value = ''
  linkUrl.value = ''
  linkModalVisible.value = false
}

// 插入图片
const insertImage = () => {
  imageModalVisible.value = true
}

const confirmInsertImage = () => {
  if (!imageUrl.value) {
    message.error('请输入图片地址')
    return
  }
  
  const html = `<img src="${imageUrl.value}" alt="${imageAlt.value}" style="max-width: 100%; height: auto;" />`
  document.execCommand('insertHTML', false, html)
  
  imageUrl.value = ''
  imageAlt.value = ''
  imageModalVisible.value = false
  editorRef.value?.focus()
}

const cancelInsertImage = () => {
  imageUrl.value = ''
  imageAlt.value = ''
  imageModalVisible.value = false
}

// 撤销
const undo = () => {
  document.execCommand('undo', false)
  editorRef.value?.focus()
}

// 重做
const redo = () => {
  document.execCommand('redo', false)
  editorRef.value?.focus()
}

// 清除格式
const clearFormat = () => {
  document.execCommand('removeFormat', false)
  editorRef.value?.focus()
}

// 获取内容
const getContent = () => {
  return editorRef.value?.innerHTML || ''
}

// 设置内容
const setContent = (content: string) => {
  if (editorRef.value) {
    editorRef.value.innerHTML = content
  }
}

// 清空内容
const clear = () => {
  if (editorRef.value) {
    editorRef.value.innerHTML = ''
    emit('update:modelValue', '')
    emit('change', '')
  }
}

// 暴露方法
defineExpose({
  getContent,
  setContent,
  clear,
  focus: () => editorRef.value?.focus(),
  blur: () => editorRef.value?.blur(),
})
</script>

<style lang="scss" scoped>
.rich-text-editor {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  
  &:focus-within {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
}

.editor-toolbar {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.editor-content {
  padding: 12px;
  min-height: 200px;
  outline: none;
  overflow-y: auto;
  
  &.editor-disabled {
    background: #f5f5f5;
    cursor: not-allowed;
    pointer-events: none;
  }
  
  &.editor-readonly {
    background: #f9f9f9;
    cursor: default;
  }
  
  // 占位符样式
  &:empty::before {
    content: attr(data-placeholder);
    color: #bfbfbf;
    pointer-events: none;
  }
  
  // 内容样式
  :deep(h1) {
    font-size: 24px;
    font-weight: 600;
    margin: 16px 0 8px 0;
  }
  
  :deep(h2) {
    font-size: 20px;
    font-weight: 600;
    margin: 14px 0 7px 0;
  }
  
  :deep(h3) {
    font-size: 16px;
    font-weight: 600;
    margin: 12px 0 6px 0;
  }
  
  :deep(p) {
    margin: 8px 0;
    line-height: 1.6;
  }
  
  :deep(ul, ol) {
    margin: 8px 0;
    padding-left: 24px;
    
    li {
      margin: 4px 0;
      line-height: 1.6;
    }
  }
  
  :deep(a) {
    color: #1890ff;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 8px 0;
  }
  
  :deep(blockquote) {
    margin: 16px 0;
    padding: 12px 16px;
    border-left: 4px solid #1890ff;
    background: #f6f8fa;
    color: #666;
  }
}

.editor-footer {
  padding: 8px 12px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  display: flex;
  justify-content: flex-end;
  font-size: 12px;
  color: #666;
  
  .word-count {
    margin-right: 4px;
  }
  
  .word-limit {
    color: #999;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .editor-toolbar {
    padding: 6px 8px;
    
    :deep(.ant-space) {
      gap: 4px !important;
    }
    
    :deep(.ant-btn-group) {
      .ant-btn {
        padding: 0 6px;
      }
    }
  }
  
  .editor-content {
    padding: 8px;
    min-height: 150px;
  }
}
</style>