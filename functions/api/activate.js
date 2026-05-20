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
  const key = (body && body.key) ? String(body.key).trim() : '';

  if (!email || !key) {
    return new Response(JSON.stringify({ success: false, message: 'Missing email or key' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!env.TOOLKIT_KV) {
    return new Response(JSON.stringify({ success: false, message: 'Service unavailable' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const stored = await env.TOOLKIT_KV.get(key);
  if (!stored) {
    return new Response(JSON.stringify({ success: false, message: 'Invalid key' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const data = JSON.parse(stored);
  if (data.email !== email) {
    return new Response(JSON.stringify({ success: false, message: 'Invalid key' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (data.activated) {
    return new Response(JSON.stringify({ success: false, message: 'Key already activated' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  data.activated = true;
  data.activatedAt = Date.now();
  await env.TOOLKIT_KV.put(key, JSON.stringify(data));

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
