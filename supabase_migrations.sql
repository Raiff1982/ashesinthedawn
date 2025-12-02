-- ============================================================================
-- CoreLogic Studio - Supabase Database Schema
-- ============================================================================
-- This file contains all SQL migrations needed to set up the database
-- Run these migrations in your Supabase project
-- ============================================================================

-- ============================================================================
-- 1. CODETTE ACTIVITY LOGS TABLE
-- ============================================================================
-- Tracks all AI activities, user actions, and system events
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_codette_activity_logs_user_id 
  ON public.codette_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_codette_activity_logs_created_at 
  ON public.codette_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_codette_activity_logs_source 
  ON public.codette_activity_logs(source);

-- Enable RLS (Row Level Security)
ALTER TABLE public.codette_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own logs
CREATE POLICY IF NOT EXISTS "Users can view their own activity logs"
  ON public.codette_activity_logs
  FOR SELECT
  USING (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'));

-- RLS Policy: Users can insert their own logs
CREATE POLICY IF NOT EXISTS "Users can insert their own activity logs"
  ON public.codette_activity_logs
  FOR INSERT
  WITH CHECK (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'));

-- RLS Policy: Users can delete their own logs
CREATE POLICY IF NOT EXISTS "Users can delete their own activity logs"
  ON public.codette_activity_logs
  FOR DELETE
  USING (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'));

-- ============================================================================
-- 2. CODETTE PERMISSIONS TABLE
-- ============================================================================
-- Manages user permissions for AI actions
CREATE TABLE IF NOT EXISTS public.codette_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('allow', 'ask', 'deny')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, action_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_codette_permissions_user_id 
  ON public.codette_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_codette_permissions_action 
  ON public.codette_permissions(action_type);

-- Enable RLS
ALTER TABLE public.codette_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own permissions
CREATE POLICY IF NOT EXISTS "Users can view their own permissions"
  ON public.codette_permissions
  FOR SELECT
  USING (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'));

-- RLS Policy: Users can update their own permissions
CREATE POLICY IF NOT EXISTS "Users can update their own permissions"
  ON public.codette_permissions
  FOR UPDATE
  USING (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'));

-- RLS Policy: Users can insert their own permissions
CREATE POLICY IF NOT EXISTS "Users can insert their own permissions"
  ON public.codette_permissions
  FOR INSERT
  WITH CHECK (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'));

-- ============================================================================
-- 3. CODETTE CONTROL SETTINGS TABLE
-- ============================================================================
-- Stores user-specific settings for Codette control center
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_codette_control_settings_user_id 
  ON public.codette_control_settings(user_id);

-- Enable RLS
ALTER TABLE public.codette_control_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own settings
CREATE POLICY IF NOT EXISTS "Users can view their own control settings"
  ON public.codette_control_settings
  FOR SELECT
  USING (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'));

-- RLS Policy: Users can update their own settings
CREATE POLICY IF NOT EXISTS "Users can update their own control settings"
  ON public.codette_control_settings
  FOR UPDATE
  USING (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'));

-- RLS Policy: Users can insert their own settings
CREATE POLICY IF NOT EXISTS "Users can insert their own control settings"
  ON public.codette_control_settings
  FOR INSERT
  WITH CHECK (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'));

-- ============================================================================
-- 4. CHAT HISTORY TABLE
-- ============================================================================
-- Stores chat conversation history
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id 
  ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_updated_at 
  ON public.chat_history(updated_at DESC);

-- Enable RLS
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own chat history
CREATE POLICY IF NOT EXISTS "Users can view their own chat history"
  ON public.chat_history
  FOR SELECT
  USING (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'));

-- RLS Policy: Users can update their own chat history
CREATE POLICY IF NOT EXISTS "Users can update their own chat history"
  ON public.chat_history
  FOR UPDATE
  USING (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'));

-- RLS Policy: Users can insert their own chat history
CREATE POLICY IF NOT EXISTS "Users can insert their own chat history"
  ON public.chat_history
  FOR INSERT
  WITH CHECK (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'));

-- RLS Policy: Users can delete their own chat history
CREATE POLICY IF NOT EXISTS "Users can delete their own chat history"
  ON public.chat_history
  FOR DELETE
  USING (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'));

-- ============================================================================
-- 5. AI CACHE TABLE (for analysis results)
-- ============================================================================
-- Stores cached AI analysis and predictions
CREATE TABLE IF NOT EXISTS public.ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  cache_key TEXT NOT NULL UNIQUE,
  response JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_cache_cache_key 
  ON public.ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_user_id 
  ON public.ai_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires_at 
  ON public.ai_cache(expires_at);

-- Enable RLS
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own cache
CREATE POLICY IF NOT EXISTS "Users can view their own cache"
  ON public.ai_cache
  FOR SELECT
  USING (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub') OR user_id IS NULL);

-- RLS Policy: Users can insert their own cache
CREATE POLICY IF NOT EXISTS "Users can insert their own cache"
  ON public.ai_cache
  FOR INSERT
  WITH CHECK (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub') OR user_id IS NULL);

-- RLS Policy: Users can delete their own cache
CREATE POLICY IF NOT EXISTS "Users can delete their own cache"
  ON public.ai_cache
  FOR DELETE
  USING (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub') OR user_id IS NULL);

-- ============================================================================
-- 6. PROJECTS TABLE (for cloud sync)
-- ============================================================================
-- Stores DAW projects in the cloud
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id 
  ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at 
  ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_is_archived 
  ON public.projects(is_archived);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own projects
CREATE POLICY IF NOT EXISTS "Users can view their own projects"
  ON public.projects
  FOR SELECT
  USING (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'));

-- RLS Policy: Users can create projects
CREATE POLICY IF NOT EXISTS "Users can create projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'));

-- RLS Policy: Users can update their own projects
CREATE POLICY IF NOT EXISTS "Users can update their own projects"
  ON public.projects
  FOR UPDATE
  USING (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'));

-- RLS Policy: Users can delete their own projects
CREATE POLICY IF NOT EXISTS "Users can delete their own projects"
  ON public.projects
  FOR DELETE
  USING (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'));

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

-- Apply trigger to all tables
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

-- ============================================================================
-- MIGRATION NOTES:
-- ============================================================================
-- 1. Run this entire SQL file in Supabase SQL Editor
-- 2. All tables have Row Level Security (RLS) enabled
-- 3. RLS policies are preconfigured for user_id based access control
-- 4. Automatic timestamps (created_at, updated_at) are maintained via triggers
-- 5. Indexes are created for query performance
-- 6. The local fallback in supabase.ts will be used if these tables don't exist
--
-- IMPORTANT: If using Supabase with authentication, update the RLS policies
-- to use your auth.uid() function instead of CURRENT_USER_ID()
-- ============================================================================
