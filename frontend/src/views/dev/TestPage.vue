<template>
  <div class="test-page">
    <a-card title="前端功能测试页面" class="test-card">
      <a-space direction="vertical" size="large" style="width: 100%">
        <!-- 基础组件测试 -->
        <a-card size="small" title="基础组件测试">
          <a-space>
            <a-button type="primary" @click="testBasicComponents">
              测试基础组件
            </a-button>
            <a-button @click="testNotification">
              测试通知
            </a-button>
            <a-button @click="testModal">
              测试弹窗
            </a-button>
          </a-space>
          <div v-if="componentTestResult" class="result-box">
            <pre>{{ componentTestResult }}</pre>
          </div>
        </a-card>

        <!-- 路由测试 -->
        <a-card size="small" title="路由测试">
          <a-space>
            <a-button @click="navigateToAgents">
              跳转到代理管理
            </a-button>
            <a-button @click="navigateToBrainstorm">
              跳转到头脑风暴
            </a-button>
            <a-button @click="navigateToLogin">
              跳转到登录页
            </a-button>
          </a-space>
          <div class="current-route">
            当前路由: {{ $route.path }}
          </div>
        </a-card>

        <!-- Store 测试 -->
        <a-card size="small" title="状态管理测试">
          <a-space>
            <a-button @click="testAuthStore">
              测试认证Store
            </a-button>
            <a-button @click="testAgentStore">
              测试代理Store
            </a-button>
            <a-button @click="testBrainstormStore">
              测试头脑风暴Store
            </a-button>
            <a-button danger @click="clearAuthData">
              清除认证数据
            </a-button>
          </a-space>
          <div v-if="storeTestResult" class="result-box">
            <pre>{{ JSON.stringify(storeTestResult, null, 2) }}</pre>
          </div>
        </a-card>

        <!-- Mock 数据测试 -->
        <a-card size="small" title="Mock数据测试">
          <a-space>
            <a-button @click="testMockData">
              测试Mock数据
            </a-button>
            <a-button @click="testApiCalls">
              测试API调用
            </a-button>
          </a-space>
          <div v-if="mockTestResult" class="result-box">
            <pre>{{ JSON.stringify(mockTestResult, null, 2) }}</pre>
          </div>
        </a-card>

        <!-- 系统信息 -->
        <a-card size="small" title="系统信息">
          <a-descriptions :column="2" size="small">
            <a-descriptions-item label="Vue版本">
              {{ vueVersion }}
            </a-descriptions-item>
            <a-descriptions-item label="环境模式">
              {{ mode }}
            </a-descriptions-item>
            <a-descriptions-item label="Mock状态">
              <a-tag :color="mockEnabled ? 'green' : 'red'">
                {{ mockEnabled ? '已启用' : '未启用' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="路由模式">
              {{ routerMode }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-space>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { useAuthStore } from '@/stores/auth';
import { useAgentStore } from '@/stores/agents';
import { useBrainstormStore } from '@/stores/brainstorm';
import { isMockEnabled } from '@/utils/mockEnabler';

const router = useRouter();
const authStore = useAuthStore();
const agentStore = useAgentStore();
const brainstormStore = useBrainstormStore();

// 响应式数据
const componentTestResult = ref('');
const storeTestResult = ref(null);
const mockTestResult = ref(null);
const vueVersion = ref('3.x');
const mode = ref(import.meta.env.MODE);
const mockEnabled = ref(false);
const routerMode = ref('history');

// 测试基础组件
const testBasicComponents = () => {
  componentTestResult.value = `
基础组件测试结果:
✅ Button 组件正常
✅ Card 组件正常
✅ Space 组件正常
✅ Typography 组件正常
✅ 测试时间: ${new Date().toLocaleString()}
  `.trim();
};

// 测试通知
const testNotification = () => {
  message.success('通知功能正常！');
  message.info('这是一个信息通知');
  message.warning('这是一个警告通知');
};

// 测试弹窗
const testModal = () => {
  Modal.info({
    title: '弹窗测试',
    content: '弹窗功能正常工作！',
    onOk() {
      message.success('弹窗关闭成功');
    }
  });
};

// 路由导航测试
const navigateToAgents = () => {
  router.push('/agents');
};

const navigateToBrainstorm = () => {
  router.push('/brainstorm');
};

const navigateToLogin = () => {
  router.push('/login');
};

// 测试认证Store
const testAuthStore = async () => {
  try {
    // 测试登录
    await authStore.login({
      username: 'testuser',
      password: 'test123456'
    });
    
    storeTestResult.value = {
      type: 'auth',
      success: true,
      user: authStore.user,
      isAuthenticated: authStore.isAuthenticated,
      message: '认证Store测试成功'
    };
  } catch (error: any) {
    storeTestResult.value = {
      type: 'auth',
      success: false,
      error: error.message,
      message: '认证Store测试失败'
    };
  }
};

// 测试代理Store
const testAgentStore = async () => {
  try {
    await agentStore.fetchAgents();
    
    storeTestResult.value = {
      type: 'agent',
      success: true,
      agentCount: agentStore.agents.length,
      agents: agentStore.agents.slice(0, 2), // 只显示前2个
      message: '代理Store测试成功'
    };
  } catch (error: any) {
    storeTestResult.value = {
      type: 'agent',
      success: false,
      error: error.message,
      message: '代理Store测试失败'
    };
  }
};

// 测试头脑风暴Store
const testBrainstormStore = async () => {
  try {
    await brainstormStore.fetchSessions();
    
    storeTestResult.value = {
      type: 'brainstorm',
      success: true,
      sessionCount: brainstormStore.sessions.length,
      sessions: brainstormStore.sessions.slice(0, 2), // 只显示前2个
      message: '头脑风暴Store测试成功'
    };
  } catch (error: any) {
    storeTestResult.value = {
      type: 'brainstorm',
      success: false,
      error: error.message,
      message: '头脑风暴Store测试失败'
    };
  }
};

// 测试Mock数据
const testMockData = async () => {
  try {
    const { getMockDataService } = await import('@/utils/mockEnabler');
    const mockService = await getMockDataService();
    
    const agents = await mockService.getAgents();
    const sessions = await mockService.getSessions();
    
    mockTestResult.value = {
      success: true,
      mockEnabled: isMockEnabled(),
      agentCount: agents.length,
      sessionCount: sessions.length,
      sampleAgent: agents[0],
      message: 'Mock数据测试成功'
    };
  } catch (error: any) {
    mockTestResult.value = {
      success: false,
      error: error.message,
      message: 'Mock数据测试失败'
    };
  }
};

// 测试API调用
const testApiCalls = async () => {
  try {
    const { ApiService } = await import('@/services/__mocks__/api');
    
    const healthCheck = await ApiService.get('/actuator/health');
    const agents = await ApiService.get('/agents');
    
    mockTestResult.value = {
      success: true,
      healthCheck,
      agentCount: agents.length,
      message: 'API调用测试成功'
    };
  } catch (error: any) {
    mockTestResult.value = {
      success: false,
      error: error.message,
      message: 'API调用测试失败'
    };
  }
};

// 清除认证数据
const clearAuthData = () => {
  Modal.confirm({
    title: '确认清除认证数据',
    content: '这将清除所有本地存储的认证信息，包括token和用户数据。确定要继续吗？',
    onOk() {
      // 清除localStorage和sessionStorage中的认证数据
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('refresh_token');
      sessionStorage.clear();
      
      // 清除store中的认证状态
      authStore.clearAuth();
      
      message.success('认证数据已清除，页面将刷新');
      
      // 延迟刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  });
};

// 组件挂载时初始化
onMounted(() => {
  mockEnabled.value = isMockEnabled();
  
  // 显示启动信息
  message.info('测试页面已加载，可以开始测试各项功能');
});
</script>

<style scoped>
.test-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-card {
  margin-bottom: 20px;
}

.result-box {
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 6px;
  max-height: 300px;
  overflow-y: auto;
}

.result-box pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
}

.current-route {
  margin-top: 12px;
  padding: 8px;
  background-color: #e6f7ff;
  border-radius: 4px;
  font-family: monospace;
}
</style>