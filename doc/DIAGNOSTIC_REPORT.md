# CoreLogic Studio - Interactive Diagnostic Report

**Purpose**: Step-by-step guide to test and validate each component  
**Status**: Generated November 25, 2025

---

## STEP 1: VERIFY DEPENDENCIES

### Frontend Dependencies
```bash
cd i:\ashesinthedawn
npm list react react-dom typescript
```

**Expected Output**:
```
react@18.3.1
react-dom@18.3.1
typescript@5.5.3
```

**If Missing**:
```bash
npm install
```

### Python Dependencies
```bash
python -m pip list | findstr "numpy scipy fastapi uvicorn"
```

**Expected Output**:
```
numpy           >= 1.20.0
scipy           >= 1.8.0
fastapi         >= 0.100.0
uvicorn         >= 0.24.0
```

**If Missing**:
```bash
python -m venv venv
venv\Scripts\activate
pip install numpy scipy fastapi uvicorn
```

---

## STEP 2: CHECK TYPESCRIPT COMPILATION

```bash
npm run typecheck
```

**Expected**: `0 errors`

**If Errors**:
```bash
npm run lint
# Fix issues reported
```

---

## STEP 3: VERIFY BACKEND CONNECTIVITY

### Start Backend Server
```bash
python codette_server.py
```

**Expected Output**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### Test Health Endpoint
In another terminal:
```powershell
curl -i http://localhost:8000/health
```

**Expected**:
```
HTTP/1.1 200 OK
Content-Type: application/json

{"status":"ok"}
```

**If Fails**:
- ❌ Connection refused → Backend not started
- ❌ 404 → Endpoint doesn't exist
- ❌ 500 → Backend error (check logs)

---

## STEP 4: START FRONTEND DEVELOPMENT SERVER

```bash
npm run dev
```

**Expected Output**:
```
VITE v5.4.0  ready in 123 ms

➜  Local:   http://localhost:5175/
```

**Open browser**: `http://localhost:5175`

---

## STEP 5: TEST CORE FEATURES

### Feature 1: DAW Track Operations
1. Open browser DevTools (`F12 → Console`)
2. In app, click "Add Audio Track"
3. **Expected**: New track appears in left sidebar
4. **Check Console**: No errors

**If Failed**:
```typescript
// Manual test in browser console:
const daw = document.querySelector('[data-testid="daw"]');
console.log(daw ? 'DAW mounted' : 'DAW not found');
```

---

### Feature 2: Codette Chat
1. Open "Codette AI" panel (if visible)
2. Type: "What is audio gain?"
3. **Expected**: Response from backend within 2 seconds

**If Failed**:
- Check Network tab for `/codette/chat` request
- Verify backend running: `curl http://localhost:8000/health`
- Check response status (should be 200)

**Debug Commands**:
```javascript
// In browser console:
fetch('http://localhost:8000/codette/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'test', daw_context: {} })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

### Feature 3: Audio File Upload
1. In Mixer panel, look for "Load Audio" button
2. Select an audio file (MP3, WAV, OGG)
3. **Expected**: Waveform displays in timeline

**If Failed**:
- Check file size (max 100MB per code)
- Check file format supported by Web Audio API
- Check browser console for decode errors

**Valid Formats**: MP3, WAV, FLAC, OGG, M4A

---

### Feature 4: Audio Playback
1. Load audio file (Feature 3)
2. Click play button (▶)
3. **Expected**: Audio plays with sound output

**If Silent**:
1. Check browser volume settings
2. Check OS audio output connected
3. Check track is not muted
4. Check audio engine initialized:
```javascript
// In browser console:
console.log(document.querySelector('audio'));
```

---

### Feature 5: Project Management
1. Click "File → Save Project"
2. Enter project name and click Save
3. **Expected**: Project saved (backend confirms)

**If Failed**:
- Backend not running (need `python codette_server.py`)
- No database configured (check backend logs)
- Auth not working (check hardcoded user)

---

## STEP 6: CHECK CRITICAL FILES

### Syntax Check
```bash
# Frontend
npm run lint

# Backend
python -m py_compile codette_server.py
```

**Expected**: No errors

### Type Check
```bash
npm run typecheck
```

**Expected**: `0 errors`

### Import Validation
```javascript
// In browser console, each file should load:
import codetteAIEngine from './lib/codetteAIEngine.js'; // Works
import DAWContext from './contexts/DAWContext.js';     // Works
```

---

## STEP 7: PERFORMANCE BASELINE

### Memory Usage
1. Open DevTools (`F12 → Memory`)
2. Click "Snapshot"
3. **Expected**: < 50MB for DAW + UI

### Load Time
1. Hard refresh: `Ctrl+Shift+R`
2. Check Network tab
3. **Expected**: 
   - HTML: < 100ms
   - JS bundle: < 500ms
   - Total: < 2s

### CPU Usage
1. Open DevTools (`F12 → Performance`)
2. Start recording
3. Create 10 tracks
4. Stop recording
5. **Expected**: Frame rate > 30 FPS during track creation

---

## STEP 8: VALIDATE BACKEND RESPONSES

### Chat Endpoint
```bash
curl -X POST http://localhost:8000/codette/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"What is eq?\", \"daw_context\": {}}"
```

**Expected Response**:
```json
{
  "response": "...",
  "source": "codette_engine",
  "confidence": 0.85
}
```

### Analysis Endpoint
```bash
curl -X POST http://localhost:8000/codette/analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"track_id\": \"track-1\", \"content_type\": \"mixed\"}"
```

**Expected Response**:
```json
{
  "score": 0.75,
  "findings": [...],
  "recommendations": [...]
}
```

### Audio Optimize Endpoint
```bash
curl -X POST http://localhost:8000/codette/optimize ^
  -H "Content-Type: application/json" ^
  -d "{\"optimization_type\": \"mastering\", \"track_id\": \"track-1\"}"
```

**Expected Response**:
```json
{
  "settings": { ... },
  "rationale": "..."
}
```

---

## STEP 9: DATABASE VERIFICATION

### Check Project Persistence
1. Create new project
2. Refresh browser (`Ctrl+R`)
3. **Expected**: Project still there

**If Lost**:
- Database not connected
- No persistence layer
- Check backend logs for database errors

### Manual Database Check
```bash
# If using SQLite:
ls -la data/projects.db

# If using PostgreSQL:
psql -U postgres -d corelogic_db -c "SELECT * FROM projects LIMIT 1;"
```

---

## STEP 10: INTEGRATION TEST

### Full Workflow
```
1. START: Browser at http://localhost:5175
2. LOAD: Audio file (expects file system working)
3. CREATE: 5 tracks (expects DAW working)
4. APPLY: EQ effect via Codette chat (expects backend + DAW integration)
5. ANALYZE: Audio with Codette (expects analysis working)
6. SAVE: Project (expects persistence working)
7. REFRESH: Browser (expects session recovered)
8. OPEN: Same project (expects project loading)
```

**Expected**: All 8 steps complete without errors

**If Any Step Fails**:
1. Note the step number
2. Check corresponding section in this diagnostic
3. Refer to BROKEN_FUNCTIONALITY_AUDIT.md for fixes

---

## TROUBLESHOOTING MATRIX

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Chat shows no response | Backend not running | `python codette_server.py` |
| Waveform not displaying | Audio decode failed | Check file format, browser console |
| No sound on playback | AudioContext not initialized | Refresh page, check volume |
| Projects don't save | No database | Start backend with DB configured |
| UI crashes on file open | FileSystemBrowser using mock | Implement real file API |
| Track operations fail | DAW context not working | Check browser console for errors |
| Can't load audio | File system not connected | Mock files only, need backend |
| Performance slow | Too many tracks/plugins | Close DevTools, reduce effects |

---

## LOGS TO CHECK

### Browser Console (`F12 → Console`)
```javascript
// Should show:
✓ DAW Context initialized
✓ Audio Engine connected
✓ Codette AI ready

// Should NOT show:
✗ TypeError
✗ Network error
✗ Cannot read property
```

### Network Tab (`F12 → Network`)
```
GET /index.html          200  50ms
GET /assets/app.js       200  120ms
GET /assets/app.css      200  30ms
POST /codette/chat       200  500ms (if backend running)
```

### Backend Logs
```bash
# While running: python codette_server.py
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     POST /codette/chat
INFO:     status_code=200
```

---

## NEXT STEPS

1. **Run this diagnostic** in order, noting any failures
2. **Document failures** with step number and error
3. **Refer to BROKEN_FUNCTIONALITY_AUDIT.md** for explanation
4. **Apply fixes** from memory file if needed
5. **Re-run diagnostic** to verify fixes

---

## QUICK REFERENCE

### Start Everything
```bash
# Terminal 1: Backend
python codette_server.py

# Terminal 2: Frontend
npm run dev

# Then open: http://localhost:5175
```

### Health Check Command
```bash
# One command to test connectivity
curl -i http://localhost:8000/health
```

### Type Check
```bash
npm run typecheck
```

### Production Build
```bash
npm run build
npm run preview
```

---

## CONTACT & SUPPORT

- **Issue**: Check BROKEN_FUNCTIONALITY_AUDIT.md
- **Setup**: Check DEVELOPMENT.md
- **Architecture**: Check copilot-instructions.md
- **Backend**: Check codette_server.py
- **Frontend**: Check src/components and src/lib
