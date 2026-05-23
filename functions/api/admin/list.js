function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
      'Content-Type': 'application/json',
    },
  });
}

function isAdmin(request, env) {
  const token = request.headers.get('X-Admin-Token') || '';
  return Boolean(env.ADMIN_TOKEN) && token === env.ADMIN_TOKEN;
}

export async function onRequestGet({ request, env }) {
  if (!isAdmin(request, env)) {
    return jsonResponse({ success: false, message: '管理员验证失败' }, 401);
  }

  if (!env.TOOLKIT_KV) {
    return jsonResponse({ success: false, message: '服务暂不可用' }, 503);
  }

  // 列出所有待审核记录，并读取完整内容返回给管理员。
  const keys = [];
  let cursor;
  do {
    const page = await env.TOOLKIT_KV.list({ prefix: 'pending:', cursor });
    keys.push(...page.keys);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  const pending = await Promise.all(keys.map(async item => {
    const raw = await env.TOOLKIT_KV.get(item.name);
    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = {};
    }

    return {
      key: item.name,
      email: data.email || item.name.replace(/^pending:/, ''),
      createdAt: data.createdAt || null,
      status: data.status || 'pending',
    };
  }));

  return jsonResponse({ success: true, pending });
}
