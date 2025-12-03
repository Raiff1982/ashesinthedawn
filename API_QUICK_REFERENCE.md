# ?? BACKEND API QUICK REFERENCE

## Server Status
- **URL**: http://localhost:8000
- **Status**: ? Running
- **Version**: 2.0.0
- **Framework**: FastAPI

---

## ?? All Endpoints

### Chat & Suggestions
```
POST   /codette/chat          Chat with Codette AI
POST   /codette/suggest       Get context-aware suggestions
```

### Transport Control
```
POST   /transport/play        Start playback
POST   /transport/stop        Stop playback
POST   /transport/pause       Pause playback
POST   /transport/resume      Resume from pause
POST   /transport/seek        Seek to time position
POST   /transport/tempo       Set BPM
POST   /transport/loop        Configure loop region
GET    /transport/status      Get current state
```

### Track Control (NEW)
```
POST   /transport/solo/:id    Toggle solo
POST   /transport/mute/:id    Toggle mute
POST   /transport/arm/:id     Toggle record arm
POST   /transport/volume/:id  Set volume (dB)
POST   /transport/pan/:id     Set pan (-1.0 to 1.0)
```

### Status & Metrics
```
GET    /                      API root
GET    /health                Health check
POST   /api/health            API health
GET    /codette/status        Status with transport state
GET    /metrics               System metrics
```

### Analysis Endpoints (NEW)
```
GET    /api/analysis/delay-sync              Calculate note timings
POST   /api/analysis/detect-genre            Detect music genre
GET    /api/analysis/ear-training            Get ear training exercises
GET    /api/analysis/production-checklist    Get workflow checklists
GET    /api/analysis/instrument-info         Get instrument specs
GET    /api/analysis/instruments-list        List all instruments
```

### Music Analysis Endpoints (NEW)
```
POST   /api/analyze/session                  Full session analysis
POST   /api/analyze/mixing                   Mixing quality analysis
POST   /api/analyze/routing                  Routing review
POST   /api/analyze/mastering                Mastering readiness
POST   /api/analyze/creative                 Creative suggestions
POST   /api/analyze/gain-staging             Gain staging analysis
POST   /api/analyze/stream                   Real-time analysis
```

### Training Data
```
GET    /api/training/context                 Get training context
GET    /api/training/health                  Training module health
```

### WebSocket
```
WS     /ws                                   General WebSocket
WS     /ws/transport/clock                   Transport sync WebSocket
```

---

## ?? Response Examples

### GET /codette/status
```json
{
  "status": "running",
  "version": "2.0.0",
  "is_playing": false,
  "current_time": 0.0,
  "bpm": 120.0,
  "time_signature": [4, 4],
  "loop_enabled": false,
  "loop_start": 0.0,
  "loop_end": 10.0,
  "timestamp": "2025-12-03T..."
}
```

### POST /codette/suggest
```json
{
  "suggestions": [
    {
      "type": "effect",
      "title": "EQ for Balance",
      "description": "Apply EQ to balance frequency content",
      "confidence": 0.88
    }
  ],
  "confidence": 0.88,
  "timestamp": "2025-12-03T..."
}
```

### POST /transport/solo/:id
```json
{
  "status": "success",
  "track_id": "track-123",
  "solo": true,
  "message": "Track solo set to true"
}
```

### GET /api/analysis/delay-sync?bpm=120
```json
{
  "status": "success",
  "bpm": 120.0,
  "divisions": {
    "Whole Note": 2000.0,
    "Half Note": 1000.0,
    "Quarter Note": 500.0,
    "Eighth Note": 250.0,
    "16th Note": 125.0,
    "Triplet Quarter": 333.33,
    "Triplet Eighth": 166.67,
    "Dotted Quarter": 750.0,
    "Dotted Eighth": 375.0
  }
}
```

---

## ?? Testing Endpoints

### Test in Browser
```
http://localhost:8000/health
http://localhost:8000/codette/status
http://localhost:8000/metrics
```

### Test with curl
```bash
# Chat
curl -X POST http://localhost:8000/codette/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I mix drums?"}'

# Suggestions
curl -X POST http://localhost:8000/codette/suggest \
  -H "Content-Type: application/json" \
  -d '{"context":{"type":"mixing"},"limit":5}'

# Transport
curl -X POST http://localhost:8000/transport/play

# Status
curl http://localhost:8000/codette/status
```

### Test with Python
```python
import requests

# Get status
r = requests.get('http://localhost:8000/codette/status')
print(r.json())

# Get suggestions
r = requests.post('http://localhost:8000/codette/suggest', json={
    'context': {'type': 'mixing'},
    'limit': 5
})
print(r.json())
```

---

## ?? Common Parameters

### Track IDs
Format: Any string, typically `track-{uuid}`
```
POST /transport/solo/track-123abc
POST /transport/mute/my-track
POST /transport/volume/drums?volume_db=-3.5
```

### Query Parameters
```
?bpm=120                    # Tempo
?track_id=my-track         # Track identifier
?limit=5                   # Result limit
?type=mixing               # Analysis/context type
?difficulty=beginner       # Skill level
```

### Request Body Format
```json
{
  "context": {
    "type": "mixing",
    "mood": "energetic",
    "genre": "edm",
    "bpm": 128,
    "track_type": "synth"
  },
  "limit": 5
}
```

---

## ?? Debugging

### Check Server Health
```bash
curl -i http://localhost:8000/health
```

### View API Documentation
```
http://localhost:8000/docs       # Swagger UI
http://localhost:8000/redoc      # ReDoc
```

### Check Console Logs
Look for lines like:
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     127.0.0.1:12345 - "POST /codette/suggest HTTP/1.1" 200 OK
```

---

## ?? Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 404 Not Found | Endpoint doesn't exist | Check endpoint spelling |
| 500 Server Error | Internal error | Check server logs |
| Connection refused | Server not running | Start with `python run_server.py` |
| CORS error | Wrong origin | Check CORS settings |
| Timeout | Server slow | Check CPU/memory |

---

## ?? Environment Setup

### Requirements
```
Python 3.10+
FastAPI 0.118.0+
Uvicorn 0.21.0+
```

### Installation
```bash
pip install -r requirements.txt
```

### Start Server
```bash
python -m uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000
```

---

## ?? Endpoint Categories

| Category | Count | Status |
|----------|-------|--------|
| Chat/Suggestions | 2 | ? |
| Transport | 8 | ? |
| Track Control | 5 | ? |
| Analysis | 6 | ? |
| Music Analysis | 7 | ? |
| Health/Metrics | 4 | ? |
| Training | 2 | ? |
| WebSocket | 2 | ? |
| **TOTAL** | **36+** | ? **ALL WORKING** |

---

## ?? Quick Start

### 1. Start Server
```bash
python run_server.py
```

### 2. Test It Works
```bash
curl http://localhost:8000/health
```

### 3. Try Chat
```bash
curl -X POST http://localhost:8000/codette/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello Codette!"}'
```

### 4. Get Suggestions
```bash
curl -X POST http://localhost:8000/codette/suggest \
  -H "Content-Type: application/json" \
  -d '{"context":{"type":"mixing"},"limit":5}'
```

### 5. Control Transport
```bash
curl -X POST http://localhost:8000/transport/play
```

---

## ?? Full Documentation

For detailed documentation, see:
- `BACKEND_FIXES_SUMMARY.md` - Complete fix details
- `FIXES_APPLIED_20241203.md` - Detailed change log
- `codette_server_unified.py` - Source code with docstrings
- `http://localhost:8000/docs` - Live API documentation

---

## ? Status

**All 36+ endpoints functional and tested**

- ? Chat & Suggestions working
- ? Transport controls working
- ? Track controls working
- ? Analysis endpoints working
- ? Status & metrics working
- ? WebSocket streaming ready

**No 404 errors for implemented endpoints**

---

## ?? Support

### Issue: Server won't start
```bash
# Check if port is in use
netstat -an | grep 8000
# Kill old process
taskkill /PID {pid} /F
# Restart
python run_server.py
```

### Issue: Slow responses
- Check CPU usage
- Check memory usage
- Reduce concurrent connections
- Restart server

### Issue: CORS errors
- Verify `VITE_CODETTE_API=http://localhost:8000` in frontend
- Check browser console
- Restart both frontend and backend

---

**Last Updated**: December 3, 2024  
**Version**: 2.0.0  
**Status**: ? Production Ready
