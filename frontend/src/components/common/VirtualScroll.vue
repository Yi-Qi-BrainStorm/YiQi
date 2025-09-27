<template>
  <div 
    ref="containerRef" 
    class="virtual-scroll-container"
    :style="{ height: containerHeight }"
    @scroll="handleScroll"
  >
    <!-- 占位空间 - 上方 -->
    <div 
      class="virtual-scroll-spacer" 
      :style="{ height: `${offsetY}px` }"
    />
    
    <!-- 可见项目 -->
    <div 
      v-for="(item, index) in visibleItems" 
      :key="getItemKey(item, startIndex + index)"
      class="virtual-scroll-item"
      :style="{ height: `${itemHeight}px` }"
    >
      <slot 
        :item="item" 
        :index="startIndex + index"
        :isVisible="true"
      />
    </div>
    
    <!-- 占位空间 - 下方 -->
    <div 
      class="virtual-scroll-spacer" 
      :style="{ height: `${bottomSpacerHeight}px` }"
    />
    
    <!-- 加载更多触发器 -->
    <div 
      v-if="hasMore && !loading"
      ref="loadMoreTrigger"
      class="virtual-scroll-load-trigger"
    >
      <slot name="load-more">
        <div class="load-more-default">
          <a-spin size="small" />
          <span>加载更多...</span>
        </div>
      </slot>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="virtual-scroll-loading">
      <slot name="loading">
        <a-spin />
      </slot>
    </div>
    
    <!-- 无更多数据 -->
    <div v-if="!hasMore && items.length > 0" class="virtual-scroll-no-more">
      <slot name="no-more">
        <span>没有更多数据了</span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useLazyLoad } from '@/composables/useLazyLoading'

interface Props {
  items: T[]
  itemHeight: number
  containerHeight?: string
  overscan?: number
  keyField?: keyof T | ((item: T, index: number) => string | number)
  hasMore?: boolean
  loading?: boolean
  threshold?: number
}

interface Emits {
  (e: 'load-more'): void
  (e: 'scroll', event: { scrollTop: number; scrollLeft: number }): void
}

const props = withDefaults(defineProps<Props>(), {
  containerHeight: '400px',
  overscan: 5,
  keyField: 'id' as any,
  hasMore: false,
  loading: false,
  threshold: 0.8
})

const emit = defineEmits<Emits>()

// 引用
const containerRef = ref<HTMLElement | null>(null)
const loadMoreTrigger = ref<HTMLElement | null>(null)

// 状态
const scrollTop = ref(0)
const containerClientHeight = ref(0)

// 计算属性
const totalHeight = computed(() => props.items.length * props.itemHeight)

const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / props.itemHeight) - props.overscan
  return Math.max(0, index)
})

const endIndex = computed(() => {
  const visibleCount = Math.ceil(containerClientHeight.value / props.itemHeight)
  const index = startIndex.value + visibleCount + props.overscan * 2
  return Math.min(props.items.length - 1, index)
})

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value + 1)
})

const offsetY = computed(() => startIndex.value * props.itemHeight)

const bottomSpacerHeight = computed(() => {
  const remainingItems = props.items.length - endIndex.value - 1
  return Math.max(0, remainingItems * props.itemHeight)
})

// 获取项目唯一键
const getItemKey = (item: T, index: number): string | number => {
  if (typeof props.keyField === 'function') {
    return props.keyField(item, index)
  }
  if (typeof props.keyField === 'string' && item && typeof item === 'object') {
    return (item as any)[props.keyField] ?? index
  }
  return index
}

// 滚动处理
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
  
  emit('scroll', {
    scrollTop: target.scrollTop,
    scrollLeft: target.scrollLeft
  })
  
  // 检查是否需要加载更多
  checkLoadMore(target)
}

// 检查加载更多
const checkLoadMore = (container: HTMLElement) => {
  if (!props.hasMore || props.loading) return
  
  const { scrollTop, scrollHeight, clientHeight } = container
  const scrollPercentage = (scrollTop + clientHeight) / scrollHeight
  
  if (scrollPercentage >= props.threshold) {
    emit('load-more')
  }
}

// 滚动到指定项目
const scrollToItem = (index: number, behavior: ScrollBehavior = 'smooth') => {
  if (!containerRef.value) return
  
  const targetScrollTop = index * props.itemHeight
  containerRef.value.scrollTo({
    top: targetScrollTop,
    behavior
  })
}

// 滚动到顶部
const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
  scrollToItem(0, behavior)
}

// 滚动到底部
const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
  if (!containerRef.value) return
  
  containerRef.value.scrollTo({
    top: containerRef.value.scrollHeight,
    behavior
  })
}

// 获取可见范围
const getVisibleRange = () => {
  return {
    start: startIndex.value,
    end: endIndex.value,
    visibleItems: visibleItems.value
  }
}

// 更新容器高度
const updateContainerHeight = () => {
  if (containerRef.value) {
    containerClientHeight.value = containerRef.value.clientHeight
  }
}

// 使用懒加载监听加载更多触发器
const { isVisible: loadMoreVisible } = useLazyLoad(
  loadMoreTrigger,
  () => {
    if (props.hasMore && !props.loading) {
      emit('load-more')
    }
  },
  { threshold: 0.1, once: false }
)

// 监听项目变化，重置滚动位置
watch(() => props.items.length, (newLength, oldLength) => {
  // 如果是新增项目且在底部，保持在底部
  if (newLength > oldLength && containerRef.value) {
    const { scrollTop, scrollHeight, clientHeight } = containerRef.value
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
    
    if (isAtBottom) {
      nextTick(() => {
        scrollToBottom('auto')
      })
    }
  }
})

// 生命周期
onMounted(() => {
  updateContainerHeight()
  
  // 监听窗口大小变化
  const resizeObserver = new ResizeObserver(() => {
    updateContainerHeight()
  })
  
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
  
  onUnmounted(() => {
    resizeObserver.disconnect()
  })
})

// 暴露方法
defineExpose({
  scrollToItem,
  scrollToTop,
  scrollToBottom,
  getVisibleRange,
  containerRef
})
</script>

<style scoped>
.virtual-scroll-container {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.virtual-scroll-spacer {
  width: 100%;
  flex-shrink: 0;
}

.virtual-scroll-item {
  width: 100%;
  flex-shrink: 0;
  box-sizing: border-box;
}

.virtual-scroll-load-trigger {
  padding: 16px;
  text-align: center;
}

.load-more-default {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.virtual-scroll-loading {
  padding: 16px;
  text-align: center;
}

.virtual-scroll-no-more {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

/* 滚动条样式优化 */
.virtual-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.virtual-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.virtual-scroll-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.virtual-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>