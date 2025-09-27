<template>
  <div class="agent-detail">
    <!-- 代理基本信息 -->
    <div class="agent-detail__header">
      <div class="agent-info">
        <a-avatar
          :size="64"
          :style="{ backgroundColor: getAvatarColor(agent.roleType) }"
        >
          {{ agent.name.charAt(0).toUpperCase() }}
        </a-avatar>
        
        <div class="agent-meta">
          <h2 class="agent-name">{{ agent.name }}</h2>
          <p class="agent-role">{{ agent.roleType }}</p>
          <div class="agent-status">
            <a-badge
              :status="getStatusBadgeType(agent.status)"
              :text="getStatusText(agent.status)"
            />
          </div>
        </div>
      </div>
      
      <div class="agent-actions">
        <a-button @click="handleEdit" type="primary">
          <EditOutlined />
          编辑
        </a-button>
      </div>
    </div>

    <!-- 详细信息 -->
    <div class="agent-detail__content">
      <a-tabs default-active-key="basic">
        <!-- 基本信息 -->
        <a-tab-pane key="basic" tab="基本信息">
          <div class="info-section">
            <div class="info-grid">
              <div class="info-item">
                <label>代理ID</label>
                <span>{{ agent.id }}</span>
              </div>
              
              <div class="info-item">
                <label>AI模型</label>
                <a-tag :color="getModelColor(agent.aiModel)">
                  {{ getModelDisplayName(agent.aiModel) }}
                </a-tag>
              </div>
              
              <div class="info-item">
                <label>创建时间</label>
                <span>{{ formatDateTime(agent.createdAt) }}</span>
              </div>
              
              <div class="info-item">
                <label>更新时间</label>
                <span>{{ formatDateTime(agent.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- 系统提示词 -->
        <a-tab-pane key="prompt" tab="系统提示词">
          <div class="prompt-section">
            <div class="prompt-content">
              <pre class="prompt-text">{{ agent.systemPrompt }}</pre>
            </div>
            
            <div class="prompt-stats">
              <div class="stat-item">
                <span class="stat-label">字符数:</span>
                <span class="stat-value">{{ agent.systemPrompt.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">预估Token:</span>
                <span class="stat-value">{{ estimateTokens(agent.systemPrompt) }}</span>
              </div>
            </div>
          </div>
        </a-tab-pane>

        <!-- 使用统计 -->
        <a-tab-pane key="stats" tab="使用统计">
          <div class="stats-section">
            <a-spin :spinning="statsLoading">
              <div v-if="agentStats" class="stats-content">
                <div class="stats-overview">
                  <div class="stats-card">
                    <div class="stats-number">{{ agentStats.totalSessions }}</div>
                    <div class="stats-label">参与会话</div>
                  </div>
                  
                  <div class="stats-card">
                    <div class="stats-number">{{ formatNumber(agentStats.totalTokens) }}</div>
                    <div class="stats-label">消耗Token</div>
                  </div>
                  
                  <div class="stats-card">
                    <div class="stats-number">{{ agentStats.averageResponseTime }}ms</div>
                    <div class="stats-label">平均响应时间</div>
                  </div>
                  
                  <div class="stats-card">
                    <div class="stats-number">{{ (agentStats.successRate * 100).toFixed(1) }}%</div>
                    <div class="stats-label">成功率</div>
                  </div>
                </div>
                
                <!-- 使用历史图表 -->
                <div class="usage-chart">
                  <h4>使用历史</h4>
                  <div class="chart-placeholder">
                    <!-- 这里可以集成图表库显示使用趋势 -->
                    <p>使用历史图表（待集成图表库）</p>
                  </div>
                </div>
              </div>
              
              <div v-else class="stats-empty">
                <a-empty description="暂无使用统计数据" />
              </div>
            </a-spin>
          </div>
        </a-tab-pane>

        <!-- 版本历史 -->
        <a-tab-pane key="versions" tab="版本历史">
          <div class="versions-section">
            <a-spin :spinning="versionsLoading">
              <div v-if="agentVersions.length > 0" class="versions-list">
                <div
                  v-for="version in agentVersions"
                  :key="version.id"
                  class="version-item"
                >
                  <div class="version-header">
                    <div class="version-info">
                      <span class="version-number">v{{ version.versionNumber }}</span>
                      <span class="version-date">{{ formatDateTime(version.createdAt) }}</span>
                    </div>
                    
                    <div class="version-actions">
                      <a-button
                        size="small"
                        @click="compareVersion(version)"
                      >
                        对比
                      </a-button>
                      <a-button
                        size="small"
                        type="primary"
                        @click="restoreVersion(version)"
                      >
                        恢复
                      </a-button>
                    </div>
                  </div>
                  
                  <div class="version-changes">
                    <div v-if="version.name !== agent.name" class="change-item">
                      <span class="change-label">名称:</span>
                      <span class="change-value">{{ version.name }}</span>
                    </div>
                    
                    <div v-if="version.roleType !== agent.roleType" class="change-item">
                      <span class="change-label">角色:</span>
                      <span class="change-value">{{ version.roleType }}</span>
                    </div>
                    
                    <div v-if="version.aiModel !== agent.aiModel" class="change-item">
                      <span class="change-label">模型:</span>
                      <span class="change-value">{{ getModelDisplayName(version.aiModel) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-else class="versions-empty">
                <a-empty description="暂无版本历史" />
              </div>
            </a-spin>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { EditOutlined } from '@ant-design/icons-vue';
import { agentService } from '@/services/agentService';
import type { Agent, AgentVersion, AgentStatus, AIModelType } from '@/types/agent';

interface Props {
  agent: Agent;
}

interface Emits {
  (e: 'edit', agent: Agent): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 状态
const statsLoading = ref(false);
const versionsLoading = ref(false);
const agentStats = ref<any>(null);
const agentVersions = ref<AgentVersion[]>([]);

// 事件处理
const handleEdit = () => {
  emit('edit', props.agent);
};

const compareVersion = (version: AgentVersion) => {
  // 实现版本对比功能
  message.info('版本对比功能开发中...');
};

const restoreVersion = (version: AgentVersion) => {
  // 实现版本恢复功能
  message.info('版本恢复功能开发中...');
};

// 工具函数
const getAvatarColor = (roleType: string) => {
  const colors = [
    '#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#87d068',
    '#108ee9', '#f50', '#2db7f5', '#52c41a', '#eb2f96'
  ];
  const hash = roleType.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getStatusBadgeType = (status: AgentStatus) => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'INACTIVE':
      return 'default';
    case 'DELETED':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusText = (status: AgentStatus) => {
  switch (status) {
    case 'ACTIVE':
      return '活跃';
    case 'INACTIVE':
      return '非活跃';
    case 'DELETED':
      return '已删除';
    default:
      return '未知';
  }
};

const getModelColor = (model: AIModelType) => {
  const colorMap: Record<AIModelType, string> = {
    'qwen-plus': 'blue',
    'qwen-turbo': 'cyan',
    'qwen-max': 'purple',
    'gpt-4': 'green',
    'gpt-3.5-turbo': 'orange',
    'claude-3': 'red',
    'gemini-pro': 'magenta',
  };
  return colorMap[model] || 'default';
};

const getModelDisplayName = (model: AIModelType) => {
  const nameMap: Record<AIModelType, string> = {
    'qwen-plus': 'Qwen Plus',
    'qwen-turbo': 'Qwen Turbo',
    'qwen-max': 'Qwen Max',
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5',
    'claude-3': 'Claude 3',
    'gemini-pro': 'Gemini Pro',
  };
  return nameMap[model] || model;
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN');
};

const formatNumber = (num: number) => {
  return num.toLocaleString();
};

const estimateTokens = (text: string) => {
  // 简单的Token估算，实际应该使用更准确的方法
  return Math.ceil(text.length / 4);
};

// 加载数据
const loadAgentStats = async () => {
  statsLoading.value = true;
  try {
    agentStats.value = await agentService.getAgentStats(props.agent.id);
  } catch (error) {
    console.error('获取代理统计失败:', error);
  } finally {
    statsLoading.value = false;
  }
};

const loadAgentVersions = async () => {
  versionsLoading.value = true;
  try {
    agentVersions.value = await agentService.getAgentVersions(props.agent.id);
  } catch (error) {
    console.error('获取版本历史失败:', error);
  } finally {
    versionsLoading.value = false;
  }
};

// 初始化
onMounted(() => {
  loadAgentStats();
  loadAgentVersions();
});
</script>

<style scoped lang="scss">
.agent-detail {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 24px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 24px;
  }

  &__content {
    // Tabs样式由Ant Design提供
  }
}

.agent-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.agent-meta {
  .agent-name {
    margin: 0 0 4px;
    font-size: 20px;
    font-weight: 600;
    color: #262626;
  }

  .agent-role {
    margin: 0 0 8px;
    font-size: 14px;
    color: #8c8c8c;
  }

  .agent-status {
    // Badge样式由Ant Design提供
  }
}

.info-section {
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 24px;
  }

  .info-item {
    label {
      display: block;
      font-size: 14px;
      color: #8c8c8c;
      margin-bottom: 4px;
    }

    span {
      font-size: 16px;
      color: #262626;
    }
  }
}

.prompt-section {
  .prompt-content {
    margin-bottom: 16px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    overflow: hidden;
  }

  .prompt-text {
    margin: 0;
    padding: 16px;
    background: #fafafa;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .prompt-stats {
    display: flex;
    gap: 24px;
    padding: 12px 16px;
    background: #f9f9f9;
    border-radius: 6px;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .stat-label {
        font-size: 14px;
        color: #8c8c8c;
      }

      .stat-value {
        font-size: 14px;
        font-weight: 600;
        color: #262626;
      }
    }
  }
}

.stats-section {
  .stats-content {
    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stats-card {
      padding: 16px;
      background: #fafafa;
      border-radius: 6px;
      text-align: center;

      .stats-number {
        font-size: 20px;
        font-weight: 600;
        color: #262626;
        margin-bottom: 4px;
      }

      .stats-label {
        font-size: 12px;
        color: #8c8c8c;
      }
    }

    .usage-chart {
      h4 {
        margin: 0 0 16px;
        font-size: 16px;
        color: #262626;
      }

      .chart-placeholder {
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fafafa;
        border-radius: 6px;
        color: #8c8c8c;
      }
    }
  }

  .stats-empty {
    padding: 48px 0;
    text-align: center;
  }
}

.versions-section {
  .versions-list {
    .version-item {
      padding: 16px;
      border: 1px solid #f0f0f0;
      border-radius: 6px;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .version-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .version-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .version-number {
        font-weight: 600;
        color: #262626;
      }

      .version-date {
        font-size: 12px;
        color: #8c8c8c;
      }
    }

    .version-actions {
      display: flex;
      gap: 8px;
    }

    .version-changes {
      .change-item {
        display: flex;
        gap: 8px;
        margin-bottom: 4px;
        font-size: 13px;

        &:last-child {
          margin-bottom: 0;
        }

        .change-label {
          color: #8c8c8c;
          min-width: 60px;
        }

        .change-value {
          color: #262626;
        }
      }
    }
  }

  .versions-empty {
    padding: 48px 0;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .agent-detail__header {
    flex-direction: column;
    gap: 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .version-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>