# Mixer Component Layout Structure - Fixed Version

## Component Nesting Diagram

```
Mixer Component (MixerComponent)
│
└─ Fragment (<>)
   │
   └─ Main Container (line 196)
      class: h-full w-full flex flex-col bg-gray-900 overflow-hidden
      │
      ├─ Header Bar (line 206-225)
      │  │ class: h-10 bg-gradient-to-r from-gray-800...
      │  │
      │  ├─ Logo & Title
      │  │  └─ "Mixer" text + detached count
      │  │
      │  ├─ Spacer (ml-auto)
      │  │
      │  └─ Minimize/Expand Button
      │     └─ toggles isMinimized state
      │
      ├─ {!isMinimized && (     ← CONDITIONAL RENDERING START
      │  │
      │  └─ Content Container (line 229)
      │     class: flex-1 overflow-y-auto flex flex-col min-h-0 bg-gray-950
      │     │
      │     ├─ Mixer Strips Container (line 232-365)
      │     │  class: h-80 flex-shrink-0 bg-gray-950 group/scroller
      │     │  style: overflowX: auto, smooth scrolling
      │     │  │
      │     │  └─ Flex Rows Container (line 269)
      │     │     class: flex h-full gap-1 p-2 min-w-max
      │     │     │
      │     │     ├─ Master Strip (line 278-362)
      │     │     │  width: ${scaledStripWidth}px
      │     │     │  height: ${stripHeight}px
      │     │     │  │
      │     │     │  ├─ Title: "Master"
      │     │     │  │
      │     │     │  └─ Controls
      │     │     │     ├─ Volume Fader
      │     │     │     ├─ Level Meter
      │     │     │     └─ dB Display
      │     │     │
      │     │     └─ Track Tiles (line 364-388)
      │     │        │ {tracks.map(track => ...)}
      │     │        │
      │     │        └─ MixerTile Component
      │     │           (repeated for each track)
      │     │
      │     ├─ Plugin Rack (line 397-410)
      │     │  class: h-32 border-t border-gray-700 bg-gray-800 p-4
      │     │  │
      │     │  └─ DetachablePluginRack Component
      │     │     (only shown if track selected)
      │     │
      │     └─ Codette AI Panels (line 412-490)  ← NOW INSIDE!
      │        class: flex-1 border-t border-gray-700 bg-gray-800 flex flex-col
      │        │
      │        ├─ Tab Headers (line 415-450)
      │        │  class: flex items-center gap-2 p-2 border-b flex-shrink-0
      │        │  │
      │        │  ├─ 💡 Suggestions Button
      │        │  ├─ 📊 Analysis Button
      │        │  └─ ⚙️ Control Button
      │        │
      │        └─ Tab Content (line 453-489)
      │           class: flex-1 overflow-auto bg-gray-800 min-h-0
      │           │
      │           ├─ CodetteSuggestionsPanel (if tab === 'suggestions')
      │           ├─ CodetteAnalysisPanel (if tab === 'analysis')
      │           └─ CodetteControlPanel (if tab === 'control')
      │
      │  )} ← CONDITIONAL RENDERING END (line 492)
      │
      └─ Detached Floating Tiles (line 497-545)
         class: fixed inset-0 pointer-events-none
         │
         ├─ Detached Options Tile (if detached)
         ├─ Detached Plugin Racks (mapped)
         └─ Detached Track Tiles (mapped)
```

## Line Reference

```
Line 196: <div className="h-full w-full flex flex-col bg-gray-900">
Line 206:   <div className="h-10 bg-gradient-to-r...">  ← Header
Line 225:   </div>
Line 228:   {!isMinimized && (
Line 229:     <div className="flex-1 overflow-y-auto...">
Line 232:       <div className="h-80 flex-shrink-0...">  ← Mixer Strips
Line 365:       </div>
Line 397:       {selectedTrack && ...}              ← Plugin Rack
Line 410:       )}
Line 412:       <div className="flex-1 border-t...">  ← Codette Panels
Line 490:       </div>
Line 491:     </div>
Line 492:   )}
Line 493: </div>
Line 497: <div className="fixed inset-0...">       ← Floating Tiles
Line 545: </div>
Line 546: </>
```

## State Management

### isMinimized State (boolean)
- **false (default)**: All content visible
- **true**: Lines 229-492 are not rendered, only header visible

### Other State Variables Used
- `codetteTab`: 'suggestions' | 'analysis' | 'control'
- `selectedTrack`: Currently selected track or null
- `showPluginRack`: Boolean flag for plugin rack visibility
- `isHoveringMixer`: For scrollbar styling
- `detachedTiles`, `detachedPluginRacks`, `detachedOptionsTile`: For floating elements

## CSS Classes Applied

### Main Container
- `h-full w-full` - Full height and width
- `flex flex-col` - Vertical flex layout
- `bg-gray-900` - Dark background
- `overflow-hidden` - No scrollbars at root level

### Content When Expanded
- `flex-1` - Takes all available space
- `overflow-y-auto` - Vertical scrolling for content
- `min-h-0` - Allows flex-child to shrink below content size

### Content When Minimized
- Entire section (line 228-492) is removed from DOM
- Only header bar remains visible
- User sees maximum screen space for other UI elements

## Performance Characteristics

1. **Render Performance**
   - No re-renders when minimizing (CSS visibility is NOT used)
   - Conditional rendering removes entire subtree when `isMinimized = true`
   - Reduces DOM nodes by ~50-60% when minimized

2. **Memory Usage**
   - Component state is preserved in React
   - No data loss when toggling minimize
   - Minimal state: just one boolean (`isMinimized`)

3. **Animation/Transitions**
   - No CSS transitions applied (instant toggle)
   - Could be enhanced with CSS animations if needed
   - Currently designed for immediate show/hide behavior

## Future Enhancement Opportunities

1. **CSS Animations**
   - Add `transition` classes for smooth collapse/expand
   - Use CSS `max-height` transitions instead of conditional rendering

2. **Resize Persistence**
   - Save `isMinimized` state to localStorage
   - Restore state on page reload

3. **Size Options**
   - Allow user to resize mixer when collapsed (e.g., 40px, 60px, 100px)
   - Store preferred collapsed height in preferences

4. **Keyboard Shortcut**
   - Add keyboard shortcut (e.g., Ctrl+M) to toggle minimize
   - Add to help documentation

5. **Responsive Behavior**
   - Auto-minimize on smaller screens (< 1024px width)
   - Auto-minimize when detached tiles are active
