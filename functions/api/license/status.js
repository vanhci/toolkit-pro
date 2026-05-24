function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    },
  });
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function findActivatedLicense(env, email) {
  let cursor;
  do {
    const page = await env.TOOLKIT_KV.list({ cursor });
    for (const item of page.keys || []) {
      if (item.name.startsWith('pending:')) continue;

      const raw = await env.TOOLKIT_KV.get(item.name);
      if (!raw) continue;

      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        continue;
      }

      if (normalizeEmail(data.email) === email && data.activated === true) {
        return true;
      }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return false;
}

export async function onRequestOptions() {
  return jsonResponse({ success: true });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const email = normalizeEmail(url.searchParams.get('email'));

  if (!email || !email.includes('@') || !env.TOOLKIT_KV) {
    return jsonResponse({ success: true, unlocked: false });
  }

  const unlocked = await findActivatedLicense(env, email);
  return jsonResponse({ success: true, unlocked });
}
