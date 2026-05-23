// 生成激活码：TKP-XXXXXX-XXXXXX
function generateKey() {
  const part = () => Math.random().toString(36).substring(2, 8).toUpperCase();
  return 'TKP-' + part() + '-' + part();
}

// 发邮件（通过 Resend API）
async function sendActivationEmail(email, key, env) {
  const RESEND_API_KEY = env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

  const subject = '🎉 你的 ToolKit Pro 激活码';
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .logo { font-size: 24px; font-weight: 700; color: #1f2937; margin-bottom: 24px; }
    .title { font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 16px; }
    .key-box { background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0; }
    .key { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 22px; font-weight: 700; color: #2563eb; letter-spacing: 2px; }
    .steps { background: #eff6ff; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .steps li { margin: 8px 0; color: #1e40af; font-size: 14px; line-height: 1.5; }
    .warn { color: #dc2626; font-size: 13px; margin-top: 20px; }
    .footer { margin-top: 24px; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🛠️ ToolKit Pro</div>
    <div class="title">感谢你的支持！以下是激活码：</div>
    <div class="key-box">
      <div class="key">${key}</div>
    </div>
    <div class="steps">
      <ol>
        <li>打开 ToolKit Pro 页面</li>
        <li>点击「解锁完整版」按钮</li>
        <li>粘贴上方激活码完成激活</li>
      </ol>
    </div>
    <div class="warn">⚠️ 激活码有效期为 30 天，请尽快激活。</div>
    <div class="footer">此邮件由系统自动发送，请勿回复。</div>
  </div>
</body>
</html>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ToolKit Pro <noreply@resend.dev>',
      to: [email],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Resend error:', err);
    return false;
  }
  return true;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
      'Content-Type': 'application/json',
    },
  });
}

function isAdmin(request, env) {
  const token = request.headers.get('X-Admin-Token') || '';
  return Boolean(env.ADMIN_TOKEN) && token === env.ADMIN_TOKEN;
}

export async function onRequestPost({ request, env }) {
  if (!isAdmin(request, env)) {
    return jsonResponse({ success: false, message: '管理员验证失败' }, 401);
  }

  if (!env.TOOLKIT_KV) {
    return jsonResponse({ success: false, message: '服务暂不可用' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const email = (body && body.email) ? String(body.email).trim() : '';
  if (!email || !email.includes('@')) {
    return jsonResponse({ success: false, message: '请输入有效邮箱' }, 400);
  }

  const pendingKey = `pending:${email}`;
  const pending = await env.TOOLKIT_KV.get(pendingKey);
  if (!pending) {
    return jsonResponse({ success: false, message: '未找到待审核记录' }, 404);
  }
  let pendingData = {};
  try {
    pendingData = JSON.parse(pending);
  } catch {
    pendingData = {};
  }

  const key = generateKey();
  await env.TOOLKIT_KV.put(key, JSON.stringify({
    email,
    createdAt: pendingData.createdAt || Date.now(),
    activated: false,
    approvedAt: Date.now(),
  }));
  await env.TOOLKIT_KV.delete(pendingKey);

  const emailSent = await sendActivationEmail(email, key, env);
  if (!emailSent) {
    return jsonResponse({ success: true, key, emailSent, message: '激活码已生成，但邮件发送失败，请手动发送给用户' });
  }

  return jsonResponse({ success: true, key, emailSent });
}
