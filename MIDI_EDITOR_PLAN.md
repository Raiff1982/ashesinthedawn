# ?? MIDI EDITOR - COMPLETE IMPLEMENTATION GUIDE

## ?? PROJECT SCOPE

### What We're Building
A professional **Piano Roll MIDI Editor** with:
- Visual piano roll grid (time × pitch)
- Drag-and-drop note editing
- Duration and velocity controls
- Quantize and humanize tools
- Real-time playback integration

### File Structure
```
src/
??? components/
?   ??? MIDIEditor.tsx              (Main container)
?   ??? PianoRoll.tsx               (Grid + visualization)
?   ??? PianoKeys.tsx               (Left sidebar with notes)
?   ??? Ruler.tsx                   (Time ruler at top)
?   ??? NoteControls.tsx            (Duration/velocity sliders)
?   ??? QuantizeHumanize.tsx        (Quantize controls)
??? types/
?   ??? midi.ts                     (MIDI data types)
??? lib/
    ??? midiUtils.ts                (Quantize, humanize, etc)
```

### Estimated Timeline
- **Step 1:** Types & data structures (30 min)
- **Step 2:** Piano roll component (90 min)
- **Step 3:** Note editing (60 min)
- **Step 4:** Duration/velocity (45 min)
- **Step 5:** Quantize/humanize (45 min)
- **Step 6:** Playback integration (60 min)
- **Step 7:** Polish & testing (30 min)

**Total: 4-6 hours**

---

## ?? STEP-BY-STEP IMPLEMENTATION

### STEP 1: MIDI Data Types (30 minutes)

Create `src/types/midi.ts`:
```typescript
// MIDI Note interface
interface MIDINote {
  id: string;
  pitch: number;           // 0-127 (C-1 to G9)
  startTime: number;       // seconds
  duration: number;        // seconds
  velocity: number;        // 0-127
  channel: number;         // 0-15
}

// MIDI Sequence
interface MIDISequence {
  id: string;
  name: string;
  notes: MIDINote[];
  bpm: number;
  timeSignature: [number, number];
  length: number;          // total duration in seconds
}

// MIDI Track (tied to audio track)
interface MIDITrack {
  id: string;
  audioTrackId: string;
  sequence: MIDISequence;
  isRecording: boolean;
  recordingStartTime: number;
}
```

Create `src/lib/midiUtils.ts`:
```typescript
// Pitch to note name
export const pitchToNote = (pitch: number): string => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(pitch / 12) - 1;
  const note = notes[pitch % 12];
  return `${note}${octave}`;
};

// Time to beats
export const timeToBeats = (time: number, bpm: number): number => {
  return (time / 60) * bpm;
};

// Beats to time
export const beatsToTime = (beats: number, bpm: number): number => {
  return (beats * 60) / bpm;
};

// Quantize note to grid
export const quantizeNote = (
  note: MIDINote,
  quantizeValue: number,
  bpm: number
): MIDINote => {
  const beatDuration = 60 / bpm;
  const quantizeDuration = beatDuration / quantizeValue;
  
  const quantizedStart = Math.round(note.startTime / quantizeDuration) * quantizeDuration;
  const quantizedDuration = Math.round(note.duration / quantizeDuration) * quantizeDuration;
  
  return {
    ...note,
    startTime: quantizedStart,
    duration: Math.max(quantizeDuration, quantizedDuration),
  };
};

// Humanize notes
export const humanizeNotes = (notes: MIDINote[], amount: number): MIDINote[] => {
  return notes.map(note => ({
    ...note,
    startTime: note.startTime + (Math.random() - 0.5) * amount,
    velocity: Math.max(0, Math.min(127, note.velocity + Math.random() * 10 - 5)),
  }));
};
```

### STEP 2: Piano Roll Component (90 minutes)

Create `src/components/PianoRoll.tsx`:
```typescript
interface PianoRollProps {
  sequence: MIDISequence;
  onNotesChange: (notes: MIDINote[]) => void;
  isPlaying?: boolean;
  playheadPosition?: number;
  zoom?: number;  // pixels per second
  quantizeValue?: number;  // 4 = quarter notes, 8 = eighth notes
}

export function PianoRoll({
  sequence,
  onNotesChange,
  isPlaying = false,
  playheadPosition = 0,
  zoom = 100,
  quantizeValue = 4,
}: PianoRollProps) {
  // State for editing
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [draggingNote, setDraggingNote] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'move' | 'resize'>('move');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Piano roll constants
  const PIANO_KEYS = 128;  // Full MIDI range
  const KEY_HEIGHT = 16;   // pixels per note
  const RULER_HEIGHT = 40;
  const KEYS_WIDTH = 80;
  
  // Calculate dimensions
  const totalHeight = PIANO_KEYS * KEY_HEIGHT;
  const totalWidth = sequence.length * zoom;

  // Handle note click
  const handleNoteClick = (note: MIDINote, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (e.ctrlKey || e.metaKey) {
      // Multi-select
      setSelectedNotes(prev => 
        prev.includes(note.id)
          ? prev.filter(id => id !== note.id)
          : [...prev, note.id]
      );
    } else {
      // Single select
      setSelectedNotes([note.id]);
    }
  };

  // Handle note drag
  const handleNoteDragStart = (note: MIDINote, mode: 'move' | 'resize') => {
    setDraggingNote(note.id);
    setDragMode(mode);
  };

  // Handle canvas click to add note
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (draggingNote) return;  // Don't add while dragging
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left - KEYS_WIDTH;
    const y = e.clientY - rect.top - RULER_HEIGHT;

    if (x < 0 || y < 0) return;

    const time = x / zoom;
    const pitch = Math.floor((totalHeight - y) / KEY_HEIGHT);

    if (pitch < 0 || pitch > 127) return;

    const newNote: MIDINote = {
      id: `note-${Date.now()}`,
      pitch,
      startTime: time,
      duration: 0.5,  // Default 500ms
      velocity: 100,
      channel: 0,
    };

    onNotesChange([...sequence.notes, newNote]);
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-gray-950 overflow-hidden"
    >
      {/* Ruler (Time) */}
      <Ruler length={sequence.length} zoom={zoom} bpm={sequence.bpm} />

      {/* Main editor area */}
      <div className="flex flex-1 overflow-auto">
        {/* Piano keys (Left) */}
        <PianoKeys />

        {/* Piano roll grid (Right) */}
        <canvas
          ref={canvasRef}
          width={totalWidth}
          height={totalHeight}
          onClick={handleCanvasClick}
          className="flex-1 bg-gray-900 border-l border-gray-700 cursor-crosshair"
        />
      </div>
    </div>
  );
}
```

### STEP 3: Note Editing Controls (60 minutes)

Create `src/components/NoteControls.tsx`:
```typescript
interface NoteControlsProps {
  selectedNotes: MIDINote[];
  onNotesChange: (notes: MIDINote[]) => void;
}

export function NoteControls({ selectedNotes, onNotesChange }: NoteControlsProps) {
  if (selectedNotes.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        Select notes to edit duration and velocity
      </div>
    );
  }

  const avgDuration = selectedNotes.reduce((sum, n) => sum + n.duration, 0) / selectedNotes.length;
  const avgVelocity = selectedNotes.reduce((sum, n) => sum + n.velocity, 0) / selectedNotes.length;

  const handleDurationChange = (duration: number) => {
    onNotesChange(
      selectedNotes.map(note => ({ ...note, duration }))
    );
  };

  const handleVelocityChange = (velocity: number) => {
    onNotesChange(
      selectedNotes.map(note => ({ ...note, velocity }))
    );
  };

  return (
    <div className="p-4 space-y-4 bg-gray-800 border-t border-gray-700">
      {/* Duration Control */}
      <div>
        <label className="text-xs text-gray-400">Duration (seconds)</label>
        <input
          type="range"
          min="0.1"
          max="4"
          step="0.1"
          value={avgDuration}
          onChange={(e) => handleDurationChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <span className="text-xs text-gray-300">{avgDuration.toFixed(2)}s</span>
      </div>

      {/* Velocity Control */}
      <div>
        <label className="text-xs text-gray-400">Velocity</label>
        <input
          type="range"
          min="0"
          max="127"
          value={Math.round(avgVelocity)}
          onChange={(e) => handleVelocityChange(parseInt(e.target.value))}
          className="w-full"
        />
        <span className="text-xs text-gray-300">{Math.round(avgVelocity)}</span>
      </div>
    </div>
  );
}
```

### STEP 4: Quantize & Humanize (45 minutes)

Create `src/components/QuantizeHumanize.tsx`:
```typescript
interface QuantizeHumanizeProps {
  notes: MIDINote[];
  onNotesChange: (notes: MIDINote[]) => void;
  bpm: number;
}

export function QuantizeHumanize({ notes, onNotesChange, bpm }: QuantizeHumanizeProps) {
  const handleQuantize = (quantizeValue: number) => {
    const quantized = notes.map(note => quantizeNote(note, quantizeValue, bpm));
    onNotesChange(quantized);
  };

  const handleHumanize = (amount: number) => {
    const humanized = humanizeNotes(notes, amount);
    onNotesChange(humanized);
  };

  return (
    <div className="p-4 space-y-4 bg-gray-800 border-t border-gray-700">
      {/* Quantize presets */}
      <div>
        <label className="text-xs text-gray-400 block mb-2">Quantize</label>
        <div className="grid grid-cols-4 gap-2">
          {[4, 8, 16, 32].map(value => (
            <button
              key={value}
              onClick={() => handleQuantize(value)}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition"
            >
              1/{value}
            </button>
          ))}
        </div>
      </div>

      {/* Humanize amount */}
      <div>
        <label className="text-xs text-gray-400">Humanize Amount</label>
        <input
          type="range"
          min="0"
          max="0.1"
          step="0.01"
          onChange={(e) => handleHumanize(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}
```

### STEP 5: Integration with Mixer (60 minutes)

Update `src/types/index.ts` to add:
```typescript
interface Track {
  // ... existing properties ...
  midiSequence?: MIDISequence;  // Optional MIDI track
  midiTrackId?: string;          // Reference to MIDI track
}
```

Create `src/components/MIDIEditor.tsx`:
```typescript
export function MIDIEditor() {
  const { selectedTrack, updateTrack } = useDAW();
  const [midiSequence, setMIDISequence] = useState<MIDISequence | null>(null);

  useEffect(() => {
    if (selectedTrack?.midiSequence) {
      setMIDISequence(selectedTrack.midiSequence);
    }
  }, [selectedTrack]);

  const handleNotesChange = (notes: MIDINote[]) => {
    if (!midiSequence) return;
    
    const updated = { ...midiSequence, notes };
    setMIDISequence(updated);
    
    // Update in DAW context
    updateTrack(selectedTrack!.id, { midiSequence: updated });
  };

  if (!selectedTrack || selectedTrack.type !== 'instrument') {
    return (
      <div className="p-4 text-gray-500">
        Select an instrument track to use MIDI Editor
      </div>
    );
  }

  if (!midiSequence) {
    return (
      <div className="p-4">
        <button
          onClick={() => {
            const newSequence: MIDISequence = {
              id: `seq-${Date.now()}`,
              name: `${selectedTrack.name} - MIDI`,
              notes: [],
              bpm: 120,
              timeSignature: [4, 4],
              length: 16,
            };
            setMIDISequence(newSequence);
            updateTrack(selectedTrack.id, { midiSequence: newSequence });
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
        >
          Create MIDI Sequence
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PianoRoll
        sequence={midiSequence}
        onNotesChange={handleNotesChange}
        zoom={100}
      />
      <NoteControls
        selectedNotes={midiSequence.notes}
        onNotesChange={handleNotesChange}
      />
      <QuantizeHumanize
        notes={midiSequence.notes}
        onNotesChange={handleNotesChange}
        bpm={midiSequence.bpm}
      />
    </div>
  );
}
```

### STEP 6: Playback Integration (60 minutes)

Update `src/lib/audioEngine.ts`:
```typescript
// Add MIDI note playback
playMIDINote(pitch: number, velocity: number, duration: number, startTime: number = 0): void {
  if (!this.audioContext) return;

  // Convert MIDI pitch to frequency
  const frequency = 440 * Math.pow(2, (pitch - 69) / 12);

  // Create oscillator
  const oscillator = this.audioContext.createOscillator();
  const gainNode = this.audioContext.createGain();

  oscillator.type = 'triangle';  // Basic waveform
  oscillator.frequency.value = frequency;

  // ADSR envelope
  const now = this.audioContext.currentTime + startTime;
  gainNode.gain.setValueAtTime(velocity / 127 * 0.3, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.9);
  gainNode.gain.setValueAtTime(0, now + duration);

  oscillator.connect(gainNode);
  gainNode.connect(this.masterGain!);

  oscillator.start(now);
  oscillator.stop(now + duration);
}

// Play MIDI sequence
playMIDISequence(sequence: MIDISequence, startTime: number = 0): void {
  sequence.notes.forEach(note => {
    this.playMIDINote(note.pitch, note.velocity, note.duration, startTime + note.startTime);
  });
}
```

---

## ?? NEXT IMMEDIATE STEPS

### Right Now:
1. **Create MIDI types** (`src/types/midi.ts`)
2. **Create MIDI utils** (`src/lib/midiUtils.ts`)
3. **Build Piano Roll** (`src/components/PianoRoll.tsx`)
4. **Add controls** (Duration, velocity, quantize)
5. **Integrate with Mixer**
6. **Test with playback**

### Build Verification:
```bash
npm run build    # Should compile with 0 errors
npm run dev      # Test in dev server
```

---

## ? SUCCESS CRITERIA

When complete, you'll have:
- ? Piano roll grid visualization
- ? Drag-and-drop note editing
- ? Duration and velocity controls
- ? Quantize presets (1/4, 1/8, 1/16, 1/32)
- ? Humanize tool
- ? Real-time MIDI playback
- ? Integration with instrument tracks
- ? 0 TypeScript errors

---

## ?? READY TO START?

This is a 4-6 hour feature. Let's build something awesome!

**Next: We start with Step 1 - Creating MIDI data types!**
