<template>
  <div class="agent-form">
    <a-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      layout="vertical"
      @finish="handleSubmit"
      @finish-failed="handleSubmitFailed"
    >
      <!-- 基本信息 -->
      <div class="agent-form__section">
        <h3 class="agent-form__section-title">基本信息</h3>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item
              label="代理名称"
              name="name"
              :help="'为你的AI代理起一个有意义的名称'"
            >
              <a-input
                v-model:value="formData.name"
                placeholder="例如：UI设计师、市场分析师"
                :maxlength="50"
                show-count
              />
            </a-form-item>
          </a-col>
          
          <a-col :span="12">
            <a-form-item
              label="角色类型"
              name="roleType"
              :help="'定义代理的专业领域和职责'"
            >
              <a-select
                v-model:value="formData.roleType"
                placeholder="选择或输入角色类型"
                :options="roleTypeOptions"
                show-search
                :filter-option="filterRoleOption"
                :dropdown-match-select-width="false"
                @search="handleRoleTypeSearch"
              >
                <template #dropdownRender="{ menuNode: menu }">
                  <div>
                    <div v-if="customRoleType" style="padding: 8px;">
                      <a-button
                        type="text"
                        size="small"
                        style="width: 100%"
                        @click="addCustomRoleType"
                      >
                        <PlusOutlined />
                        添加 "{{ customRoleType }}"
                      </a-button>
                    </div>
                    <component :is="menu" />
                  </div>
                </template>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </div>

      <!-- AI模型配置 -->
      <div class="agent-form__section">
        <h3 class="agent-form__section-title">AI模型配置</h3>
        
        <a-form-item
          label="AI模型"
          name="aiModel"
          :help="'选择适合的AI模型，不同模型有不同的能力和成本'"
        >
          <a-radio-group
            v-model:value="formData.aiModel"
            class="model-selector"
          >
            <div class="model-options">
              <a-radio
                v-for="model in availableModels"
                :key="model.id"
                :value="model.id"
                class="model-option"
              >
                <div class="model-card">
                  <div class="model-header">
                    <span class="model-name">{{ model.name }}</span>
                    <a-tag :color="getModelColor(model.id)">
                      {{ model.provider }}
                    </a-tag>
                  </div>
                  <div class="model-description">
                    {{ model.description }}
                  </div>
                  <div class="model-specs">
                    <span class="spec-item">
                      <TokenOutlined />
                      最大 {{ formatNumber(model.maxTokens) }} tokens
                    </span>
                    <span class="spec-item">
                      <DollarOutlined />
                      ¥{{ model.costPerToken.toFixed(6) }}/token
                    </span>
                  </div>
                </div>
              </a-radio>
            </div>
          </a-radio-group>
        </a-form-item>
      </div>

      <!-- 系统提示词 -->
      <div class="agent-form__section">
        <h3 class="agent-form__section-title">
          系统提示词
          <a-tooltip title="系统提示词定义了AI代理的行为、专业知识和回答风格">
            <QuestionCircleOutlined class="help-icon" />
          </a-tooltip>
        </h3>
        
        <a-form-item
          name="systemPrompt"
          :help="'详细描述代理的角色、专业背景、工作方式和输出要求'"
        >
          <div class="prompt-editor">
            <!-- 快速模板 -->
            <div class="prompt-templates">
              <span class="template-label">快速模板：</span>
              <a-button-group size="small">
                <a-button
                  v-for="template in promptTemplates"
                  :key="template.key"
                  @click="applyTemplate(template)"
                >
                  {{ template.name }}
                </a-button>
              </a-button-group>
            </div>
            
            <!-- 文本编辑器 -->
            <a-textarea
              v-model:value="formData.systemPrompt"
              placeholder="请输入系统提示词..."
              :rows="12"
              :maxlength="2000"
              show-count
              class="prompt-textarea"
            />
            
            <!-- 提示词助手 -->
            <div class="prompt-helper">
              <a-collapse size="small" ghost>
                <a-collapse-panel key="tips" header="💡 编写提示词的技巧">
                  <ul class="tips-list">
                    <li>明确定义角色身份和专业背景</li>
                    <li>描述具体的工作流程和思考方式</li>
                    <li>指定输出格式和结构要求</li>
                    <li>包含相关的专业知识和经验</li>
                    <li>设置适当的语言风格和语调</li>
                  </ul>
                </a-collapse-panel>
                <a-collapse-panel key="examples" header="📝 示例提示词">
                  <div class="example-prompts">
                    <div
                      v-for="example in examplePrompts"
                      :key="example.role"
                      class="example-item"
                    >
                      <div class="example-header">
                        <strong>{{ example.role }}</strong>
                        <a-button
                          type="link"
                          size="small"
                          @click="useExample(example.prompt)"
                        >
                          使用此模板
                        </a-button>
                      </div>
                      <div class="example-content">
                        {{ example.prompt.substring(0, 200) }}...
                      </div>
                    </div>
                  </div>
                </a-collapse-panel>
              </a-collapse>
            </div>
          </div>
        </a-form-item>
      </div>

      <!-- 测试区域 -->
      <div class="agent-form__section">
        <h3 class="agent-form__section-title">测试配置</h3>
        
        <div class="test-area">
          <a-input
            v-model:value="testPrompt"
            placeholder="输入测试问题来验证代理配置..."
            :disabled="!canTest"
          />
          <a-button
            type="primary"
            :loading="testing"
            :disabled="!canTest"
            @click="handleTest"
          >
            <ExperimentOutlined />
            测试
          </a-button>
        </div>
        
        <div v-if="testResult" class="test-result">
          <div class="test-result__header">
            <span class="test-result__title">测试结果</span>
            <span class="test-result__time">
              响应时间: {{ testResult.processingTime }}ms
            </span>
          </div>
          <div
            class="test-result__content"
            :class="{
              'test-result__content--success': testResult.success,
              'test-result__content--error': !testResult.success
            }"
          >
            <div v-if="testResult.success" class="test-response">
              {{ testResult.response }}
            </div>
            <div v-else class="test-error">
              <ExclamationCircleOutlined />
              {{ testResult.error }}
            </div>
          </div>
        </div>
      </div>

      <!-- 表单操作 -->
      <div class="agent-form__actions">
        <a-space>
          <a-button @click="handleCancel">
            取消
          </a-button>
          <a-button
            type="primary"
            html-type="submit"
            :loading="submitting"
          >
            {{ isEditing ? '更新代理' : '创建代理' }}
          </a-button>
        </a-space>
      </div>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import {
  PlusOutlined,
  QuestionCircleOutlined,
  ExperimentOutlined,
  ExclamationCircleOutlined,
  TokenOutlined,
  DollarOutlined,
} from '@ant-design/icons-vue';
import type { FormInstance } from 'ant-design-vue';
import type { Agent, AgentFormData, AIModel, AIModelType } from '@/types/agent';
import { agentService } from '@/services/agentService';

interface Props {
  agent?: Agent;
  availableModels?: AIModel[];
}

interface Emits {
  (e: 'submit', agentData: AgentFormData): void;
  (e: 'cancel'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 表单引用和状态
const formRef = ref<FormInstance>();
const submitting = ref(false);
const testing = ref(false);

// 表单数据
const formData = ref<AgentFormData>({
  name: '',
  roleType: '',
  systemPrompt: '',
  aiModel: 'qwen-plus',
});

// 测试相关
const testPrompt = ref('');
const testResult = ref<{
  success: boolean;
  response?: string;
  error?: string;
  processingTime: number;
} | null>(null);

// 角色类型相关
const customRoleType = ref('');
const roleTypeOptions = ref([
  { label: 'UI/UX设计师', value: 'UI/UX设计师' },
  { label: '产品经理', value: '产品经理' },
  { label: '市场分析师', value: '市场分析师' },
  { label: '文化研究员', value: '文化研究员' },
  { label: '工程师', value: '工程师' },
  { label: '营销专家', value: '营销专家' },
  { label: '品牌策划师', value: '品牌策划师' },
  { label: '用户研究员', value: '用户研究员' },
  { label: '数据分析师', value: '数据分析师' },
  { label: '创意总监', value: '创意总监' },
]);

// 默认可用模型
const defaultModels: AIModel[] = [
  {
    id: 'qwen-plus',
    name: 'Qwen Plus',
    description: '平衡性能和成本的通用模型，适合大多数场景',
    maxTokens: 8192,
    costPerToken: 0.0001,
    provider: 'Alibaba',
  },
  {
    id: 'qwen-turbo',
    name: 'Qwen Turbo',
    description: '快速响应模型，适合实时交互场景',
    maxTokens: 4096,
    costPerToken: 0.00005,
    provider: 'Alibaba',
  },
  {
    id: 'qwen-max',
    name: 'Qwen Max',
    description: '最强性能模型，适合复杂推理任务',
    maxTokens: 16384,
    costPerToken: 0.0002,
    provider: 'Alibaba',
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: '强大的多模态模型，擅长复杂推理和创作',
    maxTokens: 8192,
    costPerToken: 0.0003,
    provider: 'OpenAI',
  },
];

// 计算属性
const isEditing = computed(() => !!props.agent);
const availableModels = computed(() => props.availableModels || defaultModels);
const canTest = computed(() => 
  formData.value.name && 
  formData.value.roleType && 
  formData.value.systemPrompt && 
  formData.value.aiModel &&
  testPrompt.value.trim()
);

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入代理名称', trigger: 'blur' },
    { min: 2, max: 50, message: '代理名称长度应在2-50个字符之间', trigger: 'blur' },
  ],
  roleType: [
    { required: true, message: '请选择或输入角色类型', trigger: 'change' },
  ],
  systemPrompt: [
    { required: true, message: '请输入系统提示词', trigger: 'blur' },
    { min: 50, message: '系统提示词至少需要50个字符', trigger: 'blur' },
    { max: 2000, message: '系统提示词不能超过2000个字符', trigger: 'blur' },
  ],
  aiModel: [
    { required: true, message: '请选择AI模型', trigger: 'change' },
  ],
};

// 提示词模板
const promptTemplates = [
  {
    key: 'designer',
    name: '设计师',
    template: `你是一位经验丰富的UI/UX设计师，专注于文创产品设计。

你的专业背景：
- 拥有5年以上的产品设计经验
- 熟悉用户体验设计原则和方法
- 对文化创意产品有深入理解
- 擅长将传统文化元素与现代设计相结合

工作方式：
1. 深入分析用户需求和使用场景
2. 考虑文化背景和象征意义
3. 提供具体的设计建议和视觉方案
4. 关注产品的实用性和美观性

输出要求：
- 提供详细的设计理念和思路
- 描述具体的视觉元素和色彩搭配
- 考虑用户体验和交互方式
- 给出可行的实现建议`,
  },
  {
    key: 'marketer',
    name: '营销专家',
    template: `你是一位资深的营销专家，专门负责文创产品的市场推广。

你的专业背景：
- 拥有丰富的品牌营销经验
- 深入了解文创产品市场
- 熟悉各种营销渠道和策略
- 擅长制定针对性的营销方案

工作方式：
1. 分析目标用户群体和市场定位
2. 制定多渠道营销策略
3. 设计有吸引力的营销活动
4. 评估营销效果和ROI

输出要求：
- 提供详细的市场分析
- 制定具体的营销策略和计划
- 建议合适的营销渠道和预算分配
- 设计可执行的营销活动方案`,
  },
];

// 示例提示词
const examplePrompts = [
  {
    role: '产品经理',
    prompt: `你是一位经验丰富的产品经理，专注于文创产品的规划和管理。你需要从产品角度分析需求，制定产品策略，协调各方资源，确保产品成功上市。在分析时要考虑市场需求、技术可行性、商业价值和用户体验等多个维度。`,
  },
  {
    role: '文化研究员',
    prompt: `你是一位专业的文化研究员，对中华传统文化有深入的研究和理解。你的任务是为文创产品提供文化背景支撑，确保产品设计符合文化内涵，避免文化误用。你需要从历史、艺术、民俗等角度提供专业见解。`,
  },
];

// 方法
const handleSubmit = async (values: AgentFormData) => {
  submitting.value = true;
  try {
    emit('submit', values);
  } finally {
    submitting.value = false;
  }
};

const handleSubmitFailed = (errorInfo: any) => {
  console.error('表单验证失败:', errorInfo);
  message.error('请检查表单填写是否正确');
};

const handleCancel = () => {
  emit('cancel');
};

const handleTest = async () => {
  if (!canTest.value) return;
  
  testing.value = true;
  testResult.value = null;
  
  try {
    // 如果是编辑模式且有代理ID，使用现有代理测试
    if (isEditing.value && props.agent) {
      const result = await agentService.testAgent(props.agent.id, testPrompt.value);
      testResult.value = result;
    } else {
      // 新建模式，模拟测试（实际应该调用临时测试接口）
      await new Promise(resolve => setTimeout(resolve, 2000));
      testResult.value = {
        success: true,
        response: '这是一个模拟的测试响应。在实际实现中，这里会显示AI代理根据当前配置生成的真实回答。',
        processingTime: 1500,
      };
    }
  } catch (error: any) {
    testResult.value = {
      success: false,
      error: error.message || '测试失败',
      processingTime: 0,
    };
  } finally {
    testing.value = false;
  }
};

const filterRoleOption = (input: string, option: any) => {
  return option.label.toLowerCase().includes(input.toLowerCase());
};

const handleRoleTypeSearch = (value: string) => {
  customRoleType.value = value;
};

const addCustomRoleType = () => {
  if (customRoleType.value && !roleTypeOptions.value.find(opt => opt.value === customRoleType.value)) {
    roleTypeOptions.value.push({
      label: customRoleType.value,
      value: customRoleType.value,
    });
    formData.value.roleType = customRoleType.value;
    customRoleType.value = '';
  }
};

const applyTemplate = (template: any) => {
  formData.value.systemPrompt = template.template;
  message.success(`已应用${template.name}模板`);
};

const useExample = (prompt: string) => {
  formData.value.systemPrompt = prompt;
  message.success('已使用示例提示词');
};

const getModelColor = (modelId: AIModelType) => {
  const colorMap: Record<AIModelType, string> = {
    'qwen-plus': 'blue',
    'qwen-turbo': 'cyan',
    'qwen-max': 'purple',
    'gpt-4': 'green',
    'gpt-3.5-turbo': 'orange',
    'claude-3': 'red',
    'gemini-pro': 'magenta',
  };
  return colorMap[modelId] || 'default';
};

const formatNumber = (num: number) => {
  return num.toLocaleString();
};

// 初始化
onMounted(() => {
  if (props.agent) {
    formData.value = {
      name: props.agent.name,
      roleType: props.agent.roleType,
      systemPrompt: props.agent.systemPrompt,
      aiModel: props.agent.aiModel,
    };
  }
});

// 监听代理变化
watch(() => props.agent, (newAgent) => {
  if (newAgent) {
    formData.value = {
      name: newAgent.name,
      roleType: newAgent.roleType,
      systemPrompt: newAgent.systemPrompt,
      aiModel: newAgent.aiModel,
    };
  } else {
    // 重置表单
    formData.value = {
      name: '',
      roleType: '',
      systemPrompt: '',
      aiModel: 'qwen-plus',
    };
  }
  testResult.value = null;
}, { immediate: true });
</script>

<style scoped lang="scss">
.agent-form {
  max-width: 800px;
  margin: 0 auto;

  &__section {
    margin-bottom: 32px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }

  &__section-title {
    margin: 0 0 16px;
    font-size: 16px;
    font-weight: 600;
    color: #262626;
    display: flex;
    align-items: center;
    gap: 8px;
    
    .help-icon {
      color: #8c8c8c;
      cursor: help;
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    padding-top: 24px;
    border-top: 1px solid #f0f0f0;
  }
}

.model-selector {
  width: 100%;
  
  .model-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
  }
  
  .model-option {
    display: block;
    width: 100%;
    
    :deep(.ant-radio) {
      display: none;
    }
    
    &:deep(.ant-radio-wrapper) {
      width: 100%;
      padding: 0;
    }
    
    &:deep(.ant-radio-wrapper-checked) .model-card {
      border-color: #1890ff;
      background: #f6ffed;
    }
  }
  
  .model-card {
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      border-color: #40a9ff;
    }
  }
  
  .model-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .model-name {
    font-weight: 600;
    font-size: 14px;
  }
  
  .model-description {
    color: #595959;
    font-size: 13px;
    margin-bottom: 12px;
    line-height: 1.4;
  }
  
  .model-specs {
    display: flex;
    gap: 16px;
  }
  
  .spec-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #8c8c8c;
  }
}

.prompt-editor {
  .prompt-templates {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding: 12px;
    background: #fafafa;
    border-radius: 6px;
    
    .template-label {
      font-size: 13px;
      color: #595959;
      white-space: nowrap;
    }
  }
  
  .prompt-textarea {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.6;
  }
  
  .prompt-helper {
    margin-top: 12px;
    
    .tips-list {
      margin: 0;
      padding-left: 20px;
      
      li {
        margin-bottom: 4px;
        font-size: 13px;
        color: #595959;
      }
    }
    
    .example-prompts {
      .example-item {
        margin-bottom: 16px;
        padding: 12px;
        background: #f9f9f9;
        border-radius: 4px;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
      
      .example-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .example-content {
        font-size: 13px;
        color: #595959;
        line-height: 1.4;
      }
    }
  }
}

.test-area {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  
  :deep(.ant-input) {
    flex: 1;
  }
}

.test-result {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
  }
  
  &__title {
    font-weight: 600;
    font-size: 14px;
  }
  
  &__time {
    font-size: 12px;
    color: #8c8c8c;
  }
  
  &__content {
    padding: 16px;
    
    &--success {
      background: #f6ffed;
      border-left: 3px solid #52c41a;
    }
    
    &--error {
      background: #fff2f0;
      border-left: 3px solid #ff4d4f;
    }
  }
  
  .test-response {
    font-size: 14px;
    line-height: 1.6;
    color: #262626;
  }
  
  .test-error {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #ff4d4f;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .agent-form {
    padding: 0 16px;
  }
  
  .model-options {
    grid-template-columns: 1fr;
  }
  
  .prompt-templates {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .test-area {
    flex-direction: column;
  }
}
</style>