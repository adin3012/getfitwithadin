/* Netlify Function — handles form submissions + sends email notification */

const nodemailer = require('nodemailer');

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

function sanitize(str, maxLen) {
  if (!str) return '';
  return String(str).replace(/[<>&"'`]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c])).slice(0, maxLen).trim();
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Body size check
  if ((event.body || '').length > 10240) {
    return { statusCode: 413, body: JSON.stringify({ error: 'Payload too large' }) };
  }

  let raw;
  try { raw = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Bad request' }) }; }

  // Sanitize all inputs
  const data = {
    name:     sanitize(raw.name,    80),
    email:    sanitize(raw.email,   120),
    weight:   sanitize(raw.weight,  5),
    height:   sanitize(raw.height,  5),
    age:      sanitize(raw.age,     3),
    activity: VALID_ACTIVITY.includes(raw.activity) ? raw.activity : '',
    interest: VALID_INTEREST.includes(raw.interest) ? raw.interest : '',
    message:  sanitize(raw.message, 1000),
  };

  // Send email notification
  try {
    const { EMAIL_USER, EMAIL_PASS, NOTIFY_EMAIL } = process.env;
    if (EMAIL_USER && EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: EMAIL_USER, pass: EMAIL_PASS }
      });

      const rows = [
        ['Name',     data.name],
        ['Email',    `<a href="mailto:${data.email}">${data.email}</a>`],
        data.weight   && ['Weight',         `${data.weight} kg`],
        data.height   && ['Height',         `${data.height} cm`],
        data.age      && ['Age',            data.age],
        data.activity && ['Activity Level', ACTIVITY_LABELS[data.activity] || data.activity],
        data.interest && ['Programme',      PROGRAMME_LABELS[data.interest] || data.interest],
        data.message  && ['Goal',           data.message],
        ['Submitted', new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })]
      ].filter(Boolean);

      const tableRows = rows.map(([k, v]) => `
        <tr>
          <td style="padding:8px 16px 8px 0;color:#888;font-size:13px;white-space:nowrap;vertical-align:top;">${k}</td>
          <td style="padding:8px 0;font-size:14px;color:#f5f5f5;vertical-align:top;">${v}</td>
        </tr>`).join('');

      const html = `
      <div style="font-family:Inter,system-ui,sans-serif;background:#0a0a0a;padding:32px;border-radius:12px;max-width:560px;margin:0 auto;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
          <div style="width:40px;height:40px;background:#f97316;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11px;color:#000;letter-spacing:0.5px;">GFWA</div>
          <div>
            <div style="font-size:18px;font-weight:800;color:#f5f5f5;">New Coaching Inquiry</div>
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

      await transporter.sendMail({
        from:    `"GetFitWithAdin" <${EMAIL_USER}>`,
        to:      NOTIFY_EMAIL || EMAIL_USER,
        replyTo: data.email,
        subject: `New inquiry from ${data.name}`,
        html
      });
    }
  } catch (err) {
    console.error('Email error:', err.message);
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true })
  };
};
