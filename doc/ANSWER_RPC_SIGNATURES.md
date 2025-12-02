# ANSWER: Exact RPC Signatures as Used by Client

**Request**: "Provide the exact RPC signature as used by your client (for example: get_music_suggestions(uuid) or get_music_suggestions(text, integer))"

**Answer**: Your backend uses THREE RPC functions with the following signatures:

---

## ✅ RPC SIGNATURES - EXACT SPECIFICATIONS

### Signature #1
```
get_music_suggestions(text, text)
```
**Used in**: `/codette/suggest` endpoint (Line 1772)  
**Parameters**: `(p_prompt text, p_context text)`  
**Example**: `get_music_suggestions('mixing', 'mixing')`

---

### Signature #2
```
get_music_suggestions(text, integer)
```
**Used in**: `/codette/chat` endpoint for semantic search (Line 1263)  
**Parameters**: `(query text, limit integer)`  
**Example**: `get_music_suggestions('reverb settings', 3)`

---

### Signature #3
```
get_codette_context(text, text)
```
**Used in**: `/codette/chat` endpoint for context retrieval (Line 931)  
**Parameters**: `(input_prompt text, optionally_filename text)`  
**Example**: `get_codette_context('What should I do?', NULL)`

---

## The Problem

**Current Error**: `permission denied for function get_music_suggestions` (PostgreSQL error 42501)

**Root Cause**: 
1. The `music_knowledge` table EXISTS with data ✅
2. The RPC functions DO NOT EXIST or lack execute permissions ❌

**Why suggestions show "fallback"**:
- Backend tries to call RPC → Gets permission denied error
- Catches exception silently
- Falls back to hardcoded suggestions with `"source": "fallback"`

---

## The Solution

Create all three functions in Supabase with proper permissions:

**Files to help you**:
1. `supabase_migration_fix_rpc.sql` - Copy-paste ready SQL
2. `SUPABASE_FIX_GUIDE.md` - Step-by-step instructions
3. `RPC_SIGNATURES_COMPLETE.md` - Detailed specifications

**Quick fix**: 
- Go to Supabase SQL Editor
- Copy `supabase_migration_fix_rpc.sql`
- Paste and run
- Done! ✅

---

## Verification

After fix, these should work:

```bash
# Test Signature #1
curl -X POST http://localhost:8000/codette/suggest \
  -H "Content-Type: application/json" \
  -d '{"context":{"type":"mixing"},"limit":5}'
# Should return: source "database" (not "fallback")

# Test Signature #2  
curl -X POST http://localhost:8000/codette/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I set up reverb?"}'
# Should return: real suggestions from database

# Test Signature #3
# (Called internally during chat processing)
```

---

## Summary Table

| Function Name | Signature | Parameters | Used By | Status |
|---|---|---|---|---|
| `get_music_suggestions` | `(text, text)` | `p_prompt, p_context` | `/codette/suggest` | ❌ Missing |
| `get_music_suggestions` | `(text, integer)` | `query, limit` | `/codette/chat` | ❌ Missing |
| `get_codette_context` | `(text, text)` | `input_prompt, optionally_filename` | `/codette/chat` | ❌ Missing |

---

**Answer Complete** ✅

Your backend expects these three exact RPC signatures. Create them in Supabase using the provided migration SQL, and your suggestions will pull from the database instead of showing as "fallback".
