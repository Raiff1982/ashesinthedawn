import React, { useState, useRef, useEffect } from 'react';
import { useDAW } from '../contexts/DAWContext';
import useCodette from '../hooks/useCodette';

type TabType = 'chat' | 'suggestions' | 'analysis' | 'controls';

export const CodetteMasterPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [inputMessage, setInputMessage] = useState('');
  const [messageBuffer, setMessageBuffer] = useState<string[]>([]);
  
  const { selectedTrack, tracks } = useDAW();
  const {
    chatHistory,
    isLoading,
    error,
    suggestions,
    analysis,
    sendMessage,
    getSuggestions,
    analyzeAudio,
    clearHistory,
  } = useCodette();

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setMessageBuffer([...messageBuffer, inputMessage]);
    setInputMessage('');

    try {
      await sendMessage(inputMessage);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleGetSuggestions = async () => {
    if (!selectedTrack) return;
    try {
      await getSuggestions('general');
    } catch (err) {
      console.error('Failed to get suggestions:', err);
    }
  };

  const handleAnalyzeTrack = async () => {
    if (!selectedTrack) return;
    try {
      // Pass empty audio data for now - in production would pass actual audio
      await analyzeAudio([], 'mixed');
    } catch (err) {
      console.error('Failed to analyze:', err);
    }
  };

  const handleSmartMix = async () => {
    if (!selectedTrack) return;
    try {
      await sendMessage(`Apply smart mixing optimization to track: ${selectedTrack.name}`);
    } catch (err) {
      console.error('Failed to apply smart mix:', err);
    }
  };

  const handleDiagnose = async () => {
    if (!selectedTrack) return;
    try {
      await sendMessage(`Diagnose audio quality issues in track: ${selectedTrack.name}`);
    } catch (err) {
      console.error('Failed to diagnose:', err);
    }
  };

  const handleEnhance = async () => {
    if (!selectedTrack) return;
    try {
      await sendMessage(`Apply AI-driven audio enhancements to track: ${selectedTrack.name}`);
    } catch (err) {
      console.error('Failed to enhance:', err);
    }
  };

  const handleGenreMatch = async () => {
    if (!selectedTrack) return;
    try {
      await sendMessage(`Analyze and match audio characteristics to music genre for track: ${selectedTrack.name}`);
    } catch (err) {
      console.error('Failed to match genre:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <h2 className="text-lg font-bold text-white">🤖 Codette AI</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-4 border-b border-gray-700">
        <TabButton
          active={activeTab === 'chat'}
          onClick={() => setActiveTab('chat')}
          label="Chat"
        />
        <TabButton
          active={activeTab === 'suggestions'}
          onClick={() => setActiveTab('suggestions')}
          label="Suggestions"
        />
        <TabButton
          active={activeTab === 'analysis'}
          onClick={() => setActiveTab('analysis')}
          label="Analysis"
        />
        <TabButton
          active={activeTab === 'controls'}
          onClick={() => setActiveTab('controls')}
          label="Controls"
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <ChatTab
            chatHistory={chatHistory}
            inputMessage={inputMessage}
            isLoading={isLoading}
            error={error}
            onInputChange={setInputMessage}
            onSendMessage={handleSendMessage}
            chatEndRef={chatEndRef}
          />
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <SuggestionsTab
            suggestions={suggestions}
            isLoading={isLoading}
            selectedTrack={selectedTrack}
            onGetSuggestions={handleGetSuggestions}
          />
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <AnalysisTab
            analysis={analysis}
            isLoading={isLoading}
            selectedTrack={selectedTrack}
            onAnalyze={handleAnalyzeTrack}
          />
        )}

        {/* Controls Tab */}
        {activeTab === 'controls' && (
          <ControlsTab
            selectedTrack={selectedTrack}
            onClearChat={clearHistory}
            onSmartMix={handleSmartMix}
            onDiagnose={handleDiagnose}
            onEnhance={handleEnhance}
            onGenreMatch={handleGenreMatch}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-700 bg-gray-800 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <span>
            {selectedTrack ? `Track: ${selectedTrack.name}` : 'Select a track'}
          </span>
          <span>{tracks.length} tracks</span>
        </div>
      </div>
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-sm font-medium rounded-t transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`}
  >
    {label}
  </button>
);

interface ChatTabProps {
  chatHistory: Array<{ role: string; content: string; timestamp?: number }>;
  inputMessage: string;
  isLoading: boolean;
  error: Error | null;
  onInputChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => Promise<void>;
  chatEndRef: React.RefObject<HTMLDivElement>;
}

const ChatTab: React.FC<ChatTabProps> = ({
  chatHistory,
  inputMessage,
  isLoading,
  error,
  onInputChange,
  onSendMessage,
  chatEndRef,
}) => {
  // Helper function to format Codette responses with better readability
  const formatMessage = (content: string, role: string) => {
    if (role !== 'assistant') return content;

    // Detect multi-perspective response format (DAW-focused perspectives)
    const perspectiveMarkers = [
      'mix_engineering',
      'audio_theory',
      'creative_production',
      'technical_troubleshooting',
      'workflow_optimization'
    ];
    
    const hasPerspectives = perspectiveMarkers.some(marker => content.includes(`**${marker}**`));
    
    if (hasPerspectives) {
      // Parse and format multi-perspective response
      const lines = content.split('\n');
      const perspectives: { name: string; content: string; icon: string }[] = [];
      let currentPerspective = '';
      let currentContent: string[] = [];
      
      const perspectiveIcons: { [key: string]: string } = {
        mix_engineering: '🎚️',
        audio_theory: '📊',
        creative_production: '🎵',
        technical_troubleshooting: '🔧',
        workflow_optimization: '⚡'
      };
      
      for (const line of lines) {
        const match = line.match(/\*\*([a-z_]+)\*\*:\s*\[([^\]]+)\]\s*(.*)/);
        if (match) {
          if (currentPerspective) {
            perspectives.push({
              name: currentPerspective,
              content: currentContent.join(' ').trim(),
              icon: perspectiveIcons[currentPerspective] || '✨'
            });
          }
          currentPerspective = match[1];
          currentContent = [match[3]];
        } else if (currentPerspective && line.trim()) {
          currentContent.push(line);
        }
      }
      
      // Add last perspective
      if (currentPerspective) {
        perspectives.push({
          name: currentPerspective,
          content: currentContent.join(' ').trim(),
          icon: perspectiveIcons[currentPerspective] || '✨'
        });
      }
      
      return (
        <div className="space-y-3 w-full">
          {perspectives.map((perspective, idx) => (
            <div key={idx} className="border-l-2 border-purple-500 pl-3 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{perspective.icon}</span>
                <span className="font-semibold text-purple-300 text-xs uppercase">
                  {perspective.name.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">
                {perspective.content}
              </p>
            </div>
          ))}
        </div>
      );
    }

    // Split by paragraph for better readability
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    
    if (paragraphs.length > 1) {
      return (
        <div className="space-y-2">
          {paragraphs.map((para, idx) => (
            <p key={idx} className="text-sm">
              {para}
            </p>
          ))}
        </div>
      );
    }

    return content;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Start a conversation with Codette</p>
            <p className="text-xs mt-2">Ask about mixing, production, or music theory</p>
          </div>
        ) : (
          chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`px-3 py-2 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white max-w-xs'
                    : 'bg-gray-700 text-gray-200 max-w-2xl'
                }`}
              >
                {formatMessage(msg.content, msg.role)}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-200 px-3 py-2 rounded-lg text-sm">
              <span className="animate-pulse">Codette is thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {error && (
        <div className="bg-red-900 text-red-200 px-3 py-2 rounded text-xs mb-2">
          {error.message}
        </div>
      )}

      <form onSubmit={onSendMessage} className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Ask Codette..."
          className="flex-1 bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};

interface SuggestionsTabProps {
  suggestions: Array<{
    id?: string;
    title: string;
    description: string;
    priority?: string;
    [key: string]: any;
  }>;
  isLoading: boolean;
  selectedTrack: any;
  onGetSuggestions: () => Promise<void>;
}

const SuggestionsTab: React.FC<SuggestionsTabProps> = ({
  suggestions,
  isLoading,
  selectedTrack,
  onGetSuggestions,
}) => (
  <div className="space-y-4">
    {suggestions.length === 0 ? (
      <div className="text-center py-8 text-gray-500">
        <p>No suggestions yet</p>
        <button
          onClick={onGetSuggestions}
          disabled={!selectedTrack || isLoading}
          className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          {isLoading ? 'Analyzing...' : 'Get Suggestions'}
        </button>
      </div>
    ) : (
      <>
        <div className="space-y-2">
          {suggestions.map((suggestion, idx) => (
            <div
              key={suggestion.id || `suggestion-${idx}`}
              className="bg-gray-800 border border-gray-700 rounded p-3 space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-blue-400">{suggestion.title}</span>
                {suggestion.priority && (
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      suggestion.priority === 'high'
                        ? 'bg-red-900 text-red-200'
                        : suggestion.priority === 'medium'
                        ? 'bg-yellow-900 text-yellow-200'
                        : 'bg-green-900 text-green-200'
                    }`}
                  >
                    {suggestion.priority}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">{suggestion.description}</p>
            </div>
          ))}
        </div>
        <button
          onClick={onGetSuggestions}
          disabled={!selectedTrack || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          {isLoading ? 'Refreshing...' : 'Refresh Suggestions'}
        </button>
      </>
    )}
  </div>
);

interface AnalysisTabProps {
  analysis: any;
  isLoading: boolean;
  selectedTrack: any;
  onAnalyze: () => Promise<void>;
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({
  analysis,
  isLoading,
  selectedTrack,
  onAnalyze,
}) => (
  <div className="space-y-4">
    {analysis ? (
      <div className="space-y-3">
        <div className="bg-gray-800 border border-gray-700 rounded p-3 space-y-2">
          <h3 className="font-bold text-blue-400">Analysis Results</h3>
          <div className="text-xs space-y-1 text-gray-300">
            <p>
              <span className="text-gray-400">Type:</span> {analysis.analysisType}
            </p>
            <p>
              <span className="text-gray-400">Score:</span> {(analysis.score * 100).toFixed(1)}%
            </p>
            {analysis.findings && analysis.findings.length > 0 && (
              <div>
                <p className="text-gray-400 mb-1">Findings:</p>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.findings.map((finding: string, idx: number) => (
                    <li key={idx}>{finding}</li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div>
                <p className="text-gray-400 mb-1">Recommendations:</p>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.recommendations.map((rec: string, idx: number) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500">
        <p>No analysis available</p>
        <button
          onClick={onAnalyze}
          disabled={!selectedTrack || isLoading}
          className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Track'}
        </button>
      </div>
    )}
  </div>
);

interface ControlsTabProps {
  selectedTrack: any;
  onClearChat: () => void;
  onSmartMix?: () => Promise<void>;
  onDiagnose?: () => Promise<void>;
  onEnhance?: () => Promise<void>;
  onGenreMatch?: () => Promise<void>;
  isLoading?: boolean;
}

const ControlsTab: React.FC<ControlsTabProps> = ({ 
  selectedTrack, 
  onClearChat, 
  onSmartMix, 
  onDiagnose, 
  onEnhance, 
  onGenreMatch,
  isLoading = false
}) => (
  <div className="space-y-4">
    <div className="bg-gray-800 border border-gray-700 rounded p-4 space-y-3">
      <h3 className="font-bold text-blue-400">Codette Controls</h3>
      
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Quick Actions:</label>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onSmartMix}
            disabled={isLoading || !selectedTrack}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white px-3 py-2 rounded text-xs font-medium transition-colors disabled:cursor-not-allowed"
            title={!selectedTrack ? "Select a track first" : "Automatically optimize mix for this track"}
          >
            🎯 Smart Mix
          </button>
          <button 
            onClick={onDiagnose}
            disabled={isLoading || !selectedTrack}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white px-3 py-2 rounded text-xs font-medium transition-colors disabled:cursor-not-allowed"
            title={!selectedTrack ? "Select a track first" : "Analyze audio quality and detect issues"}
          >
            🔍 Diagnose
          </button>
          <button 
            onClick={onEnhance}
            disabled={isLoading || !selectedTrack}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white px-3 py-2 rounded text-xs font-medium transition-colors disabled:cursor-not-allowed"
            title={!selectedTrack ? "Select a track first" : "Apply AI-driven enhancements"}
          >
            ✨ Enhance
          </button>
          <button 
            onClick={onGenreMatch}
            disabled={isLoading || !selectedTrack}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white px-3 py-2 rounded text-xs font-medium transition-colors disabled:cursor-not-allowed"
            title={!selectedTrack ? "Select a track first" : "Match audio characteristics to genre"}
          >
            🎵 Genre Match
          </button>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-3">
        <label className="text-xs text-gray-400 block mb-2">Settings:</label>
        <div className="space-y-2 text-xs">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded" />
            <span>Auto-analyze on track change</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded" />
            <span>Real-time suggestions</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>Experimental features</span>
          </label>
        </div>
      </div>

      <button
        onClick={onClearChat}
        className="w-full bg-red-900 hover:bg-red-800 text-red-200 px-3 py-2 rounded text-xs font-medium transition-colors"
      >
        Clear Chat History
      </button>
    </div>

    {!selectedTrack && (
      <div className="bg-yellow-900 text-yellow-200 px-3 py-2 rounded text-xs">
        💡 Tip: Select a track to get track-specific suggestions
      </div>
    )}
  </div>
);

export default CodetteMasterPanel;
