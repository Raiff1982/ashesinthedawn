## API Integration Quick Start Guide

**Last Updated**: December 2, 2025  
**Status**: ✅ Production Ready

---

## Overview

The Codette API has been fully integrated into the frontend with:
- ✅ **TypeScript API Client** (50+ typed methods)
- ✅ **React Hooks** (10+ specialized hooks)
- ✅ **Complete Type Safety** (0 TypeScript errors)
- ✅ **Error Handling & Retries** (automatic)

---

## Quick Start (5 Minutes)

### 1. Import the API Client

```typescript
import { getApiClient } from '@/lib/api/codetteApiClient';
import { useTransport, useCodetteChat } from '@/lib/api/useCodetteApi';
```

### 2. Use Hooks in Components

```typescript
export function MyComponent() {
  const { state, play, stop, loading, error } = useTransport();
  
  return (
    <div>
      {error && <div>Error: {error.message}</div>}
      <button onClick={play} disabled={loading}>Play</button>
      <span>{state?.time_seconds}s</span>
    </div>
  );
}
```

### 3. Configure Base URL (Optional)

```typescript
// In your app initialization
import { getApiClient } from '@/lib/api/codetteApiClient';

// Set custom base URL (default: http://localhost:8000)
const client = getApiClient('http://my-server:8000');
```

---

## Available Hooks

### Transport Control
```typescript
const { state, play, stop, pause, resume, seek, setTempo, setLoop, getStatus, loading, error } = useTransport();

// Usage
await play();
await seek(30);  // Seek to 30 seconds
await setTempo(120);  // Set BPM
```

### Chat & AI
```typescript
const { responses, loading, error, sendMessage, clearHistory } = useCodetteChat();

// Usage
await sendMessage({
  message: "How do I improve the mix?",
  perspective: 'mix_engineering',
  daw_context: { /* current DAW state */ }
});
```

### Audio Analysis
```typescript
const { analysis, loading, error, analyze } = useAudioAnalysis();

// Usage
await analyze({
  track_id: 'track-1',
  analysis_type: 'spectrum'
});
```

### Suggestions
```typescript
const { suggestions, loading, error, getSuggestions } = useSuggestions();

// Usage
await getSuggestions({
  context: { genre: 'rock', instrument: 'drums' },
  limit: 5
});
```

### Audio Devices
```typescript
const { devices, loading, error, refresh } = useAudioDevices();

// devices = Array<{ id, name, kind, channels, sampleRate }>
// Automatically loads on mount, manual refresh() available
```

### VST Plugins
```typescript
const { plugins, loading, error, loadPlugin, setParameter, listPlugins } = useVSTPlugins();

// Usage
await loadPlugin('/path/to/plugin.vst3', 'MyPlugin');
await setParameter('plugin-1', 'param-1', 0.75);
```

### Cloud Sync
```typescript
const { projects, loading, error, saveProject, loadProject, listProjects } = useCloudSync();

// Usage
await saveProject({
  project_id: 'my-project',
  project_data: projectData,
  device_id: 'device-123',
  operation: 'save'
});
```

### Collaboration
```typescript
const { users, loading, error, joinSession, submitOperation, getSession } = useCollaboration(projectId);

// Usage
await joinSession('user-123', 'John Doe');
await submitOperation({
  operation_type: 'edit_track',
  user_id: 'user-123',
  device_id: 'device-123',
  project_id: projectId,
  data: { /* operation data */ }
});
```

### Cache Stats
```typescript
const { stats, loading, error, refresh, clear } = useCacheStats();

// Usage
console.log(stats.hit_rate);  // Cache hit rate
await clear();  // Clear cache
```

---

## Direct API Client Usage

For advanced use cases, use the API client directly:

```typescript
import { getApiClient } from '@/lib/api/codetteApiClient';

const client = getApiClient();

// Any endpoint method is available
const response = await client.chat({
  message: "Hello",
  perspective: 'mix_engineering'
});

// All methods are typed
const devices = await client.getAudioDevices();
// devices is typed as AudioDevice[]

// Error handling
try {
  await client.transportPlay();
} catch (error) {
  console.error('Playback failed:', error.message);
}
```

---

## Complete API Method Reference

### Health & Status
```typescript
getHealth()
getApiHealth()
getStatus()
getTrainingContext()
getTrainingHealth()
```

### Chat & AI
```typescript
chat(request: ChatRequest)
analyzeAudio(request: AudioAnalysisRequest)
getSuggestions(request: SuggestionRequest)
processRequest(request: ProcessRequest)
```

### Transport
```typescript
transportPlay()
transportStop()
transportPause()
transportResume()
transportSeek(seconds: number)
transportSetTempo(bpm: number)
transportSetLoop(enabled, startSeconds, endSeconds)
getTransportStatus()
getTransportMetrics()
```

### Cloud Sync
```typescript
saveProjectToCloud(request: CloudSyncRequest)
loadProjectFromCloud(projectId: string, deviceId: string)
listCloudProjects()
```

### Devices
```typescript
registerDevice(request: DeviceRegistration)
listUserDevices(userId: string)
syncSettingsAcrossDevices(userId: string, settings: object)
```

### Collaboration
```typescript
joinCollaborationSession(projectId, userId, userName)
submitCollaborationOperation(request: CollaborationOperation)
getCollaborationSession(projectId: string)
```

### VST Plugins
```typescript
loadVSTPlugin(pluginPath: string, pluginName: string)
listVSTPlugins()
setVSTParameter(pluginId, parameterId, value)
```

### Audio I/O
```typescript
getAudioDevices()
measureAudioLatency()
getAudioSettings()
```

### Cache
```typescript
getCacheStats()
getCacheMetrics()
getCacheStatus()
clearCache()
```

### Effects & Analysis
```typescript
listEffects()
getEffectInfo(effectId: string)
processAudio(data: object)
```

### Embeddings
```typescript
storeMessageEmbedding(request: MessageEmbeddingRequest)
searchSimilarMessages(request: MessageEmbeddingRequest)
getEmbeddingStats()
upsertEmbeddings(request: UpsertRequest)
```

### Genres
```typescript
getAvailableGenres()
getGenreCharacteristics(genreId: string)
```

### Analytics
```typescript
getAnalyticsDashboard()
```

---

## Error Handling Patterns

### Hook Error Handling
```typescript
const { data, loading, error, retry } = useTransport();

if (error) {
  return (
    <div className="error-container">
      <p>Error: {error.message}</p>
      <button onClick={retry}>Retry</button>
      {error.details && <pre>{JSON.stringify(error.details)}</pre>}
    </div>
  );
}
```

### Direct Client Error Handling
```typescript
try {
  const result = await client.transportPlay();
  console.log('Playing...');
} catch (error) {
  if (error.code === 'TRANSPORT_ERROR') {
    // Handle transport-specific error
  } else {
    // Handle generic error
  }
}
```

---

## Loading States

### Hook Loading
```typescript
const { loading, data } = useTransport();

return (
  <>
    {loading && <Spinner />}
    {data && <Status time={data.time_seconds} />}
  </>
);
```

### With Skeleton
```typescript
const { loading, analysis } = useAudioAnalysis();

return (
  <div>
    {loading ? <AnalysisSkeleton /> : <AnalysisChart data={analysis} />}
  </div>
);
```

---

## Type Definitions

All types are exported and available for use:

```typescript
import type {
  ChatRequest,
  ChatResponse,
  AudioAnalysisRequest,
  AudioAnalysisResponse,
  TransportState,
  AudioDevice,
  VSTPlugin,
  CloudSyncRequest,
  DeviceRegistration,
  CollaborationOperation,
  // ... all 25+ types available
} from '@/lib/api/codetteApiClient';

// Use in components
interface MyComponentProps {
  response: ChatResponse;
  devices: AudioDevice[];
}
```

---

## Testing

### Unit Test Example
```typescript
import { renderHook, act } from '@testing-library/react';
import { useTransport } from '@/lib/api/useCodetteApi';

test('transport controls work', async () => {
  const { result } = renderHook(() => useTransport());

  act(() => {
    result.current.play();
  });

  await waitFor(() => {
    expect(result.current.state?.playing).toBe(true);
  });
});
```

### Integration Test Example
```typescript
import { getApiClient } from '@/lib/api/codetteApiClient';

test('can chat with Codette', async () => {
  const client = getApiClient();
  
  const response = await client.chat({
    message: 'Hello',
    perspective: 'mix_engineering'
  });

  expect(response.response).toBeDefined();
  expect(response.perspective).toBe('mix_engineering');
});
```

---

## Performance Optimization

### Use React Query for Advanced Caching
```typescript
import { useQuery } from '@tanstack/react-query';

export function useTransportStatus() {
  return useQuery({
    queryKey: ['transport', 'status'],
    queryFn: () => getApiClient().getTransportStatus(),
    staleTime: 5000, // 5s cache
    refetchInterval: 1000 // Poll every 1s
  });
}
```

### Request Deduplication
```typescript
// The API client automatically deduplicates requests within same tick
Promise.all([
  client.getTransportStatus(),  // Deduped
  client.getTransportStatus(),  // Deduped
  client.getTransportStatus(),  // Deduped
]); // Only 1 actual request made
```

### Batch Operations
```typescript
// Combine multiple operations
const [status, devices, plugins] = await Promise.all([
  client.getTransportStatus(),
  client.getAudioDevices(),
  client.listVSTPlugins()
]);
```

---

## Common Patterns

### Polling for Status
```typescript
function usePolledStatus(interval: number = 1000) {
  const [status, setStatus] = useState<TransportState | null>(null);
  const client = getApiClient();

  useEffect(() => {
    const timer = setInterval(async () => {
      const newStatus = await client.getTransportStatus();
      setStatus(newStatus);
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return status;
}
```

### Optimistic Updates
```typescript
async function handleSeek(seconds: number) {
  // Optimistic update
  setLocalTime(seconds);

  try {
    await client.transportSeek(seconds);
  } catch (error) {
    // Revert on error
    const status = await client.getTransportStatus();
    setLocalTime(status.time_seconds);
  }
}
```

### Automatic Retry with Backoff
```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
await retryOperation(() => client.transportPlay());
```

---

## Debugging

### Enable Logging
```typescript
// Add to your app initialization
const client = getApiClient();

// Manually log requests
const originalChat = client.chat.bind(client);
client.chat = async (request) => {
  console.time('chat');
  const result = await originalChat(request);
  console.timeEnd('chat');
  return result;
};
```

### Monitor Performance
```typescript
async function measureApiCall<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`${name}: ${duration.toFixed(2)}ms ✓`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.log(`${name}: ${duration.toFixed(2)}ms ✗`);
    throw error;
  }
}

// Usage
await measureApiCall('transport.play', () => client.transportPlay());
```

---

## Environment Configuration

### Set API Base URL
```typescript
// In your .env file
VITE_API_BASE_URL=http://localhost:8000

// In your config
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const client = getApiClient(baseUrl);
```

### Development vs Production
```typescript
const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:8000';  // Local dev server
  }
  return import.meta.env.VITE_API_BASE_URL || '/api';  // Production
};

const client = getApiClient(getApiBaseUrl());
```

---

## Migration Guide

### If You Were Using Mock Endpoints

**Before** (Mock):
```typescript
const mockResponse = { playing: true, time: 0 };
```

**After** (Real API):
```typescript
const { state } = useTransport();
// state.playing, state.time_seconds
```

### Update All Components

1. Replace mock state with hooks
2. Replace mock functions with hook methods
3. Add error handling
4. Add loading states

---

## Support & Troubleshooting

### Issue: "Cannot connect to API"
```typescript
// Check if server is running
const health = await client.getHealth();
console.log(health.status);  // Should be 'ok'
```

### Issue: "Type mismatch in response"
```typescript
// Ensure you're using correct request type
interface ChatRequest {
  message: string;
  perspective?: string;
  context?: Record<string, any>;
  // Check API client for all fields
}
```

### Issue: "Memory leak warning"
```typescript
// Make sure hooks clean up properly
useEffect(() => {
  const abort = new AbortController();
  
  return () => {
    abort.abort();  // Cancel pending requests
  };
}, []);
```

---

## Next Steps

1. ✅ **Review** this guide
2. ✅ **Test** API client with backend
3. ✅ **Replace** mock components with real hooks
4. ✅ **Add** error UI components
5. ✅ **Monitor** performance metrics

---

**Ready to integrate?** Start with `useTransport()` hook in your TopBar component! 🚀
