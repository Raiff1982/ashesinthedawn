# Embedding System - Quick Reference Card

## 🎯 One-Line Summary
Backfill embeddings for music knowledge base rows using local API or Supabase.

## ⚡ Quick Commands

```bash
# Run with local API (recommended for testing)
node backfill_embeddings.js

# Run with Supabase Edge Function
USE_LOCAL_API=false node backfill_embeddings.js

# Custom batch size (faster)
BATCH_SIZE=100 node backfill_embeddings.js

# Custom backend URL
VITE_CODETTE_API=http://your-server:8000 node backfill_embeddings.js
```

## 📂 Files

| File | Purpose | Location |
|------|---------|----------|
| `backfill_embeddings.js` | Main script | Root |
| `upsert_embeddings_endpoint.py` | Backend module | Root |
| `EMBEDDING_INTEGRATION_SNIPPET.md` | Copy-paste code | Root |
| `upsert-embeddings/index.ts` | Edge Function | Root/upsert-embeddings/ |

## 🔧 Integration (5 Steps)

1. Open `EMBEDDING_INTEGRATION_SNIPPET.md`
2. Copy the code block
3. Paste into `codette_server_unified.py`
4. Add `app.include_router(embeddings_router)` to app setup
5. Restart backend: `python codette_server_unified.py`

## ✅ Verification

```bash
# Check if endpoint is working
curl -X POST http://localhost:8000/api/upsert-embeddings \
  -H "Content-Type: application/json" \
  -d '{"rows":[{"id":"test","text":"test"}]}'

# Check database has embeddings
# In Supabase: SELECT COUNT(*) FROM music_knowledge WHERE embedding IS NOT NULL;
```

## 🚨 Common Issues

| Issue | Fix |
|-------|-----|
| "Connection refused" | Backend not running: `python codette_server_unified.py` |
| "404 Not Found" | Router not added to app: Add `app.include_router(embeddings_router)` |
| "No environment variables" | Copy `.env` template or create `.env.local` |
| "0 rows processed" | All embeddings already exist: `SELECT COUNT(*) FROM music_knowledge WHERE embedding IS NULL` |

## 📊 Expected Output

```
📋 Configuration (from .env + environment):
   Supabase URL: https://ngvcyxvtorwqocnqcbyz.supabase.co
   Backend API: http://localhost:8000
   Embedding Endpoint: http://localhost:8000/api/upsert-embeddings (local)
   Batch Size: 50

🚀 Starting embedding backfill...

📦 Batch 1: Fetching from offset 0...
   Found 20 rows without embeddings
   🔄 Calling local API (attempt 1/2)...
   ✅ Embedding endpoint succeeded
      Response: { success: true, processed: 20, updated: 20 }

✅ All rows processed successfully!
════════════════════════════════════════════════════════════
📊 Backfill Summary
Total Batches Processed: 1
Total Rows Processed:    20
Total Rows Succeeded:    20
Total Rows Failed:       0
✅ All rows processed successfully!
```

## 🔑 Environment Variables

```bash
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional
VITE_CODETTE_API=http://localhost:8000        # Backend URL
BATCH_SIZE=50                                 # Rows per batch
USE_LOCAL_API=true                            # Use local API
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...      # Full access key
```

## 🎓 Embedding Basics

- **What**: Vector representation of text (e.g., 384 numbers)
- **Why**: Enable semantic search and similarity matching
- **Current**: Hash-based demo embeddings
- **Production**: Real APIs (OpenAI, Cohere, HuggingFace)

Sample embedding vector: `[-0.12, 0.45, -0.78, 0.34, ..., 0.99]`

## 📈 Performance

| Operation | Time |
|-----------|------|
| Generate 1 embedding | ~1ms |
| Backfill 20 rows | ~2-5s |
| Retry failed batch | ~2-5s |

## 🛠️ Manual Testing

```python
# In Python terminal
import requests

response = requests.post(
    "http://localhost:8000/api/upsert-embeddings",
    json={"rows": [{"id": "test-1", "text": "Music Engineering"}]}
)
print(response.json())
# { "success": true, "processed": 1, "updated": 1 }
```

## 🚀 Three Ways to Deploy

### 1. Local API (Development)
```bash
# In terminal 1
python codette_server_unified.py

# In terminal 2
node backfill_embeddings.js
```

### 2. Supabase Edge Function (Production)
```bash
# Deploy Edge Function from upsert-embeddings/index.ts
USE_LOCAL_API=false node backfill_embeddings.js
```

### 3. Docker (Advanced)
```bash
docker build -t codette-embeddings .
docker run -p 8000:8000 codette-embeddings
node backfill_embeddings.js
```

## 📞 Support

- **Local API issues**: Check `python codette_server_unified.py` console
- **Backfill issues**: Check backfill script output
- **Database issues**: Check Supabase dashboard
- **Environment issues**: Check `.env` file exists and has correct variables

## 🎉 Success Indicators

✅ Backend starts without errors  
✅ Backfill script connects successfully  
✅ "✅ Embedding endpoint succeeded" in logs  
✅ All 20 rows processed  
✅ Database shows embeddings NOT NULL  

## 📚 Documentation Files

- `EMBEDDING_BACKFILL_SUMMARY.md` - Complete overview
- `EMBEDDING_BACKFILL_CHECKLIST.md` - Step-by-step setup
- `EMBEDDING_ENDPOINT_GUIDE.md` - Detailed configuration
- `EMBEDDING_INTEGRATION_SNIPPET.md` - Copy-paste code
- `QUICK_REFERENCE.md` - This file

## ⏱️ Time Estimate

- Setup: 5-10 minutes
- Integration: 2-5 minutes
- Backfill run: < 10 seconds
- Verification: 2-5 minutes
- **Total: ~20 minutes**

---

**Status**: ✅ Ready to deploy!

Start with: `EMBEDDING_BACKFILL_CHECKLIST.md`
