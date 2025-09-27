import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAgents } from '../useAgents';
import { useAgentStore } from '@/stores/agents';
import type { Agent, AgentFormData } from '@/types/agent';

describe('useAgents', () => {
  let pinia: any;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  const mockAgent: Agent = {
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
  };

  it('should provide reactive agents state', () => {
    const { agents, selectedAgents, loading } = useAgents();

    expect(agents.value).toEqual([]);
    expect(selectedAgents.value).toEqual([]);
    expect(loading.value).toBe(false);
  });

  it('should fetch agents successfully', async () => {
    const agentStore = useAgentStore();
    vi.spyOn(agentStore, 'fetchAgents').mockResolvedValue();

    const { fetchAgents, loading } = useAgents();

    const fetchPromise = fetchAgents();
    expect(loading.value).toBe(true);

    await fetchPromise;
    expect(loading.value).toBe(false);
    expect(agentStore.fetchAgents).toHaveBeenCalled();
  });

  it('should create agent successfully', async () => {
    const agentStore = useAgentStore();
    vi.spyOn(agentStore, 'createAgent').mockResolvedValue(mockAgent);

    const { createAgent } = useAgents();
    const agentData: AgentFormData = {
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
    };

    const result = await createAgent(agentData);

    expect(agentStore.createAgent).toHaveBeenCalledWith(agentData);
    expect(result).toEqual(mockAgent);
  });

  it('should update agent successfully', async () => {
    const agentStore = useAgentStore();
    const updatedAgent = { ...mockAgent, name: '更新的设计师' };
    vi.spyOn(agentStore, 'updateAgent').mockResolvedValue(updatedAgent);

    const { updateAgent } = useAgents();
    const agentData: AgentFormData = {
      name: '更新的设计师',
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
    };

    const result = await updateAgent(1, agentData);

    expect(agentStore.updateAgent).toHaveBeenCalledWith(1, agentData);
    expect(result).toEqual(updatedAgent);
  });

  it('should delete agent successfully', async () => {
    const agentStore = useAgentStore();
    vi.spyOn(agentStore, 'deleteAgent').mockResolvedValue();

    const { deleteAgent } = useAgents();

    await deleteAgent(1);

    expect(agentStore.deleteAgent).toHaveBeenCalledWith(1);
  });

  it('should select and deselect agents', () => {
    const agentStore = useAgentStore();
    vi.spyOn(agentStore, 'selectAgent').mockImplementation(() => {});
    vi.spyOn(agentStore, 'deselectAgent').mockImplementation(() => {});

    const { selectAgent, deselectAgent } = useAgents();

    selectAgent(1);
    expect(agentStore.selectAgent).toHaveBeenCalledWith(1);

    deselectAgent(1);
    expect(agentStore.deselectAgent).toHaveBeenCalledWith(1);
  });

  it('should clear selection', () => {
    const agentStore = useAgentStore();
    vi.spyOn(agentStore, 'clearSelection').mockImplementation(() => {});

    const { clearSelection } = useAgents();

    clearSelection();

    expect(agentStore.clearSelection).toHaveBeenCalled();
  });

  it('should toggle agent selection', () => {
    const agentStore = useAgentStore();
    vi.spyOn(agentStore, 'toggleAgentSelection').mockImplementation(() => {});

    const { toggleAgentSelection } = useAgents();

    toggleAgentSelection(1);

    expect(agentStore.toggleAgentSelection).toHaveBeenCalledWith(1);
  });

  it('should select all agents', () => {
    const agentStore = useAgentStore();
    vi.spyOn(agentStore, 'selectAllAgents').mockImplementation(() => {});

    const { selectAllAgents } = useAgents();

    selectAllAgents();

    expect(agentStore.selectAllAgents).toHaveBeenCalled();
  });

  it('should handle errors during fetch', async () => {
    const agentStore = useAgentStore();
    const mockError = new Error('Fetch failed');
    vi.spyOn(agentStore, 'fetchAgents').mockRejectedValue(mockError);

    const { fetchAgents, loading } = useAgents();

    await expect(fetchAgents()).rejects.toThrow('Fetch failed');
    expect(loading.value).toBe(false);
  });

  it('should handle errors during create', async () => {
    const agentStore = useAgentStore();
    const mockError = new Error('Create failed');
    vi.spyOn(agentStore, 'createAgent').mockRejectedValue(mockError);

    const { createAgent } = useAgents();
    const agentData: AgentFormData = {
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
    };

    await expect(createAgent(agentData)).rejects.toThrow('Create failed');
  });
});