<template>
  <div class="theme-switcher">
    <a-dropdown :trigger="['click']" placement="bottomRight">
      <a-button 
        type="text" 
        class="theme-button"
        :icon="currentThemeIcon"
        @click.prevent
      >
        <template #icon>
          <component :is="currentThemeIcon" />
        </template>
      </a-button>
      
      <template #overlay>
        <a-menu 
          :selected-keys="[theme]" 
          @click="handleThemeChange"
          class="theme-menu"
        >
          <a-menu-item key="light" class="theme-menu-item">
            <SunOutlined class="theme-icon" />
            <span>浅色主题</span>
          </a-menu-item>
          <a-menu-item key="dark" class="theme-menu-item">
            <MoonOutlined class="theme-icon" />
            <span>深色主题</span>
          </a-menu-item>
          <a-menu-item key="auto" class="theme-menu-item">
            <DesktopOutlined class="theme-icon" />
            <span>跟随系统</span>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { SunOutlined, MoonOutlined, DesktopOutlined } from '@ant-design/icons-vue';
import { useTheme, type Theme } from '@/composables/useTheme';

const { theme, currentTheme, setTheme } = useTheme();

const currentThemeIcon = computed(() => {
  switch (theme.value) {
    case 'light':
      return SunOutlined;
    case 'dark':
      return MoonOutlined;
    case 'auto':
      return DesktopOutlined;
    default:
      return DesktopOutlined;
  }
});

const handleThemeChange = ({ key }: { key: string }) => {
  setTheme(key as Theme);
};
</script>

<style scoped lang="scss">
.theme-switcher {
  .theme-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-lg);
    color: var(--color-text-primary);
    transition: all var(--transition-fast);
    
    &:hover {
      background-color: var(--color-surface-hover);
      color: var(--color-primary-600);
    }
  }
}

:deep(.theme-menu) {
  min-width: 160px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  
  .theme-menu-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    padding: var(--spacing-3) var(--spacing-4);
    color: var(--color-text-primary);
    transition: all var(--transition-fast);
    
    &:hover {
      background-color: var(--color-surface-hover);
      color: var(--color-primary-600);
    }
    
    &.ant-menu-item-selected {
      background-color: var(--color-primary-50);
      color: var(--color-primary-600);
      
      [data-theme="dark"] & {
        background-color: var(--color-primary-900);
        color: var(--color-primary-400);
      }
    }
    
    .theme-icon {
      font-size: var(--font-size-base);
    }
  }
}
</style>