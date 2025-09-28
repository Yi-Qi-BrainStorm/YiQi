<template>
  <div class="backend-integration-test">
    <a-card title="前后端集成测试" class="test-card">
      <template #extra>
        <a-space>
          <a-button @click="runAllTests" :loading="testing" type="primary">
            运行所有测试
          </a-button>
          <a-button @click="toggleMockMode" :type="mockEnabled ? 'default' : 'primary'">
            {{ mockEnabled ? '禁用Mock' : '启用Mock' }}
          </a-button>
        </a-space>
      </template>

      <!-- Mock状态 -->
      <a-alert
        :type="mockEnabled ? 'warning' : 'success'"
        :message="mockStatus.reason || (mockEnabled ? 'Mock模式已启用' : '使用真实后端API')"
        :description="mockEnabled ? 'Mock模式已启用，使用模拟数据' : '使用真实后端API'"
        show-icon
        class="status-alert"
      />

      <!-- 连接状态 -->
      <a-card size="small" title="连接状态" class="test-section">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-statistic
              title="后端连接"
              :value="connectionSummary.overallStatus === 'healthy' ? '健康' : 
                     connectionSummary.overallStatus === 'degraded' ? '部分可用' : '不可用'"
              :value-style="{ 
                color: connectionSummary.overallStatus === 'healthy' ? '#3f8600' : 
                       connectionSummary.overallStatus === 'degraded' ? '#faad14' : '#cf1322' 
              }"
            />
          </a-col>
          <a-col :span="8">
            <a-statistic
              title="成功率"
              :value="connectionSummary.totalTests > 0 ? 
                     Math.round((connectionSummary.successfulTests / connectionSummary.totalTests) * 100) : 0"
              suffix="%"
            />
          </a-col>
          <a-col :span="8">
            <a-statistic
              title="平均响应时间"
              :value="Math.round(connectionSummary.averageResponseTime || 0)"
              suffix="ms"
            />
          </a-col>
        </a-row>
      </a-card>

      <!-- 服务测试结果 -->
      <a-card size="small" title="服务测试结果" class="test-section">
        <a-list :data-source="testResults" :loading="testing">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #title>
                  <a-space>
                    <span>{{ item.service }}</span>
                    <a-tag :color="item.status === 'success' ? 'green' : 'red'">
                      {{ item.status === 'success' ? '成功' : '失败' }}
                    </a-tag>
                  </a-space>
                </template>
                <template #description>
                  {{ item.message }}
                </template>
              </a-list-item-meta>
              <template #actions>
                <span v-if="item.responseTime">{{ item.responseTime }}ms</span>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </a-card>

      <!-- API端点测试 -->
      <a-card size="small" title="API端点测试" class="test-section">
        <a-row :gutter="16">
          <a-col :span="8">
            <div class="endpoint-test">
              <h4>用户认证</h4>
              <a-button size="small" @click="testUserAuth" :loading="testingEndpoints.auth">
                测试登录接口
              </a-button>
            </div>
          </a-col>
          <a-col :span="8">
            <div class="endpoint-test">
              <h4>代理管理</h4>
              <a-button size="small" @click="testAgentAPI" :loading="testingEndpoints.agents">
                测试代理接口
              </a-button>
            </div>
          </a-col>
          <a-col :span="8">
            <div class="endpoint-test">
              <h4>会话管理</h4>
              <a-button size="small" @click="testSessionAPI" :loading="testingEndpoints.sessions">
                测试会话接口
              </a-button>
            </div>
          </a-col>
        </a-row>
      </a-card>

      <!-- 测试日志 -->
      <a-card size="small" title="测试日志" class="test-section" v-if="testLogs.length > 0">
        <div class="test-logs">
          <div 
            v-for="log in testLogs" 
            :key="log.id" 
            :class="['log-entry', log.level]"
          >
            <span class="log-time">{{ log.timestamp }}</span>
            <span class="log-level">{{ log.level.toUpperCase() }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </a-card>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { message } from 'ant-design-vue';
import { backendConnectionService, type ConnectionTestResult } from '@/services/backendConnectionService';
import { authService } from '@/services/authService';
import { agentService } from '@/services/agentService';
import { brainstormService } from '@/services/brainstormService';
import { toggleMockMode as toggleMock, getMockStatus, isMockEnabled } from '@/utils/mockEnabler';

// 响应式数据
const testing = ref(false);
const mockEnabled = ref(isMockEnabled());
const mockStatus = ref<any>({ enabled: false, reason: '' });

const connectionSummary = reactive({
  totalTests: 0,
  successfulTests: 0,
  failedTests: 0,
  averageResponseTime: 0,
  overallStatus: 'unhealthy' as 'healthy' | 'degraded' | 'unhealthy'
});

const testResults = ref<ConnectionTestResult[]>([]);

const testingEndpoints = reactive({
  auth: false,
  agents: false,
  sessions: false
});

interface TestLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

const testLogs = ref<TestLog[]>([]);

// 添加测试日志
function addLog(level: 'info' | 'warn' | 'error', message: string) {
  testLogs.value.unshift({
    id: Date.now().toString(),
    timestamp: new Date().toLocaleTimeString(),
    level,
    message
  });
  
  // 只保留最近50条日志
  if (testLogs.value.length > 50) {
    testLogs.value = testLogs.value.slice(0, 50);
  }
}

// 运行所有测试
async function runAllTests() {
  testing.value = true;
  addLog('info', '开始运行所有连接测试...');
  
  try {
    const results = await backendConnectionService.runAllTests();
    testResults.value = results;
    
    const summary = await backendConnectionService.getConnectionSummary();
    Object.assign(connectionSummary, summary);
    
    addLog('info', `测试完成: ${summary.successfulTests}/${summary.totalTests} 成功`);
    
    if (summary.overallStatus === 'healthy') {
      message.success('所有服务连接正常');
    } else if (summary.overallStatus === 'degraded') {
      message.warning('部分服务连接异常');
    } else {
      message.error('后端服务连接失败');
    }
  } catch (error: any) {
    addLog('error', `测试失败: ${error.message}`);
    message.error(`测试失败: ${error.message}`);
  } finally {
    testing.value = false;
  }
}

// 测试用户认证
async function testUserAuth() {
  testingEndpoints.auth = true;
  addLog('info', '测试用户认证接口...');
  
  try {
    // 测试获取角色类型（不需要认证）
    await agentService.getRoleTypes();
    addLog('info', '用户认证接口测试成功');
    message.success('用户认证接口可用');
  } catch (error: any) {
    addLog('error', `用户认证接口测试失败: ${error.message}`);
    message.error(`用户认证接口测试失败: ${error.message}`);
  } finally {
    testingEndpoints.auth = false;
  }
}

// 测试代理API
async function testAgentAPI() {
  testingEndpoints.agents = true;
  addLog('info', '测试代理管理接口...');
  
  try {
    // 测试获取角色类型
    await agentService.getRoleTypes();
    addLog('info', '代理管理接口测试成功');
    message.success('代理管理接口可用');
  } catch (error: any) {
    addLog('error', `代理管理接口测试失败: ${error.message}`);
    message.error(`代理管理接口测试失败: ${error.message}`);
  } finally {
    testingEndpoints.agents = false;
  }
}

// 测试会话API
async function testSessionAPI() {
  testingEndpoints.sessions = true;
  addLog('info', '测试会话管理接口...');
  
  try {
    // 测试获取会话列表
    await brainstormService.getBrainstormSessions();
    addLog('info', '会话管理接口测试成功');
    message.success('会话管理接口可用');
  } catch (error: any) {
    if (error.response?.status === 401) {
      addLog('warn', '会话管理接口需要认证，但接口可用');
      message.warning('会话管理接口需要认证');
    } else {
      addLog('error', `会话管理接口测试失败: ${error.message}`);
      message.error(`会话管理接口测试失败: ${error.message}`);
    }
  } finally {
    testingEndpoints.sessions = false;
  }
}

// 切换Mock模式
function toggleMockMode() {
  mockEnabled.value = toggleMock();
  updateMockStatus();
  addLog('info', `Mock模式已${mockEnabled.value ? '启用' : '禁用'}`);
  message.success(`Mock模式已${mockEnabled.value ? '启用' : '禁用'}`);
}

// 更新Mock状态
async function updateMockStatus() {
  mockStatus.value = await getMockStatus();
}

// 组件挂载时初始化
onMounted(async () => {
  await updateMockStatus();
  await runAllTests();
});
</script>

<style scoped lang="scss">
.backend-integration-test {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-card {
  .ant-card-body {
    padding: 24px;
  }
}

.status-alert {
  margin-bottom: 24px;
}

.test-section {
  margin-bottom: 24px;
  
  .ant-card-body {
    padding: 16px;
  }
}

.endpoint-test {
  text-align: center;
  
  h4 {
    margin-bottom: 8px;
    font-size: 14px;
  }
}

.test-logs {
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  
  .log-entry {
    display: flex;
    margin-bottom: 4px;
    padding: 2px 0;
    
    &.info {
      color: #1890ff;
    }
    
    &.warn {
      color: #faad14;
    }
    
    &.error {
      color: #ff4d4f;
    }
    
    .log-time {
      width: 80px;
      margin-right: 8px;
      color: #666;
    }
    
    .log-level {
      width: 50px;
      margin-right: 8px;
      font-weight: bold;
    }
    
    .log-message {
      flex: 1;
    }
  }
}
</style>