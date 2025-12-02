# SQL Migration Execution Guide

## Status: READY TO EXECUTE ✅

Your Supabase credentials are configured and validated. You're ready to execute the database schema migration.

## What This Migration Does

This SQL migration applies 12 critical database fixes:

1. **Add vector column** to `music_knowledge` table (for embeddings)
2. **Rename table** from `"what to do"` to `what_to_do` (fix invalid table name)
3. **Recreate `codette_files`** table with correct primary key
4. **Drop `quantum_cocoons`** duplicate table
5. **Create 6 performance indexes**:
   - IVFFLAT index for embedding similarity search
   - GIN index for full-text search
   - B-tree indexes for faster queries on chat_history, api_metrics, benchmark_results, competitor_analysis
6. **Enable PostgreSQL extensions**: vector (for embeddings)

## How to Execute

### Option 1: Using Supabase Dashboard (Recommended - Easy)

**Step 1: Open Supabase Dashboard**
- Go to https://supabase.com/dashboard
- Click your project: "ashesinthedawn"

**Step 2: Open SQL Editor**
- Left sidebar → "SQL Editor"
- Click "New query"

**Step 3: Copy Migration SQL**
- Run this command to display the migration SQL:
  ```powershell
  python execute_migration.py
  ```
- Copy all SQL from the section between the `------` lines
- Paste into the Supabase SQL editor

**Step 4: Execute**
- Click "Run" button (or Ctrl+Enter)
- Wait for completion (~2-3 seconds)
- Look for success message

**Step 5: Verify**
- Go to "Database" → "Tables" in left sidebar
- Should see:
  - ✅ `music_knowledge` table with `embedding` column
  - ✅ `what_to_do` table (renamed from "what to do")
  - ✅ `codette_files` table with correct structure
  - ❌ `quantum_cocoons` should be gone

### Option 2: Using Python SDK (Advanced)

If you want to automate this in your deployment pipeline:

```python
from supabase import create_client
import os

# Load credentials
url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Connect with service role (admin permissions)
client = create_client(url, key)

# Read migration SQL
with open("supabase/migrations/fix_schema_issues.sql") as f:
    sql = f.read()

# Execute (requires additional setup - see Supabase docs)
# This would need py-postgres or similar for raw SQL execution
```

## Current System Status

| Component | Status | Details |
|-----------|--------|---------|
| Backend | ✅ Running | Port 8000, all endpoints healthy |
| Frontend | ✅ Running | Port 5173, Vite dev server active |
| TypeScript | ✅ Valid | 0 compilation errors |
| Python | ✅ Ready | All modules importing |
| Supabase Creds | ✅ Configured | URL and keys verified |
| Database | ⏳ Awaiting Migration | Schema fixes pending |

## Next Steps After Migration

1. **Verify Database Structure** (2 min)
   - Check tables and indexes created
   - Confirm embedding column exists

2. **Test End-to-End Flow** (5 min)
   - Run React hook tests
   - Verify API endpoints connect to database
   - Test real-time subscriptions

3. **Implement Row-Level Security** (10 min)
   - Add RLS policies to protect user data
   - Ensure users can only access their own records

4. **Deploy to Production** (Final phase)
   - Configure production environment variables
   - Run migrations on production database
   - Set up monitoring and alerting

## Troubleshooting

**Problem: "Permission denied" error**
- Make sure you're using `SUPABASE_SERVICE_ROLE_KEY` (admin key)
- Don't use the anon key for migrations

**Problem: "Extension vector not found"**
- This is handled by the migration: `CREATE EXTENSION IF NOT EXISTS vector`
- If it fails, enable it manually in Supabase dashboard

**Problem: "Table already exists"**
- The migration uses `DROP IF EXISTS` to handle this
- Safe to run multiple times

**Problem: "Invalid table name"**
- The migration fixes the `"what to do"` → `what_to_do` rename
- This is one of the key fixes applied

## Commands Reference

```powershell
# Display migration SQL
python execute_migration.py

# Verify backend is running
curl http://localhost:8000/health

# Test database connection (after migration)
python -c "from daw_core.supabase_client import get_supabase_client; c = get_supabase_client(); print('Connected!' if c else 'Failed')"

# Run integration tests
python integration_tests.py
```

---

**Ready to proceed?** Execute `python execute_migration.py` to display the SQL, then paste it into the Supabase dashboard!
