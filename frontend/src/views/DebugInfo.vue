<template>
  <div class="debug-info">
    <a-card title="系统调试信息">
      <a-descriptions :column="1" bordered>
        <a-descriptions-item label="当前路由">
          {{ $route.path }}
        </a-descriptions-item>
        <a-descriptions-item label="路由名称">
          {{ $route.name }}
        </a-descriptions-item>
        <a-descriptions-item label="Mock状态">
          <a-tag :color="mockEnabled ? 'green' : 'red'">
            {{ mockEnabled ? '已启用' : '未启用' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="认证状态">
          <a-tag :color="isAuthenticated ? 'green' : 'red'">
            {{ isAuthenticated ? '已登录' : '未登录' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="用户信息">
          {{ user ? user.username : '无' }}
        </a-descriptions-item>
        <a-descriptions-item label="环境">
          {{ import.meta.env.MODE }}
        </a-descriptions-item>
      </a-descriptions>
      
      <div style="margin-top: 16px;">
        <a-space>
          <a-button @click="goToDashboard" type="primary">
            前往 Dashboard
          </a-button>
          <a-button @click="goToBrainstorm">
            前往头脑风暴
          </a-button>
          <a-button @click="testMockService">
            测试 Mock 服务
          </a-button>
        </a-space>
      </div>
      
      <div v-if="testResult" style="margin-top: 16px;">
        <a-alert
          :message="testResult.success ? '测试成功' : '测试失败'"
          :description="testResult.message"
          :type="testResult.success ? 'success' : 'error'"
          show-icon
        />
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { isMockEnabled } from '@/utils/mockEnabler';
import { AgentService } from '@/services/agentService';
import { message } from 'ant-design-vue';

const router = useRouter();
const authStore = useAuthStore();

const mockEnabled = ref(isMockEnabled());
const testResult = ref<{ success: boolean; message: string } | null>(null);

const isAuthenticated = computed(() => authStore.isAuthenticated);
const user = computed(() => authStore.user);

const goToDashboard = () => {
  router.push('/dashboard');
};

const goToBrainstorm = () => {
  router.push('/brainstorm');
};

const testMockService = async () => {
  try {
    message.loading('正在测试 Mock 服务...', 0);
    const result = await AgentService.getAgents();
    message.destroy();
    
    testResult.value = {
      success: true,
      message: `成功获取 ${result.data?.length || 0} 个代理`
    };
    message.success('Mock 服务测试成功');
  } catch (error: any) {
    message.destroy();
    testResult.value = {
      success: false,
      message: error.message || '测试失败'
    };
    message.error('Mock 服务测试失败');
  }
};
</script>

<style scoped>
.debug-info {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}
</style>