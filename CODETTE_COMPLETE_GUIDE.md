# ?? Codette AI Integration - Complete Guide

CoreLogic Studio now features **Codette AI**, an advanced multi-perspective AI assistant for music production. This guide covers everything you need to get started.

## ? Quick Start (5 Minutes)

### 1. Start the Codette Backend Server

```bash
# Terminal 1: Start Codette FastAPI server
python codette_server_production.py

# Server starts on http://localhost:8000
# Check API docs: http://localhost:8000/docs
```

### 2. Open CoreLogic Studio DAW

```bash
# Terminal 2: Start React frontend
npm run dev

# Frontend starts on http://localhost:5173
```

### 3. Use Codette in TopBar

1. Look for the **purple Codette section** in the TopBar
2. Click **"Codette"** button to open full panel
3. Select tab: **AI**, **Analyze**, or **Control**
4. Click **"Run"** to execute suggestions

## ?? Features

### 1. **AI Suggestions** (Mixing Guidance)
- Real-time mixing recommendations
- Effect suggestions
- Level optimization
- Automatic parameter adjustments

**How to use:**
```
1. Select a track
2. Click "Codette" ? "AI" tab
3. Click "Run" for mixing suggestions
4. Codette auto-applies recommendations
```

### 2. **Analysis** (Session Diagnostics)
- Audio quality analysis
- Peak/RMS level detection
- Clipping detection
- Auto-fix capabilities

**How to use:**
```
1. Click "Codette" ? "Analyze" tab
2. Click "Run"
3. Review findings & recommendations
4. Codette auto-fixes issues (e.g., clipping)
```

### 3. **Control** (Routing Intelligence)
- Aux track suggestions
- Routing recommendations
- Bus configuration
- Flow optimization

**How to use:**
```
1. Click "Codette" ? "Control" tab
2. Click "Run"
3. Codette creates necessary tracks
4. Auto-routes for optimal flow
```

### 4. **Full Panel** (Interactive Chat)
- Multi-turn conversations
- Context-aware responses
- Effect parameter suggestions
- Creative direction

**How to open:**
```
Click purple "Codette" button in TopBar
? Opens expandable full panel
```

## ?? Architecture

```
???????????????????????????????????????????
?   React Frontend (CoreLogic Studio)    ?
?  - CodettePanel component              ?
?  - useCodette hook                     ?
?  - TopBar integration                  ?
???????????????????????????????????????????
                   ? HTTP REST + WebSocket
                   ?
???????????????????????????????????????????
?   FastAPI Backend (Codette Server)     ?
?  - /codette/chat                       ?
?  - /codette/analyze                    ?
?  - /codette/suggest                    ?
?  - /ws/codette (WebSocket)             ?
???????????????????????????????????????????
                   ? Python
                   ?
???????????????????????????????????????????
?   Codette AI Engine                    ?
?  - Multi-perspective reasoning          ?
?  - Music analysis algorithms            ?
?  - Suggestion generation                ?
???????????????????????????????????????????
```

## ?? API Reference

### Health Check
```bash
GET /health
```
Response: `{ "status": "healthy", "codette_available": true }`

### Chat (Get AI Response)
```bash
POST /codette/chat
Content-Type: application/json

{
  "message": "How should I process vocals?",
  "user_name": "Producer",
  "daw_context": {
    "bpm": 120,
    "tracks": 8
  }
}
```

### Analyze (Audio Analysis)
```bash
POST /codette/analyze

{
  "track_id": "track-123",
  "track_type": "audio",
  "analysis_type": "general"
}
```

### Suggest (Get Recommendations)
```bash
POST /codette/suggest

{
  "context": {
    "type": "mixing",
    "track_type": "vocal"
  },
  "limit": 5
}
```

### WebSocket (Real-Time)
```javascript
// Connect
const ws = new WebSocket('ws://localhost:8000/ws/codette');

// Send message
ws.send(JSON.stringify({
  type: 'chat',
  text: 'Analyze this track'
}));

// Listen for response
ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log(response.response);
};
```

## ?? UI Components

### CodettePanel Component
```typescript
import { CodettePanel } from '@/components/CodettePanel';

export function App() {
  const [showCodette, setShowCodette] = useState(false);

  return (
    <>
      <button onClick={() => setShowCodette(true)}>
        Open Codette
      </button>
      
      <CodettePanel
        isVisible={showCodette}
        onClose={() => setShowCodette(false)}
      />
    </>
  );
}
```

### useCodette Hook
```typescript
import { useCodette } from '@/hooks/useCodette';

export function MyComponent() {
  const {
    isConnected,
    isLoading,
    chatHistory,
    suggestions,
    error,
    sendMessage,
    getSuggestions,
    analyzeAudio,
  } = useCodette({ autoConnect: true });

  return (
    // Use hook in component
  );
}
```

### CodetteAIEngine
```typescript
import { getCodetteAIEngine } from '@/lib/codetteAIEngine';

const engine = getCodetteAIEngine('http://localhost:8000');

// Send message
const response = await engine.sendMessage(
  'How to mix vocals?',
  { bpm: 120 }
);

// Get suggestions
const suggestions = await engine.teachMixingTechniques('vocals');

// Analyze
const analysis = await engine.analyzeSessionHealth(tracks);
```

## ?? Configuration

### Environment Variables

Create `.env.local`:
```dotenv
# Codette Backend
VITE_CODETTE_API=http://localhost:8000
VITE_CODETTE_ENABLED=true

# Optional: API key for production
VITE_CODETTE_API_KEY=your_api_key

# Server Configuration
CODETTE_PORT=8000
CODETTE_HOST=0.0.0.0
```

### Server Configuration
```python
# In codette_server_production.py
port = int(os.getenv("CODETTE_PORT", "8000"))  # Default: 8000
host = os.getenv("CODETTE_HOST", "0.0.0.0")   # Default: 0.0.0.0
```

## ?? Perspectives

Codette analyzes music through **11 different perspectives**:

1. **Newtonian Logic** - Cause & effect reasoning
2. **Da Vinci Synthesis** - Creative analogies
3. **Human Intuition** - Practical experience-based
4. **Neural Networks** - Pattern recognition
5. **Quantum Logic** - Probabilistic optimization
6. **Resilient Kindness** - Empathetic feedback
7. **Mathematical Rigor** - Precise analysis
8. **Philosophical** - Deep understanding
9. **Copilot Developer** - Technical solutions
10. **Bias Mitigation** - Fair evaluation
11. **Psychological** - Cognitive insights

Each perspective brings unique insights to audio production!

## ?? Data Flow

### Suggestion Flow
```
User Action
    ?
TopBar/CodettePanel
    ?
useCodette hook
    ?
CodetteAIEngine (TypeScript)
    ?
HTTP POST /codette/suggest
    ?
FastAPI Server
    ?
Codette AI Engine (Python)
    ?
JSON Response with suggestions
    ?
DAWContext updates tracks
    ?
Audio Engine re-renders with changes
```

### Real-Time WebSocket Flow
```
WebSocket Connection
    ?
Client sends message
    ?
Server processes in real-time
    ?
Streaming response
    ?
Client updates UI instantly
```

## ?? Performance Tips

1. **Caching**: Codette caches similar queries (same message = instant response)
2. **WebSocket**: Use WS for real-time, REST for one-time requests
3. **Batch Requests**: Send multiple suggestions in one request
4. **Auto-Reconnect**: Backend auto-connects if server restarts
5. **Memory**: Clear history if app runs for extended periods

```typescript
// Clear cache when needed
engine.clearCache();

// Clear history
engine.clearHistory();
```

## ?? Troubleshooting

### Backend Not Connecting
```bash
# Check if server is running
curl http://localhost:8000/health

# If not, start it
python codette_server_production.py

# Check logs for errors
# Look for: "? Codette AI engine initialized"
```

### Suggestions Not Applying
```
1. Check if track is selected
2. Verify Codette connection (look for green dot in TopBar)
3. Check browser console for errors
4. Try clicking "Run" again
5. Restart both frontend and backend
```

### Slow Responses
```
1. Check network latency
2. Verify backend is running
3. Look for backend errors
4. Try WebSocket instead of REST
5. Clear cache: engine.clearCache()
```

### CORS Errors
```
Make sure CORS is enabled in codette_server_production.py:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    ...
)
```

## ?? Examples

### Example 1: Get Mixing Suggestions
```typescript
const { getSuggestions } = useCodette();

const suggestions = await getSuggestions('mixing');
// Returns: Array of mixing recommendations

suggestions.forEach(suggestion => {
  console.log(`${suggestion.title}: ${suggestion.description}`);
  // Example: "Add presence boost: Apply gentle EQ..."
});
```

### Example 2: Analyze and Auto-Fix
```typescript
const { analyzeAudio } = useCodette();

const analysis = await analyzeAudio(audioData, 'mixed');
// Returns: { findings, recommendations, metrics }

if (analysis.findings.includes('Some low-end rumble')) {
  // Apply high-pass filter automatically
  applyHPF(selectedTrack.id, 80);
}
```

### Example 3: Real-Time Chat
```typescript
const { sendMessage, chatHistory } = useCodette();

// Send chat message
const response = await sendMessage('How to get more presence in vocals?');
// Returns: "Consider boosting around 3-5kHz..."

// Access full history
chatHistory.forEach(msg => {
  console.log(`${msg.role}: ${msg.content}`);
});
```

### Example 4: Integration with DAWContext
```typescript
const { tracks, updateTrack } = useDAW();
const { getSuggestions } = useCodette();

// Get suggestions for all tracks
for (const track of tracks) {
  const suggestions = await getSuggestions(`track:${track.type}`);
  
  // Auto-apply first suggestion
  if (suggestions.length > 0) {
    const suggestion = suggestions[0];
    updateTrack(track.id, {
      volume: suggestion.parameters.volume,
      pan: suggestion.parameters.pan,
    });
  }
}
```

## ?? Security Notes

- In production, restrict CORS origins to your domain
- Use API keys if exposing backend publicly
- Sanitize user input before sending to backend
- Consider rate limiting for public deployments

## ?? Files Reference

### Frontend
- `src/components/CodettePanel.tsx` - Main UI component
- `src/hooks/useCodette.ts` - React hook
- `src/lib/codetteAIEngine.ts` - TypeScript engine
- `src/contexts/CodettePanelContext.tsx` - Panel state management
- `src/components/TopBar.tsx` - Integration point

### Backend
- `codette_server_production.py` - FastAPI server
- `Codette/codette_new.py` - AI engine
- `Codette/requirements.txt` - Python dependencies

## ?? Learning Path

1. **Beginner**: Open CodettePanel, try AI Suggestions tab
2. **Intermediate**: Use Analyze tab to learn about your mix
3. **Advanced**: Use Control tab to architect signal flow
4. **Expert**: Integrate with custom DAW automation

## ?? Support

For issues or questions:
1. Check API docs: `http://localhost:8000/docs`
2. Review console logs (browser & terminal)
3. Check backend server logs
4. Try restarting both frontend & backend
5. Clear browser cache & local storage

## ?? Next Steps

1. ? Start Codette server
2. ? Open CoreLogic Studio
3. ? Try AI suggestions on a track
4. ? Experiment with Analysis tab
5. ? Build custom workflows with Control tab
6. ? Integrate Codette into your production workflow!

---

**Version**: 1.0.0  
**Status**: Production Ready ?  
**Last Updated**: December 2025

Enjoy creating music with Codette AI! ??
