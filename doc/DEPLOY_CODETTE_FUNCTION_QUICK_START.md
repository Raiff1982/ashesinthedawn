# ⚡ Quick Start: Deploy Supabase get_codette_context() Function

## 🚀 Fastest Way to Deploy (5 minutes)

### Step 1: Go to Supabase Dashboard
```
https://app.supabase.com → Select your project → SQL Editor → New Query
```

### Step 2: Copy & Paste This SQL
```sql
CREATE OR REPLACE FUNCTION public.get_codette_context(input_prompt text, optionally_filename text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $body$
DECLARE
  result jsonb := '{}'::jsonb;
  snippets jsonb;
  file_row jsonb;
  history jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object('filename', c."FileName", 'snippet', c."ContentSnippet"))
    INTO snippets
  FROM public.codette c
  WHERE to_tsvector('english', coalesce(c."ContentSnippet", '')) @@ plainto_tsquery('english', input_prompt)
  LIMIT 10;

  IF optionally_filename IS NOT NULL THEN
    SELECT jsonb_build_object('id', cf.id, 'filename', cf.filename, 'file_type', cf.file_type, 'storage_path', cf.storage_path, 'uploaded_at', cf.uploaded_at)
    INTO file_row
    FROM public.codette_files cf
    WHERE cf.filename = optionally_filename
    LIMIT 1;
  END IF;

  SELECT jsonb_agg(jsonb_build_object('id', ch.id, 'user_id', ch.user_id, 'messages', ch.messages, 'updated_at', ch.updated_at) ORDER BY ch.updated_at DESC)
    INTO history
  FROM public.chat_history ch
  WHERE (ch.user_id = input_prompt) OR (input_prompt ~* '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}' AND ch.user_id = (regexp_match(input_prompt, '([0-9a-fA-F\-]{36})'))[1])
  LIMIT 5;

  result = result || jsonb_build_object('snippets', coalesce(snippets, '[]'::jsonb));
  result = result || jsonb_build_object('file', coalesce(file_row, 'null'::jsonb));
  result = result || jsonb_build_object('chat_history', coalesce(history, '[]'::jsonb));

  RETURN result;
END;
$body$;

GRANT EXECUTE ON FUNCTION public.get_codette_context(text, text) TO authenticated;
```

### Step 3: Click "Run"
✅ Done! Function is now live.

---

## 📱 Test It

In Supabase SQL Editor, run:

```sql
-- Test 1: Search snippets
SELECT * FROM get_codette_context('mixing optimization');

-- Test 2: Get user history (replace with real UUID)
SELECT * FROM get_codette_context('123e4567-e89b-12d3-a456-426614174000');

-- Test 3: Get file metadata
SELECT * FROM get_codette_context('audio analysis', 'effect_chain.ts');
```

---

## 🔗 Use in Code

### React/TypeScript
```typescript
const context = await supabase
  .rpc('get_codette_context', {
    input_prompt: 'mixing optimization',
    optionally_filename: null
  });

// context.data = {
//   snippets: [...],
//   file: {...},
//   chat_history: [...]
// }
```

### Python (FastAPI)
```python
context = supabase.rpc(
    'get_codette_context',
    {
        'input_prompt': 'reverb algorithm',
        'optionally_filename': 'reverb.ts'
    }
).execute()

snippets = context.data['snippets']
file_info = context.data['file']
history = context.data['chat_history']
```

---

## ✅ What It Does

| Input | Returns |
|-------|---------|
| `'mixing optimization'` | 10 code snippets matching the search |
| `'user-uuid-here'` | 5 recent chat messages for that user |
| `'query', 'filename.ts'` | Snippets + metadata for that file |

---

## 📚 Full Documentation

See: `SUPABASE_CODETTE_FUNCTION_DOCS.md`

---

**Status**: ✅ Ready to deploy in ~5 minutes
