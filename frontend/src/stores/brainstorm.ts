import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { brainstormService } from '@/services/brainstormService';
import type { 
  BrainstormSession, 
  StageResult, 
  AISummary, 
  FinalReport,
  SessionStatus,
  StageProgress
} from '@/types/brainstorm';
import type { AgentStatus, AgentResult } from '@/types/agent';
import type { PaginatedResponse } from '@/types/api';

/**
 * 头脑风暴会话状态Store
 */
export const useBrainstormStore = defineStore('brainstorm', () => {
  // 状态
  const currentSession = ref<BrainstormSession | null>(null);
  const sessions = ref<BrainstormSession[]>([]);
  const agentStatuses = ref<Record<string, AgentStatus>>({});
  const realTimeResults = ref<Record<string, AgentResult>>({});
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
  const isLoading = computed(() => loading.value);

  const hasCurrentSession = computed(() => !!currentSession.value);

  const stageProgress = computed((): StageProgress | null => {
    if (!currentSession.value) return null;
    
    return {
      current: currentSession.value.currentStage,
      total: 3,
      stages: ['创意生成', '技术可行性分析', '缺点讨论'],
      completed: currentSession.value.stageResults.map(result => !!result),
    };
  });

  const currentStageAgents = computed(() => {
    if (!currentSession.value) return [];
    
    return currentSession.value.agentIds.map(agentId => ({
      agentId,
      status: agentStatuses.value[agentId] || 'idle',
      result: realTimeResults.value[agentId],
    }));
  });

  const isCurrentStageComplete = computed(() => {
    if (!currentSession.value) return false;
    
    return currentSession.value.agentIds.every(agentId => 
      agentStatuses.value[agentId] === 'completed'
    );
  });

  const canProceedToNextStage = computed(() => {
    return isCurrentStageComplete.value && currentSession.value?.currentStage < 3;
  });

  const isSessionComplete = computed(() => {
    return currentSession.value?.status === 'completed' || 
           (currentSession.value?.currentStage === 3 && isCurrentStageComplete.value);
  });

  /**
   * 获取会话列表
   */
  const fetchSessions = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<void> => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await brainstormService.getSessions(params);
      sessions.value = response.items;
      pagination.value = response.pagination;
    } catch (err: any) {
      error.value = err.message || '获取会话列表失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建新会话
   */
  const createSession = async (topic: string, agentIds: string[]): Promise<BrainstormSession> => {
    loading.value = true;
    error.value = null;
    
    try {
      const session = await brainstormService.createSession({
        topic,
        agentIds,
      });
      
      currentSession.value = session;
      
      // 初始化代理状态
      agentIds.forEach(agentId => {
        agentStatuses.value[agentId] = 'idle';
      });
      
      // 清空之前的结果
      realTimeResults.value = {};
      
      return session;
    } catch (err: any) {
      error.value = err.message || '创建会话失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 加载会话
   */
  const loadSession = async (sessionId: string): Promise<void> => {
    loading.value = true;
    error.value = null;
    
    try {
      const session = await brainstormService.getSession(sessionId);
      currentSession.value = session;
      
      // 初始化代理状态
      session.agentIds.forEach(agentId => {
        agentStatuses.value[agentId] = 'idle';
      });
      
      // 如果会话已有结果，加载到实时结果中
      if (session.stageResults.length > 0) {
        const currentStageResult = session.stageResults[session.currentStage - 1];
        if (currentStageResult) {
          currentStageResult.agentResults.forEach(result => {
            realTimeResults.value[result.agentId] = result;
            agentStatuses.value[result.agentId] = 'completed';
          });
        }
      }
    } catch (err: any) {
      error.value = err.message || '加载会话失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 开始会话
   */
  const startSession = async (sessionId: string): Promise<void> => {
    if (!currentSession.value || currentSession.value.id !== sessionId) {
      await loadSession(sessionId);
    }
    
    try {
      await brainstormService.startSession(sessionId);
      
      if (currentSession.value) {
        currentSession.value.status = 'active';
        
        // 设置所有代理为思考状态
        currentSession.value.agentIds.forEach(agentId => {
          agentStatuses.value[agentId] = 'thinking';
        });
      }
    } catch (err: any) {
      error.value = err.message || '开始会话失败';
      throw err;
    }
  };

  /**
   * 暂停会话
   */
  const pauseSession = async (sessionId: string): Promise<void> => {
    try {
      await brainstormService.pauseSession(sessionId);
      
      if (currentSession.value && currentSession.value.id === sessionId) {
        currentSession.value.status = 'paused';
      }
    } catch (err: any) {
      error.value = err.message || '暂停会话失败';
      throw err;
    }
  };

  /**
   * 恢复会话
   */
  const resumeSession = async (sessionId: string): Promise<void> => {
    try {
      await brainstormService.resumeSession(sessionId);
      
      if (currentSession.value && currentSession.value.id === sessionId) {
        currentSession.value.status = 'active';
      }
    } catch (err: any) {
      error.value = err.message || '恢复会话失败';
      throw err;
    }
  };

  /**
   * 停止会话
   */
  const stopSession = async (sessionId: string): Promise<void> => {
    try {
      await brainstormService.stopSession(sessionId);
      
      if (currentSession.value && currentSession.value.id === sessionId) {
        currentSession.value.status = 'cancelled';
      }
    } catch (err: any) {
      error.value = err.message || '停止会话失败';
      throw err;
    }
  };

  /**
   * 进入下一阶段
   */
  const proceedToNextStage = async (): Promise<void> => {
    if (!currentSession.value || !canProceedToNextStage.value) {
      throw new Error('无法进入下一阶段');
    }
    
    try {
      await brainstormService.proceedToNextStage(currentSession.value.id);
      
      // 更新当前阶段
      currentSession.value.currentStage += 1;
      
      // 重置代理状态为思考中
      currentSession.value.agentIds.forEach(agentId => {
        agentStatuses.value[agentId] = 'thinking';
      });
      
      // 清空当前阶段的实时结果
      realTimeResults.value = {};
    } catch (err: any) {
      error.value = err.message || '进入下一阶段失败';
      throw err;
    }
  };

  /**
   * 重新开始当前阶段
   */
  const restartCurrentStage = async (): Promise<void> => {
    if (!currentSession.value) {
      throw new Error('没有当前会话');
    }
    
    try {
      await brainstormService.restartCurrentStage(currentSession.value.id);
      
      // 重置代理状态为思考中
      currentSession.value.agentIds.forEach(agentId => {
        agentStatuses.value[agentId] = 'thinking';
      });
      
      // 清空当前阶段的实时结果
      realTimeResults.value = {};
    } catch (err: any) {
      error.value = err.message || '重新开始阶段失败';
      throw err;
    }
  };

  /**
   * 更新代理状态
   */
  const updateAgentStatus = (agentId: string, status: AgentStatus): void => {
    agentStatuses.value[agentId] = status;
  };

  /**
   * 设置代理结果
   */
  const setAgentResult = (agentId: string, result: AgentResult): void => {
    realTimeResults.value[agentId] = result;
    agentStatuses.value[agentId] = 'completed';
  };

  /**
   * 设置阶段总结
   */
  const setStageSummary = (stage: number, summary: AISummary): void => {
    if (!currentSession.value) return;
    
    const stageResult: StageResult = {
      stage,
      stageName: ['创意生成', '技术可行性分析', '缺点讨论'][stage - 1],
      agentResults: Object.values(realTimeResults.value),
      aiSummary: summary,
      completedAt: new Date().toISOString(),
    };
    
    // 确保stageResults数组有足够的长度
    while (currentSession.value.stageResults.length < stage) {
      currentSession.value.stageResults.push({} as StageResult);
    }
    
    currentSession.value.stageResults[stage - 1] = stageResult;
  };

  /**
   * 设置最终报告
   */
  const setFinalReport = (report: FinalReport): void => {
    if (currentSession.value) {
      currentSession.value.finalReport = report;
      currentSession.value.status = 'completed';
    }
  };

  /**
   * 获取最终报告
   */
  const fetchFinalReport = async (sessionId: string): Promise<FinalReport> => {
    try {
      const report = await brainstormService.getFinalReport(sessionId);
      
      if (currentSession.value && currentSession.value.id === sessionId) {
        currentSession.value.finalReport = report;
      }
      
      return report;
    } catch (err: any) {
      error.value = err.message || '获取最终报告失败';
      throw err;
    }
  };

  /**
   * 删除会话
   */
  const deleteSession = async (sessionId: string): Promise<void> => {
    try {
      await brainstormService.deleteSession(sessionId);
      
      // 从列表中移除
      sessions.value = sessions.value.filter(session => session.id !== sessionId);
      
      // 如果删除的是当前会话，清空当前会话
      if (currentSession.value && currentSession.value.id === sessionId) {
        clearCurrentSession();
      }
    } catch (err: any) {
      error.value = err.message || '删除会话失败';
      throw err;
    }
  };

  /**
   * 复制会话
   */
  const duplicateSession = async (sessionId: string, newTopic?: string): Promise<BrainstormSession> => {
    try {
      const duplicatedSession = await brainstormService.duplicateSession(sessionId, newTopic);
      sessions.value.unshift(duplicatedSession); // 添加到列表开头
      return duplicatedSession;
    } catch (err: any) {
      error.value = err.message || '复制会话失败';
      throw err;
    }
  };

  /**
   * 清空当前会话
   */
  const clearCurrentSession = (): void => {
    currentSession.value = null;
    agentStatuses.value = {};
    realTimeResults.value = {};
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
    currentSession.value = null;
    sessions.value = [];
    agentStatuses.value = {};
    realTimeResults.value = {};
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
    currentSession,
    sessions,
    agentStatuses,
    realTimeResults,
    loading,
    error,
    pagination,
    
    // 计算属性
    isLoading,
    hasCurrentSession,
    stageProgress,
    currentStageAgents,
    isCurrentStageComplete,
    canProceedToNextStage,
    isSessionComplete,
    
    // 方法
    fetchSessions,
    createSession,
    loadSession,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    proceedToNextStage,
    restartCurrentStage,
    updateAgentStatus,
    setAgentResult,
    setStageSummary,
    setFinalReport,
    fetchFinalReport,
    deleteSession,
    duplicateSession,
    clearCurrentSession,
    clearError,
    reset,
  };
});