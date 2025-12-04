# Codette Response Debugging Guide

## Problem: Repetitive Responses

If Codette keeps giving the same responses, she's using **mock fallback data** instead of the real backend.

## ? **FIXED** - Now with Debug Logging

I've added detailed console logging to track exactly what's happening:

### Check Your Browser Console

Open DevTools (F12) and look for these messages:

#### ? **GOOD** - Real Backend Responses:
```
?? Sending query to backend: your question
? Backend response received: {perspectives: {...}}
? Real backend response displayed
```

#### ?? **BAD** - Fallback Mock Data:
```
?? Backend response not OK, status: 404
?? Using fallback mock responses
```

Or:
```
? API call failed: TypeError: Failed to fetch
?? Using fallback mock responses
```

---

## Common Issues & Fixes

### Issue 1: Backend Not Running
**Symptoms:**
```
? API call failed: TypeError: Failed to fetch
```

**Fix:**
```bash
cd I:\ashesinthedawn\Codette
python -m uvicorn codette_server_unified:app --reload --host 0.0.0.0 --port 8000
```

**Verify:** Visit http://localhost:8000/health in browser - should show `{"status": "healthy"}`

---

### Issue 2: Wrong API URL
**Symptoms:**
```
?? Backend response not OK, status: 404
```

**Fix:** Check your `.env` file:
```env
VITE_CODETTE_API=http://localhost:8000
```

Then restart your React dev server:
```bash
npm run dev
```

---

### Issue 3: CORS Issues
**Symptoms:**
```
Access to fetch at 'http://localhost:8000/api/codette/query' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Fix:** Already configured in backend - but verify `codette_server_unified.py` has:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ? Should allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Issue 4: Response Format Mismatch
**Symptoms:**
```
? Backend response received: {...}
?? Using fallback mock responses
```

**This means the backend returned 200 OK but the response structure wasn't recognized.**

**Fix:** Check backend response format. Your server logs show:
```
2025-12-03 23:13:14,479 - codette_server_unified - INFO - Multi-perspective query: hello... with 11 perspectives
INFO: 127.0.0.1:52230 - "POST /api/codette/query HTTP/1.1" 200 OK
```

The backend IS responding! Let me check the response structure...

---

## Testing Backend Directly

Test if your backend is working correctly:

```bash
# Test query endpoint
curl -X POST http://localhost:8000/api/codette/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I improve my mix?",
    "perspectives": ["newtonian_logic", "human_intuition"],
    "context": {}
  }'
```

**Expected Output:**
```json
{
  "perspectives": {
    "newtonian_logic": "Analyzing through deterministic cause-effect: [response]",
    "human_intuition": "Understanding this through empathy: [response]"
  },
  "confidence": 0.85
}
```

If you see this structure, the backend is working correctly!

---

## Live Debugging in Browser

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Filter by "codette"**
4. **Send a message in Codette chat**
5. **Click on the request**
6. **Check Response tab**

Look for:
- **Status:** Should be `200 OK`
- **Response body:** Should have `perspectives` object
- **Content-Type:** Should be `application/json`

---

## Force Using Real Backend

Add this temporarily to `useCodette.ts` sendMessage function (line 314):

```typescript
console.log('?? Full backend response:', JSON.stringify(data, null, 2));
```

This will dump the entire backend response to console so you can see exactly what you're getting.

---

## Expected Backend Response Structure

Based on your server logs, the backend is processing 11 perspectives:

```
2025-12-03 23:13:14,479 - codette_server_unified - INFO - Multi-perspective query: hello... with 11 perspectives
```

The response should be:
```json
{
  "perspectives": {
    "newtonian_logic": "...",
    "davinci_synthesis": "...",
    "human_intuition": "...",
    "neural_network": "...",
    "quantum_logic": "...",
    "resilient_kindness": "...",
    "mathematical_rigor": "...",
    "philosophical": "...",
    "copilot_developer": "...",
    "bias_mitigation": "...",
    "psychological": "..."
  },
  "confidence": 0.85,
  "timestamp": "2025-12-03T23:13:14"
}
```

---

## Quick Test

1. Open browser console (F12)
2. Go to Codette chat tab
3. Type: "hello"
4. Send message
5. Watch console for logs:

**If you see:**
```
?? Sending query to backend: hello
? Backend response received: {...}
? Real backend response displayed
```

**Then it's working!** ??

**If you see:**
```
?? Using fallback mock responses
```

**Then check:**
- Is backend running? (`curl http://localhost:8000/health`)
- Is `.env` correct? (`VITE_CODETTE_API=http://localhost:8000`)
- Any CORS errors in console?

---

## Success Indicators

When working correctly, you'll see in backend logs:
```
INFO: Multi-perspective query: [your question] with 11 perspectives
INFO: Sentiment analysis: {...}
INFO: HTTP Request: POST https://...supabase.co/.../codette_conversations
INFO: 127.0.0.1:... - "POST /api/codette/query HTTP/1.1" 200 OK
```

And in frontend console:
```
?? Sending query to backend: [your question]
? Backend response received: {perspectives: {...}}
? Real backend response displayed
```

---

## Still Not Working?

Share these with me:

1. **Browser console logs** (all messages starting with ?? ? ?? ?)
2. **Backend server logs** (the lines you already shared are good!)
3. **Network tab** screenshot showing the request/response

Then I can diagnose the exact issue!

---

## What I Changed

1. ? **Added debug logging** to `sendMessage()` function
2. ? **Improved response parsing** to handle different backend formats
3. ? **Added logging** to `queryAllPerspectives()` 
4. ? **Console indicators** show when real backend vs mock data is used

Now you can see exactly what's happening! ??
