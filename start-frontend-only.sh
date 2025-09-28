#!/bin/bash

# 仅启动前端开发环境（使用Mock模式）

echo "🚀 启动前端开发环境（Mock模式）..."

# 检查Node.js和npm
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 未安装，请先安装 $1"
        exit 1
    fi
}

echo "📋 检查依赖..."
check_command "node"
check_command "npm"

echo "✅ 依赖检查完成"

# 启动前端服务
echo "🔧 启动前端服务..."
cd frontend

# 检查是否需要安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

# 设置Mock模式环境变量
export VITE_ENABLE_MOCK=true

# 启动前端服务
echo "🚀 启动Vite开发服务器（Mock模式）..."
npm run dev &
FRONTEND_PID=$!

# 等待前端启动
echo "⏳ 等待前端服务启动..."
sleep 5

echo ""
echo "🎉 前端开发环境启动完成（Mock模式）！"
echo ""
echo "📍 服务地址:"
echo "   前端: http://localhost:5173"
echo "   Mock测试: http://localhost:5173/dev/mock"
echo "   集成测试: http://localhost:5173/dev/backend-integration"
echo ""
echo "📋 进程信息:"
echo "   前端PID: $FRONTEND_PID"
echo ""
echo "🛑 停止服务:"
echo "   kill $FRONTEND_PID"
echo "   或者按 Ctrl+C"
echo ""
echo "💡 提示: 当前使用Mock模式，所有数据都是模拟数据"
echo "💡 如需连接真实后端，请先解决后端启动问题"
echo ""

# 保存PID到文件
echo "$FRONTEND_PID" > .frontend.pid

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; kill $FRONTEND_PID 2>/dev/null; rm -f .frontend.pid; echo "✅ 服务已停止"; exit 0' INT

# 保持脚本运行
wait