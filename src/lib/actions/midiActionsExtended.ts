/**
 * MIDI Editor Actions - Note editing, CC editing, quantization, transposition
 * Handles all MIDI-specific editing operations
 * 
 * REAPER Action IDs:
 * 44100: MIDI: Insert Note
 * 44101: MIDI: Delete Note
 * 44102: MIDI: Quantize Notes
 * 44103: MIDI: Transpose Up
 * 44104: MIDI: Transpose Down
 * 44105: MIDI: Velocity Up
 * 44106: MIDI: Velocity Down
 * 44107: MIDI: Set Velocity
 * 44108: MIDI: Edit CC
 * 44109: MIDI: Humanize
 * 44110: MIDI: Duplicate Notes
 * 44111: MIDI: Select Note Range
 * 44112: MIDI: Delete Out-of-Key Notes
 */

import { actionRegistry, shortcutManager } from '../actionSystem';

// MIDI State Management
interface MIDINote {
  pitch: number;
  velocity: number;
  startTime: number;
  duration: number;
}

interface MIDIState {
  selectedNotes: MIDINote[];
  clipboard: MIDINote[];
}

let midiState: MIDIState = {
  selectedNotes: [],
  clipboard: [],
};

// MIDI Note name mapping for display
const MIDI_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getMidiNoteName(pitch: number): string {
  const octave = Math.floor(pitch / 12) - 1;
  const noteIdx = pitch % 12;
  return `${MIDI_NOTE_NAMES[noteIdx]}${octave}`;
}

export function registerMIDIActions() {
  // 44100: Insert Note
  actionRegistry.register(
    {
      id: '44100',
      name: 'MIDI: Insert Note',
      category: 'MIDI',
      description: 'Insert a note at cursor position in MIDI editor',
      contexts: ['midi-editor'],
    },
    async (payload) => {
      const pitch = payload.pitch ?? 60; // C4
      const length = payload.length ?? 0.5; // Half note
      const velocity = payload.velocity ?? 100;
      const startTime = payload.startTime ?? 0;

      // Validate MIDI values
      const validatedPitch = Math.max(0, Math.min(127, pitch));
      const validatedVelocity = Math.max(0, Math.min(127, velocity));
      const noteName = getMidiNoteName(validatedPitch);

      const newNote: MIDINote = {
        pitch: validatedPitch,
        velocity: validatedVelocity,
        startTime,
        duration: Math.max(0.01, length),
      };

      midiState.selectedNotes.push(newNote);

      console.log(
        `✅ Inserted MIDI note: ${noteName} (pitch=${validatedPitch}, vel=${validatedVelocity}, dur=${length}s)`,
        { pitch: validatedPitch, velocity: validatedVelocity, noteName, duration: length, totalNotes: midiState.selectedNotes.length }
      );
    }
  );

  // 44101: Delete Note
  actionRegistry.register(
    {
      id: '44101',
      name: 'MIDI: Delete Note',
      category: 'MIDI',
      description: 'Delete selected MIDI note(s)',
      contexts: ['midi-editor'],
      accel: 'delete',
    },
    async () => {
      const deletedCount = midiState.selectedNotes.length;
      const deletedNotes = midiState.selectedNotes.map(n => getMidiNoteName(n.pitch));
      midiState.selectedNotes = [];

      console.log(
        `✅ Deleted ${deletedCount} MIDI note(s): ${deletedNotes.join(', ')}`,
        { count: deletedCount, notes: deletedNotes }
      );
    }
  );

  // 44102: Quantize Notes
  actionRegistry.register(
    {
      id: '44102',
      name: 'MIDI: Quantize Notes',
      category: 'MIDI',
      description: 'Quantize selected notes to grid',
      contexts: ['midi-editor'],
      accel: 'q',
    },
    async (payload) => {
      const gridSize = payload.gridSize ?? 0.25; // 16th note
      const strength = payload.strength ?? 100; // 0-100%

      const quantizedNotes = midiState.selectedNotes.map((note) => ({
        ...note,
        startTime:
          Math.round((note.startTime / gridSize) * (strength / 100)) * gridSize,
      }));

      midiState.selectedNotes = quantizedNotes;

      const noteNames = quantizedNotes.map(n => getMidiNoteName(n.pitch));
      console.log(
        `✅ Quantized ${quantizedNotes.length} note(s) to grid: gridSize=${gridSize}, strength=${strength}% | Notes: ${noteNames.join(', ')}`,
        { count: quantizedNotes.length, gridSize, strength, notes: noteNames }
      );
    }
  );

  // 44103: Transpose Up
  actionRegistry.register(
    {
      id: '44103',
      name: 'MIDI: Transpose Up',
      category: 'MIDI',
      description: 'Transpose selected notes up by semitone(s)',
      contexts: ['midi-editor'],
      accel: 'up',
    },
    async (payload) => {
      const semitones = payload.semitones ?? 1;

      const transposedNotes = midiState.selectedNotes.map((note) => ({
        ...note,
        pitch: Math.max(0, Math.min(127, note.pitch + semitones)),
      }));

      midiState.selectedNotes = transposedNotes;

      console.log(
        `✅ Transposed up ${semitones} semitone(s) - ${transposedNotes.length} note(s)`
      );
    }
  );

  // 44104: Transpose Down
  actionRegistry.register(
    {
      id: '44104',
      name: 'MIDI: Transpose Down',
      category: 'MIDI',
      description: 'Transpose selected notes down by semitone(s)',
      contexts: ['midi-editor'],
      accel: 'down',
    },
    async (payload) => {
      const semitones = payload.semitones ?? 1;

      const transposedNotes = midiState.selectedNotes.map((note) => ({
        ...note,
        pitch: Math.max(0, Math.min(127, note.pitch - semitones)),
      }));

      midiState.selectedNotes = transposedNotes;

      console.log(
        `✅ Transposed down ${semitones} semitone(s) - ${transposedNotes.length} note(s)`
      );
    }
  );

  // 44105: Velocity Up
  actionRegistry.register(
    {
      id: '44105',
      name: 'MIDI: Velocity Up',
      category: 'MIDI',
      description: 'Increase velocity of selected notes',
      contexts: ['midi-editor'],
      accel: 'ctrl+up',
    },
    async (payload) => {
      const amount = payload.amount ?? 5;

      const velocityChangedNotes = midiState.selectedNotes.map((note) => ({
        ...note,
        velocity: Math.max(0, Math.min(127, note.velocity + amount)),
      }));

      midiState.selectedNotes = velocityChangedNotes;

      console.log(
        `✅ Increased velocity by ${amount} - ${velocityChangedNotes.length} note(s)`
      );
    }
  );

  // 44106: Velocity Down
  actionRegistry.register(
    {
      id: '44106',
      name: 'MIDI: Velocity Down',
      category: 'MIDI',
      description: 'Decrease velocity of selected notes',
      contexts: ['midi-editor'],
      accel: 'ctrl+down',
    },
    async (payload) => {
      const amount = payload.amount ?? 5;

      const velocityChangedNotes = midiState.selectedNotes.map((note) => ({
        ...note,
        velocity: Math.max(0, Math.min(127, note.velocity - amount)),
      }));

      midiState.selectedNotes = velocityChangedNotes;

      console.log(
        `✅ Decreased velocity by ${amount} - ${velocityChangedNotes.length} note(s)`
      );
    }
  );

  // 44107: Set Velocity
  actionRegistry.register(
    {
      id: '44107',
      name: 'MIDI: Set Velocity',
      category: 'MIDI',
      description: 'Set velocity of selected notes to specific value',
      contexts: ['midi-editor'],
    },
    async (payload) => {
      const velocity = Math.max(0, Math.min(127, payload.velocity ?? 100));

      midiState.selectedNotes = midiState.selectedNotes.map((note) => ({
        ...note,
        velocity,
      }));

      console.log(
        `✅ Set velocity to ${velocity} - ${midiState.selectedNotes.length} note(s)`
      );
    }
  );

  // 44108: Edit CC
  actionRegistry.register(
    {
      id: '44108',
      name: 'MIDI: Edit CC',
      category: 'MIDI',
      description: 'Edit MIDI CC (Control Change) automation',
      contexts: ['midi-editor'],
    },
    async (payload) => {
      const ccNumber = Math.max(0, Math.min(119, payload.ccNumber ?? 7)); // CC 0-119
      const value = Math.max(0, Math.min(127, payload.value ?? 64));
      const time = payload.time ?? 0;

      console.log(
        `✅ CC ${ccNumber} edited: value=${value} at time=${time} (0-127 range)`
      );
    }
  );

  // 44109: Humanize
  actionRegistry.register(
    {
      id: '44109',
      name: 'MIDI: Humanize',
      category: 'MIDI',
      description: 'Add subtle timing and velocity variations',
      contexts: ['midi-editor'],
      accel: 'h',
    },
    async (payload) => {
      const timingAmount = Math.max(0, payload.timingAmount ?? 10); // ms
      const velocityAmount = Math.max(0, Math.min(50, payload.velocityAmount ?? 5)); // %

      const humanizedNotes = midiState.selectedNotes.map((note) => {
        // Add random timing variation
        const timingVariation = (Math.random() - 0.5) * timingAmount * 0.001;
        // Add random velocity variation
        const velocityVariation = Math.round(
          (Math.random() - 0.5) * (127 * velocityAmount * 0.01)
        );

        return {
          ...note,
          startTime: note.startTime + timingVariation,
          velocity: Math.max(0, Math.min(127, note.velocity + velocityVariation)),
        };
      });

      midiState.selectedNotes = humanizedNotes;

      const noteNames = humanizedNotes.map(n => getMidiNoteName(n.pitch));
      console.log(
        `✅ Humanized ${humanizedNotes.length} note(s): timing±${timingAmount}ms, velocity±${velocityAmount}% | Notes: ${noteNames.join(', ')}`,
        { count: humanizedNotes.length, timingAmount, velocityAmount, notes: noteNames }
      );
    }
  );

  // 44110: Duplicate Notes
  actionRegistry.register(
    {
      id: '44110',
      name: 'MIDI: Duplicate Notes',
      category: 'MIDI',
      description: 'Duplicate selected MIDI notes',
      contexts: ['midi-editor'],
      accel: 'ctrl+d',
    },
    async (payload) => {
      const offset = Math.max(0.01, payload.offset ?? 0.5); // 1/2 beat

      const duplicatedNotes = midiState.selectedNotes.map((note) => ({
        ...note,
        startTime: note.startTime + offset,
      }));

      midiState.selectedNotes = [
        ...midiState.selectedNotes,
        ...duplicatedNotes,
      ];

      console.log(
        `✅ Duplicated ${duplicatedNotes.length} notes with ${offset} beat offset`
      );
    }
  );

  // 44111: Select Note Range
  actionRegistry.register(
    {
      id: '44111',
      name: 'MIDI: Select Note Range',
      category: 'MIDI',
      description: 'Select notes within pitch range',
      contexts: ['midi-editor'],
    },
    async (payload) => {
      const startPitch = Math.max(0, Math.min(127, payload.startPitch ?? 60));
      const endPitch = Math.max(0, Math.min(127, payload.endPitch ?? 72));

      const min = Math.min(startPitch, endPitch);
      const max = Math.max(startPitch, endPitch);

      const selectedNotes = midiState.selectedNotes.filter(
        (note) => note.pitch >= min && note.pitch <= max
      );

      midiState.selectedNotes = selectedNotes;

      console.log(
        `✅ Selected ${selectedNotes.length} notes in range ${min}-${max}`
      );
    }
  );

  // 44112: Delete Out-of-Key Notes
  actionRegistry.register(
    {
      id: '44112',
      name: 'MIDI: Delete Out-of-Key Notes',
      category: 'MIDI',
      description: 'Remove notes not in specified key',
      contexts: ['midi-editor'],
    },
    async (payload) => {
      const key = (payload.key ?? 'C').toUpperCase();
      const scale = (payload.scale ?? 'major').toLowerCase();

      // Define key signatures (pitch classes in semitones from C)
      const scales: Record<string, Record<string, number[]>> = {
        major: {
          C: [0, 2, 4, 5, 7, 9, 11],
          D: [2, 4, 6, 7, 9, 11, 1],
          E: [4, 6, 8, 9, 11, 1, 3],
          F: [5, 7, 9, 10, 0, 2, 4],
          G: [7, 9, 11, 0, 2, 4, 6],
          A: [9, 11, 1, 2, 4, 6, 8],
          B: [11, 1, 3, 4, 6, 8, 10],
        },
        minor: {
          A: [9, 11, 0, 2, 4, 5, 7],
          B: [11, 1, 2, 4, 6, 7, 9],
          C: [0, 3, 5, 7, 8, 10, 0],
          D: [2, 4, 5, 7, 9, 10, 0],
          E: [4, 6, 7, 9, 11, 0, 2],
          F: [5, 7, 8, 10, 0, 1, 3],
          G: [7, 9, 10, 0, 2, 3, 5],
        },
      };

      const validPitches = scales[scale]?.[key] ?? [0, 2, 4, 5, 7, 9, 11];

      const inKeyNotes = midiState.selectedNotes.filter((note) => {
        const pitchClass = note.pitch % 12;
        return validPitches.includes(pitchClass);
      });

      const outOfKeyCount = midiState.selectedNotes.length - inKeyNotes.length;
      midiState.selectedNotes = inKeyNotes;

      console.log(
        `✅ Deleted ${outOfKeyCount} out-of-key notes - ${inKeyNotes.length} in-key notes remain (${key} ${scale})`
      );
    }
  );

  // Register MIDI shortcuts
  shortcutManager.register({ actionId: '44101', keys: 'delete', context: 'midi-editor' });
  shortcutManager.register({ actionId: '44102', keys: 'q', context: 'midi-editor' });
  shortcutManager.register({ actionId: '44103', keys: 'up', context: 'midi-editor' });
  shortcutManager.register({ actionId: '44104', keys: 'down', context: 'midi-editor' });
  shortcutManager.register({ actionId: '44105', keys: 'ctrl+up', context: 'midi-editor' });
  shortcutManager.register({ actionId: '44106', keys: 'ctrl+down', context: 'midi-editor' });
  shortcutManager.register({ actionId: '44109', keys: 'h', context: 'midi-editor' });
  shortcutManager.register({ actionId: '44110', keys: 'ctrl+d', context: 'midi-editor' });
}

export default registerMIDIActions;

