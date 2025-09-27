import { vi } from 'vitest';

/**
 * NotificationService 的 Mock 实现
 */
export const NotificationService = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  loading: vi.fn(),
  destroy: vi.fn(),
  config: vi.fn()
};

export default NotificationService;