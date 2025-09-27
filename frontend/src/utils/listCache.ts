/**
 * 列表缓存管理器
 * 提供列表数据的缓存、分页和性能优化功能
 */

interface CacheOptions {
  maxSize?: number
  ttl?: number // 缓存时间 (毫秒)
  enablePersist?: boolean // 是否持久化到 localStorage
}

interface CacheItem<T> {
  data: T[]
  timestamp: number
  version: number
  metadata?: Record<string, any>
}

interface PaginationOptions {
  page: number
  pageSize: number
  total?: number
}

interface FilterOptions<T> {
  searchText?: string
  searchFields?: (keyof T)[]
  filters?: Record<string, any>
  sorter?: {
    field: keyof T
    order: 'asc' | 'desc'
  }
}

class ListCacheManager<T = any> {
  private cache = new Map<string, CacheItem<T>>()
  private options: Required<CacheOptions>
  private persistKey: string

  constructor(
    private cacheKey: string,
    options: CacheOptions = {}
  ) {
    this.options = {
      maxSize: 100,
      ttl: 5 * 60 * 1000, // 5分钟
      enablePersist: false,
      ...options
    }
    this.persistKey = `list_cache_${cacheKey}`
    
    if (this.options.enablePersist) {
      this.loadFromStorage()
    }
  }

  /**
   * 设置缓存数据
   */
  set(key: string, data: T[], metadata?: Record<string, any>): void {
    // 检查缓存大小限制
    if (this.cache.size >= this.options.maxSize) {
      this.evictOldest()
    }

    const cacheItem: CacheItem<T> = {
      data: [...data], // 深拷贝避免引用问题
      timestamp: Date.now(),
      version: this.getVersion(key) + 1,
      metadata
    }

    this.cache.set(key, cacheItem)

    if (this.options.enablePersist) {
      this.saveToStorage()
    }
  }

  /**
   * 获取缓存数据
   */
  get(key: string): T[] | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // 检查是否过期
    if (this.isExpired(item)) {
      this.cache.delete(key)
      return null
    }

    return [...item.data] // 返回副本
  }

  /**
   * 获取分页数据
   */
  getPaginated(
    key: string, 
    pagination: PaginationOptions
  ): { data: T[]; total: number } | null {
    const allData = this.get(key)
    
    if (!allData) {
      return null
    }

    const { page, pageSize } = pagination
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    
    return {
      data: allData.slice(startIndex, endIndex),
      total: allData.length
    }
  }

  /**
   * 获取过滤后的数据
   */
  getFiltered(
    key: string,
    filterOptions: FilterOptions<T>
  ): T[] | null {
    const allData = this.get(key)
    
    if (!allData) {
      return null
    }

    let filteredData = [...allData]

    // 文本搜索
    if (filterOptions.searchText && filterOptions.searchFields) {
      const searchText = filterOptions.searchText.toLowerCase()
      filteredData = filteredData.filter(item => 
        filterOptions.searchFields!.some(field => {
          const value = item[field]
          return value && String(value).toLowerCase().includes(searchText)
        })
      )
    }

    // 自定义过滤器
    if (filterOptions.filters) {
      Object.entries(filterOptions.filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          filteredData = filteredData.filter(item => {
            const itemValue = (item as any)[field]
            if (Array.isArray(value)) {
              return value.includes(itemValue)
            }
            return itemValue === value
          })
        }
      })
    }

    // 排序
    if (filterOptions.sorter) {
      const { field, order } = filterOptions.sorter
      filteredData.sort((a, b) => {
        const aValue = a[field]
        const bValue = b[field]
        
        if (aValue === bValue) return 0
        
        const comparison = aValue > bValue ? 1 : -1
        return order === 'asc' ? comparison : -comparison
      })
    }

    return filteredData
  }

  /**
   * 更新单个项目
   */
  updateItem(key: string, itemId: string | number, updatedItem: Partial<T>): boolean {
    const data = this.get(key)
    
    if (!data) {
      return false
    }

    const index = data.findIndex((item: any) => item.id === itemId)
    
    if (index === -1) {
      return false
    }

    data[index] = { ...data[index], ...updatedItem }
    this.set(key, data)
    
    return true
  }

  /**
   * 添加项目
   */
  addItem(key: string, newItem: T): boolean {
    const data = this.get(key) || []
    data.push(newItem)
    this.set(key, data)
    return true
  }

  /**
   * 删除项目
   */
  removeItem(key: string, itemId: string | number): boolean {
    const data = this.get(key)
    
    if (!data) {
      return false
    }

    const filteredData = data.filter((item: any) => item.id !== itemId)
    
    if (filteredData.length === data.length) {
      return false // 没有找到要删除的项目
    }

    this.set(key, filteredData)
    return true
  }

  /**
   * 检查缓存是否存在且有效
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    return item !== undefined && !this.isExpired(item)
  }

  /**
   * 清除指定缓存
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key)
    
    if (this.options.enablePersist) {
      this.saveToStorage()
    }
    
    return result
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear()
    
    if (this.options.enablePersist) {
      localStorage.removeItem(this.persistKey)
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number
    keys: string[]
    totalItems: number
    oldestTimestamp: number
    newestTimestamp: number
  } {
    const keys = Array.from(this.cache.keys())
    const items = Array.from(this.cache.values())
    
    return {
      size: this.cache.size,
      keys,
      totalItems: items.reduce((sum, item) => sum + item.data.length, 0),
      oldestTimestamp: Math.min(...items.map(item => item.timestamp)),
      newestTimestamp: Math.max(...items.map(item => item.timestamp))
    }
  }

  /**
   * 预热缓存 - 预加载常用数据
   */
  async warmup(
    loaders: Array<{
      key: string
      loader: () => Promise<T[]>
      priority?: number
    }>
  ): Promise<void> {
    // 按优先级排序
    const sortedLoaders = loaders.sort((a, b) => (b.priority || 0) - (a.priority || 0))
    
    const promises = sortedLoaders.map(async ({ key, loader }) => {
      try {
        if (!this.has(key)) {
          const data = await loader()
          this.set(key, data)
        }
      } catch (error) {
        console.warn(`预热缓存失败 [${key}]:`, error)
      }
    })

    await Promise.allSettled(promises)
  }

  /**
   * 检查项目是否过期
   */
  private isExpired(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp > this.options.ttl
  }

  /**
   * 获取版本号
   */
  private getVersion(key: string): number {
    const item = this.cache.get(key)
    return item?.version || 0
  }

  /**
   * 淘汰最旧的缓存项
   */
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTimestamp = Date.now()

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.persistKey)
      if (stored) {
        const data = JSON.parse(stored)
        
        // 恢复 Map 结构
        Object.entries(data).forEach(([key, value]) => {
          this.cache.set(key, value as CacheItem<T>)
        })
        
        // 清理过期项
        this.cleanupExpired()
      }
    } catch (error) {
      console.warn('加载缓存失败:', error)
    }
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      const data = Object.fromEntries(this.cache.entries())
      localStorage.setItem(this.persistKey, JSON.stringify(data))
    } catch (error) {
      console.warn('保存缓存失败:', error)
    }
  }

  /**
   * 清理过期项
   */
  private cleanupExpired(): void {
    const expiredKeys: string[] = []
    
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        expiredKeys.push(key)
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key))
  }
}

/**
 * 创建列表缓存管理器实例
 */
export function createListCache<T = any>(
  cacheKey: string,
  options?: CacheOptions
): ListCacheManager<T> {
  return new ListCacheManager<T>(cacheKey, options)
}

/**
 * 全局缓存管理器实例
 */
export const globalListCache = {
  agents: createListCache('agents', { enablePersist: true, ttl: 10 * 60 * 1000 }),
  brainstormSessions: createListCache('brainstorm_sessions', { enablePersist: true }),
  brainstormResults: createListCache('brainstorm_results', { enablePersist: true }),
}

/**
 * 列表性能优化 Composable
 */
export function useListPerformance<T>(
  cacheKey: string,
  options: CacheOptions = {}
) {
  const cache = createListCache<T>(cacheKey, options)

  const getCachedData = (key: string) => cache.get(key)
  const setCachedData = (key: string, data: T[], metadata?: Record<string, any>) => 
    cache.set(key, data, metadata)
  
  const getPaginatedData = (key: string, pagination: PaginationOptions) =>
    cache.getPaginated(key, pagination)
  
  const getFilteredData = (key: string, filters: FilterOptions<T>) =>
    cache.getFiltered(key, filters)

  const updateCachedItem = (key: string, itemId: string | number, updatedItem: Partial<T>) =>
    cache.updateItem(key, itemId, updatedItem)

  const addCachedItem = (key: string, newItem: T) =>
    cache.addItem(key, newItem)

  const removeCachedItem = (key: string, itemId: string | number) =>
    cache.removeItem(key, itemId)

  return {
    cache,
    getCachedData,
    setCachedData,
    getPaginatedData,
    getFilteredData,
    updateCachedItem,
    addCachedItem,
    removeCachedItem
  }
}