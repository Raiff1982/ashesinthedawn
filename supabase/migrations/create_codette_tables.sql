-- =====================================================
-- CoreLogic Studio - Codette Control Tables
-- Created: 2025-01-29
-- Purpose: Support Codette AI control features
-- =====================================================

-- =====================================================
-- 1. codette_permissions table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.codette_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  permission_type TEXT NOT NULL DEFAULT 'default',
  can_record BOOLEAN DEFAULT TRUE,
  can_analyze BOOLEAN DEFAULT TRUE,
  can_suggest BOOLEAN DEFAULT TRUE,
  can_sync BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, permission_type)
);

-- Enable RLS on codette_permissions
ALTER TABLE public.codette_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own permissions
CREATE POLICY "Users can read own permissions"
  ON public.codette_permissions
  FOR SELECT
  USING (user_id = auth.uid()::text OR user_id = 'demo-user');

-- Policy: Allow service role to manage permissions
CREATE POLICY "Service role can manage permissions"
  ON public.codette_permissions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_codette_permissions_user_id 
  ON public.codette_permissions(user_id);

-- =====================================================
-- 2. codette_control_settings table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.codette_control_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);

-- Enable RLS on codette_control_settings
ALTER TABLE public.codette_control_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own settings
CREATE POLICY "Users can read own settings"
  ON public.codette_control_settings
  FOR SELECT
  USING (user_id = auth.uid()::text OR user_id = 'demo-user');

-- Policy: Users can create/update their own settings
CREATE POLICY "Users can manage own settings"
  ON public.codette_control_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text OR user_id = 'demo-user');

CREATE POLICY "Users can update own settings"
  ON public.codette_control_settings
  FOR UPDATE
  USING (user_id = auth.uid()::text OR user_id = 'demo-user')
  WITH CHECK (user_id = auth.uid()::text OR user_id = 'demo-user');

-- Policy: Service role can manage
CREATE POLICY "Service role can manage settings"
  ON public.codette_control_settings
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_codette_control_settings_user_id 
  ON public.codette_control_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_codette_control_settings_key 
  ON public.codette_control_settings(setting_key);

-- =====================================================
-- 3. codette_activity_logs table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.codette_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  status TEXT DEFAULT 'pending',
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on codette_activity_logs
ALTER TABLE public.codette_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own logs
CREATE POLICY "Users can read own activity logs"
  ON public.codette_activity_logs
  FOR SELECT
  USING (user_id = auth.uid()::text OR user_id = 'demo-user');

-- Policy: Users can insert their own logs
CREATE POLICY "Users can create activity logs"
  ON public.codette_activity_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text OR user_id = 'demo-user');

-- Policy: Service role can manage
CREATE POLICY "Service role can manage activity logs"
  ON public.codette_activity_logs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_codette_activity_logs_user_id 
  ON public.codette_activity_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_codette_activity_logs_activity_type 
  ON public.codette_activity_logs(activity_type);

CREATE INDEX IF NOT EXISTS idx_codette_activity_logs_created_at 
  ON public.codette_activity_logs(created_at DESC);

-- =====================================================
-- Insert default permissions for demo user
-- =====================================================
INSERT INTO public.codette_permissions (user_id, permission_type, can_record, can_analyze, can_suggest, can_sync)
VALUES ('demo-user', 'default', TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (user_id, permission_type) DO NOTHING;

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE public.codette_permissions IS 'Manages permissions for Codette AI features per user';
COMMENT ON TABLE public.codette_control_settings IS 'Stores user-specific Codette control settings and preferences';
COMMENT ON TABLE public.codette_activity_logs IS 'Logs all Codette AI activity for auditing and debugging';

COMMENT ON COLUMN public.codette_permissions.can_record IS 'User can start/stop recording sessions';
COMMENT ON COLUMN public.codette_permissions.can_analyze IS 'User can request audio analysis';
COMMENT ON COLUMN public.codette_permissions.can_suggest IS 'User can receive AI suggestions';
COMMENT ON COLUMN public.codette_permissions.can_sync IS 'User can sync DAW state to Codette';

COMMENT ON COLUMN public.codette_control_settings.setting_key IS 'Configuration key (e.g., "recording_quality", "analysis_depth")';
COMMENT ON COLUMN public.codette_control_settings.setting_value IS 'JSON value for the setting';

COMMENT ON COLUMN public.codette_activity_logs.activity_type IS 'Type of activity (e.g., "recording_started", "analysis_completed", "suggestion_accepted")';
COMMENT ON COLUMN public.codette_activity_logs.status IS 'Status of the activity (pending, completed, failed)';
COMMENT ON COLUMN public.codette_activity_logs.result IS 'Result data from the activity';
COMMENT ON COLUMN public.codette_activity_logs.error_message IS 'Error details if activity failed';
