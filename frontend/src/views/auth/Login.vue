<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1 class="login-title">AI头脑风暴平台</h1>
        <p class="login-subtitle">登录您的账户</p>
      </div>
      
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
        class="login-form"
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
            placeholder="请输入用户名"
            :disabled="loading"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </a-input>
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
          class="login-error"
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
            class="login-button"
          >
            {{ loading ? '登录中...' : '登录' }}
          </a-button>
        </a-form-item>
        
        <div class="login-footer">
          <span>还没有账户？</span>
          <router-link to="/register" class="register-link">
            立即注册
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
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import { useAuth } from '@/composables/useAuth';
import type { LoginCredentials } from '@/types/user';
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

// 路由
const router = useRouter();

// 认证相关
const { login, loading, error, clearError, isAuthenticated, requireGuest } = useAuth();

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<LoginCredentials>({
  username: '',
  password: '',
});

// 表单验证规则
const rules: Record<string, Rule[]> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' },
  ],
};

// 表单验证状态
const isFormValid = computed(() => {
  return formData.username.length >= 3 && 
         formData.password.length >= 6 && 
         !loading.value;
});

// 处理表单提交
const handleSubmit = async (values: LoginCredentials) => {
  try {
    await login(values);
    message.success('登录成功！');
    
    // 获取重定向路径
    const redirectPath = (router.currentRoute.value.query.redirect as string) || '/dashboard';
    
    // 登录成功后跳转
    await router.push(redirectPath);
  } catch (err: any) {
    console.error('登录失败:', err);
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
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
  
  .login-title {
    font-size: 28px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 8px 0;
  }
  
  .login-subtitle {
    font-size: 16px;
    color: #666;
    margin: 0;
  }
}

.login-form {
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

.login-error {
  margin-bottom: 20px;
  border-radius: 8px;
}

.login-button {
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

.login-footer {
  text-align: center;
  margin-top: 24px;
  color: #666;
  
  .register-link {
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

// 响应式设计
@media (max-width: 480px) {
  .login-page {
    padding: 16px;
  }
  
  .login-container {
    padding: 24px;
  }
  
  .login-header {
    margin-bottom: 24px;
    
    .login-title {
      font-size: 24px;
    }
    
    .login-subtitle {
      font-size: 14px;
    }
  }
}
</style>