#!/usr/bin/env python3
"""
Auto-seed local D1 SQLite databases used by wrangler pages dev.
Run this script after starting the server to ensure all DB files are seeded.
"""
import sqlite3, glob, time, sys

def seed_all():
    sql1 = open('/home/user/webapp/migrations/0001_initial.sql').read()
    sql2 = open('/home/user/webapp/migrations/0002_seed.sql').read()
    db_dir = '/home/user/webapp/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/'
    seeded = 0
    for db_path in glob.glob(db_dir + '*.sqlite'):
        try:
            conn = sqlite3.connect(db_path)
            tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
            table_names = [t[0] for t in tables]
            if 'users' not in table_names:
                conn.executescript(sql1)
                conn.executescript(sql2)
                conn.commit()
                print(f'✓ Seeded: {db_path[-24:]}')
                seeded += 1
            else:
                count = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
                print(f'✓ Already seeded: {db_path[-24:]} ({count} users)')
            conn.close()
        except Exception as e:
            print(f'✗ Error: {e}')
    return seeded

# Wait for DB files to be created by wrangler
for attempt in range(5):
    db_dir = '/home/user/webapp/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/'
    files = glob.glob(db_dir + '*.sqlite')
    if files:
        break
    print(f'Waiting for DB files... ({attempt+1}/5)')
    time.sleep(2)

seed_all()
print('Done!')
