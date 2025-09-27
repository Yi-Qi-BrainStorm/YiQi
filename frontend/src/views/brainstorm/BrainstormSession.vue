<template>
  <div class="brainstorm-session-page">
    <!-- 网络状态指示器 -->
    <div class="network-status-bar">
      <NetworkStatusIndicator
        :connection-status="socket.connectionStatus.value"
        :is-connecting="socket.isConnecting.value"
        :latency="socket.latency.value"
        :reconnect-attempts="socket.reconnectAttempts.value"
        :socket-id="socket.socketId.value"
        :error="socket.error.value"
        :show-text="true"
        @reconnect="handleReconnect"
        @refresh="handleRefreshPage"
      />
    </div>

    <!-- 连接状态警告 -->
    <div class="connection-status" v-if="!socket.isConnected.value">
      <a-alert
        :message="connectionMessage"
        :type="connectionAlertType"
        :show-icon="true"
        :closable="false"
        class="connection-alert"
      >
        <template #action>
          <a-button 
            size="small" 
            type="primary"
            :loading="socket.isConnecting.value"
            @click="handleReconnect"
          >
            重新连接
          </a-button>
        </template>
      </a-alert>
    </div>

    <!-- 会话头部 -->
    <div class="session-header" v-if="currentSession">
      <div class="session-info">
        <h1 class="session-title">{{ currentSession.title }}</h1>
        <div class="session-meta">
          <a-tag :color="getSessionStatusColor(currentSession.status)">
            {{ getSessionStatusText(currentSession.status) }}
          </a-tag>
          <span class="session-topic">主题: {{ currentSession.topic }}</span>
          <span class="session-time">创建于 {{ formatTime(currentSession.createdAt) }}</span>
        </div>
      </div>
      
      <div class="session-actions">
        <a-space>
          <a-button
            v-if="canPerformAction('start')"
            type="primary"
            :loading="isLoading"
            @click="handleStartSession"
          >
            开始头脑风暴
          </a-button>
          
          <a-button
            v-if="canPerformAction('pause')"
            :loading="isLoading"
            @click="handlePauseSession"
          >
            暂停会话
          </a-button>
          
          <a-button
            v-if="canPerformAction('resume')"
            type="primary"
            :loading="isLoading"
            @click="handleResumeSession"
          >
            恢复会话
          </a-button>
          
          <a-button
            v-if="canPerformAction('stop')"
            danger
            :loading="isLoading"
            @click="handleStopSession"
          >
            停止会话
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- 阶段进度指示器 -->
    <div class="progress-section" v-if="currentSession && stageProgress">
      <StageProgressIndicator
        :current-stage="stageProgress.current"
        :total-stages="stageProgress.total"
        :stage-names="stageProgress.stages"
        :completed-stages="stageProgress.completed"
        :session-status="currentSession.status"
        :stage-progress="currentStageProgress"
        :stage-start-time="currentStageStartTime"
        :can-proceed-to-next="canProceedToNextStage"
        :can-restart-stage="canPerformAction('restart')"
        :can-pause-session="canPerformAction('pause')"
        :can-resume-session="canPerformAction('resume')"
        @proceed-to-next="handleProceedToNext"
        @restart-stage="handleRestartStage"
        @pause-session="handlePauseSession"
        @resume-session="handleResumeSession"
      />
    </div>

    <!-- 代理思考面板 -->
    <div class="agents-section" v-if="currentSession && currentSession.agents.length">
      <h3 class="section-title">代理思考状态</h3>
      <div class="agents-grid">
        <AgentThinkingPanel
          v-for="sessionAgent in currentSession.agents"
          :key="sessionAgent.agentId"
          :agent="getAgentInfo(sessionAgent.agentId)"
          :status="getAgentStatus(sessionAgent.agentId)"
          :result="getAgentResult(sessionAgent.agentId)"
          :thinking-progress="getAgentThinkingProgress(sessionAgent.agentId)"
          :estimated-completion-time="getAgentEstimatedTime(sessionAgent.agentId)"
          :error-message="getAgentError(sessionAgent.agentId)"
          @view-details="handleViewAgentDetails"
          @retry-agent="handleRetryAgent"
          @skip-agent="handleSkipAgent"
          @copy-result="handleCopyAgentResult"
          @export-result="handleExportAgentResult"
        />
      </div>
    </div>

    <!-- 阶段总结 -->
    <div class="summary-section" v-if="currentStageSummary">
      <StageSummary
        :summary="currentStageSummary"
        :agent-results="currentStageResults"
        :stage-name="getCurrentStageName()"
        :stage-number="stageProgress?.current || 1"
        :is-last-stage="isLastStage"
        :completed-at="currentStageCompletedAt"
        @proceed-to-next="handleProceedToNext"
        @restart-stage="handleRestartStage"
        @generate-final-report="handleGenerateFinalReport"
        @export-stage-results="handleExportStageResults"
        @view-detailed-results="handleViewDetailedResults"
      />
    </div>

    <!-- 最终报告 -->
    <div class="final-report-section" v-if="currentSession?.finalReport">
      <ResultReport
        :final-report="currentSession.finalReport"
        :session="currentSession"
        @export-report="handleExportFinalReport"
      />
    </div>

    <!-- 加载状态 -->
    <div class="loading-overlay" v-if="isLoading && !currentSession">
      <a-spin size="large" />
      <div class="loading-text">正在加载会话...</div>
    </div>

    <!-- 错误状态 -->
    <div class="error-section" v-if="error && !currentSession">
      <a-result
        status="error"
        title="加载失败"
        :sub-title="error"
      >
        <template #extra>
          <a-button type="primary" @click="handleRetryLoad">
            重新加载
          </a-button>
        </template>
      </a-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { useBrainstorm } from '@/composables/useBrainstorm';
import { useSocket } from '@/composables/useSocket';
import { useAgents } from '@/composables/useAgents';
import StageProgressIndicator from '@/components/brainstorm/StageProgressIndicator.vue';
import AgentThinkingPanel from '@/components/brainstorm/AgentThinkingPanel.vue';
import StageSummary from '@/components/brainstorm/StageSummary.vue';
import ResultReport from '@/components/brainstorm/ResultReport.vue';
import NetworkStatusIndicator from '@/components/common/NetworkStatusIndicator.vue';
import type { AgentResult } from '@/types/agent';
import type { AISummary } from '@/types/brainstorm';

const route = useRoute();
const router = useRouter();

// 组合式函数
const brainstorm = useBrainstorm();
const socket = useSocket('/brainstorm');
const agents = useAgents();

// 响应式数据
const sessionId = computed(() => parseInt(route.params.id as string));
const currentStageProgress = ref<number | null>(null);
const currentStageStartTime = ref<string | null>(null);
const agentThinkingProgress = ref<Record<number, number>>({});
const agentEstimatedTimes = ref<Record<number, string>>({});
const agentErrors = ref<Record<number, string>>({});

// 计算属性
const {
  currentSession,
  agentStatuses,
  realTimeResults,
  loading,
  error,
  isLoading,
  stageProgress,
  canProceedToNextStage,
  isSessionComplete,
} = brainstorm;

const connectionMessage = computed(() => {
  if (socket.isConnecting.value) return '正在连接服务器...';
  if (socket.error.value) return `连接失败: ${socket.error.value}`;
  return '与服务器连接已断开';
});

const connectionAlertType = computed(() => {
  if (socket.isConnecting.value) return 'info';
  if (socket.error.value) return 'error';
  return 'warning';
});

const currentStageSummary = computed(() => {
  if (!currentSession.value || !currentSession.value.currentPhase) return null;
  
  const currentPhase = currentSession.value.phases.find(
    phase => phase.phaseType === currentSession.value!.currentPhase
  );
  
  return currentPhase?.aiSummary || null;
});

const currentStageResults = computed(() => {
  if (!currentSession.value || !currentSession.value.currentPhase) return [];
  
  const currentPhase = currentSession.value.phases.find(
    phase => phase.phaseType === currentSession.value!.currentPhase
  );
  
  return currentPhase?.agentResults || [];
});

const currentStageCompletedAt = computed(() => {
  if (!currentSession.value || !currentSession.value.currentPhase) return '';
  
  const currentPhase = currentSession.value.phases.find(
    phase => phase.phaseType === currentSession.value!.currentPhase
  );
  
  return currentPhase?.completedAt || '';
});

const isLastStage = computed(() => {
  return stageProgress.value?.current === stageProgress.value?.total;
});

// 方法
const getSessionStatusColor = (status: string): string => {
  switch (status) {
    case 'CREATED': return 'blue';
    case 'IN_PROGRESS': return 'processing';
    case 'PAUSED': return 'warning';
    case 'COMPLETED': return 'success';
    case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

const getSessionStatusText = (status: string): string => {
  switch (status) {
    case 'CREATED': return '已创建';
    case 'IN_PROGRESS': return '进行中';
    case 'PAUSED': return '已暂停';
    case 'COMPLETED': return '已完成';
    case 'CANCELLED': return '已取消';
    default: return '未知状态';
  }
};

const formatTime = (timeString: string): string => {
  const date = new Date(timeString);
  return date.toLocaleString('zh-CN');
};

const getAgentInfo = (agentId: number) => {
  return agents.agents.value.find(agent => agent.id === agentId) || {
    id: agentId,
    name: `代理 ${agentId}`,
    roleType: '未知角色',
    aiModel: 'unknown',
  };
};

const getAgentStatus = (agentId: number) => {
  return agentStatuses.value[agentId] || 'idle';
};

const getAgentResult = (agentId: number) => {
  return realTimeResults.value[agentId] || null;
};

const getAgentThinkingProgress = (agentId: number) => {
  return agentThinkingProgress.value[agentId] || null;
};

const getAgentEstimatedTime = (agentId: number) => {
  return agentEstimatedTimes.value[agentId] || null;
};

const getAgentError = (agentId: number) => {
  return agentErrors.value[agentId] || null;
};

const getCurrentStageName = (): string => {
  if (!stageProgress.value) return '';
  return stageProgress.value.stages[stageProgress.value.current - 1] || '';
};

const canPerformAction = brainstorm.canPerformAction;

// WebSocket事件处理
const setupSocketListeners = () => {
  if (!socket.isConnected.value) return;

  // 监听代理状态更新
  socket.on('agent:status-update', (data: {
    sessionId: number;
    agentId: number;
    status: import('@/types/agent').AgentRuntimeStatus;
  }) => {
    if (data.sessionId === sessionId.value) {
      brainstorm.agentStatuses.value[data.agentId] = data.status;
    }
  });

  // 监听代理思考进度
  socket.on('agent:thinking-progress', (data: {
    sessionId: number;
    agentId: number;
    progress: number;
  }) => {
    if (data.sessionId === sessionId.value) {
      agentThinkingProgress.value[data.agentId] = data.progress;
    }
  });

  // 监听代理结果
  socket.on('agent:result', (data: {
    sessionId: number;
    agentId: number;
    result: AgentResult;
  }) => {
    if (data.sessionId === sessionId.value) {
      brainstorm.realTimeResults.value[data.agentId] = data.result;
      brainstorm.agentStatuses.value[data.agentId] = 'completed';
    }
  });

  // 监听代理错误
  socket.on('agent:error', (data: {
    sessionId: number;
    agentId: number;
    error: string;
  }) => {
    if (data.sessionId === sessionId.value) {
      agentErrors.value[data.agentId] = data.error;
      brainstorm.agentStatuses.value[data.agentId] = 'error';
    }
  });

  // 监听阶段开始
  socket.on('stage:started', (data: {
    sessionId: number;
    stage: number;
    stageName: string;
  }) => {
    if (data.sessionId === sessionId.value) {
      currentStageStartTime.value = new Date().toISOString();
      currentStageProgress.value = 0;
      message.info(`${data.stageName} 已开始`);
    }
  });

  // 监听阶段进度
  socket.on('stage:progress', (data: {
    sessionId: number;
    stage: number;
    progress: number;
  }) => {
    if (data.sessionId === sessionId.value) {
      currentStageProgress.value = data.progress;
    }
  });

  // 监听阶段完成
  socket.on('stage:completed', (data: {
    sessionId: number;
    stage: number;
    summary: AISummary;
  }) => {
    if (data.sessionId === sessionId.value) {
      currentStageProgress.value = 100;
      message.success(`第${data.stage}阶段已完成`);
    }
  });

  // 监听会话完成
  socket.on('session:completed', (data: {
    sessionId: number;
    finalReport: import('@/types/brainstorm').FinalReport;
  }) => {
    if (data.sessionId === sessionId.value) {
      message.success('头脑风暴会话已完成！');
    }
  });

  // 监听会话错误
  socket.on('session:error', (data: {
    sessionId: number;
    error: string;
  }) => {
    if (data.sessionId === sessionId.value) {
      message.error(`会话错误: ${data.error}`);
    }
  });

  // 监听系统通知
  socket.on('system:notification', (data: {
    type: 'info' | 'warning' | 'error';
    message: string;
  }) => {
    switch (data.type) {
      case 'info':
        message.info(data.message);
        break;
      case 'warning':
        message.warning(data.message);
        break;
      case 'error':
        message.error(data.message);
        break;
    }
  });

  // 监听状态同步响应
  socket.on('session:sync-response', (data: {
    sessionId: number;
    agentStatuses: Record<number, import('@/types/agent').AgentRuntimeStatus>;
    agentResults: Record<number, AgentResult>;
    stageProgress: number;
  }) => {
    if (data.sessionId === sessionId.value) {
      // 同步代理状态
      brainstorm.syncAgentStatuses(data.agentStatuses);
      
      // 同步代理结果
      brainstorm.syncAgentResults(data.agentResults);
      
      // 同步阶段进度
      if (currentSession.value?.currentPhase) {
        brainstorm.updateStageProgress(currentSession.value.currentPhase, data.stageProgress);
      }
      
      console.log('状态同步完成');
    }
  });

  // 监听网络质量变化
  socket.on('network:quality', (data: {
    latency: number;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
  }) => {
    // 可以根据网络质量调整UI显示
    if (data.quality === 'poor') {
      message.warning('网络连接质量较差，可能影响实时更新');
    }
  });
};

const cleanupSocketListeners = () => {
  if (!socket.isConnected.value) return;

  socket.off('agent:status-update');
  socket.off('agent:thinking-progress');
  socket.off('agent:result');
  socket.off('agent:error');
  socket.off('stage:started');
  socket.off('stage:progress');
  socket.off('stage:completed');
  socket.off('session:completed');
  socket.off('session:error');
  socket.off('system:notification');
  socket.off('session:sync-response');
  socket.off('network:quality');
};

// 事件处理
const handleReconnect = async () => {
  try {
    await socket.connect();
    if (socket.isConnected.value) {
      socket.joinRoom(sessionId.value);
      setupSocketListeners();
      message.success('重新连接成功');
    }
  } catch (error) {
    message.error('重新连接失败');
  }
};

const handleStartSession = async () => {
  try {
    await brainstorm.startSession(sessionId.value);
  } catch (error: any) {
    message.error(error.message || '启动会话失败');
  }
};

const handlePauseSession = async () => {
  try {
    await brainstorm.pauseSession(sessionId.value);
    message.success('会话已暂停');
  } catch (error: any) {
    message.error(error.message || '暂停会话失败');
  }
};

const handleResumeSession = async () => {
  try {
    await brainstorm.resumeSession(sessionId.value);
    message.success('会话已恢复');
  } catch (error: any) {
    message.error(error.message || '恢复会话失败');
  }
};

const handleStopSession = async () => {
  Modal.confirm({
    title: '确认停止会话',
    content: '确定要停止当前会话吗？停止后无法恢复。',
    onOk: async () => {
      try {
        await brainstorm.stopSession(sessionId.value);
        message.success('会话已停止');
      } catch (error: any) {
        message.error(error.message || '停止会话失败');
      }
    },
  });
};

const handleProceedToNext = async () => {
  try {
    await brainstorm.proceedToNextStage();
  } catch (error: any) {
    message.error(error.message || '进入下一阶段失败');
  }
};

const handleRestartStage = async () => {
  try {
    await brainstorm.restartCurrentStage();
    // 清除当前阶段的进度和错误状态
    currentStageProgress.value = 0;
    agentThinkingProgress.value = {};
    agentErrors.value = {};
  } catch (error: any) {
    message.error(error.message || '重新开始阶段失败');
  }
};

const handleGenerateFinalReport = async () => {
  try {
    if (currentSession.value) {
      await brainstorm.fetchFinalReport(currentSession.value.id);
      message.success('最终报告已生成');
    }
  } catch (error: any) {
    message.error(error.message || '生成最终报告失败');
  }
};

const handleViewAgentDetails = (result: AgentResult) => {
  // 代理详情查看逻辑已在 AgentThinkingPanel 组件中实现
};

const handleRetryAgent = async (agentId: number) => {
  // 清除该代理的错误状态
  delete agentErrors.value[agentId];
  delete agentThinkingProgress.value[agentId];
  
  // 通过WebSocket请求重试
  if (socket.isConnected.value) {
    socket.emit('agent:retry', {
      sessionId: sessionId.value,
      agentId,
    });
  }
};

const handleSkipAgent = async (agentId: number) => {
  Modal.confirm({
    title: '确认跳过代理',
    content: '确定要跳过此代理吗？跳过后该代理将不参与当前阶段。',
    onOk: () => {
      if (socket.isConnected.value) {
        socket.emit('agent:skip', {
          sessionId: sessionId.value,
          agentId,
        });
      }
    },
  });
};

const handleCopyAgentResult = (result: AgentResult) => {
  // 复制逻辑已在 AgentThinkingPanel 组件中实现
};

const handleExportAgentResult = (result: AgentResult) => {
  // 导出逻辑可以在这里实现或委托给其他服务
  message.info('导出功能开发中...');
};

const handleExportStageResults = (results: AgentResult[]) => {
  message.info('导出阶段结果功能开发中...');
};

const handleViewDetailedResults = (results: AgentResult[]) => {
  message.info('查看详细结果功能开发中...');
};

const handleExportFinalReport = () => {
  message.info('导出最终报告功能开发中...');
};

const handleRetryLoad = async () => {
  try {
    await brainstorm.loadSession(sessionId.value);
  } catch (error: any) {
    message.error(error.message || '重新加载失败');
  }
};

const handleRefreshPage = () => {
  window.location.reload();
};

// 生命周期
onMounted(async () => {
  try {
    // 加载代理列表
    await agents.fetchAgents();
    
    // 加载会话
    await brainstorm.loadSession(sessionId.value);
    
    // 连接WebSocket
    await socket.connect();
    
    if (socket.isConnected.value) {
      // 加入会话房间
      socket.joinRoom(sessionId.value);
      
      // 设置事件监听器
      setupSocketListeners();
    }
  } catch (error: any) {
    console.error('初始化失败:', error);
  }
});

onUnmounted(() => {
  // 清理WebSocket监听器
  cleanupSocketListeners();
  
  // 离开会话房间
  if (socket.isConnected.value) {
    socket.leaveRoom(sessionId.value);
  }
  
  // 断开WebSocket连接
  socket.disconnect();
});

// 监听连接状态变化
watch(() => socket.isConnected.value, async (connected, wasConnected) => {
  if (connected && wasConnected === false) {
    // 重新连接后的处理
    try {
      // 重新加入房间
      socket.joinRoom(sessionId.value);
      
      // 重新设置监听器
      setupSocketListeners();
      
      // 同步会话状态
      if (currentSession.value) {
        await brainstorm.syncSessionState(sessionId.value);
        message.success('状态已同步');
      }
      
      // 请求服务器同步当前状态
      if (socket.isConnected.value) {
        socket.emit('session:sync-request', {
          sessionId: sessionId.value,
        });
      }
    } catch (error: any) {
      console.error('重连后同步失败:', error);
      message.warning('重连成功，但状态同步失败');
    }
  } else if (!connected) {
    // 连接断开时清理监听器
    cleanupSocketListeners();
  }
});
</script>

<style scoped lang="scss">
.brainstorm-session-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;

  .network-status-bar {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .connection-status {
    margin-bottom: 24px;

    .connection-alert {
      border-radius: 8px;
    }
  }

  .session-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    padding: 24px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .session-info {
      flex: 1;

      .session-title {
        margin: 0 0 12px 0;
        font-size: 24px;
        font-weight: 600;
        color: #262626;
      }

      .session-meta {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;

        .session-topic {
          color: #595959;
          font-weight: 500;
        }

        .session-time {
          color: #8c8c8c;
          font-size: 14px;
        }
      }
    }

    .session-actions {
      flex-shrink: 0;
    }
  }

  .progress-section {
    margin-bottom: 32px;
  }

  .agents-section {
    margin-bottom: 32px;

    .section-title {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
      color: #262626;
    }

    .agents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 16px;
    }
  }

  .summary-section {
    margin-bottom: 32px;
  }

  .final-report-section {
    margin-bottom: 32px;
  }

  .loading-overlay {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: 16px;

    .loading-text {
      color: #8c8c8c;
      font-size: 16px;
    }
  }

  .error-section {
    margin-top: 48px;
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .brainstorm-session-page {
    .agents-section .agents-grid {
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    }
  }
}

@media (max-width: 768px) {
  .brainstorm-session-page {
    padding: 16px;

    .session-header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;

      .session-actions {
        align-self: stretch;

        :deep(.ant-space) {
          width: 100%;
          justify-content: center;
        }
      }
    }

    .agents-section .agents-grid {
      grid-template-columns: 1fr;
    }
  }
}

@media (max-width: 576px) {
  .brainstorm-session-page {
    .session-header .session-info .session-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }
}
</style>