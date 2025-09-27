<template>
  <div class="mock-test-page">
    <a-card title="Mock数据测试页面" class="test-card">
      <a-space direction="vertical" size="large" style="width: 100%">
        <!-- Mock状态 -->
        <a-alert
          :type="mockEnabled ? 'success' : 'warning'"
          :message="mockEnabled ? 'Mock服务已启用' : 'Mock服务未启用'"
          show-icon
        />

        <!-- 用户测试 -->
        <a-card size="small" title="用户认证测试">
          <a-space>
            <a-button @click="testLogin" :loading="loading.login">
              测试登录
            </a-button>
            <a-button @click="testRegister" :loading="loading.register">
              测试注册
            </a-button>
            <a-button @click="testGetCurrentUser" :loading="loading.currentUser">
              获取当前用户
            </a-button>
          </a-space>
          <div v-if="userResult" class="result-box">
            <pre>{{ JSON.stringify(userResult, null, 2) }}</pre>
          </div>
        </a-card>

        <!-- 代理测试 -->
        <a-card size="small" title="代理管理测试">
          <a-space>
            <a-button @click="testGetAgents" :loading="loading.agents">
              获取代理列表
            </a-button>
            <a-button @click="testCreateAgent" :loading="loading.createAgent">
              创建代理
            </a-button>
          </a-space>
          <div v-if="agentResult" class="result-box">
            <pre>{{ JSON.stringify(agentResult, null, 2) }}</pre>
          </div>
        </a-card>

        <!-- 会话测试 -->
        <a-card size="small" title="头脑风暴会话测试">
          <a-space>
            <a-button @click="testGetSessions" :loading="loading.sessions">
              获取会话列表
            </a-button>
            <a-button @click="testCreateSession" :loading="loading.createSession">
              创建会话
            </a-button>
          </a-space>
          <div v-if="sessionResult" class="result-box">
            <pre>{{ JSON.stringify(sessionResult, null, 2) }}</pre>
          </div>
        </a-card>

        <!-- 控制台输出 -->
        <a-card size="small" title="控制台输出">
          <div class="console-output">
            <div v-for="(log, index) in consoleLogs" :key="index" class="log-item">
              <span class="log-time">{{ log.time }}</span>
              <span :class="`log-level-${log.level}`">{{ log.level.toUpperCase() }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
          <a-button @click="clearLogs" size="small">清空日志</a-button>
        </a-card>
      </a-space>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { authService } from '@/services/authService';
import { agentService } from '@/services/agentService';
import { brainstormService } from '@/services/brainstormService';
import { isMockEnabled } from '@/utils/mockEnabler';

// 响应式数据
const mockEnabled = ref(false);
const userResult = ref(null);
const agentResult = ref(null);
const sessionResult = ref(null);

const loading = reactive({
  login: false,
  register: false,
  currentUser: false,
  agents: false,
  createAgent: false,
  sessions: false,
  createSession: false
});

interface LogItem {
  time: string;
  level: 'info' | 'error' | 'warn';
  message: string;
}

const consoleLogs = ref<LogItem[]>([]);

// 添加日志
const addLog = (level: 'info' | 'error' | 'warn', message: string) => {
  consoleLogs.value.push({
    time: new Date().toLocaleTimeString(),
    level,
    message
  });
  
  // 限制日志数量
  if (consoleLogs.value.length > 50) {
    consoleLogs.value.shift();
  }
};

// 清空日志
const clearLogs = () => {
  consoleLogs.value = [];
};

// 测试登录
const testLogin = async () => {
  loading.login = true;
  try {
    addLog('info', '开始测试登录...');
    const result = await authService.login({
      username: 'testuser',
      password: 'test123456'
    });
    userResult.value = result;
    addLog('info', '登录测试成功');
  } catch (error: any) {
    addLog('error', `登录测试失败: ${error.message}`);
    userResult.value = { error: error.message };
  } finally {
    loading.login = false;
  }
};

// 测试注册
const testRegister = async () => {
  loading.register = true;
  try {
    addLog('info', '开始测试注册...');
    const result = await authService.register({
      username: `testuser_${Date.now()}`,
      password: 'test123456'
    });
    userResult.value = result;
    addLog('info', '注册测试成功');
  } catch (error: any) {
    addLog('error', `注册测试失败: ${error.message}`);
    userResult.value = { error: error.message };
  } finally {
    loading.register = false;
  }
};

// 测试获取当前用户
const testGetCurrentUser = async () => {
  loading.currentUser = true;
  try {
    addLog('info', '开始获取当前用户...');
    const result = await authService.getCurrentUser();
    userResult.value = result;
    addLog('info', '获取当前用户成功');
  } catch (error: any) {
    addLog('error', `获取当前用户失败: ${error.message}`);
    userResult.value = { error: error.message };
  } finally {
    loading.currentUser = false;
  }
};

// 测试获取代理列表
const testGetAgents = async () => {
  loading.agents = true;
  try {
    addLog('info', '开始获取代理列表...');
    const result = await agentService.getAgents();
    agentResult.value = result;
    addLog('info', `获取代理列表成功，共${result.length}个代理`);
  } catch (error: any) {
    addLog('error', `获取代理列表失败: ${error.message}`);
    agentResult.value = { error: error.message };
  } finally {
    loading.agents = false;
  }
};

// 测试创建代理
const testCreateAgent = async () => {
  loading.createAgent = true;
  try {
    addLog('info', '开始创建代理...');
    const result = await agentService.createAgent({
      name: `测试代理_${Date.now()}`,
      role: '测试角色',
      systemPrompt: '这是一个测试代理',
      modelType: 'gpt-4'
    });
    agentResult.value = result;
    addLog('info', '创建代理成功');
  } catch (error: any) {
    addLog('error', `创建代理失败: ${error.message}`);
    agentResult.value = { error: error.message };
  } finally {
    loading.createAgent = false;
  }
};

// 测试获取会话列表
const testGetSessions = async () => {
  loading.sessions = true;
  try {
    addLog('info', '开始获取会话列表...');
    const result = await brainstormService.getSessions();
    sessionResult.value = result;
    addLog('info', `获取会话列表成功，共${result.length}个会话`);
  } catch (error: any) {
    addLog('error', `获取会话列表失败: ${error.message}`);
    sessionResult.value = { error: error.message };
  } finally {
    loading.sessions = false;
  }
};

// 测试创建会话
const testCreateSession = async () => {
  loading.createSession = true;
  try {
    addLog('info', '开始创建会话...');
    const result = await brainstormService.createSession(
      `测试会话_${Date.now()}`,
      ['1', '2']
    );
    sessionResult.value = result;
    addLog('info', '创建会话成功');
  } catch (error: any) {
    addLog('error', `创建会话失败: ${error.message}`);
    sessionResult.value = { error: error.message };
  } finally {
    loading.createSession = false;
  }
};

// 组件挂载时检查Mock状态
onMounted(() => {
  mockEnabled.value = isMockEnabled();
  addLog('info', `Mock服务状态: ${mockEnabled.value ? '已启用' : '未启用'}`);
  
  if (mockEnabled.value) {
    addLog('info', '可以开始测试Mock数据功能');
  } else {
    addLog('warn', 'Mock服务未启用，测试可能失败');
  }
});
</script>

<style scoped>
.mock-test-page {
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
}

.console-output {
  background-color: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-item {
  display: flex;
  margin-bottom: 4px;
  line-height: 1.4;
}

.log-time {
  color: #888;
  margin-right: 8px;
  min-width: 80px;
}

.log-level-info {
  color: #4CAF50;
  margin-right: 8px;
  min-width: 50px;
}

.log-level-error {
  color: #f44336;
  margin-right: 8px;
  min-width: 50px;
}

.log-level-warn {
  color: #ff9800;
  margin-right: 8px;
  min-width: 50px;
}

.log-message {
  flex: 1;
}
</style>