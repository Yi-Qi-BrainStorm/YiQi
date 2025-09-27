<template>
  <div class="stage-summary">
    <a-card 
      :title="summaryTitle"
      :bordered="false"
      class="summary-card"
    >
      <template #extra>
        <a-space>
          <a-tag color="blue">
            {{ stageName }}
          </a-tag>
          <a-tag :color="getCompletionStatusColor()">
            {{ getCompletionStatusText() }}
          </a-tag>
        </a-space>
      </template>

      <!-- AI总结内容 -->
      <div class="summary-content" v-if="summary">
        <!-- 关键要点 -->
        <div class="summary-section" v-if="summary.keyPoints?.length">
          <h4 class="section-title">
            <BulbOutlined />
            关键要点
          </h4>
          <ul class="key-points-list">
            <li 
              v-for="(point, index) in summary.keyPoints" 
              :key="index"
              class="key-point-item"
            >
              {{ point }}
            </li>
          </ul>
        </div>

        <!-- 共同建议 -->
        <div class="summary-section" v-if="summary.commonSuggestions?.length">
          <h4 class="section-title">
            <CheckCircleOutlined />
            共同建议
          </h4>
          <div class="suggestions-grid">
            <a-tag 
              v-for="(suggestion, index) in summary.commonSuggestions"
              :key="index"
              color="green"
              class="suggestion-tag"
            >
              {{ suggestion }}
            </a-tag>
          </div>
        </div>

        <!-- 冲突观点 -->
        <div class="summary-section" v-if="summary.conflictingViews?.length">
          <h4 class="section-title">
            <ExclamationCircleOutlined />
            不同观点
          </h4>
          <div class="conflicts-container">
            <a-collapse 
              v-model:activeKey="activeConflictKeys"
              ghost
              size="small"
            >
              <a-collapse-panel
                v-for="(conflict, index) in summary.conflictingViews"
                :key="index"
                :header="conflict.topic"
                class="conflict-panel"
              >
                <div class="conflict-content">
                  <div class="agent-views">
                    <div 
                      v-for="view in conflict.agentViews"
                      :key="view.agentId"
                      class="agent-view"
                    >
                      <div class="view-header">
                        <a-avatar 
                          :size="24"
                          :style="{ backgroundColor: getAgentColor(view.agentId) }"
                        >
                          {{ getAgentInitials(view.agentName) }}
                        </a-avatar>
                        <span class="agent-name">{{ view.agentName }}</span>
                      </div>
                      <div class="view-content">{{ view.viewpoint }}</div>
                    </div>
                  </div>
                  
                  <div class="conflict-analysis" v-if="conflict.analysis">
                    <a-divider orientation="left" plain>
                      <span class="analysis-title">分析</span>
                    </a-divider>
                    <div class="analysis-content">{{ conflict.analysis }}</div>
                  </div>
                </div>
              </a-collapse-panel>
            </a-collapse>
          </div>
        </div>

        <!-- 整体评估 -->
        <div class="summary-section" v-if="summary.overallAssessment">
          <h4 class="section-title">
            <BarChartOutlined />
            整体评估
          </h4>
          <div class="overall-assessment">
            <a-typography-paragraph>
              {{ summary.overallAssessment }}
            </a-typography-paragraph>
          </div>
        </div>

        <!-- 下一步建议 -->
        <div class="summary-section" v-if="summary.nextStepRecommendations?.length">
          <h4 class="section-title">
            <ArrowRightOutlined />
            下一步建议
          </h4>
          <div class="next-steps">
            <a-timeline size="small">
              <a-timeline-item
                v-for="(recommendation, index) in summary.nextStepRecommendations"
                :key="index"
                :color="getRecommendationColor(index)"
              >
                {{ recommendation }}
              </a-timeline-item>
            </a-timeline>
          </div>
        </div>
      </div>

      <!-- 代理结果统计 -->
      <div class="agent-results-stats" v-if="agentResults?.length">
        <a-divider orientation="left">
          <span class="stats-title">代理参与统计</span>
        </a-divider>
        
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ agentResults.length }}</div>
            <div class="stat-label">参与代理</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ averageProcessingTime }}</div>
            <div class="stat-label">平均用时</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ totalContentLength }}</div>
            <div class="stat-label">总字数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatTime(completedAt) }}</div>
            <div class="stat-label">完成时间</div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="summary-actions">
        <a-space size="large">
          <!-- 进入下一阶段 -->
          <a-button
            v-if="!isLastStage"
            type="primary"
            size="large"
            :loading="proceeding"
            @click="handleProceedToNext"
          >
            <ArrowRightOutlined />
            进入下一阶段
          </a-button>

          <!-- 生成最终报告 -->
          <a-button
            v-if="isLastStage"
            type="primary"
            size="large"
            :loading="generatingReport"
            @click="handleGenerateFinalReport"
          >
            <FileTextOutlined />
            生成最终报告
          </a-button>

          <!-- 重新开始当前阶段 -->
          <a-button
            size="large"
            :loading="restarting"
            @click="handleRestartStage"
          >
            <RedoOutlined />
            重新开始当前阶段
          </a-button>

          <!-- 导出阶段结果 -->
          <a-button
            size="large"
            @click="handleExportStageResults"
          >
            <DownloadOutlined />
            导出阶段结果
          </a-button>

          <!-- 查看详细结果 -->
          <a-button
            size="large"
            @click="handleViewDetailedResults"
          >
            <EyeOutlined />
            查看详细结果
          </a-button>
        </a-space>
      </div>

      <!-- 确认对话框 -->
      <a-modal
        v-model:open="confirmVisible"
        :title="confirmTitle"
        :ok-text="confirmOkText"
        :cancel-text="'取消'"
        @ok="handleConfirmAction"
        @cancel="handleCancelAction"
      >
        <div class="confirm-content">
          <ExclamationCircleOutlined class="confirm-icon" />
          <div class="confirm-message">{{ confirmMessage }}</div>
        </div>
      </a-modal>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { message } from 'ant-design-vue';
import {
  BulbOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  ArrowRightOutlined,
  RedoOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
} from '@ant-design/icons-vue';
import type { AISummary, StageResult } from '@/types/brainstorm';
import type { AgentResult } from '@/types/agent';

interface Props {
  summary: AISummary;
  agentResults: AgentResult[];
  stageName: string;
  stageNumber: number;
  isLastStage?: boolean;
  completedAt: string;
}

interface Emits {
  (e: 'proceed-to-next'): void;
  (e: 'restart-stage'): void;
  (e: 'generate-final-report'): void;
  (e: 'export-stage-results', results: AgentResult[]): void;
  (e: 'view-detailed-results', results: AgentResult[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  isLastStage: false,
});

const emit = defineEmits<Emits>();

// 响应式数据
const activeConflictKeys = ref<string[]>([]);
const proceeding = ref(false);
const restarting = ref(false);
const generatingReport = ref(false);
const confirmVisible = ref(false);
const confirmAction = ref<string>('');

// 确认对话框配置
const confirmConfig = {
  'proceed': {
    title: '确认进入下一阶段',
    message: '确定要进入下一阶段吗？当前阶段的结果将被保存，无法再次修改。',
    okText: '确认进入',
  },
  'restart': {
    title: '确认重新开始',
    message: '确定要重新开始当前阶段吗？当前阶段的所有结果将被清除。',
    okText: '确认重新开始',
  },
  'generate-report': {
    title: '确认生成最终报告',
    message: '确定要生成最终报告吗？这将结束整个头脑风暴会话。',
    okText: '确认生成',
  },
};

// 计算属性
const summaryTitle = computed(() => `第${props.stageNumber}阶段总结`);

const averageProcessingTime = computed(() => {
  if (!props.agentResults.length) return '0秒';
  
  const totalTime = props.agentResults.reduce((sum, result) => sum + result.processingTime, 0);
  const avgTime = Math.round(totalTime / props.agentResults.length);
  
  return formatDuration(avgTime);
});

const totalContentLength = computed(() => {
  const totalLength = props.agentResults.reduce((sum, result) => sum + result.content.length, 0);
  return totalLength.toLocaleString();
});

const confirmTitle = computed(() => {
  const config = confirmConfig[confirmAction.value as keyof typeof confirmConfig];
  return config?.title || '确认操作';
});

const confirmMessage = computed(() => {
  const config = confirmConfig[confirmAction.value as keyof typeof confirmConfig];
  return config?.message || '确定要执行此操作吗？';
});

const confirmOkText = computed(() => {
  const config = confirmConfig[confirmAction.value as keyof typeof confirmConfig];
  return config?.okText || '确认';
});

// 方法
const getCompletionStatusColor = (): string => {
  return 'success';
};

const getCompletionStatusText = (): string => {
  return '已完成';
};

const getAgentColor = (agentId: string): string => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];
  const id = parseInt(agentId) || 0;
  return colors[id % colors.length];
};

const getAgentInitials = (name: string): string => {
  return name.slice(0, 2).toUpperCase();
};

const getRecommendationColor = (index: number): string => {
  const colors = ['blue', 'green', 'orange', 'red', 'purple', 'cyan'];
  return colors[index % colors.length];
};

const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`;
  }
  return `${remainingSeconds}秒`;
};

const formatTime = (timeString: string): string => {
  const date = new Date(timeString);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 事件处理
const showConfirmDialog = (action: string) => {
  confirmAction.value = action;
  confirmVisible.value = true;
};

const handleConfirmAction = async () => {
  confirmVisible.value = false;
  
  try {
    switch (confirmAction.value) {
      case 'proceed':
        proceeding.value = true;
        emit('proceed-to-next');
        break;
      case 'restart':
        restarting.value = true;
        emit('restart-stage');
        break;
      case 'generate-report':
        generatingReport.value = true;
        emit('generate-final-report');
        break;
    }
  } catch (error) {
    console.error('操作失败:', error);
    message.error('操作失败，请重试');
  } finally {
    proceeding.value = false;
    restarting.value = false;
    generatingReport.value = false;
  }
};

const handleCancelAction = () => {
  confirmVisible.value = false;
  confirmAction.value = '';
};

const handleProceedToNext = () => {
  showConfirmDialog('proceed');
};

const handleRestartStage = () => {
  showConfirmDialog('restart');
};

const handleGenerateFinalReport = () => {
  showConfirmDialog('generate-report');
};

const handleExportStageResults = () => {
  emit('export-stage-results', props.agentResults);
  message.success('正在导出阶段结果...');
};

const handleViewDetailedResults = () => {
  emit('view-detailed-results', props.agentResults);
};
</script>

<style scoped lang="scss">
.stage-summary {
  .summary-card {
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .summary-content {
      .summary-section {
        margin-bottom: 24px;

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #262626;
          margin-bottom: 12px;

          .anticon {
            color: #1890ff;
          }
        }

        .key-points-list {
          list-style: none;
          padding: 0;
          margin: 0;

          .key-point-item {
            position: relative;
            padding: 8px 0 8px 20px;
            border-left: 3px solid #1890ff;
            margin-bottom: 8px;
            background: #f6ffed;
            border-radius: 0 4px 4px 0;

            &::before {
              content: '•';
              position: absolute;
              left: 8px;
              color: #1890ff;
              font-weight: bold;
            }
          }
        }

        .suggestions-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          .suggestion-tag {
            margin: 0;
            padding: 4px 12px;
            border-radius: 16px;
          }
        }

        .conflicts-container {
          .conflict-panel {
            border: 1px solid #f0f0f0;
            border-radius: 4px;
            margin-bottom: 8px;

            .conflict-content {
              .agent-views {
                .agent-view {
                  margin-bottom: 16px;
                  padding: 12px;
                  background: #fafafa;
                  border-radius: 4px;

                  .view-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;

                    .agent-name {
                      font-weight: 500;
                      color: #262626;
                    }
                  }

                  .view-content {
                    color: #595959;
                    line-height: 1.6;
                  }
                }
              }

              .conflict-analysis {
                .analysis-title {
                  font-size: 14px;
                  font-weight: 500;
                  color: #8c8c8c;
                }

                .analysis-content {
                  background: #fff7e6;
                  padding: 12px;
                  border-radius: 4px;
                  border-left: 3px solid #faad14;
                  color: #595959;
                  line-height: 1.6;
                }
              }
            }
          }
        }

        .overall-assessment {
          background: #f0f9ff;
          padding: 16px;
          border-radius: 6px;
          border-left: 4px solid #1890ff;

          :deep(.ant-typography) {
            margin-bottom: 0;
            color: #262626;
            line-height: 1.6;
          }
        }

        .next-steps {
          background: #f6ffed;
          padding: 16px;
          border-radius: 6px;
          border-left: 4px solid #52c41a;
        }
      }
    }

    .agent-results-stats {
      .stats-title {
        font-size: 14px;
        font-weight: 500;
        color: #8c8c8c;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 16px;
        margin-top: 16px;

        .stat-item {
          text-align: center;
          padding: 16px;
          background: #fafafa;
          border-radius: 6px;

          .stat-value {
            font-size: 20px;
            font-weight: 600;
            color: #1890ff;
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 12px;
            color: #8c8c8c;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        }
      }
    }

    .summary-actions {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #f0f0f0;
      text-align: center;
    }
  }
}

.confirm-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 0;

  .confirm-icon {
    color: #faad14;
    font-size: 20px;
    margin-top: 2px;
  }

  .confirm-message {
    flex: 1;
    color: #595959;
    line-height: 1.6;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .stage-summary {
    .summary-card .summary-content .summary-section {
      .suggestions-grid {
        .suggestion-tag {
          font-size: 12px;
          padding: 2px 8px;
        }
      }
    }

    .agent-results-stats .stats-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;

      .stat-item {
        padding: 12px;

        .stat-value {
          font-size: 16px;
        }
      }
    }

    .summary-actions {
      :deep(.ant-space) {
        flex-direction: column;
        width: 100%;

        .ant-space-item {
          width: 100%;

          .ant-btn {
            width: 100%;
          }
        }
      }
    }
  }
}
</style>