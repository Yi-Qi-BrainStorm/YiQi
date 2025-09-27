<template>
  <div class="loading-spinner" :class="{ 'full-screen': fullScreen }">
    <div class="spinner-container">
      <!-- 自定义加载动画 -->
      <div v-if="type === 'custom'" class="custom-spinner">
        <div class="spinner-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
      
      <!-- Ant Design 加载动画 -->
      <a-spin v-else :size="spinSize" :spinning="true">
        <div class="spin-content" :style="{ width: contentSize, height: contentSize }"></div>
      </a-spin>
      
      <!-- 加载文本 -->
      <div v-if="text" class="loading-text" :style="{ fontSize: textSize }">
        {{ text }}
      </div>
      
      <!-- 进度条 -->
      <div v-if="showProgress && progress !== undefined" class="progress-container">
        <a-progress 
          :percent="progress" 
          :size="progressSize"
          :stroke-color="progressColor"
          :show-info="showProgressText"
        />
      </div>
    </div>
    
    <!-- 遮罩层 -->
    <div v-if="overlay" class="loading-overlay"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  // 加载动画类型
  type?: 'default' | 'custom'
  // 尺寸
  size?: 'small' | 'default' | 'large'
  // 加载文本
  text?: string
  // 是否全屏显示
  fullScreen?: boolean
  // 是否显示遮罩层
  overlay?: boolean
  // 是否显示进度条
  showProgress?: boolean
  // 进度值 (0-100)
  progress?: number
  // 是否显示进度文本
  showProgressText?: boolean
  // 进度条颜色
  progressColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  size: 'default',
  fullScreen: false,
  overlay: true,
  showProgress: false,
  showProgressText: true,
  progressColor: '#1890ff',
})

// 计算 Ant Design Spin 组件的尺寸
const spinSize = computed(() => {
  const sizeMap = {
    small: 'small',
    default: 'default',
    large: 'large',
  }
  return sizeMap[props.size] as 'small' | 'default' | 'large'
})

// 计算内容区域尺寸
const contentSize = computed(() => {
  const sizeMap = {
    small: '32px',
    default: '48px',
    large: '64px',
  }
  return sizeMap[props.size]
})

// 计算文本尺寸
const textSize = computed(() => {
  const sizeMap = {
    small: '12px',
    default: '14px',
    large: '16px',
  }
  return sizeMap[props.size]
})

// 计算进度条尺寸
const progressSize = computed(() => {
  const sizeMap = {
    small: 'small',
    default: 'default',
    large: 'default',
  }
  return sizeMap[props.size] as 'small' | 'default'
})
</script>

<style lang="scss" scoped>
.loading-spinner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;

  &.full-screen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(2px);
  }
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  z-index: 1;
}

.custom-spinner {
  .spinner-ring {
    display: inline-block;
    position: relative;
    width: 48px;
    height: 48px;

    div {
      box-sizing: border-box;
      display: block;
      position: absolute;
      width: 38px;
      height: 38px;
      margin: 5px;
      border: 3px solid #1890ff;
      border-radius: 50%;
      animation: spinner-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
      border-color: #1890ff transparent transparent transparent;

      &:nth-child(1) {
        animation-delay: -0.45s;
      }

      &:nth-child(2) {
        animation-delay: -0.3s;
      }

      &:nth-child(3) {
        animation-delay: -0.15s;
      }
    }
  }
}

@keyframes spinner-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.spin-content {
  background: transparent;
}

.loading-text {
  color: #666;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

.progress-container {
  width: 200px;
  max-width: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  z-index: 0;
}

// 响应式设计
@media (max-width: 768px) {
  .progress-container {
    width: 150px;
  }
}
</style>