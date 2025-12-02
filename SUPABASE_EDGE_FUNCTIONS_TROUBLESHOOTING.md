# 🔧 Supabase Edge Functions Troubleshooting Guide

**Date**: December 1, 2025  
**Baseline**: Verification run showed 75% pass rate (6/8 tests)  
**Status**: 2 functions need investigation

---

## 📋 Current Test Results

### ✅ Passing (6/8)
- `codette-fallback-handler` - Status 500 (expected - error handler)
- `database-access` - Status 200 ✅
- `upsert-embeddings` - Status 400 (expected - test payload)
- Backend Health - Status 200 ✅
- Codette Chat - Status 200 ✅
- Edge Functions Health - Status 404 (not yet implemented)

### ❌ Failing (2/8)
1. **`codette-fallback`** - Status 403 (Forbidden)
2. **`hybrid-search-music`** - Status 500 (Internal Server Error)

---

## 🚨 Issue #1: `codette-fallback` Returns 403

### Symptoms
```
❌ codette-fallback [MEDIUM]   Unexpected status 403 (1009ms)
```

### Root Causes (In Priority Order)

#### 1. **Authentication/Authorization** (Most Likely)
- 403 = Forbidden = Missing or invalid permissions
- The function may require elevated privileges
- Your ANON_KEY may not have execute permission

**Fix**:
```sql
-- In Supabase SQL Editor, run:
GRANT EXECUTE ON FUNCTION public.codette_fallback(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.codette_fallback(text) TO anon;
```

#### 2. **Rate Limiting** (Possible)
- Supabase has rate limits on Edge Functions
- 403 can indicate rate limit exceeded

**Fix**:
```bash
# Wait 5 minutes and retry
sleep 300
python verify_edge_functions.py
```

#### 3. **Function Not Deployed** (Less Likely)
- Function may be disabled in Supabase dashboard

**Fix**:
1. Go to: https://app.supabase.com/project/ngvcyxvtorwqocnqcbyz/functions
2. Find `codette-fallback`
3. Verify status = "Enabled"
4. Check "Logs" tab for error messages

### Verification

```bash
# Test with curl directly
curl -X POST https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/codette-fallback \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}' \
  -v
```

Look for response headers - 403 usually includes error details.

---

## 🚨 Issue #2: `hybrid-search-music` Returns 500

### Symptoms
```
❌ hybrid-search-music [HIGH]   Unexpected status 500 (1466ms)
```

### Root Causes (In Priority Order)

#### 1. **Database Query Error** (Most Likely for New Function)
- Function was just deployed 9 hours ago
- May be querying non-existent table/columns
- SQL syntax error in the function

**Fix**:
1. Check Supabase dashboard: Functions → hybrid-search-music → Logs
2. Look for SQL error messages
3. Verify the underlying query:

```sql
-- Test the search query manually in SQL Editor:
SELECT * FROM music_knowledge 
WHERE to_tsvector('english', content) @@ plainto_tsquery('english', 'mixing')
LIMIT 5;
```

#### 2. **Missing Dependencies** (Possible)
- JavaScript/Deno dependencies not installed
- Missing vector search library

**Fix**:
```bash
# In Supabase, check function dependencies:
# If using Deno, check import statements are accessible
```

#### 3. **Timeout** (Less Likely but Possible)
- Embedding search taking > 30 seconds (default timeout)

**Fix**:
- Add pagination: fetch smaller batches
- Add indexes to music_knowledge table

### Verification

```bash
# Check logs directly
curl https://app.supabase.com/api/v1/projects/ngvcyxvtorwqocnqcbyz/functions/hybrid-search-music/logs \
  -H "Authorization: Bearer $SUPABASE_ADMIN_TOKEN"
```

Or via dashboard:
1. Go to: https://app.supabase.com/project/ngvcyxvtorwqocnqcbyz
2. Click: Functions → hybrid-search-music
3. Click: "Logs" tab
4. Look for red error messages

---

## 🛠️ Quick Fix Workflow

### Step 1: Run Verification
```bash
python verify_edge_functions.py > results.txt
cat results.txt
```

### Step 2: Check Supabase Logs
```
1. Go to: app.supabase.com/project/ngvcyxvtorwqocnqcbyz
2. Functions → [Function Name] → Logs
3. Copy error message
4. Search for solution below
```

### Step 3: Fix & Redeploy

**Option A: Quick Fix (Permissions)**
```sql
-- Run in Supabase SQL Editor
GRANT EXECUTE ON FUNCTION public.codette_fallback(text) TO anon;
```

**Option B: Redeploy Function**
```bash
# Via Supabase CLI
supabase functions deploy codette-fallback
```

**Option C: Manual SQL Fix**
```sql
-- Drop and recreate function with correct SQL
DROP FUNCTION IF EXISTS public.hybrid_search_music(text, int);

CREATE FUNCTION public.hybrid_search_music(query text, result_limit int DEFAULT 5)
RETURNS TABLE (id uuid, content text, relevance float)
LANGUAGE SQL
AS $$
  SELECT id, content, NULL as relevance
  FROM music_knowledge
  WHERE to_tsvector('english', content) @@ plainto_tsquery('english', query)
  LIMIT result_limit;
$$;
```

### Step 4: Verify Fix
```bash
python verify_edge_functions.py
```

---

## 📊 Detailed Function Status

### `codette-fallback`
```
Status:   ❌ 403 Forbidden
Type:     Fallback handler
Created:  26 May 2025
Usage:    Should trigger when primary fails
Impact:   Low (fallback only)
Severity: Medium (losing fallback safety)

Action Items:
[ ] 1. Check authorization in Supabase dashboard
[ ] 2. Grant execute permissions to anon role
[ ] 3. Test with curl -v to see error details
[ ] 4. Check function logs
```

### `hybrid-search-music`
```
Status:   ❌ 500 Internal Server Error
Type:     Semantic search (NEW - Dec 1, 2025)
Created:  01 Dec 2025
Usage:    Semantic search in music_knowledge
Impact:   High (new feature, affects recommendations)
Severity: High (new deployment may have bugs)

Action Items:
[ ] 1. Check Supabase logs for error message
[ ] 2. Test SQL query manually in Editor
[ ] 3. Verify table: music_knowledge exists
[ ] 4. Check for vector/embedding column issues
[ ] 5. Test with simpler query first
```

---

## 🔍 Advanced Debugging

### Check Function Code
```bash
# View function source in Supabase
curl https://api.supabase.com/projects/ngvcyxvtorwqocnqcbyz/functions \
  -H "Authorization: Bearer $SUPABASE_ADMIN_TOKEN"
```

### Monitor in Real-Time
```bash
# Watch logs continuously
watch -n 5 'curl https://app.supabase.com/... (see above)'
```

### Test Backend Cache
```bash
# Backend may cache Supabase failures
curl http://localhost:8000/health/edge-functions | jq '.functions_called'
```

### Check Network Connectivity
```bash
# Verify Supabase is reachable from your machine
ping ngvcyxvtorwqocnqcbyz.supabase.co

# Test DNS resolution
nslookup ngvcyxvtorwqocnqcbyz.supabase.co
```

---

## 📋 Fix Checklist

### For `codette-fallback` (403)
- [ ] Check Supabase dashboard: Functions → codette-fallback → Settings
- [ ] Verify function is "Enabled"
- [ ] Check authentication: In SQL Editor, run:
  ```sql
  SELECT * FROM information_schema.role_routine_grants 
  WHERE routine_name = 'codette_fallback';
  ```
- [ ] If missing, grant permissions:
  ```sql
  GRANT EXECUTE ON FUNCTION public.codette_fallback(text) TO anon, authenticated;
  ```
- [ ] Redeploy function:
  ```bash
  supabase functions deploy codette-fallback
  ```
- [ ] Run test again: `python verify_edge_functions.py`

### For `hybrid-search-music` (500)
- [ ] Check logs: Functions → hybrid-search-music → Logs tab
- [ ] Copy error message and search documentation
- [ ] Test base query in SQL Editor:
  ```sql
  SELECT * FROM music_knowledge LIMIT 1;
  ```
- [ ] Test search query:
  ```sql
  SELECT * FROM music_knowledge 
  WHERE to_tsvector('english', content) @@ plainto_tsquery('english', 'test')
  LIMIT 5;
  ```
- [ ] Check for encoding issues:
  ```sql
  SELECT character_set_name FROM information_schema.schemata 
  WHERE schema_name = 'public';
  ```
- [ ] Increase function timeout (if available):
  - In Supabase: Functions → Settings → Timeout = 60s
- [ ] Check vector/embedding column setup:
  ```sql
  SELECT column_name, data_type FROM information_schema.columns 
  WHERE table_name = 'music_knowledge';
  ```
- [ ] If vector column missing, add it:
  ```sql
  ALTER TABLE music_knowledge 
  ADD COLUMN embedding vector(1536) DEFAULT NULL;
  ```

---

## 🎯 Success Criteria

**All tests should pass**:
```
✅ codette-fallback                      Status 200/400/500
✅ codette-fallback-handler              Status 200/400/500
✅ database-access                       Status 200
✅ hybrid-search-music                   Status 200
✅ upsert-embeddings                     Status 200/400
✅ Backend Health                        Status 200
✅ Codette Chat                          Status 200
✅ Edge Functions Health                 Status 200
```

**Metrics to monitor**:
- Response time: < 1000ms (average)
- Success rate: > 95%
- Error rate: < 5%

---

## 📞 When to Escalate

**Contact Supabase Support if**:
- Function times out (> 30s) consistently
- 502/503 errors (service unavailable)
- Authentication issues persist after fixing permissions
- Database connection errors in logs

**Link to Supabase Support**: https://supabase.com/docs/guides/platform/support

---

## 📚 Resources

- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **Edge Functions Guide**: https://supabase.com/docs/guides/functions/quickstart
- **PostgreSQL Functions**: https://www.postgresql.org/docs/current/sql-createfunction.html
- **Your Project**: https://app.supabase.com/project/ngvcyxvtorwqocnqcbyz

---

## 📝 Next Steps

1. **Today**: Run troubleshooting steps for both failing functions
2. **Tomorrow**: Run verification script again to confirm fixes
3. **This Week**: Setup automated monitoring (cron job)
4. **This Month**: Add alerting system for function failures

---

**Last Updated**: December 1, 2025, 14:15 UTC  
**Status**: Active Troubleshooting  
**Maintainer**: AI Assistant (GitHub Copilot)
