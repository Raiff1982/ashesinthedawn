import { useState, useEffect } from 'react';
import { Sparkles, Brain, BarChart3, Radio, Loader, TrendingUp } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';
import { getAIService } from '../lib/aiService';
import { getCodetteService } from '../lib/codetteIntegration';

interface AISuggestion {
  type: 'gain' | 'mixing' | 'health' | 'routing' | 'codette';
  suggestion: string;
  confidence: number;
  actionable: boolean;
}

export default function AIPanel() {
  const { tracks, selectedTrack, isPlaying } = useDAW();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'health' | 'mixing' | 'routing' | 'codette'>('health');

  useEffect(() => {
    const aiService = getAIService();
    const codetteService = getCodetteService();
    setAiEnabled(aiService.isAvailable() && codetteService.isAvailable());
  }, []);

  const analyzeSessionWithCodette = async () => {
    if (!aiEnabled) return;
    
    setLoading(true);
    try {
      const codetteService = getCodetteService();
      
      // Build session context from DAW state
      const trackMetrics = tracks.map(t => ({
        trackId: t.id,
        name: t.name,
        type: t.type,
        level: t.volume || -60,
        peak: (t.volume || -60) + 3,
        plugins: (t.inserts || []).map(p => p.id || p.name || 'Unknown'),
      }));

      const hasClipping = tracks.some(t => (t.volume || -60) > -1);
      const masterLevel = Math.max(...tracks.map(t => t.volume || -60), -60);
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

      const response = await codetteService.analyzeSession(context);

      setSuggestions([{
        type: 'codette',
        suggestion: response.analysis.recommendation,
        confidence: response.analysis.confidence,
        actionable: response.analysis.actionItems.length > 0,
      }]);
    } catch (error) {
      console.error('Codette analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const suggestMixingChain = async () => {
    if (!aiEnabled || !selectedTrack) return;
    
    setLoading(true);
    try {
      const codetteService = getCodetteService();
      const trackMetrics = [{
        trackId: selectedTrack.id,
        level: selectedTrack.volume || -60,
        peak: (selectedTrack.volume || -60) + 3,
      }];
      
      const analysis = await codetteService.getMixingIntelligence(selectedTrack.type, trackMetrics);
      
      setSuggestions([{
        type: 'mixing',
        suggestion: analysis.recommendation,
        confidence: analysis.confidence,
        actionable: true,
      }]);
    } catch (error) {
      console.error('Mixing suggestion error:', error);
    } finally {
      setLoading(false);
    }
  };

  const suggestRouting = async () => {
    if (!aiEnabled) return;
    
    setLoading(true);
    try {
      const codetteService = getCodetteService();
      
      const trackMetrics = tracks.map(t => ({
        trackId: t.id,
        name: t.name,
        type: t.type,
        level: t.volume || -60,
        peak: (t.volume || -60) + 3,
        plugins: (t.inserts || []).map(p => p.id || p.name || 'Unknown'),
      }));

      const context = {
        trackCount: tracks.length,
        totalDuration: 0,
        sampleRate: 48000,
        trackMetrics,
        masterLevel: Math.max(...tracks.map(t => t.volume || -60), -60),
        masterPeak: Math.max(...tracks.map(t => t.volume || -60), -60) + 3,
        hasClipping: tracks.some(t => (t.volume || -60) > -1),
      };

      const analysis = await codetteService.getRoutingIntelligence(context);
      
      setSuggestions([{
        type: 'routing',
        suggestion: analysis.recommendation,
        confidence: analysis.confidence,
        actionable: true,
      }]);
    } catch (error) {
      console.error('Routing suggestion error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!aiEnabled) {
    return (
      <div className="p-3 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-yellow-500">
          <Brain size={14} />
          <span>Codette AI not initialized</span>
        </div>
        <p className="text-gray-400">Set REACT_APP_AI_ENABLED=true in .env.local</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 border-t border-gray-700">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-purple-400" />
          <h3 className="font-semibold text-gray-100">🤖 Codette AI</h3>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 text-xs mb-2 flex-wrap">
          <button
            onClick={() => setActiveTab('health')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'health'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <BarChart3 size={12} className="inline mr-1" />
            Health
          </button>
          <button
            onClick={() => setActiveTab('mixing')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'mixing'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            disabled={!selectedTrack}
          >
            <Sparkles size={12} className="inline mr-1" />
            Mixing
          </button>
          <button
            onClick={() => setActiveTab('routing')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'routing'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Radio size={12} className="inline mr-1" />
            Routing
          </button>
          <button
            onClick={() => setActiveTab('codette')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'codette'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Brain size={12} className="inline mr-1" />
            Full
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'health' && (
          <button
            onClick={async () => {
              setLoading(true);
              try {
                const aiService = getAIService();
                const hasClipping = tracks.some(t => (t.volume || -60) > 0);
                const peakLevel = Math.max(...tracks.map(t => t.volume || -60), -60);
                const avgLevel = tracks.reduce((sum, t) => sum + (t.volume || -60), 0) / Math.max(tracks.length, 1);
                
                const health = await aiService.analyzeSessionHealth(
                  tracks.length,
                  peakLevel,
                  avgLevel,
                  hasClipping
                );

                setSuggestions([{
                  type: 'health',
                  suggestion: health.recommendations[0] || 'Session is healthy',
                  confidence: 0.95,
                  actionable: health.clipping,
                }]);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={14} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 size={14} />
                Analyze Health
              </>
            )}
          </button>
        )}

        {activeTab === 'mixing' && (
          <>
            <button
              onClick={suggestMixingChain}
              disabled={loading || !selectedTrack}
              className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Mixing Chain
                </>
              )}
            </button>
            {!selectedTrack && (
              <p className="text-xs text-gray-400 text-center">Select a track first</p>
            )}
          </>
        )}

        {activeTab === 'routing' && (
          <button
            onClick={suggestRouting}
            disabled={loading}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={14} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Radio size={14} />
                Suggest Routing
              </>
            )}
          </button>
        )}

        {activeTab === 'codette' && (
          <button
            onClick={analyzeSessionWithCodette}
            disabled={loading}
            className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={14} className="animate-spin" />
                Codette Analyzing...
              </>
            ) : (
              <>
                <Brain size={14} />
                Full Analysis
              </>
            )}
          </button>
        )}

        {/* Results */}
        {suggestions.length > 0 && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-purple-700">
            <div className="flex items-start gap-2">
              <Sparkles size={16} className="text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-300 mb-1">
                  {suggestions[0].type.toUpperCase()}
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {suggestions[0].suggestion}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
                  <span className="text-xs text-gray-500">
                    Confidence: {Math.round(suggestions[0].confidence * 100)}%
                  </span>
                  {suggestions[0].actionable && (
                    <span className="text-xs px-2 py-1 bg-purple-600/20 text-purple-400 rounded">
                      Actionable
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="p-2 bg-gray-800 rounded text-xs space-y-1 border border-gray-700">
          <p className="text-gray-400 flex items-center gap-2">
            <TrendingUp size={12} className="text-purple-400" />
            <span className="text-gray-500">Tracks:</span> {tracks.length}
          </p>
          <p className="text-gray-400">
            <span className="text-gray-500">Selected:</span> {selectedTrack?.name || 'None'}
          </p>
          <p className="text-gray-400">
            <span className="text-gray-500">Status:</span>{' '}
            <span className={isPlaying ? 'text-green-400' : 'text-gray-500'}>
              {isPlaying ? 'Playing' : 'Stopped'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
