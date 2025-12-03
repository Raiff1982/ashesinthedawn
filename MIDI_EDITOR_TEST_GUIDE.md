# ?? MIDI EDITOR - QUICK TEST GUIDE

## ? Dev Server Running

**URL:** http://localhost:5174/

---

## ?? How to Test MIDI Editor

### Step 1: Create Instrument Track
1. Click **"+ Add Track"** button (top left)
2. Select **"Instrument"** from dropdown
3. Name it (e.g., "Piano")
4. Click create

### Step 2: Access MIDI Editor
1. **Select the instrument track** (click it)
2. Look for **MIDI Editor** panel/tab
3. Click **"Create MIDI Sequence"** button
4. Piano roll grid appears!

### Step 3: Add Notes
1. **Click on the grid** where you want notes
   - Y-axis = pitch (higher = higher note)
   - X-axis = time
2. Click multiple times to add several notes
3. Notes appear as blue rectangles

### Step 4: Edit Notes
1. **Drag notes** horizontally to move in time
2. **Drag note edges** to change duration
3. **Select multiple** with Ctrl+Click
4. Use **Duration slider** to adjust all selected
5. Use **Velocity slider** to adjust volume
6. Delete with **Backspace** key

### Step 5: Quantize
1. Use **Quantize dropdown** (1/4, 1/8, 1/16, 1/32)
2. Or use preset buttons in "Quantize Grid" section
3. Notes snap to grid!

### Step 6: Test Playback
1. Click **Play button** (top bar transport)
2. Listen for notes playing
3. Should hear each note with ADSR envelope
4. Playhead moves across piano roll

### Step 7: Humanize
1. Adjust **"Humanize Timing"** slider
2. Adds random timing variation
3. Makes playback sound more natural
4. Slider shows ±milliseconds

---

## ?? What You'll Hear

- **Triangle waveform** synth
- **Smooth ADSR envelope** (attack/decay/sustain/release)
- **Velocity-based volume** (louder notes = higher velocity)
- **Accurate timing** synced to BPM

---

## ? Success Criteria

- [ ] Can create instrument track
- [ ] Piano roll displays correctly
- [ ] Can add notes by clicking
- [ ] Can drag notes to move them
- [ ] Can resize notes (change duration)
- [ ] Can hear notes playing
- [ ] Quantize snaps notes to grid
- [ ] Humanize adds natural variation

---

## ?? Troubleshooting

### No sound?
- Check browser console (F12) for errors
- Ensure speaker volume is up
- Try creating a note with higher velocity

### Piano roll not showing?
- Make sure you selected an instrument track
- Look for "Create MIDI Sequence" button
- Check browser console for errors

### Notes not moving?
- Click once to select, then drag
- Use Ctrl+Click for multi-select
- Check that you're clicking on the note itself

---

## ?? What's Happening Behind the Scenes

1. **Piano Roll renders** note rectangles on canvas
2. **Drag events** update note startTime/duration
3. **Play button** triggers `audioEngine.playMIDISequence()`
4. **Audio engine** creates oscillators with proper ADSR
5. **Web Audio API** plays the synth notes
6. **Playhead** moves in real-time during playback

---

## ?? Next Steps After Testing

Once confirmed working:
1. ? Test complete
2. ?? Build Recording Interface
3. ?? Add punch in/out controls
4. ?? Add input monitoring
5. ?? Save recordings

---

**Enjoy your MIDI Editor!** ??
