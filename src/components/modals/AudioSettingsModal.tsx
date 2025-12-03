import { useState } from 'react';
import { X } from 'lucide-react';
import { useDAW } from '../../contexts/DAWContext';
import { useAudioDevices } from '../../hooks/useAudioDevices';

export default function AudioSettingsModal() {
  const { 
    showAudioSettingsModal, 
    closeAudioSettingsModal,
    selectInputDevice,
    selectOutputDevice
  } = useDAW();
  const { 
    inputDevices, 
    outputDevices, 
    selectedInputId, 
    selectedOutputId,
    selectInputDevice: selectInputDeviceHook,
    selectOutputDevice: selectOutputDeviceHook,
    isLoading,
    error
  } = useAudioDevices();
  
  const [selectedBufferSize, setSelectedBufferSize] = useState('8192');
  const [sampleRate, setSampleRate] = useState('48000');
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  if (!showAudioSettingsModal) return null;

  const handleApplySettings = async () => {
    try {
      setApplyError(null);
      setApplySuccess(false);

      // Apply input device if selected
      if (selectedInputId) {
        await selectInputDevice(selectedInputId);
        selectInputDeviceHook(selectedInputId);
      }

      // Apply output device if selected
      if (selectedOutputId) {
        await selectOutputDevice(selectedOutputId);
        selectOutputDeviceHook(selectedOutputId);
      }

      setApplySuccess(true);
      console.log(`✅ Audio settings applied: ${sampleRate}Hz, Buffer: ${selectedBufferSize}, Input: ${selectedInputId}, Output: ${selectedOutputId}`);
      
      // Show success briefly then close
      setTimeout(() => {
        closeAudioSettingsModal();
      }, 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setApplyError(message);
      console.error('Failed to apply audio settings:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-gray-100">Audio Settings</h2>
          <button
            onClick={closeAudioSettingsModal}
            className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Audio Device Selection */}
          <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-200">Audio Devices</h3>
            
            {error && (
              <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
                ⚠️ {error}
              </div>
            )}

            {applyError && (
              <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
                ❌ Apply Error: {applyError}
              </div>
            )}

            {applySuccess && (
              <div className="text-xs text-green-400 bg-green-900/20 p-2 rounded">
                ✅ Audio devices applied successfully!
              </div>
            )}
            
            {isLoading ? (
              <div className="text-xs text-gray-400">Loading devices...</div>
            ) : (
              <div className="space-y-3">
                {/* Input Device */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-300">Input (Microphone)</label>
                  <select
                    value={selectedInputId || ''}
                    onChange={(e) => selectInputDeviceHook(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select input device...</option>
                    {inputDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Input Device ${inputDevices.indexOf(device) + 1}`}
                      </option>
                    ))}
                  </select>
                  {inputDevices.length === 0 && (
                    <p className="text-xs text-yellow-400">No input devices found</p>
                  )}
                </div>
                
                {/* Output Device */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-300">Output (Speaker)</label>
                  <select
                    value={selectedOutputId || ''}
                    onChange={(e) => selectOutputDeviceHook(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select output device...</option>
                    {outputDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Output Device ${outputDevices.indexOf(device) + 1}`}
                      </option>
                    ))}
                  </select>
                  {outputDevices.length === 0 && (
                    <p className="text-xs text-yellow-400">No output devices found</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sample Rate Configuration */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-200">Sample Rate</label>
            <select
              value={sampleRate}
              onChange={(e) => setSampleRate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="44100">44,100 Hz (CD Quality)</option>
              <option value="48000">48,000 Hz (Professional)</option>
              <option value="96000">96,000 Hz (High Definition)</option>
            </select>
            <p className="text-xs text-gray-400">
              {sampleRate === '44100' && 'Standard CD quality - Good for most uses'}
              {sampleRate === '48000' && 'Industry standard for video/professional work'}
              {sampleRate === '96000' && 'High definition audio - Higher CPU usage'}
            </p>
          </div>

          {/* Buffer Size Configuration */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-200">Buffer Size</label>
            <div className="grid grid-cols-4 gap-2">
              {['256', '512', '1024', '2048', '4096', '8192', '16384', '32768'].map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedBufferSize(size)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    selectedBufferSize === size
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              {selectedBufferSize === '256' && 'Lowest latency (~5ms @ 48kHz) - May cause issues'}
              {selectedBufferSize === '512' && 'Very low latency (~11ms @ 48kHz)'}
              {selectedBufferSize === '1024' && 'Low latency (~21ms @ 48kHz)'}
              {selectedBufferSize === '2048' && 'Normal latency (~43ms @ 48kHz)'}
              {selectedBufferSize === '4096' && 'Higher latency (~85ms @ 48kHz)'}
              {selectedBufferSize === '8192' && 'Professional standard (~170ms @ 48kHz) - Recommended'}
              {selectedBufferSize === '16384' && 'High latency (~341ms @ 48kHz)'}
              {selectedBufferSize === '32768' && 'Maximum latency (~682ms @ 48kHz)'}
            </p>
          </div>

          {/* Bit Depth Configuration */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-200">Bit Depth</label>
            <div className="grid grid-cols-3 gap-2">
              {['16', '24', '32'].map((depth) => (
                <button
                  key={depth}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-300 transition-colors"
                >
                  {depth}-bit
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              24-bit is recommended for professional audio production
            </p>
          </div>

          {/* Information Section */}
          <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg space-y-2">
            <h3 className="text-sm font-semibold text-blue-300">💡 Audio Setup Tips</h3>
            <ul className="text-xs text-blue-200 space-y-1 list-disc list-inside">
              <li>Use 48kHz sample rate for professional work</li>
              <li>Buffer size affects latency and CPU usage</li>
              <li>Lower buffer sizes require more CPU power</li>
              <li>Recommended: 8192 samples for general use</li>
              <li>24-bit provides better dynamic range than 16-bit</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 flex justify-end gap-3 p-6">
          <button
            onClick={closeAudioSettingsModal}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg transition-colors text-sm font-medium"
          >
            Close
          </button>
          <button
            onClick={handleApplySettings}
            disabled={applySuccess}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              applySuccess
                ? 'bg-green-600 text-white cursor-default'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {applySuccess ? '✅ Applied!' : 'Apply & Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
