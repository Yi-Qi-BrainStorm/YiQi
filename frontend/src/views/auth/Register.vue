<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <h1 class="register-title">AI头脑风暴平台</h1>
        <p class="register-subtitle">创建您的账户</p>
      </div>
      
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
        class="register-form"
        @finish="handleSubmit"
        @finish-failed="handleSubmitFailed"
      >
        <a-form-item
          name="username"
          label="用户名"
        >
          <a-input
            v-model:value="formData.username"
            size="large"
            placeholder="请输入用户名 (3-20个字符，以字母开头)"
            :disabled="loading"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
          <div v-if="formData.username" class="username-hints">
            <div class="hint" :class="{ active: formData.username.length >= 3 && formData.username.length <= 20 }">
              ✓ 长度3-20个字符
            </div>
            <div class="hint" :class="{ active: /^[a-zA-Z]/.test(formData.username) }">
              ✓ 以字母开头
            </div>
            <div class="hint" :class="{ active: /^[a-zA-Z0-9_]+$/.test(formData.username) }">
              ✓ 只包含字母、数字和下划线
            </div>
          </div>
        </a-form-item>

        <a-form-item
          name="email"
          label="邮箱"
        >
          <a-input
            v-model:value="formData.email"
            size="large"
            placeholder="请输入邮箱地址"
            :disabled="loading"
          >
            <template #prefix>
              <MailOutlined />
            </template>
          </a-input>
          <div v-if="formData.email" class="email-hints">
            <div class="hint" :class="{ active: isValidEmail(formData.email) }">
              ✓ 邮箱格式正确
            </div>
          </div>
        </a-form-item>
        

        
        <a-form-item
          name="password"
          label="密码"
        >
          <a-input-password
            v-model:value="formData.password"
            size="large"
            placeholder="请输入密码"
            :disabled="loading"
            @input="handlePasswordChange"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
          
          <!-- 密码强度指示器 -->
          <div v-if="formData.password" class="password-strength">
            <div class="strength-bar">
              <div 
                class="strength-fill"
                :class="passwordStrength.level"
                :style="{ width: passwordStrength.percentage + '%' }"
              ></div>
            </div>
            <div class="strength-info">
              <span class="strength-text" :class="passwordStrength.level">
                密码强度: {{ passwordStrength.text }}
              </span>
              <div class="strength-tips">
                <div class="tip" :class="{ active: formData.password.length >= 6 }">
                  ✓ 至少6个字符
                </div>
                <div class="tip" :class="{ active: /[a-zA-Z]/.test(formData.password) }">
                  ✓ 包含字母
                </div>
                <div class="tip" :class="{ active: /\d/.test(formData.password) }">
                  ✓ 包含数字
                </div>
              </div>
            </div>
          </div>
        </a-form-item>
        
        <a-form-item
          name="confirmPassword"
          label="确认密码"
        >
          <a-input-password
            v-model:value="formData.confirmPassword"
            size="large"
            placeholder="请再次输入密码"
            :disabled="loading"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>
        
        <!-- 错误信息显示 -->
        <a-alert
          v-if="error"
          :message="error"
          type="error"
          show-icon
          closable
          class="register-error"
          @close="clearError"
        />
        
        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            size="large"
            :loading="loading"
            :disabled="!isFormValid"
            block
            class="register-button"
          >
            {{ loading ? '注册中...' : '注册' }}
          </a-button>
        </a-form-item>
        
        <div class="register-footer">
          <span>已有账户？</span>
          <router-link to="/login" class="login-link">
            立即登录
          </router-link>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons-vue';
import { useAuth } from '@/composables/useAuth';
import type { RegisterData } from '@/types/user';
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

// 扩展注册数据类型以包含确认密码
interface ExtendedRegisterData extends RegisterData {
  confirmPassword: string;
}

// 密码强度类型
interface PasswordStrength {
  level: 'weak' | 'medium' | 'strong';
  percentage: number;
  text: string;
}

// 路由
const router = useRouter();

// 认证相关
const { register, loading, error, clearError, isAuthenticated, requireGuest } = useAuth();

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<ExtendedRegisterData>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
});

// 密码强度计算
const passwordStrength = computed<PasswordStrength>(() => {
  const password = formData.password;
  if (!password) {
    return { level: 'weak', percentage: 0, text: '' };
  }
  
  let score = 0;
  const criteria = [];
  
  // 长度检查 (30分)
  if (password.length >= 6) {
    score += 20;
    criteria.push('长度符合');
  }
  if (password.length >= 8) {
    score += 10;
    criteria.push('长度较好');
  }
  
  // 包含小写字母 (20分)
  if (/[a-z]/.test(password)) {
    score += 20;
    criteria.push('包含小写字母');
  }
  
  // 包含大写字母 (20分)
  if (/[A-Z]/.test(password)) {
    score += 20;
    criteria.push('包含大写字母');
  }
  
  // 包含数字 (20分)
  if (/\d/.test(password)) {
    score += 20;
    criteria.push('包含数字');
  }
  
  // 包含特殊字符 (10分)
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 10;
    criteria.push('包含特殊字符');
  }
  
  // 计算强度等级
  if (score < 40) {
    return { level: 'weak', percentage: Math.min(score * 2.5, 100), text: '弱' };
  } else if (score < 70) {
    return { level: 'medium', percentage: Math.min(score * 1.4, 100), text: '中等' };
  } else {
    return { level: 'strong', percentage: Math.min(score * 1.2, 100), text: '强' };
  }
});

// 密码强度验证函数
const validatePasswordStrength = (password: string): boolean => {
  // 至少6个字符，包含字母和数字
  const minLength = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return minLength && hasLetter && hasNumber;
};

// 邮箱验证函数
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 表单验证规则
const rules: Record<string, Rule[]> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' },
    {
      validator: (rule: any, value: string) => {
        if (!value) {
          return Promise.reject('请输入用户名');
        }
        if (value.length < 3) {
          return Promise.reject('用户名长度不能少于3个字符');
        }
        if (!/^[a-zA-Z]/.test(value)) {
          return Promise.reject('用户名必须以字母开头');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          return Promise.reject('用户名只能包含字母、数字和下划线');
        }
        return Promise.resolve();
      },
      trigger: 'blur'
    },
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
    {
      validator: (rule: any, value: string) => {
        if (!value) {
          return Promise.reject('请输入邮箱地址');
        }
        if (!isValidEmail(value)) {
          return Promise.reject('请输入有效的邮箱地址');
        }
        return Promise.resolve();
      },
      trigger: 'blur'
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' },
    {
      validator: (rule: any, value: string) => {
        if (!value) {
          return Promise.reject('请输入密码');
        }
        if (value.length < 6) {
          return Promise.reject('密码长度不能少于6个字符');
        }
        if (!validatePasswordStrength(value)) {
          return Promise.reject('密码必须包含字母和数字');
        }
        return Promise.resolve();
      },
      trigger: 'blur'
    },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string) => {
        if (!value) {
          return Promise.reject('请确认密码');
        }
        if (value !== formData.password) {
          return Promise.reject('两次输入的密码不一致');
        }
        return Promise.resolve();
      },
      trigger: 'blur'
    },
  ],
};

// 表单验证状态
const isFormValid = computed(() => {
  return formData.username.length >= 3 && 
         isValidEmail(formData.email) &&
         formData.password.length >= 6 && 
         formData.confirmPassword === formData.password &&
         validatePasswordStrength(formData.password) &&
         !loading.value;
});

// 处理密码输入变化
const handlePasswordChange = () => {
  // 如果确认密码已输入，重新验证确认密码字段
  if (formData.confirmPassword) {
    formRef.value?.validateFields(['confirmPassword']);
  }
};

// 处理表单提交
const handleSubmit = async (values: ExtendedRegisterData) => {
  try {
    // 只传递后端需要的字段
    const registerData: RegisterData = {
      username: values.username,
      email: values.email,
      password: values.password,
    };
    
    await register(registerData);
    message.success('注册成功！请检查您的邮箱以确认账户。');
    // 路由跳转在useAuth中处理
  } catch (err: any) {
    console.error('注册失败:', err);
    // 错误信息已在store中设置，会通过error computed显示
  }
};

// 处理表单提交失败
const handleSubmitFailed = (errorInfo: any) => {
  console.warn('表单验证失败:', errorInfo);
  const firstError = errorInfo.errorFields?.[0];
  if (firstError) {
    message.error(`${firstError.errors[0]}`);
  }
};

// 组件挂载时检查是否已登录
onMounted(async () => {
  // 如果已登录，重定向到主工作台
  await requireGuest();
});
</script>

<style lang="scss" scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-container {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
  
  .register-title {
    font-size: 28px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 8px 0;
  }
  
  .register-subtitle {
    font-size: 16px;
    color: #666;
    margin: 0;
  }
}

.register-form {
  .ant-form-item {
    margin-bottom: 20px;
  }
  
  .ant-form-item-label > label {
    font-weight: 500;
    color: #333;
  }
  
  .ant-input-affix-wrapper,
  .ant-input {
    border-radius: 8px;
    
    &:hover,
    &:focus,
    &.ant-input-affix-wrapper-focused {
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }
  }
}

// 密码强度指示器
.password-strength {
  margin-top: 8px;
  
  .strength-bar {
    height: 4px;
    background-color: #f0f0f0;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 8px;
    
    .strength-fill {
      height: 100%;
      transition: all 0.3s ease;
      border-radius: 2px;
      
      &.weak {
        background-color: #ff4d4f;
      }
      
      &.medium {
        background-color: #faad14;
      }
      
      &.strong {
        background-color: #52c41a;
      }
    }
  }
  
  .strength-info {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    
    .strength-text {
      font-size: 12px;
      font-weight: 500;
      
      &.weak {
        color: #ff4d4f;
      }
      
      &.medium {
        color: #faad14;
      }
      
      &.strong {
        color: #52c41a;
      }
    }
    
    .strength-tips {
      display: flex;
      flex-direction: column;
      gap: 2px;
      
      .tip {
        font-size: 11px;
        color: #999;
        transition: color 0.3s ease;
        
        &.active {
          color: #52c41a;
          font-weight: 500;
        }
      }
    }
  }
}

.register-error {
  margin-bottom: 20px;
  border-radius: 8px;
}

.register-button {
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    background: #f5f5f5;
    color: #bbb;
  }
}

.register-footer {
  text-align: center;
  margin-top: 24px;
  color: #666;
  
  .login-link {
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
    margin-left: 4px;
    
    &:hover {
      color: #5a6fd8;
      text-decoration: underline;
    }
  }
}

// 用户名提示
.username-hints,
.email-hints {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  .hint {
    font-size: 11px;
    color: #999;
    transition: color 0.3s ease;
    
    &.active {
      color: #52c41a;
      font-weight: 500;
    }
  }
}

// 响应式设计
@media (max-width: 480px) {
  .register-page {
    padding: 16px;
  }
  
  .register-container {
    padding: 24px;
  }
  
  .register-header {
    margin-bottom: 24px;
    
    .register-title {
      font-size: 24px;
    }
    
    .register-subtitle {
      font-size: 14px;
    }
  }
}
</style>