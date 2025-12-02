# Embedding Backfill Script - Setup & Usage Guide

## Overview

The `backfill_embeddings.js` script reads all rows from `music_knowledge` table where `embedding IS NULL` and calls a Supabase Edge Function to generate AI embeddings for those rows.

**Status**: Ready to deploy ✅

---

## Prerequisites

### 1. Node.js Version
- **Requires**: Node 18 or higher
- **Reason**: Uses native `fetch` API (no external dependencies needed)

**Check your version:**
```bash
node --version
# Should show v18.0.0 or higher
```

### 2. Supabase Edge Function
The script expects an Edge Function deployed at:
```
https://{PROJECT_REF}.supabase.co/functions/v1/upsert-embeddings
```

**Function should:**
- Accept POST requests with `{ rows: [{ id, text }] }`
- Generate embeddings for each row's `text` field
- Update the `music_knowledge` table with the generated embeddings
- Return a response object with processing status

### 3. Database Access
The script uses the PostgREST API to read from `music_knowledge` table.
Ensure RLS policy allows reads, or use SERVICE_ROLE key for unrestricted access.

---

## Environment Setup

### Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `ngvcyxvtorwqocnqcbyz`
3. Go to **Settings** → **API**
4. Copy the following:

**From API Settings:**
- **Project URL**: `https://ngvcyxvtorwqocnqcbyz.supabase.co`
- **Project Reference (Ref)**: `ngvcyxvtorwqocnqcbyz`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (shown in table)
- **Service Role Key**: In same section (if you need full access)

### Step 2: Create a `.env.local` File

Create file: `i:\ashesinthedawn\.env.local`

```bash
# Required: Your Supabase project reference
SUPABASE_PROJECT_REF=ngvcyxvtorwqocnqcbyz

# Required: Authentication (choose one)
# Option A: Use Anon Key (recommended for less sensitive operations)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Option B: Use Service Role Key (if Anon Key has RLS restrictions)
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Custom Supabase URL (defaults to https://{PROJECT_REF}.supabase.co)
# SUPABASE_URL=https://ngvcyxvtorwqocnqcbyz.supabase.co

# Optional: Edge Function secret (if your function requires authentication)
# FUNCTION_SECRET=your-secret-key

# Optional: Batch size (default 50)
# BATCH_SIZE=50
```

### Step 3: Export Environment Variables

**On Windows (PowerShell):**
```powershell
# Load from .env.local
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^\s*([^=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}

# Verify loaded
$env:SUPABASE_PROJECT_REF
$env:SUPABASE_ANON_KEY
```

**Or manually:**
```powershell
$env:SUPABASE_PROJECT_REF = "ngvcyxvtorwqocnqcbyz"
$env:SUPABASE_ANON_KEY = "your-anon-key-here"
```

**On Linux/Mac (Bash):**
```bash
export SUPABASE_PROJECT_REF=ngvcyxvtorwqocnqcbyz
export SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Running the Script

### Quick Start

```bash
# Navigate to project
cd I:\ashesinthedawn

# Run the script
node backfill_embeddings.js
```

### Expected Output

```
📋 Configuration:
   Project URL: https://ngvcyxvtorwqocnqcbyz.supabase.co
   Edge Function: https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/upsert-embeddings
   Batch Size: 50
   Max Retries: 1
   Auth Key: ANON

🚀 Starting embedding backfill...

📦 Batch 1: Fetching from offset 0...
   Found 8 rows without embeddings
   🔄 Calling Edge Function (attempt 1/2)...
   ✅ Edge function succeeded
      Response: {...}

============================================================
📊 Backfill Summary
============================================================
Total Batches Processed: 1
Total Rows Processed:    8
Total Rows Succeeded:    8
Total Rows Failed:       0

✅ All rows processed successfully!
============================================================
```

---

## Understanding the Script

### Workflow

```
1. Load environment variables
   ↓
2. Connect to Supabase via REST API
   ↓
3. Fetch batch of rows with NULL embedding (offset 0-50)
   ↓
4. Transform to { id, text } format
   ↓
5. Call Edge Function with batch
   ↓
6. Log result and move to next batch
   ↓
7. Repeat until no more rows
   ↓
8. Print summary report
```

### Key Functions

#### `fetchBatch(offset, limit)`
- Queries PostgREST API for rows with `embedding IS NULL`
- Returns up to `limit` rows starting at `offset`
- Uses Anon or Service Role key for authentication

#### `toEmbedRows(rows)`
- Transforms database schema to embedding input format
- Combines `topic`, `category`, `suggestion` into single `text` field
- Returns: `[{ id, text }, ...]`

#### `callEdgeFunction(rows)`
- POSTs batch to Edge Function
- Sends: `{ rows: [{ id, text }, ...] }`
- Expects: Success response (any format)
- Retries once on failure

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `SUPABASE_PROJECT_REF` | string | Required | Your Supabase project reference |
| `SUPABASE_ANON_KEY` | string | Optional | Anon key for API access |
| `SUPABASE_SERVICE_ROLE_KEY` | string | Optional | Service role key (full access) |
| `SUPABASE_URL` | string | `https://{REF}.supabase.co` | Custom Supabase URL |
| `FUNCTION_SECRET` | string | Optional | Secret for Edge Function auth |
| `BATCH_SIZE` | number | `50` | Rows per batch |

**Note**: Set either `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY` (service key takes precedence)

---

## Troubleshooting

### Issue: "Set SUPABASE_PROJECT_REF"

**Solution**: Verify environment variable is exported
```powershell
Write-Host $env:SUPABASE_PROJECT_REF  # Should print: ngvcyxvtorwqocnqcbyz
```

### Issue: "HTTP 401: Unauthorized"

**Solution**: Check your auth key
```bash
# Verify key is valid in Supabase Dashboard
# Settings → API → Copy correct key
echo $SUPABASE_ANON_KEY  # Should show: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Issue: "Edge function failed: HTTP 404"

**Solution**: Verify Edge Function is deployed
```bash
# Check function exists at:
curl https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/upsert-embeddings

# Should return 405 Method Not Allowed (GET not allowed)
# Not 404 (function not found)
```

### Issue: "Max retries exceeded"

**Solution**: Check Edge Function logs
1. Supabase Dashboard → **Functions**
2. Select **upsert-embeddings**
3. View **Logs** tab
4. Check for errors
5. Fix function code and redeploy

### Issue: "No more rows to process" but you have data

**Solution**: All embeddings already exist
```sql
-- Check if embeddings already populated
SELECT COUNT(*) FROM music_knowledge WHERE embedding IS NULL;
-- If 0, all rows have embeddings
```

---

## Advanced Usage

### Custom Batch Size

```bash
# Process 100 rows per batch (faster, more load on Edge Function)
BATCH_SIZE=100 node backfill_embeddings.js
```

### Using Service Role Key

```bash
# For unrestricted database access (ignores RLS policies)
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
node backfill_embeddings.js
```

### With Edge Function Secret

```bash
# If your function requires authentication
$env:FUNCTION_SECRET = "your-secret-key"
node backfill_embeddings.js
```

### Dry Run (Check What Would Process)

```bash
# Modify script to only fetch and log, no Edge Function calls
# (Create a dry-run version if needed)
```

---

## Performance Considerations

### Batch Size Impact

- **Smaller batches (10-20 rows)**:
  - ✅ Faster retries (less data to re-send)
  - ❌ More API calls (slower overall)
  - Best for: Debugging

- **Default batches (50 rows)**:
  - ✅ Good balance
  - ✅ Recommended

- **Larger batches (100+ rows)**:
  - ✅ Fewer API calls (faster)
  - ❌ Slower retries on failure
  - Best for: Production with reliable Edge Function

### Network Considerations

- Each batch = 1 network request
- 8 rows ÷ 50 batch size = 1 batch
- With 1,000 rows = ~20 requests total
- Expected runtime: 30-60 seconds

---

## Monitoring & Logging

### Log Levels

Script outputs:
- ✅ Success messages
- ❌ Error messages
- 📦 Progress updates
- 📊 Final summary

### Checking Results

**In Supabase Dashboard:**
1. Go to **SQL Editor**
2. Run query:
```sql
SELECT 
  COUNT(*) as total_rows,
  COUNT(embedding) as rows_with_embedding,
  COUNT(*) - COUNT(embedding) as rows_without_embedding
FROM music_knowledge;
```

**Expected after backfill:**
```
total_rows | rows_with_embedding | rows_without_embedding
8          | 8                    | 0
```

---

## After Successful Backfill

### Next Steps

1. **Verify in Database**:
   ```sql
   SELECT id, embedding FROM music_knowledge LIMIT 1;
   ```
   Should show non-null embedding vector

2. **Test Semantic Search**:
   - Use embeddings for similarity search
   - Build vector index for faster queries

3. **Update Application Code**:
   - Implement semantic search in suggestions
   - Use embeddings for relevance ranking

4. **Monitor Performance**:
   - Check embedding quality
   - Tune batch size if needed
   - Set up automated re-embedding for new rows

---

## File Structure

```
i:\ashesinthedawn\
├── backfill_embeddings.js      (Main script)
├── .env.local                   (Environment config - create this)
├── BACKFILL_SETUP_GUIDE.md      (This file)
└── ... (other project files)
```

---

## Security Best Practices

1. **Never commit `.env.local`**
   ```bash
   # Add to .gitignore
   echo ".env.local" >> .gitignore
   ```

2. **Use Service Role Key carefully**
   - Only set when needed
   - Keep it secure (don't share)
   - Rotate regularly

3. **Rotate API Keys**
   - In Supabase Dashboard: Settings → API
   - Click "Rotate" button
   - Update `.env.local`

4. **Monitor Edge Function**
   - Check logs for errors
   - Set up alerts for failures
   - Rate-limit if needed

---

## Summary

| Step | Status |
|------|--------|
| Script created | ✅ |
| Documentation ready | ✅ |
| Prerequisites checked | ⏳ (user to verify) |
| Environment configured | ⏳ (user to set up) |
| Edge Function deployed | ⏳ (user to deploy) |
| Ready to run | ✅ |

---

**Next Action**: Set up `.env.local` and run the script when ready!
