export async function onRequest({ request, env }) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');

  const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json', ...cors }
  });

  try {
    if (path === 'verify-key' && request.method === 'POST') {
      const { key } = await request.json();
      if (!key) return json({ error: 'key required' }, 400);

      const stored = await env.TOOLKIT_KV.get(key);
      if (stored !== 'valid') return json({ error: '无效的 key' }, 401);

      const timestamp = Date.now();
      const raw = `${key}:${timestamp}`;
      const encoder = new TextEncoder();
      const keyData = encoder.encode(env.SECRET_KEY);
      const msgData = encoder.encode(raw);
      const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
      const token = btoa(String.fromCharCode(...new Uint8Array(sig))) + `.${timestamp}`;

      await env.TOOLKIT_KV.put(`token:${token}`, key, { expirationTtl: 86400 * 365 });
      return json({ token, expires: timestamp + 86400 * 1000 });
    }

    if (path === 'check-token' && request.method === 'GET') {
      const auth = request.headers.get('Authorization') || '';
      const token = auth.replace('Bearer ', '');
      if (!token) return json({ valid: false });
      const key = await env.TOOLKIT_KV.get(`token:${token}`);
      return json({ valid: !!key });
    }

    if (path === 'add-key' && request.method === 'POST') {
      const auth = request.headers.get('Authorization') || '';
      if (auth !== `Bearer ${env.ADMIN_KEY}`) return json({ error: 'unauthorized' }, 401);
      const { key } = await request.json();
      if (!key) return json({ error: 'key required' }, 400);
      await env.TOOLKIT_KV.put(key, 'valid', { expirationTtl: 86400 * 365 * 10 });
      return json({ ok: true, key });
    }

    return json({ error: 'not found' }, 404);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
