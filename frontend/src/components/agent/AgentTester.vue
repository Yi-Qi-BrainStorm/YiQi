<template>
  <div class="agent-tester">
    <!-- 代理信息 -->
    <div class="agent-tester__header">
      <div class="agent-info">
        <a-avatar
          :size="40"
          :style="{ backgroundColor: getAvatarColor(agent.roleType) }"
        >
          {{ agent.name.charAt(0).toUpperCase() }}
        </a-avatar>
        
        <div class="agent-meta">
          <h3 class="agent-name">{{ agent.name }}</h3>
          <p class="agent-role">{{ agent.roleType }}</p>
        </div>
      </div>
      
      <a-tag :color="getModelColor(agent.aiModel)">
        {{ getModelDisplayName(agent.aiModel) }}
      </a-tag>
    </div>

    <!-- 测试区域 -->
    <div class="agent-tester__content">
      <!-- 输入区域 -->
      <div class="test-input">
        <h4>测试输入</h4>
        <a-textarea
          v-model:value="testInput"
          placeholder="输入测试问题或场景..."
          :rows="4"
          :maxlength="1000"
          show-count
        />
        
        <!-- 快速测试模板 -->
        <div class="test-templates">
          <span class="template-label">快速测试:</span>
          <a-button-group size="small">
            <a-button
              v-for="template in testTemplates"
              :key="template.key"
              @click="useTemplate(template.content)"
            >
              {{ template.name }}
            </a-button>
          </a-button-group>
        </div>
        
        <div class="test-actions">
          <a-button
            type="primary"
            :loading="testing"
            :disabled="!testInput.trim()"
            @click="handleTest"
          >
            <ExperimentOutlined />
            开始测试
          </a-button>
          
          <a-button
            v-if="testHistory.length > 0"
            @click="clearHistory"
          >
            清空历史
          </a-button>
        </div>
      </div>

      <!-- 测试结果 -->
      <div class="test-results">
        <h4>测试结果</h4>
        
        <div v-if="testHistory.length === 0" class="no-results">
          <a-empty description="还没有测试结果" />
        </div>
        
        <div v-else class="results-list">
          <div
            v-for="(result, index) in testHistory"
            :key="index"
            class="result-item"
            :class="{
              'result-item--success': result.success,
              'result-item--error': !result.success
            }"
          >
            <!-- 结果头部 -->
            <div class="result-header">
              <div class="result-meta">
                <span class="result-time">{{ formatTime(result.timestamp) }}</span>
                <span class="result-duration">{{ result.processingTime }}ms</span>
                <a-tag
                  :color="result.success ? 'success' : 'error'"
                  size="small"
                >
                  {{ result.success ? '成功' : '失败' }}
                </a-tag>
              </div>
              
              <div class="result-actions">
                <a-button
                  size="small"
                  @click="copyResult(result)"
                  :icon="h(CopyOutlined)"
                  title="复制结果"
                />
                <a-button
                  size="small"
                  @click="removeResult(index)"
                  :icon="h(DeleteOutlined)"
                  title="删除"
                />
              </div>
            </div>
            
            <!-- 输入内容 -->
            <div class="result-input">
              <div class="section-title">输入:</div>
              <div class="content">{{ result.input }}</div>
            </div>
            
            <!-- 输出内容 -->
            <div class="result-output">
              <div class="section-title">输出:</div>
              <div v-if="result.success" class="content success">
                {{ result.response }}
              </div>
              <div v-else class="content error">
                <ExclamationCircleOutlined />
                {{ result.error }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="agent-tester__footer">
      <a-button @click="handleClose">
        关闭
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import { message } from 'ant-design-vue';
import {
  ExperimentOutlined,
  CopyOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons-vue';
import { agentService } from '@/services/agentService';
import type { Agent, AIModelType } from '@/types/agent';

interface Props {
  agent: Agent;
}

interface Emits {
  (e: 'close'): void;
}

interface TestResult {
  input: string;
  success: boolean;
  response?: string;
  error?: string;
  processingTime: number;
  timestamp: Date;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 状态
const testing = ref(false);
const testInput = ref('');
const testHistory = ref<TestResult[]>([]);

// 测试模板
const testTemplates = [
  {
    key: 'creative',
    name: '创意生成',
    content: '请为智能手环设计一个创新的功能特性，要求既实用又有文化内涵。',
  },
  {
    key: 'analysis',
    name: '市场分析',
    content: '分析当前文创产品市场的主要趋势和消费者需求。',
  },
  {
    key: 'problem',
    name: '问题解决',
    content: '如何解决传统文化产品在年轻人群体中接受度不高的问题？',
  },
  {
    key: 'technical',
    name: '技术可行性',
    content: '评估使用3D打印技术制作个性化文创产品的技术可行性和成本。',
  },
];

// 事件处理
const handleTest = async () => {
  if (!testInput.value.trim()) return;
  
  testing.value = true;
  const startTime = Date.now();
  
  try {
    const result = await agentService.testAgent(props.agent.id, testInput.value);
    const processingTime = Date.now() - startTime;
    
    const testResult: TestResult = {
      input: testInput.value,
      success: result.success,
      response: result.response,
      error: result.error,
      processingTime: result.processingTime || processingTime,
      timestamp: new Date(),
    };
    
    testHistory.value.unshift(testResult);
    
    if (result.success) {
      message.success('测试完成');
    } else {
      message.error('测试失败');
    }
    
    // 清空输入
    testInput.value = '';
  } catch (error: any) {
    const testResult: TestResult = {
      input: testInput.value,
      success: false,
      error: error.message || '测试请求失败',
      processingTime: Date.now() - startTime,
      timestamp: new Date(),
    };
    
    testHistory.value.unshift(testResult);
    message.error('测试失败');
  } finally {
    testing.value = false;
  }
};

const handleClose = () => {
  emit('close');
};

const useTemplate = (content: string) => {
  testInput.value = content;
};

const copyResult = async (result: TestResult) => {
  try {
    const text = `输入: ${result.input}\n\n输出: ${result.success ? result.response : result.error}`;
    await navigator.clipboard.writeText(text);
    message.success('结果已复制到剪贴板');
  } catch (error) {
    message.error('复制失败');
  }
};

const removeResult = (index: number) => {
  testHistory.value.splice(index, 1);
  message.success('结果已删除');
};

const clearHistory = () => {
  testHistory.value = [];
  message.success('历史记录已清空');
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

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN');
};
</script>

<style scoped lang="scss">
.agent-tester {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 24px;
  }

  &__content {
    margin-bottom: 24px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }
}

.agent-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.agent-meta {
  .agent-name {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 600;
    color: #262626;
  }

  .agent-role {
    margin: 0;
    font-size: 13px;
    color: #8c8c8c;
  }
}

.test-input {
  margin-bottom: 32px;

  h4 {
    margin: 0 0 12px;
    font-size: 16px;
    color: #262626;
  }

  .test-templates {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 12px 0;
    padding: 12px;
    background: #fafafa;
    border-radius: 6px;

    .template-label {
      font-size: 13px;
      color: #595959;
      white-space: nowrap;
    }
  }

  .test-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
}

.test-results {
  h4 {
    margin: 0 0 16px;
    font-size: 16px;
    color: #262626;
  }

  .no-results {
    padding: 48px 0;
    text-align: center;
  }

  .results-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .result-item {
    border: 1px solid #f0f0f0;
    border-radius: 6px;
    margin-bottom: 12px;
    overflow: hidden;

    &:last-child {
      margin-bottom: 0;
    }

    &--success {
      border-left: 3px solid #52c41a;
    }

    &--error {
      border-left: 3px solid #ff4d4f;
    }
  }

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
  }

  .result-meta {
    display: flex;
    align-items: center;
    gap: 12px;

    .result-time {
      font-size: 13px;
      color: #8c8c8c;
    }

    .result-duration {
      font-size: 12px;
      color: #595959;
    }
  }

  .result-actions {
    display: flex;
    gap: 4px;
  }

  .result-input,
  .result-output {
    padding: 12px 16px;

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #595959;
      margin-bottom: 8px;
    }

    .content {
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;

      &.success {
        color: #262626;
      }

      &.error {
        color: #ff4d4f;
        display: flex;
        align-items: flex-start;
        gap: 6px;
      }
    }
  }

  .result-output {
    border-top: 1px solid #f0f0f0;
    background: #fafafa;
  }
}

@media (max-width: 768px) {
  .agent-tester__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .test-templates {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .result-meta {
    flex-wrap: wrap;
  }
}
</style>