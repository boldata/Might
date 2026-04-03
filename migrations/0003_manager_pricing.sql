-- Add updated_at column to alerts
ALTER TABLE alerts ADD COLUMN updated_at TEXT DEFAULT NULL;

-- Create settings table for pricing and config
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Default pricing
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('price_trader', '229'),
  ('price_elite',  '769'),
  ('name_trader',  'Trader'),
  ('name_elite',   'Elite'),
  ('desc_trader',  'Access to all Trader-tier alerts and signals'),
  ('desc_elite',   'Full access to all alerts including Elite-tier signals');

-- Update admin email
UPDATE users SET email = 'azam.zahid+msa@gmail.com' WHERE role = 'admin';

-- Add manager user (seeded, admin can also create via UI)
INSERT OR IGNORE INTO users (id, name, email, password, role, tier, subscription_status, joined, notifications, watchlist, seen_alert_ids)
VALUES (6, 'Manager', 'manager@signalstack.com', 'manager123', 'manager', 'elite', 'active', '2026-01-01', 1, '[]', '[]');
