// Cloudflare Worker - API Proxy for Z-Image
// 解決 CORS 問題，允許 GitHub Pages 訪問

export default {
  async fetch(request, env, ctx) {
    // 設定 CORS 標頭
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 處理預檢請求
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204, 
        headers: corsHeaders 
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 轉發到 Z-Image API
      const targetUrl = `https://zimage.run/api/z-image${path}${url.search}`;
      
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: request.method !== 'GET' && request.method !== 'HEAD' 
          ? await request.text() 
          : undefined,
      });

      // 複製回應並添加 CORS 標頭
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers),
          ...corsHeaders,
        },
      });

      return newResponse;

    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message 
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },
};
