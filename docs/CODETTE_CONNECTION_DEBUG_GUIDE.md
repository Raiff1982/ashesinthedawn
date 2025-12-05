# ?? Codette API Connection Debugging Guide

## Quick Checklist

This guide will help you diagnose connection issues between your React frontend and Codette backend server.

---

## 1?? Environment Configuration Check

### Step 1: Verify .env File

**File**: `.env` (in project root)

```bash
# Should contain:
VITE_CODETTE_API=http://localhost:8000
```

**Common Issues**:
- ? Typo in variable name (should be `VITE_CODETTE_API`, not `VITE_CODETTE_SERVER`)
- ? Wrong port (should be `8000`, not `8001` or `5000`)
- ? Protocol mismatch (`http://` vs `https://`)
- ? Extra spaces or trailing slashes

**Check it**:
```bash
# Windows PowerShell
type .env | findstr VITE_CODETTE

# Linux/Mac
grep VITE_CODETTE .env
```

### Step 2: Verify .env.example

**File**: `.env.example`

Should match `.env` for consistency:
```
VITE_CODETTE_API=http://localhost:8000
```

---

## 2?? Backend Server Configuration

### Step 1: Verify codette_server_unified.py

**File**: `codette_server_unified.py` (line ~1305)

```python
if __name__ == "__main__":
    host = os.getenv('CODETTE_HOST', '0.0.0.0')
    port = int(os.getenv('CODETTE_PORT', 8000))  # ? Should default to 8000
```

**Check it**:
```bash
# Verify no custom CODETTE_PORT override
echo %CODETTE_PORT%  # Windows
echo $CODETTE_PORT   # Linux/Mac
```

### Step 2: Start Backend and Verify

```bash
# Terminal 1: Start server
cd I:\ashesinthedawn
python codette_server_unified.py

# Expected output:
# ? FastAPI app created with CORS enabled
# ? Real Codette AI Engine initialized successfully
# Uvicorn running on http://0.0.0.0:8000
```

**Check for errors**:
- ? Port already in use: `Address already in use`
- ? Import errors: `ModuleNotFoundError`
- ? Supabase errors: `[WARNING] Failed to connect to Supabase`

---

## 3?? Frontend Configuration

### Step 1: Verify codetteBridge.ts

**File**: `src/lib/codetteBridge.ts` (line ~16)

```typescript
const CODETTE_API_BASE = import.meta.env.VITE_CODETTE_API || "http://localhost:8000";
```

**What it should do**:
1. Read `VITE_CODETTE_API` from `.env`
2. Fall back to `http://localhost:8000` if not set
3. Use this value for all API calls

**Test it in browser console**:
```javascript
// In browser DevTools console
console.log(import.meta.env.VITE_CODETTE_API);
// Should output: http://localhost:8000
```

### Step 2: Start Frontend

```bash
# Terminal 2: Start React dev server
npm run dev

# Expected output:
# VITE v7.2.4 ready in 123 ms
# ?  Local:   http://localhost:5173/
```

---

## 4?? Testing HTTP Endpoints

### Test 1: Health Check (Easiest)

**From terminal**:
```bash
# Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:8000/health" -Method Get

# Linux/Mac/Git Bash
curl http://localhost:8000/health

# Expected response (200 OK):
# {
#   "status": "healthy",
#   "service": "Codette AI Unified Server",
#   "timestamp": "2025-12-03T15:00:00Z"
# }
```

**From browser**:
1. Open `http://localhost:8000/health`
2. Should see JSON response (not HTML error)

### Test 2: API Health

```bash
curl -X GET "http://localhost:8000/api/health"

# Expected (200 OK):
# {
#   "success": true,
#   "data": {"status": "ok", "service": "codette"},
#   "timestamp": "..."
# }
```

### Test 3: Chat Endpoint

```bash
curl -X POST "http://localhost:8000/codette/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is gain staging?",
    "perspective": "mix_engineering"
  }'

# Expected (200 OK):
# {
#   "response": "...",
#   "perspective": "mix_engineering",
#   "confidence": 0.85,
#   "timestamp": "..."
# }
```

---

## 5?? Testing WebSocket Endpoints

### Using wscat (Terminal)

```bash
# Install if needed
npm install -g wscat

# Test WebSocket connection
wscat -c "ws://localhost:8000/ws/transport/clock"

# Expected output:
# Connected (press CTRL+C to quit)
# {"playing": false, "time_seconds": 0, ...}

# (If it hangs, that's OK - server is sending updates every 33ms)
```

### Using JavaScript in Browser Console

```javascript
// In browser DevTools console
const ws = new WebSocket("ws://localhost:8000/ws/transport/clock");

ws.onopen = () => console.log("? WebSocket connected");
ws.onmessage = (e) => console.log("?? Message:", JSON.parse(e.data));
ws.onerror = (e) => console.error("? Error:", e);
ws.onclose = () => console.log("? Closed");

// Expected output:
// ? WebSocket connected
// ?? Message: {type: 'state', data: {playing: false, time_seconds: 0, ...}}
```

---

## 6?? CORS Configuration Check

### Server CORS Setting

**File**: `codette_server_unified.py` (line ~250)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Check it**:
- ? `http://localhost:5173` is in `allow_origins` (your frontend port)
- ? `allow_credentials=True` (for cookies/auth)
- ? `allow_methods=["*"]` (allows GET, POST, etc.)

### Browser Console - Check CORS Error

If you see this error:
```
Access to XMLHttpRequest at 'http://localhost:8000/codette/chat' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Causes**:
- ? Server not running
- ? Wrong CORS origin in server config
- ? Port mismatch between frontend and env var

---

## 7?? Network Debugging

### Browser DevTools Network Tab

1. Open `http://localhost:5173` in browser
2. Press `F12` to open DevTools
3. Go to **Network** tab
4. Try to trigger an API call (e.g., click a button that uses Codette)
5. Look for request in Network tab

**What to check**:

| Column | Expected | Problem |
|--------|----------|---------|
| Status | 200 | 404 = Wrong path, 403 = Auth, 500 = Server error |
| Type | xhr/fetch | Missing request |
| URL | `http://localhost:8000/codette/...` | Wrong domain/port |
| Request Headers | `Authorization`, `Content-Type` | Missing headers |
| Response | Valid JSON | HTML error page means 404/500 |

**Example bad request**:
```
GET http://localhost:8001/codette/chat    ? Wrong port!
Status: 504 Gateway Timeout              ? No server listening
```

**Example good request**:
```
POST http://localhost:8000/codette/chat    ? Correct!
Status: 200 OK                             ? Success
Response: {"response": "...", "confidence": 0.85}
```

---

## 8?? Common Connection Problems & Solutions

### Problem 1: "Connection Refused"

**Symptom**:
```
Error: connect ECONNREFUSED 127.0.0.1:8000
```

**Solutions**:
1. ? Is backend server running?
   ```bash
   python codette_server_unified.py
   ```

2. ? Is it on port 8000?
   ```bash
   # Check what's listening on 8000
   netstat -ano | findstr :8000  # Windows
   lsof -i :8000                 # Mac/Linux
   ```

3. ? Is firewall blocking it?
   - Windows Defender ? Allow app through firewall
   - macOS ? System Preferences ? Security & Privacy

---

### Problem 2: "404 Not Found"

**Symptom**:
```
POST http://localhost:8000/codette/chat
Status: 404 Not Found
```

**Solutions**:
1. ? Check exact path (case-sensitive):
   - `/codette/chat` ? Correct
   - `/Codette/chat` ? Wrong (uppercase)
   - `/api/chat` ? Wrong (missing `/codette`)

2. ? Check method (POST vs GET):
   ```bash
   # For /codette/chat - MUST be POST
   curl -X POST http://localhost:8000/codette/chat
   
   # For /health - MUST be GET
   curl -X GET http://localhost:8000/health
   ```

---

### Problem 3: "403 Forbidden"

**Symptom**:
```
WebSocket connection failed
Status: 403 Forbidden
```

**Solutions**:
1. ? Check CORS origin in DevTools Network tab
   - Request: `Origin: http://localhost:5173`
   - Server should allow this in `allow_origins`

2. ? Verify server CORS config:
   ```python
   allow_origins=["http://localhost:5173", ...]  # Must include your port
   ```

3. ? Check for authentication requirements:
   - Does server require `Authorization` header?
   - Is JWT token passed?

---

### Problem 4: "WebSocket Connection Failed"

**Symptom**:
```javascript
// Browser console
ws.onerror = Error event
ws.readyState = 3 (CLOSED)
```

**Solutions**:
1. ? Test with curl first:
   ```bash
   curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
     http://localhost:8000/ws
   ```

2. ? Check endpoint path:
   - `ws://localhost:8000/ws` ? Correct
   - `ws://localhost:8000/ws/` ? Trailing slash might fail
   - `wss://localhost:8000/ws` ? Wrong (https page ? wss only)

3. ? Verify Origin header:
   ```javascript
   // Browser DevTools > Network > find ws request
   // Check Request Headers:
   // Origin: http://localhost:5173
   // Connection: Upgrade
   // Upgrade: websocket
   ```

---

### Problem 5: "Mixed Content" (HTTPS Frontend to HTTP Backend)

**Symptom**:
```
Mixed Content: The page was loaded over HTTPS, 
but requested an insecure XMLHttpRequest endpoint.
```

**Solutions**:
1. ? Use matching protocols:
   - Frontend `https://` ? Backend `https://` (wss://)
   - Frontend `http://` ? Backend `http://` (ws://)

2. ? For development: Use HTTP for both
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:8000`

---

## 9?? Advanced Debugging

### Enable Detailed Logging

**In codetteBridge.ts**, add logging:

```typescript
class CodetteBridge {
  async makeRequest<T>(method: string, endpoint: string, data: any): Promise<T> {
    const url = `${CODETTE_API_BASE}${endpoint}`;
    
    console.log(`[CodetteBridge] ${method.toUpperCase()} ${url}`);
    console.log('[CodetteBridge] Payload:', data);
    
    try {
      const response = await fetch(url, {
        method: method === 'GET' ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: method === 'GET' ? undefined : JSON.stringify(data),
      });
      
      console.log(`[CodetteBridge] Response Status: ${response.status}`);
      const result = await response.json();
      console.log('[CodetteBridge] Response Data:', result);
      
      return result as T;
    } catch (error) {
      console.error(`[CodetteBridge] Error: ${error}`);
      throw error;
    }
  }
}
```

### Check Server Logs

**Terminal running backend**:
```bash
# Look for error messages:
ERROR in /codette/chat: ...
WARNING: Could not import Codette ...
? FastAPI app created
```

---

## ?? Final Verification Checklist

Run through this before declaring victory:

- [ ] `.env` file has `VITE_CODETTE_API=http://localhost:8000`
- [ ] Backend running: `python codette_server_unified.py` (no errors)
- [ ] Frontend running: `npm run dev` (on port 5173)
- [ ] `curl http://localhost:8000/health` returns 200 OK
- [ ] Browser console: `import.meta.env.VITE_CODETTE_API` shows correct URL
- [ ] Network tab shows requests to `http://localhost:8000/codette/...`
- [ ] WebSocket connects: `ws://localhost:8000/ws/transport/clock`
- [ ] No CORS errors in browser console
- [ ] No 404/403/500 errors in Network tab

---

## ?? If Still Stuck

**Capture this info and share**:

1. **Backend console output**:
   ```bash
   python codette_server_unified.py 2>&1 | head -20
   ```

2. **Frontend .env**:
   ```bash
   cat .env | grep VITE_CODETTE
   ```

3. **Health check response**:
   ```bash
   curl -v http://localhost:8000/health
   ```

4. **Browser console error** (screenshot or copy):
   - Right-click ? Inspect ? Console tab
   - Copy full error message

5. **Network tab request/response**:
   - F12 ? Network tab
   - Try API call
   - Right-click failed request ? Copy as cURL

---

**Last Updated**: 2025-12-03  
**Version**: 1.0  
**For**: Codette AI Server Integration  
