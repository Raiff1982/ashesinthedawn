# DAW Server & Bridge Technical Integration Guide

**Purpose**: Detailed technical documentation for developers integrating UI components with server backend

---

## Architecture Overview

```
???????????????????????????????????????????????????????????????????
?                     React Frontend Layer                        ?
?  (DAWContext, useDAW hook, Components)                         ?
???????????????????????????????????????????????????????????????????
                         ?
        ???????????????????????????????????
        ?                ?                ?
???????????????  ???????????????  ????????????????
?CodetteBridge?  ?DSPBridge    ?  ?effectChainAPI?
?   (REST)    ?  ?  (REST)     ?  ?  (WebSocket) ?
???????????????  ???????????????  ????????????????
        ?                ?                ?
        ???????????????????????????????????
                         ?
        ???????????????????????????????????
        ?                ?                ?
        ?        HTTP/WebSocket          ?
        ?                ?                ?
?????????????????????????????????????????????????????????????????
?    FastAPI Server    ? (codette_server_unified.py)           ?
?                      ?                                        ?
? ??????????????????????????????????????????????????????????? ?
? ? /health                  (connection verify)            ? ?
? ? /codette/chat           (AI suggestions)               ? ?
? ? /codette/suggest        (track recommendations)        ? ?
? ? /codette/analyze        (audio analysis)               ? ?
? ? /api/analyze/*          (specialized analysis)         ? ?
? ? /api/diagnostics/*      (server health)                ? ?
? ? /ws                     (WebSocket transport)          ? ?
? ??????????????????????????????????????????????????????????? ?
?                                                              ?
? ??????????????????????????????????????????????????????????? ?
? ? Cache System (TTL: 300s)                               ? ?
? ? Supabase Client (optional)                             ? ?
? ? Error Logging                                          ? ?
? ??????????????????????????????????????????????????????????? ?
????????????????????????????????????????????????????????????????
```

---

## 1. CodetteBridge Usage Patterns

### Pattern 1: Simple Chat Request

```typescript
import { getCodetteBridge } from "../lib/codetteBridge";

async function askCodette() {
  const bridge = getCodetteBridge();
  
  try {
    const response = await bridge.chat(
      "How do I compress drums?",
      "conversation-123",
      "mix_engineering"
    );
    
    console.log(response.response);      // Chat answer
    console.log(response.confidence);    // Confidence score
  } catch (error) {
    console.error("Chat failed:", error);
  }
}
```

### Pattern 2: Get Suggestions for Track

```typescript
async function getSuggestionsForDrums() {
  const bridge = getCodetteBridge();
  
  try {
    const suggestions = await bridge.getSuggestions(
      {
        type: "mixing",
        track_type: "drums",
        mood: "energetic"
      },
      5 // limit
    );
    
    console.log(suggestions.suggestions);  // Array of suggestions
    return suggestions;
  } catch (error) {
    console.error("Failed to get suggestions:", error);
    return { suggestions: [] };
  }
}
```

### Pattern 3: Listen for Real-Time Updates

```typescript
import { getCodetteBridge } from "../lib/codetteBridge";

useEffect(() => {
  const bridge = getCodetteBridge();
  
  // Listen for transport changes from WebSocket
  bridge.on("transport_changed", (state) => {
    console.log("Transport updated:", state);
    // Update UI
  });
  
  // Listen for suggestions arriving
  bridge.on("suggestion_received", (suggestions) => {
    console.log("New suggestions:", suggestions);
    // Update UI
  });
  
  // Listen for connection status
  bridge.on("connected", () => {
    console.log("Connected to Codette");
  });
  
  bridge.on("disconnected", () => {
    console.log("Disconnected from Codette");
  });
  
  return () => {
    bridge.off("transport_changed", updateTransport);
    bridge.off("suggestion_received", updateSuggestions);
  };
}, []);
```

### Pattern 4: Check Connection Status

```typescript
function getStatus() {
  const bridge = getCodetteBridge();
  
  const status = bridge.getConnectionStatus();
  
  console.log({
    connected: status.connected,
    reconnectAttempts: status.reconnectAttempts,
    isReconnecting: status.isReconnecting,
    timeSinceLastAttempt: status.timeSinceLastAttempt
  });
}
```

### Pattern 5: Sync DAW State

```typescript
async function syncState() {
  const bridge = getCodetteBridge();
  const { tracks, currentTime, isPlaying } = useDAW();
  
  try {
    const result = await bridge.syncState(
      tracks,
      currentTime,
      isPlaying,
      120  // BPM
    );
    
    console.log("State synced:", result);
  } catch (error) {
    console.error("Sync failed:", error);
  }
}
```

---

## 2. DSPBridge Usage Patterns

### Pattern 1: Process Audio Through Effect

```typescript
import { processEffect } from "../lib/dspBridge";

async function applyCompressor(audioData: Float32Array) {
  try {
    const processed = await processEffect(
      "compressor",
      audioData,
      {
        ratio: 4,
        threshold: -20,
        attack: 0.01,
        release: 0.1
      }
    );
    
    return processed;  // Float32Array
  } catch (error) {
    console.error("Compression failed:", error);
    return audioData;  // Fallback to original
  }
}
```

### Pattern 2: Generate Automation Curves

```typescript
import { 
  generateAutomationCurve,
  generateLFO,
  generateEnvelope
} from "../lib/dspBridge";

async function createAutomation() {
  const duration = 4;  // 4 seconds
  const sampleRate = 44100;
  
  // Linear volume automation (0 to 1 over 4 seconds)
  const volumeCurve = await generateAutomationCurve(
    duration,
    "linear",
    0,      // start value
    1,      // end value
    sampleRate
  );
  
  // LFO modulation (sine wave, 2 Hz rate)
  const lfoModulation = await generateLFO(
    duration,
    "sine",
    2,      // rate (Hz)
    0.5,    // amount
    sampleRate
  );
  
  // ADSR envelope
  const envelope = await generateEnvelope(
    duration,
    0.1,    // attack
    0.2,    // decay
    0.7,    // sustain
    0.3,    // release
    sampleRate
  );
  
  return { volumeCurve, lfoModulation, envelope };
}
```

### Pattern 3: Analyze Audio

```typescript
import {
  analyzeLevels,
  analyzeSpectrum,
  analyzeVU,
  analyzeCorrelation
} from "../lib/dspBridge";

async function analyzeAudio(audioData: Float32Array) {
  const sampleRate = 44100;
  
  // Get levels (peak, RMS, LUFS)
  const levels = await analyzeLevels(audioData, sampleRate);
  console.log({
    peak: levels.peak,
    rms: levels.rms,
    loudness_lufs: levels.loudness_lufs,
    headroom: levels.headroom
  });
  
  // Get frequency spectrum
  const spectrum = await analyzeSpectrum(audioData, sampleRate);
  console.log({
    frequencies: spectrum.frequencies,
    magnitudes: spectrum.magnitudes,
    num_bins: spectrum.num_bins
  });
  
  // Get VU meter reading
  const vu = await analyzeVU(audioData, sampleRate);
  console.log("VU Level:", vu.vu_db, "dB");
  
  // Get stereo correlation
  const correlation = await analyzeCorrelation(audioData, sampleRate);
  console.log({
    correlation: correlation.correlation,
    is_mono: correlation.mono,
    is_stereo: correlation.stereo
  });
  
  return { levels, spectrum, vu, correlation };
}
```

### Pattern 4: Check Backend Connection

```typescript
import { 
  initializeDSPBridge,
  getConnectionStatus,
  resetConnection
} from "../lib/dspBridge";

async function checkDSPConnection() {
  // Initialize if not already connected
  const connected = await initializeDSPBridge();
  console.log("DSP Backend connected:", connected);
  
  // Check status
  const status = getConnectionStatus();
  console.log({
    connected: status.connected,
    lastError: status.lastError,
    retries: status.retries
  });
  
  // Reset if needed (for debugging)
  // resetConnection();
}
```

---

## 3. Error Handling Patterns

### Pattern 1: Graceful Fallback

```typescript
async function getTrackSuggestions(trackId: string) {
  const bridge = getCodetteBridge();
  
  try {
    const suggestions = await bridge.getSuggestions(
      {
        type: "mixing",
        track_type: "drums"
      }
    );
    
    return suggestions.suggestions;
  } catch (error) {
    console.warn("Failed to get suggestions, using defaults:", error);
    
    // Fallback suggestions
    return [
      {
        id: "default-1",
        type: "effect",
        title: "Add Compression",
        description: "Try a 4:1 compressor",
        confidence: 0.5,
        category: "dynamics"
      }
    ];
  }
}
```

### Pattern 2: Connection Status Display

```typescript
function ConnectionStatus() {
  const [status, setStatus] = useState("");
  const bridge = getCodetteBridge();
  
  useEffect(() => {
    const checkStatus = () => {
      const connStatus = bridge.getConnectionStatus();
      
      if (connStatus.connected) {
        setStatus("? Connected");
      } else if (connStatus.isReconnecting) {
        setStatus(`?? Reconnecting (${connStatus.reconnectAttempts})`);
      } else {
        setStatus("? Disconnected");
      }
    };
    
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, []);
  
  return <div className="connection-status">{status}</div>;
}
```

### Pattern 3: Retry with Exponential Backoff

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Retry in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Usage
const suggestions = await withRetry(
  () => bridge.getSuggestions({ type: "mixing" })
);
```

---

## 4. WebSocket Integration

### Pattern: Real-Time Transport Control

```typescript
import { getCodetteBridge } from "../lib/codetteBridge";

function TransportControls() {
  const [transportState, setTransportState] = useState({
    playing: false,
    timeSeconds: 0,
    bpm: 120
  });
  
  useEffect(() => {
    const bridge = getCodetteBridge();
    
    // Listen for transport updates
    bridge.on("transport_changed", (state) => {
      setTransportState(state);
    });
    
    // Listen for analysis complete
    bridge.on("analysis_complete", (data) => {
      console.log("Analysis ready:", data);
    });
    
    // Listen for connection changes
    bridge.on("ws_connected", (connected) => {
      console.log("WebSocket:", connected ? "connected" : "disconnected");
    });
    
    // Cleanup
    return () => {
      bridge.off("transport_changed", setTransportState);
    };
  }, []);
  
  async function handlePlay() {
    try {
      const result = await bridge.transportPlay();
      console.log("Play command sent");
    } catch (error) {
      console.error("Play failed:", error);
    }
  }
  
  return (
    <div className="transport-controls">
      <button onClick={handlePlay}>Play</button>
      <div>Time: {transportState.timeSeconds.toFixed(2)}s</div>
      <div>BPM: {transportState.bpm}</div>
    </div>
  );
}
```

---

## 5. Server Response Format Reference

### Chat Response
```typescript
{
  response: string;           // The AI response
  perspective: string;        // mix_engineering, composition, etc.
  confidence: number;         // 0-1 confidence score
  timestamp: string;          // ISO timestamp
  source: "codette_ai"
}
```

### Suggestions Response
```typescript
{
  success: boolean;
  suggestions: Array<{
    id: string;
    title: string;
    description: string;
    type: "effect" | "eq" | "compression" | etc;
    confidence: number;      // 0-1
    category: string;
  }>;
  timestamp: string;
}
```

### Analysis Response
```typescript
{
  status: "success" | "error";
  analysis: {
    overall_health: number;  // 0-1
    issues: string[];
    recommendations: string[];
    metrics: {
      peak_level: number;
      loudness_lufs: number;
      dynamic_range: number;
    };
  };
  timestamp: string;
}
```

### Cache Stats Response
```typescript
{
  status: "success";
  cache_stats: {
    entries: number;
    ttl_seconds: number;
    hits: number;
    misses: number;
    total_requests: number;
    hit_rate_percent: number;
    average_hit_latency_ms: number;
    average_miss_latency_ms: number;
    uptime_seconds: number;
  };
  timestamp: string;
}
```

---

## 6. Environment Variables Required

```bash
# Frontend (.env or .env.local)
VITE_CODETTE_API=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend (.env in root directory)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Recommended for backend
```

---

## 7. Common Integration Scenarios

### Scenario 1: Add AI Suggestions to Mixer Panel

```typescript
// MixerPanel.tsx
import { useDAW } from "../contexts/DAWContext";
import { getCodetteBridge } from "../lib/codetteBridge";

function MixerPanel() {
  const { selectedTrack } = useDAW();
  const [suggestions, setSuggestions] = useState([]);
  const bridge = getCodetteBridge();
  
  useEffect(() => {
    if (!selectedTrack) return;
    
    async function loadSuggestions() {
      try {
        const result = await bridge.getSuggestions(
          {
            type: "mixing",
            track_type: selectedTrack.type,
            mood: "neutral"
          }
        );
        setSuggestions(result.suggestions);
      } catch (error) {
        console.warn("Could not load suggestions:", error);
      }
    }
    
    loadSuggestions();
  }, [selectedTrack?.id, bridge]);
  
  return (
    <div className="mixer-panel">
      <h3>{selectedTrack?.name}</h3>
      <div className="suggestions">
        {suggestions.map(suggestion => (
          <div key={suggestion.id} className="suggestion">
            <strong>{suggestion.title}</strong>
            <p>{suggestion.description}</p>
            <small>Confidence: {(suggestion.confidence * 100).toFixed(0)}%</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MixerPanel;
```

### Scenario 2: Add Analysis Panel

```typescript
// AnalysisPanel.tsx
function AnalysisPanel() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  
  async function analyzeSession() {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/analyze/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Session data here
        })
      });
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="analysis-panel">
      <button onClick={analyzeSession} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Session"}
      </button>
      {analysis && (
        <div className="results">
          <h3>Analysis Results</h3>
          <p>Overall Health: {(analysis.overall_health * 100).toFixed(0)}%</p>
          <ul>
            {analysis.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default AnalysisPanel;
```

---

## 8. Debugging Tips

### Enable Verbose Logging

```typescript
// Add to your app initialization
const bridge = getCodetteBridge();

// Log all events
["connected", "disconnected", "transport_changed", "suggestion_received"].forEach(event => {
  bridge.on(event, (data) => {
    console.log(`[CodetteBridge] ${event}:`, data);
  });
});
```

### Check Server Health

```bash
# Terminal
curl http://localhost:8000/health
curl http://localhost:8000/api/diagnostics/status
curl http://localhost:8000/api/diagnostics/endpoints
```

### Monitor WebSocket

```javascript
// Browser DevTools
// Go to Network tab, filter by WS, click /ws connection to monitor
// Look for messages in "Messages" tab
```

### Check Cache Performance

```bash
curl http://localhost:8000/api/cache-stats
```

---

## 9. Troubleshooting Matrix

| Problem | Cause | Solution |
|---------|-------|----------|
| 404 Not Found | Endpoint doesn't exist | Check `/api/diagnostics/endpoints` |
| Connection refused | Server not running | Start `python codette_server_unified.py` |
| WebSocket failed | CORS issue | Verify CORS in server config |
| Suggestions always empty | No AI context | Ensure track_type is set correctly |
| Cache never hits | TTL too short | Increase TTL in server cache config |
| High latency (>500ms) | Network/server load | Check `/api/diagnostics/performance` |
| Reconnection loop | Max retries exceeded | Check `/api/diagnostics/status` |

---

**End of Integration Guide**

For additional information, see:
- `DAW_UI_SERVER_VERIFICATION_REPORT.md`
- `src/lib/codetteBridge.ts` (source code)
- `src/lib/codetteBridgeService.ts` (source code)
- `codette_server_unified.py` (server source)
