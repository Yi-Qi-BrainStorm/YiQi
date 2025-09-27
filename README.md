# AI头脑风暴平台

基于AI的头脑风暴文创产品设计平台，支持多代理协作的创意生成系统。

## 项目结构

这是一个monorepo项目，使用pnpm workspace管理：

```
├── frontend/          # Vue 3 + TypeScript 前端应用
├── backend/           # Java Spring Boot 后端服务
├── pnpm-workspace.yaml # pnpm workspace配置
└── package.json       # 根项目配置
```

## 技术栈

### 前端
- **框架**: Vue 3 + TypeScript
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **UI组件库**: Ant Design Vue 4.x
- **构建工具**: Vite
- **包管理器**: pnpm

### 后端
- **框架**: Java Spring Boot
- **数据库**: 待定
- **实时通信**: WebSocket

## 快速开始

### 前置要求

确保你已经安装了以下工具：

- Node.js 18+
- pnpm 8+
- Java 17+

```bash
# 安装pnpm（如果还没有安装）
npm install -g pnpm
# 或者使用corepack（Node.js 16.10+）
corepack enable
```

### 安装依赖

```bash
# 安装所有项目依赖
pnpm install
```

### 启动开发环境

```bash
# 启动前端开发服务器
pnpm dev

# 或者单独启动前端
pnpm --filter frontend dev
```

### 构建项目

```bash
# 构建前端
pnpm build

# 或者单独构建前端
pnpm --filter frontend build
```

### 运行测试

```bash
# 运行前端测试
pnpm test

# 或者单独运行前端测试
pnpm --filter frontend test
```

## 功能特性

- 🤖 **多AI代理系统**: 支持创建不同角色的AI代理（设计师、市场调研员、工程师等）
- 🧠 **三阶段头脑风暴**: 创意生成 → 技术可行性分析 → 缺点讨论
- ⚡ **实时协作**: 基于WebSocket的实时多代理并行处理
- 📊 **智能总结**: AI自动生成阶段总结和最终产品方案
- 🎨 **文创专业**: 专门针对文创产品设计优化的工作流程
- 📱 **响应式设计**: 支持桌面端和移动端访问

## 开发指南

详细的开发指南请参考各子项目的README文件：

- [前端开发指南](./frontend/README.md)
- [后端开发指南](./backend/README.md)

## 项目规格

完整的项目规格文档位于 `.kiro/specs/ai-brainstorm-platform/` 目录：

- [需求文档](./kiro/specs/ai-brainstorm-platform/requirements.md)
- [设计文档](./kiro/specs/ai-brainstorm-platform/design.md)
- [任务计划](./kiro/specs/ai-brainstorm-platform/tasks.md)

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。
