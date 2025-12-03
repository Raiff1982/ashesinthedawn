# Development Guidelines - CoreLogic Studio

**Version**: 7.0.0 | **Date**: December 2, 2025

## Before Starting

### Environment Setup

```bash
# Clone and navigate
git clone https://github.com/Raiff1982/ashesinthedawn.git
cd ashesinthedawn

# Install frontend dependencies
npm install

# Optional: Python backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install numpy scipy pytest

# Start development
npm run dev            # Frontend dev server on port 5173
```

### Validation Commands (Run Before Commit)

```bash
npm run typecheck      # TypeScript - MUST be 0 errors ✅
npm run lint          # ESLint - warnings acceptable ⚠️
npm run build         # Production build test
```

## Code Quality Standards

### TypeScript

**Goal**: Zero type errors before commit

```typescript
// ✅ GOOD: Explicit types
interface Track {
  id: string;
  volume: number;
  muted: boolean;
}

function updateVolume(trackId: string, volumeDb: number): void {
  // implementation
}

// ❌ BAD: Using any
function updateVolume(trackId: any, volumeDb: any): any {
  // ...
}
```

### ESLint Rules

**Policy**: Warnings acceptable, errors not allowed

Current settings:
- `@typescript-eslint/no-explicit-any`: **warn** (fix when possible)
- `@typescript-eslint/no-unused-vars`: **warn** (prefix unused vars with `_`)
- `react-hooks/exhaustive-deps`: **warn** (document if intentional)
- `prefer-const`: **warn** (use const by default)

Unused variable pattern:
```typescript
// ✅ CORRECT: Prefix with underscore
const { used, _unused } = obj;

try {
  // ...
} catch (_error) {
  // handle error
}

// ❌ WRONG: Leave unused
const unused = 42;  // ESLint warning
```

### Component Structure

**React Components**: Use functional components with hooks

```typescript
import React from 'react';
import { useDAW } from '../contexts/DAWContext';

interface MyComponentProps {
  trackId: string;
  onUpdate?: (data: unknown) => void;
}

export default function MyComponent({ trackId, onUpdate }: MyComponentProps) {
  const { tracks } = useDAW();
  const [state, setState] = React.useState(0);

  React.useEffect(() => {
    // effect logic
  }, [trackId, state]);

  return (
    <div className="p-4 bg-gray-900">
      {/* JSX here */}
    </div>
  );
}
```

### Testing

**Backend**: Use pytest (197 tests currently passing)

```bash
# Run all tests
python -m pytest test_phase2_*.py -v

# Run specific test file
python -m pytest test_phase2_effects.py -v

# Run with coverage
python -m pytest test_phase2_effects.py -v --cov=daw_core

# Must not break existing tests
```

**Frontend**: Manual testing (automated test suite TBD)
- Test in dev server: `npm run dev`
- Test production build: `npm run preview`
- Check browser DevTools for errors

## Git Workflow

### Branch Naming

```
feature/feature-name        # New feature
fix/issue-description       # Bug fix
refactor/component-name     # Code refactoring
docs/documentation-update   # Documentation
chore/task-description      # Maintenance
```

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`

**Example**:
```
feat: add waveform peak meter to mixer

- Implement scrollable peak meter component
- Add dB-to-visual scaling
- Update Mixer component to use new meter

Fixes #42
```

### Before Pushing

1. **Type Check**: `npm run typecheck` (must be 0 errors)
2. **Lint**: `npm run lint` (check for critical issues)
3. **Build**: `npm run build` (verify production build works)
4. **Commit**: Follow message format above
5. **Push**: `git push origin feature/your-feature`

## Architecture Decisions

### State Management

**Rule**: Use React Context for global DAW state, `useState` for component-local state

```typescript
// ✅ GLOBAL STATE: Use DAWContext
const { tracks, addTrack, togglePlay } = useDAW();

// ✅ LOCAL STATE: Use useState
const [uiOpen, setUiOpen] = React.useState(false);

// ❌ WRONG: Don't use Context for UI state
// Context should only hold DAW domain logic, not every piece of state
```

### Audio Engine Calls

**Rule**: Only call `audioEngine` from DAWContext, not from components directly

```typescript
// ✅ CORRECT: In DAWContext
const togglePlay = async () => {
  const engine = getAudioEngine();
  if (isPlaying) {
    engine.stopAudio();
  } else {
    engine.playAudio(selectedTrack.id, currentTime, selectedTrack.volume, selectedTrack.pan);
  }
  setIsPlaying(!isPlaying);
};

// ❌ WRONG: In component
function TopBar() {
  const engine = getAudioEngine();  // Direct audio engine access
  const handlePlay = () => engine.playAudio(...);  // Bad pattern
}
```

### Type Conversions

**Rule**: Keep dB/linear conversions in `audioEngine.ts` only

```typescript
// ✅ In audioEngine.ts
private dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

// Then use in components:
const linear = dbToLinear(-6);  // -6 dB to linear

// ❌ WRONG: Converting in component
const linear = Math.pow(10, volumeDb / 20);  // Duplicate logic
```

### Environment Variables

**Rule**: Use Vite format `VITE_*`, not React CRA format

```typescript
// ✅ CORRECT: Vite format
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const isDev = import.meta.env.DEV;

// ❌ WRONG: React CRA format (won't work with Vite)
const apiUrl = process.env.REACT_APP_API_URL;  // undefined
```

## Common Development Tasks

### Adding a New Track Type

1. Update `src/types/index.ts`: Add to `Track['type']` union
2. Create factory function in `DAWContext.tsx`:
   ```typescript
   const createMyTrackType = (): Track => ({
     id: generateId(),
     type: 'mytype',
     // ... other fields with sensible defaults
   });
   ```
3. Update `addTrack()` switch statement
4. Add UI label in `TrackList.tsx` `getTrackTypeLabel()`

### Adding an Audio Effect

1. Create file in `daw_core/fx/my_effect.py`:
   ```python
   from .base_effect import BaseEffect
   import numpy as np

   class MyEffect(BaseEffect):
       def process(self, audio: np.ndarray) -> np.ndarray:
           # implementation
           return audio
   ```
2. Write tests in `test_phase2_my_effects.py`
3. Run: `python -m pytest test_phase2_my_effects.py -v`
4. Update `src/types/index.ts` Plugin type if needed

### Fixing a Build Error

1. Check error message carefully
2. Run `npm run typecheck` for TypeScript errors
3. Check `.env` file exists (copy from `.env.example`)
4. For import errors: verify file paths (case-sensitive on Linux)
5. Clear cache if needed: `rm -r dist node_modules/.vite`

### Debugging Audio Issues

1. **Check console**: `npm run dev` shows warnings
2. **AudioEngine logging**: Add console.log in `audioEngine.ts` `playAudio()`
3. **Web Audio Debug**: Use browser DevTools → Application → Audio context
4. **Check parameters**: Verify dB values passed (should be negative for most)
5. **Test in isolation**: Create minimal component to test audio

## Performance Tips

### Frontend

- Use `React.memo()` for expensive components
- Memoize callbacks with `React.useCallback()`
- Lazy load heavy components: `React.lazy()`
- Check bundle size: `npm run build` shows chunk sizes

### Backend (Python)

- Use NumPy for array operations (not loops)
- Cache computed values when possible
- Profile with `cProfile` if slow
- Use appropriate dtypes (float32 vs float64)

## Documentation

### Code Comments

Write comments for *why*, not *what*:

```typescript
// ✅ GOOD: Explains decision
// Use dB scale for volume UI because it matches human hearing
const volumeDb = toDb(linearVolume);

// ❌ BAD: Obvious from code
// Convert to dB
const volumeDb = 20 * Math.log10(linearVolume);
```

### Function Documentation

Use JSDoc for public functions:

```typescript
/**
 * Play audio from a track at specified time
 * @param trackId - Track identifier
 * @param startTime - Start time in seconds
 * @param volumeDb - Volume in decibels (typically -60 to 0)
 * @param pan - Pan position (-1 = left, 1 = right)
 * @throws {Error} If track not found
 */
export function playAudio(
  trackId: string,
  startTime: number,
  volumeDb: number,
  pan: number
): void {
  // implementation
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `npm install` fails | Delete `node_modules`, run `npm cache clean --force`, retry |
| TypeScript errors after fresh clone | Run `npm run typecheck` - might be dev environment setup |
| Webpack/Vite build errors | Check `.env` exists, delete `dist/`, rebuild |
| Audio not playing | Check browser audio permissions, verify dB values, check DevTools |
| Hot reload not working | Restart dev server, check `vite.config.ts` |
| Tests failing on Windows | Use `python.exe -m pytest` (explicit interpreter) |

## Resources

- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **React Hooks Guide**: https://react.dev/reference/react/hooks
- **Vite Docs**: https://vitejs.dev/guide/
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **NumPy Guide**: https://numpy.org/doc/stable/

## Questions?

- Check `doc/` for detailed guides
- Search existing issues on GitHub
- Ask in team discussions
- Read `DEVELOPMENT.md` in project root
