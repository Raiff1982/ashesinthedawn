# MixerPro Quick Reference

## Visual Overview

```text
┌─ MIXER PRO HEADER ─────────────────────────────────┐
│  Mixer Pro  [20 tracks]  [Preset ▼]  [⚙️] [◀▶]    │
└────────────────────────────────────────────────────┘
│ Track Height: |━━━●━━━| 350px                      │
└────────────────────────────────────────────────────┘
│                                                    │
│  ┌─────┐  ┌─────┐  ┌─────┐     ┌──────────────┐   │
│  │Drum │  │Bass │  │Vox  │ ... │    MASTER    │   │
│  │ Vol │  │ Vol │  │ Vol │     │    Vol       │   │
│  │ ▼   │  │ ▼   │  │ ▼   │     │    ▼         │   │
│  │ ─── │  │ ─── │  │ ─── │     │    ─── M    │   │
│  │ Pan │  │ Pan │  │ Pan │     │    ─── E    │   │
│  │[M S]│  │[M S]│  │[M S]│     │    ─── T    │   │
│  └─────┘  └─────┘  └─────┘     │    ─── E    │   │
│   Resize→ |                     │    ─── R    │   │
│ ┌─────────────────────────────┐ └──────────────┘   │
│ └─ Floating Faders ──────────┐                    │
│    Track 1 - Volume          │                    │
│    ┌──────┐                  │                    │
│    │ ▼ ▼ ▼│ ← Draggable fader│                    │
│    │ ○ ▼ ▼│   50.0 dB        │                    │
│    │ ▼ ▼ ▼│                  │                    │
│    │ [↻] 50%                 │                    │
│    └──────┘                  │                    │
└──────────────────────────────┘
```

## Key Interactions

### 1. Resize Track Strips

```text
Hover over right edge of track → Resize cursor appears
Drag → Width changes (60-180px)
```

### 2. Adjust Volume

```text
Click/drag vertical fader → Volume updates (-60 to +6 dB)
Real-time label shows current dB value
```

### 3. Pan Control

```text
Drag horizontal slider → Pan from L to R (-1 to +1)
Center indicator shows: L / C / R
```

### 4. Detach Floating Fader

```text
Click [▲] button on track → Floating window appears
Drag title bar → Move anywhere on screen
Click [X] → Close fader window
```

### 5. Switch Presets

```text
Select from dropdown:
  • Default (100px, 350h) - General mixing
  • Compact (70px, 250h) - Small screens
  • Wide (140px, 400h) - Detailed editing
  • Vertical (150px, 80h) - Tall displays
```

### 6. Toggle Meters

```text
Click [🔊] button → Show/hide level meters
Meters display real-time levels with color gradient
```

### 7. Adjust Track Height

```text
Drag height slider → All tracks scale (150-500px)
Useful for touch interfaces or detailed editing
```

## Master Track

```text
MASTER (Purple)
├─ Master Level Fader
├─ 10-Segment Meter
│  └─ Green/Yellow/Red gradient
└─ Resizable (60-180px width)
```

**Master Meter Colors**:

- 🟢 Green: -20 dB or quieter
- 🟡 Yellow: -20 to -8 dB
- 🔴 Red: -8 to +6 dB (approach headroom carefully!)

## Keyboard & Mouse

| Action | Control |
|--------|---------|
| Resize strip | Drag right edge |
| Adjust volume | Drag vertical fader |
| Adjust pan | Drag horizontal slider |
| Select track | Click header |
| Detach fader | Click [▲] button |
| Move floating fader | Drag title bar |
| Close floating fader | Click [X] button |
| Switch layout | Click [▯] button |
| Toggle meters | Click [🔊] button |
| Reset fader (floating) | Click [↻] button |

## Color Guide

| Color | Meaning |
|-------|---------|
| 🔵 Blue | Selected track / Normal fader |
| 🟣 Purple | Master track |
| 🔴 Red | Muted track |
| 🟡 Yellow | Soloed track |
| 🟢 Green | Normal level |
| 🟡 Yellow | Approaching headroom |
| 🔴 Red | Clipping risk |

## Common Workflows

### Quick Mix (Compact Preset)

```text
1. Select Compact preset
2. Set volume levels
3. Adjust pan for stereo width
4. Use Master fader to control overall level
5. Solo individual tracks to check details
```

### Detailed Editing (Wide Preset)

```text
1. Select Wide preset
2. Resize tracks as needed (up to 180px)
3. Open floating faders for fine control
4. Adjust metering display
5. Compare against other tracks
```

### Mobile/Tablet (Vertical Height)

```text
1. Reduce track height slider
2. Switch to compact preset
3. Use horizontal scrolling for all tracks
4. Utilize floating faders for detailed work
5. Larger touch targets at reduced height
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Track too narrow | Drag resize handle right |
| Can't see all tracks | Scroll horizontally or reduce track height |
| Fader not responding | Check if track is selected |
| Master too quiet | Check Master fader position |
| Floating window off-screen | Try moving it back or closing/reopening |
| Volume changes not visible | Ensure Meters are enabled |

## Tips & Tricks

💡 **Multi-Track Editing**: Open floating faders for each track to adjust side-by-side
💡 **Quick Reference**: Use Master meter to check overall headroom
💡 **Compact Space**: Switch to Compact preset for netbooks/tablets
💡 **Detailed Work**: Use Wide preset with floating faders for mixing
💡 **Organization**: Use track colors (future) to group similar instruments
💡 **Precision**: Floating faders allow 1-pixel adjustments on desktop

## Keyboard Shortcuts (Future)

```text
Ctrl+M          Mute selected track
Ctrl+S          Solo selected track
Ctrl+R          Reset volume to 0 dB
Ctrl+Shift+A    Open all floating faders
Ctrl+Shift+C    Close all floating faders
↑/↓             Adjust volume ±1 dB
</> (Shift+.)   Pan L/R
```

---

**Status**: ✅ MixerPro v1.0.0 - Production Ready  
**TypeScript**: 0 Errors ✅  
**Front-End**: Running on port 5174  
**Last Updated**: December 1, 2025
