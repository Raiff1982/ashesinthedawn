# Codette UI Integration - Testing Instructions

**Date**: 2025-11-25
**Objective**: Debug why UI buttons don't trigger DAW state changes
**Status**: ✅ Enhanced logging complete - ready for testing

---

## 5-Minute Quick Test

### Step 1: Verify Both Services Running

**Terminal 1 - Frontend**:
```bash
# Should already be running on port 5174
npm run dev
```
Expected: `VITE v7.2.4 ready` + `Local: http://localhost:5174`

**Terminal 2 - Backend**:
```bash
# Must be running on port 8000
python codette_server.py
```
Expected: `Uvicorn running on http://127.0.0.1:8000`

### Step 2: Open Browser & DevTools

1. **Navigate to**: `http://localhost:5174` (⚠️ port 5174, NOT 5173)
2. **Open DevTools**: Press `F12`
3. **Go to Console Tab**: Click "Console" at top
4. **Clear previous logs**: Type `clear()` and press Enter

### Step 3: Click Codette Button

1. **Locate button**: Top-right area, purple background, Sparkles ✨ icon + "Codette" text
2. **Click it**: Single click
3. **Watch console**: Look for logs starting with emoji: 🎯, 🌉, 📥, 🤖
4. **Take screenshot** of all console output

### Step 4: Report Back

Share console output that shows:
- Which emoji logs appeared
- Where logs stopped appearing
- Any error messages shown
- Whether UI changed (effects added, tracks created, etc.)

---

## Expected Console Output (Success Case)

```
🎯 suggestMixingChain called
   selectedTrack: Vocals
🌉 Bridge instance: CodetteBridgeService { ... }
📥 Backend response: {
  prediction: "Adding EQ to your vocals",
  actionItems: [
    { action: "add_effect", parameter: "vocals", value: "parametric_eq" }
  ]
}
🤖 Executing Codette mixing suggestions: Array(1)
   Processing action: add_effect(vocals) = parametric_eq
✅ Effects added to track: Vocals
```

---

## What to Look For

### ✅ If You See These Logs:
- **All emoji logs (🎯→🌉→📥→🤖→✅)**: System working, UI should update
  - Check Mixer panel - should show new effects
  - Check Mixer volume levels - should show changes
  - Check tracks panel - should show new aux tracks created

- **Just 🎯**: Function called but bridge not initialized
  - Likely cause: Bridge service issue

- **🎯 + 🌉**: Bridge initialized but backend not responding
  - Likely cause: Python server not running or wrong port
  - Fix: Start Python server on port 8000

- **🎯 + 🌉 + 📥**: Backend responded but actions not executing
  - Check if response contains `actionItems` array
  - May be backend not generating actions

### ❌ If You See These:
- **No logs at all**: Button not responding to clicks
  - Cause: React event handler not wired
  - Try clicking other buttons (Play, Stop) - do they work?

- **Error in console**: Specific error message
  - Screenshot the error
  - Report exact error text

- **"No track selected"**: No audio track in DAW
  - Create an audio track first: Click "Add Track" button
  - Try Codette button again

---

## Detailed Testing Checklist

### Pre-Test Setup
- [ ] Frontend running on port 5174 (check browser URL)
- [ ] Backend running on port 8000 (check Python terminal)
- [ ] DAW has at least 1 audio track (not empty)
- [ ] DevTools Console open and cleared
- [ ] .env file has `VITE_CODETTE_API=http://localhost:8000`

### Button Click Test
- [ ] Click "Codette" button (top-right, purple area)
- [ ] Console shows "🎯 suggestMixingChain called" ← **critical first log**
- [ ] If no log, click other buttons (Play, Stop) to verify they work
- [ ] If other buttons work but Codette doesn't, it's a handler issue

### Backend Connection Test
- [ ] Console shows "🌉 Bridge instance: CodetteBridgeService"
- [ ] If not shown, bridge initialization failed
- [ ] If shown as "null" or "undefined", bridge not created

### Response Test
- [ ] Console shows "📥 Backend response:"
- [ ] If not shown, backend not responding
- [ ] Copy response object and paste into chat

### Execution Test
- [ ] Console shows "🤖 Executing Codette..." 
- [ ] If not shown, actionItems not in response
- [ ] Watch for "✅" logs showing which actions succeeded
- [ ] Check UI for visible changes:
  - Mixer shows new effects in rack
  - Track volumes changed
  - New aux tracks created
  - Plugin icons appear

---

## Tab Switching (Advanced Testing)

The Codette button changes behavior based on **active tab**. Try each:

### Tab 1: Suggestions (Default)
- **What it does**: Suggests effects to add
- **Console logs**: 🎯 suggestMixingChain...
- **Expected result**: Effects appear in Mixer plugin rack
- **Check**: Mixer → Selected track → Plugin rack shows EQ/Compressor/etc.

### Tab 2: Analysis
- **What it does**: Analyzes for issues (clipping, levels)
- **Console logs**: 🔍 analyzeSessionWithBackend...
- **Expected result**: Track volumes adjusted to fix clipping
- **Check**: Mixer → Track volume slider shows change

### Tab 3: Control/Routing
- **What it does**: Suggests routing (aux tracks, sends)
- **Console logs**: 🎛️ suggestRouting...
- **Expected result**: New aux tracks created, routing changed
- **Check**: Track list shows new "Aux" track

---

## Troubleshooting Decision Tree

```
Click Codette button
    ↓
Is console visible? (F12 opened?)
├─ NO → Open DevTools (F12), click Console tab
└─ YES → Continue

    ↓
Do any logs appear?
├─ NO → Button not receiving click events
│       └─ Check if other buttons (Play/Stop) work
│           ├─ YES → Codette button specifically broken
│           └─ NO → Entire React event system broken
│
└─ YES → Continue

    ↓
Is "🎯 suggestMixingChain called" shown?
├─ NO → Wrong function triggered
│       └─ Check codetteActiveTab state
│
└─ YES → Continue

    ↓
Is "🌉 Bridge instance:" shown?
├─ NO → Bridge not initializing
│       └─ Check codetteBridgeService.ts
│
└─ YES → Continue

    ↓
Is "📥 Backend response:" shown?
├─ NO → Backend not responding on port 8000
│       └─ Check Python terminal for errors
│       └─ Restart: python codette_server.py
│
└─ YES → Continue

    ↓
Is "🤖 Executing suggestions:" shown?
├─ NO → Response missing actionItems
│       └─ Backend not generating actions
│       └─ Check Python server logs
│
└─ YES → Continue

    ↓
Are "✅ Effects added:" logs shown?
├─ NO → updateTrack() failing silently
│       └─ Check DAW Context
│
└─ YES → Did UI update?
        ├─ YES → SUCCESS! System working
        └─ NO → React not re-rendering
                └─ Refresh page (Ctrl+R)
```

---

## Commands to Run in Console

### Test 1: Check Bridge Service
```javascript
// Copy and paste into console:
import('http://localhost:5174/src/lib/codetteBridgeService.ts')
  .then(m => console.log('Bridge loaded:', m))
  .catch(e => console.error('Bridge load error:', e));
```

### Test 2: Check Backend Connection
```javascript
// Copy and paste into console:
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(d => console.log('Backend healthy:', d))
  .catch(e => console.error('Backend error:', e));
```

### Test 3: Check DAW Context
```javascript
// Copy and paste into console:
console.log('DAW available:', typeof window.DAW);
console.log('updateTrack available:', typeof window.updateTrack);
// Note: May be undefined in React 18 depending on setup
```

---

## What NOT to Do

- ❌ Don't modify code until you see console logs
- ❌ Don't restart servers while debugging (lose connection)
- ❌ Don't close DevTools (it may lose logs)
- ❌ Don't refresh page (clears console) - instead use `clear()`
- ❌ Don't test on port 5173 (old frontend port)

---

## Quick Restart Commands

If something breaks:

```bash
# Frontend stuck?
# Terminal 1:
npm run dev

# Backend stuck?
# Terminal 2:
python codette_server.py

# Both stuck?
# Ctrl+C in both terminals, then:
npm run dev
# (New terminal)
python codette_server.py
```

---

## Success Indicators

### System is Working When:
1. ✅ All console logs appear (🎯 → 🌉 → 📥 → 🤖 → ✅)
2. ✅ No error messages in console
3. ✅ Mixer shows effects added
4. ✅ Track volumes changed in response to analysis
5. ✅ New aux tracks appear in track list
6. ✅ UI updates instantly without needing refresh

### Common Success Messages:
- "✅ Effects added to track: Vocals"
- "✅ Created auxiliary track"
- "✅ Fixed clipping - reduced volume to -3dB"
- "✅ Successfully routed..."

---

## Report Template

When sharing results, use this format:

```
## Testing Results

**System Setup**:
- Frontend: Running on port 5174 ✅
- Backend: Running on port 8000 ✅
- Track selected: [Yes/No - which track]

**Console Output** (Copy full console):
[Paste all console logs here]

**Visual Changes**:
- Effects added: [Yes/No]
- Track volume changed: [Yes/No]
- New aux tracks: [Yes/No]

**Error Messages** (if any):
[Paste error text here]

**Where it stopped**:
- Got to 🎯 step? [Yes/No]
- Got to 🌉 step? [Yes/No]
- Got to 📥 step? [Yes/No]
- Got to 🤖 step? [Yes/No]
- Got to ✅ step? [Yes/No]
```

---

## Need Help?

Before reaching out, verify:
1. ✅ Both ports running (5174 frontend, 8000 backend)
2. ✅ Console open and cleared
3. ✅ At least 1 track in DAW
4. ✅ Console output saved/screenshotted
5. ✅ No typos in ports

Then share the console output + which logs appeared.
