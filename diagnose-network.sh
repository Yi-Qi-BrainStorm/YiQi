#!/bin/bash

# 网络连接诊断脚本

echo "🔍 网络连接诊断..."
echo ""

# 测试基本网络连接
echo "1. 测试基本网络连接:"
if ping -c 3 8.8.8.8 > /dev/null 2>&1; then
    echo "   ✅ 基本网络连接正常"
else
    echo "   ❌ 基本网络连接失败"
    echo "   💡 请检查网络连接"
    exit 1
fi

# 测试DNS解析
echo ""
echo "2. 测试DNS解析:"
if nslookup repo.maven.apache.org > /dev/null 2>&1; then
    echo "   ✅ DNS解析正常"
else
    echo "   ❌ DNS解析失败"
    echo "   💡 可能需要配置DNS或使用镜像"
fi

# 测试Maven中央仓库连接
echo ""
echo "3. 测试Maven中央仓库连接:"
if curl -I --connect-timeout 10 https://repo.maven.apache.org/maven2/ > /dev/null 2>&1; then
    echo "   ✅ Maven中央仓库连接正常"
else
    echo "   ❌ Maven中央仓库连接失败"
    echo "   💡 建议使用阿里云镜像"
fi

# 测试阿里云Maven镜像
echo ""
echo "4. 测试阿里云Maven镜像:"
if curl -I --connect-timeout 10 https://maven.aliyun.com/repository/public/ > /dev/null 2>&1; then
    echo "   ✅ 阿里云Maven镜像连接正常"
    echo "   💡 建议使用阿里云镜像加速下载"
else
    echo "   ❌ 阿里云Maven镜像连接失败"
fi

# 检查Maven配置
echo ""
echo "5. 检查Maven配置:"
if [ -f "backend/settings.xml" ]; then
    echo "   ✅ 找到自定义Maven配置文件"
else
    echo "   ⚠️  未找到自定义Maven配置文件"
    echo "   💡 建议创建settings.xml配置阿里云镜像"
fi

# 检查Maven版本
echo ""
echo "6. Maven版本信息:"
if command -v mvn &> /dev/null; then
    mvn -version
else
    echo "   ❌ Maven未安装"
fi

echo ""
echo "🔧 建议的解决方案:"
echo "   1. 使用阿里云Maven镜像（已创建settings.xml）"
echo "   2. 如果网络问题持续，可以先使用前端Mock模式开发"
echo "   3. 运行 ./start-frontend-only.sh 启动纯前端环境"
echo ""