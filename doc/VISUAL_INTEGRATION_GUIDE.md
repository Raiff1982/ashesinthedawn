# CodetteControlCenter - Visual Integration Guide

## 🎯 Where It Appears in Your DAW

### Before Integration (Original Layout):
```
┌─────────────────────────────────────────────────────┐
│ Menu Bar                                            │
├─────────────────────────────────────────────────────┤
│ Top Bar (Transport, Clock, CPU)                     │
├──────────────┬──────────────────────┬───────────────┤
│              │                      │               │
│              │                      │   SIDEBAR     │
│   TRACKS     │    TIMELINE          │   (Files +    │
│              │                      │    Plugins)   │
│              │                      │               │
├──────────────┴──────────────────────┤               │
│ MIXER (Resizable)                   │               │
└─────────────────────────────────────┴───────────────┘
```

### After Integration (New Layout):
```
┌─────────────────────────────────────────────────────┐
│ Menu Bar                                            │
├─────────────────────────────────────────────────────┤
│ Top Bar (Transport, Clock, CPU)                     │
├──────────────┬──────────────────────┬───────────────┤
│              │                      │ Files │Ctrl◀─ NEW!
│              │                      │ ┌─────────┐   │
│   TRACKS     │    TIMELINE          │ │Codette  │   │
│              │                      │ │Control  │   │
│              │                      │ │Center   │   │
├──────────────┴──────────────────────┤ │         │   │
│ MIXER (Resizable)                   │ │         │   │
│                                     │ └─────────┘   │
│                                     │  🧠 Activity  │
└─────────────────────────────────────┴───────────────┘
```

## 🔄 Tab Navigation

### Visual Representation:

```
RIGHT SIDEBAR - TWO TABS

┌────────────────────┐
│ Files │ Control   │  ← Tab Bar (at the top)
├────────────────────┤
│                    │
│  Currently viewing:│
│  • Activity Log    │  ← When "Control" tab active
│  • Permissions    │
│  • Stats          │
│  • Settings       │
│                    │
│  Live Status Bar   │
│  🧠 Processing...  │  ← Always visible at bottom
│                    │
└────────────────────┘

OR

┌────────────────────┐
│ Files │ Control   │  ← Tab Bar
├────────────────────┤
│                    │
│  Currently viewing:│
│  • Project Files   │  ← When "Files" tab active
│  • Asset Library   │
│  • Plugins        │
│  • Sounds        │
│                    │
└────────────────────┘
```

## 🎨 Color & Styling

### Active Tab Style:
```
┌──────────────────────────────┐
│ Files │ Control              │
├──────────────────────────────┤
       ↓
   cyan background + underline
   text-cyan-400 color
   
   Files  │ ◀ Control
   gray   │  ← cyan (highlighted)
```

### Inactive Tab Style:
```
   Files  │ Control
   ↑ text-gray-400
   hover to text-gray-300
```

## 📱 Screen Layout Breakdown

### Desktop (1280px+) - Full Layout:

```
LEFT SIDEBAR (52px)        CENTER (flex-1)           RIGHT SIDEBAR (64px)
├─ Track List             ├─ Timeline               ├─ Tab Bar
│                         │  (flex-1, scrollable)   │  [Files] [Control]
│  Track 1 ▶              │                         ├─ Content Area
│  Track 2                │                         │  ┌──────────────┐
│  Track 3                │                         │  │ Codette      │
│  ...                    │                         │  │ Activity Log │
│                         ├─ Divider               │  │              │
│                         │  (draggable resize)    │  │ • AI Action  │
│                         │  ▲                      │  │ • User Task  │
│                         ├─ Mixer (200px fixed)   │  │              │
│                         │  [Vol] [Pan] [Plugins] │  └──────────────┘
│                         │                         ├─ Live Status Bar
│                         │                         │  🧠 Analyzing...
```

## 🎯 User Interaction Flow

### Tab Switching:
```
User clicks "Control" tab
         ↓
CSS class updates
         ↓
Tab button highlights (cyan)
         ↓
Sidebar content switches
         ↓
CodetteControlCenter renders
         ↓
Activity log starts updating
```

### Activity Viewing:
```
Open "Control" tab
         ↓
See Activity Log
         ↓
Automatic updates every 6 seconds
         ↓
New events appear at top
         ↓
Can undo/export/clear as needed
```

### Permission Management:
```
Click "Permissions" tab in Control Center
         ↓
See all action types with radio buttons
         ↓
Select Allow/Ask/Deny
         ↓
Click Save
         ↓
Settings persist (in-session)
```

## 💾 State Management

### Component State:

```
App.tsx (Parent)
├── rightSidebarTab: 'files' | 'control'
│   └─ Controls which tab content shows
│
└─ CodetteControlCenter.tsx (Child)
   ├── tab: 'log' | 'permissions' | 'stats' | 'settings'
   ├── permissions: {...}
   ├── activity: [...]
   ├── liveStatus: {...}
   └── settings: {...}
```

## 🔌 Component Hierarchy

```
App
├── Providers
│   ├── ThemeProvider
│   ├── DAWProvider
│   └── CodettePanelProvider
│
└── AppContent
    ├── MenuBar
    ├── TopBar
    ├── Main Layout
    │   ├── TrackList (Left)
    │   ├── Timeline (Center)
    │   └── Right Sidebar ◀─ INTEGRATION POINT
    │       ├── Tab Navigation (NEW)
    │       ├── Conditional Rendering
    │       ├── Sidebar (Files tab)
    │       └── CodetteControlCenter (Control tab) ◀─ NEW!
    │
    └── Modals
        ├── AudioSettingsModal
        ├── CommandPalette
        └── CodetteMasterPanel
```

## 🖱️ Mouse Interactions

### Tab Navigation:
```
Hover over tab:
  Text: gray-400 → gray-300

Click on tab:
  State changes
  Tab styling updates
  Content switches
```

### Within Control Center:
```
Activity Log:
  - Scroll to see older events
  - Hover on row: bg-gray-800/50 highlight
  - Click Undo: removes last entry
  - Click Export: downloads CSV

Permissions:
  - Click radio button: selects permission level
  - Click Reset: restores defaults
  - Click Save: persists (if connected to backend)

Settings:
  - Click toggle: switches on/off
  - Click Clear History: shows confirmation dialog
```

## 📊 Visual Elements

### Activity Log Table:
```
┌────────────┬───────────┬─────────────────────────────────┐
│ Time       │ Source    │ Action                          │
├────────────┼───────────┼─────────────────────────────────┤
│ 18:42:01   │ Codette2  │ Adjusted EQ on Bass (+1.5 dB)  │
│            │ (blue bg) │                                 │
├────────────┼───────────┼─────────────────────────────────┤
│ 18:42:07   │ Codette2  │ Created track: Lead Synth       │
│            │ (blue bg) │                                 │
├────────────┼───────────┼─────────────────────────────────┤
│ 18:42:10   │ User      │ Denied render request           │
│            │ (green bg)│                                 │
└────────────┴───────────┴─────────────────────────────────┘
```

### Stats Grid:
```
┌────────────────────┬────────────────────┐
│ Actions Performed  │ Parameters Changed │
│      142           │       142          │
├────────────────────┼────────────────────┤
│ User Approvals     │ Denied Actions     │
│       18           │        4           │
└────────────────────┴────────────────────┘

Progress Bar:
████████████░░░░░░  28%
```

### Live Status Bar:
```
┌────────────────────────────────────────────────┐
│ 🧠 Analyzing spectral balance...  Actions: 142 │
│ ◯  (animated pulse indicator)                   │
└────────────────────────────────────────────────┘
```

## 🌊 Data Flow Diagram

```
User Action
    ↓
Tab Click Event
    ↓
State Update (rightSidebarTab)
    ↓
Conditional Rendering
    ↓
┌──────────────────┬──────────────────┐
│ if 'files'       │ if 'control'     │
├──────────────────┼──────────────────┤
│ <Sidebar />      │ <CodetteControl />
└──────────────────┴──────────────────┘
    ↓
    ├─ Activity updates every 6s
    ├─ User interactions (export, undo, save)
    ├─ Settings changes
    └─ Permissions updates
```

## 🎬 Animation & Transitions

### Tab Switch Animation:
```
Duration: instant (CSS)
Effect: Smooth color transition
  - Border color: smooth
  - Text color: smooth
  - Background: smooth
```

### Live Indicator:
```
Duration: continuous
Effect: Pulse animation
  - Scale: 0.8 → 1.0 → 0.8
  - Opacity: 0.5 → 1.0 → 0.5
```

### Progress Bar:
```
Duration: continuous
Effect: Width transition
  - Updates in real-time
  - Smooth width change
  - Gradient colors
```

## 📐 Responsive Breakpoints

### Desktop (1280px+):
```
Right sidebar: 256px (w-64)
Tab navigation: Full size
Content area: Scrollable
Live status: Bottom fixed
```

### Tablet (768px - 1279px):
```
Right sidebar: 192px (w-48) or hidden
Tab navigation: Stacked or compact
Content area: Scrollable
Live status: Bottom fixed
```

### Mobile (<768px):
```
Right sidebar: Hidden or modal
Tab navigation: Full width tabs
Content area: Full scrollable
Live status: Bottom fixed
```

## 🎨 Color Reference

```
Background:
  bg-gray-950  → Main background (#030712)
  bg-gray-900  → Cards/panels (#111827)
  bg-gray-800  → Borders/hover (#1f2937)

Text:
  text-gray-100  → Primary text (#f3f4f6)
  text-gray-300  → Secondary text (#d1d5db)
  text-gray-400  → Tertiary text (#9ca3af)

Accents:
  text-cyan-400    → Active state (#22d3ee)
  bg-cyan-600      → Button hover (#0891b2)
  border-cyan-400  → Tab underline (#22d3ee)

Status Colors:
  blue-300         → Codette actions
  green-300        → User actions
  red-400          → Denials
```

## ✨ Visual Hierarchy

```
1. Tab Navigation (Highest - Always visible)
   ├─ Active tab: Cyan highlight
   └─ Inactive tab: Gray

2. Content Area (Medium - Primary focus)
   ├─ Headings: 16px bold
   ├─ Labels: 14px medium
   └─ Data: 14px regular

3. Live Status Bar (Lower - Background info)
   └─ 12px mono font

4. Dividers & Borders (Lowest)
   └─ Gray-800 color, 1px width
```

## 🎯 Access Patterns

### Power User:
```
1. Open Control tab (keyboard: click or Tab+Enter)
2. Skim Activity log for current status
3. Switch to Permissions if needed
4. Switch to Stats for metrics
5. Back to Files for project work
```

### Developer:
```
1. Export activity CSV for analysis
2. Check permissions configuration
3. Monitor stats in real-time
4. Adjust settings as needed
5. Clear history when done
```

### Presenter/Demo:
```
1. Show Control tab to audience
2. Watch live activity updates
3. Demonstrate permission system
4. Show stats/metrics
5. Switch back to Files for work
```

---

This visual guide shows exactly how the CodetteControlCenter integrates into your DAW's UI. The right sidebar now provides seamless access to both your file browser and AI control center via simple tab navigation!
