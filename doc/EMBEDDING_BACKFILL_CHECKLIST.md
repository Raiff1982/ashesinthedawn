# Embedding Backfill - Quick Integration Checklist

## 🎯 Goal
Backfill embeddings for all rows in `music_knowledge` table where `embedding IS NULL`.

## ✅ What's Ready

- ✅ `backfill_embeddings.js` - Main backfill script (updated)
- ✅ Local API endpoint code - Ready to integrate
- ✅ Environment auto-loading - Reads .env automatically
- ✅ Supabase connectivity - Using your project credentials
- ✅ Error handling & retry logic - 1 retry per batch
- ✅ Detailed logging - Status indicators and progress tracking

## 📋 Setup Steps (Choose One Path)

### PATH A: Quick Test (Local API - Recommended)
Fastest way to test embedding generation locally

1. **Edit `codette_server_unified.py`**
   - Add imports at top:
     ```python
     import numpy as np
     from pydantic import BaseModel
     from typing import List
     import hashlib
     ```

2. **Add endpoint code**
   - Copy entire content from `EMBEDDING_INTEGRATION_SNIPPET.md`
   - Paste into `codette_server_unified.py` (before `if __name__ == "__main__"`)

3. **Restart backend**
   ```bash
   # Kill old process
   Stop-Process -Name python -Force 2>$null
   
   # Start fresh
   python codette_server_unified.py
   ```

4. **Run backfill**
   ```bash
   node backfill_embeddings.js
   ```

5. **Monitor output**
   ```
   📋 Configuration:
      Embedding Endpoint: http://localhost:8000/api/upsert-embeddings (local)
   
   🚀 Starting embedding backfill...
   
   📦 Batch 1: Fetching from offset 0...
      Found 20 rows without embeddings
      🔄 Calling local API (attempt 1/2)...
      ✅ Embedding endpoint succeeded
         Response: { success: true, processed: 20, updated: 20, ... }
   
   ✅ All rows processed successfully!
   ```

### PATH B: Production (Supabase Edge Function)
Deploy as serverless function on Supabase

1. **Deploy Edge Function**
   - In Supabase Dashboard → Functions
   - Create new function: `upsert-embeddings`
   - Use code from `upsert-embeddings/index.ts`

2. **Run backfill**
   ```bash
   USE_LOCAL_API=false node backfill_embeddings.js
   ```

3. **Monitor in Supabase**
   - Check Function Logs
   - Verify database updates

## 🔍 Verification

### Check if embeddings were generated
```sql
-- In Supabase SQL Editor
SELECT 
  COUNT(*) as total,
  COUNT(embedding) as with_embedding,
  COUNT(*) - COUNT(embedding) as without_embedding
FROM music_knowledge;
```

Expected after successful backfill:
```
total | with_embedding | without_embedding
20    | 20             | 0
```

### View sample embedding
```sql
SELECT id, topic, embedding FROM music_knowledge 
WHERE embedding IS NOT NULL 
LIMIT 1;
```

Should show a vector like: `[-0.12, 0.45, -0.78, ...]`

## 🚨 Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| "Connection refused" | Backend not running | `python codette_server_unified.py` |
| "404 Not Found" | Endpoint not registered | Add router to FastAPI app |
| "No rows processed" | No NULL embeddings in DB | Check: `SELECT COUNT(*) FROM music_knowledge WHERE embedding IS NULL` |
| "Batch failed" | Backend error | Check backend console logs for error details |

## 📊 What Happens During Backfill

```
┌─────────────────────────┐
│  backfill_embeddings.js │
└────────────┬────────────┘
             │ 1. Load .env
             ↓
┌──────────────────────────────────┐
│ Read music_knowledge rows        │
│ WHERE embedding IS NULL          │
│ (20 rows found)                  │
└────────────┬─────────────────────┘
             │ 2. Transform: {topic, category, suggestion} → {id, text}
             ↓
┌──────────────────────────────────┐
│ POST /api/upsert-embeddings      │
│ { rows: [{id, text}, ...] }      │
└────────────┬─────────────────────┘
             │ 3. Generate embeddings (local API or Edge Function)
             ↓
┌──────────────────────────────────┐
│ Response: {success, processed}   │
└────────────┬─────────────────────┘
             │ 4. Log result and continue to next batch
             ↓
      [Repeat for each batch]
             │
             ↓
┌──────────────────────────────────┐
│ Print summary report             │
│ ✅ 20 processed, 20 succeeded    │
└──────────────────────────────────┘
```

## 🎓 Understanding Embeddings

**What is an embedding?**
- Vector representation of text (e.g., 384-dimensional array)
- Captures semantic meaning
- Similar texts have similar embeddings

**Current implementation (demo):**
- Hash-based deterministic embedding
- Good for testing and demo
- NOT suitable for real semantic search

**Production embeddings:**
- OpenAI: `text-embedding-3-small` (1536 dims)
- Cohere: `embed-english-v3.0` (1024 dims)
- HuggingFace: `all-MiniLM-L6-v2` (384 dims)

To upgrade to real embeddings:
```python
# Replace generate_simple_embedding() with API call
async def get_real_embedding(text: str):
    response = await openai.Embedding.acreate(
        input=text,
        model="text-embedding-3-small"
    )
    return response["data"][0]["embedding"]
```

## 📝 Configuration Reference

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_SUPABASE_URL` | From .env | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | From .env | Authentication key |
| `VITE_CODETTE_API` | http://localhost:8000 | Backend server URL |
| `BATCH_SIZE` | 50 | Rows per batch |
| `USE_LOCAL_API` | true | Use local API (false = Supabase Edge Function) |

## ✨ Next Steps After Backfill

1. **Verify embeddings**
   - Query database to confirm all rows have embeddings

2. **Test similarity search**
   - Use embeddings to find similar suggestions
   - Build semantic search feature

3. **Optimize vector index**
   - Create pgvector index for faster queries
   - Set up vector similarity search functions

4. **Monitor quality**
   - Evaluate embedding quality for your use case
   - Consider real embedding API for production

## 📞 Support

**Issues?**
1. Check backend logs: `python codette_server_unified.py` console output
2. Check backfill logs: Look for error messages in script output
3. Test endpoint manually:
   ```bash
   curl -X POST http://localhost:8000/api/upsert-embeddings \
     -H "Content-Type: application/json" \
     -d '{"rows":[{"id":"test","text":"test"}]}'
   ```

---

**Status**: ✅ Ready to backfill embeddings!

Choose PATH A for quick testing or PATH B for production deployment.
