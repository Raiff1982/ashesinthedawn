# Enhancement & Error Fix Roadmap

**Status**: Ready to Execute  
**Priority**: Feature enhancements + TypeScript fixes  
**Timeline**: Phase-based implementation

---

## PART 1: CODETTE PANEL ENHANCEMENTS

### Enhancement 1: Suggestion Persistence & Favorites
**Current**: Suggestions refresh every 30 seconds, not saved  
**Enhancement**: Save favorite suggestions to database, add star/pin actions

**File**: `src/components/CodettePanel.tsx`  
**Changes Needed**:
```typescript
// Add to Suggestions Tab rendering:
- Star icon to favorite suggestions
- Show only favorites filter toggle
- Save favorites to supabase: codette_favorite_suggestions table
- Display "Save this suggestion" button on high-confidence items (>80%)
```

### Enhancement 2: Visual Waveform Preview in Analysis Tab
**Current**: Shows score + findings/recommendations (text only)  
**Enhancement**: Add waveform visualization for selected track's audio

**File**: `src/components/CodettePanel.tsx`  
**Changes Needed**:
```typescript
// Add to Analysis Tab:
- Mini waveform display (canvas-based)
- Use getAudioBufferData(selectedTrack.id) to extract audio
- Show frequency spectrum alongside waveform
- Color-code: green (healthy), yellow (warning), red (issues)
```

### Enhancement 3: Batch Operations in Actions Tab
**Current**: Add effects one at a time  
**Enhancement**: Apply multiple effects in sequence

**File**: `src/components/CodettePanel.tsx`  
**Changes Needed**:
```typescript
// Add to Actions Tab:
- "Apply Suggested Chain" button that adds EQ + Compressor + Reverb in order
- "Clear All Effects" button to reset track
- "Save Chain as Preset" button to save current setup
- Show current effect count badge
```

### Enhancement 4: Confidence-Based Filtering
**Current**: All suggestions shown (various confidence levels)  
**Enhancement**: Filter suggestions by confidence threshold

**File**: `src/components/CodettePanel.tsx`  
**Changes Needed**:
```typescript
// Add to Suggestions Tab:
- Slider: "Show suggestions above X% confidence" (0-100%)
- Visual indicator: 3-star rating system
- Color code: <50% = gray, 50-75% = yellow, >75% = green
- Save user preference to localStorage
```

### Enhancement 5: Recent Analysis History
**Current**: Only shows latest analysis  
**Enhancement**: Keep carousel of recent analyses

**File**: `src/components/CodettePanel.tsx`  
**Changes Needed**:
```typescript
// Add to Analysis Tab:
- Previous/Next buttons to cycle through past 5 analyses
- Timestamp for each analysis
- Show "Score Trend" (improving/declining/stable)
- Compare current vs. previous analysis
```

### Enhancement 6: Smart Suggestions Based on DAW State
**Current**: Generic suggestions  
**Enhancement**: Context-aware recommendations

**File**: `src/components/CodettePanel.tsx` + `src/hooks/useCodette.ts`  
**Changes Needed**:
```typescript
// Before getSuggestions call:
- Analyze track level: if >-3dB suggest compression
- Check for muted tracks: suggest unmuting
- Look at effect count: if >5 suggest grouping via buses
- Check recording mode: suggest punch-in if recording
- Pass this context to getSuggestions()
```

---

## PART 2: TYPESCRIPT ERRORS FIX

### Error Group 1: Module Resolution Issues

**Files Affected**:
- `src/contexts/DAWContext.tsx`
- `src/components/CodettePanel.tsx`

**Issue**: `TS2792: Cannot find module '../types'`

**Fix Applied** ?:
```json
// tsconfig.app.json already has:
"baseUrl": ".",
"paths": {
  "@/*": ["src/*"]
}
```

**Solution**: Update imports to use absolute path alias:
```typescript
// BEFORE (fails)
import { Track, Plugin } from "../types";

// AFTER (works)
import type { Track, Plugin } from "@/types";
```

### Error Group 2: ESModuleInterop Issue

**Files Affected**:
- `src/contexts/DAWContext.tsx` (line 1)
- `src/components/CodettePanel.tsx` (line 7)

**Issue**: `TS1259: Module can only be default-imported using esModuleInterop flag`

**Fix**: Add to `tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### Error Group 3: Missing Type Definitions

**Files Affected**:
- `src/contexts/DAWContext.tsx` (line 20)

**Issue**: `TS2792: Cannot find module '../types'`

**Root Cause**: The imports file exists but TypeScript can't resolve it

**Verification Needed**:
- Check if `src/types/index.ts` exports all needed types:
  - `Track`
  - `Project`
  - `LogicCoreMode`
  - `Plugin`
  - `Marker`
  - `LoopRegion`
  - `MetronomeSettings`
  - `Bus`
  - `MidiDevice`
  - `MidiRoute`
  - `AudioContextState` (MISSING?)

**Add to `src/types/index.ts` if missing**:
```typescript
export type AudioContextState = 'suspended' | 'running' | 'closed';
```

### Error Group 4: Lib Configuration

**Files Affected**:
- `src/contexts/DAWContext.tsx` (line 1302)

**Issue**: `TS2550: Property 'includes' does not exist on type 'string[]'`

**Fix**: Update `tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "target": "ES2020"
  }
}
```

The current config already has this, so this is a false positive. Run:
```bash
npm run typecheck
```

---

## PART 3: SQL ERRORS FIX

### Issue: `supabase_migrations.sql` syntax errors

**Root Cause**: SQL syntax violations and invalid PostgreSQL

**Affected Files**:
- `supabase_migrations.sql` (50+ errors)

**Main Issues**:
1. ? `CREATE TABLE IF NOT EXISTS public.codette_control_settings` - Missing AS
2. ? `TIMESTAMP WITH TIME ZONE` - Syntax error
3. ? RLS policies with complex USING clauses using `>>` operator wrong
4. ? `CURRENT_USER_ID()` - Not a standard PostgreSQL function

**Fix Strategy**:

Replace invalid syntax:
```sql
-- WRONG
CREATE TABLE IF NOT EXISTS public.codette_control_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)

-- CORRECT
CREATE TABLE IF NOT EXISTS public.codette_control_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
)
```

Replace invalid RLS policies:
```sql
-- WRONG
WITH CHECK (user_id = CURRENT_USER_ID() OR user_id = (SELECT auth.jwt() ->> 'sub'));

-- CORRECT
WITH CHECK (auth.uid() = user_id);
```

### Action Required:
1. Recreate `supabase_migrations.sql` with corrected syntax, OR
2. Skip SQL until it's needed (it's not blocking frontend)

---

## IMPLEMENTATION PRIORITY

### Phase 1: Fix TypeScript Errors (5 min)
1. Update `tsconfig.app.json` (add `esModuleInterop`)
2. Fix imports in DAWContext.tsx (use `@/types`)
3. Run `npm run typecheck` to verify

### Phase 2: Enhance CodettePanel (1-2 hours)
1. Add confidence filtering (15 min)
2. Add waveform preview (30 min)
3. Add suggestion persistence (30 min)
4. Add batch operations (30 min)
5. Add history carousel (30 min)

### Phase 3: Fix SQL (30 min - optional)
1. Audit and recreate `supabase_migrations.sql`
2. Fix RLS policies
3. Use standard PostgreSQL functions

---

## Testing Checklist

### TypeScript Errors
- [ ] `npm run typecheck` returns 0 errors
- [ ] `npm run build` succeeds
- [ ] No red squiggles in IDE

### CodettePanel Enhancements
- [ ] Suggestions tab shows confidence filter
- [ ] Analysis tab displays waveform
- [ ] Actions tab has batch operations
- [ ] Favorites are saved to database
- [ ] History carousel navigates correctly

### SQL (if executed)
- [ ] Migrations run without errors
- [ ] Tables created successfully
- [ ] RLS policies work correctly

---

## Files to Modify

### TypeScript Fixes
- `tsconfig.app.json` - Add esModuleInterop flag
- `src/contexts/DAWContext.tsx` - Update imports  to use `@/types`
- `src/components/CodettePanel.tsx` - Update imports to use `@/types`
- `src/types/index.ts` - Ensure all types exported

### Feature Enhancements
- `src/components/CodettePanel.tsx` - Main enhancements
- `src/hooks/useCodette.ts` - Add persistence hooks
- `src/lib/database/suggestionStore.ts` - NEW: Persistence layer

### SQL Fixes
- `supabase_migrations.sql` - Fix syntax errors

---

## Quick Start

### To Fix TypeScript Now:
```bash
# 1. Update tsconfig.app.json
# 2. Update imports in DAWContext.tsx
npm run typecheck
```

### To Build & Test:
```bash
npm run build
npm run preview
```

### To Run Full CI:
```bash
npm run ci  # typecheck + lint
```

---

**Status**: Ready to implement  
**Next Action**: Fix TypeScript errors first, then enhance CodettePanel
