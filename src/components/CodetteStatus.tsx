import { useEffect, useState } from 'react';
import { useDAW } from '../contexts/DAWContext';
import { Zap, BarChart3, Cpu, Database, Users } from 'lucide-react';

interface CodetteConnectionStatus {
  connected: boolean;
  status: string;
  codette_available?: boolean;
  engine_type?: string;
  memory_size?: number;
  active_connections?: number;
  quantum_state?: {
    coherence: number;
    entanglement: number;
    resonance: number;
    phase: number;
    fluctuation: number;
  };
  perspectives?: string[];
  error?: string;
}

export function CodetteStatus() {
  const { selectedTrack, isPlaying, tracks } = useDAW();
  const [status, setStatus] = useState<CodetteConnectionStatus>({
    connected: false,
    status: 'checking...',
  });
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const apiUrl = import.meta.env.VITE_CODETTE_API || 'http://localhost:8000';
        
        // First try the detailed /codette/status endpoint
        const response = await fetch(`${apiUrl}/codette/status`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          const data = await response.json();
          setStatus({
            connected: true,
            status: data.status || 'active',
            codette_available: data.codette_available,
            engine_type: data.engine_type,
            memory_size: data.memory_size,
            active_connections: data.active_connections,
            quantum_state: data.quantum_state,
            perspectives: data.perspectives || [],
          });
        } else {
          // Fallback to /health endpoint
          const healthResponse = await fetch(`${apiUrl}/health`);
          if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            setStatus({
              connected: true,
              status: healthData.status || 'healthy',
              codette_available: healthData.codette_available,
            });
          } else {
            setStatus({
              connected: false,
              status: 'offline',
              error: `HTTP ${response.status}`,
            });
          }
        }
      } catch {
        setStatus({
          connected: false,
          status: 'offline',
          error: 'Connection refused',
        });
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Count active effects
  const activeEffects = selectedTrack 
    ? (selectedTrack.inserts?.filter(p => typeof p !== 'string' && p.enabled).length || 0)
    : 0;

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 border border-gray-700 rounded hover:border-purple-600 transition-colors cursor-help">
        <div className={`w-2 h-2 rounded-full ${status.connected ? 'bg-green-500' : 'bg-red-500'} ${status.connected ? 'animate-pulse' : ''}`}></div>
        <span className="text-xs font-medium text-gray-300">
          Codette{' '}
          <span className={status.connected ? 'text-green-400' : 'text-red-400'}>
            {status.connected ? 'Online' : 'Offline'}
          </span>
        </span>
        
        {/* Real-time indicators */}
        <div className="flex items-center gap-1 ml-2 text-xs text-gray-500">
          {isPlaying && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span>Playing</span>
            </div>
          )}
          {activeEffects > 0 && (
            <div className="flex items-center gap-1 text-purple-400">
              <Zap className="w-3 h-3" />
              <span>{activeEffects} FX</span>
            </div>
          )}
          {tracks.length > 0 && (
            <div className="flex items-center gap-1 text-blue-400">
              <BarChart3 className="w-3 h-3" />
              <span>{tracks.length} Trk</span>
            </div>
          )}
          {status.active_connections !== undefined && status.active_connections > 0 && (
            <div className="flex items-center gap-1 text-green-400">
              <Users className="w-3 h-3" />
              <span>{status.active_connections}</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 bg-gray-950 border border-purple-600 rounded-lg shadow-lg p-3 w-72 text-xs space-y-2 z-50">
          <div className="border-b border-purple-700/30 pb-2">
            <div className="font-semibold text-purple-400 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Codette AI Server Stats
            </div>
          </div>
          
          <div className="space-y-1 text-gray-300">
            <div className="flex justify-between">
              <span>Connection:</span>
              <span className={status.connected ? 'text-green-400' : 'text-red-400'}>
                {status.connected ? '? Online' : '? Offline'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-gray-400">{status.status}</span>
            </div>
            {status.codette_available !== undefined && (
              <div className="flex justify-between">
                <span>AI Engine:</span>
                <span className={status.codette_available ? 'text-green-400' : 'text-red-400'}>
                  {status.codette_available ? 'Active' : 'Unavailable'}
                </span>
              </div>
            )}
            {status.engine_type && (
              <div className="flex justify-between">
                <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> Engine:</span>
                <span className="text-purple-400">{status.engine_type}</span>
              </div>
            )}
            {status.memory_size !== undefined && (
              <div className="flex justify-between">
                <span className="flex items-center gap-1"><Database className="w-3 h-3" /> Memory:</span>
                <span className="text-blue-400">{status.memory_size} items</span>
              </div>
            )}
            {status.active_connections !== undefined && (
              <div className="flex justify-between">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Connections:</span>
                <span className="text-green-400">{status.active_connections} active</span>
              </div>
            )}
          </div>

          {/* Quantum State */}
          {status.quantum_state && (
            <>
              <div className="border-b border-purple-700/30 pb-2 pt-1">
                <div className="font-semibold text-purple-400">Quantum State</div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-gray-300">
                <div className="flex justify-between">
                  <span>Coherence:</span>
                  <span className="text-cyan-400">{(status.quantum_state.coherence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Entangle:</span>
                  <span className="text-pink-400">{(status.quantum_state.entanglement * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Resonance:</span>
                  <span className="text-yellow-400">{(status.quantum_state.resonance * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Fluctuation:</span>
                  <span className="text-orange-400">{(status.quantum_state.fluctuation * 100).toFixed(0)}%</span>
                </div>
              </div>
            </>
          )}

          <div className="border-b border-purple-700/30 pb-2 pt-1">
            <div className="font-semibold text-blue-400">DAW State</div>
          </div>

          <div className="space-y-1 text-gray-300">
            <div className="flex justify-between">
              <span>Tracks:</span>
              <span>{tracks.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Selected:</span>
              <span className="text-gray-400 truncate max-w-[120px]">{selectedTrack?.name || 'None'}</span>
            </div>
            {selectedTrack && (
              <>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="text-gray-400">{selectedTrack.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Effects:</span>
                  <span className="text-purple-400">{selectedTrack.inserts?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Volume:</span>
                  <span className="text-gray-400">{selectedTrack.volume.toFixed(1)}dB</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span>Transport:</span>
              <span className={isPlaying ? 'text-green-400' : 'text-gray-400'}>
                {isPlaying ? '? Playing' : '? Stopped'}
              </span>
            </div>
          </div>

          {status.perspectives && status.perspectives.length > 0 && (
            <>
              <div className="border-b border-purple-700/30 pb-2">
                <div className="font-semibold text-purple-400">Available Perspectives</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {status.perspectives.map((perspective, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 bg-purple-900/30 border border-purple-600/50 rounded text-purple-300 text-xs"
                  >
                    {perspective}
                  </span>
                ))}
              </div>
            </>
          )}

          {status.error && (
            <div className="text-red-400 text-xs bg-red-900/20 p-2 rounded">
              ?? {status.error}
            </div>
          )}

          <div className="border-t border-purple-700/30 pt-2 text-gray-500 text-xs">
            ?? Hover for live server stats • Updates every 10s
          </div>
        </div>
      )}
    </div>
  );
}

export default CodetteStatus;
