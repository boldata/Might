import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// ─── Helpers ───────────────────────────────────────────────────────────────
function randomToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function parseJSON(str: string | null, fallback: any = null) {
  try { return str ? JSON.parse(str) : fallback } catch { return fallback }
}

async function getUser(db: D1Database, token: string) {
  if (!token) return null
  const row = await db.prepare(
    'SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token = ?'
  ).bind(token).first()
  return row || null
}

function isAdmin(u: any) { return u?.role === 'admin' }
function isAdminOrManager(u: any) { return u?.role === 'admin' || u?.role === 'manager' }

// ─── AUTH ───────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json()
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ? AND password = ?'
  ).bind(email, password).first() as any
  if (!user) return c.json({ error: 'Invalid email or password.' }, 401)
  const token = randomToken()
  await c.env.DB.prepare('INSERT INTO sessions (user_id, token) VALUES (?, ?)').bind(user.id, token).run()
  return c.json({ token, user: formatUser(user) })
})

app.post('/api/auth/register', async (c) => {
  const { name, email, password } = await c.req.json()
  if (!name || !email || !password) return c.json({ error: 'All fields required.' }, 400)
  const exists = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (exists) return c.json({ error: 'Email already registered.' }, 409)
  const joined = new Date().toISOString().split('T')[0]
  const result = await c.env.DB.prepare(
    'INSERT INTO users (name, email, password, role, tier, subscription_status, joined, watchlist, seen_alert_ids) VALUES (?, ?, ?, "subscriber", NULL, "unsubscribed", ?, "[]", "[]")'
  ).bind(name, email, password, joined).run()
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(result.meta.last_row_id).first() as any
  const token = randomToken()
  await c.env.DB.prepare('INSERT INTO sessions (user_id, token) VALUES (?, ?)').bind(user.id, token).run()
  return c.json({ token, user: formatUser(user) })
})

app.post('/api/auth/logout', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (token) await c.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run()
  return c.json({ ok: true })
})

app.get('/api/auth/me', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const user = await getUser(c.env.DB, token || '') as any
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  return c.json({ user: formatUser(user) })
})

// ─── USERS ──────────────────────────────────────────────────────────────────
app.get('/api/users', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const me = await getUser(c.env.DB, token || '') as any
  if (!me || !isAdminOrManager(me)) return c.json({ error: 'Forbidden' }, 403)
  const rows = await c.env.DB.prepare('SELECT * FROM users ORDER BY id').all()
  return c.json({ users: rows.results.map(formatUser) })
})

app.post('/api/users', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const me = await getUser(c.env.DB, token || '') as any
  if (!me || !isAdminOrManager(me)) return c.json({ error: 'Forbidden' }, 403)
  const { name, email, password, tier, subscriptionStatus, role, phone } = await c.req.json()
  if (!name || !email) return c.json({ error: 'Name and email required.' }, 400)
  // Require phone for prime and exclusive tiers
  if ((tier === 'prime' || tier === 'exclusive') && !phone) {
    return c.json({ error: `Phone number required for ${tier} tier.` }, 400)
  }
  // Only admin can create managers
  const assignedRole = (role === 'manager' && isAdmin(me)) ? 'manager' : 'subscriber'
  const exists = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (exists) return c.json({ error: 'Email already exists.' }, 409)
  const joined = new Date().toISOString().split('T')[0]
  const result = await c.env.DB.prepare(
    'INSERT INTO users (name, email, password, role, tier, subscription_status, joined, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(name, email, password || 'pass123', assignedRole, tier || null, subscriptionStatus || 'active', joined, phone || null).run()
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(result.meta.last_row_id).first() as any
  
  // Create notification for admin if prime/exclusive signup
  if (tier === 'prime' || tier === 'exclusive') {
    await c.env.DB.prepare(
      'INSERT INTO notifications (type, user_id, message) VALUES (?, ?, ?)'
    ).bind(`signup_${tier}`, user.id, `New ${tier} member: ${name} (${email}, ${phone})`).run()
  }
  
  return c.json({ user: formatUser(user) })
})

app.put('/api/users/:id', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const me = await getUser(c.env.DB, token || '') as any
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const id = parseInt(c.req.param('id'))
  if (!isAdminOrManager(me) && me.id !== id) return c.json({ error: 'Forbidden' }, 403)
  const body = await c.req.json()
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first() as any
  if (!user) return c.json({ error: 'User not found' }, 404)

  const name = body.name ?? user.name
  const password = body.password ?? user.password
  const tier = body.tier !== undefined ? body.tier : user.tier
  const subscriptionStatus = body.subscriptionStatus ?? user.subscription_status
  const watchlist = body.watchlist !== undefined ? JSON.stringify(body.watchlist) : user.watchlist
  const seenAlertIds = body.seenAlertIds !== undefined ? JSON.stringify(body.seenAlertIds) : user.seen_alert_ids
  const notifications = body.notifications !== undefined ? (body.notifications ? 1 : 0) : user.notifications
  const phone = body.phone !== undefined ? body.phone : user.phone
  // Only admin can change roles
  const role = (body.role !== undefined && isAdmin(me)) ? body.role : user.role
  
  // Validate phone for prime/exclusive
  if ((tier === 'prime' || tier === 'exclusive') && !phone) {
    return c.json({ error: `Phone number required for ${tier} tier.` }, 400)
  }

  await c.env.DB.prepare(
    'UPDATE users SET name=?, password=?, tier=?, subscription_status=?, watchlist=?, seen_alert_ids=?, notifications=?, role=?, phone=? WHERE id=?'
  ).bind(name, password, tier, subscriptionStatus, watchlist, seenAlertIds, notifications, role, phone, id).run()
  const updated = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first() as any
  return c.json({ user: formatUser(updated) })
})

app.delete('/api/users/:id', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const me = await getUser(c.env.DB, token || '') as any
  if (!me || !isAdmin(me)) return c.json({ error: 'Forbidden' }, 403)
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ─── ALERTS ─────────────────────────────────────────────────────────────────
app.get('/api/alerts', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const me = await getUser(c.env.DB, token || '') as any
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  const rows = await c.env.DB.prepare('SELECT * FROM alerts ORDER BY id DESC').all()
  return c.json({ alerts: rows.results.map(formatAlert) })
})

app.post('/api/alerts', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const me = await getUser(c.env.DB, token || '') as any
  if (!me || !isAdminOrManager(me)) return c.json({ error: 'Forbidden' }, 403)
  const { ticker, title, description, category, tiers, priority, status, entry, t1, sl } = await c.req.json()
  const created = new Date().toISOString().split('T')[0]
  // Convert tiers array to JSON string
  const tiersJson = JSON.stringify(tiers || ['trader'])
  const result = await c.env.DB.prepare(
    'INSERT INTO alerts (ticker, title, description, category, tiers, priority, status, entry, t1, sl, pnl, views, buy_date, created, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "0%", 0, ?, ?, NULL)'
  ).bind(ticker, title, description, category, tiersJson, priority, status, entry, t1, sl, created, created).run()
  const alert = await c.env.DB.prepare('SELECT * FROM alerts WHERE id = ?').bind(result.meta.last_row_id).first() as any
  return c.json({ alert: formatAlert(alert) })
})

app.put('/api/alerts/:id', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const me = await getUser(c.env.DB, token || '') as any
  if (!me || !isAdminOrManager(me)) return c.json({ error: 'Forbidden' }, 403)
  const id = parseInt(c.req.param('id'))
  const alert = await c.env.DB.prepare('SELECT * FROM alerts WHERE id = ?').bind(id).first() as any
  if (!alert) return c.json({ error: 'Alert not found' }, 404)
  const body = await c.req.json()
  const ticker = body.ticker ?? alert.ticker
  const title = body.title ?? alert.title
  const description = body.description ?? alert.description
  const category = body.category ?? alert.category
  const tiers = body.tiers !== undefined ? JSON.stringify(body.tiers) : alert.tiers
  const priority = body.priority ?? alert.priority
  const status = body.status ?? alert.status
  const entry = body.entry ?? alert.entry
  const t1 = body.t1 ?? alert.t1
  const sl = body.sl ?? alert.sl
  const pnl = body.pnl ?? alert.pnl
  const closeDate = body.closeDate !== undefined ? body.closeDate : alert.close_date
  const updatedAt = new Date().toISOString().split('T')[0]
  await c.env.DB.prepare(
    'UPDATE alerts SET ticker=?, title=?, description=?, category=?, tiers=?, priority=?, status=?, entry=?, t1=?, sl=?, pnl=?, close_date=?, updated_at=? WHERE id=?'
  ).bind(ticker, title, description, category, tiers, priority, status, entry, t1, sl, pnl, closeDate, updatedAt, id).run()
  const updated = await c.env.DB.prepare('SELECT * FROM alerts WHERE id = ?').bind(id).first() as any
  return c.json({ alert: formatAlert(updated) })
})

app.delete('/api/alerts/:id', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const me = await getUser(c.env.DB, token || '') as any
  if (!me || !isAdmin(me)) return c.json({ error: 'Forbidden' }, 403)
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare('DELETE FROM alerts WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ─── TIERS ──────────────────────────────────────────────────────────────────
app.get('/api/tiers', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const me = await getUser(c.env.DB, token || '') as any
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  // Subscribers only see visible tiers
  const query = isAdminOrManager(me) 
    ? 'SELECT * FROM tiers ORDER BY display_order'
    : 'SELECT * FROM tiers WHERE visible = 1 ORDER BY display_order'
  const rows = await c.env.DB.prepare(query).all()
  return c.json({ tiers: rows.results })
})

app.put('/api/tiers/:id', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const me = await getUser(c.env.DB, token || '') as any
  if (!me || !isAdmin(me)) return c.json({ error: 'Forbidden' }, 403)
  const id = c.req.param('id')
  const { visible } = await c.req.json()
  await c.env.DB.prepare('UPDATE tiers SET visible = ? WHERE id = ?').bind(visible ? 1 : 0, id).run()
  return c.json({ ok: true })
})

// ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
app.get('/api/notifications', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const me = await getUser(c.env.DB, token || '') as any
  if (!me || !isAdmin(me)) return c.json({ error: 'Forbidden' }, 403)
  const rows = await c.env.DB.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50').all()
  return c.json({ notifications: rows.results })
})

app.put('/api/notifications/:id', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const me = await getUser(c.env.DB, token || '') as any
  if (!me || !isAdmin(me)) return c.json({ error: 'Forbidden' }, 403)
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare('UPDATE notifications SET read = 1 WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

// ─── PRICING (Legacy support) ───────────────────────────────────────────────
app.get('/api/pricing', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const me = await getUser(c.env.DB, token || '') as any
  if (!me) return c.json({ error: 'Unauthorized' }, 401)
  // Return pricing from settings table
  const rows = await c.env.DB.prepare("SELECT * FROM settings WHERE key LIKE 'price_%' OR key LIKE 'name_%' OR key LIKE 'desc_%'").all()
  const result: any = {}
  rows.results.forEach((r: any) => { result[r.key] = r.value })
  return c.json({ pricing: result })
})

app.put('/api/pricing', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  const me = await getUser(c.env.DB, token || '') as any
  if (!me || !isAdmin(me)) return c.json({ error: 'Forbidden' }, 403)
  const body = await c.req.json()
  for (const [key, value] of Object.entries(body)) {
    await c.env.DB.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'
    ).bind(key, value).run()
  }
  return c.json({ ok: true })
})

// ─── Format helpers ─────────────────────────────────────────────────────────
function formatUser(u: any) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    password: u.password,
    role: u.role,
    tier: u.tier,
    subscriptionStatus: u.subscription_status,
    joined: u.joined,
    phone: u.phone,
    notifications: !!u.notifications,
    watchlist: parseJSON(u.watchlist, []),
    seenAlertIds: parseJSON(u.seen_alert_ids, []),
  }
}

function formatAlert(a: any) {
  return {
    id: a.id,
    ticker: a.ticker,
    title: a.title,
    description: a.description,
    category: a.category,
    tiers: parseJSON(a.tiers, ['trader']),
    tier: parseJSON(a.tiers, ['trader'])[0], // Legacy support: return first tier
    priority: a.priority,
    status: a.status,
    entry: a.entry,
    t1: a.t1,
    sl: a.sl,
    pnl: a.pnl,
    views: a.views,
    buyDate: a.buy_date,
    closeDate: a.close_date,
    created: a.created,
    updatedAt: a.updated_at || null,
  }
}

// ─── Static files ──────────────────────────────────────────────────────────
app.use('/static/*', serveStatic({ root: './public' }))

// ─── SPA fallback ──────────────────────────────────────────────────────────
app.get('*', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SignalStack — Elite Trade Alerts</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="/static/styles.css" rel="stylesheet">
</head>
<body>
  <div id="root"></div>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="/static/app.js"></script>
</body>
</html>`)
})

export default app
