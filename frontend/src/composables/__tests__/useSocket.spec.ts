import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSocket } from '../useSocket';
import { io } from 'socket.io-client';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(),
}));

describe('useSocket', () => {
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      connected: false,
      on: vi.fn(),
      off: vi.fn(),
      disconnect: vi.fn(),
    };

    (io as any).mockReturnValue(mockSocket);
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { socket, connected } = useSocket();

    expect(socket.value).toBeNull();
    expect(connected.value).toBe(false);
  });

  it('should connect to socket with default namespace', () => {
    const { connect } = useSocket();

    connect();

    expect(io).toHaveBeenCalledWith('/', {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  });

  it('should connect to socket with custom namespace', () => {
    const { connect } = useSocket('/brainstorm');

    connect();

    expect(io).toHaveBeenCalledWith('/brainstorm', {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  });

  it('should not reconnect if already connected', () => {
    mockSocket.connected = true;
    const { connect, socket } = useSocket();

    // First connection
    connect();
    socket.value = mockSocket;

    // Second connection attempt
    connect();

    expect(io).toHaveBeenCalledTimes(1);
  });

  it('should setup event listeners on connect', () => {
    const { connect } = useSocket();

    connect();

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
  });

  it('should update connected state on connect event', () => {
    const { connect, connected } = useSocket();

    connect();

    // Simulate connect event
    const connectHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'connect'
    )?.[1];

    connectHandler?.();

    expect(connected.value).toBe(true);
  });

  it('should update connected state on disconnect event', () => {
    const { connect, connected } = useSocket();

    connect();
    connected.value = true; // Simulate connected state

    // Simulate disconnect event
    const disconnectHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'disconnect'
    )?.[1];

    disconnectHandler?.();

    expect(connected.value).toBe(false);
  });

  it('should log connect error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { connect } = useSocket();

    connect();

    // Simulate connect_error event
    const errorHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'connect_error'
    )?.[1];

    const mockError = new Error('Connection failed');
    errorHandler?.(mockError);

    expect(consoleSpy).toHaveBeenCalledWith('Socket连接错误:', mockError);

    consoleSpy.mockRestore();
  });

  it('should disconnect socket', () => {
    const { connect, disconnect, socket, connected } = useSocket();

    connect();
    socket.value = mockSocket;
    connected.value = true;

    disconnect();

    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(socket.value).toBeNull();
    expect(connected.value).toBe(false);
  });

  it('should handle disconnect when socket is null', () => {
    const { disconnect } = useSocket();

    // Should not throw error
    expect(() => disconnect()).not.toThrow();
  });

  it('should disconnect on unmount', () => {
    const { connect, socket } = useSocket();

    connect();
    socket.value = mockSocket;

    // Simulate component unmount by calling disconnect
    const { disconnect } = useSocket();
    disconnect();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});