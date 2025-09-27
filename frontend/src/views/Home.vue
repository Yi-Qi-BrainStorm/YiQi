<template>
  <div class="home-page">
    <div class="hero-section">
      <a-card class="welcome-card">
        <template #title>
          <h1 class="welcome-title">
            <span class="gradient-text">AI头脑风暴平台</span>
          </h1>
        </template>
        
        <div class="welcome-content">
          <p class="welcome-description">
            欢迎使用AI头脑风暴平台！这是一个创新的协作平台，让多个AI代理协同工作，
            为您的项目提供全方位的创意解决方案。
          </p>
          
          <!-- Mock状态指示器 -->
          <div class="mock-status">
            <a-alert 
              :type="mockEnabled ? 'info' : 'warning'"
              :message="mockEnabled ? '🔧 Mock模式已启用' : '🌐 使用真实API'"
              :description="mockEnabled ? '当前使用模拟数据进行开发测试' : '连接到真实后端服务'"
              show-icon
              style="margin-bottom: 20px"
            />
            
            <a-space>
              <a-button @click="toggleMockMode" :type="mockEnabled ? 'default' : 'primary'">
                {{ mockEnabled ? '切换到真实API' : '切换到Mock模式' }}
              </a-button>
              <a-button @click="testLogin" type="primary" ghost>
                测试登录功能
              </a-button>
            </a-space>
          </div>
          
          <div class="action-buttons">
            <a-space size="large">
              <a-button type="primary" size="large" @click="startBrainstorm">
                开始头脑风暴
              </a-button>
              <a-button size="large" @click="manageAgents">
                管理代理
              </a-button>
              <a-button size="large" @click="viewHistory">
                查看历史
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
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { isMockEnabled, toggleMock } from '@/utils/mockEnabler';
import { AuthService } from '@/services/authService';

const router = useRouter();

// 响应式数据
const mockEnabled = ref(false);

// 更新Mock状态
const updateMockStatus = () => {
  mockEnabled.value = isMockEnabled();
};

// 切换Mock模式
const toggleMockMode = () => {
  toggleMock();
  updateMockStatus();
  message.success(`已切换到${mockEnabled.value ? 'Mock' : '真实API'}模式，请刷新页面生效`);
  
  // 延迟刷新页面
  setTimeout(() => {
    window.location.reload();
  }, 1000);
};

// 测试登录功能
const testLogin = async () => {
  try {
    message.loading('正在测试登录功能...', 0);
    
    const testCredentials = {
      username: 'testuser',
      password: 'test123456'
    };
    
    const result = await AuthService.login(testCredentials);
    message.destroy();
    message.success('登录测试成功！Mock服务正常工作');
    console.log('登录测试结果:', result);
  } catch (error: any) {
    message.destroy();
    message.error(`登录测试失败: ${error.message || '未知错误'}`);
    console.error('登录测试失败:', error);
  }
};

// 导航方法
const startBrainstorm = () => {
  message.info('正在跳转到头脑风暴页面...');
  router.push('/brainstorm');
};

const manageAgents = () => {
  message.info('正在跳转到代理管理页面...');
  router.push('/agents');
};

const viewHistory = () => {
  message.info('正在跳转到历史记录页面...');
  router.push('/brainstorm/history');
};

// 组件挂载
onMounted(() => {
  updateMockStatus();
  message.success('欢迎使用AI头脑风暴平台！', 3);
});
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.hero-section {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-card {
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.welcome-title {
  text-align: center;
  margin: 0;
  font-size: 3rem;
  font-weight: 700;
}

.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-content {
  text-align: center;
}

.welcome-description {
  font-size: 1.2rem;
  color: #666;
  line-height: 1.8;
  margin-bottom: 30px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.mock-status {
  margin: 30px 0;
  padding: 20px;
  background: rgba(240, 242, 247, 0.8);
  border-radius: 12px;
}

.action-buttons {
  margin-top: 40px;
}

@media (max-width: 768px) {
  .welcome-title {
    font-size: 2rem;
  }
  
  .welcome-description {
    font-size: 1rem;
  }
  
  .home-page {
    padding: 10px;
  }
}
</style>