<template>
  <div class="agent-list">
    <!-- 搜索和过滤栏 -->
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

    <!-- 代理列表 -->
    <div class="agent-list__content">
      <a-spin :spinning="loading" size="large">
        <div v-if="filteredAgents.length === 0 && !loading" class="agent-list__empty">
          <a-empty
            :description="searchQuery || selectedRoleType || selectedStatus ? '没有找到匹配的代理' : '还没有创建任何代理'"
          >
            <a-button v-if="!searchQuery && !selectedRoleType && !selectedStatus" type="primary" @click="handleCreateNew">
              创建第一个代理
            </a-button>
          </a-empty>
        </div>

        <div v-else class="agent-list__grid">
          <AgentCard
            v-for="agent in filteredAgents"
            :key="agent.id"
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
      </a-spin>

      <!-- 分页 -->
      <div v-if="pagination.total > pagination.pageSize" class="agent-list__pagination">
        <a-pagination
          v-model:current="pagination.current"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :show-size-changer="true"
          :show-quick-jumper="true"
          :show-total="(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`"
          @change="handlePageChange"
          @show-size-change="handlePageSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue';
import { message } from 'ant-design-vue';
import {
  PlusOutlined,
  DownOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons-vue';
import AgentCard from './AgentCard.vue';
import { useAgents } from '@/composables/useAgents';
import type { Agent, AgentStatus } from '@/types/agent';

interface Props {
  loading?: boolean;
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
});

const emit = defineEmits<Emits>();

// 使用代理管理组合式函数
const { agents, fetchAgents, deleteAgent, updateAgentStatus, deleteAgents } = useAgents();

// 搜索和过滤状态
const searchQuery = ref('');
const selectedRoleType = ref<string>('');
const selectedStatus = ref<AgentStatus | ''>('');
const selectedAgentIds = ref<number[]>([]);

// 分页状态
const pagination = ref({
  current: 1,
  pageSize: 12,
  total: 0,
});

// 内部加载状态
const loading = ref(false);

// 角色类型列表（从现有代理中提取）
const roleTypes = computed(() => {
  const roles = new Set(agents.value.map(agent => agent.roleType));
  return Array.from(roles).sort();
});

// 过滤后的代理列表
const filteredAgents = computed(() => {
  let filtered = agents.value;

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(agent => 
      agent.name.toLowerCase().includes(query) ||
      agent.roleType.toLowerCase().includes(query)
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

  // 更新分页总数
  pagination.value.total = filtered.length;

  // 分页
  const start = (pagination.value.current - 1) * pagination.value.pageSize;
  const end = start + pagination.value.pageSize;
  return filtered.slice(start, end);
});

// 搜索处理
const handleSearch = (value: string) => {
  searchQuery.value = value;
  pagination.value.current = 1; // 重置到第一页
};

const handleSearchChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.value) {
    searchQuery.value = '';
    pagination.value.current = 1;
  }
};

// 过滤处理
const handleRoleTypeChange = () => {
  pagination.value.current = 1;
};

const handleStatusChange = () => {
  pagination.value.current = 1;
};

// 分页处理
const handlePageChange = (page: number, pageSize: number) => {
  pagination.value.current = page;
  pagination.value.pageSize = pageSize;
};

const handlePageSizeChange = (current: number, size: number) => {
  pagination.value.current = 1;
  pagination.value.pageSize = size;
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

// 事件处理
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
        selectedAgentIds.value = [];
        break;
      case 'activate':
        await Promise.all(
          selectedAgentIds.value.map(id => updateAgentStatus(id, 'ACTIVE'))
        );
        message.success(`成功激活 ${selectedAgentIds.value.length} 个代理`);
        selectedAgentIds.value = [];
        break;
      case 'deactivate':
        await Promise.all(
          selectedAgentIds.value.map(id => updateAgentStatus(id, 'INACTIVE'))
        );
        message.success(`成功停用 ${selectedAgentIds.value.length} 个代理`);
        selectedAgentIds.value = [];
        break;
    }
  } catch (error) {
    message.error('批量操作失败');
  }
};

// 初始化
onMounted(async () => {
  loading.value = true;
  try {
    await fetchAgents();
  } catch (error) {
    message.error('获取代理列表失败');
  } finally {
    loading.value = false;
  }
});

// 监听搜索和过滤变化，重置选中状态
watch([searchQuery, selectedRoleType, selectedStatus], () => {
  selectedAgentIds.value = [];
});
</script>

<style scoped lang="scss">
.agent-list {
  &__toolbar {
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

  &__search {
    flex: 1;
  }

  &__filters {
    display: flex;
    gap: 12px;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &__content {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  &__empty {
    padding: 48px 0;
    text-align: center;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  &__pagination {
    display: flex;
    justify-content: center;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #f0f0f0;
  }
}

@media (max-width: 768px) {
  .agent-list {
    &__toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;

      .search-input {
        width: 100%;
      }
    }

    &__filters {
      flex-direction: column;
      gap: 8px;
    }

    &__actions {
      justify-content: center;
    }

    &__grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>