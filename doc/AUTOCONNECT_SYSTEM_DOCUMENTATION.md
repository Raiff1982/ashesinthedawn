# CodetteBridge Auto-Reconnection System

**Date**: December 1, 2025
**Version**: 2.1.0
**Status**: ✅ Implemented and TypeScript clean

## Overview

The CodetteBridge service now includes a comprehensive auto-reconnection system that handles backend connectivity issues gracefully. The system automatically detects connection failures and attempts to reconnect with exponential backoff.

## Key Features

### 1. **Automatic Health Checks**
- Periodic health checks every 30 seconds
- Quick detection of backend availability
- Automatic triggering of reconnection attempts on failure

```typescript
// Health check runs automatically
// Detects if backend is responsive
// Triggers reconnection if needed
```

### 2. **Exponential Backoff Reconnection**
- Base delay: 1 second
- Maximum delay: 30 seconds
- Formula: `delay = min(baseDelay * 2^(attemptCount), maxDelay)`
- Max attempts: 10 retries

**Reconnection Timeline:**
```
Attempt 1:  1 second
Attempt 2:  2 seconds
Attempt 3:  4 seconds
Attempt 4:  8 seconds
Attempt 5:  16 seconds
Attempt 6:  30 seconds (capped)
...continues up to 10 attempts
```

### 3. **Request Queueing**
- Failed requests are automatically queued
- Queued requests are processed when connection restored
- Up to 5 retry attempts per request
- Automatic cleanup of abandoned requests

### 4. **Dual Connection Modes**
- **REST API**: Immediate responses for most operations
- **WebSocket**: Real-time updates and transport state
- Automatic fallback if WebSocket unavailable
- Independent reconnection logic for each

### 5. **WebSocket Reconnection**
- Max 5 reconnection attempts
- Same exponential backoff as REST
- Automatic message handling on reconnect
- Graceful degradation if WebSocket fails

## Usage

### Check Connection Status

```typescript
import { getCodetteBridge } from './lib/codetteBridge';

const bridge = getCodetteBridge();

// Get detailed connection status
const status = bridge.getConnectionStatus();
console.log(status);
// Output:
// {
//   connected: boolean,
//   reconnectAttempts: number,
//   isReconnecting: boolean,
//   lastAttempt: number,
//   timeSinceLastAttempt: number
// }
```

### Listen for Connection Events

```typescript
const bridge = getCodetteBridge();

// Connection established
bridge.on('connected', (data) => {
  console.log('✅ Connected to backend', data);
  // Process queued requests, update UI, etc.
});

// Connection lost
bridge.on('disconnected', () => {
  console.log('❌ Connection lost');
  // Show offline indicator, disable certain UI elements
});

// Reconnection successful
bridge.on('reconnected', (data) => {
  console.log('✅ Reconnected after', data.attempts, 'attempts');
  // Restore full functionality
});

// Max reconnection attempts reached
bridge.on('max_reconnect_attempts_reached', (data) => {
  console.log('❌ Max attempts reached', data.attempts);
  // Show error message, offer manual retry
});

// WebSocket connected
bridge.on('ws_connected', (connected) => {
  if (connected) {
    console.log('🔌 WebSocket connected');
  } else {
    console.log('❌ WebSocket disconnected');
  }
});

// WebSocket ready for use
bridge.on('ws_ready', (data) => {
  console.log('✅ WebSocket ready', data.status);
});
```

### Manual Reconnection

```typescript
// Force immediate reconnection
const connected = await bridge.forceReconnect();
if (connected) {
  console.log('✅ Reconnected successfully');
} else {
  console.log('❌ Reconnection failed');
}

// Force WebSocket reconnection
const wsConnected = await bridge.forceWebSocketReconnect();
if (wsConnected) {
  console.log('✅ WebSocket reconnected');
} else {
  console.log('❌ WebSocket reconnection failed');
}
```

### Get WebSocket Status

```typescript
const wsStatus = bridge.getWebSocketStatus();
console.log(wsStatus);
// Output:
// {
//   connected: boolean,
//   reconnectAttempts: number,
//   maxAttempts: number,
//   url: string
// }
```

### Queue Status

```typescript
const queueStatus = bridge.getQueueStatus();
console.log(queueStatus);
// Output:
// {
//   queueSize: number,
//   oldestRequest?: number (timestamp)
// }
```

## Automatic Features

### 1. **Request-Based Auto-Retry**
```typescript
// This call automatically handles:
// ✅ Health check before request
// ✅ Retry on 5xx errors (max 3 times)
// ✅ Exponential backoff between retries
// ✅ Request queueing on connection failure
// ✅ Auto-reconnection if needed
const response = await bridge.chat("Hello");
```

### 2. **Connection Detection**
When a request fails:
1. Bridge detects connection issue
2. Triggers `attemptReconnect()`
3. Waits exponential backoff time
4. Retries health check
5. If successful: processes queued requests
6. If failed: schedules next attempt

### 3. **Queue Processing**
When connection restored:
1. Bridge detects successful health check
2. Processes all queued requests in order
3. Retries with exponential backoff per request
4. Cleans up successfully processed requests
5. Keeps failed requests for next attempt

## Configuration

Edit class properties to customize behavior:

```typescript
// In CodetteBridge class
private maxReconnectAttempts: number = 10;              // Max retry attempts
private baseReconnectDelay: number = 1000;              // 1 second base
private maxReconnectDelay: number = 30000;              // 30 second max
private maxWsReconnectAttempts: number = 5;             // WebSocket max retries
private wsReconnectDelay: number = 1000;                // WebSocket base delay
```

## Lifecycle

### Page Load
```
1. Bridge created
2. Health check initialized (starts periodic checks)
3. WebSocket connection attempted
4. If fails: starts reconnection loop
```

### During Operation
```
1. User makes API request
2. Health check performed first
3. If healthy: request sent
4. If unhealthy: reconnection attempted
5. Queue request for later
6. Continue with next request
```

### On Connection Loss
```
1. Detect failed request
2. Emit 'disconnected' event
3. Start exponential backoff timer
4. Attempt health check after delay
5. If successful: process queued requests, emit 'reconnected'
6. If failed: schedule next attempt
```

### Graceful Shutdown
```typescript
// Clean up resources before page unload
const bridge = getCodetteBridge();
bridge.destroy();
// Clears intervals, closes WebSocket, clears listeners
```

## Console Logging

The bridge includes detailed console logging for debugging:

```
[CodetteBridge] ✅ Connected to backend
[CodetteBridge] ❌ Disconnected
[CodetteBridge] 🔄 Reconnection attempt 1/10 in 1000ms
[CodetteBridge] ✅ Reconnected after 2 attempts
[CodetteBridge] 🔌 Connecting to WebSocket: ws://localhost:8000/ws
[CodetteBridge] ✅ WebSocket connected successfully
[CodetteBridge] 🔄 WebSocket reconnecting in 2000ms (attempt 2/5)
[CodetteBridge] Processing 3 queued requests
[CodetteBridge] 🌐 Force reconnect initiated
```

## Error Handling

### Network Errors
- Automatically queued
- Triggers reconnection
- Emits 'disconnected' event
- User can see offline indicator

### API Errors (5xx)
- Automatic retry up to 3 times
- Exponential backoff: 1s, 2s, 4s
- Queued if all retries fail

### WebSocket Errors
- Logged but don't affect REST API
- Automatic reconnection with backoff
- Falls back to REST for critical operations

### Max Attempts Reached
- Emits 'max_reconnect_attempts_reached' event
- Shows error to user
- Allows manual retry via `forceReconnect()`

## React Integration Example

```typescript
import { useEffect, useState } from 'react';
import { getCodetteBridge } from './lib/codetteBridge';

export function ConnectionIndicator() {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const bridge = getCodetteBridge();

    bridge.on('connected', () => {
      setStatus('connected');
      setAttempts(0);
    });

    bridge.on('disconnected', () => {
      setStatus('disconnected');
    });

    bridge.on('reconnected', (data) => {
      setStatus('connected');
      setAttempts(0);
    });

    bridge.on('max_reconnect_attempts_reached', (data) => {
      setStatus('disconnected');
      setAttempts(data.attempts);
    });

    return () => {
      bridge.off('connected', () => {});
      bridge.off('disconnected', () => {});
      bridge.off('reconnected', () => {});
      bridge.off('max_reconnect_attempts_reached', () => {});
    };
  }, []);

  return (
    <div className={`status-indicator ${status}`}>
      {status === 'connected' && '✅ Connected'}
      {status === 'connecting' && '🔄 Connecting...'}
      {status === 'disconnected' && `❌ Offline (${attempts}/10 attempts)`}
    </div>
  );
}
```

## Testing

### Simulate Backend Offline
```bash
# Stop backend server
taskkill /F /IM python.exe

# Bridge will:
# 1. Detect connection failure on next request
# 2. Emit 'disconnected' event
# 3. Start exponential backoff reconnection
# 4. Queue pending requests
# 5. Show in console: "[CodetteBridge] 🔄 Reconnection attempt 1/10 in 1000ms"
```

### Test Manual Reconnection
```typescript
const bridge = getCodetteBridge();
const connected = await bridge.forceReconnect();
// Will attempt immediate reconnection regardless of current state
```

### Test Request Queueing
```typescript
// 1. Stop backend
// 2. Make API calls while offline
// 3. Bridge queues them
// 4. Start backend again
// 5. Bridge processes queued requests automatically
```

## Performance Impact

- **Health checks**: 1 request every 30 seconds (minimal)
- **Memory overhead**: ~1KB per queued request
- **WebSocket**: Persistent connection, minimal bandwidth
- **CPU**: Negligible (timers only)

## Benefits

1. ✅ **Transparent to Components**: Works silently in background
2. ✅ **Resilient**: Handles temporary connection issues gracefully
3. ✅ **User-Friendly**: No lost work, automatic recovery
4. ✅ **Debuggable**: Detailed console logging for troubleshooting
5. ✅ **Configurable**: Adjust retry strategy as needed
6. ✅ **TypeScript Safe**: Full type safety and IntelliSense

## Future Enhancements

- [ ] Priority-based queue processing
- [ ] Request deduplication
- [ ] Connection quality metrics
- [ ] Adaptive retry strategy
- [ ] Analytics/telemetry
- [ ] Circuit breaker pattern

---

**Status**: ✅ Production Ready
**Last Updated**: 2025-12-01
**TypeScript Errors**: 0
