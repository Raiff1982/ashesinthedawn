# RPC Function Signatures - Backend Analysis

**Current Date**: December 2, 2025  
**Analysis**: Exact RPC signatures as called by `codette_server_unified.py`

---

## RPC Functions Called by Backend

### 1. `get_music_suggestions` - TWO DIFFERENT SIGNATURES

#### **Call #1: In `/codette/suggest` endpoint (Line 1772)**
```python
supabase_client.rpc(
    'get_music_suggestions',
    {
        'p_prompt': context_type,      # text parameter
        'p_context': context_type      # text parameter
    }
).execute()
```

**Signature**: `get_music_suggestions(text, text)`
- **Parameter 1**: `p_prompt` (text) - The context type (e.g., "mixing", "mastering")
- **Parameter 2**: `p_context` (text) - The context type (duplicate in current code)
- **Return type**: List of suggestion objects (or dict with suggestions key)

**Example call**:
```sql
SELECT * FROM public.get_music_suggestions('mixing', 'mixing');
```

---

#### **Call #2: In `/codette/chat` endpoint - Semantic Search (Line 1263)**
```python
supabase_client.rpc(
    'get_music_suggestions',
    {
        'query': request.message,      # text parameter
        'limit': 3                     # integer parameter
    }
).execute()
```

**Signature**: `get_music_suggestions(text, integer)` (DIFFERENT!)
- **Parameter 1**: `query` (text) - The search query/message
- **Parameter 2**: `limit` (integer) - Number of results to return
- **Return type**: List of suggestion objects with 'content' or 'suggestion' field

**Example call**:
```sql
SELECT * FROM public.get_music_suggestions('reverb settings for drums', 3);
```

---

### 2. `get_codette_context` (Line 931)
```python
supabase_client.rpc(
    'get_codette_context',
    {
        'input_prompt': request.message,      # text parameter
        'optionally_filename': None            # nullable parameter
    }
).execute()
```

**Signature**: `get_codette_context(text, ?)`
- **Parameter 1**: `input_prompt` (text) - The user message
- **Parameter 2**: `optionally_filename` (nullable) - Optional filename
- **Return type**: Context object

**Example call**:
```sql
SELECT * FROM public.get_codette_context('What should I do with this track?', NULL);
```

---

## Problem Identified

**CONFLICT**: The backend calls `get_music_suggestions` with TWO DIFFERENT PARAMETER SIGNATURES:

1. **In suggestions endpoint**: `get_music_suggestions(p_prompt text, p_context text)`
2. **In chat endpoint**: `get_music_suggestions(query text, limit integer)`

This suggests either:
- The RPC function is overloaded (same name, different signatures) - **UNLIKELY in SQL**
- The function definition was changed but old code wasn't updated - **MOST LIKELY**
- There should be TWO separate functions - **POSSIBLE**

---

## Required Fix in Supabase

### Option A: Create Both Functions (RECOMMENDED)

**Function 1**: For suggestions endpoint
```sql
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
    SELECT id, topic, category, suggestion, confidence
    FROM public.music_knowledge
    WHERE category = p_context
       OR topic ILIKE '%' || p_prompt || '%'
    LIMIT 5;
$$ SECURITY DEFINER SET search_path TO public;

GRANT EXECUTE ON FUNCTION public.get_music_suggestions(text, text) 
TO anon, authenticated;
```

---

**Function 2**: For chat/semantic search endpoint
```sql
CREATE OR REPLACE FUNCTION public.get_music_suggestions(
    query text,
    limit integer DEFAULT 3
) RETURNS TABLE (
    id uuid,
    topic text,
    category text,
    suggestion jsonb,
    confidence float8,
    content text
) LANGUAGE sql STABLE AS $$
    SELECT 
        id, 
        topic, 
        category, 
        suggestion, 
        confidence,
        suggestion->>'title' AS content
    FROM public.music_knowledge
    WHERE to_tsvector('english', suggestion::text) @@ plainto_tsquery('english', query)
       OR topic ILIKE '%' || query || '%'
    ORDER BY confidence DESC
    LIMIT COALESCE(limit, 3);
$$ SECURITY DEFINER SET search_path TO public;

GRANT EXECUTE ON FUNCTION public.get_music_suggestions(text, integer) 
TO anon, authenticated;
```

---

### Option B: Create One Flexible Function

```sql
CREATE OR REPLACE FUNCTION public.get_music_suggestions(
    p_prompt text,
    p_context text DEFAULT NULL,
    limit_count integer DEFAULT 5
) RETURNS TABLE (
    id uuid,
    topic text,
    category text,
    suggestion jsonb,
    confidence float8
) LANGUAGE sql STABLE AS $$
    SELECT id, topic, category, suggestion, confidence
    FROM public.music_knowledge
    WHERE (p_context IS NULL OR category = p_context)
       AND (p_prompt IS NULL OR topic ILIKE '%' || p_prompt || '%' 
            OR to_tsvector('english', suggestion::text) @@ plainto_tsquery('english', p_prompt))
    ORDER BY confidence DESC
    LIMIT COALESCE(limit_count, 5);
$$ SECURITY DEFINER SET search_path TO public;

GRANT EXECUTE ON FUNCTION public.get_music_suggestions(text) 
TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_music_suggestions(text, text) 
TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_music_suggestions(text, text, integer) 
TO anon, authenticated;
```

---

## Current Error

```
ERROR: permission denied for function get_music_suggestions
Code: 42501
```

**This means**: The function exists but lacks `EXECUTE` permission for the `anon` role (your client is using anon key).

---

## Summary

| Item | Value |
|------|-------|
| **Function Name** | `get_music_suggestions` |
| **Current Signatures** | `(text, text)` AND `(text, integer)` - **CONFLICTING** |
| **Parameters** | See detailed breakdown above |
| **Current Status** | ❌ Permission denied |
| **Data Available** | ✅ Table has 5+ rows |
| **Fix Required** | Create function(s) with proper signatures and grant EXECUTE permission |

---

## Recommended Action

1. Go to Supabase Dashboard → SQL Editor
2. Run the **Option A** functions above (both functions)
3. Test both endpoints:
   ```bash
   # Test 1: Suggestions endpoint
   curl -X POST http://localhost:8000/codette/suggest \
     -H "Content-Type: application/json" \
     -d '{"context":{"type":"mixing"},"limit":5}'
   
   # Test 2: Chat endpoint semantic search
   curl -X POST http://localhost:8000/codette/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"How do I set up a reverb?"}'
   ```

4. If successful, suggestions will show `"source": "database"` instead of `"source": "fallback"`

