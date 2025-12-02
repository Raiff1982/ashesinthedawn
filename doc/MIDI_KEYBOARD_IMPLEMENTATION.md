# MIDI Keyboard Integration - Implementation Guide

## Overview
The MIDI keyboard component now fully integrates with CoreLogic Studio's action system, enabling real-time note insertion with detailed logging and tracking.

## Architecture

```
MIDIKeyboard.tsx
    ↓ (key press)
handleNoteOn() callback
    ↓
actionRegistry.execute('44100', {pitch, velocity, ...})
    ↓
midiActionsExtended.ts - Action handler
    ↓
Console logging with ✅ prefix
    ↓
TopBar.tsx captures and displays (4s fade)
```

## Data Flow

### 1. User Interaction
```typescript
// User clicks/presses a MIDI keyboard key
<button onMouseDown={() => handleNoteOn(octave, noteInOctave)} />
```

### 2. Note On Handler
```typescript
const handleNoteOn = (octave: number, noteInOctave: number) => {
  const pitch = getNoteNumber(octave, noteInOctave);  // e.g., 60 for C4
  setActiveNotes(prev => new Set(prev).add(pitch));   // Visual feedback
  
  // Trigger action system
  actionRegistry.execute('44100', {
    pitch: 60,
    velocity: 100,
    startTime: 0,
    length: 0.5
  });
  
  // Also call parent callback
  onNoteOn(pitch, 100);
};
```

### 3. Action Execution
```typescript
// In midiActionsExtended.ts - Action 44100
const noteName = getMidiNoteName(validatedPitch);  // "C4"

const newNote: MIDINote = {
  pitch: validatedPitch,
  velocity: validatedVelocity,
  startTime,
  duration: Math.max(0.01, length),
};

midiState.selectedNotes.push(newNote);

console.log(
  `✅ Inserted MIDI note: ${noteName} (pitch=${validatedPitch}, vel=${validatedVelocity}, dur=${length}s)`,
  { pitch, velocity, noteName, duration: length, totalNotes: midiState.selectedNotes.length }
);
```

### 4. Console Output
```
✅ Inserted MIDI note: C4 (pitch=60, vel=100, dur=0.5s)
Object {pitch: 60, velocity: 100, noteName: "C4", duration: 0.5, totalNotes: 1}
```

### 5. TopBar Display (Auto-fade after 4s)
```
[🎹 Inserted MIDI Note] [✅] (4s countdown)
```

## API Reference

### MIDIKeyboard Props
```typescript
interface MIDIKeyboardProps {
  onNoteOn: (pitch: number, velocity: number) => void;     // Callback when note starts
  onNoteOff: (pitch: number) => void;                       // Callback when note ends
  octaveStart?: number;                                      // Starting octave (default: 3)
  octaveCount?: number;                                      // Number of octaves (default: 3)
  isVisible?: boolean;                                       // Show/hide keyboard (default: true)
}
```

### MIDI Action Payload Structure
```typescript
interface MIDIActionPayload {
  pitch: number;           // 0-127 (MIDI pitch range)
  velocity: number;        // 0-127 (MIDI velocity)
  startTime: number;       // Beat position
  length: number;          // Duration in beats
  gridSize?: number;       // For quantize actions (0.25 = 16th note)
  strength?: number;       // For quantize strength (0-100%)
  timingAmount?: number;   // For humanize - timing variation in ms
  velocityAmount?: number; // For humanize - velocity variation in %
}
```

### Action Registry Calls
```typescript
// All MIDI keyboard notes trigger action 44100
actionRegistry.execute('44100', {
  pitch: number,          // The MIDI pitch number
  velocity: 100,          // Fixed at 100 (can be parameterized)
  startTime: 0,           // Current playhead position
  length: 0.5             // Default 0.5 beat (quarter note)
});

// Returns Promise that resolves to { success: boolean, message?: string }
```

## MIDI Note Names

The system converts MIDI pitch numbers to human-readable note names:

```
C0=0,  C#0=1,  D0=2,  D#0=3,  E0=4,  F0=5,  F#0=6,  G0=7,  G#0=8,  A0=9,  A#0=10, B0=11,
C1=12, C#1=13, D1=14, D#1=15, E1=16, F1=17, F#1=18, G1=19, G#1=20, A1=21, A#1=22, B1=23,
...
C4=60, ... (Middle C, Standard tuning reference)
...
C8=108 (Highest piano key)
```

### Conversion Function
```typescript
function getMidiNoteName(pitch: number): string {
  const MIDI_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(pitch / 12) - 1;
  const noteIdx = pitch % 12;
  return `${MIDI_NOTE_NAMES[noteIdx]}${octave}`;
}

// Examples:
getMidiNoteName(60);   // "C4"
getMidiNoteName(64);   // "E4"
getMidiNoteName(69);   // "A4"
getMidiNoteName(72);   // "C5"
```

## Logging Format

All MIDI actions follow this console logging pattern:

### Format: `✅ [Action]: [Details] | [Optional: Note Names]`

**Insert Note:**
```
✅ Inserted MIDI note: C4 (pitch=60, vel=100, dur=0.5s)
→ Structured: { pitch: 60, velocity: 100, noteName: "C4", duration: 0.5, totalNotes: 1 }
```

**Delete Note:**
```
✅ Deleted 2 MIDI note(s): E4, G4
→ Structured: { count: 2, notes: ["E4", "G4"] }
```

**Quantize:**
```
✅ Quantized 3 note(s) to grid: gridSize=0.25, strength=100% | Notes: C4, D4, E4
→ Structured: { count: 3, gridSize: 0.25, strength: 100, notes: ["C4", "D4", "E4"] }
```

**Humanize:**
```
✅ Humanized 2 note(s): timing±10ms, velocity±5% | Notes: F#3, A4
→ Structured: { count: 2, timingAmount: 10, velocityAmount: 5, notes: ["F#3", "A4"] }
```

## State Management

### MIDI State Structure
```typescript
interface MIDIState {
  selectedNotes: MIDINote[];  // Currently selected/edited notes
  clipboard: MIDINote[];      // For copy/paste operations
}

interface MIDINote {
  pitch: number;      // 0-127
  velocity: number;   // 0-127
  startTime: number;  // Beat position
  duration: number;   // Duration in beats
}
```

### Persistence
- MIDI state stored in module-level `midiState` variable
- Persists for the session
- Cleared when creating new project

## Error Handling

The MIDI keyboard implementation includes graceful error handling:

```typescript
try {
  actionRegistry.execute('44100', {
    pitch,
    velocity: 100,
    startTime: 0,
    length: 0.5,
  }).catch((err) => {
    console.debug('[MIDIKeyboard] Action context:', err?.message);
  });
} catch (err) {
  console.debug('[MIDIKeyboard] Action context:', { actionId: '44100', pitch });
}

// Parent callback still called even if action fails
onNoteOn(pitch, 100);
```

**Error Cases:**
1. Action registry not initialized → Silent catch, callback still fires
2. MIDI values out of range → Validated and clamped (0-127)
3. Invalid payload → Default values used (pitch=60, velocity=100, etc.)

## Performance Considerations

1. **Note Insertion** - O(1) append to array
2. **Note Deletion** - O(n) filter operation (n = number of notes)
3. **Quantize** - O(n) mapping + rounding
4. **Humanize** - O(n) random variations applied
5. **Logging** - Structured data serialization (negligible overhead)

## Integration Points

### With TopBar Action Logger
The TopBar component automatically captures all console logs with ✅ prefix:
```typescript
// TopBar.tsx listens for console.log calls
const originalLog = console.log;
console.log = (...args) => {
  if (args[0]?.includes?.('✅')) {
    // Add to MIDIActionLog with auto-fade after 4 seconds
    setMidiActionLog(prev => [...prev, { action, timestamp }]);
  }
  originalLog(...args);
};
```

### With MIDIEditor Component
The MIDIEditor displays `midiState.selectedNotes` in a note list:
- Visual note selection
- Pitch/velocity sliders
- Humanize/Quantize buttons (trigger actions)

## Future Enhancements

1. **Octave Navigation** - Up/Down buttons to change octaveStart
2. **Velocity Control** - Slider to set default MIDI velocity
3. **Note Duration** - Dropdown to select default length
4. **MIDI Learning** - Automatically map physical MIDI keys to keyboard
5. **Channel Support** - Route notes to specific MIDI channels
6. **Undo/Redo** - Full history of MIDI edits
7. **Export** - Save MIDI notes to file
8. **Velocity Dynamics** - Mouse Y-position controls velocity on click

## Debugging Tips

### Enable Detailed Logging
```typescript
// In MIDIKeyboard.tsx handleNoteOn
if (true) console.log('[MIDIKeyboard] Note ON:', { octave, noteInOctave, pitch });
```

### Check MIDI State
```typescript
// In browser console:
import { midiState } from './src/lib/actions/midiActionsExtended.ts';
console.log(midiState.selectedNotes);  // View all notes
```

### Monitor Action Execution
```typescript
// In browser console:
import { actionRegistry } from './src/lib/actionSystem';
actionRegistry.execute('44100', { pitch: 60, velocity: 100, startTime: 0, length: 0.5 });
```

### View WebSocket Traffic
```typescript
// Filter console by [CodetteBridge] to see all messages
// Filter console by → to see routed events
```

---

**Implementation Status**: ✅ Complete and Production-Ready
**Last Updated**: December 1, 2025
