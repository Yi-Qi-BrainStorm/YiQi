#!/bin/bash

# AI头脑风暴平台开发环境停止脚本

echo "🛑 停止AI头脑风暴平台开发环境..."

# 读取PID文件
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "🔧 停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        echo "✅ 后端服务已停止"
    else
        echo "⚠️  后端服务已经停止"
    fi
    rm -f .backend.pid
else
    echo "⚠️  未找到后端PID文件"
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "🔧 停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        echo "✅ 前端服务已停止"
    else
        echo "⚠️  前端服务已经停止"
    fi
    rm -f .frontend.pid
else
    echo "⚠️  未找到前端PID文件"
fi

# 清理可能残留的进程
echo "🧹 清理残留进程..."

# 查找并停止Spring Boot进程
SPRING_PIDS=$(pgrep -f "spring-boot:run")
if [ ! -z "$SPRING_PIDS" ]; then
    echo "🔧 停止Spring Boot进程: $SPRING_PIDS"
    kill $SPRING_PIDS 2>/dev/null
fi

# 查找并停止Vite进程
VITE_PIDS=$(pgrep -f "vite")
if [ ! -z "$VITE_PIDS" ]; then
    echo "🔧 停止Vite进程: $VITE_PIDS"
    kill $VITE_PIDS 2>/dev/null
fi

# 查找并停止占用8080端口的进程
PORT_8080_PID=$(lsof -ti:8080)
if [ ! -z "$PORT_8080_PID" ]; then
    echo "🔧 停止占用8080端口的进程: $PORT_8080_PID"
    kill $PORT_8080_PID 2>/dev/null
fi

# 查找并停止占用5173端口的进程
PORT_5173_PID=$(lsof -ti:5173)
if [ ! -z "$PORT_5173_PID" ]; then
    echo "🔧 停止占用5173端口的进程: $PORT_5173_PID"
    kill $PORT_5173_PID 2>/dev/null
fi

echo "✅ 开发环境已完全停止"