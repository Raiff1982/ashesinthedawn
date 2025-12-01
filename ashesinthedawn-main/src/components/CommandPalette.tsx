/**
 * CommandPalette Component
 * REAPER-like action command palette (Ctrl+Shift+P or Ctrl+/)
 * Search for and execute any action
 */

import React, { useState, useEffect, useRef } from 'react';
import { actionRegistry } from '../lib/actionSystem';
import type { ActionMetadata } from '../lib/actionSystem';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute?: (actionId: string) => void;
}

export function CommandPalette({ isOpen, onClose, onExecute }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ActionMetadata[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20">
      {/* Modal container */}
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-lg shadow-2xl">
        {/* Search input */}
        <div className="p-4 border-b border-gray-700">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search actions... (type command name)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p>No actions found</p>
              <p className="text-sm mt-2">Try searching for common actions like "play", "record", "mute"</p>
            </div>
          ) : (
            results.map((action, idx) => (
              <div
                key={action.id}
                onClick={() => handleExecute(action.id)}
                className={`px-4 py-3 cursor-pointer border-l-2 transition-colors ${
                  idx === selectedIndex
                    ? 'bg-blue-600/20 border-blue-500 text-blue-100'
                    : 'border-transparent text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{action.name}</div>
                    {action.description && (
                      <div className="text-xs text-gray-400 mt-1">{action.description}</div>
                    )}
                  </div>
                  {action.accel && (
                    <div className="ml-4 px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300 font-mono">
                      {action.accel}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 bg-gray-850 text-xs text-gray-400">
          <div className="flex justify-between">
            <span>↑↓ Navigate • Enter to execute • Esc to close</span>
            <span>{results.length} actions</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
