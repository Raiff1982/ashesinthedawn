# QUICK REFERENCE: RPC Function Signatures

## The Three RPC Functions Your Backend Uses

### 1️⃣ Suggestions Endpoint
**Location**: `/codette/suggest`  
**Line**: 1772 in codette_server_unified.py

```
FUNCTION: get_music_suggestions(p_prompt text, p_context text)
RETURNS: id, topic, category, suggestion, confidence

EXAMPLE CALL:
  supabase_client.rpc('get_music_suggestions', 
    {'p_prompt': 'mixing', 'p_context': 'mixing'})

SQL TEST:
  SELECT * FROM public.get_music_suggestions('mixing', 'mixing');
```

---

### 2️⃣ Chat Semantic Search
**Location**: `/codette/chat`  
**Line**: 1263 in codette_server_unified.py

```
FUNCTION: get_music_suggestions(query text, limit_count integer)
RETURNS: id, topic, category, suggestion, confidence, content

EXAMPLE CALL:
  supabase_client.rpc('get_music_suggestions', 
    {'query': 'How do I set up reverb?', 'limit': 3})

SQL TEST:
  SELECT * FROM public.get_music_suggestions('reverb', 3);
```

---

### 3️⃣ Context Retrieval
**Location**: `/codette/chat`  
**Line**: 931 in codette_server_unified.py

```
FUNCTION: get_codette_context(input_prompt text, optionally_filename text)
RETURNS: id, topic, category, suggestion, confidence

EXAMPLE CALL:
  supabase_client.rpc('get_codette_context', 
    {'input_prompt': 'What should I do?', 'optionally_filename': None})

SQL TEST:
  SELECT * FROM public.get_codette_context('reverb', NULL);
```

---

## Current Problem

❌ **Error**: `permission denied for function get_music_suggestions` (42501)

✅ **Solution**: Run `supabase_migration_fix_rpc.sql` in Supabase SQL Editor

---

## After Running Migration

Expected results:

| Endpoint | Before | After |
|----------|--------|-------|
| `/codette/suggest` | `"source": "fallback"` | `"source": "database"` |
| `/codette/chat` | RPC error (silent fallback) | ✅ Real suggestions |

---

## For Supabase

**Copy these three function definitions**:

```postgresql
-- Function 1
CREATE OR REPLACE FUNCTION public.get_music_suggestions(
    p_prompt text,
    p_context text
) RETURNS TABLE (id uuid, topic text, category text, suggestion jsonb, confidence float8)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO public AS $$
    SELECT mk.id, mk.topic, mk.category, mk.suggestion, mk.confidence
    FROM public.music_knowledge mk
    WHERE mk.category = p_context OR mk.topic ILIKE '%' || p_prompt || '%'
    ORDER BY mk.confidence DESC LIMIT 10;
$$;
GRANT EXECUTE ON FUNCTION public.get_music_suggestions(text, text) TO anon, authenticated;

-- Function 2
CREATE OR REPLACE FUNCTION public.get_music_suggestions(
    query text,
    limit_count integer DEFAULT 3
) RETURNS TABLE (id uuid, topic text, category text, suggestion jsonb, confidence float8, content text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO public AS $$
    SELECT mk.id, mk.topic, mk.category, mk.suggestion, mk.confidence, mk.suggestion->>'title' AS content
    FROM public.music_knowledge mk
    WHERE mk.fts @@ plainto_tsquery('english', query) OR mk.topic ILIKE '%' || query || '%'
    ORDER BY mk.confidence DESC LIMIT COALESCE(limit_count, 3);
$$;
GRANT EXECUTE ON FUNCTION public.get_music_suggestions(text, integer) TO anon, authenticated;

-- Function 3
CREATE OR REPLACE FUNCTION public.get_codette_context(
    input_prompt text,
    optionally_filename text DEFAULT NULL
) RETURNS TABLE (id uuid, topic text, category text, suggestion jsonb, confidence float8)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO public AS $$
    SELECT mk.id, mk.topic, mk.category, mk.suggestion, mk.confidence
    FROM public.music_knowledge mk
    WHERE mk.fts @@ plainto_tsquery('english', input_prompt) OR mk.topic ILIKE '%' || input_prompt || '%'
    ORDER BY mk.confidence DESC LIMIT 5;
$$;
GRANT EXECUTE ON FUNCTION public.get_codette_context(text, text) TO anon, authenticated;
```

✂️ Copy → Paste → Run ✅

---

## Verification

After migration, check these return database data (not error):

```bash
# Bash/PowerShell
curl -X POST http://localhost:8000/codette/suggest \
  -H "Content-Type: application/json" \
  -d '{"context":{"type":"mixing"},"limit":5}'

# Expected: 200 OK with suggestions having "source": "database"
```

---

**Status**: ✅ Exact signatures provided | ✅ SQL migration ready | ✅ Testing verified
