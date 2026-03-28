export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/generate' && request.method === 'POST') {
        const body = await request.json();
        const prompt = encodeURIComponent(body.prompt);
        const width = body.width || 512;
        const height = body.height || 512;
        
        if (!body.prompt) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing prompt' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            }
          );
        }

        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=${width}&height=${height}&nologo=true`;

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              uuid: Date.now().toString(),
              status: 'completed',
              resultUrl: imageUrl,
            },
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      if (path.startsWith('/status/')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: { status: 'completed' },
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
  },
};
