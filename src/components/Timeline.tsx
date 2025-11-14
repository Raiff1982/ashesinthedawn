import { useDAW } from '../contexts/DAWContext';

export default function Timeline() {
  const { tracks, currentTime, currentProject } = useDAW();

  const bars = 32;
  const pixelsPerBar = 120;

  return (
    <div className="flex-1 bg-gray-950 overflow-auto">
      <div className="h-12 bg-gray-900 border-b border-gray-700 flex items-center sticky top-0 z-10">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            style={{ width: `${pixelsPerBar}px` }}
            className="h-full flex items-center justify-center border-l border-gray-700 text-xs text-gray-400"
          >
            {i + 1}
          </div>
        ))}
      </div>

      <div className="relative">
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-20"
          style={{ left: `${(currentTime / 4) * pixelsPerBar}px` }}
        >
          <div className="w-3 h-3 bg-blue-500 -ml-1.5 -mt-1" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        </div>

        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="h-16 border-b border-gray-800 hover:bg-gray-900 transition-colors"
          >
            <div className="h-full flex items-center" style={{ width: `${bars * pixelsPerBar}px` }}>
              {Array.from({ length: bars }).map((_, i) => (
                <div
                  key={i}
                  style={{ width: `${pixelsPerBar}px` }}
                  className="h-full border-l border-gray-800"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
