// ─────────────────────────────────────────────────────────────────────────────
// SignalStack — Full Frontend Application
// Premium Glass-morphism · Beige · Pink · Orange Theme
// ─────────────────────────────────────────────────────────────────────────────

// ─── API Layer ───────────────────────────────────────────────────────────────
const API = {
  token: localStorage.getItem('ss_token') || null,
  headers() {
    const h = { 'Content-Type': 'application/json' };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  },
  async call(method, path, body) {
    try {
      const res = await fetch(path, { method, headers: this.headers(), body: body ? JSON.stringify(body) : undefined });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (e) { throw e; }
  },
  get: (p) => API.call('GET', p),
  post: (p, b) => API.call('POST', p, b),
  put: (p, b) => API.call('PUT', p, b),
  delete: (p) => API.call('DELETE', p),
};

// ─── Constants ───────────────────────────────────────────────────────────────
const TIERS = {
  trader: { label: 'Trader', price: 229, color: '#B84A18', bg: 'rgba(255,210,185,0.65)', alerts: ['trader'] },
  elite:  { label: 'Elite',  price: 769, color: '#6B2040', bg: 'rgba(200,140,160,0.45)', alerts: ['trader', 'elite'] },
};
const TIER_ORDER = { trader: 0, elite: 1 };
const canSeeAlert = (userTier, alertTier) => userTier && TIER_ORDER[userTier] >= TIER_ORDER[alertTier];

const TODAY = new Date();
const TODAY_MONTH = TODAY.getMonth();
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Color Palette (matches styles.css) ──────────────────────────────────────
const C = {
  accent:      '#E8663A',
  accentDark:  '#C9481E',
  accentPink:  '#D95F7A',
  // Status
  activeText:  '#1A6FAD',  activeBg:  'rgba(180,220,255,0.55)',
  closedText:  '#1A7A50',  closedBg:  'rgba(180,248,210,0.55)',
  stoppedText: '#C0302A',  stoppedBg: 'rgba(255,200,195,0.65)',
  chipBg:      'rgba(255,200,170,0.65)', chipText: '#8B3C10',
};

// ─── State ───────────────────────────────────────────────────────────────────
let STATE = {
  currentUser: null,
  alerts: [],
  allUsers: [],
  pricing: null,
  loading: true,
  authMode: 'login',
  tab: 'dashboard',
  adminTab: 'dashboard',
  adminAnalyticsTab: 'overview',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const isActive      = (u) => u.subscriptionStatus === 'active';
const isUnsubscribed= (u) => !u.tier || u.subscriptionStatus === 'unsubscribed';
const isCancelled   = (u) => u.subscriptionStatus === 'cancelled';
const isLocked      = (u) => isUnsubscribed(u) || isCancelled(u);

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const statusColor = (s) => s === 'active' ? C.activeText  : s === 'closed' ? C.closedText  : C.stoppedText;
const statusBg    = (s) => s === 'active' ? C.activeBg    : s === 'closed' ? C.closedBg    : C.stoppedBg;
const priorityColor = (p) => ({ low: '#9B8570', medium: '#B84A18', high: '#E8663A', critical: '#C0392B' }[p] || '#9B8570');

const daysToClose = (buy, close) => {
  if (!buy) return null;
  const end = close ? new Date(close) : TODAY;
  return Math.round((end - new Date(buy)) / 86400000);
};

const getMonthIdx = (d) => d ? new Date(d).getMonth() : null;

const getGreeting = (name) => {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return `Good morning, ${name} ☀️`;
  if (h >= 12 && h < 17) return `Good afternoon, ${name} 👋`;
  if (h >= 17 && h < 21) return `Good evening, ${name} 🌇`;
  return `Hey, ${name} 🌙`;
};

// ─── Inline Styles (beige · pink · orange palette) ───────────────────────────
// Glass surface
const glass = `background:rgba(255,255,255,0.52);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(200,195,188,0.50);box-shadow:0 6px 28px rgba(100,90,80,0.12),inset 0 1px 0 rgba(255,255,255,0.70);`;
const glassHeavy = `background:rgba(255,255,255,0.78);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border:1px solid rgba(200,195,188,0.55);box-shadow:0 16px 50px rgba(100,90,80,0.18),inset 0 1px 0 rgba(255,255,255,0.80);`;

// Buttons
const btnStyle = (v = 'primary') => {
  const base = `padding:9px 18px;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600;font-family:'Inter','Georgia',sans-serif;transition:all 0.18s;display:inline-flex;align-items:center;gap:6px;border:none;letter-spacing:0.01em;`;
  const variants = {
    primary:   `background:linear-gradient(135deg,#E8663A 0%,#C9481E 100%);color:#fff;box-shadow:0 3px 14px rgba(232,102,58,0.42);`,
    secondary: `background:rgba(232,102,58,0.10);color:#C9481E;border:1px solid rgba(232,102,58,0.35)!important;backdrop-filter:blur(8px);`,
    danger:    `background:linear-gradient(135deg,#C0302A,#9B1C18);color:#fff;box-shadow:0 2px 10px rgba(192,48,42,0.38);`,
    ghost:     `background:rgba(253,220,200,0.35);color:#8B3C10;border:1px solid rgba(220,160,130,0.4)!important;backdrop-filter:blur(8px);`,
    gold:      `background:linear-gradient(135deg,#E8663A,#C9481E);color:#fff;box-shadow:0 3px 14px rgba(232,102,58,0.38);`,
    dark:      `background:rgba(44,24,16,0.85);color:#FDF5EE;backdrop-filter:blur(8px);`,
    pink:      `background:linear-gradient(135deg,#E8663A,#C9481E);color:#fff;box-shadow:0 3px 14px rgba(232,102,58,0.38);`,
  };
  return base + (variants[v] || variants.primary);
};

// Inputs
const inputStyle = `background:rgba(253,235,220,0.55);backdrop-filter:blur(8px);border:1px solid rgba(220,160,130,0.5);border-radius:10px;padding:10px 14px;font-size:14px;color:#2C1810;width:100%;box-sizing:border-box;font-family:'Inter','Georgia',sans-serif;outline:none;transition:border-color 0.15s,box-shadow 0.15s;`;
const labelStyle = `font-size:11px;color:rgba(90,45,25,0.72);margin-bottom:5px;display:block;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;`;
const badgeStyle = (color, bg) => `display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;background:${bg};color:${color};letter-spacing:0.05em;text-transform:uppercase;backdrop-filter:blur(6px);`;
const cardStyle  = `${glass}border-radius:22px;padding:24px;`;
const tableStyle = `width:100%;border-collapse:collapse;`;
const thStyle    = `text-align:left;padding:11px 14px;font-size:10px;color:rgba(90,45,25,0.65);letter-spacing:0.09em;text-transform:uppercase;border-bottom:1px solid rgba(220,160,130,0.35);background:rgba(255,200,175,0.22);font-weight:700;`;
const tdStyle    = `padding:12px 14px;font-size:13px;color:#2C1810;border-bottom:1px solid rgba(220,160,130,0.18);vertical-align:middle;`;

// Background — warm greige/taupe (matches reference image)
const appBg = `background:#D2CDC4;`;
// Nav background for greige theme
const navBg = `background:rgba(210,205,196,0.82);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-bottom:1px solid rgba(180,170,158,0.50);`;

// ─── Router / Renderer ────────────────────────────────────────────────────────
function render() {
  const root = document.getElementById('root');
  if (STATE.loading) {
    root.innerHTML = `
<div style="${appBg}display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="text-align:center;" class="fade-in">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;justify-content:center;">
      <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#E8663A,#D95F7A);display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:900;box-shadow:0 4px 18px rgba(232,102,58,0.45);">▲</div>
      <span style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;text-shadow:0 2px 12px rgba(100,30,20,0.3);">SignalStack</span>
    </div>
    <div class="spinner" style="margin:0 auto;"></div>
    <p style="margin-top:16px;font-size:13px;color:rgba(255,255,255,0.75);">Loading your dashboard…</p>
  </div>
</div>`;
    return;
  }
  if (!STATE.currentUser) {
    root.innerHTML = renderAuthPage();
    attachAuthEvents();
    return;
  }
  if (STATE.currentUser.role === 'admin' || STATE.currentUser.role === 'manager') {
    root.innerHTML = renderAdminApp();
    attachAdminEvents();
  } else {
    root.innerHTML = renderSubscriberApp();
    attachSubscriberEvents();
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
  if (API.token) {
    try {
      const { user } = await API.get('/api/auth/me');
      STATE.currentUser = user;
      await loadData();
    } catch {
      API.token = null;
      localStorage.removeItem('ss_token');
    }
  }
  STATE.loading = false;
  render();
}

async function loadData() {
  const isAdminOrMgr = STATE.currentUser?.role === 'admin' || STATE.currentUser?.role === 'manager';
  const [alertsData, usersData, pricingData] = await Promise.all([
    API.get('/api/alerts'),
    isAdminOrMgr ? API.get('/api/users') : Promise.resolve({ users: [] }),
    API.get('/api/pricing').catch(() => ({ pricing: {} })),
  ]);
  STATE.alerts   = alertsData.alerts  || [];
  STATE.allUsers = usersData.users    || [];
  // Merge DB pricing into TIERS if available
  const p = pricingData.pricing || {};
  if (p.price_trader) TIERS.trader.price = parseFloat(p.price_trader);
  if (p.price_elite)  TIERS.elite.price  = parseFloat(p.price_elite);
  if (p.name_trader)  TIERS.trader.label = p.name_trader;
  if (p.name_elite)   TIERS.elite.label  = p.name_elite;
  STATE.pricing = p;
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function renderAuthPage() {
  const m = STATE.authMode;
  return `
<div style="${appBg}min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;position:relative;">
  <!-- Logo top-center -->
  <div style="position:absolute;top:28px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;z-index:2;">
    <div style="width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,#E8663A,#D95F7A);display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:900;box-shadow:0 4px 16px rgba(232,102,58,0.4);">▲</div>
    <span style="font-size:22px;font-weight:800;color:#0F1A20;letter-spacing:-0.5px;">SignalStack</span>
  </div>
  <!-- Auth card -->
  <div style="${glassHeavy}border-radius:24px;padding:32px;width:100%;max-width:440px;margin-top:60px;z-index:2;" class="fade-in">
    ${m !== 'forgot' ? `
    <div style="display:flex;gap:4px;margin-bottom:26px;background:rgba(232,102,58,0.10);border-radius:14px;padding:4px;">
      <button id="tab-login"    onclick="setAuthMode('login')"    style="${btnStyle(m==='login'   ?'primary':'ghost')};flex:1;justify-content:center;border-radius:10px!important;">Sign In</button>
      <button id="tab-register" onclick="setAuthMode('register')" style="${btnStyle(m==='register'?'primary':'ghost')};flex:1;justify-content:center;border-radius:10px!important;">Create Account</button>
    </div>` : ''}
    <div style="margin-bottom:22px;">
      <h2 style="font-size:20px;font-weight:800;color:#2C1810;margin-bottom:5px;letter-spacing:-0.4px;">${
        m==='login' ? 'Welcome back' : m==='register' ? 'Create your account' : 'Reset password'
      }</h2>
      <p style="font-size:13px;color:rgba(90,45,25,0.72);">${
        m==='login' ? 'Sign in to access your trade alerts' : m==='register' ? 'Join SignalStack and start trading smarter' : 'Enter your email to receive a reset link'
      }</p>
    </div>
    ${m==='register' ? `<div style="margin-bottom:16px;"><label style="${labelStyle}">Full Name</label><input id="auth-name" style="${inputStyle}" placeholder="Your full name"></div>` : ''}
    <div style="margin-bottom:16px;"><label style="${labelStyle}">Email Address</label><input id="auth-email" type="email" style="${inputStyle}" placeholder="you@example.com"></div>
    ${m !== 'forgot' ? `<div style="margin-bottom:16px;"><label style="${labelStyle}">Password</label><input id="auth-password" type="password" style="${inputStyle}" placeholder="••••••••"></div>` : ''}
    ${m==='register' ? `<div style="margin-bottom:16px;"><label style="${labelStyle}">Confirm Password</label><input id="auth-confirm" type="password" style="${inputStyle}" placeholder="••••••••"></div>` : ''}
    ${m==='register' ? `
    <div style="margin-bottom:18px;padding:14px 16px;background:rgba(232,102,58,0.07);border-radius:12px;border:1px solid rgba(232,102,58,0.18);">
      <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;">
        <input type="checkbox" id="auth-terms" style="width:17px;height:17px;margin-top:1px;accent-color:#E8663A;flex-shrink:0;cursor:pointer;">
        <span style="font-size:12px;color:rgba(44,24,16,0.75);line-height:1.6;">
          I agree to the <button type="button" onclick="showTCModal()" style="background:none;border:none;padding:0;cursor:pointer;color:#E8663A;font-weight:700;font-size:12px;font-family:'Inter',sans-serif;text-decoration:underline;">Terms &amp; Conditions</button>
          and <button type="button" onclick="showTCModal()" style="background:none;border:none;padding:0;cursor:pointer;color:#E8663A;font-weight:700;font-size:12px;font-family:'Inter',sans-serif;text-decoration:underline;">Privacy Policy</button>.
          By creating an account I confirm I am 18+ and understand that all trade alerts are for informational purposes only and do not constitute financial advice.
        </span>
      </label>
    </div>` : ''}
    <div id="auth-error" style="display:none;color:#C0302A;font-size:13px;margin-bottom:12px;padding:10px 14px;background:rgba(255,200,195,0.65);border-radius:10px;border:1px solid rgba(192,48,42,0.2);"></div>
    <div id="auth-ok"    style="display:none;color:#1A7A50;font-size:13px;margin-bottom:12px;padding:10px 14px;background:rgba(180,248,210,0.55);border-radius:10px;border:1px solid rgba(26,122,80,0.2);"></div>
    <button onclick="handleAuth()" class="btn-glow" style="${btnStyle('primary')};width:100%;justify-content:center;padding:14px;font-size:15px;margin-bottom:16px;border-radius:14px;">
      ${m==='login' ? '→ Sign In' : m==='register' ? '✦ Create Account' : '✉ Send Reset Link'}
    </button>
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      ${m==='login'  ? `<button onclick="setAuthMode('forgot')" style="background:none;border:none;cursor:pointer;font-size:12px;color:#E8663A;font-family:'Inter',sans-serif;font-weight:600;">Forgot password?</button>` : ''}
      ${m==='forgot' ? `<button onclick="setAuthMode('login')"  style="background:none;border:none;cursor:pointer;font-size:12px;color:#9B8570;font-family:'Inter',sans-serif;">← Back to Sign In</button>` : ''}
    </div>

  </div>
</div>`;
}

function setAuthMode(m) { STATE.authMode = m; render(); }

function attachAuthEvents() {
  ['auth-name','auth-email','auth-password','auth-confirm'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAuth(); });
  });
}

async function handleAuth() {
  const m   = STATE.authMode;
  const errEl = document.getElementById('auth-error');
  const okEl  = document.getElementById('auth-ok');
  if (errEl) errEl.style.display = 'none';
  if (okEl)  okEl.style.display  = 'none';

  const email   = document.getElementById('auth-email')?.value?.trim();
  const password= document.getElementById('auth-password')?.value;
  const name    = document.getElementById('auth-name')?.value?.trim();
  const confirm = document.getElementById('auth-confirm')?.value;

  const showErr = (msg) => { if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; } };
  const showOk  = (msg) => { if (okEl)  { okEl.textContent  = msg; okEl.style.display  = 'block'; } };

  try {
    if (m === 'login') {
      if (!email || !password) { showErr('Email and password required.'); return; }
      const { token, user } = await API.post('/api/auth/login', { email, password });
      API.token = token; localStorage.setItem('ss_token', token);
      STATE.currentUser = user; STATE.tab = 'dashboard'; STATE.adminTab = 'dashboard';
      await loadData(); render();
    } else if (m === 'register') {
      if (!name || !email || !password) { showErr('All fields required.'); return; }
      if (password !== confirm) { showErr('Passwords do not match.'); return; }
      if (password.length < 6) { showErr('Minimum 6 characters.'); return; }
      if (!document.getElementById('auth-terms')?.checked) { showErr('Please accept the Terms & Conditions to continue.'); return; }
      const { token, user } = await API.post('/api/auth/register', { name, email, password });
      API.token = token; localStorage.setItem('ss_token', token);
      STATE.currentUser = user; STATE.tab = 'dashboard';
      await loadData(); render();
    } else {
      if (!email) { showErr('Email required.'); return; }
      showOk(`Password reset link sent to ${email}. Check your inbox.`);
    }
  } catch (e) { showErr(e.message || 'Something went wrong.'); }
}

// ─── TERMS & CONDITIONS MODAL ────────────────────────────────────────────────
function showTCModal() {
  const overlay = document.createElement('div');
  overlay.id = 'tc-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,20,25,0.60);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
  overlay.onclick = (e) => { if (e.target === overlay) closeTCModal(); };
  overlay.innerHTML = `
<div style="background:#fff;border-radius:24px;width:100%;max-width:560px;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.28);">
  <div style="padding:22px 26px 16px;border-bottom:1px solid rgba(220,215,208,0.70);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
    <div>
      <h2 style="font-size:18px;font-weight:800;color:#0F1E2E;margin:0 0 3px;">Terms &amp; Conditions</h2>
      <p style="font-size:12px;color:#9A9189;margin:0;">Last updated: April 1, 2026</p>
    </div>
    <button onclick="closeTCModal()" style="background:rgba(240,236,230,0.80);border:none;cursor:pointer;width:32px;height:32px;border-radius:50%;font-size:16px;display:flex;align-items:center;justify-content:center;color:#555;transition:background 0.15s;">&times;</button>
  </div>
  <div style="overflow-y:auto;padding:22px 26px;flex:1;line-height:1.75;color:#2C2420;font-size:13px;">
    <h3 style="font-size:14px;font-weight:700;color:#0F1E2E;margin:0 0 8px;">1. Acceptance of Terms</h3>
    <p style="margin:0 0 16px;">By creating an account on SignalStack, you agree to be bound by these Terms and Conditions. If you do not agree, you may not access or use our services. You must be at least 18 years of age to register.</p>

    <h3 style="font-size:14px;font-weight:700;color:#0F1E2E;margin:0 0 8px;">2. No Financial Advice</h3>
    <p style="margin:0 0 16px;">All trade alerts, signals, analysis, and content provided by SignalStack are for <strong>informational and educational purposes only</strong>. Nothing on this platform constitutes financial, investment, legal, or tax advice. Always consult a qualified financial professional before making any investment decisions. Past performance of any signal or alert does not guarantee future results.</p>

    <h3 style="font-size:14px;font-weight:700;color:#0F1E2E;margin:0 0 8px;">3. Subscription & Billing</h3>
    <p style="margin:0 0 16px;">SignalStack offers subscription plans (Trader at $229/mo; Elite at $769/mo). Subscriptions renew automatically each month. You may cancel at any time through your account settings, effective at the end of the current billing period. No partial refunds are issued for unused portions of a billing cycle. We reserve the right to modify pricing with 30 days' notice.</p>

    <h3 style="font-size:14px;font-weight:700;color:#0F1E2E;margin:0 0 8px;">4. Risk Disclosure</h3>
    <p style="margin:0 0 16px;">Trading stocks, options, futures, forex, and other financial instruments carries a <strong>high level of risk</strong> and may not be suitable for all investors. You could lose some or all of your invested capital. SignalStack and its operators accept no liability for financial losses incurred from acting on any signals or information provided on this platform.</p>

    <h3 style="font-size:14px;font-weight:700;color:#0F1E2E;margin:0 0 8px;">5. Account Responsibilities</h3>
    <p style="margin:0 0 16px;">You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree not to share, sell, or transfer your account or subscription access to any third party. Violation of this clause may result in immediate termination of your account without refund.</p>

    <h3 style="font-size:14px;font-weight:700;color:#0F1E2E;margin:0 0 8px;">6. Privacy Policy</h3>
    <p style="margin:0 0 16px;">We collect your name, email address, and usage data to provide and improve our services. We do not sell your personal information to third parties. Your data is protected in accordance with applicable privacy laws. By using SignalStack you consent to our data collection and processing practices as described herein.</p>

    <h3 style="font-size:14px;font-weight:700;color:#0F1E2E;margin:0 0 8px;">7. Intellectual Property</h3>
    <p style="margin:0 0 16px;">All content on SignalStack — including alerts, analysis, trade signals, branding, and UI — is the proprietary property of SignalStack. You may not reproduce, redistribute, or commercially exploit any content without express written permission.</p>

    <h3 style="font-size:14px;font-weight:700;color:#0F1E2E;margin:0 0 8px;">8. Modifications & Termination</h3>
    <p style="margin:0 0 0;">SignalStack reserves the right to modify these Terms at any time. Continued use of the service after changes constitutes acceptance of the new Terms. We may suspend or terminate accounts that violate these Terms at our sole discretion.</p>
  </div>
  <div style="padding:16px 26px;border-top:1px solid rgba(220,215,208,0.70);display:flex;gap:10px;justify-content:flex-end;flex-shrink:0;">
    <button onclick="closeTCModal()" style="padding:10px 22px;border-radius:12px;border:1px solid rgba(220,215,208,0.80);background:rgba(240,236,230,0.70);color:#555;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;">Close</button>
    <button onclick="acceptTC()" style="padding:10px 22px;border-radius:12px;border:none;background:linear-gradient(135deg,#E8663A,#C9481E);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;box-shadow:0 3px 12px rgba(232,102,58,0.38);">I Accept ✓</button>
  </div>
</div>`;
  document.body.appendChild(overlay);
}

function closeTCModal() {
  const el = document.getElementById('tc-overlay');
  if (el) el.remove();
}

function acceptTC() {
  const cb = document.getElementById('auth-terms');
  if (cb) cb.checked = true;
  closeTCModal();
}

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
async function handleLogout() {
  try { await API.post('/api/auth/logout'); } catch {}
  API.token = null; localStorage.removeItem('ss_token');
  STATE.currentUser = null; STATE.authMode = 'login'; STATE.tab = 'dashboard';
  render();
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIBER APP
// ─────────────────────────────────────────────────────────────────────────────
function getUnreadAlerts() {
  const u = STATE.currentUser;
  if (!u || u.role !== 'subscriber' || !u.tier || !isActive(u)) return [];
  const seen = new Set(u.seenAlertIds || []);
  return STATE.alerts.filter(a => !seen.has(a.id) && canSeeAlert(u.tier, a.tier) && a.status === 'active');
}

function getVisibleAlerts() {
  const u = STATE.currentUser;
  if (!u) return [];
  const locked = isLocked(u);
  const pool = u.tier ? STATE.alerts.filter(a => canSeeAlert(u.tier, a.tier)) : STATE.alerts;
  const byDate = (arr) => [...arr].sort((a,b) => new Date(b.created) - new Date(a.created));
  return locked ? byDate(pool.filter(a => a.status !== 'active')) : byDate(pool);
}

function renderSubscriberApp() {
  const u      = STATE.currentUser;
  const tab    = STATE.tab;
  const tier   = u.tier ? TIERS[u.tier] : null;
  const unread = getUnreadAlerts();
  const locked = isLocked(u);
  const unsub  = isUnsubscribed(u);
  const cancelled = isCancelled(u);

  const navTabs = [['dashboard','Dashboard'],['alerts','Alerts'],['timeline','Timeline'],['account','Account']];

  // Nav pill colors
  const navActive   = `background:linear-gradient(135deg,rgba(232,102,58,0.25),rgba(217,95,122,0.18));color:#2C1810;border:1px solid rgba(232,102,58,0.30);backdrop-filter:blur(8px);`;
  const navInactive = `background:transparent;color:rgba(90,45,25,0.80);border:1px solid transparent;`;

  return `
<div style="${appBg}min-height:100vh;color:#2C1810;font-family:'Inter','Georgia',sans-serif;" id="ss-app">

  <!-- NAV -->
  <nav style="${navBg}padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:66px;position:sticky;top:0;z-index:100;box-shadow:0 2px 16px rgba(120,110,98,0.18);">
    <!-- Logo -->
    <div style="display:flex;align-items:center;gap:9px;flex-shrink:0;">
      <div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#E8663A,#D95F7A);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:900;box-shadow:0 3px 12px rgba(232,102,58,0.4);">▲</div>
      <span style="font-size:18px;font-weight:800;color:#2C1810;letter-spacing:-0.5px;">SignalStack</span>
    </div>
    <!-- Nav tabs -->
    <div style="display:flex;gap:3px;" class="nav-links">
      ${navTabs.map(([k,l]) => `
      <button onclick="setTab('${k}')" style="padding:7px 16px;border-radius:10px;cursor:pointer;font-size:13px;font-family:'Inter',sans-serif;font-weight:600;transition:all 0.18s;${tab===k?navActive:navInactive}">${l}</button>`).join('')}
    </div>
    <!-- Right: tier + bell + avatar + logout -->
    <div style="display:flex;gap:10px;align-items:center;">
      <div style="font-size:12px;text-align:right;display:none;" class="nav-links" style="display:block;">
        <div style="font-weight:700;color:#2C1810;font-size:13px;">${u.name}</div>
        <div style="color:${cancelled?'#C0302A':unsub?'#9B8570':tier?.color||C.accent};font-weight:600;font-size:11px;">
          ${tier ? tier.label : 'No Plan'}${cancelled?' · Cancelled':unsub?' · Unsubscribed':''}
        </div>
      </div>
      <!-- Bell -->
      <div style="position:relative;">
        <button onclick="toggleNotifs()" style="background:rgba(253,220,200,0.35);border:1px solid rgba(220,160,130,0.35);border-radius:10px;cursor:pointer;padding:7px 9px;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);" title="Notifications">
          <span style="font-size:18px;line-height:1;">🔔</span>
          ${unread.length > 0 ? `<span class="badge-bounce notif-badge" style="position:absolute;top:-3px;right:-3px;min-width:18px;height:18px;border-radius:9px;background:linear-gradient(135deg,#E8663A,#D95F7A);color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 4px;border:2px solid rgba(253,235,220,0.8);">${unread.length > 9 ? '9+' : unread.length}</span>` : ''}
        </button>
        <!-- Notification panel -->
        <div id="notif-panel" style="display:none;position:absolute;right:0;top:calc(100% + 10px);width:350px;background:rgba(253,240,228,0.92);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,200,175,0.55);border-radius:18px;box-shadow:0 16px 48px rgba(180,80,60,0.22);z-index:300;overflow:hidden;" class="notif-dropdown">
          <div style="padding:14px 18px 10px;border-bottom:1px solid rgba(220,160,130,0.30);display:flex;justify-content:space-between;align-items:center;">
            <div style="font-weight:700;font-size:14px;color:#2C1810;">${unread.length > 0 ? `${unread.length} New Alert${unread.length>1?'s':''}` : 'Notifications'}</div>
            ${unread.length > 0 ? `<button onclick="markAllSeen()" style="background:none;border:none;cursor:pointer;font-size:11px;color:#E8663A;font-weight:700;font-family:'Inter',sans-serif;">Mark all read</button>` : ''}
          </div>
          <div style="max-height:320px;overflow-y:auto;">
            ${unread.length === 0
              ? `<div style="padding:28px 18px;text-align:center;color:#9B8570;font-size:13px;"><div style="font-size:30px;margin-bottom:8px;">✓</div>You're all caught up!</div>`
              : unread.map(a => `
              <div onclick="openAlertModal(${a.id})" style="padding:12px 18px;border-bottom:1px solid rgba(220,160,130,0.20);cursor:pointer;background:rgba(255,200,175,0.18);display:flex;gap:12px;align-items:flex-start;transition:background 0.15s;">
                <div style="width:8px;height:8px;border-radius:50%;background:#E8663A;margin-top:5px;flex-shrink:0;box-shadow:0 0 6px rgba(232,102,58,0.5);"></div>
                <div style="flex:1;">
                  <div style="font-weight:700;font-size:13px;color:#2C1810;margin-bottom:2px;">🆕 ${a.ticker} — ${a.title.replace(a.ticker+' ','').slice(0,30)}</div>
                  <div style="font-size:11px;color:#9B8570;">Entry $${a.entry} · Target $${a.t1} · ${a.tier} tier</div>
                  <div style="font-size:10px;color:rgba(130,70,45,0.55);margin-top:2px;">${fmtDate(a.created)}</div>
                </div>
                <span style="${badgeStyle(priorityColor(a.priority), C.chipBg)}font-size:9px;">${a.priority}</span>
              </div>`).join('')}
          </div>
          ${unread.length > 0 ? `<div style="padding:10px 18px;border-top:1px solid rgba(220,160,130,0.30);"><button onclick="markAllSeen();setTab('alerts')" style="${btnStyle('primary')}width:100%;justify-content:center;font-size:12px;padding:9px;">View All Alerts →</button></div>` : ''}
        </div>
      </div>
      <!-- Avatar -->
      <div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#E8663A,#D95F7A);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;box-shadow:0 2px 10px rgba(232,102,58,0.35);">${u.name.charAt(0).toUpperCase()}</div>
      <button onclick="handleLogout()" style="${btnStyle('ghost')}font-size:12px;padding:7px 13px;">Sign Out</button>
    </div>
  </nav>
  <!-- Notif overlay -->
  <div id="notif-overlay" onclick="closeNotifs()" style="display:none;position:fixed;inset:0;z-index:299;"></div>

  <!-- PAGE CONTENT -->
  <div style="max-width:1200px;margin:0 auto;padding:32px 24px;position:relative;z-index:1;" class="page-content">
    ${tab === 'dashboard' ? renderSubscriberDashboard() : ''}
    ${tab === 'alerts'    ? renderSubscriberAlerts()    : ''}
    ${tab === 'timeline'  ? renderSubscriberTimeline()  : ''}
    ${tab === 'account'   ? renderAccountTab()          : ''}
  </div>

  <!-- Alert Modal -->
  <div id="alert-modal-overlay"   style="display:none;" class="modal-overlay" onclick="closeAlertModal()"><div id="alert-modal-content" onclick="event.stopPropagation()"></div></div>
  <!-- Generic Modal -->
  <div id="generic-modal-overlay" style="display:none;" class="modal-overlay" onclick="closeGenericModal()"><div id="generic-modal-content" onclick="event.stopPropagation()"></div></div>
</div>`;
}

function setTab(t) { STATE.tab = t; render(); }

async function toggleNotifs() {
  const p = document.getElementById('notif-panel');
  const o = document.getElementById('notif-overlay');
  if (!p) return;
  const isOpen = p.style.display !== 'none';
  if (isOpen) {
    // closing — just hide
    p.style.display = 'none';
    if (o) o.style.display = 'none';
  } else {
    // opening — show panel then auto-clear notifications
    p.style.display = 'block';
    if (o) o.style.display = 'block';
    const unread = getUnreadAlerts();
    if (unread.length > 0) {
      // mark all seen silently in the background
      const u = STATE.currentUser;
      const allIds = STATE.alerts.map(a => a.id);
      try {
        const { user } = await API.put(`/api/users/${u.id}`, { seenAlertIds: allIds });
        STATE.currentUser = user;
        // re-render just the nav badge without closing the panel
        const badge = document.querySelector('.notif-badge');
        if (badge) badge.remove();
      } catch (e) { console.error(e); }
    }
  }
}

function closeNotifs() {
  const p = document.getElementById('notif-panel');
  const o = document.getElementById('notif-overlay');
  if (p) p.style.display = 'none';
  if (o) o.style.display = 'none';
}

async function markAllSeen() {
  const u = STATE.currentUser;
  const allIds = STATE.alerts.map(a => a.id);
  try {
    const { user } = await API.put(`/api/users/${u.id}`, { seenAlertIds: allIds });
    STATE.currentUser = user;
    closeNotifs();
    render();
  } catch (e) { console.error(e); }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function renderSubscriberDashboard() {
  const u        = STATE.currentUser;
  const tier     = u.tier ? TIERS[u.tier] : null;
  const locked   = isLocked(u);
  const unsub    = isUnsubscribed(u);
  const cancelled= isCancelled(u);
  const visible  = getVisibleAlerts();
  const active   = visible.filter(a => a.status === 'active');
  const closed   = visible.filter(a => a.status === 'closed');
  const stopped  = visible.filter(a => a.status === 'stopped');
  const winRate  = closed.length ? Math.round(closed.filter(a => a.pnl?.startsWith('+')).length / closed.length * 100) : 0;
  const allDays  = [...closed, ...stopped].map(a => daysToClose(a.buyDate, a.closeDate)).filter(Boolean);
  const avgDays  = allDays.length ? Math.round(allDays.reduce((a,b) => a+b, 0) / allDays.length) : null;

  return `
<div class="fade-in">
  <!-- Header -->
  <div style="margin-bottom:26px;">
    <h1 style="font-size:28px;font-weight:800;color:#2C1810;letter-spacing:-0.8px;margin-bottom:5px;">${getGreeting(u.name.split(' ')[0])}</h1>
    <p style="font-size:13px;color:rgba(90,45,25,0.65);">${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
  </div>

  ${unsub ? renderUnsubscribedBanner() : ''}
  ${cancelled && !unsub ? renderCancelledBanner() : ''}

  <!-- KPI Stats row -->
  <div style="display:flex;gap:14px;margin-bottom:22px;flex-wrap:wrap;">
    ${renderKpiCard('📈','Open Trades', locked ? '—' : active.length, locked ? 'subscribe to unlock' : 'currently active', C.activeText)}
    ${renderKpiCard('✅','Closed Trades', closed.length + stopped.length, '2026 total', '#1A7A50')}
    ${renderKpiCard('🏆','Win Rate', winRate+'%', closed.filter(a=>a.pnl?.startsWith('+')).length+' of '+closed.length+' wins', C.accent)}
    ${renderKpiCard('⏱','Avg Hold', avgDays ? avgDays+'d' : '—', 'days per trade', '#9B8570')}
    ${(() => { const pnls = [...closed,...stopped].map(a => parseFloat(a.pnl)).filter(n => !isNaN(n)); const avgR = pnls.length ? (pnls.reduce((a,b)=>a+b,0)/pnls.length).toFixed(1)+'%' : '—'; return renderKpiCard('💰','Avg Return', avgR, 'avg P&L per trade', '#1A7A50'); })()}
  </div>

  <!-- 2-col grid -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:22px;" class="grid-2">
    <!-- Open Positions -->
    <div style="${cardStyle}">
      <h3 style="font-size:15px;font-weight:700;color:#2C1810;margin-bottom:16px;display:flex;align-items:center;gap:7px;">
        <span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:#006E67;flex-shrink:0;"></span>Open Alerts
      </h3>
      ${locked ? `
      <div style="text-align:center;padding:32px 0;">
        <div style="font-size:38px;margin-bottom:12px;opacity:0.55;">🔒</div>
        <p style="color:rgba(90,45,25,0.65);font-size:13px;margin-bottom:18px;line-height:1.6;max-width:200px;margin-left:auto;margin-right:auto;">
          ${unsub ? 'Subscribe to a plan to view live open positions' : 'Reactivate your subscription to view open positions'}
        </p>
        <button onclick="setTab('account')" class="btn-glow" style="${btnStyle('primary')}font-size:12px;padding:9px 20px;">
          ${unsub ? 'Choose a Plan →' : 'Reactivate →'}
        </button>
      </div>` :
      active.length === 0 ? `<p style="font-size:13px;color:rgba(90,45,25,0.65);padding:20px 0;text-align:center;">No active trades in your tier</p>` :
      `<div style="padding-bottom:12px;">${active.map(a => renderOpenPositionCard(a)).join('')}</div>`}
    </div>
    <!-- Recent Closed -->
    <div style="${cardStyle}">
      <h3 style="font-size:15px;font-weight:700;color:#2C1810;margin-bottom:16px;display:flex;align-items:center;gap:7px;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#1A7A50;box-shadow:0 0 0 3px rgba(26,122,80,0.18);"></span>Recent Closed
      </h3>
      ${[...closed,...stopped].length === 0
        ? `<p style="font-size:13px;color:rgba(90,45,25,0.65);padding:20px 0;text-align:center;">No closed trades yet</p>`
        : [...closed,...stopped].map(a => `
        <div onclick="openAlertModal(${a.id})" style="display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid rgba(220,160,130,0.22);cursor:pointer;transition:background 0.15s;">
          <div style="display:flex;gap:9px;align-items:center;">
            <div>
              <div style="font-weight:700;font-size:14px;color:#2C1810;">${a.ticker}</div>
              <div style="display:flex;gap:5px;align-items:center;margin-top:3px;">
                <span style="${badgeStyle(statusColor(a.status), statusBg(a.status))}font-size:9px;">${a.status==='stopped'?'STOP LOSS':'CLOSED'}</span>
                ${daysToClose(a.buyDate,a.closeDate) ? `<span style="font-size:10px;color:#9B8570;">${daysToClose(a.buyDate,a.closeDate)}d</span>` : ''}
              </div>
            </div>
          </div>
          <div style="font-size:14px;font-weight:800;color:${a.pnl?.startsWith('+')?'#1A7A50':'#C0302A'};">${a.pnl}</div>
        </div>`).join('')}
    </div>
  </div>

  <!-- Gantt -->
  <div style="${cardStyle}">
    <h3 style="font-size:15px;font-weight:700;color:#2C1810;margin-bottom:4px;">Trade Timeline — 2026</h3>
    <p style="font-size:12px;color:rgba(90,45,25,0.60);margin-bottom:18px;">${locked ? 'Closed & stopped trades only' : `${tier?.label} tier · open trades capped to today`}</p>
    ${renderGantt(visible)}
  </div>
</div>`;
}

// ─── KPI Card helper ─────────────────────────────────────────────────────────
function renderKpiCard(icon, label, value, sub, color) {
  return `<div class="stat-card" style="position:relative;overflow:hidden;">
  <div style="position:absolute;top:-10px;right:-10px;width:60px;height:60px;border-radius:50%;background:${color}18;pointer-events:none;"></div>
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
    <div style="width:30px;height:30px;border-radius:9px;background:${color}15;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">${icon}</div>
    <div style="font-size:10px;letter-spacing:0.08em;color:rgba(90,45,25,0.60);text-transform:uppercase;font-weight:700;">${label}</div>
  </div>
  <div style="font-size:26px;font-weight:900;color:${color};letter-spacing:-1px;margin-bottom:3px;">${value}</div>
  <div style="font-size:11px;color:rgba(90,45,25,0.50);">${sub}</div>
</div>`;
}

function renderOpenPositionCard(a) {
  const days = daysToClose(a.buyDate, null);
  const saved = (STATE.currentUser?.watchlist || []).includes(a.id);
  const isUpdated = a.updatedAt && a.updatedAt !== a.created;
  return `
<div class="pos-card" onclick="openAlertModal(${a.id})" style="cursor:pointer;margin-bottom:16px;background:#fff;border-radius:22px;padding:16px 16px 14px;border:1px solid rgba(220,218,214,0.70);box-shadow:0 3px 16px rgba(80,70,60,0.10);position:relative;">
  <!-- Top row: ticker + days -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="font-weight:900;font-size:22px;color:#0F1E2E;letter-spacing:-0.5px;">${a.ticker}</span>
      ${isUpdated ? `<span style="font-size:9px;font-weight:700;color:#E8663A;background:rgba(232,102,58,0.10);border:1px solid rgba(232,102,58,0.25);border-radius:20px;padding:2px 7px;">UPDATED ${fmtDate(a.updatedAt)}</span>` : ''}
    </div>
    <span style="font-size:12px;color:#9A9189;font-weight:500;">${days !== null ? days+'d' : ''}&nbsp;·&nbsp;${fmtDate(a.buyDate)}</span>
  </div>
  <!-- Three large pill capsules matching reference design -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:0;">
    <div style="background:linear-gradient(135deg,#F5B942 0%,#E8883A 100%);border-radius:50px;padding:13px 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">
      <span style="font-size:9px;color:#0F1E2E;font-weight:800;text-transform:uppercase;letter-spacing:0.10em;opacity:0.75;">Entry</span>
      <span style="font-size:16px;font-weight:900;color:#0F1E2E;letter-spacing:-0.3px;">$${a.entry}</span>
    </div>
    <div style="background:linear-gradient(135deg,#3DB870 0%,#229954 100%);border-radius:50px;padding:13px 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">
      <span style="font-size:9px;color:#fff;font-weight:800;text-transform:uppercase;letter-spacing:0.10em;opacity:0.85;">Target</span>
      <span style="font-size:16px;font-weight:900;color:#fff;letter-spacing:-0.3px;">$${a.t1}</span>
    </div>
    <div style="background:linear-gradient(135deg,#F05050 0%,#C0302A 100%);border-radius:50px;padding:13px 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">
      <span style="font-size:9px;color:#fff;font-weight:800;text-transform:uppercase;letter-spacing:0.10em;opacity:0.85;">Stop</span>
      <span style="font-size:16px;font-weight:900;color:#fff;letter-spacing:-0.3px;">$${a.sl}</span>
    </div>
  </div>
  <!-- Thumbs-up action button (bottom-right, floating) -->
  <button onclick="event.stopPropagation();toggleWatchlist(${a.id})" title="${saved?'Unlike':'Like'}"
    style="position:absolute;bottom:-10px;right:12px;width:36px;height:36px;border-radius:50%;background:#fff;border:1.5px solid rgba(200,195,188,0.70);box-shadow:0 3px 12px rgba(80,70,60,0.15);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.18s;color:${saved?'#E8663A':'#9A9189'};">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="${saved?'#E8663A':'none'}" stroke="${saved?'#E8663A':'#9A9189'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  </button>
</div>`;\n}


function renderCancelledBanner() {
  return `<div style="${glass}border-radius:16px;padding:18px 22px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;border-left:4px solid #C0302A;">
    <div>
      <div style="font-size:15px;font-weight:700;color:#2C1810;margin-bottom:3px;">🔒 Subscription Cancelled</div>
      <p style="font-size:12px;color:rgba(90,45,25,0.70);margin:0;line-height:1.6;">Reactivate your plan to view live alerts and open positions.</p>
    </div>
    <button onclick="setTab('account')" class="btn-glow" style="${btnStyle('primary')}">Reactivate Now →</button>
  </div>`;
}

function renderUnsubscribedBanner() {
  return `<div style="${glass}border-radius:16px;padding:18px 22px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;border-left:4px solid #E8663A;">
    <div>
      <div style="font-size:15px;font-weight:700;color:#2C1810;margin-bottom:3px;">✨ Subscribe to View Alerts</div>
      <p style="font-size:12px;color:rgba(90,45,25,0.70);margin:0;line-height:1.6;">You're viewing closed trade history only. Choose a plan to access live alerts and real-time signals.</p>
    </div>
    <button onclick="setTab('account')" class="btn-glow" style="${btnStyle('primary')}">Choose a Plan →</button>
  </div>`;
}

// ─── Alerts Tab ───────────────────────────────────────────────────────────────
let alertFilter = 'all';
let alertSearch = '';

function renderSubscriberAlerts() {
  const u      = STATE.currentUser;
  const tier   = u.tier ? TIERS[u.tier] : null;
  const locked = isLocked(u);
  const unsub  = isUnsubscribed(u);
  const cancelled = isCancelled(u);
  const visible = getVisibleAlerts();
  const unread  = getUnreadAlerts();

  const filtered = visible.filter(a => {
    if (alertFilter === 'active'    && a.status !== 'active')  return false;
    if (alertFilter === 'closed'    && a.status !== 'closed')  return false;
    if (alertFilter === 'stopped'   && a.status !== 'stopped') return false;
    if (alertFilter === 'watchlist' && !u.watchlist?.includes(a.id)) return false;
    if (alertSearch && !a.ticker.toLowerCase().includes(alertSearch.toLowerCase()) &&
        !a.title.toLowerCase().includes(alertSearch.toLowerCase())) return false;
    return true;
  });

  // Filter pill styles
  const pill = (k,l) => `<button onclick="setAlertFilter('${k}')" style="padding:7px 16px;border-radius:10px;cursor:pointer;font-size:13px;font-family:'Inter',sans-serif;font-weight:600;transition:all 0.18s;${alertFilter===k?`background:linear-gradient(135deg,rgba(232,102,58,0.22),rgba(217,95,122,0.16));color:#C9481E;border:1px solid rgba(232,102,58,0.32);`:`background:transparent;color:rgba(90,45,25,0.75);border:1px solid transparent;`}">${l}</button>`;

  return `
<div class="fade-in">
  <div style="margin-bottom:22px;">
    <h1 style="font-size:28px;font-weight:800;color:#2C1810;letter-spacing:-0.8px;margin-bottom:5px;">Trade Alerts</h1>
    <p style="font-size:13px;color:rgba(90,45,25,0.65);">${locked ? 'Browse closed trades · Subscribe to unlock live alerts' : `● ${tier?.label} plan · Live feed`}</p>
  </div>
  ${unsub ? renderUnsubscribedBanner() : ''}
  ${cancelled && !unsub ? renderCancelledBanner() : ''}
  <div style="display:flex;gap:10px;margin-bottom:22px;flex-wrap:wrap;align-items:center;">
    <input id="alert-search" oninput="updateSearch(this.value)" style="${inputStyle}max-width:240px;flex:0 0 auto;" placeholder="🔍 Search ticker or title…" value="${alertSearch}">
    <div style="display:flex;gap:3px;flex-wrap:wrap;background:rgba(253,220,200,0.35);border-radius:12px;padding:3px;border:1px solid rgba(220,160,130,0.25);">
      ${[['all','All'],['active','Active'],['stopped','Stopped'],['closed','Closed'],['watchlist','❤ Liked']].map(([k,l]) => pill(k,l)).join('')}
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;" class="grid-2">
    ${locked ? STATE.alerts.filter(a=>a.status==='active').slice(0,2).map(a => `
    <div style="${glass}border-radius:20px;padding:22px;cursor:default;border:2px dashed rgba(232,102,58,0.35);min-height:180px;display:flex;align-items:center;justify-content:center;">
      <div style="text-align:center;padding:24px 16px;">
        <div style="font-size:36px;margin-bottom:12px;opacity:0.5;">🔒</div>
        <div style="font-size:13px;font-weight:700;color:#E8663A;margin-bottom:5px;">Active Alert</div>
        <div style="font-size:12px;color:#9B8570;margin-bottom:16px;">${unsub ? 'Subscribe to unlock' : 'Reactivate to unlock'}</div>
        <button onclick="setTab('account')" class="btn-glow" style="${btnStyle('primary')}font-size:12px;padding:8px 16px;">${unsub ? 'Choose Plan' : 'Reactivate'}</button>
      </div>
    </div>`).join('') : ''}
    ${!locked && u.tier === 'trader' ? `
    <div style="${glass}border-radius:20px;padding:22px;cursor:default;border:2px dashed rgba(232,102,58,0.35);min-height:180px;display:flex;align-items:center;justify-content:center;">
      <div style="text-align:center;padding:24px 16px;">
        <div style="font-size:36px;margin-bottom:12px;opacity:0.5;">🔒</div>
        <div style="font-size:13px;font-weight:700;color:#E8663A;margin-bottom:5px;">Elite Alert</div>
        <div style="font-size:12px;color:#9B8570;margin-bottom:16px;">Upgrade to Elite to unlock</div>
        <button onclick="setTab('account')" class="btn-glow" style="${btnStyle('pink')}font-size:12px;padding:8px 16px;">Upgrade →</button>
      </div>
    </div>` : ''}
    ${filtered.map(a => renderAlertCard(a, unread.some(u => u.id === a.id))).join('')}
    ${filtered.length === 0 && !locked ? `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#9B8570;font-size:14px;">No alerts match your filters.</div>` : ''}
  </div>
</div>`;
}

function setAlertFilter(f) { alertFilter = f; render(); }

function updateSearch(val) {
  alertSearch = val;
  clearTimeout(window._searchTimer);
  window._searchTimer = setTimeout(() => render(), 200);
}

function renderAlertCard(a, isNew) {
  const u        = STATE.currentUser;
  const saved    = u.watchlist?.includes(a.id);
  const days     = daysToClose(a.buyDate, a.closeDate);
  const isUpdated= a.updatedAt && a.updatedAt !== a.created;
  // Match open-position card layout exactly — single line, pill capsules
  return `
<div class="pos-card" onclick="openAlertModal(${a.id})" style="cursor:pointer;background:#fff;border-radius:22px;padding:14px 14px 12px;border:1px solid rgba(220,218,214,0.70);border-left:4px solid ${statusColor(a.status)};box-shadow:0 3px 16px rgba(80,70,60,0.10);position:relative;">
  ${isNew ? `<div class="pulse-dot" style="position:absolute;top:10px;right:10px;width:8px;height:8px;border-radius:50%;background:#E8663A;box-shadow:0 0 0 3px rgba(232,102,58,0.20);"></div>` : ''}
  <!-- Single line: ticker · days · date | status + like -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:6px;">
    <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
      <span style="font-weight:900;font-size:18px;color:#0F1E2E;letter-spacing:-0.4px;">${a.ticker}</span>
      <span style="font-size:11px;color:#9A9189;">${days !== null ? days+'d' : ''} · ${fmtDate(a.buyDate)}</span>
      ${isUpdated ? `<span style="font-size:9px;font-weight:700;color:#E8663A;background:rgba(232,102,58,0.10);border:1px solid rgba(232,102,58,0.25);border-radius:20px;padding:2px 7px;">UPDATED ${fmtDate(a.updatedAt)}</span>` : ''}
    </div>
    <div style="display:flex;gap:5px;align-items:center;">
      <span style="${badgeStyle(statusColor(a.status), statusBg(a.status))}font-size:9px;">${a.status}</span>
      <button onclick="event.stopPropagation();toggleWatchlist(${a.id})" title="${saved?'Unlike':'Like'}" style="background:none;border:none;cursor:pointer;font-size:18px;line-height:1;padding:1px 3px;color:${saved?'#E8663A':'rgba(180,110,90,0.35)'};transition:all 0.18s;">${saved ? '♥' : '♡'}</button>
    </div>
  </div>
  <!-- Three large pill capsules — same style as dashboard open alerts -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
    <div style="background:linear-gradient(135deg,#F5B942 0%,#E8883A 100%);border-radius:50px;padding:11px 8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;">
      <span style="font-size:8px;color:#0F1E2E;font-weight:800;text-transform:uppercase;letter-spacing:0.10em;opacity:0.75;">Entry</span>
      <span style="font-size:14px;font-weight:900;color:#0F1E2E;">$${a.entry}</span>
    </div>
    <div style="background:linear-gradient(135deg,#3DB870 0%,#229954 100%);border-radius:50px;padding:11px 8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;">
      <span style="font-size:8px;color:#fff;font-weight:800;text-transform:uppercase;letter-spacing:0.10em;opacity:0.85;">Target</span>
      <span style="font-size:14px;font-weight:900;color:#fff;">$${a.t1}</span>
    </div>
    <div style="background:linear-gradient(135deg,#F05050 0%,#C0302A 100%);border-radius:50px;padding:11px 8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;">
      <span style="font-size:8px;color:#fff;font-weight:800;text-transform:uppercase;letter-spacing:0.10em;opacity:0.85;">Stop</span>
      <span style="font-size:14px;font-weight:900;color:#fff;">$${a.sl}</span>
    </div>
  </div>
  ${a.pnl && a.pnl !== '0%' ? `<div style="display:flex;justify-content:flex-end;margin-top:7px;"><span style="font-size:13px;font-weight:800;color:${a.pnl.startsWith('+')?'#1A7A50':'#C0302A'};">${a.pnl}</span></div>` : ''}
</div>`;
}
async function toggleWatchlist(id) {
  const u  = STATE.currentUser;
  const wl = u.watchlist?.includes(id) ? u.watchlist.filter(x => x !== id) : [...(u.watchlist || []), id];
  try {
    const { user } = await API.put(`/api/users/${u.id}`, { watchlist: wl });
    STATE.currentUser = user;
    render();
  } catch (e) { console.error(e); }
}

// ─── Timeline Tab ─────────────────────────────────────────────────────────────
function renderSubscriberTimeline() {
  const u      = STATE.currentUser;
  const tier   = u.tier ? TIERS[u.tier] : null;
  const locked = isLocked(u);
  const unsub  = isUnsubscribed(u);
  const visible= getVisibleAlerts();

  return `
<div class="fade-in">
  <h1 style="font-size:28px;font-weight:800;color:#2C1810;letter-spacing:-0.8px;margin-bottom:5px;">Trade Timeline — 2026</h1>
  <p style="font-size:12px;color:rgba(90,45,25,0.65);margin-bottom:${locked?'10px':'18px'};">
    ${locked ? 'Closed & stopped trades only · Subscribe to see open positions' : `${tier?.label} tier · open trades capped at today`}
  </p>
  ${locked ? `<div style="background:rgba(255,200,170,0.40);border:1px solid rgba(232,102,58,0.28);border-radius:12px;padding:12px 18px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;gap:12px;">
    <span style="font-size:12px;color:rgba(90,45,25,0.75);">🔒 Active trades are hidden until you subscribe.</span>
    <button onclick="setTab('account')" class="btn-glow" style="${btnStyle('primary')}font-size:11px;padding:6px 14px;">${unsub ? 'Choose Plan →' : 'Reactivate →'}</button>
  </div>` : ''}
  <div style="${cardStyle}">${renderGantt(visible)}</div>
</div>`;
}

// ─── Gantt Chart ──────────────────────────────────────────────────────────────
function renderGantt(alerts) {
  if (!alerts.length) return `<p style="font-size:13px;color:rgba(90,45,25,0.65);text-align:center;padding:40px 0;">No trades to display</p>`;

  const barColor = (a) => a.status === 'active' ? '#1A6FAD' : a.status === 'closed' ? '#1A7A50' : '#C0302A';

  // Only show months from earliest alert to today
  const allMonths = alerts.map(a => getMonthIdx(a.buyDate) ?? 0);
  const minMonth = Math.min(...allMonths, TODAY_MONTH);
  const maxMonth = TODAY_MONTH;
  const visibleMonths = MONTHS.slice(minMonth, maxMonth + 1);
  const totalCols = Math.max(visibleMonths.length, 1);

  return `
<div style="overflow-x:auto;">
  <div style="min-width:560px;">
    <!-- Month header row -->
    <div style="display:grid;grid-template-columns:90px repeat(${totalCols},1fr);margin-bottom:10px;gap:2px;align-items:end;">
      <div style="font-size:9px;color:rgba(90,45,25,0.45);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding-bottom:6px;">Ticker</div>
      ${visibleMonths.map((m, i) => {
        const mIdx = i + minMonth;
        const isCur = mIdx === TODAY_MONTH;
        return `<div style="font-size:10px;color:${isCur?'#E8663A':'#9B8570'};text-align:center;font-weight:${isCur?800:500};letter-spacing:0.04em;padding-bottom:6px;border-bottom:2px solid ${isCur?'#E8663A':'rgba(220,160,130,0.22)'};">${m}${isCur?'▼':''}</div>`;
      }).join('')}
    </div>
    <!-- Alert rows -->
    ${alerts.map(a => {
      const buyM   = getMonthIdx(a.buyDate) ?? 0;
      const rawEnd = a.status === 'active' ? TODAY_MONTH : (a.closeDate ? getMonthIdx(a.closeDate) : TODAY_MONTH);
      const endM   = Math.min(rawEnd, TODAY_MONTH);
      const clampedBuy = Math.max(buyM, minMonth);
      const leftCols   = clampedBuy - minMonth;
      const spanCols   = Math.max(endM - clampedBuy + 1, 1);
      const days = daysToClose(a.buyDate, a.closeDate);
      const pnlStr = a.pnl && a.pnl !== '0%' ? ' · ' + a.pnl : '';
      return `
<div style="display:grid;grid-template-columns:90px repeat(${totalCols},1fr);margin-bottom:8px;gap:2px;align-items:center;">
  <div style="display:flex;flex-direction:column;padding-right:6px;">
    <span style="font-size:12px;font-weight:800;color:#2C1810;letter-spacing:-0.2px;">${a.ticker}</span>
    <span style="font-size:9px;color:#9B8570;">${a.entry ? '$'+a.entry : ''}</span>
  </div>
  ${Array.from({length:totalCols}).map((_,ci) => {
    const inBar  = ci >= leftCols && ci < leftCols + spanCols;
    const isFirst= ci === leftCols;
    const isLast = ci === leftCols + spanCols - 1;
    if (!inBar) return `<div style="height:30px;background:rgba(220,160,130,0.10);border-radius:4px;"></div>`;
    const rLeft  = isFirst ? '10px 0 0 10px' : '0';
    const rRight = isLast  ? '0 10px 10px 0' : '0';
    return `<div style="height:30px;background:${barColor(a)};border-radius:${isFirst?'10px 0 0 10px':'0'} ${isLast?'10px 10px':'0 0'} ${isFirst&&isLast?'10px':'0'};display:flex;align-items:center;padding:0 7px;overflow:hidden;justify-content:${isFirst?'flex-start':'flex-end'};">
      ${isFirst && spanCols > 1 ? `<span style="font-size:9px;color:#fff;font-weight:700;white-space:nowrap;opacity:0.95;">${days ? days+'d' : ''}</span>` : ''}
      ${isLast && a.status !== 'active' && pnlStr ? `<span style="font-size:9px;color:rgba(255,255,255,0.92);white-space:nowrap;font-weight:700;">${pnlStr}</span>` : ''}
    </div>`;
  }).join('')}
</div>`;
    }).join('')}
    <!-- Legend -->
    <div style="display:flex;gap:18px;margin-top:16px;padding-top:12px;border-top:1px solid rgba(220,160,130,0.22);flex-wrap:wrap;align-items:center;">
      ${[['#1A6FAD','Active'],['#1A7A50','Closed (profit)'],['#C0302A','Stop Loss']].map(([c,l]) =>
        `<div style="display:flex;align-items:center;gap:7px;font-size:11px;color:#9B8570;">
          <div style="width:24px;height:10px;background:${c};border-radius:5px;"></div>${l}
        </div>`).join('')}
      <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#E8663A;font-weight:700;">
        ▼ Today (${MONTHS[TODAY_MONTH]})
      </div>
    </div>
  </div>
</div>`;
}

// ─── Account Tab ──────────────────────────────────────────────────────────────
function renderAccountTab() {
  const u         = STATE.currentUser;
  const tier      = u.tier ? TIERS[u.tier] : null;
  const cancelled = isCancelled(u);
  const unsub     = isUnsubscribed(u);

  return `
<div class="fade-in">
  <h1 style="font-size:28px;font-weight:800;color:#2C1810;letter-spacing:-0.8px;margin-bottom:26px;">Account & Subscription</h1>

  <!-- Profile card -->
  <div style="${cardStyle}margin-bottom:22px;" id="profile-card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:18px;">
      <div style="display:flex;gap:18px;align-items:center;">
        <div style="width:60px;height:60px;border-radius:18px;background:linear-gradient(135deg,#E8663A,#D95F7A);color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;box-shadow:0 4px 18px rgba(232,102,58,0.38);">${u.name.charAt(0).toUpperCase()}</div>
        <div>
          <div style="font-weight:800;font-size:19px;color:#2C1810;">${u.name}</div>
          <div style="color:#9B8570;font-size:13px;margin-top:2px;">${u.email}</div>
          <div style="color:rgba(90,45,25,0.50);font-size:11px;margin-top:3px;">Member since ${u.joined}</div>
          <div style="display:flex;gap:7px;margin-top:10px;flex-wrap:wrap;">
            ${tier ? `<span style="${badgeStyle(tier.color, tier.bg)}">${tier.label}</span>` : `<span style="${badgeStyle('#9B8570','rgba(220,180,150,0.4)')}">No Plan</span>`}
            <span style="${badgeStyle(cancelled?'#C0302A':unsub?'#9B8570':'#1A7A50',cancelled?'rgba(255,200,195,0.65)':unsub?'rgba(220,180,150,0.4)':'rgba(180,248,210,0.55)')}">
              ${cancelled ? 'Cancelled' : unsub ? 'Unsubscribed' : 'Active'}
            </span>
          </div>
          <div id="profile-feedback" style="font-size:12px;margin-top:7px;font-weight:700;color:#1A7A50;"></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-direction:column;" id="profile-actions">
        <button onclick="showEditPanel('name')"     style="${btnStyle('secondary')}">✏️ Change Name</button>
        <button onclick="showEditPanel('password')" style="${btnStyle('secondary')}">🔑 Change Password</button>
      </div>
    </div>
    <div id="edit-panel"></div>
  </div>

  <!-- Subscription status -->
  <div style="${cardStyle}margin-bottom:22px;border-left:4px solid ${cancelled?'#C0302A':unsub?'#E8663A':tier?.color||'#E8663A'};">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:18px;">
      <div>
        <div style="font-size:10px;letter-spacing:0.09em;color:#9B8570;text-transform:uppercase;font-weight:700;margin-bottom:5px;">Subscription</div>
        ${unsub ? `
          <div style="font-size:21px;font-weight:800;color:#2C1810;">No Active Plan</div>
          <div style="font-size:13px;color:rgba(90,45,25,0.65);margin-top:5px;">Subscribe to unlock live alerts and real-time signals.</div>
        ` : `
          <div style="font-size:21px;font-weight:800;color:#2C1810;">${tier?.label} <span style="font-size:14px;font-weight:500;color:#9B8570;">· $${tier?.price}/month</span></div>
          <div style="font-size:13px;color:rgba(90,45,25,0.65);margin-top:5px;">
            ${cancelled ? 'Cancelled — choose a plan to restore full access.' : `Renews automatically · ${tier?.alerts.join(' + ')} tier alerts`}
          </div>
        `}
      </div>
      ${!unsub && !cancelled
        ? `<button onclick="showCancelModal()" style="${btnStyle('ghost')}color:#C0302A!important;border-color:rgba(192,48,42,0.35)!important;">Cancel Subscription</button>`
        : ''}
    </div>
  </div>

  <!-- Plan picker -->
  ${(unsub || cancelled || u.tier !== 'elite') ? `
  <h2 style="font-size:20px;font-weight:800;color:#2C1810;margin-bottom:16px;letter-spacing:-0.4px;">
    ${unsub || cancelled ? '✦ Choose a Plan' : '⬆ Upgrade Your Plan'}
  </h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:24px;" class="grid-2">
    ${Object.entries(TIERS).map(([key, t]) => {
      const isCurrent = u.tier === key && !cancelled;
      const canUpgrade= !isCurrent && (unsub || cancelled || TIER_ORDER[key] > TIER_ORDER[u.tier]);
      return `
      <div style="${cardStyle}border:2px solid ${isCurrent?t.color:'rgba(220,160,130,0.35)'};background:${isCurrent?t.bg:'rgba(253,235,220,0.38)'};position:relative;overflow:hidden;${isCurrent?'box-shadow:0 0 0 3px rgba(232,102,58,0.18),0 8px 32px rgba(180,80,60,0.18);':''}">
        ${isCurrent ? `<div style="${badgeStyle(t.color, t.bg)}margin-bottom:12px;">✓ Current Plan</div>` : ''}
        <!-- Background shimmer -->
        <div style="position:absolute;top:-20px;right:-20px;width:100px;height:100px;border-radius:50%;background:radial-gradient(circle,${key==='elite'?'rgba(217,95,122,0.10)':'rgba(232,102,58,0.08)'} 0%,transparent 70%);pointer-events:none;"></div>
        <div style="font-size:18px;font-weight:800;color:${t.color};margin-bottom:5px;">${t.label}</div>
        <div style="font-size:32px;font-weight:900;color:#2C1810;margin-bottom:5px;letter-spacing:-1px;">$${t.price}<span style="font-size:13px;font-weight:500;color:#9B8570;">/mo</span></div>
        <div style="font-size:13px;color:rgba(90,45,25,0.65);margin-bottom:10px;">Access to ${t.alerts.join(' + ')} tier alerts</div>
        <ul style="font-size:13px;color:rgba(90,45,25,0.75);margin-bottom:18px;padding-left:18px;line-height:2;">
          ${key === 'trader'
            ? '<li>All Trader-tier alerts</li><li>Entry, Target & Stop Loss signals</li><li>Real-time notifications</li>'
            : '<li>All Trader alerts included</li><li>Elite-tier picks</li><li>Priority alerts & early access</li>'}
        </ul>
        ${canUpgrade ? `<button onclick="subscribe('${key}')" class="btn-glow" style="${btnStyle(key==='elite'?'pink':'primary')}width:100%;justify-content:center;">
          ${unsub || cancelled ? `Subscribe — ${t.label}` : `Upgrade to ${t.label}`}
        </button>` : ''}
      </div>`;
    }).join('')}
  </div>` : ''}
</div>`;
}

function showEditPanel(type) {
  const panel   = document.getElementById('edit-panel');
  const actions = document.getElementById('profile-actions');
  if (!panel) return;
  if (actions) actions.style.display = 'none';

  if (type === 'name') {
    panel.innerHTML = `
    <div style="margin-top:22px;padding-top:22px;border-top:1px solid rgba(220,160,130,0.30);">
      <h3 style="font-size:15px;font-weight:700;color:#2C1810;margin-bottom:14px;">Change Display Name</h3>
      <div style="display:flex;gap:9px;max-width:420px;">
        <input id="edit-name" style="${inputStyle}flex:1;" value="${STATE.currentUser.name}" placeholder="Your name">
        <button onclick="saveName()" class="btn-glow" style="${btnStyle('primary')}">Save</button>
        <button onclick="cancelEditPanel()" style="${btnStyle('ghost')}">Cancel</button>
      </div>
    </div>`;
    setTimeout(() => document.getElementById('edit-name')?.focus(), 50);
  } else {
    panel.innerHTML = `
    <div style="margin-top:22px;padding-top:22px;border-top:1px solid rgba(220,160,130,0.30);">
      <h3 style="font-size:15px;font-weight:700;color:#2C1810;margin-bottom:14px;">Change Password</h3>
      <div style="max-width:420px;">
        ${[['Current Password','edit-pw-current'],['New Password','edit-pw-new'],['Confirm New','edit-pw-confirm']].map(([l,id]) =>
          `<div style="margin-bottom:12px;"><label style="${labelStyle}">${l}</label><input id="${id}" type="password" style="${inputStyle}" placeholder="••••••••"></div>`
        ).join('')}
        <div id="pw-error" style="display:none;color:#C0302A;font-size:12px;margin-bottom:10px;padding:8px 12px;background:rgba(255,200,195,0.65);border-radius:8px;"></div>
        <div style="display:flex;gap:9px;margin-top:6px;">
          <button onclick="savePassword()" class="btn-glow" style="${btnStyle('primary')}">Update Password</button>
          <button onclick="cancelEditPanel()" style="${btnStyle('ghost')}">Cancel</button>
        </div>
      </div>
    </div>`;
  }
}

function cancelEditPanel() {
  const panel   = document.getElementById('edit-panel');
  const actions = document.getElementById('profile-actions');
  if (panel)   panel.innerHTML   = '';
  if (actions) actions.style.display = '';
}

async function saveName() {
  const val = document.getElementById('edit-name')?.value?.trim();
  if (!val) return;
  try {
    const { user } = await API.put(`/api/users/${STATE.currentUser.id}`, { name: val });
    STATE.currentUser = user;
    cancelEditPanel();
    render();
    const fb = document.getElementById('profile-feedback');
    if (fb) { fb.textContent = '✓ Name updated!'; }
  } catch (e) { alert(e.message); }
}

async function savePassword() {
  const current = document.getElementById('edit-pw-current')?.value;
  const newPw   = document.getElementById('edit-pw-new')?.value;
  const confirm = document.getElementById('edit-pw-confirm')?.value;
  const errEl   = document.getElementById('pw-error');
  const showErr = (m) => { if (errEl) { errEl.textContent = m; errEl.style.display = 'block'; } };
  if (!current || !newPw || !confirm) { showErr('All fields required.'); return; }
  if (current !== STATE.currentUser.password) { showErr('Current password is incorrect.'); return; }
  if (newPw !== confirm) { showErr('Passwords do not match.'); return; }
  if (newPw.length < 6)  { showErr('Minimum 6 characters.'); return; }
  try {
    const { user } = await API.put(`/api/users/${STATE.currentUser.id}`, { password: newPw });
    STATE.currentUser = user;
    cancelEditPanel();
    render();
    const fb = document.getElementById('profile-feedback');
    if (fb) { fb.textContent = '✓ Password updated!'; }
  } catch (e) { showErr(e.message); }
}

async function subscribe(tierKey) {
  try {
    const { user } = await API.put(`/api/users/${STATE.currentUser.id}`, { tier: tierKey, subscriptionStatus: 'active' });
    STATE.currentUser = user;
    render();
  } catch (e) { alert(e.message); }
}

function showCancelModal() {
  const overlay = document.getElementById('generic-modal-overlay');
  const content = document.getElementById('generic-modal-content');
  if (!overlay || !content) return;
  content.innerHTML = `
  <div style="${glassHeavy}border-radius:24px;padding:32px;width:100%;max-width:440px;border:1px solid rgba(255,200,175,0.55);">
    <div style="text-align:center;margin-bottom:22px;">
      <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
      <h2 style="font-size:20px;font-weight:800;color:#2C1810;margin-bottom:7px;">Cancel Subscription?</h2>
      <p style="font-size:13px;color:rgba(90,45,25,0.70);line-height:1.7;">You'll immediately lose access to all active alerts. Closed trade history stays. You can choose any plan again anytime.</p>
    </div>
    <div class="cancel-warning" style="margin-bottom:22px;">
      <div style="font-size:12px;color:#8B1A1A;font-weight:700;margin-bottom:5px;">You will lose:</div>
      <div style="font-size:12px;color:#8B1A1A;line-height:2;">• All active (open) alerts · Future alerts · Live signal feed</div>
    </div>
    <div style="display:flex;gap:10px;">
      <button onclick="closeGenericModal()" style="${btnStyle('secondary')}flex:1;justify-content:center;">Keep My Plan</button>
      <button onclick="confirmCancel()"     style="${btnStyle('danger')}flex:1;justify-content:center;">Yes, Cancel</button>
    </div>
  </div>`;
  overlay.style.display = 'flex';
}

async function confirmCancel() {
  try {
    const { user } = await API.put(`/api/users/${STATE.currentUser.id}`, { subscriptionStatus: 'cancelled' });
    STATE.currentUser = user;
    closeGenericModal();
    render();
  } catch (e) { alert(e.message); }
}

// ─── Alert Modal ──────────────────────────────────────────────────────────────
function openAlertModal(id) {
  const a       = STATE.alerts.find(x => x.id === id);
  if (!a) return;
  const overlay = document.getElementById('alert-modal-overlay');
  const content = document.getElementById('alert-modal-content');
  if (!overlay || !content) return;
  const days = daysToClose(a.buyDate, a.closeDate);
  const tierInfo = TIERS[a.tier];

  content.innerHTML = `
  <div style="${glassHeavy}border-radius:24px;padding:30px;width:100%;max-width:560px;max-height:90vh;overflow:auto;border:1px solid rgba(255,200,175,0.55);">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;">
      <div>
        <div style="display:flex;align-items:center;gap:9px;margin-bottom:5px;">
          <span style="font-weight:900;font-size:24px;color:#2C1810;letter-spacing:-0.5px;">${a.ticker}</span>
          <span style="${badgeStyle(tierInfo?.color||'#9B8570', tierInfo?.bg||'rgba(220,180,150,0.5)')}">${a.tier}</span>
          <span style="${badgeStyle(statusColor(a.status), statusBg(a.status))}">${a.status}</span>
        </div>
        <div style="font-size:13px;color:#9B8570;">${a.category} · ${a.title}</div>
      </div>
      <button onclick="closeAlertModal()" style="${btnStyle('ghost')}padding:6px 10px;font-size:14px;">✕</button>
    </div>
    <p style="font-size:13px;color:rgba(90,45,25,0.72);line-height:1.75;margin-bottom:20px;">${a.description}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:13px;margin-bottom:18px;" class="grid-3">
      ${[['Entry',`$${a.entry}`,'#2C1810'],['Target',`$${a.t1}`,'#1A7A50'],['Stop Loss',`$${a.sl}`,'#C0302A']].map(([l,v,c]) =>
        `<div style="${glass}border-radius:16px;padding:12px 14px;"><div style="font-size:10px;letter-spacing:0.09em;color:rgba(90,45,25,0.60);text-transform:uppercase;margin-bottom:5px;font-weight:700;">${l}</div><div style="font-size:19px;font-weight:800;color:${c};">${v}</div></div>`
      ).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:18px;">
      ${[['P&L',a.pnl,a.pnl?.startsWith('+')?'#1A7A50':'#C0302A'],['Views',(a.views||0).toLocaleString(),'#B84A18'],['Days',days?`${days}d`:'—','#1A6FAD'],['Entry Date',fmtDate(a.buyDate),'#9B8570']].map(([l,v,c]) =>
        `<div style="${glass}border-radius:14px;padding:10px 12px;"><div style="font-size:10px;letter-spacing:0.09em;color:rgba(90,45,25,0.60);text-transform:uppercase;margin-bottom:4px;font-weight:700;">${l}</div><div style="font-size:14px;font-weight:800;color:${c};">${v}</div></div>`
      ).join('')}
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;">
      <span style="${badgeStyle(priorityColor(a.priority), C.chipBg)}">${a.priority}</span>
      ${a.closeDate ? `<span style="${badgeStyle('#9B8570', C.chipBg)}">Closed ${fmtDate(a.closeDate)}</span>` : ''}
    </div>
  </div>`;
  overlay.style.display = 'flex';
}

function closeAlertModal()   { const o = document.getElementById('alert-modal-overlay');   if (o) o.style.display = 'none'; }
function closeGenericModal() { const o = document.getElementById('generic-modal-overlay'); if (o) o.style.display = 'none'; }

function attachSubscriberEvents() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeAlertModal(); closeGenericModal(); closeNotifs(); }
  }, { once: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN APP
// ─────────────────────────────────────────────────────────────────────────────
function renderAdminApp() {
  const u   = STATE.currentUser;
  const tab = STATE.adminTab;
  const isAdminRole = u.role === 'admin';
  const adminTabs = [['dashboard','Dashboard'],['alerts','Alerts'],['users','Users'],['analytics','Analytics'],['account','My Account']];

  const navActive   = `background:linear-gradient(135deg,rgba(232,102,58,0.25),rgba(217,95,122,0.18));color:#2C1810;border:1px solid rgba(232,102,58,0.30);backdrop-filter:blur(8px);`;
  const navInactive = `background:transparent;color:rgba(90,45,25,0.80);border:1px solid transparent;`;
  const roleLabel   = isAdminRole ? 'ADMIN' : 'MANAGER';
  const roleColor   = isAdminRole ? '#E8663A' : '#1A6FAD';

  return `
<div style="${appBg}min-height:100vh;color:#2C1810;font-family:'Inter','Georgia',sans-serif;">
  <nav style="${navBg}padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:66px;position:sticky;top:0;z-index:100;box-shadow:0 2px 16px rgba(120,110,98,0.18);">
    <div style="display:flex;align-items:center;gap:9px;flex-shrink:0;">
      <div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#E8663A,#D95F7A);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:900;box-shadow:0 3px 12px rgba(232,102,58,0.4);">▲</div>
      <span style="font-size:18px;font-weight:800;color:#2C1810;letter-spacing:-0.5px;">SignalStack <span style="font-size:12px;font-weight:600;color:${roleColor};letter-spacing:0.02em;">${roleLabel}</span></span>
    </div>
    <div style="display:flex;gap:3px;" class="nav-links">
      ${adminTabs.map(([k,l]) => `<button onclick="setAdminTab('${k}')" style="padding:7px 16px;border-radius:10px;cursor:pointer;font-size:13px;font-family:'Inter',sans-serif;font-weight:600;transition:all 0.18s;${tab===k?navActive:navInactive}">${l}</button>`).join('')}
    </div>
    <div style="display:flex;gap:10px;align-items:center;">
      <div style="font-size:12px;text-align:right;">
        <div style="font-weight:700;color:#2C1810;font-size:13px;">${u.name}</div>
        <div style="color:${roleColor};font-weight:700;font-size:11px;letter-spacing:0.04em;">${roleLabel}</div>
      </div>
      <div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#E8663A,#C9481E);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;box-shadow:0 2px 10px rgba(232,102,58,0.35);">${u.name.charAt(0)}</div>
      <button onclick="handleLogout()" style="${btnStyle('ghost')}font-size:12px;padding:7px 13px;">Sign Out</button>
    </div>
  </nav>
  <div style="max-width:1200px;margin:0 auto;padding:32px 24px;position:relative;z-index:1;" class="page-content">
    ${tab === 'dashboard' ? renderAdminDashboard() : ''}
    ${tab === 'alerts'    ? renderAdminAlerts()    : ''}
    ${tab === 'users'     ? renderAdminUsers()      : ''}
    ${tab === 'analytics' ? renderAdminAnalytics()  : ''}
    ${tab === 'account'   ? renderAdminAccount()    : ''}
  </div>
  <!-- Modals -->
  <div id="alert-form-overlay"   style="display:none;" class="modal-overlay" onclick="closeAlertForm()"><div id="alert-form-content"   onclick="event.stopPropagation()"></div></div>
  <div id="user-form-overlay"    style="display:none;" class="modal-overlay" onclick="closeUserForm()"><div  id="user-form-content"    onclick="event.stopPropagation()"></div></div>
  <div id="admin-generic-overlay"style="display:none;" class="modal-overlay" onclick="closeAdminGenericModal()"><div id="admin-generic-content" onclick="event.stopPropagation()"></div></div>
</div>`;
}
function setAdminTab(t) { STATE.adminTab = t; render(); }

function getAdminStats() {
  const subs      = STATE.allUsers.filter(u => u.role === 'subscriber');
  const managers  = STATE.allUsers.filter(u => u.role === 'manager');
  const traderCount = subs.filter(u => u.tier === 'trader' && u.subscriptionStatus === 'active').length;
  const eliteCount  = subs.filter(u => u.tier === 'elite'  && u.subscriptionStatus === 'active').length;
  const cancelCount = subs.filter(u => u.subscriptionStatus === 'cancelled').length;
  const revenue   = traderCount * TIERS.trader.price + eliteCount * TIERS.elite.price;
  const activeAlerts = STATE.alerts.filter(a => a.status === 'active').length;
  const closedAlerts = STATE.alerts.filter(a => a.status === 'closed');
  const closedWins   = closedAlerts.filter(a => a.pnl?.startsWith('+')).length;
  const winRate = closedAlerts.length ? Math.round(closedWins / closedAlerts.length * 100) : 0;
  return { subs, managers, traderCount, eliteCount, cancelCount, revenue, activeAlerts, closedWins, closedTotal: closedAlerts.length, winRate };
}

function renderAdminDashboard() {
  const s = getAdminStats();
  const recentAlerts = STATE.alerts.slice(0, 5);

  return `
<div class="fade-in">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px;flex-wrap:wrap;gap:16px;">
    <div>
      <h1 style="font-size:28px;font-weight:800;color:#2C1810;letter-spacing:-0.8px;margin-bottom:5px;">Admin Dashboard</h1>
      <p style="font-size:13px;color:rgba(90,45,25,0.65);">${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
    </div>
    <div style="display:flex;gap:9px;">
      <button onclick="openAlertForm()"       class="btn-glow" style="${btnStyle('primary')}">+ New Alert</button>
      <button onclick="setAdminTab('analytics')" style="${btnStyle('secondary')}">Analytics →</button>
    </div>
  </div>
  <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:22px;">
    ${[
      ['Subscribers',     s.subs.length,                                               'Total accounts',   '#1A6FAD'],
      ['Monthly Revenue', `$${s.revenue.toLocaleString()}`,                            'Est. MRR',         '#1A7A50'],
      ['Active Alerts',   s.activeAlerts,                                              'Live now',          '#B84A18'],
      ['Win Rate',        `${s.winRate}%`,                                             `${s.closedWins}/${s.closedTotal} wins`, '#1A7A50'],
      ['Stop Losses',     STATE.alerts.filter(a=>a.status==='stopped').length,         'Stopped',           '#C0302A'],
      ['Cancellations',   s.cancelCount,                                               'Cancelled subs',    '#E8663A'],
    ].map(([l,v,sub,c]) => `
    <div class="stat-card">
      <div style="font-size:10px;letter-spacing:0.09em;color:rgba(90,45,25,0.60);text-transform:uppercase;margin-bottom:5px;font-weight:700;">${l}</div>
      <div style="font-size:22px;font-weight:800;color:${c};">${v}</div>
      <div style="font-size:11px;color:rgba(90,45,25,0.50);margin-top:4px;">${sub}</div>
    </div>`).join('')}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:22px;" class="grid-2">
    ${['trader','elite'].map(key => {
      const t = TIERS[key];
      const n = key === 'trader' ? s.traderCount : s.eliteCount;
      return `<div style="${cardStyle}border-left:4px solid ${t.color};">
        <div style="font-size:10px;color:#9B8570;text-transform:uppercase;letter-spacing:0.09em;font-weight:700;margin-bottom:6px;">${t.label} Tier</div>
        <div style="font-size:34px;font-weight:900;color:${t.color};letter-spacing:-1px;">${n}</div>
        <div style="font-size:12px;color:rgba(90,45,25,0.60);margin-bottom:10px;">subscribers · $${(n*t.price).toLocaleString()}/mo</div>
        <div style="height:6px;background:rgba(220,160,130,0.22);border-radius:3px;">
          <div style="width:${s.subs.length>0?(n/s.subs.length*100):0}%;height:100%;background:linear-gradient(90deg,${t.color},${key==='elite'?'#D95F7A':'#E8663A'});border-radius:3px;"></div>
        </div>
      </div>`;
    }).join('')}
  </div>
  <div style="${cardStyle}">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="font-size:15px;font-weight:700;color:#2C1810;">Recent Alerts</h3>
      <button onclick="setAdminTab('alerts')" style="${btnStyle('secondary')}font-size:11px;padding:6px 13px;">View All</button>
    </div>
    <div style="overflow-x:auto;">
      <table style="${tableStyle}">
        <thead><tr>${['Ticker','Title','Tier','Status','Entry','P&L','Views','Actions'].map(h => `<th style="${thStyle}">${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${recentAlerts.map(a => `<tr>
            <td style="${tdStyle}"><strong style="color:#2C1810;">${a.ticker}</strong></td>
            <td style="${tdStyle}max-width:160px;"><span style="font-size:12px;color:rgba(90,45,25,0.75);">${a.title.slice(0,28)}…</span></td>
            <td style="${tdStyle}"><span style="${badgeStyle(TIERS[a.tier]?.color||'#9B8570',TIERS[a.tier]?.bg||'rgba(220,180,150,0.5)')}font-size:9px;">${a.tier}</span></td>
            <td style="${tdStyle}"><span style="${badgeStyle(statusColor(a.status), statusBg(a.status))}font-size:9px;">${a.status}</span></td>
            <td style="${tdStyle}font-weight:700;">$${a.entry}</td>
            <td style="${tdStyle}font-weight:800;color:${a.pnl?.startsWith('+')?'#1A7A50':'#C0302A'};">${a.pnl}</td>
            <td style="${tdStyle}color:#9B8570;">${(a.views||0).toLocaleString()}</td>
            <td style="${tdStyle}"><div style="display:flex;gap:5px;">
              <button onclick="openAlertForm(${a.id})" style="${btnStyle('secondary')}padding:4px 9px;font-size:11px;">Edit</button>
              <button onclick="deleteAlert(${a.id})"   style="${btnStyle('danger')}padding:4px 9px;font-size:11px;">Del</button>
            </div></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
</div>`;
}

function renderAdminAlerts() {
  const activeCount  = STATE.alerts.filter(a=>a.status==='active').length;
  const closedCount  = STATE.alerts.filter(a=>a.status==='closed').length;
  const stoppedCount = STATE.alerts.filter(a=>a.status==='stopped').length;

  return `
<div class="fade-in">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;">
    <div>
      <h1 style="font-size:28px;font-weight:800;color:#2C1810;letter-spacing:-0.8px;margin-bottom:5px;">Alert Management</h1>
      <p style="font-size:13px;color:rgba(90,45,25,0.65);">Create and manage all trade alerts</p>
    </div>
    <button onclick="openAlertForm()" class="btn-glow" style="${btnStyle('primary')}">+ Create Alert</button>
  </div>
  <div style="display:flex;gap:14px;margin-bottom:20px;flex-wrap:wrap;">
    ${[['Total',STATE.alerts.length,'#2C1810'],['Active',activeCount,'#1A7A50'],['Closed',closedCount,'#9B8570'],['Stopped',stoppedCount,'#C0302A']].map(([l,v,c]) =>
      `<div class="stat-card" style="flex:0 0 auto;min-width:100px;"><div style="font-size:10px;letter-spacing:0.09em;color:rgba(90,45,25,0.60);text-transform:uppercase;margin-bottom:5px;font-weight:700;">${l}</div><div style="font-size:24px;font-weight:800;color:${c};">${v}</div></div>`
    ).join('')}
  </div>
  <div style="${cardStyle}">
    <div style="overflow-x:auto;">
      <table style="${tableStyle}">
        <thead><tr>${['Ticker/Title','Tier','Priority','Status','Entry','Target','SL','P&L','Days','Created','Actions'].map(h => `<th style="${thStyle}">${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${STATE.alerts.map(a => `<tr>
            <td style="${tdStyle}"><div style="font-weight:800;font-size:13px;color:#2C1810;">${a.ticker}</div><div style="font-size:11px;color:#9B8570;">${(a.title||'').slice(0,24)}…</div></td>
            <td style="${tdStyle}"><span style="${badgeStyle(TIERS[a.tier]?.color||'#9B8570',TIERS[a.tier]?.bg||'rgba(220,180,150,0.5)')}font-size:9px;">${a.tier}</span></td>
            <td style="${tdStyle}"><span style="font-size:11px;color:${priorityColor(a.priority)};font-weight:700;">${a.priority}</span></td>
            <td style="${tdStyle}"><span style="${badgeStyle(statusColor(a.status), statusBg(a.status))}font-size:9px;">${a.status}</span></td>
            <td style="${tdStyle}font-weight:700;">$${a.entry}</td>
            <td style="${tdStyle}color:#1A7A50;font-weight:700;">$${a.t1}</td>
            <td style="${tdStyle}color:#C0302A;font-weight:700;">$${a.sl}</td>
            <td style="${tdStyle}font-weight:800;color:${a.pnl?.startsWith('+')?'#1A7A50':'#C0302A'};">${a.pnl}</td>
            <td style="${tdStyle}color:#E8663A;font-weight:600;">${daysToClose(a.buyDate,a.closeDate)||'—'}d</td>
            <td style="${tdStyle}font-size:11px;color:#9B8570;">${a.created}</td>
            <td style="${tdStyle}"><div style="display:flex;gap:5px;">
              <button onclick="openAlertForm(${a.id})" style="${btnStyle('secondary')}padding:4px 8px;font-size:11px;">✏️</button>
              <button onclick="deleteAlert(${a.id})"   style="${btnStyle('danger')}padding:4px 8px;font-size:11px;">🗑</button>
            </div></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
</div>`;
}

function renderAdminUsers() {
  const me = STATE.currentUser;
  const isAdminRole = me.role === 'admin';
  const subscribers = STATE.allUsers.filter(u => u.role === 'subscriber');
  const managers    = STATE.allUsers.filter(u => u.role === 'manager');

  const roleColor = (r) => r === 'admin' ? '#B84A18' : r === 'manager' ? '#1A6FAD' : '#1A7A50';
  const roleBg    = (r) => r === 'admin' ? 'rgba(255,210,185,0.65)' : r === 'manager' ? 'rgba(180,220,255,0.55)' : 'rgba(180,248,210,0.55)';

  return `
<div class="fade-in">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;">
    <div>
      <h1 style="font-size:28px;font-weight:800;color:#2C1810;letter-spacing:-0.8px;margin-bottom:5px;">User Management</h1>
      <p style="font-size:13px;color:rgba(90,45,25,0.65);">${STATE.allUsers.length} total accounts · ${managers.length} manager${managers.length!==1?'s':''}</p>
    </div>
    <div style="display:flex;gap:8px;">
      ${isAdminRole ? `<button onclick="openManagerForm()" style="${btnStyle('secondary')}">+ Add Manager</button>` : ''}
      <button onclick="openUserForm()" class="btn-glow" style="${btnStyle('primary')}">+ Add User</button>
    </div>
  </div>
  ${isAdminRole && managers.length > 0 ? `
  <div style="${cardStyle}margin-bottom:18px;border-left:4px solid #1A6FAD;">
    <h3 style="font-size:14px;font-weight:700;color:#2C1810;margin-bottom:14px;display:flex;align-items:center;gap:8px;">
      <span style="${badgeStyle('#1A6FAD','rgba(180,220,255,0.55)')}">MANAGER</span> Manager Accounts
    </h3>
    <div style="overflow-x:auto;">
      <table style="${tableStyle}">
        <thead><tr>${['Name / Email','Joined','Actions'].map(h => `<th style="${thStyle}">${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${managers.map(u => `<tr>
            <td style="${tdStyle}"><div style="display:flex;gap:9px;align-items:center;">
              <div style="width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#1A6FAD,#1A4FAD);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">${u.name.charAt(0)}</div>
              <div><div style="font-weight:700;font-size:13px;color:#2C1810;">${u.name}</div><div style="font-size:11px;color:#9B8570;">${u.email}</div></div>
            </div></td>
            <td style="${tdStyle}font-size:11px;color:#9B8570;">${u.joined}</td>
            <td style="${tdStyle}"><button onclick="deleteUser(${u.id})" style="${btnStyle('danger')}padding:4px 8px;font-size:11px;">Remove</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>` : ''}
  <div style="${cardStyle}">
    <div style="overflow-x:auto;">
      <table style="${tableStyle}">
        <thead><tr>${['Name / Email','Role','Tier','Status','Joined','Watchlist','Actions'].map(h => `<th style="${thStyle}">${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${STATE.allUsers.filter(u => u.role !== 'manager').map(u => `<tr>
            <td style="${tdStyle}"><div style="display:flex;gap:9px;align-items:center;">
              <div style="width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#E8663A,#D95F7A);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">${u.name.charAt(0)}</div>
              <div><div style="font-weight:700;font-size:13px;color:#2C1810;">${u.name}</div><div style="font-size:11px;color:#9B8570;">${u.email}</div></div>
            </div></td>
            <td style="${tdStyle}"><span style="${badgeStyle(roleColor(u.role),roleBg(u.role))}">${u.role}</span></td>
            <td style="${tdStyle}">${u.tier ? `<span style="${badgeStyle(TIERS[u.tier]?.color||'#9B8570',TIERS[u.tier]?.bg||'rgba(220,180,150,0.5)')}font-size:9px;">${u.tier}</span>` : '<span style="color:#9B8570;font-size:13px;">—</span>'}</td>
            <td style="${tdStyle}"><span style="${badgeStyle(u.subscriptionStatus==='cancelled'?'#C0302A':u.subscriptionStatus==='unsubscribed'?'#9B8570':'#1A7A50',u.subscriptionStatus==='cancelled'?'rgba(255,200,195,0.65)':u.subscriptionStatus==='unsubscribed'?'rgba(220,180,150,0.35)':'rgba(180,248,210,0.55)')}">${u.subscriptionStatus||'active'}</span></td>
            <td style="${tdStyle}font-size:11px;color:#9B8570;">${u.joined}</td>
            <td style="${tdStyle}"><span style="font-weight:700;color:#2C1810;">${(u.watchlist||[]).length}</span></td>
            <td style="${tdStyle}">
              <div style="display:flex;gap:4px;flex-wrap:wrap;">
                ${u.role !== 'admin' ? `
                  <button onclick="openUserForm(${u.id})" style="${btnStyle('secondary')}padding:4px 8px;font-size:11px;">Edit</button>
                  ${u.subscriptionStatus === 'cancelled'
                    ? `<button onclick="reactivateUser(${u.id})" style="${btnStyle('gold')}padding:4px 8px;font-size:11px;">Reactivate</button>`
                    : `<button onclick="cancelUserSub(${u.id})"  style="${btnStyle('ghost')}padding:4px 8px;font-size:11px;color:#C0302A;border-color:rgba(192,48,42,0.25)!important;">Cancel Sub</button>`
                  }
                  <button onclick="deleteUser(${u.id})" style="${btnStyle('danger')}padding:4px 8px;font-size:11px;">Del</button>
                ` : '<span style="font-size:11px;color:#9B8570;">Admin</span>'}
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
</div>`;
}
function renderAdminAnalytics() {
  const s = getAdminStats();
  const me = STATE.currentUser;
  const isAdminRole = me.role === 'admin';
  const subTab = STATE.adminAnalyticsTab;

  const subTabBtn = (k, l) => `<button onclick="setAnalyticsTab('${k}')" style="padding:7px 16px;border-radius:10px;cursor:pointer;font-size:13px;font-family:'Inter',sans-serif;font-weight:600;transition:all 0.18s;${subTab===k?`background:linear-gradient(135deg,rgba(232,102,58,0.22),rgba(217,95,122,0.16));color:#C9481E;border:1px solid rgba(232,102,58,0.32);`:`background:transparent;color:rgba(90,45,25,0.75);border:1px solid transparent;`}">${l}</button>`;

  return `
<div class="fade-in">
  <h1 style="font-size:28px;font-weight:800;color:#2C1810;letter-spacing:-0.8px;margin-bottom:16px;">Analytics</h1>
  <!-- Sub-tab bar -->
  <div style="display:flex;gap:3px;background:rgba(253,220,200,0.35);border-radius:12px;padding:3px;border:1px solid rgba(220,160,130,0.25);margin-bottom:24px;width:fit-content;">
    ${subTabBtn('overview','Overview')}
    ${subTabBtn('timeline','Trade Timeline')}
    ${isAdminRole ? subTabBtn('pricing','Pricing Management') : ''}
  </div>

  ${subTab === 'overview' ? `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px;" class="grid-2">
    <!-- Revenue by Tier -->
    <div style="${cardStyle}">
      <h3 style="font-size:15px;font-weight:700;color:#2C1810;margin-bottom:20px;">Revenue by Tier</h3>
      ${['trader','elite'].map(key => {
        const t = TIERS[key];
        const n = key === 'trader' ? s.traderCount : s.eliteCount;
        const rev = n * t.price;
        const pct = s.revenue > 0 ? ((rev / s.revenue) * 100).toFixed(0) : 0;
        return `<div style="margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:13px;font-weight:700;color:#2C1810;">${t.label}</span>
            <span style="font-size:13px;font-weight:800;color:${t.color};">$${rev.toLocaleString()} <span style="font-size:11px;font-weight:600;color:#9B8570;">(${pct}%)</span></span>
          </div>
          <div style="height:8px;background:rgba(220,160,130,0.22);border-radius:4px;">
            <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,${t.color},${key==='elite'?'#D95F7A':'#E8663A'});border-radius:4px;"></div>
          </div>
        </div>`;
      }).join('')}
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(220,160,130,0.28);">
        <div style="font-size:10px;letter-spacing:0.09em;color:rgba(90,45,25,0.60);text-transform:uppercase;font-weight:700;">Total MRR</div>
        <div style="font-size:30px;font-weight:900;color:#1A7A50;letter-spacing:-1px;">$${s.revenue.toLocaleString()}</div>
      </div>
    </div>
    <!-- Alert Performance -->
    <div style="${cardStyle}">
      <h3 style="font-size:15px;font-weight:700;color:#2C1810;margin-bottom:20px;">Alert Performance</h3>
      ${[
        ['Active',           s.activeAlerts,                                        C.activeText],
        ['Closed Profitable',s.closedWins,                                          C.closedText],
        ['Stop Loss',        STATE.alerts.filter(a=>a.status==='stopped').length,   C.stoppedText],
      ].map(([l,n,c]) => `
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(220,160,130,0.22);">
        <div style="display:flex;gap:8px;align-items:center;">
          <div style="width:10px;height:10px;border-radius:50%;background:${c};"></div>
          <span style="font-size:13px;color:#2C1810;">${l}</span>
        </div>
        <span style="font-size:16px;font-weight:800;color:${c};">${n}</span>
      </div>`).join('')}
      <div style="margin-top:20px;">
        <div style="font-size:10px;letter-spacing:0.09em;color:rgba(90,45,25,0.60);text-transform:uppercase;font-weight:700;">Overall Win Rate</div>
        <div style="font-size:34px;font-weight:900;color:#1A7A50;letter-spacing:-1px;">${s.winRate}%</div>
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px;" class="grid-2">
    <!-- Subscriber Distribution -->
    <div style="${cardStyle}">
      <h3 style="font-size:15px;font-weight:700;color:#2C1810;margin-bottom:20px;">Subscriber Distribution</h3>
      ${[
        ['Active Trader',  s.traderCount,                                                       TIERS.trader.color],
        ['Active Elite',   s.eliteCount,                                                        TIERS.elite.color],
        ['Managers',       s.managers.length,                                                   '#1A6FAD'],
        ['Cancelled',      s.cancelCount,                                                        '#C0302A'],
        ['Unsubscribed',   s.subs.filter(u=>u.subscriptionStatus==='unsubscribed').length,      '#9B8570'],
      ].map(([l,n,c]) => `
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(220,160,130,0.22);">
        <div style="display:flex;gap:8px;align-items:center;">
          <div style="width:10px;height:10px;border-radius:50%;background:${c};"></div>
          <span style="font-size:13px;color:#2C1810;">${l}</span>
        </div>
        <span style="font-size:16px;font-weight:800;color:${c};">${n}</span>
      </div>`).join('')}
    </div>
    <!-- Top Alerts -->
    <div style="${cardStyle}">
      <h3 style="font-size:15px;font-weight:700;color:#2C1810;margin-bottom:20px;">Top Alerts by Views</h3>
      ${[...STATE.alerts].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,5).map(a => `
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(220,160,130,0.22);">
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="font-weight:800;font-size:13px;color:#2C1810;">${a.ticker}</span>
          <span style="${badgeStyle(statusColor(a.status),statusBg(a.status))}font-size:9px;">${a.status}</span>
        </div>
        <span style="font-size:13px;font-weight:800;color:#B84A18;">${(a.views||0).toLocaleString()} views</span>
      </div>`).join('')}
    </div>
  </div>` : ''}

  ${subTab === 'timeline' ? `
  <div style="${cardStyle}">
    <h3 style="font-size:15px;font-weight:700;color:#2C1810;margin-bottom:5px;">Trade Timeline — 2026</h3>
    <p style="font-size:12px;color:rgba(90,45,25,0.60);margin-bottom:18px;">All alerts · open trades capped at today</p>
    ${renderGantt(STATE.alerts)}
  </div>` : ''}

  ${subTab === 'pricing' && isAdminRole ? renderPricingManagement() : ''}
</div>`;
}

function setAnalyticsTab(t) { STATE.adminAnalyticsTab = t; render(); }

function renderPricingManagement() {
  return `
<div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
    <div>
      <h2 style="font-size:20px;font-weight:800;color:#2C1810;margin-bottom:4px;">Pricing Management</h2>
      <p style="font-size:13px;color:rgba(90,45,25,0.65);">Update subscription tier pricing and labels. Changes apply immediately.</p>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:22px;" class="grid-2">
    ${Object.entries(TIERS).map(([key, t]) => `
    <div style="${cardStyle}border-left:4px solid ${t.color};">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
        <div style="width:40px;height:40px;border-radius:12px;background:${t.bg};display:flex;align-items:center;justify-content:center;font-size:20px;">${key==='elite'?'👑':'📊'}</div>
        <div>
          <div style="font-size:16px;font-weight:800;color:${t.color};">${t.label} Tier</div>
          <div style="font-size:12px;color:#9B8570;">Current: $${t.price}/month</div>
        </div>
      </div>
      <div style="margin-bottom:14px;"><label style="${labelStyle}">Tier Name</label><input id="pm-name-${key}" style="${inputStyle}" value="${t.label}" placeholder="e.g. ${t.label}"></div>
      <div style="margin-bottom:18px;"><label style="${labelStyle}">Monthly Price ($)</label>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;color:#9B8570;font-weight:700;">$</span>
          <input id="pm-price-${key}" type="number" style="${inputStyle}flex:1;" value="${t.price}" min="1" step="1">
          <span style="font-size:12px;color:#9B8570;white-space:nowrap;">/month</span>
        </div>
      </div>
      <div id="pm-feedback-${key}" style="font-size:12px;font-weight:700;min-height:16px;margin-bottom:8px;"></div>
      <button onclick="saveTierPricing('${key}')" class="btn-glow" style="${btnStyle('primary')}width:100%;justify-content:center;">💾 Save ${t.label} Pricing</button>
    </div>`).join('')}
  </div>
  <div style="${cardStyle}border-left:4px solid #9B8570;">
    <h3 style="font-size:14px;font-weight:700;color:#2C1810;margin-bottom:12px;">ℹ️ Pricing Notes</h3>
    <ul style="font-size:13px;color:rgba(90,45,25,0.75);line-height:2.2;padding-left:18px;margin:0;">
      <li>Price changes take effect immediately for all new subscriptions and display.</li>
      <li>Existing active subscribers retain their current billing amount until manually updated.</li>
      <li>MRR calculations on the Analytics overview use the latest prices.</li>
      <li>The Terms &amp; Conditions subscription section references these prices.</li>
    </ul>
  </div>
</div>`;
}

async function saveTierPricing(key) {
  const name  = document.getElementById('pm-name-'+key)?.value?.trim();
  const price = parseFloat(document.getElementById('pm-price-'+key)?.value);
  const fb    = document.getElementById('pm-feedback-'+key);
  if (!name || isNaN(price) || price <= 0) {
    if (fb) { fb.textContent = '⚠ Invalid name or price.'; fb.style.color = '#C0302A'; }
    return;
  }
  try {
    await API.put('/api/pricing', { ['name_'+key]: name, ['price_'+key]: price.toString() });
    TIERS[key].label = name;
    TIERS[key].price = price;
    if (fb) { fb.textContent = '✓ Saved!'; fb.style.color = '#1A7A50'; }
    setTimeout(() => render(), 1400);
  } catch (e) {
    if (fb) { fb.textContent = '✗ ' + (e.message || 'Save failed'); fb.style.color = '#C0302A'; }
  }
}
function renderAdminAccount() {
  const u = STATE.currentUser;
  const isAdminRole = u.role === 'admin';
  const roleLabel = isAdminRole ? 'Admin' : 'Manager';
  const roleColor = isAdminRole ? '#B84A18' : '#1A6FAD';
  const roleBg    = isAdminRole ? 'rgba(255,210,185,0.65)' : 'rgba(180,220,255,0.55)';
  return `
<div class="fade-in">
  <h1 style="font-size:28px;font-weight:800;color:#2C1810;letter-spacing:-0.8px;margin-bottom:26px;">My Account</h1>
  <div style="${cardStyle}margin-bottom:22px;" id="admin-profile-card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:18px;">
      <div style="display:flex;gap:18px;align-items:center;">
        <div style="width:60px;height:60px;border-radius:18px;background:linear-gradient(135deg,#E8663A,#C9481E);color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;box-shadow:0 4px 18px rgba(232,102,58,0.38);">${u.name.charAt(0).toUpperCase()}</div>
        <div>
          <div style="font-weight:800;font-size:19px;color:#2C1810;">${u.name}</div>
          <div style="color:#9B8570;font-size:13px;margin-top:2px;">${u.email}</div>
          <div style="color:rgba(90,45,25,0.50);font-size:11px;margin-top:3px;">Member since ${u.joined}</div>
          <div style="display:flex;gap:7px;margin-top:10px;">
            <span style="${badgeStyle(roleColor,roleBg)}">${roleLabel}</span>
            <span style="${badgeStyle('#1A7A50','rgba(180,248,210,0.55)')}">${isAdminRole ? 'Full Access' : 'Limited Access'}</span>
          </div>
          <div id="admin-profile-feedback" style="font-size:12px;margin-top:7px;font-weight:700;color:#1A7A50;"></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-direction:column;" id="admin-profile-actions">
        <button onclick="showAdminEditPanel('name')"     style="${btnStyle('secondary')}">✏️ Change Name</button>
        <button onclick="showAdminEditPanel('password')" style="${btnStyle('secondary')}">🔑 Change Password</button>
      </div>
    </div>
    <div id="admin-edit-panel"></div>
  </div>
</div>`;
}
function showAdminEditPanel(type) {
  const panel   = document.getElementById('admin-edit-panel');
  const actions = document.getElementById('admin-profile-actions');
  if (!panel) return;
  if (actions) actions.style.display = 'none';
  const u = STATE.currentUser;

  if (type === 'name') {
    panel.innerHTML = `
    <div style="margin-top:22px;padding-top:22px;border-top:1px solid rgba(220,160,130,0.30);">
      <h3 style="font-size:15px;font-weight:700;color:#2C1810;margin-bottom:14px;">Change Display Name</h3>
      <div style="display:flex;gap:9px;max-width:420px;">
        <input id="admin-edit-name" style="${inputStyle}flex:1;" value="${u.name}" placeholder="Your name">
        <button onclick="saveAdminName()"       class="btn-glow" style="${btnStyle('primary')}">Save</button>
        <button onclick="cancelAdminEditPanel()" style="${btnStyle('ghost')}">Cancel</button>
      </div>
    </div>`;
    setTimeout(() => document.getElementById('admin-edit-name')?.focus(), 50);
  } else {
    panel.innerHTML = `
    <div style="margin-top:22px;padding-top:22px;border-top:1px solid rgba(220,160,130,0.30);">
      <h3 style="font-size:15px;font-weight:700;color:#2C1810;margin-bottom:14px;">Change Password</h3>
      <div style="max-width:420px;">
        ${[['Current Password','admin-pw-current'],['New Password','admin-pw-new'],['Confirm New','admin-pw-confirm']].map(([l,id]) =>
          `<div style="margin-bottom:12px;"><label style="${labelStyle}">${l}</label><input id="${id}" type="password" style="${inputStyle}" placeholder="••••••••"></div>`
        ).join('')}
        <div id="admin-pw-error" style="display:none;color:#C0302A;font-size:12px;margin-bottom:10px;padding:8px 12px;background:rgba(255,200,195,0.65);border-radius:8px;"></div>
        <div style="display:flex;gap:9px;margin-top:6px;">
          <button onclick="saveAdminPassword()"   class="btn-glow" style="${btnStyle('primary')}">Update Password</button>
          <button onclick="cancelAdminEditPanel()" style="${btnStyle('ghost')}">Cancel</button>
        </div>
      </div>
    </div>`;
  }
}

function cancelAdminEditPanel() {
  const panel   = document.getElementById('admin-edit-panel');
  const actions = document.getElementById('admin-profile-actions');
  if (panel)   panel.innerHTML   = '';
  if (actions) actions.style.display = '';
}

async function saveAdminName() {
  const val = document.getElementById('admin-edit-name')?.value?.trim();
  if (!val) return;
  try {
    const { user } = await API.put(`/api/users/${STATE.currentUser.id}`, { name: val });
    STATE.currentUser = user;
    cancelAdminEditPanel();
    render();
  } catch (e) { alert(e.message); }
}

async function saveAdminPassword() {
  const current = document.getElementById('admin-pw-current')?.value;
  const newPw   = document.getElementById('admin-pw-new')?.value;
  const confirm = document.getElementById('admin-pw-confirm')?.value;
  const errEl   = document.getElementById('admin-pw-error');
  const showErr = (m) => { if (errEl) { errEl.textContent = m; errEl.style.display = 'block'; } };
  if (!current || !newPw || !confirm) { showErr('All fields required.'); return; }
  if (current !== STATE.currentUser.password) { showErr('Current password is incorrect.'); return; }
  if (newPw !== confirm) { showErr('Passwords do not match.'); return; }
  if (newPw.length < 6)  { showErr('Minimum 6 characters.'); return; }
  try {
    const { user } = await API.put(`/api/users/${STATE.currentUser.id}`, { password: newPw });
    STATE.currentUser = user;
    cancelAdminEditPanel();
    const fb = document.getElementById('admin-profile-feedback');
    if (fb) { fb.textContent = '✓ Password updated!'; }
    render();
  } catch (e) { showErr(e.message); }
}

// ─── Alert Form Modal ─────────────────────────────────────────────────────────
let editingAlertId = null;

function openAlertForm(id) {
  editingAlertId = id || null;
  const a       = id ? STATE.alerts.find(x => x.id === id) : null;
  const overlay = document.getElementById('alert-form-overlay');
  const content = document.getElementById('alert-form-content');
  if (!overlay || !content) return;

  const categories = ['Technology','Semiconductors','E-Commerce','Automotive','Crypto/Fintech','Media/Streaming','Healthcare','Finance'];

  content.innerHTML = `
  <div style="${glassHeavy}border-radius:24px;padding:30px;width:100%;max-width:600px;max-height:90vh;overflow:auto;border:1px solid rgba(255,200,175,0.55);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;">
      <h2 style="font-size:20px;font-weight:800;color:#2C1810;">${a ? 'Edit Alert' : 'Create New Alert'}</h2>
      <button onclick="closeAlertForm()" style="${btnStyle('ghost')}padding:6px 10px;">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
      <div><label style="${labelStyle}">Ticker</label><input id="af-ticker" style="${inputStyle}" placeholder="AAPL" value="${a?.ticker||''}"></div>
      <div><label style="${labelStyle}">Title</label><input id="af-title" style="${inputStyle}" placeholder="Alert title…" value="${a?.title||''}"></div>
    </div>
    <div style="margin-bottom:14px;"><label style="${labelStyle}">Description</label><textarea id="af-desc" style="${inputStyle}min-height:72px;resize:vertical;" placeholder="Trade rationale…">${a?.description||''}</textarea></div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px;">
      <div><label style="${labelStyle}">Category</label>
        <select id="af-category" style="${inputStyle}">
          ${categories.map(c => `<option ${(a?.category||'Technology')===c?'selected':''}>${c}</option>`).join('')}
        </select></div>
      <div><label style="${labelStyle}">Tier</label>
        <select id="af-tier" style="${inputStyle}">
          <option value="trader" ${(a?.tier||'trader')==='trader'?'selected':''}>Trader</option>
          <option value="elite"  ${a?.tier==='elite'?'selected':''}>Elite</option>
        </select></div>
      <div><label style="${labelStyle}">Priority</label>
        <select id="af-priority" style="${inputStyle}">
          ${['low','medium','high','critical'].map(p => `<option ${(a?.priority||'medium')===p?'selected':''}>${p}</option>`).join('')}
        </select></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px;">
      <div><label style="${labelStyle}">Entry Price</label><input id="af-entry" style="${inputStyle}" placeholder="$0" value="${a?.entry||''}"></div>
      <div><label style="${labelStyle}">Target (T1)</label><input id="af-t1" style="${inputStyle}" placeholder="$0" value="${a?.t1||''}"></div>
      <div><label style="${labelStyle}">Stop Loss</label><input id="af-sl" style="${inputStyle}" placeholder="$0" value="${a?.sl||''}"></div>
    </div>
    ${a ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
      <div><label style="${labelStyle}">P&L</label><input id="af-pnl" style="${inputStyle}" placeholder="+0%" value="${a?.pnl||'0%'}"></div>
      <div><label style="${labelStyle}">Close Date (if closed)</label><input id="af-closedate" type="date" style="${inputStyle}" value="${a?.closeDate||''}"></div>
    </div>` : ''}
    <div style="margin-bottom:20px;"><label style="${labelStyle}">Status</label>
      <select id="af-status" style="${inputStyle}max-width:200px;">
        ${['active','closed','stopped'].map(s => `<option ${(a?.status||'active')===s?'selected':''}>${s}</option>`).join('')}
      </select></div>
    <div id="af-error" style="display:none;color:#C0302A;font-size:12px;margin-bottom:12px;padding:8px 12px;background:rgba(255,200,195,0.65);border-radius:8px;"></div>
    <div style="display:flex;gap:9px;justify-content:flex-end;">
      <button onclick="closeAlertForm()" style="${btnStyle('secondary')}">Cancel</button>
      <button onclick="saveAlertForm()"  class="btn-glow" style="${btnStyle('primary')}">${a ? 'Save Changes' : 'Create Alert'}</button>
    </div>
  </div>`;
  overlay.style.display = 'flex';
}

function closeAlertForm() { const o = document.getElementById('alert-form-overlay'); if (o) o.style.display = 'none'; }

async function saveAlertForm() {
  const errEl  = document.getElementById('af-error');
  const showErr= (m) => { if (errEl) { errEl.textContent = m; errEl.style.display = 'block'; } };
  const ticker   = document.getElementById('af-ticker')?.value?.trim();
  const title    = document.getElementById('af-title')?.value?.trim();
  const desc     = document.getElementById('af-desc')?.value?.trim();
  const category = document.getElementById('af-category')?.value;
  const tier     = document.getElementById('af-tier')?.value;
  const priority = document.getElementById('af-priority')?.value;
  const entry    = parseFloat(document.getElementById('af-entry')?.value);
  const t1       = parseFloat(document.getElementById('af-t1')?.value);
  const sl       = parseFloat(document.getElementById('af-sl')?.value);
  const status   = document.getElementById('af-status')?.value;
  const pnl      = document.getElementById('af-pnl')?.value || '0%';
  const closeDate= document.getElementById('af-closedate')?.value || null;
  if (!ticker || !title) { showErr('Ticker and title are required.'); return; }
  try {
    if (editingAlertId) {
      const { alert } = await API.put(`/api/alerts/${editingAlertId}`, { ticker, title, description: desc, category, tier, priority, status, entry, t1, sl, pnl, closeDate });
      STATE.alerts = STATE.alerts.map(a => a.id === editingAlertId ? alert : a);
    } else {
      const { alert } = await API.post('/api/alerts', { ticker, title, description: desc, category, tier, priority, status, entry, t1, sl });
      STATE.alerts = [alert, ...STATE.alerts];
    }
    closeAlertForm();
    render();
  } catch (e) { showErr(e.message || 'Failed to save alert.'); }
}

async function deleteAlert(id) {
  if (!confirm('Delete this alert?')) return;
  try {
    await API.delete(`/api/alerts/${id}`);
    STATE.alerts = STATE.alerts.filter(a => a.id !== id);
    render();
  } catch (e) { alert(e.message); }
}

// ─── User Form Modal ──────────────────────────────────────────────────────────
let editingUserId = null;

function openUserForm(id) {
  editingUserId = id || null;
  const u       = id ? STATE.allUsers.find(x => x.id === id) : null;
  const overlay = document.getElementById('user-form-overlay');
  const content = document.getElementById('user-form-content');
  if (!overlay || !content) return;

  content.innerHTML = `
  <div style="${glassHeavy}border-radius:24px;padding:30px;width:100%;max-width:460px;max-height:90vh;overflow:auto;border:1px solid rgba(255,200,175,0.55);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;">
      <h2 style="font-size:20px;font-weight:800;color:#2C1810;">${u ? 'Edit User' : 'Add New User'}</h2>
      <button onclick="closeUserForm()" style="${btnStyle('ghost')}padding:6px 10px;">✕</button>
    </div>
    <div style="margin-bottom:14px;"><label style="${labelStyle}">Full Name</label><input id="uf-name" style="${inputStyle}" placeholder="Full name" value="${u?.name||''}"></div>
    <div style="margin-bottom:14px;"><label style="${labelStyle}">Email</label><input id="uf-email" type="email" style="${inputStyle}" placeholder="email@example.com" value="${u?.email||''}" ${u?'disabled':''}></div>
    ${!u ? `<div style="margin-bottom:14px;"><label style="${labelStyle}">Password</label><input id="uf-password" type="password" style="${inputStyle}" placeholder="••••••••" value="pass123"></div>` : ''}
    <div style="margin-bottom:14px;">
      <label style="${labelStyle}">Subscription Tier</label>
      <div style="display:flex;gap:10px;">
        ${Object.entries(TIERS).map(([key, t]) => `
        <div onclick="selectUserTier('${key}')" id="uf-tier-${key}" style="flex:1;padding:12px 14px;border-radius:12px;cursor:pointer;border:2px solid ${(u?.tier||'trader')===key?t.color:'rgba(220,160,130,0.35)'};background:${(u?.tier||'trader')===key?t.bg:'rgba(253,235,220,0.45)'};transition:all 0.18s;">
          <div style="font-size:12px;font-weight:800;color:${t.color};margin-bottom:2px;">${t.label}</div>
          <div style="font-size:18px;font-weight:900;color:#2C1810;">$${t.price}<span style="font-size:10px;font-weight:500;color:#9B8570;">/mo</span></div>
        </div>`).join('')}
      </div>
    </div>
    <input type="hidden" id="uf-tier" value="${u?.tier||'trader'}">
    <div style="margin-bottom:20px;"><label style="${labelStyle}">Subscription Status</label>
      <select id="uf-status" style="${inputStyle}">
        <option value="active"       ${(u?.subscriptionStatus||'active')==='active'?'selected':''}>Active</option>
        <option value="cancelled"    ${u?.subscriptionStatus==='cancelled'?'selected':''}>Cancelled</option>
        <option value="unsubscribed" ${u?.subscriptionStatus==='unsubscribed'?'selected':''}>Unsubscribed</option>
      </select></div>
    <div id="uf-error" style="display:none;color:#C0302A;font-size:12px;margin-bottom:12px;padding:8px 12px;background:rgba(255,200,195,0.65);border-radius:8px;"></div>
    <div style="display:flex;gap:9px;justify-content:flex-end;">
      <button onclick="closeUserForm()" style="${btnStyle('secondary')}">Cancel</button>
      <button onclick="saveUserForm()"  class="btn-glow" style="${btnStyle('primary')}">${u ? 'Save Changes' : 'Add User'}</button>
    </div>
  </div>`;
  overlay.style.display = 'flex';
}

function selectUserTier(key) {
  document.getElementById('uf-tier').value = key;
  Object.keys(TIERS).forEach(k => {
    const el = document.getElementById(`uf-tier-${k}`);
    if (!el) return;
    const t = TIERS[k];
    el.style.borderColor = k === key ? t.color : 'rgba(220,160,130,0.35)';
    el.style.background  = k === key ? t.bg    : 'rgba(253,235,220,0.45)';
  });
}

function closeUserForm() { const o = document.getElementById('user-form-overlay'); if (o) o.style.display = 'none'; }

// ─── Manager Form Modal (admin only) ─────────────────────────────────────────
function openManagerForm() {
  const overlay = document.getElementById('user-form-overlay');
  const content = document.getElementById('user-form-content');
  if (!overlay || !content) return;
  content.innerHTML = `
  <div style="${glassHeavy}border-radius:24px;padding:30px;width:100%;max-width:460px;max-height:90vh;overflow:auto;border:1px solid rgba(255,200,175,0.55);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;">
      <h2 style="font-size:20px;font-weight:800;color:#2C1810;">Add Manager Account</h2>
      <button onclick="closeUserForm()" style="${btnStyle('ghost')}padding:6px 10px;">✕</button>
    </div>
    <div style="margin-bottom:14px;padding:12px 16px;background:rgba(26,111,173,0.08);border-radius:10px;border:1px solid rgba(26,111,173,0.20);">
      <p style="font-size:12px;color:#1A6FAD;margin:0;line-height:1.7;">Managers have access to alerts and user management but <strong>cannot</strong> create other managers, delete managers, or change pricing. Only admins can remove managers.</p>
    </div>
    <div style="margin-bottom:14px;"><label style="${labelStyle}">Full Name</label><input id="mf-name" style="${inputStyle}" placeholder="Manager full name"></div>
    <div style="margin-bottom:14px;"><label style="${labelStyle}">Email</label><input id="mf-email" type="email" style="${inputStyle}" placeholder="manager@example.com"></div>
    <div style="margin-bottom:20px;"><label style="${labelStyle}">Password</label><input id="mf-password" type="password" style="${inputStyle}" placeholder="••••••••"></div>
    <div id="mf-error" style="display:none;color:#C0302A;font-size:12px;margin-bottom:12px;padding:8px 12px;background:rgba(255,200,195,0.65);border-radius:8px;"></div>
    <div style="display:flex;gap:9px;justify-content:flex-end;">
      <button onclick="closeUserForm()" style="${btnStyle('secondary')}">Cancel</button>
      <button onclick="saveManagerForm()" class="btn-glow" style="${btnStyle('primary')}">Create Manager</button>
    </div>
  </div>`;
  overlay.style.display = 'flex';
}

async function saveManagerForm() {
  const errEl  = document.getElementById('mf-error');
  const showErr= (m) => { if (errEl) { errEl.textContent = m; errEl.style.display = 'block'; } };
  const name   = document.getElementById('mf-name')?.value?.trim();
  const email  = document.getElementById('mf-email')?.value?.trim();
  const pw     = document.getElementById('mf-password')?.value;
  if (!name || !email) { showErr('Name and email required.'); return; }
  if (pw && pw.length < 6) { showErr('Password must be at least 6 characters.'); return; }
  try {
    const { user } = await API.post('/api/users', { name, email, password: pw || 'manager123', tier: null, subscriptionStatus: 'active', role: 'manager' });
    STATE.allUsers = [...STATE.allUsers, user];
    closeUserForm();
    render();
  } catch (e) { showErr(e.message || 'Failed to create manager.'); }
}

async function saveUserForm() {
  const errEl  = document.getElementById('uf-error');
  const showErr= (m) => { if (errEl) { errEl.textContent = m; errEl.style.display = 'block'; } };
  const name   = document.getElementById('uf-name')?.value?.trim();
  const email  = document.getElementById('uf-email')?.value?.trim();
  const pw     = document.getElementById('uf-password')?.value;
  const tier   = document.getElementById('uf-tier')?.value;
  const status = document.getElementById('uf-status')?.value;
  if (!name || !email) { showErr('Name and email required.'); return; }
  try {
    if (editingUserId) {
      const { user } = await API.put(`/api/users/${editingUserId}`, { name, tier, subscriptionStatus: status });
      STATE.allUsers = STATE.allUsers.map(u => u.id === editingUserId ? user : u);
    } else {
      const { user } = await API.post('/api/users', { name, email, password: pw || 'pass123', tier, subscriptionStatus: status });
      STATE.allUsers = [...STATE.allUsers, user];
    }
    closeUserForm();
    render();
  } catch (e) { showErr(e.message || 'Failed to save user.'); }
}

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  try {
    await API.delete(`/api/users/${id}`);
    STATE.allUsers = STATE.allUsers.filter(u => u.id !== id);
    render();
  } catch (e) { alert(e.message); }
}

async function reactivateUser(id) {
  try {
    const { user } = await API.put(`/api/users/${id}`, { subscriptionStatus: 'active' });
    STATE.allUsers = STATE.allUsers.map(u => u.id === id ? user : u);
    render();
  } catch (e) { alert(e.message); }
}

async function cancelUserSub(id) {
  try {
    const { user } = await API.put(`/api/users/${id}`, { subscriptionStatus: 'cancelled' });
    STATE.allUsers = STATE.allUsers.map(u => u.id === id ? user : u);
    render();
  } catch (e) { alert(e.message); }
}

function closeAdminGenericModal() { const o = document.getElementById('admin-generic-overlay'); if (o) o.style.display = 'none'; }

function attachAdminEvents() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeAlertForm(); closeUserForm(); closeAdminGenericModal(); }
  }, { once: true });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();
