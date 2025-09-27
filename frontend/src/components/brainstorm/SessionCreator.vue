<template>
  <div class="session-creator">
    <a-card title="创建头脑风暴会话" :bordered="false">
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
        @finish="handleSubmit"
      >
        <!-- 会话标题 -->
        <a-form-item label="会话标题" name="title">
          <a-input
            v-model:value="formData.title"
            placeholder="请输入会话标题"
            :maxlength="100"
            show-count
          />
        </a-form-item>

        <!-- 会话描述 -->
        <a-form-item label="会话描述" name="description">
          <a-textarea
            v-model:value="formData.description"
            placeholder="请输入会话描述（可选）"
            :rows="3"
            :maxlength="500"
            show-count
          />
        </a-form-item>

        <!-- 头脑风暴主题 -->
        <a-form-item label="头脑风暴主题" name="topic">
          <a-textarea
            v-model:value="formData.topic"
            placeholder="请详细描述你想要进行头脑风暴的主题或问题"
            :rows="4"
            :maxlength="1000"
            show-count
          />
          <div class="topic-tips">
            <a-typography-text type="secondary">
              <InfoCircleOutlined />
              主题描述越详细，AI代理能提供越精准的建议
            </a-typography-text>
          </div>
        </a-form-item>

        <!-- 代理选择 -->
        <a-form-item label="选择参与代理" name="agentIds">
          <div class="agent-selection">
            <div class="agent-selection-header">
              <a-typography-text>
                已选择 {{ selectedAgents.length }} / {{ SESSION_CONFIG.MAX_AGENTS_PER_SESSION }} 个代理
              </a-typography-text>
              <a-button 
                type="link" 
                size="small" 
                @click="selectAllAgents"
                :disabled="availableAgents.length === 0"
              >
                全选
              </a-button>
              <a-button 
                type="link" 
                size="small" 
                @click="clearAgentSelection"
                :disabled="selectedAgents.length === 0"
              >
                清空
              </a-button>
            </div>
            
            <div class="agent-grid" v-if="availableAgents.length > 0">
              <div
                v-for="agent in availableAgents"
                :key="agent.id"
                class="agent-card"
                :class="{ 'selected': isAgentSelected(agent.id) }"
                @click="toggleAgentSelection(agent.id)"
              >
                <div class="agent-card-content">
                  <div class="agent-info">
                    <div class="agent-name">{{ agent.name }}</div>
                    <div class="agent-role">{{ agent.roleType }}</div>
                    <div class="agent-model">{{ agent.aiModel }}</div>
                  </div>
                  <div class="agent-actions">
                    <a-checkbox 
                      :checked="isAgentSelected(agent.id)"
                      @click.stop
                      @change="(e) => handleAgentCheck(agent.id, e.target.checked)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <a-empty 
              v-else
              description="暂无可用代理"
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
            >
              <a-button type="primary" @click="$router.push('/agents')">
                去创建代理
              </a-button>
            </a-empty>
          </div>
        </a-form-item>

        <!-- 会话配置 -->
        <a-form-item label="会话配置">
          <a-card size="small" title="高级设置" :bordered="false">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="会话超时时间（分钟）" name="timeout">
                  <a-input-number
                    v-model:value="formData.timeout"
                    :min="30"
                    :max="180"
                    :step="15"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="自动保存间隔（秒）" name="autoSaveInterval">
                  <a-input-number
                    v-model:value="formData.autoSaveInterval"
                    :min="10"
                    :max="300"
                    :step="10"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-card>
        </a-form-item>

        <!-- 操作按钮 -->
        <a-form-item>
          <a-space>
            <a-button 
              type="primary" 
              html-type="submit"
              :loading="loading"
              :disabled="!canCreateSession"
            >
              创建会话
            </a-button>
            <a-button @click="handleReset">
              重置
            </a-button>
            <a-button @click="handleCancel">
              取消
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { message, Empty } from 'ant-design-vue';
import { InfoCircleOutlined } from '@ant-design/icons-vue';
import type { FormInstance, Rule } from 'ant-design-vue/es/form';
import type { Agent } from '@/types/agent';
import type { CreateSessionRequest } from '@/types/brainstorm';
import { useAgents } from '@/composables/useAgents';
import { useBrainstorm } from '@/composables/useBrainstorm';
import { SESSION_CONFIG } from '@/constants/brainstorm';

interface Props {
  visible?: boolean;
}

interface Emits {
  (e: 'submit', sessionData: CreateSessionRequest): void;
  (e: 'cancel'): void;
  (e: 'session-created', sessionId: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
});

const emit = defineEmits<Emits>();

const router = useRouter();
const { agents: availableAgents, fetchAgents } = useAgents();
const { createSession } = useBrainstorm();

// 表单引用和数据
const formRef = ref<FormInstance>();
const loading = ref(false);

const formData = reactive({
  title: '',
  description: '',
  topic: '',
  agentIds: [] as number[],
  timeout: 60, // 默认60分钟
  autoSaveInterval: 30, // 默认30秒
});

// 表单验证规则
const formRules: Record<string, Rule[]> = {
  title: [
    { required: true, message: '请输入会话标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度应在2-100个字符之间', trigger: 'blur' },
  ],
  topic: [
    { required: true, message: '请输入头脑风暴主题', trigger: 'blur' },
    { min: SESSION_CONFIG.MIN_TOPIC_LENGTH, message: `主题描述至少需要${SESSION_CONFIG.MIN_TOPIC_LENGTH}个字符`, trigger: 'blur' },
    { max: SESSION_CONFIG.MAX_TOPIC_LENGTH, message: `主题描述不能超过${SESSION_CONFIG.MAX_TOPIC_LENGTH}个字符`, trigger: 'blur' },
  ],
  agentIds: [
    { 
      required: true, 
      type: 'array',
      min: SESSION_CONFIG.MIN_AGENTS_PER_SESSION,
      message: `至少需要选择${SESSION_CONFIG.MIN_AGENTS_PER_SESSION}个代理`,
      trigger: 'change' 
    },
    { 
      type: 'array',
      max: SESSION_CONFIG.MAX_AGENTS_PER_SESSION,
      message: `最多只能选择${SESSION_CONFIG.MAX_AGENTS_PER_SESSION}个代理`,
      trigger: 'change' 
    },
  ],
};

// 计算属性
const selectedAgents = computed(() => 
  availableAgents.value.filter(agent => formData.agentIds.includes(agent.id))
);

const canCreateSession = computed(() => {
  return formData.title.trim() && 
         formData.topic.trim() && 
         formData.agentIds.length >= SESSION_CONFIG.MIN_AGENTS_PER_SESSION &&
         formData.agentIds.length <= SESSION_CONFIG.MAX_AGENTS_PER_SESSION;
});

// 代理选择相关方法
const isAgentSelected = (agentId: number): boolean => {
  return formData.agentIds.includes(agentId);
};

const toggleAgentSelection = (agentId: number) => {
  if (isAgentSelected(agentId)) {
    formData.agentIds = formData.agentIds.filter(id => id !== agentId);
  } else {
    if (formData.agentIds.length < SESSION_CONFIG.MAX_AGENTS_PER_SESSION) {
      formData.agentIds.push(agentId);
    } else {
      message.warning(`最多只能选择${SESSION_CONFIG.MAX_AGENTS_PER_SESSION}个代理`);
    }
  }
};

const handleAgentCheck = (agentId: number, checked: boolean) => {
  if (checked) {
    if (formData.agentIds.length < SESSION_CONFIG.MAX_AGENTS_PER_SESSION) {
      if (!formData.agentIds.includes(agentId)) {
        formData.agentIds.push(agentId);
      }
    } else {
      message.warning(`最多只能选择${SESSION_CONFIG.MAX_AGENTS_PER_SESSION}个代理`);
    }
  } else {
    formData.agentIds = formData.agentIds.filter(id => id !== agentId);
  }
};

const selectAllAgents = () => {
  const maxSelectable = Math.min(availableAgents.value.length, SESSION_CONFIG.MAX_AGENTS_PER_SESSION);
  formData.agentIds = availableAgents.value.slice(0, maxSelectable).map(agent => agent.id);
};

const clearAgentSelection = () => {
  formData.agentIds = [];
};

// 表单操作方法
const handleSubmit = async () => {
  try {
    loading.value = true;
    
    const sessionData: CreateSessionRequest = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      topic: formData.topic.trim(),
      agentIds: formData.agentIds,
    };

    // 创建会话
    const session = await createSession(sessionData);
    
    message.success('头脑风暴会话创建成功！');
    emit('session-created', session.id);
    emit('submit', sessionData);
    
    // 跳转到会话页面
    router.push(`/brainstorm/session/${session.id}`);
    
  } catch (error: any) {
    console.error('创建会话失败:', error);
    message.error(error.message || '创建会话失败，请重试');
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  formRef.value?.resetFields();
  formData.agentIds = [];
};

const handleCancel = () => {
  emit('cancel');
  router.back();
};

// 生命周期
onMounted(async () => {
  try {
    await fetchAgents();
  } catch (error) {
    console.error('获取代理列表失败:', error);
    message.error('获取代理列表失败');
  }
});
</script>

<style scoped lang="scss">
.session-creator {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--spacing-6);
  
  @include mobile-only {
    padding: var(--spacing-4);
  }

  // Card styling
  :deep(.ant-card) {
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--color-border);
    background-color: var(--color-surface);
    
    .ant-card-head {
      border-bottom: 1px solid var(--color-border);
      background-color: var(--color-background-secondary);
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
      
      .ant-card-head-title {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }
    }
    
    .ant-card-body {
      padding: var(--spacing-8);
      
      @include mobile-only {
        padding: var(--spacing-6);
      }
    }
  }

  // Form styling
  :deep(.ant-form) {
    .ant-form-item-label > label {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }
    
    .ant-input,
    .ant-input-number,
    .ant-select-selector {
      border-radius: var(--radius-lg);
      border-color: var(--color-border);
      background-color: var(--color-surface);
      color: var(--color-text-primary);
      transition: all var(--transition-fast);
      
      &:hover {
        border-color: var(--color-primary-500);
      }
      
      &:focus,
      &.ant-input-focused,
      &.ant-select-focused .ant-select-selector {
        border-color: var(--color-primary-500);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
    }
    
    .ant-input-number {
      width: 100%;
    }
  }

  .topic-tips {
    margin-top: var(--spacing-2);
    padding: var(--spacing-3) var(--spacing-4);
    background-color: var(--color-primary-50);
    border-radius: var(--radius-lg);
    border-left: 4px solid var(--color-primary-500);
    
    [data-theme="dark"] & {
      background-color: var(--color-primary-900);
      border-left-color: var(--color-primary-400);
    }
    
    .anticon {
      margin-right: var(--spacing-2);
      color: var(--color-primary-600);
      font-size: var(--font-size-base);
    }
    
    :deep(.ant-typography) {
      color: var(--color-primary-700);
      font-size: var(--font-size-sm);
      margin: 0;
      
      [data-theme="dark"] & {
        color: var(--color-primary-300);
      }
    }
  }

  .agent-selection {
    .agent-selection-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-4);
      padding: var(--spacing-4) var(--spacing-5);
      background-color: var(--color-background-secondary);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      
      :deep(.ant-typography) {
        color: var(--color-text-primary);
        font-weight: var(--font-weight-medium);
        margin: 0;
      }
      
      :deep(.ant-btn-link) {
        color: var(--color-primary-600);
        font-weight: var(--font-weight-medium);
        
        &:hover {
          color: var(--color-primary-700);
        }
        
        &:disabled {
          color: var(--color-text-tertiary);
        }
      }
    }

    .agent-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--spacing-4);
      max-height: 500px;
      overflow-y: auto;
      padding: var(--spacing-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background-color: var(--color-background-secondary);
      
      @include mobile-only {
        grid-template-columns: 1fr;
        max-height: 400px;
        gap: var(--spacing-3);
        padding: var(--spacing-3);
      }

      // Custom scrollbar
      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: var(--color-background-tertiary);
        border-radius: var(--radius-full);
      }

      &::-webkit-scrollbar-thumb {
        background: var(--color-border);
        border-radius: var(--radius-full);

        &:hover {
          background: var(--color-text-tertiary);
        }
      }

      .agent-card {
        padding: var(--spacing-5);
        background-color: var(--color-surface);
        border: 2px solid var(--color-border);
        border-radius: var(--radius-xl);
        cursor: pointer;
        transition: all var(--transition-base);
        position: relative;
        overflow: hidden;
        
        // Hover effects
        &:hover {
          border-color: var(--color-primary-500);
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px) scale(1.02);
        }

        // Selected state
        &.selected {
          border-color: var(--color-primary-500);
          background-color: var(--color-primary-50);
          box-shadow: var(--shadow-md);
          
          [data-theme="dark"] & {
            background-color: var(--color-primary-900);
            border-color: var(--color-primary-400);
          }
          
          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--color-primary-500), var(--color-primary-600));
          }
        }

        .agent-card-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--spacing-3);

          .agent-info {
            flex: 1;
            min-width: 0;

            .agent-name {
              font-size: var(--font-size-lg);
              font-weight: var(--font-weight-semibold);
              color: var(--color-text-primary);
              margin-bottom: var(--spacing-1);
              @include truncate;
            }

            .agent-role {
              font-size: var(--font-size-sm);
              color: var(--color-text-secondary);
              margin-bottom: var(--spacing-2);
              font-weight: var(--font-weight-medium);
              @include truncate;
            }

            .agent-model {
              font-size: var(--font-size-xs);
              color: var(--color-text-tertiary);
              padding: var(--spacing-1) var(--spacing-3);
              background-color: var(--color-background-tertiary);
              border-radius: var(--radius-full);
              display: inline-block;
              font-weight: var(--font-weight-medium);
              border: 1px solid var(--color-border);
            }
          }

          .agent-actions {
            flex-shrink: 0;
            
            :deep(.ant-checkbox) {
              .ant-checkbox-inner {
                border-radius: var(--radius-base);
                border-color: var(--color-border);
                
                &:hover {
                  border-color: var(--color-primary-500);
                }
              }
              
              &.ant-checkbox-checked .ant-checkbox-inner {
                background-color: var(--color-primary-600);
                border-color: var(--color-primary-600);
              }
            }
          }
        }
      }
    }
  }

  // Advanced settings card
  :deep(.ant-card-small) {
    .ant-card-head {
      background-color: var(--color-background-tertiary);
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      
      .ant-card-head-title {
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-medium);
      }
    }
    
    .ant-card-body {
      padding: var(--spacing-5);
    }
  }

  // Action buttons
  :deep(.ant-btn) {
    border-radius: var(--radius-lg);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-fast);
    
    &.ant-btn-primary {
      background-color: var(--color-primary-600);
      border-color: var(--color-primary-600);
      
      &:hover {
        background-color: var(--color-primary-700);
        border-color: var(--color-primary-700);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }
      
      &:disabled {
        background-color: var(--color-gray-300);
        border-color: var(--color-gray-300);
        transform: none;
        box-shadow: none;
      }
    }
    
    &:not(.ant-btn-primary) {
      border-color: var(--color-border);
      color: var(--color-text-primary);
      
      &:hover {
        border-color: var(--color-primary-500);
        color: var(--color-primary-600);
        transform: translateY(-1px);
      }
    }
  }

  // Empty state
  :deep(.ant-empty) {
    padding: var(--spacing-8);
    
    .ant-empty-description {
      color: var(--color-text-secondary);
    }
  }
}

// Loading animation
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.loading-shimmer {
  background: linear-gradient(90deg, var(--color-background-secondary) 25%, var(--color-background-tertiary) 50%, var(--color-background-secondary) 75%);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}

// Responsive enhancements
@include tablet-up {
  .session-creator {
    .agent-selection .agent-grid {
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    }
  }
}

@include desktop-up {
  .session-creator {
    padding: var(--spacing-8);
    
    .agent-selection .agent-grid {
      max-height: 600px;
    }
  }
}
</style>