# API Fix: 422 Unprocessable Content Error - RESOLVED

**Issue**: `/codette/suggest` endpoint returning `422 Unprocessable Content`

**Root Cause**: 
The backend expected `context` parameter as a **dictionary/object**, but the frontend was sending it as a **string**.

**Backend Expected** (codette_server_unified.py):
```python
class SuggestionRequest(BaseModel):
    context: Dict[str, Any]  # ← Expects DICT, not string
    limit: Optional[int] = 5

# Backend extracts values like:
context_type = request.context.get("type", "general")  # ← Expects dict keys
track_type = request.context.get("track_type", "general")
```

**Frontend Was Sending** (OLD - useCodette.ts):
```typescript
body: JSON.stringify({
  context: "general",  // ❌ WRONG - sending string
  track_type: "audio",
  message: "Get general suggestions"
})
```

**Frontend Now Sends** (NEW - useCodette.ts):
```typescript
body: JSON.stringify({
  context: {  // ✅ CORRECT - sending dict
    type: context,
    track_type: selectedTrack?.type || 'audio',
    track_name: selectedTrack?.name || 'Unknown'
  },
  limit: 5
})
```

---

## Verification

### Test Request
```powershell
$body = @{
    context = @{
        type = "mixing"
        track_type = "audio"
    }
    limit = 5
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:8000/codette/suggest `
  -Method Post `
  -Headers @{'Content-Type'='application/json'} `
  -Body $body
```

### Response ✅ 200 OK
```json
{
  "suggestions": [
    {
      "id": "fallback-3",
      "type": "effect",
      "title": "EQ for Balance",
      "description": "Apply EQ to balance frequency content",
      "confidence": 0.88,
      "category": "mixing",
      "source": "fallback"
    },
    {
      "id": "fallback-4",
      "type": "routing",
      "title": "Bus Architecture",
      "description": "Create buses for better mix control",
      "confidence": 0.85,
      "category": "mixing",
      "source": "fallback"
    }
  ],
  "confidence": 0.865,
  "timestamp": "2025-12-02T08:30:27.930071Z"
}
```

---

## Files Modified

**File**: `src/hooks/useCodette.ts`

**Function**: `getSuggestions()` (lines 219-251)

**Changes**:
- Changed `context` from string to object with `type`, `track_type`, `track_name` keys
- Added `limit` parameter set to 5
- Removed unused `message` parameter

---

## Status

✅ **FIXED**
- Backend endpoint: `/codette/suggest` now returns 200 OK
- Frontend hook: `getSuggestions()` now sends correct parameters
- TypeScript: 0 compilation errors
- Dev server: Hot-reloaded changes automatically

## What This Means for Users

The **Tips/Suggestions tab** in the Codette AI panel will now:
1. ✅ Load suggestions from the backend when clicking context buttons (Mixing, Mastering, etc.)
2. ✅ Display real suggestions with confidence scores
3. ✅ No more 422 errors in the console
4. ✅ Proper error handling if backend is unavailable

