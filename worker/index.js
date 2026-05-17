const RESEND_KEY = 're_h62EfR96_2NtffG3akdQt3RAirfDNPPNw';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// Generate a unique license key
function generateKey() {
  const part = () => Math.random().toString(36).substring(2, 8).toUpperCase();
  return 'TKP-' + part() + '-' + part();
}

// Send email via Resend API
async function sendLicenseEmail(email, key) {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + RESEND_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'ToolKit Pro <onboarding@resend.dev>',
      to: email,
      subject: '🔑 Your ToolKit Pro License Key',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">🛠️ ToolKit Pro — Lifetime Unlock</h2>
          <p>Thank you for your purchase! Here is your activation code:</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 12px; text-align: center; margin: 20px 0;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1f2937;">${key}</span>
          </div>
          <p>Copy this code and paste it into the license activation input on the tool site.</p>
          <p style="color: #6b7280; font-size: 12px;">If you didn't make this purchase, please ignore this email.</p>
        </div>
      `
    })
  });
  return resp.json();
}

// Handle /email endpoint - send license key to email
async function handleEmail(data) {
  const { email, paymentMethod } = data;
  
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Invalid email address' };
  }
  
  const key = generateKey();
  
  // Store in KV
  await LINKS.put(email.toLowerCase(), JSON.stringify({ key, created: Date.now(), method: paymentMethod || 'unknown' }));
  
  // Send email
  const result = await sendLicenseEmail(email, key);
  
  return { success: true, message: 'License key sent to your email' };
}

// Handle /activate endpoint - verify and activate
async function handleActivate(data) {
  const { email, key } = data;
  
  if (!email || !key) {
    return { success: false, error: 'Email and key are required' };
  }
  
  const stored = await LINKS.get(email.toLowerCase());
  
  if (!stored) {
    return { success: false, error: 'No license found for this email. Please request a key first.' };
  }
  
  const record = JSON.parse(stored);
  
  if (record.key !== key) {
    return { success: false, error: 'Invalid license key' };
  }
  
  // Mark as activated
  const updated = { ...record, activated: true, activatedAt: Date.now() };
  await LINKS.put(email.toLowerCase(), JSON.stringify(updated));
  
  return { success: true, message: 'Activated! Enjoy ToolKit Pro.' };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    let result;
    if (path.endsWith('/email')) {
      result = await handleEmail(body);
    } else if (path.endsWith('/activate')) {
      result = await handleActivate(body);
    } else {
      result = { message: 'ToolKit Pro License API', version: '1.0' };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
};