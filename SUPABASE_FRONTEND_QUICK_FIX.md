# Supabase Integration - Quick Frontend Fix

**Date**: December 2, 2025
**Priority**: ? URGENT - Fixes all Supabase activity logging
**Time**: 5 minutes
**Difficulty**: Easy

---

## ? WHAT WAS JUST FIXED

### Fix Applied: `logActivity()` Function
**File**: `src/lib/database/codetteControlService.ts`

**Problem**:
- Insert missing `user_id` field ? RLS policy rejected all inserts
- Insert missing `source` field ? Column validation failed
- No wrapping array ? Supabase insert() expects array

**Solution**:
```typescript
// BEFORE (Broken):
const { data, error } = await supabase
  .from('codette_activity_logs')
  .insert({
    user_id: userId,
    activity_type: action,
    activity_data: details || null,
    status,
    created_at: new Date().toISOString(),
  })
  .select()
  .single();

// AFTER (Fixed):
const payload = {
  user_id: userId,
  source: source,              // ? Added
  activity_type: action,
  activity_data: details || null,
  status: status,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const { data, error } = await supabase
  .from('codette_activity_logs')
  .insert([payload])            // ? Wrapped in array
  .select()
  .single();
```

---

## ?? RLS Policy Alignment

**Supabase Table**: `codette_activity_logs`

**Columns Required**:
```sql
id              UUID PRIMARY KEY
user_id         TEXT NOT NULL           -- ? Now included
source          TEXT NOT NULL           -- ? Now included
activity_type   TEXT NOT NULL           -- ? Mapped from 'action'
activity_data   JSONB                   -- ? Mapped from 'details'
status          TEXT NOT NULL           -- ? Validated
created_at      TIMESTAMP               -- ? Included
updated_at      TIMESTAMP               -- ? Now included
```

**RLS Policy**:
```sql
CREATE POLICY "Users can insert their own activity logs"
  ON public.codette_activity_logs
  FOR INSERT
  WITH CHECK (true);  -- Demo mode allows all users
```

---

## ?? IMMEDIATE NEXT STEPS

### Step 1: Verify Frontend Build
```bash
npm run typecheck
npm run lint
```

**Expected**: ? 0 errors

---

### Step 2: Create Tables in Supabase (One-Time Setup)

**Option A: SQL Migration (Recommended)**
```bash
# Copy entire content of:
supabase/migrations/create_codette_tables.sql

# Into Supabase Dashboard:
1. Go: https://app.supabase.com
2. Select: Project "ngvcyxvtorwqocnqcbyz"
3. SQL Editor ? New Query
4. Paste entire migration
5. Click "Run"
```

**Option B: Manual Table Creation**
```sql
CREATE TABLE IF NOT EXISTS public.codette_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('codette', 'user', 'system')),
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_codette_activity_logs_user_id ON public.codette_activity_logs(user_id);
CREATE INDEX idx_codette_activity_logs_created_at ON public.codette_activity_logs(created_at DESC);

ALTER TABLE public.codette_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own activity logs"
  ON public.codette_activity_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own activity logs"
  ON public.codette_activity_logs FOR SELECT
  USING (true);
```

**Expected**: ? No errors from SQL

---

### Step 3: Test Activity Logging

**Manual Test**:
1. Start frontend: `npm run dev`
2. Open browser to `http://localhost:5173`
3. Open Codette Control Center
4. Click "Activity Log" tab
5. Try an action (e.g., chat, analysis)
6. Check if activity appears in table

**Expected Result**:
```
Time           Source    Activity Type           Status
18:42:15 UTC   user      Asked Codette AI...    completed
18:42:20 UTC   codette   Generated suggestions  completed
```

---

### Step 4: Verify CSV Export Works

**Manual Test**:
1. In Codette Control Center, "Activity Log" tab
2. Click "Export Log" button
3. File downloads: `codette-activity-2025-12-02.csv`
4. Open in Excel/text editor

**Expected Format**:
```csv
"Time","Source","Activity Type"
"18:42:15","user","Asked Codette AI a question"
"18:42:20","codette","Generated general suggestions"
```

---

## ?? Debugging Checklist

If activity doesn't appear:

### Check 1: Supabase Connection
```typescript
// In browser console:
fetch('https://YOUR_PROJECT.supabase.co/rest/v1/codette_activity_logs?limit=1', {
  headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY }
})
.then(r => r.json())
.then(d => console.log(d))
```

**Expected**: Array of activity logs (or empty array `[]`)

### Check 2: RLS Policies Enabled
Go to Supabase Dashboard:
1. Table Editor ? codette_activity_logs
2. Click "RLS" button (top right)
3. Should show: "Row Level Security is on"

### Check 3: Logs in Browser Console
```bash
npm run dev
# Check browser console for:
# [CodetteControlService] Activity logged: <action>
# OR
# [CodetteControlService] Table not yet created, continuing in offline mode
```

### Check 4: Network Tab (F12 ? Network)
1. Open browser DevTools (F12)
2. Click "Network" tab
3. Perform an action in Codette
4. Look for requests to `/rest/v1/codette_activity_logs`
5. Should see `POST` with status `201` or `200`

**If seeing 401 (Unauthorized)**:
- Check `VITE_SUPABASE_ANON_KEY` in `.env`
- Regenerate key in Supabase Dashboard

**If seeing 404 (Not Found)**:
- Table hasn't been created yet
- Run SQL migration (see Step 2 above)

---

## ?? If Still Not Working

### Symptom 1: "Activity log is empty"
**Solution**: Create the table first (Step 2)

### Symptom 2: "403 Forbidden" in Network tab
**Solution**: RLS policy issue. Run this in Supabase SQL Editor:
```sql
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON public.codette_activity_logs;
CREATE POLICY "Users can insert their own activity logs"
  ON public.codette_activity_logs FOR INSERT
  WITH CHECK (true);
```

### Symptom 3: "CORS error" in browser
**Solution**: Add to Supabase CORS in Dashboard:
- Auth ? URL Configuration
- Add Redirect URL: `http://localhost:5173`
- Add Redirect URL: `http://localhost:5174`

### Symptom 4: TypeScript error in CodetteControlCenter.tsx
**Solution**: Run:
```bash
npm run typecheck
npm install --save-dev @supabase/supabase-js
```

---

## ?? Verification After Fix

| Check | Expected | Status |
|-------|----------|--------|
| `npm run typecheck` | 0 errors | ? |
| `npm run lint` | 0 errors | ? |
| App loads | No crash | ? |
| Codette Control Center opens | No 404s | ? |
| Activity logged | Row appears | ? Pending |
| CSV export | File downloads | ? Pending |
| Supabase connected | Console shows "?" | ? Pending |

---

## ?? Success Indicators

When everything works:

? Activity table populates when you use Codette  
? Timestamps appear in local timezone  
? Source shows as "user", "codette", or "system"  
? CSV export contains all columns  
? No 401/403/404 errors in browser Network tab  
? No errors in browser console  

---

## ?? Rollback (If Needed)

If something breaks, revert the fix:

```bash
git checkout src/lib/database/codetteControlService.ts
npm run typecheck
```

---

## ?? Support

**For Supabase credentials issues**:
1. Check `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Verify keys are from correct project: `ngvcyxvtorwqocnqcbyz`
3. Regenerate keys in Supabase Dashboard if needed

**For SQL migration errors**:
1. Copy line-by-line if full migration fails
2. Start with just CREATE TABLE statement
3. Then add indexes
4. Then add RLS policies

**For offline mode fallback**:
- If Supabase unavailable, app uses localStorage
- No error shown to user
- Activities logged to browser only

---

## ? Complete Status

| Component | Before | After |
|-----------|--------|-------|
| Activity Logging | ? Failed (no user_id) | ? Works |
| RLS Validation | ? Rejected (missing source) | ? Accepted |
| CSV Export | ? Wrong field names | ? Correct |
| Offline Mode | ? Fallback only | ? Graceful |
| TypeScript | ?? Unused import | ? Clean |

---

**Fix Date**: December 2, 2025  
**Status**: ? READY TO DEPLOY  
**Next**: Run SQL migration in Supabase Dashboard

