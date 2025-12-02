# 🚀 Edge Functions Quick Reference

**Verification Status**: December 1, 2025, 14:30 UTC

---

## 📊 Current Status

| Function | Status | Response | Action |
|----------|--------|----------|--------|
| ✅ `database-access` | Working | 200 OK | ✓ Monitor |
| ✅ `upsert-embeddings` | Working | 400 (test) | ✓ Monitor |
| ✅ `codette-fallback-handler` | Working | 500 (test) | ✓ Monitor |
| ❌ `codette-fallback` | **BROKEN** | 403 Forbidden | 🔧 Fix Auth |
| ❌ `hybrid-search-music` | **BROKEN** | 500 Error | 🔧 Debug |
| ✅ Backend Health | Working | 200 OK | ✓ Monitor |
| ✅ Codette Chat | Working | 200 OK | ✓ Monitor |
| ⚠️ Edge Functions Health | Not Impl | 404 Not Found | 📋 TODO |

---

## 🔧 Quick Fixes

### 1️⃣ Fix `codette-fallback` (403)

**Problem**: Missing permissions  
**Time**: 2 minutes

```bash
# In Supabase SQL Editor, run:
GRANT EXECUTE ON FUNCTION public.codette_fallback(text) TO anon, authenticated;
```

**Verify**:
```bash
python verify_edge_functions.py | grep codette-fallback
```

---

### 2️⃣ Fix `hybrid-search-music` (500)

**Problem**: Unknown - check logs  
**Time**: 10 minutes

**Debug Steps**:
1. Go to: https://app.supabase.com/project/ngvcyxvtorwqocnqcbyz
2. Click: Functions → hybrid-search-music → Logs
3. Copy the error message
4. Search troubleshooting guide: `SUPABASE_EDGE_FUNCTIONS_TROUBLESHOOTING.md`

---

## 🎯 Commands to Run

```bash
# Run verification
python verify_edge_functions.py

# Check backend health
curl http://localhost:8000/health

# Test chat endpoint
curl -X POST http://localhost:8000/codette/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'

# View backend logs
# (Windows)
Get-Content codette_server_unified.log -Tail 50

# (Linux/Mac)
tail -50 codette_server_unified.log
```

---

## 📋 Daily Checklist

- [ ] Run: `python verify_edge_functions.py`
- [ ] All tests passing? → No action needed
- [ ] Some tests failing?
  - [ ] Check troubleshooting guide
  - [ ] Fix issues
  - [ ] Re-run verification
  - [ ] Document what broke

---

## 🚨 Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Response Time | > 500ms | > 2000ms |
| Error Rate | > 5% | > 20% |
| Success Rate | < 95% | < 80% |
| Uptime | < 99% | < 95% |

---

## 📞 Emergency Contacts

**If everything is broken**:
1. Check backend: `curl http://localhost:8000/health`
2. Check Supabase: https://status.supabase.com
3. Check network: `ping ngvcyxvtorwqocnqcbyz.supabase.co`
4. Run: `python verify_edge_functions.py`
5. Open troubleshooting guide: `SUPABASE_EDGE_FUNCTIONS_TROUBLESHOOTING.md`

---

## 📚 Full Guides

| Guide | Purpose |
|-------|---------|
| `SUPABASE_EDGE_FUNCTIONS_REFERENCE.md` | Complete function inventory |
| `SUPABASE_EDGE_FUNCTIONS_MONITORING.md` | How to monitor functions |
| `SUPABASE_EDGE_FUNCTIONS_TROUBLESHOOTING.md` | Fix broken functions |

---

**Run verification**: `python verify_edge_functions.py`
