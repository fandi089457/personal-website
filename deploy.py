#!/usr/bin/env python3
"""
GitHub 自動化部署腳本
使用 GitHub API 自動創建倉庫、上傳文件、啟用 GitHub Pages
"""

import requests
import json
import base64
import os
from pathlib import Path

class GitHubAutoDeploy:
    def __init__(self, token, username, repo_name):
        self.token = token
        self.username = username
        self.repo_name = repo_name
        self.api_base = "https://api.github.com"
        self.headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }
    
    def create_repository(self):
        """創建 GitHub 倉庫"""
        url = f"{self.api_base}/user/repos"
        data = {
            "name": self.repo_name,
            "description": "蔡紘的個人網站 - 現代化作品集",
            "private": False,
            "has_issues": True,
            "has_projects": True,
            "has_wiki": True,
            "auto_init": False
        }
        
        response = requests.post(url, headers=self.headers, json=data)
        if response.status_code == 201:
            print(f"✅ 倉庫 {self.repo_name} 創建成功！")
            return True
        else:
            print(f"❌ 創建倉庫失敗: {response.json()}")
            return False
    
    def upload_file(self, file_path, repo_path, commit_message="自動部署"):
        """上傳文件到 GitHub"""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
                encoded_content = base64.b64encode(content).decode('utf-8')
            
            url = f"{self.api_base}/repos/{self.username}/{self.repo_name}/contents/{repo_path}"
            data = {
                "message": commit_message,
                "content": encoded_content
            }
            
            response = requests.put(url, headers=self.headers, json=data)
            if response.status_code == 201:
                print(f"✅ 文件 {repo_path} 上傳成功！")
                return True
            else:
                print(f"❌ 上傳文件失敗: {response.json()}")
                return False
        except Exception as e:
            print(f"❌ 讀取文件失敗: {e}")
            return False
    
    def upload_all_files(self):
        """上傳所有網站文件"""
        files_to_upload = [
            ("index.html", "index.html"),
            ("script.js", "script.js"),
            ("README.md", "README.md")
        ]
        
        success_count = 0
        for local_file, repo_file in files_to_upload:
            if self.upload_file(local_file, repo_file):
                success_count += 1
        
        print(f"📁 文件上傳完成: {success_count}/{len(files_to_upload)} 成功")
        return success_count == len(files_to_upload)
    
    def enable_github_pages(self):
        """啟用 GitHub Pages"""
        url = f"{self.api_base}/repos/{self.username}/{self.repo_name}/pages"
        data = {
            "source": {
                "branch": "main",
                "path": "/"
            }
        }
        
        response = requests.post(url, headers=self.headers, json=data)
        if response.status_code == 201:
            print("✅ GitHub Pages 啟用成功！")
            print(f"🌐 網站將在 https://{self.username}.github.io/{self.repo_name}/ 上線")
            return True
        else:
            print(f"❌ 啟用 GitHub Pages 失敗: {response.json()}")
            return False
    
    def create_github_actions_workflow(self):
        """創建 GitHub Actions 工作流程"""
        workflow_content = """name: 自動部署個人網站

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: 檢出代碼
      uses: actions/checkout@v4
      
    - name: 設置 Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        
    - name: 部署到 GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      if: github.ref == 'refs/heads/main'
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./
"""
        
        # 創建 .github/workflows 目錄結構
        workflow_path = ".github/workflows/deploy.yml"
        
        url = f"{self.api_base}/repos/{self.username}/{self.repo_name}/contents/{workflow_path}"
        data = {
            "message": "添加 GitHub Actions 自動部署",
            "content": base64.b64encode(workflow_content.encode('utf-8')).decode('utf-8')
        }
        
        response = requests.put(url, headers=self.headers, json=data)
        if response.status_code == 201:
            print("✅ GitHub Actions 工作流程創建成功！")
            return True
        else:
            print(f"❌ 創建工作流程失敗: {response.json()}")
            return False
    
    def full_deploy(self):
        """完整部署流程"""
        print("🚀 開始自動化部署...")
        
        # 1. 創建倉庫
        if not self.create_repository():
            return False
        
        # 2. 上傳文件
        if not self.upload_all_files():
            return False
        
        # 3. 創建 GitHub Actions
        if not self.create_github_actions_workflow():
            return False
        
        # 4. 啟用 GitHub Pages
        if not self.enable_github_pages():
            return False
        
        print("🎉 自動化部署完成！")
        print(f"🌐 您的網站將在幾分鐘內上線: https://{self.username}.github.io/{self.repo_name}/")
        return True

def main():
    """主程序 - 自動執行"""
    print("=== GitHub 自動化部署工具 ===")
    print("� 正在自動執行部署...")
    
    # 自動獲取資訊
    token = "YOUR_GITHUB_TOKEN_HERE"  # 請替換為您的 Token
    username = "YOUR_GITHUB_USERNAME"  # 請替換為您的用戶名
    repo_name = "personal-website"  # 倉庫名稱
    
    print("� 請先在腳本中設置您的 GitHub Token 和用戶名")
    print("� 修改 token 和 username 變數後重新運行")
    
    # 檢查是否已設置
    if token == "YOUR_GITHUB_TOKEN_HERE" or username == "YOUR_GITHUB_USERNAME":
        print("❌ 請先設置 GitHub Token 和用戶名！")
        return
    
    # 執行部署
    deployer = GitHubAutoDeploy(token, username, repo_name)
    deployer.full_deploy()

if __name__ == "__main__":
    main()
