# Codette UI Integration - Debugging Guide

**Status**: Enhanced logging added to all action handlers
**Date**: Session 2025-11-25
**Objective**: Identify why Codette UI buttons don't trigger DAW state changes

## Quick Start Debugging

### 1. Open Browser
```
URL: http://localhost:5174
```
⚠️ **Note**: Frontend runs on port **5174**, not 5173

### 2. Open Developer Console
```
Keyboard: F12
Panel: Select "Console" tab
```

### 3. Click AI Button in TopBar
- Located in **top-right** area of interface (purple area)
- Button shows: Sparkles icon + "Codette" text

### 4. Watch for Console Logs
All functions now emit detailed emoji-prefixed logs:

```
🎯 suggestMixingChain called
   selectedTrack: [track name or NONE]
🌉 Bridge instance: CodetteBridgeService { ... }
📥 Backend response: { prediction: "...", actionItems: [...] }
🤖 Executing Codette mixing suggestions: [...]
   Processing action: add_effect(eq) = Parametric EQ
✅ [Effect applied or error]
```

## Console Log Mapping

### When `suggestMixingChain()` is called:

| Log | Meaning | Success Sign |
|-----|---------|--------------|
| 🎯 suggestMixingChain called | Function entered | **Any log** |
| selectedTrack: NONE | No track selected | ❌ Function exits early |
| selectedTrack: [name] | Track is selected | ✅ Continue |
| 🌉 Bridge instance | Bridge initialized | ✅ Logs `CodetteBridgeService` object |
| 📥 Backend response | Response received | ✅ Logs `{ prediction: "...", actionItems: [...] }` |
| 🤖 Executing suggestions | Actions parsing | ✅ Logs array of actions |
| Processing action: add_effect(eq) | Action executing | ✅ Per-action logs |
| ✅ Effects added to track | Action succeeded | ✅ DAW state should update |

### When `suggestRouting()` is called:

| Log | Meaning | Action |
|-----|---------|--------|
| 🎛️ suggestRouting called | Function entered | Start here |
| Routing context: { trackCount, trackTypes, hasAux } | Context built | Verify track count > 0 |
| 📥 Routing response | Backend responded | Check if response contains actionItems |
| create_aux_track | Creating auxiliary | Check if "Aux 1" track appears in UI |
| route_track | Routing audio | Check Mixer → Routing dropdown |

### When `analyzeSessionWithBackend()` is called:

| Log | Meaning | Expected Value |
|-----|---------|-----------------|
| 🔍 analyzeSessionWithBackend called | Function entered | This should appear first |
| Context: { trackCount, hasClipping, masterLevel } | Session analyzed | trackCount should be > 0 |
| 📥 Analysis response | Backend responded | Should have actionItems array |
| fix_clipping | Fixing clipped audio | Track volume should reduce to -3dB |
| normalize_levels | Level adjustment | Track volume changes visible in Mixer |

## Debugging Workflow

### Phase 1: Verify Button Click
1. Open DevTools Console
2. Click "AI" button (Sparkles icon in TopBar)
3. **Does any log appear?**
   - ✅ YES → Go to Phase 2
   - ❌ NO → Button not wired correctly (check React event handlers)

### Phase 2: Verify Function Entry
1. If logs appear, check first log
2. **Is it "🎯 suggestMixingChain called"?**
   - ✅ YES → Go to Phase 3
   - ❌ NO → Wrong function triggered (check codetteActiveTab state)

### Phase 3: Verify Bridge Connection
1. Look for "🌉 Bridge instance: CodetteBridgeService"
2. **Does bridge log appear?**
   - ✅ YES (and shows object) → Go to Phase 4
   - ❌ NO → Bridge not initialized (`getCodetteBridge()` returning null/undefined)
   - ❌ ERROR message → Bridge initialization failed

### Phase 4: Verify Backend Response
1. Look for "📥 Backend response:"
2. **Does response log appear?**
   - ✅ YES → Go to Phase 5
   - ❌ NO → Backend not responding (check Python server on port 8000)
   - ❌ Shows error → Network or API error

### Phase 5: Verify Action Execution
1. Look for "🤖 Executing Codette mixing suggestions:"
2. **Does action log appear?**
   - ✅ YES → Go to Phase 6
   - ❌ NO → Response missing actionItems field

### Phase 6: Verify DAW State Update
1. Look for "✅" success logs like "✅ Effects added to track"
2. **Do success logs appear?**
   - ✅ YES → Check UI for changes (Mixer should show new effects)
   - ❌ NO → updateTrack() may be failing silently
   - ❌ Shows error → DAW context issue

## Common Issues & Solutions

### Issue 1: No Console Logs Appear When Button Clicked

**Problem**: Button appears clickable but nothing happens

**Diagnostics**:
1. Click button while watching console
2. Do you see **any** console logs at all? (even from other components)

**Solutions**:
- [ ] Check if button is actually clickable (try clicking other buttons)
- [ ] Verify TopBar component is rendering (search for "TopBar" in console)
- [ ] Check React.StrictMode double-render (may show 2x logs in development)
- [ ] Verify onClick handler is wired: `onClick={handleCodetteAction}`

### Issue 2: Function Logs Appear But No Backend Response

**Problem**: "🎯 suggestMixingChain called" appears but no "📥 Backend response"

**Diagnostics**:
```javascript
// In console, run:
fetch('http://localhost:8000/health').then(r => r.json()).then(console.log)
```

**Solutions**:
- [ ] Is Python backend running on port 8000?
- [ ] Try command: `python codette_server.py`
- [ ] Check if backend is responding to health check
- [ ] Verify VITE_CODETTE_API in `.env` is `http://localhost:8000`

### Issue 3: Backend Responds But Actions Don't Execute

**Problem**: "📥 Backend response" appears but no "✅" logs and UI doesn't change

**Diagnostics**:
```javascript
// Check if updateTrack is available
// In any React component console, try:
console.log('updateTrack available:', typeof updateTrack);
```

**Solutions**:
- [ ] Verify DAWContext is properly providing `updateTrack`
- [ ] Check if selectedTrack is null (logs show "NONE")
- [ ] Verify track volume/effects are actually being updated (check Redux/Context state)
- [ ] Try manually updating track in Mixer to verify updateTrack works

### Issue 4: Actions Execute But UI Doesn't Update

**Problem**: "✅ Effects added" logs appear but Mixer shows no change

**Diagnostics**:
```javascript
// Check Redux/Context state directly
// In console:
console.log(document.__reactRootContainer) // React dev tools
// Or check Mixer component props
```

**Solutions**:
- [ ] Force page refresh (Ctrl+Shift+R) to clear cache
- [ ] Check if Mixer is connected to correct track
- [ ] Verify selectedTrack hasn't changed
- [ ] Check if React is re-rendering (look for render logs)

## Expected Console Output

### Successful Mixing Chain Flow:
```
🎯 suggestMixingChain called
   selectedTrack: Vocals
🌉 Bridge instance: CodetteBridgeService { ... }
📥 Backend response: {
  prediction: "Adding EQ and compression to vocal track",
  actionItems: [
    { action: "add_effect", parameter: "vocals", value: "parametric_eq" },
    { action: "add_effect", parameter: "vocals", value: "compressor" }
  ]
}
🤖 Executing Codette mixing suggestions: (2) [{...}, {...}]
   Processing action: add_effect(vocals) = parametric_eq
✅ Effects added to track: Vocals
   Processing action: add_effect(vocals) = compressor
✅ Effects added to track: Vocals
```

### Successful Routing Flow:
```
🎛️ suggestRouting called
   Routing context: { trackCount: 5, trackTypes: (5) [...], hasAux: false }
📥 Routing response: {
  prediction: "Creating auxiliary track for reverb sends",
  actionItems: [
    { action: "create_aux_track", parameter: "reverb", value: "Reverb Aux" }
  ]
}
🤖 Executing Codette routing suggestions: (1) [{...}]
   Processing action: create_aux_track(reverb) = Reverb Aux
✅ Created auxiliary track
```

### Successful Analysis Flow:
```
🔍 analyzeSessionWithBackend called
   Context: { trackCount: 5, hasClipping: true, masterLevel: 1.5 }
📥 Analysis response: {
  prediction: "Fix clipping on drums and master track",
  actionItems: [
    { action: "fix_clipping", parameter: "drums", value: -3 },
    { action: "fix_clipping", parameter: "master", value: -6 }
  ]
}
🤖 Executing Codette analysis suggestions: (2) [{...}, {...}]
   Processing action: fix_clipping(drums) = -3
✅ Fixed clipping - reduced volume to -3dB
   Processing action: fix_clipping(master) = -6
✅ Fixed clipping - reduced volume to -6dB
```

## Testing Checklist

- [ ] Browser opens to http://localhost:5174
- [ ] DevTools Console tab visible (F12)
- [ ] At least 1 audio track created in DAW
- [ ] "Codette" button visible in top-right (purple area)
- [ ] Click button produces console logs
- [ ] Logs include 🎯, 🌉, 📥, 🤖 emojis
- [ ] Logs show "✅ Successfully..." messages
- [ ] Mixer shows effects added OR aux tracks created
- [ ] UI reflects DAW state changes

## Advanced Debugging

### Check Bridge Service Directly:
```typescript
// In console, paste this to test bridge:
import { getCodetteBridge } from './lib/codetteBridgeService';
const bridge = getCodetteBridge();
bridge.getMixingIntelligence({ trackCount: 1, selectedTrack: 'test' })
  .then(r => console.log('Response:', r))
  .catch(e => console.error('Error:', e));
```

### Check DAW Context:
```typescript
// Verify updateTrack is available:
const { updateTrack, selectedTrack } = useDAW();
console.log('Track available:', !!selectedTrack);
console.log('updateTrack function:', typeof updateTrack);
// Try manually updating:
updateTrack(selectedTrack.id, { volume: -6 });
```

### Check Network Requests:
1. Open DevTools
2. Click "Network" tab
3. Click Codette button
4. Watch for HTTP requests to `http://localhost:8000/api/*`
5. Click request to see response body

## Files Modified (Latest Session)

1. **TopBar.tsx** (Lines with emoji logs added):
   - Line 245: `suggestMixingChain()` - 🎯, 🌉, 📥, 🤖 logs
   - Line 270: `handleCodetteAction()` - dispatcher logs
   - Line 325: `suggestRouting()` - 🎛️ logs
   - Line 279: `analyzeSessionWithBackend()` - 🔍 logs

2. **codetteBridgeService.ts**:
   - Transform methods for action parsing

3. **CodettePanel.tsx**:
   - Apply buttons on suggestions

## Next Steps After Debugging

Once logs identify the failure point:

1. **If button not wired**: Check React event handlers in TopBar
2. **If bridge failing**: Verify bridge initialization in service file
3. **If backend not responding**: Start Python server (port 8000)
4. **If updateTrack failing**: Check DAW Context export
5. **If UI not updating**: Check React DevTools for state changes

## Support Commands

```bash
# Check frontend is running:
curl http://localhost:5174

# Check backend is running:
curl http://localhost:8000/health

# Watch backend logs in real-time:
# (Terminal where you started Python server)
# Look for Uvicorn logs showing incoming requests

# Check network traffic:
# DevTools → Network tab → filter by XHR
# Look for requests to /api/... endpoints
```
