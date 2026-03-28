@echo off
chcp 65001 >nul
echo 🚀 正在自動部署您的個人網站...
echo.

REM 檢查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 需要安裝 Python
    echo 請下載安裝: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python 已安裝
echo.

REM 安裝依賴
echo 📦 正在安裝必要套件...
pip install requests >nul 2>&1

echo ✅ 套件安裝完成
echo.

REM 運行自動部署
echo 🌐 正在部署到 GitHub...
echo 請準備您的 GitHub Token
echo.

python auto_deploy.py

echo.
echo 🎉 完成！請查看上方的網址
pause
