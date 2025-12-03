/**
 * ADVANCED MIXER CONTROLS COMPONENT
 * Stereo Width, Phase Flip, Automation Mode, Send Levels, Bus Routing
 */

import { useState } from 'react';
import { Track, Send } from '../types';
import { Tooltip } from './TooltipProvider';
import { Maximize2, RotateCw, Zap } from 'lucide-react';

interface AdvancedMixerControlsProps {
  track: Track;
  onUpdate: (trackId: string, updates: Partial<Track>) => void;
}

export function AdvancedMixerControls({
  track,
  onUpdate,
}: AdvancedMixerControlsProps) {
  const [selectedSendIndex, setSelectedSendIndex] = useState(0);

  const handleStereoWidthChange = (value: number) => {
    onUpdate(track.id, { stereoWidth: Math.max(0, Math.min(200, value)) });
  };

  const handlePhaseFlip = () => {
    onUpdate(track.id, { phaseFlip: !track.phaseFlip });
  };

  const handleAutomationModeChange = (mode: 'off' | 'read' | 'write' | 'touch') => {
    onUpdate(track.id, { automationMode: mode });
  };

  const handleSendLevelChange = (sendIndex: number, level: number) => {
    if (!track.sends) return;
    const newSends = [...track.sends];
    newSends[sendIndex] = { ...newSends[sendIndex], level: Math.max(-60, Math.min(12, level)) };
    onUpdate(track.id, { sends: newSends });
  };

  const handleRoutingChange = (destination: string) => {
    onUpdate(track.id, { routing: destination });
  };

  return (
    <div className="flex flex-col gap-3 p-2 h-full overflow-y-auto">
      {/* STEREO WIDTH CONTROL */}
      <div className="space-y-1">
        <Tooltip
          content={{
            title: 'Stereo Width',
            description: 'Adjusts the stereo image width. 0% = Mono, 100% = Normal, 200% = Extra wide',
            category: 'mixer',
            relatedFunctions: ['Pan', 'Phase Flip', 'Routing'],
            performanceTip: 'Use 0% to mono down problematic stereo sources; use 100-150% on reverb for spaciousness',
            examples: ['Drums: 100%', 'Reverb: 150-180%', 'Cymbals: 100-120%', 'Bass: 0-50%'],
          }}
          position="left"
        >
          <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
            <Maximize2 className="w-3 h-3" /> Width
          </label>
        </Tooltip>

        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="200"
            step="5"
            value={track.stereoWidth || 100}
            onChange={(e) => handleStereoWidthChange(Number(e.target.value))}
            className="flex-1 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs font-mono text-gray-400 w-8 text-right">{track.stereoWidth || 100}%</span>
        </div>
      </div>

      {/* PHASE FLIP BUTTON */}
      <div>
        <Tooltip
          content={{
            title: 'Phase Flip',
            description: 'Inverts the phase of this track by 180°. Useful for phase alignment and fixing phase issues.',
            category: 'mixer',
            relatedFunctions: ['Stereo Width', 'Pan', 'Routing'],
            performanceTip: 'If a track sounds weaker when mixed with another, try phase flipping to check phase alignment',
            examples: ['Align drum overheads', 'Fix phase issues from close/distant mics', 'Tighten kick + bass'],
          }}
          position="left"
        >
          <button
            onClick={handlePhaseFlip}
            className={`w-full px-2 py-2 rounded text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              track.phaseFlip
                ? 'bg-cyan-600/60 text-cyan-100 shadow-md shadow-cyan-500/30'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <RotateCw className="w-3 h-3" /> Phase 180°
          </button>
        </Tooltip>
      </div>

      {/* AUTOMATION MODE SELECTOR */}
      <div className="space-y-1">
        <Tooltip
          content={{
            title: 'Automation Mode',
            description: 'off: No automation | read: Play back recorded automation | write: Record new automation | touch: Touch-sensitive recording',
            category: 'mixer',
            relatedFunctions: ['Automation Curve', 'Undo/Redo'],
            performanceTip: 'Use read mode during final mix. Use write for recording moves; switch to read to finalize.',
            examples: ['Record vocal level rides in write mode', 'Play them back in read mode', 'Use touch for quick adjustments'],
          }}
          position="left"
        >
          <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Automation
          </label>
        </Tooltip>

        <div className="grid grid-cols-2 gap-1">
          {(['off', 'read', 'write', 'touch'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleAutomationModeChange(mode)}
              className={`px-2 py-1 text-xs rounded font-semibold transition-all ${
                track.automationMode === mode
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* SEND LEVELS */}
      {track.sends && track.sends.length > 0 && (
        <div className="space-y-2 border-t border-gray-700 pt-2">
          <label className="text-xs font-semibold text-gray-300">Sends</label>

          <div className="space-y-1">
            {track.sends.map((send: Send, idx: number) => (
              <div
                key={send.id}
                onClick={() => setSelectedSendIndex(idx)}
                className={`px-2 py-1 rounded cursor-pointer transition ${
                  selectedSendIndex === idx
                    ? 'bg-gray-700 border border-blue-500'
                    : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs text-gray-300 truncate flex-1">
                    {send.destination === 'reverb' ? '??' : send.destination === 'delay' ? '??' : '??'} {send.destination}
                  </span>
                  <span className="text-xs font-mono text-gray-400">{send.level.toFixed(1)} dB</span>
                </div>

                {selectedSendIndex === idx && (
                  <input
                    type="range"
                    min="-60"
                    max="12"
                    step="0.5"
                    value={send.level}
                    onChange={(e) => handleSendLevelChange(idx, Number(e.target.value))}
                    className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer accent-green-500 mt-1"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BUS ROUTING */}
      <div className="space-y-1 border-t border-gray-700 pt-2">
        <Tooltip
          content={{
            title: 'Bus Routing',
            description: 'Route this track to a bus for submix control. Useful for grouping related tracks.',
            category: 'mixer',
            relatedFunctions: ['Send Levels', 'Solo', 'Mute'],
            performanceTip: 'Route similar instruments to buses (e.g., all drums to "Drum Bus") for easier mixing',
            examples: ['Drums ? Drum Bus', 'Vocals ? Vocal Bus', 'All ? Stereo Out'],
          }}
          position="left"
        >
          <label className="text-xs font-semibold text-gray-300">Routing</label>
        </Tooltip>

        <select
          value={track.routing || 'master'}
          onChange={(e) => handleRoutingChange(e.target.value)}
          className="w-full px-2 py-1 text-xs bg-gray-700 text-gray-200 border border-gray-600 rounded hover:border-gray-500 focus:border-blue-500 outline-none transition"
        >
          <option value="master">Master</option>
          <option value="drum-bus">Drum Bus</option>
          <option value="vocal-bus">Vocal Bus</option>
          <option value="fx-bus">FX Bus</option>
          <option value="sub-bass">Sub Bass</option>
          <option value="stereo-out">Stereo Out</option>
        </select>
      </div>

      {/* INFO TEXT */}
      <div className="text-xs text-gray-500 italic border-t border-gray-700 pt-2 mt-auto">
        ?? Pro Tip: Combine stereo width with sends to create spacious reverb effects
      </div>
    </div>
  );
}
