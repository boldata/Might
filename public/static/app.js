// ─────────────────────────────────────────────────────────────────────────────
// SignalStack — Full Frontend Application
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
      const res = await fetch(path, {
        method,
        headers: this.headers(),
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (e) {
      throw e;
    }
  },

  get: (p) => API.call('GET', p),
  post: (p, b) => API.call('POST', p, b),
  put: (p, b) => API.call('PUT', p, b),
  delete: (p) => API.call('DELETE', p),
};

// ─── Constants ───────────────────────────────────────────────────────────────
const TIERS = {
  trader: { label: 'Trader', price: 229, color: '#C17F24', bg: '#FDF3DC', alerts: ['trader'] },
  elite:  { label: 'Elite',  price: 769, color: '#1A1A2E', bg: '#E8E4DC', alerts: ['trader', 'elite'] },
};
const TIER_ORDER = { trader: 0, elite: 1 };
const canSeeAlert = (userTier, alertTier) =>
  userTier && TIER_ORDER[userTier] >= TIER_ORDER[alertTier];

const TODAY = new Date('2026-03-25');
const TODAY_MONTH = 2; // March 0-indexed
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const C = {
  accent: '#D4820A', accentDark: '#B56D00',
  activeText: '#0F5FA8', activeBg: 'rgba(210,240,255,0.7)',
  closedText: '#0F6E3A', closedBg: 'rgba(210,250,225,0.7)',
  stoppedText: '#B02020', stoppedBg: 'rgba(255,220,215,0.7)',
  chipBg: 'rgba(255,225,170,0.65)', chipText: '#8A4E00',
};

// ─── State ───────────────────────────────────────────────────────────────────
let STATE = {
  currentUser: null,
  alerts: [],
  allUsers: [],
  loading: true,
  authMode: 'login',
  tab: 'dashboard',
  adminTab: 'dashboard',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const isActive = (u) => u.subscriptionStatus === 'active';
const isUnsubscribed = (u) => !u.tier || u.subscriptionStatus === 'unsubscribed';
const isCancelled = (u) => u.subscriptionStatus === 'cancelled';
const isLocked = (u) => isUnsubscribed(u) || isCancelled(u);

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—';

const statusColor = (s) =>
  s === 'active' ? C.activeText : s === 'closed' ? C.closedText : C.stoppedText;
const statusBg = (s) =>
  s === 'active' ? C.activeBg : s === 'closed' ? C.closedBg : C.stoppedBg;
const priorityColor = (p) =>
  ({ low: '#8B7355', medium: '#C17F24', high: '#E67E22', critical: '#C0392B' }[p] || '#8B7355');

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

const tierBadgeStyle = (t) => {
  if (t === 'trader') return 'background:#FDF3DC;color:#C17F24;border:1px solid #E8D5A3;';
  if (t === 'elite')  return 'background:#1A1A2E;color:#F5EFE6;border:1px solid #1A1A2E;';
  return 'background:#F5EFE6;color:#8B7355;border:1px solid #D4C4AA;';
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const glass = `background:rgba(255,248,235,0.55);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,220,160,0.45);box-shadow:0 8px 32px rgba(100,60,10,0.18),inset 0 1px 0 rgba(255,255,255,0.35);`;
const btnStyle = (v = 'primary') => {
  const base = `padding:9px 18px;border-radius:12px;cursor:pointer;font-size:13px;font-weight:600;font-family:'Georgia',serif;transition:all 0.15s;display:inline-flex;align-items:center;gap:6px;border:none;`;
  const variants = {
    primary:   `background:#D4820A;color:#fff;box-shadow:0 2px 12px rgba(180,100,0,0.35);`,
    secondary: `background:rgba(255,195,80,0.18);color:#B56D00;border:1px solid rgba(212,130,10,0.45)!important;backdrop-filter:blur(8px);`,
    danger:    `background:rgba(192,57,43,0.9);color:#fff;`,
    ghost:     `background:rgba(255,230,180,0.2);color:#6B4010;border:1px solid rgba(200,155,80,0.4)!important;backdrop-filter:blur(8px);`,
    gold:      `background:#D4820A;color:#fff;box-shadow:0 2px 12px rgba(180,100,0,0.35);`,
    dark:      `background:rgba(30,15,0,0.85);color:#FAF0D8;backdrop-filter:blur(8px);`,
  };
  return base + (variants[v] || variants.primary);
};
const inputStyle = `background:rgba(255,240,200,0.45);backdrop-filter:blur(8px);border:1px solid rgba(200,155,80,0.5);border-radius:10px;padding:10px 14px;font-size:14px;color:#2A1400;width:100%;box-sizing:border-box;font-family:'Georgia',serif;outline:none;`;
const labelStyle = `font-size:12px;color:rgba(100,60,0,0.8);margin-bottom:4px;display:block;font-weight:600;`;
const badgeStyle = (color, bg) => `display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;background:${bg};color:${color};letter-spacing:0.05em;text-transform:uppercase;backdrop-filter:blur(6px);`;
const cardStyle = `${glass}border-radius:20px;padding:24px;`;
const tableStyle = `width:100%;border-collapse:collapse;`;
const thStyle = `text-align:left;padding:10px 14px;font-size:10px;color:rgba(100,60,0,0.7);letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid rgba(200,155,80,0.4);background:rgba(255,220,140,0.25);`;
const tdStyle = `padding:12px 14px;font-size:13px;color:#1A0E00;border-bottom:1px solid rgba(200,160,90,0.2);vertical-align:middle;`;

// ─── Router / Renderer ───────────────────────────────────────────────────────
function render() {
  const root = document.getElementById('root');
  if (STATE.loading) {
    root.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#B8935A 0%,#C9A87C 50%,#A07840 100%);">
      <div style="text-align:center;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;justify-content:center;">
          <div style="width:40px;height:40px;border-radius:10px;background:#D4820A;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:900;">▲</div>
          <span style="font-size:24px;font-weight:700;color:#fff;text-shadow:0 2px 8px rgba(80,40,0,0.4);">SignalStack</span>
        </div>
        <div class="spinner" style="margin:0 auto;"></div>
      </div>
    </div>`;
    return;
  }
  if (!STATE.currentUser) {
    root.innerHTML = renderAuthPage();
    attachAuthEvents();
    return;
  }
  if (STATE.currentUser.role === 'admin') {
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
  const [alertsData, usersData] = await Promise.all([
    API.get('/api/alerts'),
    STATE.currentUser?.role === 'admin' ? API.get('/api/users') : Promise.resolve({ users: [] }),
  ]);
  STATE.alerts = alertsData.alerts || [];
  STATE.allUsers = usersData.users || [];
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function renderAuthPage() {
  const m = STATE.authMode;
  return `
<div style="font-family:'Georgia','Times New Roman',serif;background:linear-gradient(135deg,#B8935A 0%,#C9A87C 50%,#A07840 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;">
  <div style="position:absolute;top:28px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;">
    <div style="width:36px;height:36px;border-radius:10px;background:#D4820A;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:900;">▲</div>
    <span style="font-size:22px;font-weight:700;color:#fff;text-shadow:0 2px 8px rgba(80,40,0,0.4);">SignalStack</span>
  </div>
  <div style="${glass}border-radius:20px;padding:28px;width:100%;max-width:420px;margin-top:60px;" class="fade-in">
    ${m !== 'forgot' ? `
    <div style="display:flex;gap:4px;margin-bottom:24px;background:rgba(210,170,90,0.25);border-radius:12px;padding:4px;">
      <button id="tab-login" onclick="setAuthMode('login')" style="${btnStyle(m==='login'?'primary':'ghost')};flex:1;justify-content:center;border-radius:8px!important;">Sign In</button>
      <button id="tab-register" onclick="setAuthMode('register')" style="${btnStyle(m==='register'?'primary':'ghost')};flex:1;justify-content:center;border-radius:8px!important;">Create Account</button>
    </div>` : ''}
    <div style="margin-bottom:20px;">
      <h2 style="font-size:19px;font-weight:700;color:#2A1400;margin-bottom:4px;">${
        m==='login' ? 'Welcome back' : m==='register' ? 'Create account' : 'Reset password'
      }</h2>
      <p style="font-size:13px;color:rgba(100,65,10,0.75);">${
        m==='login' ? 'Sign in to your account' : m==='register' ? 'Enter your details below' : 'Enter your email to receive a reset link'
      }</p>
    </div>
    ${m==='register' ? `<div style="margin-bottom:14px;"><label style="${labelStyle}">Full Name</label><input id="auth-name" style="${inputStyle}" placeholder="Your name"></div>` : ''}
    <div style="margin-bottom:14px;"><label style="${labelStyle}">Email</label><input id="auth-email" type="email" style="${inputStyle}" placeholder="you@example.com"></div>
    ${m !== 'forgot' ? `<div style="margin-bottom:14px;"><label style="${labelStyle}">Password</label><input id="auth-password" type="password" style="${inputStyle}" placeholder="••••••••"></div>` : ''}
    ${m==='register' ? `<div style="margin-bottom:14px;"><label style="${labelStyle}">Confirm Password</label><input id="auth-confirm" type="password" style="${inputStyle}" placeholder="••••••••"></div>` : ''}
    <div id="auth-error" style="display:none;color:#C0392B;font-size:13px;margin-bottom:10px;padding:8px 12px;background:rgba(255,220,215,0.7);border-radius:8px;"></div>
    <div id="auth-ok" style="display:none;color:#0F6E3A;font-size:13px;margin-bottom:10px;padding:8px 12px;background:rgba(210,250,225,0.7);border-radius:8px;"></div>
    <button onclick="handleAuth()" style="${btnStyle('primary')};width:100%;justify-content:center;padding:13px;font-size:14px;margin-bottom:14px;">
      ${m==='login' ? 'Sign In' : m==='register' ? 'Create Account' : 'Send Reset Link'}
    </button>
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      ${m==='login' ? `<button onclick="setAuthMode('forgot')" style="background:none;border:none;cursor:pointer;font-size:12px;color:#D4820A;font-family:'Georgia',serif;">Forgot password?</button>` : ''}
      ${m==='forgot' ? `<button onclick="setAuthMode('login')" style="background:none;border:none;cursor:pointer;font-size:12px;color:#A08060;font-family:'Georgia',serif;">← Back to Sign In</button>` : ''}
    </div>
    ${m==='login' ? `
    <p style="font-size:11px;color:rgba(100,65,10,0.7);text-align:center;margin-top:16px;line-height:1.9;border-top:1px solid rgba(200,155,80,0.35);padding-top:14px;">
      <strong>alex@example.com</strong> (Elite) · <strong>sarah@example.com</strong> (Trader)<br>
      <strong>jordan@example.com</strong> (No Plan) · <strong>sam@example.com</strong> (Cancelled)<br>
      <strong>admin@signalstack.com</strong> (Admin)<br>
      Passwords: <strong>pass123</strong> / Admin: <strong>admin123</strong>
    </p>` : ''}
  </div>
</div>`;
}

function setAuthMode(m) {
  STATE.authMode = m;
  render();
}

function attachAuthEvents() {
  const inputs = ['auth-name','auth-email','auth-password','auth-confirm'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAuth(); });
  });
}

async function handleAuth() {
  const m = STATE.authMode;
  const errEl = document.getElementById('auth-error');
  const okEl  = document.getElementById('auth-ok');
  if (errEl) errEl.style.display = 'none';
  if (okEl)  okEl.style.display = 'none';

  const email    = document.getElementById('auth-email')?.value?.trim();
  const password = document.getElementById('auth-password')?.value;
  const name     = document.getElementById('auth-name')?.value?.trim();
  const confirm  = document.getElementById('auth-confirm')?.value;

  const showErr = (msg) => { if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; } };
  const showOk  = (msg) => { if (okEl)  { okEl.textContent = msg; okEl.style.display = 'block'; } };

  try {
    if (m === 'login') {
      if (!email || !password) { showErr('Email and password required.'); return; }
      const { token, user } = await API.post('/api/auth/login', { email, password });
      API.token = token;
      localStorage.setItem('ss_token', token);
      STATE.currentUser = user;
      STATE.tab = 'dashboard';
      STATE.adminTab = 'dashboard';
      await loadData();
      render();
    } else if (m === 'register') {
      if (!name || !email || !password) { showErr('All fields required.'); return; }
      if (password !== confirm) { showErr('Passwords do not match.'); return; }
      if (password.length < 6)  { showErr('Minimum 6 characters.'); return; }
      const { token, user } = await API.post('/api/auth/register', { name, email, password });
      API.token = token;
      localStorage.setItem('ss_token', token);
      STATE.currentUser = user;
      STATE.tab = 'dashboard';
      await loadData();
      render();
    } else {
      // forgot — simulate
      if (!email) { showErr('Email required.'); return; }
      showOk(`Password reset link sent to ${email}. Check your inbox.`);
    }
  } catch (e) {
    showErr(e.message || 'Something went wrong.');
  }
}

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
async function handleLogout() {
  try { await API.post('/api/auth/logout'); } catch {}
  API.token = null;
  localStorage.removeItem('ss_token');
  STATE.currentUser = null;
  STATE.authMode = 'login';
  STATE.tab = 'dashboard';
  render();
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIBER APP
// ─────────────────────────────────────────────────────────────────────────────
function getUnreadAlerts() {
  const u = STATE.currentUser;
  if (!u || u.role !== 'subscriber' || !u.tier || !isActive(u)) return [];
  const seen = new Set(u.seenAlertIds || []);
  return STATE.alerts.filter(a =>
    !seen.has(a.id) && canSeeAlert(u.tier, a.tier) && a.status === 'active'
  );
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
  const u = STATE.currentUser;
  const tab = STATE.tab;
  const tier = u.tier ? TIERS[u.tier] : null;
  const unread = getUnreadAlerts();
  const locked = isLocked(u);
  const unsub = isUnsubscribed(u);
  const cancelled = isCancelled(u);

  const navTabs = [
    ['dashboard','Dashboard'],['alerts','Alerts'],['timeline','Timeline'],['account','Account']
  ];

  return `
<div style="font-family:'Georgia','Times New Roman',serif;background:linear-gradient(135deg,#B8935A 0%,#C9A87C 50%,#A07840 100%);min-height:100vh;color:#1A0E00;">
  <!-- NAV -->
  <nav style="background:rgba(240,220,185,0.72);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(200,160,90,0.35);padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:64px;position:sticky;top:0;z-index:100;box-shadow:0 2px 16px rgba(100,60,10,0.15);">
    <div style="font-size:19px;font-weight:700;color:#2A1400;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px;">
      <div style="width:32px;height:32px;border-radius:8px;background:#D4820A;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:900;">▲</div>
      SignalStack
    </div>
    <div style="display:flex;gap:3px;" class="nav-links">
      ${navTabs.map(([k,l]) => `<button onclick="setTab('${k}')" style="padding:7px 15px;border-radius:8px;cursor:pointer;font-size:13px;font-family:'Georgia',serif;background:${tab===k?'rgba(40,20,0,0.82)':'transparent'};backdrop-filter:${tab===k?'blur(8px)':'none'};color:${tab===k?'#FFEEC8':'rgba(80,45,5,0.85)'};border:none;font-weight:${tab===k?600:400};transition:all 0.15s;">${l}</button>`).join('')}
    </div>
    <div style="display:flex;gap:10px;align-items:center;">
      <div style="font-size:12px;text-align:right;">
        <div style="font-weight:700;color:#1A1108;">${u.name}</div>
        <div style="color:${cancelled?'#C0392B':unsub?'#A08060':tier?.color||C.accent};font-weight:600;font-size:11px;">
          ${tier ? tier.label : 'No Plan'}${cancelled?' · Cancelled':unsub?' · Unsubscribed':''}
        </div>
      </div>
      <!-- Bell -->
      <div style="position:relative;">
        <button onclick="toggleNotifs()" style="background:none;border:none;cursor:pointer;padding:6px;position:relative;display:flex;align-items:center;justify-content:center;" title="Notifications">
          <span style="font-size:20px;line-height:1;">🔔</span>
          ${unread.length > 0 ? `<span class="badge-bounce" style="position:absolute;top:2px;right:2px;width:16px;height:16px;border-radius:50%;background:#D4820A;color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,230,170,0.6);">${unread.length > 9 ? '9+' : unread.length}</span>` : ''}
        </button>
        <div id="notif-panel" style="display:none;position:absolute;right:0;top:calc(100% + 8px);width:340px;background:rgba(255,245,215,0.92);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(220,175,90,0.5);border-radius:16px;box-shadow:0 12px 40px rgba(100,55,0,0.25);z-index:300;overflow:hidden;" class="notif-dropdown">
          <div style="padding:14px 18px 10px;border-bottom:1px solid rgba(200,155,80,0.35);display:flex;justify-content:space-between;align-items:center;">
            <div style="font-weight:700;font-size:14px;color:#1A1108;">${unread.length > 0 ? `${unread.length} New Alert${unread.length>1?'s':''}` : 'Notifications'}</div>
            ${unread.length > 0 ? `<button onclick="markAllSeen()" style="background:none;border:none;cursor:pointer;font-size:11px;color:#D4820A;font-weight:600;font-family:'Georgia',serif;">Mark all read</button>` : ''}
          </div>
          <div style="max-height:320px;overflow-y:auto;">
            ${unread.length === 0 ? `<div style="padding:24px 18px;text-align:center;color:#A08060;font-size:13px;"><div style="font-size:28px;margin-bottom:8px;">✓</div>You're all caught up!</div>` :
              unread.map(a => `
              <div onclick="openAlertModal(${a.id})" style="padding:12px 18px;border-bottom:1px solid rgba(200,155,80,0.25);cursor:pointer;background:rgba(255,240,200,0.35);display:flex;gap:12px;align-items:flex-start;">
                <div style="width:8px;height:8px;border-radius:50%;background:#D4820A;margin-top:5px;flex-shrink:0;"></div>
                <div style="flex:1;">
                  <div style="font-weight:700;font-size:13px;color:#1A1108;margin-bottom:2px;">🆕 ${a.ticker} — ${a.title.replace(a.ticker+' ','').slice(0,30)}</div>
                  <div style="font-size:11px;color:#A08060;">Entry $${a.entry} · Target $${a.t1} · ${a.tier} tier</div>
                  <div style="font-size:10px;color:#C0A878;margin-top:2px;">${fmtDate(a.created)}</div>
                </div>
                <span style="${badgeStyle(priorityColor(a.priority), C.chipBg)}font-size:9px;">${a.priority}</span>
              </div>`).join('')
            }
          </div>
          ${unread.length > 0 ? `<div style="padding:10px 18px;border-top:1px solid rgba(200,155,80,0.35);"><button onclick="markAllSeen();setTab('alerts')" style="${btnStyle('primary')}width:100%;justify-content:center;font-size:12px;padding:8px;">View All Alerts →</button></div>` : ''}
        </div>
      </div>
      <div style="width:34px;height:34px;border-radius:10px;background:#D4820A;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;">${u.name.charAt(0).toUpperCase()}</div>
      <button onclick="handleLogout()" style="${btnStyle('ghost')}font-size:12px;padding:6px 12px;">Sign Out</button>
    </div>
  </nav>
  <!-- Notif overlay -->
  <div id="notif-overlay" onclick="closeNotifs()" style="display:none;position:fixed;inset:0;z-index:299;"></div>

  <!-- CONTENT -->
  <div style="max-width:1200px;margin:0 auto;padding:32px 24px;" class="page-content">
    ${tab === 'dashboard'  ? renderSubscriberDashboard() : ''}
    ${tab === 'alerts'     ? renderSubscriberAlerts()    : ''}
    ${tab === 'timeline'   ? renderSubscriberTimeline()  : ''}
    ${tab === 'account'    ? renderAccountTab()          : ''}
  </div>

  <!-- Alert Modal -->
  <div id="alert-modal-overlay" style="display:none;" class="modal-overlay" onclick="closeAlertModal()">
    <div id="alert-modal-content" onclick="event.stopPropagation()"></div>
  </div>
  <!-- Generic Modal -->
  <div id="generic-modal-overlay" style="display:none;" class="modal-overlay" onclick="closeGenericModal()">
    <div id="generic-modal-content" onclick="event.stopPropagation()"></div>
  </div>
</div>`;
}

function setTab(t) {
  STATE.tab = t;
  render();
}

function toggleNotifs() {
  const p = document.getElementById('notif-panel');
  const o = document.getElementById('notif-overlay');
  if (!p) return;
  const isOpen = p.style.display !== 'none';
  p.style.display = isOpen ? 'none' : 'block';
  if (o) o.style.display = isOpen ? 'none' : 'block';
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
  const u = STATE.currentUser;
  const tier = u.tier ? TIERS[u.tier] : null;
  const locked = isLocked(u);
  const unsub = isUnsubscribed(u);
  const cancelled = isCancelled(u);
  const visible = getVisibleAlerts();
  const active  = visible.filter(a => a.status === 'active');
  const closed  = visible.filter(a => a.status === 'closed');
  const stopped = visible.filter(a => a.status === 'stopped');
  const winRate = closed.length ? Math.round(closed.filter(a => a.pnl?.startsWith('+')).length / closed.length * 100) : 0;
  const allDays = [...closed, ...stopped].map(a => daysToClose(a.buyDate, a.closeDate)).filter(Boolean);
  const avgDays = allDays.length ? Math.round(allDays.reduce((a,b) => a+b, 0) / allDays.length) : null;

  return `
<div class="fade-in">
  <div style="margin-bottom:24px;">
    <h1 style="font-size:27px;font-weight:700;color:#2A1400;letter-spacing:-0.8px;margin-bottom:4px;">${getGreeting(u.name.split(' ')[0])}</h1>
    <p style="font-size:13px;color:rgba(100,65,10,0.75);">${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
  </div>

  ${unsub ? renderUnsubscribedBanner() : ''}
  ${cancelled && !unsub ? renderCancelledBanner() : ''}

  <!-- Stats -->
  <div style="display:flex;gap:14px;margin-bottom:20px;flex-wrap:wrap;">
    ${[
      ['Open Trades', locked ? '—' : active.length, locked ? 'subscribe to unlock' : 'currently active', C.activeText],
      ['Closed Trades', closed.length + stopped.length, '2026 total', '#157A4A'],
      ['Win Rate', `${winRate}%`, `${closed.filter(a=>a.pnl?.startsWith('+')).length} of ${closed.length} wins`, C.accent],
      ['Avg Days Close', avgDays ? `${avgDays}d` : '—', 'closed trades', '#7A6040'],
    ].map(([l,v,s,c]) => `
    <div class="stat-card">
      <div style="font-size:10px;letter-spacing:0.09em;color:rgba(100,60,0,0.7);text-transform:uppercase;margin-bottom:4px;">${l}</div>
      <div style="font-size:26px;font-weight:700;color:${c};letter-spacing:-1px;">${v}</div>
      <div style="font-size:11px;color:rgba(100,60,0,0.6);margin-top:3px;">${s}</div>
    </div>`).join('')}
  </div>

  <!-- 2-col grid -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;" class="grid-2">
    <!-- Open Positions -->
    <div style="${cardStyle}">
      <h3 style="font-size:15px;font-weight:600;color:#2A1400;margin-bottom:14px;">Open Positions</h3>
      ${locked ? `
      <div style="text-align:center;padding:28px 0;">
        <div style="font-size:32px;margin-bottom:10px;opacity:0.7;">🔒</div>
        <p style="color:rgba(100,55,0,0.7);font-size:12px;margin-bottom:14px;line-height:1.5;">
          ${unsub ? 'Subscribe to view alerts' : 'Reactivate your subscription to view open positions'}
        </p>
        <button onclick="setTab('account')" style="${btnStyle('primary')}font-size:12px;padding:8px 18px;">
          ${unsub ? 'Subscribe Now →' : 'Reactivate →'}
        </button>
      </div>` :
      active.length === 0 ? `<p style="font-size:13px;color:rgba(100,65,10,0.75);">No active trades in your tier</p>` :
      active.map(a => renderOpenPositionCard(a)).join('')}
    </div>
    <!-- Recent Closed -->
    <div style="${cardStyle}">
      <h3 style="font-size:15px;font-weight:600;color:#2A1400;margin-bottom:14px;">Recent Closed</h3>
      ${[...closed,...stopped].length === 0 ? `<p style="font-size:13px;color:rgba(100,65,10,0.75);">No closed trades yet</p>` :
        [...closed,...stopped].map(a => `
        <div onclick="openAlertModal(${a.id})" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(200,155,80,0.3);cursor:pointer;">
          <div style="display:flex;gap:8px;align-items:center;">
            <div>
              <div style="font-weight:600;font-size:14px;">${a.ticker}</div>
              <div style="display:flex;gap:4px;align-items:center;margin-top:2px;">
                <span style="${badgeStyle(statusColor(a.status), statusBg(a.status))}font-size:9px;">${a.status==='stopped'?'STOP LOSS':'CLOSED'}</span>
                ${daysToClose(a.buyDate,a.closeDate) ? `<span style="font-size:10px;color:#A08060;">${daysToClose(a.buyDate,a.closeDate)}d</span>` : ''}
              </div>
            </div>
          </div>
          <div style="font-size:13px;font-weight:700;color:${a.pnl?.startsWith('+')?'#157A4A':'#C0392B'};">${a.pnl}</div>
        </div>`).join('')
      }
    </div>
  </div>

  <!-- Gantt -->
  <div style="${cardStyle}">
    <h3 style="font-size:15px;font-weight:600;color:#2A1400;margin-bottom:4px;">Trade Timeline — 2026</h3>
    <p style="font-size:12px;color:rgba(100,65,10,0.75);margin-bottom:16px;">${locked ? 'Closed & stopped trades only' : `${tier?.label} tier · open trades capped to today`}</p>
    ${renderGantt(visible)}
  </div>
</div>`;
}

function renderOpenPositionCard(a) {
  const days = daysToClose(a.buyDate, null);
  return `
<div onclick="openAlertModal(${a.id})" class="pos-card" style="cursor:pointer;margin-bottom:10px;background:rgba(255,248,225,0.45);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(220,175,90,0.4);border-radius:14px;padding:12px 14px;box-shadow:0 2px 12px rgba(120,70,0,0.1);">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="font-weight:800;font-size:15px;color:#2A1400;letter-spacing:-0.3px;">${a.ticker}</span>
      <span style="${badgeStyle(TIERS[a.tier]?.color||'#8B7355','rgba(255,225,160,0.5)')}font-size:9px;">${TIERS[a.tier]?.label||a.tier}</span>
    </div>
    <span style="font-size:10px;color:rgba(120,70,0,0.6);font-weight:500;">${days}d open · ${fmtDate(a.buyDate)}</span>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">
    <div style="background:linear-gradient(135deg,#D4820A 0%,#B56D00 100%);border-radius:10px;padding:8px 6px;text-align:center;">
      <div style="font-size:8px;color:rgba(255,255,255,0.7);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;">Entry</div>
      <div style="font-size:15px;font-weight:800;color:#fff;letter-spacing:-0.5px;">$${a.entry}</div>
    </div>
    <div style="background:rgba(20,140,80,0.15);backdrop-filter:blur(6px);border:1px solid rgba(20,140,80,0.3);border-radius:10px;padding:8px 6px;text-align:center;">
      <div style="font-size:8px;color:#0F6E3A;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;">Target</div>
      <div style="font-size:15px;font-weight:800;color:#0F6E3A;letter-spacing:-0.5px;">$${a.t1}</div>
    </div>
    <div style="background:rgba(192,57,43,0.12);backdrop-filter:blur(6px);border:1px solid rgba(192,57,43,0.3);border-radius:10px;padding:8px 6px;text-align:center;">
      <div style="font-size:8px;color:#B02020;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;">Stop</div>
      <div style="font-size:15px;font-weight:800;color:#B02020;letter-spacing:-0.5px;">$${a.sl}</div>
    </div>
  </div>
</div>`;
}

function renderCancelledBanner() {
  return `<div style="${glass}border-radius:14px;padding:18px 22px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;border-left:3px solid rgba(192,57,43,0.7);">
    <div>
      <div style="font-size:15px;font-weight:700;color:#2A1400;margin-bottom:3px;">🔒 Subscription Cancelled</div>
      <p style="font-size:12px;color:rgba(100,55,0,0.75);margin:0;">Reactivate your plan to view live alerts and open positions.</p>
    </div>
    <button onclick="setTab('account')" style="${btnStyle('primary')}">Reactivate Now →</button>
  </div>`;
}

function renderUnsubscribedBanner() {
  return `<div style="${glass}border-radius:14px;padding:18px 22px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;border-left:3px solid #D4820A;">
    <div>
      <div style="font-size:15px;font-weight:700;color:#2A1400;margin-bottom:3px;">✨ Subscribe to View Alerts</div>
      <p style="font-size:12px;color:rgba(100,55,0,0.75);margin:0;">You're viewing closed trade history only. Choose a plan to access live alerts and real-time signals.</p>
    </div>
    <button onclick="setTab('account')" style="${btnStyle('primary')}">Choose a Plan →</button>
  </div>`;
}

// ─── Alerts Tab ───────────────────────────────────────────────────────────────
let alertFilter = 'all';
let alertSearch = '';

function renderSubscriberAlerts() {
  const u = STATE.currentUser;
  const tier = u.tier ? TIERS[u.tier] : null;
  const locked = isLocked(u);
  const unsub = isUnsubscribed(u);
  const cancelled = isCancelled(u);
  const visible = getVisibleAlerts();
  const unread = getUnreadAlerts();

  const filtered = visible.filter(a => {
    if (alertFilter === 'active'    && a.status !== 'active')  return false;
    if (alertFilter === 'closed'    && a.status !== 'closed')  return false;
    if (alertFilter === 'stopped'   && a.status !== 'stopped') return false;
    if (alertFilter === 'watchlist' && !u.watchlist?.includes(a.id)) return false;
    if (alertSearch && !a.ticker.toLowerCase().includes(alertSearch.toLowerCase()) &&
        !a.title.toLowerCase().includes(alertSearch.toLowerCase())) return false;
    return true;
  });

  return `
<div class="fade-in">
  <div style="margin-bottom:20px;">
    <h1 style="font-size:27px;font-weight:700;color:#2A1400;letter-spacing:-0.8px;margin-bottom:4px;">Trade Alerts</h1>
    <p style="font-size:13px;color:rgba(100,65,10,0.75);">${locked ? 'Browse closed trades · Subscribe to unlock live alerts' : `● ${tier?.label} plan · Live feed`}</p>
  </div>
  ${unsub ? renderUnsubscribedBanner() : ''}
  ${cancelled && !unsub ? renderCancelledBanner() : ''}
  <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
    <input id="alert-search" oninput="updateSearch(this.value)" style="${inputStyle}max-width:260px;flex:0 0 auto;" placeholder="Search..." value="${alertSearch}">
    <div style="display:flex;gap:4px;flex-wrap:wrap;">
      ${[['all','All'],['active','Active'],['stopped','Stopped'],['closed','Closed'],['watchlist','Liked']].map(([k,l]) =>
        `<button onclick="setAlertFilter('${k}')" style="padding:7px 15px;border-radius:8px;cursor:pointer;font-size:13px;font-family:'Georgia',serif;background:${alertFilter===k?'rgba(40,20,0,0.82)':'transparent'};color:${alertFilter===k?'#FFEEC8':'rgba(80,45,5,0.85)'};border:none;font-weight:${alertFilter===k?600:400};transition:all 0.15s;">${l}</button>`
      ).join('')}
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;" class="grid-2">
    ${locked ? STATE.alerts.filter(a=>a.status==='active').slice(0,2).map(a => `
    <div style="${glass}border-radius:18px;padding:18px;cursor:default;background:rgba(255,230,160,0.25);border:1px dashed #D4820A;min-height:160px;display:flex;align-items:center;justify-content:center;">
      <div style="text-align:center;padding:28px 16px;">
        <div style="font-size:34px;margin-bottom:10px;opacity:0.6;">🔒</div>
        <div style="font-size:12px;font-weight:600;color:#D4820A;margin-bottom:4px;">Active Alert</div>
        <div style="font-size:11px;color:#8A6840;margin-bottom:14px;">${unsub ? 'Subscribe to unlock' : 'Reactivate to unlock'}</div>
        <button onclick="setTab('account')" style="${btnStyle('primary')}font-size:11px;padding:6px 14px;">${unsub ? 'Choose Plan' : 'Reactivate'}</button>
      </div>
    </div>`).join('') : ''}
    ${!locked && u.tier === 'trader' ? `
    <div style="${glass}border-radius:18px;padding:18px;cursor:default;background:rgba(255,230,160,0.25);border:1px dashed #D4820A;min-height:160px;display:flex;align-items:center;justify-content:center;">
      <div style="text-align:center;padding:24px 16px;">
        <div style="font-size:34px;margin-bottom:10px;opacity:0.6;">🔒</div>
        <div style="font-size:12px;font-weight:600;color:#D4820A;margin-bottom:4px;">Elite Alert</div>
        <div style="font-size:11px;color:#8A6840;margin-bottom:14px;">Upgrade to Elite to unlock</div>
        <button onclick="setTab('account')" style="${btnStyle('primary')}font-size:11px;padding:6px 14px;">Upgrade →</button>
      </div>
    </div>` : ''}
    ${filtered.map(a => renderAlertCard(a, unread.some(u => u.id === a.id))).join('')}
    ${filtered.length === 0 && !locked ? `<div style="grid-column:1/-1;text-align:center;padding:50px;color:#A08060;font-size:14px;">No alerts match your filters.</div>` : ''}
  </div>
</div>`;
}

function setAlertFilter(f) {
  alertFilter = f;
  render();
}

function updateSearch(val) {
  alertSearch = val;
  // debounce re-render
  clearTimeout(window._searchTimer);
  window._searchTimer = setTimeout(() => render(), 200);
}

function renderAlertCard(a, isNew) {
  const u = STATE.currentUser;
  const saved = u.watchlist?.includes(a.id);
  const days = daysToClose(a.buyDate, a.closeDate);
  return `
<div class="alert-card" onclick="openAlertModal(${a.id})" style="${glass}border-radius:18px;padding:18px;cursor:pointer;transition:all 0.2s;border-left:3px solid ${statusColor(a.status)};position:relative;">
  ${isNew ? `<div class="pulse-dot" style="position:absolute;top:14px;right:14px;width:8px;height:8px;border-radius:50%;background:#D4820A;box-shadow:0 0 0 3px rgba(255,245,215,0.8);" title="New alert"></div>` : ''}
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
    <div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
        <span style="font-weight:800;font-size:17px;color:#1A1108;letter-spacing:-0.3px;">${a.ticker}</span>
        <span style="${badgeStyle(TIERS[a.tier]?.color||'#8B7355', TIERS[a.tier]?.bg||'#F5EFE6')}">${TIERS[a.tier]?.label||a.tier}</span>
      </div>
      <div style="font-size:12px;color:#A08060;">${a.category}</div>
    </div>
    <div style="display:flex;gap:6px;align-items:center;">
      <span style="${badgeStyle(statusColor(a.status), statusBg(a.status))}">${a.status}</span>
      <span style="${badgeStyle(priorityColor(a.priority), C.chipBg)}">${a.priority}</span>
      <button onclick="event.stopPropagation();toggleWatchlist(${a.id})" title="${saved?'Unlike':'Like'}" style="background:none;border:none;cursor:pointer;font-size:18px;line-height:1;padding:2px 4px;color:${saved?'#E8920A':'#C4A882'};transition:color 0.15s;">
        ${saved ? '♥' : '♡'}
      </button>
    </div>
  </div>
  <div style="font-size:14px;font-weight:600;margin-bottom:4px;color:#1A1108;">${a.title}</div>
  <div style="font-size:12px;color:#7A6040;margin-bottom:12px;line-height:1.55;">${a.description}</div>
  <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
    <div style="background:rgba(255,225,170,0.65);border:1px solid rgba(200,155,80,0.4);border-radius:8px;padding:5px 10px;font-size:11px;">
      <span style="color:#A08060;font-weight:600;">ENTRY DATE </span>
      <span style="color:#1A1108;font-weight:700;">${fmtDate(a.buyDate)}</span>
    </div>
    ${days !== null ? `<div style="background:${a.status==='active'?C.activeBg:a.pnl?.startsWith('+')?'#EDFAF3':C.stoppedBg};border:1px solid rgba(200,155,80,0.4);border-radius:8px;padding:5px 10px;font-size:11px;">
      <span style="color:#A08060;font-weight:600;">DAYS ${a.status==='active'?'OPEN':'TO CLOSE'} </span>
      <span style="font-weight:700;color:${a.status==='active'?C.activeText:a.pnl?.startsWith('+')?'#157A4A':C.stoppedText};">${days}d</span>
    </div>` : ''}
  </div>
  <div style="display:flex;gap:8px;margin-bottom:10px;">
    ${[['Entry',a.entry,'#1A1108'],['Target',a.t1,'#157A4A'],['Stop Loss',a.sl,'#C0392B']].map(([l,v,cl]) => `
    <div style="background:rgba(255,248,230,0.6);backdrop-filter:blur(8px);border-radius:10px;padding:8px 10px;flex:1;text-align:center;border:1px solid rgba(220,180,110,0.4);">
      <div style="font-size:9px;color:#A08060;font-weight:700;text-transform:uppercase;">${l}</div>
      <div style="font-size:14px;font-weight:700;color:${cl};">$${v}</div>
    </div>`).join('')}
  </div>
  <div style="display:flex;justify-content:flex-end;">
    <span style="font-size:14px;font-weight:700;color:${a.pnl?.startsWith('+')?'#2D7A4F':'#C0392B'};">${a.pnl}</span>
  </div>
</div>`;
}

async function toggleWatchlist(id) {
  const u = STATE.currentUser;
  const wl = u.watchlist?.includes(id)
    ? u.watchlist.filter(x => x !== id)
    : [...(u.watchlist || []), id];
  try {
    const { user } = await API.put(`/api/users/${u.id}`, { watchlist: wl });
    STATE.currentUser = user;
    render();
  } catch (e) { console.error(e); }
}

// ─── Timeline Tab ─────────────────────────────────────────────────────────────
function renderSubscriberTimeline() {
  const u = STATE.currentUser;
  const tier = u.tier ? TIERS[u.tier] : null;
  const locked = isLocked(u);
  const unsub = isUnsubscribed(u);
  const visible = getVisibleAlerts();

  return `
<div class="fade-in">
  <h1 style="font-size:27px;font-weight:700;color:#2A1400;letter-spacing:-0.8px;margin-bottom:4px;">Trade Timeline — 2026</h1>
  <p style="font-size:12px;color:rgba(100,65,10,0.75);margin-bottom:${locked?'8px':'16px'};">
    ${locked ? 'Closed & stopped trades only · Subscribe to see open positions' : `${tier?.label} tier · open trades capped at today`}
  </p>
  ${locked ? `<div style="background:rgba(255,240,200,0.5);border:1px solid rgba(200,155,80,0.4);border-radius:10px;padding:10px 16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;gap:12px;">
    <span style="font-size:12px;color:#7A6040;">🔒 Active trades are hidden until you subscribe.</span>
    <button onclick="setTab('account')" style="${btnStyle('primary')}font-size:11px;padding:5px 12px;">${unsub ? 'Choose Plan →' : 'Reactivate →'}</button>
  </div>` : ''}
  <div style="${cardStyle}">${renderGantt(visible)}</div>
</div>`;
}

// ─── Gantt Chart ──────────────────────────────────────────────────────────────
function renderGantt(alerts) {
  if (!alerts.length) return `<p style="font-size:13px;color:rgba(100,65,10,0.75);text-align:center;padding:32px 0;">No trades to display</p>`;

  const barColor = (a) => a.status === 'active' ? '#4A90D9' : a.status === 'closed' ? '#2D7A4F' : '#C0392B';

  return `
<div style="overflow-x:auto;">
  <div style="min-width:700px;">
    <div style="display:grid;grid-template-columns:80px repeat(12,1fr);margin-bottom:8px;">
      <div></div>
      ${MONTHS.map((m, i) => `<div style="font-size:10px;color:${i===TODAY_MONTH?'#D4820A':'#A08060'};text-align:center;font-weight:${i===TODAY_MONTH?700:500};position:relative;">
        ${m}${i===TODAY_MONTH?`<div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:#D4820A;"></div>`:''}
      </div>`).join('')}
    </div>
    ${alerts.map(a => {
      const buyM  = getMonthIdx(a.buyDate) ?? 0;
      const rawEndM = a.status === 'active' ? TODAY_MONTH : (a.closeDate ? getMonthIdx(a.closeDate) : TODAY_MONTH);
      const endM  = Math.min(rawEndM, TODAY_MONTH);
      const left  = (buyM / 12) * 100;
      const width = Math.max(((endM - buyM + 1) / 12) * 100, 2);
      const days  = daysToClose(a.buyDate, a.closeDate);
      return `
<div style="display:grid;grid-template-columns:80px 1fr;margin-bottom:12px;align-items:center;">
  <div style="font-size:11px;font-weight:700;color:#1A1108;">${a.ticker}</div>
  <div style="position:relative;height:22px;background:rgba(200,155,70,0.25);border-radius:20px;">
    <div class="gantt-bar" style="position:absolute;left:${left}%;width:${width}%;height:100%;background:${barColor(a)};border-radius:20px;opacity:0.85;min-width:20px;display:flex;align-items:center;padding-left:8px;gap:6px;">
      <span style="font-size:10px;color:#fff;font-weight:700;white-space:nowrap;">$${a.entry}</span>
      ${a.status !== 'active' && days ? `<span style="font-size:9px;color:rgba(255,255,255,0.8);white-space:nowrap;">${days}d</span>` : ''}
    </div>
    <div style="position:absolute;left:${(TODAY_MONTH/12)*100+4}%;top:0;height:100%;width:2px;background:#D4820A;opacity:0.7;border-radius:1px;"></div>
  </div>
</div>`;
    }).join('')}
    <div style="display:flex;gap:16px;margin-top:14px;flex-wrap:wrap;align-items:center;">
      ${[['#4A90D9','Active (open)'],['#2D7A4F','Profitable'],['#C0392B','Stop Loss']].map(([c,l]) =>
        `<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#8A6840;">
          <div style="width:20px;height:7px;background:${c};border-radius:4px;"></div>${l}
        </div>`).join('')}
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#D4820A;">
        <div style="width:2px;height:14px;background:#D4820A;border-radius:1px;"></div>Today
      </div>
    </div>
  </div>
</div>`;
}

// ─── Account Tab ──────────────────────────────────────────────────────────────
function renderAccountTab() {
  const u = STATE.currentUser;
  const tier = u.tier ? TIERS[u.tier] : null;
  const cancelled = isCancelled(u);
  const unsub = isUnsubscribed(u);

  return `
<div class="fade-in">
  <h1 style="font-size:27px;font-weight:700;color:#2A1400;letter-spacing:-0.8px;margin-bottom:24px;">Account & Subscription</h1>

  <!-- Profile card -->
  <div style="${cardStyle}margin-bottom:20px;" id="profile-card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
      <div style="display:flex;gap:16px;align-items:center;">
        <div style="width:56px;height:56px;border-radius:16px;background:#D4820A;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;">${u.name.charAt(0).toUpperCase()}</div>
        <div>
          <div style="font-weight:700;font-size:18px;">${u.name}</div>
          <div style="color:#8A6840;font-size:13px;">${u.email}</div>
          <div style="color:#A08060;font-size:11px;margin-top:2px;">Member since ${u.joined}</div>
          <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
            ${tier ? `<span style="${badgeStyle(tier.color, tier.bg)}">${tier.label}</span>` : `<span style="${badgeStyle('#A08060','rgba(255,225,160,0.4)')}">No Plan</span>`}
            <span style="${badgeStyle(cancelled?'#C0392B':unsub?'#A08060':'#157A4A',cancelled?'#FFF0EE':unsub?'rgba(255,225,160,0.4)':'#EDFAF3')}">
              ${cancelled ? 'Cancelled' : unsub ? 'Unsubscribed' : 'Active'}
            </span>
          </div>
          <div id="profile-feedback" style="font-size:12px;margin-top:6px;font-weight:600;color:#157A4A;"></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-direction:column;" id="profile-actions">
        <button onclick="showEditPanel('name')" style="${btnStyle('secondary')}">✏️ Change Name</button>
        <button onclick="showEditPanel('password')" style="${btnStyle('secondary')}">🔑 Change Password</button>
      </div>
    </div>
    <div id="edit-panel"></div>
  </div>

  <!-- Subscription status -->
  <div style="${cardStyle}margin-bottom:20px;border-left:4px solid ${cancelled?'#C0392B':unsub?'#D4820A':tier?.color||'#D4820A'};">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
      <div>
        <div style="font-size:10px;letter-spacing:0.08em;color:#A08060;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Subscription</div>
        ${unsub ? `
          <div style="font-size:20px;font-weight:800;">No Active Plan</div>
          <div style="font-size:12px;color:#7A6040;margin-top:4px;">Subscribe to unlock live alerts and real-time signals.</div>
        ` : `
          <div style="font-size:20px;font-weight:800;">${tier?.label} <span style="font-size:14px;font-weight:400;color:#A08060;">· $${tier?.price}/month</span></div>
          <div style="font-size:12px;color:#7A6040;margin-top:4px;">
            ${cancelled ? 'Cancelled — subscribe to a plan to restore full access.' : `Renews automatically · ${tier?.alerts.join(' + ')} tier alerts`}
          </div>
        `}
      </div>
      ${!unsub && !cancelled
        ? `<button onclick="showCancelModal()" style="${btnStyle('ghost')}color:#C0392B!important;border-color:#F5BBA8!important;">Cancel Subscription</button>`
        : ''}
    </div>
  </div>

  <!-- Plan picker — show for unsubscribed OR cancelled OR non-elite -->
  ${(unsub || cancelled || u.tier !== 'elite') ? `
  <h2 style="font-size:19px;font-weight:700;color:#2A1400;margin-bottom:14px;">
    ${unsub || cancelled ? 'Choose a Plan' : 'Upgrade Your Plan'}
  </h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;" class="grid-2">
    ${Object.entries(TIERS).map(([key, t]) => {
      const isCurrent = u.tier === key && !cancelled;
      const canUpgrade = !isCurrent && (unsub || cancelled || TIER_ORDER[key] > TIER_ORDER[u.tier]);
      return `
      <div style="${cardStyle}border:2px solid ${isCurrent?t.color:'rgba(200,155,80,0.4)'};background:${isCurrent?t.bg:'rgba(255,245,215,0.4)'};${isCurrent?'box-shadow:0 0 0 3px rgba(212,130,10,0.2),'+glass:''}">
        ${isCurrent ? `<div style="${badgeStyle(t.color, t.bg)}margin-bottom:10px;">Current Plan</div>` : ''}
        <div style="font-size:17px;font-weight:700;color:${t.color};margin-bottom:4px;">${t.label}</div>
        <div style="font-size:28px;font-weight:800;margin-bottom:4px;">$${t.price}<span style="font-size:12px;font-weight:400;color:#A08060;">/mo</span></div>
        <div style="font-size:12px;color:#7A6040;margin-bottom:8px;">Access to ${t.alerts.join(' + ')} tier alerts</div>
        <ul style="font-size:12px;color:#5A4030;margin-bottom:16px;padding-left:16px;line-height:1.8;">
          ${key === 'trader' ? '<li>All Trader-tier alerts</li><li>Entry, Target & Stop Loss signals</li><li>Real-time notifications</li>' :
                               '<li>All Trader alerts included</li><li>Elite-tier picks</li><li>Priority alerts & early access</li>'}
        </ul>
        ${canUpgrade ? `<button onclick="subscribe('${key}')" style="${btnStyle('primary')}width:100%;justify-content:center;">
          ${unsub || cancelled ? `Subscribe — ${t.label}` : `Upgrade to ${t.label}`}
        </button>` : ''}
      </div>`;
    }).join('')}
  </div>` : ''}
</div>`;
}

function showEditPanel(type) {
  const panel = document.getElementById('edit-panel');
  const actions = document.getElementById('profile-actions');
  if (!panel) return;
  if (actions) actions.style.display = 'none';

  if (type === 'name') {
    panel.innerHTML = `
    <div style="margin-top:20px;padding-top:20px;border-top:1px solid #E2CDB0;">
      <h3 style="font-size:15px;font-weight:600;color:#2A1400;margin-bottom:12px;">Change Display Name</h3>
      <div style="display:flex;gap:8px;max-width:400px;">
        <input id="edit-name" style="${inputStyle}flex:1;" value="${STATE.currentUser.name}" placeholder="Your name">
        <button onclick="saveName()" style="${btnStyle('primary')}">Save</button>
        <button onclick="cancelEditPanel()" style="${btnStyle('ghost')}">Cancel</button>
      </div>
    </div>`;
    setTimeout(() => document.getElementById('edit-name')?.focus(), 50);
  } else {
    panel.innerHTML = `
    <div style="margin-top:20px;padding-top:20px;border-top:1px solid #E2CDB0;">
      <h3 style="font-size:15px;font-weight:600;color:#2A1400;margin-bottom:12px;">Change Password</h3>
      <div style="max-width:400px;">
        ${[['Current Password','edit-pw-current'],['New Password','edit-pw-new'],['Confirm New','edit-pw-confirm']].map(([l,id]) =>
          `<div style="margin-bottom:10px;"><label style="${labelStyle}">${l}</label><input id="${id}" type="password" style="${inputStyle}" placeholder="••••••••"></div>`
        ).join('')}
        <div id="pw-error" style="display:none;color:#C0392B;font-size:12px;margin-bottom:8px;padding:6px 10px;background:#FFF0EE;border-radius:6px;"></div>
        <div style="display:flex;gap:8px;margin-top:4px;">
          <button onclick="savePassword()" style="${btnStyle('primary')}">Update Password</button>
          <button onclick="cancelEditPanel()" style="${btnStyle('ghost')}">Cancel</button>
        </div>
      </div>
    </div>`;
  }
}

function cancelEditPanel() {
  const panel = document.getElementById('edit-panel');
  const actions = document.getElementById('profile-actions');
  if (panel) panel.innerHTML = '';
  if (actions) actions.style.display = '';
}

async function saveName() {
  const val = document.getElementById('edit-name')?.value?.trim();
  if (!val) return;
  try {
    const { user } = await API.put(`/api/users/${STATE.currentUser.id}`, { name: val });
    STATE.currentUser = user;
    const fb = document.getElementById('profile-feedback');
    if (fb) { fb.textContent = '✓ Name updated!'; fb.style.color = '#157A4A'; }
    cancelEditPanel();
    render();
  } catch (e) {
    alert(e.message);
  }
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
  if (newPw.length < 6) { showErr('Minimum 6 characters.'); return; }

  try {
    const { user } = await API.put(`/api/users/${STATE.currentUser.id}`, { password: newPw });
    STATE.currentUser = user;
    cancelEditPanel();
    const fb = document.getElementById('profile-feedback');
    if (fb) { fb.textContent = '✓ Password updated!'; fb.style.color = '#157A4A'; }
    render();
  } catch (e) { showErr(e.message); }
}

async function subscribe(tierKey) {
  try {
    const { user } = await API.put(`/api/users/${STATE.currentUser.id}`, {
      tier: tierKey,
      subscriptionStatus: 'active'
    });
    STATE.currentUser = user;
    render();
  } catch (e) { alert(e.message); }
}

function showCancelModal() {
  const overlay = document.getElementById('generic-modal-overlay');
  const content = document.getElementById('generic-modal-content');
  if (!overlay || !content) return;
  content.innerHTML = `
  <div style="background:rgba(255,245,220,0.92);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:20px;padding:28px;width:100%;max-width:420px;border:1px solid rgba(220,175,100,0.55);box-shadow:0 24px 64px rgba(80,40,0,0.3);">
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-size:44px;margin-bottom:10px;">⚠️</div>
      <h2 style="font-size:19px;font-weight:700;color:#2A1400;margin-bottom:6px;">Cancel Subscription?</h2>
      <p style="font-size:13px;color:#7A6040;line-height:1.6;">You'll immediately lose access to all active alerts. Closed trade history stays. You can choose any plan again anytime.</p>
    </div>
    <div style="background:#FFF0EE;border:1px solid #F5BBA8;border-radius:10px;padding:12px 14px;margin-bottom:20px;">
      <div style="font-size:12px;color:#8B1A1A;font-weight:600;margin-bottom:4px;">You will lose:</div>
      <div style="font-size:12px;color:#8B1A1A;line-height:1.8;">• All active (open) alerts · Future alerts · Live signal feed</div>
    </div>
    <div style="display:flex;gap:10px;">
      <button onclick="closeGenericModal()" style="${btnStyle('secondary')}flex:1;justify-content:center;">Keep My Plan</button>
      <button onclick="confirmCancel()" style="${btnStyle('danger')}flex:1;justify-content:center;">Yes, Cancel</button>
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
  const a = STATE.alerts.find(x => x.id === id);
  if (!a) return;
  const overlay = document.getElementById('alert-modal-overlay');
  const content = document.getElementById('alert-modal-content');
  if (!overlay || !content) return;
  const days = daysToClose(a.buyDate, a.closeDate);

  content.innerHTML = `
  <div style="background:rgba(255,245,220,0.92);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:20px;padding:28px;width:100%;max-width:540px;max-height:90vh;overflow:auto;border:1px solid rgba(220,175,100,0.55);box-shadow:0 24px 64px rgba(80,40,0,0.3);">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="font-weight:800;font-size:22px;color:#1A1108;">${a.ticker}</span>
          <span style="${badgeStyle(TIERS[a.tier]?.color||'#8B7355', TIERS[a.tier]?.bg||'#F5EFE6')}">${a.tier}</span>
        </div>
        <div style="font-size:13px;color:#A08060;">${a.category} · ${a.title}</div>
      </div>
      <button onclick="closeAlertModal()" style="${btnStyle('ghost')}padding:5px 9px;">✕</button>
    </div>
    <p style="font-size:13px;color:#5A4A3A;line-height:1.7;margin-bottom:18px;">${a.description}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;" class="grid-3">
      ${[['Entry',`$${a.entry}`,'#1A1108'],['Target',`$${a.t1}`,'#2D7A4F'],['Stop Loss',`$${a.sl}`,'#C0392B']].map(([l,v,c]) =>
        `<div style="${glass}border-radius:16px;padding:10px 14px;"><div style="font-size:10px;letter-spacing:0.09em;color:rgba(100,60,0,0.7);text-transform:uppercase;margin-bottom:4px;">${l}</div><div style="font-size:17px;font-weight:700;color:${c};">${v}</div></div>`
      ).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:16px;">
      ${[['P&L',a.pnl,a.pnl?.startsWith('+')?'#2D7A4F':'#C0392B'],['Views',(a.views||0).toLocaleString(),'#C17F24'],['Days',days?`${days}d`:'—','#4A90D9'],['Entry Date',fmtDate(a.buyDate),'#8B7355']].map(([l,v,c]) =>
        `<div style="${glass}border-radius:16px;padding:10px 14px;"><div style="font-size:10px;letter-spacing:0.09em;color:rgba(100,60,0,0.7);text-transform:uppercase;margin-bottom:4px;">${l}</div><div style="font-size:14px;font-weight:700;color:${c};">${v}</div></div>`
      ).join('')}
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;">
      <span style="${badgeStyle(statusColor(a.status), statusBg(a.status))}">${a.status}</span>
      <span style="${badgeStyle(priorityColor(a.priority), C.chipBg)}">${a.priority}</span>
      ${a.closeDate ? `<span style="${badgeStyle('#8B7355', C.chipBg)}">Closed ${fmtDate(a.closeDate)}</span>` : ''}
    </div>
  </div>`;
  overlay.style.display = 'flex';
}

function closeAlertModal() {
  const overlay = document.getElementById('alert-modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

function closeGenericModal() {
  const overlay = document.getElementById('generic-modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

function attachSubscriberEvents() {
  // keyboard close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeAlertModal(); closeGenericModal(); closeNotifs(); }
  }, { once: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN APP
// ─────────────────────────────────────────────────────────────────────────────
function renderAdminApp() {
  const u = STATE.currentUser;
  const tab = STATE.adminTab;
  const adminTabs = [['dashboard','Dashboard'],['alerts','Alerts'],['users','Users'],['analytics','Analytics'],['account','My Account']];

  return `
<div style="font-family:'Georgia','Times New Roman',serif;background:linear-gradient(135deg,#B8935A 0%,#C9A87C 50%,#A07840 100%);min-height:100vh;color:#1A0E00;">
  <nav style="background:rgba(240,220,185,0.72);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(200,160,90,0.35);padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:64px;position:sticky;top:0;z-index:100;box-shadow:0 2px 16px rgba(100,60,10,0.15);">
    <div style="font-size:19px;font-weight:700;color:#2A1400;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px;">
      <div style="width:32px;height:32px;border-radius:8px;background:#D4820A;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:900;">▲</div>
      SignalStack
    </div>
    <div style="display:flex;gap:3px;" class="nav-links">
      ${adminTabs.map(([k,l]) => `<button onclick="setAdminTab('${k}')" style="padding:7px 15px;border-radius:8px;cursor:pointer;font-size:13px;font-family:'Georgia',serif;background:${tab===k?'rgba(40,20,0,0.82)':'transparent'};color:${tab===k?'#FFEEC8':'rgba(80,45,5,0.85)'};border:none;font-weight:${tab===k?600:400};transition:all 0.15s;">${l}</button>`).join('')}
    </div>
    <div style="display:flex;gap:10px;align-items:center;">
      <div style="font-size:12px;text-align:right;">
        <div style="font-weight:700;">${u.name}</div>
        <div style="color:#C17F24;font-weight:600;font-size:11px;">Admin</div>
      </div>
      <div style="width:34px;height:34px;border-radius:10px;background:#C17F24;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;">${u.name.charAt(0)}</div>
      <button onclick="handleLogout()" style="${btnStyle('ghost')}font-size:12px;padding:6px 12px;">Sign Out</button>
    </div>
  </nav>
  <div style="max-width:1200px;margin:0 auto;padding:32px 24px;" class="page-content">
    ${tab === 'dashboard' ? renderAdminDashboard() : ''}
    ${tab === 'alerts'    ? renderAdminAlerts()    : ''}
    ${tab === 'users'     ? renderAdminUsers()      : ''}
    ${tab === 'analytics' ? renderAdminAnalytics()  : ''}
    ${tab === 'account'   ? renderAdminAccount()    : ''}
  </div>
  <!-- Alert form modal -->
  <div id="alert-form-overlay" style="display:none;" class="modal-overlay" onclick="closeAlertForm()">
    <div id="alert-form-content" onclick="event.stopPropagation()"></div>
  </div>
  <!-- User form modal -->
  <div id="user-form-overlay" style="display:none;" class="modal-overlay" onclick="closeUserForm()">
    <div id="user-form-content" onclick="event.stopPropagation()"></div>
  </div>
  <!-- Generic modal -->
  <div id="admin-generic-overlay" style="display:none;" class="modal-overlay" onclick="closeAdminGenericModal()">
    <div id="admin-generic-content" onclick="event.stopPropagation()"></div>
  </div>
</div>`;
}

function setAdminTab(t) {
  STATE.adminTab = t;
  render();
}

function getAdminStats() {
  const subs = STATE.allUsers.filter(u => u.role === 'subscriber');
  const traderCount = subs.filter(u => u.tier === 'trader' && u.subscriptionStatus === 'active').length;
  const eliteCount  = subs.filter(u => u.tier === 'elite'  && u.subscriptionStatus === 'active').length;
  const cancelCount = subs.filter(u => u.subscriptionStatus === 'cancelled').length;
  const revenue = traderCount * TIERS.trader.price + eliteCount * TIERS.elite.price;
  const activeAlerts = STATE.alerts.filter(a => a.status === 'active').length;
  const closedAlerts = STATE.alerts.filter(a => a.status === 'closed');
  const closedWins   = closedAlerts.filter(a => a.pnl?.startsWith('+')).length;
  const winRate = closedAlerts.length ? Math.round(closedWins / closedAlerts.length * 100) : 0;
  return { subs, traderCount, eliteCount, cancelCount, revenue, activeAlerts, closedWins, closedTotal: closedAlerts.length, winRate };
}

function renderAdminDashboard() {
  const s = getAdminStats();
  const recentAlerts = STATE.alerts.slice(0, 5);

  return `
<div class="fade-in">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;flex-wrap:wrap;gap:14px;">
    <div>
      <h1 style="font-size:27px;font-weight:700;color:#2A1400;letter-spacing:-0.8px;margin-bottom:4px;">Admin Dashboard</h1>
      <p style="font-size:13px;color:rgba(100,65,10,0.75);">${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
    </div>
    <div style="display:flex;gap:8px;">
      <button onclick="openAlertForm()" style="${btnStyle('primary')}">+ New Alert</button>
      <button onclick="setAdminTab('analytics')" style="${btnStyle('secondary')}">Analytics →</button>
    </div>
  </div>
  <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:20px;">
    ${[
      ['Subscribers', s.subs.length, 'Total accounts', '#4A90D9'],
      ['Monthly Revenue', `$${s.revenue.toLocaleString()}`, 'Est. MRR', '#2D7A4F'],
      ['Active Alerts', s.activeAlerts, 'Live now', '#C17F24'],
      ['Win Rate', `${s.winRate}%`, `${s.closedWins}/${s.closedTotal} wins`, '#2D7A4F'],
      ['Stop Losses', STATE.alerts.filter(a=>a.status==='stopped').length, 'Stopped', '#C0392B'],
      ['Cancellations', s.cancelCount, 'Cancelled subs', '#E67E22'],
    ].map(([l,v,sub,c]) => `
    <div class="stat-card">
      <div style="font-size:10px;letter-spacing:0.09em;color:rgba(100,60,0,0.7);text-transform:uppercase;margin-bottom:4px;">${l}</div>
      <div style="font-size:20px;font-weight:800;color:${c};">${v}</div>
      <div style="font-size:11px;color:rgba(100,60,0,0.6);margin-top:3px;">${sub}</div>
    </div>`).join('')}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;" class="grid-2">
    ${['trader','elite'].map(key => {
      const t = TIERS[key];
      const n = key === 'trader' ? s.traderCount : s.eliteCount;
      return `<div style="${cardStyle}border-left:4px solid ${t.color};">
        <div style="font-size:10px;color:#A08060;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:5px;">${t.label} Tier</div>
        <div style="font-size:32px;font-weight:800;color:${t.color};">${n}</div>
        <div style="font-size:12px;color:#8A6840;margin-bottom:8px;">subscribers · $${(n*t.price).toLocaleString()}/mo</div>
        <div style="height:5px;background:rgba(200,155,70,0.25);border-radius:3px;">
          <div style="width:${s.subs.length>0?(n/s.subs.length*100):0}%;height:100%;background:${t.color};border-radius:3px;"></div>
        </div>
      </div>`;
    }).join('')}
  </div>
  <div style="${cardStyle}">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <h3 style="font-size:15px;font-weight:600;color:#2A1400;">Recent Alerts</h3>
      <button onclick="setAdminTab('alerts')" style="${btnStyle('secondary')}font-size:11px;padding:6px 12px;">View All</button>
    </div>
    <div style="overflow-x:auto;">
      <table style="${tableStyle}">
        <thead><tr>${['Ticker','Title','Tier','Status','Entry','P&L','Views','Actions'].map(h => `<th style="${thStyle}">${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${recentAlerts.map(a => `<tr>
            <td style="${tdStyle}"><strong>${a.ticker}</strong></td>
            <td style="${tdStyle}max-width:160px;"><span style="font-size:12px;">${a.title.slice(0,28)}…</span></td>
            <td style="${tdStyle}"><span style="${badgeStyle(TIERS[a.tier]?.color||'#8B7355',TIERS[a.tier]?.bg||'#F5EFE6')}font-size:9px;">${a.tier}</span></td>
            <td style="${tdStyle}"><span style="${badgeStyle(statusColor(a.status), statusBg(a.status))}font-size:9px;">${a.status}</span></td>
            <td style="${tdStyle}">$${a.entry}</td>
            <td style="${tdStyle}font-weight:700;color:${a.pnl?.startsWith('+')?'#157A4A':'#C0392B'};">${a.pnl}</td>
            <td style="${tdStyle}">${(a.views||0).toLocaleString()}</td>
            <td style="${tdStyle}"><div style="display:flex;gap:5px;">
              <button onclick="openAlertForm(${a.id})" style="${btnStyle('secondary')}padding:4px 9px;font-size:11px;">Edit</button>
              <button onclick="deleteAlert(${a.id})" style="${btnStyle('danger')}padding:4px 9px;font-size:11px;">Del</button>
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
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
    <div><h1 style="font-size:27px;font-weight:700;color:#2A1400;letter-spacing:-0.8px;margin-bottom:4px;">Alert Management</h1><p style="font-size:13px;color:rgba(100,65,10,0.75);">Create and manage all trade alerts</p></div>
    <button onclick="openAlertForm()" style="${btnStyle('primary')}">+ Create Alert</button>
  </div>
  <div style="display:flex;gap:14px;margin-bottom:18px;flex-wrap:wrap;">
    ${[['Total',STATE.alerts.length,'#1A1108'],['Active',activeCount,'#2D7A4F'],['Closed',closedCount,'#8B7355'],['Stopped',stoppedCount,'#C0392B']].map(([l,v,c]) =>
      `<div class="stat-card" style="flex:0 0 auto;min-width:90px;"><div style="font-size:10px;letter-spacing:0.09em;color:rgba(100,60,0,0.7);text-transform:uppercase;margin-bottom:4px;">${l}</div><div style="font-size:22px;font-weight:800;color:${c};">${v}</div></div>`
    ).join('')}
  </div>
  <div style="${cardStyle}">
    <div style="overflow-x:auto;">
      <table style="${tableStyle}">
        <thead><tr>${['Ticker/Title','Tier','Priority','Status','Entry','Target','SL','P&L','Days','Created','Actions'].map(h => `<th style="${thStyle}">${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${STATE.alerts.map(a => `<tr>
            <td style="${tdStyle}"><div style="font-weight:700;font-size:13px;">${a.ticker}</div><div style="font-size:11px;color:#A08060;">${(a.title||'').slice(0,24)}…</div></td>
            <td style="${tdStyle}"><span style="${badgeStyle(TIERS[a.tier]?.color||'#8B7355',TIERS[a.tier]?.bg||'#F5EFE6')}font-size:9px;">${a.tier}</span></td>
            <td style="${tdStyle}"><span style="font-size:11px;color:${priorityColor(a.priority)};font-weight:700;">${a.priority}</span></td>
            <td style="${tdStyle}"><span style="${badgeStyle(statusColor(a.status), statusBg(a.status))}font-size:9px;">${a.status}</span></td>
            <td style="${tdStyle}">$${a.entry}</td>
            <td style="${tdStyle}color:#157A4A;font-weight:600;">$${a.t1}</td>
            <td style="${tdStyle}color:#C0392B;font-weight:600;">$${a.sl}</td>
            <td style="${tdStyle}font-weight:700;color:${a.pnl?.startsWith('+')?'#157A4A':'#C0392B'};">${a.pnl}</td>
            <td style="${tdStyle}color:#D4820A;">${daysToClose(a.buyDate,a.closeDate)||'—'}d</td>
            <td style="${tdStyle}font-size:11px;color:#A08060;">${a.created}</td>
            <td style="${tdStyle}"><div style="display:flex;gap:5px;">
              <button onclick="openAlertForm(${a.id})" style="${btnStyle('secondary')}padding:4px 8px;font-size:11px;">✏️</button>
              <button onclick="deleteAlert(${a.id})" style="${btnStyle('danger')}padding:4px 8px;font-size:11px;">🗑</button>
            </div></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
</div>`;
}

function renderAdminUsers() {
  return `
<div class="fade-in">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
    <div><h1 style="font-size:27px;font-weight:700;color:#2A1400;letter-spacing:-0.8px;margin-bottom:4px;">User Management</h1><p style="font-size:13px;color:rgba(100,65,10,0.75);">${STATE.allUsers.length} total accounts</p></div>
    <button onclick="openUserForm()" style="${btnStyle('primary')}">+ Add User</button>
  </div>
  <div style="${cardStyle}">
    <div style="overflow-x:auto;">
      <table style="${tableStyle}">
        <thead><tr>${['Name / Email','Role','Tier','Status','Joined','Watchlist','Actions'].map(h => `<th style="${thStyle}">${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${STATE.allUsers.map(u => `<tr>
            <td style="${tdStyle}"><div style="display:flex;gap:8px;align-items:center;">
              <div style="width:30px;height:30px;border-radius:8px;background:#D4820A;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">${u.name.charAt(0)}</div>
              <div><div style="font-weight:600;font-size:13px;">${u.name}</div><div style="font-size:11px;color:#A08060;">${u.email}</div></div>
            </div></td>
            <td style="${tdStyle}"><span style="${badgeStyle(u.role==='admin'?'#B8711E':'#157A4A',u.role==='admin'?'#FDF3DC':'#EDFAF3')}">${u.role}</span></td>
            <td style="${tdStyle}">${u.tier ? `<span style="${badgeStyle(TIERS[u.tier]?.color||'#8B7355',TIERS[u.tier]?.bg||'#F5EFE6')}font-size:9px;">${u.tier}</span>` : '—'}</td>
            <td style="${tdStyle}"><span style="${badgeStyle(u.subscriptionStatus==='cancelled'?'#B02020':'#0F6E3A',u.subscriptionStatus==='cancelled'?'rgba(255,220,215,0.7)':'rgba(210,250,225,0.7)')}">${u.subscriptionStatus||'active'}</span></td>
            <td style="${tdStyle}font-size:11px;color:#A08060;">${u.joined}</td>
            <td style="${tdStyle}"><span style="font-weight:600;">${(u.watchlist||[]).length}</span></td>
            <td style="${tdStyle}">
              <div style="display:flex;gap:4px;flex-wrap:wrap;">
                ${u.role !== 'admin' ? `
                  <button onclick="openUserForm(${u.id})" style="${btnStyle('secondary')}padding:4px 8px;font-size:11px;">Edit</button>
                  ${u.subscriptionStatus === 'cancelled'
                    ? `<button onclick="reactivateUser(${u.id})" style="${btnStyle('gold')}padding:4px 8px;font-size:11px;">Reactivate</button>`
                    : `<button onclick="cancelUserSub(${u.id})" style="${btnStyle('ghost')}padding:4px 8px;font-size:11px;color:#E67E22;border-color:#F5D5A0!important;">Cancel Sub</button>`
                  }
                  <button onclick="deleteUser(${u.id})" style="${btnStyle('danger')}padding:4px 8px;font-size:11px;">Del</button>
                ` : ''}
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

  return `
<div class="fade-in">
  <h1 style="font-size:27px;font-weight:700;color:#2A1400;letter-spacing:-0.8px;margin-bottom:20px;">Analytics</h1>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px;" class="grid-2">
    <div style="${cardStyle}">
      <h3 style="font-size:15px;font-weight:600;color:#2A1400;margin-bottom:18px;">Revenue by Tier</h3>
      ${['trader','elite'].map(key => {
        const t = TIERS[key];
        const n = key === 'trader' ? s.traderCount : s.eliteCount;
        const rev = n * t.price;
        const pct = s.revenue > 0 ? ((rev / s.revenue) * 100).toFixed(0) : 0;
        return `<div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span style="font-size:13px;font-weight:600;">${t.label}</span>
            <span style="font-size:12px;font-weight:700;color:${t.color};">$${rev.toLocaleString()} (${pct}%)</span>
          </div>
          <div style="height:7px;background:rgba(200,155,70,0.25);border-radius:4px;">
            <div style="width:${pct}%;height:100%;background:${t.color};border-radius:4px;"></div>
          </div>
        </div>`;
      }).join('')}
      <div style="margin-top:18px;padding-top:14px;border-top:1px solid rgba(200,155,80,0.3);">
        <div style="font-size:10px;letter-spacing:0.09em;color:rgba(100,60,0,0.7);text-transform:uppercase;">Total MRR</div>
        <div style="font-size:26px;font-weight:800;color:#157A4A;">$${s.revenue.toLocaleString()}</div>
      </div>
    </div>
    <div style="${cardStyle}">
      <h3 style="font-size:15px;font-weight:600;color:#2A1400;margin-bottom:18px;">Alert Performance</h3>
      ${[
        ['Active', s.activeAlerts, C.activeText],
        ['Closed Profitable', s.closedWins, C.closedText],
        ['Stop Loss', STATE.alerts.filter(a=>a.status==='stopped').length, C.stoppedText],
      ].map(([l,n,c]) => `
      <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(200,155,80,0.3);">
        <div style="display:flex;gap:7px;align-items:center;"><div style="width:9px;height:9px;border-radius:50%;background:${c};"></div><span style="font-size:13px;">${l}</span></div>
        <span style="font-size:15px;font-weight:700;color:${c};">${n}</span>
      </div>`).join('')}
      <div style="margin-top:18px;">
        <div style="font-size:10px;letter-spacing:0.09em;color:rgba(100,60,0,0.7);text-transform:uppercase;">Overall Win Rate</div>
        <div style="font-size:32px;font-weight:800;color:#157A4A;">${s.winRate}%</div>
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px;" class="grid-2">
    <div style="${cardStyle}">
      <h3 style="font-size:15px;font-weight:600;color:#2A1400;margin-bottom:18px;">Subscriber Distribution</h3>
      ${[
        ['Active Trader', s.traderCount, TIERS.trader.color],
        ['Active Elite',  s.eliteCount,  TIERS.elite.color],
        ['Cancelled',     s.cancelCount, '#C0392B'],
        ['Unsubscribed',  s.subs.filter(u=>u.subscriptionStatus==='unsubscribed').length, '#A08060'],
      ].map(([l,n,c]) => `
      <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(200,155,80,0.3);">
        <div style="display:flex;gap:7px;align-items:center;"><div style="width:9px;height:9px;border-radius:50%;background:${c};"></div><span style="font-size:13px;">${l}</span></div>
        <span style="font-size:15px;font-weight:700;color:${c};">${n}</span>
      </div>`).join('')}
    </div>
    <div style="${cardStyle}">
      <h3 style="font-size:15px;font-weight:600;color:#2A1400;margin-bottom:18px;">Top Alerts by Views</h3>
      ${[...STATE.alerts].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,5).map(a => `
      <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(200,155,80,0.3);">
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="font-weight:700;font-size:13px;">${a.ticker}</span>
          <span style="${badgeStyle(statusColor(a.status),statusBg(a.status))}font-size:9px;">${a.status}</span>
        </div>
        <span style="font-size:13px;font-weight:700;color:#C17F24;">${(a.views||0).toLocaleString()} views</span>
      </div>`).join('')}
    </div>
  </div>
  <div style="${cardStyle}">
    <h3 style="font-size:15px;font-weight:600;color:#2A1400;margin-bottom:4px;">Trade Timeline — 2026</h3>
    <p style="font-size:12px;color:rgba(100,65,10,0.75);margin-bottom:16px;">All alerts · open trades capped at today</p>
    ${renderGantt(STATE.alerts)}
  </div>
</div>`;
}

function renderAdminAccount() {
  const u = STATE.currentUser;
  return `
<div class="fade-in">
  <h1 style="font-size:27px;font-weight:700;color:#2A1400;letter-spacing:-0.8px;margin-bottom:24px;">My Account</h1>
  <div style="${cardStyle}margin-bottom:20px;" id="admin-profile-card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
      <div style="display:flex;gap:16px;align-items:center;">
        <div style="width:56px;height:56px;border-radius:16px;background:#C17F24;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;">${u.name.charAt(0).toUpperCase()}</div>
        <div>
          <div style="font-weight:700;font-size:18px;">${u.name}</div>
          <div style="color:#8A6840;font-size:13px;">${u.email}</div>
          <div style="color:#A08060;font-size:11px;margin-top:2px;">Member since ${u.joined}</div>
          <div style="display:flex;gap:6px;margin-top:8px;">
            <span style="${badgeStyle('#B8711E','#FDF3DC')}">Admin</span>
            <span style="${badgeStyle('#157A4A','#EDFAF3')}">Active</span>
          </div>
          <div id="admin-profile-feedback" style="font-size:12px;margin-top:6px;font-weight:600;color:#157A4A;"></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-direction:column;" id="admin-profile-actions">
        <button onclick="showAdminEditPanel('name')" style="${btnStyle('secondary')}">✏️ Change Name</button>
        <button onclick="showAdminEditPanel('password')" style="${btnStyle('secondary')}">🔑 Change Password</button>
      </div>
    </div>
    <div id="admin-edit-panel"></div>
  </div>
</div>`;
}

function showAdminEditPanel(type) {
  const panel = document.getElementById('admin-edit-panel');
  const actions = document.getElementById('admin-profile-actions');
  if (!panel) return;
  if (actions) actions.style.display = 'none';
  const u = STATE.currentUser;

  if (type === 'name') {
    panel.innerHTML = `
    <div style="margin-top:20px;padding-top:20px;border-top:1px solid #E2CDB0;">
      <h3 style="font-size:15px;font-weight:600;color:#2A1400;margin-bottom:12px;">Change Display Name</h3>
      <div style="display:flex;gap:8px;max-width:400px;">
        <input id="admin-edit-name" style="${inputStyle}flex:1;" value="${u.name}" placeholder="Your name">
        <button onclick="saveAdminName()" style="${btnStyle('primary')}">Save</button>
        <button onclick="cancelAdminEditPanel()" style="${btnStyle('ghost')}">Cancel</button>
      </div>
    </div>`;
    setTimeout(() => document.getElementById('admin-edit-name')?.focus(), 50);
  } else {
    panel.innerHTML = `
    <div style="margin-top:20px;padding-top:20px;border-top:1px solid #E2CDB0;">
      <h3 style="font-size:15px;font-weight:600;color:#2A1400;margin-bottom:12px;">Change Password</h3>
      <div style="max-width:400px;">
        ${[['Current Password','admin-pw-current'],['New Password','admin-pw-new'],['Confirm New','admin-pw-confirm']].map(([l,id]) =>
          `<div style="margin-bottom:10px;"><label style="${labelStyle}">${l}</label><input id="${id}" type="password" style="${inputStyle}" placeholder="••••••••"></div>`
        ).join('')}
        <div id="admin-pw-error" style="display:none;color:#C0392B;font-size:12px;margin-bottom:8px;padding:6px 10px;background:#FFF0EE;border-radius:6px;"></div>
        <div style="display:flex;gap:8px;margin-top:4px;">
          <button onclick="saveAdminPassword()" style="${btnStyle('primary')}">Update Password</button>
          <button onclick="cancelAdminEditPanel()" style="${btnStyle('ghost')}">Cancel</button>
        </div>
      </div>
    </div>`;
  }
}

function cancelAdminEditPanel() {
  const panel = document.getElementById('admin-edit-panel');
  const actions = document.getElementById('admin-profile-actions');
  if (panel) panel.innerHTML = '';
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
  if (newPw.length < 6) { showErr('Minimum 6 characters.'); return; }
  try {
    const { user } = await API.put(`/api/users/${STATE.currentUser.id}`, { password: newPw });
    STATE.currentUser = user;
    cancelAdminEditPanel();
    const fb = document.getElementById('admin-profile-feedback');
    if (fb) { fb.textContent = '✓ Password updated!'; }
    render();
  } catch (e) { showErr(e.message); }
}

// ─── Alert Form ───────────────────────────────────────────────────────────────
let editingAlertId = null;

function openAlertForm(id) {
  editingAlertId = id || null;
  const a = id ? STATE.alerts.find(x => x.id === id) : null;
  const overlay = document.getElementById('alert-form-overlay');
  const content = document.getElementById('alert-form-content');
  if (!overlay || !content) return;

  const categories = ['Technology','Semiconductors','E-Commerce','Automotive','Crypto/Fintech','Media/Streaming','Healthcare','Finance'];

  content.innerHTML = `
  <div style="background:rgba(255,245,220,0.92);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:20px;padding:28px;width:100%;max-width:580px;max-height:90vh;overflow:auto;border:1px solid rgba(220,175,100,0.55);box-shadow:0 24px 64px rgba(80,40,0,0.3);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <h2 style="font-size:19px;font-weight:700;color:#2A1400;">${a ? 'Edit Alert' : 'Create Alert'}</h2>
      <button onclick="closeAlertForm()" style="${btnStyle('ghost')}padding:5px 9px;">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
      <div><label style="${labelStyle}">Ticker</label><input id="af-ticker" style="${inputStyle}" placeholder="AAPL" value="${a?.ticker||''}"></div>
      <div><label style="${labelStyle}">Title</label><input id="af-title" style="${inputStyle}" placeholder="Alert title..." value="${a?.title||''}"></div>
    </div>
    <div style="margin-bottom:14px;"><label style="${labelStyle}">Description</label><textarea id="af-desc" style="${inputStyle}min-height:70px;resize:vertical;" placeholder="Rationale...">${a?.description||''}</textarea></div>
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
      <div><label style="${labelStyle}">Entry</label><input id="af-entry" style="${inputStyle}" placeholder="$0" value="${a?.entry||''}"></div>
      <div><label style="${labelStyle}">Target</label><input id="af-t1" style="${inputStyle}" placeholder="$0" value="${a?.t1||''}"></div>
      <div><label style="${labelStyle}">Stop Loss</label><input id="af-sl" style="${inputStyle}" placeholder="$0" value="${a?.sl||''}"></div>
    </div>
    ${a ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
      <div><label style="${labelStyle}">P&L</label><input id="af-pnl" style="${inputStyle}" placeholder="+0%" value="${a?.pnl||'0%'}"></div>
      <div><label style="${labelStyle}">Close Date (if closed)</label><input id="af-closedate" type="date" style="${inputStyle}" value="${a?.closeDate||''}"></div>
    </div>` : ''}
    <div style="margin-bottom:18px;"><label style="${labelStyle}">Status</label>
      <select id="af-status" style="${inputStyle}max-width:180px;">
        ${['active','closed','stopped'].map(s => `<option ${(a?.status||'active')===s?'selected':''}>${s}</option>`).join('')}
      </select></div>
    <div id="af-error" style="display:none;color:#C0392B;font-size:12px;margin-bottom:10px;padding:6px 10px;background:#FFF0EE;border-radius:6px;"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button onclick="closeAlertForm()" style="${btnStyle('secondary')}">Cancel</button>
      <button onclick="saveAlertForm()" style="${btnStyle('primary')}">${a ? 'Save Changes' : 'Create Alert'}</button>
    </div>
  </div>`;
  overlay.style.display = 'flex';
}

function closeAlertForm() {
  const overlay = document.getElementById('alert-form-overlay');
  if (overlay) overlay.style.display = 'none';
}

async function saveAlertForm() {
  const errEl = document.getElementById('af-error');
  const showErr = (m) => { if (errEl) { errEl.textContent = m; errEl.style.display = 'block'; } };

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
  const closeDate = document.getElementById('af-closedate')?.value || null;

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

// ─── User Form ────────────────────────────────────────────────────────────────
let editingUserId = null;

function openUserForm(id) {
  editingUserId = id || null;
  const u = id ? STATE.allUsers.find(x => x.id === id) : null;
  const overlay = document.getElementById('user-form-overlay');
  const content = document.getElementById('user-form-content');
  if (!overlay || !content) return;

  content.innerHTML = `
  <div style="background:rgba(255,245,220,0.92);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:20px;padding:28px;width:100%;max-width:440px;max-height:90vh;overflow:auto;border:1px solid rgba(220,175,100,0.55);box-shadow:0 24px 64px rgba(80,40,0,0.3);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <h2 style="font-size:19px;font-weight:700;color:#2A1400;">${u ? 'Edit User' : 'Add New User'}</h2>
      <button onclick="closeUserForm()" style="${btnStyle('ghost')}padding:5px 9px;">✕</button>
    </div>
    <div style="margin-bottom:13px;"><label style="${labelStyle}">Full Name</label><input id="uf-name" style="${inputStyle}" placeholder="Full name" value="${u?.name||''}"></div>
    <div style="margin-bottom:13px;"><label style="${labelStyle}">Email</label><input id="uf-email" type="email" style="${inputStyle}" placeholder="email@example.com" value="${u?.email||''}" ${u?'disabled style="'+inputStyle+'opacity:0.7;"':'style="'+inputStyle+'"'}></div>
    ${!u ? `<div style="margin-bottom:13px;"><label style="${labelStyle}">Password</label><input id="uf-password" type="password" style="${inputStyle}" placeholder="••••••••" value="pass123"></div>` : ''}
    <div style="margin-bottom:13px;">
      <label style="${labelStyle}">Subscription Tier</label>
      <div style="display:flex;gap:10px;">
        ${Object.entries(TIERS).map(([key, t]) => `
        <div onclick="selectUserTier('${key}')" id="uf-tier-${key}" style="flex:1;padding:10px 12px;border-radius:10px;cursor:pointer;border:2px solid ${(u?.tier||'trader')===key?t.color:'rgba(200,155,80,0.4)'};background:${(u?.tier||'trader')===key?t.bg:'rgba(255,245,215,0.7)'};transition:all 0.15s;">
          <div style="font-size:12px;font-weight:700;color:${t.color};">${t.label}</div>
          <div style="font-size:16px;font-weight:800;">$${t.price}<span style="font-size:10px;font-weight:400;color:#A08060;">/mo</span></div>
        </div>`).join('')}
      </div>
    </div>
    <input type="hidden" id="uf-tier" value="${u?.tier||'trader'}">
    <div style="margin-bottom:18px;"><label style="${labelStyle}">Subscription Status</label>
      <select id="uf-status" style="${inputStyle}">
        <option value="active" ${(u?.subscriptionStatus||'active')==='active'?'selected':''}>Active</option>
        <option value="cancelled" ${u?.subscriptionStatus==='cancelled'?'selected':''}>Cancelled</option>
        <option value="unsubscribed" ${u?.subscriptionStatus==='unsubscribed'?'selected':''}>Unsubscribed</option>
      </select></div>
    <div id="uf-error" style="display:none;color:#C0392B;font-size:12px;margin-bottom:10px;padding:6px 10px;background:#FFF0EE;border-radius:6px;"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button onclick="closeUserForm()" style="${btnStyle('secondary')}">Cancel</button>
      <button onclick="saveUserForm()" style="${btnStyle('primary')}">${u ? 'Save Changes' : 'Add User'}</button>
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
    el.style.borderColor = k === key ? t.color : 'rgba(200,155,80,0.4)';
    el.style.background  = k === key ? t.bg : 'rgba(255,245,215,0.7)';
  });
}

function closeUserForm() {
  const overlay = document.getElementById('user-form-overlay');
  if (overlay) overlay.style.display = 'none';
}

async function saveUserForm() {
  const errEl = document.getElementById('uf-error');
  const showErr = (m) => { if (errEl) { errEl.textContent = m; errEl.style.display = 'block'; } };

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

function closeAdminGenericModal() {
  const o = document.getElementById('admin-generic-overlay');
  if (o) o.style.display = 'none';
}

function attachAdminEvents() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAlertForm(); closeUserForm(); closeAdminGenericModal();
    }
  }, { once: true });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();
