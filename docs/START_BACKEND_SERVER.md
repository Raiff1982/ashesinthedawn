# ?? HOW TO START THE CODETTE BACKEND SERVER

## ?? CURRENT STATUS
The **Codette backend server is NOT running**. The frontend is getting 404 errors when trying to connect.

---

## ? QUICK START (3 Steps)

### Step 1: Open a Terminal/Command Prompt
```bash
# Navigate to the project directory
cd I:\ashesinthedawn
```

### Step 2: Start the Backend Server
```bash
# Run the Codette backend
python codette_server_unified.py
```

### Step 3: Verify It's Running
Open your browser and go to:
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Should see**: `{"status": "healthy", ...}`

---

## ?? WHAT YOU'LL SEE

### Successful Start Output
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
? Real Codette AI Engine initialized successfully
? Codette training data loaded successfully
? Codette (BroaderPerspectiveEngine) imported and initialized
? FastAPI app created with CORS enabled
? Supabase anon client connected
Starting Codette AI Unified Server on 0.0.0.0:8000
INFO:     Application startup complete.
```

### Then the Frontend Will Connect ?
- WebSocket `/ws` will connect
- `/codette/chat` will work
- `/codette/suggest` will work
- All endpoints will respond

---

## ?? TROUBLESHOOTING

### Error: "only one usage of each socket address"
**Problem**: Port 8000 is already in use  
**Solution**: Kill the process using it:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Then try starting again
python codette_server_unified.py
```

### Error: "Module not found"
**Problem**: Missing Python dependencies  
**Solution**: Install requirements:
```bash
pip install fastapi uvicorn pydantic supabase redis numpy textblob
python codette_server_unified.py
```

### Error: "Connection refused"
**Problem**: Server not running  
**Solution**: Make sure the terminal shows "Application startup complete" and keep it running

---

## ?? WHAT HAPPENS WHEN SERVER IS RUNNING

? Frontend connects to backend  
? WebSocket real-time updates work  
? Chat interface functional  
? Suggestions display  
? Audio analysis works  
? Transport controls respond  
? All Codette features available  

---

## ?? COMMAND REFERENCE

### Start Server
```bash
python codette_server_unified.py
```

### Check if Running
```bash
curl http://localhost:8000/health
```

### Stop Server
```
Press Ctrl+C in the terminal window
```

### View API Docs
```
Open http://localhost:8000/docs in your browser
```

### Check Port Usage
```bash
netstat -ano | findstr :8000
```

---

## ? YOU'RE READY TO GO!

1. **Start the backend**: `python codette_server_unified.py`
2. **Keep it running**: Don't close the terminal
3. **Use the frontend**: The UI will connect automatically
4. **Refresh browser**: If needed, refresh http://localhost:5173 or 5174

The frontend will immediately start showing:
- ? Green connection indicator
- ? Real-time suggestions
- ? Chat interface
- ? Audio analysis
- ? All Codette features

**That's it!** ??

