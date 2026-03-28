#!/bin/bash
# NUL AI Tools 自动化部署脚本
# 用法: ./deploy.sh "提交信息"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 开始部署 NUL AI Tools...${NC}"

# 检查是否有变更
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️ 没有要提交的变更${NC}"
    exit 0
fi

# 获取提交信息
MESSAGE=${1:-"自动部署更新"}

# 添加所有变更
echo -e "${YELLOW}📦 添加变更...${NC}"
git add .

# 提交
echo -e "${YELLOW}💾 提交: $MESSAGE${NC}"
git commit -m "$MESSAGE"

# 推送到 GitHub
echo -e "${YELLOW}📤 推送到 GitHub...${NC}"
git push origin main

# 检查结果
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 部署成功！${NC}"
    echo -e "${GREEN}🌐 网站地址: https://fandi089457.github.io/personal-website/${NC}"
    echo -e "${GREEN}🎨 AI工具: https://fandi089457.github.io/personal-website/ai-tools.html${NC}"
else
    echo -e "${RED}❌ 部署失败${NC}"
    exit 1
fi
