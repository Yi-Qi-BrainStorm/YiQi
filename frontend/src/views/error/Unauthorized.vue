<template>
  <div class="error-page">
    <a-result
      status="403"
      title="401"
      sub-title="抱歉，您没有权限访问此页面。"
    >
      <template #extra>
        <a-button type="primary" @click="handleLogin">
          去登录
        </a-button>
        <a-button @click="handleGoHome">
          返回首页
        </a-button>
      </template>
    </a-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'

const router = useRouter()

const handleLogin = () => {
  router.push(ROUTES.LOGIN)
}

const handleGoHome = () => {
  router.push(ROUTES.DASHBOARD)
}
</script>

<style scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}
</style>