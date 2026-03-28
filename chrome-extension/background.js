// NUL AI Assistant - Background Script
// 处理右键菜单和AI请求

// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  // 翻译菜单
  chrome.contextMenus.create({
    id: "translate",
    title: "🌐 翻译",
    contexts: ["selection"]
  });

  // 摘要菜单
  chrome.contextMenus.create({
    id: "summarize",
    title: "📝 摘要",
    contexts: ["selection"]
  });

  // 改写菜单
  chrome.contextMenus.create({
    id: "rewrite",
    title: "✏️ 改写",
    contexts: ["selection"]
  });

  // 解释菜单
  chrome.contextMenus.create({
    id: "explain",
    title: "💡 解释",
    contexts: ["selection"]
  });

  // 回复邮件菜单
  chrome.contextMenus.create({
    id: "reply",
    title: "📧 生成回复",
    contexts: ["selection"]
  });

  console.log('NUL AI Assistant 已安装');
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText;
  const action = info.menuItemId;

  // 向content script发送消息
  chrome.tabs.sendMessage(tab.id, {
    action: action,
    text: selectedText
  });
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'AI_REQUEST') {
    handleAIRequest(request.prompt, request.action)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 保持连接以进行异步响应
  }
});

// 处理AI请求
async function handleAIRequest(text, action) {
  // 从storage获取API设置
  const settings = await chrome.storage.sync.get({
    apiProvider: 'gemini',
    apiKey: '',
    model: 'gemini-1.5-flash'
  });

  if (!settings.apiKey) {
    throw new Error('请先设置 API Key');
  }

  // 构建prompt
  const prompts = {
    translate: `请将以下文本翻译成中文：\n\n${text}`,
    summarize: `请用3-5个要点总结以下文本：\n\n${text}`,
    rewrite: `请改写以下文本，使其更简洁专业：\n\n${text}`,
    explain: `请用简单易懂的语言解释以下概念：\n\n${text}`,
    reply: `请根据以下内容生成一封礼貌的回复邮件：\n\n${text}`
  };

  const prompt = prompts[action] || text;

  try {
    // 调用Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('AI Request Error:', error);
    throw error;
  }
}
