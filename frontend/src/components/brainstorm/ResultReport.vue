<template>
  <div class="result-report">
    <div class="report-container">
      <!-- 报告头部 -->
      <div class="report-header">
        <div class="header-content">
          <h1 class="report-title">{{ report.topic }} - 产品解决方案报告</h1>
          <div class="report-meta">
            <a-tag color="blue">
              <CalendarOutlined />
              生成时间: {{ formatDateTime(report.generatedAt) }}
            </a-tag>
            <a-tag color="green">
              <FileTextOutlined />
              会话ID: {{ report.sessionId }}
            </a-tag>
          </div>
        </div>
        <div class="header-actions">
          <a-button type="primary" @click="handleExport" :loading="exporting">
            <ExportOutlined />
            导出报告
          </a-button>
          <a-dropdown>
            <template #overlay>
              <a-menu @click="handleExportFormat">
                <a-menu-item key="pdf">
                  <FilePdfOutlined />
                  导出为PDF
                </a-menu-item>
                <a-menu-item key="word">
                  <FileWordOutlined />
                  导出为Word
                </a-menu-item>
                <a-menu-item key="html">
                  <FileOutlined />
                  导出为HTML
                </a-menu-item>
              </a-menu>
            </template>
            <a-button>
              更多格式
              <DownOutlined />
            </a-button>
          </a-dropdown>
        </div>
      </div>

      <!-- 章节导航 -->
      <div class="report-navigation">
        <a-affix :offset-top="80">
          <div class="nav-container">
            <h4>章节导航</h4>
            <a-menu
              v-model:selectedKeys="selectedNavKeys"
              mode="inline"
              :style="{ border: 'none' }"
              @click="scrollToSection"
            >
              <a-menu-item key="executive-summary">
                <BulbOutlined />
                执行摘要
              </a-menu-item>
              <a-menu-item key="design-concept">
                <SketchOutlined />
                设计概念
              </a-menu-item>
              <a-menu-item key="technical-solution">
                <ToolOutlined />
                技术方案
              </a-menu-item>
              <a-menu-item key="marketing-strategy">
                <TrophyOutlined />
                营销策略
              </a-menu-item>
              <a-menu-item key="implementation-plan">
                <ProjectOutlined />
                实施计划
              </a-menu-item>
              <a-menu-item key="risk-assessment">
                <ExclamationCircleOutlined />
                风险评估
              </a-menu-item>
            </a-menu>
          </div>
        </a-affix>
      </div>

      <!-- 报告内容 -->
      <div class="report-content">
        <!-- 执行摘要 -->
        <section id="executive-summary" class="report-section">
          <h2>
            <BulbOutlined />
            执行摘要
          </h2>
          <div class="section-content">
            <p class="summary-text">{{ report.executiveSummary }}</p>
          </div>
        </section>

        <!-- 设计概念 -->
        <section id="design-concept" class="report-section">
          <h2>
            <SketchOutlined />
            设计概念
          </h2>
          <div class="section-content">
            <a-row :gutter="24">
              <a-col :span="12">
                <div class="concept-item">
                  <h4>产品类型</h4>
                  <p>{{ report.designConcept.productType }}</p>
                </div>
                <div class="concept-item">
                  <h4>文化背景</h4>
                  <p>{{ report.designConcept.culturalBackground }}</p>
                </div>
                <div class="concept-item">
                  <h4>目标受众</h4>
                  <p>{{ report.designConcept.targetAudience }}</p>
                </div>
              </a-col>
              <a-col :span="12">
                <div class="concept-item">
                  <h4>设计元素</h4>
                  <a-tag
                    v-for="element in report.designConcept.designElements"
                    :key="element"
                    color="blue"
                    class="element-tag"
                  >
                    {{ element }}
                  </a-tag>
                </div>
                <div class="concept-item">
                  <h4>视觉描述</h4>
                  <p>{{ report.designConcept.visualDescription }}</p>
                </div>
              </a-col>
            </a-row>
          </div>
        </section>

        <!-- 技术方案 -->
        <section id="technical-solution" class="report-section">
          <h2>
            <ToolOutlined />
            技术方案
          </h2>
          <div class="section-content">
            <a-row :gutter="24">
              <a-col :span="8">
                <div class="tech-item">
                  <h4>材料清单</h4>
                  <ul>
                    <li v-for="material in report.technicalSolution.materials" :key="material">
                      {{ material }}
                    </li>
                  </ul>
                </div>
              </a-col>
              <a-col :span="8">
                <div class="tech-item">
                  <h4>生产流程</h4>
                  <a-steps direction="vertical" size="small" :current="report.technicalSolution.productionProcess.length">
                    <a-step
                      v-for="(process, index) in report.technicalSolution.productionProcess"
                      :key="index"
                      :title="process"
                    />
                  </a-steps>
                </div>
              </a-col>
              <a-col :span="8">
                <div class="tech-item">
                  <h4>质量标准</h4>
                  <ul>
                    <li v-for="standard in report.technicalSolution.qualityStandards" :key="standard">
                      {{ standard }}
                    </li>
                  </ul>
                </div>
              </a-col>
            </a-row>

            <!-- 成本估算 -->
            <div class="cost-estimation">
              <h4>成本估算</h4>
              <a-row :gutter="16">
                <a-col :span="6">
                  <a-statistic
                    title="材料成本"
                    :value="report.technicalSolution.costEstimation.materials"
                    :suffix="report.technicalSolution.costEstimation.currency"
                  />
                </a-col>
                <a-col :span="6">
                  <a-statistic
                    title="人工成本"
                    :value="report.technicalSolution.costEstimation.labor"
                    :suffix="report.technicalSolution.costEstimation.currency"
                  />
                </a-col>
                <a-col :span="6">
                  <a-statistic
                    title="管理费用"
                    :value="report.technicalSolution.costEstimation.overhead"
                    :suffix="report.technicalSolution.costEstimation.currency"
                  />
                </a-col>
                <a-col :span="6">
                  <a-statistic
                    title="总成本"
                    :value="report.technicalSolution.costEstimation.total"
                    :suffix="report.technicalSolution.costEstimation.currency"
                    :value-style="{ color: '#cf1322' }"
                  />
                </a-col>
              </a-row>
            </div>

            <!-- 生产时间线 -->
            <div class="production-timeline">
              <h4>生产时间线 (总计: {{ report.technicalSolution.timeline.totalDuration }} {{ getTimelineUnit(report.technicalSolution.timeline.unit) }})</h4>
              <a-timeline>
                <a-timeline-item
                  v-for="phase in report.technicalSolution.timeline.phases"
                  :key="phase.name"
                  :color="getTimelineColor(phase)"
                >
                  <template #dot>
                    <ClockCircleOutlined />
                  </template>
                  <div class="timeline-content">
                    <h5>{{ phase.name }}</h5>
                    <p>持续时间: {{ phase.duration }} {{ getTimelineUnit(report.technicalSolution.timeline.unit) }}</p>
                    <p v-if="phase.dependencies.length">依赖: {{ phase.dependencies.join(', ') }}</p>
                  </div>
                </a-timeline-item>
              </a-timeline>
            </div>
          </div>
        </section>

        <!-- 营销策略 -->
        <section id="marketing-strategy" class="report-section">
          <h2>
            <TrophyOutlined />
            营销策略
          </h2>
          <div class="section-content">
            <div class="positioning">
              <h4>定位声明</h4>
              <a-alert
                :message="report.marketingStrategy.positioningStatement"
                type="info"
                show-icon
                class="positioning-alert"
              />
            </div>

            <!-- 营销渠道 -->
            <div class="marketing-channels">
              <h4>营销渠道</h4>
              <a-row :gutter="16">
                <a-col
                  v-for="channel in report.marketingStrategy.channels"
                  :key="channel.name"
                  :span="6"
                >
                  <a-card size="small" :title="channel.name">
                    <p><strong>类型:</strong> {{ getChannelTypeLabel(channel.type) }}</p>
                    <p><strong>预算:</strong> {{ channel.budget }} {{ report.marketingStrategy.budget.currency }}</p>
                    <p><strong>预期覆盖:</strong> {{ channel.expectedReach.toLocaleString() }} 人</p>
                  </a-card>
                </a-col>
              </a-row>
            </div>

            <!-- 营销活动 -->
            <div class="marketing-campaigns">
              <h4>营销活动</h4>
              <a-table
                :dataSource="report.marketingStrategy.campaigns"
                :columns="campaignColumns"
                :pagination="false"
                size="small"
              />
            </div>

            <!-- 预算分配 -->
            <div class="budget-breakdown">
              <h4>预算分配</h4>
              <a-row :gutter="16">
                <a-col :span="12">
                  <div class="budget-chart">
                    <!-- 这里可以集成图表库显示饼图 -->
                    <a-descriptions :column="1" bordered size="small">
                      <a-descriptions-item label="广告费用">
                        {{ report.marketingStrategy.budget.breakdown.advertising }} {{ report.marketingStrategy.budget.currency }}
                      </a-descriptions-item>
                      <a-descriptions-item label="内容制作">
                        {{ report.marketingStrategy.budget.breakdown.content }} {{ report.marketingStrategy.budget.currency }}
                      </a-descriptions-item>
                      <a-descriptions-item label="活动费用">
                        {{ report.marketingStrategy.budget.breakdown.events }} {{ report.marketingStrategy.budget.currency }}
                      </a-descriptions-item>
                      <a-descriptions-item label="其他费用">
                        {{ report.marketingStrategy.budget.breakdown.other }} {{ report.marketingStrategy.budget.currency }}
                      </a-descriptions-item>
                    </a-descriptions>
                  </div>
                </a-col>
                <a-col :span="12">
                  <a-statistic
                    title="总营销预算"
                    :value="report.marketingStrategy.budget.total"
                    :suffix="report.marketingStrategy.budget.currency"
                    :value-style="{ color: '#3f8600', fontSize: '24px' }"
                  />
                  <div class="kpis">
                    <h5>关键绩效指标 (KPIs)</h5>
                    <ul>
                      <li v-for="kpi in report.marketingStrategy.kpis" :key="kpi">
                        {{ kpi }}
                      </li>
                    </ul>
                  </div>
                </a-col>
              </a-row>
            </div>
          </div>
        </section>

        <!-- 实施计划 -->
        <section id="implementation-plan" class="report-section">
          <h2>
            <ProjectOutlined />
            实施计划
          </h2>
          <div class="section-content">
            <div class="plan-overview">
              <a-statistic
                title="总实施周期"
                :value="report.implementationPlan.totalDuration"
                suffix="天"
                :value-style="{ color: '#1890ff' }"
              />
            </div>

            <!-- 实施阶段 -->
            <div class="implementation-phases">
              <h4>实施阶段</h4>
              <a-collapse>
                <a-collapse-panel
                  v-for="(phase, index) in report.implementationPlan.phases"
                  :key="index"
                  :header="`阶段 ${index + 1}: ${phase.name} (${phase.duration}天)`"
                >
                  <p><strong>描述:</strong> {{ phase.description }}</p>
                  <div class="phase-tasks">
                    <h5>任务清单</h5>
                    <a-checkbox-group :value="[]" disabled>
                      <div v-for="task in phase.tasks" :key="task" class="task-item">
                        <a-checkbox :value="task">{{ task }}</a-checkbox>
                      </div>
                    </a-checkbox-group>
                  </div>
                  <div v-if="phase.dependencies.length" class="phase-dependencies">
                    <h5>依赖关系</h5>
                    <a-tag v-for="dep in phase.dependencies" :key="dep" color="orange">
                      {{ dep }}
                    </a-tag>
                  </div>
                </a-collapse-panel>
              </a-collapse>
            </div>

            <!-- 资源需求 -->
            <div class="resource-requirements">
              <h4>资源需求</h4>
              <a-table
                :dataSource="report.implementationPlan.resources"
                :columns="resourceColumns"
                :pagination="false"
                size="small"
              />
            </div>

            <!-- 里程碑 -->
            <div class="milestones">
              <h4>关键里程碑</h4>
              <a-timeline>
                <a-timeline-item
                  v-for="milestone in report.implementationPlan.milestones"
                  :key="milestone.name"
                  color="green"
                >
                  <template #dot>
                    <FlagOutlined />
                  </template>
                  <div class="milestone-content">
                    <h5>{{ milestone.name }}</h5>
                    <p><strong>截止日期:</strong> {{ formatDate(milestone.dueDate) }}</p>
                    <p><strong>描述:</strong> {{ milestone.description }}</p>
                    <div class="deliverables">
                      <strong>交付物:</strong>
                      <a-tag v-for="deliverable in milestone.deliverables" :key="deliverable" color="blue">
                        {{ deliverable }}
                      </a-tag>
                    </div>
                  </div>
                </a-timeline-item>
              </a-timeline>
            </div>
          </div>
        </section>

        <!-- 风险评估 -->
        <section id="risk-assessment" class="report-section">
          <h2>
            <ExclamationCircleOutlined />
            风险评估
          </h2>
          <div class="section-content">
            <div class="risk-overview">
              <a-alert
                :message="`整体风险等级: ${getRiskLevelLabel(report.riskAssessment.overallRiskLevel)}`"
                :type="getRiskAlertType(report.riskAssessment.overallRiskLevel)"
                show-icon
                class="risk-level-alert"
              />
            </div>

            <!-- 风险列表 -->
            <div class="risks-list">
              <h4>识别的风险</h4>
              <a-table
                :dataSource="report.riskAssessment.risks"
                :columns="riskColumns"
                :pagination="false"
                size="small"
              />
            </div>

            <!-- 缓解策略 -->
            <div class="mitigation-strategies">
              <h4>缓解策略</h4>
              <a-collapse>
                <a-collapse-panel
                  v-for="strategy in report.riskAssessment.mitigationStrategies"
                  :key="strategy.riskId"
                  :header="`风险 ${strategy.riskId} 的缓解策略`"
                >
                  <p><strong>策略:</strong> {{ strategy.strategy }}</p>
                  <p><strong>成本:</strong> {{ strategy.cost }} 元</p>
                  <p><strong>有效性评分:</strong> {{ strategy.effectiveness }}/10</p>
                  <a-progress
                    :percent="strategy.effectiveness * 10"
                    :stroke-color="getEffectivenessColor(strategy.effectiveness)"
                    size="small"
                  />
                </a-collapse-panel>
              </a-collapse>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import {
  CalendarOutlined,
  FileTextOutlined,
  ExportOutlined,
  DownOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileOutlined,
  BulbOutlined,
  SketchOutlined,
  ToolOutlined,
  TrophyOutlined,
  ProjectOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  FlagOutlined,
} from '@ant-design/icons-vue';
import type { FinalReport, MarketingChannel, MarketingCampaign, ResourceRequirement, Risk } from '@/types/brainstorm';

interface Props {
  report: FinalReport;
}

interface Emits {
  (e: 'export', format: 'pdf' | 'word' | 'html'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式状态
const selectedNavKeys = ref<string[]>(['executive-summary']);
const exporting = ref(false);

// 表格列定义
const campaignColumns = [
  { title: '活动名称', dataIndex: 'name', key: 'name' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '渠道', dataIndex: 'channels', key: 'channels', customRender: ({ text }: any) => text.join(', ') },
  { title: '预算', dataIndex: 'budget', key: 'budget', customRender: ({ text }: any) => `${text} 元` },
  { title: '持续时间', dataIndex: 'duration', key: 'duration', customRender: ({ text }: any) => `${text} 天` },
  { title: '预期ROI', dataIndex: 'expectedROI', key: 'expectedROI', customRender: ({ text }: any) => `${text}%` },
];

const resourceColumns = [
  { title: '类型', dataIndex: 'type', key: 'type', customRender: ({ text }: any) => getResourceTypeLabel(text) },
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '数量', dataIndex: 'quantity', key: 'quantity' },
  { title: '成本', dataIndex: 'cost', key: 'cost', customRender: ({ text }: any) => `${text} 元` },
];

const riskColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: '类别', dataIndex: 'category', key: 'category', customRender: ({ text }: any) => getRiskCategoryLabel(text) },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '概率', dataIndex: 'probability', key: 'probability', customRender: ({ text }: any) => getRiskLevelLabel(text) },
  { title: '影响', dataIndex: 'impact', key: 'impact', customRender: ({ text }: any) => getRiskLevelLabel(text) },
  { title: '严重程度', dataIndex: 'severity', key: 'severity', customRender: ({ text }: any) => `${text}/10` },
];

// 方法
const handleExport = () => {
  emit('export', 'pdf');
};

const handleExportFormat = ({ key }: { key: string }) => {
  emit('export', key as 'pdf' | 'word' | 'html');
};

const scrollToSection = ({ key }: { key: string }) => {
  const element = document.getElementById(key);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    selectedNavKeys.value = [key];
  }
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

const getTimelineUnit = (unit: string): string => {
  const units: Record<string, string> = {
    days: '天',
    weeks: '周',
    months: '月',
  };
  return units[unit] || unit;
};

const getTimelineColor = (phase: any): string => {
  const colors = ['blue', 'green', 'orange', 'red', 'purple'];
  return colors[Math.abs(phase.name.length) % colors.length];
};

const getChannelTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    digital: '数字化',
    traditional: '传统媒体',
    social: '社交媒体',
    direct: '直接营销',
  };
  return labels[type] || type;
};

const getResourceTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    human: '人力资源',
    equipment: '设备',
    material: '材料',
    financial: '资金',
  };
  return labels[type] || type;
};

const getRiskCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    technical: '技术风险',
    market: '市场风险',
    financial: '财务风险',
    operational: '运营风险',
  };
  return labels[category] || category;
};

const getRiskLevelLabel = (level: string): string => {
  const labels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
  };
  return labels[level] || level;
};

const getRiskAlertType = (level: string): string => {
  const types: Record<string, string> = {
    low: 'success',
    medium: 'warning',
    high: 'error',
  };
  return types[level] || 'info';
};

const getEffectivenessColor = (effectiveness: number): string => {
  if (effectiveness >= 8) return '#52c41a';
  if (effectiveness >= 6) return '#faad14';
  if (effectiveness >= 4) return '#fa8c16';
  return '#f5222d';
};

// 监听滚动事件，更新导航选中状态
onMounted(() => {
  const handleScroll = () => {
    const sections = ['executive-summary', 'design-concept', 'technical-solution', 'marketing-strategy', 'implementation-plan', 'risk-assessment'];
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    for (let i = sections.length - 1; i >= 0; i--) {
      const element = document.getElementById(sections[i]);
      if (element && element.offsetTop <= scrollTop + 100) {
        selectedNavKeys.value = [sections[i]];
        break;
      }
    }
  };

  window.addEventListener('scroll', handleScroll);
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
});
</script>

<style scoped lang="scss">
.result-report {
  .report-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    background: #fff;
    min-height: 100vh;
  }

  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 2px solid #f0f0f0;

    .header-content {
      flex: 1;

      .report-title {
        margin: 0 0 16px 0;
        font-size: 28px;
        font-weight: 700;
        color: #262626;
        line-height: 1.3;
      }

      .report-meta {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;

        .ant-tag {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
      flex-shrink: 0;
    }
  }

  .report-navigation {
    position: fixed;
    left: 24px;
    top: 50%;
    transform: translateY(-50%);
    width: 200px;
    z-index: 100;

    .nav-container {
      background: #fff;
      border: 1px solid #d9d9d9;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #262626;
      }

      .ant-menu-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        height: 32px;
        line-height: 32px;
      }
    }
  }

  .report-content {
    margin-left: 240px;
    padding-left: 24px;

    .report-section {
      margin-bottom: 48px;
      scroll-margin-top: 80px;

      h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0 0 24px 0;
        font-size: 24px;
        font-weight: 600;
        color: #262626;
        padding-bottom: 12px;
        border-bottom: 2px solid #1890ff;
      }

      .section-content {
        h4 {
          margin: 24px 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #262626;
        }

        h5 {
          margin: 16px 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #595959;
        }

        p {
          margin-bottom: 12px;
          line-height: 1.6;
          color: #595959;
        }

        ul {
          margin: 8px 0;
          padding-left: 20px;

          li {
            margin-bottom: 4px;
            line-height: 1.5;
            color: #595959;
          }
        }
      }
    }
  }

  // 特定组件样式
  .summary-text {
    font-size: 16px;
    line-height: 1.8;
    color: #262626;
    background: #f6ffed;
    padding: 20px;
    border-radius: 8px;
    border-left: 4px solid #52c41a;
  }

  .concept-item {
    margin-bottom: 20px;

    h4 {
      margin-bottom: 8px !important;
      color: #1890ff;
    }

    .element-tag {
      margin: 4px 4px 4px 0;
    }
  }

  .tech-item {
    h4 {
      margin-bottom: 12px !important;
      color: #722ed1;
    }

    ul {
      background: #fafafa;
      padding: 12px 20px;
      border-radius: 6px;
    }
  }

  .cost-estimation {
    margin: 32px 0;
    padding: 20px;
    background: #f0f9ff;
    border-radius: 8px;
    border: 1px solid #bae7ff;
  }

  .production-timeline {
    margin: 32px 0;

    .timeline-content {
      h5 {
        margin: 0 0 4px 0 !important;
        color: #262626;
      }

      p {
        margin: 2px 0;
        font-size: 13px;
      }
    }
  }

  .positioning-alert {
    margin: 16px 0;
    font-size: 15px;
  }

  .marketing-channels {
    margin: 32px 0;
  }

  .marketing-campaigns {
    margin: 32px 0;
  }

  .budget-breakdown {
    margin: 32px 0;

    .budget-chart {
      background: #fafafa;
      padding: 16px;
      border-radius: 8px;
    }

    .kpis {
      margin-top: 20px;

      ul {
        background: #f6ffed;
        padding: 12px 20px;
        border-radius: 6px;
        border-left: 4px solid #52c41a;
      }
    }
  }

  .plan-overview {
    margin-bottom: 32px;
    text-align: center;
  }

  .implementation-phases {
    margin: 32px 0;

    .task-item {
      margin: 8px 0;
    }

    .phase-dependencies {
      margin-top: 16px;
    }
  }

  .resource-requirements {
    margin: 32px 0;
  }

  .milestones {
    margin: 32px 0;

    .milestone-content {
      h5 {
        margin: 0 0 8px 0 !important;
        color: #262626;
      }

      .deliverables {
        margin-top: 8px;

        .ant-tag {
          margin: 2px 4px 2px 0;
        }
      }
    }
  }

  .risk-level-alert {
    margin-bottom: 24px;
    font-size: 16px;
  }

  .risks-list {
    margin: 32px 0;
  }

  .mitigation-strategies {
    margin: 32px 0;
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .result-report {
    .report-navigation {
      display: none;
    }

    .report-content {
      margin-left: 0;
      padding-left: 0;
    }
  }
}

@media (max-width: 768px) {
  .result-report {
    .report-container {
      padding: 16px;
    }

    .report-header {
      flex-direction: column;
      gap: 16px;

      .header-actions {
        width: 100%;
        justify-content: flex-start;
      }
    }

    .report-content {
      .report-section {
        h2 {
          font-size: 20px;
        }
      }
    }
  }
}

// 打印样式
@media print {
  .result-report {
    .report-navigation {
      display: none;
    }

    .report-header {
      .header-actions {
        display: none;
      }
    }

    .report-content {
      margin-left: 0;
      padding-left: 0;
    }
  }
}
</style>