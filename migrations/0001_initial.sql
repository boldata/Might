-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'subscriber',
  tier TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'unsubscribed',
  joined TEXT NOT NULL DEFAULT (date('now')),
  notifications INTEGER NOT NULL DEFAULT 1,
  watchlist TEXT NOT NULL DEFAULT '[]',
  seen_alert_ids TEXT NOT NULL DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Technology',
  tier TEXT NOT NULL DEFAULT 'trader',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  entry REAL,
  t1 REAL,
  sl REAL,
  pnl TEXT DEFAULT '0%',
  views INTEGER DEFAULT 0,
  buy_date TEXT,
  close_date TEXT,
  created TEXT NOT NULL DEFAULT (date('now')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (simple token-based auth)
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_tier ON alerts(tier);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
