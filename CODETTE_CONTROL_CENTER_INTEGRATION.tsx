/**
 * Integration Guide: Adding CodetteControlCenter to Your App
 * 
 * This file shows the recommended way to add the CodetteControlCenter
 * component to your existing CoreLogic Studio application.
 */

// ============================================================================
// Option 1: Add as a New Tab in Your Main Layout
// ============================================================================

import { useState } from 'react';
import CodetteControlCenter from '@/components/CodetteControlCenter';
import Mixer from '@/components/Mixer';
import TrackList from '@/components/TrackList';
import Timeline from '@/components/Timeline';

export function AppWithControlTab() {
  const [activeTab, setActiveTab] = useState<'daw' | 'control'>('daw');

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 overflow-auto">
        <TrackList />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-gray-900 border-b border-gray-800 p-2">
          <button
            onClick={() => setActiveTab('daw')}
            className={`px-4 py-2 rounded ${
              activeTab === 'daw'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            DAW
          </button>
          <button
            onClick={() => setActiveTab('control')}
            className={`px-4 py-2 rounded ${
              activeTab === 'control'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Codette Control
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto pb-20">
          {activeTab === 'daw' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 flex">
                <div className="flex-1 border-r border-gray-800">
                  <Timeline />
                </div>
              </div>
              <div className="h-48 border-t border-gray-800">
                <Mixer />
              </div>
            </div>
          )}

          {activeTab === 'control' && (
            <CodetteControlCenter />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Option 2: Add as a Floating Panel
// ============================================================================

export function AppWithFloatingControlPanel() {
  const [showControl, setShowControl] = useState(false);
  const [controlPosition, setControlPosition] = useState({ x: 50, y: 50 });

  return (
    <div className="w-full h-screen bg-gray-950">
      {/* Your main app content */}
      <div className="p-4">
        <button
          onClick={() => setShowControl(!showControl)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-medium"
        >
          {showControl ? 'Hide' : 'Show'} Codette Control
        </button>
      </div>

      {/* Floating Panel */}
      {showControl && (
        <div
          style={{
            position: 'fixed',
            right: '20px',
            bottom: '80px',
            width: '600px',
            height: '700px',
            zIndex: 50,
          }}
          className="bg-gray-950 rounded-lg shadow-2xl border border-gray-800 flex flex-col"
        >
          {/* Draggable Header */}
          <div
            onMouseDown={(e) => {
              const startX = e.clientX - controlPosition.x;
              const startY = e.clientY - controlPosition.y;
              const handleMouseMove = (moveEvent: MouseEvent) => {
                setControlPosition({
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
            }}
            className="bg-gray-900 border-b border-gray-800 p-3 flex justify-between items-center cursor-move rounded-t-lg"
          >
            <h3 className="text-white font-bold">Codette Control</h3>
            <button
              onClick={() => setShowControl(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto pb-20">
            <CodetteControlCenter />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Option 3: Add as a Sidebar with Collapse
// ============================================================================

export function AppWithCollapsibleSidebar() {
  const [showControlSidebar, setShowControlSidebar] = useState(true);

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Main DAW Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <button
            onClick={() => setShowControlSidebar(!showControlSidebar)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300"
          >
            {showControlSidebar ? '◄' : '►'} Control Panel
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {/* Your DAW UI here */}
        </div>
      </div>

      {/* Control Sidebar */}
      <div
        className={`transition-all duration-300 overflow-hidden bg-gray-900 border-l border-gray-800 ${
          showControlSidebar ? 'w-96' : 'w-0'
        }`}
      >
        <div className="w-96 h-screen flex flex-col pb-20">
          <CodetteControlCenter />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Option 4: Add to Existing Component Layout
// ============================================================================

import { useDAW } from '@/contexts/DAWContext';

export function EnhancedMainLayout() {
  const { selectedTrack } = useDAW();
  const [controlTab, setControlTab] = useState<'info' | 'control'>('info');

  return (
    <div className="w-full h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <h1 className="text-2xl font-bold text-white">CoreLogic Studio</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-auto pb-20">
        {/* Left Panel: DAW Controls */}
        <div className="w-1/3 border-r border-gray-800 overflow-auto">
          <div className="p-4">
            <h2 className="text-lg font-bold text-white mb-4">Track Details</h2>
            {selectedTrack ? (
              <div className="bg-gray-900 rounded p-4">
                <p className="text-gray-300">
                  <strong>Name:</strong> {selectedTrack.name}
                </p>
                <p className="text-gray-300">
                  <strong>Type:</strong> {selectedTrack.type}
                </p>
                <p className="text-gray-300">
                  <strong>Volume:</strong> {selectedTrack.volume.toFixed(1)} dB
                </p>
              </div>
            ) : (
              <p className="text-gray-500">No track selected</p>
            )}
          </div>
        </div>

        {/* Middle Panel: Timeline/Mixer */}
        <div className="flex-1 border-r border-gray-800">
          <Timeline />
        </div>

        {/* Right Panel: Codette Control */}
        <div className="w-96">
          <CodetteControlCenter />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Option 5: Modal Dialog (Best for Occasional Access)
// ============================================================================

export function AppWithControlModal() {
  const [showControlModal, setShowControlModal] = useState(false);

  return (
    <>
      {/* Your main app */}
      <div className="w-full h-screen bg-gray-950 p-4">
        <button
          onClick={() => setShowControlModal(true)}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-bold text-lg"
        >
          Open Codette Control Center
        </button>
      </div>

      {/* Modal */}
      {showControlModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-5xl max-h-[95vh] bg-gray-950 rounded-lg shadow-2xl border border-gray-800 flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900">
              <h2 className="text-2xl font-bold text-white">Codette Control Center</h2>
              <button
                onClick={() => setShowControlModal(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto pb-20">
              <CodetteControlCenter />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// Integration Checklist
// ============================================================================

/**
 * INTEGRATION STEPS:
 * 
 * 1. Import the component:
 *    import CodetteControlCenter from '@/components/CodetteControlCenter';
 * 
 * 2. Choose your layout (see options above)
 * 
 * 3. Add the component to your desired location:
 *    - As a tab
 *    - As a sidebar panel
 *    - As a floating window
 *    - As a modal dialog
 *    - In existing layout
 * 
 * 4. Handle padding for live status bar:
 *    - Add pb-20 to container: <div className="pb-20">
 *    - This prevents content from being hidden under the fixed bottom bar
 * 
 * 5. Optional: Connect to your backend:
 *    - Pass activity data via props (future enhancement)
 *    - Connect permissions to persistent storage
 *    - Sync settings with database
 * 
 * 6. Test:
 *    npm run typecheck  # Should pass with 0 errors
 *    npm run dev        # Should render without issues
 * 
 * 7. Verify all features work:
 *    - Switch between tabs
 *    - Activity updates every 6 seconds
 *    - Export CSV works
 *    - Permissions save/reset
 *    - Settings toggle
 *    - Live status bar visible
 */

// ============================================================================
// Example: Recommended Default Integration
// ============================================================================

/**
 * For most use cases, we recommend Option 3 (Collapsible Sidebar):
 * 
 * Benefits:
 * - Takes up minimal screen space
 * - Easily toggleable
 * - Doesn't interrupt main workflow
 * - Professional appearance
 * - Familiar to DAW users
 * 
 * Implementation:
 * 1. Add button to toggle sidebar
 * 2. Control panel appears on right side
 * 3. User can collapse when not needed
 * 4. Survives page refresh with localStorage
 * 
 * Usage:
 * import { AppWithCollapsibleSidebar } from './integration-guide';
 * export default AppWithCollapsibleSidebar;
 */

export default AppWithCollapsibleSidebar;
