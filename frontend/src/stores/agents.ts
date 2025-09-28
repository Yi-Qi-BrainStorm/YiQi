import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { agentService } from '@/services/agentService';
import type { 
  Agent, 
  AgentFormData, 
  AIModel,
  AgentStatus 
} from '@/types/agent';
import type { PaginatedResponse } from '@/types/api';

/**
 * 代理管理状态Store
 */
export const useAgentStore = defineStore('agents', () => {
  // 状态
  const agents = ref<Agent[]>([]);
  const selectedAgentIds = ref<number[]>([]);
  const availableModels = ref<AIModel[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // 计算属性
  const selectedAgents = computed(() => 
    agents.value.filter(agent => selectedAgentIds.value.includes(agent.id))
  );

  const isLoading = computed(() => loading.value);

  const hasSelectedAgents = computed(() => selectedAgentIds.value.length > 0);

  const selectedAgentsCount = computed(() => selectedAgentIds.value.length);

  /**
   * 获取代理列表
   */
  const fetchAgents = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    roleType?: string;
    status?: AgentStatus;
  }): Promise<void> => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await agentService.getAgents({
        status: params?.status,
      });
      
      // 后端直接返回数组，前端进行过滤和分页
      let filteredAgents = response;
      
      // 应用搜索过滤
      if (params?.search) {
        const searchTerm = params.search.toLowerCase();
        filteredAgents = filteredAgents.filter(agent => 
          agent.name.toLowerCase().includes(searchTerm) ||
          agent.roleType.toLowerCase().includes(searchTerm)
        );
      }
      
      // 应用角色类型过滤
      if (params?.roleType) {
        filteredAgents = filteredAgents.filter(agent => 
          agent.roleType === params.roleType
        );
      }
      
      // 计算分页
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedAgents = filteredAgents.slice(startIndex, endIndex);
      
      agents.value = paginatedAgents;
      pagination.value = {
        page,
        limit,
        total: filteredAgents.length,
        totalPages: Math.ceil(filteredAgents.length / limit),
        hasNext: endIndex < filteredAgents.length,
        hasPrev: page > 1
      };
    } catch (err: any) {
      error.value = err.message || '获取代理列表失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取单个代理详情
   */
  const fetchAgent = async (id: number): Promise<Agent> => {
    try {
      const agent = await agentService.getAgent(id);
      
      // 更新本地列表中的代理信息
      const index = agents.value.findIndex(a => a.id === id);
      if (index !== -1) {
        agents.value[index] = agent;
      }
      
      return agent;
    } catch (err: any) {
      error.value = err.message || '获取代理详情失败';
      throw err;
    }
  };

  /**
   * 创建代理
   */
  const createAgent = async (agentData: AgentFormData): Promise<Agent> => {
    loading.value = true;
    error.value = null;
    
    try {
      const newAgent = await agentService.createAgent(agentData);
      agents.value.unshift(newAgent); // 添加到列表开头
      return newAgent;
    } catch (err: any) {
      error.value = err.message || '创建代理失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新代理
   */
  const updateAgent = async (id: number, agentData: Partial<AgentFormData>): Promise<Agent> => {
    loading.value = true;
    error.value = null;
    
    try {
      const updatedAgent = await agentService.updateAgent(id, agentData);
      
      // 更新本地列表
      const index = agents.value.findIndex(agent => agent.id === id);
      if (index !== -1) {
        agents.value[index] = updatedAgent;
      }
      
      return updatedAgent;
    } catch (err: any) {
      error.value = err.message || '更新代理失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除代理
   */
  const deleteAgent = async (id: number): Promise<void> => {
    loading.value = true;
    error.value = null;
    
    try {
      await agentService.deleteAgent(id);
      
      // 从本地列表中移除
      agents.value = agents.value.filter(agent => agent.id !== id);
      
      // 从选中列表中移除
      selectedAgentIds.value = selectedAgentIds.value.filter(agentId => agentId !== id);
    } catch (err: any) {
      error.value = err.message || '删除代理失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 批量删除代理
   */
  const deleteAgents = async (ids: number[]): Promise<void> => {
    loading.value = true;
    error.value = null;
    
    try {
      await agentService.deleteAgents(ids);
      
      // 从本地列表中移除
      agents.value = agents.value.filter(agent => !ids.includes(agent.id));
      
      // 清除选中状态
      selectedAgentIds.value = selectedAgentIds.value.filter(id => !ids.includes(id));
    } catch (err: any) {
      error.value = err.message || '批量删除代理失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 复制代理
   */
  const duplicateAgent = async (id: number, name?: string): Promise<Agent> => {
    loading.value = true;
    error.value = null;
    
    try {
      const duplicatedAgent = await agentService.duplicateAgent(id, name);
      agents.value.unshift(duplicatedAgent); // 添加到列表开头
      return duplicatedAgent;
    } catch (err: any) {
      error.value = err.message || '复制代理失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 选择代理
   */
  const selectAgent = (agentId: number): void => {
    if (!selectedAgentIds.value.includes(agentId)) {
      selectedAgentIds.value.push(agentId);
    }
  };

  /**
   * 取消选择代理
   */
  const deselectAgent = (agentId: number): void => {
    selectedAgentIds.value = selectedAgentIds.value.filter(id => id !== agentId);
  };

  /**
   * 切换代理选择状态
   */
  const toggleAgentSelection = (agentId: number): void => {
    if (selectedAgentIds.value.includes(agentId)) {
      deselectAgent(agentId);
    } else {
      selectAgent(agentId);
    }
  };

  /**
   * 全选代理
   */
  const selectAllAgents = (): void => {
    selectedAgentIds.value = agents.value.map(agent => agent.id);
  };

  /**
   * 清除所有选择
   */
  const clearSelection = (): void => {
    selectedAgentIds.value = [];
  };

  /**
   * 批量选择代理
   */
  const selectAgents = (agentIds: number[]): void => {
    // 合并选择，去重
    const newSelection = [...new Set([...selectedAgentIds.value, ...agentIds])];
    selectedAgentIds.value = newSelection;
  };

  /**
   * 获取可用的AI模型列表
   */
  const fetchAvailableModels = async (): Promise<void> => {
    try {
      const models = await agentService.getAvailableModels();
      availableModels.value = models;
    } catch (err: any) {
      error.value = err.message || '获取AI模型列表失败';
      throw err;
    }
  };

  /**
   * 测试代理配置
   */
  const testAgent = async (id: number, testPrompt: string): Promise<{
    success: boolean;
    response?: string;
    error?: string;
    processingTime: number;
  }> => {
    try {
      return await agentService.testAgent(id, testPrompt);
    } catch (err: any) {
      error.value = err.message || '测试代理失败';
      throw err;
    }
  };

  /**
   * 清除错误状态
   */
  const clearError = (): void => {
    error.value = null;
  };

  /**
   * 重置状态
   */
  const reset = (): void => {
    agents.value = [];
    selectedAgentIds.value = [];
    availableModels.value = [];
    loading.value = false;
    error.value = null;
    pagination.value = {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    };
  };

  return {
    // 状态
    agents,
    selectedAgentIds,
    availableModels,
    loading,
    error,
    pagination,
    
    // 计算属性
    selectedAgents,
    isLoading,
    hasSelectedAgents,
    selectedAgentsCount,
    
    // 方法
    fetchAgents,
    fetchAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    deleteAgents,
    duplicateAgent,
    selectAgent,
    deselectAgent,
    toggleAgentSelection,
    selectAllAgents,
    clearSelection,
    selectAgents,
    fetchAvailableModels,
    testAgent,
    clearError,
    reset,
  };
});