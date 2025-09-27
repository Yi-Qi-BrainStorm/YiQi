import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrainstormSocketService } from '../brainstormSocketService';
import { io } from 'socket.io-client';
import type { BrainstormSession, AgentResult, AISummary } from '@/types/brainstorm';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(),
}));

describe('BrainstormSocketService Integration Tests', () => {
  let mockSocket: any;
  let socketService: BrainstormSocketService;

  beforeEach(() => {
    mockSocket = {
      connected: false,
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
      connect: vi.fn(),
    };

    (io as any).mockReturnValue(mockSocket);
    socketService = new BrainstormSocketService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('WebSocket Connection Integration', () => {
    it('should establish connection with correct configuration', () => {
      socketService.connect();

      expect(io).toHaveBeenCalledWith('/brainstorm', {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      });
    });

    it('should handle connection events correctly', () => {
      socketService.connect();

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
    });

    it('should handle connection state changes', () => {
      const onConnectionChange = vi.fn();
      socketService.onConnectionChange(onConnectionChange);
      socketService.connect();

      // Simulate connect event
      const connectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )?.[1];
      connectHandler?.();

      expect(onConnectionChange).toHaveBeenCalledWith(true);

      // Simulate disconnect event
      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1];
      disconnectHandler?.();

      expect(onConnectionChange).toHaveBeenCalledWith(false);
    });

    it('should handle reconnection attempts', () => {
      const onReconnectAttempt = vi.fn();
      socketService.onReconnectAttempt(onReconnectAttempt);
      socketService.connect();

      // Simulate reconnect event
      const reconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'reconnect'
      )?.[1];
      reconnectHandler?.(3); // Attempt number

      expect(onReconnectAttempt).toHaveBeenCalledWith(3);
    });

    it('should handle connection errors', () => {
      const onError = vi.fn();
      socketService.onError(onError);
      socketService.connect();

      // Simulate connection error
      const errorHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect_error'
      )?.[1];
      const mockError = new Error('Connection failed');
      errorHandler?.(mockError);

      expect(onError).toHaveBeenCalledWith(mockError);
    });

    it('should disconnect properly', () => {
      socketService.connect();
      socketService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Brainstorm Session Integration', () => {
    beforeEach(() => {
      socketService.connect();
      mockSocket.connected = true;
    });

    it('should start brainstorm session correctly', () => {
      const sessionData = {
        sessionId: 1,
        topic: '智能手环设计',
        agentIds: [1, 2, 3],
      };

      socketService.startBrainstorm(sessionData);

      expect(mockSocket.emit).toHaveBeenCalledWith('brainstorm:start', sessionData);
    });

    it('should handle session start response', () => {
      const onSessionStart = vi.fn();
      socketService.onSessionStart(onSessionStart);
      socketService.connect();

      // Simulate session start event
      const sessionStartHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'brainstorm:started'
      )?.[1];

      const mockSession: BrainstormSession = {
        id: 1,
        topic: '智能手环设计',
        userId: 1,
        agentIds: [1, 2, 3],
        currentStage: 1,
        status: 'ACTIVE',
        stageResults: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      sessionStartHandler?.(mockSession);

      expect(onSessionStart).toHaveBeenCalledWith(mockSession);
    });

    it('should proceed to next stage', () => {
      const stageData = {
        sessionId: 1,
        stage: 2,
      };

      socketService.proceedToNextStage(stageData);

      expect(mockSocket.emit).toHaveBeenCalledWith('brainstorm:proceed', stageData);
    });

    it('should restart current stage', () => {
      const stageData = {
        sessionId: 1,
        stage: 1,
      };

      socketService.restartStage(stageData);

      expect(mockSocket.emit).toHaveBeenCalledWith('brainstorm:restart-stage', stageData);
    });

    it('should stop brainstorm session', () => {
      const sessionId = 1;

      socketService.stopBrainstorm(sessionId);

      expect(mockSocket.emit).toHaveBeenCalledWith('brainstorm:stop', { sessionId });
    });
  });

  describe('Agent Status Integration', () => {
    beforeEach(() => {
      socketService.connect();
      mockSocket.connected = true;
    });

    it('should handle agent status updates', () => {
      const onAgentStatusUpdate = vi.fn();
      socketService.onAgentStatusUpdate(onAgentStatusUpdate);
      socketService.connect();

      // Simulate agent status update event
      const statusUpdateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'agent:status-update'
      )?.[1];

      const statusUpdate = {
        sessionId: 1,
        agentId: 1,
        status: 'thinking' as const,
        stage: 1,
      };

      statusUpdateHandler?.(statusUpdate);

      expect(onAgentStatusUpdate).toHaveBeenCalledWith(statusUpdate);
    });

    it('should handle agent results', () => {
      const onAgentResult = vi.fn();
      socketService.onAgentResult(onAgentResult);
      socketService.connect();

      // Simulate agent result event
      const resultHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'agent:result'
      )?.[1];

      const agentResult: AgentResult = {
        agentId: 1,
        agentName: '设计师',
        agentRole: 'UI/UX Designer',
        content: '这是设计建议',
        processingTime: 5000,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const resultData = {
        sessionId: 1,
        stage: 1,
        agentId: 1,
        result: agentResult,
      };

      resultHandler?.(resultData);

      expect(onAgentResult).toHaveBeenCalledWith(resultData);
    });

    it('should handle agent errors', () => {
      const onAgentError = vi.fn();
      socketService.onAgentError(onAgentError);
      socketService.connect();

      // Simulate agent error event
      const errorHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'agent:error'
      )?.[1];

      const errorData = {
        sessionId: 1,
        agentId: 1,
        error: 'Processing failed',
        stage: 1,
      };

      errorHandler?.(errorData);

      expect(onAgentError).toHaveBeenCalledWith(errorData);
    });
  });

  describe('Stage Management Integration', () => {
    beforeEach(() => {
      socketService.connect();
      mockSocket.connected = true;
    });

    it('should handle stage completion', () => {
      const onStageComplete = vi.fn();
      socketService.onStageComplete(onStageComplete);
      socketService.connect();

      // Simulate stage complete event
      const stageCompleteHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'stage:complete'
      )?.[1];

      const stageData = {
        sessionId: 1,
        stage: 1,
        stageName: '创意生成',
        completedAt: '2024-01-01T00:00:00Z',
      };

      stageCompleteHandler?.(stageData);

      expect(onStageComplete).toHaveBeenCalledWith(stageData);
    });

    it('should handle stage summary', () => {
      const onStageSummary = vi.fn();
      socketService.onStageSummary(onStageSummary);
      socketService.connect();

      // Simulate stage summary event
      const summaryHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'stage:summary'
      )?.[1];

      const summary: AISummary = {
        keyPoints: ['关键点1', '关键点2'],
        commonSuggestions: ['建议1', '建议2'],
        conflictingViews: [],
        overallAssessment: '整体评估',
        nextStepRecommendations: ['下一步建议'],
      };

      const summaryData = {
        sessionId: 1,
        stage: 1,
        summary,
      };

      summaryHandler?.(summaryData);

      expect(onStageSummary).toHaveBeenCalledWith(summaryData);
    });

    it('should handle session completion', () => {
      const onSessionComplete = vi.fn();
      socketService.onSessionComplete(onSessionComplete);
      socketService.connect();

      // Simulate session complete event
      const sessionCompleteHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'session:complete'
      )?.[1];

      const completionData = {
        sessionId: 1,
        finalReport: {
          sessionId: 1,
          topic: '智能手环设计',
          executiveSummary: '执行摘要',
          generatedAt: '2024-01-01T00:00:00Z',
        },
        completedAt: '2024-01-01T00:00:00Z',
      };

      sessionCompleteHandler?.(completionData);

      expect(onSessionComplete).toHaveBeenCalledWith(completionData);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle socket connection failures', () => {
      const onError = vi.fn();
      socketService.onError(onError);

      // Mock connection failure
      (io as any).mockImplementation(() => {
        throw new Error('Connection failed');
      });

      expect(() => socketService.connect()).toThrow('Connection failed');
    });

    it('should handle message sending when disconnected', () => {
      mockSocket.connected = false;
      socketService.connect();

      const sessionData = {
        sessionId: 1,
        topic: '智能手环设计',
        agentIds: [1, 2, 3],
      };

      // Should not emit when disconnected
      socketService.startBrainstorm(sessionData);

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('should handle malformed event data', () => {
      const onAgentResult = vi.fn();
      socketService.onAgentResult(onAgentResult);
      socketService.connect();

      // Simulate malformed data event
      const resultHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'agent:result'
      )?.[1];

      // Send malformed data
      resultHandler?.(null);
      resultHandler?.(undefined);
      resultHandler?.({});

      // Should handle gracefully without crashing
      expect(onAgentResult).toHaveBeenCalledTimes(3);
    });
  });

  describe('Performance Integration', () => {
    it('should handle high-frequency events', () => {
      const onAgentStatusUpdate = vi.fn();
      socketService.onAgentStatusUpdate(onAgentStatusUpdate);
      socketService.connect();

      const statusUpdateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'agent:status-update'
      )?.[1];

      // Simulate rapid status updates
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        statusUpdateHandler?.({
          sessionId: 1,
          agentId: 1,
          status: 'thinking',
          stage: 1,
        });
      }
      const endTime = Date.now();

      expect(onAgentStatusUpdate).toHaveBeenCalledTimes(100);
      expect(endTime - startTime).toBeLessThan(100); // Should handle within 100ms
    });

    it('should handle concurrent event listeners', () => {
      const listeners = Array.from({ length: 10 }, () => vi.fn());
      
      listeners.forEach(listener => {
        socketService.onAgentStatusUpdate(listener);
      });

      socketService.connect();

      const statusUpdateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'agent:status-update'
      )?.[1];

      const statusUpdate = {
        sessionId: 1,
        agentId: 1,
        status: 'thinking' as const,
        stage: 1,
      };

      statusUpdateHandler?.(statusUpdate);

      listeners.forEach(listener => {
        expect(listener).toHaveBeenCalledWith(statusUpdate);
      });
    });
  });

  describe('Memory Management Integration', () => {
    it('should clean up event listeners on disconnect', () => {
      const onAgentStatusUpdate = vi.fn();
      socketService.onAgentStatusUpdate(onAgentStatusUpdate);
      socketService.connect();

      socketService.disconnect();

      expect(mockSocket.off).toHaveBeenCalled();
    });

    it('should handle multiple connect/disconnect cycles', () => {
      for (let i = 0; i < 5; i++) {
        socketService.connect();
        socketService.disconnect();
      }

      expect(io).toHaveBeenCalledTimes(5);
      expect(mockSocket.disconnect).toHaveBeenCalledTimes(5);
    });
  });
});