import {
  Play,
  Square,
  Circle,
  Settings,
  Repeat,
  Undo2,
  Redo2,
  Music,
  Flag,
  Zap,
  Check,
  AlertCircle,
  Sparkles,
  BarChart3,
  Loader,
  KeyboardMusic,
  HardDrive,
  X,
  ChevronUp,
  Folder,
  File,
  Volume2,
} from "lucide-react";
import { useDAW } from "../contexts/DAWContext";
import { useCodettePanel } from "../contexts/CodettePanelContext";
import { useTransportClock } from "../hooks/useTransportClock";
import { useSaveStatus } from "../hooks/useSaveStatus";
import { useState, useEffect, useRef, useMemo } from "react";
import { getCodetteBridge } from "../lib/codetteBridgeService";
import {
  getDirectoryEntries,
  subscribeDirectoryEntries,
  type DirectoryEntry,
} from "../lib/projectDirectoryStore";

export default function TopBar() {
  const {
    isPlaying,
    isRecording,
    currentTime,
    cpuUsage,
    togglePlay,
    toggleRecord,
    stop,
    toggleLoop,
    loopRegion,
    metronomeSettings,
    toggleMetronome,
    undo,
    redo,
    canUndo,
    canRedo,
    addMarker,
    markers,
    openAudioSettingsModal,
    selectedTrack,
    tracks,
  } = useDAW();

  const { showCodetteMasterPanel, setShowCodetteMasterPanel } = useCodettePanel();

  const { state: transport, connected } = useTransportClock();
  const { isSaving, isSaved, isError } = useSaveStatus();

  // MIDI Action Logger
  interface MIDIActionLog {
    id: string;
    action: string;
    timestamp: number;
    icon?: string;
  }

  const [midiActionLog, setMidiActionLog] = useState<MIDIActionLog[]>([]);
  const midiLogListenerRef = useRef<() => void>();

  useEffect(() => {
    // Listen for MIDI action logs from console
    const originalLog = console.log;
    midiLogListenerRef.current = (...args: any[]) => {
      const msg = args[0]?.toString?.() || '';
      if (msg.includes('✅')) {
        const actionText = msg.replace('✅ ', '').split(':')[0];
        const newLog: MIDIActionLog = {
          id: Date.now().toString(),
          action: actionText,
          timestamp: Date.now(),
        };
        setMidiActionLog(prev => [newLog, ...prev].slice(0, 10)); // Keep last 10
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
          setMidiActionLog(prev => prev.filter(log => log.id !== newLog.id));
        }, 4000);
      }
      originalLog(...args);
    };
    
    // Override console.log to capture MIDI actions
    (console as any).log = midiLogListenerRef.current;

    return () => {
      (console as any).log = originalLog;
    };
  }, []);

  const [codetteActiveTab, setCodetteActiveTab] = useState<'suggestions' | 'analysis' | 'control'>('suggestions');
  const [codetteLoading, setCodetteLoading] = useState(false);
  const [codetteResult, setCodetteResult] = useState<string | null>(null);
  const [codetteBackendConnected, setCodetteBackendConnected] = useState(false);
  const [projectDirSearch, setProjectDirSearch] = useState('');
  const [showProjectDirDropdown, setShowProjectDirDropdown] = useState(false);
  const [isProjectDirDocked, setIsProjectDirDocked] = useState(true);
  const [showMIDIDropdown, setShowMIDIDropdown] = useState(false);
  const [directoryEntries, setDirectoryEntries] = useState<DirectoryEntry[]>([]);

  useEffect(() => {
    setDirectoryEntries(getDirectoryEntries());
    const unsubscribe = subscribeDirectoryEntries((entries) => {
      setDirectoryEntries(entries);
    });
    return unsubscribe;
  }, []);

  const projectSearchResults = useMemo(() => {
    const term = projectDirSearch.trim().toLowerCase();
    if (!term) return [];
    return directoryEntries
      .filter(
        (entry) =>
          entry.name.toLowerCase().includes(term) ||
          entry.path.toLowerCase().includes(term)
      )
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }, [projectDirSearch, directoryEntries]);

  const getProjectDirIcon = (entry: DirectoryEntry) => {
    if (entry.type === 'folder') {
      return <Folder className="w-3 h-3 text-yellow-400" />;
    }
    if (entry.name.endsWith('.wav') || entry.name.endsWith('.mp3')) {
      return <Volume2 className="w-3 h-3 text-blue-400" />;
    }
    return <File className="w-3 h-3 text-gray-400" />;
  };

  const handleProjectDirResultSelect = (entry: DirectoryEntry) => {
    setProjectDirSearch(entry.name);
    setShowProjectDirDropdown(false);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(entry.path).catch(() => {
        // Non-critical copy failure
      });
    }
  };

  const suggestMixingChain = async () => {
    if (!selectedTrack) return;
    setCodetteLoading(true);
    try {
      const bridge = getCodetteBridge();
      const analysis = await bridge.getMixingIntelligence(selectedTrack.type, {
        level: selectedTrack.volume || -60,
        peak: (selectedTrack.volume || -60) + 3,
        plugins: (selectedTrack.inserts || []).map((p: any) => typeof p === 'string' ? p : 'Unknown'),
      });
      setCodetteResult(analysis.prediction);
      setCodetteBackendConnected(true);
    } catch (error) {
      setCodetteResult(`Error: ${error instanceof Error ? error.message : 'Analysis failed'}`);
      setCodetteBackendConnected(false);
    } finally {
      setCodetteLoading(false);
    }
  };

  const suggestRouting = async () => {
    setCodetteLoading(true);
    try {
      const bridge = getCodetteBridge();
      const trackTypes = tracks.map((t: any) => t.type);
      const hasAux = tracks.some((t: any) => t.type === 'aux');

      const analysis = await bridge.getRoutingIntelligence({
        trackCount: tracks.length,
        trackTypes,
        hasAux,
      });
      setCodetteResult(analysis.prediction);
      setCodetteBackendConnected(true);
    } catch (error) {
      setCodetteResult(`Error: ${error instanceof Error ? error.message : 'Analysis failed'}`);
      setCodetteBackendConnected(false);
    } finally {
      setCodetteLoading(false);
    }
  };

  const analyzeSessionWithBackend = async () => {
    setCodetteLoading(true);
    try {
      const bridge = getCodetteBridge();
      
      const trackMetrics = tracks.map((t: any) => ({
        trackId: t.id,
        name: t.name,
        type: t.type,
        level: t.volume || -60,
        peak: (t.volume || -60) + 3,
        plugins: (t.inserts || []).map((p: any) => typeof p === 'string' ? p : 'Unknown'),
      }));

      const hasClipping = tracks.some((t: any) => (t.volume || -60) > -1);
      const masterLevel = Math.max(...tracks.map((t: any) => t.volume || -60), -60);
      const masterPeak = masterLevel + 3;

      const context = {
        trackCount: tracks.length,
        totalDuration: 0,
        sampleRate: 48000,
        trackMetrics,
        masterLevel,
        masterPeak,
        hasClipping,
      };

      const prediction = await bridge.analyzeSession(context);
      setCodetteResult(prediction.prediction);
      setCodetteBackendConnected(true);
    } catch (error) {
      setCodetteResult(`Error: ${error instanceof Error ? error.message : 'Analysis failed'}`);
      setCodetteBackendConnected(false);
    } finally {
      setCodetteLoading(false);
    }
  };

  const handleCodetteAction = async () => {
    switch (codetteActiveTab) {
      case 'suggestions':
        await suggestMixingChain();
        break;
      case 'analysis':
        await analyzeSessionWithBackend();
        break;
      case 'control':
        // Use routing suggestions for control tab
        await suggestRouting();
        break;
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  };

  return (
    <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-3 gap-3 text-xs">
      {/* LEFT: Transport Controls */}
      <div className="flex items-center gap-1 bg-gray-900 rounded px-2 py-1 border border-gray-700">
        {/* Stop */}
        <button
          onClick={stop}
          className="p-1.5 rounded hover:bg-red-700/30 text-red-400 transition"
          title="Stop"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>

        {/* Play */}
        <button
          onClick={togglePlay}
          className={`p-1.5 rounded transition-all duration-200 ${
            isPlaying
              ? "bg-green-600 text-white shadow-lg shadow-green-500/50 animate-transport-pulse"
              : "hover:bg-gray-800 text-green-400"
          }`}
          title="Play"
        >
          <Play className="w-4 h-4 fill-current" />
        </button>

        {/* Record */}
        <button
          onClick={toggleRecord}
          className={`p-1.5 rounded transition-all duration-200 ${
            isRecording
              ? "bg-red-600 text-white shadow-lg shadow-red-500/50 animate-pulse"
              : "hover:bg-gray-800 text-gray-300"
          }`}
          title="Record"
        >
          <Circle className="w-4 h-4 fill-current" />
        </button>
      </div>

      {/* MID-LEFT: Additional Controls */}
      <div className="flex items-center gap-1">
        {/* Loop */}
        <button
          onClick={toggleLoop}
          className={`p-1.5 rounded transition-all duration-200 ${
            loopRegion.enabled
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/40 animate-control-highlight"
              : "hover:bg-gray-800 text-gray-300"
          }`}
          title="Loop"
        >
          <Repeat className="w-4 h-4" />
        </button>

        {/* Undo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-1.5 rounded transition-all duration-200 ${
            canUndo
              ? "hover:bg-gray-800 text-gray-300 hover:shadow-md hover:shadow-blue-500/20"
              : "text-gray-600 cursor-not-allowed"
          }`}
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo */}
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-1.5 rounded transition-all duration-200 ${
            canRedo
              ? "hover:bg-gray-800 text-gray-300 hover:shadow-md hover:shadow-blue-500/20"
              : "text-gray-600 cursor-not-allowed"
          }`}
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Metronome */}
        <button
          onClick={toggleMetronome}
          className={`p-1.5 rounded transition-all duration-200 ${
            metronomeSettings.enabled
              ? "bg-yellow-600 text-white shadow-lg shadow-yellow-500/40"
              : "hover:bg-gray-800 text-gray-300"
          }`}
          title="Metronome"
        >
          <Music className="w-4 h-4" />
        </button>

        {/* Add Marker */}
        <button
          onClick={() => addMarker(currentTime, `Marker ${markers.length + 1}`)}
          className="p-1.5 rounded hover:bg-gray-800 text-purple-400 transition"
          title="Add Marker"
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>

      {/* CENTER: Time Display and Project Directory Search */}
      <div className="flex items-center gap-3 flex-1 max-w-3xl">
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 rounded border border-gray-700 flex-shrink-0">
          <div className="font-mono text-gray-200 text-xs flex-shrink-0">
            {formatTime(connected ? transport.time_seconds : currentTime)}
          </div>
          <div className="text-gray-500 text-xs">
            {transport.bpm.toFixed(0)} BPM
          </div>
        </div>

        {/* Project Directory Search - Dockable */}
        {isProjectDirDocked ? (
          <div className="relative flex-1 min-w-0 group">
            <div className="flex items-center gap-2 px-2 py-1 bg-gray-900 rounded border border-gray-700 hover:border-gray-600 transition">
              <HardDrive className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search projects..."
                value={projectDirSearch}
                onChange={(e) => {
                  setProjectDirSearch(e.target.value);
                  setShowProjectDirDropdown(true);
                }}
                onFocus={() => setShowProjectDirDropdown(true)}
                onBlur={() => setTimeout(() => setShowProjectDirDropdown(false), 200)}
                className="flex-1 min-w-0 text-xs px-2 py-0 bg-transparent text-gray-300 placeholder-gray-500 focus:outline-none"
                title="Search projects and files (Ctrl+Click to undock)"
              />
              {projectDirSearch && (
                <button
                  onClick={() => setProjectDirSearch('')}
                  className="p-0.5 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-300 transition flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    setIsProjectDirDocked(false);
                  }
                }}
                className="p-0.5 rounded text-gray-500 opacity-0 group-hover:opacity-100 hover:bg-gray-800 hover:text-gray-300 transition flex-shrink-0 cursor-help"
                title="Ctrl+Click to undock"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            </div>
            
            {/* Dropdown Results */}
            {showProjectDirDropdown && projectDirSearch && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                <div className="text-xs text-gray-400 p-2 flex justify-between">
                  <span>
                    Search results for "{projectDirSearch}" ({projectSearchResults.length})
                  </span>
                  <span className="text-gray-500">Indexed via Project Directory</span>
                </div>
                {projectSearchResults.length ? (
                  <div className="divide-y divide-gray-700">
                    {projectSearchResults.map((entry) => (
                      <button
                        key={entry.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleProjectDirResultSelect(entry);
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                      >
                        <span>{getProjectDirIcon(entry)}</span>
                        <span className="flex-1 truncate">{entry.name}</span>
                        <span className="text-gray-500 truncate max-w-[40%]">
                          {entry.path}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 p-2 text-center border-t border-gray-700">
                    No indexed files match. Open the Project Directory panel to index folders.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsProjectDirDocked(true)}
            className="px-2 py-1 rounded text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-gray-200 border border-gray-700 hover:border-gray-600 transition flex items-center gap-2"
            title="Click to dock Project Directory search"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Dock Search</span>
          </button>
        )}
      </div>

      {/* Codette AI Quick Controls */}
      <div className="flex items-center gap-1 px-2 py-1 bg-purple-900/20 rounded border border-purple-700/50">
        {/* Open Full Panel Button */}
        <button
          onClick={() => setShowCodetteMasterPanel(!showCodetteMasterPanel)}
          className={`px-2 py-1 rounded transition-all duration-200 text-xs font-medium flex items-center gap-1 ${
            showCodetteMasterPanel
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
              : 'text-purple-300 hover:text-purple-200 hover:bg-purple-600/30'
          }`}
          title="Open Codette AI Master Panel"
        >
          <Sparkles className="w-3 h-3" />
          <span className="hidden sm:inline">Codette</span>
        </button>

        {/* Quick Suggestion Tab */}
        <button
          onClick={() => {
            setCodetteActiveTab('suggestions');
            setCodetteResult(null);
          }}
          className={`px-2 py-1 rounded transition-colors text-xs font-medium flex items-center gap-1 ${
            codetteActiveTab === 'suggestions'
              ? 'bg-purple-600 text-white'
              : 'text-purple-300 hover:text-purple-200'
          }`}
          title="AI Suggestions"
        >
          <Sparkles className="w-3 h-3" />
          <span className="hidden sm:inline">AI</span>
        </button>

        {/* Quick Analysis Tab */}
        <button
          onClick={() => {
            setCodetteActiveTab('analysis');
            setCodetteResult(null);
          }}
          className={`px-2 py-1 rounded transition-colors text-xs font-medium flex items-center gap-1 ${
            codetteActiveTab === 'analysis'
              ? 'bg-purple-600 text-white'
              : 'text-purple-300 hover:text-purple-200'
          }`}
          title="Analysis"
        >
          <BarChart3 className="w-3 h-3" />
          <span className="hidden sm:inline">Analyze</span>
        </button>

        {/* Quick Control Tab */}
        <button
          onClick={() => {
            setCodetteActiveTab('control');
            setCodetteResult(null);
          }}
          className={`px-2 py-1 rounded transition-colors text-xs font-medium flex items-center gap-1 ${
            codetteActiveTab === 'control'
              ? 'bg-purple-600 text-white'
              : 'text-purple-300 hover:text-purple-200'
          }`}
          title="Control"
        >
          <Sparkles className="w-3 h-3" />
          <span className="hidden sm:inline">Control</span>
        </button>

        {/* Execute Button */}
        <button
          onClick={handleCodetteAction}
          disabled={codetteLoading}
          className="ml-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded text-xs font-medium transition flex items-center gap-1"
          title="Execute AI Action"
        >
          {codetteLoading ? (
            <>
              <Loader className="w-3 h-3 animate-spin" />
              <span className="hidden sm:inline">Working...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">Run</span>
            </>
          )}
        </button>

        {/* Result Indicator */}
        {codetteResult && (
          <div className="ml-1 px-2 py-1 bg-purple-900/50 rounded text-xs text-purple-200 max-w-xs truncate">
            {codetteResult.substring(0, 50)}...
          </div>
        )}

        {/* Connection Status */}
        <div className={`ml-1 w-2 h-2 rounded-full ${codetteBackendConnected ? 'bg-green-400' : 'bg-red-400'}`} title={codetteBackendConnected ? 'Connected to Codette backend' : 'Codette backend offline'} />
      </div>

      {/* MIDI Action Status Display - Enhanced Dropdown */}
      {midiActionLog.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowMIDIDropdown(!showMIDIDropdown)}
            className="flex items-center gap-1 px-2 py-1 bg-teal-900/20 rounded border border-teal-700/50 hover:bg-teal-900/40 hover:border-teal-600 transition group"
            title="MIDI Actions (click to expand)"
          >
            <KeyboardMusic className="w-3 h-3 text-teal-400 animate-pulse" />
            <span className="text-xs text-teal-300 font-medium hidden sm:inline">
              {midiActionLog[0].action}
            </span>
            <Check className="w-3 h-3 text-green-400" />
            <span className="text-xs text-teal-400">
              ({midiActionLog.length})
            </span>
          </button>
          
          {/* MIDI Actions Dropdown */}
          {showMIDIDropdown && (
            <div className="absolute top-full mt-1 right-0 bg-gray-800 border border-teal-700/50 rounded shadow-lg z-50 w-64 max-h-48 overflow-y-auto">
              <div className="sticky top-0 bg-teal-900/20 border-b border-teal-700/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <KeyboardMusic className="w-3 h-3 text-teal-400" />
                  <span className="text-xs font-semibold text-teal-300">Recent MIDI Actions</span>
                </div>
              </div>
              
              <div className="divide-y divide-gray-700">
                {midiActionLog.map((log) => (
                  <div key={log.id} className="px-3 py-2 hover:bg-gray-700/50 transition">
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                        <span className="text-xs text-gray-300 truncate">{log.action}</span>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {Math.round((Date.now() - log.timestamp) / 1000)}s ago
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RIGHT: Status */}
      <div className="flex-1" />

      {/* Save Status Indicator */}
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all duration-200 ${
        isSaving 
          ? 'bg-blue-900/40 text-blue-400'
          : isSaved 
          ? 'bg-green-900/40 text-green-400'
          : isError
          ? 'bg-red-900/40 text-red-400'
          : 'bg-transparent text-gray-600'
      }`}
      title={isSaving ? 'Saving project...' : isSaved ? 'Project saved' : 'Project auto-save'}
      >
        {isSaving && (
          <>
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-medium">Saving...</span>
          </>
        )}
        {isSaved && (
          <>
            <Check className="w-3 h-3" />
            <span className="text-xs font-medium">Saved</span>
          </>
        )}
        {isError && (
          <>
            <AlertCircle className="w-3 h-3" />
            <span className="text-xs font-medium">Save error</span>
          </>
        )}
      </div>

      {/* CPU Usage */}
      <div className="flex items-center gap-1 text-gray-400">
        <Zap className="w-3 h-3" />
        <span className="text-xs font-semibold text-gray-300">{cpuUsage}%</span>
      </div>

      {/* Settings */}
      <button
        onClick={openAudioSettingsModal}
        className="p-1.5 rounded hover:bg-gray-700 text-gray-300 transition"
        title="Settings"
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  );
}
