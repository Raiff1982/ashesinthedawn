/**
 * ENHANCEMENT #9: Undo/Redo History Visualization
 * Timeline showing recent actions
 */

import { History, RotateCcw, RotateCw } from 'lucide-react';

interface HistoryTimelineProps {
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function HistoryTimeline({ onUndo, onRedo, canUndo = true, canRedo = true }: HistoryTimelineProps) {
  const recentActions = ['Added Audio Track', 'Set Volume -3dB', 'Added Reverb Effect', 'Muted Track'];

  return (
    <div className="space-y-2 p-3 bg-gray-800 rounded-lg max-w-xs border border-gray-700">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
        <History className="w-3 h-3" />
        Recent Actions
      </div>

      <div className="space-y-1 max-h-40 overflow-y-auto">
        {recentActions.map((action, idx) => (
          <div
            key={idx}
            className="px-2 py-1 text-xs bg-gray-900 rounded hover:bg-gray-700 cursor-pointer flex justify-between"
          >
            <span>{action}</span>
            <span className="text-gray-500">?</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-700">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="flex-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-1 transition"
        >
          <RotateCcw className="w-3 h-3" /> Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="flex-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center gap-1 transition"
        >
          <RotateCw className="w-3 h-3" /> Redo
        </button>
      </div>
    </div>
  );
}
