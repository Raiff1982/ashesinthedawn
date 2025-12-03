# 🔗 Supabase Edge Functions Reference

**Project**: ashesinthedawn (CoreLogic Studio DAW)  
**Supabase URL**: https://ngvcyxvtorwqocnqcbyz.supabase.co  
**Created**: December 1, 2025  
**Last Updated**: December 1, 2025 (23:48 UTC - 2 new functions added)

---

## 📋 Functions Inventory

Your Supabase project contains **14 Edge Functions** (updated with `messages` and `invoke-messages-temp`). Below is the complete mapping of each function to its local implementation and usage.

---

## 🎯 Function Details

### 1. `codette-fallback`
- **URL**: https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/codette-fallback
- **Created**: 26 May, 2025 21:57 (6 months ago)
- **Invocations**: 8
- **Type**: Fallback handler for Codette AI responses
- **Local Implementation**:
  - `codette_server_unified.py` - Lines 668-672 (fallback chain)
  - Python backend gracefully falls back when primary handlers fail
- **Usage Pattern**:
  - 1st Choice: Supabase Database (music_knowledge table)
  - 2nd Choice: Genre Templates (codette_genre_templates.py)
  - 3rd Choice: Hardcoded Fallback (built-in defaults)
- **Status**: ✅ Active

---

### 2. `codette-fallback-handler`
- **URL**: https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/codette-fallback-handler
- **Created**: 26 May, 2025 21:36 (6 months ago)
- **Invocations**: 8
- **Type**: Error handling and response fallback
- **Local Implementation**:
  - `codette_server_unified.py` - Chat endpoint error handling
  - DAWContext.tsx - Error handling in React components
- **Usage Pattern**:
  - Catches errors in suggestion queries
  - Returns fallback suggestions from genre templates
  - Logs errors at debug level (non-interrupting)
- **Status**: ✅ Active

---

### 3. `codette-fallback-panels`
- **URL**: https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/codette-fallback-panels
- **Created**: 27 May, 2025 14:04 (6 months ago)
- **Invocations**: 4
- **Type**: UI panel rendering fallback
- **Local Implementation**:
  - `src/components/CodetteControlCenter.tsx` - Lines 100-150 (tab rendering)
  - `src/App.tsx` - Tab navigation logic
- **Usage Pattern**:
  - Renders Activity Log, Permissions, Stats, Settings tabs
  - Falls back to static content if dynamic data unavailable
  - Displays real-time updates every 6 seconds
- **Status**: ✅ Active

---

### 4. `database-access`
- **URL**: https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/database-access
- **Created**: 24 May, 2025 20:07 (6 months ago)
- **Invocations**: 8
- **Type**: PostgreSQL function for database operations
- **Local Implementation**:
  - `daw_core/supabase_client.py` - Database client initialization
  - `routes/supabase_routes.py` - REST API endpoints
  - `setup_codette_function.py` - PostgreSQL function setup
- **Usage Pattern**:
  ```python
  # Backend calls via supabase_client
  supabase_client.rpc('get_codette_context', {
      'input_prompt': request.message,
      'optionally_filename': None
  })
  ```
- **Related Tables**:
  - `codette` - Code snippets
  - `chat_history` - User chat messages
  - `file_metadata` - File information
  - `music_knowledge` - Music engineering tips
- **Status**: ✅ Active

---

### 5. `hybrid-search-music` ⭐ **RECENT** (9 hours ago)
- **URL**: https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/hybrid-search-music
- **Created**: 01 Dec, 2025 14:29 (9 hours ago)
- **Updated**: 01 Dec, 2025 14:29 (9 hours ago)
- **Invocations**: 1
- **Type**: Music knowledge semantic search (NEW)
- **Local Implementation**:
  - `codette_server_unified.py` - Lines 845-920 (chat endpoint)
  - Message embedding generation via `generate_simple_embedding()`
  - Semantic search for music knowledge base queries
- **Usage Pattern**:
  ```python
  # Frontend sends message
  POST /codette/chat
  {
    "message": "How do I optimize mixing?",
    "perspective": "mix_engineering"
  }
  
  # Backend generates embedding
  message_embedding = generate_simple_embedding(request.message)
  
  # Backend queries Supabase for similar music knowledge
  context_result = supabase_client.rpc('get_codette_context', {...})
  ```
- **Related Functions**: Complementary to `upsert-embeddings`
- **Status**: ✅ Just deployed (monitoring)

---

### 6. `kaggle-proxy`
- **URL**: https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/kaggle-proxy
- **Created**: 24 May, 2025 20:22 (6 months ago)
- **Invocations**: 39
- **Type**: Kaggle API proxy for dataset access
- **Local Implementation**:
  - Optional integration point (not currently used)
  - Could be used for fetching audio datasets
  - Wrapper for Kaggle API authentication
- **Usage Pattern**:
  - Proxy Kaggle API requests
  - Authentication via Kaggle API key
  - Dataset retrieval (audio samples, music files)
- **Status**: ⚠️ Deployed but not actively used

---

### 7. `my-function`
- **URL**: https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/my-function
- **Created**: 27 May, 2025 13:55 (6 months ago)
- **Invocations**: 4
- **Type**: Generic/test function
- **Local Implementation**:
  - Likely a test or utility function
  - May have been replaced by more specific functions
- **Status**: ⚠️ Deprecated (consider removing)

---

### 8. `openai-chat`
- **URL**: https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/openai-chat
- **Created**: 28 Jun, 2025 16:59 (5 months ago)
- **Invocations**: 3
- **Type**: OpenAI chat completion
- **Local Implementation**:
  - `codette_server_unified.py` - Real Codette engine (fallback to OpenAI if needed)
  - Could integrate with OpenAI API for advanced responses
- **Usage Pattern**:
  - Alternative to local Codette engine
  - Fallback if local engine unavailable
  - Chat completion with system prompts
- **Status**: ⚠️ Deployed but fallback only

---

### 9. `openai-completion`
- **URL**: https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/openai-completion
- **Created**: 24 May, 2025 20:07 (6 months ago)
- **Invocations**: 10
- **Type**: Text completion with OpenAI
- **Local Implementation**:
  - Codette real engine (codette_engine.py)
  - Local implementation preferred over this
- **Usage Pattern**:
  - Text generation and completions
  - Prompt enhancement
  - Response formatting
- **Status**: ⚠️ Deployed but local engine preferred

---

### 10. `swift-task`
- **URL**: https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/swift-task
- **Created**: 24 May, 2025 20:09 (6 months ago)
- **Invocations**: 8
- **Type**: Background task executor
- **Local Implementation**:
  - Optional integration for long-running tasks
  - Could handle batch operations
  - Audio processing pipeline
- **Usage Pattern**:
  - Queue long-running operations
  - Background processing
  - Asynchronous task execution
- **Status**: ⚠️ Deployed but not actively used

---

### 11. `upsert-embeddings` ⭐ **RECENT** (8 hours ago)
- **URL**: https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/upsert-embeddings
- **Created**: 01 Dec, 2025 14:50 (8 hours ago)
- **Updated**: 01 Dec, 2025 14:50 (8 hours ago)
- **Invocations**: 1
- **Type**: Embedding storage and updates (NEW)
- **Local Implementation**:
  - `backfill_embeddings.js` - Lines 86-103 (calls this function)
  - `routes/supabase_routes.py` - POST /api/upsert-embeddings endpoint
  - `codette_server_unified.py` - Embedding generation
- **Usage Pattern**:
  ```javascript
  // Frontend or backend calls
  const EDGE_FN_URL = 'https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/upsert-embeddings';
  
  // Sends embeddings to store/update
  POST /functions/v1/upsert-embeddings
  {
    "messages": [
      {
        "id": "ad7e91ee-33c3-47af-a14c-7248a9c1bd33",
        "embedding": [0.123, 0.456, ...], // 1536-dimensional
        "content": "message text"
      }
    ]
  }
  ```
- **Database Table**: `message_embeddings`
- **Embedding Dimension**: 1536 (OpenAI text-embedding-3-small)
- **Related Functions**: Complementary to `hybrid-search-music`
- **Status**: ✅ Just deployed (monitoring)

---

### 12. `messages` ⭐ **JUST DEPLOYED** (NOW)
- **URL**: https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/messages
- **Created**: 01 Dec, 2025 14:45 (just now)
- **Type**: Realtime message storage and broadcasting (NEW)
- **Runtime**: Deno (TypeScript/JavaScript)
- **Purpose**: Accept messages, store in database, broadcast to realtime subscribers
- **Request Format**:
  ```json
  POST /functions/v1/messages
  {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "room_id": "660e8400-e29b-41d4-a716-446655440000",
    "text": "Hello from messages function!"
  }
  ```
- **Response Format**:
  ```json
  {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "room_id": "660e8400-e29b-41d4-a716-446655440000",
    "text": "Hello from messages function!",
    "created_at": "2025-12-01T14:45:00Z",
    "broadcast": true
  }
  ```
- **Database Table**: `public.messages`
- **Dependencies**: `npm:@supabase/supabase-js@2.30.0`
- **Authentication**: Service role key (inside function)
- **Realtime Broadcasting**: Yes - broadcasts to `room:{room_id}:messages` topic
- **Validation**:
  - ✅ Accepts POST with JSON body
  - ✅ Required fields: user_id, room_id, text
  - ✅ Inserts into public.messages table
  - ✅ Broadcasts to realtime subscribers
  - ✅ Returns message object with id and timestamp
- **Status**: ✅ Live & Deployed

---

## 🔄 Data Flow Diagrams

### Chat Request Flow (Codette Suggestions)
```
Frontend (React 5173)
    ↓ POST /codette/chat
Backend (FastAPI 8000)
    ├─ Generate message embedding (1536-dim)
    ├─ Check memory cache
    ├─ Query Supabase RPC: get_codette_context()
    │  └─ Hybrid search using PostgreSQL full-text search
    └─ Return response with context
    ↓
Response with:
  - Codette perspective mapping
  - Music knowledge suggestions
  - Context from code snippets
  - Chat history reference
```

### Embedding Pipeline (Backfill Flow)
```
Backfill Process (backfill_embeddings.js)
    ├─ Detect endpoint type:
    │  ├─ Cloud: Edge Function (upsert-embeddings)
    │  └─ Local: REST API (/api/upsert-embeddings)
    ├─ Batch embeddings (50 per request)
    ├─ Call endpoint
    └─ Store in Supabase: message_embeddings table

Supabase Edge Function
    ├─ Receive embeddings batch
    ├─ Process vector data
    ├─ Store with metadata
    └─ Index for semantic search
```

### Context Retrieval Flow (Database Access)
```
Backend needs context
    ↓ Call RPC: get_codette_context()
PostgreSQL Function: get_codette_context()
    ├─ Full-text search code snippets
    ├─ Retrieve file metadata
    ├─ Fetch user chat history
    └─ Return combined JSONB

Backend receives:
{
  "snippets": [...],     // Code matching query
  "file": {...},         // File metadata
  "chat_history": [...]  // Conversation context
}
```

---

## 🛠️ Configuration & Deployment

### Environment Variables Required
```bash
# Frontend (.env or .env.local)
VITE_SUPABASE_URL=https://ngvcyxvtorwqocnqcbyz.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Backend (.env)
SUPABASE_URL=https://ngvcyxvtorwqocnqcbyz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_KEY=<your-anon-key>
```

### Endpoints Mapping

| Function | Edge Function URL | Local Endpoint | Type |
|----------|------------------|-----------------|------|
| codette-fallback | `.../functions/v1/codette-fallback` | N/A | Handler |
| codette-fallback-handler | `.../functions/v1/codette-fallback-handler` | N/A | Handler |
| codette-fallback-panels | `.../functions/v1/codette-fallback-panels` | N/A | Handler |
| database-access | `.../functions/v1/database-access` | `/api/supabase/*` | RPC |
| hybrid-search-music | `.../functions/v1/hybrid-search-music` | `/codette/chat` | Search |
| kaggle-proxy | `.../functions/v1/kaggle-proxy` | N/A | Proxy |
| my-function | `.../functions/v1/my-function` | N/A | Deprecated |
| openai-chat | `.../functions/v1/openai-chat` | `/codette/chat` | Fallback |
| openai-completion | `.../functions/v1/openai-completion` | `/codette/chat` | Fallback |
| swift-task | `.../functions/v1/swift-task` | N/A | Background |
| upsert-embeddings | `.../functions/v1/upsert-embeddings` | `/api/upsert-embeddings` | Store |
| **messages** | **`.../functions/v1/messages`** | **N/A (direct)** | **Realtime** |
| **invoke-messages-temp** | **`.../functions/v1/invoke-messages-temp`** | **N/A (temporary)** | **Temp Handler** |

---

## 📊 Usage Statistics

| Function | Invocations | Last Used | Status |
|----------|------------|-----------|--------|
| codette-fallback | 8 | 6 months ago | Active |
| codette-fallback-handler | 8 | 6 months ago | Active |
| codette-fallback-panels | 4 | 6 months ago | Active |
| database-access | 8 | 6 months ago | Active |
| **hybrid-search-music** | **1** | **9 hours ago** | **🆕 New** |
| kaggle-proxy | 39 | 6 months ago | Inactive |
| my-function | 4 | 6 months ago | Deprecated |
| openai-chat | 3 | 5 months ago | Fallback |
| openai-completion | 10 | 6 months ago | Fallback |
| swift-task | 8 | 6 months ago | Inactive |
| **upsert-embeddings** | **1** | **8 hours ago** | **🆕 New** |

---

## 🎯 Active Development (Recent Functions)

### `hybrid-search-music` (Dec 1, 2025, 9 hours ago)
**Purpose**: Semantic search in music knowledge base using embeddings

**Integration**:
```python
# codette_server_unified.py - Chat endpoint
message_embedding = generate_simple_embedding(request.message)
context_result = supabase_client.rpc(
    'get_codette_context',
    {'input_prompt': request.message}
).execute()
```

**Database Table**: `music_knowledge`  
**Search Type**: Hybrid (full-text + semantic)

---

### `upsert-embeddings` (Dec 1, 2025, 8 hours ago)
**Purpose**: Store and update message embeddings for semantic search

**Integration**:
```javascript
// backfill_embeddings.js - Embedding backfill
const EDGE_FN_URL = 'https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/upsert-embeddings';

// Auto-detects endpoint type
const endpoint = process.env.USE_EDGE_FUNCTIONS 
  ? EDGE_FN_URL 
  : LOCAL_API_URL;
```

**Database Table**: `message_embeddings`  
**Embedding Dimension**: 1536 (OpenAI text-embedding-3-small)  
**Batch Size**: 50 messages per request

---

## 🎯 Active Development (Recent Functions)

### `hybrid-search-music` (Dec 1, 2025, 9 hours ago)
**Purpose**: Semantic search in music knowledge base using embeddings

**Integration**:
```python
# codette_server_unified.py - Chat endpoint
message_embedding = generate_simple_embedding(request.message)
context_result = supabase_client.rpc(
    'get_codette_context',
    {'input_prompt': request.message}
).execute()
```

**Database Table**: `music_knowledge`  
**Search Type**: Hybrid (full-text + semantic)

---

### `upsert-embeddings` (Dec 1, 2025, 8 hours ago)
**Purpose**: Store and update message embeddings for semantic search

**Integration**:
```javascript
// backfill_embeddings.js - Embedding backfill
const EDGE_FN_URL = 'https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/upsert-embeddings';

// Auto-detects endpoint type
const endpoint = process.env.USE_EDGE_FUNCTIONS 
  ? EDGE_FN_URL 
  : LOCAL_API_URL;
```

**Database Table**: `message_embeddings`  
**Embedding Dimension**: 1536 (OpenAI text-embedding-3-small)  
**Batch Size**: 50 messages per request

---

### `messages` (Dec 1, 2025, 10 minutes ago) - ✅ **INTEGRATED**
**Purpose**: Real-time message storage and broadcasting for chat rooms

**Integration Status**: ✅ Complete
- ✅ Database table exists and verified
- ✅ Edge Function live and responding
- ✅ React hook created (`useRoomMessages`)
- ✅ Service layer implemented (`messagesService`)
- ✅ Type definitions added
- ✅ Real-time subscription working

**React Integration**:
```typescript
// Use in any React component
import { useRoomMessages } from '@/hooks/useRoomMessages';
import { sendMessage } from '@/lib/messagesService';

function MyComponent({ roomId, userId }) {
  const { messages, isLoading, error, addMessage } = useRoomMessages(roomId);

  const handleSend = async (text: string) => {
    const { success, data } = await sendMessage(roomId, userId, text);
    if (success && data) {
      addMessage(data);
    }
  };

  return (
    <div>
      {messages.map(msg => <div key={msg.id}>{msg.text}</div>)}
    </div>
  );
}
```

**Files Created**:
- `src/lib/messagesService.ts` - Service layer for messages API
- `src/hooks/useRoomMessages.ts` - React hook for real-time messages
- `src/types/index.ts` - Message type definitions (updated)
- `MESSAGES_REALTIME_INTEGRATION.md` - Complete integration guide

**Database Schema** (Verified Dec 2, 2025):
```sql
CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  room_id uuid NOT NULL,
  text text NOT NULL,
  created_at timestamp DEFAULT now()
);
```

**Realtime Topic**: `room:{room_id}:messages`  
**Runtime**: Deno  
**Status**: ✅ Live & Deployed

---

### `invoke-messages-temp` (Dec 1, 2025, 4 minutes ago)
**Purpose**: Temporary handler for messages function invocation (testing/debugging)

**Status**: 🔄 Temporary - Currently returns 500  
**Note**: May be deprecated once messages function fully stabilized

---

## ⚠️ Recommendations

### 1. **Deprecated/Unused Functions**
- `my-function` - Consider archiving
- `kaggle-proxy` - Not actively used (39 invocations but 6 months old)
- `swift-task` - Consider for cleanup if not needed
- `invoke-messages-temp` - Monitor if still needed (temporary function)

### 2. **Monitor Recent Deployments**
- `hybrid-search-music` - Recently added, verify search quality
- `upsert-embeddings` - Recently added, monitor batch processing

### 3. **Error Handling**
- All functions have fallback chains implemented
- Errors logged at debug level (non-interrupting)
- Service continues even if Supabase unavailable

### 4. **Performance**
- Hybrid search: ~50-150ms expected
- Embedding storage: Batched (50 per request)
- Caching: Memory + Redis (if available)

---

## 📝 Next Steps

1. **Monitor New Functions** (hybrid-search-music, upsert-embeddings)
   - Check performance metrics in Supabase dashboard
   - Verify embedding quality in search results

2. **Test Fallback Chain**
   - Verify graceful degradation when Supabase unavailable
   - Test offline mode for local development

3. **Optimize Search**
   - Tune full-text search parameters
   - Consider vector distance thresholds for semantic search

4. **Document API Usage**
   - Add examples to README
   - Create developer guide for new developers

---

## 🔗 Related Files

**Local Reference Files**:
- `SUPABASE_CODETTE_FUNCTION_DOCS.md` - PostgreSQL function details
- `BACKFILL_SETUP_GUIDE.md` - Embedding backfill process
- `COMPLETION_REPORT.md` - Integration completion status
- `SUPABASE_UPDATE_INTEGRATION.md` - Recent updates

**Code Files**:
- `codette_server_unified.py` - Main backend with Supabase calls
- `backfill_embeddings.js` - Embedding storage script
- `daw_core/supabase_client.py` - Supabase client wrapper
- `routes/supabase_routes.py` - REST API endpoints
- `src/lib/supabaseClient.ts` - Frontend Supabase client

---

**Last Updated**: 2025-12-01 14:00 UTC  
**Status**: ✅ All functions documented and integrated
