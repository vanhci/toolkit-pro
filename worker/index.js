addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event.env));
});

function generateKey() {
  const part = () => Math.random().toString(36).substring(2, 8).toUpperCase();
  return 'TKP-' + part() + '-' + part();
}

async function handleRequest(request, env) {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };

  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const url = new URL(request.url);

  if (url.pathname.endsWith('/email')) {
    const body = await request.json().catch(() => ({}));
    const email = (body && body.email) ? String(body.email).trim() : '';

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid email' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const key = generateKey();

    // Store in KV
    await TOOLKIT_KV.put(key, JSON.stringify({ email, createdAt: Date.now(), activated: false }));

    return new Response(JSON.stringify({ success: true, key }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (url.pathname.endsWith('/activate')) {
    const body = await request.json().catch(() => ({}));
    const email = (body && body.email) ? String(body.email).trim() : '';
    const key = (body && body.key) ? String(body.key).trim() : '';

    if (!email || !key) {
      return new Response(JSON.stringify({ success: false, message: 'Missing email or key' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check KV for key
    const stored = await TOOLKIT_KV.get(key);
    if (!stored) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid key' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = JSON.parse(stored);
    if (data.email !== email) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid key' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (data.activated) {
      return new Response(JSON.stringify({ success: false, message: 'Key already activated' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Activate the key
    data.activated = true;
    data.activatedAt = Date.now();
    await TOOLKIT_KV.put(key, JSON.stringify(data));

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ message: 'ToolKit API' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}