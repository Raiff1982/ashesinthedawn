import { useEffect, useState } from 'react';
import { AudioDeviceManager } from '../lib/audioDeviceManager';
import { errorManager, createDeviceError } from '../lib/errorHandling';

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
  groupId: string;
  state: 'connected' | 'disconnected';
}

/**
 * Hook for managing audio device selection and monitoring
 */
export function useAudioDevices() {
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string | null>(null);
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let deviceManager: AudioDeviceManager | null = null;

    const initializeDevices = async () => {
      try {
        setIsLoading(true);
        deviceManager = new AudioDeviceManager();
        await deviceManager.initialize();

        // Get initial device lists
        const inputs = await deviceManager.getInputDevices();
        const outputs = await deviceManager.getOutputDevices();

        setInputDevices(inputs);
        setOutputDevices(outputs);

        // Set first available as default
        if (inputs.length > 0) {
          setSelectedInputId(inputs[0].deviceId);
        }
        if (outputs.length > 0) {
          setSelectedOutputId(outputs[0].deviceId);
        }

        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize audio devices';
        setError(message);
        console.error('[useAudioDevices] Error:', message);
        
        // Register error with error manager
        errorManager.registerError(createDeviceError(
          `Audio device initialization failed: ${message}`,
          { context: 'useAudioDevices initialization', recoverable: true }
        ));
      } finally {
        setIsLoading(false);
      }
    };

    initializeDevices();

    // Cleanup
    return () => {
      // Device manager is handled internally
    };
  }, []);

  const selectInputDevice = (deviceId: string) => {
    if (inputDevices.some(d => d.deviceId === deviceId)) {
      setSelectedInputId(deviceId);
    } else {
      const error = `Input device not found: ${deviceId}`;
      setError(error);
      errorManager.registerError(createDeviceError(error, { context: 'selectInputDevice' }));
    }
  };

  const selectOutputDevice = (deviceId: string) => {
    if (outputDevices.some(d => d.deviceId === deviceId)) {
      setSelectedOutputId(deviceId);
    } else {
      const error = `Output device not found: ${deviceId}`;
      setError(error);
      errorManager.registerError(createDeviceError(error, { context: 'selectOutputDevice' }));
    }
  };

  return {
    inputDevices,
    outputDevices,
    selectedInputId,
    selectedOutputId,
    selectInputDevice,
    selectOutputDevice,
    isLoading,
    error,
    hasInputDevices: inputDevices.length > 0,
    hasOutputDevices: outputDevices.length > 0,
  };
}
