<template>
  <div class="brainstorm-results">
    <a-page-header
      :title="session?.topic || '会话结果'"
      sub-title="查看完整的头脑风暴结果"
      @back="handleBack"
    >
      <template #extra>
        <a-button @click="handleExport">
          <template #icon>
            <DownloadOutlined />
          </template>
          导出报告
        </a-button>
        <a-button type="primary" @click="handleCreateNew">
          <template #icon>
            <PlusOutlined />
          </template>
          新建会话
        </a-button>
      </template>
    </a-page-header>

    <div class="results-content">
      <a-spin :spinning="loading">
        <a-row :gutter="24">
          <!-- 左侧内容区 -->
          <a-col :span="18">
            <!-- 会话概览 -->
            <a-card title="会话概览" class="mb-4">
              <a-descriptions :column="2" bordered>
                <a-descriptions-item label="会话主题">
                  {{ session?.topic }}
                </a-descriptions-item>
                <a-descriptions-item label="会话状态">
                  <a-tag :color="getStatusColor(session?.status)">
                    {{ getStatusText(session?.status) }}
                  </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="参与代理">
                  {{ session?.agentIds?.length || 0 }} 个
                </a-descriptions-item>
                <a-descriptions-item label="完成阶段">
                  {{ session?.stageResults?.length || 0 }}/3
                </a-descriptions-item>
                <a-descriptions-item label="创建时间">
                  {{ formatDate(session?.createdAt) }}
                </a-descriptions-item>
                <a-descriptions-item label="完成时间">
                  {{ formatDate(session?.updatedAt) }}
                </a-descriptions-item>
              </a-descriptions>
            </a-card>

            <!-- 阶段结果 -->
            <a-card title="阶段结果" class="mb-4">
              <a-tabs v-model:activeKey="activeStageTab">
                <a-tab-pane
                  v-for="(stageResult, index) in session?.stageResults"
                  :key="index"
                  :tab="stageResult.stageName"
                >
                  <div class="stage-content">
                    <!-- AI总结 -->
                    <a-card size="small" title="AI总结" class="mb-3">
                      <div class="ai-summary">
                        <h4>关键要点</h4>
                        <ul>
                          <li v-for="point in stageResult.aiSummary?.keyPoints" :key="point">
                            {{ point }}
                          </li>
                        </ul>

                        <h4>共同建议</h4>
                        <ul>
                          <li v-for="suggestion in stageResult.aiSummary?.commonSuggestions" :key="suggestion">
                            {{ suggestion }}
                          </li>
                        </ul>

                        <h4>整体评估</h4>
                        <p>{{ stageResult.aiSummary?.overallAssessment }}</p>
                      </div>
                    </a-card>

                    <!-- 代理结果 -->
                    <div class="agent-results">
                      <h4>代理分析结果</h4>
                      <a-row :gutter="16">
                        <a-col
                          v-for="result in stageResult.agentResults"
                          :key="result.agentId"
                          :span="12"
                          class="mb-3"
                        >
                          <AgentResultCard :result="result" />
                        </a-col>
                      </a-row>
                    </div>
                  </div>
                </a-tab-pane>
              </a-tabs>
            </a-card>

            <!-- 最终报告 -->
            <a-card v-if="session?.finalReport" title="最终产品方案" class="mb-4">
              <ResultReport :report="session.finalReport" />
            </a-card>
          </a-col>

          <!-- 右侧信息栏 -->
          <a-col :span="6">
            <!-- 进度概览 -->
            <a-card title="进度概览" size="small" class="mb-4">
              <div class="progress-overview">
                <a-progress
                  type="circle"
                  :percent="progressPercent"
                  :size="80"
                  class="mb-3"
                />
                <div class="progress-details">
                  <div class="progress-item">
                    <span>已完成阶段</span>
                    <span>{{ session?.stageResults?.length || 0 }}/3</span>
                  </div>
                  <div class="progress-item">
                    <span>参与代理</span>
                    <span>{{ session?.agentIds?.length || 0 }}</span>
                  </div>
                  <div class="progress-item">
                    <span>总用时</span>
                    <span>{{ calculateDuration() }}</span>
                  </div>
                </div>
              </div>
            </a-card>

            <!-- 参与代理 -->
            <a-card title="参与代理" size="small" class="mb-4">
              <div class="agent-list">
                <div
                  v-for="agentId in session?.agentIds"
                  :key="agentId"
                  class="agent-item"
                >
                  <a-avatar size="small" :src="getAgentAvatar(agentId)" />
                  <span>{{ getAgentName(agentId) }}</span>
                </div>
              </div>
            </a-card>

            <!-- 操作历史 -->
            <a-card title="操作历史" size="small">
              <a-timeline size="small">
                <a-timeline-item
                  v-for="(stageResult, index) in session?.stageResults"
                  :key="index"
                  :color="index === session.stageResults.length - 1 ? 'green' : 'blue'"
                >
                  <p>完成{{ stageResult.stageName }}</p>
                  <p class="text-gray-500 text-sm">
                    {{ formatDate(stageResult.completedAt) }}
                  </p>
                </a-timeline-item>
                <a-timeline-item color="gray">
                  <p>创建会话</p>
                  <p class="text-gray-500 text-sm">
                    {{ formatDate(session?.createdAt) }}
                  </p>
                </a-timeline-item>
              </a-timeline>
            </a-card>
          </a-col>
        </a-row>
      </a-spin>
    </div>

    <!-- 导出对话框 -->
    <ExportDialog
      v-model:visible="exportDialogVisible"
      :session-id="session?.id"
      @exported="handleExported"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { useBrainstorm } from '@/composables/useBrainstorm'
import { useAgents } from '@/composables/useAgents'
import AgentResultCard from '@/components/brainstorm/AgentResultCard.vue'
import ResultReport from '@/components/brainstorm/ResultReport.vue'
import ExportDialog from '@/components/brainstorm/ExportDialog.vue'
import type { BrainstormSession } from '@/types/brainstorm'

const route = useRoute()
const router = useRouter()
const { getSession } = useBrainstorm()
const { agents } = useAgents()

const loading = ref(false)
const session = ref<BrainstormSession | null>(null)
const activeStageTab = ref(0)
const exportDialogVisible = ref(false)

const progressPercent = computed(() => {
  if (!session.value) return 0
  return Math.round((session.value.stageResults?.length || 0) / 3 * 100)
})

const loadSession = async () => {
  const sessionId = route.params.id as string
  if (!sessionId) return

  loading.value = true
  try {
    session.value = await getSession(sessionId)
  } catch (error) {
    console.error('加载会话结果失败:', error)
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  router.back()
}

const handleExport = () => {
  exportDialogVisible.value = true
}

const handleCreateNew = () => {
  router.push('/brainstorm')
}

const handleExported = () => {
  exportDialogVisible.value = false
}

const getStatusColor = (status?: string) => {
  const colors = {
    completed: 'green',
    active: 'blue',
    paused: 'orange',
    cancelled: 'red'
  }
  return colors[status as keyof typeof colors] || 'default'
}

const getStatusText = (status?: string) => {
  const texts = {
    completed: '已完成',
    active: '进行中',
    paused: '已暂停',
    cancelled: '已取消'
  }
  return texts[status as keyof typeof texts] || status || '未知'
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

const calculateDuration = () => {
  if (!session.value?.createdAt || !session.value?.updatedAt) return '-'
  const start = new Date(session.value.createdAt)
  const end = new Date(session.value.updatedAt)
  const diff = end.getTime() - start.getTime()
  const minutes = Math.floor(diff / 60000)
  return `${minutes} 分钟`
}

const getAgentName = (agentId: string) => {
  const agent = agents.value.find(a => a.id === agentId)
  return agent?.name || `代理 ${agentId.slice(0, 8)}`
}

const getAgentAvatar = (agentId: string) => {
  // 返回默认头像或根据代理ID生成头像
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${agentId}`
}

onMounted(() => {
  loadSession()
})
</script>

<style scoped>
.brainstorm-results {
  padding: 24px;
}

.results-content {
  margin-top: 16px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

.stage-content {
  padding: 16px 0;
}

.ai-summary h4 {
  margin: 16px 0 8px 0;
  color: #1890ff;
}

.ai-summary ul {
  margin-bottom: 16px;
  padding-left: 20px;
}

.ai-summary p {
  line-height: 1.6;
  color: #666;
}

.agent-results h4 {
  margin-bottom: 16px;
  color: #1890ff;
}

.progress-overview {
  text-align: center;
}

.progress-details {
  margin-top: 16px;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.agent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.text-gray-500 {
  color: #6b7280;
}

.text-sm {
  font-size: 12px;
}
</style>