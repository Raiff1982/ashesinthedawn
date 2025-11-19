import { Play, Pause, Square, Circle, Settings, Search } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';

export default function TopBar() {
  const {
    currentProject,
    isPlaying,
    isRecording,
    currentTime,
    cpuUsage,
    togglePlay,
    toggleRecord,
    stop,
  } = useDAW();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-12 bg-gradient-to-r from-gray-800 via-gray-750 to-gray-800 border-b border-gray-600 flex items-center justify-between px-4 gap-4 text-xs shadow-md">
      {/* Left: Project name and controls */}
      <div className="flex items-center gap-4">
        <span className="font-semibold text-gray-50">{currentProject?.name || 'Untitled'}</span>
        
        {/* Transport Controls */}
        <div className="flex items-center gap-1 bg-gray-900 rounded-md px-2 py-1 border border-gray-700">
          <button
            onClick={togglePlay}
            className={`p-1.5 rounded transition ${isPlaying ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-800 text-gray-300'}`}
            title="Play/Pause"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={stop}
            className="p-1.5 rounded hover:bg-gray-800 text-gray-300 transition"
            title="Stop"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={toggleRecord}
            className={`p-1.5 rounded transition ${isRecording ? 'bg-red-600 text-white shadow-lg animate-pulse' : 'hover:bg-gray-800 text-gray-300'}`}
            title="Record"
          >
            <Circle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Time display */}
      <div className="flex-1 flex justify-center">
        <div className="text-center font-mono text-gray-200 bg-gray-900 px-6 py-1 rounded-md min-w-32 border border-gray-700 shadow-inner">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Right: Status and settings */}
      <div className="flex items-center gap-4">
        <span className="text-gray-400">CPU: <span className="text-gray-200 font-semibold">{cpuUsage}%</span></span>
        <button className="p-1.5 rounded hover:bg-gray-800 text-gray-300 transition" title="Search">
          <Search className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-800 text-gray-300 transition" title="Settings">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
