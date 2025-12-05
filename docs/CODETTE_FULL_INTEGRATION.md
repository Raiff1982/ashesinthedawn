# Codette Full Integration Guide

**Status**: ? Fully Integrated into CoreLogic Studio
**Version**: 1.0.0
**Last Updated**: December 2025

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Integration Points](#integration-points)
3. [Real Working Features](#real-working-features)
4. [Developer Guide](#developer-guide)
5. [API Reference](#api-reference)
6. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Three-Layer Integration

```
???????????????????????????????????????????????????????????????????
?                    React Frontend UI Layer                       ?
?  ????????????????????  ????????????????????  ???????????????? ?
?  ?  Codette Panel   ?  ?  TopBar Status   ?  ?  Sidebar     ? ?
?  ?  (CodettePanel)  ?  ?  (Indicator)     ?  ?  (optional)  ? ?
?  ????????????????????  ????????????????????  ???????????????? ?
???????????????????????????????????????????????????????????????????
                           ?
???????????????????????????????????????????????????????????????????
?             DAWContext (State Management Layer)                  ?
?  ???????????????????????????????????????????????????????????  ?
?  ? • codetteConnected (boolean)                             ?  ?
?  ? • codetteLoading (boolean)                               ?  ?
?  ? • codetteSuggestions (CodetteSuggestion[])              ?  ?
?  ? • getSuggestionsForTrack(trackId, context)              ?  ?
?  ? • applyCodetteSuggestion(trackId, suggestion)           ?  ?
?  ? • analyzeTrackWithCodette(trackId)                      ?  ?
?  ? • syncDAWStateToCodette()                               ?  ?
?  ? • codetteTransportPlay/Stop/Seek(...)                   ?  ?
?  ? • codetteSetTempo(...), codetteSetLoop(...)             ?  ?
?  ? • getCodetteBridgeStatus()                              ?  ?
?  ???????????????????????????????????????????????????????????  ?
???????????????????????????????????????????????????????????????????
                           ?
???????????????????????????????????????????????????????????????????
?           CodetteBridge (HTTP + WebSocket Layer)                 ?
?  ????????????????????????????????????????????????????????????  ?
?  ? REST Endpoints:                                          ?  ?
?  ? • POST /codette/chat - Chat with AI                    ?  ?
?  ? • POST /codette/suggest - Get suggestions              ?  ?
?  ? • POST /codette/analyze - Analyze audio/project        ?  ?
?  ? • GET /health - Health check                           ?  ?
?  ?                                                          ?  ?
?  ? WebSocket: /ws                                          ?  ?
?  ? • Real-time transport state updates                     ?  ?
?  ? • Suggestion streaming                                   ?  ?
?  ? • Live analysis results                                 ?  ?
?  ????????????????????????????????????????????????????????????  ?
???????????????????????????????????????????????????????????????????
                           ?
???????????????????????????????????????????????????????????????????
?         Python Codette Backend (localhost:8000)                  ?
?  ????????????????????????????????????????????????????????????  ?
?  ? • Music analysis (spectrum, dynamics, loudness)         ?  ?
?  ? • AI suggestions (mixing, routing, mastering)           ?  ?
?  ? • Real-time WebSocket updates                           ?  ?
?  ? • Transport control                                      ?  ?
?  ? • Learning system for personalization                   ?  ?
?  ????????????????????????????????????????????????????????????  ?
???????????????????????????????????????????????????????????????????
```

---

## Integration Points

### 1. **CodettePanel Component** (`src/components/CodettePanel.tsx`)
Located in App.tsx as the main UI. Features:
- **Tabs**: Suggestions, Analysis, Chat, Actions, Files, Control
- **Real-time Connection Status**: Green dot when connected, red when offline
- **Suggestion Application**: Click to apply AI suggestions to selected track
- **Analysis Functions**: Health check, spectrum analysis, metering, phase correlation
- **Chat Interface**: Talk to Codette AI for production advice
- **Activity Logging**: All interactions logged for learning

**Usage in App.tsx:**
```typescript
{rightSidebarTab === 'control' && <CodettePanel isVisible={true} />}
```

### 2. **DAWContext Integration** (`src/contexts/DAWContext.tsx`)
Full Codette methods available via `useDAW()` hook:

```typescript
const {
  codetteConnected,           // Boolean - connection status
  codetteLoading,            // Boolean - processing state
  codetteSuggestions,        // Array - current suggestions
  
  // Core methods
  getSuggestionsForTrack,    // Get AI suggestions for track
  applyCodetteSuggestion,    // Apply a suggestion to track
  analyzeTrackWithCodette,   // Analyze audio with AI
  syncDAWStateToCodette,     // Sync DAW state to backend
  
  // Transport control
  codetteTransportPlay,      // Play from Codette
  codetteTransportStop,      // Stop from Codette
  codetteTransportSeek,      // Seek position from Codette
  codetteSetTempo,           // Set BPM from Codette
  codetteSetLoop,            // Enable/disable loop from Codette
  
  // Status
  getCodetteBridgeStatus,    // Get detailed bridge status
} = useDAW();
```

### 3. **CodetteBridge** (`src/lib/codetteBridge.ts`)
Low-level communication layer. Handles:
- HTTP REST requests to backend
- WebSocket real-time updates
- Automatic reconnection with exponential backoff
- Request queuing for offline resilience
- Health checks every 30 seconds

### 4. **TopBar Status Indicator**
Shows Codette connection status:
- ?? Connected - AI ready to help
- ?? Offline - Suggest using offline suggestions
- ? Loading - Processing request

### 5. **CodetteSidebar** (Optional) (`src/components/CodetteSidebar.tsx`)
Collapsible sidebar version of Codette. Can be integrated for alternative layout.

---

## Real Working Features

### Feature 1: **Real-Time Mixing Suggestions**
```typescript
// Get suggestions for a track
const suggestions = await getSuggestionsForTrack(
  selectedTrack.id,
  'mixing'  // Can also be: 'gain', 'routing', 'mastering', 'creative'
);

// Each suggestion includes:
{
  id: "string",
  type: "eq" | "compression" | "reverb" | "delay" | "saturation" | "gain" | "pan",
  title: "string",
  description: "string",
  confidence: 0.0-1.0,
  parameters: { key: value },
  actionItems: [{ action, parameter, value }]
}
```

### Feature 2: **Track Analysis**
```typescript
// Analyze selected track
const analysis = await analyzeTrackWithCodette(selectedTrack.id);

// Returns:
{
  score: 0-100,           // Quality score
  category: "string",     // Audio type
  issues: ["string"],     // Problems found
  recommendations: ["string"]  // How to fix
}
```

### Feature 3: **Audio Session Analysis**
```typescript
// Session health check
// Includes: peak levels, clipping detection, gain staging, balance issues
```

### Feature 4: **DAW State Sync**
```typescript
// Automatically syncs to Codette backend:
// • Track names and types
// • Volume and pan settings
// • Mute/solo states
// • Playback position
// • Play/stop state
// • BPM and time signature
```

### Feature 5: **Transport Control**
```typescript
// Control playback from Codette backend
await codetteTransportPlay();      // Start playback
await codetteTransportStop();      // Stop playback
await codetteTransportSeek(10.5);  // Seek to 10.5 seconds
await codetteSetTempo(135);        // Set BPM to 135
await codetteSetLoop(true, 0, 30); // Loop from 0-30s
```

### Feature 6: **Suggestion Application**
```typescript
// Apply a suggestion to a track
const success = await applyCodetteSuggestion(
  selectedTrack.id,
  suggestion
);

// Automatically updates:
// • Track volume/pan
// • Adds plugins to insert chain
// • Updates track parameters
```

### Feature 7: **Connection Management**
```typescript
// Monitor connection status
const status = getCodetteBridgeStatus();
// Returns: { connected, reconnectCount, isReconnecting }

// Automatic reconnection with exponential backoff:
// Attempt 1: 1 second
// Attempt 2: 2 seconds
// Attempt 3: 4 seconds
// ... up to 30 seconds max delay
```

### Feature 8: **WebSocket Real-Time Updates**
When backend available, WebSocket delivers:
- Transport state changes
- Real-time suggestions
- Analysis results streaming
- Live metering data

### Feature 9: **Offline Fallback**
If backend unavailable, Codette provides:
- Offline mixing advice based on track type
- Gain staging recommendations
- Generic routing suggestions
- All handled gracefully without breaking UI

### Feature 10: **Chat Interface**
```typescript
// Users can ask Codette about production:
"What should I add to my drums track?"
"How do I improve my mix balance?"
"What's a good EQ setting for vocals?"

// Codette responds with:
// • Direct advice
// • Specific recommendations
// • Track-aware suggestions
// • Link to DAW actions
```

---

## Developer Guide

### Using Codette in a Component

```typescript
import { useDAW } from '../contexts/DAWContext';

export function MyComponent() {
  const {
    selectedTrack,
    codetteConnected,
    codetteLoading,
    getSuggestionsForTrack,
    applyCodetteSuggestion,
  } = useDAW();

  const handleGetSuggestions = async () => {
    if (!selectedTrack) return;
    
    const suggestions = await getSuggestionsForTrack(
      selectedTrack.id,
      'mixing'
    );
    
    // Use suggestions
    suggestions.forEach(suggestion => {
      console.log(suggestion.title, suggestion.description);
    });
  };

  const handleApply = async (suggestion: CodetteSuggestion) => {
    const success = await applyCodetteSuggestion(
      selectedTrack.id,
      suggestion
    );
    
    if (success) {
      console.log('Suggestion applied!');
    }
  };

  return (
    <div>
      <button onClick={handleGetSuggestions} disabled={!codetteConnected}>
        {codetteLoading ? 'Loading...' : 'Get Suggestions'}
      </button>
    </div>
  );
}
```

### Handling Connection Issues

```typescript
// Always check connection status before using Codette
if (!codetteConnected) {
  console.log('Codette offline - using fallback suggestions');
  return getFallbackSuggestions();
}

// The bridge auto-reconnects, but you can trigger manual reconnect
const bridge = getCodetteBridge();
await bridge.forceReconnect();
```

### Custom Analysis

```typescript
// Call specific analysis types
const bridge = getCodetteBridge();

// Spectrum analysis
const spectrum = await bridge.analyzeAudio(
  { duration: 5, sample_rate: 44100, peak_level: -6 },
  'spectrum'
);

// Dynamic range analysis
const dynamics = await bridge.analyzeAudio(
  { duration: 5, sample_rate: 44100 },
  'dynamic'
);

// Loudness analysis
const loudness = await bridge.analyzeAudio(
  { duration: 5, sample_rate: 44100 },
  'loudness'
);
```

---

## API Reference

### CodetteBridge Methods

#### `chat(message: string, conversationId: string, perspective?: string)`
Send a chat message to Codette AI.
```typescript
const response = await bridge.chat(
  "What should I EQ on my vocal track?",
  "conversation-123",
  "professional"  // or "aggressive", "ethereal", "energetic"
);
```

#### `getSuggestions(context: object, limit?: number)`
Get AI suggestions for current context.
```typescript
const suggestions = await bridge.getSuggestions({
  type: 'mixing',
  track_type: 'audio',
  mood: 'professional'
}, 5);
```

#### `analyzeAudio(audioData: object, analysisType: string)`
Analyze audio with specific analysis type.
```typescript
const analysis = await bridge.analyzeAudio(
  {
    duration: 10,
    sample_rate: 44100,
    peak_level: -3,
    rms_level: -20
  },
  'spectrum'  // or 'dynamic', 'loudness', 'quality'
);
```

#### `syncState(tracks, currentTime, isPlaying, bpm)`
Sync DAW state with Codette backend.
```typescript
await bridge.syncState(
  tracks,      // Track array
  120.5,       // Current playback position in seconds
  true,        // Is playing
  130          // BPM
);
```

#### `healthCheck()`
Check if backend is healthy.
```typescript
const healthy = await bridge.healthCheck();
if (healthy) {
  console.log('Backend is responding');
}
```

#### `forceReconnect()`
Force immediate reconnection attempt.
```typescript
await bridge.forceReconnect();
```

#### `getConnectionStatus()`
Get detailed connection status.
```typescript
const status = bridge.getConnectionStatus();
// {
//   connected: boolean,
//   reconnectAttempts: number,
//   isReconnecting: boolean,
//   lastAttempt: timestamp,
//   timeSinceLastAttempt: ms
// }
```

#### `getWebSocketStatus()`
Get WebSocket connection details.
```typescript
const wsStatus = bridge.getWebSocketStatus();
// {
//   connected: boolean,
//   reconnectAttempts: number,
//   maxAttempts: number,
//   url: string
// }
```

#### Event Listening

```typescript
const bridge = getCodetteBridge();

// Connection events
bridge.on('connected', (data) => {
  console.log('Connected to Codette');
});

bridge.on('disconnected', () => {
  console.log('Disconnected from Codette');
});

// WebSocket events
bridge.on('ws_connected', (connected) => {
  console.log('WebSocket', connected ? 'up' : 'down');
});

bridge.on('transport_changed', (state) => {
  console.log('Backend transport state:', state);
});

bridge.on('suggestion_received', (suggestions) => {
  console.log('New suggestions:', suggestions);
});

bridge.on('analysis_complete', (analysis) => {
  console.log('Analysis done:', analysis);
});

// Queue events
bridge.on('queue_updated', ({ queueSize }) => {
  console.log('Queued requests:', queueSize);
});

bridge.on('request_failed', ({ requestId, error }) => {
  console.log('Request failed:', requestId, error);
});
```

---

## Troubleshooting

### Issue 1: "Codette Offline" Status

**Cause**: Backend (localhost:8000) not running

**Solution**:
```bash
# Start the Python backend
cd Codette
python codette_server_production.py
# Should see: "Uvicorn running on http://0.0.0.0:8000"
```

**Check Connection**:
```typescript
const bridge = getCodetteBridge();
const status = await bridge.healthCheck();
console.log('Connected:', status);
```

### Issue 2: Suggestions Not Appearing

**Cause**: No track selected or backend error

**Solution**:
1. Select a track in the UI
2. Check browser console for errors
3. Verify backend is returning data:
```bash
curl http://localhost:8000/codette/suggest -X POST \
  -H "Content-Type: application/json" \
  -d '{"context":{"type":"mixing","track_type":"audio"},"limit":5}'
```

### Issue 3: WebSocket Connection Failed

**Cause**: WebSocket URL mismatch or SSL/TLS issues

**Solution**:
```typescript
// Check WebSocket status
const wsStatus = bridge.getWebSocketStatus();
console.log('WebSocket URL:', wsStatus.url);

// Force WebSocket reconnect
await bridge.forceWebSocketReconnect();

// Check events
bridge.on('ws_error', (error) => {
  console.error('WebSocket error:', error);
});
```

### Issue 4: Suggestion Application Not Working

**Cause**: Track doesn't support the suggestion type

**Solution**:
1. Verify track type matches suggestion (e.g., "audio" for EQ)
2. Check that track exists and is not deleted
3. Verify DAWContext methods are working:
```typescript
const { updateTrack, selectedTrack } = useDAW();
// updateTrack should update the track in state
```

### Issue 5: Reconnection Loop

**Cause**: Backend repeatedly failing to respond

**Solution**:
1. Check backend logs for errors
2. Verify port 8000 is accessible:
```bash
netstat -tuln | grep 8000  # Linux/Mac
netstat -ano | findstr 8000  # Windows
```
3. Try manual reconnect:
```typescript
const bridge = getCodetteBridge();
await bridge.forceReconnect();
```

---

## Environment Variables

**.env.codette.example**:
```bash
VITE_CODETTE_API=http://localhost:8000
VITE_CODETTE_TIMEOUT=10000
VITE_CODETTE_RETRIES=3
```

---

## Performance Considerations

1. **Suggestion Polling**: Every 30 seconds to prevent UI blocking
2. **Health Checks**: Every 30 seconds for connection monitoring
3. **WebSocket**: Real-time updates only when available
4. **Request Queue**: Offline requests stored, auto-retry when online
5. **Caching**: Analysis results cached to avoid duplicate requests

---

## Future Enhancements

- [ ] Machine learning model training from user interactions
- [ ] Preset bank with Codette recommendations
- [ ] Real-time gain staging automation
- [ ] Spectral analysis visualization
- [ ] MIDI suggestion generation
- [ ] Integration with external DSP libraries
- [ ] Collaborative session sharing with Codette AI

---

## Support & Issues

For bugs or feature requests:
1. Check GitHub issues
2. Review console logs
3. Verify backend is running
4. Check connection status in TopBar

**Debug Mode**:
```typescript
// In browser console
localStorage.setItem('CODETTE_DEBUG', 'true');
location.reload();
// Shows detailed logging
```

---

**End of Integration Guide**
