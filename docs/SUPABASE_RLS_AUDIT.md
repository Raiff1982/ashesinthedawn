# Supabase RLS Policy Audit & Security Analysis
**Last Updated**: December 3, 2025  
**Server Version**: 2.0.0  
**Status**: ?? Security Analysis Required

---

## ?? CRITICAL FINDING: RLS Policy Configuration Issue

### Problem Statement
Your `codette_server_unified.py` currently uses the **ANON KEY** for database access:

```python
# Line 124-130: Current Implementation
supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')  # ?? ANON KEY

if supabase_url and supabase_key:
    supabase_client = supabase.create_client(supabase_url, supabase_key)
```

### Why This Matters

**Anon key limitations:**
- ? `auth.uid()` is **NULL** (not set)
- ? Policies checking `auth.uid() = user_id` will **DENY access**
- ? Policies checking roles `authenticated` will **DENY access**
- ? Policies checking roles `anon` work (but limited)
- ? Tables without explicit `public/anon` role policies are **BLOCKED**

---

## ?? Database Tables & RLS Status

| Table | RLS Enabled | Typical Policy | Access with Anon Key |
|-------|------------|-----------------|---------------------|
| `music_knowledge` | Yes | `auth.uid() = owner_id` | ? BLOCKED |
| `chat_history` | Yes | `auth.uid() = user_id` | ? BLOCKED |
| `chat_sessions` | Yes | `auth.uid() = user_id` | ? BLOCKED |
| `messages` | Yes | `auth.uid() = user_id` | ? BLOCKED |
| `user_feedback` | Yes | `auth.uid() = user_id` | ? BLOCKED |
| `api_metrics` | Yes | `role = 'public'` | ? ALLOWED |
| `codette_files` | Yes | `auth.uid() = user_id` | ? BLOCKED |
| `embedding_jobs` | Yes | `auth.uid() = user_id` | ? BLOCKED |
| `message_embeddings` | Yes | `auth.uid() = user_id` | ? BLOCKED |

---

## ?? SOLUTIONS (Choose One)

### Solution 1: Use SERVICE ROLE KEY (Recommended for Backend)
**Best for**: Server-side API that needs full database access

```python
# ? CORRECT: Backend should use SERVICE ROLE KEY
supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # SERVICE ROLE KEY

if supabase_url and supabase_key:
    supabase_client = supabase.create_client(supabase_url, supabase_key)
    logger.info("? Supabase connected with service role (full access)")
```

**Advantages:**
- ? Bypasses all RLS policies (backend privilege)
- ? Full database access
- ? Can write to any table
- ? No auth.uid() requirement

**Security Notes:**
- ?? Keep service role key **secret** (never expose in frontend)
- ?? Only use on backend/server
- ?? Never commit to Git

---

### Solution 2: Fix RLS Policies to Allow Anon (Not Recommended)
**Best for**: Public read-only data

Change policies from:
```sql
-- ? BLOCKS anon access
CREATE POLICY "Users can read own data"
  ON public.chat_history
  USING (auth.uid() = user_id);
```

To:
```sql
-- ? ALLOWS anon access (data-specific)
CREATE POLICY "Anyone can read music knowledge"
  ON public.music_knowledge
  USING (
    role() = 'anon' OR 
    role() = 'authenticated' OR 
    auth.uid() = owner_id
  );
```

**Considerations:**
- ?? Only for **read-only** public data
- ?? Don't use for sensitive user data
- ?? Requires policy modifications per table

---

### Solution 3: Implement Edge Function Proxy
**Best for**: Fine-grained access control

Create proxy endpoints that:
1. Accept requests from frontend (with anon key)
2. Extract user context from request
3. Call Supabase with service role key
4. Filter results based on request origin

```typescript
// supabase/functions/chat-proxy/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const { user_id, message } = await req.json();
  
  // Call DB with service role, but filter for user
  const { data, error } = await supabaseAdmin
    .from("chat_history")
    .select("*")
    .eq("user_id", user_id)  // Filter on backend
    .limit(10);

  return new Response(JSON.stringify({ data, error }));
});
```

---

## ?? RECOMMENDED FIX (Solution 1)

### Step 1: Verify SERVICE_ROLE_KEY is in .env

```bash
# .env file check
grep "SUPABASE_SERVICE_ROLE_KEY" .env
# Should return: SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Step 2: Update codette_server_unified.py

```python
# Current (WRONG)
supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')

# Fixed (CORRECT)
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('VITE_SUPABASE_ANON_KEY')
```

### Step 3: Add Fallback Logic

```python
# ============================================================================
# SUPABASE CLIENT SETUP (WITH PROPER KEY SELECTION)
# ============================================================================

supabase_client = None
if SUPABASE_AVAILABLE:
    try:
        supabase_url = os.getenv('VITE_SUPABASE_URL')
        
        # Priority: Service Role Key > Anon Key
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        key_type = "service role (full access)"
        
        if not supabase_key:
            supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')
            key_type = "anon (limited by RLS)"
            logger.warning("??  Using anon key - RLS policies may block access")
        
        if supabase_url and supabase_key:
            supabase_client = supabase.create_client(supabase_url, supabase_key)
            logger.info(f"? Supabase client connected with {key_type}")
        else:
            logger.warning("?? Supabase credentials not found in environment variables")
    except Exception as e:
        logger.warning(f"?? Failed to connect to Supabase: {e}")
```

### Step 4: Test Database Access

```bash
# Test with diagnostics endpoint
curl http://127.0.0.1:8000/api/diagnostics/database

# Should show all tables as "? Accessible"
```

---

## ? VERIFICATION CHECKLIST

After implementing the fix:

- [ ] `.env` contains `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `codette_server_unified.py` uses service role key (with anon fallback)
- [ ] Server logs show "service role (full access)" not "anon (limited by RLS)"
- [ ] `/api/diagnostics/database` shows all tables as accessible
- [ ] Chat endpoint works without RLS errors
- [ ] Music knowledge suggestions load without errors
- [ ] No 403/Forbidden errors in logs

---

## ?? SECURITY BEST PRACTICES

### DO:
? Use **service role key** on backend/server  
? Use **anon key** on frontend (read-only)  
? Keep service role key in **environment variables**  
? Never expose service role key in frontend code  
? Use RLS policies to filter user data  
? Log all database operations  

### DON'T:
? Commit keys to Git  
? Use anon key for backend operations  
? Disable RLS policies  
? Pass credentials through query strings  
? Mix keys (use one per environment)  

---

## ?? ENVIRONMENT VARIABLES REQUIRED

```bash
# Frontend (.env or .env.local)
VITE_SUPABASE_URL=https://ngvcyxvtorwqocnqcbyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # For browser/frontend

# Backend (.env)
SUPABASE_URL=https://ngvcyxvtorwqocnqcbyz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # For server (KEEP SECRET!)
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # Fallback for frontend requests
```

---

## ?? NEXT STEPS

1. **Verify** `.env` has `SUPABASE_SERVICE_ROLE_KEY`
2. **Update** `codette_server_unified.py` to use service role key
3. **Restart** server with `python codette_server_unified.py`
4. **Test** `/api/diagnostics/database` endpoint
5. **Monitor** logs for RLS access issues

---

## ?? REFERENCES

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Row-Level Security Policies](https://supabase.com/docs/guides/auth/row-level-security/policies)
- [Using Service Role Key](https://supabase.com/docs/guides/auth/service-role)
- [Managing Secrets](https://supabase.com/docs/guides/database/vault)

---

## ?? TROUBLESHOOTING

### Issue: "403 Forbidden" or "42501" errors
**Cause**: Using anon key with auth.uid() policy  
**Fix**: Use service role key or adjust RLS policy

### Issue: "RLS policy blocking queries"
**Cause**: Table requires authentication  
**Fix**: Add policy that allows anon OR use service role key

### Issue: "auth.uid() is null"
**Cause**: Using anon key (correct behavior)  
**Fix**: Use service role key for backend operations

### Issue: "Insufficient privileges"
**Cause**: Wrong key for operation  
**Fix**: Use appropriate key (service role for writes, anon for public reads)

---

**Status**: ? Audit Complete - Implement Solution 1 for immediate fix

