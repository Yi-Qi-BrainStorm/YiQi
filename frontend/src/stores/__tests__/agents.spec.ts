import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAgentStore } from '../agents';
import { agentService } from '@/services/agentService';
import { NotificationService } from '@/services/notificationService';
import type { Agent, AgentFormData } from '@/types/agent';

// Mock dependencies
vi.mock('@/services/agentService', () => ({
  agentService: {
    getAgents: vi.fn(),
    createAgent: vi.fn(),
    updateAgent: vi.fn(),
    deleteAgent: vi.fn(),
    toggleAgentStatus: vi.fn(),
  },
}));

vi.mock('@/services/notificationService', () => ({
  NotificationService: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useAgentStore', () => {
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

  it('should initialize with default state', () => {
    const agentStore = useAgentStore();

    expect(agentStore.agents).toEqual([]);
    expect(agentStore.selectedAgentIds).toEqual([]);
    expect(agentStore.loading).toBe(false);
    expect(agentStore.error).toBeNull();
    expect(agentStore.selectedAgents).toEqual([]);
  });

  it('should fetch agents successfully', async () => {
    const mockAgents = [mockAgent];
    (agentService.getAgents as any).mockResolvedValue(mockAgents);

    const agentStore = useAgentStore();

    await agentStore.fetchAgents();

    expect(agentService.getAgents).toHaveBeenCalled();
    expect(agentStore.agents).toEqual(mockAgents);
    expect(agentStore.loading).toBe(false);
    expect(agentStore.error).toBeNull();
  });

  it('should handle fetch agents error', async () => {
    const mockError = new Error('Fetch failed');
    (agentService.getAgents as any).mockRejectedValue(mockError);

    const agentStore = useAgentStore();

    await expect(agentStore.fetchAgents()).rejects.toThrow('Fetch failed');
    expect(agentStore.error).toBe('Fetch failed');
    expect(agentStore.loading).toBe(false);
  });

  it('should create agent successfully', async () => {
    (agentService.createAgent as any).mockResolvedValue(mockAgent);

    const agentStore = useAgentStore();
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

    const result = await agentStore.createAgent(agentData);

    expect(agentService.createAgent).toHaveBeenCalledWith(agentData);
    expect(agentStore.agents).toContain(mockAgent);
    expect(NotificationService.success).toHaveBeenCalledWith('代理创建成功');
    expect(result).toEqual(mockAgent);
  });

  it('should handle create agent error', async () => {
    const mockError = new Error('Create failed');
    (agentService.createAgent as any).mockRejectedValue(mockError);

    const agentStore = useAgentStore();
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

    await expect(agentStore.createAgent(agentData)).rejects.toThrow('Create failed');
    expect(agentStore.error).toBe('Create failed');
  });

  it('should update agent successfully', async () => {
    const updatedAgent = { ...mockAgent, name: '更新的设计师' };
    (agentService.updateAgent as any).mockResolvedValue(updatedAgent);

    const agentStore = useAgentStore();
    agentStore.agents = [mockAgent];

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

    const result = await agentStore.updateAgent(1, agentData);

    expect(agentService.updateAgent).toHaveBeenCalledWith(1, agentData);
    expect(agentStore.agents[0]).toEqual(updatedAgent);
    expect(NotificationService.success).toHaveBeenCalledWith('代理更新成功');
    expect(result).toEqual(updatedAgent);
  });

  it('should handle update agent error', async () => {
    const mockError = new Error('Update failed');
    (agentService.updateAgent as any).mockRejectedValue(mockError);

    const agentStore = useAgentStore();
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

    await expect(agentStore.updateAgent(1, agentData)).rejects.toThrow('Update failed');
    expect(agentStore.error).toBe('Update failed');
  });

  it('should delete agent successfully', async () => {
    (agentService.deleteAgent as any).mockResolvedValue();

    const agentStore = useAgentStore();
    agentStore.agents = [mockAgent];
    agentStore.selectedAgentIds = [1];

    await agentStore.deleteAgent(1);

    expect(agentService.deleteAgent).toHaveBeenCalledWith(1);
    expect(agentStore.agents).toEqual([]);
    expect(agentStore.selectedAgentIds).toEqual([]);
    expect(NotificationService.success).toHaveBeenCalledWith('代理删除成功');
  });

  it('should handle delete agent error', async () => {
    const mockError = new Error('Delete failed');
    (agentService.deleteAgent as any).mockRejectedValue(mockError);

    const agentStore = useAgentStore();

    await expect(agentStore.deleteAgent(1)).rejects.toThrow('Delete failed');
    expect(agentStore.error).toBe('Delete failed');
  });

  it('should select agent', () => {
    const agentStore = useAgentStore();

    agentStore.selectAgent(1);

    expect(agentStore.selectedAgentIds).toContain(1);
  });

  it('should not select agent if already selected', () => {
    const agentStore = useAgentStore();
    agentStore.selectedAgentIds = [1];

    agentStore.selectAgent(1);

    expect(agentStore.selectedAgentIds).toEqual([1]);
  });

  it('should deselect agent', () => {
    const agentStore = useAgentStore();
    agentStore.selectedAgentIds = [1, 2];

    agentStore.deselectAgent(1);

    expect(agentStore.selectedAgentIds).toEqual([2]);
  });

  it('should clear selection', () => {
    const agentStore = useAgentStore();
    agentStore.selectedAgentIds = [1, 2, 3];

    agentStore.clearSelection();

    expect(agentStore.selectedAgentIds).toEqual([]);
  });

  it('should toggle agent selection', () => {
    const agentStore = useAgentStore();

    // Select agent
    agentStore.toggleAgentSelection(1);
    expect(agentStore.selectedAgentIds).toContain(1);

    // Deselect agent
    agentStore.toggleAgentSelection(1);
    expect(agentStore.selectedAgentIds).not.toContain(1);
  });

  it('should select all agents', () => {
    const agentStore = useAgentStore();
    agentStore.agents = [mockAgent, { ...mockAgent, id: 2 }];

    agentStore.selectAllAgents();

    expect(agentStore.selectedAgentIds).toEqual([1, 2]);
  });

  it('should toggle agent status successfully', async () => {
    const updatedAgent = { ...mockAgent, status: 'INACTIVE' as const };
    (agentService.toggleAgentStatus as any).mockResolvedValue(updatedAgent);

    const agentStore = useAgentStore();
    agentStore.agents = [mockAgent];

    await agentStore.toggleAgentStatus(1);

    expect(agentService.toggleAgentStatus).toHaveBeenCalledWith(1);
    expect(agentStore.agents[0]).toEqual(updatedAgent);
    expect(NotificationService.success).toHaveBeenCalledWith('代理状态更新成功');
  });

  it('should handle toggle status error', async () => {
    const mockError = new Error('Toggle failed');
    (agentService.toggleAgentStatus as any).mockRejectedValue(mockError);

    const agentStore = useAgentStore();

    await expect(agentStore.toggleAgentStatus(1)).rejects.toThrow('Toggle failed');
    expect(agentStore.error).toBe('Toggle failed');
  });

  it('should compute selected agents correctly', () => {
    const agent2 = { ...mockAgent, id: 2 };
    const agentStore = useAgentStore();
    agentStore.agents = [mockAgent, agent2];
    agentStore.selectedAgentIds = [1];

    expect(agentStore.selectedAgents).toEqual([mockAgent]);
  });

  it('should clear error', () => {
    const agentStore = useAgentStore();
    agentStore.error = 'Some error';

    agentStore.clearError();

    expect(agentStore.error).toBeNull();
  });

  it('should batch delete agents successfully', async () => {
    (agentService.deleteAgent as any).mockResolvedValue();

    const agentStore = useAgentStore();
    const agent2 = { ...mockAgent, id: 2 };
    agentStore.agents = [mockAgent, agent2];
    agentStore.selectedAgentIds = [1, 2];

    await agentStore.batchDeleteAgents([1, 2]);

    expect(agentService.deleteAgent).toHaveBeenCalledTimes(2);
    expect(agentStore.agents).toEqual([]);
    expect(agentStore.selectedAgentIds).toEqual([]);
    expect(NotificationService.success).toHaveBeenCalledWith('批量删除成功');
  });

  it('should handle batch delete error', async () => {
    const mockError = new Error('Delete failed');
    (agentService.deleteAgent as any).mockRejectedValue(mockError);

    const agentStore = useAgentStore();

    await expect(agentStore.batchDeleteAgents([1, 2])).rejects.toThrow('Delete failed');
    expect(agentStore.error).toBe('Delete failed');
  });
});