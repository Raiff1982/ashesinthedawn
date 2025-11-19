import { useDAW } from '../contexts/DAWContext';
import { Trash2, Sliders, Copy } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

export default function Mixer() {
  const { tracks, selectedTrack, updateTrack, deleteTrack, selectTrack } = useDAW();
  const [stripWidth, setStripWidth] = useState(100); // Adjustable width (px)
  const [stripHeight, setStripHeight] = useState(400); // Adjustable height (px)
  const [draggedPlugin, setDraggedPlugin] = useState<string | null>(null);
  const [pluginDropZone, setPluginDropZone] = useState<string | null>(null);
  const [individualWidths, setIndividualWidths] = useState<Record<string, number>>({}); // Per-channel widths
  const [resizingTrackId, setResizingTrackId] = useState<string | null>(null); // Track being resized
  const [resizeStartX, setResizeStartX] = useState(0); // Mouse position at resize start

  const getMeterColor = (level: number) => {
    if (level > 6) return 'rgb(255, 0, 0)'; // Red
    if (level > -6) return 'rgb(255, 200, 0)'; // Yellow
    if (level > -20) return 'rgb(0, 255, 0)'; // Green
    return 'rgb(0, 150, 0)'; // Dark Green
  };

  // Handle individual channel resize start
  const handleResizeStart = (e: React.MouseEvent, trackId: string) => {
    e.preventDefault();
    setResizingTrackId(trackId);
    setResizeStartX(e.clientX);
  };

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingTrackId) {
        const delta = e.clientX - resizeStartX;
        const currentWidth = individualWidths[resizingTrackId] || stripWidth;
        const newWidth = Math.max(60, currentWidth + delta);
        setIndividualWidths(prev => ({
          ...prev,
          [resizingTrackId]: newWidth,
        }));
        setResizeStartX(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setResizingTrackId(null);
    };

    if (resizingTrackId) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingTrackId, resizeStartX, individualWidths, stripWidth]);

  // Rotary pan knob renderer
  const renderPanKnob = (track: any) => {
    const pan = track.pan || 0; // -1 to 1
    const rotation = (pan + 1) * 135; // 0-270 degrees (L to R)

    return (
      <div className="flex flex-col items-center gap-1 py-2">
        <div className="text-xs text-gray-400 font-semibold">Pan</div>
        <div className="relative w-12 h-12 cursor-pointer group">
          {/* Knob background */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-700 to-gray-900 border-2 border-gray-600 shadow-lg flex items-center justify-center">
            {/* Knob indicator line */}
            <div
              className="absolute w-1 h-4 bg-gradient-to-t from-amber-400 to-amber-300 rounded-full transition-transform"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
            {/* Center dot */}
            <div className="absolute w-2 h-2 rounded-full bg-gray-400" />
          </div>

          {/* Hidden input for interaction */}
          <input
            type="range"
            min="-100"
            max="100"
            value={Math.round(pan * 100)}
            onChange={(e) => updateTrack(track.id, { pan: parseInt(e.target.value) / 100 })}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />

          {/* Pan value display */}
          <div className="absolute -bottom-6 left-0 right-0 text-center text-xs text-gray-500 font-mono pointer-events-none">
            {pan === 0 ? 'C' : pan < 0 ? `L${Math.abs(Math.round(pan * 100))}` : `R${Math.round(pan * 100)}`}
          </div>
        </div>
      </div>
    );
  };

  // Render channel strip with proportional sizing
  const renderChannelStrip = (track: any) => {
    const isSelected = selectedTrack?.id === track.id;
    const volume = track.volume || 0;
    const meterLevel = Math.min(Math.max(volume / 60, 0), 1);

    // Use individual width if set, otherwise use global width
    const currentWidth = individualWidths[track.id] || stripWidth;

    // Proportional sizing based on strip dimensions
    const headerHeight = Math.max(stripHeight * 0.12, 24);
    const fxSlotHeight = Math.max(stripHeight * 0.08, 18);
    const panKnobSize = Math.max(currentWidth * 0.4, 32);
    const panLabelHeight = Math.max(stripHeight * 0.06, 14);
    const faderSectionMinHeight = Math.max(stripHeight * 0.35, 80);
    const buttonHeight = Math.max(stripHeight * 0.06, 18);
    const buttonFontSize = Math.max(currentWidth * 0.1, 10);

    const meterWidth = Math.max(currentWidth * 0.15, 6);
    const faderWidth = Math.max(currentWidth * 0.25, 12);

    return (
      <div
        key={track.id}
        onClick={() => selectTrack(track.id)}
        className={`flex-shrink-0 transition-all cursor-pointer select-none group relative`}
        style={{
          width: `${currentWidth}px`,
          height: `${stripHeight}px`,
          border: isSelected ? '2px solid rgb(59, 130, 246)' : '1px solid rgb(55, 65, 81)',
          backgroundColor: isSelected ? 'rgb(30, 41, 59)' : 'rgb(17, 24, 39)',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: `${Math.max(stripHeight * 0.02, 3)}px`,
          padding: `${Math.max(stripHeight * 0.02, 4)}px`,
          boxSizing: 'border-box',
        }}
      >
        {/* Right edge resize handle */}
        <div
          onMouseDown={(e) => handleResizeStart(e, track.id)}
          className="absolute right-0 top-0 bottom-0 w-1 bg-transparent hover:bg-blue-500 hover:opacity-100 opacity-0 cursor-col-resize transition-opacity"
          style={{ zIndex: 30 }}
        />
        {/* Channel Header with Color */}
        <div
          style={{
            height: `${headerHeight}px`,
            backgroundColor: track.color,
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            fontSize: `${Math.max(currentWidth * 0.12, 9)}px`,
          }}
          className="font-bold text-gray-900 truncate px-1 overflow-hidden"
        >
          {track.name}
        </div>

        {/* Insert Slots (Drag-Drop Zone) */}
        <div
          className="flex gap-1 flex-wrap justify-center"
          style={{
            height: `${fxSlotHeight}px`,
            flexShrink: 0,
          }}
        >
          {[0, 1].map((slot) => (
            <div
              key={`insert-${slot}`}
              onDragOver={(e) => {
                e.preventDefault();
                setPluginDropZone(`${track.id}-insert-${slot}`);
              }}
              onDragLeave={() => setPluginDropZone(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedPlugin) {
                  console.log(`Plugin dropped on ${track.name} Insert ${slot}`);
                }
                setPluginDropZone(null);
              }}
              className={`rounded text-xs flex items-center justify-center font-semibold border transition-all flex-1 ${
                pluginDropZone === `${track.id}-insert-${slot}`
                  ? 'bg-blue-600 border-blue-400'
                  : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
              }`}
              style={{ fontSize: `${Math.max(currentWidth * 0.08, 8)}px` }}
            >
              fx
            </div>
          ))}
        </div>

        {/* Pan Knob */}
        {currentWidth > 70 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: `${Math.max(stripHeight * 0.02, 3)}px`,
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: `${Math.max(currentWidth * 0.09, 9)}px` }} className="text-gray-400 font-semibold">
              Pan
            </div>
            <div className="relative cursor-pointer group" style={{ width: `${panKnobSize}px`, height: `${panKnobSize}px` }}>
              {/* Knob background */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-700 to-gray-900 border-2 border-gray-600 shadow-lg flex items-center justify-center">
                {/* Knob indicator line */}
                <div
                  className="absolute bg-gradient-to-t from-amber-400 to-amber-300 rounded-full transition-transform"
                  style={{
                    width: `${Math.max(panKnobSize * 0.08, 2)}px`,
                    height: `${Math.max(panKnobSize * 0.35, 8)}px`,
                    transform: `rotate(${((track.pan || 0) + 1) * 135}deg)`,
                  }}
                />
                {/* Center dot */}
                <div className="absolute rounded-full bg-gray-400" style={{ width: `${Math.max(panKnobSize * 0.15, 3)}px`, height: `${Math.max(panKnobSize * 0.15, 3)}px` }} />
              </div>

              {/* Hidden input for interaction */}
              <input
                type="range"
                min="-100"
                max="100"
                value={Math.round((track.pan || 0) * 100)}
                onChange={(e) => updateTrack(track.id, { pan: parseInt(e.target.value) / 100 })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />

              {/* Pan value display */}
              <div
                className="absolute left-0 right-0 text-center text-gray-500 font-mono pointer-events-none"
                style={{
                  top: `${panKnobSize + 4}px`,
                  fontSize: `${Math.max(currentWidth * 0.08, 8)}px`,
                }}
              >
                {track.pan === 0 ? 'C' : track.pan < 0 ? `L${Math.abs(Math.round(track.pan * 100))}` : `R${Math.round(track.pan * 100)}`}
              </div>
            </div>
          </div>
        )}

        {/* Volume Fader Section */}
        <div
          className="flex flex-col items-center justify-end gap-1 min-h-0"
          style={{
            flex: '1 1 auto',
            minHeight: `${faderSectionMinHeight}px`,
          }}
        >
          <div className="flex items-end gap-1 h-full w-full justify-center">
            {/* Level Meter */}
            <div
              className="rounded border border-gray-700 bg-gray-950 flex flex-col-reverse shadow-inner"
              style={{
                width: `${meterWidth}px`,
                height: '100%',
                minHeight: `${faderSectionMinHeight * 0.8}px`,
              }}
            >
              <div
                style={{
                  height: `${meterLevel * 100}%`,
                  backgroundColor: getMeterColor(volume),
                  transition: 'height 0.05s linear',
                  borderRadius: '1px',
                }}
              />
            </div>

            {/* Fader Track */}
            <div
              className="relative bg-gradient-to-b from-gray-800 to-gray-950 rounded border border-gray-700 shadow-inner flex items-center justify-center group"
              style={{
                width: `${faderWidth}px`,
                height: '100%',
                minHeight: `${faderSectionMinHeight * 0.8}px`,
              }}
            >
              {/* Fader Knob */}
              <div
                className="absolute bg-gradient-to-b from-amber-400 to-amber-600 rounded border border-amber-700 shadow-md cursor-grab active:cursor-grabbing"
                style={{
                  width: `${Math.max(faderWidth * 0.8, 8)}px`,
                  height: `${Math.max(faderSectionMinHeight * 0.08, 8)}px`,
                  top: `${((volume - (-60)) / (12 - (-60))) * 100}%`,
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                }}
              />

              {/* Hidden input */}
              <input
                type="range"
                min="-60"
                max="12"
                value={volume}
                onChange={(e) => updateTrack(track.id, { volume: parseFloat(e.target.value) })}
                onDoubleClick={() => updateTrack(track.id, { volume: 0 })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                style={{ zIndex: 20 }}
              />

              {/* Track markings */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-1 py-1">
                <div className="bg-gray-700/50" style={{ height: '1px' }} />
                <div className="bg-gray-700/50" style={{ height: '1px' }} />
                <div className="bg-gray-700/50" style={{ height: '1px' }} />
              </div>
            </div>
          </div>

          {/* Volume Display */}
          {currentWidth > 60 && (
            <div
              className="font-mono font-bold text-amber-300 bg-gray-950 rounded border border-amber-700/50"
              style={{
                fontSize: `${Math.max(currentWidth * 0.09, 8)}px`,
                padding: `${Math.max(stripHeight * 0.01, 2)}px ${Math.max(currentWidth * 0.05, 3)}px`,
                flexShrink: 0,
              }}
            >
              {volume.toFixed(1)}dB
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div
          className="flex gap-1 justify-center flex-wrap"
          style={{
            height: `${buttonHeight * 1.2}px`,
            flexShrink: 0,
          }}
        >
          {/* Mute */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateTrack(track.id, { muted: !track.muted });
            }}
            className={`rounded font-semibold transition flex-1 ${
              track.muted
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            style={{
              fontSize: `${Math.max(stripWidth * 0.1, 9)}px`,
              padding: `${Math.max(buttonHeight * 0.2, 2)}px`,
              minWidth: `${Math.max(stripWidth * 0.2, 16)}px`,
            }}
            title="Mute"
          >
            M
          </button>

          {/* Solo */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateTrack(track.id, { soloed: !track.soloed });
            }}
            className={`rounded font-semibold transition flex-1 ${
              track.soloed
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            style={{
              fontSize: `${Math.max(stripWidth * 0.1, 9)}px`,
              padding: `${Math.max(buttonHeight * 0.2, 2)}px`,
              minWidth: `${Math.max(stripWidth * 0.2, 16)}px`,
            }}
            title="Solo"
          >
            S
          </button>

          {/* Record */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateTrack(track.id, { armed: !track.armed });
            }}
            className={`rounded font-semibold transition flex-1 ${
              track.armed
                ? 'bg-red-700 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            style={{
              fontSize: `${Math.max(stripWidth * 0.1, 9)}px`,
              padding: `${Math.max(buttonHeight * 0.2, 2)}px`,
              minWidth: `${Math.max(stripWidth * 0.2, 16)}px`,
            }}
            title="Record Arm"
          >
            R
          </button>

          {/* Phase Flip (180°) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateTrack(track.id, { phaseFlip: !track.phaseFlip });
            }}
            className={`rounded font-semibold transition flex-1 ${
              track.phaseFlip
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            style={{
              fontSize: `${Math.max(stripWidth * 0.1, 9)}px`,
              padding: `${Math.max(buttonHeight * 0.2, 2)}px`,
              minWidth: `${Math.max(stripWidth * 0.2, 16)}px`,
            }}
            title="Phase Flip 180°"
          >
            Φ
          </button>
        </div>

        {/* Output Routing */}
        <div className="flex gap-1 justify-center" style={{ flexShrink: 0 }}>
          <select
            className="rounded bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition w-full"
            style={{
              fontSize: `${Math.max(stripWidth * 0.08, 8)}px`,
              padding: `${Math.max(stripHeight * 0.02, 3)}px`,
            }}
          >
            <option>Master</option>
            <option>Bus 1</option>
            <option>Bus 2</option>
          </select>
        </div>

        {/* Delete Button */}
        {stripWidth > 80 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteTrack(track.id);
            }}
            className="w-full rounded font-semibold bg-gray-700 text-gray-400 hover:bg-red-900/50 hover:text-red-400 transition flex items-center justify-center gap-1"
            style={{
              fontSize: `${Math.max(stripWidth * 0.08, 8)}px`,
              padding: `${Math.max(stripHeight * 0.02, 3)}px`,
              flexShrink: 0,
            }}
          >
            <Trash2 style={{ width: `${Math.max(stripWidth * 0.15, 12)}px`, height: `${Math.max(stripWidth * 0.15, 12)}px` }} />
            Del
          </button>
        )}
      </div>
    );
  };

  // Master strip with proportional sizing
  const renderMasterStrip = () => {
    // Proportional sizing
    const headerHeight = Math.max(stripHeight * 0.12, 24);
    const faderSectionMinHeight = Math.max(stripHeight * 0.35, 80);
    const buttonHeight = Math.max(stripHeight * 0.06, 18);
    const meterWidth = Math.max(stripWidth * 0.15, 6);
    const faderWidth = Math.max(stripWidth * 0.25, 12);

    return (
      <div
        className="flex-shrink-0 select-none group"
        style={{
          width: `${stripWidth}px`,
          height: `${stripHeight}px`,
          border: '2px solid rgb(202, 138, 4)',
          backgroundColor: 'rgb(30, 24, 15)',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: `${Math.max(stripHeight * 0.02, 3)}px`,
          padding: `${Math.max(stripHeight * 0.02, 4)}px`,
          boxSizing: 'border-box',
        }}
      >
        {/* Master Header */}
        <div
          style={{
            height: `${headerHeight}px`,
            backgroundColor: 'rgb(202, 138, 4)',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${Math.max(stripWidth * 0.12, 10)}px`,
            flexShrink: 0,
          }}
          className="font-bold text-gray-900"
        >
          Master
        </div>

        {/* Master Fader */}
        <div
          className="flex flex-col items-center justify-end gap-1 min-h-0"
          style={{
            flex: '1 1 auto',
            minHeight: `${faderSectionMinHeight}px`,
          }}
        >
          <div className="flex items-end gap-1 h-full w-full justify-center">
            {/* Master Meter */}
            <div
              className="rounded border-2 border-yellow-700 bg-gray-950 flex flex-col-reverse shadow-inner"
              style={{
                width: `${meterWidth}px`,
                height: '100%',
                minHeight: `${faderSectionMinHeight * 0.8}px`,
              }}
            >
              <div
                style={{
                  height: '60%',
                  background: 'linear-gradient(to top, rgb(255, 0, 0), rgb(255, 200, 0), rgb(0, 255, 0))',
                  transition: 'height 0.05s linear',
                  borderRadius: '1px',
                }}
              />
            </div>

            {/* Master Fader Track */}
            <div
              className="relative bg-gradient-to-b from-yellow-900 to-gray-950 rounded border-2 border-yellow-700 shadow-inner"
              style={{
                width: `${faderWidth}px`,
                height: '100%',
                minHeight: `${faderSectionMinHeight * 0.8}px`,
              }}
            >
              <div
                className="absolute bg-gradient-to-b from-yellow-300 to-yellow-600 rounded border border-yellow-700 shadow-md"
                style={{
                  width: `${Math.max(faderWidth * 0.8, 8)}px`,
                  height: `${Math.max(faderSectionMinHeight * 0.08, 8)}px`,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                }}
              />
            </div>
          </div>

          {stripWidth > 60 && (
            <div
              className="font-mono font-bold text-yellow-300 bg-gray-950 rounded border border-yellow-700/50"
              style={{
                fontSize: `${Math.max(stripWidth * 0.09, 8)}px`,
                padding: `${Math.max(stripHeight * 0.01, 2)}px ${Math.max(stripWidth * 0.05, 3)}px`,
                flexShrink: 0,
              }}
            >
              0.0dB
            </div>
          )}
        </div>

        {/* Master Controls */}
        <div
          className="flex gap-1 justify-center flex-wrap"
          style={{
            height: `${buttonHeight * 1.2}px`,
            flexShrink: 0,
          }}
        >
          <button
            className="rounded text-white font-semibold hover:bg-yellow-600/60 transition flex-1 bg-yellow-700/50"
            style={{
              fontSize: `${Math.max(stripWidth * 0.09, 8)}px`,
              padding: `${Math.max(buttonHeight * 0.2, 2)}px`,
            }}
          >
            Solo
          </button>
          <button
            className="rounded text-gray-300 font-semibold hover:bg-gray-600 transition flex-1 bg-gray-700"
            style={{
              fontSize: `${Math.max(stripWidth * 0.09, 8)}px`,
              padding: `${Math.max(buttonHeight * 0.2, 2)}px`,
            }}
          >
            Dim
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-900 overflow-hidden">
      {/* Mixer Header with Controls */}
      <div className="h-10 bg-gradient-to-r from-gray-800 to-gray-750 border-b-2 border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Sliders className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-300">Channel Mixer</span>
        </div>

        {/* Size Controls */}
        <div className="flex items-center gap-4 text-xs">
          <label className="flex items-center gap-2 text-gray-400">
            Width:
            <input
              type="range"
              min="60"
              max="200"
              value={stripWidth}
              onChange={(e) => setStripWidth(parseInt(e.target.value))}
              className="w-20 accent-blue-500"
            />
            <span className="w-6 text-right">{stripWidth}px</span>
          </label>
          <label className="flex items-center gap-2 text-gray-400">
            Height:
            <input
              type="range"
              min="200"
              max="600"
              value={stripHeight}
              onChange={(e) => setStripHeight(parseInt(e.target.value))}
              className="w-20 accent-blue-500"
            />
            <span className="w-6 text-right">{stripHeight}px</span>
          </label>
        </div>
      </div>

      {/* Channel Strips Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-950">
        <div className="flex h-full gap-2 p-3 min-w-max">
          {/* Master Strip (Always First) */}
          {renderMasterStrip()}

          {/* Channel Strips */}
          {tracks.length === 0 ? (
            <div className="flex items-center justify-center w-full text-gray-500 text-sm">
              No tracks. Add tracks from the left panel to see channel strips.
            </div>
          ) : (
            tracks.map((track) => renderChannelStrip(track))
          )}
        </div>
      </div>
    </div>
  );
}

