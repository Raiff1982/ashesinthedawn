/**
 * CommandPalette Component
 * REAPER-like action command palette (Ctrl+Shift+P or Ctrl+/)
 * Search for and execute any action
 */

import React, { useState, useEffect, useRef } from 'react';
import { actionRegistry } from '../lib/actionSystem';
import type { ActionMetadata } from '../lib/actionSystem';
import { Search, Command } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute?: (actionId: string) => void;
}

interface CommandItem {
  id: string;
  name: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette({ isOpen, onClose, onExecute }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ActionMetadata[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTrack, togglePlay, undo, redo } = useDAW();

  const commands: CommandItem[] = [
    { id: 'play', name: 'Play', category: 'Transport', shortcut: 'Space', action: togglePlay },
    { id: 'add-audio', name: 'Add Audio Track', category: 'Track', shortcut: 'Ctrl+Alt+A', action: () => addTrack('audio') },
    { id: 'add-instrument', name: 'Add Instrument Track', category: 'Track', shortcut: 'Ctrl+Alt+I', action: () => addTrack('instrument') },
    { id: 'add-midi', name: 'Add MIDI Track', category: 'Track', shortcut: 'Ctrl+Alt+M', action: () => addTrack('midi') },
    { id: 'add-aux', name: 'Add Aux Track', category: 'Track', shortcut: 'Ctrl+Alt+U', action: () => addTrack('aux') },
    { id: 'undo', name: 'Undo', category: 'Edit', shortcut: 'Ctrl+Z', action: undo },
    { id: 'redo', name: 'Redo', category: 'Edit', shortcut: 'Ctrl+Y', action: redo },
  ];

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search actions
  useEffect(() => {
    if (query.trim() === '') {
      setResults(actionRegistry.getAllActions());
    } else {
      setResults(actionRegistry.search(query));
    }
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(Math.max(0, selectedIndex - 1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(Math.min(results.length - 1, selectedIndex + 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleExecute(results[selectedIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const handleExecute = async (actionId: string) => {
    await actionRegistry.execute(actionId);
    onExecute?.(actionId);
    onClose();
  };

  const filtered = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50">
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden"
      >
        {/* Search Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              handleKeyDown(e as any);
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && filtered.length > 0) {
                filtered[0].action();
                onClose();
                setQuery('');
              }
            }}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-white outline-none text-sm"
          />
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">No commands found</div>
          ) : (
            filtered.map(cmd => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                  setQuery('');
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-700 flex justify-between items-center text-sm text-gray-200 transition border-b border-gray-700 last:border-b-0"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{cmd.name}</span>
                  <span className="text-xs text-gray-500">{cmd.category}</span>
                </div>
                {cmd.shortcut && <kbd className="text-xs bg-gray-900 px-2 py-1 rounded text-gray-400">{cmd.shortcut}</kbd>}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-700 flex items-center gap-2 text-xs text-gray-500 bg-gray-850">
          <Command className="w-3 h-3" />
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
