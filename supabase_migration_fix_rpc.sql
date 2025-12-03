-- =====================================================
-- Supabase SQL Migration: Fix get_music_suggestions RPC
-- =====================================================
-- Run this in: Supabase Dashboard → SQL Editor
-- Database: ngvcyxvtorwqocnqcbyz
-- Date: 2025-12-02
-- =====================================================

-- Drop existing function if it exists (WARNING: This may fail if other functions depend on it)
-- DROP FUNCTION IF EXISTS public.get_music_suggestions CASCADE;

-- =====================================================
-- FUNCTION 1: For Suggestions Endpoint
-- get_music_suggestions(text, text)
-- =====================================================
-- Used by: POST /codette/suggest endpoint
-- Parameters:
--   - p_prompt: text (the context type: "mixing", "mastering", "eq", "compression")
--   - p_context: text (the context category)
-- Returns: Table of music knowledge suggestions

CREATE OR REPLACE FUNCTION public.get_music_suggestions(
    p_prompt text,
    p_context text
) RETURNS TABLE (
    id uuid,
    topic text,
    category text,
    suggestion jsonb,
    confidence float8
) LANGUAGE sql STABLE AS $$
    SELECT 
        mk.id, 
        mk.topic, 
        mk.category, 
        mk.suggestion, 
        mk.confidence
    FROM public.music_knowledge mk
    WHERE mk.category = p_context
       OR mk.topic ILIKE '%' || p_prompt || '%'
       OR mk.category ILIKE '%' || p_prompt || '%'
    ORDER BY mk.confidence DESC
    LIMIT 10;
$$ SECURITY DEFINER SET search_path TO public;

-- Grant execute permission to anonymous users and authenticated users
GRANT EXECUTE ON FUNCTION public.get_music_suggestions(text, text) 
TO anon, authenticated;

-- Verify the function was created
SELECT 'Function get_music_suggestions(text, text) created successfully' AS status;

-- =====================================================
-- FUNCTION 2: For Chat/Semantic Search Endpoint
-- get_music_suggestions(text, integer)
-- =====================================================
-- Used by: POST /codette/chat endpoint for semantic search
-- Parameters:
--   - query: text (the search query/user message)
--   - limit_count: integer (number of results to return, default 3)
-- Returns: Table of music knowledge suggestions with content field

CREATE OR REPLACE FUNCTION public.get_music_suggestions(
    query text,
    limit_count integer DEFAULT 3
) RETURNS TABLE (
    id uuid,
    topic text,
    category text,
    suggestion jsonb,
    confidence float8,
    content text
) LANGUAGE sql STABLE AS $$
    SELECT 
        mk.id, 
        mk.topic, 
        mk.category, 
        mk.suggestion, 
        mk.confidence,
        mk.suggestion->>'title' AS content
    FROM public.music_knowledge mk
    WHERE mk.fts @@ plainto_tsquery('english', query)
       OR mk.topic ILIKE '%' || query || '%'
       OR mk.suggestion::text ILIKE '%' || query || '%'
    ORDER BY mk.confidence DESC
    LIMIT COALESCE(limit_count, 3);
$$ SECURITY DEFINER SET search_path TO public;

-- Grant execute permission to anonymous users and authenticated users
GRANT EXECUTE ON FUNCTION public.get_music_suggestions(text, integer) 
TO anon, authenticated;

-- Verify the function was created
SELECT 'Function get_music_suggestions(text, integer) created successfully' AS status;

-- =====================================================
-- FUNCTION 3: For Context Retrieval
-- get_codette_context(text, text)
-- =====================================================
-- Used by: POST /codette/chat endpoint for context retrieval
-- Parameters:
--   - input_prompt: text (the user message)
--   - optionally_filename: text (optional filename for additional context)
-- Returns: First matching music knowledge item or context

CREATE OR REPLACE FUNCTION public.get_codette_context(
    input_prompt text,
    optionally_filename text DEFAULT NULL
) RETURNS TABLE (
    id uuid,
    topic text,
    category text,
    suggestion jsonb,
    confidence float8
) LANGUAGE sql STABLE AS $$
    SELECT 
        mk.id, 
        mk.topic, 
        mk.category, 
        mk.suggestion, 
        mk.confidence
    FROM public.music_knowledge mk
    WHERE mk.fts @@ plainto_tsquery('english', input_prompt)
       OR mk.topic ILIKE '%' || input_prompt || '%'
    ORDER BY mk.confidence DESC
    LIMIT 5;
$$ SECURITY DEFINER SET search_path TO public;

-- Grant execute permission to anonymous users and authenticated users
GRANT EXECUTE ON FUNCTION public.get_codette_context(text, text) 
TO anon, authenticated;

-- Verify the function was created
SELECT 'Function get_codette_context(text, text) created successfully' AS status;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify everything is working:

-- 1. List all functions in the public schema
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'get_%'
ORDER BY routine_name;

-- 2. Test the first function (suggestions endpoint)
-- SELECT * FROM public.get_music_suggestions('mixing', 'mixing') LIMIT 3;

-- 3. Test the second function (chat/semantic search endpoint)
-- SELECT * FROM public.get_music_suggestions('reverb', 3) LIMIT 3;

-- 4. Test the third function (context retrieval)
-- SELECT * FROM public.get_codette_context('How do I use reverb?', NULL) LIMIT 3;

-- 5. Check music_knowledge table
-- SELECT COUNT(*) as total_rows FROM public.music_knowledge;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
-- If you see "Function [name] created successfully" messages above,
-- the migration was successful!
-- 
-- Next steps:
-- 1. Restart the backend server: python codette_server_unified.py
-- 2. Test the endpoints:
--    POST http://localhost:8000/codette/suggest
--    POST http://localhost:8000/codette/chat
-- 3. Check if suggestions now show "source": "database" instead of "fallback"
-- =====================================================
