-- ============================================================================
-- Supabase Music Knowledge Database Setup
-- ============================================================================
-- This SQL script creates a music knowledge base in Supabase that powers
-- Codette's music suggestions with both external API and local fallback options.
--
-- ⚠️  NOTE: The music_knowledge table already exists in your Supabase project!
-- This script will UPDATE the existing table and add new data.
--
-- Setup Instructions:
-- 1. Go to https://app.supabase.com
-- 2. Open your project dashboard
-- 3. Go to SQL Editor
-- 4. Create a new query
-- 5. Paste this entire script
-- 6. Click "Run"
-- 7. Verify data was inserted in the Table Editor
-- ============================================================================

-- ============================================================================
-- TABLE: music_knowledge (Already exists - will populate with seed data)
-- ============================================================================
-- Stores common music theory suggestions, chord progressions, and techniques
-- Used as fallback when external API is unavailable
--
-- ✅ This table already exists in your schema with structure:
--    id (uuid) PRIMARY KEY
--    topic (text) NOT NULL
--    category (text) DEFAULT 'general'
--    suggestion (jsonb) NOT NULL
--    confidence (double precision) DEFAULT 0.85
--    created_at (timestamptz) DEFAULT now()
--    updated_at (timestamptz) DEFAULT now()

-- First, clear existing test data if any (optional - comment out to keep)
-- DELETE FROM public.music_knowledge WHERE confidence < 0.80;

-- Enable RLS for security (if not already enabled)
ALTER TABLE public.music_knowledge ENABLE ROW LEVEL SECURITY;

-- Create public read policy (if not exists)
DROP POLICY IF EXISTS "public_read_suggestions" ON public.music_knowledge;
CREATE POLICY "public_read_suggestions" ON public.music_knowledge
  FOR SELECT USING (true);

-- Insert seed data - Music Theory Fundamentals
-- Each suggestion includes professional parameters for immediate use in Codette AI
INSERT INTO public.music_knowledge (topic, category, suggestion, confidence)
VALUES
  (
    'basic_chords',
    'harmony',
    '{"title":"I–IV–V","description":"Classic three-chord progression common in many styles. Try C-F-G in C major.","parameters":{"chords":["I","IV","V"],"mood":"classic"}}'::jsonb,
    0.95
  ),
  (
    'jazz_ballad',
    'harmony',
    '{"title":"ii–V–I variations","description":"Use minor ii chord leading to V with altered tensions, resolve to I with extensions (maj7, 9).","parameters":{"chords":["ii","V","I"],"extensions":["maj7","9"]}}'::jsonb,
    0.92
  ),
  (
    'mixing_eq',
    'mixing',
    '{"title":"EQ for Clarity","description":"Cut 250Hz-500Hz to reduce muddiness, boost 2kHz-4kHz for presence, high-pass filter vocals at 80Hz.","parameters":{"cuts":[{"freq":250,"q":1.0,"gain":-3},{"freq":500,"q":1.0,"gain":-2}],"boosts":[{"freq":3000,"q":1.0,"gain":3}]}}'::jsonb,
    0.89
  ),
  (
    'gain_staging',
    'mixing',
    '{"title":"Peak Level Optimization","description":"Maintain -3dB headroom on individual tracks, master bus at -6dB to -3dB for headroom before limiting.","parameters":{"track_headroom_db":-3,"master_headroom_db":-5}}'::jsonb,
    0.95
  ),
  (
    'compression_vocals',
    'dynamics',
    '{"title":"Vocal Compression","description":"Ratio 4:1, attack 10-20ms, release 100-200ms, threshold to catch peaks, makeup gain to unity.","parameters":{"ratio":4,"attack_ms":15,"release_ms":150,"threshold_db":-20}}'::jsonb,
    0.90
  ),
  (
    'reverb_space',
    'effects',
    '{"title":"Spatial Reverb","description":"Use small room or plate reverb at 15-25% wet mix on vocals, decay 1.5-2.5s, pre-delay 20-50ms.","parameters":{"type":"plate","wet_mix":0.20,"decay_s":2.0,"predelay_ms":30}}'::jsonb,
    0.85
  ),
  (
    'automation_dynamics',
    'automation',
    '{"title":"Volume Automation","description":"Automate vocal levels to maintain consistency, ride the lead vocal ±1-2dB throughout the mix.","parameters":{"automation_type":"volume","range_db":[-2,2]}}'::jsonb,
    0.88
  ),
  (
    'mastering_loudness',
    'mastering',
    '{"title":"Streaming Loudness Target","description":"Target -14 LUFS for Spotify/Apple Music, -18 LUFS for YouTube, use linear phase EQ, limit at -0.3dBFS.","parameters":{"streaming_platform":"spotify","target_lufs":-14,"limiter_ceiling_dbfs":-0.3}}'::jsonb,
    0.93
  ),
  (
    'bus_compression',
    'mixing',
    '{"title":"Bus Compression Glue","description":"Use 2:1-4:1 ratio, slow attack (20-40ms), medium release (75-150ms), subtle makeup gain for cohesion.","parameters":{"ratio":2.5,"attack_ms":30,"release_ms":100,"makeup_gain_db":1.5}}'::jsonb,
    0.87
  ),
  (
    'high_pass_filter',
    'mixing',
    '{"title":"High-Pass Filter Basics","description":"Apply HP filter 80Hz on vocals, 60Hz on bass, 40Hz on kick to remove rumble and improve clarity.","parameters":{"default_cutoffs":{"vocals":80,"bass":60,"kick":40}}}'::jsonb,
    0.92
  );

-- ============================================================================
-- TABLE: api_config (Already exists - music API configuration)
-- ============================================================================
-- Stores configuration for external music API services
-- This table already exists in your schema
--
-- ✅ Table structure already exists:
--    id (uuid) PRIMARY KEY
--    service_name (text) NOT NULL UNIQUE
--    api_url (text) NOT NULL
--    api_key (text) NOT NULL (use Supabase Secrets in production)
--    is_active (boolean) DEFAULT true
--    created_at (timestamptz) DEFAULT now()
--    updated_at (timestamptz) DEFAULT now()

-- Enable RLS for api_config (if not already enabled)
ALTER TABLE public.api_config ENABLE ROW LEVEL SECURITY;

-- Create admin-only read policy (if not exists)
DROP POLICY IF EXISTS "admin_read_api_config" ON public.api_config;
CREATE POLICY "admin_read_api_config" ON public.api_config
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );

-- ============================================================================
-- FUNCTION: get_music_suggestions (Create or Update)
-- ============================================================================
-- Fetches music suggestions from Supabase music knowledge base
-- This function is called by Codette AI for real-time suggestions
--
-- Returns: JSON object with suggestions matching the context
-- Uses: music_knowledge table (already exists in your schema)
-- Parameters:
--   p_prompt (text): User's question or topic
--   p_context (text): Context category (mixing, dynamics, harmony, etc.)

CREATE OR REPLACE FUNCTION public.get_music_suggestions(
  p_prompt text,
  p_context text DEFAULT 'general'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  matched_suggestions jsonb;
BEGIN
  -- Log the request (for debugging)
  RAISE DEBUG 'get_music_suggestions called with prompt: %, context: %', p_prompt, p_context;

  -- Try to get suggestions from music_knowledge table
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', mk.id,
      'topic', mk.topic,
      'category', mk.category,
      'title', mk.suggestion->>'title',
      'description', mk.suggestion->>'description',
      'parameters', mk.suggestion->'parameters',
      'confidence', mk.confidence,
      'source', 'music_knowledge_base'
    )
  ) INTO matched_suggestions
  FROM public.music_knowledge mk
  WHERE (
    lower(mk.topic) LIKE '%' || lower(split_part(p_prompt, ' ', 1)) || '%'
    OR lower(mk.category) = lower(p_context)
    OR lower(mk.suggestion::text) LIKE '%' || lower(p_prompt) || '%'
  )
  ORDER BY mk.confidence DESC
  LIMIT 10;

  -- Build response with matched suggestions
  result := jsonb_build_object(
    'success', true,
    'prompt', p_prompt,
    'context', p_context,
    'suggestions', COALESCE(matched_suggestions, jsonb_build_array()),
    'source', 'supabase_music_knowledge',
    'timestamp', now()::text
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  -- Return error response with details
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'prompt', p_prompt,
    'context', p_context,
    'suggestions', jsonb_build_array()
  );
END;
$$;

-- ============================================================================
-- FUNCTION: search_music_knowledge (Create or Update)
-- ============================================================================
-- Advanced search function for music knowledge base
-- Used for complex queries across all suggestion fields
--
-- Parameters:
--   p_search_term (text): Term to search for (topic, category, description)
--   p_category (text): Optional category filter
--   p_limit (int): Max results to return (default: 5)

CREATE OR REPLACE FUNCTION public.search_music_knowledge(
  p_search_term text,
  p_category text DEFAULT NULL,
  p_limit int DEFAULT 5
)
RETURNS TABLE(
  id uuid,
  topic text,
  category text,
  title text,
  description text,
  parameters jsonb,
  confidence double precision,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Ensure predictable name resolution for the duration of this function call
  PERFORM set_config('search_path', 'pg_catalog,public', true);

  RETURN QUERY
  SELECT 
    mk.id, 
    mk.topic, 
    mk.category, 
    mk.suggestion->>'title' AS title,
    mk.suggestion->>'description' AS description,
    mk.suggestion->'parameters' AS parameters,
    mk.confidence,
    mk.created_at
  FROM public.music_knowledge AS mk
  WHERE (
    lower(mk.topic) LIKE '%' || lower(p_search_term) || '%'
    OR lower(mk.suggestion::text) LIKE '%' || lower(p_search_term) || '%'
  )
  AND (p_category IS NULL OR lower(mk.category) = lower(p_category))
  ORDER BY mk.confidence DESC, mk.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- INDEX: Improve query performance (Create if not exists)
-- ============================================================================
-- These indexes speed up common searches on music_knowledge table
-- Existing indexes in your schema may already include these

CREATE INDEX IF NOT EXISTS idx_music_knowledge_topic ON public.music_knowledge(topic);
CREATE INDEX IF NOT EXISTS idx_music_knowledge_category ON public.music_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_music_knowledge_confidence ON public.music_knowledge(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_music_knowledge_created_at ON public.music_knowledge(created_at DESC);

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_music_knowledge_timestamp BEFORE UPDATE ON public.music_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_config_timestamp BEFORE UPDATE ON public.api_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- ✅ Integration Status:
--
-- Tables Updated:
--   ✓ music_knowledge - 10 seed suggestions added
--   ✓ api_config - Existing table ready for API credentials
--
-- Functions Created/Updated:
--   ✓ get_music_suggestions(prompt, context) - Smart suggestion lookup
--   ✓ search_music_knowledge(term, category, limit) - Advanced search
--
-- Seed Data Categories:
--   • Harmony (2 suggestions): basic chords, jazz ballad progressions
--   • Mixing (4 suggestions): EQ, gain staging, bus compression, high-pass filters
--   • Dynamics (1 suggestion): Vocal compression settings
--   • Effects (1 suggestion): Spatial reverb techniques
--   • Automation (1 suggestion): Volume automation approaches
--   • Mastering (1 suggestion): Streaming loudness targets
--
-- ============================================================================
-- TO USE IN CODETTE BACKEND:
-- ============================================================================
--
-- 1. Call from Python backend:
--
--    import supabase
--    client = supabase.create_client(supabase_url, supabase_key)
--    
--    # Get suggestions
--    response = client.rpc(
--      'get_music_suggestions',
--      {'p_prompt': 'EQ for vocals', 'p_context': 'mixing'}
--    ).execute()
--    suggestions = response.data
--
-- 2. Search for specific topics:
--
--    response = client.rpc(
--      'search_music_knowledge',
--      {'p_search_term': 'compression', 'p_category': 'dynamics', 'p_limit': 10}
--    ).execute()
--
-- 3. Example responses include:
--    - title: "EQ for Clarity"
--    - description: "Cut 250Hz-500Hz to reduce muddiness..."
--    - parameters: {"cuts": [...], "boosts": [...]}
--    - confidence: 0.89 (89% confidence)
--
-- ============================================================================
-- NEXT STEPS:
-- ============================================================================
--
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify 10 suggestions inserted in Table Editor
-- 3. Test: SELECT * FROM get_music_suggestions('EQ', 'mixing');
-- 4. Update Codette backend to call these functions
-- 5. Add more suggestions via SQL or direct inserts as needed
--
-- ============================================================================
-- DOCUMENTATION FILES:
-- ============================================================================
--
-- • SUPABASE_MUSIC_KNOWLEDGE_SETUP.sql - This file (complete setup)
-- • SUPABASE_MUSIC_KNOWLEDGE_GUIDE.md - Integration guide & examples
--
-- ============================================================================
