# Quick Start - Advanced Features

## 🚀 Getting Started with New Features

### 1. Cloud Sync (Save/Load Projects)

**Frontend Usage:**
```typescript
import { cloudSyncManager } from '../lib/cloudSync';

// Save current project to cloud
const result = await cloudSyncManager.saveProjectToCloud(project);
console.log('Saved:', result.success, result.hash);

// Load project from cloud
const loaded = await cloudSyncManager.loadProjectFromCloud('project-id');

// List all cloud projects
const projects = await cloudSyncManager.listCloudProjects();

// Auto-backup every 30 seconds
await cloudSyncManager.enableAutoBackup(project, 30000);
```

**API Endpoints:**
```
POST   /api/cloud-sync/save
GET    /api/cloud-sync/load/{project_id}
GET    /api/cloud-sync/list
DELETE /api/cloud-sync/delete/{project_id}
```

---

### 2. Multi-Device Support

**Python Backend Usage:**
```python
from daw_core.multidevice import get_multi_device_manager

manager = get_multi_device_manager(supabase_client)

# Register device
device = manager.register_device(
    device_name="Studio PC",
    device_type="desktop",
    platform="windows"
)

# List user devices
devices = manager.list_user_devices(user_id)

# Detect edit conflicts
conflicts = manager.detect_device_conflicts(project_id)
if conflicts['has_conflict']:
    print(f"{conflicts['device_count']} devices editing this project!")

# Broadcast settings
manager.sync_settings_across_devices(user_id, {"theme": "dark"})
```

**API Endpoints:**
```
POST /api/devices/register
GET  /api/devices/{user_id}
POST /api/devices/sync-settings
GET  /api/devices/{device_id}/sync-status
```

---

### 3. Real-Time Collaboration

**Python Backend Usage:**
```python
from daw_core.collaboration import get_collaboration_manager, OperationType, Operation
import uuid
from datetime import datetime, timezone

manager = get_collaboration_manager()

# Join session
session = manager.join_session(
    project_id="proj_123",
    user_id="user_1",
    device_id="device_1",
    user_name="Alice"
)

# Submit operation (e.g., volume change)
operation = Operation(
    operation_id=f"op_{uuid.uuid4()}",
    type=OperationType.VOLUME_CHANGE,
    user_id="user_1",
    device_id="device_1",
    project_id="proj_123",
    timestamp=datetime.now(timezone.utc).isoformat(),
    data={"track_id": "track_1", "volume": -6}
)

# Broadcast to other users
manager.broadcast_operation("proj_123", operation, exclude_user="user_1")

# Get session statistics
stats = manager.get_session_statistics("proj_123")
print(f"Collaborating with {stats['participant_count']} users")
```

**API Endpoints:**
```
POST /api/collaboration/join
POST /api/collaboration/operation
GET  /api/collaboration/session/{project_id}
```

**WebSocket:**
```
ws://localhost:8000/ws
```

---

### 4. VST Plugin Host

**Frontend Usage:**
```typescript
import { vstHostManager } from '../lib/vstHost';

// Initialize
await vstHostManager.initialize('/path/to/plugins');

// Load plugin
const result = await vstHostManager.loadPlugin(
  '/path/to/plugin.vst3',
  'My Awesome EQ'
);

if (result.success) {
  const pluginId = result.pluginInfo.id;
  
  // Set parameters
  vstHostManager.setParameter(pluginId, 'freq', 1000);
  vstHostManager.setParameter(pluginId, 'gain', 6);
  
  // Get value
  const gain = vstHostManager.getParameter(pluginId, 'gain');
  
  // Add MIDI routing
  vstHostManager.addMidiRoute(pluginId, 0, 0);
  
  // Create effect chain
  const processor = vstHostManager.createEffectChainProcessor([
    pluginId1,
    pluginId2
  ]);
  
  // Export preset
  const preset = vstHostManager.exportEffectChainPreset(
    [pluginId1, pluginId2],
    'My Chain'
  );
}
```

**API Endpoints:**
```
POST /api/vst/load
GET  /api/vst/list
POST /api/vst/parameter
POST /api/vst/unload
```

---

### 5. Audio I/O Interface

**Frontend Usage:**
```typescript
import { audioIOManager } from '../lib/audioIO';

// Initialize
await audioIOManager.initialize();

// Get devices
const inputs = await audioIOManager.getInputDevices();
// [{deviceId: "...", name: "USB Microphone"}, ...]

const outputs = await audioIOManager.getOutputDevices();

// Select device
await audioIOManager.selectInputDevice(inputs[0].deviceId);

// Start capturing audio
await audioIOManager.startInputCapture(inputs[0].deviceId);

// Listen to audio data
audioIOManager.onAudioData((audioData: Float32Array) => {
  console.log('Audio data:', audioData);
});

// Real-time metering
const meter = audioIOManager.getMeterData();
console.log(`Input: ${meter.inputLevel}% | Peak: ${meter.inputPeak}`);

// Measure latency
const latency = await audioIOManager.measureLatency();
console.log(`System latency: ${latency}ms`);

// Control output
audioIOManager.setOutputLevel(-6); // -6dB

// Stop capturing
await audioIOManager.stopInputCapture();
```

**API Endpoints:**
```
GET  /api/audio/devices
POST /api/audio/measure-latency
GET  /api/audio/settings
```

---

## 📊 Feature Compatibility Matrix

| Feature | Browser Support | Desktop | Mobile | Notes |
|---------|---|---|---|---|
| Cloud Sync | All | ✅ | ✅ | Requires Supabase |
| Multi-Device | All | ✅ | ✅ | Device registration required |
| Collaboration | All | ✅ | ⚠️ | WebSocket support needed |
| VST Host | Chrome/Edge | ✅ | ❌ | Native plugin bridge required |
| Audio I/O | Modern | ✅ | ⚠️ | Web Audio API required |

---

## 🔧 Configuration

### Supabase Setup
```typescript
// src/lib/supabase.ts
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Environment Variables (.env)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend Configuration
The backend automatically detects and initializes all features when:
- Supabase credentials are available
- Required tables exist in database
- Python packages are installed

---

## 🧪 Testing

**Test Cloud Sync:**
```bash
# Check Supabase connection
curl http://localhost:8000/api/cloud-sync/list

# Test device registration
curl -X POST http://localhost:8000/api/devices/register \
  -H "Content-Type: application/json" \
  -d '{"device_name":"TestDevice","device_type":"desktop","platform":"windows"}'
```

**Test Audio I/O:**
```bash
# Get available devices
curl http://localhost:8000/api/audio/devices

# Measure latency
curl -X POST http://localhost:8000/api/audio/measure-latency
```

**Test Collaboration:**
```bash
# Join session
curl -X POST http://localhost:8000/api/collaboration/join \
  -H "Content-Type: application/json" \
  -d '{"project_id":"proj_1","user_id":"user_1","user_name":"Alice"}'

# Get session info
curl http://localhost:8000/api/collaboration/session/proj_1
```

---

## 📈 Performance Tips

1. **Cloud Sync**: Set auto-backup interval to 30-60 seconds to balance persistence and performance
2. **Multi-Device**: Limit to <100 devices per user for optimal sync performance
3. **Collaboration**: Keep operations queue under 1000 items (auto-cleanup after session)
4. **VST Host**: Unload unused plugins to free memory
5. **Audio I/O**: Use buffer size 256 for low-latency, 512+ for stability

---

## 🐛 Troubleshooting

**Cloud Sync not working?**
- Check Supabase connection: `curl http://localhost:8000/api/health`
- Verify table exists: `supabase.table("projects").select("*").limit(1)`
- Check browser console for errors

**Collaboration operations not syncing?**
- Verify WebSocket connection: Open DevTools → Network → WS
- Check participant count: `/api/collaboration/session/{project_id}`

**Audio I/O permissions?**
- Grant microphone permission when prompted
- Check browser permissions: Settings → Privacy → Microphone

**VST plugin not loading?**
- Verify plugin path is correct
- Check plugin compatibility (VST3 recommended)
- See console for detailed error messages

---

## 📚 Full Documentation

See `ADVANCED_FEATURES_COMPLETE_20251202.md` for:
- Complete API reference
- Type definitions
- Integration examples
- Database schemas
- Performance characteristics

---

**All Features Ready**: December 2, 2025 ✅  
**Status**: Production Ready  
**Version**: 7.0.0+5
