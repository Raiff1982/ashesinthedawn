/**
 * Codette Integration Examples
 * Real-world usage patterns for all Codette functions
 * 
 * Status: ? Production Ready
 * Version: 1.0
 */

import { useCodette } from '@/hooks/useCodette';
import { useDAW } from '@/contexts/DAWContext';
import { getCodetteBridge } from '@/lib/codetteBridge';
import React from 'react';

// ============================================================================
// EXAMPLE 1: Basic Message Query
// ============================================================================

export async function example1_BasicMessageQuery() {
  const bridge = getCodetteBridge();
  
  // Send message and get response from all 11 perspectives
  const response = await bridge.chat(
    'How can I improve the clarity of this vocal?',
    'conversation-1'
  );
  
  console.log('Response:', response);
  // Output: { response: "...", confidence: 0.85, source: "codette_engine" }
}

// ============================================================================
// EXAMPLE 2: Query Specific Perspective
// ============================================================================

export async function example2_SpecificPerspective() {
  const bridge = getCodetteBridge();
  
  // Query a single perspective for technical analysis
  const neuralResponse = await bridge.chat(
    'What EQ settings would work best for this track?',
    'conversation-1',
    'neural_network'
  );
  
  console.log('Neural Network Analysis:', neuralResponse);
}

// ============================================================================
// EXAMPLE 3: Get Mixing Suggestions
// ============================================================================

export async function example3_MixingSuggestions() {
  const bridge = getCodetteBridge();
  
  // Get mixing suggestions for current project context
  const suggestions = await bridge.getSuggestions({
    type: 'mixing',
    track_type: 'vocals',
    mood: 'energetic',
    genre: 'electronic',
    bpm: 120
  });
  
  console.log('Mixing Suggestions:');
  suggestions.suggestions.forEach((s: any) => {
    console.log(`- ${s.title}: ${s.description} (${s.confidence}% confidence)`);
  });
}

// ============================================================================
// EXAMPLE 4: Analyze Audio Track
// ============================================================================

export async function example4_AnalyzeAudio() {
  const bridge = getCodetteBridge();
  
  // Analyze audio buffer from current track
  const analysis = await bridge.analyzeAudio(
    {
      duration: 10,
      sample_rate: 44100,
      peak_level: -3,
      rms_level: -12
    },
    'spectrum'
  );
  
  console.log('Audio Analysis:');
  console.log(`Quality Score: ${(analysis as any).results?.quality_score}`);
  console.log('Recommendations:', (analysis as any).recommendations);
}

// ============================================================================
// EXAMPLE 5: React Hook - All Functions in Component
// ============================================================================

// Note: This is pseudo-code - actual React component shown in comments
/**
export function Example5ReactComponent() {
  const {
    isConnected,
    isLoading,
    chatHistory,
    suggestions,
    analysis,
    sendMessage,
    getSuggestions,
    analyzeAudio,
    queryAllPerspectives,
  } = useCodette({ autoConnect: true });

  const { selectedTrack, isPlaying } = useDAW();

  // Get suggestions when playing track
  React.useEffect(() => {
    if (isConnected && isPlaying && selectedTrack) {
      getSuggestions(`track_${selectedTrack.id}`);
    }
  }, [isPlaying, selectedTrack?.id, isConnected]);

  return (
    <div>
      <h3>Codette Suggestions - {suggestions.length} found</h3>
      {isLoading && <p>Loading...</p>}
      {suggestions.map((s: any) => (
        <div key={s.id}>
          <strong>{s.title}</strong>
          <p>{s.description}</p>
          <span>Confidence: {Math.round(s.confidence * 100)}%</span>
        </div>
      ))}
    </div>
  );
}
*/

export function Example5ReactComponent() {
  // Simplified non-JSX version for build compatibility
  const {
    isConnected,
    isLoading,
    suggestions,
  } = useCodette({ autoConnect: true });

  return {
    render: () => `Codette Suggestions: ${suggestions.length}`,
    isConnected,
    isLoading
  };
}

// ============================================================================
// EXAMPLE 6: DAW Integration - Sync State to Codette
// ============================================================================

export async function example6_SyncDAWState() {
  // In actual component, use hooks:
  // const daw = useDAW();
  // const bridge = getCodetteBridge();
  
  const bridge = getCodetteBridge();

  // Sync current DAW state to Codette
  const synced = await bridge.syncState(
    [],  // tracks
    0,   // currentTime
    false,  // isPlaying
    120  // BPM
  );

  console.log('DAW Synced:', synced);
}

// ============================================================================
// EXAMPLE 7: Transport Control via Codette
// ============================================================================

export async function example7_TransportControl() {
  const bridge = getCodetteBridge();

  // Play transport via Codette command
  await bridge.transportPlay();

  // Seek to specific time
  await bridge.transportSeek(30);

  // Set tempo
  await bridge.setTempo(140);

  // Enable loop
  await bridge.setLoop(true, 0, 60);
}

// ============================================================================
// EXAMPLE 8: Memory Cocoons - Persistent Learning
// ============================================================================

export async function example8_MemoryCocoons() {
  const bridge = getCodetteBridge();

  // Get interaction history (memory cocoons)
  const response = await bridge.chat(
    'Help me improve this mix',
    'conversation-1'
  );

  console.log('Response:', response);

  // Later: retrieve specific cocoon from history
  // const cocoonId = 'cocoon_1702486800000';
  // const cocoon = await bridge.getCocoon(cocoonId);
  // const dream = await bridge.dreamFromCocoon(cocoonId);
}

// ============================================================================
// EXAMPLE 9: Real-Time Event Listening
// ============================================================================

export async function example9_EventListening() {
  const bridge = getCodetteBridge();

  // Listen for real-time suggestions
  bridge.on('suggestion_received', (suggestions) => {
    console.log('New suggestions arrived:', suggestions);
  });

  // Listen for analysis complete
  bridge.on('analysis_complete', (analysis) => {
    console.log('Analysis done:', analysis);
  });

  // Listen for transport state changes
  bridge.on('transport_changed', (state) => {
    console.log('Transport state:', state);
  });

  // Listen for connection events
  bridge.on('connected', () => {
    console.log('Codette connected!');
  });

  bridge.on('disconnected', () => {
    console.log('Codette disconnected');
  });

  // Listen for reconnection
  bridge.on('reconnected', (data: any) => {
    console.log('Codette reconnected after attempts:', data.attempts);
  });
}

// ============================================================================
// EXAMPLE 10: Error Handling & Fallbacks
// ============================================================================

export async function example10_ErrorHandling() {
  const bridge = getCodetteBridge();

  try {
    // This will automatically fallback if API is down
    const suggestions = await bridge.getSuggestions({ type: 'mixing' });
    console.log('Got suggestions (API or fallback):', suggestions);
  } catch (error) {
    // Should NOT throw - fallback prevents errors
    console.error('Unexpected error:', error);
  }

  // Check connection status
  const status = bridge.getConnectionStatus();
  console.log('Connected:', status.connected);
  console.log('Reconnect attempts:', status.reconnectAttempts);

  // Manually reconnect if needed
  const reconnected = await bridge.forceReconnect();
  console.log('Reconnection successful:', reconnected);
}

// ============================================================================
// EXAMPLE 11: Full Workflow - User Asks for Help
// ============================================================================

export async function example11_FullWorkflow() {
  const bridge = getCodetteBridge();

  const userQuestion = 'My vocals sound muffled. How can I fix this?';

  // 1. Sync DAW state
  await bridge.syncState([], 0, false, 120);

  // 2. Analyze current track
  const analysis = await bridge.analyzeAudio(
    {
      duration: 10,
      sample_rate: 44100
    },
    'spectrum'
  );
  console.log('Current track analysis:', analysis);

  // 3. Get suggestions based on analysis
  const suggestions = await bridge.getSuggestions({
    type: 'mixing',
    track_type: 'vocals',
    genre: 'pop',
    bpm: 120
  });
  console.log('Mixing suggestions:', suggestions);

  // 4. Get multi-perspective analysis
  const responses = {
    newtonian: await bridge.chat(userQuestion, 'conv-1', 'newtonian_logic'),
    creative: await bridge.chat(userQuestion, 'conv-1', 'davinci_synthesis'),
    technical: await bridge.chat(userQuestion, 'conv-1', 'mathematical_rigor')
  };
  console.log('Multi-perspective analysis:', responses);
}

// ============================================================================
// EXAMPLE 12: Auto-Suggestion Loop (Component Pattern)
// ============================================================================

/**
export function Example12AutoSuggestions() {
  const { getSuggestions, suggestions } = useCodette();
  const { selectedTrack, isPlaying } = useDAW();

  // Auto-refresh suggestions every 30 seconds when playing
  React.useEffect(() => {
    if (!isPlaying || !selectedTrack) return;

    const interval = setInterval(() => {
      getSuggestions(`track_${selectedTrack.id}`);
    }, 30000);

    return () => clearInterval(interval);
  }, [isPlaying, selectedTrack?.id]);

  return renderSuggestions(suggestions);
}
*/

// ============================================================================
// EXAMPLE 13: Status Monitoring (Component Pattern)
// ============================================================================

/**
export function Example13StatusMonitoring() {
  const bridge = getCodetteBridge();
  const [status, setStatus] = React.useState(bridge.getConnectionStatus());

  React.useEffect(() => {
    const interval = setInterval(() => {
      const newStatus = bridge.getConnectionStatus();
      setStatus(newStatus);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return renderStatus(status);
}
*/

// ============================================================================
// USAGE IN COMPONENT
// ============================================================================

/**
 * QUICK INTEGRATION:
 * 
 * 1. Import the hook:
 *    import { useCodette } from '@/hooks/useCodette';
 * 
 * 2. Use in component:
 *    const { sendMessage, suggestions, analysis } = useCodette();
 * 
 * 3. Call functions:
 *    await sendMessage('How can I improve this mix?');
 *    await getSuggestions('mixing');
 *    await analyzeTrack(trackId);
 * 
 * 4. Monitor state:
 *    if (isConnected) { ... }
 *    if (isLoading) { ... }
 *    suggestions.map(s => ...)
 */

export const examples = {
  example1_BasicMessageQuery,
  example2_SpecificPerspective,
  example3_MixingSuggestions,
  example4_AnalyzeAudio,
  example5: Example5ReactComponent,
  example6_SyncDAWState,
  example7_TransportControl,
  example8_MemoryCocoons,
  example9_EventListening,
  example10_ErrorHandling,
  example11_FullWorkflow,
};

export default examples;
