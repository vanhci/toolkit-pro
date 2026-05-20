function generateKey() {
  const part = () => Math.random().toString(36).substring(2, 8).toUpperCase();
  return 'TKP-' + part() + '-' + part();
}

export async function onRequestPost({ request, env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const email = (body && body.email) ? String(body.email).trim() : '';
  if (!email || !email.includes('@')) {
    return new Response(JSON.stringify({ success: false, message: 'Invalid email' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const key = generateKey();
  // Store in KV (bound to Pages project via CF_KV_NAMESPACE env)
  if (env.TOOLKIT_KV) {
    await env.TOOLKIT_KV.put(key, JSON.stringify({ email, createdAt: Date.now(), activated: false }));
  }

  return new Response(JSON.stringify({ success: true, key }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
