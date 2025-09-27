# AI头脑风暴平台 - 前端

基于Vue 3 + TypeScript的AI头脑风暴文创产品设计平台前端应用。

## 技术栈

- **框架**: Vue 3 + TypeScript
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **UI组件库**: Ant Design Vue 4.x
- **样式**: SCSS + CSS Modules
- **实时通信**: Socket.IO Client
- **构建工具**: Vite
- **测试**: Vitest + Vue Test Utils
- **代码质量**: ESLint + Prettier + Husky

## 开发环境设置

### 前置要求

确保你已经安装了pnpm：

```bash
# 安装pnpm（如果还没有安装）
npm install -g pnpm
# 或者使用corepack（Node.js 16.10+）
corepack enable
```

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 运行测试

```bash
# 运行测试
pnpm test

# 运行测试并显示UI
pnpm test:ui

# 运行测试并生成覆盖率报告
pnpm test:coverage
```

### 代码质量检查

```bash
# ESLint检查和修复
pnpm lint

# Prettier格式化
pnpm format

# TypeScript类型检查
pnpm type-check
```

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── common/         # 通用组件
│   ├── agent/          # 代理相关组件
│   ├── brainstorm/     # 头脑风暴相关组件
│   └── layout/         # 布局组件
├── views/              # 页面视图
│   ├── auth/           # 认证页面
│   ├── dashboard/      # 主工作台
│   ├── agents/         # 代理管理
│   └── brainstorm/     # 头脑风暴
├── composables/        # 组合式函数
├── stores/             # Pinia状态管理
├── services/           # API服务
├── utils/              # 工具函数
├── types/              # TypeScript类型定义
├── constants/          # 常量定义
├── router/             # 路由配置
└── styles/             # 全局样式
```

## 开发指南

### 组件开发

- 使用Composition API和`<script setup>`语法
- 为所有Props和Emits定义TypeScript类型
- 使用Ant Design Vue组件库
- 遵循Vue 3最佳实践

### 状态管理

- 使用Pinia进行状态管理
- 按功能模块划分Store
- 使用组合式函数封装业务逻辑

### 样式规范

- 使用SCSS预处理器
- 遵循BEM命名规范
- 使用CSS Modules避免样式冲突

### 测试

- 为组件编写单元测试
- 使用Vue Test Utils进行组件测试
- 保持良好的测试覆盖率

## 环境变量

- `VITE_API_BASE_URL`: 后端API基础URL
- `VITE_SOCKET_URL`: WebSocket服务器URL

## 部署

项目使用Vite构建，生成的静态文件位于`dist`目录，可以部署到任何静态文件服务器。