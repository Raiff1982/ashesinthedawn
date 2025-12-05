# CoreLogic Studio - Project Structure

**Version**: 7.0.0 | **Last Updated**: December 2, 2025

## Overview

CoreLogic Studio is a **dual-platform DAW (Digital Audio Workstation)** with:
- **Frontend**: React 18 + TypeScript + Web Audio API
- **Backend**: Python DSP library with professional audio effects
- **Desktop**: Electron app wrapper (optional)

## Directory Structure

```
ashesinthedawn/
├── .github/                          # GitHub Actions workflows and configs
├── .venv/                            # Python virtual environment (gitignored)
├── Codette/                          # Python ML/AI module (legacy, in doc/)
├── config/                           # Configuration files and templates
├── daw_core/                         # Python backend DSP library
│   ├── __init__.py
│   ├── automation/                   # Automation framework (curves, LFO, envelopes)
│   ├── fx/                           # 19 audio effects (EQ, dynamics, reverb, etc.)
│   ├── metering/                     # Audio analysis tools (spectrum, VU meter)
│   ├── engine.py                     # Core DAW engine
│   ├── track.py                      # Track data model
│   ├── routing.py                    # Audio routing/mixing
│   └── graph.py                      # DSP signal graph
├── doc/                              # Documentation (440+ files)
│   ├── SCROLLABLE_PEAK_METER_UPDATE.md
│   ├── CODETTE_QUICK_START.md
│   └── [other docs]
├── electron/                         # Electron desktop app (optional)
│   ├── main.js                       # Main process
│   ├── preload.js                    # Preload scripts
│   └── index.html                    # Electron window
├── node_modules/                     # npm dependencies (gitignored)
├── scripts/                          # Build and utility scripts
│   └── [place shell/py scripts here]
├── src/                              # React frontend source code
│   ├── components/                   # 15+ React components
│   │   ├── TopBar.tsx               # Transport controls
│   │   ├── TrackList.tsx            # Track management
│   │   ├── Mixer.tsx                # Mixer UI with faders
│   │   ├── Timeline.tsx             # Waveform/timeline view
│   │   ├── PluginRack.tsx           # Effects chain UI
│   │   └── [other components]
│   ├── contexts/                     # React Context APIs
│   │   ├── DAWContext.tsx           # DAW state management (639 lines)
│   │   ├── CodettePanelContext.tsx  # AI panel state
│   │   └── ThemeContext.tsx         # Theme management
│   ├── hooks/                        # Custom React hooks
│   │   ├── useDAW.ts                # DAW context hook
│   │   ├── useCodette.ts            # Codette AI integration
│   │   ├── useEffectChain.ts        # Effect chain management
│   │   └── [other hooks]
│   ├── lib/                          # Utility libraries
│   │   ├── audioEngine.ts           # Web Audio API wrapper (500 lines)
│   │   ├── codetteBridge.ts         # Python backend communication
│   │   ├── supabase.ts              # Supabase client
│   │   ├── errorHandling.ts         # Error utilities
│   │   └── [other utilities]
│   ├── types/                        # TypeScript type definitions
│   │   ├── index.ts                 # DAW types (Track, Plugin, etc.)
│   │   └── supabase.ts              # Supabase schema types
│   ├── themes/                       # Tailwind theme configuration
│   │   └── ThemeContext.tsx
│   ├── config/                       # App configuration
│   │   └── appConfig.ts             # Vite environment config
│   ├── App.tsx                       # Root component
│   ├── main.tsx                      # Entry point
│   └── index.css                     # Global styles
├── test_*/                           # Python test files (197 passing)
│   ├── test_phase2_effects.py
│   ├── test_phase2_2_dynamics.py
│   └── [other test files]
├── tools/                            # Development tools and utilities
│   └── [place custom build tools here]
│
├── .env.example                      # Environment template (Vite format)
├── .eslintrc.cjs                     # (removed - using eslint.config.js)
├── .gitignore                        # Git ignore rules
├── eslint.config.js                  # ESLint configuration (updated)
├── index.html                        # Vite HTML entry point
├── package.json                      # npm dependencies and scripts
├── postcss.config.js                 # PostCSS/Tailwind config
├── tailwind.config.js                # Tailwind CSS config
├── tsconfig.json                     # Main TypeScript config
├── tsconfig.app.json                 # App-specific TypeScript config
├── tsconfig.node.json                # Build tools TypeScript config
├── vite.config.ts                    # Vite build config
├── requirements.txt                  # Python dependencies (moved to doc/)
├── setup_supabase_tables.py          # Supabase setup script
├── PROJECT_STRUCTURE.md              # This file
├── README.md                         # Main project README
└── DEVELOPMENT.md                    # Development guidelines

```

## Key Files by Purpose

### Frontend Build & Config
- `vite.config.ts` - Build configuration with HMR
- `tsconfig.*.json` - TypeScript strict mode settings
- `tailwind.config.js` - Dark theme with Codette colors
- `.env.example` - Uses `VITE_*` prefix for Vite
- `eslint.config.js` - ESLint v9 flat config (NEW)

### React Application
- `src/App.tsx` - Root component with layout
- `src/main.tsx` - Vite entry point
- `src/contexts/DAWContext.tsx` - **Core state management** (639 lines)
- `src/lib/audioEngine.ts` - **Web Audio wrapper** (500 lines)

### Python Backend
- `daw_core/engine.py` - DAW core engine
- `daw_core/fx/*.py` - 19 audio effects
- `daw_core/automation/` - Automation framework
- `daw_core/metering/` - Audio analysis tools
- `test_phase2_*.py` - 197 passing unit tests

### Configuration & Documentation
- `PROJECT_STRUCTURE.md` - This file
- `DEVELOPMENT.md` - Development workflows
- `doc/` - 440+ documentation files (organized)

## Build & Run Commands

### Frontend
```bash
npm install              # Install dependencies
npm run dev              # Dev server (port 5173)
npm run build            # Production build
npm run preview          # Preview production build
npm run typecheck        # TypeScript validation (must be 0 errors)
npm run lint             # ESLint validation (warnings only)
npm run ci               # Full CI check
```

### Backend
```bash
python -m venv venv              # Create virtual environment
venv\Scripts\activate            # Activate (Windows)
pip install numpy scipy pytest   # Install dependencies
python -m pytest test_phase2_*.py -v  # Run 197 tests
```

### Desktop (Electron - Optional)
```bash
npm run build            # Build React for Electron
electron-builder        # Package as native app
```

## Development Workflow

### Daily Development
1. Keep dev server running: `npm run dev`
2. Make changes in `src/`
3. TypeScript validates automatically (HMR)
4. Before commit: `npm run typecheck && npm run lint`

### Adding Features
1. **UI Component**: Add to `src/components/`
2. **State Management**: Extend `DAWContext.tsx` if global, else use `useState`
3. **Audio Logic**: Add to `src/lib/audioEngine.ts` or new hook
4. **Types**: Update `src/types/index.ts`
5. **Styling**: Use Tailwind classes with dark theme

### Backend Integration
1. **DSP Effect**: Add to `daw_core/fx/`
2. **Tests**: Add to `test_phase2_*.py`
3. **Run Tests**: `python -m pytest -v`
4. **Bridge**: Update `src/lib/codetteBridge.ts` to call Python

## Critical Architecture Patterns

### Track Data Flow
```
User clicks TrackList → DAWContext.addTrack() → AudioEngine creates source node → State updates → UI re-renders
```

### Audio Playback
```
togglePlay() → playAudio() → Web Audio source.loop=true → Volume sync effect (100ms interval) → dB to linear conversion
```

### Configuration (Vite Pattern)
```typescript
// ✅ CORRECT: Use Vite format in components
const env = import.meta.env;
const apiUrl = env.VITE_API_URL || 'http://localhost:8000';

// ❌ WRONG: Old React CRA pattern
const apiUrl = process.env.REACT_APP_API_URL;  // undefined in Vite
```

## File Organization Rules

### When to Create Files
- **Component**: 200+ lines or reusable UI logic → `src/components/`
- **Hook**: 100+ lines or multi-component logic → `src/hooks/`
- **Utility**: Pure functions, no React → `src/lib/`
- **Type**: Interfaces/types → `src/types/`
- **Service**: API calls, business logic → `src/lib/` (prefix with domain)

### Naming Conventions
- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` (must start with `use`)
- Utilities: `camelCase.ts`
- Constants: `UPPER_SNAKE_CASE`
- Types: `PascalCase` (interface, type)

## Build Output

### Frontend Production Build
```
dist/
├── index.html (1.19 KB gzip)
├── assets/
│   ├── index-*.js (92.51 KB)      # Main app bundle
│   ├── vendor-ui-*.js (141.54 KB) # React + UI libs
│   ├── chunk-codette-*.js (276 MB) # Codette AI module
│   ├── chunk-mixer-*.js (50 MB)   # Mixer component
│   ├── index-*.css (70.53 KB)     # Tailwind styles
│   └── [other chunks]
```

## Current Status

### Frontend ✅
- TypeScript: **0 errors**
- ESLint: **0 critical errors** (warnings only)
- Build: **Successful** (production-ready)
- Dev Server: **Running**

### Backend ✅
- Tests: **197 passing**
- Coverage: Comprehensive

### Documentation ✅
- 440+ files organized in `doc/`
- Clear development guidelines

## Next Steps for Contributors

1. **Start Here**: Read `DEVELOPMENT.md`
2. **Understand State**: Review `src/contexts/DAWContext.tsx`
3. **Learn Audio**: Study `src/lib/audioEngine.ts`
4. **Make Changes**: Follow naming conventions above
5. **Validate**: `npm run typecheck && npm run lint`
6. **Test**: `npm run build` before PR

## Support

- **Issues**: Check `doc/` for troubleshooting guides
- **TypeScript Errors**: Run `npm run typecheck`
- **Build Issues**: Check `vite.config.ts` and `.env`
- **Audio Issues**: Check browser console, use `audioEngine.ts` logging
