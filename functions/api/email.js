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
    return new Response(JSON.stringify({ success: false, message: '请输入有效邮箱' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!env.TOOLKIT_KV) {
    return new Response(JSON.stringify({ success: false, message: '服务暂不可用' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 只记录待审核请求，不生成、不返回激活码。
  await env.TOOLKIT_KV.put(`pending:${email}`, JSON.stringify({
    email,
    createdAt: Date.now(),
    status: 'pending',
  }));

  return new Response(JSON.stringify({
    success: true,
    message: '已收到您的请求，请付款后截图发送至 hcw43446@gmail.com，管理员审核后将发送激活码',
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
