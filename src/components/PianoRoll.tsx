/**
 * PIANO KEYS SIDEBAR
 * Displays piano keyboard on left side of piano roll
 */

import { pitchToNote } from '../lib/midiUtils';

interface PianoKeysProps {
  keyHeight: number;
  visibleRange?: [number, number];  // [min pitch, max pitch]
}

export function PianoKeys({ keyHeight, visibleRange = [0, 128] }: PianoKeysProps) {
  const [minPitch, maxPitch] = visibleRange;
  const whiteKeyClass = 'bg-gray-200 border-r border-gray-400 hover:bg-gray-300';
  const blackKeyClass = 'bg-gray-800 border border-gray-900 hover:bg-gray-700';

  const isBlackKey = (pitch: number): boolean => {
    const noteInOctave = pitch % 12;
    return [1, 3, 6, 8, 10].includes(noteInOctave);
  };

  return (
    <div className="flex flex-col-reverse bg-gray-900 border-r border-gray-700 overflow-hidden" style={{ width: '80px' }}>
      {Array.from({ length: maxPitch - minPitch }, (_, i) => minPitch + i).map(pitch => (
        <div
          key={pitch}
          className={`border-b border-gray-700 flex items-center justify-center text-xs font-mono cursor-pointer transition-colors ${
            isBlackKey(pitch) ? blackKeyClass : whiteKeyClass
          }`}
          style={{ height: `${keyHeight}px` }}
          title={pitchToNote(pitch)}
        >
          {pitch % 12 === 0 && (
            <span className={isBlackKey(pitch) ? 'text-gray-400' : 'text-gray-600'}>
              {pitchToNote(pitch)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * TIME RULER
 * Shows time/beats at top of piano roll
 */

interface RulerProps {
  length: number;           // sequence length in seconds
  zoom: number;             // pixels per second
  bpm: number;
  beatsPerMeasure?: number;
}

export function Ruler({ length, zoom, bpm, beatsPerMeasure = 4 }: RulerProps) {
  const beatDuration = 60 / bpm;
  const measureDuration = beatDuration * beatsPerMeasure;
  const pixelsPerMeasure = measureDuration * zoom;
  const measures = Math.ceil(length / measureDuration);

  return (
    <div className="h-10 bg-gray-800 border-b-2 border-gray-700 flex items-end overflow-hidden">
      <div className="flex h-full">
        {Array.from({ length: measures }, (_, i) => (
          <div
            key={i}
            className="border-r border-gray-600 flex items-center justify-start pl-2 text-xs text-gray-400 font-mono"
            style={{ width: `${pixelsPerMeasure}px`, height: '100%' }}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * PLAYHEAD
 * Shows current playback position
 */

interface PlayheadProps {
  position: number;          // seconds
  zoom: number;              // pixels per second
  height: number;            // canvas height
}

export function Playhead({ position, zoom, height }: PlayheadProps) {
  const xPos = position * zoom;

  return (
    <div
      className="absolute top-0 w-0.5 bg-red-500 pointer-events-none z-10"
      style={{
        left: `${xPos}px`,
        height: `${height}px`,
        boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
      }}
    />
  );
}

/**
 * PIANO ROLL GRID & NOTES
 * Main note editing area with grid and note visualization
 */

import { MIDINote, MIDISequence } from '../types/midi';
import { useRef, useEffect, useState } from 'react';

interface PianoRollProps {
  sequence: MIDISequence;
  onNotesChange: (notes: MIDINote[]) => void;
  isPlaying?: boolean;
  playheadPosition?: number;
  zoom?: number;
  quantizeValue?: number;
  visibleRange?: [number, number];
}

export function PianoRoll({
  sequence,
  onNotesChange,
  isPlaying = false,
  playheadPosition = 0,
  zoom = 100,
  quantizeValue = 4,
  visibleRange = [24, 96],  // C1 to C7
}: PianoRollProps) {
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [draggingNote, setDraggingNote] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'move' | 'resize'>('move');
  const [dragStartX, setDragStartX] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [minPitch, maxPitch] = visibleRange;
  const KEY_HEIGHT = 16;

  const totalHeight = (maxPitch - minPitch) * KEY_HEIGHT;
  const totalWidth = sequence.length * zoom;

  // Handle canvas click to add notes
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingNote) return;  // Don't add while dragging

    const rect = scrollContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Get scroll position
    const scrollLeft = scrollContainerRef.current?.scrollLeft || 0;
    const scrollTop = scrollContainerRef.current?.scrollTop || 0;

    const x = e.clientX - rect.left + scrollLeft;
    const y = e.clientY - rect.top + scrollTop;

    const time = x / zoom;
    const pitchFromBottom = Math.floor(y / KEY_HEIGHT);
    const pitch = maxPitch - pitchFromBottom - 1;

    if (pitch < minPitch || pitch >= maxPitch) return;

    const newNote: MIDINote = {
      id: `note-${Date.now()}`,
      pitch,
      startTime: time,
      duration: 0.25,  // Quarter note
      velocity: 80,
      channel: 0,
    };

    onNotesChange([...sequence.notes, newNote]);
    setSelectedNotes([newNote.id]);
  };

  // Handle note mouse down
  const handleNoteMouseDown = (note: MIDINote, mode: 'move' | 'resize', e: React.MouseEvent) => {
    e.stopPropagation();

    if (e.ctrlKey || e.metaKey) {
      // Multi-select
      setSelectedNotes(prev =>
        prev.includes(note.id)
          ? prev.filter(id => id !== note.id)
          : [...prev, note.id]
      );
    } else if (!selectedNotes.includes(note.id)) {
      // Single select
      setSelectedNotes([note.id]);
    }

    setDraggingNote(note.id);
    setDragMode(mode);
    setDragStartX(e.clientX);
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingNote || !canvasRef.current) return;

      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      const deltaX = e.clientX - dragStartX;
      const deltaTime = deltaX / zoom;

      const updatedNotes = sequence.notes.map(note => {
        if (!selectedNotes.includes(note.id)) return note;

        if (dragMode === 'move') {
          // Move note in time
          return {
            ...note,
            startTime: Math.max(0, note.startTime + deltaTime),
          };
        } else {
          // Resize note (extend duration)
          return {
            ...note,
            duration: Math.max(0.125, note.duration + deltaTime),
          };
        }
      });

      // Update on any notes being dragged
      if (updatedNotes.some((n, i) => n !== sequence.notes[i])) {
        onNotesChange(updatedNotes);
        setDragStartX(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setDraggingNote(null);
    };

    if (draggingNote) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingNote, dragMode, dragStartX, selectedNotes, sequence.notes, zoom]);

  // Render notes as visual blocks
  const renderNotes = () => {
    return sequence.notes
      .filter(note => note.pitch >= minPitch && note.pitch < maxPitch)
      .map(note => {
        const x = note.startTime * zoom;
        const width = note.duration * zoom;
        const yFromBottom = (maxPitch - note.pitch - 1) * KEY_HEIGHT;
        const isSelected = selectedNotes.includes(note.id);

        return (
          <div
            key={note.id}
            className={`absolute border transition-colors cursor-grab active:cursor-grabbing ${
              isSelected
                ? 'bg-blue-500 border-blue-300 z-20'
                : 'bg-blue-700 border-blue-600 hover:bg-blue-600 z-10'
            }`}
            style={{
              left: `${x}px`,
              top: `${yFromBottom}px`,
              width: `${Math.max(2, width - 1)}px`,
              height: `${KEY_HEIGHT - 1}px`,
            }}
            onMouseDown={(e) => handleNoteMouseDown(note, 'move', e)}
            title={`${pitchToNote(note.pitch)}: ${note.startTime.toFixed(2)}s`}
          >
            {/* Resize handle on right edge */}
            <div
              className="absolute right-0 top-0 w-1 h-full bg-blue-300 cursor-col-resize opacity-0 hover:opacity-100"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleNoteMouseDown(note, 'resize', e);
              }}
            />
          </div>
        );
      });
  };

  // Render grid lines
  const renderGrid = () => {
    const lines = [];
    const beatDuration = 60 / sequence.bpm;
    const gridSize = beatDuration / quantizeValue;
    const gridPixels = gridSize * zoom;

    for (let i = 0; i < (totalWidth / gridPixels); i++) {
      lines.push(
        <div
          key={`v-${i}`}
          className="absolute border-l border-gray-700"
          style={{
            left: `${i * gridPixels}px`,
            height: `${totalHeight}px`,
          }}
        />
      );
    }

    // Horizontal lines (for each note)
    for (let i = 0; i <= (maxPitch - minPitch); i++) {
      lines.push(
        <div
          key={`h-${i}`}
          className="absolute border-b border-gray-800"
          style={{
            top: `${i * KEY_HEIGHT}px`,
            width: `${totalWidth}px`,
          }}
        />
      );
    }

    return lines;
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 overflow-hidden">
      {/* Ruler */}
      <Ruler length={sequence.length} zoom={zoom} bpm={sequence.bpm} />

      {/* Main editor area */}
      <div className="flex flex-1 min-h-0">
        {/* Piano keys */}
        <PianoKeys keyHeight={KEY_HEIGHT} visibleRange={visibleRange} />

        {/* Piano roll canvas */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto bg-gray-900 relative"
          onClick={handleCanvasClick}
        >
          <div
            ref={canvasRef}
            className="relative bg-gray-900"
            style={{
              width: `${totalWidth}px`,
              height: `${totalHeight}px`,
            }}
          >
            {/* Grid lines */}
            {renderGrid()}

            {/* Notes */}
            {renderNotes()}

            {/* Playhead */}
            {isPlaying && <Playhead position={playheadPosition} zoom={zoom} height={totalHeight} />}
          </div>
        </div>
      </div>
    </div>
  );
}
