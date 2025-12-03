# Missing Endpoints Audit - DAW & UI Integration

**Date**: December 2024  
**Status**: Comprehensive endpoint mismatch analysis  
**Impact**: Frontend calling non-existent backend endpoints

---

## Executive Summary

Frontend code attempts to call 30+ endpoints that **DO NOT EXIST** in `codette_server_unified.py`. The unified server has only ~20 endpoints, most of which are health checks, WebSockets, and transport controls. **Missing: All AI analysis, suggestion, and processing endpoints**.

---

## Frontend Calling Endpoints (Don't Exist in Server)

### DSP Bridge Endpoints (src/lib/dspBridge.ts)
Frontend expects Python DSP backend endpoints - **NOT IN UNIFIED SERVER**:

```
MISSING:
POST /process/eq/highpass          ?
POST /process/eq/lowpass           ?
POST /process/eq/peaking           ?
POST /process/eq/3band             ?
POST /process/dynamics/compressor  ?
POST /process/dynamics/limiter     ?
POST /process/dynamics/expander    ?
POST /process/dynamics/gate        ?
POST /process/saturation/saturation ?
POST /process/saturation/distortion ?
POST /process/saturation/waveshaper ?
POST /process/delay/simple         ?
POST /process/delay/pingpong       ?
POST /process/delay/multitap       ?
POST /process/delay/stereo         ?
POST /process/reverb/freeverb      ?
POST /process/reverb/hall          ?
POST /process/reverb/plate         ?
POST /process/reverb/room          ?
POST /automation/curve             ?
POST /automation/lfo               ?
POST /automation/envelope          ?
POST /metering/level               ?
POST /metering/spectrum            ?
POST /metering/vu                  ?
POST /metering/correlation         ?
GET  /effects                      ?
GET  /engine/config                ?
POST /engine/start                 ?
POST /engine/stop                  ?
```

**Impact**: Zero DSP processing available from frontend

### Codette API Endpoints (src/lib/codetteApi.ts)
Advanced analysis endpoints - **NOT IN UNIFIED SERVER**:

```
MISSING:
POST /api/analysis/detect-genre         ?
POST /api/analysis/delay-sync           ?
GET  /api/analysis/ear-training         ?
GET  /api/analysis/production-checklist ?
GET  /api/analysis/instrument-info      ?
GET  /api/analysis/instruments-list     ?
```

**Impact**: CodetteAdvancedTools component can't function

### Codette Bridge Service Endpoints (src/lib/codetteBridgeService.ts)
Music analysis endpoints - **NOT IN UNIFIED SERVER**:

```
MISSING:
POST /api/analyze/session           ?
POST /api/analyze/mixing            ?
POST /api/analyze/routing           ?
POST /api/analyze/mastering         ?
POST /api/analyze/creative          ?
POST /api/analyze/gain-staging      ?
POST /api/analyze/stream            ?
```

**Impact**: AIPanel component can't display analysis

### Transport/Metering Endpoints Called by Components
```
MISSING:
GET  /metrics                       ? (TopBar.tsx line 156)
POST /transport/solo/:trackId       ? (TrackList.tsx)
POST /transport/mute/:trackId       ? (TrackList.tsx)
POST /transport/arm/:trackId        ? (TrackList.tsx)
```

**Impact**: Track control buttons non-functional

---

## What DOES Exist in Unified Server

### Health & Status (Exist but limited)
```
? GET  /              Root endpoint
? GET  /health        Server health
? POST /api/health    API health (both GET & POST)
```

### Chat/AI (Exist but not connected)
```
? POST /codette/chat              Chat endpoint (working)
```

### Transport (Exist but incomplete)
```
? GET  /transport/state           Current state
? POST /transport/play            Play
? POST /transport/stop            Stop
? POST /transport/pause           Pause
? POST /transport/resume          Resume (exists but not called by frontend)
? GET  /transport/state           Seek position
? POST /transport/tempo           Set BPM
? POST /transport/loop            Loop control
```

### WebSocket (Exist but browser has issues)
```
? WS   /ws                        General endpoint
? WS   /ws/transport/clock        Transport sync (60 FPS)
```

### Training (Exist but not used)
```
? GET  /api/training/context      Context data
? GET  /api/training/health       Module health
```

### Embeddings (Exist but not fully used)
```
? POST /api/upsert-embeddings     Embedding upload
```

---

## Breakdown by Component

### TopBar.tsx Issues
| Line | Calls | Endpoint | Status |
|------|-------|----------|--------|
| 156 | getMetrics() | GET /metrics | ? MISSING |
| 167 | togglePlay() | POST /transport/play | ? EXISTS |
| 178 | handleStop() | POST /transport/stop | ? EXISTS |
| 190 | handleRecord() | No endpoint exists | ? MISSING |

### Mixer.tsx Issues
| Line | Calls | Endpoint | Status |
|------|-------|----------|--------|
| 89 | setVolume() | No endpoint exists | ? MISSING |
| 112 | setPan() | No endpoint exists | ? MISSING |
| 156 | applyEffect() | No endpoint exists | ? MISSING |

### TrackList.tsx Issues
| Line | Calls | Endpoint | Status |
|------|-------|----------|--------|
| 234 | toggleSolo() | POST /transport/solo/:id | ? MISSING |
| 245 | toggleMute() | POST /transport/mute/:id | ? MISSING |
| 256 | toggleArm() | POST /transport/arm/:id | ? MISSING |

### AIPanel.tsx Issues
| Feature | Endpoint | Status |
|---------|----------|--------|
| Health Analysis | POST /api/analyze/gain-staging | ? MISSING |
| Mixing Analysis | POST /api/analyze/mixing | ? MISSING |
| Routing Analysis | POST /api/analyze/routing | ? MISSING |
| Full Analysis | POST /api/analyze/session | ? MISSING |

### CodetteAdvancedTools.tsx Issues
| Tab | Endpoints | Status |
|-----|-----------|--------|
| Delay Sync | GET /api/analysis/delay-sync | ? MISSING |
| Genre Detection | POST /api/analysis/detect-genre | ? MISSING |
| Ear Training | GET /api/analysis/ear-training | ? MISSING |
| Checklist | GET /api/analysis/production-checklist | ? MISSING |
| Instruments | GET /api/analysis/instrument-info, instruments-list | ? MISSING |

---

## Environment Variable Issues

**Multiple files use WRONG variable names:**

| File | Current | Should Be | Fallback |
|------|---------|-----------|----------|
| codetteApi.ts | VITE_CODETTE_API_URL | VITE_CODETTE_API | 8001 (wrong) |
| codetteBridgeService.ts | VITE_CODETTE_BACKEND | VITE_CODETTE_API | 8001 (wrong) |
| codettePythonIntegration.ts | VITE_CODETTE_API_URL | VITE_CODETTE_API | 8001 (wrong) |
| dspBridge.ts | VITE_CODETTE_API | ? CORRECT | 8001 (wrong) |
| backendClient.ts | VITE_BACKEND_URL | VITE_CODETTE_API | 8001 (wrong) |

**Correct Setting**:
```env
VITE_CODETTE_API=http://localhost:8000
```

---

## Priority Issues

### CRITICAL ??
1. **30+ missing DSP processing endpoints** - No audio effects available
2. **Missing analysis endpoints** - AI features can't function
3. **Wrong environment variables** - Can't reach backend even if endpoints existed
4. **Wrong fallback port (8001)** - Server is on 8000

### HIGH ??
1. Missing track control endpoints (solo, mute, arm)
2. Missing effect application endpoints
3. Missing parameter update endpoints
4. Missing metrics endpoint

### MEDIUM ??
1. WebSocket connection issues
2. Missing volume/pan endpoints
3. Missing recording control endpoints

---

## Solutions Needed

### Solution 1: Add Missing Endpoints to Unified Server
Create stub endpoints that either:
- Return dummy data (demo mode)
- Call Python DSP backend (real mode)
- Return success with no-op (passthrough mode)

**Effort**: HIGH (50+ endpoints)  
**Pros**: Unified architecture  
**Cons**: Large server bloat

### Solution 2: Fix Frontend to Use Existing Endpoints
Redirect all frontend calls to working endpoints:
- `/api/analyze/*` ? `/codette/chat`
- `/process/*` ? Error or frontend fallback
- Transport controls ? Use existing `/transport/*` endpoints

**Effort**: MEDIUM (6-8 files to update)  
**Pros**: Minimal server changes  
**Cons**: Feature limitation

### Solution 3: Separate Concerns (RECOMMENDED)
- Keep unified server for Codette AI chat/suggestions
- Keep Python DSP backend separate for audio processing
- Use DSP bridge to connect frontend to Python backend directly
- Document the dual-backend architecture

**Effort**: MEDIUM (refactor dspBridge)  
**Pros**: Proper separation, cleaner code  
**Cons**: Two servers to manage

### Solution 4: Implement API Proxy Layer
Create FastAPI proxy that:
- Maps old endpoints to new ones
- Handles authentication
- Logs all requests
- Provides compatibility layer

**Effort**: MEDIUM (100 lines)  
**Pros**: Full compatibility  
**Cons**: Extra middleware layer

---

## Missing Endpoint Categories

### Audio Effects (19 endpoints)
```
Status: ALL MISSING ?
Impact: NO DSP PROCESSING
Needed by: dspBridge.ts
```

### Automation (3 endpoints)
```
Status: ALL MISSING ?
Impact: NO PARAMETER AUTOMATION
Needed by: dspBridge.ts
```

### Metering/Analysis (4 endpoints)
```
Status: ALL MISSING ?
Impact: NO AUDIO ANALYSIS
Needed by: dspBridge.ts, AnalysisService.ts
```

### Advanced Codette Analysis (6 endpoints)
```
Status: ALL MISSING ?
Impact: NO AI ANALYSIS FEATURES
Needed by: CodetteAdvancedTools.tsx, codetteApi.ts
```

### Music Analysis (7 endpoints)
```
Status: ALL MISSING ?
Impact: NO MUSIC INTELLIGENCE
Needed by: AIPanel.tsx, codetteBridgeService.ts
```

### Track Control (4 endpoints)
```
Status: ALL MISSING ?
Impact: NO SOLO/MUTE/ARM CONTROL
Needed by: TrackList.tsx, Transport controls
```

---

## Recommended Quick Fixes (In Order)

### 1. Fix Environment Variables (5 min)
Update all files to use `VITE_CODETTE_API` with port 8000:
- `codetteApi.ts`
- `codetteBridgeService.ts`
- `codettePythonIntegration.ts`
- `backendClient.ts`

### 2. Implement Stub Endpoints (30 min)
Add these to unified server:
```python
# Stub endpoints that return empty/success
@app.post("/api/analyze/session")
@app.post("/api/analyze/mixing")
@app.post("/api/analyze/routing")
@app.post("/api/analyze/mastering")
@app.get("/api/analysis/delay-sync")
@app.get("/api/analysis/instrument-info")
# ... etc
```

### 3. Disable Missing Calls (15 min)
Comment out calls to non-existent endpoints with TODOs:
```typescript
// TODO: /api/analyze/session endpoint not implemented
// const result = await fetch(`/api/analyze/session`);
return defaultAnalysis;
```

### 4. Document Architecture (20 min)
Update docs to clarify:
- What endpoints exist
- What's not implemented
- What needs Python DSP backend
- How to test endpoints

### 5. Add Connection Test (10 min)
Create endpoint test script:
```bash
# Test which endpoints actually work
curl http://localhost:8000/health  ?
curl http://localhost:8000/codette/chat  ?
curl http://localhost:8000/api/analyze/session  ?
```

---

## Audit Checklist

- [ ] All 30+ DSP endpoints documented as MISSING
- [ ] Environment variables identified as WRONG
- [ ] Frontend impact analysis complete
- [ ] Fallback options evaluated
- [ ] Solution recommendations provided
- [ ] Component-by-component impact mapped
- [ ] Priority levels assigned
- [ ] Quick fixes identified

---

## References

**Files with issues**:
- `src/lib/dspBridge.ts` - 30 missing endpoints
- `src/lib/codetteApi.ts` - 6 missing endpoints
- `src/lib/codetteBridgeService.ts` - 7 missing endpoints
- `src/components/CodetteAdvancedTools.tsx` - 5 missing endpoints
- `src/components/AIPanel.tsx` - 7 missing endpoints

**Server files**:
- `codette_server_unified.py` - Only 20 endpoints, mostly status/transport
- `daw_core/api.py` - Has all DSP endpoints but SEPARATE server

**Config files**:
- `.env.example` - Uses WRONG env var names
- Various component files - Wrong env var lookups

---

## Summary

**The unified server is NOT comprehensive**. It's primarily:
- Codette AI chat interface
- Transport/playback control
- Health monitoring

**Missing entirely:**
- All audio DSP processing (30 endpoints)
- Advanced music analysis (6 endpoints)
- Track control (4 endpoints)
- Effect parameter control (many endpoints)

**Root cause**: Two separate backends were designed but not integrated into unified server.

**Next step**: Either implement all missing endpoints or document the dual-backend architecture and fix environment variables.

