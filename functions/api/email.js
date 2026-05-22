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

  // 存 KV
  if (env.TOOLKIT_KV) {
    await env.TOOLKIT_KV.put(key, JSON.stringify({
      email,
      createdAt: Date.now(),
      activated: false,
    }));
  }

  // 发邮件
  const emailSent = await sendActivationEmail(email, key, env);

  return new Response(JSON.stringify({
    success: true,
    key, // 调试模式下也返回 key，方便测试
    emailSent,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
