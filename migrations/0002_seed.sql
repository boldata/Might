-- Seed users
INSERT OR IGNORE INTO users (id, name, email, password, role, tier, subscription_status, joined, notifications, watchlist, seen_alert_ids) VALUES
  (1, 'Alex Chen',  'alex@example.com',      'pass123',  'subscriber', 'elite',  'active',       '2026-01-01', 1, '[1,3,6]', '[1,2,3,4,5,6,7,8,9,10]'),
  (2, 'Sarah Kim',  'sarah@example.com',     'pass123',  'subscriber', 'trader', 'active',       '2026-01-05', 1, '[2,5]',   '[1,2,3,4,5,6,7,8,9,10]'),
  (3, 'Admin',      'admin@signalstack.com', 'admin123', 'admin',      'elite',  'active',       '2026-01-01', 1, '[]',      '[]'),
  (4, 'Jordan Lee', 'jordan@example.com',    'pass123',  'subscriber', NULL,     'unsubscribed', '2026-02-01', 0, '[]',      '[]'),
  (5, 'Sam Patel',  'sam@example.com',       'pass123',  'subscriber', 'trader', 'cancelled',    '2026-03-01', 1, '[]',      '[1,2,3,4,5,6,7,8,9,10]');

-- Seed alerts
INSERT OR IGNORE INTO alerts (id, ticker, title, description, category, tier, priority, status, entry, t1, sl, pnl, views, buy_date, close_date, created) VALUES
  (1,  'NVDA',  'NVDA AI Supercycle Breakout',    'AI demand surge driving breakout from consolidation. Target hit — exceptional trade.',            'Technology',     'elite',  'critical', 'closed',  495, 540, 444, '+31.31%', 4821, '2026-01-06', '2026-02-28', '2026-01-06'),
  (2,  'AMD',   'AMD Data Center GPU Surge',       'Data center GPU share gains from NVIDIA. MI300 demand surprise. Target achieved.',                'Semiconductors', 'trader', 'high',     'closed',  155, 175, 141, '+43.23%', 3102, '2026-01-08', '2026-02-20', '2026-01-08'),
  (3,  'MSFT',  'MSFT Copilot Enterprise Play',    'Azure AI integration driving enterprise spending. Copilot adoption metrics strong.',              'Technology',     'trader', 'low',      'active',  395, 420, 375, '+0.72%',  2876, '2026-02-10', NULL,          '2026-02-10'),
  (4,  'AAPL',  'AAPL iPhone Cycle Recovery',      'iPhone cycle recovery play + Vision Pro momentum. Riding to target.',                            'Technology',     'trader', 'low',      'active',  182, 195, 170, '+3.88%',  3541, '2026-01-10', NULL,          '2026-01-10'),
  (5,  'TSLA',  'TSLA Earnings Recovery Bounce',   'EV demand disappointment + margin pressure. Stop loss triggered at $322 as planned.',            'Automotive',     'trader', 'high',     'stopped', 355, 390, 322, '-9.30%',  4103, '2026-01-15', '2026-02-15', '2026-01-15'),
  (6,  'META',  'META Ad Revenue Acceleration',    'Ad revenue acceleration + AI monetization narrative. Riding to target with trailing stop.',      'Technology',     'trader', 'medium',   'active',  540, 580, 505, '+6.20%',  2944, '2026-01-20', NULL,          '2026-01-20'),
  (7,  'AMZN',  'AMZN AWS + Prime Growth',         'AWS growth re-acceleration + Prime subscriber growth. Target tagged. Patience required.',        'E-Commerce',     'trader', 'medium',   'active',  185, 200, 170, '+4.50%',  2211, '2026-02-05', NULL,          '2026-02-05'),
  (8,  'COIN',  'COIN Crypto Market Correction',   'Crypto market correction faster than anticipated. Stop loss at $215 protected capital.',         'Crypto/Fintech', 'elite',  'high',     'stopped', 245, 280, 215, '-14.29%', 3372, '2026-01-28', '2026-02-10', '2026-01-28'),
  (9,  'GOOGL', 'GOOGL AI Search Dominance',       'Google Gemini integration gaining enterprise traction. Search ad revenue exceeding estimates.',  'Technology',     'elite',  'medium',   'active',  172, 185, 158, '+3.88%',  1822, '2026-02-19', NULL,          '2026-02-19'),
  (10, 'NFLX',  'NFLX Ad-Tier Monetization Play',  'Ad-supported tier monetization inflecting. Password sharing crackdown complete.',                'Media/Streaming','trader', 'medium',   'active',  890, 950, 840, '+2.10%',  1654, '2026-02-22', NULL,          '2026-02-22');
