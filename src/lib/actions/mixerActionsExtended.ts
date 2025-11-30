/**
 * Mixer Actions - Volume, pan, effects, automation control
 * Handles mixing console operations
 * 
 * REAPER Action IDs:
 * 43000: Mixer: Increase Volume
 * 43001: Mixer: Decrease Volume
 * 43002: Mixer: Set Volume (dB)
 * 43003: Mixer: Pan Left
 * 43004: Mixer: Pan Right
 * 43005: Mixer: Center Pan
 * 43006: Mixer: Increment Pan
 * 43007: Mixer: Decrement Pan
 * 43008: Mixer: FX Bypass
 * 43009: Mixer: Toggle Automation Mode
 * 43010: Mixer: Record Automation
 * 43011: Mixer: Latch Automation
 */

import { actionRegistry, shortcutManager } from '../actionSystem';

/**
 * Get DAW context safely
 */
function getDAWContext() {
  return (window as any).__CORELOGIC_DAW_CONTEXT__;
}

export function registerMixerActions() {
  // 43000: Increase Volume
  actionRegistry.register(
    {
      id: '43000',
      name: 'Mixer: Increase Volume',
      category: 'Mixer',
      description: 'Increase track volume by 1dB',
      contexts: ['main', 'mixer'],
      accel: 'ctrl+up',
      requiresSelection: true,
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;

      const currentVolume = ctx.selectedTrack.volume ?? 0;
      const newVolume = Math.min(12, currentVolume + 1); // Max 12dB
      ctx.updateTrack(ctx.selectedTrack.id, { volume: newVolume });
    }
  );

  // 43001: Decrease Volume
  actionRegistry.register(
    {
      id: '43001',
      name: 'Mixer: Decrease Volume',
      category: 'Mixer',
      description: 'Decrease track volume by 1dB',
      contexts: ['main', 'mixer'],
      accel: 'ctrl+down',
      requiresSelection: true,
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;

      const currentVolume = ctx.selectedTrack.volume ?? 0;
      const newVolume = Math.max(-80, currentVolume - 1); // Min -80dB
      ctx.updateTrack(ctx.selectedTrack.id, { volume: newVolume });
    }
  );

  // 43002: Set Volume
  actionRegistry.register(
    {
      id: '43002',
      name: 'Mixer: Set Volume',
      category: 'Mixer',
      description: 'Set track volume to specific dB level',
      contexts: ['main', 'mixer'],
      requiresSelection: true,
    },
    async (payload) => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;

      const volume = Math.max(-80, Math.min(12, payload.volume ?? 0));
      ctx.updateTrack(ctx.selectedTrack.id, { volume });
    }
  );

  // 43003: Pan Left
  actionRegistry.register(
    {
      id: '43003',
      name: 'Mixer: Pan Left',
      category: 'Mixer',
      description: 'Pan track to the left',
      contexts: ['main', 'mixer'],
      accel: 'ctrl+alt+left',
      requiresSelection: true,
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;

      const currentPan = ctx.selectedTrack.pan ?? 0;
      const newPan = Math.max(-1, currentPan - 0.1);
      ctx.updateTrack(ctx.selectedTrack.id, { pan: newPan });
    }
  );

  // 43004: Pan Right
  actionRegistry.register(
    {
      id: '43004',
      name: 'Mixer: Pan Right',
      category: 'Mixer',
      description: 'Pan track to the right',
      contexts: ['main', 'mixer'],
      accel: 'ctrl+alt+right',
      requiresSelection: true,
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;

      const currentPan = ctx.selectedTrack.pan ?? 0;
      const newPan = Math.min(1, currentPan + 0.1);
      ctx.updateTrack(ctx.selectedTrack.id, { pan: newPan });
    }
  );

  // 43005: Center Pan
  actionRegistry.register(
    {
      id: '43005',
      name: 'Mixer: Center Pan',
      category: 'Mixer',
      description: 'Pan track to center (0)',
      contexts: ['main', 'mixer'],
      accel: 'ctrl+alt+c',
      requiresSelection: true,
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;
      ctx.updateTrack(ctx.selectedTrack.id, { pan: 0 });
    }
  );

  // 43006: Increment Pan
  actionRegistry.register(
    {
      id: '43006',
      name: 'Mixer: Increment Pan',
      category: 'Mixer',
      description: 'Pan track incrementally right',
      contexts: ['main', 'mixer'],
      requiresSelection: true,
    },
    async (payload) => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;

      const increment = payload.amount ?? 0.05;
      const currentPan = ctx.selectedTrack.pan ?? 0;
      const newPan = Math.min(1, currentPan + increment);
      ctx.updateTrack(ctx.selectedTrack.id, { pan: newPan });
    }
  );

  // 43007: Decrement Pan
  actionRegistry.register(
    {
      id: '43007',
      name: 'Mixer: Decrement Pan',
      category: 'Mixer',
      description: 'Pan track incrementally left',
      contexts: ['main', 'mixer'],
      requiresSelection: true,
    },
    async (payload) => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;

      const decrement = payload.amount ?? 0.05;
      const currentPan = ctx.selectedTrack.pan ?? 0;
      const newPan = Math.max(-1, currentPan - decrement);
      ctx.updateTrack(ctx.selectedTrack.id, { pan: newPan });
    }
  );

  // 43008: FX Bypass
  actionRegistry.register(
    {
      id: '43008',
      name: 'Mixer: FX Bypass',
      category: 'Mixer',
      description: 'Toggle all FX bypass on selected track',
      contexts: ['main', 'mixer'],
      accel: 'ctrl+b',
      requiresSelection: true,
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;

      // Toggle FX bypass (assuming inserts array in track)
      const isBypassed = (ctx.selectedTrack as any).fxBypassed ?? false;
      ctx.updateTrack(ctx.selectedTrack.id, {
        ...(ctx.selectedTrack as any),
        fxBypassed: !isBypassed,
      });
    }
  );

  // 43009: Toggle Automation Mode
  actionRegistry.register(
    {
      id: '43009',
      name: 'Mixer: Toggle Automation Mode',
      category: 'Mixer',
      description: 'Cycle through automation modes (off/read/write/touch)',
      contexts: ['main', 'mixer'],
      accel: 'ctrl+alt+a',
      requiresSelection: true,
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;

      const modes = ['off', 'read', 'write', 'touch'] as const;
      const currentMode = (ctx.selectedTrack as any).automationMode ?? 'off';
      const currentIdx = modes.indexOf(currentMode as any);
      const nextIdx = (currentIdx + 1) % modes.length;

      ctx.updateTrack(ctx.selectedTrack.id, {
        automationMode: modes[nextIdx],
      });
    }
  );

  // 43010: Record Automation
  actionRegistry.register(
    {
      id: '43010',
      name: 'Mixer: Record Automation',
      category: 'Mixer',
      description: 'Enable automation recording on selected parameter',
      contexts: ['main', 'mixer'],
      requiresSelection: true,
    },
    async (payload) => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;

      const parameter = payload.parameter ?? 'volume'; // volume, pan, etc
      ctx.updateTrack(ctx.selectedTrack.id, {
        automationMode: 'write',
        automatedParameter: parameter,
      });
    }
  );

  // 43011: Latch Automation
  actionRegistry.register(
    {
      id: '43011',
      name: 'Mixer: Latch Automation',
      category: 'Mixer',
      description: 'Enable latch mode for automation',
      contexts: ['main', 'mixer'],
      requiresSelection: true,
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;

      ctx.updateTrack(ctx.selectedTrack.id, {
        automationMode: 'touch',
      });
    }
  );

  // Register shortcuts
  shortcutManager.register({ actionId: '43000', keys: 'ctrl+up', context: 'main' });
  shortcutManager.register({ actionId: '43001', keys: 'ctrl+down', context: 'main' });
  shortcutManager.register({ actionId: '43003', keys: 'ctrl+alt+left', context: 'main' });
  shortcutManager.register({ actionId: '43004', keys: 'ctrl+alt+right', context: 'main' });
  shortcutManager.register({ actionId: '43005', keys: 'ctrl+alt+c', context: 'main' });
  shortcutManager.register({ actionId: '43008', keys: 'ctrl+b', context: 'main' });
  shortcutManager.register({ actionId: '43009', keys: 'ctrl+alt+a', context: 'main' });
}

export default registerMixerActions;

