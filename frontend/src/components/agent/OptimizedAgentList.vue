<template>
  <div class="optimized-agent-list">
    <!-- 工具栏 -->
    <div class="agent-list__toolbar">
      <div class="agent-list__search">
        <a-input-search
          v-model:value="searchQuery"
          placeholder="搜索代理名称或角色..."
          allow-clear
          @search="handleSearch"
          @change="handleSearchChange"
          class="search-input"
        />
      </div>
      
      <div class="agent-list__filters">
        <a-select
          v-model:value="selectedRoleType"
          placeholder="选择角色类型"
          allow-clear
          style="width: 200px"
          @change="handleRoleTypeChange"
        >
          <a-select-option value="">全部角色</a-select-option>
          <a-select-option
            v-for="role in roleTypes"
            :key="role"
            :value="role"
          >
            {{ role }}
          </a-select-option>
        </a-select>

        <a-select
          v-model:value="selectedStatus"
          placeholder="选择状态"
          allow-clear
          style="width: 150px"
          @change="handleStatusChange"
        >
          <a-select-option value="">全部状态</a-select-option>
          <a-select-option value="ACTIVE">活跃</a-select-option>
          <a-select-option value="INACTIVE">非活跃</a-select-option>
        </a-select>

        <!-- 性能优化开关 -->
        <a-switch
          v-model:checked="useVirtualScroll"
          checked-children="虚拟滚动"
          un-checked-children="普通模式"
          @change="handleVirtualScrollToggle"
        />
      </div>

      <div class="agent-list__actions">
        <a-button
          type="primary"
          @click="handleCreateNew"
          :icon="h(PlusOutlined)"
        >
          创建代理
        </a-button>
        
        <a-dropdown v-if="selectedAgentIds.length > 0">
          <a-button>
            批量操作 ({{ selectedAgentIds.length }})
            <DownOutlined />
          </a-button>
          <template #overlay>
            <a-menu @click="handleBatchAction">
              <a-menu-item key="delete">
                <DeleteOutlined />
                批量删除
              </a-menu-item>
              <a-menu-item key="activate">
                <CheckCircleOutlined />
                批量激活
              </a-menu-item>
              <a-menu-item key="deactivate">
                <StopOutlined />
                批量停用
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="agent-list__content">
      <a-spin :spinning="loading" size="large">
        <!-- 空状态 -->
        <div v-if="displayAgents.length === 0 && !loading" class="agent-list__empty">
          <a-empty
            :description="hasFilters ? '没有找到匹配的代理' : '还没有创建任何代理'"
          >
            <a-button v-if="!hasFilters" type="primary" @click="handleCreateNew">
              创建第一个代理
            </a-button>
          </a-empty>
        </div>

        <!-- 虚拟滚动模式 -->
        <VirtualScroll
          v-else-if="useVirtualScroll && displayAgents.length > virtualScrollThreshold"
          :items="displayAgents"
          :item-height="200"
          container-height="600px"
          :has-more="hasMore"
          :loading="loadingMore"
          @load-more="handleLoadMore"
          class="agent-virtual-list"
        >
          <template #default="{ item: agent }">
            <div class="agent-virtual-item">
              <AgentCard
                :agent="agent"
                :selected="selectedAgentIds.includes(agent.id)"
                @select="handleAgentSelect"
                @edit="handleEdit"
                @delete="handleDelete"
                @duplicate="handleDuplicate"
                @test="handleTest"
                @toggle-status="handleToggleStatus"
              />
            </div>
          </template>
          
          <template #loading>
            <div class="virtual-loading">
              <a-spin size="small" />
              <span>加载更多代理...</span>
            </div>
          </template>
          
          <template #no-more>
            <div class="virtual-no-more">
              已显示全部 {{ displayAgents.length }} 个代理
            </div>
          </template>
        </VirtualScroll>

        <!-- 普通网格模式 -->
        <div v-else>
          <div class="agent-list__grid">
            <AgentCard
              v-for="agent in displayAgents"
              :key="agent.id"
              v-memo="[agent.id, agent.updatedAt, selectedAgentIds.includes(agent.id)]"
              :agent="agent"
              :selected="selectedAgentIds.includes(agent.id)"
              @select="handleAgentSelect"
              @edit="handleEdit"
              @delete="handleDelete"
              @duplicate="handleDuplicate"
              @test="handleTest"
              @toggle-status="handleToggleStatus"
            />
          </div>

          <!-- 分页 -->
          <div v-if="!useVirtualScroll && totalPages > 1" class="agent-list__pagination">
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
            <span class="stat-label">总代理数:</span>
            <span class="stat-value">{{ totalAgents }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">显示数:</span>
            <span class="stat-value">{{ displayAgents.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">缓存命中率:</span>
            <span class="stat-value">{{ cacheHitRate }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">渲染模式:</span>
            <span class="stat-value">{{ useVirtualScroll ? '虚拟滚动' : '普通网格' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最后更新:</span>
            <span class="stat-value">{{ lastUpdateTime }}</span>
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
import { ref, computed, onMounted, watch, h, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import {
  PlusOutlined,
  DownOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons-vue';
import AgentCard from './AgentCard.vue';
import VirtualScroll from '@/components/common/VirtualScroll.vue';
import { useAgents } from '@/composables/useAgents';
import { useListPerformance } from '@/utils/listCache';
import type { Agent, AgentStatus } from '@/types/agent';

interface Props {
  loading?: boolean;
  showPerformanceStats?: boolean;
}

interface Emits {
  (e: 'create-new'): void;
  (e: 'edit', agent: Agent): void;
  (e: 'delete', agentId: number): void;
  (e: 'duplicate', agent: Agent): void;
  (e: 'test', agent: Agent): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showPerformanceStats: false,
});

const emit = defineEmits<Emits>();

// 使用代理管理组合式函数
const { agents, fetchAgents, deleteAgent, updateAgentStatus, deleteAgents } = useAgents();

// 性能优化相关
const { 
  getCachedData, 
  setCachedData, 
  getFilteredData,
  cache 
} = useListPerformance<Agent>('optimized-agent-list');

// 状态管理
const searchQuery = ref('');
const selectedRoleType = ref<string>('');
const selectedStatus = ref<AgentStatus | ''>('');
const selectedAgentIds = ref<number[]>([]);
const useVirtualScroll = ref(false);
const virtualScrollThreshold = 50;
const currentPage = ref(1);
const pageSize = ref(12);
const loadingMore = ref(false);
const loading = ref(false);
const showPerformanceStats = ref(props.showPerformanceStats);

// 缓存和性能统计
const cacheHits = ref(0);
const cacheMisses = ref(0);
const lastUpdateTime = ref(new Date().toLocaleTimeString());

// 计算属性
const totalAgents = computed(() => agents.value.length);

const roleTypes = computed(() => {
  const roles = new Set(agents.value.map(agent => agent.roleType));
  return Array.from(roles).sort();
});

const hasFilters = computed(() => {
  return !!(searchQuery.value || selectedRoleType.value || selectedStatus.value);
});

const filteredAgents = computed(() => {
  const cacheKey = `filtered_${searchQuery.value}_${selectedRoleType.value}_${selectedStatus.value}`;
  
  // 尝试从缓存获取
  let cached = getCachedData(cacheKey);
  if (cached) {
    cacheHits.value++;
    return cached;
  }
  
  // 缓存未命中，重新计算
  cacheMisses.value++;
  let filtered = [...agents.value];

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(agent => 
      agent.name.toLowerCase().includes(query) ||
      agent.roleType.toLowerCase().includes(query) ||
      (agent.systemPrompt && agent.systemPrompt.toLowerCase().includes(query))
    );
  }

  // 角色类型过滤
  if (selectedRoleType.value) {
    filtered = filtered.filter(agent => agent.roleType === selectedRoleType.value);
  }

  // 状态过滤
  if (selectedStatus.value) {
    filtered = filtered.filter(agent => agent.status === selectedStatus.value);
  }

  // 缓存结果
  setCachedData(cacheKey, filtered);
  lastUpdateTime.value = new Date().toLocaleTimeString();
  
  return filtered;
});

const filteredTotal = computed(() => filteredAgents.value.length);

const totalPages = computed(() => Math.ceil(filteredTotal.value / pageSize.value));

const displayAgents = computed(() => {
  if (useVirtualScroll.value) {
    return filteredAgents.value;
  }
  
  // 分页显示
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return filteredAgents.value.slice(startIndex, endIndex);
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

// 事件处理
const handleSearch = (value: string) => {
  searchQuery.value = value;
  currentPage.value = 1;
  selectedAgentIds.value = [];
};

const handleSearchChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.value) {
    searchQuery.value = '';
    currentPage.value = 1;
    selectedAgentIds.value = [];
  }
};

const handleRoleTypeChange = () => {
  currentPage.value = 1;
  selectedAgentIds.value = [];
};

const handleStatusChange = () => {
  currentPage.value = 1;
  selectedAgentIds.value = [];
};

const handleVirtualScrollToggle = (enabled: boolean) => {
  useVirtualScroll.value = enabled;
  
  // 保存用户偏好
  localStorage.setItem('agent-list-virtual-scroll', String(enabled));
  
  // 重置分页
  currentPage.value = 1;
  selectedAgentIds.value = [];
};

const handlePageChange = (page: number, size: number) => {
  currentPage.value = page;
  pageSize.value = size;
  selectedAgentIds.value = [];
};

const handlePageSizeChange = (current: number, size: number) => {
  currentPage.value = 1;
  pageSize.value = size;
  selectedAgentIds.value = [];
};

const handleLoadMore = async () => {
  if (loadingMore.value || !hasMore.value) return;
  
  loadingMore.value = true;
  
  try {
    // 在虚拟滚动模式下，这个方法主要用于触发额外的数据加载
    // 在当前实现中，我们一次性加载所有数据，所以这里主要是模拟
    await new Promise(resolve => setTimeout(resolve, 500));
  } finally {
    loadingMore.value = false;
  }
};

// 代理选择
const handleAgentSelect = (agentId: number, selected: boolean) => {
  if (selected) {
    selectedAgentIds.value.push(agentId);
  } else {
    const index = selectedAgentIds.value.indexOf(agentId);
    if (index > -1) {
      selectedAgentIds.value.splice(index, 1);
    }
  }
};

// 代理操作
const handleCreateNew = () => {
  emit('create-new');
};

const handleEdit = (agent: Agent) => {
  emit('edit', agent);
};

const handleDelete = async (agentId: number) => {
  try {
    await deleteAgent(agentId);
    message.success('代理删除成功');
    
    // 清除相关缓存
    cache.clear();
    
    // 从选中列表中移除
    const index = selectedAgentIds.value.indexOf(agentId);
    if (index > -1) {
      selectedAgentIds.value.splice(index, 1);
    }
  } catch (error) {
    message.error('删除代理失败');
  }
};

const handleDuplicate = (agent: Agent) => {
  emit('duplicate', agent);
};

const handleTest = (agent: Agent) => {
  emit('test', agent);
};

const handleToggleStatus = async (agent: Agent) => {
  try {
    const newStatus: AgentStatus = agent.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await updateAgentStatus(agent.id, newStatus);
    message.success(`代理已${newStatus === 'ACTIVE' ? '激活' : '停用'}`);
    
    // 清除相关缓存
    cache.clear();
  } catch (error) {
    message.error('状态更新失败');
  }
};

// 批量操作
const handleBatchAction = async ({ key }: { key: string }) => {
  if (selectedAgentIds.value.length === 0) return;

  try {
    switch (key) {
      case 'delete':
        await deleteAgents(selectedAgentIds.value);
        message.success(`成功删除 ${selectedAgentIds.value.length} 个代理`);
        break;
      case 'activate':
        await Promise.all(
          selectedAgentIds.value.map(id => updateAgentStatus(id, 'ACTIVE'))
        );
        message.success(`成功激活 ${selectedAgentIds.value.length} 个代理`);
        break;
      case 'deactivate':
        await Promise.all(
          selectedAgentIds.value.map(id => updateAgentStatus(id, 'INACTIVE'))
        );
        message.success(`成功停用 ${selectedAgentIds.value.length} 个代理`);
        break;
    }
    
    // 清除缓存并重置选中状态
    cache.clear();
    selectedAgentIds.value = [];
  } catch (error) {
    message.error('批量操作失败');
  }
};

// 监听代理列表变化，更新缓存
watch(() => agents.value, (newAgents) => {
  // 清除过滤缓存，因为原始数据已变化
  cache.clear();
  
  // 缓存原始数据
  setCachedData('raw_agents', newAgents);
  lastUpdateTime.value = new Date().toLocaleTimeString();
}, { deep: true });

// 初始化
onMounted(async () => {
  // 恢复用户偏好
  const savedVirtualScroll = localStorage.getItem('agent-list-virtual-scroll');
  if (savedVirtualScroll !== null) {
    useVirtualScroll.value = savedVirtualScroll === 'true';
  } else {
    // 根据数据量自动决定是否启用虚拟滚动
    useVirtualScroll.value = agents.value.length > virtualScrollThreshold;
  }

  loading.value = true;
  try {
    await fetchAgents();
    
    // 预热缓存
    if (agents.value.length > 0) {
      setCachedData('raw_agents', agents.value);
    }
  } catch (error) {
    message.error('获取代理列表失败');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.optimized-agent-list {
  position: relative;
  
  .agent-list__toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .search-input {
      width: 300px;
    }
  }

  .agent-list__search {
    flex: 1;
  }

  .agent-list__filters {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .agent-list__actions {
    display: flex;
    gap: 8px;
  }

  .agent-list__content {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .agent-list__empty {
    padding: 48px 0;
    text-align: center;
  }

  .agent-list__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .agent-list__pagination {
    display: flex;
    justify-content: center;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #f0f0f0;
  }

  .agent-virtual-list {
    height: 600px;
  }

  .agent-virtual-item {
    padding: 8px;
    height: 184px; // 200px - 16px padding
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
    max-width: 280px;

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
  .optimized-agent-list {
    .agent-list__toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;

      .search-input {
        width: 100%;
      }
    }

    .agent-list__filters {
      flex-direction: column;
      gap: 8px;
    }

    .agent-list__actions {
      justify-content: center;
    }

    .agent-list__grid {
      grid-template-columns: 1fr;
    }

    .agent-virtual-list {
      height: 400px;
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