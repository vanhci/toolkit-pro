// PayPal IPN (Instant Payment Notification) Worker
// 接收 PayPal 付款通知 → 验证 → 生成激活码 → 发邮件 → 通知管理员

// 生成激活码：TKP-XXXXXX-XXXXXX
function generateKey() {
  const part = () => Math.random().toString(36).substring(2, 8).toUpperCase();
  return 'TKP-' + part() + '-' + part();
}

// 验证 PayPal IPN（PayPal 要求把原始 POST 数据原样回发验证）
async function verifyIPN(rawBody) {
  const verifyBody = 'cmd=_notify-validate&' + rawBody;
  const resp = await fetch('https://www.paypal.com/cgi-bin/webscr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: verifyBody,
  });
  const text = await resp.text();
  return text.trim() === 'VERIFIED';
}

// 发激活邮件
async function sendActivationEmail(email, key, env) {
  const RESEND_API_KEY = env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return false;

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body{font-family:-apple-system,sans-serif;background:#f9fafb;margin:0;padding:20px}
  .c{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
  .logo{font-size:24px;font-weight:700;color:#1f2937;margin-bottom:24px}
  .title{font-size:18px;font-weight:600;color:#111827;margin-bottom:16px}
  .key-box{background:#f3f4f6;border:2px dashed #d1d5db;border-radius:8px;padding:16px;text-align:center;margin:24px 0}
  .key{font-family:monospace;font-size:22px;font-weight:700;color:#2563eb;letter-spacing:2px}
  .steps{background:#eff6ff;border-radius:8px;padding:16px 20px;margin:20px 0}
  .steps li{margin:8px 0;color:#1e40af;font-size:14px;line-height:1.5}
  .footer{margin-top:24px;font-size:12px;color:#9ca3af;text-align:center}
</style></head><body>
<div class="c">
  <div class="logo">🛠️ ToolKit Pro</div>
  <div class="title">🎉 付款成功！以下是你的激活码：</div>
  <div class="key-box"><div class="key">${key}</div></div>
  <div class="steps">
    <ol>
      <li>打开 <a href="https://tools.vanhci.top">ToolKit Pro</a></li>
      <li>点击「升级解锁 ¥9.9」</li>
      <li>输入邮箱和激活码</li>
    </ol>
  </div>
  <div class="footer">此邮件由系统自动发送，请勿回复。</div>
</div></body></html>`;

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ToolKit Pro <noreply@resend.dev>',
      to: [email],
      subject: '🎉 ToolKit Pro 激活码 - 付款成功',
      html,
    }),
  });
  return resp.ok;
}

// 通知管理员（飞书）
async function notifyAdmin(email, key, amount, env) {
  const WEBHOOK = env.FEISHU_WEBHOOK;
  if (!WEBHOOK) return;

  const msg = {
    msg_type: 'text',
    content: {
      text: `💰 PayPal 收款成功！\n金额：${amount}\n邮箱：${email}\n激活码：${key}\n时间：${new Date().toISOString()}`
    }
  };

  await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(msg),
  });
}

// 解析 URL 编码的 IPN 数据
function parseIPN(raw) {
  const params = {};
  raw.split('&').forEach(pair => {
    const [key, val] = pair.split('=').map(decodeURIComponent);
    params[key] = val;
  });
  return params;
}

export async function onRequestPost({ request, env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const rawBody = await request.text();
    const ipn = parseIPN(rawBody);

    // 1. 验证 IPN
    const verified = await verifyIPN(rawBody);
    if (!verified) {
      console.error('PayPal IPN verification failed');
      return new Response('INVALID', { status: 200 });
    }

    // 2. 只处理已完成的付款
    if (ipn.payment_status !== 'Completed') {
      return new Response('OK', { status: 200 });
    }

    // 3. 金额校验（防止篡改）
    const expectedAmount = '2.99'; // PayPal $2.99
    if (ipn.mc_gross !== expectedAmount || ipn.mc_currency !== 'USD') {
      console.error(`Amount mismatch: ${ipn.mc_gross} ${ipn.mc_currency}`);
      return new Response('AMOUNT_MISMATCH', { status: 200 });
    }

    // 4. 提取邮箱（PayPal 用 custom 或 payer_email）
    const email = (ipn.custom || ipn.payer_email || '').trim();
    if (!email || !email.includes('@')) {
      console.error('No valid email in IPN');
      return new Response('NO_EMAIL', { status: 200 });
    }

    // 5. 生成激活码
    const key = generateKey();
    await env.TOOLKIT_KV.put(key, JSON.stringify({
      email,
      createdAt: Date.now(),
      activated: false,
      source: 'paypal',
      transactionId: ipn.txn_id || '',
      amount: ipn.mc_gross || '',
    }));

    // 6. 发激活邮件
    await sendActivationEmail(email, key, env);

    // 7. 通知管理员
    await notifyAdmin(email, key, `$${ipn.mc_gross}`, env);

    return new Response('OK', { status: 200 });

  } catch (e) {
    console.error('PayPal IPN error:', e);
    return new Response('ERROR', { status: 200 }); // PayPal 要求返回 200
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
