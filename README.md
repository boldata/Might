# SignalStack — Elite Trade Alerts Platform

## Project Overview
- **Name**: SignalStack  
- **Type**: Premium trading alerts platform with multi-tier subscription system
- **Framework**: Hono (Cloudflare Pages)
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: Vanilla JavaScript with Tailwind CSS
- **Features**: Real-time trade alerts, KPI dashboard, tier management, trade timeline visualization

## URLs
- **Development**: https://3000-ic3lbrhlm6pdm3bvpk8na-5634da27.sandbox.novita.ai
- **GitHub**: https://github.com/boldata/Might

## Features Implemented

### ✅ Core Features
1. **Multi-Tier System**
   - Trader ($229/mo) - Basic tier alerts
   - Elite ($769/mo) - Trader + Elite alerts
   - Prime ($2800/mo) - Premium with exclusive signals + priority support
   - Exclusive ($12000/mo) - Ultra-exclusive with fund management

2. **Multi-Tier Alert Targeting**
   - Admin/managers can select multiple tiers when creating alerts
   - Alerts visible to all selected tiers and above
   - Dynamic tier badge display on alert cards

3. **Tier Management (Admin Only)**
   - Show/hide tiers from subscriber view
   - Tier visibility controls in Analytics > Tier Management
   - New tier notifications for Prime/Exclusive signups

4. **Per-Tier KPI Analytics**
   - Filter dashboard KPIs by specific tier
   - Separate statistics calculation per tier
   - Tier dropdown on dashboard for filtering

5. **Enhanced Trade Timeline Chart**
   - Hover tooltips showing full alert details
   - Clickable bars open detailed alert modal
   - Tier-specific filtering
   - Improved visual design with shadows and colors

6. **Detailed Alert Modal**
   - Full alert information display
   - Entry/Target/Stop/P&L cards with gradient styling
   - Timeline info (buy date, close date, duration, views)
   - Click any alert card to open modal

7. **Premium Tier Features**
   - Phone number collection for Prime/Exclusive members (required)
   - Admin notifications for new premium signups
   - Notification badge in Analytics tab

8. **Improved UX**
   - Empty state messages for no open alerts
   - Better visual feedback and animations
   - Updated "working to find good ticker" message

### 🔐 User Roles
- **Admin**: Full control (email: azam.zahid+msa@gmail.com, password: admin123)
  - Manage all users, alerts, and tiers
  - Pricing management
  - View premium signup notifications
- **Manager**: Limited admin access (email: manager@signalstack.com, password: manager123)
  - Cannot create/delete managers
  - Cannot change pricing or manage tiers
- **Subscriber**: Standard user with tier-based alert access

## Tech Stack
- **Backend**: Hono + TypeScript
- **Frontend**: Vanilla JS + Tailwind CSS + FontAwesome
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Pages
- **Process Manager**: PM2 (development only)

## Data Models

### Users
- ID, name, email, password, role, tier, subscription_status, phone (for Prime/Exclusive), joined, notifications, watchlist, seen_alert_ids

### Alerts
- ID, ticker, title, description, category, **tiers (JSON array)**, priority, status, entry, t1 (target), sl (stop-loss), pnl, views, buy_date, close_date, created, updated_at

### Tiers
- ID, name, price, description, display_order, visible, color, created_at

### Notifications
- ID, type (signup_prime, signup_exclusive), user_id, message, read, created_at

## Development

### Local Setup
```bash
# Install dependencies
npm install

# Apply database migrations
npx wrangler d1 migrations apply signalstack-production --local

# Build project
npm run build

# Start development server with PM2
pm2 start ecosystem.config.cjs

# Check status
pm2 status

# View logs
pm2 logs signalstack --nostream

# Stop server
pm2 stop signalstack
```

### Scripts
```bash
npm run build          # Build for production
npm run dev           # Run Vite dev server (local only)
npm run dev:sandbox   # Run wrangler pages dev (sandbox)
npm run deploy        # Deploy to Cloudflare Pages
npm run deploy:prod   # Deploy to production
npm run clean-port    # Kill process on port 3000
npm run test          # Quick health check
npm run db:migrate:local    # Apply migrations locally
npm run db:migrate:prod     # Apply migrations to production
npm run git:status    # Git status
npm run git:commit -- "message"  # Git commit
```

## Database Migrations

**IMPORTANT**: After pulling new migrations, you must apply them to your local D1 database:

```bash
# Local development
npx wrangler d1 migrations apply signalstack-production --local

# Production (after testing locally)
npx wrangler d1 migrations apply signalstack-production
```

**Migrations:**
- `0001_initial.sql` - Users, alerts, sessions tables
- `0002_seed.sql` - Seed data (users, alerts)
- `0003_manager_pricing.sql` - Manager role, pricing settings, updated_at
- `0004_multi_tier_system.sql` - Tiers table, multi-tier alerts, notifications, Prime/Exclusive tiers

## Deployment to Cloudflare Pages

### Prerequisites
1. Cloudflare API key configured (via Deploy tab)
2. Database migrations applied to production
3. Project name stored in meta_info

### Production Deployment
```bash
# 1. Build the project
npm run build

# 2. Apply migrations to production D1 database (FIRST TIME ONLY)
npx wrangler d1 migrations apply signalstack-production

# 3. Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name signalstack

# 4. Set environment variables (if needed)
npx wrangler pages secret put API_KEY --project-name signalstack
```

### Production URLs
- Main: `https://signalstack.pages.dev`
- Branch: `https://main.signalstack.pages.dev`

## Known Issues & Notes

### D1 Local Development
- `wrangler pages dev` creates a separate D1 database instance than `wrangler d1`
- After clearing `.wrangler/state`, migrations need to be reapplied
- Use `npx wrangler d1 migrations apply signalstack-production --local` after fresh starts

### Testing Locally
The local development environment requires proper D1 migration setup. If you encounter "table does not exist" errors:

1. Clear state: `rm -rf .wrangler/state/v3/d1`
2. Restart PM2: `pm2 restart signalstack`  
3. Apply migrations: `npx wrangler d1 migrations apply signalstack-production --local`
4. Test endpoints with curl or browser

## Contributing
1. Create feature branch
2. Make changes
3. Test locally with PM2
4. Commit with descriptive message
5. Push to GitHub
6. Deploy to Cloudflare Pages for production testing

## Last Updated
April 8, 2026

## Support
For issues or questions, contact the development team via GitHub issues.
