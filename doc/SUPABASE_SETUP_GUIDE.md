# Supabase Database Setup Guide

## Overview

CoreLogic Studio uses Supabase for cloud features including:
- Activity logging (`codette_activity_logs`)
- Permission management (`codette_permissions`)
- Control settings (`codette_control_settings`)
- Chat history (`chat_history`)
- AI cache (`ai_cache`)
- Project cloud sync (`projects`)

**Important**: All services have **automatic fallback to local storage** if tables don't exist or authentication fails.

## Quick Setup (3 Steps)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key

### 2. Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Click **+ New Query**
3. Copy and paste the entire content of `supabase_migrations.sql`
4. Click **Run**

### 3. Configure Environment Variables

Add to `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Database Schema

### 1. `codette_activity_logs`
Tracks all AI activities and user actions.

**Columns**:
- `id` (UUID) - Primary key
- `user_id` (TEXT) - User identifier
- `timestamp` (TIMESTAMP) - When action occurred
- `source` (TEXT) - 'codette', 'user', or 'system'
- `action` (TEXT) - Action description
- `details` (JSONB) - Additional data
- `status` (TEXT) - 'pending', 'approved', 'denied', 'completed'
- `created_at`, `updated_at` (TIMESTAMP) - Timestamps

**Indexes**:
- `idx_codette_activity_logs_user_id` - Fast user lookups
- `idx_codette_activity_logs_created_at` - Chronological ordering
- `idx_codette_activity_logs_source` - Filter by source

### 2. `codette_permissions`
Manages user permissions for AI operations.

**Columns**:
- `id` (UUID) - Primary key
- `user_id` (TEXT) - User identifier
- `action_type` (TEXT) - 'LoadPlugin', 'CreateTrack', 'RenderMixdown', etc.
- `permission_level` (TEXT) - 'allow', 'ask', 'deny'
- `created_at`, `updated_at` (TIMESTAMP)
- **UNIQUE constraint**: (user_id, action_type)

**Default Permissions** (auto-created):
```typescript
[
  { action_type: 'LoadPlugin', permission_level: 'ask' },
  { action_type: 'CreateTrack', permission_level: 'allow' },
  { action_type: 'RenderMixdown', permission_level: 'ask' },
  { action_type: 'AdjustParameters', permission_level: 'ask' },
  { action_type: 'SaveProject', permission_level: 'allow' },
]
```

### 3. `codette_control_settings`
Stores user-specific control center settings.

**Columns**:
- `id` (UUID) - Primary key
- `user_id` (TEXT) - User identifier (UNIQUE)
- `enabled` (BOOLEAN) - Feature enabled
- `log_activity` (BOOLEAN) - Log all activities
- `auto_render` (BOOLEAN) - Auto-render on changes
- `include_in_backups` (BOOLEAN) - Include in project backups
- `clear_history_on_close` (BOOLEAN) - Clear logs on app close
- `created_at`, `updated_at` (TIMESTAMP)

### 4. `chat_history`
Stores chat conversation history.

**Columns**:
- `id` (UUID) - Primary key
- `user_id` (TEXT) - User identifier (UNIQUE)
- `messages` (JSONB) - Array of message objects
- `created_at`, `updated_at` (TIMESTAMP)

**Message Structure**:
```typescript
interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}
```

### 5. `ai_cache`
Stores cached AI analysis results.

**Columns**:
- `id` (UUID) - Primary key
- `user_id` (TEXT) - User identifier (nullable for global cache)
- `cache_key` (TEXT) - Unique cache identifier (UNIQUE)
- `response` (JSONB) - Cached response data
- `expires_at` (TIMESTAMP) - Cache expiration
- `created_at`, `updated_at` (TIMESTAMP)

**Cache Key Format**:
```
analysis_{track_id}_{analysis_type}_{timestamp}
```

### 6. `projects`
Stores DAW projects for cloud sync.

**Columns**:
- `id` (UUID) - Primary key
- `user_id` (TEXT) - Owner
- `name` (TEXT) - Project name
- `description` (TEXT) - Project description
- `data` (JSONB) - Complete project data
- `version` (INT) - Project version for conflict resolution
- `is_archived` (BOOLEAN) - Soft delete flag
- `last_modified`, `created_at`, `updated_at` (TIMESTAMP)

## Row Level Security (RLS)

All tables have RLS enabled with these policies:

### User Data Isolation
```sql
SELECT: user_id = current_user_id()
INSERT: user_id = current_user_id()
UPDATE: user_id = current_user_id()
DELETE: user_id = current_user_id()
```

### Global Cache (ai_cache special case)
- Allows reads/writes when `user_id IS NULL` (shared cache)
- Allows user-specific access when `user_id = current_user_id()`

## Error Handling & Fallback

The app uses **graceful degradation**:

1. **Primary**: Tries Supabase
2. **Fallback**: Uses browser localStorage (in-memory if no localStorage)
3. **Result**: Features work offline, data syncs when online

### Automatic Fallback Triggers
- Table doesn't exist (error code 42P01)
- RLS policy violation (error code 42501)
- Missing constraint (error code 42P10)
- Network errors
- Authentication errors

### Services with Fallback

| Service | Main Table | Fallback |
|---------|-----------|----------|
| CodetteControlService | codette_activity_logs | localStorage |
| ChatHistoryService | chat_history | localStorage |
| AnalysisService | ai_cache | localStorage |

## Development vs Production

### Development (Demo Mode)
- Supabase credentials optional
- Falls back to localStorage automatically
- No authentication required
- User ID: `demo-user`

### Production (Real Supabase)
1. Set environment variables
2. Run migrations
3. Configure RLS policies (or use defaults)
4. (Optional) Enable Supabase Auth

## Troubleshooting

### Issue: "relation does not exist"
**Cause**: Table not created in Supabase
**Fix**: 
1. Run `supabase_migrations.sql` in SQL Editor
2. Check table exists in Supabase dashboard

### Issue: "row-level security policy"
**Cause**: RLS policies not allowing access
**Fix**:
1. Check RLS policies are created
2. Verify user_id is being passed correctly
3. Or: Disable RLS for development (not recommended for production)

### Issue: Features work locally but not online
**Cause**: App using localStorage fallback
**Fix**:
1. Check `import.meta.env.VITE_SUPABASE_URL` is set
2. Check network connectivity
3. Check Supabase project is running

### Issue: "there is no unique or exclusion constraint"
**Cause**: `chat_history` table missing unique constraint on user_id
**Fix**: Run migrations again, constraint is defined in SQL

## Testing Supabase Connection

```typescript
// In browser console:
import { supabase } from './src/lib/supabase';

// Test connection
const { data, error } = await supabase.auth.getUser();
console.log('Connection:', { data, error });

// Test table access
const { data: logs, error: logsError } = await supabase
  .from('codette_activity_logs')
  .select('*')
  .limit(1);
console.log('Table access:', { logs, logsError });
```

## Performance Optimization

### Indexes Created
- `idx_codette_activity_logs_user_id` - Fast user lookups
- `idx_codette_activity_logs_created_at` - Chronological ordering
- `idx_codette_permissions_user_id` - Permission lookups
- `idx_chat_history_user_id` - Chat lookups
- `idx_ai_cache_cache_key` - Cache hits
- `idx_projects_user_id` - Project listings

### Query Optimization Tips
1. Always filter by `user_id` first
2. Use `.limit()` on large queries
3. Cache frequently accessed data
4. Use `.select()` to limit columns

## Next Steps

1. **Setup** (if not done):
   - Create Supabase project
   - Run migrations
   - Set environment variables

2. **Test**:
   - Check app runs in dev mode
   - Try activity logging feature
   - Verify chat history saves

3. **Deploy**:
   - Set environment variables in hosting
   - (Optional) Configure Supabase Auth
   - Test features in production

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

- Supabase errors are logged to browser console
- Check `[Supabase]` prefix in logs
- Fallback errors include `[Supabase Fallback]` prefix
- All operations gracefully degrade to localStorage
