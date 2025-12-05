# Audio Metering Quick Reference

## Components

### TrackMeter
Real-time per-track level display with smooth falloff and color gradient.

**Location**: `src/components/TrackMeter.tsx`

**Props**:
```typescript
interface TrackMeterProps {
  trackId: string;        // Required: Track ID to meter
  height?: number;        // Optional: Canvas height in pixels (default: 120)
  width?: number;         // Optional: Canvas width in pixels (default: 10)
}
```

**Basic Usage**:
```tsx
import TrackMeter from './components/TrackMeter';

// In your component:
<TrackMeter trackId={track.id} height={120} width={10} />
```

**In Mixer Context**:
```tsx
<TrackMeter 
  trackId={track.id} 
  height={Math.max(stripHeight * 0.45, 40)}
  width={Math.max(stripWidth * 0.15, 6)}
/>
```

**Features**:
- ✅ Real-time level display (0-1 normalized)
- ✅ Smooth animation with 60 FPS refresh
- ✅ Color gradient: green → yellow → orange → red
- ✅ Peak indicator line with falloff
- ✅ Responsive sizing
- ✅ No configuration needed (audio data auto-fetched)

---

### AudioMeter
Global frequency spectrum + RMS visualization.

**Location**: `src/components/AudioMeter.tsx`

**Props**: None (displays global master output)

**Basic Usage**:
```tsx
import AudioMeter from './components/AudioMeter';

// Displays in a panel:
<div className="bg-gray-900 rounded-lg border border-gray-800 p-2">
  <AudioMeter />
</div>
```

**Features**:
- ✅ Frequency spectrum bars (256 bins)
- ✅ RMS overlay line (cyan)
- ✅ Peak indicators (amber)
- ✅ RMS percentage display
- ✅ Smooth animation
- ✅ Professional appearance

---

## Audio Engine API

### getTrackLevel(trackId: string): number

Returns the current normalized level (0-1) for a track.

**Parameters**:
- `trackId` (string): The track ID to meter

**Returns**:
- number (0-1): Normalized RMS level where 0 = silent, 1 = maximum

**Example**:
```tsx
import { getAudioEngine } from './lib/audioEngine';

const audioEngine = getAudioEngine();
const level = audioEngine.getTrackLevel(trackId);

// Use the level value:
const dbLevel = 20 * Math.log10(level);
console.log(`Track level: ${dbLevel.toFixed(1)} dB`);
```

**Behavior**:
- Returns 0 if track is not playing
- Returns 0 if track analyser doesn't exist
- Queries real-time frequency data
- Very low overhead (single frequency bin read)

### getAudioLevels(): Uint8Array | null

Returns global master frequency data (existing method).

**Returns**:
- Uint8Array: 1024 frequency bins (0-255)
- null: If analyser not initialized

**Example**:
```tsx
const audioEngine = getAudioEngine();
const spectrum = audioEngine.getAudioLevels();

if (spectrum) {
  for (let i = 0; i < spectrum.length; i++) {
    console.log(`Bin ${i}: ${spectrum[i]}`);
  }
}
```

---

## Color Reference

### Level Meter Color Zones
| Color | Hex Value | Level Range | Status |
|-------|-----------|-------------|--------|
| Green | #059669 | 0-0.4 | Safe / Normal |
| Yellow | #facc15 | 0.4-0.7 | Good / Optimal |
| Orange | #f97316 | 0.7-0.9 | Warning / Monitor |
| Red | #dc2626 | 0.9-1.0 | Danger / Clipping |

### Conversion Guide
```typescript
// Linear to dB conversion
const dbLevel = 20 * Math.log10(linearLevel);

// dB to Linear conversion
const linearLevel = Math.pow(10, dbLevel / 20);

// Example levels:
// 1.0 (normalized) = 0 dB = Unity gain
// 0.5 (normalized) = -6 dB = Half amplitude
// 0.1 (normalized) = -20 dB = Very quiet
// 0.01 (normalized) = -40 dB = Nearly silent
```

---

## Performance Tips

### Optimal Canvas Size
```tsx
// For channel strips (narrow)
<TrackMeter trackId={id} height={150} width={10} />

// For detailed display
<TrackMeter trackId={id} height={200} width={20} />

// For compact view
<TrackMeter trackId={id} height={80} width={8} />
```

### Avoid These Patterns
```typescript
// ❌ DON'T: Call getTrackLevel() outside component render
const level = getAudioEngine().getTrackLevel(trackId); // Stale value!

// ✅ DO: Let TrackMeter component handle updates
<TrackMeter trackId={trackId} />

// ❌ DON'T: Create multiple AudioEngine instances
const engine1 = new AudioEngine();
const engine2 = new AudioEngine();

// ✅ DO: Use singleton pattern
const engine = getAudioEngine();
```

---

## Integration Examples

### Example 1: Simple Track Meter
```tsx
import TrackMeter from './components/TrackMeter';
import { Track } from './types';

function SimpleTrackMeter({ track }: { track: Track }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400">{track.name}</span>
      <TrackMeter trackId={track.id} height={40} width={8} />
    </div>
  );
}
```

### Example 2: Compact Meters in List
```tsx
function CompactMeterList({ tracks }: { tracks: Track[] }) {
  return (
    <div className="space-y-2">
      {tracks.map(track => (
        <div key={track.id} className="flex items-center justify-between">
          <span>{track.name}</span>
          <TrackMeter trackId={track.id} height={60} width={12} />
        </div>
      ))}
    </div>
  );
}
```

### Example 3: With Level Display
```tsx
import { getAudioEngine } from './lib/audioEngine';
import { useEffect, useState } from 'react';

function DetailedMeter({ trackId }: { trackId: string }) {
  const [level, setLevel] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const audioEngine = getAudioEngine();
      setLevel(audioEngine.getTrackLevel(trackId));
    }, 100);
    
    return () => clearInterval(interval);
  }, [trackId]);
  
  const db = level > 0 ? 20 * Math.log10(level) : -Infinity;
  
  return (
    <div>
      <TrackMeter trackId={trackId} height={100} width={16} />
      <p className="text-xs text-gray-400 mt-1">
        {db === -Infinity ? '-∞' : db.toFixed(1)} dB
      </p>
    </div>
  );
}
```

### Example 4: Global Master Meter
```tsx
import AudioMeter from './components/AudioMeter';

function MasterPanel() {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <h3 className="text-sm font-semibold mb-3">Master Output</h3>
      <AudioMeter />
    </div>
  );
}
```

---

## Troubleshooting

### Problem: Meter not updating
**Solution**: Ensure track is actively playing
```tsx
// Make sure audio is actually playing
if (!isPlaying) {
  console.log('Track not playing, meter will show 0');
}

// Verify track has audio buffer loaded
if (!audioBuffer) {
  console.log('No audio data for track');
}
```

### Problem: Meter shows 0 constantly
**Solution**: Check audio engine initialization
```tsx
const audioEngine = getAudioEngine();
if (!audioEngine.isInitialized) {
  console.log('Audio engine not initialized');
  await audioEngine.initialize();
}
```

### Problem: Canvas rendering issues
**Solution**: Verify component is mounted
```tsx
// Check if canvas ref is valid
if (!canvasRef.current) {
  console.log('Canvas not mounted');
  return null;
}
```

### Problem: Performance degradation
**Solution**: Reduce update frequency or canvas size
```tsx
// Use smaller canvas
<TrackMeter trackId={id} height={60} width={8} />

// Limit meter count in view
{visibleTracks.length <= 10 ? tracks : tracks.slice(0, 10)}
```

---

## Audio Engine Methods Used Internally

These methods are called by the metering components automatically:

### playAudio(trackId, startTime, volumeDb, pan)
- Creates per-track analyser
- Chains it into audio graph
- Starts level monitoring

### stopAudio(trackId)
- Stops audio playback
- Cleans up track analyser
- Stops level updates

### getTrackLevel(trackId)
- Queries per-track analyser
- Calculates RMS from frequency bins
- Returns 0-1 normalized value

---

## Browser Compatibility

| Browser | Canvas | Web Audio API | Status |
|---------|--------|---------------|--------|
| Chrome | ✅ | ✅ | Full support |
| Firefox | ✅ | ✅ | Full support |
| Safari | ✅ | ✅ | Full support |
| Edge | ✅ | ✅ | Full support |
| IE 11 | ❌ | ❌ | Not supported |

---

## Related Documentation

- **Audio Engine**: `src/lib/audioEngine.ts` (500+ lines)
- **DAW Context**: `src/contexts/DAWContext.tsx` (1000+ lines)
- **Mixer Component**: `src/components/Mixer.tsx` (563 lines)
- **Architecture Guide**: `DEVELOPMENT.md`

---

## Quick Start

1. **Import the component**:
   ```tsx
   import TrackMeter from './components/TrackMeter';
   ```

2. **Use in your component**:
   ```tsx
   <TrackMeter trackId={track.id} height={120} width={10} />
   ```

3. **That's it!** The meter will auto-update during playback

No configuration, initialization, or manual data binding required. The component handles all audio querying internally using the Web Audio API.
