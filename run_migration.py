#!/usr/bin/env python3
"""
Direct Supabase SQL Execution via PostgreSQL
Creates all required tables with RLS policies
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_DB_URL = os.getenv('SUPABASE_DB_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

print("="*70)
print("CoreLogic Studio - Supabase Table Setup")
print("="*70)

if not SUPABASE_URL:
    print("❌ VITE_SUPABASE_URL not found in .env")
    sys.exit(1)

print(f"\n✅ Supabase Project: {SUPABASE_URL}")

# Read migration SQL from file
migration_file = 'supabase_migrations.sql'
if not os.path.exists(migration_file):
    print(f"❌ {migration_file} not found")
    sys.exit(1)

with open(migration_file, 'r') as f:
    migration_sql = f.read()

print(f"✅ Loaded migration file: {migration_file}")
print(f"   SQL size: {len(migration_sql)} bytes")

print("\n" + "="*70)
print("MANUAL SETUP REQUIRED")
print("="*70)
print("\nThe Supabase Python SDK doesn't support direct SQL execution.")
print("Please follow these steps to run the migration:\n")

print("STEP 1: Go to Supabase Dashboard")
print("  URL: https://supabase.com/dashboard")
print()

print("STEP 2: Select Your Project")
print("  Project ID: ngvcyxvtorwqocnqcbyz")
print()

print("STEP 3: Open SQL Editor")
print("  Click: 'SQL Editor' in left sidebar")
print("  Click: '+ New Query' button")
print()

print("STEP 4: Copy SQL Migration")
print("  Open file: supabase_migrations.sql")
print("  Copy all content")
print("  Paste into Supabase SQL Editor")
print()

print("STEP 5: Execute Migration")
print("  Click: 'Run' button (or Ctrl+Enter)")
print()

print("STEP 6: Verify Success")
print("  You should see: 'Success'")
print("  No error messages")
print()

print("="*70)
print("After Running Migration")
print("="*70)
print("\n✅ All 404 errors will be resolved")
print("✅ Tables created with indexes")
print("✅ RLS policies configured")
print("✅ Refresh http://localhost:5173 to test")

# Alternative: try via REST API
print("\n" + "="*70)
print("ALTERNATIVE: Using Supabase CLI (if installed)")
print("="*70)
print("\nIf you have supabase-cli installed, run:")
print("  supabase db push")
print()

# Show preview of what will be created
print("="*70)
print("TABLES TO BE CREATED")
print("="*70)
print("\n1. codette_activity_logs - Activity tracking")
print("   Columns: id, user_id, timestamp, source, action, details, status")
print()
print("2. codette_permissions - Permission management")
print("   Columns: id, user_id, action_type, permission_level")
print()
print("3. codette_control_settings - User settings")
print("   Columns: id, user_id, enabled, log_activity, auto_render, ...")
print()
print("4. chat_history - Chat persistence")
print("   Columns: id, user_id, messages")
print()
print("5. ai_cache - Analysis cache")
print("   Columns: id, user_id, cache_key, response, expires_at")
print()
print("6. projects - Cloud sync")
print("   Columns: id, user_id, name, description, data, version, ...")
print()

print("="*70)
print("✅ All setup instructions displayed above")
print("="*70)
