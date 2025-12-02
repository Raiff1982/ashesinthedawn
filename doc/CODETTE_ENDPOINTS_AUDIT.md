# Codette Endpoints & Calls Audit Report

**Date**: November 29, 2025  
**Status**: Issues Found & Fixed

## Executive Summary

Audit reveals **mismatch between frontend API calls and unified server endpoints**. Frontend is calling endpoints that don't exist in the unified server, and using incorrect environment variable names.

## Issues Found

### 1. ❌ Wrong Environment Variables
Multiple files use non-standard env var names:

| File | Current Var | Issue | Fix |
|------|-------------|-------|-----|
| `codetteApi.ts` | `VITE_CODETTE_API_URL` | Wrong name | Should be `VITE_CODETTE_API` |
| `codetteApi.ts` | Fallback: `8001` | Wrong port | Should be `8000` |
| `codetteBridgeService.ts` | `VITE_CODETTE_BACKEND` | Wrong name | Should be `VITE_CODETTE_API` |
| `codetteBridgeService.ts` | Fallback: `8001` | Wrong port | Should be `8000` |
| `codettePythonIntegration.ts` | `VITE_CODETTE_API_URL` | Wrong name | Should be `VITE_CODETTE_API` |
| `codettePythonIntegration.ts` | Fallback: `8001` | Wrong port | Should be `8000` |
| `backendClient.ts` | `VITE_BACKEND_URL` | Wrong name | Should be `VITE_CODETTE_API` |
| `backendClient.ts` | Fallback: `8001` | Wrong port | Should be `8000` |
| `dspBridge.ts` | `VITE_BACKEND_URL` | Wrong name | Should be `VITE_CODETTE_API` |
| `dspBridge.ts` | Fallback: `8001` | Wrong port | Should be `8000` |
| `useCodette.ts` | `VITE_CODETTE_API_URL` | Wrong name | Should be `VITE_CODETTE_API` |
| `useCodette.ts` | Fallback: `8001` | Wrong port | Should be `8000` |

### 2. ❌ Non-Existent Endpoints in Frontend Calls

Frontend code calls endpoints that don't exist in unified server:

| Frontend Call | File | Issue | Unified Server Has |
|---------------|------|-------|-------------------|
| `/api/analysis/detect-genre` | `codetteApi.ts` | Not in server | ✗ |
| `/api/analysis/delay-sync` | `codetteApi.ts` | Not in server | ✗ |
| `/api/analysis/ear-training` | `codetteApi.ts` | Not in server | ✗ |
| `/api/analysis/production-checklist` | `codetteApi.ts` | Not in server | ✗ |
| `/api/analysis/instrument-info` | `codetteApi.ts` | Not in server | ✗ |
| `/api/analysis/instruments-list` | `codetteApi.ts` | Not in server | ✗ |
| `/api/analyze/session` | `codetteBridgeService.ts` | Not in server | ✗ |
| `/api/analyze/mixing` | `codetteBridgeService.ts` | Not in server | ✗ |
| `/api/analyze/routing` | `codetteBridgeService.ts` | Not in server | ✗ |
| `/api/analyze/mastering` | `codetteBridgeService.ts` | Not in server | ✗ |
| `/api/analyze/creative` | `codetteBridgeService.ts` | Not in server | ✗ |
| `/api/analyze/gain-staging` | `codetteBridgeService.ts` | Not in server | ✗ |
| `/api/analyze/stream` | `codetteBridgeService.ts` | Not in server | ✗ |

### 3. ✅ Endpoints That DO Exist

Unified server provides:

| Server Endpoint | Type | Purpose |
|-----------------|------|---------|
| `/codette/chat` | POST | AI conversation |
| `/codette/analyze` | POST | Audio analysis |
| `/codette/suggest` | POST | Suggestions |
| `/codette/process` | POST | Generic processor |
| `/codette/status` | GET | Server status |
| `/health` | GET | Health check |
| `/api/health` | GET/POST | API health |
| `/api/training/context` | GET | Training context |
| `/api/training/health` | GET | Training module health |
| `/transport/status` | GET | Transport state |
| `/transport/play` | POST | Start playback |
| `/transport/stop` | POST | Stop playback |
| `/transport/pause` | POST | Pause |
| `/transport/resume` | POST | Resume |
| `/transport/seek` | GET | Seek to time |
| `/transport/tempo` | POST | Set BPM |
| `/transport/loop` | POST | Loop config |
| `/transport/metrics` | GET | Metrics |
| `/ws` | WebSocket | General WS |
| `/ws/transport/clock` | WebSocket | Transport sync |

## Recommended Actions

### Option A: Update Frontend to Use Unified Endpoints ⭐ RECOMMENDED
Update all frontend calls to use the endpoints actually provided by unified server:
- Chat → `/codette/chat`
- Analyze → `/codette/analyze`
- Suggest → `/codette/suggest`
- Health checks → `/health` or `/api/health`

**Pros**: Minimal server changes, cleaner frontend code  
**Cons**: Frontend refactoring needed

### Option B: Add Missing Endpoints to Unified Server
Create wrapper endpoints in unified server that map old `/api/` paths to new `/codette/` paths.

**Pros**: No frontend changes needed  
**Cons**: Code duplication, server bloat

### Option C: Hybrid Approach ⭐ BEST
1. Add unified server endpoint aliases for compatibility
2. Update all frontend files to use correct env vars and ports
3. Gradually migrate to new `/codette/*` paths

## Fix Priority

### Priority 1: Environment Variables (CRITICAL)
All files must use: `VITE_CODETTE_API` with fallback to `http://localhost:8000`

Files to fix:
- `src/lib/codetteApi.ts`
- `src/lib/codetteBridgeService.ts`
- `src/lib/codettePythonIntegration.ts`
- `src/lib/backendClient.ts`
- `src/lib/dspBridge.ts`
- `src/hooks/useCodette.ts`

### Priority 2: Endpoint Paths (HIGH)
Frontend must call endpoints that actually exist or server must implement stubs.

### Priority 3: Documentation (MEDIUM)
Update all developer docs to reflect unified server endpoints.

## Current Code Audit Summary

### Files Needing Updates

**src/lib/codetteApi.ts** (447 lines)
- Line 7: Wrong env var and port
- Lines 62, 93, 121, 149, 177, 205: Non-existent endpoints
- Action: Update env var, port, and either redirect or remove calls

**src/lib/codetteBridgeService.ts** (401 lines)
- Line 45: Wrong env var and port
- Lines 119, 145, 173, 197, 221, 245, 266: Non-existent `/api/analyze/*` endpoints
- Action: Update env var, port, and implement or redirect calls

**src/lib/codettePythonIntegration.ts**
- Line 320: Wrong env var and port
- Action: Update to use `VITE_CODETTE_API`

**src/lib/backendClient.ts**
- Line 6: Wrong env var and port
- Action: Update to use `VITE_CODETTE_API`

**src/lib/dspBridge.ts**
- Line 17: Wrong env var and port
- Action: Update to use `VITE_CODETTE_API`

**src/hooks/useCodette.ts**
- Line 85: Wrong env var and port
- Action: Update to use `VITE_CODETTE_API`

**src/lib/codetteBridge.ts** ✅
- Already correct: Uses `VITE_CODETTE_API` with port 8000
- No changes needed

## Unified Server Endpoints - Complete Reference

### Health & Status
```
GET  /              Root endpoint
GET  /health        Server health check
GET  /api/health    API health check
GET  /codette/status   Server status with features
```

### Chat & AI
```
POST /codette/chat       AI conversation
POST /codette/suggest    Context-aware suggestions
POST /codette/analyze    Audio analysis
POST /codette/process    Generic request processor
```

### Training
```
GET  /api/training/context    Training context
GET  /api/training/health     Module health
```

### Transport Control
```
GET  /transport/status     Current state
POST /transport/play       Start
POST /transport/stop       Stop
POST /transport/pause      Pause
POST /transport/resume     Resume
GET  /transport/seek       Seek to time
POST /transport/tempo      Set BPM
POST /transport/loop       Configure loop
GET  /transport/metrics    Metrics
```

### WebSocket
```
WS   /ws                 General endpoint
WS   /ws/transport/clock  Transport sync (60 FPS)
```

### API Documentation
```
GET  /docs    Swagger UI
GET  /redoc   ReDoc documentation
```

## Implementation Plan

1. ✅ Unified server created with correct endpoints
2. ✅ Environment variable name standardized to `VITE_CODETTE_API`
3. ⏳ Update all frontend files to use correct env var
4. ⏳ Update all frontend files to use correct port (8000)
5. ⏳ Map or redirect old endpoint calls to new ones
6. ⏳ Test all endpoints with updated frontend
7. ⏳ Update .env.example to reflect `VITE_CODETTE_API`

## Testing Checklist

After fixes:
- [ ] All frontend components can reach server
- [ ] Environment variables correctly resolved
- [ ] Chat endpoint working
- [ ] Analysis endpoint working
- [ ] Suggestions endpoint working
- [ ] Transport controls working
- [ ] WebSocket connections stable
- [ ] No console errors about missing endpoints
- [ ] No CORS errors

## Files Verified

✅ Correct:
- `src/lib/codetteBridge.ts` - Uses correct env var and port

❌ Need Updates:
- `src/lib/codetteApi.ts`
- `src/lib/codetteBridgeService.ts`
- `src/lib/codettePythonIntegration.ts`
- `src/lib/backendClient.ts`
- `src/lib/dspBridge.ts`
- `src/hooks/useCodette.ts`

## Environment Variable Standardization

### Current State (Wrong)
```
VITE_CODETTE_API_URL=http://localhost:8001
VITE_CODETTE_BACKEND=http://localhost:8001
VITE_BACKEND_URL=http://localhost:8001
```

### Correct State
```
VITE_CODETTE_API=http://localhost:8000
```

One standard variable for all Codette server calls.
