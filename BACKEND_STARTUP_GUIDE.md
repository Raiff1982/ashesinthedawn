# ?? GETTING CODETTE BACKEND RUNNING - STEP BY STEP

## ? QUICK START (2 minutes)

### Step 1: Open PowerShell/Terminal
```powershell
# Navigate to project
cd I:\ashesinthedawn
```

### Step 2: Start Backend Server
```powershell
python codette_server_unified.py
```

### Step 3: Verify It's Running
Wait for this output:
```
INFO:     Application startup complete.
```

**Then refresh your browser and the UI should connect!** ?

---

## ?? DETAILED TROUBLESHOOTING

### Is the server actually running?

**Test 1: Check if port is listening**
```powershell
# Windows
netstat -ano | findstr :8000

# You should see something like:
# TCP    0.0.0.0:8000           0.0.0.0:0              LISTENING       12345
```

**Test 2: Test the health endpoint**
```powershell
# PowerShell
Invoke-WebRequest -Uri "http://localhost:8000/health" -Method Get

# You should see 200 OK response
```

**Test 3: Run the diagnostic script**
```bash
python test_codette_connection.py
```

This will test:
- ? .env configuration
- ? HTTP endpoints
- ? Chat endpoint
- ? WebSocket readiness

---

## ?? COMMON ERRORS & FIXES

### Error 1: "Port 8000 already in use"
```
ERROR: [Errno 10048] error while attempting to bind on address ('0.0.0.0', 8000)
```

**Fix:**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill it (replace 12345 with actual PID)
taskkill /PID 12345 /F

# Start server again
python codette_server_unified.py
```

### Error 2: "ModuleNotFoundError"
```
ModuleNotFoundError: No module named 'fastapi'
```

**Fix:**
```bash
pip install fastapi uvicorn pydantic supabase redis numpy textblob
python codette_server_unified.py
```

### Error 3: "Connection refused" in browser
```
WebSocket connection to 'ws://localhost:8000/ws' failed
GET http://localhost:8000/codette/status 404 (Not Found)
```

**Fix:**
- Check that terminal shows "Application startup complete"
- Verify `netstat -ano | findstr :8000` shows LISTENING
- Refresh browser with Ctrl+F5 (hard refresh)

### Error 4: "Supabase connection failed"
```
Failed to connect to Supabase: credentials not found
```

**Fix (not critical):**
This is OK - the server works without Supabase. Check your `.env` file has:
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

---

## ? VERIFICATION CHECKLIST

When server is running, you should see this in terminal:

```
? ? Real Codette AI Engine initialized successfully
? ? Codette training data loaded successfully
? ? Codette (BroaderPerspectiveEngine) imported and initialized
? ? FastAPI app created with CORS enabled
? ? Supabase anon client connected
Starting Codette AI Unified Server on 0.0.0.0:8000
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## ?? WHAT SHOULD WORK IN BROWSER

### Health Check
Open: http://localhost:8000/health

Response:
```json
{
  "status": "healthy",
  "service": "Codette AI Unified Server",
  "real_engine": true,
  "training_available": true,
  "timestamp": "2025-12-03T..."
}
```

### API Docs
Open: http://localhost:8000/docs

You should see interactive Swagger UI with all endpoints

### Browser Console (No Errors!)
Should show:
```
? [CodetteBridge] WebSocket connected successfully
? [CodetteBridge] Health check successful
? Suggestions loaded
```

NOT:
```
? WebSocket connection failed
? 404 Not Found
? Connection refused
```

---

## ?? MANUAL TESTING

### Test Chat Endpoint
```powershell
$body = @{
    message = "What is gain staging?"
    perspective = "mix_engineering"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/codette/chat" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

Expected response:
```json
{
  "response": "Gain staging is...",
  "perspective": "mix_engineering",
  "confidence": 0.85,
  "timestamp": "2025-12-03T..."
}
```

### Test Suggestions Endpoint
```powershell
$body = @{
    context = @{
        type = "mixing"
        track_type = "audio"
    }
    limit = 5
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/codette/suggest" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

---

## ?? MONITORING THE SERVER

### Keep Terminal Visible
The server needs to stay running. Don't close the terminal!

### Watch for Errors
Look for any lines starting with:
- `ERROR`
- `WARNING`
- `CRITICAL`

### Check for Warnings (Usually OK)
These are normal and expected:
```
DeprecationWarning: on_event is deprecated
?? Redis unavailable (expected if not running)
```

### Performance Metrics
Watch the terminal for timestamps - each request should log:
```
[timestamp] [level] [message]
```

---

## ?? ONCE SERVER IS RUNNING

Your UI will automatically:

1. ? Connect to backend (green indicator)
2. ? Load suggestions (mix tips appear)
3. ? Enable chat (can type messages)
4. ? Show analysis (metrics display)
5. ? Enable transport (play/stop/seek work)
6. ? Real-time updates (WebSocket active)

---

## ?? IF YOU'RE STUCK

### Run Diagnostic Script
```bash
python test_codette_connection.py
```

This will tell you exactly what's working and what's not.

### Check These Files
- `.env` - Environment variables configured?
- `codette_server_unified.py` - Main server file (correct location?)
- Python version - `python --version` (should be 3.8+)

### Check Logs
In terminal where server is running, look for:
- Connection errors
- Port binding errors
- Module import errors
- Database connection errors

---

## ?? COMPLETE SETUP WORKFLOW

```
1. cd I:\ashesinthedawn
2. python codette_server_unified.py
3. Wait for "Application startup complete"
4. Open browser to http://localhost:8000/docs
5. Refresh DAW UI at http://localhost:5173
6. See green "Connected" indicator
7. UI now fully functional!
```

---

## ? YOU'RE READY!

The backend is fully implemented and correct. Just need to start it and keep it running!

**Remember**: The terminal window must stay open as long as you want to use the DAW UI.

