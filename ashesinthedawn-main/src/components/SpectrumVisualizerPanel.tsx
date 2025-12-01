import { useState, useEffect, useRef } from 'react';
import { Gauge, AlertCircle, Zap } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';

export default function SpectrumVisualizerPanel() {
  const { cpuUsage, buses, getAudioLevels, isPlaying } = useDAW();
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
  const [frequencyBands, setFrequencyBands] = useState({
    bass: 0,
    mids: 0,
    treble: 0,
  });
  const animationFrameRef = useRef<number | null>(null);

  // Real-time frequency data visualization
  useEffect(() => {
    const updateFrequencyData = () => {
      if (isPlaying) {
        const levels = getAudioLevels();
        if (levels) {
          setFrequencyData(levels);
          
          // Calculate frequency bands
          // Bass: 20-250 Hz (bins 0-6)
          // Mids: 250 Hz-2 kHz (bins 6-51)
          // Treble: 2-20 kHz (bins 51-255)
          const bass = Array.from(levels.slice(0, 6)).reduce((a, b) => a + b, 0) / 6;
          const mids = Array.from(levels.slice(6, 51)).reduce((a, b) => a + b, 0) / 45;
          const treble = Array.from(levels.slice(51, 255)).reduce((a, b) => a + b, 0) / 204;
          
          setFrequencyBands({
            bass: Math.min(100, (bass / 255) * 100),
            mids: Math.min(100, (mids / 255) * 100),
            treble: Math.min(100, (treble / 255) * 100),
          });
        }
      }
      animationFrameRef.current = requestAnimationFrame(updateFrequencyData);
    };

    animationFrameRef.current = requestAnimationFrame(updateFrequencyData);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, getAudioLevels]);

  // Process frequency data for visualization (32 bands)
  const frequencybars = frequencyData
    ? Array.from({ length: 32 }, (_, i) => {
        const binSize = Math.floor(frequencyData.length / 32);
        const start = i * binSize;
        const end = Math.min((i + 1) * binSize, frequencyData.length);
        const avgLevel = Array.from(frequencyData.slice(start, end)).reduce((a, b) => a + b, 0) / (end - start);
        return (avgLevel / 255) * 100;
      })
    : Array.from({ length: 32 }, () => 0);

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Gauge className="w-4 h-4 text-cyan-500" />
          <h2 className="text-sm font-semibold text-gray-100">Spectrum & Analysis</h2>
        </div>
        <p className="text-xs text-gray-500">Real-time frequency analysis</p>
      </div>

      {/* Spectrum Visualizer */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Frequency Display */}
        <div className="bg-gray-800 rounded p-3 mb-4">
          <p className="text-xs font-semibold text-gray-400 mb-3">Frequency Spectrum</p>
          <div className="flex items-end justify-between h-24 gap-0.5 bg-gray-900 p-2 rounded">
            {frequencybars.map((level, idx) => (
              <div
                key={idx}
                className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t transition-all"
                style={{
                  height: `${level}%`,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>20 Hz</span>
            <span>10 kHz</span>
            <span>20 kHz</span>
          </div>
        </div>

        {/* Frequency Bands */}
        <div className="bg-gray-800 rounded p-3">
          <p className="text-xs font-semibold text-gray-400 mb-3">Frequency Bands</p>
          <div className="space-y-2">
            {[
              { name: 'Bass', range: '20-250 Hz', color: 'bg-orange-500', value: frequencyBands.bass },
              { name: 'Mids', range: '250 Hz-2 kHz', color: 'bg-green-500', value: frequencyBands.mids },
              { name: 'Treble', range: '2-20 kHz', color: 'bg-blue-500', value: frequencyBands.treble },
            ].map(band => (
              <div key={band.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">{band.name}</span>
                  <span className="text-gray-500">{band.range}</span>
                </div>
                <div className="h-2 bg-gray-900 rounded overflow-hidden">
                  <div
                    className={`h-full ${band.color} transition-all`}
                    style={{ width: `${band.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="border-t border-gray-700 bg-gray-800 p-3">
        <button
          onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
          className="w-full flex items-center justify-between mb-2 hover:bg-gray-700 p-2 rounded transition-colors"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-semibold text-gray-400">System Metrics</span>
          </div>
          <span className={`transform transition-transform ${showDetailedMetrics ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        <div className={showDetailedMetrics ? 'block' : 'hidden'}>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">CPU Usage</span>
              <span className="text-gray-300 font-medium">{cpuUsage.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-gray-900 rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-yellow-500"
                style={{ width: `${Math.min(cpuUsage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs pt-1">
              <span className="text-gray-400">Buses</span>
              <span className="text-gray-300 font-medium">{buses.length}</span>
            </div>
            {cpuUsage > 80 && (
              <div className="flex items-center gap-1 mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/30">
                <AlertCircle className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-yellow-600">High CPU usage</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
