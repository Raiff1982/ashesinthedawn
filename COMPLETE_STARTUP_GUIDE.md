# ?? COMPLETE STARTUP GUIDE - CoreLogic Studio + Codette AI

**Status**: Complete system with fixed RLS security  
**Last Updated**: December 3, 2025  
**Version**: 2.0.0

---

## ? QUICK START (5 Minutes)

### Prerequisites
- ? Python 3.10+ installed
- ? Node.js 18+ installed
- ? `.env` file configured with credentials
- ? Git repository cloned

### Step 1: Start Backend Server
```powershell
cd I:\ashesinthedawn

# Terminal 1: Backend (Python)
python codette_server_unified.py
```

**Expected output:**
```
? FastAPI app created with CORS enabled
? Supabase client connected with service role (full access)
?? CODETTE AI UNIFIED SERVER - STARTING
?? Server: FastAPI + Uvicorn
?? URL:    http://127.0.0.1:8000
?? WebSocket: ws://127.0.0.1:8000/ws
```

### Step 2: Start Frontend Server (New Terminal)
```powershell
cd I:\ashesinthedawn

# Terminal 2: Frontend (React/Vite)
npm run dev
```

**Expected output:**
```
  ?  Local:   http://localhost:5173/
  ?  press h to show help
```

### Step 3: Open in Browser
Navigate to: **http://localhost:5173**

---

## ? VERIFICATION CHECKLIST

### Backend Server
- [ ] Server running on `http://127.0.0.1:8000`
- [ ] Supabase connected with "service role (full access)"
- [ ] WebSocket endpoint ready at `ws://127.0.0.1:8000/ws`
- [ ] Logs show no connection errors

### Frontend Application
- [ ] App loads at `http://localhost:5173`
- [ ] No WebSocket connection errors in console
- [ ] Transport controls visible (play/stop/seek buttons)
- [ ] Mixer panel shows audio controls

### Connectivity Test
```bash
# Test 1: Backend health
curl http://127.0.0.1:8000/health

# Test 2: Chat endpoint
curl -X POST http://127.0.0.1:8000/codette/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'

# Test 3: Diagnostics
curl http://127.0.0.1:8000/api/diagnostics/status
```

---

## ?? SECURITY VERIFICATION

### Environment Configuration
```bash
# Check .env file
echo "=== Checking credentials ==="
grep -E "VITE_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY" .env

# Should show both configured
```

### Startup Security Status
The server startup will show:
```
?? SECURITY STATUS:
  ? Service Role Key: CONFIGURED (Backend access: FULL)
  ? Anon Key: CONFIGURED (Frontend access: RLS-enforced)
```

---

## ?? API ENDPOINTS (34 Total)

### Health & Status
- `GET /` - Root endpoint
- `GET /health` - Health check

### Chat & AI
- `POST /codette/chat` - Chat with Codette
- `POST /codette/suggest` - Get suggestions

### Transport Control
- `GET /codette/status` - Transport status
- `POST /codette/transport` - Control transport

### Analysis (5 endpoints)
- `GET /api/analysis/delay-sync` - Delay sync times
- `POST /api/analysis/detect-genre` - Genre detection
- `GET /api/analysis/ear-training` - Ear training
- `GET /api/analysis/production-checklist` - Checklists
- `GET /api/analysis/instrument-info` - Instrument specs

### Session Analysis (8 endpoints)
- `POST /api/analyze/session` - Full project analysis
- `POST /api/analyze/mixing` - Mixing analysis
- `POST /api/analyze/routing` - Routing analysis
- `POST /api/analyze/mastering` - Mastering readiness
- `POST /api/analyze/creative` - Creative suggestions
- `POST /api/analyze/gain-staging` - Gain staging
- `POST /api/analyze/stream` - Real-time analysis

### Cache Management
- `GET /api/cache-stats` - Cache statistics
- `POST /api/cache-clear` - Clear cache

### Diagnostics (8 endpoints)
- `GET /api/diagnostics/status` - Full server status
- `GET /api/diagnostics/endpoints` - Endpoint inventory
- `GET /api/diagnostics/credentials` - Credential status
- `GET /api/diagnostics/database` - Database connectivity
- `GET /api/diagnostics/cache` - Cache performance
- `GET /api/diagnostics/dependencies` - Dependencies check
- `GET /api/diagnostics/performance` - Performance metrics
- `GET /api/diagnostics/rls-policies` - RLS policy analysis

### Real-time
- `WS /ws` - WebSocket endpoint

---

## ?? DIAGNOSTIC ENDPOINTS

### Check Full System Status
```bash
curl http://127.0.0.1:8000/api/diagnostics/status | jq
```

**Shows**:
- Server uptime
- System information
- Database connection status
- Cache performance
- Endpoint statistics
- Dependency status

### Check RLS Policies (NEW)
```bash
curl http://127.0.0.1:8000/api/diagnostics/rls-policies | jq
```

**Shows**:
- Which key is being used (service role vs anon)
- Table-by-table access analysis
- Security recommendations
- Troubleshooting guide

### Check Database Access
```bash
curl http://127.0.0.1:8000/api/diagnostics/database | jq
```

**Shows**:
- Database connection status
- Table accessibility check
- Number of accessible tables

---

## ?? ARCHITECTURE OVERVIEW

```
???????????????????????????????????????????????????????????????
?                      Frontend (React/Vite)                  ?
?                      Port: 5173                              ?
?  ????????????????????????????????????????????????????????   ?
?  ?  Components: TopBar, Mixer, Timeline, TrackList    ?   ?
?  ?  State: DAWContext (Redux-like)                      ?   ?
?  ?  Audio: Web Audio API (native)                       ?   ?
?  ????????????????????????????????????????????????????????   ?
???????????????????????????????????????????????????????????????
                      ? HTTP + WebSocket
                      ? (Anon Key - RLS enforced)
                      ?
???????????????????????????????????????????????????????????????
?              Backend Server (FastAPI/Python)                 ?
?              Port: 8000                                       ?
?  ????????????????????????????????????????????????????????   ?
?  ?  27 API Endpoints (Chat, Suggestions, Analysis)     ?   ?
?  ?  WebSocket: Real-time transport updates             ?   ?
?  ?  Cache: TTL-based context caching                   ?   ?
?  ?  Diagnostics: 8 monitoring endpoints                ?   ?
?  ????????????????????????????????????????????????????????   ?
???????????????????????????????????????????????????????????????
                      ? REST API + RPC
                      ? (Service Role Key - full access)
                      ?
???????????????????????????????????????????????????????????????
?                  Supabase Database                           ?
?         (PostgreSQL + RLS Policies)                          ?
?  ????????????????????????????????????????????????????????   ?
?  ?  music_knowledge | chat_history | messages          ?   ?
?  ?  user_feedback | api_metrics | codette_files        ?   ?
?  ????????????????????????????????????????????????????????   ?
???????????????????????????????????????????????????????????????
```

---

## ?? TROUBLESHOOTING

### WebSocket Connection Failed
**Error**: `WebSocket connection to 'ws://localhost:8000/ws' failed`

**Solution**:
1. Ensure backend server is running: `python codette_server_unified.py`
2. Check backend logs for errors
3. Verify port 8000 is not in use: `netstat -an | find ":8000"`
4. Clear browser cache and reload

### Backend Won't Start
**Error**: Module not found, import errors, etc.

**Solution**:
```bash
# Check Python version
python --version  # Should be 3.10+

# Install dependencies
pip install fastapi uvicorn supabase python-dotenv pydantic

# Run with verbose output
python codette_server_unified.py -v
```

### Database Connection Failed
**Error**: `Failed to connect to Supabase`

**Solution**:
1. Check `.env` file: `cat .env | grep SUPABASE`
2. Verify credentials are correct
3. Test Supabase access: `curl https://ngvcyxvtorwqocnqcbyz.supabase.co/health`

### RLS Policy Blocking Access
**Error**: `403 Forbidden` or `42501` in backend logs

**Solution**:
1. Check RLS configuration: `curl http://127.0.0.1:8000/api/diagnostics/rls-policies`
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is in `.env`
3. Restart backend server
4. See `SUPABASE_RLS_AUDIT.md` for detailed fixes

---

## ?? MONITORING

### Real-time Server Status
```bash
# In new terminal, run every 5 seconds
watch -n 5 'curl -s http://127.0.0.1:8000/api/diagnostics/performance | jq'
```

### Log Monitoring
```bash
# Backend logs (Terminal 1)
# Should show:
# - Request counts
# - Response times
# - Error rates
# - Cache hit rates

# Frontend logs (Browser DevTools)
# F12 ? Console ? Filter for [CodetteBridge]
```

---

## ?? PRODUCTION DEPLOYMENT

### Before Deploy
- [ ] All diagnostics show ? green status
- [ ] No errors in backend logs
- [ ] WebSocket connection stable
- [ ] RLS policies configured correctly
- [ ] Service role key stored securely

### Environment Variables (Production)
```bash
# Backend (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-secret
VITE_SUPABASE_ANON_KEY=your-anon-key

# Frontend (.env.local)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_CODETTE_API=http://your-backend.com
```

### Start Production
```bash
# Backend (use production ASGI)
gunicorn --workers 4 --worker-class uvicorn.workers.UvicornWorker codette_server_unified:app

# Frontend (build first)
npm run build
npm run preview
```

---

## ?? DOCUMENTATION

- `SUPABASE_RLS_AUDIT.md` - Comprehensive RLS security guide
- `RLS_SECURITY_QUICKFIX.md` - Quick reference for fixes
- `http://localhost:5173` - Interactive Swagger UI
- `http://localhost:8000/docs` - API documentation

---

## ?? NEXT STEPS

1. ? **Start Backend**: `python codette_server_unified.py`
2. ? **Start Frontend**: `npm run dev`
3. ? **Open Browser**: `http://localhost:5173`
4. ? **Test Connectivity**: `/api/diagnostics/status`
5. ? **Verify RLS**: `/api/diagnostics/rls-policies`

---

## ?? SUPPORT

### Common Questions

**Q: Why do I need both keys?**  
A: Frontend uses anon key (browser-safe, RLS enforced). Backend uses service role key (server-safe, bypasses RLS).

**Q: Can I disable RLS?**  
A: Not recommended. RLS protects user data. See `SUPABASE_RLS_AUDIT.md` for proper configuration.

**Q: How do I check if it's working?**  
A: Run `/api/diagnostics/status` - all should show ? green.

**Q: What if I get 403 errors?**  
A: Check `/api/diagnostics/rls-policies` and ensure service role key is configured.

---

**Status**: ? System Ready - All Components Configured

