/**
 * Example: CodetteControlCenter Integration
 * This file demonstrates various ways to integrate the CodetteControlCenter component
 */

import { useState } from 'react';
import CodetteControlCenter from '@/components/CodetteControlCenter';
import { useDAW } from '@/contexts/DAWContext';

// ============================================================================
// Example 1: Simple Full-Screen Integration
// ============================================================================
export function CodetteControlCenterFullScreen() {
  return (
    <div className="w-full h-screen bg-gray-950 p-4 overflow-auto">
      <CodetteControlCenter />
    </div>
  );
}

// ============================================================================
// Example 2: Modal/Dialog Integration
// ============================================================================
export function CodetteControlCenterModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-medium"
      >
        Open Control Center
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-5xl max-h-[90vh] bg-gray-950 rounded-lg shadow-2xl overflow-auto relative">
            <button
              onClick={() => setIsOpen(false)}
              className="sticky top-0 right-0 p-4 text-gray-400 hover:text-white bg-gray-950 z-10"
            >
              ✕
            </button>
            <div className="pb-20">
              {/* Add padding for live status bar */}
              <CodetteControlCenter />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// Example 3: Sidebar Panel Integration
// ============================================================================
export function CodetteControlCenterSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`bg-gray-950 border-l border-gray-800 transition-all duration-300 overflow-hidden ${
        isCollapsed ? 'w-0' : 'w-96'
      }`}
    >
      <div className="p-4 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-gray-950">
        <h3 className="text-white font-bold">Codette Control</h3>
        <button
          onClick={() => setIsCollapsed(true)}
          className="text-gray-400 hover:text-white"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      <div className="overflow-auto h-[calc(100vh-60px)]">
        <div className="pb-20">
          {/* Add padding for live status bar */}
          <CodetteControlCenter />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 4: Tab-Based Layout Integration
// ============================================================================
export function CodetteControlCenterTabbedLayout() {
  const [activeSection, setActiveSection] = useState<'main' | 'control'>('main');

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveSection('main')}
            className={`px-6 py-3 font-medium transition ${
              activeSection === 'main'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            DAW
          </button>
          <button
            onClick={() => setActiveSection('control')}
            className={`px-6 py-3 font-medium transition ${
              activeSection === 'control'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Codette Control
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {activeSection === 'main' && (
            <div className="p-8 text-gray-400">
              {/* Your main DAW UI here */}
              Main DAW Content
            </div>
          )}
          {activeSection === 'control' && (
            <div className="pb-20">
              <CodetteControlCenter />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 5: DAW Context Integration
// ============================================================================
export function CodetteControlCenterWithDAWContext() {
  const {
    selectedTrack,
    tracks,
    isPlaying,
    currentTime,
    togglePlay,
  } = useDAW();

  return (
    <div className="w-full h-screen bg-gray-950 flex flex-col">
      {/* Header with DAW info */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white font-bold mb-1">Codette Control Center</h1>
            <p className="text-sm text-gray-400">
              {tracks.length} tracks • {selectedTrack ? selectedTrack.name : 'No track selected'} •{' '}
              {isPlaying ? '▶ Playing' : '⏸ Stopped'}
            </p>
          </div>
          <button
            onClick={() => togglePlay()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-medium"
          >
            {isPlaying ? 'Stop' : 'Play'}
          </button>
        </div>
      </div>

      {/* Control Center */}
      <div className="flex-1 overflow-auto pb-20">
        <CodetteControlCenter />
      </div>
    </div>
  );
}

// ============================================================================
// Example 6: Floating Window Integration (using ResizableWindow pattern)
// ============================================================================
export function CodetteControlCenterFloating() {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 600, height: 500 });
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? 'auto' : `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`,
        zIndex: 50,
      }}
      className="bg-gray-950 border border-gray-800 rounded-lg shadow-2xl flex flex-col"
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest('[data-drag-handle]')) {
          const startX = e.clientX - position.x;
          const startY = e.clientY - position.y;
          const handleMouseMove = (moveEvent: MouseEvent) => {
            setPosition({
              x: moveEvent.clientX - startX,
              y: moveEvent.clientY - startY,
            });
          };
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener(
            'mouseup',
            () => window.removeEventListener('mousemove', handleMouseMove),
            { once: true }
          );
        }
      }}
    >
      {/* Draggable Header */}
      <div
        data-drag-handle
        className="bg-gray-900 border-b border-gray-800 p-3 flex justify-between items-center cursor-move"
      >
        <h3 className="text-white font-bold text-sm">Codette Control</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-white text-sm"
          >
            {isMinimized ? '□' : '−'}
          </button>
          <button className="text-gray-400 hover:text-white text-sm">✕</button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-auto pb-20">
          <CodetteControlCenter />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 7: Split View (Control + Preview)
// ============================================================================
export function CodetteControlCenterSplitView() {
  const [splitRatio, setSplitRatio] = useState(0.5);

  return (
    <div className="flex h-screen w-full bg-gray-950">
      {/* Control Center (Left) */}
      <div
        style={{ width: `${splitRatio * 100}%` }}
        className="overflow-auto border-r border-gray-800 pb-20"
      >
        <CodetteControlCenter />
      </div>

      {/* Draggable Divider */}
      <div
        onMouseDown={(e) => {
          const startX = e.clientX;
          const handleMouseMove = (moveEvent: MouseEvent) => {
            const container = (e.target as HTMLElement).parentElement;
            if (container) {
              const newRatio = (moveEvent.clientX - container.getBoundingClientRect().left) / container.clientWidth;
              setSplitRatio(Math.max(0.2, Math.min(0.8, newRatio)));
            }
          };
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', () => window.removeEventListener('mousemove', handleMouseMove), {
            once: true,
          });
        }}
        className="w-1 bg-gray-800 hover:bg-gray-700 cursor-col-resize transition-colors"
      />

      {/* Preview Area (Right) */}
      <div style={{ width: `${(1 - splitRatio) * 100}%` }} className="p-6 overflow-auto">
        <div className="bg-gray-900 rounded-lg p-6 text-gray-400">
          <h3 className="text-white font-bold mb-4">Codette Activity Preview</h3>
          <p>Real-time preview of selected activity</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 8: Dashboard Layout with Multiple Panels
// ============================================================================
export function CodetteControlCenterDashboard() {
  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h1 className="text-3xl font-bold text-white mb-2">Codette Studio Dashboard</h1>
          <p className="text-gray-400">
            Monitor AI activity, manage permissions, and configure settings in real-time
          </p>
        </div>

        {/* Control Center */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden pb-20">
          <CodetteControlCenter />
        </div>

        {/* Footer */}
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 text-sm text-gray-400 flex justify-between">
          <span>Last updated: {new Date().toLocaleString()}</span>
          <span>Status: Connected</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Export all examples for testing
// ============================================================================
export const EXAMPLES = {
  FullScreen: CodetteControlCenterFullScreen,
  Modal: CodetteControlCenterModal,
  Sidebar: CodetteControlCenterSidebar,
  Tabbed: CodetteControlCenterTabbedLayout,
  WithDAW: CodetteControlCenterWithDAWContext,
  Floating: CodetteControlCenterFloating,
  SplitView: CodetteControlCenterSplitView,
  Dashboard: CodetteControlCenterDashboard,
};
