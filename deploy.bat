@echo off
chcp 65001 >nul
echo 🚀 开始部署 NUL AI Tools...

:: 检查是否有变更
for /f "tokens=*" %%a in ('git status --porcelain') do set HAS_CHANGES=%%a
if "%HAS_CHANGES%"=="" (
    echo ⚠️ 没有要提交的变更
    exit /b 0
)

:: 获取提交信息（默认）
set MESSAGE=%1
if "%MESSAGE%"=="" set MESSAGE=自动部署更新

echo 📦 添加变更...
git add .

echo 💾 提交: %MESSAGE%
git commit -m "%MESSAGE%"

echo 📤 推送到 GitHub...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo ✅ 部署成功！
    echo 🌐 网站地址: https://fandi089457.github.io/personal-website/
    echo 🎨 AI工具: https://fandi089457.github.io/personal-website/ai-tools.html
) else (
    echo ❌ 部署失败
)

pause
