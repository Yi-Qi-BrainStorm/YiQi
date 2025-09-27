import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useBrainstormStore } from '@/stores/brainstorm';
import { useSocket } from './useSocket';
import type { 
  BrainstormSession, 
  StageResult, 
  AISummary, 
  FinalReport,
  SessionStatus,
  StageProgress
} from '@/types/brainstorm';
import type { AgentStatus, AgentResult } from '@/types/agent';

/**
 * 头脑风暴相关的组合式函数
 * 集成WebSocket实时通信功能，提供会话控制和状态监控接口
 * 
 * Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 4.5
 */
export function useBrainstorm() {
  const brainstormStore = useBrainstormStore();
  const router = useRouter();
  const socket = useSocket();

  // 响应式状态
  const currentSession = computed(() => brainstormStore.currentSession);
  const sessions = computed(() => brainstormStore.sessions);
  const agentStatuses = computed(() => brainstormStore.agentStatuses);
  const realTimeResults = computed(() => brainstormStore.realTimeResults);
  const loading = computed(() => brainstormStore.loading);
  const error = computed(() => brainstormStore.error);
  const pagination = computed(() => brainstormStore.pagination);
  const isLoading = computed(() => brainstormStore.isLoading);
  const hasCurrentSession = computed(() => brainstormStore.hasCurrentSession);
  const stageProgress = computed(() => brainstormStore.stageProgress);
  const currentStageAgents = computed(() => brainstormStore.currentStageAgents);
  const isCurrentStageComplete = computed(() => brainstormStore.isCurrentStageComplete);
  const canProceedToNextStage = computed(() => brainstormStore.canProceedToNextStage);
  const isSessionComplete = computed(() => brainstormStore.isSessionComplete);

  /**
   * 获取会话列表
   * Requirement 3.1: 用户访问头脑风暴页面时显示历史会话列表
   */
  const fetchSessions = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<void> => {
    return await brainstormStore.fetchSessions(params);
  };

  /**
   * 创建新会话
   * Requirement 3.1: 用户输入主题并选择代理时创建新的头脑风暴会话
   */
  const createSession = async (topic: string, agentIds: string[]): Promise<BrainstormSession> => {
    const session = await brainstormStore.createSession(topic, agentIds);
    
    // 创建成功后跳转到会话页面
    await router.push(`/brainstorm/${session.id}`);
    
    return session;
  };

  /**
   * 加载会话
   * Requirement 3.2: 用户选择历史会话时加载会话详情和状态
   */
  const loadSession = async (sessionId: string): Promise<void> => {
    await brainstormStore.loadSession(sessionId);
    
    // 加载会话后连接WebSocket
    if (socket.isConnected.value) {
      socket.joinRoom(`session:${sessionId}`);
    }
  };

  /**
   * 开始会话
   * Requirement 4.1: 用户点击开始按钮时启动头脑风暴流程
   */
  const startSession = async (sessionId: string): Promise<void> => {
    await brainstormStore.startSession(sessionId);
    
    // 通过WebSocket通知后端开始会话
    if (socket.isConnected.value && currentSession.value) {
      socket.emit('brainstorm:start', {
        sessionId,
        topic: currentSession.value.topic,
        agentIds: currentSession.value.agentIds,
      });
    }
  };

  /**
   * 暂停会话
   * Requirement 4.2: 用户可以暂停正在进行的头脑风暴会话
   */
  const pauseSession = async (sessionId: string): Promise<void> => {
    return await brainstormStore.pauseSession(sessionId);
  };

  /**
   * 恢复会话
   * Requirement 4.2: 用户可以恢复暂停的头脑风暴会话
   */
  const resumeSession = async (sessionId: string): Promise<void> => {
    return await brainstormStore.resumeSession(sessionId);
  };

  /**
   * 停止会话
   * Requirement 4.3: 用户可以停止头脑风暴会话
   */
  const stopSession = async (sessionId: string): Promise<void> => {
    return await brainstormStore.stopSession(sessionId);
  };

  /**
   * 进入下一阶段
   * Requirement 4.4: 当前阶段完成时用户可以进入下一阶段
   */
  const proceedToNextStage = async (): Promise<void> => {
    if (!currentSession.value) {
      throw new Error('没有当前会话');
    }

    await brainstormStore.proceedToNextStage();
    
    // 通过WebSocket通知后端进入下一阶段
    if (socket.isConnected.value) {
      socket.emit('brainstorm:proceed', {
        sessionId: currentSession.value.id,
        stage: currentSession.value.currentStage,
      });
    }
  };

  /**
   * 重新开始当前阶段
   * Requirement 4.5: 用户可以重新开始当前阶段
   */
  const restartCurrentStage = async (): Promise<void> => {
    if (!currentSession.value) {
      throw new Error('没有当前会话');
    }

    await brainstormStore.restartCurrentStage();
    
    // 通过WebSocket通知后端重新开始阶段
    if (socket.isConnected.value) {
      socket.emit('brainstorm:restart-stage', {
        sessionId: currentSession.value.id,
        stage: currentSession.value.currentStage,
      });
    }
  };

  /**
   * 获取最终报告
   * Requirement 4.5: 会话完成后生成并显示最终报告
   */
  const fetchFinalReport = async (sessionId: string): Promise<FinalReport> => {
    return await brainstormStore.fetchFinalReport(sessionId);
  };

  /**
   * 删除会话
   */
  const deleteSession = async (sessionId: string): Promise<void> => {
    return await brainstormStore.deleteSession(sessionId);
  };

  /**
   * 复制会话
   */
  const duplicateSession = async (sessionId: string, newTopic?: string): Promise<BrainstormSession> => {
    return await brainstormStore.duplicateSession(sessionId, newTopic);
  };

  /**
   * 设置WebSocket事件监听器
   * Requirement 4.1, 4.2, 4.3: 实时监听代理状态和结果更新
   */
  const setupSocketListeners = (): void => {
    if (!socket.isConnected.value) return;

    // 监听代理状态更新
    socket.on('agent:status-update', (data: {
      sessionId: string;
      agentId: string;
      status: AgentStatus;
    }) => {
      if (currentSession.value && data.sessionId === currentSession.value.id) {
        brainstormStore.updateAgentStatus(data.agentId, data.status);
      }
    });

    // 监听代理结果
    socket.on('agent:result', (data: {
      sessionId: string;
      agentId: string;
      result: AgentResult;
    }) => {
      if (currentSession.value && data.sessionId === currentSession.value.id) {
        brainstormStore.setAgentResult(data.agentId, data.result);
      }
    });

    // 监听阶段总结
    socket.on('stage:summary', (data: {
      sessionId: string;
      stage: number;
      summary: AISummary;
    }) => {
      if (currentSession.value && data.sessionId === currentSession.value.id) {
        brainstormStore.setStageSummary(data.stage, data.summary);
      }
    });

    // 监听会话完成
    socket.on('session:complete', (data: {
      sessionId: string;
      finalReport: FinalReport;
    }) => {
      if (currentSession.value && data.sessionId === currentSession.value.id) {
        brainstormStore.setFinalReport(data.finalReport);
      }
    });
  };

  /**
   * 清理WebSocket事件监听器
   */
  const cleanupSocketListeners = (): void => {
    if (!socket.isConnected.value) return;

    socket.off('agent:status-update');
    socket.off('agent:result');
    socket.off('stage:summary');
    socket.off('session:complete');
  };

  /**
   * 获取会话统计信息
   */
  const getSessionStats = computed(() => {
    if (!currentSession.value) return null;

    const totalAgents = currentSession.value.agentIds.length;
    const completedAgents = Object.values(agentStatuses.value).filter(
      status => status === 'completed'
    ).length;
    const thinkingAgents = Object.values(agentStatuses.value).filter(
      status => status === 'thinking'
    ).length;
    const completedStages = currentSession.value.stageResults.filter(
      result => !!result.completedAt
    ).length;

    return {
      totalAgents,
      completedAgents,
      thinkingAgents,
      completedStages,
      currentStage: currentSession.value.currentStage,
      totalStages: 3,
      progress: Math.round((completedAgents / totalAgents) * 100),
    };
  });

  /**
   * 验证会话创建参数
   */
  const validateSessionCreation = (topic: string, agentIds: string[]): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    if (!topic.trim()) {
      errors.push('主题不能为空');
    }

    if (topic.length > 200) {
      errors.push('主题长度不能超过200个字符');
    }

    if (agentIds.length === 0) {
      errors.push('至少需要选择一个代理');
    }

    if (agentIds.length > 10) {
      errors.push('最多只能选择10个代理');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * 获取阶段名称
   */
  const getStageName = (stage: number): string => {
    const stageNames = ['创意生成', '技术可行性分析', '缺点讨论'];
    return stageNames[stage - 1] || '未知阶段';
  };

  /**
   * 检查是否可以执行操作
   */
  const canPerformAction = (action: 'start' | 'pause' | 'resume' | 'stop' | 'proceed' | 'restart'): boolean => {
    if (!currentSession.value) return false;

    const status = currentSession.value.status;

    switch (action) {
      case 'start':
        return status === 'paused' || (status === 'active' && currentSession.value.currentStage === 1);
      case 'pause':
        return status === 'active';
      case 'resume':
        return status === 'paused';
      case 'stop':
        return status === 'active' || status === 'paused';
      case 'proceed':
        return canProceedToNextStage.value;
      case 'restart':
        return status === 'active' || status === 'paused';
      default:
        return false;
    }
  };

  /**
   * 清空当前会话
   */
  const clearCurrentSession = (): void => {
    cleanupSocketListeners();
    brainstormStore.clearCurrentSession();
  };

  /**
   * 清除错误状态
   */
  const clearError = (): void => {
    brainstormStore.clearError();
  };

  /**
   * 重置状态
   */
  const reset = (): void => {
    cleanupSocketListeners();
    brainstormStore.reset();
  };

  return {
    // 响应式状态
    currentSession,
    sessions,
    agentStatuses,
    realTimeResults,
    loading,
    error,
    pagination,
    isLoading,
    hasCurrentSession,
    stageProgress,
    currentStageAgents,
    isCurrentStageComplete,
    canProceedToNextStage,
    isSessionComplete,
    
    // 计算属性
    getSessionStats,
    
    // 会话管理
    fetchSessions,
    createSession,
    loadSession,
    deleteSession,
    duplicateSession,
    
    // 会话控制
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    proceedToNextStage,
    restartCurrentStage,
    
    // 结果获取
    fetchFinalReport,
    
    // WebSocket管理
    setupSocketListeners,
    cleanupSocketListeners,
    
    // 工具函数
    validateSessionCreation,
    getStageName,
    canPerformAction,
    clearCurrentSession,
    clearError,
    reset,
  };
}