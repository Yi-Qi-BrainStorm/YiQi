import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AgentResultCard from '../AgentResultCard.vue';
import type { AgentResult } from '@/types/agent';

// Mock ant-design-vue message
vi.mock('ant-design-vue', async () => {
  const actual = await vi.importActual('ant-design-vue');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

describe('AgentResultCard', () => {
  const mockResult: AgentResult = {
    agentId: 1,
    agentName: '设计师',
    agentRole: 'UI/UX Designer',
    content: '这是一个详细的设计分析结果，包含了多个方面的建议和分析。内容比较长，用于测试展开和折叠功能。',
    processingTime: 5000,
    createdAt: '2024-01-01T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('should render agent result card correctly', () => {
    const wrapper = mount(AgentResultCard, {
      props: {
        result: mockResult,
      },
    });

    expect(wrapper.find('.agent-result-card').exists()).toBe(true);
    expect(wrapper.text()).toContain('设计师');
    expect(wrapper.text()).toContain('UI/UX Designer');
    expect(wrapper.text()).toContain('处理时间: 5.0s');
  });

  it('should show content preview when collapsed', () => {
    const wrapper = mount(AgentResultCard, {
      props: {
        result: mockResult,
        defaultExpanded: false,
      },
    });

    expect(wrapper.find('.content-preview').exists()).toBe(true);
    expect(wrapper.find('.content-full').exists()).toBe(false);
    expect(wrapper.text()).toContain('查看完整内容');
  });

  it('should show full content when expanded', () => {
    const wrapper = mount(AgentResultCard, {
      props: {
        result: mockResult,
        defaultExpanded: true,
      },
    });

    expect(wrapper.find('.content-full').exists()).toBe(true);
    expect(wrapper.find('.content-preview').exists()).toBe(false);
    expect(wrapper.text()).toContain('分析结果');
  });

  it('should toggle expanded state when toggle button is clicked', async () => {
    const wrapper = mount(AgentResultCard, {
      props: {
        result: mockResult,
        defaultExpanded: false,
      },
    });

    // Initially collapsed
    expect(wrapper.find('.content-preview').exists()).toBe(true);

    // Click toggle button
    await wrapper.find('[data-testid="toggle-expand-button"]').trigger('click');

    // Should be expanded now
    expect(wrapper.find('.content-full').exists()).toBe(true);
  });

  it('should emit save event when save button is clicked', async () => {
    const wrapper = mount(AgentResultCard, {
      props: {
        result: mockResult,
      },
    });

    await wrapper.find('[data-testid="save-button"]').trigger('click');

    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.emitted('save')?.[0]).toEqual([mockResult]);
  });

  it('should copy content to clipboard when copy button is clicked', async () => {
    const wrapper = mount(AgentResultCard, {
      props: {
        result: mockResult,
      },
    });

    await wrapper.find('[data-testid="copy-button"]').trigger('click');

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockResult.content);
  });

  it('should emit export event when export button is clicked', async () => {
    const wrapper = mount(AgentResultCard, {
      props: {
        result: mockResult,
        defaultExpanded: true,
      },
    });

    await wrapper.find('.ant-btn:contains("导出")').trigger('click');

    expect(wrapper.emitted('export')).toBeTruthy();
    expect(wrapper.emitted('export')?.[0]).toEqual([mockResult]);
  });

  it('should emit share event when share button is clicked', async () => {
    const wrapper = mount(AgentResultCard, {
      props: {
        result: mockResult,
        defaultExpanded: true,
      },
    });

    await wrapper.find('.ant-btn:contains("分享")').trigger('click');

    expect(wrapper.emitted('share')).toBeTruthy();
    expect(wrapper.emitted('share')?.[0]).toEqual([mockResult]);
  });

  it('should format processing time correctly', () => {
    const wrapper = mount(AgentResultCard, {
      props: {
        result: {
          ...mockResult,
          processingTime: 1500, // 1.5 seconds
        },
      },
    });

    expect(wrapper.text()).toContain('处理时间: 1.5s');
  });

  it('should format processing time in minutes for long durations', () => {
    const wrapper = mount(AgentResultCard, {
      props: {
        result: {
          ...mockResult,
          processingTime: 90000, // 1.5 minutes
        },
      },
    });

    expect(wrapper.text()).toContain('处理时间: 1.5min');
  });

  it('should show agent initials in avatar', () => {
    const wrapper = mount(AgentResultCard, {
      props: {
        result: {
          ...mockResult,
          agentName: 'UI UX Designer',
        },
      },
    });

    expect(wrapper.find('.ant-avatar').text()).toBe('UU');
  });

  it('should handle structured data in content', () => {
    const structuredResult = {
      ...mockResult,
      content: JSON.stringify({
        suggestions: ['建议1', '建议2'],
        confidence: 85,
      }),
    };

    const wrapper = mount(AgentResultCard, {
      props: {
        result: structuredResult,
        defaultExpanded: true,
      },
    });

    expect(wrapper.text()).toContain('建议要点');
    expect(wrapper.text()).toContain('置信度');
  });
});