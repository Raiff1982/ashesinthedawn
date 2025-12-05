# ? Codette API - Quick Troubleshooting Guide

**Quick Fixes for Common Connection Issues**  
**Last Updated**: 2025-12-03

---

## ?? "Connection Refused" or "Cannot reach server"

### Symptoms
```
Error: connect ECONNREFUSED 127.0.0.1:8000
Failed to connect to localhost port 8000
```

### Quick Fix (30 seconds)
```bash
# 1. Is backend running?
python codette_server_unified.py

# 2. Is it on the right port?
netstat -ano | findstr :8000

# 3. Kill anything using port 8000
taskkill /PID <PID> /F

# 4. Restart backend
python codette_server_unified.py
```

### Verification
```bash
# Should respond
curl http://localhost:8000/health
```

---

## ?? "404 Not Found"

### Symptoms
```
GET http://localhost:8000/codette/chat
Status: 404 Not Found
```

### Quick Fix
**Check endpoint path (case-sensitive)**:
- ? `/codette/chat` (correct)
- ? `/Codette/chat` (wrong - capital C)
- ? `/api/codette/chat` (wrong - extra /api/)
- ? `/codette/chat/` (might be wrong - trailing slash)

**Test correct path**:
```bash
curl http://localhost:8000/codette/chat
# Should NOT be 404
```

---

## ?? "403 Forbidden" on WebSocket

### Symptoms
```
WebSocket connection failed
Status: 403 Forbidden
```

### Quick Fix
**Check CORS configuration in server**

Edit: `codette_server_unified.py` (line ~250)

```python
# Should include your frontend port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"],  # ? Check this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**If you changed frontend port**, update this list:
```python
allow_origins=["http://localhost:5174", "*"],  # ? If frontend on 5174
```

**Restart backend after changes**:
```bash
# Stop: Ctrl+C
# Start:
python codette_server_unified.py
```

---

## ?? ".env Variable Not Being Read"

### Symptoms
```javascript
// Browser console
console.log(import.meta.env.VITE_CODETTE_API);
// Output: undefined
```

### Quick Fix
**Option 1: Create/Fix .env file**

```bash
# Check if .env exists
cat .env

# Should contain:
VITE_CODETTE_API=http://localhost:8000

# If missing, create it:
echo VITE_CODETTE_API=http://localhost:8000 > .env
```

**Option 2: Restart dev server**

```bash
# Terminal with npm run dev
# Stop: Ctrl+C
# Restart:
npm run dev

# Refresh browser: Ctrl+Shift+R
```

### Verification
```bash
# Check frontend sees env var
grep VITE_CODETTE_API .env
# Should output: VITE_CODETTE_API=http://localhost:8000
```

---

## ?? "CORS Policy Blocked Request"

### Symptoms
```
Access to XMLHttpRequest at 'http://localhost:8000/codette/chat' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

### Quick Fix
**Check server CORS is correct**:

```bash
curl -v http://localhost:8000/health
# Look for response headers:
# Access-Control-Allow-Origin: *
```

**If missing, server not running or crashed**:
```bash
# Restart backend
python codette_server_unified.py
```

**If still missing**, check line ~250 in `codette_server_unified.py`:
```python
# Add CORS middleware BEFORE routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## ?? "Port Already in Use"

### Symptoms
```
OSError: [Errno 48] Address already in use
Address already in use (:8000)
```

### Quick Fix (1 minute)

**Option 1: Kill process on port 8000**
```bash
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill it (replace <PID> with actual PID)
taskkill /PID <PID> /F

# Restart backend
python codette_server_unified.py
```

**Option 2: Use different port**
```bash
# Set environment variable
set CODETTE_PORT=8001

# Or in PowerShell:
$env:CODETTE_PORT = 8001

# Start backend
python codette_server_unified.py

# Update .env
echo VITE_CODETTE_API=http://localhost:8001 > .env

# Restart frontend
npm run dev
```

---

## ?? "WebSocket Connection Timeout"

### Symptoms
```javascript
// Browser console
ws.readyState = 3  // CLOSED
ws.onerror = WebSocket error event
```

### Quick Fix
**Check WebSocket endpoint**:

Valid endpoints:
- ? `ws://localhost:8000/ws`
- ? `ws://localhost:8000/ws/transport/clock`

Invalid endpoints:
- ? `wss://localhost:8000/ws` (uses SSL, not set up for local)
- ? `http://localhost:8000/ws` (should be `ws://`, not `http://`)
- ? `ws://localhost:8000/ws/` (trailing slash might fail)

**Test WebSocket**:
```bash
wscat -c ws://localhost:8000/ws

# Should show:
# Connected (press CTRL+C to quit)
# (receives data stream)
```

---

## ?? "Mixed Content Error" (HTTPS Frontend)

### Symptoms
```
Mixed Content: The page was loaded over HTTPS, 
but requested an insecure XMLHttpRequest endpoint 'http://...'
```

### Quick Fix
**Protocols must match**:

| Frontend | Backend | Works? |
|----------|---------|--------|
| `http://` | `http://` | ? Yes |
| `https://` | `https://` | ? Yes |
| `http://` | `https://` | ? No (but OK for dev) |
| `https://` | `http://` | ? **BLOCKS** (security) |
| `https://` (with `ws://`) | `http://` | ? **BLOCKS** (security) |

**For Local Development**:
- Use `http://localhost:5173` (frontend)
- Use `http://localhost:8000` (backend)
- Use `ws://localhost:8000/ws` (WebSocket)

**For Production with HTTPS**:
- Use `https://yourdomain.com` (frontend)
- Use `https://api.yourdomain.com` (backend)
- Use `wss://api.yourdomain.com/ws` (WebSocket - secure)

---

## ?? "Module Not Found" at Backend Startup

### Symptoms
```
ModuleNotFoundError: No module named 'fastapi'
ImportError: No module named 'supabase'
```

### Quick Fix
```bash
# Install missing dependencies
pip install fastapi uvicorn supabase python-dotenv

# Or install all requirements
pip install -r requirements.txt

# Restart backend
python codette_server_unified.py
```

---

## ?? "Environment Variable Shows Wrong Value"

### Symptoms
```javascript
console.log(import.meta.env.VITE_CODETTE_API);
// Shows: http://localhost:8001 (wrong!)
// Expected: http://localhost:8000
```

### Quick Fix
**Update .env file**:

```bash
# Check current value
cat .env | grep VITE_CODETTE_API

# Should be:
VITE_CODETTE_API=http://localhost:8000

# If wrong, fix it:
# Option 1: Edit manually
notepad .env

# Option 2: Replace with correct value
(Get-Content .env) -replace 'VITE_CODETTE_API=.*', 'VITE_CODETTE_API=http://localhost:8000' | Set-Content .env
```

**Restart frontend**:
```bash
# Stop npm: Ctrl+C
npm run dev

# Hard refresh browser: Ctrl+Shift+R
```

---

## ?? "Backend Crashes After Starting"

### Symptoms
```
DeprecationWarning: ...
RuntimeError: event loop is closed
Process ended
```

### Quick Fix
**Check for Python version compatibility**:

```bash
python --version
# Should be 3.10 or higher
```

**If too old**:
```bash
# Use Python 3.10+
python3.10 codette_server_unified.py
```

**If still crashing**, check backend logs for specific error:
```bash
# Restart and capture output
python codette_server_unified.py 2>&1 | tee backend.log

# Look at last error in backend.log
```

---

## ?? "API Returns 500 Internal Server Error"

### Symptoms
```
POST http://localhost:8000/codette/chat
Status: 500 Internal Server Error
```

### Quick Fix
**Check backend console for error message**:

Backend terminal should show:
```
[ERROR] in /codette/chat: {error details}
```

**Common causes**:
1. Missing training data module
2. Supabase connection failed
3. Invalid request format

**Fix**:
```bash
# 1. Verify all modules loaded
# Check for [OK] messages at startup

# 2. Check request format
curl -X POST http://localhost:8000/codette/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "perspective": "mix_engineering"}'

# 3. If still failing, check server logs
# Look for [WARNING] or [ERROR] lines
```

---

## ?? "WebSocket Disconnects Randomly"

### Symptoms
```javascript
ws.onclose = CloseEvent
// Reconnects every few seconds
```

### Quick Fix
**Increase timeout values in codetteBridge.ts**:

```typescript
// Around line ~150
private baseReconnectDelay: number = 1000; // 1 second
private maxReconnectDelay: number = 30000; // 30 seconds
private maxReconnectAttempts: number = 10;
```

**Increase to**:
```typescript
private baseReconnectDelay: number = 2000; // 2 seconds
private maxReconnectDelay: number = 60000; // 60 seconds
private maxReconnectAttempts: number = 20;
```

**Restart frontend**:
```bash
npm run dev
```

---

## ?? "Browser Console: Cannot read property 'env' of undefined"

### Symptoms
```javascript
TypeError: Cannot read properties of undefined (reading 'env')
import.meta is undefined
```

### Quick Fix
**This means Vite isn't set up correctly**

```bash
# Check Vite version
npm ls vite

# Should be 7.x or higher

# If outdated, upgrade:
npm install --save-dev vite@latest

# Clear cache and restart
rm -r node_modules/.vite
npm run dev
```

---

## ?? Emergency Reset (Nuclear Option)

If everything is broken and you need to start fresh:

```bash
# 1. Kill all Node and Python processes
taskkill /F /IM node.exe
taskkill /F /IM python.exe

# 2. Clean frontend
rm -r node_modules
npm install

# 3. Restart both servers
# Terminal 1:
python codette_server_unified.py

# Terminal 2:
npm run dev

# 4. Hard refresh browser
# Ctrl+Shift+R (Windows)
# Cmd+Shift+R (Mac)
```

---

## ? Verification After Any Fix

After applying any fix, run this verification:

```bash
# 1. Check backend health
curl http://localhost:8000/health

# 2. Check environment variable
cat .env | grep VITE_CODETTE_API

# 3. Test WebSocket
wscat -c ws://localhost:8000/ws/transport/clock

# 4. Check browser console
# F12 ? Console ? type: import.meta.env.VITE_CODETTE_API
```

All should pass ?

---

## ?? Still Stuck?

**Collect this info and share**:

```bash
# 1. Backend version/status
python codette_server_unified.py 2>&1 | head -20

# 2. Environment check
echo "VITE_CODETTE_API: $(grep VITE_CODETTE_API .env)"

# 3. Port status
netstat -ano | findstr :8000
netstat -ano | findstr :5173

# 4. Health check
curl -v http://localhost:8000/health 2>&1 | head -30
```

---

**Version**: 1.0  
**Created**: 2025-12-03  
**Purpose**: Quick troubleshooting for Codette API connection issues
