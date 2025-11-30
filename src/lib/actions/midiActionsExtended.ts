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
 */

import { actionRegistry, shortcutManager } from '../actionSystem';

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

      // TODO: Implement actual MIDI note insertion
      console.log(`Insert MIDI note: pitch=${pitch}, length=${length}, velocity=${velocity}`);
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
      // TODO: Implement MIDI note deletion
      console.log('Delete selected MIDI notes');
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

      // TODO: Implement MIDI quantization
      console.log(`Quantize MIDI: gridSize=${gridSize}, strength=${strength}%`);
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

      // TODO: Implement MIDI transposition
      console.log(`Transpose up: ${semitones} semitone(s)`);
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

      // TODO: Implement MIDI transposition
      console.log(`Transpose down: ${semitones} semitone(s)`);
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

      // TODO: Implement velocity increase
      console.log(`Increase velocity by ${amount}`);
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

      // TODO: Implement velocity decrease
      console.log(`Decrease velocity by ${amount}`);
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

      // TODO: Implement set velocity
      console.log(`Set velocity to ${velocity}`);
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
      const ccNumber = payload.ccNumber ?? 7; // Volume
      const value = payload.value ?? 64;

      // TODO: Implement CC editing
      console.log(`Edit CC ${ccNumber}: value=${value}`);
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
      const timingAmount = payload.timingAmount ?? 10; // ms
      const velocityAmount = payload.velocityAmount ?? 5; // %

      // TODO: Implement humanization
      console.log(
        `Humanize: timing=${timingAmount}ms, velocity=${velocityAmount}%`
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
      const offset = payload.offset ?? 0.5; // 1/2 beat

      // TODO: Implement note duplication
      console.log(`Duplicate notes with ${offset} beat offset`);
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
      const startPitch = payload.startPitch ?? 60;
      const endPitch = payload.endPitch ?? 72;

      // TODO: Implement range selection
      console.log(`Select notes from C${startPitch} to ${endPitch}`);
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
      const key = payload.key ?? 'C'; // C, D, E, F, G, A, B
      const scale = payload.scale ?? 'major'; // major, minor, pentatonic

      // TODO: Implement key filter
      console.log(`Delete out-of-key notes: ${key} ${scale}`);
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

