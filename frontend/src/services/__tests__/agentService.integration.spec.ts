import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { agentService } from '../agentService';
import { ApiService } from '../api';
import type { Agent, AgentFormData } from '@/types/agent';

// Mock API responses
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

const mockAgentFormData: AgentFormData = {
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

describe('AgentService Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('API Integration', () => {
    it('should fetch agents with correct API call', async () => {
      const mockResponse = [mockAgent];
      vi.spyOn(ApiService, 'get').mockResolvedValue(mockResponse);

      const result = await agentService.getAgents();

      expect(ApiService.get).toHaveBeenCalledWith('/agents');
      expect(result).toEqual(mockResponse);
    });

    it('should create agent with correct API call and data transformation', async () => {
      vi.spyOn(ApiService, 'post').mockResolvedValue(mockAgent);

      const result = await agentService.createAgent(mockAgentFormData);

      expect(ApiService.post).toHaveBeenCalledWith('/agents', mockAgentFormData);
      expect(result).toEqual(mockAgent);
    });

    it('should update agent with correct API call', async () => {
      const updatedAgent = { ...mockAgent, name: '更新的设计师' };
      vi.spyOn(ApiService, 'put').mockResolvedValue(updatedAgent);

      const result = await agentService.updateAgent(1, mockAgentFormData);

      expect(ApiService.put).toHaveBeenCalledWith('/agents/1', mockAgentFormData);
      expect(result).toEqual(updatedAgent);
    });

    it('should delete agent with correct API call', async () => {
      vi.spyOn(ApiService, 'delete').mockResolvedValue(undefined);

      await agentService.deleteAgent(1);

      expect(ApiService.delete).toHaveBeenCalledWith('/agents/1');
    });

    it('should toggle agent status with correct API call', async () => {
      const toggledAgent = { ...mockAgent, status: 'INACTIVE' as const };
      vi.spyOn(ApiService, 'patch').mockResolvedValue(toggledAgent);

      const result = await agentService.toggleAgentStatus(1);

      expect(ApiService.patch).toHaveBeenCalledWith('/agents/1/toggle-status');
      expect(result).toEqual(toggledAgent);
    });

    it('should handle API errors correctly', async () => {
      const apiError = new Error('API Error');
      vi.spyOn(ApiService, 'get').mockRejectedValue(apiError);

      await expect(agentService.getAgents()).rejects.toThrow('API Error');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      networkError.name = 'NetworkError';
      vi.spyOn(ApiService, 'get').mockRejectedValue(networkError);

      await expect(agentService.getAgents()).rejects.toThrow('Network Error');
    });

    it('should handle validation errors on create', async () => {
      const validationError = {
        response: {
          status: 400,
          data: {
            message: 'Validation failed',
            errors: {
              name: ['Name is required'],
              systemPrompt: ['System prompt is too short'],
            },
          },
        },
      };
      vi.spyOn(ApiService, 'post').mockRejectedValue(validationError);

      await expect(agentService.createAgent(mockAgentFormData)).rejects.toEqual(validationError);
    });

    it('should handle unauthorized errors', async () => {
      const unauthorizedError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };
      vi.spyOn(ApiService, 'get').mockRejectedValue(unauthorizedError);

      await expect(agentService.getAgents()).rejects.toEqual(unauthorizedError);
    });
  });

  describe('Data Flow Integration', () => {
    it('should maintain data consistency through CRUD operations', async () => {
      // Mock sequential API calls
      vi.spyOn(ApiService, 'post').mockResolvedValue(mockAgent);
      vi.spyOn(ApiService, 'get').mockResolvedValue([mockAgent]);
      
      const updatedAgent = { ...mockAgent, name: '更新的设计师' };
      vi.spyOn(ApiService, 'put').mockResolvedValue(updatedAgent);
      vi.spyOn(ApiService, 'delete').mockResolvedValue(undefined);

      // Create agent
      const created = await agentService.createAgent(mockAgentFormData);
      expect(created).toEqual(mockAgent);

      // Fetch agents
      const agents = await agentService.getAgents();
      expect(agents).toContain(mockAgent);

      // Update agent
      const updated = await agentService.updateAgent(1, { ...mockAgentFormData, name: '更新的设计师' });
      expect(updated.name).toBe('更新的设计师');

      // Delete agent
      await agentService.deleteAgent(1);
      expect(ApiService.delete).toHaveBeenCalledWith('/agents/1');
    });

    it('should handle concurrent operations correctly', async () => {
      const agents = [
        { ...mockAgent, id: 1 },
        { ...mockAgent, id: 2 },
        { ...mockAgent, id: 3 },
      ];

      vi.spyOn(ApiService, 'get').mockResolvedValue(agents);
      vi.spyOn(ApiService, 'delete').mockResolvedValue(undefined);

      // Simulate concurrent delete operations
      const deletePromises = [
        agentService.deleteAgent(1),
        agentService.deleteAgent(2),
        agentService.deleteAgent(3),
      ];

      await Promise.all(deletePromises);

      expect(ApiService.delete).toHaveBeenCalledTimes(3);
      expect(ApiService.delete).toHaveBeenCalledWith('/agents/1');
      expect(ApiService.delete).toHaveBeenCalledWith('/agents/2');
      expect(ApiService.delete).toHaveBeenCalledWith('/agents/3');
    });

    it('should handle partial failures in batch operations', async () => {
      vi.spyOn(ApiService, 'delete')
        .mockResolvedValueOnce(undefined) // First delete succeeds
        .mockRejectedValueOnce(new Error('Delete failed')) // Second delete fails
        .mockResolvedValueOnce(undefined); // Third delete succeeds

      const results = await Promise.allSettled([
        agentService.deleteAgent(1),
        agentService.deleteAgent(2),
        agentService.deleteAgent(3),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });

  describe('Error Handling Integration', () => {
    it('should propagate API errors with proper context', async () => {
      const apiError = {
        response: {
          status: 500,
          data: {
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
          },
        },
      };

      vi.spyOn(ApiService, 'get').mockRejectedValue(apiError);

      try {
        await agentService.getAgents();
      } catch (error) {
        expect(error).toEqual(apiError);
      }
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      vi.spyOn(ApiService, 'post').mockRejectedValue(timeoutError);

      await expect(agentService.createAgent(mockAgentFormData)).rejects.toThrow('Request timeout');
    });

    it('should handle malformed response data', async () => {
      vi.spyOn(ApiService, 'get').mockResolvedValue(null);

      const result = await agentService.getAgents();
      expect(result).toBeNull();
    });
  });

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockAgent,
        id: i + 1,
        name: `Agent ${i + 1}`,
      }));

      vi.spyOn(ApiService, 'get').mockResolvedValue(largeDataset);

      const startTime = Date.now();
      const result = await agentService.getAgents();
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle rapid successive API calls', async () => {
      vi.spyOn(ApiService, 'get').mockResolvedValue([mockAgent]);

      const promises = Array.from({ length: 10 }, () => agentService.getAgents());
      
      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      expect(results.every(result => result.length === 1)).toBe(true);
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
    });
  });

  describe('Cache Integration', () => {
    it('should handle cached responses correctly', async () => {
      // First call
      vi.spyOn(ApiService, 'get').mockResolvedValueOnce([mockAgent]);
      const firstResult = await agentService.getAgents();

      // Second call (potentially cached)
      vi.spyOn(ApiService, 'get').mockResolvedValueOnce([mockAgent]);
      const secondResult = await agentService.getAgents();

      expect(firstResult).toEqual(secondResult);
      expect(ApiService.get).toHaveBeenCalledTimes(2);
    });
  });
});