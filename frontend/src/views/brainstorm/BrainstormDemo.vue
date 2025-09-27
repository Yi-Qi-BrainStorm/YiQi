<template>
  <div class="brainstorm-demo">
    <div class="demo-header">
      <h1>AI头脑风暴演示</h1>
      <p>体验多个AI代理协同工作的头脑风暴过程</p>
    </div>

    <div class="demo-content">
      <!-- 步骤1: 选择主题 -->
      <a-card v-if="currentStep === 1" class="step-card">
        <template #title>
          <span class="step-title">
            <BulbOutlined />
            步骤1: 选择头脑风暴主题
          </span>
        </template>
        
        <div class="topic-selection">
          <a-radio-group v-model:value="selectedTopic" size="large">
            <a-space direction="vertical" size="large">
              <a-radio value="mobile-app">
                <div class="topic-option">
                  <h3>📱 移动应用设计</h3>
                  <p>设计一个创新的移动应用，解决用户日常生活中的问题</p>
                </div>
              </a-radio>
              <a-radio value="website-redesign">
                <div class="topic-option">
                  <h3>🌐 网站重设计</h3>
                  <p>重新设计一个现有网站，提升用户体验和转化率</p>
                </div>
              </a-radio>
              <a-radio value="product-launch">
                <div class="topic-option">
                  <h3>🚀 产品发布策略</h3>
                  <p>制定一个新产品的市场发布和推广策略</p>
                </div>
              </a-radio>
            </a-space>
          </a-radio-group>
          
          <div class="step-actions">
            <a-button 
              type="primary" 
              size="large" 
              :disabled="!selectedTopic"
              @click="nextStep"
            >
              下一步：选择AI代理
            </a-button>
          </div>
        </div>
      </a-card>

      <!-- 步骤2: 选择AI代理 -->
      <a-card v-if="currentStep === 2" class="step-card">
        <template #title>
          <span class="step-title">
            <RobotOutlined />
            步骤2: 选择参与的AI代理
          </span>
        </template>
        
        <div class="agent-selection">
          <a-row :gutter="[16, 16]">
            <a-col :xs="24" :sm="12" :lg="8" v-for="agent in availableAgents" :key="agent.id">
              <a-card 
                :class="['agent-card', { selected: selectedAgents.includes(agent.id) }]"
                hoverable
                @click="toggleAgent(agent.id)"
              >
                <div class="agent-info">
                  <a-avatar :size="48" :style="{ backgroundColor: agent.color }">
                    {{ agent.name.charAt(0) }}
                  </a-avatar>
                  <h3>{{ agent.name }}</h3>
                  <p>{{ agent.roleType }}</p>
                  <div class="agent-description">{{ agent.description }}</div>
                </div>
                <div class="selection-indicator">
                  <CheckCircleFilled v-if="selectedAgents.includes(agent.id)" />
                </div>
              </a-card>
            </a-col>
          </a-row>
          
          <div class="step-actions">
            <a-button @click="prevStep">上一步</a-button>
            <a-button 
              type="primary" 
              size="large" 
              :disabled="selectedAgents.length < 2"
              @click="startBrainstorm"
            >
              开始头脑风暴 ({{ selectedAgents.length }}/{{ availableAgents.length }})
            </a-button>
          </div>
        </div>
      </a-card>

      <!-- 步骤3: 头脑风暴进行中 -->
      <a-card v-if="currentStep === 3" class="step-card brainstorm-active">
        <template #title>
          <span class="step-title">
            <LoadingOutlined spin />
            头脑风暴进行中...
          </span>
        </template>
        
        <div class="brainstorm-progress">
          <div class="topic-display">
            <h2>{{ getTopicTitle(selectedTopic) }}</h2>
            <p>{{ getTopicDescription(selectedTopic) }}</p>
          </div>
          
          <a-progress 
            :percent="progress" 
            :status="progress === 100 ? 'success' : 'active'"
            :stroke-color="{ '0%': '#108ee9', '100%': '#87d068' }"
          />
          
          <div class="agents-thinking">
            <a-row :gutter="[16, 16]">
              <a-col :xs="24" :sm="12" :lg="8" v-for="agent in getSelectedAgentDetails()" :key="agent.id">
                <a-card class="thinking-card">
                  <div class="agent-thinking">
                    <a-avatar :size="40" :style="{ backgroundColor: agent.color }">
                      {{ agent.name.charAt(0) }}
                    </a-avatar>
                    <div class="thinking-content">
                      <h4>{{ agent.name }}</h4>
                      <div class="thinking-status">
                        <LoadingOutlined spin v-if="agent.status === 'thinking'" />
                        <CheckCircleOutlined style="color: #52c41a" v-else-if="agent.status === 'completed'" />
                        <ClockCircleOutlined v-else />
                        <span>{{ getStatusText(agent.status) }}</span>
                      </div>
                      <div v-if="agent.currentThought" class="current-thought">
                        {{ agent.currentThought }}
                      </div>
                    </div>
                  </div>
                </a-card>
              </a-col>
            </a-row>
          </div>
        </div>
      </a-card>

      <!-- 步骤4: 结果展示 -->
      <a-card v-if="currentStep === 4" class="step-card results-card">
        <template #title>
          <span class="step-title">
            <TrophyOutlined />
            头脑风暴结果
          </span>
        </template>
        
        <div class="results-content">
          <a-tabs v-model:activeKey="activeResultTab" type="card">
            <a-tab-pane key="individual" tab="个人观点">
              <div class="individual-results">
                <a-space direction="vertical" size="large" style="width: 100%">
                  <div v-for="result in brainstormResults" :key="result.agentId" class="agent-result">
                    <div class="result-header">
                      <a-avatar :size="32" :style="{ backgroundColor: result.color }">
                        {{ result.agentName.charAt(0) }}
                      </a-avatar>
                      <h3>{{ result.agentName }} - {{ result.agentRole }}</h3>
                    </div>
                    <div class="result-content">
                      <h4>核心建议</h4>
                      <p>{{ result.suggestion }}</p>
                      <h4>关键要点</h4>
                      <ul>
                        <li v-for="point in result.keyPoints" :key="point">{{ point }}</li>
                      </ul>
                    </div>
                  </div>
                </a-space>
              </div>
            </a-tab-pane>
            
            <a-tab-pane key="summary" tab="综合总结">
              <div class="summary-results">
                <a-alert
                  message="头脑风暴完成"
                  description="所有AI代理已完成分析，以下是综合建议"
                  type="success"
                  show-icon
                  style="margin-bottom: 24px"
                />
                
                <div class="summary-sections">
                  <div class="summary-section">
                    <h3>🎯 核心建议</h3>
                    <p>{{ finalSummary.coreRecommendation }}</p>
                  </div>
                  
                  <div class="summary-section">
                    <h3>✨ 关键创新点</h3>
                    <ul>
                      <li v-for="innovation in finalSummary.innovations" :key="innovation">
                        {{ innovation }}
                      </li>
                    </ul>
                  </div>
                  
                  <div class="summary-section">
                    <h3>⚠️ 需要注意的风险</h3>
                    <ul>
                      <li v-for="risk in finalSummary.risks" :key="risk">
                        {{ risk }}
                      </li>
                    </ul>
                  </div>
                  
                  <div class="summary-section">
                    <h3>📋 下一步行动</h3>
                    <ol>
                      <li v-for="action in finalSummary.nextSteps" :key="action">
                        {{ action }}
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </a-tab-pane>
          </a-tabs>
          
          <div class="result-actions">
            <a-space>
              <a-button @click="restartDemo">重新开始</a-button>
              <a-button type="primary" @click="exportResults">
                <DownloadOutlined />
                导出结果
              </a-button>
            </a-space>
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import {
  BulbOutlined,
  RobotOutlined,
  LoadingOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  DownloadOutlined,
} from '@ant-design/icons-vue';

// 响应式数据
const currentStep = ref(1);
const selectedTopic = ref('');
const selectedAgents = ref<number[]>([]);
const progress = ref(0);
const activeResultTab = ref('individual');

// 可用的AI代理
const availableAgents = ref([
  {
    id: 1,
    name: '创意设计师',
    roleType: 'UI/UX Designer',
    description: '专注用户体验和界面设计，提供创新的设计理念',
    color: '#1890ff',
    status: 'idle',
    currentThought: ''
  },
  {
    id: 2,
    name: '技术架构师',
    roleType: 'Software Engineer',
    description: '负责技术架构和实现方案，确保技术可行性',
    color: '#52c41a',
    status: 'idle',
    currentThought: ''
  },
  {
    id: 3,
    name: '产品经理',
    roleType: 'Product Manager',
    description: '从商业角度分析需求，制定产品策略',
    color: '#722ed1',
    status: 'idle',
    currentThought: ''
  },
  {
    id: 4,
    name: '市场分析师',
    roleType: 'Market Analyst',
    description: '分析市场趋势和竞争环境，提供市场洞察',
    color: '#fa8c16',
    status: 'idle',
    currentThought: ''
  }
]);

// 头脑风暴结果
const brainstormResults = ref<any[]>([]);
const finalSummary = ref<any>({});

// 方法
const nextStep = () => {
  currentStep.value++;
};

const prevStep = () => {
  currentStep.value--;
};

const toggleAgent = (agentId: number) => {
  const index = selectedAgents.value.indexOf(agentId);
  if (index > -1) {
    selectedAgents.value.splice(index, 1);
  } else {
    selectedAgents.value.push(agentId);
  }
};

const getTopicTitle = (topic: string) => {
  const titles = {
    'mobile-app': '📱 移动应用设计',
    'website-redesign': '🌐 网站重设计',
    'product-launch': '🚀 产品发布策略'
  };
  return titles[topic as keyof typeof titles] || '头脑风暴主题';
};

const getTopicDescription = (topic: string) => {
  const descriptions = {
    'mobile-app': '设计一个创新的移动应用，解决用户日常生活中的问题',
    'website-redesign': '重新设计一个现有网站，提升用户体验和转化率',
    'product-launch': '制定一个新产品的市场发布和推广策略'
  };
  return descriptions[topic as keyof typeof descriptions] || '正在进行头脑风暴...';
};

const getSelectedAgentDetails = () => {
  return availableAgents.value.filter(agent => selectedAgents.value.includes(agent.id));
};

const getStatusText = (status: string) => {
  const statusTexts = {
    'idle': '准备中',
    'thinking': '思考中...',
    'completed': '已完成'
  };
  return statusTexts[status as keyof typeof statusTexts] || status;
};

const startBrainstorm = async () => {
  currentStep.value = 3;
  progress.value = 0;
  
  // 模拟头脑风暴过程
  const selectedAgentDetails = getSelectedAgentDetails();
  
  // 阶段1: 初始化
  message.info('正在初始化AI代理...');
  await simulateProgress(0, 20, 1000);
  
  // 阶段2: 各代理开始思考
  for (let i = 0; i < selectedAgentDetails.length; i++) {
    const agent = selectedAgentDetails[i];
    agent.status = 'thinking';
    agent.currentThought = '正在分析问题...';
    
    message.info(`${agent.name} 开始分析`);
    await simulateProgress(20 + i * 15, 20 + (i + 1) * 15, 2000);
    
    agent.currentThought = '生成创意方案...';
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    agent.status = 'completed';
    agent.currentThought = '分析完成';
  }
  
  // 阶段3: 综合分析
  message.info('正在综合所有建议...');
  await simulateProgress(80, 100, 1500);
  
  // 生成结果
  generateResults();
  
  message.success('头脑风暴完成！');
  currentStep.value = 4;
};

const simulateProgress = (start: number, end: number, duration: number) => {
  return new Promise(resolve => {
    const steps = 20;
    const stepSize = (end - start) / steps;
    const stepDuration = duration / steps;
    
    let currentProgress = start;
    const interval = setInterval(() => {
      currentProgress += stepSize;
      progress.value = Math.min(currentProgress, end);
      
      if (currentProgress >= end) {
        clearInterval(interval);
        resolve(void 0);
      }
    }, stepDuration);
  });
};

const generateResults = () => {
  const topicData = getTopicSpecificData(selectedTopic.value);
  const selectedAgentDetails = getSelectedAgentDetails();
  
  brainstormResults.value = selectedAgentDetails.map((agent, index) => ({
    agentId: agent.id,
    agentName: agent.name,
    agentRole: agent.roleType,
    color: agent.color,
    suggestion: topicData.suggestions[agent.roleType] || '基于专业角度的建议...',
    keyPoints: topicData.keyPoints[agent.roleType] || ['关键要点1', '关键要点2', '关键要点3']
  }));
  
  finalSummary.value = topicData.summary;
};

const getTopicSpecificData = (topic: string) => {
  const data = {
    'mobile-app': {
      suggestions: {
        'UI/UX Designer': '建议采用简洁现代的设计风格，重点关注用户体验流程的优化。使用渐进式设计理念，确保界面直观易用。',
        'Software Engineer': '推荐使用React Native或Flutter进行跨平台开发，采用微服务架构确保系统的可扩展性和维护性。',
        'Product Manager': '建议先进行MVP验证，通过用户反馈迭代产品功能。制定清晰的产品路线图和KPI指标。',
        'Market Analyst': '目标市场分析显示移动应用市场竞争激烈，建议找准细分市场，制定差异化竞争策略。'
      },
      keyPoints: {
        'UI/UX Designer': ['响应式设计适配', '无障碍设计考虑', '品牌一致性保持'],
        'Software Engineer': ['性能优化策略', '数据安全保护', '离线功能支持'],
        'Product Manager': ['用户需求验证', '功能优先级排序', '商业模式设计'],
        'Market Analyst': ['竞品分析报告', '目标用户画像', '市场推广策略']
      },
      summary: {
        coreRecommendation: '开发一个以用户体验为核心的移动应用，采用敏捷开发方法，通过MVP快速验证市场需求，然后迭代优化产品功能。',
        innovations: [
          '创新的用户交互设计',
          '智能化的个性推荐系统',
          '社交化的用户体验',
          '跨平台的无缝体验'
        ],
        risks: [
          '市场竞争激烈，需要明确差异化优势',
          '用户获取成本可能较高',
          '技术实现复杂度需要合理评估'
        ],
        nextSteps: [
          '进行详细的用户调研和需求分析',
          '制作高保真原型并进行用户测试',
          '确定技术架构和开发计划',
          '制定市场推广和用户获取策略'
        ]
      }
    },
    'website-redesign': {
      suggestions: {
        'UI/UX Designer': '建议采用现代化的设计语言，优化信息架构，提升页面加载速度和用户转化率。',
        'Software Engineer': '推荐使用现代前端框架重构，优化SEO和性能，实现响应式设计。',
        'Product Manager': '建议基于数据分析重新设计用户流程，设置A/B测试验证改进效果。',
        'Market Analyst': '分析竞争对手网站设计趋势，建议结合品牌定位制定设计策略。'
      },
      keyPoints: {
        'UI/UX Designer': ['视觉层次优化', '交互体验提升', '移动端适配'],
        'Software Engineer': ['性能优化', 'SEO优化', '安全性加强'],
        'Product Manager': ['转化率优化', '用户行为分析', '功能需求梳理'],
        'Market Analyst': ['品牌形象提升', '竞争优势分析', '用户群体定位']
      },
      summary: {
        coreRecommendation: '以用户体验和业务目标为导向，进行全面的网站重设计，提升品牌形象和用户转化率。',
        innovations: [
          '个性化的用户体验',
          '智能化的内容推荐',
          '优化的转化漏斗',
          '现代化的视觉设计'
        ],
        risks: [
          '重设计可能影响现有用户习惯',
          '技术迁移风险需要评估',
          'SEO排名可能受到短期影响'
        ],
        nextSteps: [
          '进行现有网站的数据分析和用户调研',
          '制作设计原型并进行用户测试',
          '制定详细的开发和迁移计划',
          '准备上线后的监控和优化方案'
        ]
      }
    },
    'product-launch': {
      suggestions: {
        'UI/UX Designer': '建议设计统一的品牌视觉系统，创建吸引人的产品展示页面和营销素材。',
        'Software Engineer': '确保产品技术稳定性，准备好监控和扩容方案，应对发布后的流量增长。',
        'Product Manager': '制定详细的发布计划，设置关键指标监控，准备用户反馈收集机制。',
        'Market Analyst': '建议采用多渠道营销策略，重点关注目标用户群体的媒体偏好和消费习惯。'
      },
      keyPoints: {
        'UI/UX Designer': ['品牌视觉统一', '营销素材设计', '用户引导设计'],
        'Software Engineer': ['系统稳定性', '性能监控', '扩容准备'],
        'Product Manager': ['发布时间规划', 'KPI指标设置', '风险应对预案'],
        'Market Analyst': ['目标市场分析', '营销渠道选择', '竞争策略制定']
      },
      summary: {
        coreRecommendation: '采用分阶段发布策略，结合多渠道营销推广，确保产品成功进入市场并获得用户认可。',
        innovations: [
          '创新的产品定位策略',
          '多元化的营销推广方式',
          '数据驱动的决策机制',
          '用户社区建设计划'
        ],
        risks: [
          '市场接受度存在不确定性',
          '竞争对手可能快速跟进',
          '营销预算需要合理控制'
        ],
        nextSteps: [
          '完善产品功能和用户体验',
          '制定详细的营销推广计划',
          '建立用户反馈和数据分析体系',
          '准备产品发布后的运营支持'
        ]
      }
    }
  };
  
  return data[topic as keyof typeof data] || data['mobile-app'];
};

const exportResults = () => {
  message.success('结果导出功能开发中...');
};

const restartDemo = () => {
  currentStep.value = 1;
  selectedTopic.value = '';
  selectedAgents.value = [];
  progress.value = 0;
  brainstormResults.value = [];
  finalSummary.value = {};
  
  // 重置代理状态
  availableAgents.value.forEach(agent => {
    agent.status = 'idle';
    agent.currentThought = '';
  });
  
  message.info('演示已重置');
};

onMounted(() => {
  message.info('欢迎体验AI头脑风暴演示！');
});
</script>

<style scoped lang="scss">
.brainstorm-demo {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 24px;
}

.demo-header {
  text-align: center;
  margin-bottom: 32px;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 8px;
  }
  
  p {
    font-size: 1.2rem;
    color: #666;
    margin: 0;
  }
}

.demo-content {
  max-width: 1200px;
  margin: 0 auto;
}

.step-card {
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  
  .step-title {
    font-size: 1.3rem;
    font-weight: 600;
    
    .anticon {
      margin-right: 8px;
      color: #1890ff;
    }
  }
}

.topic-selection {
  .topic-option {
    margin-left: 8px;
    
    h3 {
      margin: 0 0 4px 0;
      font-size: 1.1rem;
    }
    
    p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }
  }
}

.agent-selection {
  .agent-card {
    position: relative;
    border-radius: 12px;
    transition: all 0.3s ease;
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    &.selected {
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
    
    .agent-info {
      text-align: center;
      
      h3 {
        margin: 12px 0 4px 0;
        font-size: 1.1rem;
      }
      
      p {
        margin: 0 0 8px 0;
        color: #666;
        font-size: 0.9rem;
      }
      
      .agent-description {
        font-size: 0.8rem;
        color: #999;
        line-height: 1.4;
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
}

.brainstorm-active {
  .topic-display {
    text-align: center;
    margin-bottom: 24px;
    
    h2 {
      margin: 0 0 8px 0;
      color: #1890ff;
    }
    
    p {
      margin: 0;
      color: #666;
    }
  }
  
  .agents-thinking {
    margin-top: 24px;
    
    .thinking-card {
      border-radius: 8px;
      
      .agent-thinking {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        
        .thinking-content {
          flex: 1;
          
          h4 {
            margin: 0 0 8px 0;
            font-size: 1rem;
          }
          
          .thinking-status {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 8px;
            font-size: 0.9rem;
            color: #666;
          }
          
          .current-thought {
            font-size: 0.8rem;
            color: #999;
            font-style: italic;
          }
        }
      }
    }
  }
}

.results-card {
  .individual-results {
    .agent-result {
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      padding: 16px;
      
      .result-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        
        h3 {
          margin: 0;
          font-size: 1.1rem;
        }
      }
      
      .result-content {
        h4 {
          margin: 16px 0 8px 0;
          font-size: 1rem;
          color: #1890ff;
        }
        
        p {
          margin: 0 0 16px 0;
          line-height: 1.6;
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
  
  .summary-results {
    .summary-sections {
      .summary-section {
        margin-bottom: 24px;
        
        h3 {
          margin: 0 0 12px 0;
          font-size: 1.1rem;
          color: #1890ff;
        }
        
        p {
          margin: 0 0 12px 0;
          line-height: 1.6;
        }
        
        ul, ol {
          margin: 0;
          padding-left: 20px;
          
          li {
            margin-bottom: 6px;
            line-height: 1.5;
          }
        }
      }
    }
  }
}

.step-actions {
  margin-top: 32px;
  text-align: center;
  
  .ant-btn {
    margin: 0 8px;
  }
}

.result-actions {
  margin-top: 32px;
  text-align: center;
}

@media (max-width: 768px) {
  .brainstorm-demo {
    padding: 16px;
  }
  
  .demo-header h1 {
    font-size: 2rem;
  }
  
  .step-card {
    margin: 0 -8px;
  }
}
</style>