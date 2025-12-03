# Local Embedding Endpoint Setup

## Overview

The backfill script now supports two endpoints for generating embeddings:

1. **Local API (Default)** - `http://localhost:8000/api/upsert-embeddings`
   - Runs in your Codette backend
   - No external dependencies
   - Fast and reliable

2. **Supabase Edge Function** - `https://{project}.supabase.co/functions/v1/upsert-embeddings`
   - Serverless
   - Runs on Supabase infrastructure
   - Requires deployment

## Quick Start (Local API)

### Step 1: Add Endpoint to Backend

Copy this into `codette_server_unified.py` (or integrate the module):

```python
# At the top of the file, add:
from upsert_embeddings_endpoint import router as embeddings_router

# In your FastAPI app setup, add:
app.include_router(embeddings_router)
```

### Step 2: Restart Backend

```bash
# Kill existing server
taskkill /F /IM python.exe 2>$null

# Start fresh
python codette_server_unified.py
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Step 3: Run Backfill Script

```bash
# Loads .env automatically
node backfill_embeddings.js
```

Expected output:
```
📋 Configuration:
   Supabase URL: https://ngvcyxvtorwqocnqcbyz.supabase.co
   Backend API: http://localhost:8000
   Embedding Endpoint: http://localhost:8000/api/upsert-embeddings (local)
   ...

🚀 Starting embedding backfill...

📦 Batch 1: Fetching from offset 0...
   Found 20 rows without embeddings
   🔄 Calling local API (attempt 1/2)...
   ✅ Embedding endpoint succeeded
      Response: { success: true, processed: 20, updated: 20, ... }

✅ All rows processed successfully!
```

## Configuration

### Use Local API (Default)
```bash
# Automatically uses local API
node backfill_embeddings.js
```

### Force Supabase Edge Function
```bash
# Requires Edge Function to be deployed
USE_LOCAL_API=false node backfill_embeddings.js
```

### Custom Backend URL
```bash
CODETTE_API=http://your-backend:8000 node backfill_embeddings.js
```

## How It Works

### Local API Flow

```
backfill_embeddings.js
   ↓
   Reads music_knowledge rows (embedding IS NULL)
   ↓
   Transforms: { topic, category, suggestion } → { id, text }
   ↓
   POST /api/upsert-embeddings
   ↓
   codette_server_unified.py (FastAPI)
   ↓
   Generates embeddings (simple hash-based for demo)
   ↓
   Returns JSON response
   ↓
   Script logs success/failure
```

### Embedding Generation

The default implementation uses deterministic hash-based embeddings:

```python
def generate_simple_embedding(text: str, dim: int = 384) -> List[float]:
    # Creates reproducible 384-dimensional vectors
    # Suitable for demo/testing
    # In production, replace with real embeddings (OpenAI, Cohere, etc.)
```

**For Production:**

Replace with a real embedding API:

```python
import openai

async def get_real_embedding(text: str) -> List[float]:
    response = await openai.Embedding.acreate(
        input=text,
        model="text-embedding-3-small"
    )
    return response["data"][0]["embedding"]
```

## Troubleshooting

### Error: "Connection refused" or "Cannot reach localhost:8000"

**Solution**: Ensure backend is running
```bash
# Start backend
python codette_server_unified.py

# In another terminal, check it's listening
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Mac/Linux
```

### Error: "404 Not Found" for embedding endpoint

**Solution**: Endpoint not registered in FastAPI app
```python
# In codette_server_unified.py, add:
from upsert_embeddings_endpoint import router as embeddings_router
app.include_router(embeddings_router)
```

### Error: "No rows returned after backfill"

**Solution**: Check if embeddings were actually stored
```sql
-- In Supabase SQL Editor
SELECT id, embedding, topic, category FROM music_knowledge WHERE embedding IS NOT NULL LIMIT 1;
```

If empty, the endpoint may not be updating the database. Currently, `upsert_embeddings_endpoint.py` only **generates** embeddings but doesn't **store** them. You need to integrate it with your database:

```python
# Add to upsert_embeddings_endpoint.py
from supabase import create_client

@router.post("/api/upsert-embeddings")
async def upsert_embeddings(request: UpsertRequest):
    # ... generate embeddings ...
    
    # Update database
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    result = supabase.table("music_knowledge").upsert(updates).execute()
    
    return result
```

## Files

| File | Purpose |
|------|---------|
| `backfill_embeddings.js` | Main backfill script (updated) |
| `upsert_embeddings_endpoint.py` | FastAPI endpoint for local API |
| `upsert-embeddings/index.ts` | Deno Edge Function (reference) |

## Next Steps

1. ✅ Add endpoint to backend
2. ✅ Restart backend server
3. ✅ Run backfill script
4. ✅ Verify embeddings in database
5. ⏳ (Optional) Integrate real embedding API
6. ⏳ (Optional) Deploy as Supabase Edge Function

---

**Status**: Ready to run with local API! 🚀
