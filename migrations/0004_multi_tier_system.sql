-- Migration: Multi-tier system with Prime & Exclusive tiers
-- 1. Create tiers table for tier management
CREATE TABLE IF NOT EXISTS tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  description TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  color TEXT NOT NULL DEFAULT '#B84A18',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insert default tiers
INSERT OR IGNORE INTO tiers (id, name, price, description, display_order, visible, color) VALUES
  ('trader', 'Trader', 229, 'Access to all Trader-tier alerts and signals', 1, 1, '#B84A18'),
  ('elite', 'Elite', 769, 'Full access to Trader and Elite-tier signals', 2, 1, '#6B2040'),
  ('prime', 'Prime', 2800, 'Premium tier with exclusive Prime-tier signals and priority support', 3, 1, '#8B6914'),
  ('exclusive', 'Exclusive', 12000, 'Ultra-exclusive tier with personalized fund management and dedicated support', 4, 1, '#1A1A2E');

-- 3. Add phone column to users (required for Prime and Exclusive tiers)
ALTER TABLE users ADD COLUMN phone TEXT DEFAULT NULL;

-- 4. Rename old tier column and add new tiers column (JSON array)
-- SQLite doesn't support ALTER COLUMN, so we need to recreate alerts table
CREATE TABLE alerts_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Technology',
  tiers TEXT NOT NULL DEFAULT '["trader"]',  -- JSON array of tier IDs
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT NULL
);

-- 5. Migrate existing alerts (convert single tier to array)
INSERT INTO alerts_new (id, ticker, title, description, category, tiers, priority, status, entry, t1, sl, pnl, views, buy_date, close_date, created, created_at, updated_at)
SELECT 
  id, ticker, title, description, category,
  '["' || COALESCE(tier, 'trader') || '"]' as tiers,  -- Convert 'trader' to '["trader"]'
  priority, status, entry, t1, sl, pnl, views, buy_date, close_date, created, created_at, updated_at
FROM alerts;

-- 6. Drop old table and rename new one
DROP TABLE alerts;
ALTER TABLE alerts_new RENAME TO alerts;

-- 7. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_tiers ON alerts(tiers);

-- 8. Update settings table with new tier pricing
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('price_prime', '2800'),
  ('price_exclusive', '12000'),
  ('name_prime', 'Prime'),
  ('name_exclusive', 'Exclusive'),
  ('desc_prime', 'Premium tier with exclusive Prime-tier signals and priority support'),
  ('desc_exclusive', 'Ultra-exclusive tier with personalized fund management and dedicated support');

-- 9. Create admin notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,  -- 'signup_prime', 'signup_exclusive', etc.
  user_id INTEGER,
  message TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
