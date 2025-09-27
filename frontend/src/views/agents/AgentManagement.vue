<template>
  <div class="agent-management">
    <!-- 页面头部 -->
    <div class="agent-management__header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">代理管理</h1>
          <p class="page-description">
            创建和管理你的AI代理，为头脑风暴会话提供专业的多角度分析
          </p>
        </div>
        
        <div class="header-actions">
          <a-button-group>
            <a-button @click="handleImport" :icon="h(ImportOutlined)">
              导入
            </a-button>
            <a-button @click="handleExportAll" :icon="h(ExportOutlined)">
              导出
            </a-button>
          </a-button-group>
          
          <a-button
            type="primary"
            size="large"
            @click="handleCreateAgent"
            :icon="h(PlusOutlined)"
          >
            创建代理
          </a-button>
        </div>
      </div>
      
      <!-- 统计信息 -->
      <div class="stats-cards">
        <div class="stats-card">
          <div class="stats-icon">
            <RobotOutlined />
          </div>
          <div class="stats-content">
            <div class="stats-number">{{ stats.totalAgents }}</div>
            <div class="stats-label">总代理数</div>
          </div>
        </div>
        
        <div class="stats-card">
          <div class="stats-icon active">
            <CheckCircleOutlined />
          </div>
          <div class="stats-content">
            <div class="stats-number">{{ stats.activeAgents }}</div>
            <div class="stats-label">活跃代理</div>
          </div>
        </div>
        
        <div class="stats-card">
          <div class="stats-icon sessions">
            <BulbOutlined />
          </div>
          <div class="stats-content">
            <div class="stats-number">{{ stats.totalSessions }}</div>
            <div class="stats-label">参与会话</div>
          </div>
        </div>
        
        <div class="stats-card">
          <div class="stats-icon roles">
            <TeamOutlined />
          </div>
          <div class="stats-content">
            <div class="stats-number">{{ stats.uniqueRoles }}</div>
            <div class="stats-label">角色类型</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 代理列表 -->
    <div class="agent-management__content">
      <AgentList
        :loading="loading"
        @create-new="handleCreateAgent"
        @edit="handleEditAgent"
        @delete="handleDeleteAgent"
        @duplicate="handleDuplicateAgent"
        @test="handleTestAgent"
      />
    </div>

    <!-- 创建/编辑代理模态框 -->
    <a-modal
      v-model:open="formModalVisible"
      :title="editingAgent ? '编辑代理' : '创建代理'"
      :width="900"
      :footer="null"
      :destroy-on-close="true"
      @cancel="handleFormCancel"
    >
      <AgentForm
        :agent="editingAgent"
        :available-models="availableModels"
        @submit="handleFormSubmit"
        @cancel="handleFormCancel"
      />
    </a-modal>

    <!-- 代理详情模态框 -->
    <a-modal
      v-model:open="detailModalVisible"
      title="代理详情"
      :width="800"
      :footer="null"
      @cancel="detailModalVisible = false"
    >
      <AgentDetail
        v-if="viewingAgent"
        :agent="viewingAgent"
        @edit="handleEditFromDetail"
        @close="detailModalVisible = false"
      />
    </a-modal>

    <!-- 测试代理模态框 -->
    <a-modal
      v-model:open="testModalVisible"
      title="测试代理"
      :width="700"
      :footer="null"
      @cancel="testModalVisible = false"
    >
      <AgentTester
        v-if="testingAgent"
        :agent="testingAgent"
        @close="testModalVisible = false"
      />
    </a-modal>

    <!-- 版本历史模态框 -->
    <a-modal
      v-model:open="versionsModalVisible"
      title="版本历史"
      :width="800"
      :footer="null"
      @cancel="versionsModalVisible = false"
    >
      <AgentVersions
        v-if="versionAgent"
        :agent="versionAgent"
        @restore="handleRestoreVersion"
        @close="versionsModalVisible = false"
      />
    </a-modal>

    <!-- 导入文件上传 -->
    <input
      ref="importFileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleImportFile"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  BulbOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue';
import AgentList from '@/components/agent/AgentList.vue';
import AgentForm from '@/components/agent/AgentForm.vue';
import AgentDetail from '@/components/agent/AgentDetail.vue';
import AgentTester from '@/components/agent/AgentTester.vue';
import AgentVersions from '@/components/agent/AgentVersions.vue';
import { useAgents } from '@/composables/useAgents';
import { agentService } from '@/services/agentService';
import type { Agent, AgentFormData, AIModel } from '@/types/agent';

// 组合式函数
const {
  agents,
  loading,
  fetchAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  duplicateAgent,
} = useAgents();

// 模态框状态
const formModalVisible = ref(false);
const detailModalVisible = ref(false);
const testModalVisible = ref(false);
const versionsModalVisible = ref(false);

// 当前操作的代理
const editingAgent = ref<Agent | null>(null);
const viewingAgent = ref<Agent | null>(null);
const testingAgent = ref<Agent | null>(null);
const versionAgent = ref<Agent | null>(null);

// 其他状态
const availableModels = ref<AIModel[]>([]);
const importFileInput = ref<HTMLInputElement>();

// 统计信息
const stats = computed(() => {
  const agentList = agents.value || [];
  const totalAgents = agentList.length;
  const activeAgents = agentList.filter(agent => agent.status === 'ACTIVE').length;
  const uniqueRoles = new Set(agentList.map(agent => agent.roleType)).size;
  
  return {
    totalAgents,
    activeAgents,
    totalSessions: 0, // 这里需要从后端获取实际数据
    uniqueRoles,
  };
});

// 事件处理
const handleCreateAgent = () => {
  editingAgent.value = null;
  formModalVisible.value = true;
};

const handleEditAgent = (agent: Agent) => {
  editingAgent.value = agent;
  formModalVisible.value = true;
};

const handleEditFromDetail = (agent: Agent) => {
  detailModalVisible.value = false;
  editingAgent.value = agent;
  formModalVisible.value = true;
};

const handleDeleteAgent = async (agentId: number) => {
  try {
    await deleteAgent(agentId);
    message.success('代理删除成功');
  } catch (error: any) {
    message.error(error.message || '删除代理失败');
  }
};

const handleDuplicateAgent = async (agent: Agent) => {
  try {
    const newName = `${agent.name} (副本)`;
    await duplicateAgent(agent.id, newName);
    message.success('代理复制成功');
  } catch (error: any) {
    message.error(error.message || '复制代理失败');
  }
};

const handleTestAgent = (agent: Agent) => {
  testingAgent.value = agent;
  testModalVisible.value = true;
};

const handleViewDetails = (agent: Agent) => {
  viewingAgent.value = agent;
  detailModalVisible.value = true;
};

const handleViewVersions = (agent: Agent) => {
  versionAgent.value = agent;
  versionsModalVisible.value = true;
};

const handleFormSubmit = async (agentData: AgentFormData) => {
  try {
    if (editingAgent.value) {
      // 更新代理
      await updateAgent(editingAgent.value.id, agentData);
      message.success('代理更新成功');
    } else {
      // 创建代理
      await createAgent(agentData);
      message.success('代理创建成功');
    }
    formModalVisible.value = false;
    editingAgent.value = null;
  } catch (error: any) {
    message.error(error.message || '操作失败');
  }
};

const handleFormCancel = () => {
  formModalVisible.value = false;
  editingAgent.value = null;
};

const handleRestoreVersion = async (agent: Agent, versionId: number) => {
  try {
    await agentService.restoreAgentVersion(agent.id, versionId);
    message.success('版本恢复成功');
    versionsModalVisible.value = false;
    await fetchAgents(); // 刷新列表
  } catch (error: any) {
    message.error(error.message || '版本恢复失败');
  }
};

// 导入导出功能
const handleImport = () => {
  importFileInput.value?.click();
};

const handleImportFile = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  try {
    await agentService.importAgent(file);
    message.success('代理导入成功');
    await fetchAgents(); // 刷新列表
  } catch (error: any) {
    message.error(error.message || '导入失败');
  } finally {
    // 清空文件输入
    target.value = '';
  }
};

const handleExportAll = () => {
  Modal.confirm({
    title: '导出所有代理',
    content: '确定要导出所有代理的配置吗？',
    okText: '导出',
    cancelText: '取消',
    onOk: async () => {
      try {
        // 这里应该调用批量导出API
        message.info('批量导出功能开发中...');
      } catch (error: any) {
        message.error(error.message || '导出失败');
      }
    },
  });
};

const handleExportAgent = async (agent: Agent) => {
  try {
    const blob = await agentService.exportAgent(agent.id);
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agent-${agent.name}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    message.success('代理配置导出成功');
  } catch (error: any) {
    message.error(error.message || '导出失败');
  }
};

// 初始化
onMounted(async () => {
  try {
    await Promise.all([
      fetchAgents(),
      loadAvailableModels(),
    ]);
  } catch (error: any) {
    message.error('页面初始化失败');
  }
});

const loadAvailableModels = async () => {
  try {
    availableModels.value = await agentService.getAvailableModels();
  } catch (error) {
    console.error('获取可用模型失败:', error);
    // 使用默认模型列表
    availableModels.value = [];
  }
};
</script>

<style scoped lang="scss">
.agent-management {
  padding: 24px;
  min-height: 100vh;
  background: #f5f5f5;

  &__header {
    margin-bottom: 24px;
  }

  &__content {
    // AgentList组件的样式在其自身文件中定义
  }
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-info {
  flex: 1;
}

.page-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
  color: #262626;
}

.page-description {
  margin: 0;
  font-size: 16px;
  color: #8c8c8c;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stats-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.stats-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f0f0f0;
  color: #8c8c8c;
  font-size: 20px;

  &.active {
    background: #f6ffed;
    color: #52c41a;
  }

  &.sessions {
    background: #fff7e6;
    color: #fa8c16;
  }

  &.roles {
    background: #f0f5ff;
    color: #1890ff;
  }
}

.stats-content {
  flex: 1;
}

.stats-number {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  line-height: 1;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 14px;
  color: #8c8c8c;
}

@media (max-width: 768px) {
  .agent-management {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .header-actions {
    justify-content: center;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-card {
    padding: 16px;
  }

  .stats-number {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>