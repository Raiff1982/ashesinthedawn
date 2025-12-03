# Supabase RPC Function Setup: `public.get_codette_context_json`

**Status**: ? Backend updated to call this function  
**Date**: December 3, 2025  
**Purpose**: Retrieve intelligent context for Codette AI from Supabase

---

## ?? Direct REST API Call (cURL)

Your Supabase RPC function can be called directly via REST API:

```bash
curl -X POST "https://<PROJECT_REF>.supabase.co/rest/v1/rpc/get_codette_context_json" \
  -H "apikey: <ANON_OR_SERVICE_KEY>" \
  -H "Authorization: Bearer <ANON_OR_SERVICE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "input_prompt": "hi",
    "optionally_filename": null
  }'
```

### Parameters:
- **PROJECT_REF**: Your Supabase project reference (e.g., `ngvcyxvtorwqocnqcbyz`)
- **ANON_OR_SERVICE_KEY**: Your Supabase anon key or service role key
- **input_prompt**: Search query or user message (required)
- **optionally_filename**: Optional filename filter (nullable)

### Example with Real Credentials:

```bash
curl -X POST "https://ngvcyxvtorwqocnqcbyz.supabase.co/rest/v1/rpc/get_codette_context_json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "input_prompt": "How do I mix vocals?",
    "optionally_filename": null
  }'
```

---

## ?? Python Backend Call

The backend (`codette_server_unified.py`) calls this function via the Supabase Python client:

**Location**: Line 1094-1108 in `codette_server_unified.py`

```python
context_result = supabase_client.rpc(
    'public.get_codette_context_json',
    {
        'input_prompt': request.message,
        'optionally_filename': None
    }
).execute()

# Normalize the response
raw = context_result.data
logger.debug(f"get_codette_context raw (type={type(raw)}): {repr(raw)[:1000]}")

# Handle different response shapes
if isinstance(raw, dict):
    supabase_context = raw
elif isinstance(raw, list):
    if len(raw) == 0:
        supabase_context = {}
    else:
        first = raw[0]
        if isinstance(first, dict):
            supabase_context = first
        else:
            supabase_context = {"items": raw}
else:
    supabase_context = {}
```

---

## ?? Required: Create the Supabase Function

The function **must be created in your Supabase project** for the backend to call it successfully.

### SQL to Create Function:

```sql
CREATE OR REPLACE FUNCTION public.get_codette_context_json(
  input_prompt text,
  optionally_filename text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  snippets json;
  file_row json;
  history json;
BEGIN
  -- Find matching code snippets using full-text search
  SELECT json_agg(json_build_object(
    'filename', c.filename, 
    'snippet', c.snippet
  ))
  INTO snippets
  FROM public.codette c
  WHERE to_tsvector('english', COALESCE(c.snippet, '')) @@ plainto_tsquery('english', input_prompt)
  LIMIT 10;

  -- Get file metadata if filename provided
  IF optionally_filename IS NOT NULL THEN
    SELECT json_build_object(
      'id', f.id,
      'filename', f.filename,
      'file_type', f.file_type,
      'storage_path', f.storage_path,
      'uploaded_at', f.uploaded_at
    )
    INTO file_row
    FROM public.files f
    WHERE f.filename = optionally_filename
    LIMIT 1;
  END IF;

  -- Pull recent chat history
  SELECT json_agg(json_build_object(
    'id', ch.id, 
    'user_id', ch.user_id, 
    'messages', ch.messages, 
    'updated_at', ch.updated_at
  ) ORDER BY ch.updated_at DESC)
  INTO history
  FROM public.chat_history ch
  ORDER BY ch.updated_at DESC
  LIMIT 5;

  -- Build result object
  result := json_build_object(
    'snippets', COALESCE(snippets, '[]'::json),
    'file', COALESCE(file_row, 'null'::json),
    'chat_history', COALESCE(history, '[]'::json)
  );

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_codette_context_json(text, text) TO anon, authenticated;
```

### Steps to Create the Function in Supabase:

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select Your Project**: `ashesinthedawn` (ngvcyxvtorwqocnqcbyz)
3. **Open SQL Editor**: Click "SQL Editor" in left sidebar
4. **Create New Query**: Click "New Query"
5. **Paste the SQL**: Copy the function definition above
6. **Run**: Click "Run" button
7. **Verify**: Check "Functions" in left sidebar - should see `public.get_codette_context_json`

---

## ?? Testing the Function

### Via Direct Supabase SQL:

```sql
-- Test with simple query
SELECT * FROM public.get_codette_context_json('mixing');

-- Test with filename
SELECT * FROM public.get_codette_context_json('audio analysis', 'effect_chain.ts');

-- Test with NULL filename
SELECT * FROM public.get_codette_context_json('reverb settings', NULL);
```

### Via Python Backend:

```bash
# Start the server
python codette_server_unified.py

# In another terminal, test the chat endpoint
curl -X POST http://localhost:8000/codette/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I improve vocals?"}'

# Should return a response with source="daw_template" or other source
```

### Via cURL (REST API):

```bash
# Replace PROJECT_REF and KEY with your actual values
curl -X POST "https://ngvcyxvtorwqocnqcbyz.supabase.co/rest/v1/rpc/get_codette_context_json" \
  -H "apikey: <YOUR_ANON_KEY>" \
  -H "Authorization: Bearer <YOUR_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"input_prompt":"mixing","optionally_filename":null}'
```

---

## ?? Expected Response Format

When the function is called successfully, it returns JSON:

```json
{
  "snippets": [
    {
      "filename": "src/lib/audioEngine.ts",
      "snippet": "const mixer = new AudioContext(); const gainNode = mixer.createGain();"
    },
    {
      "filename": "daw_core/mixer.py",
      "snippet": "class Mixer: def process(self, audio): return self.compress(audio)"
    }
  ],
  "file": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "effect_chain.ts",
    "file_type": "typescript",
    "storage_path": "codette_files/effect_chain.ts",
    "uploaded_at": "2025-12-01T10:30:00Z"
  } | null,
  "chat_history": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "user_id": "770e8400-e29b-41d4-a716-446655440000",
      "messages": {
        "user": "How do I improve mixing?",
        "assistant": "Consider compression..."
      },
      "updated_at": "2025-12-01T09:15:00Z"
    }
  ]
}
```

---

## ??? Troubleshooting

### Error: `function public.get_codette_context_json does not exist`

**Solution**: Create the function using the SQL provided above. Make sure to:
1. Copy the exact SQL function definition
2. Run it in Supabase SQL Editor
3. Verify it appears in the Functions list

### Error: `permission denied for function`

**Solution**: Make sure to grant execute permissions:
```sql
GRANT EXECUTE ON FUNCTION public.get_codette_context_json(text, text) TO anon, authenticated;
```

### Error: No results returned

**Solution**: Check that:
1. The `codette` table has data with `snippet` column
2. The `chat_history` table is populated
3. Full-text search is enabled on the `snippet` column

### Response is NULL instead of empty JSON

**Solution**: The function returns NULL instead of empty objects. The backend normalizes this:
```python
if isinstance(raw, dict):
    supabase_context = raw
elif raw is None:
    supabase_context = {}
```

---

## ?? Integration Flow

```
Frontend (React)
    ?
User message in CodettePanel
    ?
POST /codette/chat
    ?
Backend (Python FastAPI)
    ?
supabase_client.rpc('public.get_codette_context_json', {...})
    ?
Supabase PostgreSQL Function
    ?
Full-text search + Chat history retrieval
    ?
Returns JSON context
    ?
Backend normalizes response
    ?
Codette AI engine processes context
    ?
Generates personalized response
    ?
Frontend displays response
```

---

## ?? Important Notes

- **Function Name**: `public.get_codette_context_json` (exact case-sensitive)
- **Return Type**: `json` (not `jsonb`)
- **Permissions**: Must grant `EXECUTE` to both `anon` and `authenticated` roles
- **Performance**: Use STABLE flag for query optimization
- **Caching**: Backend caches results for 5 minutes via Redis (optional) or memory

---

## ? Verification Checklist

- [ ] Function created in Supabase
- [ ] `GRANT EXECUTE` permissions applied
- [ ] Backend running (`python codette_server_unified.py`)
- [ ] Test cURL command returns 200 OK
- [ ] Chat endpoint returns responses with proper source
- [ ] No permission denied errors in logs

---

**Ready to Deploy**: Yes ?  
**Backend Status**: Updated ?  
**Supabase Setup**: Pending (follow SQL creation steps above)  
**Testing**: Can proceed once function is created

