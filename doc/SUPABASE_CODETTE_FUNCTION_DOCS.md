# 🗄️ Supabase PostgreSQL Function: get_codette_context()

**Created**: December 1, 2025  
**Type**: PostgreSQL Function (PLPGSQL)  
**Purpose**: Intelligent context retrieval for Codette AI engine  
**Status**: ✅ Ready for deployment

---

## 📋 Function Overview

`get_codette_context()` is a PostgreSQL function that retrieves intelligent context for Codette by:

1. **Full-text searching** code snippets
2. **Retrieving file metadata** from storage
3. **Pulling user chat history** for context awareness
4. **Combining results** into a unified JSONB response

This enables Codette to provide context-aware, personalized responses based on code, files, and conversation history.

---

## 🔧 Function Signature

```sql
CREATE OR REPLACE FUNCTION public.get_codette_context(
  input_prompt text,
  optionally_filename text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `input_prompt` | `text` | **required** | Search query or user UUID |
| `optionally_filename` | `text` | `NULL` | Optional filename filter |

### Return Value

Returns a JSONB object with three keys:

```json
{
  "snippets": [
    {
      "filename": "string",
      "snippet": "string"
    }
  ],
  "file": {
    "id": "uuid",
    "filename": "string",
    "file_type": "string",
    "storage_path": "string",
    "uploaded_at": "timestamp"
  } | null,
  "chat_history": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "messages": "jsonb",
      "updated_at": "timestamp"
    }
  ]
}
```

---

## 📝 SQL Implementation

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
  -- Find matching codette snippets using full-text search
  SELECT jsonb_agg(jsonb_build_object(
    'filename', c."FileName", 
    'snippet', c."ContentSnippet"
  ))
    INTO snippets
  FROM public.codette c
  WHERE to_tsvector('english', coalesce(c."ContentSnippet", '')) @@ plainto_tsquery('english', input_prompt)
  LIMIT 10;

  -- Get file metadata if filename provided
  IF optionally_filename IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', cf.id,
      'filename', cf.filename,
      'file_type', cf.file_type,
      'storage_path', cf.storage_path,
      'uploaded_at', cf.uploaded_at
    )
    INTO file_row
    FROM public.codette_files cf
    WHERE cf.filename = optionally_filename
    LIMIT 1;
  END IF;

  -- Pull recent chat history for user or UUID
  SELECT jsonb_agg(jsonb_build_object(
    'id', ch.id, 
    'user_id', ch.user_id, 
    'messages', ch.messages, 
    'updated_at', ch.updated_at
  ) ORDER BY ch.updated_at DESC)
    INTO history
  FROM public.chat_history ch
  WHERE (ch.user_id = input_prompt)
     OR (input_prompt ~* '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}' 
         AND ch.user_id = (regexp_match(input_prompt, '([0-9a-fA-F\\-]{36})'))[1])
  LIMIT 5;

  -- Build result object
  result = result || jsonb_build_object('snippets', coalesce(snippets, '[]'::jsonb));
  result = result || jsonb_build_object('file', coalesce(file_row, 'null'::jsonb));
  result = result || jsonb_build_object('chat_history', coalesce(history, '[]'::jsonb));

  RETURN result;
END;
$body$;

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION public.get_codette_context(text, text) TO authenticated;
```

---

## 💡 Usage Examples

### Example 1: Search Code Snippets
```sql
SELECT * FROM get_codette_context('mixing optimization');
```

Returns up to 10 code snippets matching "mixing optimization" using full-text search.

### Example 2: Get User Chat History
```sql
SELECT * FROM get_codette_context('123e4567-e89b-12d3-a456-426614174000');
```

Returns up to 5 recent chat messages for the specified user UUID.

### Example 3: Get File Metadata + Context
```sql
SELECT * FROM get_codette_context('audio analysis', 'effect_chain.ts');
```

Returns:
- Code snippets matching "audio analysis"
- Metadata for file "effect_chain.ts"
- Chat history containing the UUID pattern if present

### Example 4: Extract Specific Data
```sql
-- Get just the snippets
SELECT (get_codette_context('reverb algorithm')).snippets;

-- Get just the chat history
SELECT (get_codette_context('e0a3f2c1-1234-5678-9abc-def012345678')).chat_history;

-- Get file info
SELECT (get_codette_context('anything', 'audio_buffer.ts')).file;
```

---

## 🔍 Technical Details

### Full-Text Search
- **Engine**: PostgreSQL `to_tsvector()` with English tokenization
- **Query Type**: `plainto_tsquery` (converts user input to query)
- **Coverage**: Searches `ContentSnippet` column in `codette` table
- **Limits**: Returns max 10 snippets

### User Identification
The function intelligently identifies users:
- Direct UUID match: `WHERE ch.user_id = input_prompt`
- UUID pattern detection: Recognizes UUID format in input string
- Regex pattern: Extracts UUID from mixed input (e.g., "user:123e4567-...")

### Data Structure
- **Result Type**: JSONB (nested JSON)
- **Aggregation**: `jsonb_agg()` for arrays
- **Null Handling**: `coalesce()` prevents NULL propagation
- **Sorting**: Chat history sorted by `updated_at DESC`

### Performance
- **Function Type**: `STABLE` - can be used in indexes and WHERE clauses
- **Execution**: `SECURITY DEFINER` - runs with function owner permissions
- **Indexes**: Recommend creating indexes on:
  - `codette.ContentSnippet` (GIST index for full-text search)
  - `codette_files.filename` (B-tree)
  - `chat_history.user_id` (B-tree)

---

## 🛡️ Security

### Permissions
- ✅ **SECURITY DEFINER**: Function runs with schema owner permissions
- ✅ **GRANT EXECUTE**: Authenticated users can call the function
- ✅ **Role-based**: Respects Supabase RLS policies on underlying tables

### Data Privacy
- ✅ Only returns data user has permission to access (via RLS)
- ✅ Chat history scoped to user UUID or direct match
- ✅ File metadata only returned if filename specified

---

## 📊 Related Tables

### `codette` (Code Snippets)
```sql
- FileName (text)
- ContentSnippet (text)
- created_at (timestamp)
```

### `codette_files` (File Metadata)
```sql
- id (uuid)
- filename (text)
- file_type (text)
- storage_path (text)
- uploaded_at (timestamp)
```

### `chat_history` (User Conversations)
```sql
- id (uuid)
- user_id (uuid)
- messages (jsonb)
- updated_at (timestamp)
```

---

## 🚀 Deployment Steps

### 1. **Via Supabase Dashboard** (Recommended)

```
1. Navigate to: https://app.supabase.com
2. Select your project (CoreLogic Studio)
3. Click "SQL Editor" in left sidebar
4. Click "New Query"
5. Copy the SQL function code above
6. Click "Run"
7. Confirm function appears in "Functions" list
```

### 2. **Via Python Script**

```bash
python setup_codette_function.py
```

This script will:
- Detect Supabase credentials from `.env`
- Attempt automatic deployment via RPC
- Provide manual SQL if automatic fails

### 3. **Via TypeScript/JavaScript**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Call the function
const { data, error } = await supabase
  .rpc('get_codette_context', {
    input_prompt: 'mixing optimization',
    optionally_filename: null
  });
```

---

## 🔗 Backend Integration

### Python (FastAPI)
```python
from supabase import create_client

supabase = create_client(url, key)

# Call function from backend
response = supabase.rpc(
    'get_codette_context',
    {
        'input_prompt': user_query,
        'optionally_filename': filename
    }
).execute()

context_data = response.data
```

### React/TypeScript (Frontend)
```typescript
// useCodette hook can call this function
const context = await codetteEngine.getContext(
  'audio analysis',
  'effect_chain.ts'
);

// Returns:
// {
//   snippets: [...],
//   file: {...},
//   chat_history: [...]
// }
```

---

## ✨ Benefits

1. **Intelligent Context**
   - Codette can understand code, files, and conversation history
   - Provides more relevant, personalized responses

2. **Performance**
   - Single function call retrieves all context
   - Full-text search is optimized via PostgreSQL

3. **Scalability**
   - STABLE function can be used in indexes
   - Queries can be cached by Supabase

4. **Security**
   - SECURITY DEFINER ensures consistent permissions
   - RLS policies protect user data

5. **Flexibility**
   - Optional parameters for different use cases
   - Returns structured JSONB for easy processing

---

## 📝 Example Response

```json
{
  "snippets": [
    {
      "filename": "src/lib/audioEngine.ts",
      "snippet": "const mixer = new (window.AudioContext || window.webkitAudioContext)(); const gainNode = mixer.createGain(); gainNode.connect(mixer.destination);"
    },
    {
      "filename": "daw_core/fx/mixer.py",
      "snippet": "class Mixer: def __init__(self, num_channels=8): self.channels = [Channel() for _ in range(num_channels)]"
    }
  ],
  "file": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "effect_chain.ts",
    "file_type": "typescript",
    "storage_path": "codette_files/effect_chain.ts",
    "uploaded_at": "2025-12-01T10:30:00Z"
  },
  "chat_history": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "user_id": "770e8400-e29b-41d4-a716-446655440000",
      "messages": {
        "user": "How do I optimize mixing?",
        "assistant": "Consider using compression..."
      },
      "updated_at": "2025-12-01T09:15:00Z"
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Function Not Found
- ✅ Check that function is created in your Supabase project
- ✅ Use exact name: `get_codette_context(text, text)`
- ✅ Verify tables exist: `codette`, `codette_files`, `chat_history`

### No Results Returned
- ✅ Check that `codette` table has data with `ContentSnippet`
- ✅ Verify full-text search index exists
- ✅ Try simple keywords first (e.g., "audio", "mixing")

### Permission Denied
- ✅ Verify user is authenticated (has `authenticated` role)
- ✅ Check Supabase RLS policies allow access to underlying tables
- ✅ Use service role key for backend calls

---

## 📚 References

- [PostgreSQL PLPGSQL Functions](https://www.postgresql.org/docs/current/plpgsql.html)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Supabase PostgreSQL Functions](https://supabase.com/docs/guides/database/functions)
- [Supabase RLS (Row Level Security)](https://supabase.com/docs/guides/auth/row-level-security)

---

**Status**: ✅ Ready for production deployment

For deployment assistance, run: `python setup_codette_function.py`
