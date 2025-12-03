# ?? RECORDING INTERFACE - COMPLETE DESIGN

## ?? Overview

Professional recording controls with punch in/out, input monitoring, and seamless DAW integration.

---

## ?? Feature Scope

### Core Recording Features
```
? Record Arm per track
? Punch In/Out controls (time-based)
? Input level monitoring (real-time metering)
? Recording status display
? Metronome click during recording
? Overdub mode (layer new takes)
? Recording countdown
? Automatic save on stop
```

### Monitoring
```
? Input Level Meter (pre-fader)
? Clipping detection (red indicator)
? Visual peak hold
? RMS calculation
? Per-track input monitoring
```

### Workflow
```
? Record to audio track
? Record to MIDI track  
? Punch in at specific time
? Punch out at specific time
? Auto-punch during playback
? Multiple takes/overdubs
? Undo last take
```

---

## ?? Component Architecture

### New Components

```
src/components/
??? RecordingControls.tsx         (Recording arm, punch controls)
??? InputMonitor.tsx              (Input level display)
??? RecordingStatus.tsx           (Status indicator + countdown)
??? PunchInOutPanel.tsx           (Time selector UI)
??? RecordingSettings.tsx         (Mode selection, input source)
```

### Integration Points

```
TopBar
??? RecordingStatus (displays when armed/recording)
??? Record button (primary control)

TrackList
??? Per-track arm buttons
??? Input selector

Mixer
??? InputMonitor (per track)
??? Recording indicator

DAWContext
??? recordingTrack state
??? recordingStartTime
??? punchInTime / punchOutTime
??? isRecording boolean
```

---

## ?? UI Components Details

### 1. RecordingControls.tsx

**Purpose:** Main recording control interface

**Props:**
```typescript
interface RecordingControlsProps {
  selectedTrack: Track;
  isRecording: boolean;
  isArmed: boolean;
  onArm: (armed: boolean) => void;
  onRecord: () => void;
  onStop: () => void;
}
```

**Features:**
- [ ] Arm/Disarm toggle
- [ ] Record/Stop button (red when recording)
- [ ] Mode selector (Audio/MIDI/Overdub)
- [ ] Input source dropdown
- [ ] Pre-fader monitor toggle

**Styling:**
- Armed state: Blinking red border
- Recording state: Pulsing red background
- Ready state: Green indicator

---

### 2. InputMonitor.tsx

**Purpose:** Real-time input level display

**Props:**
```typescript
interface InputMonitorProps {
  trackId: string;
  showLabel?: boolean;
  compact?: boolean;
}
```

**Features:**
- [ ] Level meter bar (-60dB to +6dB)
- [ ] Peak indicator (white line)
- [ ] RMS indicator (yellow line)
- [ ] Peak hold (3 second hold + decay)
- [ ] Clipping warning (red if > 0dB)
- [ ] dB scale on left

**Canvas-based rendering:**
- Smooth animations
- 60fps updates
- Real-time level tracking

---

### 3. RecordingStatus.tsx

**Purpose:** Display recording status and countdown

**Props:**
```typescript
interface RecordingStatusProps {
  isRecording: boolean;
  recordingTime: number;      // seconds elapsed
  recordingCount: number;     // which take
  punchInTime?: number;
  punchOutTime?: number;
}
```

**Features:**
- [ ] Time display (MM:SS.MS format)
- [ ] Recording indicator (blinking dot)
- [ ] Take counter (Take 1, 2, 3...)
- [ ] Punch in/out indicators
- [ ] Audio waveform preview (real-time)

---

### 4. PunchInOutPanel.tsx

**Purpose:** Configure punch in/out times

**Props:**
```typescript
interface PunchInOutPanelProps {
  punchInTime: number;
  punchOutTime: number;
  onPunchInChange: (time: number) => void;
  onPunchOutChange: (time: number) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}
```

**Features:**
- [ ] Punch In time input (MM:SS.MS)
- [ ] Punch Out time input (MM:SS.MS)
- [ ] Enable/disable toggle
- [ ] Visual timeline showing punch region
- [ ] Preset buttons (whole song, loop region, etc.)

---

### 5. RecordingSettings.tsx

**Purpose:** Configure recording options

**Features:**
- [ ] Input source selector (microphone/line-in/etc)
- [ ] Recording mode (Audio/MIDI/Overdub)
- [ ] Metronome settings during recording
- [ ] Click volume
- [ ] Latency compensation
- [ ] Buffer size selector

---

## ?? DAWContext Integration

### New State Properties

```typescript
interface DAWContextType {
  // ... existing properties ...
  
  // Recording state
  recordingTrackId?: string;
  isRecording: boolean;
  recordingStartTime: number;
  recordingBuffer?: Float32Array;
  recordingStartTimeAbsolute: number;
  
  // Punch settings
  punchInEnabled: boolean;
  punchInTime: number;      // seconds from start
  punchOutTime: number;     // seconds from start
  
  // Recording settings
  recordingMode: 'audio' | 'midi' | 'overdub';
  recordingInputSource: string;
  recordingTakeCount: number;
}
```

### New Methods

```typescript
// Start recording on selected track
startRecording(trackId: string): Promise<boolean>

// Stop recording and save
stopRecording(): Promise<Blob | null>

// Set punch times
setPunchInOut(punchIn: number, punchOut: number): void

// Undo last take
undoLastTake(): void

// Check if should punch in/out
shouldPunch(currentTime: number): 'in' | 'out' | 'none'
```

---

## ??? Audio Engine Integration

### New Methods

```typescript
// Start recording input
async startRecordingInput(): Promise<boolean>

// Get current input level (0-1)
getInputLevel(): number

// Get input buffer snapshot
getInputBuffer(): Float32Array | null

// Enable input monitoring (pre-fader)
enableInputMonitoring(trackId: string): void
disableInputMonitoring(trackId: string): void

// Save recording to track
saveRecording(trackId: string, buffer: Float32Array): Promise<boolean>

// Check if audio input available
isAudioInputAvailable(): boolean
```

---

## ?? Recording Workflow

### User Flow

```
1. SELECT TRACK
   ?
2. CLICK ARM BUTTON
   (Track armed, input monitoring starts)
   ?
3. SET PUNCH IN/OUT (optional)
   ?
4. CLICK RECORD or PLAY
   (If punch: waits for punch time, auto-records)
   (If record: starts recording immediately)
   ?
5. PERFORM
   (See real-time input level)
   (Hear metronome if enabled)
   ?
6. STOP RECORDING
   (Audio saved to track buffer)
   ?
7. PLAYBACK or NEW TAKE
   (Undo to retry, or create new take)
```

### Punch In/Out Flow

```
PLAY ? [Punch In Time] ? AUTO-RECORD ? [Performance] ? [Punch Out Time] ? AUTO-STOP
                                                                          (Saved to track)
```

---

## ?? State Machine

```
IDLE
?? (arm) ? ARMED
?           ?? (disarm) ? IDLE
?           ?? (record) ? PRE_ROLL
?           ?? (play with punch) ? PRE_ROLL
?
PRE_ROLL (waiting for punch in time)
?? (punch in time reached) ? RECORDING
?? (stop) ? ARMED
?
RECORDING
?? (stop) ? SAVING
?? (punch out time reached) ? SAVING
?? (error) ? ERROR
?
SAVING
?? (save complete) ? ARMED
?? (save error) ? ERROR

ERROR
?? (retry) ? ARMED
?? (cancel) ? IDLE
```

---

## ?? Implementation Phases

### Phase 1: Core Recording (1-2 hours)
- [ ] RecordingControls component
- [ ] Audio engine recording methods
- [ ] DAWContext recording state
- [ ] Basic start/stop recording

### Phase 2: Input Monitoring (30-45 min)
- [ ] InputMonitor component
- [ ] Real-time level detection
- [ ] Clipping indicators
- [ ] Peak hold visualization

### Phase 3: Punch In/Out (45-60 min)
- [ ] PunchInOutPanel component
- [ ] Punch timing logic in DAWContext
- [ ] Auto-record/stop on punch times
- [ ] Visual timeline

### Phase 4: Recording Settings (30 min)
- [ ] RecordingSettings component
- [ ] Input source selection
- [ ] Recording mode options
- [ ] Metronome integration

### Phase 5: Polish & Testing (30 min)
- [ ] Status displays
- [ ] Countdown indicators
- [ ] Take management
- [ ] Error handling
- [ ] Real-world testing

---

## ?? Data Flow

```
User Input
    ?
RecordingControls component
    ?
DAWContext.startRecording()
    ?
audioEngine.startRecordingInput()
    ?
Web Audio API (getUserMedia)
    ?
MediaRecorder or AnalyserNode
    ?
Real-time Buffer
    ?
InputMonitor displays level
    ?
User stops ? stopRecording()
    ?
audioEngine.saveRecording()
    ?
Track.audioBuffer updated
    ?
Waveform regenerated
    ?
Timeline shows new audio
```

---

## ? Testing Checklist

- [ ] Can arm track
- [ ] Can start recording
- [ ] Input level shows in monitor
- [ ] Clipping detected at high levels
- [ ] Recording stops and saves
- [ ] Audio plays back
- [ ] Punch in/out times work
- [ ] Multiple takes recorded
- [ ] Metronome plays during record
- [ ] Can undo last take
- [ ] Latency acceptable (<50ms)

---

## ?? Success Criteria

When complete:
- ? Professional recording workflow
- ? Real-time input monitoring
- ? Punch in/out recording
- ? Multiple takes support
- ? Seamless DAW integration
- ? Zero latency issues
- ? Production-ready code

---

## ?? Time Estimate

**Total: 3-4 hours**
- Phase 1: 1.5-2 hours
- Phase 2: 45 min
- Phase 3: 1 hour
- Phase 4: 30 min
- Phase 5: 30 min

Can be split across 2-3 sessions if needed.

---

**Ready to build professional recording interface!** ????
