import { computed } from 'vue';
import { useAgentStore } from '@/stores/agents';
import type { 
  Agent, 
  AgentFormData, 
  AIModel 
} from '@/types/agent';
import type { PaginatedResponse } from '@/types/api';

/**
 * 代理管理相关的组合式函数
 * 提供代理CRUD操作的响应式接口，添加代理选择和过滤功能
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
export function useAgents() {
  const agentStore = useAgentStore();

  // 响应式状态
  const agents = computed(() => agentStore.agents);
  const selectedAgentIds = computed(() => agentStore.selectedAgentIds);
  const selectedAgents = computed(() => agentStore.selectedAgents);
  const availableModels = computed(() => agentStore.availableModels);
  const loading = computed(() => agentStore.loading);
  const error = computed(() => agentStore.error);
  const pagination = computed(() => agentStore.pagination);
  const isLoading = computed(() => agentStore.isLoading);
  const hasSelectedAgents = computed(() => agentStore.hasSelectedAgents);
  const selectedAgentsCount = computed(() => agentStore.selectedAgentsCount);

  /**
   * 获取代理列表
   * Requirement 2.1: 用户访问代理管理页面时显示所有已创建的代理列表
   */
  const fetchAgents = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<void> => {
    return await agentStore.fetchAgents(params);
  };

  /**
   * 获取单个代理详情
   * Requirement 2.2: 用户点击代理时显示详细配置信息
   */
  const fetchAgent = async (id: string): Promise<Agent> => {
    return await agentStore.fetchAgent(id);
  };

  /**
   * 创建新代理
   * Requirement 2.3: 用户填写代理信息并保存时创建新的AI代理
   */
  const createAgent = async (agentData: AgentFormData): Promise<Agent> => {
    return await agentStore.createAgent(agentData);
  };

  /**
   * 更新代理配置
   * Requirement 2.4: 用户修改代理配置并保存时更新代理信息
   */
  const updateAgent = async (id: string, agentData: Partial<AgentFormData>): Promise<Agent> => {
    return await agentStore.updateAgent(id, agentData);
  };

  /**
   * 删除代理
   * Requirement 2.5: 用户确认删除代理时从系统中移除该代理
   */
  const deleteAgent = async (id: string): Promise<void> => {
    return await agentStore.deleteAgent(id);
  };

  /**
   * 批量删除代理
   * Requirement 2.5: 支持批量删除多个代理
   */
  const deleteAgents = async (ids: string[]): Promise<void> => {
    return await agentStore.deleteAgents(ids);
  };

  /**
   * 复制代理
   * Requirement 2.6: 用户选择复制代理时创建代理副本
   */
  const duplicateAgent = async (id: string, name?: string): Promise<Agent> => {
    return await agentStore.duplicateAgent(id, name);
  };

  /**
   * 选择代理
   * Requirement 2.6: 代理选择功能，用于头脑风暴会话
   */
  const selectAgent = (agentId: string): void => {
    agentStore.selectAgent(agentId);
  };

  /**
   * 取消选择代理
   */
  const deselectAgent = (agentId: string): void => {
    agentStore.deselectAgent(agentId);
  };

  /**
   * 切换代理选择状态
   */
  const toggleAgentSelection = (agentId: string): void => {
    agentStore.toggleAgentSelection(agentId);
  };

  /**
   * 全选代理
   */
  const selectAllAgents = (): void => {
    agentStore.selectAllAgents();
  };

  /**
   * 清除所有选择
   */
  const clearSelection = (): void => {
    agentStore.clearSelection();
  };

  /**
   * 批量选择代理
   */
  const selectAgents = (agentIds: string[]): void => {
    agentStore.selectAgents(agentIds);
  };

  /**
   * 获取可用的AI模型列表
   * Requirement 2.3: 提供AI模型选择选项
   */
  const fetchAvailableModels = async (): Promise<void> => {
    return await agentStore.fetchAvailableModels();
  };

  /**
   * 测试代理配置
   * Requirement 2.4: 测试代理配置是否正常工作
   */
  const testAgent = async (id: string, testPrompt: string): Promise<{
    success: boolean;
    response?: string;
    error?: string;
    processingTime: number;
  }> => {
    return await agentStore.testAgent(id, testPrompt);
  };

  /**
   * 过滤代理列表
   * Requirement 2.1: 提供代理过滤功能
   */
  const filterAgents = (filters: {
    search?: string;
    role?: string;
    modelType?: string;
  }) => {
    return computed(() => {
      let filtered = agents.value;

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(agent => 
          agent.name.toLowerCase().includes(searchTerm) ||
          agent.role.toLowerCase().includes(searchTerm) ||
          agent.systemPrompt.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.role) {
        filtered = filtered.filter(agent => 
          agent.role.toLowerCase().includes(filters.role!.toLowerCase())
        );
      }

      if (filters.modelType) {
        filtered = filtered.filter(agent => 
          agent.modelType === filters.modelType
        );
      }

      return filtered;
    });
  };

  /**
   * 按角色分组代理
   * Requirement 2.1: 提供代理分组显示功能
   */
  const groupAgentsByRole = computed(() => {
    const groups: Record<string, Agent[]> = {};
    
    agents.value.forEach(agent => {
      const role = agent.role || '未分类';
      if (!groups[role]) {
        groups[role] = [];
      }
      groups[role].push(agent);
    });

    return groups;
  });

  /**
   * 获取代理统计信息
   */
  const getAgentStats = computed(() => {
    const totalAgents = agents.value.length;
    const selectedCount = selectedAgentsCount.value;
    const roleStats: Record<string, number> = {};
    const modelStats: Record<string, number> = {};

    agents.value.forEach(agent => {
      // 统计角色分布
      const role = agent.role || '未分类';
      roleStats[role] = (roleStats[role] || 0) + 1;

      // 统计模型分布
      modelStats[agent.modelType] = (modelStats[agent.modelType] || 0) + 1;
    });

    return {
      totalAgents,
      selectedCount,
      roleStats,
      modelStats,
    };
  });

  /**
   * 验证代理配置
   * Requirement 2.3: 验证代理配置的完整性和有效性
   */
  const validateAgentConfig = (agentData: Partial<AgentFormData>): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    if (!agentData.name?.trim()) {
      errors.push('代理名称不能为空');
    }

    if (!agentData.role?.trim()) {
      errors.push('代理角色不能为空');
    }

    if (!agentData.systemPrompt?.trim()) {
      errors.push('系统提示词不能为空');
    }

    if (!agentData.modelType) {
      errors.push('必须选择AI模型');
    }

    if (agentData.modelConfig) {
      const { temperature, maxTokens, topP, frequencyPenalty, presencePenalty } = agentData.modelConfig;
      
      if (temperature < 0 || temperature > 2) {
        errors.push('温度值必须在0-2之间');
      }

      if (maxTokens < 1 || maxTokens > 4096) {
        errors.push('最大令牌数必须在1-4096之间');
      }

      if (topP < 0 || topP > 1) {
        errors.push('Top P值必须在0-1之间');
      }

      if (frequencyPenalty < -2 || frequencyPenalty > 2) {
        errors.push('频率惩罚值必须在-2到2之间');
      }

      if (presencePenalty < -2 || presencePenalty > 2) {
        errors.push('存在惩罚值必须在-2到2之间');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * 清除错误状态
   */
  const clearError = (): void => {
    agentStore.clearError();
  };

  /**
   * 重置代理状态
   */
  const reset = (): void => {
    agentStore.reset();
  };

  return {
    // 响应式状态
    agents,
    selectedAgentIds,
    selectedAgents,
    availableModels,
    loading,
    error,
    pagination,
    isLoading,
    hasSelectedAgents,
    selectedAgentsCount,
    
    // 计算属性
    groupAgentsByRole,
    getAgentStats,
    
    // CRUD操作
    fetchAgents,
    fetchAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    deleteAgents,
    duplicateAgent,
    
    // 选择操作
    selectAgent,
    deselectAgent,
    toggleAgentSelection,
    selectAllAgents,
    clearSelection,
    selectAgents,
    
    // 其他功能
    fetchAvailableModels,
    testAgent,
    filterAgents,
    validateAgentConfig,
    clearError,
    reset,
  };
}