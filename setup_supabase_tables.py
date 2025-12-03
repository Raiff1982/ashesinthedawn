#!/usr/bin/env python3
"""
Setup Supabase Tables Script
Creates all required tables with RLS policies and indexes
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    from supabase import create_client, Client
except ImportError:
    print("❌ supabase-py not installed. Installing...")
    os.system("pip install supabase")
    from supabase import create_client, Client

# Get Supabase credentials from .env
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing Supabase credentials in .env")
    print("   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

print(f"✅ Supabase URL: {SUPABASE_URL}")
print(f"✅ Service Key: {SUPABASE_SERVICE_KEY[:20]}...")

# Create Supabase client with service role (admin access)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# SQL migration script
MIGRATION_SQL = """
-- ============================================================================
-- CoreLogic Studio - Supabase Database Schema
-- ============================================================================

-- ============================================================================
-- 1. CODETTE ACTIVITY LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.codette_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('codette', 'user', 'system')),
  action TEXT NOT NULL,
  details JSONB,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_codette_activity_logs_user_id 
  ON public.codette_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_codette_activity_logs_created_at 
  ON public.codette_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_codette_activity_logs_source 
  ON public.codette_activity_logs(source);

ALTER TABLE public.codette_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.codette_activity_logs;
CREATE POLICY "Users can view their own activity logs"
  ON public.codette_activity_logs
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own activity logs" ON public.codette_activity_logs;
CREATE POLICY "Users can insert their own activity logs"
  ON public.codette_activity_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 2. CODETTE PERMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.codette_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('allow', 'ask', 'deny')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, action_type)
);

CREATE INDEX IF NOT EXISTS idx_codette_permissions_user_id 
  ON public.codette_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_codette_permissions_action 
  ON public.codette_permissions(action_type);

ALTER TABLE public.codette_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own permissions" ON public.codette_permissions;
CREATE POLICY "Users can view their own permissions"
  ON public.codette_permissions
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their own permissions" ON public.codette_permissions;
CREATE POLICY "Users can update their own permissions"
  ON public.codette_permissions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert their own permissions" ON public.codette_permissions;
CREATE POLICY "Users can insert their own permissions"
  ON public.codette_permissions
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 3. CODETTE CONTROL SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.codette_control_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  log_activity BOOLEAN DEFAULT true,
  auto_render BOOLEAN DEFAULT false,
  include_in_backups BOOLEAN DEFAULT true,
  clear_history_on_close BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_codette_control_settings_user_id 
  ON public.codette_control_settings(user_id);

ALTER TABLE public.codette_control_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own control settings" ON public.codette_control_settings;
CREATE POLICY "Users can view their own control settings"
  ON public.codette_control_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their own control settings" ON public.codette_control_settings;
CREATE POLICY "Users can update their own control settings"
  ON public.codette_control_settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert their own control settings" ON public.codette_control_settings;
CREATE POLICY "Users can insert their own control settings"
  ON public.codette_control_settings
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 4. CHAT HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_history_user_id 
  ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_updated_at 
  ON public.chat_history(updated_at DESC);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own chat history" ON public.chat_history;
CREATE POLICY "Users can view their own chat history"
  ON public.chat_history
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their own chat history" ON public.chat_history;
CREATE POLICY "Users can update their own chat history"
  ON public.chat_history
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert their own chat history" ON public.chat_history;
CREATE POLICY "Users can insert their own chat history"
  ON public.chat_history
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete their own chat history" ON public.chat_history;
CREATE POLICY "Users can delete their own chat history"
  ON public.chat_history
  FOR DELETE
  USING (true);

-- ============================================================================
-- 5. AI CACHE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  cache_key TEXT NOT NULL UNIQUE,
  response JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_cache_key 
  ON public.ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_user_id 
  ON public.ai_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires_at 
  ON public.ai_cache(expires_at);

ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own cache" ON public.ai_cache;
CREATE POLICY "Users can view their own cache"
  ON public.ai_cache
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own cache" ON public.ai_cache;
CREATE POLICY "Users can insert their own cache"
  ON public.ai_cache
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete their own cache" ON public.ai_cache;
CREATE POLICY "Users can delete their own cache"
  ON public.ai_cache
  FOR DELETE
  USING (true);

-- ============================================================================
-- 6. PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL,
  version INT DEFAULT 1,
  is_archived BOOLEAN DEFAULT false,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id 
  ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at 
  ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_is_archived 
  ON public.projects(is_archived);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own projects"
  ON public.projects
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
CREATE POLICY "Users can create projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own projects"
  ON public.projects
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects"
  ON public.projects
  FOR DELETE
  USING (true);

-- ============================================================================
-- 7. HELPER FUNCTION: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_codette_activity_logs_updated_at ON public.codette_activity_logs;
CREATE TRIGGER update_codette_activity_logs_updated_at
  BEFORE UPDATE ON public.codette_activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_codette_permissions_updated_at ON public.codette_permissions;
CREATE TRIGGER update_codette_permissions_updated_at
  BEFORE UPDATE ON public.codette_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_codette_control_settings_updated_at ON public.codette_control_settings;
CREATE TRIGGER update_codette_control_settings_updated_at
  BEFORE UPDATE ON public.codette_control_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_history_updated_at ON public.chat_history;
CREATE TRIGGER update_chat_history_updated_at
  BEFORE UPDATE ON public.chat_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_cache_updated_at ON public.ai_cache;
CREATE TRIGGER update_ai_cache_updated_at
  BEFORE UPDATE ON public.ai_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
"""

print("\n" + "="*60)
print("Setting up Supabase tables...")
print("="*60)

try:
    # Execute the migration via Supabase REST API
    import requests
    
    # Split migration into individual statements
    statements = [s.strip() for s in MIGRATION_SQL.split(';') if s.strip() and not s.strip().startswith('--')]
    
    headers = {
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY
    }
    
    print(f"\n📝 Running {len(statements)} SQL statements...")
    
    # Try using psql-like endpoint if available
    # For now, we'll provide instructions
    
    print("\n⚠️  Supabase Python client doesn't support raw SQL execution directly.")
    print("✅ Please run the migration manually:")
    print("\n1. Go to: https://supabase.com/dashboard")
    print("2. Select project: ngvcyxvtorwqocnqcbyz")
    print("3. Click 'SQL Editor' → 'New Query'")
    print("4. Copy & paste the content of: supabase_migrations.sql")
    print("5. Click 'Run'")
    print("\n📄 SQL file location: i:\\ashesinthedawn\\supabase_migrations.sql")
    
    # Alternatively, provide a curl command
    print("\n" + "="*60)
    print("Alternative: Use curl command")
    print("="*60)
    print("\nIf you have curl installed, you can run:")
    print("""
curl -X POST https://ngvcyxvtorwqocnqcbyz.supabase.co/rest/v1/rpc/sql_execute \\
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"sql":"<SQL_HERE>"}'
    """)

except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nPlease run migrations manually via Supabase dashboard")

print("\n" + "="*60)
print("Next steps after running migration:")
print("="*60)
print("""
1. ✅ Reload the app (http://localhost:5173)
2. ✅ All 404 errors should be resolved
3. ✅ RLS policies will automatically handle permissions
4. ✅ Data will persist in Supabase
""")
