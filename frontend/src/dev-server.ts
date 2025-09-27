/**
 * 开发服务器启动脚本
 * 用于测试前端应用是否能正常运行
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import './styles/main.scss';

import App from './App.vue';
import router from './router';

// 启用Mock服务 (开发和测试环境)
import './utils/mockEnabler';

console.log('🚀 启动开发服务器...');

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(Antd);

// 错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue应用错误:', err);
  console.error('错误信息:', info);
};

// 全局属性
app.config.globalProperties.$log = console.log;

app.mount('#app');

console.log('✅ 开发服务器启动成功');
console.log('📱 应用已挂载到 #app');
console.log('🔧 Mock服务已启用');

// 在控制台显示一些有用的信息
if (import.meta.env.DEV) {
  console.log('🛠️ 开发模式信息:');
  console.log('  - 路由模式: history');
  console.log('  - Mock数据: 已启用');
  console.log('  - 热重载: 已启用');
  console.log('  - 调试工具: 可用');
}