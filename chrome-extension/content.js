// NUL AI Assistant - Content Script
// 在网页中注入AI助手功能

// 创建浮动按钮和结果展示框
let floatingButton = null;
let resultPanel = null;

// 监听来自background script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action && request.text) {
    showLoading(request.text, request.action);
    processAIRequest(request.text, request.action);
  }
});

// 显示加载状态
function showLoading(text, action) {
  removeExistingElements();
  
  // 获取选中文本的位置
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // 创建结果面板
  resultPanel = document.createElement('div');
  resultPanel.id = 'nul-ai-result-panel';
  resultPanel.className = 'nul-ai-panel';
  resultPanel.innerHTML = `
    <div class="nul-ai-header">
      <span class="nul-ai-title">🤖 NUL AI Assistant</span>
      <button class="nul-ai-close" onclick="this.closest('.nul-ai-panel').remove()">×</button>
    </div>
    <div class="nul-ai-loading">
      <div class="nul-ai-spinner"></div>
      <p>正在${getActionName(action)}...</p>
    </div>
  `;
  
  // 设置位置
  resultPanel.style.top = `${rect.bottom + window.scrollY + 10}px`;
  resultPanel.style.left = `${rect.left + window.scrollX}px`;
  
  document.body.appendChild(resultPanel);
}

// 处理AI请求
async function processAIRequest(text, action) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'AI_REQUEST',
      prompt: text,
      action: action
    });
    
    if (response.success) {
      showResult(response.result, action);
    } else {
      showError(response.error);
    }
  } catch (error) {
    showError(error.message);
  }
}

// 显示结果
function showResult(result, action) {
  const panel = document.getElementById('nul-ai-result-panel');
  if (!panel) return;
  
  const actionName = getActionName(action);
  
  panel.innerHTML = `
    <div class="nul-ai-header">
      <span class="nul-ai-title">🤖 NUL AI - ${actionName}</span>
      <div>
        <button class="nul-ai-copy" onclick="copyResult(this)">📋 复制</button>
        <button class="nul-ai-close" onclick="this.closest('.nul-ai-panel').remove()">×</button>
      </div>
    </div>
    <div class="nul-ai-content">
      ${formatResult(result)}
    </div>
    <div class="nul-ai-footer">
      <button class="nul-ai-btn" onclick="insertText(this)">插入到页面</button>
      <button class="nul-ai-btn secondary" onclick="this.closest('.nul-ai-panel').remove()">关闭</button>
    </div>
  `;
}

// 显示错误
function showError(error) {
  const panel = document.getElementById('nul-ai-result-panel');
  if (!panel) return;
  
  panel.innerHTML = `
    <div class="nul-ai-header">
      <span class="nul-ai-title">❌ 错误</span>
      <button class="nul-ai-close" onclick="this.closest('.nul-ai-panel').remove()">×</button>
    </div>
    <div class="nul-ai-error">
      <p>${error}</p>
      <p class="nul-ai-hint">请检查API设置或稍后重试</p>
    </div>
  `;
}

// 格式化结果
function formatResult(text) {
  // 将换行符转换为HTML
  return text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^/ , '<p>')
    .replace(/$/, '</p>');
}

// 获取动作名称
function getActionName(action) {
  const names = {
    translate: '翻译',
    summarize: '摘要',
    rewrite: '改写',
    explain: '解释',
    reply: '生成回复'
  };
  return names[action] || '处理';
}

// 复制结果
function copyResult(button) {
  const content = button.closest('.nul-ai-panel').querySelector('.nul-ai-content').innerText;
  navigator.clipboard.writeText(content).then(() => {
    button.textContent = '✅ 已复制';
    setTimeout(() => {
      button.textContent = '📋 复制';
    }, 2000);
  });
}

// 插入文本到页面
function insertText(button) {
  const content = button.closest('.nul-ai-panel').querySelector('.nul-ai-content').innerText;
  
  // 尝试找到输入框并插入
  const activeElement = document.activeElement;
  if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
    if (activeElement.isContentEditable) {
      document.execCommand('insertText', false, content);
    } else {
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      const value = activeElement.value;
      activeElement.value = value.substring(0, start) + content + value.substring(end);
    }
    button.closest('.nul-ai-panel').remove();
  } else {
    alert('请先点击一个输入框，再插入文本');
  }
}

// 移除已有元素
function removeExistingElements() {
  const existing = document.getElementById('nul-ai-result-panel');
  if (existing) {
    existing.remove();
  }
}

// 添加全局函数
window.copyResult = copyResult;
window.insertText = insertText;
