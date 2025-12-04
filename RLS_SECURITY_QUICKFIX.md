# ?? RLS SECURITY FIX - QUICK START GUIDE

## ? The Problem
Your backend is using the **ANON KEY** which has `auth.uid() = NULL`.  
Most tables have RLS policies requiring `auth.uid() = user_id`, so queries are **BLOCKED**.

---

## ? The Solution (3 Steps)

### Step 1: Verify .env Has Service Role Key
```bash
# Check if SUPABASE_SERVICE_ROLE_KEY exists
grep "SUPABASE_SERVICE_ROLE_KEY" .env

# Should return something like:
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**If missing**, get it from:
1. Go to https://app.supabase.com
2. Project Settings ? API ? Service Role Secret
3. Copy and add to `.env`

---

### Step 2: Server Now Uses Service Role Key Automatically
The updated `codette_server_unified.py` now:
- ? Tries to use `SUPABASE_SERVICE_ROLE_KEY` first (full access)
- ? Falls back to `VITE_SUPABASE_ANON_KEY` if service key missing
- ? Logs which key is being used at startup

---

### Step 3: Restart Server and Check Status
```powershell
# Kill old server (Ctrl+C)

# Start new server
python codette_server_unified.py

# Look for this in logs:
# ? Supabase client connected with service role (full access)
# ?? SECURE - Backend use only

# Not this:
# ?? Using anon key - RLS policies may block access
```

---

## ?? Verify It's Working

### Check RLS Policy Analysis
```bash
curl http://127.0.0.1:8000/api/diagnostics/rls-policies
```

Should show:
- `"current_key_used": "Service Role Key"`
- `"status": "? CORRECT"`

### Check Database Access
```bash
curl http://127.0.0.1:8000/api/diagnostics/database
```

Should show:
- `"client_status": "? Connected"`
- All tables showing `"? Accessible"`

---

## ?? What Changed

### Before (Broken)
```
User Request ? Frontend (anon key) ? Backend (anon key)
                                           ?
                                    RLS Policy Check
                                    auth.uid() = NULL
                                           ?
                                    ? DENIED (403)
```

### After (Fixed)
```
User Request ? Frontend (anon key) ? Backend (service role key)
                                           ?
                                    RLS Policy Bypassed
                                    (backend privilege)
                                           ?
                                    ? ALLOWED (200)
```

---

## ?? Key Points

| Item | Frontend | Backend |
|------|----------|---------|
| **Key to Use** | Anon Key | Service Role Key |
| **RLS Enforced** | Yes (auth.uid() checked) | No (bypassed) |
| **Access** | Limited to own data | Full database access |
| **Security** | Safe (exposed in browser) | Secret (keep in .env) |
| **Typical Use** | Read user's own data | Write to any table |

---

## ?? Security Reminders

? DO:
- Use service role key on **backend only**
- Use anon key on **frontend only**
- Keep service role key in `.env` (gitignored)
- Never expose service role key to browser

? DON'T:
- Commit service role key to Git
- Pass service role key to frontend
- Use anon key for backend writes
- Disable RLS policies

---

## ?? Troubleshooting

### Still Getting 403 Errors?
1. Confirm `.env` has `SUPABASE_SERVICE_ROLE_KEY`
2. Restart server with `python codette_server_unified.py`
3. Check logs for "service role (full access)"
4. Run `/api/diagnostics/database` to test

### Logs Show "Using anon key"?
1. Service role key not in `.env`
2. Add it: `SUPABASE_SERVICE_ROLE_KEY=<your-key>`
3. Restart server

### Can't Find Service Role Key?
1. Supabase Dashboard ? Settings ? API ? Service Role Secret
2. Copy the long string starting with `eyJhbGc...`
3. Add to `.env`: `SUPABASE_SERVICE_ROLE_KEY=<paste-here>`

---

## ?? Full Documentation
See `SUPABASE_RLS_AUDIT.md` for comprehensive security guide.

---

**Status**: ? Fix Applied - RLS Security Improved

