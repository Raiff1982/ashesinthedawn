# PluginRack Settings Button - Visual Guide

## User Interface Flow

### 1. Normal State (Plugin Item at Rest)
```
┌─ PluginRack ─────────────────────────────────────┐
│                                                   │
│  ┌─ Plugin Slot 1 ──────────────────────────┐    │
│  │ ● 🎚️ Parametric EQ        │ (Added)     │    │
│  │   Slot 1                                 │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
│  ┌─ Plugin Slot 2 ──────────────────────────┐    │
│  │ ● ⚙️ Compressor           │ (Active)    │    │
│  │   Slot 2                                 │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
└───────────────────────────────────────────────────┘
```

### 2. Hover State (Plugin Item with Buttons Visible)
```
┌─ PluginRack ─────────────────────────────────────┐
│                                                   │
│  ┌─ Plugin Slot 2 ──────────────────────────┐    │
│  │ ● ⚙️ Compressor │ [⚙️] [▼]   Slot 2    │    │
│  │                                          │    │
│  │ Hover shows: Settings button ⚙️ + Menu ▼│    │
│  │              ↑ Click here to expand     │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
└───────────────────────────────────────────────────┘

Buttons Visible on Hover:
- [⚙️] Settings button (NEW!)
- [▼] Options dropdown menu
```

### 3. Expanded Parameters State (After Clicking Settings)
```
┌─ PluginRack ──────────────────────────────────────┐
│                                                    │
│  ┌─ Plugin Slot 2 ──────────────────────────┐     │
│  │ ● ⚙️ Compressor │ [⚙️] [▼]   Slot 2    │     │
│  └──────────────────────────────────────────┘     │
│  ┌─ Compressor - Parameters ─────────────────┐    │
│  │                                         [✕]    │
│  │ ratio:        4.00                            │
│  │ threshold:   -20.50                           │
│  │ attack:       0.01                            │
│  │ release:      0.10                            │
│  │ makeup_gain:  6.20                            │
│  └───────────────────────────────────────────┘    │
│                                                    │
└────────────────────────────────────────────────────┘

- Parameters shown with 2 decimal places
- Close button [✕] in top right
- Can click Settings button again to collapse
```

### 4. Multiple Plugins with One Expanded
```
┌─ PluginRack ──────────────────────────────────────┐
│                                                    │
│  ┌─ Plugin Slot 1 ──────────────────────────┐     │
│  │ ● 🎚️ Parametric EQ     │ Added    Slot 1│     │
│  └──────────────────────────────────────────┘     │
│                                                    │
│  ┌─ Plugin Slot 2 ──────────────────────────┐     │
│  │ ● ⚙️ Compressor    [⚙️] [▼]   Slot 2   │     │
│  └──────────────────────────────────────────┘     │
│  ┌─ Compressor - Parameters ──────────────────┐   │
│  │                                         [✕]   │
│  │ ratio:        4.00                           │
│  │ threshold:   -20.50                          │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  ┌─ Plugin Slot 3 ──────────────────────────┐     │
│  │ ○ 🌊 Reverb          │         Slot 3   │     │
│  │   (Bypassed)                              │     │
│  └──────────────────────────────────────────┘     │
│                                                    │
└────────────────────────────────────────────────────┘

- Only one plugin expanded at a time
- Other plugins show normally
- Expand another plugin to collapse current one
```

### 5. No Parameters State
```
┌─ PluginRack ──────────────────────────────────────┐
│                                                    │
│  ┌─ Plugin Slot 1 ──────────────────────────┐     │
│  │ ● 🎚️ Parametric EQ     [⚙️] [▼]  Slot 1│     │
│  └──────────────────────────────────────────┘     │
│  ┌─ Parametric EQ - Parameters ─────────────────┐ │
│  │                                         [✕]  │ │
│  │                                              │ │
│  │ No parameters configured                    │ │
│  │                                              │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘

- Shows friendly message when no parameters exist
- Panel still visible, but empty content
```

## Interaction Sequences

### Sequence 1: View Parameters
```
User Action         | UI Result
─────────────────────────────────────────
1. Hover over plugin │ Settings button [⚙️] appears
2. Click [⚙️] button │ Parameters panel expands
3. View parameters  │ All parameters displayed
4. Click [⚙️] again  │ Parameters panel collapses
```

### Sequence 2: Close Parameters
```
User Action         | UI Result
─────────────────────────────────────────
1. Parameters open  │ Panel visible with [✕] button
2. Click [✕] button │ Panel immediately collapses
3. Panel gone       │ Plugin shows normal state
```

### Sequence 3: Switch Between Plugins
```
User Action           | UI Result
─────────────────────────────────────────
1. Plugin A expanded  │ Parameters for A shown
2. Click Settings[B]  │ Parameters for A collapse
                      │ Parameters for B expand
3. View B params      │ Only B parameters shown
```

## Tooltip Information

### Settings Button Tooltip
```
┌─────────────────────────────────────┐
│ Plugin Settings                     │
├─────────────────────────────────────┤
│ View and adjust plugin parameters   │
│                                     │
│ Icon: ⚙️                             │
│ Category: effects                   │
│                                     │
│ Related Functions:                  │
│ • Add Plugin                        │
│ • Bypass                            │
│                                     │
│ Performance Tip:                    │
│ Adjust parameters in real-time      │
│ without reloading                   │
│                                     │
│ Examples:                           │
│ • EQ frequency and resonance        │
│ • Compressor ratio and threshold    │
└─────────────────────────────────────┘
```

## Color Scheme

### Element Colors
```
Component              Color           Hex/Tailwind
─────────────────────────────────────────────────
Plugin Item (Normal)  Dark Gray       bg-gray-700
Plugin Item (Hover)   Gray            bg-gray-700
Settings Button       Gray/Blue       text-gray-400 → hover:bg-blue-600
Parameters Panel      Dark Gray       bg-gray-800
Parameters Border     Gray            border-gray-600
Parameter Label       Light Gray      text-gray-400
Parameter Value       Light Gray      text-gray-300
Header Text          Light Gray       text-gray-300
Close Button         Gray/Light Gray  text-gray-500 → hover:text-gray-300
No Params Message    Gray            text-gray-500 (italic)
```

## Accessibility Features

### Keyboard Navigation
- Settings button can be tabbed to
- Enter key activates Settings button
- Escape key could close parameters (future enhancement)

### Screen Reader Support
- Settings button has title attribute: "Edit plugin settings"
- Parameters header is semantic `<h4>` for structure
- Parameter labels and values are clearly labeled

### Visual Indicators
- Color change on button hover
- Clear close button (✕) indication
- Parameter panel clearly separated with border

## Responsive Behavior

### Desktop (Normal)
- Settings button fully visible on hover
- Parameters panel takes full width of rack
- All text and values displayed clearly

### Tablet (Future)
- Settings button might stay visible on touch
- Parameters panel may scroll if too many parameters

### Future Mobile Support
- Settings button becomes permanent
- Parameters panel might slide in from side
- Scrollable if many parameters

## State Diagram

```
                    ┌─────────────────────┐
                    │  Plugin At Rest     │
                    │ Settings hidden     │
                    └────────┬────────────┘
                             │
                      User hovers over plugin
                             │
                    ┌────────▼────────────┐
                    │ Settings Visible    │
                    │ Ready to expand     │
                    └────────┬────────────┘
                             │
                      User clicks Settings
                             │
                    ┌────────▼────────────┐
                    │ Parameters Open     │
                    │ Close button visible│
                    └────────┬────────────┘
                             │
                    ┌────────┴────────────┐
                    │                     │
            Click Settings        Click Close [✕]
            or other plugin              │
                    │                     │
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │  Parameters Close   │
                    │  Back to normal     │
                    └─────────────────────┘
```

---

**Last Updated**: November 25, 2025  
**Component**: PluginRack.tsx  
**Status**: ✅ Ready for User Testing
