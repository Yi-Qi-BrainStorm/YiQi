import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import Register from '../Register.vue';

// Mock Ant Design Vue components
vi.mock('ant-design-vue', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock useAuth composable
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    register: vi.fn().mockResolvedValue({ id: 1, username: 'testuser' }),
    loading: { value: false },
    error: { value: null },
    clearError: vi.fn(),
    isAuthenticated: { value: false },
    requireGuest: vi.fn().mockResolvedValue(true),
  }),
}));

describe('Register.vue', () => {
  let router: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/login', component: { template: '<div>Login</div>' } },
        { path: '/dashboard', component: { template: '<div>Dashboard</div>' } },
      ],
    });
  });

  it('should render registration form correctly', () => {
    const wrapper = mount(Register, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.find('.register-title').text()).toBe('AI头脑风暴平台');
    expect(wrapper.find('.register-subtitle').text()).toBe('创建您的账户');
    expect(wrapper.find('input[placeholder*="用户名"]').exists()).toBe(true);
    expect(wrapper.find('input[placeholder*="邮箱"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
  });

  it('should show password strength indicator when password is entered', async () => {
    const wrapper = mount(Register, {
      global: {
        plugins: [router],
      },
    });

    const passwordInput = wrapper.find('input[type="password"]');
    await passwordInput.setValue('test123');

    expect(wrapper.find('.password-strength').exists()).toBe(true);
    expect(wrapper.find('.strength-bar').exists()).toBe(true);
    expect(wrapper.find('.strength-text').exists()).toBe(true);
  });

  it('should show username hints when username is entered', async () => {
    const wrapper = mount(Register, {
      global: {
        plugins: [router],
      },
    });

    const usernameInput = wrapper.find('input[placeholder*="用户名"]');
    await usernameInput.setValue('testuser');

    expect(wrapper.find('.username-hints').exists()).toBe(true);
    expect(wrapper.findAll('.hint')).toHaveLength(3);
  });

  it('should validate password strength correctly', async () => {
    const wrapper = mount(Register, {
      global: {
        plugins: [router],
      },
    });

    const passwordInput = wrapper.find('input[type="password"]');
    
    // Test weak password
    await passwordInput.setValue('123');
    expect(wrapper.find('.strength-fill.weak').exists()).toBe(true);
    
    // Test medium password
    await passwordInput.setValue('test123');
    expect(wrapper.find('.strength-fill.medium').exists()).toBe(true);
    
    // Test strong password
    await passwordInput.setValue('Test123!');
    expect(wrapper.find('.strength-fill.strong').exists()).toBe(true);
  });

  it('should validate confirm password matches', async () => {
    const wrapper = mount(Register, {
      global: {
        plugins: [router],
      },
    });

    const passwordInput = wrapper.find('input[type="password"]');
    const confirmPasswordInputs = wrapper.findAll('input[type="password"]');
    const confirmPasswordInput = confirmPasswordInputs[1]; // Second password input

    await passwordInput.setValue('test123');
    await confirmPasswordInput.setValue('different');

    // Trigger validation
    await confirmPasswordInput.trigger('blur');

    // Should show validation error for mismatched passwords
    expect(wrapper.text()).toContain('两次输入的密码不一致');
  });

  it('should validate username format correctly', async () => {
    const wrapper = mount(Register, {
      global: {
        plugins: [router],
      },
    });

    const usernameInput = wrapper.find('input[placeholder*="用户名"]');
    
    // Test invalid username (starts with number)
    await usernameInput.setValue('123test');
    await usernameInput.trigger('blur');
    
    expect(wrapper.text()).toContain('用户名必须以字母开头');
    
    // Test valid username
    await usernameInput.setValue('testuser');
    await usernameInput.trigger('blur');
    
    // Should not show error for valid username
    expect(wrapper.text()).not.toContain('用户名必须以字母开头');
  });

  it('should show email hints when email is entered', async () => {
    const wrapper = mount(Register, {
      global: {
        plugins: [router],
      },
    });

    const emailInput = wrapper.find('input[placeholder*="邮箱"]');
    await emailInput.setValue('test@example.com');

    expect(wrapper.find('.email-hints').exists()).toBe(true);
    expect(wrapper.find('.hint.active').exists()).toBe(true);
  });

  it('should validate email format correctly', async () => {
    const wrapper = mount(Register, {
      global: {
        plugins: [router],
      },
    });

    const emailInput = wrapper.find('input[placeholder*="邮箱"]');
    
    // Test invalid email
    await emailInput.setValue('invalid-email');
    await emailInput.trigger('blur');
    
    expect(wrapper.text()).toContain('请输入有效的邮箱地址');
    
    // Test valid email
    await emailInput.setValue('test@example.com');
    await emailInput.trigger('blur');
    
    // Should not show error for valid email
    expect(wrapper.text()).not.toContain('请输入有效的邮箱地址');
  });
});