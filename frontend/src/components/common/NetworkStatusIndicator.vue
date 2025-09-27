<template>
  <div class="network-status-indicator">
    <a-tooltip :title="statusTooltip">
      <div 
        :class="['status-indicator', `status-${connectionStatus}`]"
        @click="handleStatusClick"
      >
        <component 
          :is="statusIcon" 
          :class="['status-icon', { 'status-icon-pulse': isPulsing }]"
        />
        <span class="status-text" v-if="showText">{{ statusText }}</span>
      </div>
    </a-tooltip>

    <!-- 详细状态弹窗 -->
    <a-modal
      v-model:open="detailsVisible"
      title="网络连接状态"
      :footer="null"
      width="400px"
    >
      <div class="connection-details">
        <a-descriptions :column="1" bordered size="small">
          <a-descriptions-item label="连接状态">
            <a-badge 
              :status="getBadgeStatus(connectionStatus)"
              :text="statusText"
            />
          </a-descriptions-item>
          
          <a-descriptions-item label="延迟" v-if="latency >= 0">
            <span :class="getLatencyClass(latency)">
              {{ latency }}ms
            </span>
          </a-descriptions-item>
          
          <a-descriptions-item label="重连次数" v-if="reconnectAttempts > 0">
            {{ reconnectAttempts }}
          </a-descriptions-item>
          
          <a-descriptions-item label="Socket ID" v-if="socketId">
            <code>{{ socketId }}</code>
          </a-descriptions-item>
          
          <a-descriptions-item label="最后更新">
            {{ formatTime(lastUpdateTime) }}
          </a-descriptions-item>
        </a-descriptions>

        <div class="connection-actions" v-if="connectionStatus !== 'connected'">
          <a-space>
            <a-button 
              type="primary" 
              :loading="isConnecting"
              @click="handleReconnect"
            >
              重新连接
            </a-button>
            <a-button @click="handleRefresh">
              刷新页面
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { 
  WifiOutlined, 
  LoadingOutlined, 
  ExclamationCircleOutlined,
  DisconnectOutlined 
} from '@ant-design/icons-vue';
import type { SocketConnectionStatus } from '@/types/socket';

interface Props {
  connectionStatus: SocketConnectionStatus;
  isConnecting?: boolean;
  latency?: number;
  reconnectAttempts?: number;
  socketId?: string;
  showText?: boolean;
  error?: string | null;
}

interface Emits {
  (e: 'reconnect'): void;
  (e: 'refresh'): void;
}

const props = withDefaults(defineProps<Props>(), {
  isConnecting: false,
  latency: -1,
  reconnectAttempts: 0,
  socketId: '',
  showText: false,
  error: null,
});

const emit = defineEmits<Emits>();

// 响应式数据
const detailsVisible = ref(false);
const lastUpdateTime = ref(new Date());

// 计算属性
const statusIcon = computed(() => {
  switch (props.connectionStatus) {
    case 'connected':
      return WifiOutlined;
    case 'connecting':
    case 'reconnecting':
      return LoadingOutlined;
    case 'error':
      return ExclamationCircleOutlined;
    case 'disconnected':
    default:
      return DisconnectOutlined;
  }
});

const statusText = computed(() => {
  switch (props.connectionStatus) {
    case 'connected':
      return '已连接';
    case 'connecting':
      return '连接中';
    case 'reconnecting':
      return '重连中';
    case 'error':
      return '连接错误';
    case 'disconnected':
    default:
      return '已断开';
  }
});

const statusTooltip = computed(() => {
  let tooltip = statusText.value;
  
  if (props.latency >= 0) {
    tooltip += ` (${props.latency}ms)`;
  }
  
  if (props.error) {
    tooltip += ` - ${props.error}`;
  }
  
  if (props.reconnectAttempts > 0) {
    tooltip += ` - 重连 ${props.reconnectAttempts} 次`;
  }
  
  return tooltip;
});

const isPulsing = computed(() => {
  return props.connectionStatus === 'connecting' || 
         props.connectionStatus === 'reconnecting' ||
         props.isConnecting;
});

// 方法
const getBadgeStatus = (status: SocketConnectionStatus) => {
  switch (status) {
    case 'connected':
      return 'success';
    case 'connecting':
    case 'reconnecting':
      return 'processing';
    case 'error':
      return 'error';
    case 'disconnected':
    default:
      return 'default';
  }
};

const getLatencyClass = (latency: number): string => {
  if (latency < 100) return 'latency-excellent';
  if (latency < 300) return 'latency-good';
  if (latency < 500) return 'latency-fair';
  return 'latency-poor';
};

const formatTime = (time: Date): string => {
  return time.toLocaleTimeString('zh-CN');
};

const handleStatusClick = () => {
  detailsVisible.value = true;
};

const handleReconnect = () => {
  emit('reconnect');
  detailsVisible.value = false;
};

const handleRefresh = () => {
  emit('refresh');
};

// 监听状态变化更新时间
watch(() => props.connectionStatus, () => {
  lastUpdateTime.value = new Date();
});

watch(() => props.latency, () => {
  if (props.latency >= 0) {
    lastUpdateTime.value = new Date();
  }
});
</script>

<style scoped lang="scss">
.network-status-indicator {
  .status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    .status-icon {
      font-size: 14px;
      transition: all 0.3s ease;
      
      &.status-icon-pulse {
        animation: pulse 1.5s infinite;
      }
    }

    .status-text {
      font-size: 12px;
      font-weight: 500;
    }

    // 状态颜色
    &.status-connected {
      .status-icon {
        color: #52c41a;
      }
      .status-text {
        color: #52c41a;
      }
    }

    &.status-connecting,
    &.status-reconnecting {
      .status-icon {
        color: #1890ff;
      }
      .status-text {
        color: #1890ff;
      }
    }

    &.status-error {
      .status-icon {
        color: #ff4d4f;
      }
      .status-text {
        color: #ff4d4f;
      }
    }

    &.status-disconnected {
      .status-icon {
        color: #8c8c8c;
      }
      .status-text {
        color: #8c8c8c;
      }
    }
  }
}

.connection-details {
  .connection-actions {
    margin-top: 16px;
    text-align: center;
  }
}

// 延迟颜色类
.latency-excellent {
  color: #52c41a;
  font-weight: 500;
}

.latency-good {
  color: #1890ff;
  font-weight: 500;
}

.latency-fair {
  color: #faad14;
  font-weight: 500;
}

.latency-poor {
  color: #ff4d4f;
  font-weight: 500;
}

// 脉冲动画
@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>