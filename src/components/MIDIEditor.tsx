import React, { useState, useEffect } from 'react';
import { Trash2, Copy, Plus, Music2, Zap } from 'lucide-react';

/**
 * MIDI Editor Component
 * Displays and manages MIDI notes with visual editing capabilities
 * Shows selected MIDI notes, allows editing of pitch, velocity, and timing
 */

interface MIDINote {
  pitch: number;          // 0-127 MIDI standard
  velocity: number;       // 0-127 MIDI standard
  startTime: number;      // Position in beats
  duration: number;       // Length in beats
}

interface MIDIEditorProps {
  notes?: MIDINote[];
  onNotesChange?: (notes: MIDINote[]) => void;
  isVisible?: boolean;
}

export const MIDIEditor: React.FC<MIDIEditorProps> = ({
  notes = [],
  onNotesChange,
  isVisible = true,
}) => {
  const [displayNotes, setDisplayNotes] = useState<MIDINote[]>(notes);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);
  const [editingVelocity, setEditingVelocity] = useState<number>(100);
  const [editingPitch, setEditingPitch] = useState<number>(60);
  const [clipboard, setClipboard] = useState<MIDINote[]>([]);

  useEffect(() => {
    setDisplayNotes(notes);
  }, [notes]);

  const handleDeleteNote = (index: number) => {
    const newNotes = displayNotes.filter((_, i) => i !== index);
    setDisplayNotes(newNotes);
    onNotesChange?.(newNotes);
    console.log(`✅ Deleted MIDI note: index=${index}`);
  };

  const handleSelectNote = (index: number) => {
    setSelectedNoteIndex(index);
    const note = displayNotes[index];
    setEditingVelocity(note.velocity);
    setEditingPitch(note.pitch);
  };

  const handleUpdateNote = (index: number, updates: Partial<MIDINote>) => {
    const newNotes = displayNotes.map((note, i) =>
      i === index ? { ...note, ...updates } : note
    );
    setDisplayNotes(newNotes);
    onNotesChange?.(newNotes);
  };

  const handleCopyNotes = () => {
    if (selectedNoteIndex !== null) {
      setClipboard([displayNotes[selectedNoteIndex]]);
      console.log(`✅ Copied MIDI note: pitch=${displayNotes[selectedNoteIndex].pitch}`);
    }
  };

  const handlePasteNotes = () => {
    if (clipboard.length > 0) {
      const newNotes = [...displayNotes, ...clipboard];
      setDisplayNotes(newNotes);
      onNotesChange?.(newNotes);
      console.log(`✅ Pasted ${clipboard.length} MIDI note(s)`);
    }
  };

  const handleHumanize = () => {
    const humanizedNotes = displayNotes.map((note) => {
      const timingVariation = (Math.random() - 0.5) * 0.02; // ±10ms in beats
      const velocityVariation = Math.round((Math.random() - 0.5) * 10);
      return {
        ...note,
        startTime: Math.max(0, note.startTime + timingVariation),
        velocity: Math.max(0, Math.min(127, note.velocity + velocityVariation)),
      };
    });
    setDisplayNotes(humanizedNotes);
    onNotesChange?.(humanizedNotes);
    console.log(`✅ Humanized ${humanizedNotes.length} MIDI notes: timing±10ms, velocity±5%`);
  };

  const handleQuantize = () => {
    const gridSize = 0.25; // Sixteenth note
    const quantizedNotes = displayNotes.map((note) => {
      const snappedTime = Math.round(note.startTime / gridSize) * gridSize;
      return { ...note, startTime: snappedTime };
    });
    setDisplayNotes(quantizedNotes);
    onNotesChange?.(quantizedNotes);
    console.log(`✅ Quantized ${quantizedNotes.length} MIDI notes to grid`);
  };

  const noteNameMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const getNoteName = (pitch: number) => {
    const octave = Math.floor(pitch / 12) - 1;
    const noteName = noteNameMap[pitch % 12];
    return `${noteName}${octave}`;
  };

  const getMidiColor = (pitch: number) => {
    const colors = [
      'bg-red-500', 'bg-red-400', 'bg-orange-500', 'bg-orange-400',
      'bg-yellow-500', 'bg-yellow-400', 'bg-green-500', 'bg-green-400',
      'bg-blue-500', 'bg-blue-400', 'bg-purple-500', 'bg-purple-400'
    ];
    return colors[pitch % 12];
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gray-900 rounded border border-gray-700 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-gray-300">MIDI Notes</h3>
          <span className="text-xs text-gray-500">{displayNotes.length} notes</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleHumanize}
          disabled={displayNotes.length === 0}
          className="flex items-center gap-1 px-2 py-1 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white rounded text-xs transition"
          title="Add random timing and velocity variations"
        >
          <Zap className="w-3 h-3" />
          Humanize
        </button>
        <button
          onClick={handleQuantize}
          disabled={displayNotes.length === 0}
          className="flex items-center gap-1 px-2 py-1 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white rounded text-xs transition"
          title="Snap to grid (sixteenth notes)"
        >
          <Music2 className="w-3 h-3" />
          Quantize
        </button>
        <button
          onClick={handleCopyNotes}
          disabled={selectedNoteIndex === null}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-xs transition"
          title="Copy selected note"
        >
          <Copy className="w-3 h-3" />
          Copy
        </button>
        <button
          onClick={handlePasteNotes}
          disabled={clipboard.length === 0}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-xs transition"
          title="Paste from clipboard"
        >
          <Plus className="w-3 h-3" />
          Paste
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {displayNotes.length === 0 ? (
          <div className="text-xs text-gray-500 py-4 text-center">
            No MIDI notes. Create notes in MIDI editor or keyboard.
          </div>
        ) : (
          displayNotes.map((note, index) => (
            <div
              key={index}
              onClick={() => handleSelectNote(index)}
              className={`flex items-center justify-between p-2 rounded border transition-colors cursor-pointer ${
                selectedNoteIndex === index
                  ? 'bg-teal-900/50 border-teal-600'
                  : 'bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Note Color Indicator */}
                <div
                  className={`w-2 h-6 rounded flex-shrink-0 ${getMidiColor(note.pitch)}`}
                />

                {/* Note Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-gray-300">
                    {getNoteName(note.pitch)}
                    {' '}
                    <span className="text-gray-500">
                      (Pitch: {note.pitch}, Vel: {note.velocity})
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Time: {note.startTime.toFixed(2)}s, Duration: {note.duration.toFixed(2)}s
                  </div>
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteNote(index);
                }}
                className="ml-2 p-1 hover:bg-red-600/30 rounded text-red-400 transition flex-shrink-0"
                title="Delete note"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Edit Controls for Selected Note */}
      {selectedNoteIndex !== null && (
        <div className="border-t border-gray-700 pt-3 space-y-3">
          <div className="text-xs font-semibold text-gray-400 mb-2">Edit Selected Note</div>

          {/* Pitch Control */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Pitch: {getNoteName(editingPitch)} ({editingPitch})
            </label>
            <input
              type="range"
              min="0"
              max="127"
              value={editingPitch}
              onChange={(e) => {
                const newPitch = Number(e.target.value);
                setEditingPitch(newPitch);
                handleUpdateNote(selectedNoteIndex, { pitch: newPitch });
              }}
              className="w-full h-1 bg-gray-700 rounded accent-teal-600"
            />
          </div>

          {/* Velocity Control */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Velocity: {editingVelocity}
            </label>
            <input
              type="range"
              min="0"
              max="127"
              value={editingVelocity}
              onChange={(e) => {
                const newVelocity = Number(e.target.value);
                setEditingVelocity(newVelocity);
                handleUpdateNote(selectedNoteIndex, { velocity: newVelocity });
              }}
              className="w-full h-1 bg-gray-700 rounded accent-teal-600"
            />
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 bg-gray-800/50 p-2 rounded">
        💡 Click notes to select • Use controls to edit • Copy/Paste to duplicate
      </div>
    </div>
  );
};

export default MIDIEditor;
