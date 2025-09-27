import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { brainstormService } from '@/services/brainstormService';
import type { 
  BrainstormSession, 
  Phase,
  StageResult, 
  AISummary, 
  FinalReport,
  SessionStatus,
  PhaseType,
  StageProgress
} from '@/types/brainstorm';
import type { AgentRuntimeStatus, AgentResult } from '@/types/agent';
import type { PaginatedResponse } from '@/types/api';

/**
 * 头脑风暴会话状态Store
 */
export const useBrainstormStore = defineStore('brainstorm', () => {
  // 状态
  const currentSession = ref<BrainstormSession | null>(null);
  const sessions = ref<BrainstormSession[]>([]);
  const agentStatuses = ref<Record<number, AgentRuntimeStatus>>({});
  const realTimeResults = ref<Record<number, AgentResult>>({});
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
    
    const phaseTypes: PhaseType[] = ['IDEA_GENERATION', 'FEASIBILITY_ANALYSIS', 'CRITICISM_DISCUSSION'];
    const phaseNames = ['创意生成', '技术可行性分析', '缺点讨论'];
    
    const currentPhaseIndex = currentSession.value.currentPhase 
      ? phaseTypes.indexOf(currentSession.value.currentPhase)
      : 0;
    
    return {
      current: currentPhaseIndex + 1,
      total: 3,
      stages: phaseNames,
      completed: currentSession.value.phases.map(phase => phase.status === 'COMPLETED'),
    };
  });

  const currentStageAgents = computed(() => {
    if (!currentSession.value) return [];
    
    return currentSession.value.agents.map(sessionAgent => ({
      agentId: sessionAgent.agentId,
      agent: sessionAgent.agent,
      status: agentStatuses.value[sessionAgent.agentId] || 'idle',
      result: realTimeResults.value[sessionAgent.agentId],
    }));
  });

  const isCurrentStageComplete = computed(() => {
    if (!currentSession.value) return false;
    
    return currentSession.value.agents.every(sessionAgent => 
      agentStatuses.value[sessionAgent.agentId] === 'completed'
    );
  });

  const canProceedToNextStage = computed(() => {
    if (!currentSession.value) return false;
    
    const phaseTypes: PhaseType[] = ['IDEA_GENERATION', 'FEASIBILITY_ANALYSIS', 'CRITICISM_DISCUSSION'];
    const currentPhaseIndex = currentSession.value.currentPhase 
      ? phaseTypes.indexOf(currentSession.value.currentPhase)
      : -1;
    
    return isCurrentStageComplete.value && currentPhaseIndex < 2;
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
    status?: SessionStatus;
    currentPhase?: PhaseType;
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
  const createSession = async (title: string, topic: string, agentIds: number[], description?: string): Promise<BrainstormSession> => {
    loading.value = true;
    error.value = null;
    
    try {
      const session = await brainstormService.createSession({
        title,
        description,
        topic,
        agentIds,
      });
      
      currentSession.value = session;
      
      // 初始化代理状态
      session.agents.forEach(sessionAgent => {
        agentStatuses.value[sessionAgent.agentId] = 'idle';
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
  const loadSession = async (sessionId: number): Promise<void> => {
    loading.value = true;
    error.value = null;
    
    try {
      const session = await brainstormService.getSession(sessionId);
      currentSession.value = session;
      
      // 初始化代理状态
      session.agents.forEach(sessionAgent => {
        agentStatuses.value[sessionAgent.agentId] = 'idle';
      });
      
      // 如果会话已有阶段结果，加载到实时结果中
      if (session.phases.length > 0) {
        const currentPhase = session.phases.find(phase => phase.phaseType === session.currentPhase);
        if (currentPhase && currentPhase.responses.length > 0) {
          currentPhase.responses.forEach(response => {
            if (response.status === 'COMPLETED') {
              const result: AgentResult = {
                agentId: response.agentId,
                agentName: session.agents.find(a => a.agentId === response.agentId)?.agent.name || '',
                agentRole: session.agents.find(a => a.agentId === response.agentId)?.agent.roleType || '',
                content: response.content,
                processingTime: response.processingTimeMs || 0,
                createdAt: response.createdAt,
              };
              realTimeResults.value[response.agentId] = result;
              agentStatuses.value[response.agentId] = 'completed';
            }
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
  const startSession = async (sessionId: number): Promise<void> => {
    if (!currentSession.value || currentSession.value.id !== sessionId) {
      await loadSession(sessionId);
    }
    
    try {
      await brainstormService.startSession(sessionId);
      
      if (currentSession.value) {
        currentSession.value.status = 'IN_PROGRESS';
        
        // 设置所有代理为思考状态
        currentSession.value.agents.forEach(sessionAgent => {
          agentStatuses.value[sessionAgent.agentId] = 'thinking';
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
  const pauseSession = async (sessionId: number): Promise<void> => {
    try {
      await brainstormService.pauseSession(sessionId);
      
      if (currentSession.value && currentSession.value.id === sessionId) {
        currentSession.value.status = 'PAUSED';
      }
    } catch (err: any) {
      error.value = err.message || '暂停会话失败';
      throw err;
    }
  };

  /**
   * 恢复会话
   */
  const resumeSession = async (sessionId: number): Promise<void> => {
    try {
      await brainstormService.resumeSession(sessionId);
      
      if (currentSession.value && currentSession.value.id === sessionId) {
        currentSession.value.status = 'IN_PROGRESS';
      }
    } catch (err: any) {
      error.value = err.message || '恢复会话失败';
      throw err;
    }
  };

  /**
   * 停止会话
   */
  const stopSession = async (sessionId: number): Promise<void> => {
    try {
      await brainstormService.stopSession(sessionId);
      
      if (currentSession.value && currentSession.value.id === sessionId) {
        currentSession.value.status = 'CANCELLED';
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
      const phaseTypes: PhaseType[] = ['IDEA_GENERATION', 'FEASIBILITY_ANALYSIS', 'CRITICISM_DISCUSSION'];
      const currentPhaseIndex = currentSession.value.currentPhase 
        ? phaseTypes.indexOf(currentSession.value.currentPhase)
        : -1;
      
      const nextPhaseType = phaseTypes[currentPhaseIndex + 1];
      
      await brainstormService.proceedToNextPhase(currentSession.value.id, nextPhaseType);
      
      // 更新当前阶段
      currentSession.value.currentPhase = nextPhaseType;
      
      // 重置代理状态为思考中
      currentSession.value.agents.forEach(sessionAgent => {
        agentStatuses.value[sessionAgent.agentId] = 'thinking';
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
      currentSession.value.agents.forEach(sessionAgent => {
        agentStatuses.value[sessionAgent.agentId] = 'thinking';
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
   * Requirement 4.4: 同步代理思考状态到UI
   */
  const updateAgentStatus = (agentId: number, status: AgentRuntimeStatus): void => {
    agentStatuses.value[agentId] = status;
    
    // 实时更新会话中的代理状态
    if (currentSession.value) {
      const sessionAgent = currentSession.value.agents.find((a: any) => a.agentId === agentId);
      if (sessionAgent) {
        sessionAgent.status = status;
      }
      
      // 如果当前阶段存在，更新阶段中的代理响应状态
      const currentPhase = currentSession.value.phases.find(
        (phase: any) => phase.phaseType === currentSession.value!.currentPhase
      );
      
      if (currentPhase) {
        const response = currentPhase.responses.find((r: any) => r.agentId === agentId);
        if (response) {
          response.status = status === 'completed' ? 'COMPLETED' : 
                           status === 'thinking' ? 'IN_PROGRESS' : 
                           status === 'error' ? 'FAILED' : 'PENDING';
        }
      }
    }
  };

  /**
   * 设置代理结果
   * Requirement 4.4: 实时更新阶段进度和结果
   */
  const setAgentResult = (agentId: number, result: AgentResult): void => {
    realTimeResults.value[agentId] = result;
    agentStatuses.value[agentId] = 'completed';
    
    // 实时更新会话中的代理结果
    if (currentSession.value) {
      const currentPhase = currentSession.value.phases.find(
        (phase: any) => phase.phaseType === currentSession.value!.currentPhase
      );
      
      if (currentPhase) {
        // 更新或添加代理响应
        const existingResponseIndex = currentPhase.responses.findIndex(
          (r: any) => r.agentId === agentId
        );
        
        if (existingResponseIndex >= 0) {
          // 更新现有响应
          currentPhase.responses[existingResponseIndex] = {
            ...currentPhase.responses[existingResponseIndex],
            content: result.content,
            status: 'COMPLETED',
            processingTimeMs: result.processingTime,
            completedAt: result.createdAt,
          };
        } else {
          // 添加新响应
          currentPhase.responses.push({
            id: Date.now(), // 临时ID
            phaseId: currentPhase.id,
            agentId,
            content: result.content,
            status: 'COMPLETED',
            processingTimeMs: result.processingTime,
            createdAt: result.createdAt,
            completedAt: result.createdAt,
          });
        }
        
        // 更新阶段的代理结果列表
        const existingResultIndex = currentPhase.agentResults.findIndex(
          (r: any) => r.agentId === agentId
        );
        
        if (existingResultIndex >= 0) {
          currentPhase.agentResults[existingResultIndex] = result;
        } else {
          currentPhase.agentResults.push(result);
        }
      }
    }
  };

  /**
   * 更新阶段进度
   * Requirement 4.5: 实时更新阶段进度
   */
  const updateStageProgress = (phaseType: PhaseType, progress: number): void => {
    if (!currentSession.value) return;
    
    const phase = currentSession.value.phases.find((p: any) => p.phaseType === phaseType);
    if (phase) {
      phase.progress = progress;
    }
  };

  /**
   * 批量更新代理状态
   * 用于网络重连后同步状态
   */
  const syncAgentStatuses = (statuses: Record<number, AgentRuntimeStatus>): void => {
    Object.entries(statuses).forEach(([agentId, status]) => {
      updateAgentStatus(parseInt(agentId), status);
    });
  };

  /**
   * 批量更新代理结果
   * 用于网络重连后同步结果
   */
  const syncAgentResults = (results: Record<number, AgentResult>): void => {
    Object.entries(results).forEach(([agentId, result]) => {
      setAgentResult(parseInt(agentId), result);
    });
  };

  /**
   * 同步会话状态
   * 用于网络重连后完整同步
   */
  const syncSessionState = async (sessionId: number): Promise<void> => {
    try {
      await loadSession(sessionId);
    } catch (err: any) {
      error.value = err.message || '同步会话状态失败';
      throw err;
    }
  };

  /**
   * 设置阶段总结
   */
  const setStageSummary = (phaseType: PhaseType, summary: AISummary): void => {
    if (!currentSession.value) return;
    
    // 找到对应的阶段并更新总结
    const phase = currentSession.value.phases.find(p => p.phaseType === phaseType);
    if (phase) {
      phase.summary = JSON.stringify(summary);
      phase.status = 'COMPLETED';
      phase.completedAt = new Date().toISOString();
    }
  };

  /**
   * 设置最终报告
   */
  const setFinalReport = (report: FinalReport): void => {
    if (currentSession.value) {
      currentSession.value.report = {
        id: 0, // 临时ID，实际应该从后端获取
        sessionId: currentSession.value.id,
        title: `${currentSession.value.title} - 最终报告`,
        content: JSON.stringify(report),
        status: 'GENERATED',
        filePath: null,
        generatedAt: new Date().toISOString(),
      };
      currentSession.value.status = 'COMPLETED';
    }
  };

  /**
   * 获取最终报告
   */
  const fetchFinalReport = async (sessionId: number): Promise<FinalReport> => {
    try {
      const reportData = await brainstormService.getFinalReport(sessionId);
      
      if (currentSession.value && currentSession.value.id === sessionId) {
        currentSession.value.report = reportData;
      }
      
      // 解析报告内容
      const report: FinalReport = JSON.parse(reportData.content);
      return report;
    } catch (err: any) {
      error.value = err.message || '获取最终报告失败';
      throw err;
    }
  };

  /**
   * 删除会话
   */
  const deleteSession = async (sessionId: number): Promise<void> => {
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
  const duplicateSession = async (sessionId: number, newTitle?: string): Promise<BrainstormSession> => {
    try {
      const duplicatedSession = await brainstormService.duplicateSession(sessionId, newTitle);
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
    updateStageProgress,
    syncAgentStatuses,
    syncAgentResults,
    syncSessionState,
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