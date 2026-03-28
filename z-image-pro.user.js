// ==UserScript==
// @name         Z-Image AI Generator Pro
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  AI圖片生成器 - 免登入、完全免費
// @author       NUL
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @connect      zimage.run
// ==/UserScript==

(function() {
    'use strict';

    // 設定
    const CONFIG = {
        API_BASE: 'https://zimage.run/api/z-image',
        POLL_INTERVAL: 3000,
        MAX_ATTEMPTS: 200,
        DEFAULT_SIZE: 512
    };

    // 樣式
    GM_addStyle(`
        #z-float-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            cursor: pointer;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s;
            border: none;
            box-shadow: 0 4px 12px rgba(102,126,234,0.4);
        }
        #z-float-btn:hover { transform: scale(1.1); }
        #z-modal {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 1000000;
            display: none;
            align-items: center;
            justify-content: center;
        }
        #z-modal.show { display: flex; }
        #z-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 600px;
            padding: 24px;
            animation: slideIn 0.3s ease;
        }
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(-30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .z-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .z-title { font-size: 20px; font-weight: bold; color: #333; margin: 0; }
        .z-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #999;
        }
        .z-input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 12px;
            font-size: 14px;
            box-sizing: border-box;
        }
        .z-input:focus {
            outline: none;
            border-color: #667eea;
        }
        .z-textarea {
            min-height: 100px;
            resize: vertical;
        }
        .z-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
        }
        .z-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .z-btn:hover { opacity: 0.9; }
        .z-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .z-result {
            margin-top: 20px;
            padding: 16px;
            background: #f9fafb;
            border-radius: 8px;
            display: none;
        }
        .z-result.show { display: block; }
        .z-spinner {
            width: 24px;
            height: 24px;
            border: 3px solid #e5e7eb;
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .z-img { width: 100%; border-radius: 8px; margin-top: 12px; }
        .z-actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
        }
        .z-action-btn {
            flex: 1;
            padding: 10px;
            background: white;
            border: 2px solid #667eea;
            color: #667eea;
            border-radius: 6px;
            cursor: pointer;
        }
        .z-action-btn:hover {
            background: #667eea;
            color: white;
        }
        .z-error {
            color: #dc2626;
            padding: 12px;
            background: #fee2e2;
            border-radius: 8px;
            margin-top: 12px;
        }
    `);

    // API 請求
    function api(url, opts = {}) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: opts.method || 'GET',
                url,
                headers: { 'Content-Type': 'application/json', ...opts.headers },
                data: opts.body ? JSON.stringify(opts.body) : undefined,
                onload: r => {
                    try { resolve(JSON.parse(r.responseText)); }
                    catch { reject(new Error('Parse error')); }
                },
                onerror: () => reject(new Error('Network error')),
                ontimeout: () => reject(new Error('Timeout'))
            });
        });
    }

    // 生成圖片
    async function generate(prompt, w, h) {
        const r = await api(`${CONFIG.API_BASE}/generate`, {
            method: 'POST',
            body: { prompt, width: w, height: h }
        });
        if (!r.success) throw new Error(r.error || 'Failed');
        return r.data;
    }

    // 檢查狀態
    async function check(uuid) {
        const r = await api(`${CONFIG.API_BASE}/status/${uuid}`);
        if (!r.success) throw new Error(r.error || 'Failed');
        return r.data;
    }

    // 等待完成
    async function wait(uuid, onProgress) {
        for (let i = 0; i < CONFIG.MAX_ATTEMPTS; i++) {
            const s = await check(uuid);
            onProgress?.(s);
            if (s.status === 'completed') return s;
            if (s.status === 'failed') throw new Error(s.errorMessage || 'Failed');
            await new Promise(r => setTimeout(r, CONFIG.POLL_INTERVAL));
        }
        throw new Error('Timeout');
    }

    // 建立懸浮按鈳
    function createBtn() {
        const btn = document.createElement('button');
        btn.id = 'z-float-btn';
        btn.innerHTML = '🎨';
        btn.title = 'Z-Image AI 圖片生成器';
        btn.onclick = openModal;
        document.body.appendChild(btn);
    }

    // 建立模態框
    function createModal() {
        const m = document.createElement('div');
        m.id = 'z-modal';
        m.innerHTML = `
            <div id="z-content">
                <div class="z-header">
                    <h2 class="z-title">🎨 AI 圖片生成器</h2>
                    <button class="z-close" onclick="document.getElementById('z-modal').classList.remove('show')">×</button>
                </div>
                <textarea id="z-prompt" class="z-input z-textarea" placeholder="描述你想生成的圖片..."></textarea>
                <div class="z-row">
                    <input id="z-width" class="z-input" type="number" value="512" placeholder="寬度">
                    <input id="z-height" class="z-input" type="number" value="512" placeholder="高度">
                </div>
                <button id="z-generate" class="z-btn">✨ 開始生成</button>
                <div id="z-result" class="z-result">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div class="z-spinner"></div>
                        <span id="z-status">生成中...</span>
                    </div>
                    <img id="z-img" class="z-img" style="display:none;">
                    <div id="z-actions" class="z-actions" style="display:none;">
                        <button class="z-action-btn" onclick="document.getElementById('z-img').src&&window.open(document.getElementById('z-img').src)">下載</button>
                        <button class="z-action-btn" onclick="document.getElementById('z-img').src&&(GM_setClipboard(document.getElementById('z-img').src),alert('已複製連結'))">複製連結</button>
                    </div>
                    <div id="z-error" class="z-error" style="display:none;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(m);
        m.onclick = e => { if (e.target === m) m.classList.remove('show'); };
        document.getElementById('z-generate').onclick = handleGenerate;
    }

    // 打開模態框
    function openModal(text = '') {
        const m = document.getElementById('z-modal');
        m.classList.add('show');
        if (text) document.getElementById('z-prompt').value = text;
        document.getElementById('z-result').classList.remove('show');
        document.getElementById('z-img').style.display = 'none';
        document.getElementById('z-actions').style.display = 'none';
        document.getElementById('z-error').style.display = 'none';
    }

    // 處理生成
    async function handleGenerate() {
        const prompt = document.getElementById('z-prompt').value.trim();
        const w = parseInt(document.getElementById('z-width').value);
        const h = parseInt(document.getElementById('z-height').value);
        const btn = document.getElementById('z-generate');
        const result = document.getElementById('z-result');
        const status = document.getElementById('z-status');
        const img = document.getElementById('z-img');
        const actions = document.getElementById('z-actions');
        const error = document.getElementById('z-error');

        if (!prompt) { alert('請輸入描述'); return; }
        if (w < 64 || w > 2048 || h < 64 || h > 2048) { alert('尺寸必須在 64-2048 之間'); return; }

        btn.disabled = true;
        btn.textContent = '⏳ 生成中...';
        result.classList.add('show');
        error.style.display = 'none';
        img.style.display = 'none';
        actions.style.display = 'none';

        try {
            const { uuid } = await generate(prompt, w, h);
            const data = await wait(uuid, s => {
                if (s.status === 'pending') status.textContent = `排隊中，前面還有 ${s.queuePosition} 個任務...`;
                else if (s.status === 'processing') status.textContent = `生成中 ${s.progress}%...`;
            });
            status.textContent = '✅ 完成！';
            img.src = data.resultUrl;
            img.style.display = 'block';
            actions.style.display = 'flex';
        } catch (e) {
            status.textContent = '❌ 失敗';
            error.textContent = e.message;
            error.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = '✨ 開始生成';
        }
    }

    // 右鍵選單
    function createMenu() {
        const menu = document.createElement('div');
        menu.style.cssText = 'position:fixed;background:white;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);padding:8px 0;display:none;z-index:1000001;min-width:160px;';
        menu.innerHTML = '<div style="padding:8px 16px;cursor:pointer;font-size:14px;" onmouseover="this.style.background=\'#f3f4f6\'" onmouseout="this.style.background=\'white\'" onclick="window.zOpenSelection&&window.zOpenSelection()">🎨 用 Z-Image 生成</div>';
        document.body.appendChild(menu);
        
        window.zOpenSelection = () => {
            openModal(window.getSelection().toString().trim());
            menu.style.display = 'none';
        };
        
        document.addEventListener('contextmenu', e => {
            const text = window.getSelection().toString().trim();
            if (!text) return;
            e.preventDefault();
            menu.style.left = e.pageX + 'px';
            menu.style.top = e.pageY + 'px';
            menu.style.display = 'block';
        });
        
        document.addEventListener('click', () => menu.style.display = 'none');
    }

    // 初始化
    function init() {
        createBtn();
        createModal();
        createMenu();
        GM_registerMenuCommand('🎨 打開 AI 圖片生成器', openModal);
        console.log('✅ Z-Image Pro 已載入');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
