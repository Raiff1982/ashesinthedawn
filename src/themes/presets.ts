/**
 * REAPER Theme Presets
 * Default themes inspired by REAPER professional DAW
 */

import { Theme } from './types';

export const reaper_default: Theme = {
  id: 'reaper-default',
  name: 'REAPER Default (Dark)',
  description: 'REAPER 7.x inspired dark theme with professional audio production aesthetic',
  version: '1.0',
  author: 'CoreLogic Studio',
  category: 'dark',
  isCustom: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  colors: {
    bg: {
      primary: '#292929',
      secondary: '#3d3d3d',
      tertiary: '#3c3c3c',
      alt: '#2d2d2d',
      hover: '#4a4a4a',
      selected: '#404040',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#b0b0b0',
      tertiary: '#808080',
      accent: '#66bb6a',
    },
    border: {
      primary: '#464646',
      secondary: '#3a3a3a',
      divider: '#414141',
    },
    ui: {
      mute: '#6b8cae',
      solo: '#d4a574',
      record: '#c85a54',
      play: '#66bb6a',
      stop: '#b0b0b0',
      armed: '#d4a574',
      success: '#66bb6a',
      warning: '#ffa726',
      error: '#ef5350',
    },
    meter: {
      background: '#1a1a1a',
      filled: '#4db84d',
      peak: '#ff6b6b',
      clipping: '#ff0000',
      rms: '#88cc88',
    },
    fader: {
      background: '#2a2a2a',
      thumb: '#5a5a5a',
      hover: '#6a6a6a',
      zeroLine: '#4db84d',
    },
    waveform: {
      background: '#1a1a1a',
      foreground: '#4db84d',
      peak: '#66bb6a',
      rms: '#3d8b40',
      selection: '#6b8cae33',
    },
    track: {
      background: '#3d3d3d',
      backgroundSelected: '#464646',
      nameBackground: '#2d2d2d',
      border: '#464646',
    },
    automation: {
      line: '#66bb6a',
      point: '#4db84d',
      envelope: '#6b8cae',
    },
  },

  fonts: {
    family: {
      ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"Monaco", "Courier New", monospace',
    },
    size: {
      xs: 10,
      sm: 11,
      base: 12,
      lg: 13,
      xl: 14,
    },
    weight: {
      normal: 400,
      semibold: 600,
      bold: 700,
    },
  },

  layout: {
    tcp: {
      width: 240,
      minHeight: 74,
      folderIndent: 22,
      defaultHeights: {
        superCollapsed: 24,
        small: 49,
        medium: 72,
        full: 150,
      },
    },
    mcp: {
      minHeight: 230,
      stripWidth: 104,
      masterMinHeight: 74,
    },
    transport: {
      height: 48,
    },
    arrange: {
      rulerHeight: 32,
    },
    spacing: {
      xs: 2,
      sm: 4,
      md: 8,
      lg: 16,
    },
    radius: {
      none: 0,
      sm: 2,
      md: 4,
      lg: 8,
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
      md: '0 4px 6px rgba(0, 0, 0, 0.6)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.8)',
    },
  },
};

export const reaper_light: Theme = {
  id: 'reaper-light',
  name: 'REAPER Light',
  description: 'REAPER-inspired light theme for bright environments',
  version: '1.0',
  author: 'CoreLogic Studio',
  category: 'light',
  isCustom: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  colors: {
    bg: {
      primary: '#f5f5f5',
      secondary: '#efefef',
      tertiary: '#e8e8e8',
      alt: '#fafafa',
      hover: '#e0e0e0',
      selected: '#d0d0d0',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#4a4a4a',
      tertiary: '#8a8a8a',
      accent: '#2e7d32',
    },
    border: {
      primary: '#d0d0d0',
      secondary: '#e0e0e0',
      divider: '#dcdcdc',
    },
    ui: {
      mute: '#1976d2',
      solo: '#f57c00',
      record: '#d32f2f',
      play: '#388e3c',
      stop: '#757575',
      armed: '#f57c00',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
    },
    meter: {
      background: '#fff9c4',
      filled: '#66bb6a',
      peak: '#ff5252',
      clipping: '#ff0000',
      rms: '#81c784',
    },
    fader: {
      background: '#f0f0f0',
      thumb: '#9e9e9e',
      hover: '#757575',
      zeroLine: '#66bb6a',
    },
    waveform: {
      background: '#fafafa',
      foreground: '#66bb6a',
      peak: '#4caf50',
      rms: '#2e7d32',
      selection: '#1976d233',
    },
    track: {
      background: '#f5f5f5',
      backgroundSelected: '#e3f2fd',
      nameBackground: '#fafafa',
      border: '#e0e0e0',
    },
    automation: {
      line: '#66bb6a',
      point: '#4caf50',
      envelope: '#1976d2',
    },
  },

  fonts: {
    family: {
      ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"Monaco", "Courier New", monospace',
    },
    size: {
      xs: 10,
      sm: 11,
      base: 12,
      lg: 13,
      xl: 14,
    },
    weight: {
      normal: 400,
      semibold: 600,
      bold: 700,
    },
  },

  layout: {
    tcp: {
      width: 240,
      minHeight: 74,
      folderIndent: 22,
      defaultHeights: {
        superCollapsed: 24,
        small: 49,
        medium: 72,
        full: 150,
      },
    },
    mcp: {
      minHeight: 230,
      stripWidth: 104,
      masterMinHeight: 74,
    },
    transport: {
      height: 48,
    },
    arrange: {
      rulerHeight: 32,
    },
    spacing: {
      xs: 2,
      sm: 4,
      md: 8,
      lg: 16,
    },
    radius: {
      none: 0,
      sm: 2,
      md: 4,
      lg: 8,
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
      md: '0 4px 6px rgba(0, 0, 0, 0.15)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.2)',
    },
  },
};

export const high_contrast: Theme = {
  id: 'high-contrast',
  name: 'High Contrast',
  description: 'High contrast theme for better visibility and accessibility',
  version: '1.0',
  author: 'CoreLogic Studio',
  category: 'dark',
  isCustom: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  colors: {
    bg: {
      primary: '#000000',
      secondary: '#1a1a1a',
      tertiary: '#2a2a2a',
      alt: '#0d0d0d',
      hover: '#3a3a3a',
      selected: '#404040',
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
      tertiary: '#999999',
      accent: '#ffff00',
    },
    border: {
      primary: '#ffffff',
      secondary: '#808080',
      divider: '#666666',
    },
    ui: {
      mute: '#00ccff',
      solo: '#ffff00',
      record: '#ff0000',
      play: '#00ff00',
      stop: '#cccccc',
      armed: '#ffff00',
      success: '#00ff00',
      warning: '#ffaa00',
      error: '#ff0000',
    },
    meter: {
      background: '#000000',
      filled: '#00ff00',
      peak: '#ff0000',
      clipping: '#ff00ff',
      rms: '#00ffff',
    },
    fader: {
      background: '#1a1a1a',
      thumb: '#cccccc',
      hover: '#ffffff',
      zeroLine: '#00ff00',
    },
    waveform: {
      background: '#000000',
      foreground: '#00ff00',
      peak: '#ffff00',
      rms: '#00ffff',
      selection: '#0088ff44',
    },
    track: {
      background: '#1a1a1a',
      backgroundSelected: '#3a3a3a',
      nameBackground: '#0d0d0d',
      border: '#ffffff',
    },
    automation: {
      line: '#00ff00',
      point: '#ffff00',
      envelope: '#00ccff',
    },
  },

  fonts: {
    family: {
      ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"Monaco", "Courier New", monospace',
    },
    size: {
      xs: 11,
      sm: 12,
      base: 13,
      lg: 14,
      xl: 15,
    },
    weight: {
      normal: 400,
      semibold: 600,
      bold: 700,
    },
  },

  layout: {
    tcp: {
      width: 260,
      minHeight: 80,
      folderIndent: 24,
      defaultHeights: {
        superCollapsed: 28,
        small: 56,
        medium: 84,
        full: 160,
      },
    },
    mcp: {
      minHeight: 240,
      stripWidth: 120,
      masterMinHeight: 80,
    },
    transport: {
      height: 52,
    },
    arrange: {
      rulerHeight: 36,
    },
    spacing: {
      xs: 3,
      sm: 6,
      md: 10,
      lg: 18,
    },
    radius: {
      none: 0,
      sm: 3,
      md: 6,
      lg: 10,
    },
    shadow: {
      sm: '0 2px 4px rgba(0, 0, 0, 1)',
      md: '0 6px 12px rgba(0, 0, 0, 1)',
      lg: '0 12px 24px rgba(0, 0, 0, 1)',
    },
  },
};
