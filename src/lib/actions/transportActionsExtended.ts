/**
 * Transport Actions - Extended REAPER-compatible implementation
 * Handles all playback, recording, and timeline control
 * 
 * REAPER Action IDs:
 * 40044: Transport: Play
 * 40045: Transport: Pause
 * 40046: Transport: Play/Stop (toggle)
 * 40047: Transport: Record: toggle record
 * 40048: Transport: Stop and set cursor to start of project
 * 40049: Transport: Seek to project start
 * 40050: Transport: Seek forward (5s)
 * 40051: Transport: Seek backward (5s)
 * 40052: Transport: Set metronome click volume
 * 40053: Transport: Toggle metronome
 */

import { actionRegistry, shortcutManager } from '../actionSystem';

/**
 * Get DAW context safely from either global or local storage
 */
function getDAWContext() {
  return (window as any).__CORELOGIC_DAW_CONTEXT__;
}

export function registerTransportActions() {
  // 40044: Play
  actionRegistry.register(
    {
      id: '40044',
      name: 'Transport: Play',
      category: 'Transport',
      description: 'Start playback from current position',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'space',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.togglePlay || !ctx?.isPlaying) return;
      if (ctx.isPlaying === false) {
        ctx.togglePlay();
      }
    }
  );

  // 40045: Pause
  actionRegistry.register(
    {
      id: '40045',
      name: 'Transport: Pause',
      category: 'Transport',
      description: 'Pause playback without moving playhead',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'alt+space',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.togglePlay || !ctx?.isPlaying) return;
      if (ctx.isPlaying === true) {
        ctx.togglePlay();
      }
    }
  );

  // 40046: Play/Stop
  actionRegistry.register(
    {
      id: '40046',
      name: 'Transport: Play/Stop',
      category: 'Transport',
      description: 'Toggle playback or stop and seek to start',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'shift+space',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx) return;

      if (ctx.isPlaying) {
        ctx.togglePlay?.();
        if (ctx.seek) ctx.seek(0);
      } else {
        ctx.togglePlay?.();
      }
    }
  );

  // 40047: Record Toggle
  actionRegistry.register(
    {
      id: '40047',
      name: 'Transport: Record Toggle',
      category: 'Transport',
      description: 'Toggle record mode on/off',
      contexts: ['main', 'arrange'],
      accel: 'ctrl+r',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.toggleRecord) return;
      ctx.toggleRecord();
    }
  );

  // 40048: Stop and Seek to Start
  actionRegistry.register(
    {
      id: '40048',
      name: 'Transport: Stop and Seek to Start',
      category: 'Transport',
      description: 'Stop playback and move cursor to project start',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'shift+alt+space',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx) return;
      if (ctx.isPlaying && ctx.togglePlay) {
        ctx.togglePlay();
      }
      if (ctx.seek) {
        ctx.seek(0);
      }
    }
  );

  // 40049: Seek to Project Start
  actionRegistry.register(
    {
      id: '40049',
      name: 'Transport: Seek to Project Start',
      category: 'Transport',
      description: 'Jump cursor to beginning of project',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'home',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.seek) return;
      ctx.seek(0);
    }
  );

  // 40050: Seek Forward
  actionRegistry.register(
    {
      id: '40050',
      name: 'Transport: Seek Forward (5s)',
      category: 'Transport',
      description: 'Move playhead forward 5 seconds',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'right',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.seek || ctx.currentTime === undefined) return;
      const newTime = ctx.currentTime + 5;
      ctx.seek(newTime);
    }
  );

  // 40051: Seek Backward
  actionRegistry.register(
    {
      id: '40051',
      name: 'Transport: Seek Backward (5s)',
      category: 'Transport',
      description: 'Move playhead backward 5 seconds',
      contexts: ['main', 'arrange', 'mixer'],
      accel: 'left',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.seek || ctx.currentTime === undefined) return;
      const newTime = Math.max(0, ctx.currentTime - 5);
      ctx.seek(newTime);
    }
  );

  // 40052: Toggle Metronome
  actionRegistry.register(
    {
      id: '40052',
      name: 'Transport: Toggle Metronome',
      category: 'Transport',
      description: 'Turn metronome/click track on or off',
      contexts: ['main', 'arrange'],
      accel: 'ctrl+alt+m',
    },
    async () => {
      const ctx = getDAWContext();
      if (!ctx?.toggleMetronome) return;
      ctx.toggleMetronome();
    }
  );

  // 40053: Metronome Volume
  actionRegistry.register(
    {
      id: '40053',
      name: 'Transport: Set Metronome Volume',
      category: 'Transport',
      description: 'Adjust metronome/click track volume',
      contexts: ['main', 'arrange'],
    },
    async (payload) => {
      const ctx = getDAWContext();
      if (!ctx?.setMetronomeVolume) return;
      const volume = payload.volume ?? 0.3;
      ctx.setMetronomeVolume(volume);
    }
  );

  // Register all shortcuts
  shortcutManager.register({ actionId: '40044', keys: 'space', context: 'main' });
  shortcutManager.register({ actionId: '40045', keys: 'alt+space', context: 'main' });
  shortcutManager.register({ actionId: '40046', keys: 'shift+space', context: 'main' });
  shortcutManager.register({ actionId: '40047', keys: 'ctrl+r', context: 'main' });
  shortcutManager.register({ actionId: '40048', keys: 'shift+alt+space', context: 'main' });
  shortcutManager.register({ actionId: '40049', keys: 'home', context: 'main' });
  shortcutManager.register({ actionId: '40050', keys: 'right', context: 'main' });
  shortcutManager.register({ actionId: '40051', keys: 'left', context: 'main' });
}

export default registerTransportActions;

