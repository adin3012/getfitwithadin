/* ============================================================
   GetFitWithAdin — Website Server
   Serves static files + handles form submissions + sends email
   Run: node server.js
   ============================================================ */

const http   = require('http');
const https  = require('https');
const fs     = require('fs');
const path   = require('path');
const url    = require('url');
const crypto = require('crypto');
const zlib   = require('zlib');

// ---------- Load .env ----------
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
    .split('\n')
    .forEach(line => {
      const [key, ...val] = line.split('=');
      if (key && key.trim() && val.length) {
        process.env[key.trim()] = val.join('=').trim();
      }
    });
} catch {}

const PORT                 = process.env.PORT                 || 3001;
const EMAIL_USER           = process.env.EMAIL_USER;
const EMAIL_PASS           = process.env.EMAIL_PASS;
const NOTIFY_EMAIL         = process.env.NOTIFY_EMAIL         || EMAIL_USER;
const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const ALLOWED_EMAIL        = NOTIFY_EMAIL || EMAIL_USER;
const REDIRECT_URI         = process.env.REDIRECT_URI || `http://localhost:${PORT}/auth/callback`;
const SUBMISSIONS          = path.join(__dirname, 'submissions.json');

// ---------- Rate limiting (in-memory) ----------
const rateLimits = new Map(); // ip -> { count, resetAt }
const RATE_LIMIT  = 5;              // max requests
const RATE_WINDOW = 60 * 1000;     // per 1 minute

function checkRateLimit(ip) {
  const now   = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Cleanup stale rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimits) {
    if (entry.resetAt < now) rateLimits.delete(ip);
  }
}, 5 * 60 * 1000);

// ---------- Sessions (in-memory) ----------
const sessions = new Map(); // token -> expiry timestamp

function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return token;
}

function hasSession(req) {
  const cookies = parseCookies(req);
  const token = cookies.gfwa_session;
  if (!token) return false;
  const exp = sessions.get(token);
  if (!exp || exp < Date.now()) { sessions.delete(token); return false; }
  return true;
}

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(c => {
    const [k, ...v] = c.trim().split('=');
    if (k) out[k.trim()] = decodeURIComponent(v.join('=').trim());
  });
  return out;
}

// ---------- HTTPS helpers ----------
function httpsPost(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpsGet(options) {
  return new Promise((resolve, reject) => {
    https.get(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

// ---------- Email (Resend) ----------
const RESEND_API_KEY = process.env.RESEND_API_KEY;
let resendClient = null;
try {
  if (RESEND_API_KEY) {
    const { Resend } = require('resend');
    resendClient = new Resend(RESEND_API_KEY);
    console.log('  Email notifications: ON →', NOTIFY_EMAIL);
  } else {
    console.log('  Email notifications: OFF (set RESEND_API_KEY in .env)');
  }
} catch {
  console.log('  Email notifications: OFF (resend not found)');
}

// ---------- Submissions helpers ----------
function loadSubmissions() {
  try { return JSON.parse(fs.readFileSync(SUBMISSIONS, 'utf8')); }
  catch { return []; }
}

const VALID_ACTIVITY = ['sedentary','light','moderate','active',''];
const VALID_INTEREST = ['monthly','quarterly','half-yearly','annual','just-curious',''];

function sanitize(str, maxLen) {
  if (!str) return '';
  return String(str).replace(/[<>"'`]/g, '').slice(0, maxLen).trim();
}

function saveSubmission(data) {
  const list = loadSubmissions();
  const entry = {
    id:        Date.now(),
    timestamp: new Date().toISOString(),
    name:      sanitize(data.name,    80),
    email:     sanitize(data.email,   120),
    weight:    sanitize(data.weight,  5),
    height:    sanitize(data.height,  5),
    age:       sanitize(data.age,     3),
    activity:  VALID_ACTIVITY.includes(data.activity) ? data.activity : '',
    interest:  VALID_INTEREST.includes(data.interest) ? data.interest : '',
    message:   sanitize(data.message, 1000)
  };
  list.unshift(entry);
  fs.writeFileSync(SUBMISSIONS, JSON.stringify(list, null, 2));
  return entry;
}

const ACTIVITY_LABELS = {
  sedentary: 'Sedentary (desk job, no exercise)',
  light:     'Lightly Active (1–2 days/week)',
  moderate:  'Moderately Active (3–4 days/week)',
  active:    'Very Active (5+ days/week)'
};
const PROGRAMME_LABELS = {
  monthly:       'Monthly — ₹6,000',
  quarterly:     'Quarterly — ₹15,000',
  'half-yearly': 'Half Yearly — ₹27,000',
  annual:        'Annual — ₹51,000',
  'just-curious':'Not sure yet, just exploring'
};

async function sendEmail(entry) {
  if (!resendClient) return;
  const rows = [
    ['Name',     entry.name],
    ['Email',    `<a href="mailto:${entry.email}">${entry.email}</a>`],
    entry.weight   && ['Weight',         `${entry.weight} kg`],
    entry.height   && ['Height',         `${entry.height} cm`],
    entry.age      && ['Age',            entry.age],
    entry.activity && ['Activity Level', ACTIVITY_LABELS[entry.activity] || entry.activity],
    entry.interest && ['Programme',      PROGRAMME_LABELS[entry.interest] || entry.interest],
    entry.message  && ['Goal',           entry.message],
    ['Submitted', new Date(entry.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })]
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
      <a href="mailto:${entry.email}" style="display:inline-block;background:#f97316;color:#000;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Reply to ${entry.name}</a>
    </div>
  </div>`;

  await resendClient.emails.send({
    from:     'GetFitWithAdin <onboarding@resend.dev>',
    to:       NOTIFY_EMAIL,
    reply_to: entry.email,
    subject:  `New inquiry from ${entry.name}`,
    html
  });
}

// ---------- MIME types ----------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.mp4':  'video/mp4',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2'
};

const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.svg']);
const CACHE_TTL = {
  '.html': 'no-cache, must-revalidate',
  '.css':  'public, max-age=3600',
  '.js':   'public, max-age=3600',
  '.webp': 'public, max-age=604800',
  '.jpg':  'public, max-age=604800',
  '.jpeg': 'public, max-age=604800',
  '.png':  'public, max-age=604800',
  '.svg':  'public, max-age=604800',
  '.woff2':'public, max-age=31536000, immutable',
  '.mp4':  'public, max-age=604800',
};

function serveFile(res, filePath, req) {
  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  try {
    const data = fs.readFileSync(filePath);
    const headers = { 'Content-Type': mime };
    if (CACHE_TTL[ext]) headers['Cache-Control'] = CACHE_TTL[ext];

    const acceptEncoding = (req && req.headers['accept-encoding']) || '';
    if (COMPRESSIBLE.has(ext) && acceptEncoding.includes('gzip')) {
      zlib.gzip(data, (err, compressed) => {
        if (err) {
          res.writeHead(200, headers);
          res.end(data);
        } else {
          headers['Content-Encoding'] = 'gzip';
          res.writeHead(200, headers);
          res.end(compressed);
        }
      });
    } else {
      res.writeHead(200, headers);
      res.end(data);
    }
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
}

function readBody(req, maxBytes = 10240) { // 10 KB max
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) { req.destroy(); reject(new Error('Body too large')); return; }
      body += chunk;
    });
    req.on('end',  ()    => resolve(body));
    req.on('error', reject);
  });
}

// ---------- Server ----------
const server = http.createServer(async (req, res) => {
  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname;

  const ALLOWED_ORIGINS = ['https://getfitwithadin.com', 'https://www.getfitwithadin.com', `http://localhost:${PORT}`];
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Block direct access to sensitive files
  if (parsed.pathname.endsWith('.json') && !parsed.pathname.startsWith('/api/')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // ---------- Google OAuth: start ----------
  if (req.method === 'GET' && pathname === '/auth/login') {
    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&scope=email&access_type=online&prompt=select_account`;
    res.writeHead(302, { Location: authUrl });
    res.end();
    return;
  }

  // ---------- Google OAuth: callback ----------
  if (req.method === 'GET' && pathname === '/auth/callback') {
    const code = parsed.query.code;
    if (!code) { res.writeHead(400); res.end('Missing code'); return; }
    try {
      const tokenBody = new URLSearchParams({
        code,
        client_id:     GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri:  REDIRECT_URI,
        grant_type:    'authorization_code'
      }).toString();

      const tokens = await httpsPost({
        hostname: 'oauth2.googleapis.com',
        path:     '/token',
        method:   'POST',
        headers:  {
          'Content-Type':   'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(tokenBody)
        }
      }, tokenBody);

      const userInfo = await httpsGet({
        hostname: 'www.googleapis.com',
        path:     '/oauth2/v2/userinfo',
        headers:  { Authorization: `Bearer ${tokens.access_token}` }
      });

      if (userInfo.email !== ALLOWED_EMAIL) {
        res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<p style="font-family:sans-serif;padding:40px">Access denied for <b>${userInfo.email}</b>.</p>`);
        return;
      }

      const token = createSession();
      res.writeHead(302, {
        Location:    '/admin',
        'Set-Cookie': `gfwa_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 3600}`
      });
      res.end();
    } catch (err) {
      console.error('OAuth error:', err.message);
      res.writeHead(500); res.end('Authentication failed. Check console.');
    }
    return;
  }

  // ---------- Logout ----------
  if (req.method === 'GET' && pathname === '/auth/logout') {
    const cookies = parseCookies(req);
    if (cookies.gfwa_session) sessions.delete(cookies.gfwa_session);
    res.writeHead(302, {
      Location:    '/auth/login',
      'Set-Cookie': 'gfwa_session=; HttpOnly; Path=/; Max-Age=0'
    });
    res.end();
    return;
  }

  // ---------- Protected: /admin ----------
  if (pathname === '/admin' || pathname === '/admin.html') {
    if (!hasSession(req)) {
      res.writeHead(302, { Location: '/auth/login' });
      res.end();
      return;
    }
    serveFile(res, path.join(__dirname, 'admin.html'), req);
    return;
  }

  // ---------- POST /api/contact ----------
  if (req.method === 'POST' && pathname === '/api/contact') {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
    if (!checkRateLimit(ip)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too many requests. Please wait a minute.' }));
      return;
    }
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      res.writeHead(415, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Content-Type must be application/json' }));
      return;
    }
    try {
      const body  = await readBody(req);
      const data  = JSON.parse(body);
      const entry = saveSubmission(data);
      sendEmail(entry).catch(err => console.error('Email error:', err.message));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, id: entry.id }));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad request' }));
    }
    return;
  }

  // ---------- Protected: GET /api/submissions ----------
  if (req.method === 'GET' && pathname === '/api/submissions') {
    if (!hasSession(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(loadSubmissions()));
    return;
  }

  // ---------- Protected: DELETE /api/submissions/:id ----------
  const deleteMatch = pathname.match(/^\/api\/submissions\/(\d+)$/);
  if (req.method === 'DELETE' && deleteMatch) {
    if (!hasSession(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    const id = parseInt(deleteMatch[1]);
    const list = loadSubmissions().filter(s => s.id !== id);
    fs.writeFileSync(SUBMISSIONS, JSON.stringify(list, null, 2));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // ---------- Protected: PUT /api/submissions/:id ----------
  const editMatch = pathname.match(/^\/api\/submissions\/(\d+)$/);
  if (req.method === 'PUT' && editMatch) {
    if (!hasSession(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    try {
      const id   = parseInt(editMatch[1]);
      const body = await readBody(req);
      const updates = JSON.parse(body);
      const list = loadSubmissions().map(s => s.id === id ? { ...s, ...updates } : s);
      fs.writeFileSync(SUBMISSIONS, JSON.stringify(list, null, 2));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad request' }));
    }
    return;
  }

  // ---------- Static files ----------
  let filePath = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\//, '');
  const fullPath = path.resolve(__dirname, filePath);
  // Path traversal protection — ensure file is within project directory
  if (!fullPath.startsWith(path.resolve(__dirname) + path.sep) && fullPath !== path.resolve(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  if (!path.extname(filePath) && !fs.existsSync(fullPath)) filePath += '.html';
  serveFile(res, path.resolve(__dirname, filePath), req);
});

server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║       GetFitWithAdin — Website Server        ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Website:     http://localhost:${PORT}          ║`);
  console.log(`║  Admin inbox: http://localhost:${PORT}/admin     ║`);
  console.log(`║  Stop:        Ctrl + C                       ║`);
  console.log('╚══════════════════════════════════════════════╝\n');
});
