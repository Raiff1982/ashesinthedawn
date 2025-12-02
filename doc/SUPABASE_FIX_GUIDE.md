# Step-by-Step: Fix Supabase RPC Functions

**Objective**: Fix permission error on `get_music_suggestions` RPC so suggestions show from "database" instead of "fallback"

**Prerequisites**: 
- Supabase account access
- Project: `ngvcyxvtorwqocnqcbyz`

---

## EXACT RPC SIGNATURES REQUIRED

The backend calls `get_music_suggestions` with TWO different signatures:

### Signature #1: For Suggestions Endpoint
```
Function: get_music_suggestions(p_prompt text, p_context text)
Example: get_music_suggestions('mixing', 'mixing')
```

### Signature #2: For Chat/Semantic Search
```
Function: get_music_suggestions(query text, limit_count integer)
Example: get_music_suggestions('reverb settings', 3)
```

### Signature #3: For Context Retrieval
```
Function: get_codette_context(input_prompt text, optionally_filename text)
Example: get_codette_context('What should I do?', NULL)
```

---

## FIX INSTRUCTIONS

### Step 1: Go to Supabase Dashboard

1. Open: https://app.supabase.com
2. Select project: **ashesinthedawn** (ngvcyxvtorwqocnqcbyz)
3. Click: **SQL Editor** (left sidebar)

---

### Step 2: Create New Query

1. Click **+ New query**
2. Name it: `Fix RPC Permissions and Create Functions`

---

### Step 3: Copy the Migration SQL

Copy the entire contents of: `supabase_migration_fix_rpc.sql`

(This file is in your project root)

---

### Step 4: Paste and Run

1. Paste the SQL into the editor
2. Click **▶ Run** (top right)
3. Wait for execution (should take < 5 seconds)

---

### Step 5: Verify Success

You should see these success messages in the output:

```
✓ Function get_music_suggestions(text, text) created successfully
✓ Function get_music_suggestions(text, integer) created successfully
✓ Function get_codette_context(text, text) created successfully
```

---

## Troubleshooting

### Error: "function already exists"

**Fix**: Replace `CREATE OR REPLACE` section in the SQL with:
```sql
DROP FUNCTION IF EXISTS public.get_music_suggestions(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_music_suggestions(text, integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_codette_context(text, text) CASCADE;
```

Then run again.

---

### Error: "permission denied"

This should not happen because we're using `SECURITY DEFINER`. If it does:

1. Go to **Project Settings** → **Database**
2. Check you're logged in as database owner
3. Try again

---

### Error: "music_knowledge table not found"

The table exists (verified by test_supabase.py). This means you might be looking at wrong schema.

Verify:
```sql
SELECT COUNT(*) FROM public.music_knowledge;
```

Should return: `5`

---

## Step 6: Restart Backend

After successful SQL migration:

```bash
# In PowerShell at i:\ashesinthedawn
python codette_server_unified.py
```

---

## Step 7: Test the Fix

### Test Suggestions Endpoint

```bash
$body = @{context=@{type="mixing";track_type="audio"};limit=5} | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:8000/codette/suggest `
  -Method Post `
  -Headers @{'Content-Type'='application/json'} `
  -Body $body | Select-Object StatusCode
```

**Expected result**:
```json
{
  "suggestions": [
    {
      "source": "database",  ← CHANGED FROM "fallback"
      "confidence": 0.92,
      "title": "ii–V–I variations"
    }
  ]
}
```

---

### Test Chat Endpoint with Semantic Search

```bash
$body = @{message="How should I set up reverb?"} | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:8000/codette/chat `
  -Method Post `
  -Headers @{'Content-Type'='application/json'} `
  -Body $body | Select-Object StatusCode
```

---

## What Changed

| Before | After |
|--------|-------|
| `source: "fallback"` | `source: "database"` |
| RPC permission denied | RPC executes successfully |
| Hardcoded suggestions | Real Supabase suggestions |
| 0 database queries | Queries the music_knowledge table |

---

## File References

- **Migration SQL**: `supabase_migration_fix_rpc.sql`
- **RPC Analysis**: `RPC_SIGNATURE_ANALYSIS.md`
- **Test Results**: Run `python test_supabase.py` to verify

---

## Backend Code Affected

After this fix, these endpoints will use database suggestions:

1. **POST `/codette/suggest`** (Lines 1760-1836 in codette_server_unified.py)
   - Uses: `get_music_suggestions(p_prompt text, p_context text)`

2. **POST `/codette/chat`** (Lines 1263-1270 in codette_server_unified.py)
   - Uses: `get_music_suggestions(query text, limit_count integer)` for semantic search

3. **POST `/codette/chat`** (Lines 931-940 in codette_server_unified.py)
   - Uses: `get_codette_context(input_prompt text, optionally_filename text)`

---

## Summary

✅ **Two functions with different signatures created**  
✅ **Execute permissions granted to anon role**  
✅ **Music knowledge data available (5+ rows)**  
✅ **Semantic search (FTS) enabled**  
✅ **Ready for testing**

Once you run the migration SQL, suggestions will pull from the database! 🎉
