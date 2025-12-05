# Codette Quick Reference for Developers

## Quick Start

### 1. Import and Use in Component

```typescript
import { useDAW } from '../contexts/DAWContext';

export function MyComponent() {
  const { 
    codetteConnected,
    getSuggestionsForTrack,
    applyCodetteSuggestion,
    selectedTrack
  } = useDAW();

  return (
    <button 
      onClick={() => getSuggestionsForTrack(selectedTrack.id, 'mixing')}
      disabled={!codetteConnected}
    >
      Get Suggestions
    </button>
  );
}
```

### 2. Get Suggestions for a Track

```typescript
const suggestions = await getSuggestionsForTrack(
  selectedTrack.id,
  'mixing'  // Options: 'mixing', 'gain', 'routing', 'mastering', 'creative'
);

console.log(suggestions); // Array of CodetteSuggestion objects
```

### 3. Apply a Suggestion

```typescript
const suggestion = suggestions[0];

const success = await applyCodetteSuggestion(
  selectedTrack.id,
  suggestion
);

if (success) {
  console.log('Applied:', suggestion.title);
}
```

### 4. Analyze a Track

```typescript
const analysis = await analyzeTrackWithCodette(selectedTrack.id);

console.log({
  score: analysis.score,        // 0-100
  issues: analysis.issues,       // Array of problems
  recommendations: analysis.recommendations  // Array of fixes
});
```

---

## Connection Management

### Check Connection Status

```typescript
const { codetteConnected } = useDAW();

if (!codetteConnected) {
  console.log('Using offline mode');
  // Show offline UI or fallback suggestions
}
```

### Get Detailed Status

```typescript
const { getCodetteBridgeStatus } = useDAW();

const status = getCodetteBridgeStatus();
console.log({
  connected: status.connected,
  reconnectCount: status.reconnectCount,
  isReconnecting: status.isReconnecting
});
```

### Manual Reconnect

```typescript
import { getCodetteBridge } from '../lib/codetteBridge';

const bridge = getCodetteBridge();
await bridge.forceReconnect();
```

---

## CodetteSuggestion Object Structure

```typescript
interface CodetteSuggestion {
  id: string;                    // Unique ID
  type: 'eq' | 'compression' | 'reverb' | 'delay' | 'saturation' | 'gain' | 'pan';
  title: string;                 // "Add Presence EQ"
  description: string;           // "Boost 2-4kHz for clarity"
  confidence: number;            // 0.0 - 1.0
  parameters?: {                 // Plugin parameters
    [key: string]: any;
  };
  actionItems?: Array<{          // How to apply it
    action: string;              // 'add_effect', 'set_level', etc.
    parameter: string;           // What to change
    value: number | string;      // New value
  }>;
}
```

---

## Transport Control

### Play/Stop/Seek

```typescript
const { codetteTransportPlay, codetteTransportStop, codetteTransportSeek } = useDAW();

// Play
await codetteTransportPlay();

// Stop
await codetteTransportStop();

// Seek to specific time (seconds)
await codetteTransportSeek(30.5);
```

### Set Tempo

```typescript
const { codetteSetTempo } = useDAW();

// Set to 135 BPM
await codetteSetTempo(135);
```

### Enable Loop

```typescript
const { codetteSetLoop } = useDAW();

// Loop from 0-30 seconds
await codetteSetLoop(true, 0, 30);

// Disable loop
await codetteSetLoop(false);
```

---

## Advanced Usage

### Direct Bridge Access

```typescript
import { getCodetteBridge } from '../lib/codetteBridge';

const bridge = getCodetteBridge();

// Chat with Codette
const response = await bridge.chat(
  "What's good EQ for a vocal track?",
  "conversation-id",
  "professional"  // mood/perspective
);

// Custom analysis
const analysis = await bridge.analyzeAudio(
  { duration: 10, sample_rate: 44100 },
  'spectrum'  // or 'dynamic', 'loudness', 'quality'
);

// Sync DAW state
await bridge.syncState(tracks, currentTime, isPlaying, bpm);
```

### Event Listening

```typescript
import { getCodetteBridge } from '../lib/codetteBridge';

const bridge = getCodetteBridge();

bridge.on('connected', () => {
  console.log('Codette connected');
});

bridge.on('disconnected', () => {
  console.log('Codette disconnected');
});

bridge.on('suggestion_received', (suggestions) => {
  console.log('New suggestions:', suggestions);
});

bridge.on('transport_changed', (state) => {
  console.log('Transport state:', state);
  // { is_playing, current_time, bpm, loop_enabled, ... }
});
```

### Connection Status Monitoring

```typescript
import { getCodetteBridge } from '../lib/codetteBridge';

const bridge = getCodetteBridge();

const status = bridge.getConnectionStatus();
console.log({
  connected: status.connected,
  reconnectAttempts: status.reconnectAttempts,
  isReconnecting: status.isReconnecting,
  timeSinceLastAttempt: status.timeSinceLastAttempt  // ms
});
```

---

## Common Patterns

### Get Suggestions and Apply Best One

```typescript
const suggestions = await getSuggestionsForTrack(selectedTrack.id, 'mixing');

// Find highest confidence suggestion
const best = suggestions.reduce((a, b) => 
  a.confidence > b.confidence ? a : b
);

// Apply it
await applyCodetteSuggestion(selectedTrack.id, best);
```

### Analyze and Show Results

```typescript
const analysis = await analyzeTrackWithCodette(selectedTrack.id);

// Show issues
analysis.issues.forEach(issue => {
  console.warn('Issue:', issue);
});

// Show recommendations
analysis.recommendations.forEach(rec => {
  console.info('Recommendation:', rec);
});

// Display score
console.log(`Quality: ${analysis.score}/100`);
```

### Real-Time Mixing Dashboard

```typescript
export function MixingDashboard() {
  const { selectedTrack, getSuggestionsForTrack, codetteConnected } = useDAW();
  const [suggestions, setSuggestions] = useState<CodetteSuggestion[]>([]);

  // Auto-refresh suggestions every 30 seconds
  useEffect(() => {
    if (!selectedTrack || !codetteConnected) return;

    const interval = setInterval(async () => {
      const fresh = await getSuggestionsForTrack(selectedTrack.id, 'mixing');
      setSuggestions(fresh);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedTrack, codetteConnected]);

  return (
    <div>
      {suggestions.map(s => (
        <div key={s.id}>
          <h3>{s.title}</h3>
          <p>{s.description}</p>
          <p>Confidence: {(s.confidence * 100).toFixed(0)}%</p>
        </div>
      ))}
    </div>
  );
}
```

### Offline Fallback

```typescript
async function getSmartSuggestions(trackId: string, context: string) {
  const { getSuggestionsForTrack } = useDAW();
  
  try {
    return await getSuggestionsForTrack(trackId, context);
  } catch (error) {
    console.warn('Codette offline, using defaults');
    return getDefaultSuggestions(context);
  }
}

function getDefaultSuggestions(context: string): CodetteSuggestion[] {
  const defaults: Record<string, CodetteSuggestion[]> = {
    'mixing': [
      {
        id: 'default-gain',
        type: 'gain',
        title: 'Set Level to -6dB',
        description: 'Standard mixing level for headroom',
        confidence: 0.7,
        parameters: { volume: -6 },
        actionItems: [{ action: 'set_level', parameter: 'volume', value: -6 }]
      },
      // ... more defaults
    ]
  };
  return defaults[context] || [];
}
```

---

## Debugging

### Enable Debug Logging

```typescript
// In browser console
localStorage.setItem('CODETTE_DEBUG', 'true');
location.reload();

// Now detailed logs appear for all Codette operations
```

### Check Backend Health

```typescript
import { getCodetteBridge } from '../lib/codetteBridge';

const bridge = getCodetteBridge();
const health = await bridge.healthCheck();
console.log('Backend healthy:', health);
```

### View Queue Status

```typescript
const bridge = getCodetteBridge();
const queue = bridge.getQueueStatus();
console.log('Queued requests:', queue.queueSize);
```

### Monitor WebSocket

```typescript
const bridge = getCodetteBridge();
const wsStatus = bridge.getWebSocketStatus();
console.log({
  connected: wsStatus.connected,
  attempts: wsStatus.reconnectAttempts,
  url: wsStatus.url
});
```

---

## Common Issues & Solutions

### "getSuggestions is not a function"
- Make sure you're inside a component using `useDAW()`
- Check that DAWContext is initialized (should be in App.tsx)

### No suggestions appearing
- Verify track is selected: `if (!selectedTrack) return;`
- Check backend is running: `curl http://localhost:8000/health`
- Look for errors in browser console

### Codette always offline
- Ensure backend is running on localhost:8000
- Check firewall isn't blocking port 8000
- Try manual reconnect: `await bridge.forceReconnect();`

### Suggestion doesn't apply
- Verify suggestion type matches track type
- Check track exists and isn't deleted
- Ensure DAWContext updateTrack method works

---

## API Endpoints Quick Reference

```
POST /codette/chat
  - Send chat message, get response

POST /codette/suggest
  - Get suggestions for context
  
POST /codette/analyze
  - Analyze audio or project state
  
GET /health
  - Check backend availability
  
WS /ws
  - Real-time WebSocket connection
```

---

## TypeScript Support

```typescript
// Import types
import {
  CodetteSuggestion,
  CodetteAnalysisResponse,
  CodetteTransportState,
  CodetteChatResponse,
  CodetteSuggestionResponse
} from '../lib/codetteBridge';

// Use in your code
const suggestion: CodetteSuggestion = {
  id: 'eq-1',
  type: 'eq',
  title: 'Add EQ',
  description: 'Adds presence',
  confidence: 0.8,
  parameters: {}
};
```

---

## Performance Tips

1. **Cache suggestions** - Don't fetch every render
2. **Debounce rapid requests** - Limit API calls
3. **Use offline fallbacks** - Always handle disconnection
4. **Subscribe to events** - Use WebSocket for real-time
5. **Batch updates** - Group related changes together

```typescript
// Good: debounced suggestions
const [suggestions, setSuggestions] = useState([]);

useEffect(() => {
  const timer = setTimeout(async () => {
    const fresh = await getSuggestionsForTrack(selectedTrack.id, 'mixing');
    setSuggestions(fresh);
  }, 500);
  
  return () => clearTimeout(timer);
}, [selectedTrack]);
```

---

## Support

- Check browser console for detailed error messages
- Enable debug logging: `localStorage.setItem('CODETTE_DEBUG', 'true');`
- Verify backend with: `curl http://localhost:8000/health`
- Review logs in Python backend terminal

For more info, see: `CODETTE_FULL_INTEGRATION.md`
