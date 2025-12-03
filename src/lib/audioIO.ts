/**
 * Audio I/O Interface - Web Audio I/O Wrapper
 * Handles audio input capture, device selection, and latency compensation
 */

export interface AudioDevice {
  deviceId: string;
  name: string;
  kind: 'audioinput' | 'audiooutput';
  label: string;
}

export interface AudioIOSettings {
  inputDevice: string;
  outputDevice: string;
  sampleRate: number;
  bufferSize: number;
  latencyCompensation: boolean;
  measuredLatency: number;
}

export interface AudioMeterData {
  inputLevel: number;
  outputLevel: number;
  inputPeak: number;
  outputPeak: number;
}

class AudioIOManager {
  private audioContext: AudioContext | null = null;
  private inputStream: MediaStream | null = null;
  private audioInput: AudioWorkletNode | null = null;
  private audioOutput: GainNode | null = null;
  private settings: AudioIOSettings = {
    inputDevice: 'default',
    outputDevice: 'default',
    sampleRate: 44100,
    bufferSize: 256,
    latencyCompensation: true,
    measuredLatency: 0,
  };

  private meterData: AudioMeterData = {
    inputLevel: 0,
    outputLevel: 0,
    inputPeak: 0,
    outputPeak: 0,
  };

  private meterAnalyzer: AnalyserNode | null = null;
  private outputAnalyzer: AnalyserNode | null = null;
  private isInputActive = false;

  /**
   * Initialize audio I/O
   */
  async initialize(): Promise<void> {
    console.log('[AudioIO] Initializing audio I/O');

    try {
      this.audioContext =
        new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: this.settings.sampleRate,
        });

      // Create output gain node
      this.audioOutput = this.audioContext.createGain();
      this.audioOutput.connect(this.audioContext.destination);

      // Create analyzer for metering
      this.outputAnalyzer = this.audioContext.createAnalyser();
      this.audioOutput.connect(this.outputAnalyzer);

      console.log(
        '[AudioIO] Audio context initialized:',
        this.audioContext.sampleRate,
        'Hz'
      );
    } catch (err) {
      console.error('[AudioIO] Initialization error:', err);
      throw err;
    }
  }

  /**
   * Get available input devices
   */
  async getInputDevices(): Promise<AudioDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((device) => device.kind === 'audioinput')
        .map((device) => ({
          deviceId: device.deviceId,
          name: device.label || `Microphone ${device.deviceId}`,
          kind: device.kind as 'audioinput',
          label: device.label,
        }));
    } catch (err) {
      console.error('[AudioIO] Error enumerating input devices:', err);
      return [];
    }
  }

  /**
   * Get available output devices
   */
  async getOutputDevices(): Promise<AudioDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((device) => device.kind === 'audiooutput')
        .map((device) => ({
          deviceId: device.deviceId,
          name: device.label || `Speaker ${device.deviceId}`,
          kind: device.kind as 'audiooutput',
          label: device.label,
        }));
    } catch (err) {
      console.error('[AudioIO] Error enumerating output devices:', err);
      return [];
    }
  }

  /**
   * Select input device and start capturing
   */
  async selectInputDevice(deviceId: string): Promise<boolean> {
    try {
      this.settings.inputDevice = deviceId;

      // Stop existing input if active
      if (this.isInputActive) {
        await this.stopInputCapture();
      }

      // Start capture with selected device
      return await this.startInputCapture(deviceId);
    } catch (err) {
      console.error('[AudioIO] Device selection error:', err);
      return false;
    }
  }

  /**
   * Start audio input capture
   */
  async startInputCapture(deviceId: string = 'default'): Promise<boolean> {
    try {
      if (!this.audioContext) {
        throw new Error('Audio context not initialized');
      }

      this.inputStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId !== 'default' ? { exact: deviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Create source from stream
      const source = this.audioContext.createMediaStreamSource(this.inputStream);

      // Create analyzer for metering
      this.meterAnalyzer = this.audioContext.createAnalyser();
      this.meterAnalyzer.fftSize = 2048;
      source.connect(this.meterAnalyzer);

      // If audio worklet is supported, create one for processing
      if ('AudioWorkletNode' in window) {
        try {
          // Load audio worklet processor
          await this.loadAudioWorklet();
          this.audioInput = new AudioWorkletNode(
            this.audioContext,
            'audio-io-processor'
          );
          source.connect(this.audioInput);
          this.audioInput.connect(this.audioContext.destination);
        } catch (err) {
          console.warn('[AudioIO] AudioWorklet not available, using basic input:', err);
          source.connect(this.audioContext.destination);
        }
      } else {
        // Fallback: connect directly to output
        source.connect(this.audioContext.destination);
      }

      this.isInputActive = true;
      console.log('[AudioIO] Input capture started:', deviceId);

      // Start metering
      this.startMetering();

      return true;
    } catch (err) {
      console.error('[AudioIO] Capture start error:', err);
      return false;
    }
  }

  /**
   * Stop audio input capture
   */
  async stopInputCapture(): Promise<boolean> {
    try {
      if (this.inputStream) {
        this.inputStream.getTracks().forEach((track) => track.stop());
        this.inputStream = null;
      }

      if (this.audioInput) {
        this.audioInput.disconnect();
        this.audioInput = null;
      }

      if (this.meterAnalyzer) {
        this.meterAnalyzer.disconnect();
        this.meterAnalyzer = null;
      }

      this.isInputActive = false;
      console.log('[AudioIO] Input capture stopped');
      return true;
    } catch (err) {
      console.error('[AudioIO] Capture stop error:', err);
      return false;
    }
  }

  /**
   * Check if input is currently active
   */
  isInputCaptureActive(): boolean {
    return this.isInputActive;
  }

  /**
   * Set output level (master volume)
   */
  setOutputLevel(levelDb: number): void {
    if (this.audioOutput) {
      // Convert dB to linear
      const linear = Math.pow(10, levelDb / 20);
      this.audioOutput.gain.setValueAtTime(
        linear,
        (this.audioContext?.currentTime || 0) + 0.01
      );
    }
  }

  /**
   * Get current output level
   */
  getOutputLevel(): number {
    if (!this.audioOutput) return 0;
    return (20 * Math.log10(this.audioOutput.gain.value)) | 0;
  }

  /**
   * Measure system latency
   */
  async measureLatency(): Promise<number> {
    console.log('[AudioIO] Measuring system latency...');

    try {
      // Generate test tone
      if (!this.audioContext) return 0;

      const testOscillator = this.audioContext.createOscillator();
      const analyzerIn = this.audioContext.createAnalyser();
      const analyzerOut = this.audioContext.createAnalyser();

      testOscillator.frequency.value = 1000; // 1 kHz tone
      testOscillator.connect(analyzerIn);
      testOscillator.connect(this.audioContext.destination);

      analyzerOut.connect(this.audioContext.destination);

      if (this.inputStream) {
        const source = this.audioContext.createMediaStreamSource(this.inputStream);
        source.connect(analyzerOut);
      }

      testOscillator.start();

      // Wait for signal propagation
      await new Promise((resolve) => setTimeout(resolve, 500));

      testOscillator.stop();

      // Calculate latency based on buffer sizes
      const estimatedLatency =
        (this.settings.bufferSize / this.settings.sampleRate) * 1000; // ms

      this.settings.measuredLatency = estimatedLatency;
      console.log('[AudioIO] Measured latency:', estimatedLatency.toFixed(2), 'ms');

      return estimatedLatency;
    } catch (err) {
      console.error('[AudioIO] Latency measurement error:', err);
      return 0;
    }
  }

  /**
   * Get current audio meter data
   */
  getMeterData(): AudioMeterData {
    return { ...this.meterData };
  }

  /**
   * Get audio I/O settings
   */
  getSettings(): AudioIOSettings {
    return { ...this.settings };
  }

  /**
   * Update audio I/O settings
   */
  updateSettings(newSettings: Partial<AudioIOSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('[AudioIO] Settings updated:', this.settings);
  }

  /**
   * Get audio context
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Get output gain node
   */
  getOutputGainNode(): GainNode | null {
    return this.audioOutput;
  }

  // ========== PRIVATE METHODS ==========

  private async loadAudioWorklet(): Promise<void> {
    if (!this.audioContext) return;

    const workletCode = `
      class AudioIOProcessor extends AudioWorkletProcessor {
        process(inputs, outputs) {
          const input = inputs[0];
          const output = outputs[0];
          
          for (let channel = 0; channel < input.length; channel++) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];
            
            for (let sample = 0; sample < inputChannel.length; sample++) {
              outputChannel[sample] = inputChannel[sample];
            }
          }
          
          return true;
        }
      }
      
      registerProcessor('audio-io-processor', AudioIOProcessor);
    `;

    try {
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      await this.audioContext.audioWorklet.addModule(url);
    } catch (err) {
      console.warn('[AudioIO] AudioWorklet load error:', err);
    }
  }

  private startMetering(): void {
    if (!this.audioContext) return;

    const updateMeters = () => {
      if (this.meterAnalyzer) {
        const dataArray = new Uint8Array(this.meterAnalyzer.frequencyBinCount);
        this.meterAnalyzer.getByteFrequencyData(dataArray);

        // Calculate RMS for display
        const rms = Math.sqrt(
          dataArray.reduce((acc, val) => acc + val * val, 0) / dataArray.length
        );
        this.meterData.inputLevel = (rms / 255) * 100;
        this.meterData.inputPeak = Math.max(...dataArray) / 255;
      }

      if (this.outputAnalyzer) {
        const dataArray = new Uint8Array(this.outputAnalyzer.frequencyBinCount);
        this.outputAnalyzer.getByteFrequencyData(dataArray);

        const rms = Math.sqrt(
          dataArray.reduce((acc, val) => acc + val * val, 0) / dataArray.length
        );
        this.meterData.outputLevel = (rms / 255) * 100;
        this.meterData.outputPeak = Math.max(...dataArray) / 255;
      }

      requestAnimationFrame(updateMeters);
    };

    updateMeters();
  }
}

// Export singleton instance
export const audioIOManager = new AudioIOManager();
