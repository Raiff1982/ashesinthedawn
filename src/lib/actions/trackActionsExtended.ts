/**
 * Track Actions - REAPER-compatible track management
 * Handles track creation, deletion, selection, and control
 * 
 * REAPER Action IDs:
 * 41000: Track: Insert new track
 * 41001: Track: Delete track
 * 41002: Track: Select track
 * 41003: Track: Mute track
 * 41004: Track: Solo track
 * 41005: Track: Record arm
 * 41006: Track: Set track volume
 * 41007: Track: Set track pan
 * 41008: Track: Select next track
 * 41009: Track: Select previous track
 * 41010: Track: Duplicate track
 * 41011: Track: Rename track
 */

import { actionRegistry, shortcutManager } from '../actionSystem';

/**
 * Get DAW context safely
 */
function getDAWContext() {
  return (window as any).__CORELOGIC_DAW_CONTEXT__;
}

export function registerTrackActions() {
  // 41000: Insert new track
  actionRegistry.register(
    {
      id: '41000',
      name: 'Track: Insert New Track',
      category: 'Track',
      description: 'Add a new audio track',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'ctrl+alt+n',
    },
    async (payload) => {
      const ctx = getDAWContext();
      if (!ctx?.addTrack) return;
      const type = payload.type ?? 'audio';
      ctx.addTrack(type);
    }
  );

  // 41001: Delete track
  actionRegistry.register(
    {
      id: '41001',
      name: 'Track: Delete Track',
      category: 'Track',
      description: 'Delete selected track',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'ctrl+delete',
      requiresSelection: true,
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.deleteTrack) return;
      ctx.deleteTrack(ctx.selectedTrack.id);
    }
  );

  // 41002: Select track
  actionRegistry.register(
    {
      id: '41002',
      name: 'Track: Select Track',
      category: 'Track',
      description: 'Select a track by index or ID',
      contexts: ['main', 'arrange', 'mixer'],
    },
    async (payload) => {
      const ctx = getDAWContext();
      if (!ctx?.selectTrack) return;
      const trackId = payload.trackId;
      if (trackId) {
        ctx.selectTrack(trackId);
      }
    }
  );

  // 41003: Toggle mute
  actionRegistry.register(
    {
      id: '41003',
      name: 'Track: Toggle Mute',
      category: 'Track',
      description: 'Mute or unmute selected track',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'm',
      requiresSelection: true,
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;
      ctx.updateTrack(ctx.selectedTrack.id, {
        muted: !ctx.selectedTrack.muted,
      });
    }
  );

  // 41004: Toggle solo
  actionRegistry.register(
    {
      id: '41004',
      name: 'Track: Toggle Solo',
      category: 'Track',
      description: 'Solo or unsolo selected track',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 's',
      requiresSelection: true,
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;
      ctx.updateTrack(ctx.selectedTrack.id, {
        soloed: !ctx.selectedTrack.soloed,
      });
    }
  );

  // 41005: Toggle record arm
  actionRegistry.register(
    {
      id: '41005',
      name: 'Track: Toggle Record Arm',
      category: 'Track',
      description: 'Arm or disarm selected track for recording',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'r',
      requiresSelection: true,
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;
      ctx.updateTrack(ctx.selectedTrack.id, {
        armed: !ctx.selectedTrack.armed,
      });
    }
  );

  // 41006: Set track volume
  actionRegistry.register(
    {
      id: '41006',
      name: 'Track: Set Volume',
      category: 'Track',
      description: 'Set track volume in dB',
      contexts: ['main', 'mixer'],
      requiresSelection: true,
    },
    async (payload) => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;
      const volume = payload.volume ?? 0; // Default 0dB
      ctx.updateTrack(ctx.selectedTrack.id, { volume });
    }
  );

  // 41007: Set track pan
  actionRegistry.register(
    {
      id: '41007',
      name: 'Track: Set Pan',
      category: 'Track',
      description: 'Set track pan (-1=left, 0=center, 1=right)',
      contexts: ['main', 'mixer'],
      requiresSelection: true,
    },
    async (payload) => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;
      const pan = Math.max(-1, Math.min(1, payload.pan ?? 0));
      ctx.updateTrack(ctx.selectedTrack.id, { pan });
    }
  );

  // 41008: Select next track
  actionRegistry.register(
    {
      id: '41008',
      name: 'Track: Select Next',
      category: 'Track',
      description: 'Move selection to next track',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'tab',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.selectTrack || !ctx?.tracks) return;

      const currentIdx = ctx.tracks.findIndex(
        (t: any) => t.id === ctx.selectedTrack?.id
      );
      if (currentIdx < ctx.tracks.length - 1) {
        ctx.selectTrack(ctx.tracks[currentIdx + 1].id);
      }
    }
  );

  // 41009: Select previous track
  actionRegistry.register(
    {
      id: '41009',
      name: 'Track: Select Previous',
      category: 'Track',
      description: 'Move selection to previous track',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'shift+tab',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.selectTrack || !ctx?.tracks) return;

      const currentIdx = ctx.tracks.findIndex(
        (t: any) => t.id === ctx.selectedTrack?.id
      );
      if (currentIdx > 0) {
        ctx.selectTrack(ctx.tracks[currentIdx - 1].id);
      }
    }
  );

  // 41010: Duplicate track
  actionRegistry.register(
    {
      id: '41010',
      name: 'Track: Duplicate Track',
      category: 'Track',
      description: 'Create a copy of selected track',
      contexts: ['main', 'arrange'],
      accel: 'ctrl+d',
      requiresSelection: true,
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack) return;

      // Add new track of same type
      if (ctx.duplicateTrack) {
        await ctx.duplicateTrack(ctx.selectedTrack.id);
      } else if (ctx.addTrack) {
        ctx.addTrack(ctx.selectedTrack.type);
      }
    }
  );

  // 41011: Rename track
  actionRegistry.register(
    {
      id: '41011',
      name: 'Track: Rename Track',
      category: 'Track',
      description: 'Rename selected track',
      contexts: ['main', 'arrange', 'mixer'],
      requiresSelection: true,
    },
    async (payload) => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.updateTrack) return;
      const name = payload.name;
      if (name) {
        ctx.updateTrack(ctx.selectedTrack.id, { name });
      }
    }
  );

  // Register shortcuts
  shortcutManager.register({ actionId: '41003', keys: 'm', context: 'main' });
  shortcutManager.register({ actionId: '41004', keys: 's', context: 'main' });
  shortcutManager.register({ actionId: '41005', keys: 'r', context: 'main' });
  shortcutManager.register({ actionId: '41000', keys: 'ctrl+alt+n', context: 'main' });
  shortcutManager.register({ actionId: '41001', keys: 'ctrl+delete', context: 'main' });
  shortcutManager.register({ actionId: '41008', keys: 'tab', context: 'main' });
  shortcutManager.register({ actionId: '41009', keys: 'shift+tab', context: 'main' });
  shortcutManager.register({ actionId: '41010', keys: 'ctrl+d', context: 'main' });
}

export default registerTrackActions;

