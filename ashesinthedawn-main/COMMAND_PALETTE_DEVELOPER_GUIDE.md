# Command Palette & Action System - Developer Guide

## Quick Start

### Using the Action System

#### 1. Register a New Action

```typescript
// In src/lib/actions/initializeActions.ts
import { actionRegistry, shortcutManager } from '../actionSystem';

export function registerCustomActions() {
  // Register the action metadata + handler
  actionRegistry.register(
    {
      id: '45000',  // Unique ID (45xxx = custom range)
      name: 'Custom: Do Something',
      category: 'Custom',
      description: 'This action does something cool',
      contexts: ['main', 'arrange'],  // Where it's available
      accel: 'ctrl+shift+x',  // Default shortcut
    },
    async (payload) => {
      // Handler code - called when action executes
      console.log('Doing something!', payload);
      
      // Access DAW context
      const ctx = getDAWContext();
      if (ctx?.selectedTrack) {
        ctx.updateTrack(ctx.selectedTrack.id, { volume: -6 });
      }
    }
  );

  // Register shortcut
  shortcutManager.register({
    actionId: '45000',
    keys: 'ctrl+shift+x',
    context: 'main',
  });
}

// Call in initializeActions()
export function initializeActions() {
  registerTransportActions();
  registerTrackActions();
  registerEditActions();
  registerViewActions();
  registerCustomActions();  // Add this
}
```

#### 2. Execute an Action Programmatically

```typescript
import { actionRegistry } from '../lib/actionSystem';

// From anywhere in your component:
// Execute action with no parameters
await actionRegistry.execute('40044');

// Execute with parameters
await actionRegistry.execute('40044', {
  startTime: 5,
  loopCount: 2,
});
```

#### 3. Search for Actions

```typescript
import { actionRegistry } from '../lib/actionSystem';

// Get all actions
const allActions = actionRegistry.getAllActions();

// Search by name/description
const results = actionRegistry.search('mute');
console.log(results); // Returns matching ActionMetadata[]

// Get actions for specific context
const mainActions = actionRegistry.getActionsForContext('main');
```

#### 4. Get Action Metadata

```typescript
const metadata = actionRegistry.getMetadata('40044');
console.log(metadata);
// {
//   id: '40044',
//   name: 'Transport: Play',
//   category: 'Transport',
//   description: 'Start playback from current position',
//   contexts: ['main', 'arrange', 'mixer'],
//   accel: 'space',
// }
```

### Using the Shortcut Manager

```typescript
import { shortcutManager } from '../lib/actionSystem';

// Get shortcut for key combination
const shortcut = shortcutManager.getShortcut('ctrl+z');
if (shortcut) {
  console.log(`Action: ${shortcut.actionId}`);
}

// Get all shortcuts for an action
const shortcuts = shortcutManager.getShortcutsForAction('40044');
console.log(shortcuts);
// [
//   { actionId: '40044', keys: 'space', context: 'main' },
// ]
```

### Using Undo/Redo

```typescript
import { actionHistory } from '../lib/actionSystem';

// Record an undoable action
actionHistory.record(async () => {
  // This function is called when user presses Ctrl+Z
  console.log('Undoing...');
});

// Check if undo/redo is available
if (actionHistory.canUndo()) {
  await actionHistory.undo();
}

if (actionHistory.canRedo()) {
  await actionHistory.redo();
}

// Clear history
actionHistory.clear();
```

## Action ID Reference

### Transport Actions (40000-40999)
| ID | Name | Shortcut | Description |
|---|---|---|---|
| 40044 | Play | Space | Start playback from current position |
| 40045 | Pause | Ctrl+Space | Pause playback |
| 40046 | Stop | Shift+Space | Stop and return to start |
| 40047 | Record | Ctrl+R | Toggle record mode |
| 40048 | Seek to Start | Home | Jump to beginning |
| 40049 | Rewind | Left Arrow | Move back 5 seconds |
| 40050 | Forward | Right Arrow | Move forward 5 seconds |

### Track Actions (41000-41999)
| ID | Name | Shortcut | Description |
|---|---|---|---|
| 41000 | Add Audio Track | Ctrl+Alt+A | Insert audio track |
| 41001 | Add Instrument Track | Ctrl+Alt+I | Insert instrument track |
| 41002 | Add MIDI Track | Ctrl+Alt+M | Insert MIDI track |
| 41003 | Add Aux Track | Ctrl+Alt+U | Insert auxiliary track |
| 41010 | Delete Track | Ctrl+Del | Delete selected track |
| 41020 | Toggle Mute | M | Mute/unmute selected track |
| 41021 | Toggle Solo | S | Solo/unsolo selected track |
| 41022 | Toggle Record Arm | R | Arm/disarm recording |

### Edit Actions (42000-42999)
| ID | Name | Shortcut | Description |
|---|---|---|---|
| 42000 | Undo | Ctrl+Z | Undo last action |
| 42001 | Redo | Ctrl+Y | Redo last undone action |

### View Actions (44000-44999)
| ID | Name | Shortcut | Description |
|---|---|---|---|
| 44000 | Zoom In | Ctrl+Scroll | Zoom in on timeline |
| 44001 | Zoom Out | Ctrl+Shift+Scroll | Zoom out on timeline |
| 44010 | Toggle Mixer | Ctrl+Alt+M | Show/hide mixer |

### Custom/Future Actions (45000-49999)
Reserve for user-defined actions and plugins

## DAW Context Functions Available

All these functions are available inside action handlers via `getDAWContext()`:

```typescript
const ctx = getDAWContext();

// Track management
ctx.addTrack(type);           // 'audio' | 'instrument' | 'midi' | 'aux'
ctx.deleteTrack(trackId);
ctx.selectTrack(trackId);
ctx.updateTrack(trackId, updates);
ctx.selectAllTracks();
ctx.deselectAllTracks();

// Playback
ctx.togglePlay();
ctx.toggleRecord();
ctx.stop();
ctx.seek(timeSeconds);

// Audio file
ctx.uploadAudioFile(file);
ctx.getWaveformData(trackId);
ctx.getAudioDuration(trackId);
ctx.getAudioLevels(trackId);

// Effects
ctx.addPluginToTrack(trackId, plugin);
ctx.removePluginFromTrack(trackId, pluginId);
ctx.togglePluginEnabled(trackId, pluginId);
ctx.setTrackInputGain(trackId, gainDb);

// Project
ctx.saveProject();
ctx.loadProject(projectId);
ctx.createBus();
ctx.deleteBus(busId);

// State
ctx.tracks              // Array of all tracks
ctx.selectedTrack       // Currently selected track
ctx.currentTime         // Playhead position (seconds)
ctx.isPlaying           // Playback state
ctx.isRecording         // Recording state
ctx.zoom                // Timeline zoom level
```

## Examples

### Example 1: Create a "Next Track" Action

```typescript
// In initializeActions.ts
actionRegistry.register(
  {
    id: '41100',
    name: 'Track: Select Next',
    category: 'Track',
    description: 'Select next track in list',
    contexts: ['main', 'arrange'],
    accel: 'tab',
  },
  async () => {
    const ctx = getDAWContext();
    if (!ctx?.selectedTrack || !ctx?.tracks) return;

    const currentIndex = ctx.tracks.findIndex(
      t => t.id === ctx.selectedTrack?.id
    );
    
    if (currentIndex < ctx.tracks.length - 1) {
      ctx.selectTrack(ctx.tracks[currentIndex + 1].id);
    }
  }
);
```

### Example 2: Create a "Mute All Except Selected" Action

```typescript
actionRegistry.register(
  {
    id: '41200',
    name: 'Track: Solo by Muting Others',
    category: 'Track',
    description: 'Mute all tracks except selected',
    contexts: ['main', 'mixer'],
    requiresSelection: true,
  },
  async () => {
    const ctx = getDAWContext();
    if (!ctx?.selectedTrack || !ctx?.tracks || !ctx?.updateTrack) return;

    ctx.tracks.forEach(track => {
      if (track.id !== ctx.selectedTrack?.id) {
        ctx.updateTrack(track.id, { muted: true });
      }
    });
  }
);
```

### Example 3: Create a "Quick Normalize Volume" Action

```typescript
actionRegistry.register(
  {
    id: '41300',
    name: 'Track: Normalize Volume',
    category: 'Track',
    description: 'Set track volume to -6dB',
    contexts: ['main', 'mixer'],
    requiresSelection: true,
  },
  async (payload) => {
    const ctx = getDAWContext();
    if (!ctx?.selectedTrack || !ctx?.updateTrack) return;

    const normalizeLevel = payload.level || -6;
    ctx.updateTrack(ctx.selectedTrack.id, {
      volume: normalizeLevel,
    });
  }
);

// Execute with custom level
await actionRegistry.execute('41300', { level: -3 });
```

### Example 4: Use in Component

```typescript
import { actionRegistry } from '../lib/actionSystem';

export function MyComponent() {
  const handleQuickMix = async () => {
    // Execute multiple actions in sequence
    await actionRegistry.execute('41020'); // Mute selected
    await actionRegistry.execute('40046'); // Stop playback
  };

  return (
    <button onClick={handleQuickMix}>
      Quick Mute & Stop
    </button>
  );
}
```

## Advanced: Creating Custom Contexts

```typescript
// In actionSystem.ts, add new context type
export type ActionContext = 
  | 'main' 
  | 'midi-editor' 
  | 'media-explorer' 
  | 'mixer' 
  | 'arrange'
  | 'my-custom-context';  // Add this

// Register actions for custom context
actionRegistry.register(
  {
    id: '45000',
    name: 'Custom Action',
    category: 'Custom',
    contexts: ['my-custom-context'],
  },
  async () => {
    // Only runs when in custom context
  }
);

// Get actions for context
const customActions = actionRegistry.getActionsForContext('my-custom-context');
```

## Performance Tips

1. **Cache search results** if searching frequently:
   ```typescript
   const results = actionRegistry.search('mute');
   // Store results in state instead of searching every render
   ```

2. **Use action IDs, not names**, in loops:
   ```typescript
   // ✅ Fast - direct lookup
   await actionRegistry.execute('40044');
   
   // ❌ Slow - search every time
   const action = actionRegistry.search('Play')[0];
   await actionRegistry.execute(action.id);
   ```

3. **Batch action execution**:
   ```typescript
   // Instead of many individual executes
   const actions = ['41020', '41021', '41022'];
   for (const id of actions) {
     await actionRegistry.execute(id);
   }
   ```

## Testing

```typescript
// Test that action exists
expect(actionRegistry.getMetadata('40044')).toBeDefined();

// Test search
const results = actionRegistry.search('play');
expect(results.length).toBeGreaterThan(0);

// Test execution
await actionRegistry.execute('40044');
// Then verify state changed
```

## Troubleshooting

### Action doesn't execute
- Check console for warnings (e.g., "Action not found: X")
- Verify action ID is registered
- Check that getDAWContext() returns valid context
- Verify handler doesn't throw errors

### Shortcut not working
- Make sure it's registered in shortcutManager
- Check if another action uses the same keys
- Verify context is correct (main, arrange, etc.)

### Search returns no results
- Check query string (case-insensitive)
- Verify action name contains search term
- Try searching by category instead

## REAPER-style Features Implemented

✅ Action ID numbering (40xxx, 41xxx, etc.)
✅ Multiple contexts
✅ Keyboard shortcuts
✅ Metadata-driven discovery
✅ Search functionality
✅ Undo/Redo framework
✅ Command palette (Ctrl+Shift+P)

## Next Steps

1. Add more actions as needed
2. Create custom macro actions
3. Implement action history/audit
4. Add fuzzy search to command palette
5. Create shortcut customization UI
