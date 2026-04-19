/* Netlify Function — form submissions → Google Sheets + email notification */

const ACTIVITY_LABELS = {
  sedentary: 'Sedentary (desk job, no exercise)',
  light:     'Lightly Active (1–2 days/week)',
  moderate:  'Moderately Active (3–4 days/week)',
  active:    'Very Active (5+ days/week)'
};
const PROGRAMME_LABELS = {
  monthly:       'Monthly — ₹5,000',
  quarterly:     'Quarterly — ₹12,000',
  'half-yearly': 'Half Yearly — ₹23,000',
  annual:        'Annual — ₹46,000',
  'just-curious':'Not sure yet, just exploring'
};

const VALID_ACTIVITY = ['sedentary','light','moderate','active',''];
const VALID_INTEREST = ['monthly','quarterly','half-yearly','annual','just-curious',''];

// Google Form field IDs
const GOOGLE_FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSeJ7AgQlp80vZ3bHDcOA604Iz0aTFwJcg8BYirZLkYY9EdK_A/formResponse';
const FORM_FIELDS = {
  name:     'entry.2107149741',
  email:    'entry.526745828',
  whatsapp: 'entry.655107678',
  interest: 'entry.884049450',
  source:   'entry.653971467',
};

function sanitize(str, maxLen) {
  if (!str) return '';
  return String(str).replace(/[<>&"'`]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c])).slice(0, maxLen).trim();
}

async function submitToGoogleForm(data) {
  const body = new URLSearchParams({
    [FORM_FIELDS.name]:     data.name,
    [FORM_FIELDS.email]:    data.email,
    [FORM_FIELDS.whatsapp]: data.whatsapp || '',
    [FORM_FIELDS.interest]: data.interest || '',
    [FORM_FIELDS.source]:   'apply-modal',
  });

  await fetch(GOOGLE_FORM_ACTION, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
}

async function sendEmailNotification(data) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_EMAIL   = process.env.NOTIFY_EMAIL || process.env.EMAIL_USER;

  if (!RESEND_API_KEY || !NOTIFY_EMAIL) return;

  const rows = [
    ['Name',    data.name],
    ['Email',   data.email],
    data.whatsapp && ['WhatsApp', data.whatsapp],
    data.weight   && ['Weight',   `${data.weight} kg`],
    data.height   && ['Height',   `${data.height} cm`],
    data.age      && ['Age',      data.age],
    data.activity && ['Activity', ACTIVITY_LABELS[data.activity] || data.activity],
    data.interest && ['Programme',PROGRAMME_LABELS[data.interest] || data.interest],
    data.message  && ['Goal',     data.message],
    ['Time',    new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })]
  ].filter(Boolean);

  const tableRows = rows.map(([k, v]) => `
    <tr>
      <td style="padding:8px 16px 8px 0;color:#888;font-size:13px;white-space:nowrap;vertical-align:top;">${k}</td>
      <td style="padding:8px 0;font-size:14px;color:#f5f5f5;">${v}</td>
    </tr>`).join('');

  const html = `
  <div style="font-family:Inter,system-ui,sans-serif;background:#0a0a0a;padding:32px;border-radius:12px;max-width:560px;margin:0 auto;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <div style="width:40px;height:40px;background:#f97316;border-radius:8px;font-weight:900;font-size:11px;color:#000;display:flex;align-items:center;justify-content:center;">GFWA</div>
      <div>
        <div style="font-size:18px;font-weight:800;color:#f5f5f5;">New Coaching Inquiry 🔥</div>
        <div style="font-size:12px;color:#888;">GetFitWithAdin.com</div>
      </div>
    </div>
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:24px;">
      <table style="width:100%;border-collapse:collapse;">${tableRows}</table>
    </div>
    <div style="margin-top:20px;">
      <a href="mailto:${data.email}" style="display:inline-block;background:#f97316;color:#000;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Reply to ${data.name}</a>
    </div>
  </div>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type':  'application/json'
    },
    body: JSON.stringify({
      from:     'GetFitWithAdin <onboarding@resend.dev>',
      to:       [NOTIFY_EMAIL],
      reply_to: data.email,
      subject:  `🔥 New inquiry from ${data.name}`,
      html
    })
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  if ((event.body || '').length > 10240) return { statusCode: 413, body: JSON.stringify({ error: 'Too large' }) };

  let raw;
  try { raw = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Bad request' }) }; }

  const data = {
    name:     sanitize(raw.name,    80),
    email:    sanitize(raw.email,   120),
    whatsapp: sanitize(raw.whatsapp,20),
    weight:   sanitize(raw.weight,  5),
    height:   sanitize(raw.height,  5),
    age:      sanitize(raw.age,     3),
    activity: VALID_ACTIVITY.includes(raw.activity) ? raw.activity : '',
    interest: VALID_INTEREST.includes(raw.interest) ? raw.interest : '',
    message:  sanitize(raw.message, 1000),
  };

  // Run both in parallel
  await Promise.allSettled([
    submitToGoogleForm(data),
    sendEmailNotification(data)
  ]);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true })
  };
};
