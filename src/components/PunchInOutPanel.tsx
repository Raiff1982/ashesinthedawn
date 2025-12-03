/**
 * PUNCH IN/OUT PANEL
 * Configure punch in/out times for automatic recording
 */

import { useState } from 'react';
import { Clock, Settings2 } from 'lucide-react';
import { Tooltip } from './TooltipProvider';

interface PunchInOutPanelProps {
  punchInTime: number;
  punchOutTime: number;
  onPunchInChange: (time: number) => void;
  onPunchOutChange: (time: number) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  maxTime?: number;
}

export function PunchInOutPanel({
  punchInTime,
  punchOutTime,
  onPunchInChange,
  onPunchOutChange,
  enabled,
  onEnabledChange,
  maxTime = 600,
}: PunchInOutPanelProps) {
  const [editingIn, setEditingIn] = useState(false);
  const [editingOut, setEditingOut] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const parseTime = (str: string): number => {
    const parts = str.split(':');
    if (parts.length !== 2) return 0;

    const mins = parseInt(parts[0]) || 0;
    const secParts = parts[1].split('.');
    const secs = parseInt(secParts[0]) || 0;
    const ms = parseInt(secParts[1]) || 0;

    return mins * 60 + secs + ms / 1000;
  };

  return (
    <div className="p-4 space-y-4 bg-gray-800 border-t border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <label className="text-xs font-semibold text-gray-300">Punch In/Out</label>
        </div>
        <Tooltip content={{ 
          title: 'Punch In/Out', 
          description: 'Auto-record at punch times during playback',
          category: 'transport'
        }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onEnabledChange(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-xs text-gray-400">Enabled</span>
          </label>
        </Tooltip>
      </div>

      {/* Punch In */}
      <div>
        <label className="text-xs text-gray-400 block mb-2">Punch In Time</label>
        {editingIn ? (
          <input
            type="text"
            value={formatTime(punchInTime)}
            onChange={(e) => onPunchInChange(parseTime(e.target.value))}
            onBlur={() => setEditingIn(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditingIn(false);
            }}
            className="w-full px-2 py-1 text-sm bg-gray-700 border border-blue-500 rounded text-white font-mono"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setEditingIn(true)}
            className="w-full px-2 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded text-white font-mono transition-colors"
          >
            {formatTime(punchInTime)}
          </button>
        )}
      </div>

      {/* Punch Out */}
      <div>
        <label className="text-xs text-gray-400 block mb-2">Punch Out Time</label>
        {editingOut ? (
          <input
            type="text"
            value={formatTime(punchOutTime)}
            onChange={(e) => onPunchOutChange(parseTime(e.target.value))}
            onBlur={() => setEditingOut(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditingOut(false);
            }}
            className="w-full px-2 py-1 text-sm bg-gray-700 border border-blue-500 rounded text-white font-mono"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setEditingOut(true)}
            className="w-full px-2 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded text-white font-mono transition-colors"
          >
            {formatTime(punchOutTime)}
          </button>
        )}
      </div>

      {/* Duration */}
      <div className="bg-gray-900 rounded p-2 text-xs">
        <div className="flex justify-between text-gray-400">
          <span>Duration:</span>
          <span className="text-gray-300 font-mono">
            {formatTime(Math.max(0, punchOutTime - punchInTime))}
          </span>
        </div>
      </div>

      {/* Presets */}
      <div>
        <label className="text-xs text-gray-400 block mb-2">Presets</label>
        <label className="grid grid-cols-2 gap-2">
          <Tooltip content={{ 
            title: 'Full Song', 
            description: 'Record from start',
            category: 'transport'
          }}>
            <button
              onClick={() => {
                onPunchInChange(0);
                onPunchOutChange(maxTime);
              }}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Full Song
            </button>
          </Tooltip>
          <Tooltip content={{ 
            title: '30 Sec', 
            description: 'Record first 30 seconds',
            category: 'transport'
          }}>
            <button
              onClick={() => {
                onPunchInChange(0);
                onPunchOutChange(30);
              }}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              30 Sec
            </button>
          </Tooltip>
        </label>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500 border-t border-gray-700 pt-2">
        <Settings2 className="w-3 h-3 inline mr-1" />
        Press play ? auto-punch at times
      </div>
    </div>
  );
}
