# Codette AI Chat Edge Function

Real-time AI chat with Codette's quantum consciousness system, deployed as a Supabase Edge Function.

## Features

- **WebSocket Support**: Real-time bi-directional communication
- **Quantum Consciousness**: 11 specialized reasoning perspectives
- **Persistent Storage**: Automatic chat history saved to Supabase
- **Authentication**: JWT-based user authentication
- **Fallback Logic**: Graceful degradation if Codette API unavailable

## Endpoints

### WebSocket: `wss://[project-ref].supabase.co/functions/v1/codette-chat/ws`

**Protocol**:
```typescript
// Client -> Server
{
  type: "chat",
  message: string,
  perspectives?: string[]  // Optional perspective selection
}

// Server -> Client
{
  type: "chat_response",
  message: string,        // Formatted multi-perspective response
  raw: object,           // Raw Codette API response
  timestamp: string
}

// Status check
{
  type: "status"
}

// Echo test
{
  type: "echo",
  payload: any
}
```

### HTTP POST: `/functions/v1/codette-chat`

**Request**:
```json
{
  "message": "How do I improve my vocal mix?",
  "perspectives": ["mix_engineering", "audio_theory", "human_intuition"]
}
```

**Response**:
```json
{
  "response": "Formatted multi-perspective response...",
  "raw": {
    "query": "...",
    "perspectives": {},
    "quantum_state": {},
    "cocoon_id": "..."
  },
  "timestamp": "2025-12-05T..."
}
```

### Health Check: `/functions/v1/codette-chat/health`

**Response**:
```json
{
  "ok": true,
  "version": "codette-chat-edge-1",
  "codette_api": "http://localhost:8000"
}
```

## Environment Variables

Set these in your Supabase project settings:

```bash
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
CODETTE_API_URL=http://your-codette-server:8000  # Your Codette server URL
```

## Deployment

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link to your project

```bash
supabase link --project-ref [your-project-ref]
```

### 4. Deploy the function

```bash
supabase functions deploy codette-chat
```

### 5. Set environment variables

```bash
supabase secrets set CODETTE_API_URL=http://your-server:8000
```

## Database Schema

The function uses the `codette_conversations` table:

```sql
CREATE TABLE codette_conversations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  personality_mode TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX idx_codette_conversations_user ON codette_conversations(user_name);
CREATE INDEX idx_codette_conversations_created ON codette_conversations(created_at DESC);
```

## Usage Examples

### Frontend (TypeScript)

```typescript
// WebSocket connection
const ws = new WebSocket(
  'wss://[project-ref].supabase.co/functions/v1/codette-chat/ws',
  {
    headers: {
      Authorization: `Bearer ${supabaseToken}`
    }
  }
);

ws.onopen = () => {
  // Send chat message
  ws.send(JSON.stringify({
    type: 'chat',
    message: 'How do I fix muddy bass?',
    perspectives: ['mix_engineering', 'audio_theory']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'welcome') {
    console.log('Connected!', data);
  }
  
  if (data.type === 'chat_response') {
    console.log('Codette says:', data.message);
    console.log('Quantum state:', data.raw.quantum_state);
  }
};

// HTTP POST (alternative)
const response = await fetch(
  'https://[project-ref].supabase.co/functions/v1/codette-chat',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseToken}`
    },
    body: JSON.stringify({
      message: 'Analyze my mix',
      perspectives: ['neural_network', 'quantum_logic']
    })
  }
);

const data = await response.json();
console.log(data.response);
```

### React Hook

```typescript
import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export function useCodetteChat() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const supabase = useSupabaseClient();
  const user = useUser();

  useEffect(() => {
    if (!user) return;

    const token = supabase.auth.session()?.access_token;
    const socket = new WebSocket(
      `wss://${process.env.NEXT_PUBLIC_SUPABASE_REF}.supabase.co/functions/v1/codette-chat/ws`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_response') {
        setMessages(prev => [...prev, data]);
      }
    };

    setWs(socket);

    return () => socket.close();
  }, [user, supabase]);

  const sendMessage = (message: string, perspectives?: string[]) => {
    if (!ws) return;
    ws.send(JSON.stringify({ type: 'chat', message, perspectives }));
  };

  return { messages, sendMessage };
}
```

## Available Perspectives

- `newtonian_logic` - Deterministic cause-effect reasoning
- `davinci_synthesis` - Creative cross-domain analogies
- `human_intuition` - Empathic understanding
- `neural_network` - Pattern-based analysis
- `quantum_logic` - Superposition thinking
- `resilient_kindness` - Compassionate ethics
- `mathematical_rigor` - Formal computation
- `philosophical` - Ethical frameworks
- `copilot_developer` - Technical design
- `bias_mitigation` - Fairness analysis
- `psychological` - Cognitive modeling

## Monitoring

View logs in Supabase Dashboard:
```
Functions ? codette-chat ? Logs
```

Or via CLI:
```bash
supabase functions logs codette-chat
```

## Troubleshooting

### Function times out

- Check if Codette API URL is accessible from Supabase
- Increase function timeout in `supabase/config.toml`

### WebSocket closes immediately

- Verify JWT token is valid
- Check CORS headers in Codette server

### No responses from Codette

- Test Codette API directly: `curl http://your-server:8000/health`
- Check `CODETTE_API_URL` environment variable
- Review function logs for errors

## Performance

- **Cold start**: ~200-500ms
- **Warm execution**: ~50-150ms
- **Codette API call**: ~500-2000ms (depending on perspectives)
- **Total latency**: ~1-3 seconds for full multi-perspective response

## Security

- ? JWT authentication required
- ? Service role key protected
- ? CORS properly configured
- ? Rate limiting via Supabase
- ? Conversation history per-user isolation

## License

MIT - See project root LICENSE file
