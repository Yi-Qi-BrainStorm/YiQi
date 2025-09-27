import { vi } from 'vitest';
import { config } from '@vue/test-utils';

// Mock Ant Design Vue 组件
config.global.stubs = {
  'a-card': true,
  'a-avatar': true,
  'a-badge': true,
  'a-button': true,
  'a-checkbox': true,
  'a-tooltip': true,
  'a-tag': true,
  'a-typography-text': true,
  'a-typography-title': true,
  'a-input': true,
  'a-form': true,
  'a-form-item': true,
  'a-select': true,
  'a-option': true,
  'a-modal': true,
  'a-drawer': true,
  'a-table': true,
  'a-pagination': true,
  'a-spin': true,
  'a-alert': true,
  'a-message': true,
  'a-notification': true,
  'router-link': true,
  'router-view': true
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('sessionStorage', sessionStorageMock);

// Mock fetch
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
console.warn = vi.fn();
console.error = vi.fn();