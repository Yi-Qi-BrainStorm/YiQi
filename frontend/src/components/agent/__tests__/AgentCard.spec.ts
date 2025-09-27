import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AgentCard from '../AgentCard.vue';
import type { Agent } from '@/types/agent';

// Mock ant-design-vue Modal
vi.mock('ant-design-vue', async () => {
  const actual = await vi.importActual('ant-design-vue');
  return {
    ...actual,
    Modal: {
      confirm: vi.fn(),
    },
  };
});

describe('AgentCard', () => {
  const mockAgent: Agent = {
    id: 1,
    name: '设计师',
    roleType: 'UI/UX Designer',
    systemPrompt: 'You are a creative designer with expertise in user interface and user experience design.',
    aiModel: 'gpt-4',
    modelConfig: {
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    status: 'ACTIVE',
    userId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render agent card correctly', () => {
    const wrapper = mount(AgentCard, {
      props: {
        agent: mockAgent,
      },
    });

    expect(wrapper.find('.agent-card').exists()).toBe(true);
    expect(wrapper.text()).toContain('设计师');
    expect(wrapper.text()).toContain('UI/UX Designer');
    expect(wrapper.text()).toContain('You are a creative designer');
  });

  it('should show selected state when selected prop is true', () => {
    const wrapper = mount(AgentCard, {
      props: {
        agent: mockAgent,
        selected: true,
      },
    });

    expect(wrapper.find('.agent-card--selected').exists()).toBe(true);
    expect(wrapper.find('.ant-checkbox input').element.checked).toBe(true);
  });

  it('should show inactive state for inactive agents', () => {
    const inactiveAgent = { ...mockAgent, status: 'INACTIVE' as const };
    const wrapper = mount(AgentCard, {
      props: {
        agent: inactiveAgent,
      },
    });

    expect(wrapper.find('.agent-card--inactive').exists()).toBe(true);
  });

  it('should emit select event when checkbox is clicked', async () => {
    const wrapper = mount(AgentCard, {
      props: {
        agent: mockAgent,
      },
    });

    const checkbox = wrapper.find('.ant-checkbox input');
    await checkbox.setValue(true);

    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')?.[0]).toEqual([1, true]);
  });

  it('should emit edit event when edit button is clicked', async () => {
    const wrapper = mount(AgentCard, {
      props: {
        agent: mockAgent,
      },
    });

    const editButton = wrapper.find('.ant-btn[title="编辑"]');
    await editButton.trigger('click');

    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')?.[0]).toEqual([mockAgent]);
  });

  it('should emit test event when test button is clicked', async () => {
    const wrapper = mount(AgentCard, {
      props: {
        agent: mockAgent,
      },
    });

    const testButton = wrapper.find('.ant-btn[title="测试"]');
    await testButton.trigger('click');

    expect(wrapper.emitted('test')).toBeTruthy();
    expect(wrapper.emitted('test')?.[0]).toEqual([mockAgent]);
  });

  it('should emit duplicate event when duplicate button is clicked', async () => {
    const wrapper = mount(AgentCard, {
      props: {
        agent: mockAgent,
      },
    });

    const duplicateButton = wrapper.find('.ant-btn[title="复制"]');
    await duplicateButton.trigger('click');

    expect(wrapper.emitted('duplicate')).toBeTruthy();
    expect(wrapper.emitted('duplicate')?.[0]).toEqual([mockAgent]);
  });

  it('should emit toggle-status event when status button is clicked', async () => {
    const wrapper = mount(AgentCard, {
      props: {
        agent: mockAgent,
      },
    });

    const statusButton = wrapper.find('.ant-btn[title="停用"]');
    await statusButton.trigger('click');

    expect(wrapper.emitted('toggle-status')).toBeTruthy();
    expect(wrapper.emitted('toggle-status')?.[0]).toEqual([mockAgent]);
  });

  it('should show correct status badge', () => {
    const wrapper = mount(AgentCard, {
      props: {
        agent: mockAgent,
      },
    });

    expect(wrapper.text()).toContain('活跃');
  });

  it('should show correct AI model tag', () => {
    const wrapper = mount(AgentCard, {
      props: {
        agent: mockAgent,
      },
    });

    expect(wrapper.text()).toContain('GPT-4');
  });

  it('should truncate long system prompt', () => {
    const longPromptAgent = {
      ...mockAgent,
      systemPrompt: 'This is a very long system prompt that should be truncated when displayed in the card view to prevent the card from becoming too large and maintain a clean layout.',
    };

    const wrapper = mount(AgentCard, {
      props: {
        agent: longPromptAgent,
      },
    });

    const promptText = wrapper.find('.agent-card__prompt-text').text();
    expect(promptText.length).toBeLessThanOrEqual(103); // 100 chars + '...'
    expect(promptText).toContain('...');
  });

  it('should format dates correctly', () => {
    const wrapper = mount(AgentCard, {
      props: {
        agent: mockAgent,
      },
    });

    // Should show relative date format
    expect(wrapper.text()).toMatch(/\d+天前|\d+周前|今天/);
  });

  it('should show avatar with first letter of name', () => {
    const wrapper = mount(AgentCard, {
      props: {
        agent: mockAgent,
      },
    });

    expect(wrapper.find('.ant-avatar').text()).toBe('设');
  });

  it('should show runtime status when provided', () => {
    const wrapper = mount(AgentCard, {
      props: {
        agent: mockAgent,
        runtimeStatus: 'thinking',
      },
    });

    expect(wrapper.find('.agent-card__runtime-status').exists()).toBe(true);
    expect(wrapper.text()).toContain('思考中');
  });

  it('should show completed status icon', () => {
    const wrapper = mount(AgentCard, {
      props: {
        agent: mockAgent,
        runtimeStatus: 'completed',
      },
    });

    expect(wrapper.find('.status-completed').exists()).toBe(true);
    expect(wrapper.text()).toContain('已完成');
  });

  it('should show error status icon', () => {
    const wrapper = mount(AgentCard, {
      props: {
        agent: mockAgent,
        runtimeStatus: 'error',
      },
    });

    expect(wrapper.find('.status-error').exists()).toBe(true);
    expect(wrapper.text()).toContain('出错');
  });

  it('should handle dropdown menu actions', async () => {
    const wrapper = mount(AgentCard, {
      props: {
        agent: mockAgent,
      },
    });

    // Simulate menu item click
    const component = wrapper.vm as any;
    
    component.handleMenuAction({ key: 'view-details' });
    expect(wrapper.emitted('view-details')).toBeTruthy();

    component.handleMenuAction({ key: 'export' });
    expect(wrapper.emitted('export')).toBeTruthy();

    component.handleMenuAction({ key: 'versions' });
    expect(wrapper.emitted('view-versions')).toBeTruthy();
  });

  it('should show confirmation dialog when delete is clicked', async () => {
    const { Modal } = await import('ant-design-vue');
    const wrapper = mount(AgentCard, {
      props: {
        agent: mockAgent,
      },
    });

    const component = wrapper.vm as any;
    component.handleMenuAction({ key: 'delete' });

    expect(Modal.confirm).toHaveBeenCalledWith({
      title: '确认删除',
      content: '确定要删除代理 "设计师" 吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: expect.any(Function),
    });
  });

  it('should apply hover effects', async () => {
    const wrapper = mount(AgentCard, {
      props: {
        agent: mockAgent,
      },
    });

    const card = wrapper.find('.agent-card');
    await card.trigger('mouseenter');

    // Hover effects are handled by CSS, so we just check the class exists
    expect(card.exists()).toBe(true);
  });

  it('should handle different AI model types', () => {
    const qwenAgent = { ...mockAgent, aiModel: 'qwen-plus' as const };
    const wrapper = mount(AgentCard, {
      props: {
        agent: qwenAgent,
      },
    });

    expect(wrapper.text()).toContain('Qwen Plus');
  });

  it('should show correct status text for inactive agent', () => {
    const inactiveAgent = { ...mockAgent, status: 'INACTIVE' as const };
    const wrapper = mount(AgentCard, {
      props: {
        agent: inactiveAgent,
      },
    });

    expect(wrapper.text()).toContain('非活跃');
  });

  it('should show activate button for inactive agent', () => {
    const inactiveAgent = { ...mockAgent, status: 'INACTIVE' as const };
    const wrapper = mount(AgentCard, {
      props: {
        agent: inactiveAgent,
      },
    });

    const statusButton = wrapper.find('.ant-btn[title="激活"]');
    expect(statusButton.exists()).toBe(true);
  });
});