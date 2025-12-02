# Auto-Reconnection - Quick Reference

**TL;DR**: CodetteBridge now automatically detects backend downtime and reconnects with exponential backoff. No manual intervention needed.

## What Changed

### Before
- ❌ If backend went down, user got `ERR_CONNECTION_REFUSED` errors
- ❌ Had to manually refresh page or restart services
- ❌ Queued requests were lost

### After
- ✅ Backend downtime automatically detected
- ✅ Automatic reconnection with exponential backoff
- ✅ Requests queued and processed when back online
- ✅ Full transparency with console logging
- ✅ Zero changes required to components

## How It Works

### REST API Requests

```
Make request
    ↓
Is connected? → NO → Health check
    ↓ YES
Send to backend
    ↓
Got response? → YES → Done ✅
    ↓ NO
Queue request & trigger reconnect
    ↓
Wait 1s, 2s, 4s, 8s... (exponential)
    ↓
Retry health check
    ↓
Connected? → YES → Process queue ✅
    ↓ NO
Wait longer, try again
```

### WebSocket Connection

```
Try to connect
    ↓
Connection open? → YES → Ready for messages ✅
    ↓ NO
Wait 1s, try again
    ↓
Max 5 attempts reached? → YES → Fall back to REST ✅
    ↓ NO
Wait longer, retry
```

## Console Output Examples

### Successful Connection
```
[CodetteBridge] 🔌 Connecting to WebSocket: ws://localhost:8000/ws
[CodetteBridge] ✅ WebSocket connected successfully
[CodetteBridge] ✅ Codette AI Engine initialized
```

### Detecting Disconnect
```
[CodetteBridge] ❌ Failed to get transport state: TypeError: Failed to fetch
[CodetteBridge] 🔄 Reconnection attempt 1/10 in 1000ms
```

### Reconnecting
```
[CodetteBridge] 🔄 Reconnection attempt 1/10 in 1000ms
[CodetteBridge] 🔄 Reconnection attempt 2/10 in 2000ms
[CodetteBridge] 🔄 Reconnection attempt 3/10 in 4000ms
[CodetteBridge] ✅ Reconnected after 3 attempts
[CodetteBridge] Processing 5 queued requests
```

## Reconnection Timeline

| Attempt | Delay | Total Time |
|---------|-------|------------|
| 1 | 1s | 1s |
| 2 | 2s | 3s |
| 3 | 4s | 7s |
| 4 | 8s | 15s |
| 5 | 16s | 31s |
| 6 | 30s* | 61s* |
| 7-10 | 30s* | +30s per attempt |

*Capped at 30 seconds

## Developer Actions

### Listen for Connection Changes

```typescript
const bridge = getCodetteBridge();

bridge.on('connected', () => console.log('✅ Back online'));
bridge.on('disconnected', () => console.log('❌ Offline'));
bridge.on('reconnected', () => console.log('✅ Reconnected!'));
```

### Check Current Status

```typescript
const status = bridge.getConnectionStatus();
console.log(status);
// {
//   connected: true/false,
//   reconnectAttempts: 0,
//   isReconnecting: false,
//   timeSinceLastAttempt: 123
// }
```

### Force Reconnection Now

```typescript
await bridge.forceReconnect();
// Tries to reconnect immediately
```

### Check WebSocket

```typescript
const wsStatus = bridge.getWebSocketStatus();
// { connected, reconnectAttempts, maxAttempts, url }
```

## No Component Changes Needed

Existing code works as-is:

```typescript
// This works exactly the same, but now with auto-reconnection:
const response = await bridge.chat("hello");
const suggestions = await bridge.getSuggestions(context);
const analysis = await bridge.analyzeSession(state);

// All automatically handle reconnection behind the scenes!
```

## Real-World Scenarios

### Scenario 1: Backend Crashes During Use
```
User is editing → Backend crashes
    ↓
Bridge detects connection error
    ↓
Queues the request
    ↓
Shows "Reconnecting..." (via console)
    ↓
Backend comes back (5 seconds later)
    ↓
Bridge reconnects automatically
    ↓
Queued request completes
    ✅ User work restored, no intervention needed
```

### Scenario 2: Frontend Loads Before Backend
```
User starts app → Frontend loads but backend not ready yet
    ↓
Bridge attempts connection (fails)
    ↓
Shows "🔄 Reconnection attempt 1/10"
    ↓
Backend starts (after 2 seconds)
    ↓
Bridge's next health check succeeds
    ✅ Auto-connects without user doing anything
```

### Scenario 3: Temporary Network Issue
```
User makes request → Brief network hiccup
    ↓
Request fails once
    ↓
Bridge retries with exponential backoff
    ↓
Network restored
    ✅ Request succeeds on retry, user sees no error
```

## Configuration

To customize retry behavior, modify in `src/lib/codetteBridge.ts`:

```typescript
class CodetteBridge {
  private maxReconnectAttempts: number = 10;        // Try this many times
  private baseReconnectDelay: number = 1000;        // Start with 1 second
  private maxReconnectDelay: number = 30000;        // Don't wait more than 30s
  private maxWsReconnectAttempts: number = 5;       // WebSocket retry limit
}
```

## UI Indicators (Optional)

You can add a visual indicator showing connection status:

```typescript
export function StatusIndicator() {
  const [connected, setConnected] = useState(true);
  
  useEffect(() => {
    const bridge = getCodetteBridge();
    bridge.on('disconnected', () => setConnected(false));
    bridge.on('connected', () => setConnected(true));
  }, []);

  return (
    <div className={`status-badge ${connected ? 'online' : 'offline'}`}>
      {connected ? '🟢 Online' : '🔴 Offline - Reconnecting...'}
    </div>
  );
}
```

## Debugging

### Check current queue
```typescript
const bridge = getCodetteBridge();
const queueStatus = bridge.getQueueStatus();
console.log(`${queueStatus.queueSize} requests queued`);
```

### Simulate offline state
```bash
# Kill backend
taskkill /F /IM python.exe

# Make a request in app
# Bridge queues it

# Start backend again
python codette_server_unified.py

# Bridge auto-reconnects and processes queue
```

### Monitor reconnection attempts
```
Open DevTools → Console tab → Watch for [CodetteBridge] logs
```

## FAQ

**Q: What if backend never comes back?**
A: After 10 reconnection attempts (max 5 minutes), bridge stops trying and emits `max_reconnect_attempts_reached` event. User can manually retry with `forceReconnect()`.

**Q: Are queued requests lost if I refresh the page?**
A: Yes. The queue only exists in memory. However, on next page load, fresh requests are made to backend.

**Q: How do I know if something's in the queue?**
A: Check console logs or call `bridge.getQueueStatus()`.

**Q: Can I adjust retry timing?**
A: Yes, edit `maxReconnectAttempts`, `baseReconnectDelay`, `maxReconnectDelay` in the CodetteBridge class.

**Q: Does this affect performance?**
A: Minimal. Health checks run every 30 seconds (1 request). WebSocket is persistent. Zero overhead when everything's working.

**Q: What about WebSocket?**
A: Works independently with same reconnection logic. Falls back to REST if WebSocket fails.

---

**Production Ready**: ✅ Yes  
**Breaking Changes**: ❌ No  
**TypeScript**: ✅ Clean  
**Browser Support**: ✅ All modern browsers
