/**
 * Codette AI Panel Component - ENHANCED
 * Full integration with all backend capabilities
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCodette } from '@/hooks/useCodette';
import { useDAW } from '@/contexts/DAWContext';
import type { Plugin } from '@/types';
import {
  MessageCircle,
  Send,
  Loader,
  AlertCircle,
  Lightbulb,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Brain,
  Clock,
  Settings,
  Atom,
  Wifi,
  WifiOff,
  Music,
  Sparkles,
} from 'lucide-react';

export interface CodettePanelProps {
  isVisible?: boolean;
  onClose?: () => void;
  trackContext?: Record<string, unknown>;
}

const PERSONALITY_MODES = [
  { id: 'technical_expert', label: 'Technical Expert', emoji: '🔬', color: 'blue' },
  { id: 'creative_mentor', label: 'Creative Mentor', emoji: '🎨', color: 'purple' },
  { id: 'practical_guide', label: 'Practical Guide', emoji: '🛠️', color: 'green' },
  { id: 'analytical_teacher', label: 'Audio Engineer', emoji: '🎚️', color: 'yellow' },
  { id: 'innovative_explorer', label: 'Innovation Lab', emoji: '🚀', color: 'pink' },
] as const;

const PERSPECTIVES = [
  { id: 'newtonian_logic', label: 'Newtonian Logic', description: 'Cause-effect analysis' },
  { id: 'davinci_synthesis', label: 'Da Vinci', description: 'Creative synthesis' },
  { id: 'human_intuition', label: 'Human Intuition', description: 'Empathy & experience' },
  { id: 'neural_network', label: 'Neural Network', description: 'Pattern recognition' },
  { id: 'quantum_logic', label: 'Quantum Logic', description: 'Superposition thinking' },
  { id: 'resilient_kindness', label: 'Kindness', description: 'Compassionate guidance' },
  { id: 'mathematical_rigor', label: 'Mathematical', description: 'Formal optimization' },
  { id: 'philosophical', label: 'Philosophical', description: 'Ethical frameworks' },
  { id: 'copilot_developer', label: 'Copilot', description: 'Technical design' },
  { id: 'bias_mitigation', label: 'Bias Check', description: 'Fairness analysis' },
  { id: 'psychological', label: 'Psychological', description: 'Behavioral modeling' },
] as const;

export function CodettePanel({ isVisible = true, onClose }: CodettePanelProps) {
  const {
    isConnected,
    isLoading,
    chatHistory,
    suggestions,
    analysis,
    error,
    quantumState,
    currentPersonality,
    websocketConnected,
    sendMessage,
    clearHistory,
    reconnect,
    getSuggestions,
    getMasteringAdvice,
    rotatePersonality,
    setPersonality,
    setActivePerspectives,
    getCocoonHistory,
    dreamFromCocoon,
    getStatus,
    connectWebSocket,
    disconnectWebSocket,
    getDelaySync,
    detectGenre,
    getEarTraining,
    getProductionChecklist,
    getInstrumentInfo,
  } = useCodette({ autoConnect: true });

  const {
    addTrack,
    selectedTrack,
    togglePlay,
    updateTrack,
    isPlaying,
    getAudioBufferData,
    tracks,
    currentTime,
  } = useDAW();

  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<'suggestions' | 'analysis' | 'chat' | 'actions' | 'perspectives' | 'memory' | 'advanced'>('suggestions');
  const [selectedContext, setSelectedContext] = useState('general');
  const [expanded, setExpanded] = useState(true);
  const [confidenceFilter, setConfidenceFilter] = useState(0);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [favoriteSuggestions, setFavoriteSuggestions] = useState<Set<string>>(new Set());
  const [showPersonalityMenu, setShowPersonalityMenu] = useState(false);
  const [activePerspectives, setActivePerspectivesLocal] = useState<string[]>(
    PERSPECTIVES.slice(0, 5).map(p => p.id)
  );
  const [cocoonHistory, setCocoonHistory] = useState<any[]>([]);
  const [loadingCocoons, setLoadingCocoons] = useState(false);
  const [selectedCocoon, setSelectedCocoon] = useState<any>(null);
  const [dreamText, setDreamText] = useState<string>('');
  const [quantumMetrics, setQuantumMetrics] = useState<any>(null);
  const [delaySyncData, setDelaySyncData] = useState<any>(null);
  const [genreData, setGenreData] = useState<any>(null);
  const [earTrainingExercises, setEarTrainingExercises] = useState<any[]>([]);
  const [productionChecklist, setProductionChecklist] = useState<any>(null);
  const [instrumentData, setInstrumentData] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('codette_favorites');
    if (saved) {
      try {
        setFavoriteSuggestions(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Failed to load favorites:', e);
      }
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Load initial suggestions
  useEffect(() => {
    if (isConnected && activeTab === 'suggestions') {
      handleLoadSuggestions(selectedContext);
    }
  }, [isConnected, selectedContext]);

  // Load cocoon history when memory tab opens
  useEffect(() => {
    if (activeTab === 'memory' && cocoonHistory.length === 0) {
      loadCocoonHistory();
    }
  }, [activeTab]);

  // Load quantum metrics
  useEffect(() => {
    if (isConnected) {
      loadQuantumMetrics();
    }
  }, [isConnected, activeTab]);

  // Auto-connect WebSocket
  useEffect(() => {
    if (isConnected && !websocketConnected) {
      connectWebSocket();
    }
    return () => {
      if (websocketConnected) {
        disconnectWebSocket();
      }
    };
  }, [isConnected]);

  // Build DAW context from current state
  const buildDAWContext = useCallback(() => {
    return {
      // Selected track info
      selected_track: selectedTrack ? {
        id: selectedTrack.id,
        name: selectedTrack.name,
        type: selectedTrack.type,
        volume: selectedTrack.volume,
        pan: selectedTrack.pan,
        muted: selectedTrack.muted,
        soloed: selectedTrack.soloed,
        armed: selectedTrack.armed,
        inserts: selectedTrack.inserts?.length || 0,
        sends: selectedTrack.sends?.length || 0,
      } : null,
      
      // All tracks summary
      tracks: tracks.map(t => ({
        id: t.id,
        name: t.name,
        type: t.type,
        muted: t.muted,
        soloed: t.soloed,
      })),
      
      // Track counts by type
      track_counts: {
        total: tracks.length,
        audio: tracks.filter(t => t.type === 'audio').length,
        instrument: tracks.filter(t => t.type === 'instrument').length,
        midi: tracks.filter(t => t.type === 'midi').length,
        aux: tracks.filter(t => t.type === 'aux').length,
        vca: tracks.filter(t => t.type === 'vca').length,
        master: tracks.filter(t => t.type === 'master').length,
      },
      
      // Playback state
      is_playing: isPlaying,
      current_time: currentTime,
      
      // Project info (if available)
      bpm: 120, // TODO: Get from project context
      time_signature: '4/4',
    };
  }, [selectedTrack, tracks, isPlaying, currentTime]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue('');
    
    // Pass real DAW context to Codette
    const dawContext = buildDAWContext();
    await sendMessage(message, dawContext);
  };

  const handleLoadSuggestions = async (context: string) => {
    setSelectedContext(context);
    if (context === 'mastering') {
      await getMasteringAdvice();
    } else {
      await getSuggestions(context);
    }
  };

  const handlePersonalityChange = async (personalityId: string) => {
    await setPersonality(personalityId);
    setShowPersonalityMenu(false);
  };

  const handleRotatePersonality = async () => {
    await rotatePersonality();
  };

  const handlePerspectiveToggle = (perspectiveId: string) => {
    const newPerspectives = activePerspectives.includes(perspectiveId)
      ? activePerspectives.filter(p => p !== perspectiveId)
      : [...activePerspectives, perspectiveId];
    
    setActivePerspectivesLocal(newPerspectives);
    setActivePerspectives(newPerspectives);
  };

  const loadCocoonHistory = async () => {
    setLoadingCocoons(true);
    try {
      const history = await getCocoonHistory(20);
      setCocoonHistory(history);
    } catch (err) {
      console.error('Failed to load cocoons:', err);
    } finally {
      setLoadingCocoons(false);
    }
  };

  const handleDreamFromCocoon = async (cocoonId: string) => {
    try {
      const dream = await dreamFromCocoon(cocoonId);
      setDreamText(dream);
    } catch (err) {
      console.error('Failed to dream:', err);
    }
  };

  const loadQuantumMetrics = async () => {
    try {
      const status = await getStatus();
      setQuantumMetrics(status);
    } catch (err) {
      console.error('Failed to load quantum metrics:', err);
    }
  };

  const loadDelaySync = async () => {
    if (currentTime) {
      const bpm = 120; // Default BPM, could get from project
      const data = await getDelaySync(bpm);
      setDelaySyncData(data);
    }
  };

  const loadGenreDetection = async () => {
    if (tracks.length > 0) {
      const data = await detectGenre(tracks);
      setGenreData(data);
    }
  };

  const loadEarTraining = async (type: string, difficulty: string) => {
    const exercises = await getEarTraining(type, difficulty);
    setEarTrainingExercises(exercises);
  };

  const loadProductionChecklist = async (stage: string) => {
    const checklist = await getProductionChecklist(stage);
    setProductionChecklist(checklist);
  };

  const loadInstrumentInfo = async (category?: string, instrument?: string) => {
    const info = await getInstrumentInfo(category, instrument);
    setInstrumentData(info);
  };

  const drawWaveform = (canvas: HTMLCanvasElement, data: Float32Array | number[] | null) => {
    if (!canvas || !data) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    const gradBg = ctx.createLinearGradient(0, 0, 0, height);
    gradBg.addColorStop(0, '#1f2937');
    gradBg.addColorStop(1, '#111827');
    ctx.fillStyle = gradBg;
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    const waveGrad = ctx.createLinearGradient(0, 0, 0, height);
    waveGrad.addColorStop(0, '#8b5cf6');
    waveGrad.addColorStop(0.5, '#3b82f6');
    waveGrad.addColorStop(1, '#8b5cf6');
    
    ctx.strokeStyle = waveGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    const samples = data instanceof Float32Array ? data : new Float32Array(data);
    const step = Math.max(1, Math.floor(samples.length / width));
    
    for (let i = 0; i < width; i++) {
      const sample = samples[i * step] || 0;
      const y = (height / 2) - (sample * height / 2);
      
      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    
    ctx.stroke();
  };

  useEffect(() => {
    if (waveformCanvasRef.current && selectedTrack) {
      const audioData = getAudioBufferData(selectedTrack.id);
      drawWaveform(waveformCanvasRef.current, audioData);
    }
  }, [selectedTrack, analysis]);

  if (!isVisible) return null;

  const currentPersonalityMode = PERSONALITY_MODES.find(p => p.id === currentPersonality) || PERSONALITY_MODES[0];

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white text-xs">
      {/* Header with Personality Selector & WebSocket Status */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 flex items-center justify-between flex-shrink-0 shadow-lg">
        <div className="flex items-center gap-2 min-w-0">
          <Zap className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <h3 className="font-semibold truncate">Codette AI</h3>
          
          {/* Personality Mode Selector */}
          <div className="relative">
            <button
              onClick={() => setShowPersonalityMenu(!showPersonalityMenu)}
              className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 rounded transition text-xs"
              title="Change Personality Mode"
            >
              <span>{currentPersonalityMode.emoji}</span>
              <span className="hidden sm:inline">{currentPersonalityMode.label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {showPersonalityMenu && (
              <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-[200px]">
                {PERSONALITY_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handlePersonalityChange(mode.id)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-700 transition flex items-center gap-2 ${
                      currentPersonality === mode.id ? 'bg-gray-700' : ''
                    }`}
                  >
                    <span>{mode.emoji}</span>
                    <span className="text-xs">{mode.label}</span>
                  </button>
                ))}
                <div className="border-t border-gray-700">
                  <button
                    onClick={handleRotatePersonality}
                    className="w-full text-left px-3 py-2 hover:bg-gray-700 transition flex items-center gap-2 text-xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Rotate Mode
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Connection Status Indicators */}
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`}
              title={isConnected ? 'API Connected' : 'API Disconnected'}
            />
            <div title={websocketConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}>
              {websocketConnected ? (
                <Wifi className="w-3 h-3 text-green-400 animate-pulse" />
              ) : (
                <WifiOff className="w-3 h-3 text-gray-400" />
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-white/20 rounded transition"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition"
              title="Minimize"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {!expanded && (
        <div className="px-3 py-2 text-center text-xs text-gray-400">
          {isConnected ? `✓ ${currentPersonalityMode.emoji} ${currentPersonalityMode.label}` : '✗ Connecting...'}
        </div>
      )}

      {expanded && (
        <>
          {/* Tab Navigation - NOW WITH 7 TABS */}
          <div className="flex border-b border-gray-700 bg-gray-850 flex-shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`flex-shrink-0 px-3 py-2 text-xs font-medium transition flex items-center justify-center gap-1 ${
                activeTab === 'suggestions'
                  ? 'border-b-2 border-blue-400 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Lightbulb className="w-3 h-3" />
              Tips
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex-shrink-0 px-3 py-2 text-xs font-medium transition flex items-center justify-center gap-1 ${
                activeTab === 'analysis'
                  ? 'border-b-2 border-blue-400 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Zap className="w-3 h-3" />
              Analysis
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-shrink-0 px-3 py-2 text-xs font-medium transition flex items-center justify-center gap-1 ${
                activeTab === 'chat'
                  ? 'border-b-2 border-blue-400 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <MessageCircle className="w-3 h-3" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`flex-shrink-0 px-3 py-2 text-xs font-medium transition flex items-center justify-center gap-1 ${
                activeTab === 'actions'
                  ? 'border-b-2 border-blue-400 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Zap className="w-3 h-3" />
              Actions
            </button>
            <button
              onClick={() => setActiveTab('perspectives')}
              className={`flex-shrink-0 px-3 py-2 text-xs font-medium transition flex items-center justify-center gap-1 ${
                activeTab === 'perspectives'
                  ? 'border-b-2 border-purple-400 text-purple-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Brain className="w-3 h-3" />
              Perspectives
            </button>
            <button
              onClick={() => setActiveTab('memory')}
              className={`flex-shrink-0 px-3 py-2 text-xs font-medium transition flex items-center justify-center gap-1 ${
                activeTab === 'memory'
                  ? 'border-b-2 border-purple-400 text-purple-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Clock className="w-3 h-3" />
              Memory
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`flex-shrink-0 px-3 py-2 text-xs font-medium transition flex items-center justify-center gap-1 ${
                activeTab === 'advanced'
                  ? 'border-b-2 border-pink-400 text-pink-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Advanced
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900 bg-opacity-30 border-b border-red-700 px-3 py-2 flex gap-2 text-xs text-red-200">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{error.message}</span>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {['general', 'gain-staging', 'mixing', 'mastering'].map((ctx) => (
                    <button
                      key={ctx}
                      onClick={() => handleLoadSuggestions(ctx)}
                      disabled={isLoading || !isConnected}
                      className={`px-2 py-1 text-xs rounded transition ${
                        selectedContext === ctx
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50`}
                    >
                      {ctx === 'gain-staging' ? 'Gain' : ctx.charAt(0).toUpperCase() + ctx.slice(1)}
                    </button>
                  ))}
                </div>

                {suggestions.length > 0 && (
                  <>
                    <div className="bg-gray-800 border border-gray-700 rounded p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-200">CONFIDENCE FILTER</label>
                        <span className="text-xs font-mono px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold">
                          {confidenceFilter}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={confidenceFilter}
                        onChange={(e) => setConfidenceFilter(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded appearance-none cursor-pointer accent-purple-500"
                      />
                      <button
                        onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                        className={`w-full px-3 py-2 rounded transition font-semibold flex items-center justify-center gap-2 ${
                          showOnlyFavorites
                            ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        ⭐ Favorites ({favoriteSuggestions.size})
                      </button>
                    </div>

                    {suggestions
                      .filter(s => s.confidence * 100 >= confidenceFilter)
                      .filter(s => !showOnlyFavorites || favoriteSuggestions.has(String(s.title)))
                      .map((suggestion, idx) => {
                        const titleText = String(suggestion.title);
                        const descText = String(suggestion.description);
                        const isFavorite = favoriteSuggestions.has(titleText);
                        
                        return (
                          <div key={idx} className="p-2 bg-gray-800 border border-gray-700 rounded hover:border-purple-600 transition">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-medium text-xs text-blue-400 flex-1">{titleText}</h4>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    const newFavorites = new Set(favoriteSuggestions);
                                    if (isFavorite) {
                                      newFavorites.delete(titleText);
                                    } else {
                                      newFavorites.add(titleText);
                                    }
                                    setFavoriteSuggestions(newFavorites);
                                    localStorage.setItem('codette_favorites', JSON.stringify(Array.from(newFavorites)));
                                  }}
                                  className="text-xl transition"
                                >
                                  {isFavorite ? '⭐' : '☆'}
                                </button>
                                <span className="text-xs px-2 py-1 bg-gradient-to-r from-purple-700 to-blue-700 text-white rounded-full font-semibold">
                                  {Math.round(suggestion.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-300">{descText}</p>
                          </div>
                        );
                      })}
                  </>
                )}
              </div>
            )}

            {/* Analysis Tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-3">
                {!selectedTrack ? (
                  <div className="p-2 bg-yellow-900/30 border border-yellow-700 rounded text-center">
                    <p className="text-xs text-yellow-300">Select a track to analyze</p>
                  </div>
                ) : (
                  <>
                    <div className="p-2 bg-gray-800 border border-gray-700 rounded">
                      <div className="text-xs text-gray-400 mb-1">Analyzing:</div>
                      <div className="text-xs font-medium text-blue-400">{selectedTrack.name}</div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded p-3">
                      <label className="text-xs font-bold text-gray-200 mb-2 block">WAVEFORM</label>
                      <canvas
                        ref={waveformCanvasRef}
                        width={280}
                        height={80}
                        className="w-full border border-gray-700 rounded bg-gray-950"
                      />
                    </div>

                    {analysis && (
                      <>
                        <div className="p-2 bg-blue-900/30 border border-blue-700 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium">Score</span>
                            <span className="text-lg font-bold text-blue-400">{analysis.score}/100</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${analysis.score}%` }} />
                          </div>
                        </div>

                        {analysis.findings.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-300 mb-1">Findings</h4>
                            <ul className="space-y-0.5">
                              {analysis.findings.map((finding, idx) => (
                                <li key={idx} className="text-xs text-gray-400">• {String(finding)}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="space-y-2">
                {chatHistory.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 py-6">
                    <div className="text-center">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">Ask Codette about your production</p>
                    </div>
                  </div>
                ) : (
                  chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] px-2 py-1.5 rounded text-xs ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-200 border border-gray-700'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800 border border-gray-700 px-2 py-1.5 rounded flex items-center gap-2">
                      <Loader className="w-3 h-3 animate-spin" />
                      <span className="text-xs text-gray-400">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Actions Tab */}
            {activeTab === 'actions' && (
              <div className="space-y-2">
                <div className="text-xs text-gray-400 mb-3">Execute DAW operations</div>
                <div className="space-y-1.5">
                  <button
                    onClick={() => togglePlay()}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 px-2 rounded transition flex items-center justify-center gap-2"
                  >
                    <span>{isPlaying ? '⏸' : '▶'}</span> {isPlaying ? 'Pause' : 'Play'}
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-700">
                  <h4 className="text-xs font-semibold text-blue-400 mb-1.5">Quick Effects</h4>
                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => {
                        if (selectedTrack) {
                          const eqPlugin: Plugin = {
                            id: `eq-${Date.now()}`,
                            name: 'EQ',
                            type: 'eq',
                            enabled: true,
                            parameters: {},
                          };
                          updateTrack(selectedTrack.id, {
                            inserts: [...(selectedTrack.inserts || []), eqPlugin]
                          });
                        }
                      }}
                      disabled={!selectedTrack}
                      className="w-full text-left px-2 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 rounded text-gray-300"
                    >
                      + Add EQ
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PERSPECTIVES TAB - NEW */}
            {activeTab === 'perspectives' && (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-700 rounded p-3">
                  <h3 className="text-xs font-bold text-purple-300 mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    ACTIVE PERSPECTIVES ({activePerspectives.length}/11)
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Toggle perspectives to shape Codette's analysis style
                  </p>
                </div>

                <div className="space-y-2">
                  {PERSPECTIVES.map((perspective) => {
                    const isActive = activePerspectives.includes(perspective.id);
                    return (
                      <div
                        key={perspective.id}
                        className={`p-3 rounded border transition ${
                          isActive
                            ? 'bg-purple-900/30 border-purple-600'
                            : 'bg-gray-800 border-gray-700'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            id={`perspective-${perspective.id}`}
                            checked={isActive}
                            onChange={() => handlePerspectiveToggle(perspective.id)}
                            className="mt-0.5 w-4 h-4 rounded accent-purple-500 cursor-pointer"
                          />
                          <label htmlFor={`perspective-${perspective.id}`} className="flex-1 cursor-pointer">
                            <div className="text-xs font-semibold text-gray-200">{perspective.label}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{perspective.description}</div>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    const allPerspectives = PERSPECTIVES.map(p => p.id);
                    setActivePerspectivesLocal(allPerspectives);
                    setActivePerspectives(allPerspectives);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-3 rounded transition font-semibold"
                >
                  Enable All Perspectives
                </button>
              </div>
            )}

            {/* MEMORY TAB - NEW */}
            {activeTab === 'memory' && (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-700 rounded p-3">
                  <h3 className="text-xs font-bold text-purple-300 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    MEMORY COCOONS
                  </h3>
                  <p className="text-xs text-gray-400">
                    Browse past interactions and generate creative variations
                  </p>
                </div>

                <button
                  onClick={loadCocoonHistory}
                  disabled={loadingCocoons}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white text-xs py-2 px-3 rounded transition flex items-center justify-center gap-2"
                >
                  {loadingCocoons ? (
                    <>
                      <Loader className="w-3 h-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      Load Memory History
                    </>
                  )}
                </button>

                {cocoonHistory.length > 0 && (
                  <div className="space-y-2">
                    {cocoonHistory.map((cocoon, idx) => (
                      <div key={idx} className="p-3 bg-gray-800 border border-gray-700 rounded hover:border-purple-600 transition">
                        <div className="text-xs font-semibold text-purple-400 mb-1">
                          Cocoon {cocoon.id?.slice(0, 8) || idx}
                        </div>
                        <div className="text-xs text-gray-400 mb-2">
                          {new Date(cocoon.timestamp).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-300 mb-2">
                          {cocoon.content?.slice(0, 100) || 'Memory snapshot'}...
                        </div>
                        <button
                          onClick={() => handleDreamFromCocoon(cocoon.id)}
                          className="text-xs bg-pink-600 hover:bg-pink-700 text-white px-2 py-1 rounded transition"
                        >
                          ✨ Generate Dream
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {dreamText && (
                  <div className="p-3 bg-gradient-to-br from-pink-900/30 to-purple-900/30 border border-pink-700 rounded">
                    <div className="text-xs font-bold text-pink-300 mb-2">✨ DREAM SEQUENCE</div>
                    <div className="text-xs text-gray-300 italic">{dreamText}</div>
                  </div>
                )}

                {/* Quantum State Visualization */}
                {quantumMetrics && (
                  <div className="p-3 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-700 rounded">
                    <div className="text-xs font-bold text-blue-300 mb-3 flex items-center gap-2">
                      <Atom className="w-4 h-4" />
                      QUANTUM STATE
                    </div>
                    <div className="space-y-2">
                      {Object.entries(quantumState).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 capitalize">{key}:</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-700 rounded-full h-1.5">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${(value as number) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono text-blue-400 w-12 text-right">
                              {((value as number) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ADVANCED FEATURES TAB - NEW */}
            {activeTab === 'advanced' && (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-pink-900/30 to-purple-900/30 border border-pink-700 rounded p-3">
                  <h3 className="text-xs font-bold text-pink-300 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    ADVANCED FEATURES
                  </h3>
                  <p className="text-xs text-gray-400">
                    AI-powered production tools and analysis
                  </p>
                </div>

                {/* Genre Detection */}
                <div className="p-3 bg-gray-800 border border-gray-700 rounded">
                  <h4 className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-2">
                    <Music className="w-3 h-3" />
                    Genre Detection
                  </h4>
                  <button
                    onClick={loadGenreDetection}
                    disabled={tracks.length === 0}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white text-xs py-2 px-3 rounded transition"
                  >
                    Detect Project Genre
                  </button>
                  {genreData && (
                    <div className="mt-2 p-2 bg-purple-900/30 border border-purple-700 rounded">
                      <div className="text-xs">
                        <span className="text-gray-400">Genre:</span>
                        <span className="text-purple-300 font-semibold ml-2">{genreData.detected_genre}</span>
                      </div>
                      <div className="text-xs mt-1">
                        <span className="text-gray-400">Confidence:</span>
                        <span className="text-purple-300 font-semibold ml-2">
                          {Math.round(genreData.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Delay Sync Calculator */}
                <div className="p-3 bg-gray-800 border border-gray-700 rounded">
                  <h4 className="text-xs font-semibold text-blue-400 mb-2">⏱️ Delay Sync</h4>
                  <button
                    onClick={loadDelaySync}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition"
                  >
                    Calculate Delay Times
                  </button>
                  {delaySyncData && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(delaySyncData.divisions || {}).slice(0, 5).map(([division, ms]) => (
                        <div key={division} className="flex justify-between text-xs">
                          <span className="text-gray-400">{division}:</span>
                          <span className="text-blue-300 font-mono">{(ms as number).toFixed(2)} ms</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ear Training */}
                <div className="p-3 bg-gray-800 border border-gray-700 rounded">
                  <h4 className="text-xs font-semibold text-green-400 mb-2">🎵 Ear Training</h4>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => loadEarTraining('interval', 'beginner')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 px-2 rounded transition"
                    >
                      Intervals
                    </button>
                    <button
                      onClick={() => loadEarTraining('chord', 'intermediate')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 px-2 rounded transition"
                    >
                      Chords
                    </button>
                  </div>
                  {earTrainingExercises.length > 0 && (
                    <div className="space-y-1">
                      {earTrainingExercises.slice(0, 3).map((ex, idx) => (
                        <div key={idx} className="text-xs p-2 bg-green-900/30 border border-green-700 rounded">
                          <div className="font-semibold text-green-300">{ex.name}</div>
                          <div className="text-gray-400 text-[10px]">{ex.example || ex.quality}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Production Checklist */}
                <div className="p-3 bg-gray-800 border border-gray-700 rounded">
                  <h4 className="text-xs font-semibold text-yellow-400 mb-2">✅ Production Checklist</h4>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => loadProductionChecklist('mixing')}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs py-1.5 px-2 rounded transition"
                    >
                      Mixing
                    </button>
                    <button
                      onClick={() => loadProductionChecklist('mastering')}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs py-1.5 px-2 rounded transition"
                    >
                      Mastering
                    </button>
                  </div>
                  {productionChecklist && (
                    <div className="space-y-2">
                      {Object.entries(productionChecklist).slice(0, 2).map(([section, items]) => (
                        <div key={section} className="text-xs">
                          <div className="font-semibold text-yellow-300 mb-1">{section}</div>
                          <ul className="space-y-0.5">
                            {(items as string[]).slice(0, 3).map((item, idx) => (
                              <li key={idx} className="text-gray-400 text-[10px]">• {item}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Instrument Info */}
                <div className="p-3 bg-gray-800 border border-gray-700 rounded">
                  <h4 className="text-xs font-semibold text-cyan-400 mb-2">🎹 Instrument Info</h4>
                  <button
                    onClick={() => loadInstrumentInfo('vocals', 'lead')}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs py-2 px-3 rounded transition"
                  >
                    Get Vocal Mixing Tips
                  </button>
                  {instrumentData && (
                    <div className="mt-2 p-2 bg-cyan-900/30 border border-cyan-700 rounded text-xs space-y-1">
                      {Object.entries(instrumentData).slice(0, 1).map(([key, value]) => (
                        <div key={key}>
                          <div className="font-semibold text-cyan-300 capitalize">{key}:</div>
                          <div className="text-gray-400 text-[10px]">
                            {typeof value === 'object' && value !== null
                              ? JSON.stringify(value).slice(0, 100)
                              : String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-gray-800 border-t border-gray-700 p-2 space-y-1.5 flex-shrink-0">
            {activeTab === 'chat' ? (
              <form onSubmit={handleSendMessage} className="flex gap-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask Codette..."
                  disabled={isLoading || !isConnected}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim() || !isConnected}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-1.5 rounded transition"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => handleLoadSuggestions(selectedContext)}
                disabled={isLoading || !isConnected}
                className="w-full flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white text-xs py-1.5 px-2 rounded transition"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}

            {!isConnected && (
              <button
                onClick={reconnect}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-xs py-1 px-2 rounded transition"
              >
                Reconnect
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default CodettePanel;
