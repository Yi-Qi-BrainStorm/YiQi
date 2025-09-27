<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>欢迎使用 AI 头脑风暴平台</h1>
      <p class="welcome-text">您已成功登录，可以开始使用各项功能了！</p>
    </div>

    <div class="dashboard-content">
      <!-- 功能卡片区域 -->
      <div class="feature-cards-section">
        <h2 class="section-title">快速开始</h2>
        <div class="feature-cards-grid">
          <a-card class="feature-card" hoverable @click="goToBrainstorm">
            <template #cover>
              <div class="card-icon">
                <BulbOutlined />
              </div>
            </template>
            <a-card-meta
              title="开始头脑风暴"
              description="创建新的头脑风暴会话，让AI代理为您提供创意解决方案"
            />
          </a-card>

          <a-card class="feature-card" hoverable @click="goToAgents">
            <template #cover>
              <div class="card-icon">
                <RobotOutlined />
              </div>
            </template>
            <a-card-meta
              title="管理AI代理"
              description="创建和配置您的AI代理，定制专属的智能助手"
            />
          </a-card>

          <a-card class="feature-card" hoverable @click="goToHistory">
            <template #cover>
              <div class="card-icon">
                <HistoryOutlined />
              </div>
            </template>
            <a-card-meta
              title="历史记录"
              description="查看您的头脑风暴历史记录和生成的报告"
            />
          </a-card>
        </div>
      </div>

      <div class="stats-section">
        <a-card title="使用统计" class="stats-card">
          <a-row :gutter="16">
            <a-col :span="8">
              <a-statistic
                title="总会话数"
                :value="mockStats.totalSessions"
                :value-style="{ color: '#3f8600' }"
              />
            </a-col>
            <a-col :span="8">
              <a-statistic
                title="AI代理数"
                :value="mockStats.totalAgents"
                :value-style="{ color: '#1890ff' }"
              />
            </a-col>
            <a-col :span="8">
              <a-statistic
                title="生成报告数"
                :value="mockStats.totalReports"
                :value-style="{ color: '#722ed1' }"
              />
            </a-col>
          </a-row>
        </a-card>
      </div>

      <div class="recent-activity">
        <a-card title="最近活动" class="activity-card">
          <a-list
            :data-source="mockActivities"
            item-layout="horizontal"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta
                  :title="item.title"
                  :description="item.description"
                >
                  <template #avatar>
                    <a-avatar :style="{ backgroundColor: item.color }">
                      <component :is="item.icon" />
                    </a-avatar>
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <span class="activity-time">{{ item.time }}</span>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import {
  BulbOutlined,
  RobotOutlined,
  HistoryOutlined,
  UserOutlined,
  FileTextOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue';

const router = useRouter();

// Mock 数据
const mockStats = ref({
  totalSessions: 12,
  totalAgents: 5,
  totalReports: 8,
});

const mockActivities = ref([
  {
    title: '创建了新的AI代理',
    description: '设计师代理已成功创建',
    time: '2小时前',
    icon: RobotOutlined,
    color: '#1890ff',
  },
  {
    title: '完成头脑风暴会话',
    description: '移动应用设计方案已生成',
    time: '4小时前',
    icon: BulbOutlined,
    color: '#52c41a',
  },
  {
    title: '导出项目报告',
    description: '用户体验优化报告已导出',
    time: '1天前',
    icon: FileTextOutlined,
    color: '#722ed1',
  },
  {
    title: '更新代理配置',
    description: '开发者代理的系统提示已更新',
    time: '2天前',
    icon: SettingOutlined,
    color: '#fa8c16',
  },
]);

// 导航方法
const goToBrainstorm = () => {
  message.info('正在跳转到头脑风暴页面...');
  router.push('/brainstorm');
};

const goToAgents = () => {
  message.info('正在跳转到代理管理页面...');
  router.push('/agents');
};

const goToHistory = () => {
  message.info('正在跳转到历史记录页面...');
  router.push('/brainstorm/history');
};
</script>

<style scoped lang="scss">
.dashboard {
  padding: 24px;
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.dashboard-header {
  text-align: center;
  margin-bottom: 48px;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 16px;
  }
  
  .welcome-text {
    font-size: 1.2rem;
    color: #666;
    margin: 0;
  }
}

.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
}

.feature-cards-section {
  margin-bottom: 48px;
  
  .section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #262626;
    margin-bottom: 32px;
    text-align: center;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 3px;
      background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
      border-radius: 2px;
    }
  }
  
  .feature-cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    align-items: stretch;
    max-width: 1000px; // 限制最大宽度，避免卡片过宽
    margin: 0 auto; // 居中对齐
    
    // 在中等屏幕上显示2列
    @media (max-width: 991px) {
      grid-template-columns: repeat(2, 1fr);
      max-width: 700px;
    }
    
    // 在小屏幕上显示1列
    @media (max-width: 767px) {
      grid-template-columns: 1fr;
      max-width: 400px;
    }
  }
}

.feature-card {
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  height: 280px; // 固定高度确保一致性
  width: 100%; // 确保卡片占满容器宽度
  display: flex;
  flex-direction: column;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
    border-color: #1890ff;
  }
  
  .ant-card-cover {
    flex-shrink: 0;
  }
  
  .ant-card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 24px;
  }
  
  .card-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 140px;
    font-size: 3.5rem;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(24, 144, 255, 0.05) 100%);
      transition: all 0.3s ease;
    }
    
    .anticon {
      position: relative;
      z-index: 1;
      color: #1890ff;
      filter: drop-shadow(0 2px 4px rgba(24, 144, 255, 0.2));
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }
  
  &:hover .card-icon {
    &::before {
      opacity: 0.8;
      transform: scale(1.05);
    }
    
    .anticon {
      transform: scale(1.1);
      filter: drop-shadow(0 4px 8px rgba(24, 144, 255, 0.3));
    }
  }
  
  // 为不同卡片设置不同的主题色
  &:nth-of-type(1) {
    .card-icon {
      &::before {
        background: linear-gradient(135deg, rgba(82, 196, 26, 0.1) 0%, rgba(82, 196, 26, 0.05) 100%);
      }
      .anticon {
        color: #52c41a;
        filter: drop-shadow(0 2px 4px rgba(82, 196, 26, 0.2));
      }
    }
    
    &:hover {
      border-color: #52c41a;
      
      .card-icon .anticon {
        filter: drop-shadow(0 4px 8px rgba(82, 196, 26, 0.3));
      }
    }
  }
  
  &:nth-of-type(2) {
    .card-icon {
      &::before {
        background: linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(24, 144, 255, 0.05) 100%);
      }
      .anticon {
        color: #1890ff;
        filter: drop-shadow(0 2px 4px rgba(24, 144, 255, 0.2));
      }
    }
    
    &:hover {
      border-color: #1890ff;
      
      .card-icon .anticon {
        filter: drop-shadow(0 4px 8px rgba(24, 144, 255, 0.3));
      }
    }
  }
  
  &:nth-of-type(3) {
    .card-icon {
      &::before {
        background: linear-gradient(135deg, rgba(114, 46, 209, 0.1) 0%, rgba(114, 46, 209, 0.05) 100%);
      }
      .anticon {
        color: #722ed1;
        filter: drop-shadow(0 2px 4px rgba(114, 46, 209, 0.2));
      }
    }
    
    &:hover {
      border-color: #722ed1;
      
      .card-icon .anticon {
        filter: drop-shadow(0 4px 8px rgba(114, 46, 209, 0.3));
      }
    }
  }
  
  .ant-card-meta-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #262626;
    margin-bottom: 8px;
    text-align: center;
  }
  
  .ant-card-meta-description {
    color: #8c8c8c;
    font-size: 0.95rem;
    line-height: 1.5;
    text-align: center;
  }
}

.stats-section {
  margin: 48px 0;
  
  .stats-card {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.recent-activity {
  .activity-card {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .activity-time {
    color: #999;
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }
  
  .dashboard-header h1 {
    font-size: 2rem;
  }
  
  .dashboard-header .welcome-text {
    font-size: 1rem;
  }
  
  .feature-cards-section {
    .section-title {
      font-size: 1.3rem;
      margin-bottom: 20px;
    }
    
    .feature-cards-grid {
      gap: 16px;
    }
  }
  
  .feature-card {
    height: auto; // 移动端允许自适应高度
    min-height: 240px;
    
    .card-icon {
      height: 100px;
      font-size: 2.5rem;
    }
    
    .ant-card-body {
      padding: 20px;
    }
    
    .ant-card-meta-title {
      font-size: 1.1rem;
    }
    
    .ant-card-meta-description {
      font-size: 0.9rem;
    }
  }
}

@media (max-width: 576px) {
  .feature-card {
    min-height: 200px;
    
    .card-icon {
      height: 80px;
      font-size: 2rem;
    }
    
    .ant-card-body {
      padding: 16px;
    }
  }
}
</style>