<template>
  <div class="brainstorm-history">
    <a-page-header title="头脑风暴历史" sub-title="查看和管理您的历史会话">
      <template #extra>
        <a-button type="primary" @click="handleCreateNew">
          <template #icon>
            <PlusOutlined />
          </template>
          新建会话
        </a-button>
      </template>
    </a-page-header>

    <div class="history-content">
      <a-card>
        <!-- 搜索和筛选 -->
        <div class="search-filters mb-4">
          <a-row :gutter="16">
            <a-col :span="8">
              <a-input-search
                v-model:value="searchKeyword"
                placeholder="搜索会话主题..."
                @search="handleSearch"
              />
            </a-col>
            <a-col :span="4">
              <a-select
                v-model:value="statusFilter"
                placeholder="状态筛选"
                style="width: 100%"
                @change="handleFilterChange"
              >
                <a-select-option value="">全部状态</a-select-option>
                <a-select-option value="completed">已完成</a-select-option>
                <a-select-option value="active">进行中</a-select-option>
                <a-select-option value="paused">已暂停</a-select-option>
              </a-select>
            </a-col>
            <a-col :span="4">
              <a-date-picker
                v-model:value="dateFilter"
                placeholder="选择日期"
                style="width: 100%"
                @change="handleFilterChange"
              />
            </a-col>
            <a-col :span="4">
              <a-button @click="handleResetFilters">重置筛选</a-button>
            </a-col>
          </a-row>
        </div>

        <!-- 会话列表 -->
        <a-spin :spinning="loading">
          <a-list
            :data-source="filteredSessions"
            :pagination="paginationConfig"
            item-layout="vertical"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <template #actions>
                  <a-button type="link" @click="handleViewSession(item)">
                    <EyeOutlined />
                    查看
                  </a-button>
                  <a-button 
                    type="link" 
                    @click="handleContinueSession(item)"
                    :disabled="item.status === 'completed'"
                  >
                    <PlayCircleOutlined />
                    继续
                  </a-button>
                  <a-button type="link" @click="handleExportSession(item)">
                    <DownloadOutlined />
                    导出
                  </a-button>
                  <a-popconfirm
                    title="确定要删除这个会话吗？"
                    @confirm="handleDeleteSession(item)"
                  >
                    <a-button type="link" danger>
                      <DeleteOutlined />
                      删除
                    </a-button>
                  </a-popconfirm>
                </template>

                <a-list-item-meta>
                  <template #title>
                    <a @click="handleViewSession(item)">{{ item.topic }}</a>
                  </template>
                  <template #description>
                    <div class="session-meta">
                      <a-tag :color="getStatusColor(item.status)">
                        {{ getStatusText(item.status) }}
                      </a-tag>
                      <span class="meta-item">
                        <CalendarOutlined />
                        {{ formatDate(item.createdAt) }}
                      </span>
                      <span class="meta-item">
                        <TeamOutlined />
                        {{ item.agentCount }} 个代理
                      </span>
                      <span class="meta-item">
                        <ClockCircleOutlined />
                        {{ item.duration || '未完成' }}
                      </span>
                    </div>
                  </template>
                </a-list-item-meta>

                <div class="session-content">
                  <p class="session-summary">{{ item.summary || '暂无摘要' }}</p>
                  <div class="session-stages">
                    <a-progress
                      :percent="(item.completedStages / 3) * 100"
                      :show-info="false"
                      size="small"
                    />
                    <span class="stage-text">
                      {{ item.completedStages }}/3 阶段完成
                    </span>
                  </div>
                </div>
              </a-list-item>
            </template>
          </a-list>
        </a-spin>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  PlusOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  DeleteOutlined,
  CalendarOutlined,
  TeamOutlined,
  ClockCircleOutlined
} from '@ant-design/icons-vue'
import { useBrainstorm } from '@/composables/useBrainstorm'
import type { BrainstormSession } from '@/types/brainstorm'

const router = useRouter()
const { getBrainstormHistory, deleteSession } = useBrainstorm()

const loading = ref(false)
const sessions = ref<BrainstormSession[]>([])
const searchKeyword = ref('')
const statusFilter = ref('')
const dateFilter = ref()

const paginationConfig = {
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 个会话`
}

const filteredSessions = computed(() => {
  let filtered = sessions.value

  // 关键词搜索
  if (searchKeyword.value) {
    filtered = filtered.filter(session =>
      session.topic.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  // 状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(session => session.status === statusFilter.value)
  }

  // 日期筛选
  if (dateFilter.value) {
    const filterDate = dateFilter.value.format('YYYY-MM-DD')
    filtered = filtered.filter(session =>
      session.createdAt.startsWith(filterDate)
    )
  }

  return filtered
})

const loadHistory = async () => {
  loading.value = true
  try {
    sessions.value = await getBrainstormHistory()
  } catch (error) {
    console.error('加载历史记录失败:', error)
  } finally {
    loading.value = false
  }
}

const handleCreateNew = () => {
  router.push('/brainstorm')
}

const handleSearch = () => {
  // 搜索逻辑已在computed中处理
}

const handleFilterChange = () => {
  // 筛选逻辑已在computed中处理
}

const handleResetFilters = () => {
  searchKeyword.value = ''
  statusFilter.value = ''
  dateFilter.value = undefined
}

const handleViewSession = (session: BrainstormSession) => {
  router.push(`/brainstorm/results/${session.id}`)
}

const handleContinueSession = (session: BrainstormSession) => {
  router.push(`/brainstorm/session/${session.id}`)
}

const handleExportSession = (session: BrainstormSession) => {
  // TODO: 实现导出功能
  console.log('导出会话:', session.id)
}

const handleDeleteSession = async (session: BrainstormSession) => {
  try {
    await deleteSession(session.id)
    sessions.value = sessions.value.filter(s => s.id !== session.id)
  } catch (error) {
    console.error('删除会话失败:', error)
  }
}

const getStatusColor = (status: string) => {
  const colors = {
    completed: 'green',
    active: 'blue',
    paused: 'orange',
    cancelled: 'red'
  }
  return colors[status as keyof typeof colors] || 'default'
}

const getStatusText = (status: string) => {
  const texts = {
    completed: '已完成',
    active: '进行中',
    paused: '已暂停',
    cancelled: '已取消'
  }
  return texts[status as keyof typeof texts] || status
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.brainstorm-history {
  padding: 24px;
}

.history-content {
  margin-top: 16px;
}

.search-filters {
  margin-bottom: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.session-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  font-size: 14px;
}

.session-content {
  margin-top: 12px;
}

.session-summary {
  color: #666;
  margin-bottom: 8px;
  line-height: 1.5;
}

.session-stages {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stage-text {
  font-size: 12px;
  color: #999;
}
</style>