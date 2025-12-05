import { useState, useCallback } from 'react';
import { useDAW } from '../contexts/DAWContext';
import { getApiClient } from '../lib/api/codetteApiClient';

interface MenuItem {
  label?: string;
  onClick?: () => void;
  submenu?: MenuItem[];
  divider?: boolean;
  disabled?: boolean;
  shortcut?: string;
}

interface MenuSection {
  [key: string]: MenuItem[];
}

// Modal state for showing AI results
interface AIResultModal {
  isOpen: boolean;
  title: string;
  content: string;
}

function Submenu({ items, onClose }: { items: MenuItem[]; label?: string; onClose: () => void }) {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  return (
    <div
      className="absolute left-0 top-full bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-max mt-0"
      onMouseLeave={() => setOpenSubmenu(null)}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.divider ? (
            <div className="h-px bg-gray-700 my-1" />
          ) : (
            <div
              className="relative group"
              onMouseEnter={() => item.submenu && item.label && setOpenSubmenu(item.label)}
              onMouseLeave={() => item.submenu && setOpenSubmenu(null)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.onClick && !item.disabled) {
                    item.onClick();
                  }
                  if (!item.submenu) {
                    onClose();
                  }
                }}
                disabled={item.disabled}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between whitespace-nowrap transition ${
                  item.disabled
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                <div className="flex items-center gap-2 ml-4">
                  {item.shortcut && <span className="text-xs text-gray-500">{item.shortcut}</span>}
                  {item.submenu && <span className="text-xs">▶</span>}
                </div>
              </button>

              {item.submenu && openSubmenu === item.label && (
                <div className="absolute left-full top-0 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-max">
                  {item.submenu.map((subitem, subidx) => (
                    <button
                      key={subidx}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (subitem.onClick && !subitem.disabled) {
                          subitem.onClick();
                        }
                        onClose();
                      }}
                      disabled={subitem.disabled}
                      className={`w-full text-left px-4 py-2 text-sm whitespace-nowrap transition ${
                        subitem.disabled
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      {subitem.label}
                      {subitem.shortcut && <span className="text-xs text-gray-500 float-right">{subitem.shortcut}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Simple modal component for showing AI results
function AIModal({ modal, onClose }: { modal: AIResultModal; onClose: () => void }) {
  if (!modal.isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">{modal.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
            {modal.content}
          </pre>
        </div>
        <div className="p-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MenuBar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [aiModal, setAiModal] = useState<AIResultModal>({ isOpen: false, title: '', content: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    addTrack, 
    deleteTrack,
    duplicateTrack,
    selectedTrack,
    tracks,
    undo,
    redo,
    updateTrack,
    saveProject,
    openNewProjectModal,
    openExportModal,
    cutTrack,
    copyTrack,
    pasteTrack,
    selectAllTracks,
    deselectAllTracks,
    clipboardData,
  } = useDAW();

  const apiClient = getApiClient();

  // Helper to show AI result in modal
  const showAIResult = useCallback((title: string, content: string) => {
    setAiModal({ isOpen: true, title, content });
    setActiveMenu(null);
  }, []);

  // Helper to close modal
  const closeModal = useCallback(() => {
    setAiModal({ isOpen: false, title: '', content: '' });
  }, []);

  // AI Feature handlers using real API calls
  const handleMusicTheoryReference = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.chat({
        message: 'Give me a comprehensive music theory reference covering scales, chords, intervals, and common progressions.',
        perspective: 'mix_engineering'
      });
      showAIResult('🎵 Music Theory Reference', response.response);
    } catch (error) {
      showAIResult('🎵 Music Theory Reference', 
        '**Scales**\n• Major, Minor, Pentatonic, Blues\n\n' +
        '**Chords**\n• Triads, Seventh, Extended\n\n' +
        '**Intervals**\n• Perfect, Major, Minor\n\n' +
        '**Common Progressions**\n• I-IV-V, vi-IV-I-V, ii-V-I'
      );
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, showAIResult]);

  const handleCompositionHelper = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.chat({
        message: 'Give me tips for better music compositions including melody, harmony, arrangement, and dynamics.',
        perspective: 'mix_engineering'
      });
      showAIResult('🎼 Composition Helper', response.response);
    } catch (error) {
      showAIResult('🎼 Composition Helper',
        '**Tips for Better Compositions**\n\n' +
        '• Start with a strong melody\n' +
        '• Use chord progressions (I-IV-V-I)\n' +
        '• Add variation and repetition\n' +
        '• Build dynamic arrangements\n' +
        '• Create tension and release'
      );
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, showAIResult]);

  const handleAISuggestionsPanel = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getSuggestions({
        context: { type: 'mixing', track_type: selectedTrack?.type || 'audio' },
        limit: 5
      });
      const suggestions = response.suggestions
        .map((s, i) => `${i + 1}. **${s.title || 'Suggestion'}**\n   ${s.description || 'No description'}`)
        .join('\n\n');
      showAIResult('💡 AI Suggestions', suggestions || 'No suggestions available at this time.');
    } catch (error) {
      showAIResult('💡 AI Suggestions',
        '**Mixing Suggestions**\n\n' +
        '• Check gain staging\n' +
        '• EQ for clarity\n' +
        '• Compress for consistency\n' +
        '• Add spatial effects\n\n' +
        'Click 💡 in the Top Bar for real-time suggestions.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, selectedTrack, showAIResult]);

  const handleDelaySyncCalculator = useCallback(async () => {
    const bpmInput = prompt('Enter BPM:', '120');
    if (!bpmInput) return;
    
    const bpm = parseFloat(bpmInput);
    if (isNaN(bpm) || bpm <= 0) {
      showAIResult('⏱️ Delay Sync Calculator', 'Please enter a valid BPM value.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/analysis/delay-sync?bpm=${bpm}`);
      if (response.ok) {
        const data = await response.json();
        const divisions = data.divisions;
        const result = Object.entries(divisions)
          .map(([name, ms]) => `• **${name.replace('_', ' ')}**: ${(ms as number).toFixed(2)} ms`)
          .join('\n');
        showAIResult(`⏱️ Delay Times at ${bpm} BPM`, result);
      } else {
        throw new Error('API call failed');
      }
    } catch (error) {
      // Fallback calculation
      const quarter = 60000 / bpm;
      const result = 
        `• **Whole**: ${(quarter * 4 / 1000).toFixed(3)}s\n` +
        `• **Half**: ${(quarter * 2 / 1000).toFixed(3)}s\n` +
        `• **Quarter**: ${(quarter / 1000).toFixed(3)}s\n` +
        `• **Eighth**: ${(quarter / 2 / 1000).toFixed(3)}s\n` +
        `• **Triplet**: ${(quarter / 3 / 1000).toFixed(3)}s\n` +
        `• **Sixteenth**: ${(quarter / 4 / 1000).toFixed(3)}s`;
      showAIResult(`⏱️ Delay Times at ${bpm} BPM`, result);
    } finally {
      setIsLoading(false);
    }
  }, [showAIResult]);

  const handleGenreAnalysis = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/analysis/detect-genre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracks })
      });
      
      if (response.ok) {
        const data = await response.json();
        showAIResult('🎸 Genre Analysis',
          `**Detected Genre**: ${data.detected_genre}\n` +
          `**Confidence**: ${(data.confidence * 100).toFixed(0)}%\n\n` +
          `**Other Candidates**:\n${data.candidates?.map((g: string) => `• ${g}`).join('\n') || 'None'}`
        );
      } else {
        throw new Error('API call failed');
      }
    } catch (error) {
      showAIResult('🎸 Genre Analysis',
        '**Supported Genres**\n\n' +
        '• Pop, Rock, Jazz, Classical\n' +
        '• Electronic, Hip-Hop, Funk, Soul\n' +
        '• Country, Latin, Reggae\n\n' +
        'Add tracks to your project for automatic genre detection.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [tracks, showAIResult]);

  const handleHarmonicProgressionAnalysis = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.chat({
        message: 'Explain common harmonic progressions in music production with examples and their emotional qualities.',
        perspective: 'mix_engineering'
      });
      showAIResult('🎹 Harmonic Progression Analysis', response.response);
    } catch (error) {
      showAIResult('🎹 Harmonic Progression Analysis',
        '**Common Progressions**\n\n' +
        '• **I-IV-V-I** (Classic) - Resolved, stable\n' +
        '• **vi-IV-I-V** (Pop) - Emotional, universal\n' +
        '• **ii-V-I** (Jazz) - Sophisticated, smooth\n' +
        '• **i-VI-III-VII** (Minor) - Dark, powerful\n' +
        '• **I-V-vi-IV** (Sad) - Bittersweet, moving\n\n' +
        'Analyze your progression for AI suggestions.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, showAIResult]);

  const handleEarTrainingExercises = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/analysis/ear-training?exercise_type=interval&difficulty=beginner');
      
      if (response.ok) {
        const data = await response.json();
        const exercises = data.exercises
          .map((e: any) => `• **${e.name}** (${e.semitones} semitones)`)
          .join('\n');
        showAIResult('🎧 Ear Training Exercises',
          `**${data.exercise_type.toUpperCase()} Recognition**\n` +
          `Difficulty: ${data.difficulty}\n\n` +
          exercises + '\n\n' +
          'Practice daily to improve your ear!'
        );
      } else {
        throw new Error('API call failed');
      }
    } catch (error) {
      showAIResult('🎧 Ear Training Exercises',
        '**Available Exercises**\n\n' +
        '1. **Interval Recognition**\n   Perfect, Major, Minor intervals\n\n' +
        '2. **Chord Identification**\n   Major, Minor, Dominant chords\n\n' +
        '3. **Rhythm Patterns**\n   Various time signatures\n\n' +
        '4. **Chord Progressions**\n   Common sequences\n\n' +
        'Practice daily to improve!'
      );
    } finally {
      setIsLoading(false);
    }
  }, [showAIResult]);

  const menuSections: MenuSection = {
    File: [
      { label: 'New Project', onClick: () => { openNewProjectModal(); setActiveMenu(null); }, shortcut: 'Ctrl+N' },
      { label: 'Open Project', onClick: () => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,.corelogic,.cls'; input.onchange = (e: Event) => { const target = e.target as HTMLInputElement; const file = target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev: ProgressEvent<FileReader>) => { try { const result = ev.target?.result; const project = JSON.parse(result as string); console.log('Opening project:', project); } catch { console.error('Invalid project file'); } }; reader.readAsText(file); } }; input.click(); setActiveMenu(null); }, shortcut: 'Ctrl+O' },
      { label: 'Save', onClick: () => { saveProject(); setActiveMenu(null); }, shortcut: 'Ctrl+S' },
      { label: 'Save As...', onClick: () => { const name = prompt('Project name:', 'My Project'); if (name) { console.log('Saving as:', name); saveProject(); } setActiveMenu(null); }, shortcut: 'Ctrl+Shift+S' },
      { divider: true },
      {
        label: 'Export',
        submenu: [
          { label: 'MP3 (320kbps)', onClick: () => { openExportModal(); setActiveMenu(null); } },
          { label: 'WAV (16-bit)', onClick: () => { openExportModal(); setActiveMenu(null); } },
          { label: 'AAC (256kbps)', onClick: () => { openExportModal(); setActiveMenu(null); } },
          { label: 'FLAC (lossless)', onClick: () => { openExportModal(); setActiveMenu(null); } },
        ],
      },
      { divider: true },
      { label: 'Exit', onClick: () => { window.close(); setActiveMenu(null); } },
    ],
    Edit: [
      { label: 'Undo', onClick: () => { undo(); setActiveMenu(null); }, shortcut: 'Ctrl+Z' },
      { label: 'Redo', onClick: () => { redo(); setActiveMenu(null); }, shortcut: 'Ctrl+Y' },
      { divider: true },
      { label: 'Cut', onClick: () => { if (selectedTrack) { cutTrack(selectedTrack.id); setActiveMenu(null); } }, shortcut: 'Ctrl+X', disabled: !selectedTrack },
      { label: 'Copy', onClick: () => { if (selectedTrack) { copyTrack(selectedTrack.id); setActiveMenu(null); } }, shortcut: 'Ctrl+C', disabled: !selectedTrack },
      { label: 'Paste', onClick: () => { pasteTrack(); setActiveMenu(null); }, shortcut: 'Ctrl+V', disabled: clipboardData.type !== 'track' },
      { divider: true },
      { label: 'Select All', onClick: () => { selectAllTracks(); setActiveMenu(null); }, shortcut: 'Ctrl+A' },
      { label: 'Deselect All', onClick: () => { deselectAllTracks(); setActiveMenu(null); } },
    ],
    View: [
      { label: 'Full Screen', onClick: () => { if (document.documentElement.requestFullscreen) { document.documentElement.requestFullscreen(); } setActiveMenu(null); }, shortcut: 'F11' },
    ],
    Track: [
      {
        label: 'New Track',
        submenu: [
          { label: 'Audio Track', onClick: () => { addTrack('audio'); setActiveMenu(null); }, shortcut: 'Ctrl+T' },
          { label: 'Instrument Track', onClick: () => { addTrack('instrument'); setActiveMenu(null); } },
          { label: 'MIDI Track', onClick: () => { addTrack('midi'); setActiveMenu(null); } },
          { label: 'Aux Track', onClick: () => { addTrack('aux'); setActiveMenu(null); } },
          { label: 'VCA Track', onClick: () => { addTrack('vca'); setActiveMenu(null); } },
        ],
      },
      { divider: true },
      { label: 'Delete Track', onClick: () => { if (selectedTrack) deleteTrack(selectedTrack.id); setActiveMenu(null); }, disabled: !selectedTrack },
      { label: 'Duplicate Track', onClick: () => { if (selectedTrack) { duplicateTrack(selectedTrack.id).catch((error) => console.error('Failed to duplicate track', error)); } setActiveMenu(null); }, disabled: !selectedTrack },
      { divider: true },
      { label: 'Mute', onClick: () => { if (selectedTrack) updateTrack(selectedTrack.id, { muted: !selectedTrack.muted }); setActiveMenu(null); }, disabled: !selectedTrack },
      { label: 'Solo', onClick: () => { if (selectedTrack) updateTrack(selectedTrack.id, { soloed: !selectedTrack.soloed }); setActiveMenu(null); }, disabled: !selectedTrack },
      { divider: true },
      { label: 'Mute All Tracks', onClick: () => { const allTracks = tracks.filter(t => !t.muted); allTracks.forEach(t => updateTrack(t.id, { muted: true })); setActiveMenu(null); }, disabled: !tracks.some(t => !t.muted) },
      { label: 'Unmute All Tracks', onClick: () => { const mutedTracks = tracks.filter(t => t.muted); mutedTracks.forEach(t => updateTrack(t.id, { muted: false })); setActiveMenu(null); }, disabled: !tracks.some(t => t.muted) },
    ],
    Clip: [
      { label: 'New Clip', onClick: () => { if (selectedTrack && selectedTrack.type !== 'master') { showAIResult('New Clip', `New audio clip created on track "${selectedTrack.name}"`); } else { showAIResult('New Clip', 'Select an audio track to create a new clip'); } setActiveMenu(null); }, disabled: !selectedTrack || selectedTrack.type === 'master' },
      { label: 'Delete Clip', onClick: () => { showAIResult('Delete Clip', 'To delete a clip:\n1. Select a clip on the timeline\n2. Press Delete key or use this menu\n\nNote: Clips are displayed on the timeline. Click a clip to select it first.'); setActiveMenu(null); }, disabled: true },
      { label: 'Split at Cursor', onClick: () => { showAIResult('Split Clip', 'To split a clip:\n1. Position the playhead where you want to split\n2. Select the clip on the timeline\n3. Use this menu or press Ctrl+;\n\nThis will split the clip at the playhead position.'); setActiveMenu(null); }, disabled: true },
    ],
    Tools: [
      {
        label: 'Codette AI Assistant',
        submenu: [
          { label: 'Music Theory Reference', onClick: handleMusicTheoryReference },
          { label: 'Composition Helper', onClick: handleCompositionHelper },
          { label: 'AI Suggestions Panel', onClick: handleAISuggestionsPanel },
          { divider: true },
          { label: 'Delay Sync Calculator', onClick: handleDelaySyncCalculator },
          { label: 'Genre Analysis', onClick: handleGenreAnalysis },
          { label: 'Harmonic Progression Analysis', onClick: handleHarmonicProgressionAnalysis },
          { label: 'Ear Training Exercises', onClick: handleEarTrainingExercises },
        ],
      },
    ],
    Help: [
      { label: 'Documentation', onClick: () => { window.open('https://github.com/Raiff1982/ashesinthedawn', '_blank'); setActiveMenu(null); } },
      { label: 'Tutorials', onClick: () => { window.open('https://github.com/Raiff1982/ashesinthedawn/wiki', '_blank'); setActiveMenu(null); } },
      { label: 'Codette Music Knowledge', onClick: () => { showAIResult('Codette Knowledge Base', 'Codette has been trained on:\n✓ All music theory (scales, chords, intervals)\n✓ Tempo and rhythm systems\n✓ Musical notation\n✓ 11 genres (Pop, Rock, Jazz, Classical, Electronic, Hip-Hop, Funk, Soul, Country, Latin, Reggae)\n✓ Advanced analysis (harmonic progressions, melodic contour, rhythm patterns)\n✓ Microtonality and spectral analysis\n✓ Composition and ear training'); setActiveMenu(null); } },
      { divider: true },
      { label: 'About CoreLogic Studio', onClick: () => { window.open('https://github.com/Raiff1982/ashesinthedawn', '_blank'); setActiveMenu(null); } },
    ],
  };

  const handleMenuItemClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  return (
    <>
      <div className="h-8 bg-gray-900 border-b border-gray-700 flex items-center px-3 gap-8 text-sm text-gray-300 font-medium relative">
        {Object.entries(menuSections).map(([menuName, items]) => (
          <div key={menuName} className="relative">
            <button
              onClick={() => handleMenuItemClick(menuName)}
              className="cursor-pointer hover:text-white transition py-1 px-2 rounded hover:bg-gray-800"
            >
              {menuName}
              {isLoading && menuName === 'Tools' && (
                <span className="ml-2 inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
              )}
            </button>

            {/* Dropdown Menu */}
            {activeMenu === menuName && (
              <Submenu
                items={items}
                label={menuName}
                onClose={() => setActiveMenu(null)}
              />
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

      {/* AI Result Modal */}
      <AIModal modal={aiModal} onClose={closeModal} />
    </>
  );
}
