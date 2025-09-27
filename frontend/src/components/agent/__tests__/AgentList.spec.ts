import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AgentList from '../AgentList.vue';
import type { Agent } from '@/types/agent';

describe('AgentList', () => {
  const mockAgents: Agent[] = [
    {
      id: 1,
      name: '设计师',
      roleType: 'UI/UX Designer',
      systemPrompt: 'You are a creative designer...',
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
    },
    {
      id: 2,
      name: '市场分析师',
      roleType: 'Market Analyst',
      systemPrompt: 'You are a market research expert...',
      aiModel: 'gpt-3.5-turbo',
      modelConfig: {
        temperature: 0.5,
        maxTokens: 1500,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
      },
      status: 'ACTIVE',
      userId: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render agent list correctly', () => {
    const wrapper = mount(AgentList, {
      props: {
        agents: mockAgents,
      },
    });

    expect(wrapper.find('.agent-list').exists()).toBe(true);
    expect(wrapper.findAll('.agent-card')).toHaveLength(2);
  });

  it('should show empty state when no agents', () => {
    const wrapper = mount(AgentList, {
      props: {
        agents: [],
      },
    });

    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.text()).toContain('暂无代理');
    expect(wrapper.text()).toContain('创建您的第一个AI代理');
  });

  it('should show loading state', () => {
    const wrapper = mount(AgentList, {
      props: {
        agents: [],
        loading: true,
      },
    });

    expect(wrapper.find('.ant-spin').exists()).toBe(true);
  });

  it('should emit create-new event when create button is clicked', async () => {
    const wrapper = mount(AgentList, {
      props: {
        agents: [],
      },
    });

    const createButton = wrapper.find('.ant-btn:contains("创建代理")');
    await createButton.trigger('click');

    expect(wrapper.emitted('create-new')).toBeTruthy();
  });

  it('should filter agents by search term', async () => {
    const wrapper = mount(AgentList, {
      props: {
        agents: mockAgents,
      },
    });

    const searchInput = wrapper.find('.ant-input');
    await searchInput.setValue('设计师');

    // Should show only the designer agent
    expect(wrapper.findAll('.agent-card')).toHaveLength(1);
    expect(wrapper.text()).toContain('设计师');
    expect(wrapper.text()).not.toContain('市场分析师');
  });

  it('should filter agents by status', async () => {
    const inactiveAgent = { ...mockAgents[0], status: 'INACTIVE' as const };
    const wrapper = mount(AgentList, {
      props: {
        agents: [...mockAgents, inactiveAgent],
      },
    });

    const statusFilter = wrapper.find('.ant-select');
    // Simulate selecting inactive status
    await statusFilter.trigger('click');
    
    // This would require more complex mocking of ant-design-vue Select component
    // For now, we'll test the filtering logic directly
    const component = wrapper.vm as any;
    component.statusFilter = 'INACTIVE';
    await wrapper.vm.$nextTick();

    expect(component.filteredAgents).toHaveLength(1);
    expect(component.filteredAgents[0].status).toBe('INACTIVE');
  });

  it('should filter agents by AI model', async () => {
    const wrapper = mount(AgentList, {
      props: {
        agents: mockAgents,
      },
    });

    const component = wrapper.vm as any;
    component.modelFilter = 'gpt-4';
    await wrapper.vm.$nextTick();

    expect(component.filteredAgents).toHaveLength(1);
    expect(component.filteredAgents[0].aiModel).toBe('gpt-4');
  });

  it('should sort agents by name', async () => {
    const wrapper = mount(AgentList, {
      props: {
        agents: mockAgents,
      },
    });

    const component = wrapper.vm as any;
    component.sortBy = 'name';
    component.sortOrder = 'asc';
    await wrapper.vm.$nextTick();

    const sortedAgents = component.filteredAgents;
    expect(sortedAgents[0].name).toBe('市场分析师');
    expect(sortedAgents[1].name).toBe('设计师');
  });

  it('should sort agents by creation date', async () => {
    const newerAgent = { ...mockAgents[0], createdAt: '2024-01-02T00:00:00Z' };
    const wrapper = mount(AgentList, {
      props: {
        agents: [mockAgents[0], newerAgent],
      },
    });

    const component = wrapper.vm as any;
    component.sortBy = 'createdAt';
    component.sortOrder = 'desc';
    await wrapper.vm.$nextTick();

    const sortedAgents = component.filteredAgents;
    expect(sortedAgents[0].createdAt).toBe('2024-01-02T00:00:00Z');
  });

  it('should handle agent selection', async () => {
    const wrapper = mount(AgentList, {
      props: {
        agents: mockAgents,
      },
    });

    const firstAgentCard = wrapper.findComponent({ name: 'AgentCard' });
    await firstAgentCard.vm.$emit('select', 1, true);

    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')?.[0]).toEqual([1, true]);
  });

  it('should handle select all functionality', async () => {
    const wrapper = mount(AgentList, {
      props: {
        agents: mockAgents,
      },
    });

    const selectAllCheckbox = wrapper.find('.select-all-checkbox');
    await selectAllCheckbox.trigger('change');

    expect(wrapper.emitted('select-all')).toBeTruthy();
  });

  it('should handle batch operations', async () => {
    const wrapper = mount(AgentList, {
      props: {
        agents: mockAgents,
        selectedAgents: [1, 2],
      },
    });

    const batchDeleteButton = wrapper.find('.batch-delete-btn');
    await batchDeleteButton.trigger('click');

    expect(wrapper.emitted('batch-delete')).toBeTruthy();
    expect(wrapper.emitted('batch-delete')?.[0]).toEqual([[1, 2]]);
  });

  it('should show batch operation bar when agents are selected', () => {
    const wrapper = mount(AgentList, {
      props: {
        agents: mockAgents,
        selectedAgents: [1],
      },
    });

    expect(wrapper.find('.batch-operations').exists()).toBe(true);
    expect(wrapper.text()).toContain('已选择 1 个代理');
  });

  it('should hide batch operation bar when no agents are selected', () => {
    const wrapper = mount(AgentList, {
      props: {
        agents: mockAgents,
        selectedAgents: [],
      },
    });

    expect(wrapper.find('.batch-operations').exists()).toBe(false);
  });

  it('should handle view mode toggle', async () => {
    const wrapper = mount(AgentList, {
      props: {
        agents: mockAgents,
      },
    });

    const listViewButton = wrapper.find('.view-mode-list');
    await listViewButton.trigger('click');

    expect(wrapper.find('.agent-list--list-view').exists()).toBe(true);

    const gridViewButton = wrapper.find('.view-mode-grid');
    await gridViewButton.trigger('click');

    expect(wrapper.find('.agent-list--grid-view').exists()).toBe(true);
  });

  it('should handle pagination', async () => {
    const manyAgents = Array.from({ length: 25 }, (_, i) => ({
      ...mockAgents[0],
      id: i + 1,
      name: `代理 ${i + 1}`,
    }));

    const wrapper = mount(AgentList, {
      props: {
        agents: manyAgents,
      },
    });

    expect(wrapper.find('.ant-pagination').exists()).toBe(true);
    
    // Should show first page of results (default 20 per page)
    expect(wrapper.findAll('.agent-card')).toHaveLength(20);
  });

  it('should emit edit event from agent card', async () => {
    const wrapper = mount(AgentList, {
      props: {
        agents: mockAgents,
      },
    });

    const firstAgentCard = wrapper.findComponent({ name: 'AgentCard' });
    await firstAgentCard.vm.$emit('edit', mockAgents[0]);

    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')?.[0]).toEqual([mockAgents[0]]);
  });

  it('should emit delete event from agent card', async () => {
    const wrapper = mount(AgentList, {
      props: {
        agents: mockAgents,
      },
    });

    const firstAgentCard = wrapper.findComponent({ name: 'AgentCard' });
    await firstAgentCard.vm.$emit('delete', 1);

    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')?.[0]).toEqual([1]);
  });

  it('should show correct agent count', () => {
    const wrapper = mount(AgentList, {
      props: {
        agents: mockAgents,
      },
    });

    expect(wrapper.text()).toContain('共 2 个代理');
  });

  it('should handle refresh action', async () => {
    const wrapper = mount(AgentList, {
      props: {
        agents: mockAgents,
      },
    });

    const refreshButton = wrapper.find('.refresh-btn');
    await refreshButton.trigger('click');

    expect(wrapper.emitted('refresh')).toBeTruthy();
  });
});