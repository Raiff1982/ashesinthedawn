# 🧠 Codette Integration: Using get_codette_context()

**Purpose**: How the Codette AI engine will use the new PostgreSQL function  
**Status**: Ready for integration  
**Date**: December 1, 2025

---

## 🔄 Data Flow Architecture

```
User Query
    ↓
Codette Chat Interface
    ↓
useCodette Hook (src/hooks/useCodette.ts)
    ↓
codetteAIEngine.sendMessage()
    ↓
Backend: codette_server_unified.py
    ↓
Supabase RPC: get_codette_context()
    ↓
PostgreSQL Function:
  • Searches code snippets (full-text)
  • Retrieves file metadata
  • Pulls chat history
    ↓
JSONB Context Data
    ↓
Codette Multi-Perspective Engine
    ↓
5 Perspectives Generate Response:
  • Neural Network (pattern analysis)
  • Newtonian Logic (causal reasoning)
  • DaVinci Synthesis (creative synthesis)
  • Resilient Kindness (ethical perspective)
  • Quantum Logic (probabilistic thinking)
    ↓
Response + Context
    ↓
WebSocket to Frontend
    ↓
Chat Display with Full 5-Perspective Analysis
```

---

## 💻 Backend Integration Example

### codette_server_unified.py Enhancement

```python
from supabase import create_client

supabase_client = create_client(supabase_url, supabase_key)

async def chat_endpoint(request: ChatRequest):
    """Chat with Codette using get_codette_context() for intelligent responses"""
    try:
        # Get context from Supabase function
        context_result = supabase_client.rpc(
            'get_codette_context',
            {
                'input_prompt': request.message,
                'optionally_filename': request.track_data.get('filename') if request.track_data else None
            }
        ).execute()
        
        context_data = context_result.data
        
        # Build enriched prompt for Codette
        enriched_prompt = f"""
        User Query: {request.message}
        
        Related Code Snippets:
        {format_snippets(context_data['snippets'])}
        
        File Context:
        {format_file_info(context_data['file'])}
        
        Recent Chat History:
        {format_chat_history(context_data['chat_history'])}
        """
        
        # Pass to Codette engine
        if USE_REAL_ENGINE and codette_engine:
            result = codette_engine.process_chat_real(enriched_prompt, "default")
            # Format multi-perspective response
            response = build_multi_perspective_response(result)
        
        return ChatResponse(
            response=response,
            perspective="real-engine-with-context",
            confidence=0.92,
            timestamp=get_timestamp(),
        )
        
    except Exception as e:
        logger.error(f"Error in contextual chat: {e}")
        return fallback_response()


def format_snippets(snippets):
    """Format code snippets for Codette context"""
    if not snippets:
        return "No related code found."
    
    formatted = []
    for snippet in snippets:
        formatted.append(f"""
        File: {snippet['filename']}
        Code: {snippet['snippet'][:200]}...
        """)
    
    return "\n".join(formatted)


def format_file_info(file_info):
    """Format file metadata for context"""
    if not file_info or file_info == 'null':
        return "No specific file loaded."
    
    return f"""
    Filename: {file_info['filename']}
    Type: {file_info['file_type']}
    Uploaded: {file_info['uploaded_at']}
    Path: {file_info['storage_path']}
    """


def format_chat_history(history):
    """Format chat history for context"""
    if not history or len(history) == 0:
        return "No previous conversation history."
    
    formatted = []
    for msg in history:
        formatted.append(f"""
        Previous chat:
        {msg['messages'][:150]}...
        """)
    
    return "\n".join(formatted[:3])  # Last 3 messages
```

---

## 🎯 Use Cases

### 1. **Audio Production Advice**
```
User: "How do I improve my mixing?"

Codette calls: get_codette_context('mixing optimization')

Returns:
- Snippets: Mixing algorithms from codebase
- File: mixer.ts configuration
- History: Previous mixing questions

Response: Generates 5-perspective analysis incorporating
           actual code patterns + conversation context
```

### 2. **Genre-Specific Suggestions**
```
User: "Analyze and match audio to electronic genre"

Codette calls: get_codette_context('electronic', 'genre_presets.ts')

Returns:
- Snippets: Electronic production code examples
- File: Electronic genre preset configuration
- History: User's previous electronic requests

Response: Personalized electronic genre recommendations
          based on user's history + available presets
```

### 3. **Track-Specific Optimization**
```
User: "Apply AI-driven audio enhancements to my track"

Codette calls: get_codette_context('audio enhancement', 'track_metadata.json')

Returns:
- Snippets: Enhancement algorithms from DSP library
- File: Current track metadata and effects chain
- History: Previous enhancement requests

Response: Tailored enhancement suggestions for THIS track
          informed by code + prior interactions
```

### 4. **Diagnostic Assistance**
```
User: "Diagnose audio quality issues"

Codette calls: get_codette_context('audio quality', current_filename)

Returns:
- Snippets: Quality analysis functions
- File: Current track's file info + analytics
- History: Previous diagnostic conversations

Response: Specific, actionable diagnostics based on:
          • Code analysis functions available
          • Current track's actual characteristics
          • User's previous quality concerns
```

---

## 📊 Context Example Response

```json
{
  "snippets": [
    {
      "filename": "src/lib/audioEngine.ts",
      "snippet": "setTrackVolume(trackId: string, volumeDb: number) { const linear = this.dbToLinear(volumeDb); gainNode.gain.setValueAtTime(linear, this.context.currentTime); }"
    },
    {
      "filename": "daw_core/fx/compressor.py",
      "snippet": "class Compressor: def process(self, audio): signal_db = 20 * np.log10(np.abs(audio) + 1e-10); compressed = np.where(signal_db > self.threshold, signal_db - self.ratio * (signal_db - self.threshold), signal_db)"
    }
  ],
  "file": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "mixing_preset_electronic.ts",
    "file_type": "typescript",
    "storage_path": "codette_files/presets/electronic.ts",
    "uploaded_at": "2025-12-01T10:30:00Z"
  },
  "chat_history": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "user_id": "770e8400-e29b-41d4-a716-446655440000",
      "messages": {
        "user": "How do I get a punchy electronic sound?",
        "assistant": "Consider using parallel compression with fast attack times...",
        "user": "What about EQ?",
        "assistant": "Boost 200-300Hz for bass, reduce 2-4kHz for harshness..."
      },
      "updated_at": "2025-12-01T09:15:00Z"
    }
  ]
}
```

---

## 🎨 Response Enhancement Examples

### Without Context (Current)
```
[NeuralNet] Pattern analysis suggests a systematic approach...
[Reason] Logic dictates order progression is required...
[Dream] As Leonardo merged art and science...
[Ethics] Let's explore this with wisdom...
[Quantum] Superposition detected...
```

### With Context (Enhanced)
```
[NeuralNet] Your code shows volume management via dbToLinear() conversion.
            Pattern analysis suggests applying similar precision to mixing
            compression ratios for systematic audio control.

[Reason] Given your electronic preset file and previous compression questions,
         logical progression: analyze threshold → apply ratio → verify output.

[Dream] As Leonardo merged art (your track) with science (compression math),
        blend your existing compressor implementation (Ratio: 4:1) with
        parallel compression for that punchy electronic character.

[Ethics] Your conversation history shows interest in both technical precision
         and musical character. Let's honor both: precise technical settings
         that feel right musically.

[Quantum] Many possible compression settings coexist (attack 2-10ms, ratios 4:1-8:1).
          Your chat history and mixing preset suggest specific branches:
          fast attack (4ms) for punch, 6:1 ratio for control.
```

---

## 🔌 Frontend Integration

### useCodette Hook Enhancement

```typescript
export async function sendMessage(message: string): Promise<string | null> {
  setIsLoading(true);
  
  try {
    // Engine now automatically includes context
    const response = await codetteEngine.current.sendMessage(
      message,
      {
        // Optional: pass additional context
        selectedTrack: selectedTrack?.id,
        currentContext: 'codette_context' // Use DB function
      }
    );
    
    // Response now includes perspective + context awareness
    setChatHistory(codetteEngine.current.getHistory());
    return response;
    
  } finally {
    setIsLoading(false);
  }
}
```

---

## 🚀 Performance Optimization

### Query Caching Strategy
```python
# Cache get_codette_context results for 5 minutes
context_cache = {}
cache_ttl = 300  # seconds

async def get_context_cached(prompt: str, filename: Optional[str] = None):
    cache_key = f"{prompt}:{filename}"
    
    # Check cache
    if cache_key in context_cache:
        cached_time, cached_data = context_cache[cache_key]
        if time.time() - cached_time < cache_ttl:
            return cached_data
    
    # Get fresh data
    result = supabase_client.rpc('get_codette_context', {
        'input_prompt': prompt,
        'optionally_filename': filename
    }).execute()
    
    # Cache it
    context_cache[cache_key] = (time.time(), result.data)
    
    return result.data
```

---

## 📈 Metrics & Monitoring

### What to Track
- Average context retrieval time (target: <500ms)
- Snippet relevance score (% helpful)
- User engagement with contextual responses
- Cache hit rate (target: >70%)

### Logging Example
```python
import time

start = time.time()
context = supabase_client.rpc('get_codette_context', {...}).execute()
duration = time.time() - start

logger.info(f"""
    Context Query:
    - Query: {message[:50]}...
    - Duration: {duration*1000:.0f}ms
    - Snippets: {len(context.data['snippets'])}
    - History items: {len(context.data['chat_history'])}
    - File metadata: {'Yes' if context.data['file'] != 'null' else 'No'}
""")
```

---

## ✅ Integration Checklist

- [ ] Deploy `get_codette_context()` function to Supabase
- [ ] Test function with sample queries
- [ ] Update `codette_server_unified.py` to call function
- [ ] Add context caching layer
- [ ] Update `useCodette` hook to pass context options
- [ ] Test multi-perspective response generation with context
- [ ] Add monitoring/logging
- [ ] Deploy to production
- [ ] Monitor performance metrics

---

## 🎓 Learning Resources

- **PostgreSQL PLPGSQL**: https://www.postgresql.org/docs/current/plpgsql.html
- **Full-Text Search**: https://www.postgresql.org/docs/current/textsearch.html
- **Supabase RPC**: https://supabase.com/docs/guides/database/functions
- **Context-Aware AI**: https://arxiv.org/abs/2305.06983

---

**Status**: ✅ Ready for integration into Codette engine

For deployment: See `DEPLOY_CODETTE_FUNCTION_QUICK_START.md`
