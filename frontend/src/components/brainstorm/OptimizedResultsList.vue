<template>
  <div class="optimized-results-list">
    <!-- 工具栏 -->
    <div class="results-list__toolbar">
      <div class="results-list__search">
        <a-input-search
          v-model:value="searchQuery"
          placeholder="搜索会话主题或结果内容..."
          allow-clear
          @search="handleSearch"
          class="search-input"
        />
      </div>
      
      <div class="results-list__filters">
        <a-select
          v-model:value="selectedStatus"
          placeholder="会话状态"
          allow-clear
          style="width: 150px"
          @change="handleStatusChange"
        >
          <a-select-option value="">全部状态</a-select-option>
          <a-select-option value="completed">已完成</a-select-option>
          <a-select-option value="in_progress">进行中</a-select-option>
          <a-select-option value="paused">已暂停</a-select-option>
        </a-select>

        <a-range-picker
          v-model:value="dateRange"
          @change="handleDateRangeChange"
          style="width: 240px"
        />

        <a-switch
          v-model:checked="useVirtualScroll"
          checked-children="虚拟滚动"
          un-checked-children="普通模式"
          @change="handleVirtualScrollToggle"
        />
      </div>

      <div class="results-list__actions">
        <a-button @click="handleRefresh" :loading="loading">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
        
        <a-button @click="handleExportAll" :loading="exportLoading">
          <template #icon><ExportOutlined /></template>
          导出全部
        </a-button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="results-list__content">
      <a-spin :spinning="loading" size="large">
        <!-- 空状态 -->
        <div v-if="displayResults.length === 0 && !loading" class="results-list__empty">
          <a-empty
            :description="hasFilters ? '没有找到匹配的结果' : '还没有头脑风暴结果'"
          >
            <a-button v-if="!hasFilters" type="primary" @click="$emit('create-session')">
              开始头脑风暴
            </a-button>
          </a-empty>
        </div>

        <!-- 虚拟滚动模式 -->
        <VirtualScroll
          v-else-if="useVirtualScroll && displayResults.length > virtualScrollThreshold"
          :items="displayResults"
          :item-height="280"
          container-height="700px"
          :has-more="hasMore"
          :loading="loadingMore"
          @load-more="handleLoadMore"
          class="results-virtual-list"
        >
          <template #default="{ item: result }">
            <div class="result-virtual-item">
              <ResultCard
                :result="result"
                @view="handleViewResult"
                @export="handleExportResult"
                @delete="handleDeleteResult"
                @duplicate="handleDuplicateSession"
              />
            </div>
          </template>
          
          <template #loading>
            <div class="virtual-loading">
              <a-spin size="small" />
              <span>加载更多结果...</span>
            </div>
          </template>
          
          <template #no-more>
            <div class="virtual-no-more">
              已显示全部 {{ displayResults.length }} 个结果
            </div>
          </template>
        </VirtualScroll>

        <!-- 普通列表模式 -->
        <div v-else>
          <div class="results-list__grid">
            <ResultCard
              v-for="result in displayResults"
              :key="result.id"
              v-memo="[result.id, result.updatedAt]"
              :result="result"
              @view="handleViewResult"
              @export="handleExportResult"
              @delete="handleDeleteResult"
              @duplicate="handleDuplicateSession"
            />
          </div>

          <!-- 分页 -->
          <div v-if="!useVirtualScroll && totalPages > 1" class="results-list__pagination">
            <a-pagination
              v-model:current="currentPage"
              v-model:page-size="pageSize"
              :total="filteredTotal"
              :show-size-changer="true"
              :show-quick-jumper="true"
              :show-total="(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`"
              @change="handlePageChange"
              @show-size-change="handlePageSizeChange"
            />
          </div>
        </div>
      </a-spin>
    </div>

    <!-- 性能统计面板 -->
    <div v-if="showPerformanceStats" class="performance-stats">
      <a-card size="small" title="性能统计">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">总结果数:</span>
            <span class="stat-value">{{ totalResults }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">显示数:</span>
            <span class="stat-value">{{ displayResults.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">缓存命中率:</span>
            <span class="stat-value">{{ cacheHitRate }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">渲染模式:</span>
            <span class="stat-value">{{ useVirtualScroll ? '虚拟滚动' : '普通列表' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均加载时间:</span>
            <span class="stat-value">{{ averageLoadTime }}ms</span>
          </div>
        </div>
        <a-button size="small" @click="showPerformanceStats = false">关闭</a-button>
      </a-card>
    </div>

    <!-- 性能统计切换按钮 -->
    <a-button
      v-if="!showPerformanceStats"
      class="performance-toggle"
      size="small"
      @click="showPerformanceStats = true"
    >
      性能统计
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import { ReloadOutlined, ExportOutlined } from '@ant-design/icons-vue';
import type { Dayjs } from 'dayjs';
import VirtualScroll from '@/components/common/VirtualScroll.vue';
import ResultCard from './ResultCard.vue';
import { useListPerformance } from '@/utils/listCache';
import { useBrainstorm } from '@/composables/useBrainstorm';
import { useExport } from '@/composables/useExport';
import type { BrainstormResult, BrainstormStatus } from '@/types/brainstorm';

interface Props {
  results: BrainstormResult[];
  loading?: boolean;
  showPerformanceStats?: boolean;
}

interface Emits {
  (e: 'create-session'): void;
  (e: 'view-result', result: BrainstormResult): void;
  (e: 'delete-result', resultId: string): void;
  (e: 'duplicate-session', result: BrainstormResult): void;
  (e: 'refresh'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showPerformanceStats: false,
});

const emit = defineEmits<Emits>();

// 组合式函数
const { deleteSession } = useBrainstorm();
const { exportResult, exportMultipleResults } = useExport();
const { 
  getCachedData, 
  setCachedData, 
  cache 
} = useListPerformance<BrainstormResult>('brainstorm-results');

// 状态管理
const searchQuery = ref('');
const selectedStatus = ref<BrainstormStatus | ''>('');
const dateRange = ref<[Dayjs, Dayjs] | null>(null);
const useVirtualScroll = ref(false);
const virtualScrollThreshold = 30;
const currentPage = ref(1);
const pageSize = ref(10);
const loadingMore = ref(false);
const exportLoading = ref(false);
const showPerformanceStats = ref(props.showPerformanceStats);

// 性能统计
const cacheHits = ref(0);
const cacheMisses = ref(0);
const loadTimes = ref<number[]>([]);

// 计算属性
const totalResults = computed(() => props.results.length);

const hasFilters = computed(() => {
  return !!(searchQuery.value || selectedStatus.value || dateRange.value);
});

const filteredResults = computed(() => {
  const startTime = performance.now();
  const cacheKey = `filtered_${searchQuery.value}_${selectedStatus.value}_${dateRange.value?.[0]?.format('YYYY-MM-DD')}_${dateRange.value?.[1]?.format('YYYY-MM-DD')}`;
  
  // 尝试从缓存获取
  let cached = getCachedData(cacheKey);
  if (cached) {
    cacheHits.value++;
    return cached;
  }
  
  // 缓存未命中，重新计算
  cacheMisses.value++;
  let filtered = [...props.results];

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(result => 
      result.topic.toLowerCase().includes(query) ||
      result.summary?.toLowerCase().includes(query) ||
      result.agentResults.some(agentResult => 
        agentResult.content.toLowerCase().includes(query)
      )
    );
  }

  // 状态过滤
  if (selectedStatus.value) {
    filtered = filtered.filter(result => result.status === selectedStatus.value);
  }

  // 日期范围过滤
  if (dateRange.value) {
    const [startDate, endDate] = dateRange.value;
    filtered = filtered.filter(result => {
      const resultDate = new Date(result.createdAt);
      return resultDate >= startDate.toDate() && resultDate <= endDate.toDate();
    });
  }

  // 缓存结果
  setCachedData(cacheKey, filtered);
  
  // 记录加载时间
  const endTime = performance.now();
  loadTimes.value.push(endTime - startTime);
  if (loadTimes.value.length > 10) {
    loadTimes.value.shift(); // 只保留最近10次的加载时间
  }
  
  return filtered;
});

const filteredTotal = computed(() => filteredResults.value.length);

const totalPages = computed(() => Math.ceil(filteredTotal.value / pageSize.value));

const displayResults = computed(() => {
  if (useVirtualScroll.value) {
    return filteredResults.value;
  }
  
  // 分页显示
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return filteredResults.value.slice(startIndex, endIndex);
});

const hasMore = computed(() => {
  if (useVirtualScroll.value) {
    return false; // 虚拟滚动模式下一次性加载所有数据
  }
  return currentPage.value < totalPages.value;
});

const cacheHitRate = computed(() => {
  const total = cacheHits.value + cacheMisses.value;
  return total > 0 ? Math.round((cacheHits.value / total) * 100) : 0;
});

const averageLoadTime = computed(() => {
  if (loadTimes.value.length === 0) return 0;
  const sum = loadTimes.value.reduce((acc, time) => acc + time, 0);
  return Math.round(sum / loadTimes.value.length);
});

// 事件处理
const handleSearch = (value: string) => {
  searchQuery.value = value;
  currentPage.value = 1;
};

const handleStatusChange = () => {
  currentPage.value = 1;
};

const handleDateRangeChange = () => {
  currentPage.value = 1;
};

const handleVirtualScrollToggle = (enabled: boolean) => {
  useVirtualScroll.value = enabled;
  localStorage.setItem('results-list-virtual-scroll', String(enabled));
  currentPage.value = 1;
};

const handlePageChange = (page: number, size: number) => {
  currentPage.value = page;
  pageSize.value = size;
};

const handlePageSizeChange = (current: number, size: number) => {
  currentPage.value = 1;
  pageSize.value = size;
};

const handleLoadMore = async () => {
  if (loadingMore.value || !hasMore.value) return;
  
  loadingMore.value = true;
  
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
  } finally {
    loadingMore.value = false;
  }
};

const handleRefresh = () => {
  cache.clear();
  cacheHits.value = 0;
  cacheMisses.value = 0;
  loadTimes.value = [];
  emit('refresh');
};

const handleViewResult = (result: BrainstormResult) => {
  emit('view-result', result);
};

const handleExportResult = async (result: BrainstormResult) => {
  try {
    await exportResult(result);
    message.success('结果导出成功');
  } catch (error) {
    message.error('导出失败');
  }
};

const handleExportAll = async () => {
  if (filteredResults.value.length === 0) {
    message.warning('没有可导出的结果');
    return;
  }

  exportLoading.value = true;
  try {
    await exportMultipleResults(filteredResults.value);
    message.success(`成功导出 ${filteredResults.value.length} 个结果`);
  } catch (error) {
    message.error('批量导出失败');
  } finally {
    exportLoading.value = false;
  }
};

const handleDeleteResult = async (resultId: string) => {
  try {
    await deleteSession(resultId);
    message.success('结果删除成功');
    cache.clear();
    emit('delete-result', resultId);
  } catch (error) {
    message.error('删除失败');
  }
};

const handleDuplicateSession = (result: BrainstormResult) => {
  emit('duplicate-session', result);
};

// 监听结果列表变化，更新缓存
watch(() => props.results, (newResults) => {
  cache.clear();
  setCachedData('raw_results', newResults);
}, { deep: true });

// 初始化
onMounted(() => {
  // 恢复用户偏好
  const savedVirtualScroll = localStorage.getItem('results-list-virtual-scroll');
  if (savedVirtualScroll !== null) {
    useVirtualScroll.value = savedVirtualScroll === 'true';
  } else {
    useVirtualScroll.value = props.results.length > virtualScrollThreshold;
  }

  // 预热缓存
  if (props.results.length > 0) {
    setCachedData('raw_results', props.results);
  }
});
</script>

<style scoped lang="scss">
.optimized-results-list {
  position: relative;
  
  .results-list__toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .search-input {
      width: 350px;
    }
  }

  .results-list__search {
    flex: 1;
  }

  .results-list__filters {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .results-list__actions {
    display: flex;
    gap: 8px;
  }

  .results-list__content {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .results-list__empty {
    padding: 48px 0;
    text-align: center;
  }

  .results-list__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }

  .results-list__pagination {
    display: flex;
    justify-content: center;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #f0f0f0;
  }

  .results-virtual-list {
    height: 700px;
  }

  .result-virtual-item {
    padding: 10px;
    height: 260px; // 280px - 20px padding
  }

  .virtual-loading,
  .virtual-no-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    color: #666;
    font-size: 14px;
  }

  .performance-stats {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    max-width: 300px;

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      margin-bottom: 12px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }

    .stat-label {
      color: #666;
    }

    .stat-value {
      font-weight: 500;
      color: #1890ff;
    }
  }

  .performance-toggle {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999;
  }
}

@media (max-width: 768px) {
  .optimized-results-list {
    .results-list__toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;

      .search-input {
        width: 100%;
      }
    }

    .results-list__filters {
      flex-direction: column;
      gap: 8px;
    }

    .results-list__actions {
      justify-content: center;
    }

    .results-list__grid {
      grid-template-columns: 1fr;
    }

    .results-virtual-list {
      height: 500px;
    }

    .performance-stats {
      position: relative;
      bottom: auto;
      right: auto;
      margin-top: 16px;
      max-width: none;
    }

    .performance-toggle {
      position: relative;
      bottom: auto;
      right: auto;
      margin-top: 16px;
    }
  }
}
</style>