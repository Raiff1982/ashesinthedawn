-- ============================================================================
-- SUPABASE MUSIC KNOWLEDGE SETUP GUIDE
-- ============================================================================

## Quick Start (5 minutes)

### Step 1: Run the SQL Setup
1. Go to https://app.supabase.com
2. Click your project (ashesinthedawn)
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste contents of `SUPABASE_MUSIC_KNOWLEDGE_SETUP.sql`
6. Click **Run**
7. Verify tables created in **Table Editor**

### Step 2: Verify Setup
Run this query to test:
```sql
SELECT * FROM get_music_suggestions('EQ for vocals', 'mixing');
```

You should get 10 suggestions back with titles, descriptions, and confidence scores.

---

## Database Schema

### Table: music_knowledge
Stores music theory, mixing, and production suggestions.

**Columns:**
- `id` (UUID) - Primary key
- `topic` (text) - Topic keyword (e.g., "basic_chords", "compression_vocals")
- `category` (text) - Category (harmony, mixing, dynamics, effects, automation, mastering)
- `suggestion` (jsonb) - JSON object with title, description, parameters
- `confidence` (float) - Confidence score (0.0-1.0)
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Sample Row:**
```json
{
  "id": "uuid-here",
  "topic": "compression_vocals",
  "category": "dynamics",
  "suggestion": {
    "title": "Vocal Compression",
    "description": "Ratio 4:1, attack 10-20ms, release 100-200ms...",
    "parameters": {
      "ratio": 4,
      "attack_ms": 15,
      "release_ms": 150,
      "threshold_db": -20
    }
  },
  "confidence": 0.90
}
```

### Table: api_config
Stores external API credentials for real-time suggestions.

**Columns:**
- `id` (UUID) - Primary key
- `service_name` (text) - API service name (unique)
- `api_url` (text) - API endpoint URL
- `api_key` (text) - API authentication key
- `is_active` (boolean) - Whether to use this API
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

---

## Functions

### get_music_suggestions(p_prompt text, p_context text)
Gets music suggestions with intelligent fallback.

**Parameters:**
- `p_prompt` (text) - User's question or topic (e.g., "EQ for vocals")
- `p_context` (text) - Context (default: "general")

**Returns:** JSON object with:
- `success` (boolean) - Whether query succeeded
- `prompt` (text) - Original prompt
- `context` (text) - Original context
- `suggestions` (array) - Array of suggestion objects
- `source` (text) - "supabase_music_knowledge"
- `timestamp` (text) - Query timestamp

**Example Usage:**
```sql
SELECT * FROM get_music_suggestions('reverb for vocals', 'effects');
```

### search_music_knowledge(p_search_term text, p_category text, p_limit int)
Advanced search with filtering.

**Parameters:**
- `p_search_term` (text) - Search term to find
- `p_category` (text) - Optional category filter (mixing, dynamics, effects, etc.)
- `p_limit` (int) - Max results to return (default: 5)

**Example Usage:**
```sql
SELECT * FROM search_music_knowledge('compression', 'dynamics', 10);
```

---

## Integration with Codette Backend

### Python Integration
```python
import supabase

# Initialize Supabase client
supabase_url = os.getenv('VITE_SUPABASE_URL')
supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY')
client = supabase.create_client(supabase_url, supabase_key)

# Get suggestions
response = client.rpc('get_music_suggestions', {
    'p_prompt': 'EQ for vocals',
    'p_context': 'mixing'
}).execute()

suggestions = response.data['suggestions']
```

### Adding More Suggestions
Insert directly into the table:

```sql
INSERT INTO public.music_knowledge (topic, category, suggestion, confidence)
VALUES (
  'delay_stereo',
  'effects',
  '{
    "title": "Stereo Delay",
    "description": "Left/right delays at different times (200ms left, 300ms right) for width",
    "parameters": {"delay_left_ms": 200, "delay_right_ms": 300, "feedback": 0.4}
  }'::jsonb,
  0.88
);
```

### Seed Data Categories

**Harmony (Music Theory)**
- basic_chords: I-IV-V progressions
- jazz_ballad: ii-V-I jazz standards

**Mixing**
- mixing_eq: EQ techniques
- gain_staging: Headroom and levels
- bus_compression: Mix glue
- high_pass_filter: Frequency hygiene

**Dynamics**
- compression_vocals: Vocal compression
- gate_kick: Gate for clarity

**Effects**
- reverb_space: Spatial effects
- delay_stereo: Stereo delays

**Automation**
- automation_dynamics: Volume automation

**Mastering**
- mastering_loudness: Loudness targets per platform

---

## Row Level Security (RLS) Policies

### Current Policies
- `public_read_suggestions` - Anyone can read suggestions
- `admin_read_api_config` - Only authenticated users can read API config

### To Allow Inserts
Add this policy to music_knowledge:
```sql
CREATE POLICY "authenticated_insert_suggestions" ON public.music_knowledge
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

---

## Testing the Setup

### Test 1: Verify tables exist
```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('music_knowledge', 'api_config');
```

### Test 2: Get all suggestions
```sql
SELECT topic, category, suggestion->>'title' as title, confidence 
FROM public.music_knowledge 
ORDER BY confidence DESC;
```

### Test 3: Search by category
```sql
SELECT * FROM search_music_knowledge('', 'mixing', 5);
```

### Test 4: Call RPC function
```sql
SELECT * FROM get_music_suggestions('I need EQ help', 'mixing');
```

---

## Next Steps

1. **Run the SQL file** in Supabase SQL Editor
2. **Test the functions** with queries above
3. **Update Codette backend** to call `get_music_suggestions`
4. **Add more suggestions** as needed
5. **Configure external APIs** in `api_config` table if desired
6. **Update frontend** to display real suggestions from Supabase

---

## Supabase Project Info

- **Project URL**: https://db.ngvcyxvtorwqocnqcbyz.supabase.co
- **Project ID**: ngvcyxvtorwqocnqcbyz
- **API Key**: VITE_SUPABASE_ANON_KEY in `.env`
- **SQL Editor**: Direct query execution available

---

## Troubleshooting

**Tables not appearing in Table Editor?**
- Refresh the page
- Check SQL execution output for errors
- Verify you ran all commands successfully

**RLS blocking queries?**
- Check auth.role() in policies
- Ensure you're authenticated with valid Supabase key
- In development, you can temporarily disable RLS for testing

**Functions not callable?**
- Verify function syntax with `\df+ function_name`
- Check function permissions
- Ensure parameters match expected types

---

## File Locations
- Setup SQL: `SUPABASE_MUSIC_KNOWLEDGE_SETUP.sql`
- Integration Guide: This file
- Codette Backend: `codette_server_unified.py`
- Frontend Config: `src/lib/codetteBridgeService.ts`
