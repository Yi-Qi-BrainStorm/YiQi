<template>
  <div class="brainstorm-session">
    <!-- 会话头部 -->
    <div class="session-header">
      <div class="header-content">
        <div class="session-info">
          <h1 class="session-title">{{ sessionTopic || '新建头脑风暴会话' }}</h1>
          <div class="session-meta">
            <a-tag :color="getStatusColor(sessionStatus)">
              {{ getStatusText(sessionStatus) }}
            </a-tag>
            <span v-if="sessionStartTime" class="session-time">
              开始时间: {{ formatTime(sessionStartTime) }}
            </span>
          </div>
        </div>
        
        <div class="session-actions">
          <a-space>
            <a-button 
              v-if="sessionStatus === 'IDLE'" 
              type="primary" 
              :loading="isStarting"
              :disabled="!canStartSession"
              @click="startSession"
            >
              开始头脑风暴
            </a-button>
            <a-button 
              v-if="sessionStatus === 'ACTIVE'" 
              type="danger" 
              :loading="isStopping"
              @click="stopSession"
            >
              停止会话
            </a-button>
            <a-button @click="showSettings = true">
              <SettingOutlined />
              设置
            </a-button>
          </a-space>
        </div>
      </div>
      
      <!-- 三阶段进度指示器 -->
      <div class="progress-section">
        <a-steps 
          :current="currentStage - 1" 
          :status="getStepsStatus()"
          size="small"
        >
          <a-step 
            title="创意生成" 
            description="专注于创意想法和概念设计"
          />
          <a-step 
            title="技术可行性分析" 
            description="分析技术实现和资源需求"
          />
          <a-step 
            title="缺点讨论" 
            description="识别潜在问题和改进建议"
          />
        </a-steps>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="session-content">
      <!-- 初始配置阶段 -->
      <div v-if="sessionStatus === 'IDLE'" class="setup-section">
        <a-card title="创建头脑风暴会话" class="setup-card">
          <div class="setup-form">
            <a-form layout="vertical" :model="sessionConfig">
              <a-form-item 
                label="会话主题" 
                required
                :rules="[{ required: true, message: '请输入头脑风暴主题' }]"
              >
                <a-textarea 
                  v-model:value="sessionTopic"
                  placeholder="请详细描述您要进行头脑风暴的文创产品主题，例如：设计一款以传统文化为主题的手机壳产品"
                  :rows="3"
                  size="large"
                  show-count
                  :maxlength="500"
                />
              </a-form-item>
              
              <a-form-item 
                label="选择参与代理" 
                required
                :rules="[{ required: true, message: '请至少选择一个代理' }]"
              >
                <div class="agents-selection">
                  <div class="agents-grid">
                    <div 
                      v-for="agent in availableAgents" 
                      :key="agent.id"
                      :class="['agent-card', { selected: selectedAgents.includes(agent.id) }]"
                      @click="toggleAgent(agent.id)"
                    >
                      <a-avatar :size="48" :style="{ backgroundColor: getAgentColor(agent.roleType) }">
                        {{ agent.name.charAt(0) }}
                      </a-avatar>
                      <div class="agent-info">
                        <h4>{{ agent.name }}</h4>
                        <p>{{ agent.roleType }}</p>
                        <div class="agent-description">{{ getAgentDescription(agent.roleType) }}</div>
                      </div>
                      <div class="selection-indicator">
                        <CheckCircleFilled v-if="selectedAgents.includes(agent.id)" />
                      </div>
                    </div>
                  </div>
                  <div class="selection-summary">
                    已选择 {{ selectedAgents.length }} 个代理
                  </div>
                </div>
              </a-form-item>
            </a-form>
          </div>
        </a-card>
      </div>

      <!-- 活跃会话界面 -->
      <div v-if="sessionStatus === 'ACTIVE'" class="active-session">
        <!-- 当前阶段信息 -->
        <div class="stage-header">
          <a-card class="stage-info-card">
            <div class="stage-info">
              <div class="stage-title">
                <h2>{{ getCurrentStageTitle() }}</h2>
                <a-tag :color="getStageColor(currentStage)">第{{ currentStage }}阶段</a-tag>
              </div>
              <p class="stage-description">{{ getCurrentStageDescription() }}</p>
              <div class="stage-progress">
                <a-progress 
                  :percent="getStageProgress()" 
                  :status="allAgentsCompleted ? 'success' : 'active'"
                  :stroke-color="getStageColor(currentStage)"
                />
              </div>
            </div>
          </a-card>
        </div>
        
        <!-- 代理思考状态 -->
        <div class="agents-section">
          <h3>代理分析进度</h3>
          <a-row :gutter="[16, 16]">
            <a-col 
              v-for="agent in getSelectedAgents()" 
              :key="agent.id"
              :xs="24" :sm="12" :lg="8"
            >
              <a-card class="agent-status-card" :class="{ completed: getAgentStatus(agent.id) === 'completed' }">
                <div class="agent-header">
                  <a-avatar :size="40" :style="{ backgroundColor: getAgentColor(agent.roleType) }">
                    {{ agent.name.charAt(0) }}
                  </a-avatar>
                  <div class="agent-info">
                    <h4>{{ agent.name }}</h4>
                    <div class="status-indicator">
                      <LoadingOutlined v-if="getAgentStatus(agent.id) === 'thinking'" spin />
                      <CheckCircleOutlined v-else-if="getAgentStatus(agent.id) === 'completed'" style="color: #52c41a" />
                      <ClockCircleOutlined v-else style="color: #faad14" />
                      <span>{{ getAgentStatusText(agent.id) }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- 代理结果展示 -->
                <div v-if="getAgentResult(agent.id)" class="agent-result">
                  <a-collapse ghost>
                    <a-collapse-panel key="1" header="查看详细分析结果">
                      <div class="result-content">
                        <div class="result-section">
                          <h5>核心观点</h5>
                          <p>{{ getAgentResult(agent.id).mainPoint }}</p>
                        </div>
                        <div class="result-section">
                          <h5>详细分析</h5>
                          <p>{{ getAgentResult(agent.id).analysis }}</p>
                        </div>
                        <div class="result-section">
                          <h5>建议方案</h5>
                          <ul>
                            <li v-for="suggestion in getAgentResult(agent.id).suggestions" :key="suggestion">
                              {{ suggestion }}
                            </li>
                          </ul>
                        </div>
                      </div>
                    </a-collapse-panel>
                  </a-collapse>
                </div>
                
                <!-- 思考中的提示 -->
                <div v-else-if="getAgentStatus(agent.id) === 'thinking'" class="thinking-indicator">
                  <a-spin size="small" />
                  <span>正在从{{ agent.roleType }}角度分析...</span>
                </div>
              </a-card>
            </a-col>
          </a-row>
        </div>
        
        <!-- 阶段总结 -->
        <div v-if="stageSummary && allAgentsCompleted" class="stage-summary">
          <StageSummary
            :summary="stageSummary"
            :agent-results="getAgentResultsArray()"
            :stage-name="getCurrentStageTitle()"
            :stage-number="currentStage"
            :is-last-stage="currentStage === 3"
            :completed-at="new Date().toISOString()"
            @proceed-to-next="proceedToNextStage"
            @restart-stage="retryCurrentStage"
            @generate-final-report="proceedToNextStage"
            @update-summary="handleSummaryUpdate"
            @export-stage-results="handleExportStageResults"
            @view-detailed-results="handleViewDetailedResults"
          />
        </div>
      </div>

      <!-- 完成状态 -->
      <div v-if="sessionStatus === 'COMPLETED'" class="completed-session">
        <a-result
          status="success"
          title="头脑风暴完成！"
          sub-title="已生成完整的文创产品解决方案，包含从设计稿到成品稿和营销方案的全套内容"
        >
          <template #extra>
            <a-space>
              <a-button type="primary" @click="viewFinalReport">
                <FileTextOutlined />
                查看最终报告
              </a-button>
              <a-button @click="exportReport">
                <DownloadOutlined />
                导出报告
              </a-button>
              <a-button @click="startNewSession">
                <PlusOutlined />
                开始新会话
              </a-button>
            </a-space>
          </template>
        </a-result>
      </div>
    </div>

    <!-- 设置弹窗 -->
    <a-modal
      v-model:open="showSettings"
      title="会话设置"
      @ok="saveSettings"
    >
      <a-form layout="vertical">
        <a-form-item label="AI模型选择">
          <a-select v-model:value="selectedModel">
            <a-select-option value="gpt-4">GPT-4 (推荐)</a-select-option>
            <a-select-option value="gpt-3.5-turbo">GPT-3.5 Turbo</a-select-option>
            <a-select-option value="claude-3">Claude-3</a-select-option>
            <a-select-option value="qwen-plus">通义千问 Plus</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="代理思考时间限制（秒）">
          <a-input-number v-model:value="thinkingTimeout" :min="30" :max="300" />
        </a-form-item>
        <a-form-item label="并行处理">
          <a-switch v-model:checked="parallelProcessing" />
          <div class="setting-description">启用后所有代理将同时开始思考，否则按顺序进行</div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import {
  SettingOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  FileTextOutlined,
  DownloadOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue';
import { useAgents } from '@/composables/useAgents';
import StageSummary from '@/components/brainstorm/StageSummary.vue';

const router = useRouter();

// 响应式数据
const sessionStatus = ref<'IDLE' | 'ACTIVE' | 'COMPLETED'>('IDLE');
const sessionTopic = ref('');
const sessionStartTime = ref<Date | null>(null);
const currentStage = ref(1);
const selectedAgents = ref<number[]>([]);
const agentStatuses = ref<Record<number, 'idle' | 'thinking' | 'completed'>>({});
const agentResults = ref<Record<number, any>>({});
const stageSummary = ref<any>(null);
const showSettings = ref(false);
const selectedModel = ref('gpt-4');
const thinkingTimeout = ref(120);
const parallelProcessing = ref(true);

// 加载状态
const isStarting = ref(false);
const isStopping = ref(false);
const isRetrying = ref(false);
const isProceeding = ref(false);

// 会话配置
const sessionConfig = ref({});

// 使用代理管理
const { agents: availableAgents, fetchAgents } = useAgents();

// 计算属性
const canStartSession = computed(() => {
  return sessionTopic.value.trim().length > 0 && selectedAgents.value.length > 0;
});

const allAgentsCompleted = computed(() => {
  return selectedAgents.value.every(agentId => 
    agentStatuses.value[agentId] === 'completed'
  );
});

// 方法
const getStatusColor = (status: string) => {
  const colors = {
    'IDLE': 'default',
    'ACTIVE': 'processing',
    'COMPLETED': 'success'
  };
  return colors[status as keyof typeof colors] || 'default';
};

const getStatusText = (status: string) => {
  const texts = {
    'IDLE': '准备中',
    'ACTIVE': '进行中',
    'COMPLETED': '已完成'
  };
  return texts[status as keyof typeof texts] || status;
};

const getStepsStatus = () => {
  if (sessionStatus.value === 'COMPLETED') return 'finish';
  if (sessionStatus.value === 'ACTIVE') return 'process';
  return 'wait';
};

const getCurrentStageTitle = () => {
  const titles = {
    1: '创意生成阶段',
    2: '技术可行性分析阶段',
    3: '缺点讨论阶段'
  };
  return titles[currentStage.value as keyof typeof titles] || '未知阶段';
};

const getCurrentStageDescription = () => {
  const descriptions = {
    1: '在这个阶段，各个代理将从自己的专业角度出发，专注于创意想法和概念设计，为文创产品提供创新的设计理念。',
    2: '在这个阶段，代理们将分析技术实现的可行性，评估所需资源、技术难度和实现方案。',
    3: '在这个阶段，代理们将识别产品设计中的潜在问题，讨论可能的缺点并提出改进建议。'
  };
  return descriptions[currentStage.value as keyof typeof descriptions] || '';
};

const getStageColor = (stage: number) => {
  const colors = {
    1: '#1890ff',
    2: '#52c41a', 
    3: '#faad14'
  };
  return colors[stage as keyof typeof colors] || '#1890ff';
};

const getStageProgress = () => {
  if (selectedAgents.value.length === 0) return 0;
  const completedCount = selectedAgents.value.filter(agentId => 
    agentStatuses.value[agentId] === 'completed'
  ).length;
  return Math.round((completedCount / selectedAgents.value.length) * 100);
};

const getAgentColor = (roleType: string) => {
  const colors: Record<string, string> = {
    'UI/UX Designer': '#1890ff',
    'Software Engineer': '#52c41a',
    'Product Manager': '#722ed1',
    'Market Analyst': '#fa8c16',
    'User Researcher': '#eb2f96'
  };
  return colors[roleType] || '#1890ff';
};

const getAgentDescription = (roleType: string) => {
  const descriptions: Record<string, string> = {
    'UI/UX Designer': '专注用户体验和界面设计',
    'Software Engineer': '负责技术架构和实现方案',
    'Product Manager': '从商业角度分析需求',
    'Market Analyst': '分析市场趋势和竞争环境',
    'User Researcher': '专业的用户行为分析'
  };
  return descriptions[roleType] || '专业分析师';
};

const toggleAgent = (agentId: number) => {
  const index = selectedAgents.value.indexOf(agentId);
  if (index > -1) {
    selectedAgents.value.splice(index, 1);
  } else {
    selectedAgents.value.push(agentId);
  }
};

const getSelectedAgents = () => {
  return availableAgents.value.filter(agent => 
    selectedAgents.value.includes(agent.id)
  );
};

const getAgentStatus = (agentId: number) => {
  return agentStatuses.value[agentId] || 'idle';
};

const getAgentStatusText = (agentId: number) => {
  const status = getAgentStatus(agentId);
  const texts = {
    'idle': '等待中',
    'thinking': '思考中...',
    'completed': '已完成'
  };
  return texts[status] || status;
};

const getAgentResult = (agentId: number) => {
  return agentResults.value[agentId];
};

const formatTime = (time: Date | null) => {
  if (!time) return '';
  return time.toLocaleString('zh-CN');
};

// 核心业务方法
const startSession = async () => {
  if (!canStartSession.value) {
    message.error('请输入主题并选择至少一个代理');
    return;
  }

  isStarting.value = true;
  try {
    sessionStatus.value = 'ACTIVE';
    sessionStartTime.value = new Date();
    currentStage.value = 1;
    
    // 初始化代理状态
    selectedAgents.value.forEach(agentId => {
      agentStatuses.value[agentId] = 'idle';
      agentResults.value[agentId] = null;
    });
    
    message.success('头脑风暴会话已开始！');
    
    // 开始第一阶段
    await startCurrentStage();
    
  } catch (error: any) {
    message.error('启动会话失败: ' + (error.message || '未知错误'));
    sessionStatus.value = 'IDLE';
  } finally {
    isStarting.value = false;
  }
};

const startCurrentStage = async () => {
  stageSummary.value = null;
  
  // 重置代理状态
  selectedAgents.value.forEach(agentId => {
    agentStatuses.value[agentId] = 'thinking';
    agentResults.value[agentId] = null;
  });
  
  // 模拟代理思考过程
  for (const agentId of selectedAgents.value) {
    simulateAgentThinking(agentId);
  }
};

const simulateAgentThinking = async (agentId: number) => {
  const agent = availableAgents.value.find(a => a.id === agentId);
  if (!agent) return;
  
  // 模拟思考时间
  const thinkingTime = Math.random() * 3000 + 2000; // 2-5秒
  
  await new Promise(resolve => setTimeout(resolve, thinkingTime));
  
  // 生成模拟结果
  const result = generateMockResult(agent, currentStage.value, sessionTopic.value);
  agentResults.value[agentId] = result;
  agentStatuses.value[agentId] = 'completed';
  
  // 检查是否所有代理都完成了
  if (allAgentsCompleted.value) {
    await generateStageSummary();
  }
};

const generateMockResult = (agent: any, stage: number, topic: string) => {
  const stagePrompts = {
    1: { // 创意生成
      'UI/UX Designer': {
        mainPoint: `从设计角度看，${topic}需要注重视觉美感和用户体验的结合。`,
        analysis: `考虑到文创产品的特殊性，设计应该体现文化内涵的同时保持现代感。建议采用简洁而富有文化特色的设计语言，通过色彩、图案和材质的巧妙运用来传达文化价值。`,
        suggestions: [
          '采用传统文化元素与现代设计相结合的方式',
          '注重产品的视觉层次和信息传达',
          '考虑不同用户群体的审美偏好',
          '确保设计的可实现性和生产可行性'
        ]
      },
      'Software Engineer': {
        mainPoint: `从技术实现角度，${topic}需要考虑生产工艺和材料特性。`,
        analysis: `技术实现需要平衡创意设计与生产成本。建议采用成熟的生产工艺，同时预留创新空间。需要考虑产品的耐用性、安全性和环保要求。`,
        suggestions: [
          '选择合适的生产工艺和材料',
          '确保产品质量和安全标准',
          '优化生产流程降低成本',
          '考虑产品的可持续性和环保性'
        ]
      },
      'Product Manager': {
        mainPoint: `从产品角度，${topic}需要明确目标用户和市场定位。`,
        analysis: `产品策略应该基于市场需求和用户痛点。建议进行深入的用户研究，了解目标群体的需求和偏好，制定差异化的产品策略。`,
        suggestions: [
          '明确产品的核心价值主张',
          '定义清晰的目标用户画像',
          '制定合理的产品定价策略',
          '规划产品的功能优先级'
        ]
      }
    },
    2: { // 技术可行性分析
      'UI/UX Designer': {
        mainPoint: `设计方案在技术实现上具有较高的可行性。`,
        analysis: `经过分析，当前的设计方案可以通过现有的生产工艺实现。但需要在某些细节上进行调整以适应生产要求。建议与生产团队密切合作，确保设计意图的准确传达。`,
        suggestions: [
          '简化复杂的设计元素以降低生产难度',
          '选择适合批量生产的设计方案',
          '预留设计调整的空间',
          '建立设计与生产的沟通机制'
        ]
      },
      'Software Engineer': {
        mainPoint: `技术实现方案整体可行，但需要注意成本控制。`,
        analysis: `从技术角度分析，产品的实现需要考虑材料成本、生产设备和工艺复杂度。建议采用标准化的生产流程，同时保持一定的定制化能力。`,
        suggestions: [
          '采用标准化的生产模块',
          '优化材料使用效率',
          '建立质量控制体系',
          '考虑规模化生产的技术要求'
        ]
      },
      'Product Manager': {
        mainPoint: `产品在商业化方面具有良好的可行性。`,
        analysis: `市场分析显示该产品有明确的需求和合理的盈利空间。建议制定分阶段的产品发布计划，先推出核心功能版本，再根据市场反馈进行迭代。`,
        suggestions: [
          '制定MVP版本的功能范围',
          '建立用户反馈收集机制',
          '规划产品的迭代路线图',
          '评估市场推广的资源需求'
        ]
      }
    },
    3: { // 缺点讨论
      'UI/UX Designer': {
        mainPoint: `设计方案存在一些需要改进的地方。`,
        analysis: `当前设计可能在某些用户群体中接受度不高，需要考虑更广泛的用户需求。另外，设计的复杂度可能会影响生产效率和成本控制。`,
        suggestions: [
          '简化设计复杂度以降低生产成本',
          '增加设计的包容性和通用性',
          '考虑不同文化背景用户的接受度',
          '建立设计效果的验证机制'
        ]
      },
      'Software Engineer': {
        mainPoint: `技术实现存在一些潜在风险需要关注。`,
        analysis: `生产过程中可能遇到质量控制难题，特别是在批量生产时保持一致性。另外，某些材料的供应稳定性也需要考虑。`,
        suggestions: [
          '建立严格的质量检测标准',
          '寻找可靠的材料供应商',
          '制定生产异常的应对预案',
          '考虑技术方案的备选选项'
        ]
      },
      'Product Manager': {
        mainPoint: `产品策略需要应对一些市场挑战。`,
        analysis: `市场竞争激烈，需要建立明确的差异化优势。另外，用户教育成本可能较高，需要制定有效的市场推广策略。`,
        suggestions: [
          '强化产品的独特价值主张',
          '制定有效的用户教育策略',
          '建立品牌认知和用户忠诚度',
          '准备应对竞争对手的策略'
        ]
      }
    }
  };
  
  const roleType = agent.roleType;
  const stageData = stagePrompts[stage as keyof typeof stagePrompts];
  const agentData = stageData[roleType as keyof typeof stageData];
  
  return agentData || {
    mainPoint: `从${roleType}角度分析${topic}`,
    analysis: '正在进行深入分析...',
    suggestions: ['建议1', '建议2', '建议3']
  };
};

const generateStageSummary = async () => {
  // 模拟生成阶段总结
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const summaries = {
    1: {
      keyPoints: [
        '所有代理都认为创意设计需要平衡传统文化与现代审美',
        '技术实现的可行性得到了初步确认',
        '产品定位和目标用户群体已基本明确'
      ],
      commonSuggestions: [
        '采用传统与现代相结合的设计理念',
        '注重用户体验和实用性',
        '考虑生产成本和市场接受度'
      ],
      conflictingViews: [],
      overallAssessment: '创意生成阶段进展顺利，各代理提出了富有建设性的创意方案，为后续的技术分析奠定了良好基础。'
    },
    2: {
      keyPoints: [
        '技术实现方案整体可行，但需要注意成本控制',
        '生产工艺和材料选择需要进一步优化',
        '质量控制体系的建立至关重要'
      ],
      commonSuggestions: [
        '采用标准化生产流程降低成本',
        '建立完善的质量控制机制',
        '选择可靠的供应链合作伙伴'
      ],
      conflictingViews: [
        '在材料选择上存在成本与质量的权衡分歧'
      ],
      overallAssessment: '技术可行性分析显示项目具有良好的实现前景，但需要在成本控制和质量保证之间找到平衡点。'
    },
    3: {
      keyPoints: [
        '识别出设计复杂度可能带来的生产挑战',
        '市场竞争和用户教育是主要风险点',
        '供应链稳定性需要重点关注'
      ],
      commonSuggestions: [
        '简化设计以降低生产风险',
        '制定有效的市场推广策略',
        '建立风险应对预案'
      ],
      conflictingViews: [
        '在设计简化程度上存在不同观点'
      ],
      overallAssessment: '通过缺点讨论，识别了项目的主要风险点，为制定改进方案和风险应对策略提供了重要参考。'
    }
  };
  
  stageSummary.value = summaries[currentStage.value as keyof typeof summaries];
  message.success(`第${currentStage.value}阶段总结已生成`);
};

const retryCurrentStage = async () => {
  isRetrying.value = true;
  try {
    message.info('正在重新进行当前阶段...');
    await startCurrentStage();
  } finally {
    isRetrying.value = false;
  }
};

const proceedToNextStage = async () => {
  isProceeding.value = true;
  try {
    if (currentStage.value < 3) {
      currentStage.value++;
      message.success(`进入第${currentStage.value}阶段`);
      await startCurrentStage();
    } else {
      // 生成最终报告
      sessionStatus.value = 'COMPLETED';
      message.success('头脑风暴完成！正在生成最终报告...');
    }
  } finally {
    isProceeding.value = false;
  }
};

const stopSession = async () => {
  isStopping.value = true;
  try {
    sessionStatus.value = 'IDLE';
    currentStage.value = 1;
    stageSummary.value = null;
    message.info('会话已停止');
  } finally {
    isStopping.value = false;
  }
};

const viewFinalReport = () => {
  message.info('正在跳转到最终报告页面...');
  // TODO: 实现跳转到报告页面
};

const exportReport = () => {
  message.success('报告导出功能开发中...');
  // TODO: 实现报告导出功能
};

const startNewSession = () => {
  sessionStatus.value = 'IDLE';
  sessionTopic.value = '';
  sessionStartTime.value = null;
  currentStage.value = 1;
  selectedAgents.value = [];
  agentStatuses.value = {};
  agentResults.value = {};
  stageSummary.value = null;
  message.info('已重置，可以开始新的头脑风暴会话');
};

const saveSettings = () => {
  message.success('设置已保存');
  showSettings.value = false;
};

// 新增的处理方法
const getAgentResultsArray = () => {
  return selectedAgents.value.map(agentId => {
    const agent = availableAgents.value.find(a => a.id === agentId);
    const result = agentResults.value[agentId];
    
    if (!agent || !result) return null;
    
    return {
      agentId: agentId.toString(),
      agentName: agent.name,
      agentRole: agent.roleType,
      content: result.analysis || '',
      reasoning: result.mainPoint || '',
      suggestions: result.suggestions || [],
      confidence: 0.85, // 模拟置信度
      processingTime: Math.random() * 5000 + 2000, // 模拟处理时间
      createdAt: new Date().toISOString(),
    };
  }).filter(Boolean);
};

const handleSummaryUpdate = (updatedSummary: any) => {
  stageSummary.value = updatedSummary;
  message.success('阶段总结已更新');
};

const handleExportStageResults = (results: any[]) => {
  message.info('正在导出阶段结果...');
  // TODO: 实现导出功能
  console.log('导出结果:', results);
};

const handleViewDetailedResults = (results: any[]) => {
  message.info('查看详细结果功能开发中...');
  // TODO: 实现详细结果查看
  console.log('详细结果:', results);
};

// 生命周期
onMounted(async () => {
  try {
    await fetchAgents();
    message.success('欢迎使用AI头脑风暴平台！');
  } catch (error) {
    console.error('初始化失败:', error);
    message.error('初始化失败，请刷新页面重试');
  }
});
</script>

<style scoped lang="scss">
@import '@/styles/responsive.scss';
@import '@/styles/utilities.scss';

.brainstorm-session {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 24px;
}

.session-header {
  margin-bottom: 24px;
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    
    @include mobile-only {
      flex-direction: column;
      gap: 16px;
    }
  }
  
  .session-info {
    flex: 1;
    
    .session-title {
      margin: 0 0 8px 0;
      font-size: 1.8rem;
      font-weight: 600;
      color: #1890ff;
    }
    
    .session-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .session-time {
        color: #666;
        font-size: 0.9rem;
      }
    }
  }
  
  .progress-section {
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.session-content {
  max-width: 1200px;
  margin: 0 auto;
}

.setup-section {
  .setup-card {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .agents-selection {
    .agents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .agent-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border: 2px solid #f0f0f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      
      &:hover {
        border-color: #1890ff;
        box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
      }
      
      &.selected {
        border-color: #1890ff;
        background-color: #f6ffed;
      }
      
      .agent-info {
        flex: 1;
        
        h4 {
          margin: 0 0 4px 0;
          font-size: 1rem;
        }
        
        p {
          margin: 0 0 8px 0;
          color: #666;
          font-size: 0.9rem;
        }
        
        .agent-description {
          font-size: 0.8rem;
          color: #999;
        }
      }
      
      .selection-indicator {
        position: absolute;
        top: 8px;
        right: 8px;
        color: #1890ff;
        font-size: 1.2rem;
      }
    }
    
    .selection-summary {
      text-align: center;
      color: #666;
      font-size: 0.9rem;
    }
  }
}

.active-session {
  .stage-info-card {
    margin-bottom: 24px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    
    .stage-info {
      .stage-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        
        h2 {
          margin: 0;
          color: #1890ff;
        }
      }
      
      .stage-description {
        color: #666;
        line-height: 1.6;
        margin-bottom: 16px;
      }
    }
  }
  
  .agents-section {
    margin-bottom: 24px;
    
    h3 {
      margin-bottom: 16px;
      color: #333;
    }
    
    .agent-status-card {
      border-radius: 8px;
      transition: all 0.3s ease;
      
      &.completed {
        border-color: #52c41a;
        box-shadow: 0 2px 8px rgba(82, 196, 26, 0.2);
      }
      
      .agent-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        
        .agent-info {
          flex: 1;
          
          h4 {
            margin: 0 0 4px 0;
          }
          
          .status-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.9rem;
            color: #666;
          }
        }
      }
      
      .agent-result {
        .result-content {
          .result-section {
            margin-bottom: 16px;
            
            h5 {
              margin: 0 0 8px 0;
              color: #1890ff;
              font-size: 0.9rem;
            }
            
            p {
              margin: 0 0 8px 0;
              line-height: 1.6;
              color: #333;
            }
            
            ul {
              margin: 0;
              padding-left: 20px;
              
              li {
                margin-bottom: 4px;
                line-height: 1.5;
              }
            }
          }
        }
      }
      
      .thinking-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #666;
        font-size: 0.9rem;
        padding: 12px 0;
      }
    }
  }
  
  .stage-summary {
    .summary-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .summary-content {
      .summary-section {
        margin-bottom: 24px;
        
        h4 {
          margin: 0 0 12px 0;
          color: #1890ff;
          font-size: 1.1rem;
        }
        
        ul {
          margin: 0;
          padding-left: 20px;
          
          li {
            margin-bottom: 8px;
            line-height: 1.6;
          }
        }
        
        p {
          margin: 0;
          line-height: 1.6;
          color: #333;
        }
      }
    }
    
    .summary-actions {
      margin-top: 24px;
      text-align: center;
    }
  }
}

.completed-session {
  text-align: center;
  padding: 48px 24px;
}

.setting-description {
  font-size: 0.8rem;
  color: #999;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .brainstorm-session {
    padding: 16px;
  }
  
  .session-header .session-info .session-title {
    font-size: 1.4rem;
  }
  
  .agents-selection .agents-grid {
    grid-template-columns: 1fr;
  }
}
</style>