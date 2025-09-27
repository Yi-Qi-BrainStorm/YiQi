import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AgentList from '../AgentList.vue';
import { useAgents } from '@/composables/useAgents';

// Mock the useAgents composable
vi.mock('@/composables/useAgents', () => ({
  useAgents: vi.fn(),
}));

// Mock Ant Design Vue components
vi.mock('ant-design-vue', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AgentList', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    
    // Mock useAgents return value
    vi.mocked(useAgents).mockReturnValue({
      agents: { value: [] },
      fetchAgents: vi.fn(),
      deleteAgent: vi.fn(),
      updateAgentStatus: vi.fn(),
      deleteAgents: vi.fn(),
      loading: { value: false },
      createAgent: vi.fn(),
      updateAgent: vi.fn(),
      duplicateAgent: vi.fn(),
    });
  });

  it('renders correctly', () => {
    const wrapper = mount(AgentList, {
      global: {
        stubs: {
          'a-input-search': true,
          'a-select': true,
          'a-select-option': true,
          'a-button': true,
          'a-dropdown': true,
          'a-menu': true,
          'a-menu-item': true,
          'a-spin': true,
          'a-empty': true,
          'a-pagination': true,
          'AgentCard': true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.agent-list').exists()).toBe(true);
  });

  it('emits create-new event when create button is clicked', async () => {
    const wrapper = mount(AgentList, {
      global: {
        stubs: {
          'a-input-search': true,
          'a-select': true,
          'a-select-option': true,
          'a-button': {
            template: '<button @click="$emit(\'click\')"><slot /></button>',
          },
          'a-dropdown': true,
          'a-menu': true,
          'a-menu-item': true,
          'a-spin': true,
          'a-empty': true,
          'a-pagination': true,
          'AgentCard': true,
        },
      },
    });

    // Find and click the create button
    const createButton = wrapper.find('button');
    await createButton.trigger('click');

    expect(wrapper.emitted('create-new')).toBeTruthy();
  });

  it('displays empty state when no agents', () => {
    const wrapper = mount(AgentList, {
      global: {
        stubs: {
          'a-input-search': true,
          'a-select': true,
          'a-select-option': true,
          'a-button': true,
          'a-dropdown': true,
          'a-menu': true,
          'a-menu-item': true,
          'a-spin': true,
          'a-empty': {
            template: '<div class="empty-state"><slot /></div>',
          },
          'a-pagination': true,
          'AgentCard': true,
        },
      },
    });

    expect(wrapper.find('.empty-state').exists()).toBe(true);
  });
});