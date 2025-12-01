/**
 * Item/Edit Actions - Audio item and MIDI item editing
 * Handles copy, cut, paste, delete, undo/redo operations
 * 
 * REAPER Action IDs:
 * 42000: Edit: Undo
 * 42001: Edit: Redo
 * 42002: Edit: Copy
 * 42003: Edit: Cut
 * 42004: Edit: Paste
 * 42005: Edit: Delete
 * 42006: Edit: Select All
 * 42007: Edit: Deselect All
 * 42008: Edit: Invert Selection
 * 42009: Edit: Clear Project
 */

import { actionRegistry, shortcutManager } from '../actionSystem';

/**
 * Get DAW context safely
 */
function getDAWContext() {
  return (window as any).__CORELOGIC_DAW_CONTEXT__;
}

export function registerItemEditActions() {
  // 42000: Undo
  actionRegistry.register(
    {
      id: '42000',
      name: 'Edit: Undo',
      category: 'Edit',
      description: 'Undo the last action',
      contexts: ['main', 'arrange', 'mixer', 'midi-editor'],
      accel: 'ctrl+z',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.undo) return;
      ctx.undo();
    }
  );

  // 42001: Redo
  actionRegistry.register(
    {
      id: '42001',
      name: 'Edit: Redo',
      category: 'Edit',
      description: 'Redo the last undone action',
      contexts: ['main', 'arrange', 'mixer', 'midi-editor'],
      accel: 'ctrl+y',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.redo) return;
      ctx.redo();
    }
  );

  // 42002: Copy
  actionRegistry.register(
    {
      id: '42002',
      name: 'Edit: Copy',
      category: 'Edit',
      description: 'Copy selected items to clipboard',
      contexts: ['main', 'arrange', 'midi-editor'],
      accel: 'ctrl+c',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack && !ctx?.copyTrack) return;
      
      if (ctx.selectedTrack && ctx.copyTrack) {
        ctx.copyTrack(ctx.selectedTrack.id);
      }
    }
  );

  // 42003: Cut
  actionRegistry.register(
    {
      id: '42003',
      name: 'Edit: Cut',
      category: 'Edit',
      description: 'Cut selected items to clipboard',
      contexts: ['main', 'arrange', 'midi-editor'],
      accel: 'ctrl+x',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack && !ctx?.cutTrack) return;

      if (ctx.selectedTrack && ctx.cutTrack) {
        ctx.cutTrack(ctx.selectedTrack.id);
      }
    }
  );

  // 42004: Paste
  actionRegistry.register(
    {
      id: '42004',
      name: 'Edit: Paste',
      category: 'Edit',
      description: 'Paste items from clipboard',
      contexts: ['main', 'arrange', 'midi-editor'],
      accel: 'ctrl+v',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.pasteTrack) return;
      ctx.pasteTrack();
    }
  );

  // 42005: Delete
  actionRegistry.register(
    {
      id: '42005',
      name: 'Edit: Delete',
      category: 'Edit',
      description: 'Delete selected items',
      contexts: ['main', 'arrange', 'midi-editor'],
      accel: 'delete',
      requiresSelection: true,
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectedTrack || !ctx?.deleteTrack) return;
      ctx.deleteTrack(ctx.selectedTrack.id);
    }
  );

  // 42006: Select All
  actionRegistry.register(
    {
      id: '42006',
      name: 'Edit: Select All',
      category: 'Edit',
      description: 'Select all tracks or items',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'ctrl+a',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.selectAllTracks) return;
      ctx.selectAllTracks();
    }
  );

  // 42007: Deselect All
  actionRegistry.register(
    {
      id: '42007',
      name: 'Edit: Deselect All',
      category: 'Edit',
      description: 'Deselect all tracks or items',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'ctrl+shift+a',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.deselectAllTracks) return;
      ctx.deselectAllTracks();
    }
  );

  // 42008: Invert Selection
  actionRegistry.register(
    {
      id: '42008',
      name: 'Edit: Invert Selection',
      category: 'Edit',
      description: 'Invert the current selection',
      contexts: ['main', 'arrange'],
      accel: 'ctrl+i',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.tracks || !ctx?.selectedTracks) return;

      const newSelection = new Set<string>();
      ctx.tracks.forEach((track: any) => {
        if (!ctx.selectedTracks?.has(track.id)) {
          newSelection.add(track.id);
        }
      });

      // Select new tracks (update selected)
      ctx.deselectAllTracks?.();
      newSelection.forEach((id) => {
        ctx.selectTrack?.(id);
      });
    }
  );

  // 42009: Clear Project
  actionRegistry.register(
    {
      id: '42009',
      name: 'Edit: Clear Project',
      category: 'Edit',
      description: 'Clear all tracks and items',
      contexts: ['main'],
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.tracks || !ctx?.deleteTrack) return;

      // Get all track IDs before deleting
      const trackIds = ctx.tracks.map((t: any) => t.id);

      // Delete all tracks
      trackIds.forEach((id: any) => {
        ctx.deleteTrack?.(id);
      });
    }
  );

  // Register shortcuts
  shortcutManager.register({ actionId: '42000', keys: 'ctrl+z', context: 'main' });
  shortcutManager.register({ actionId: '42001', keys: 'ctrl+y', context: 'main' });
  shortcutManager.register({ actionId: '42002', keys: 'ctrl+c', context: 'main' });
  shortcutManager.register({ actionId: '42003', keys: 'ctrl+x', context: 'main' });
  shortcutManager.register({ actionId: '42004', keys: 'ctrl+v', context: 'main' });
  shortcutManager.register({ actionId: '42005', keys: 'delete', context: 'main' });
  shortcutManager.register({ actionId: '42006', keys: 'ctrl+a', context: 'main' });
  shortcutManager.register({ actionId: '42007', keys: 'ctrl+shift+a', context: 'main' });
  shortcutManager.register({ actionId: '42008', keys: 'ctrl+i', context: 'main' });
}

export default registerItemEditActions;

