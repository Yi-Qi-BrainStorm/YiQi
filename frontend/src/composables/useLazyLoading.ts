/**
 * 懒加载组合式函数
 * 提供组件级别的懒加载功能
 */

import { ref, onMounted, onUnmounted, type Ref } from 'vue'

interface LazyLoadOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean
  immediate?: boolean
}

interface LazyComponentOptions extends LazyLoadOptions {
  placeholder?: any
  errorComponent?: any
  loadingComponent?: any
  delay?: number
  timeout?: number
}

/**
 * 懒加载元素 Composable
 */
export function useLazyLoad(
  target: Ref<HTMLElement | null>,
  callback: () => void,
  options: LazyLoadOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    once = true,
    immediate = false
  } = options

  const isVisible = ref(false)
  const isLoaded = ref(false)
  let observer: IntersectionObserver | null = null

  const startObserving = () => {
    if (!target.value || typeof IntersectionObserver === 'undefined') {
      if (immediate) {
        callback()
        isLoaded.value = true
      }
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded.value) {
            isVisible.value = true
            callback()
            isLoaded.value = true
            
            if (once && observer) {
              observer.unobserve(entry.target)
            }
          }
        })
      },
      {
        threshold,
        rootMargin
      }
    )

    observer.observe(target.value)
  }

  const stopObserving = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  onMounted(() => {
    if (immediate) {
      callback()
      isLoaded.value = true
    } else {
      startObserving()
    }
  })

  onUnmounted(() => {
    stopObserving()
  })

  return {
    isVisible,
    isLoaded,
    startObserving,
    stopObserving
  }
}

/**
 * 懒加载组件 Composable
 */
export function useLazyComponent<T = any>(
  importFn: () => Promise<T>,
  options: LazyComponentOptions = {}
) {
  const {
    placeholder = null,
    errorComponent = null,
    loadingComponent = null,
    delay = 0,
    timeout = 10000,
    ...lazyOptions
  } = options

  const component = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const elementRef = ref<HTMLElement | null>(null)

  const loadComponent = async () => {
    if (component.value || loading.value) return

    loading.value = true
    error.value = null

    try {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Component load timeout')), timeout)
      })

      const loadPromise = importFn()
      const result = await Promise.race([loadPromise, timeoutPromise])
      
      component.value = result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to load component')
      console.error('懒加载组件失败:', err)
    } finally {
      loading.value = false
    }
  }

  const { isVisible, isLoaded } = useLazyLoad(elementRef, loadComponent, lazyOptions)

  const getCurrentComponent = () => {
    if (error.value && errorComponent) {
      return errorComponent
    }
    if (loading.value && loadingComponent) {
      return loadingComponent
    }
    if (component.value) {
      return component.value
    }
    return placeholder
  }

  return {
    elementRef,
    component: getCurrentComponent,
    loading,
    error,
    isVisible,
    isLoaded,
    loadComponent
  }
}

/**
 * 懒加载图片 Composable
 */
export function useLazyImage(options: LazyLoadOptions = {}) {
  const imageRef = ref<HTMLImageElement | null>(null)
  const isLoaded = ref(false)
  const error = ref<Error | null>(null)
  const loading = ref(false)

  const loadImage = () => {
    const img = imageRef.value
    if (!img || isLoaded.value) return

    loading.value = true
    
    const tempImg = new Image()
    tempImg.onload = () => {
      if (img.dataset.src) {
        img.src = img.dataset.src
        img.removeAttribute('data-src')
      }
      isLoaded.value = true
      loading.value = false
      img.classList.add('loaded')
    }
    
    tempImg.onerror = () => {
      error.value = new Error('Failed to load image')
      loading.value = false
      img.classList.add('error')
    }
    
    if (img.dataset.src) {
      tempImg.src = img.dataset.src
    }
  }

  const { isVisible } = useLazyLoad(imageRef, loadImage, options)

  return {
    imageRef,
    isLoaded,
    error,
    loading,
    isVisible
  }
}

/**
 * 懒加载列表 Composable
 */
export function useLazyList<T>(
  items: Ref<T[]>,
  batchSize: number = 20,
  options: LazyLoadOptions = {}
) {
  const visibleItems = ref<T[]>([])
  const currentIndex = ref(0)
  const hasMore = ref(true)
  const loading = ref(false)
  const triggerRef = ref<HTMLElement | null>(null)

  const loadMore = () => {
    if (loading.value || !hasMore.value) return

    loading.value = true
    
    setTimeout(() => {
      const nextIndex = currentIndex.value + batchSize
      const newItems = items.value.slice(currentIndex.value, nextIndex)
      
      visibleItems.value.push(...newItems)
      currentIndex.value = nextIndex
      hasMore.value = nextIndex < items.value.length
      loading.value = false
    }, 100) // 模拟异步加载
  }

  // 初始加载
  onMounted(() => {
    loadMore()
  })

  // 监听滚动触发器
  const { isVisible } = useLazyLoad(triggerRef, loadMore, {
    ...options,
    once: false
  })

  // 重置列表
  const reset = () => {
    visibleItems.value = []
    currentIndex.value = 0
    hasMore.value = true
    loadMore()
  }

  return {
    visibleItems,
    loading,
    hasMore,
    triggerRef,
    isVisible,
    loadMore,
    reset
  }
}

/**
 * 预加载资源 Composable
 */
export function useResourcePreload() {
  const preloadedResources = new Set<string>()

  const preloadImage = (src: string): Promise<void> => {
    if (preloadedResources.has(src)) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        preloadedResources.add(src)
        resolve()
      }
      img.onerror = reject
      img.src = src
    })
  }

  const preloadImages = async (srcs: string[]): Promise<void> => {
    const promises = srcs.map(src => preloadImage(src))
    await Promise.allSettled(promises)
  }

  const preloadFont = (fontFamily: string, src: string): Promise<void> => {
    if (preloadedResources.has(src)) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const font = new FontFace(fontFamily, `url(${src})`)
      font.load().then(() => {
        document.fonts.add(font)
        preloadedResources.add(src)
        resolve()
      }).catch(reject)
    })
  }

  return {
    preloadImage,
    preloadImages,
    preloadFont,
    preloadedResources: preloadedResources as ReadonlySet<string>
  }
}