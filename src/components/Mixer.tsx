import { Volume2, Send, Sliders } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';

export default function Mixer() {
  const { tracks, updateTrack } = useDAW();

  return (
    <div className="h-64 bg-gradient-to-b from-gray-900 to-gray-950 border-t border-gray-700 overflow-x-auto">
      <div className="flex h-full p-4 space-x-2">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="w-20 flex flex-col bg-gray-800 rounded-lg p-2 border border-gray-700"
          >
            <div className="flex-1 flex flex-col items-center space-y-2">
              <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" style={{ width: '45%' }} />
              </div>

              <input
                type="range"
                min="-60"
                max="12"
                value={track.volume}
                onChange={(e) => updateTrack(track.id, { volume: parseFloat(e.target.value) })}
                orient="vertical"
                className="flex-1 slider-vertical"
              />

              <div className="text-xs text-center text-gray-400 font-mono">
                {track.volume > 0 ? '+' : ''}{track.volume.toFixed(1)}
              </div>
            </div>

            <div className="space-y-1 mt-2">
              <div className="flex justify-center space-x-1">
                <button
                  onClick={() => updateTrack(track.id, { muted: !track.muted })}
                  className={`px-2 py-1 text-xs rounded ${
                    track.muted ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  M
                </button>
                <button
                  onClick={() => updateTrack(track.id, { soloed: !track.soloed })}
                  className={`px-2 py-1 text-xs rounded ${
                    track.soloed ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  S
                </button>
              </div>

              <div className="text-xs text-center text-white truncate" title={track.name}>
                {track.name}
              </div>

              <div style={{ backgroundColor: track.color }} className="h-1 rounded-full" />
            </div>
          </div>
        ))}

        {tracks.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Volume2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No tracks yet. Add tracks to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
