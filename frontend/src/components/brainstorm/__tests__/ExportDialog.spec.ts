import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ExportDialog from '../ExportDialog.vue';
import type { FinalReport } from '@/types/brainstorm';

// Mock the useExport composable
vi.mock('@/composables/useExport', () => ({
  useExport: () => ({
    exporting: vi.fn().mockReturnValue(false),
    availableTemplates: vi.fn().mockReturnValue([
      {
        name: 'default',
        description: '默认模板',
        styles: '',
        layout: 'single-column',
      },
    ]),
    exportReport: vi.fn().mockResolvedValue({ success: true }),
    exportMultipleFormats: vi.fn().mockResolvedValue([]),
    previewExport: vi.fn().mockResolvedValue({ success: true }),
    getFileExtension: vi.fn().mockReturnValue('pdf'),
    getFormatDisplayName: vi.fn().mockReturnValue('PDF文档'),
    validateReportData: vi.fn().mockReturnValue({ valid: true, errors: [] }),
  }),
}));

describe('ExportDialog', () => {
  const mockReport: FinalReport = {
    sessionId: 1,
    topic: '智能手环设计',
    executiveSummary: '这是一个智能手环的设计方案',
    designConcept: {
      productType: '智能穿戴设备',
      culturalBackground: '现代科技文化',
      designElements: ['简约', '科技感'],
      visualDescription: '简洁的圆形设计',
      targetAudience: '年轻人群',
    },
    technicalSolution: {
      materials: ['硅胶', '铝合金'],
      productionProcess: ['设计', '制造', '测试'],
      qualityStandards: ['ISO9001'],
      costEstimation: {
        materials: 100,
        labor: 200,
        overhead: 50,
        total: 350,
        currency: 'CNY',
      },
      timeline: {
        phases: [
          {
            name: '设计阶段',
            duration: 30,
            dependencies: [],
          },
        ],
        totalDuration: 90,
        unit: 'days',
      },
    },
    marketingStrategy: {
      positioningStatement: '面向年轻人的智能手环',
      channels: [
        {
          name: '线上渠道',
          type: 'digital',
          budget: 10000,
          expectedReach: 100000,
        },
      ],
      campaigns: [
        {
          name: '新品发布',
          description: '新品发布活动',
          channels: ['线上'],
          budget: 5000,
          duration: 7,
          expectedROI: 200,
        },
      ],
      budget: {
        total: 20000,
        breakdown: {
          advertising: 10000,
          content: 5000,
          events: 3000,
          other: 2000,
        },
        currency: 'CNY',
      },
      kpis: ['转化率', '品牌知名度'],
    },
    implementationPlan: {
      phases: [
        {
          name: '第一阶段',
          description: '产品设计',
          duration: 30,
          tasks: ['需求分析', '概念设计'],
          dependencies: [],
        },
      ],
      resources: [
        {
          type: 'human',
          name: '设计师',
          quantity: 2,
          cost: 20000,
        },
      ],
      milestones: [
        {
          name: '设计完成',
          description: '完成产品设计',
          dueDate: '2024-03-01',
          deliverables: ['设计稿'],
        },
      ],
      totalDuration: 90,
    },
    riskAssessment: {
      risks: [
        {
          id: 'R001',
          category: 'technical',
          description: '技术实现风险',
          probability: 'medium',
          impact: 'high',
          severity: 7,
        },
      ],
      mitigationStrategies: [
        {
          riskId: 'R001',
          strategy: '技术预研',
          cost: 5000,
          effectiveness: 8,
        },
      ],
      overallRiskLevel: 'medium',
    },
    generatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render export dialog correctly', () => {
    const wrapper = mount(ExportDialog, {
      props: {
        open: true,
        report: mockReport,
      },
    });

    expect(wrapper.find('.export-dialog').exists()).toBe(true);
    expect(wrapper.text()).toContain('选择导出格式');
    expect(wrapper.text()).toContain('PDF文档');
    expect(wrapper.text()).toContain('Word文档');
    expect(wrapper.text()).toContain('HTML网页');
  });

  it('should show template selection', () => {
    const wrapper = mount(ExportDialog, {
      props: {
        open: true,
        report: mockReport,
      },
    });

    expect(wrapper.text()).toContain('选择模板样式');
  });

  it('should show export options', () => {
    const wrapper = mount(ExportDialog, {
      props: {
        open: true,
        report: mockReport,
      },
    });

    expect(wrapper.text()).toContain('导出选项');
    expect(wrapper.text()).toContain('包含图表和统计数据');
    expect(wrapper.text()).toContain('包含完整内容');
  });

  it('should show file name input', () => {
    const wrapper = mount(ExportDialog, {
      props: {
        open: true,
        report: mockReport,
      },
    });

    expect(wrapper.text()).toContain('文件名设置');
    expect(wrapper.find('input[placeholder="输入文件名"]').exists()).toBe(true);
  });

  it('should show batch export options', () => {
    const wrapper = mount(ExportDialog, {
      props: {
        open: true,
        report: mockReport,
      },
    });

    expect(wrapper.text()).toContain('批量导出');
  });

  it('should emit update:open when cancelled', async () => {
    const wrapper = mount(ExportDialog, {
      props: {
        open: true,
        report: mockReport,
      },
    });

    await wrapper.find('.ant-btn:contains("取消")').trigger('click');
    expect(wrapper.emitted('update:open')).toBeTruthy();
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
  });
});