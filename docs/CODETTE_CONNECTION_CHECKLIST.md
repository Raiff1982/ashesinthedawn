# ? Codette API Connection Verification Checklist

**Date**: 2025-12-03  
**Status**: Ready for Testing  
**Version**: 1.0

---

## ?? Overview

This checklist guides you through verifying every component of the Codette API connection:
- **Frontend** (React on port 5173)
- **Backend** (Python FastAPI on port 8000)
- **Configuration** (environment variables)
- **Network** (CORS, WebSocket, HTTP)

Complete each section and mark ? when verified.

---

## ?? Pre-Check: System Prerequisites

- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] npm or yarn available
- [ ] Git cloned: `I:\ashesinthedawn`
- [ ] Both terminals available (one for backend, one for frontend)

**Verify**:
```bash
python --version      # Should be 3.10+
node --version        # Should be 18+
npm --version         # Should be 9+
```

---

## ?? SECTION 1: Backend Server Setup

### 1.1 Start Backend Server

**Task**: Start the Codette backend on port 8000

```bash
# Terminal 1
cd I:\ashesinthedawn
python codette_server_unified.py
```

**Checklist**:
- [ ] No import errors
- [ ] No port conflict errors
- [ ] Server shows: `? FastAPI app created with CORS enabled`
- [ ] Server shows: `Uvicorn running on http://0.0.0.0:8000`

**Expected Output**:
```
? FastAPI app created with CORS enabled
? Real Codette AI Engine initialized successfully
[INFO] Starting Codette AI Unified Server on 0.0.0.0:8000
```

**Troubleshoot if needed**:
- ? **Port 8000 already in use**?
  ```bash
  netstat -ano | findstr :8000
  # Kill the process or use different port
  ```
- ? **Module import errors**?
  ```bash
  pip install fastapi uvicorn supabase python-dotenv
  ```

### 1.2 Test Backend Health

**Task**: Verify backend is responding to HTTP requests

```bash
# Terminal 2 (new window)
curl http://localhost:8000/health
```

**Expected Response (200 OK)**:
```json
{
  "status": "healthy",
  "service": "Codette AI Unified Server",
  "real_engine": true,
  "training_available": true,
  "codette_available": true,
  "analyzer_available": true,
  "timestamp": "2025-12-03T15:00:00Z"
}
```

**Checklist**:
- [ ] Status code: **200**
- [ ] Response includes `"status": "healthy"`
- [ ] All components show `true` (real_engine, training_available, etc.)

**If failed**:
- Check backend terminal for errors
- Verify port 8000 is listening
- Check firewall settings

---

## ?? SECTION 2: Frontend Environment Setup

### 2.1 Verify .env Configuration

**File**: `.env` (in project root)

**Task**: Ensure environment variable is set correctly

**Checklist**:
- [ ] File `.env` exists in project root
- [ ] Contains line: `VITE_CODETTE_API=http://localhost:8000`
- [ ] No typos in variable name (should be `VITE_CODETTE_API`)
- [ ] Port is `8000` (not 8001 or 5000)
- [ ] Protocol is `http://` (not https for local dev)

**Verify**:
```bash
# Windows PowerShell
type .env | findstr VITE_CODETTE_API

# Linux/Mac
grep VITE_CODETTE_API .env

# Expected output:
# VITE_CODETTE_API=http://localhost:8000
```

**If not found**:
```bash
# Create/update .env
echo VITE_CODETTE_API=http://localhost:8000 >> .env
```

### 2.2 Verify Frontend Configuration

**File**: `src/lib/codetteBridge.ts` (line ~16)

**Task**: Confirm bridge correctly reads environment variable

**Checklist**:
- [ ] Line contains: `const CODETTE_API_BASE = import.meta.env.VITE_CODETTE_API || "http://localhost:8000";`
- [ ] Uses `import.meta.env` (Vite style, not `process.env`)
- [ ] Has fallback to `http://localhost:8000`

**Verify by searching**:
```bash
grep "CODETTE_API_BASE" src/lib/codetteBridge.ts
```

### 2.3 Start Frontend Development Server

**Task**: Start React dev server on port 5173

```bash
# Terminal 2 (if using Terminal 1 for backend)
# OR new Terminal 3 if backend still running
npm run dev
```

**Expected Output**:
```
VITE v7.2.4 ready in 123 ms

?  Local:   http://localhost:5173/
?  press h to show help
```

**Checklist**:
- [ ] No build errors shown
- [ ] Port shows **5173** (not 5174 or 3000)
- [ ] No TypeScript errors

**If port occupied**:
```bash
# Vite will try next available port (5174, 5175, etc.)
# Note the actual port and use it in browser
```

---

## ?? SECTION 3: Frontend Browser Testing

### 3.1 Open Frontend in Browser

**Task**: Open React application in browser

**URL**: `http://localhost:5173` (or actual port from npm output)

**Checklist**:
- [ ] Page loads without white screen
- [ ] No console errors (press F12 ? Console tab)
- [ ] Application UI visible

### 3.2 Check Environment Variable in Browser

**Task**: Verify Vite correctly loaded .env variable

**In Browser Console** (F12 ? Console):
```javascript
console.log(import.meta.env.VITE_CODETTE_API);
```

**Expected Output**:
```
http://localhost:8000
```

**Checklist**:
- [ ] Output shows `http://localhost:8000`
- [ ] NOT `undefined` or `null`
- [ ] NOT wrong port or protocol

**If showing undefined**:
1. Make sure `.env` file exists
2. Restart `npm run dev` (dev server needs restart after .env changes)
3. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### 3.3 Check Console for Connection Errors

**Task**: Look for any connection errors in browser

**In Browser Console** (F12 ? Console tab):

**Look for**:
```javascript
// ? Good - no errors related to localhost:8000
// ? Bad - errors like:
// "Failed to fetch"
// "ECONNREFUSED"
// "Access to XMLHttpRequest blocked by CORS policy"
```

**Checklist**:
- [ ] No errors about `localhost:8000`
- [ ] No CORS policy errors
- [ ] No 404 errors about `/codette/`

---

## ?? SECTION 4: API Endpoint Testing

### 4.1 Test Health Endpoint (Simple)

**Task**: Verify basic HTTP connectivity

**Via Browser**:
1. Open: `http://localhost:8000/health`
2. Should see JSON response (not error page)

**Via Terminal**:
```bash
curl http://localhost:8000/health
```

**Checklist**:
- [ ] Response is valid JSON
- [ ] Contains `"status": "healthy"`
- [ ] No HTML error tags (`<html>`, `<body>`, etc.)

### 4.2 Test Chat Endpoint

**Task**: Verify POST endpoint works

**Via Terminal**:
```bash
curl -X POST http://localhost:8000/codette/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"test\", \"perspective\": \"mix_engineering\"}"
```

**Expected Response**:
```json
{
  "response": "...",
  "perspective": "mix_engineering",
  "confidence": 0.75,
  "timestamp": "2025-12-03T..."
}
```

**Checklist**:
- [ ] Status code: **200 OK**
- [ ] Response contains `"response"` field
- [ ] Has `"confidence"` and `"timestamp"`

### 4.3 Test Codette Status Endpoint

**Task**: Get comprehensive server status

**Via Terminal**:
```bash
curl http://localhost:8000/codette/status
```

**Expected Response**:
```json
{
  "status": "running",
  "real_engine": true,
  "training_available": true,
  "perspectives_available": ["neuralnets", "mix_engineering", ...]
}
```

**Checklist**:
- [ ] All modules showing `true` or available
- [ ] Features list includes: `chat`, `analyze`, `suggest`, `transport_control`

---

## ?? SECTION 5: WebSocket Testing

### 5.1 Test WebSocket Connection (Advanced)

**Option A: Using Browser Console**

```javascript
// In browser F12 Console:
const ws = new WebSocket("ws://localhost:8000/ws/transport/clock");

ws.onopen = () => console.log("? Connected!");
ws.onmessage = (e) => console.log("??", JSON.parse(e.data));
ws.onerror = (e) => console.error("? Error:", e);

// After a few seconds, you should see WebSocket data
```

**Checklist**:
- [ ] See `? Connected!` message
- [ ] See `?? {type: 'state', data: {...}}` messages
- [ ] No `? Error` messages

**Option B: Using Terminal (requires wscat)**

```bash
npm install -g wscat

wscat -c ws://localhost:8000/ws/transport/clock

# Type in terminal:
# > {"type": "play"}
# < (receives response)
```

**Checklist**:
- [ ] WebSocket connects (no "Connection refused")
- [ ] Shows "Connected (press CTRL+C to quit)"
- [ ] Receives messages from server

---

## ?? SECTION 6: CORS & Security Verification

### 6.1 Check Server CORS Configuration

**File**: `codette_server_unified.py` (around line 250)

**Task**: Verify CORS allows frontend origin

**Look for**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Checklist**:
- [ ] Contains `"http://localhost:5173"` in `allow_origins`
- [ ] `allow_credentials=True`
- [ ] `allow_methods=["*"]` allows POST, GET, etc.

### 6.2 Check Browser Network Tab for CORS Headers

**Task**: Verify CORS headers in HTTP requests

**Steps**:
1. Open browser DevTools: F12
2. Go to **Network** tab
3. Make an API call (e.g., click a Codette feature button)
4. Find request in list (look for `/codette/...`)
5. Click request ? **Headers** tab

**Look for Response Headers**:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: *
```

**Checklist**:
- [ ] Response includes `Access-Control-Allow-*` headers
- [ ] Request status is **200** (not 403)
- [ ] No CORS error in browser console

---

## ?? SECTION 7: End-to-End Integration Test

### 7.1 Simulate User API Call

**Task**: Trigger an actual API call from frontend

**Steps**:
1. Open React app at `http://localhost:5173`
2. Open browser DevTools (F12)
3. Go to **Network** tab
4. Look for UI element that calls Codette API (e.g., "Ask Codette" button)
5. Click the button
6. Watch Network tab for requests

**Checklist**:
- [ ] See request to `http://localhost:8000/codette/...`
- [ ] Request method is correct (POST for chat, GET for health)
- [ ] Response status: **200 OK**
- [ ] Response contains valid JSON data

**Example Network Tab Entry**:
```
Name:    codette/chat
Method:  POST
Status:  200 OK
Type:    xhr
Size:    2.3 KB
Time:    234 ms
```

### 7.2 Verify Response in UI

**Task**: Confirm response displays correctly in React

**Checklist**:
- [ ] Response appears in UI (not just in Network tab)
- [ ] No error messages displayed
- [ ] Data formatted correctly (not raw JSON)

---

## ?? SECTION 8: Performance Verification

### 8.1 Check Response Times

**Task**: Verify API performance is acceptable

**In Network Tab**:
- Chat endpoint: Should respond in **100-500ms**
- Health endpoint: Should respond in **<100ms**
- WebSocket: Should send updates **every 33ms** (30 Hz)

**Checklist**:
- [ ] Chat responses within 500ms
- [ ] Health responses within 100ms
- [ ] WebSocket sending at steady rate

### 8.2 Monitor Server Console

**Task**: Check for any warnings or errors

**Backend Terminal Output**:
- Should show successful requests: `[INFO]` messages
- No `[ERROR]` messages (unless expected)
- No `[WARNING]` about failed imports

**Checklist**:
- [ ] Requests logged successfully
- [ ] No error messages about missing modules
- [ ] No repeated connection errors

---

## ?? FINAL VERIFICATION SUMMARY

**Total Checklist Items**: ~50

**Mark your completion status**:

| Section | Status | Pass |
|---------|--------|------|
| 1: Backend Setup | ?/? | ? |
| 2: Frontend Config | ?/? | ? |
| 3: Browser Test | ?/? | ? |
| 4: API Endpoints | ?/? | ? |
| 5: WebSocket | ?/? | ? |
| 6: CORS & Security | ?/? | ? |
| 7: E2E Integration | ?/? | ? |
| 8: Performance | ?/? | ? |

**Success Criteria**:
- ? All 8 sections passing
- ? No CORS errors in console
- ? All API responses 200 OK
- ? WebSocket connected and receiving data
- ? Response times acceptable

---

## ?? Troubleshooting Reference

If any section fails, refer to:

1. **Backend won't start**: See [CODETTE_CONNECTION_DEBUG_GUIDE.md](./CODETTE_CONNECTION_DEBUG_GUIDE.md) Problem 1
2. **404 errors**: See Debug Guide Problem 2
3. **403 CORS errors**: See Debug Guide Problem 3
4. **WebSocket won't connect**: See Debug Guide Problem 4
5. **Mixed content error**: See Debug Guide Problem 5

---

## ?? Quick Debug Commands

```bash
# Check if backend running
curl http://localhost:8000/health

# Check if frontend running
curl http://localhost:5173

# Test WebSocket
wscat -c ws://localhost:8000/ws/transport/clock

# Check env variable
cat .env | grep VITE_CODETTE

# See what's on port 8000
netstat -ano | findstr :8000

# Restart everything
# 1. Stop both terminals (Ctrl+C)
# 2. Start backend: python codette_server_unified.py
# 3. Start frontend: npm run dev
# 4. Refresh browser: Ctrl+Shift+R
```

---

**Version**: 1.0  
**Last Updated**: 2025-12-03  
**For Support**: See CODETTE_CONNECTION_DEBUG_GUIDE.md
