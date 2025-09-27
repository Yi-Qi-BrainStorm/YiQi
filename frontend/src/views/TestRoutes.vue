<template>
  <div class="test-routes">
    <a-card title="路由测试页面">
      <div class="route-info">
        <a-descriptions :column="1" bordered>
          <a-descriptions-item label="当前路由">
            {{ $route.path }}
          </a-descriptions-item>
          <a-descriptions-item label="路由名称">
            {{ $route.name }}
          </a-descriptions-item>
          <a-descriptions-item label="认证状态">
            <a-tag :color="isAuthenticated ? 'green' : 'red'">
              {{ isAuthenticated ? '已登录' : '未登录' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="Token">
            {{ hasToken ? '存在' : '不存在' }}
          </a-descriptions-item>
          <a-descriptions-item label="用户信息">
            {{ user ? user.username : '无' }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
      
      <div class="navigation-buttons" style="margin-top: 24px;">
        <a-space wrap>
          <a-button @click="goToLogin">登录页面</a-button>
          <a-button @click="goToRegister">注册页面</a-button>
          <a-button @click="goToDashboard">Dashboard</a-button>
          <a-button @click="goToAgents">代理管理</a-button>
          <a-button @click="goToBrainstorm">头脑风暴</a-button>
          <a-button @click="clearToken" danger>清除Token</a-button>
          <a-button @click="setMockToken" type="primary">设置Mock Token</a-button>
        </a-space>
      </div>
      
      <div class="debug-info" style="margin-top: 24px;">
        <a-alert
          message="调试信息"
          :description="debugInfo"
          type="info"
          show-icon
        />
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { message } from 'ant-design-vue';

const router = useRouter();
const authStore = useAuthStore();

const hasToken = computed(() => !!localStorage.getItem('auth_token'));
const isAuthenticated = computed(() => authStore.isAuthenticated);
const user = computed(() => authStore.user);

const debugInfo = computed(() => {
  return `
路由: ${router.currentRoute.value.path}
Token: ${hasToken.value ? '存在' : '不存在'}
认证状态: ${isAuthenticated.value ? '已登录' : '未登录'}
用户: ${user.value ? user.value.username : '无'}
Store状态: ${JSON.stringify({
  token: !!authStore.token,
  user: !!authStore.user,
  isLoading: authStore.isLoading
})}
  `.trim();
});

const goToLogin = () => {
  router.push('/login');
};

const goToRegister = () => {
  router.push('/register');
};

const goToDashboard = () => {
  router.push('/dashboard');
};

const goToAgents = () => {
  router.push('/agents');
};

const goToBrainstorm = () => {
  router.push('/brainstorm');
};

const clearToken = () => {
  localStorage.removeItem('auth_token');
  authStore.user = null;
  authStore.token = null;
  message.info('Token已清除，请刷新页面');
  // 刷新页面以重新触发路由守卫
  setTimeout(() => {
    window.location.reload();
  }, 1000);
};

const setMockToken = () => {
  const mockToken = 'mock_token_' + Date.now();
  localStorage.setItem('auth_token', mockToken);
  authStore.token = mockToken;
  authStore.user = { id: 1, username: 'testuser' };
  message.success('Mock Token已设置');
};
</script>

<style scoped>
.test-routes {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.route-info {
  margin-bottom: 16px;
}

.navigation-buttons {
  text-align: center;
}

.debug-info {
  white-space: pre-line;
  font-family: monospace;
}
</style>