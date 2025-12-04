# WebSocket API Documentation

## Endpoint
```
ws://localhost:8000/ws
```

## Connection Flow

1. **Connect**: Client establishes WebSocket connection
2. **Welcome**: Server sends connection confirmation
3. **Exchange**: Bi-directional message exchange
4. **Disconnect**: Either side can close connection

## Message Format

All messages are JSON objects with a `type` field:

```typescript
interface WebSocketMessage {
  type: string;
  [key: string]: any;
}
```

## Message Types

### Client ? Server

#### 1. Ping
Keep connection alive

```json
{
  "type": "ping"
}
```

**Response**:
```json
{
  "type": "pong",
  "timestamp": "2025-12-03T21:00:00.000Z"
}
```

#### 2. Chat
Send message to Codette AI

```json
{
  "type": "chat",
  "message": "How should I mix vocals?",
  "perspective": "mix_engineering",
  "daw_context": {
    "tracks": [...],
    "selected_track": {...}
  }
}
```

**Response**:
```json
{
  "type": "chat_response",
  "response": "For mixing vocals, start with...",
  "perspective": "mix_engineering",
  "confidence": 0.85,
  "timestamp": "2025-12-03T21:00:00.000Z"
}
```

#### 3. Status
Request server status

```json
{
  "type": "status"
}
```

**Response**:
```json
{
  "type": "status_response",
  "status": "ok",
  "codette_available": true,
  "engine_type": "codette_new.Codette",
  "memory_size": 42,
  "active_connections": 3,
  "timestamp": "2025-12-03T21:00:00.000Z"
}
```

#### 4. Analyze
Request audio analysis

```json
{
  "type": "analyze",
  "track_data": {
    "track_id": "track_001",
    "track_name": "Lead Vocal",
    "track_type": "vocal",
    "muted": false,
    "soloed": false
  },
  "audio_data": {
    "peak_level": -6.0,
    "rms_level": -18.0,
    "duration": 120.5,
    "sample_rate": 44100
  },
  "analysis_type": "spectrum"
}
```

**Response**:
```json
{
  "type": "analysis_response",
  "status": "success",
  "trackId": "track_001",
  "analysis": {
    "analysis_type": "spectrum",
    "codette_insights": "Your vocal track shows...",
    "mixing_suggestions": [
      "Apply high-pass filter at 80Hz",
      "Boost presence around 3-5kHz",
      "Add subtle compression (4:1 ratio)"
    ],
    "quality_score": 0.85
  },
  "timestamp": "2025-12-03T21:00:00.000Z"
}
```

### Server ? Client

#### Connection
Sent immediately after connection

```json
{
  "type": "connection",
  "status": "connected",
  "message": "Connected to Codette AI Unified Server",
  "codette_available": true,
  "timestamp": "2025-12-03T21:00:00.000Z"
}
```

#### Error
Sent when an error occurs

```json
{
  "type": "error",
  "message": "Invalid JSON format",
  "timestamp": "2025-12-03T21:00:00.000Z"
}
```

## TypeScript Client Example

```typescript
// src/lib/codetteBridge.ts
class CodetteWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket('ws://localhost:8000/ws');
      
      this.ws.onopen = () => {
        console.log('? WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };
      
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };
      
      this.ws.onerror = (error) => {
        console.error('? WebSocket error:', error);
        reject(error);
      };
      
      this.ws.onclose = () => {
        console.log('?? WebSocket disconnected');
        this.reconnect();
      };
    });
  }
  
  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      throw new Error('WebSocket not connected');
    }
  }
  
  sendChat(message: string, perspective?: string, dawContext?: any): void {
    this.send({
      type: 'chat',
      message,
      perspective: perspective || 'mix_engineering',
      daw_context: dawContext
    });
  }
  
  requestStatus(): void {
    this.send({ type: 'status' });
  }
  
  analyzeTrack(trackData: any, audioData: any, analysisType: string): void {
    this.send({
      type: 'analyze',
      track_data: trackData,
      audio_data: audioData,
      analysis_type: analysisType
    });
  }
  
  private handleMessage(message: any): void {
    switch (message.type) {
      case 'connection':
        console.log('?? Connected:', message.message);
        break;
      case 'pong':
        console.log('?? Pong received');
        break;
      case 'chat_response':
        this.onChatResponse?.(message);
        break;
      case 'status_response':
        this.onStatusUpdate?.(message);
        break;
      case 'analysis_response':
        this.onAnalysisResult?.(message);
        break;
      case 'error':
        console.error('? Server error:', message.message);
        break;
      default:
        console.warn('??  Unknown message type:', message.type);
    }
  }
  
  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      setTimeout(() => this.connect(), delay);
    }
  }
  
  // Event handlers (set by consumer)
  onChatResponse?: (message: any) => void;
  onStatusUpdate?: (message: any) => void;
  onAnalysisResult?: (message: any) => void;
  
  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}

// Usage
const codette = new CodetteWebSocket();
await codette.connect();

codette.onChatResponse = (message) => {
  console.log('Codette says:', message.response);
};

codette.sendChat('How should I mix drums?');
```

## Python Client Example

```python
import asyncio
import websockets
import json

async def chat_with_codette():
    uri = "ws://localhost:8000/ws"
    
    async with websockets.connect(uri) as websocket:
        # Receive welcome
        welcome = await websocket.recv()
        print(f"Connected: {welcome}")
        
        # Send chat message
        await websocket.send(json.dumps({
            "type": "chat",
            "message": "How should I mix bass?",
            "perspective": "mix_engineering"
        }))
        
        # Receive response
        response = await websocket.recv()
        data = json.loads(response)
        print(f"Codette: {data['response']}")

asyncio.run(chat_with_codette())
```

## Error Handling

### Connection Errors
- Server not running ? `ECONNREFUSED`
- Network issues ? Automatic reconnection with exponential backoff
- Max reconnects exceeded ? Show error to user

### Message Errors
- Invalid JSON ? Server responds with `{"type": "error", "message": "Invalid JSON format"}`
- Unknown type ? Server responds with `{"type": "error", "message": "Unknown message type: xyz"}`
- Processing error ? Server responds with error details

## Best Practices

1. **Always handle connection lifecycle**
   - Implement reconnection logic
   - Show connection status to user
   - Queue messages during disconnection

2. **Use ping/pong for keepalive**
   - Send ping every 30 seconds
   - Expect pong within 5 seconds
   - Reconnect if no pong received

3. **Handle all message types**
   - Don't assume message structure
   - Validate response format
   - Log unknown message types

4. **Provide user feedback**
   - Show "connecting..." state
   - Display connection errors
   - Indicate message send/receive

5. **Clean up on unmount**
   - Close WebSocket connection
   - Clear event handlers
   - Cancel pending requests

## Testing

### Test WebSocket Connection
```bash
python test_websocket.py
```

### Test with wscat (if installed)
```bash
npm install -g wscat
wscat -c ws://localhost:8000/ws

# Send message
> {"type": "ping"}
< {"type": "pong", "timestamp": "..."}

> {"type": "chat", "message": "Hello!"}
< {"type": "chat_response", "response": "..."}
```

## Monitoring

Server logs WebSocket events:
```
? WebSocket connected: 140237488123456 (total: 1)
?? WebSocket 140237488123456 received: chat
?? WebSocket disconnected: 140237488123456
?? WebSocket cleanup: 140237488123456 (remaining: 0)
```

## Troubleshooting

### "WebSocket connection failed"
- ? Check server is running: `http://localhost:8000/health`
- ? Verify CORS settings allow WebSocket upgrade
- ? Check firewall/antivirus blocking port 8000

### "Messages not received"
- ? Check message format (valid JSON)
- ? Verify `type` field is present
- ? Check server logs for errors

### "Connection drops frequently"
- ? Implement ping/pong keepalive
- ? Check network stability
- ? Verify server health (`/health` endpoint)

---

**Status**: ? **WebSocket API Active**
**Last Updated**: 2025-12-03
**Version**: 2.0.0
