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
} from "lucide-react";
import { useDAW } from "../contexts/DAWContext";
import { useTransportClock } from "../hooks/useTransportClock";
import { useSaveStatus } from "../hooks/useSaveStatus";
import { useState, useEffect, useRef } from "react";
import { getCodetteBridge } from "../lib/codetteBridgeService";

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
        setMidiActionLog(prev => [newLog, ...prev].slice(0, 5)); // Keep last 5
        
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

      {/* CENTER: Time Display */}
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 rounded border border-gray-700">
        <div className="font-mono text-gray-200 text-xs flex-shrink-0">
          {formatTime(connected ? transport.time_seconds : currentTime)}
        </div>
        <div className="text-gray-500 text-xs">
          {transport.bpm.toFixed(0)} BPM
        </div>
      </div>

      {/* Codette AI Quick Controls */}
      <div className="flex items-center gap-1 px-2 py-1 bg-purple-900/20 rounded border border-purple-700/50">
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
        <div className={`ml-1 w-2 h-2 rounded-full ${codetteBackendConnected ? 'bg-green-400' : 'bg-red-400'}`} />
      </div>

      {/* MIDI Action Status Display */}
      {midiActionLog.length > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 bg-teal-900/20 rounded border border-teal-700/50">
          <KeyboardMusic className="w-3 h-3 text-teal-400 animate-pulse" />
          <span className="text-xs text-teal-300 font-medium">
            {midiActionLog[0].action}
          </span>
          <Check className="w-3 h-3 text-green-400" />
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
