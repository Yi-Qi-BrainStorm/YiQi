<template>
  <div class="agent-detail">
    <a-page-header
      :title="agent?.name || '代理详情'"
      :sub-title="agent?.role"
      @back="handleBack"
    >
      <template #extra>
        <a-button @click="handleEdit">
          <template #icon>
            <EditOutlined />
          </template>
          编辑
        </a-button>
        <a-button type="primary" @click="handleTest">
          <template #icon>
            <PlayCircleOutlined />
          </template>
          测试代理
        </a-button>
      </template>
    </a-page-header>

    <div class="agent-detail-content">
      <a-spin :spinning="loading">
        <a-row :gutter="24">
          <a-col :span="16">
            <a-card title="基本信息" class="mb-4">
              <a-descriptions :column="2" bordered>
                <a-descriptions-item label="代理名称">
                  {{ agent?.name }}
                </a-descriptions-item>
                <a-descriptions-item label="角色">
                  {{ agent?.role }}
                </a-descriptions-item>
                <a-descriptions-item label="AI模型">
                  {{ agent?.modelType }}
                </a-descriptions-item>
                <a-descriptions-item label="创建时间">
                  {{ formatDate(agent?.createdAt) }}
                </a-descriptions-item>
                <a-descriptions-item label="更新时间">
                  {{ formatDate(agent?.updatedAt) }}
                </a-descriptions-item>
                <a-descriptions-item label="状态">
                  <a-tag :color="agent?.status === 'active' ? 'green' : 'red'">
                    {{ agent?.status === 'active' ? '活跃' : '停用' }}
                  </a-tag>
                </a-descriptions-item>
              </a-descriptions>
            </a-card>

            <a-card title="系统提示词" class="mb-4">
              <pre class="system-prompt">{{ agent?.systemPrompt }}</pre>
            </a-card>

            <a-card title="模型配置">
              <a-descriptions :column="2" bordered>
                <a-descriptions-item label="Temperature">
                  {{ agent?.modelConfig?.temperature }}
                </a-descriptions-item>
                <a-descriptions-item label="Max Tokens">
                  {{ agent?.modelConfig?.maxTokens }}
                </a-descriptions-item>
                <a-descriptions-item label="Top P">
                  {{ agent?.modelConfig?.topP }}
                </a-descriptions-item>
                <a-descriptions-item label="Frequency Penalty">
                  {{ agent?.modelConfig?.frequencyPenalty }}
                </a-descriptions-item>
              </a-descriptions>
            </a-card>
          </a-col>

          <a-col :span="8">
            <a-card title="使用统计" class="mb-4">
              <a-statistic
                title="参与会话数"
                :value="agent?.stats?.sessionCount || 0"
                class="mb-3"
              />
              <a-statistic
                title="生成结果数"
                :value="agent?.stats?.resultCount || 0"
                class="mb-3"
              />
              <a-statistic
                title="平均响应时间"
                :value="agent?.stats?.avgResponseTime || 0"
                suffix="秒"
              />
            </a-card>

            <a-card title="最近活动">
              <a-timeline>
                <a-timeline-item
                  v-for="activity in recentActivities"
                  :key="activity.id"
                  :color="activity.type === 'success' ? 'green' : 'blue'"
                >
                  <p>{{ activity.description }}</p>
                  <p class="text-gray-500 text-sm">{{ formatDate(activity.timestamp) }}</p>
                </a-timeline-item>
              </a-timeline>
            </a-card>
          </a-col>
        </a-row>
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { EditOutlined, PlayCircleOutlined } from '@ant-design/icons-vue'
import { useAgents } from '@/composables/useAgents'
import type { Agent } from '@/types/agent'

const route = useRoute()
const router = useRouter()
const { getAgentById } = useAgents()

const loading = ref(false)
const agent = ref<Agent | null>(null)
const recentActivities = ref([
  {
    id: 1,
    type: 'success',
    description: '参与头脑风暴会话',
    timestamp: new Date().toISOString()
  }
])

const loadAgent = async () => {
  const agentId = route.params.id as string
  if (!agentId) return

  loading.value = true
  try {
    agent.value = await getAgentById(agentId)
  } catch (error) {
    console.error('加载代理详情失败:', error)
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  router.back()
}

const handleEdit = () => {
  if (agent.value) {
    router.push(`/agents/${agent.value.id}/edit`)
  }
}

const handleTest = () => {
  // TODO: 实现代理测试功能
  console.log('测试代理')
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

onMounted(() => {
  loadAgent()
})
</script>

<style scoped>
.agent-detail {
  padding: 24px;
}

.agent-detail-content {
  margin-top: 16px;
}

.system-prompt {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
}

.mb-3 {
  margin-bottom: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

.text-gray-500 {
  color: #6b7280;
}

.text-sm {
  font-size: 14px;
}
</style>