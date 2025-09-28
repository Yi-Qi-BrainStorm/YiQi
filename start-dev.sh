#!/bin/bash

# AI头脑风暴平台开发环境启动脚本

echo "🚀 启动AI头脑风暴平台开发环境..."

# 检查是否安装了必要的工具
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 未安装，请先安装 $1"
        exit 1
    fi
}

echo "📋 检查依赖..."
check_command "java"
check_command "mvn"
check_command "node"
check_command "pnpm"

# 检查Java版本
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1-2)
if [[ "$JAVA_VERSION" < "11" ]]; then
    echo "❌ Java版本需要11或更高，当前版本: $JAVA_VERSION"
    exit 1
fi

echo "✅ 依赖检查完成"

# 启动后端服务
echo "🔧 启动后端服务..."
cd backend

# 检查是否需要安装依赖
if [ ! -d "target" ]; then
    echo "📦 安装后端依赖..."
    # 使用自定义Maven配置
    if [ -f "settings.xml" ]; then
        mvn -s settings.xml clean install -DskipTests
    else
        mvn clean install -DskipTests
    fi
fi

# 启动后端服务（后台运行）
echo "🚀 启动Spring Boot应用..."
# 使用自定义Maven配置
if [ -f "settings.xml" ]; then
    mvn -s settings.xml spring-boot:run > ../backend.log 2>&1 &
else
    mvn spring-boot:run > ../backend.log 2>&1 &
fi
BACKEND_PID=$!

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 10

# 检查后端是否启动成功
if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo "✅ 后端服务启动成功 (PID: $BACKEND_PID)"
else
    echo "❌ 后端服务启动失败，请检查日志: backend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 启动前端服务
echo "🔧 启动前端服务..."
cd ../frontend

# 检查是否需要安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    pnpm install
fi

# 启动前端服务
echo "🚀 启动Vite开发服务器..."
pnpm run dev &
FRONTEND_PID=$!

# 等待前端启动
echo "⏳ 等待前端服务启动..."
sleep 5

echo ""
echo "🎉 开发环境启动完成！"
echo ""
echo "📍 服务地址:"
echo "   前端: http://localhost:5173"
echo "   后端: http://localhost:8080"
echo "   API文档: http://localhost:8080/swagger-ui.html"
echo "   集成测试: http://localhost:5173/dev/backend-integration"
echo ""
echo "📋 进程信息:"
echo "   后端PID: $BACKEND_PID"
echo "   前端PID: $FRONTEND_PID"
echo ""
echo "🛑 停止服务:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   或者按 Ctrl+C"
echo ""

# 保存PID到文件
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f .backend.pid .frontend.pid; echo "✅ 服务已停止"; exit 0' INT

# 保持脚本运行
wait