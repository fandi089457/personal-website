# NUL 工作流存档系统
# 自动保存进度、配置和数据

import json
import os
from datetime import datetime
from pathlib import Path

class NULSaveSystem:
    """NUL 自动化工作流存档系统"""
    
    def __init__(self):
        self.save_dir = Path.home() / ".nul-studio"
        self.save_dir.mkdir(exist_ok=True)
        
    def save_project(self, project_name, data):
        """保存项目进度"""
        save_file = self.save_dir / f"{project_name}.json"
        
        save_data = {
            "name": project_name,
            "data": data,
            "saved_at": datetime.now().isoformat(),
            "version": "1.0"
        }
        
        with open(save_file, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 项目 '{project_name}' 已保存")
        return save_file
    
    def load_project(self, project_name):
        """加载项目进度"""
        save_file = self.save_dir / f"{project_name}.json"
        
        if not save_file.exists():
            print(f"❌ 未找到项目 '{project_name}'")
            return None
        
        with open(save_file, 'r', encoding='utf-8') as f:
            save_data = json.load(f)
        
        print(f"✅ 项目 '{project_name}' 已加载")
        print(f"   上次保存: {save_data.get('saved_at', '未知')}")
        return save_data["data"]
    
    def list_projects(self):
        """列出所有存档项目"""
        saves = list(self.save_dir.glob("*.json"))
        
        if not saves:
            print("📂 暂无存档")
            return []
        
        print("📂 存档列表:")
        projects = []
        for save in saves:
            with open(save, 'r', encoding='utf-8') as f:
                data = json.load(f)
                projects.append({
                    "name": data["name"],
                    "saved_at": data["saved_at"],
                    "file": save.name
                })
                print(f"  • {data['name']} - {data['saved_at']}")
        
        return projects
    
    def auto_save(self, data, interval_minutes=5):
        """自动存档功能"""
        # 自动保存到临时文件
        auto_save_file = self.save_dir / "auto_save.json"
        
        auto_data = {
            "data": data,
            "saved_at": datetime.now().isoformat(),
            "auto": True
        }
        
        with open(auto_save_file, 'w', encoding='utf-8') as f:
            json.dump(auto_data, f, ensure_ascii=False, indent=2)
        
        print(f"💾 自动保存完成 ({datetime.now().strftime('%H:%M:%S')})")

# 全局存档管理器
save_system = NULSaveSystem()

# 快捷函数
def save(name, data):
    """快速保存"""
    return save_system.save_project(name, data)

def load(name):
    """快速加载"""
    return save_system.load_project(name)

def list_saves():
    """快速列出存档"""
    return save_system.list_projects()

# 示例用法
if __name__ == "__main__":
    # 保存当前工作进度
    current_work = {
        "completed_projects": ["prompt-store", "chrome-extension"],
        "pending_projects": ["auto-bidding", "data-analysis"],
        "revenue_today": 0,
        "notes": "已完成2个项目，还有8个待做"
    }
    
    save("work-progress-2024-03-29", current_work)
    
    # 列出所有存档
    list_saves()
    
    # 加载存档
    # loaded = load("work-progress-2024-03-29")
    # print(loaded)
