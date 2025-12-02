# Project Directory Docking - User Guide 🎯

## Quick Start - 30 Seconds

The Project Directory search bar in the TopBar is now **collapsible**!

### Default View (Docked)
```
Search bar visible in TopBar center
Type to search projects/files
```

### How to Undock
```
1. Hover over the search bar
2. Look for the ↑ button that appears
3. Hold Ctrl and click the ↑ button
   OR just click it normally (tooltip tells you)
```

### Result
```
Search bar disappears
"Dock Search" button appears instead
Gives you more horizontal space!
```

### How to Restore
```
Click the "Dock Search" button
Search bar comes back immediately
```

---

## Visual Walk-Through

### Step 1: Default Docked State
```
TopBar Layout:
┌─────────────────────────────────────────────────────────┐
│ ⏯ ⏸ ⏺ 🔁 ↶ ↷ 🎵 🚩 │ 12:34:56 120 BPM │ 🖴 search... ↑ │ 🌟 [...] │
│                       └──── On hover ────┘              │
└─────────────────────────────────────────────────────────┘
                 ↑ Undock button appears on hover
```

### Step 2: Hover Over Search Bar
```
The ↑ button becomes visible (was hidden before)
                    ▼
┌─────────────────────────────────────────────────────────┐
│ ⏯ ⏸ ⏺ 🔁 ↶ ↷ 🎵 🚩 │ 12:34:56 120 BPM │ 🖴 search... ↑✨ │ 🌟 [...] │
│                       └─ Visible now ─┘                 │
└─────────────────────────────────────────────────────────┘
                   ↑ Button highlights
```

### Step 3: Ctrl+Click the ↑ Button
```
Docking state toggles
Search bar disappears
Compact button appears
                    ▼
┌─────────────────────────────────────────────────────────┐
│ ⏯ ⏸ ⏺ 🔁 ↶ ↷ 🎵 🚩 │ 12:34:56 120 BPM │ [🖴 Dock Search] │ 🌟 [...] │
│                                           ▲              │
│                    Click here to restore search bar      │
└─────────────────────────────────────────────────────────┘
```

### Step 4: Click "Dock Search" Button
```
Search bar comes back
Ready to search again
                    ▼
┌─────────────────────────────────────────────────────────┐
│ ⏯ ⏸ ⏺ 🔁 ↶ ↷ 🎵 🚩 │ 12:34:56 120 BPM │ 🖴 search... ↑ │ 🌟 [...] │
│                       └─ Back to normal ─┘              │
└─────────────────────────────────────────────────────────┘
```

---

## All Interactions

### Search Bar (When Docked)

| Click/Action | Result |
|---|---|
| Click on search input | Shows dropdown with search results |
| Type text | Filters projects/files |
| Click X button | Clears search text |
| Hover & see ↑ | Undock button appears |
| Ctrl+Click ↑ | Toggles to undocked state |
| Click elsewhere | Dropdown closes (200ms) |

### Dock Search Button (When Undocked)

| Click/Action | Result |
|---|---|
| Click button | Search bar appears again |
| Auto-persist | Search text remembered! |

---

## Tips & Tricks

### 💡 Pro Tips

1. **Keyboard Shortcut**
   - Hold Ctrl and click ↑ to undock
   - Click "Dock Search" to restore
   - **Coming Soon**: Alt+D shortcut for faster toggling

2. **Search Tips**
   - Type partial project names
   - Results appear in dropdown
   - Clear with X button

3. **Space Management**
   - Undock search to free up horizontal space
   - Great for smaller screens/narrow windows
   - Restore when you need to search

4. **State Persistence**
   - Your search text is saved
   - Toggling docking won't clear your search
   - **Coming Soon**: Position preference saved across sessions

### 🎯 Workflow Optimization

**Maximizing TopBar Space:**
1. Start with docked search
2. When focused on editing/mixing, undock to hide search
3. Need to find something? Dock and search
4. Toggle as needed - it's quick!

---

## Styling Reference

### Colors Used

**Docked Search Bar:**
- Input area: Dark gray (`#111827`)
- Border: Medium gray (`#374151`)
- Text: Light gray (`#d1d5db`)
- Icons: Medium gray (`#9ca3af`)

**Undocked Button:**
- Background: Dark gray (`#1f2937`)
- Border: Medium gray (`#374151`)
- Text: Light gray (`#d1d5db`)
- On hover: Slightly lighter background

**Transitions:**
- Undock button fade-in: Smooth on hover
- All borders: Subtle color shift on hover
- Button text: Smooth color transition

---

## Troubleshooting

### Q: The ↑ button isn't showing
**A:** Hover directly over the search bar. The button fades in on hover.

### Q: I clicked the ↑ button but nothing happened
**A:** Make sure you're **holding Ctrl** while clicking. The tooltip says "Ctrl+Click to undock"

### Q: How do I restore the search?
**A:** Click the "Dock Search" button that appears when search is hidden.

### Q: Did my search text disappear?
**A:** No! Your search text is preserved when toggling. It's still there.

### Q: Can I customize when it docks/undocks?
**A:** Not yet, but this can be added! The defaults are optimized for most users.

---

## Browser Compatibility

✅ **Works on:**
- Chrome/Chromium
- Firefox
- Safari
- Edge
- All modern browsers with ES2020+ support

---

## Keyboard Reference

| Key Combination | Action |
|---|---|
| Ctrl+Click on ↑ | Toggle docking (or just click normally) |
| Type in search | Show results |
| Escape | Close dropdown |
| Click X | Clear search text |

---

## Performance Notes

- **No impact** on audio playback
- **Instant response** to clicks
- **Smooth animations** (no lag)
- **Lightweight** - just toggles visibility
- **No network requests** - local state only

---

## Next Features Coming Soon

🔜 **Planned Enhancements:**
1. Alt+D keyboard shortcut for toggle
2. Save docking preference to localStorage
3. Search history/recent searches
4. Advanced search filters
5. Animated transitions

---

## Getting Help

**If something doesn't work:**
1. Check the console (F12) for errors
2. Verify you're using latest browser
3. Try refreshing the page
4. Check that dev server is running on localhost:5173

---

## Summary

✅ **What the feature does:**
- Makes search bar collapsible/expandable
- Saves horizontal space in TopBar
- Quick toggle with one click

✅ **How to use it:**
1. Hover to reveal undock button (↑)
2. Ctrl+Click to hide search
3. Click "Dock Search" to restore

✅ **Benefits:**
- More screen space when needed
- Quick access when you need to search
- Smooth, responsive interaction
- No impact on performance

---

**Enjoy the cleaner, more flexible TopBar! 🎉**

*Feature added: November 30, 2025 | Status: Production Ready*
