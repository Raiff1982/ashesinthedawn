# Embedding System Architecture & Flow Diagrams

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CoreLogic Studio Project                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Frontend (React + TypeScript)              │   │
│  │  ├─ UI Components                                       │   │
│  │  ├─ WebSocket Client (codetteBridge.ts)               │   │
│  │  └─ Action System (44100-44999 actions)               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↑                                     │
│                            │ WebSocket                           │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │    Backend (Python FastAPI + Codette AI Server)        │   │
│  │                                                          │   │
│  │  ├─ /api/suggest - Music suggestions (Supabase)        │   │
│  │  ├─ /api/upsert-embeddings - Embedding generation ←────┼───┼─ NEW
│  │  ├─ /ws - WebSocket transport                          │   │
│  │  └─ Other endpoints...                                 │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↑                                     │
│                            │ REST API / PostgREST               │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Supabase (PostgreSQL + REST API)               │   │
│  │                                                          │   │
│  │  ├─ music_knowledge table                              │   │
│  │  │  ├─ id (UUID)                                       │   │
│  │  │  ├─ topic (string)                                  │   │
│  │  │  ├─ category (string)                               │   │
│  │  │  ├─ suggestion (string)                             │   │
│  │  │  ├─ confidence (float)                              │   │
│  │  │  ├─ embedding (vector[384]) ← Backfill destination  │   │
│  │  │  └─ ... other columns                               │   │
│  │  │                                                      │   │
│  │  ├─ RPC: get_music_suggestions()                       │   │
│  │  └─ Functions:                                         │   │
│  │     └─ upsert-embeddings (Deno-based, optional)       │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│         Embedding Backfill System (NEW - Standalone)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  backfill_embeddings.js                                         │
│  ├─ Load .env (Vite format)                                    │
│  ├─ Connect to Supabase REST API                               │
│  ├─ Fetch rows: music_knowledge WHERE embedding IS NULL        │
│  ├─ Transform: {topic, category, suggestion} → {id, text}      │
│  ├─ Call embedding endpoint (2 options):                        │
│  │  ├─ Option A: Local API                                     │
│  │  │   └─ http://localhost:8000/api/upsert-embeddings        │
│  │  │      ↑                                                    │
│  │  │      └─ codette_server_unified.py (FastAPI)             │
│  │  │         └─ upsert_embeddings_endpoint.py (router)       │
│  │  │                                                           │
│  │  └─ Option B: Supabase Edge Function                        │
│  │      └─ https://{project}/functions/v1/upsert-embeddings   │
│  │         └─ upsert-embeddings/index.ts (Deno)               │
│  │                                                              │
│  ├─ Generate embeddings (384-dimensional vectors)              │
│  ├─ Batch processing (50 rows per batch)                       │
│  ├─ Retry logic (1 retry per batch)                            │
│  └─ Report results                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow: Before Backfill

```
Supabase Database:
┌────────────────────────────────────────────┐
│ music_knowledge                            │
├────┬──────────┬──────────┬──────────┬──────┤
│ id │  topic   │ category │ embedding│ ...  │
├────┼──────────┼──────────┼──────────┼──────┤
│ 1  │ EQ       │ Filter   │ NULL ← ←  ← ← ← Need to fill
│ 2  │ Compress │ Dynamic  │ NULL ← ← ← ← ←
│ 3  │ Saturate │ Drive    │ NULL ← ← ← ← ←
│... │ ...      │ ...      │ NULL... (20 rows)
└────┴──────────┴──────────┴──────────┴──────┘
```

## 🔄 Data Flow: After Backfill

```
Supabase Database:
┌────────────────────────────────────────────────────────────┐
│ music_knowledge                                            │
├────┬──────────┬──────────┬────────────────────────┬─────────┤
│ id │  topic   │ category │ embedding              │ ...     │
├────┼──────────┼──────────┼────────────────────────┼─────────┤
│ 1  │ EQ       │ Filter   │ [-0.12, 0.45, ...]   │ ✅ Filled
│ 2  │ Compress │ Dynamic  │ [0.34, -0.21, ...]   │ ✅ Filled
│ 3  │ Saturate │ Drive    │ [0.01, 0.99, ...]    │ ✅ Filled
│... │ ...      │ ...      │ [..., ..., ...] (20) │ ✅ Filled
└────┴──────────┴──────────┴────────────────────────┴─────────┘
```

## 🚀 Execution Flow: Local API (Option A)

```
Terminal 1 (Backend):
$ python codette_server_unified.py
  INFO: Uvicorn running on http://127.0.0.1:8000
  ✅ /api/upsert-embeddings endpoint ready


Terminal 2 (Backfill):
$ node backfill_embeddings.js
  
  ┌─ Configuration ─────────────────┐
  │ URL: https://ngvcyxvtorwqocnqcbyz.supabase.co
  │ Backend: http://localhost:8000
  │ Endpoint: local
  │ Batch Size: 50
  └─────────────────────────────────┘
  
  🚀 Starting embedding backfill...
  
  ┌─ Batch 1 ──────────────────────────────────────┐
  │ 📦 Fetching from offset 0...                   │
  │    ├─ Query: music_knowledge                   │
  │    │   WHERE embedding IS NULL                 │
  │    │   LIMIT 50 OFFSET 0                       │
  │    └─ Result: Found 20 rows ✅                 │
  │                                                 │
  │ 🔄 Calling local API...                        │
  │    ├─ POST http://localhost:8000/api/...      │
  │    ├─ Body: {rows: [{id, text}, ...]} (20)    │
  │    └─ Response: ✅ success, 20 processed      │
  │                                                 │
  │ 📦 Fetching from offset 20...                  │
  │    └─ Result: 0 rows (done)                    │
  └─────────────────────────────────────────────────┘
  
  ╔════════════════════════════════════════════╗
  ║ 📊 Backfill Summary                        ║
  ║ ✅ Total Batches: 1                        ║
  ║ ✅ Total Rows: 20                          ║
  ║ ✅ Succeeded: 20                           ║
  ║ ❌ Failed: 0                               ║
  ║ ✅ All rows processed successfully!        ║
  ╚════════════════════════════════════════════╝
```

## 🚀 Execution Flow: Supabase Edge Function (Option B)

```
Terminal (Backfill):
$ USE_LOCAL_API=false node backfill_embeddings.js

  Configuration:
  ├─ Supabase URL: https://ngvcyxvtorwqocnqcbyz.supabase.co
  ├─ Endpoint: Edge Function
  └─ URL: https://.../functions/v1/upsert-embeddings
  
  🚀 Starting embedding backfill...
  
  📦 Batch 1: Fetching from offset 0...
     ├─ Query Supabase REST API
     ├─ Found 20 rows without embeddings
     │
     └─ 🔄 POST /functions/v1/upsert-embeddings
         ├─ Supabase executes Deno function
         ├─ Function generates embeddings
         ├─ Updates music_knowledge table
         └─ ✅ Response: success
  
  ✅ All rows processed successfully!
```

## 📊 Embedding Generation Details

```
Input Text:
  "Peak Level Optimization"
        ↓
Hash-based algorithm (demo):
  ├─ SHA256 hash of text
  ├─ Deterministic pseudo-random values
  ├─ Normalize to unit vector
        ↓
Output Vector (384 dimensions):
  [
    -0.123, 0.456, -0.789, 0.234, -0.567,
    0.890, -0.123, 0.456, -0.789, 0.234,
    ... (374 more dimensions)
  ]

Properties:
  ✅ Deterministic (same input = same vector)
  ✅ Normalized (magnitude = 1.0)
  ✅ Ready for similarity calculations
  ⚠️ Not semantically meaningful (demo only)

Production Alternative:
  OpenAI text-embedding-3-small
  ├─ Input: "Peak Level Optimization"
  ├─ Model: gpt-3.5-turbo
  └─ Output: Semantically meaningful 1536-dim vector
```

## 🔁 Error Handling Flow

```
Batch Processing:
┌─ Fetch Rows ──────────────────────────────┐
│  ├─ Success: Continue ✓                   │
│  └─ Error: Log and break ✗                │
└────────────┬─────────────────────────────┘
             │
┌─ Transform to {id, text} ────────────────┐
│  └─ Success: Continue ✓                   │
└────────────┬─────────────────────────────┘
             │
┌─ Call Embedding Endpoint ─────────────────┐
│  │                                         │
│  ├─ Success (Attempt 1): ✓                │
│  │  └─ Add to succeeded count             │
│  │                                         │
│  └─ Error (Attempt 1): Retry              │
│     ├─ Attempt 2: ?                       │
│     │  ├─ Success: ✓ Add to succeeded     │
│     │  └─ Error: Add to failed            │
│     │                                     │
│     └─ If still failing: ✗                │
│        └─ Track failed batch + row IDs    │
└────────────┬─────────────────────────────┘
             │
┌─ Move to next batch ──────────────────────┐
│  └─ offset += batch_size                  │
└────────────┬─────────────────────────────┘
             │
        [Repeat]
```

## 📈 Performance Timeline

```
Time    | Operation
───────────────────────────────────────────────────────
0s      | Script starts, loads .env
0.5s    | Connect to Supabase
1s      | Fetch first batch (20 rows)
2s      | Transform rows to text format
3s      | Call embedding endpoint (generate 20 embeddings)
4s      | Fetch next batch (0 rows) - done
5s      | Print summary report
        ↓
Total: ~5 seconds for full backfill
```

## 🎯 Deployment Paths

```
PATH A: Local API (Development)
┌─────────────────────────────────────────┐
│ 1. Add code to codette_server_unified.py│
│ 2. Include router in FastAPI app         │
│ 3. Restart backend: python ...           │
│ 4. Run backfill: node backfill_embeddings│
│ ✅ Quick, local, easy to debug          │
└─────────────────────────────────────────┘
         ↓
      [Backfill runs]
         ↓
┌─────────────────────────────────────────┐
│ Database updated with embeddings        │
└─────────────────────────────────────────┘


PATH B: Supabase Edge Function (Production)
┌─────────────────────────────────────────┐
│ 1. Deploy Edge Function to Supabase     │
│ 2. Verify deployment in dashboard       │
│ 3. Run with: USE_LOCAL_API=false        │
│ ✅ Serverless, scalable, production    │
└─────────────────────────────────────────┘
         ↓
      [Backfill runs]
         ↓
┌─────────────────────────────────────────┐
│ Database updated with embeddings        │
└─────────────────────────────────────────┘
```

## 🔐 Authentication Flow

```
Local API:
  backfill_embeddings.js
    ├─ Load VITE_SUPABASE_ANON_KEY (from .env)
    ├─ Fetch rows: GET /rest/v1/music_knowledge
    │   Header: Authorization: Bearer {ANON_KEY}
    │
    └─ Call endpoint: POST /api/upsert-embeddings
        └─ No auth needed (local localhost)


Supabase Edge Function:
  backfill_embeddings.js
    ├─ Load VITE_SUPABASE_ANON_KEY
    │
    └─ Call function: POST /functions/v1/upsert-embeddings
        ├─ Function can access SUPABASE_SERVICE_ROLE_KEY
        ├─ Function can update database directly
        └─ No additional auth required
```

---

These diagrams show the complete system architecture, data flow, and execution paths for the embedding backfill system.
