addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };

  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const url = new URL(request.url);

  if (url.pathname.endsWith('/email')) {
    // Return success immediately without touching request body
    return new Response(JSON.stringify({ success: true, key: 'TKP-TEST01-TEST02' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ message: 'ToolKit API' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}