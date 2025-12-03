# Codette Unified Server - Quick Reference

## Starting the Server

### Method 1: Default Port (8000)
```bash
python codette_server_unified.py
```

### Method 2: Custom Port
```bash
set CODETTE_PORT=9000  # Windows
python codette_server_unified.py
```

Or:
```bash
$env:CODETTE_PORT=9000; python codette_server_unified.py  # PowerShell
```

## Frontend Configuration

### .env File
```dotenv
# Unified Codette AI server endpoint
VITE_CODETTE_API=http://localhost:8000
```

### codetteBridge.ts
The bridge automatically uses the environment variable:
```typescript
const CODETTE_API_BASE = import.meta.env.VITE_CODETTE_API || "http://localhost:8000";
```

## API Endpoints Cheat Sheet

### Chat & AI
```bash
# Get AI response
curl -X POST http://localhost:8000/codette/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is gain staging?",
    "perspective": "neuralnets"
  }'

# Get suggestions
curl -X POST http://localhost:8000/codette/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "context": {"type": "gain-staging"},
    "limit": 5
  }'
```

### Transport Control
```bash
# Get current status
curl http://localhost:8000/transport/status

# Play
curl -X POST http://localhost:8000/transport/play

# Stop
curl -X POST http://localhost:8000/transport/stop

# Seek to 10 seconds
curl http://localhost:8000/transport/seek?seconds=10

# Set tempo to 120 BPM
curl -X POST http://localhost:8000/transport/tempo?bpm=120

# Enable loop from 0 to 30 seconds
curl -X POST http://localhost:8000/transport/loop \
  -G --data-urlencode "enabled=true" \
  --data-urlencode "start_seconds=0" \
  --data-urlencode "end_seconds=30"
```

### Server Health
```bash
# Health check
curl http://localhost:8000/health

# Server status
curl http://localhost:8000/codette/status

# Training context
curl http://localhost:8000/api/training/context

# Training health
curl http://localhost:8000/api/training/health
```

## WebSocket Connection

### JavaScript (React)
```typescript
// Connect to transport clock
const ws = new WebSocket("ws://localhost:8000/ws/transport/clock");

// Listen for updates (60 FPS)
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "state") {
    console.log("Transport state:", data.data);
  }
};

// Send commands
ws.send(JSON.stringify({
  type: "play"
}));

ws.send(JSON.stringify({
  type: "seek",
  time_seconds: 5.0
}));

ws.send(JSON.stringify({
  type: "tempo",
  bpm: 140
}));
```

## Monitoring & Debugging

### Check Server Status
```bash
# In a new terminal
curl http://localhost:8000/health
```

### API Documentation
Open in browser: `http://localhost:8000/docs`

This shows the interactive Swagger UI with all endpoints.

### Server Logs
The server outputs detailed logs to console:
```
✅ Real Codette AI Engine initialized successfully
[OK] Codette training data loaded successfully
[OK] Codette analyzer initialized
```

## File Structure

```
i:\ashesinthedawn\
├── codette_server_unified.py      ← Main unified server
├── test_unified_server.py          ← Test suite
├── src/
│   └── lib/
│       └── codetteBridge.ts        ← Frontend bridge (updated)
├── .env.example                    ← Environment config (updated)
└── CODETTE_CONSOLIDATION_COMPLETE.md ← Consolidation details
```

## Integration Points

### React Components Using Codette

1. **codetteBridge.ts** - Main API wrapper
   - Chat interactions
   - Audio analysis
   - Suggestions
   - Transport control

2. **DAWContext.tsx** - May call Codette for AI features
   - Use `codetteBridge` methods
   - Example: `CodetteBridge.chat(message)`

3. **Custom Components** - Any UI that needs AI
   - Import from `codetteBridge.ts`
   - Use methods with endpoint paths

## Troubleshooting

### Server Won't Start
```bash
# Check if port is in use
netstat -ano | findstr :8000

# Kill process using port
taskkill /PID <PID> /F

# Try different port
$env:CODETTE_PORT=8001; python codette_server_unified.py
```

### Frontend Can't Connect
```bash
# Verify .env.example has:
VITE_CODETTE_API=http://localhost:8000

# Check browser console for:
- CORS errors (check server CORS settings)
- Connection refused (is server running?)
- Timeout (is server responding?)
```

### WebSocket Connection Issues
```bash
# Verify WebSocket endpoint:
ws://localhost:8000/ws

# Test with wscat:
npm install -g wscat
wscat -c ws://localhost:8000/ws
```

## Performance Tips

1. **Use WebSocket for Real-Time Updates**
   - Reduces overhead vs REST polling
   - 60 FPS updates for transport clock

2. **Batch Requests**
   - Send multiple suggestions in one request
   - Use `/codette/process` for complex operations

3. **Caching**
   - Cache training context locally
   - Reuse perspectives for chat

4. **Port Configuration**
   - Set `CODETTE_PORT` environment variable
   - Avoid port conflicts

## Common Tasks

### Add a New Endpoint
1. Edit `codette_server_unified.py`
2. Add async function with `@app.post()` or `@app.get()`
3. Restart server
4. Update `codetteBridge.ts` to call endpoint

### Change Port
```bash
$env:CODETTE_PORT=9000
python codette_server_unified.py
```

### Test Specific Endpoint
```bash
python test_unified_server.py
```

### View API Documentation
```
http://localhost:8000/docs
```

## Support Files

| File | Purpose |
|------|---------|
| `codette_server_unified.py` | Main server implementation |
| `test_unified_server.py` | Endpoint test suite |
| `CODETTE_CONSOLIDATION_COMPLETE.md` | Consolidation details |
| `CODETTE_QUICK_REFERENCE.md` | This file |

## Version Info

- **Unified Server**: v2.0.0
- **Real Engine**: v2.0.0
- **Framework**: FastAPI with Uvicorn
- **Python**: 3.10+
- **Last Updated**: November 29, 2025
