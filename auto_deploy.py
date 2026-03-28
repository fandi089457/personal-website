#!/usr/bin/env python3
"""
一鍵自動部署 - 只需要輸入 GitHub Token
"""

import requests
import json
import base64
import os
from pathlib import Path

def get_user_info(token):
    """獲取用戶資訊"""
    headers = {"Authorization": f"token {token}"}
    response = requests.get("https://api.github.com/user", headers=headers)
    if response.status_code == 200:
        return response.json()
    return None

def auto_deploy():
    """完全自動化部署"""
    print("🚀 一鍵自動部署系統")
    print("=" * 50)
    
    # 只需要 Token
    token = input("🔑 請輸入您的 GitHub Personal Access Token: ").strip()
    
    if not token:
        print("❌ Token 不能為空！")
        return
    
    # 獲取用戶資訊
    print("📡 正在驗證 Token...")
    user_info = get_user_info(token)
    
    if not user_info:
        print("❌ Token 無效！請檢查權限設置")
        return
    
    username = user_info['login']
    repo_name = "personal-website"
    
    print(f"✅ 歡迎 {username}！")
    print(f"📁 將創建倉庫: {repo_name}")
    
    # 開始部署
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    # 1. 創建倉庫
    print("🏗️ 正在創建倉庫...")
    repo_data = {
        "name": repo_name,
        "description": "蔡紘的個人網站 - 現代化作品集",
        "private": False,
        "auto_init": False
    }
    
    repo_response = requests.post(
        f"https://api.github.com/user/repos", 
        headers=headers, 
        json=repo_data
    )
    
    if repo_response.status_code != 201:
        print(f"❌ 倉庫創建失敗: {repo_response.json()}")
        return
    
    print("✅ 倉庫創建成功！")
    
    # 2. 上傳文件
    files_to_upload = [
        ("index.html", "index.html"),
        ("script.js", "script.js"), 
        ("README.md", "README.md")
    ]
    
    print("📁 正在上傳文件...")
    for filename, repo_path in files_to_upload:
        try:
            with open(filename, 'rb') as f:
                content = base64.b64encode(f.read()).decode('utf-8')
            
            file_data = {
                "message": f"添加 {filename}",
                "content": content
            }
            
            file_response = requests.put(
                f"https://api.github.com/repos/{username}/{repo_name}/contents/{repo_path}",
                headers=headers,
                json=file_data
            )
            
            if file_response.status_code == 201:
                print(f"✅ {filename} 上傳成功")
            else:
                print(f"❌ {filename} 上傳失敗")
                
        except Exception as e:
            print(f"❌ 讀取 {filename} 失敗: {e}")
    
    # 3. 啟用 GitHub Pages
    print("🌐 正在啟用 GitHub Pages...")
    pages_data = {
        "source": {"branch": "main", "path": "/"}
    }
    
    pages_response = requests.post(
        f"https://api.github.com/repos/{username}/{repo_name}/pages",
        headers=headers,
        json=pages_data
    )
    
    if pages_response.status_code == 201:
        print("✅ GitHub Pages 啟用成功！")
    else:
        print(f"❌ GitHub Pages 啟用失敗: {pages_response.json()}")
    
    # 4. 創建 GitHub Actions
    print("⚙️ 正在設置自動部署...")
    workflow_content = """name: 自動部署

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./
"""
    
    workflow_data = {
        "message": "添加自動部署",
        "content": base64.b64encode(workflow_content.encode()).decode()
    }
    
    workflow_response = requests.put(
        f"https://api.github.com/repos/{username}/{repo_name}/contents/.github/workflows/deploy.yml",
        headers=headers,
        json=workflow_data
    )
    
    if workflow_response.status_code == 201:
        print("✅ 自動部署設置完成！")
    else:
        print(f"❌ 自動部署設置失敗")
    
    # 完成
    print("\n" + "=" * 50)
    print("🎉 部署完成！")
    print(f"🌐 您的網站: https://{username}.github.io/{repo_name}/")
    print("⏱️ 請等待 2-5 分鐘讓網站上線")
    print("🔄 未來修改後 git push 即可自動部署")

if __name__ == "__main__":
    auto_deploy()
