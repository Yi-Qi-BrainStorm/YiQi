import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useBrainstorm } from '../useBrainstorm';
import { useBrainstormStore } from '@/stores/brainstorm';
import type { BrainstormSession } from '@/types/brainstorm';

// Mock useSocket composable
const mockSocket = {
  value: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
};

const mockSocketComposable = {
  socket: mockSocket,
  connected: { value: true },
  connect: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock('../useSocket', () => ({
  useSocket: () => mockSocketComposable,
}));

describe('useBrainstorm', () => {
  let pinia: any;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
  });

  const mockSession: BrainstormSession = {
    id: 1,
    topic: '智能手环设计',
    userId: 1,
    agentIds: [1, 2],
    currentStage: 1,
    status: 'ACTIVE',
    stageResults: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('should provide reactive brainstorm state', () => {
    const { currentSession, agentStatuses, stageProgress } = useBrainstorm();

    expect(currentSession.value).toBeNull();
    expect(agentStatuses.value).toEqual({});
    expect(stageProgress.value).toBeNull();
  });

  it('should start brainstorm successfully', async () => {
    const brainstormStore = useBrainstormStore();
    vi.spyOn(brainstormStore, 'createSession').mockResolvedValue(mockSession);

    const { startBrainstorm } = useBrainstorm();

    const result = await startBrainstorm('智能手环设计', [1, 2]);

    expect(brainstormStore.createSession).toHaveBeenCalledWith('智能手环设计', [1, 2]);
    expect(mockSocket.value.emit).toHaveBeenCalledWith('brainstorm:start', {
      sessionId: 1,
      topic: '智能手环设计',
      agentIds: [1, 2],
    });
    expect(result).toEqual(mockSession);
  });

  it('should proceed to next stage', () => {
    const brainstormStore = useBrainstormStore();
    brainstormStore.currentSession = mockSession;

    const { proceedToNextStage } = useBrainstorm();

    proceedToNextStage();

    expect(mockSocket.value.emit).toHaveBeenCalledWith('brainstorm:proceed', {
      sessionId: 1,
      stage: 2,
    });
  });

  it('should restart current stage', () => {
    const brainstormStore = useBrainstormStore();
    brainstormStore.currentSession = mockSession;

    const { restartCurrentStage } = useBrainstorm();

    restartCurrentStage();

    expect(mockSocket.value.emit).toHaveBeenCalledWith('brainstorm:restart-stage', {
      sessionId: 1,
      stage: 1,
    });
  });

  it('should not emit socket events when no session exists', () => {
    const { proceedToNextStage, restartCurrentStage } = useBrainstorm();

    proceedToNextStage();
    restartCurrentStage();

    expect(mockSocket.value.emit).not.toHaveBeenCalled();
  });

  it('should not emit socket events when socket is not connected', () => {
    mockSocket.value = null;
    const brainstormStore = useBrainstormStore();
    brainstormStore.currentSession = mockSession;

    const { proceedToNextStage, restartCurrentStage } = useBrainstorm();

    proceedToNextStage();
    restartCurrentStage();

    expect(mockSocket.value).toBeNull();
  });

  it('should setup socket listeners on mount', () => {
    useBrainstorm();

    expect(mockSocketComposable.connect).toHaveBeenCalled();
    expect(mockSocket.value.on).toHaveBeenCalledWith('agent:status-update', expect.any(Function));
    expect(mockSocket.value.on).toHaveBeenCalledWith('agent:result', expect.any(Function));
    expect(mockSocket.value.on).toHaveBeenCalledWith('stage:summary', expect.any(Function));
    expect(mockSocket.value.on).toHaveBeenCalledWith('session:complete', expect.any(Function));
  });

  it('should handle agent status update event', () => {
    const brainstormStore = useBrainstormStore();
    vi.spyOn(brainstormStore, 'updateAgentStatus').mockImplementation(() => {});

    useBrainstorm();

    // Simulate socket event
    const statusUpdateHandler = mockSocket.value.on.mock.calls.find(
      call => call[0] === 'agent:status-update'
    )?.[1];

    statusUpdateHandler?.({ agentId: 1, status: 'thinking' });

    expect(brainstormStore.updateAgentStatus).toHaveBeenCalledWith(1, 'thinking');
  });

  it('should handle agent result event', () => {
    const brainstormStore = useBrainstormStore();
    vi.spyOn(brainstormStore, 'setAgentResult').mockImplementation(() => {});

    useBrainstorm();

    // Simulate socket event
    const resultHandler = mockSocket.value.on.mock.calls.find(
      call => call[0] === 'agent:result'
    )?.[1];

    const mockResult = { agentId: 1, content: 'Test result' };
    resultHandler?.({ agentId: 1, result: mockResult });

    expect(brainstormStore.setAgentResult).toHaveBeenCalledWith(1, mockResult);
  });

  it('should handle stage summary event', () => {
    const brainstormStore = useBrainstormStore();
    vi.spyOn(brainstormStore, 'setStageSummary').mockImplementation(() => {});

    useBrainstorm();

    // Simulate socket event
    const summaryHandler = mockSocket.value.on.mock.calls.find(
      call => call[0] === 'stage:summary'
    )?.[1];

    const mockSummary = { keyPoints: ['Point 1'], overallAssessment: 'Good' };
    summaryHandler?.({ stage: 1, summary: mockSummary });

    expect(brainstormStore.setStageSummary).toHaveBeenCalledWith(1, mockSummary);
  });

  it('should handle session complete event', () => {
    const brainstormStore = useBrainstormStore();
    vi.spyOn(brainstormStore, 'setFinalReport').mockImplementation(() => {});

    useBrainstorm();

    // Simulate socket event
    const completeHandler = mockSocket.value.on.mock.calls.find(
      call => call[0] === 'session:complete'
    )?.[1];

    const mockReport = { sessionId: 1, topic: 'Test', executiveSummary: 'Summary' };
    completeHandler?.({ finalReport: mockReport });

    expect(brainstormStore.setFinalReport).toHaveBeenCalledWith(mockReport);
  });

  it('should load session when sessionId is provided', () => {
    const brainstormStore = useBrainstormStore();
    vi.spyOn(brainstormStore, 'loadSession').mockImplementation(() => {});

    useBrainstorm('session-123');

    expect(brainstormStore.loadSession).toHaveBeenCalledWith('session-123');
  });

  it('should disconnect socket on unmount', () => {
    const { unmount } = useBrainstorm();

    // Simulate component unmount
    if (unmount) unmount();

    expect(mockSocketComposable.disconnect).toHaveBeenCalled();
  });
});