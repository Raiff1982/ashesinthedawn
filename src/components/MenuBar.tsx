import { useState } from 'react';
import { useDAW } from '../contexts/DAWContext';

interface MenuItem {
  label: string;
  onClick: () => void;
}

interface MenuSection {
  [key: string]: MenuItem[];
}

export default function MenuBar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { 
    addTrack, 
    deleteTrack,
    selectedTrack,
  } = useDAW();

  const menuSections: MenuSection = {
    File: [
      { label: 'New Project', onClick: () => { console.log('New project'); setActiveMenu(null); } },
      { label: 'Open Project', onClick: () => { console.log('Open project'); setActiveMenu(null); } },
      { label: 'Save', onClick: () => { console.log('Save project'); setActiveMenu(null); } },
      { label: 'Save As...', onClick: () => { console.log('Save as'); setActiveMenu(null); } },
      { label: 'Export', onClick: () => { console.log('Export'); setActiveMenu(null); } },
    ],
    Edit: [
      { label: 'Undo', onClick: () => { console.log('Undo'); setActiveMenu(null); } },
      { label: 'Redo', onClick: () => { console.log('Redo'); setActiveMenu(null); } },
      { label: 'Cut', onClick: () => { console.log('Cut'); setActiveMenu(null); } },
      { label: 'Copy', onClick: () => { console.log('Copy'); setActiveMenu(null); } },
      { label: 'Paste', onClick: () => { console.log('Paste'); setActiveMenu(null); } },
    ],
    View: [
      { label: 'Zoom In', onClick: () => { console.log('Zoom in'); setActiveMenu(null); } },
      { label: 'Zoom Out', onClick: () => { console.log('Zoom out'); setActiveMenu(null); } },
      { label: 'Full Screen', onClick: () => { console.log('Toggle fullscreen'); setActiveMenu(null); } },
      { label: 'Show Mixer', onClick: () => { console.log('Show mixer'); setActiveMenu(null); } },
    ],
    Track: [
      { label: 'New Track', onClick: () => { addTrack('audio'); setActiveMenu(null); } },
      { label: 'Delete Track', onClick: () => { if (selectedTrack) deleteTrack(selectedTrack.id); setActiveMenu(null); } },
      { label: 'Duplicate Track', onClick: () => { console.log('Duplicate track'); setActiveMenu(null); } },
      { label: 'Mute', onClick: () => { console.log('Mute track'); setActiveMenu(null); } },
      { label: 'Solo', onClick: () => { console.log('Solo track'); setActiveMenu(null); } },
    ],
    Clip: [
      { label: 'New Clip', onClick: () => { console.log('New clip'); setActiveMenu(null); } },
      { label: 'Delete Clip', onClick: () => { console.log('Delete clip'); setActiveMenu(null); } },
      { label: 'Split at Cursor', onClick: () => { console.log('Split clip'); setActiveMenu(null); } },
      { label: 'Quantize', onClick: () => { console.log('Quantize'); setActiveMenu(null); } },
    ],
    Event: [
      { label: 'Create Event', onClick: () => { console.log('Create event'); setActiveMenu(null); } },
      { label: 'Edit Event', onClick: () => { console.log('Edit event'); setActiveMenu(null); } },
      { label: 'Delete Event', onClick: () => { console.log('Delete event'); setActiveMenu(null); } },
    ],
    Options: [
      { label: 'Preferences', onClick: () => { console.log('Open preferences'); setActiveMenu(null); } },
      { label: 'Audio Settings', onClick: () => { console.log('Audio settings'); setActiveMenu(null); } },
      { label: 'MIDI Settings', onClick: () => { console.log('MIDI settings'); setActiveMenu(null); } },
      { label: 'Keyboard Shortcuts', onClick: () => { console.log('Keyboard shortcuts'); setActiveMenu(null); } },
    ],
    Help: [
      { label: 'Documentation', onClick: () => { console.log('Open docs'); setActiveMenu(null); } },
      { label: 'Tutorials', onClick: () => { console.log('Open tutorials'); setActiveMenu(null); } },
      { label: 'About', onClick: () => { console.log('About'); setActiveMenu(null); } },
    ],
  };

  const handleMenuItemClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  return (
    <div className="h-8 bg-gray-900 border-b border-gray-700 flex items-center px-3 gap-8 text-sm text-gray-300 font-medium relative">
      {Object.entries(menuSections).map(([menuName, items]) => (
        <div key={menuName} className="relative group">
          <button
            onClick={() => handleMenuItemClick(menuName)}
            className="cursor-pointer hover:text-white transition py-1 px-2 rounded hover:bg-gray-800"
          >
            {menuName}
          </button>

          {/* Dropdown Menu */}
          {activeMenu === menuName && (
            <div className="absolute left-0 top-full mt-0 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-max">
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition first:rounded-t last:rounded-b whitespace-nowrap"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Close menu when clicking outside */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}
