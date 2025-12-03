# How to Create Codette Control Tables in Supabase

## Option 1: Using Supabase SQL Editor (Recommended - Easiest)

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to https://app.supabase.com
   - Select your project: `ngvcyxvtorwqocnqcbyz`

2. **Open SQL Editor**
   - In the left sidebar, click **SQL Editor**
   - Click **New Query**

3. **Copy the SQL**
   - Open the file: `supabase/migrations/create_codette_tables.sql`
   - Copy ALL the SQL code

4. **Paste and Execute**
   - Paste the SQL into the SQL Editor
   - Click **Run** button (or press `Cmd+Enter` / `Ctrl+Enter`)
   - Wait for execution to complete (should take 2-3 seconds)

5. **Verify Success**
   - You should see: `Success. No rows returned`
   - Check the **Table Editor** to confirm tables exist:
     - `codette_permissions`
     - `codette_control_settings`
     - `codette_activity_logs`

---

## Option 2: Using Supabase CLI (For CI/CD)

### Prerequisites:
```bash
npm install -g supabase
```

### Steps:

1. **Login to Supabase**
   ```bash
   supabase login
   ```

2. **Link Your Project**
   ```bash
   supabase link --project-ref ngvcyxvtorwqocnqcbyz
   ```

3. **Run Migration**
   ```bash
   supabase db push
   ```

---

## Option 3: Manual psql Connection

### Prerequisites:
- PostgreSQL client tools installed
- Supabase connection string from Dashboard

### Steps:

1. **Get Connection String**
   - Supabase Dashboard ? Settings ? Database
   - Copy **Connection string** (PostgreSQL)

2. **Run Migration**
   ```bash
   psql "your_connection_string" < supabase/migrations/create_codette_tables.sql
   ```

---

## What Gets Created

### ?? Tables:
- **codette_permissions** - User permissions for Codette features
- **codette_control_settings** - User settings and preferences
- **codette_activity_logs** - Activity audit trail

### ?? Security:
- Row Level Security (RLS) enabled on all tables
- Demo user (`demo-user`) has full access
- Authenticated users can only see their own data
- Service role can manage everything

### ?? Indexes:
- Optimized queries for user lookups
- Timestamps indexed for activity log queries
- Unique constraints on user+setting combos

---

## Testing After Creation

1. **Refresh your browser** at http://localhost:5173/

2. **Check the Console**
   - The 404 errors for `codette_control_settings`, `codette_activity_logs`, and `codette_permissions` should be **GONE** ?

3. **Check Supabase Dashboard**
   - Tables ? You should see all 3 new tables
   - Each table shows row count (should be 1 for permissions table)

---

## Troubleshooting

### Error: "relation already exists"
- This is normal if you run the migration twice
- The `IF NOT EXISTS` clause handles this gracefully

### Error: "Permission denied"
- Make sure you're using the **Service Role Key** (not Anon Key)
- Check Supabase Dashboard ? Settings ? API Keys

### Error: "row-level security policy"
- This is expected if using the Anon Key
- Make sure RLS policies allow demo-user
- They should already be in the migration SQL

---

## Result After Execution

? **Console should be clean** - No more Codette 404 errors
? **Tables created** - Ready for Codette features
? **Demo user set up** - Can use immediately
? **Production ready** - RLS policies secure

---

**Time to Execute:** 2-3 minutes
**Difficulty:** Easy (Option 1) to Medium (Options 2-3)
**Recommended:** Use Option 1 (SQL Editor) - fastest and most intuitive
