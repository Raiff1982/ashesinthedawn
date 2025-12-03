/**
 * Error Handling & Recovery System
 * Centralized error management with user-friendly messages and recovery options
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
  id: string;
  message: string;
  title: string;
  severity: ErrorSeverity;
  timestamp: number;
  context?: Record<string, any>;
  recoverable: boolean;
  recovery?: () => Promise<void>;
  stackTrace?: string;
}

class ErrorManager {
  private errors: Map<string, AppError> = new Map();
  private listeners: Set<(error: AppError) => void> = new Set();
  private errorQueue: AppError[] = [];
  private maxErrors = 50; // Keep last 50 errors in memory

  /**
   * Register an error
   */
  registerError(error: AppError): void {
    const id = error.id || `error-${Date.now()}-${Math.random()}`;
    
    const managedError: AppError = {
      ...error,
      id,
      timestamp: Date.now(),
    };

    this.errors.set(id, managedError);
    this.errorQueue.push(managedError);
    
    // Keep queue size limited
    if (this.errorQueue.length > this.maxErrors) {
      const oldest = this.errorQueue.shift();
      if (oldest) {
        this.errors.delete(oldest.id);
      }
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(managedError));

    // Log based on severity
    this.logError(managedError);
  }

  /**
   * Clear an error
   */
  clearError(id: string): void {
    this.errors.delete(id);
  }

  /**
   * Get all errors
   */
  getErrors(): AppError[] {
    return Array.from(this.errors.values());
  }

  /**
   * Get error by ID
   */
  getError(id: string): AppError | undefined {
    return this.errors.get(id);
  }

  /**
   * Subscribe to error events
   */
  subscribe(listener: (error: AppError) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Log error based on severity
   */
  private logError(error: AppError): void {
    const timestamp = new Date(error.timestamp).toISOString();
    const prefix = `[${error.severity.toUpperCase()}] [${timestamp}]`;

    switch (error.severity) {
      case 'critical':
        console.error(`${prefix} ${error.title}:`, error.message, error.context);
        if (error.stackTrace) console.error('Stack:', error.stackTrace);
        break;
      case 'error':
        console.error(`${prefix} ${error.title}:`, error.message);
        break;
      case 'warning':
        console.warn(`${prefix} ${error.title}:`, error.message);
        break;
      case 'info':
        console.info(`${prefix} ${error.title}:`, error.message);
        break;
    }
  }

  /**
   * Clear all errors
   */
  clearAll(): void {
    this.errors.clear();
    this.errorQueue = [];
  }

  /**
   * Get error statistics
   */
  getStats(): {
    total: number;
    byType: Record<ErrorSeverity, number>;
  } {
    const stats = {
      total: this.errors.size,
      byType: {
        info: 0,
        warning: 0,
        error: 0,
        critical: 0,
      },
    };

    this.errors.forEach(error => {
      stats.byType[error.severity]++;
    });

    return stats;
  }
}

// Global error manager instance
export const errorManager = new ErrorManager();

/**
 * Common error factory functions
 */

export const createStorageError = (message: string, context?: any): AppError => ({
  id: `storage-${Date.now()}`,
  title: 'Storage Error',
  message,
  severity: 'error',
  context: { ...context, source: 'storage' },
  recoverable: true,
  recovery: async () => {
    try {
      localStorage.clear();
      console.log('[Recovery] Cleared localStorage');
    } catch (err) {
      console.error('[Recovery] Failed to clear storage:', err);
    }
  },
  timestamp: Date.now(),
});

export const createImportError = (message: string, context?: any): AppError => ({
  id: `import-${Date.now()}`,
  title: 'Import Failed',
  message,
  severity: 'error',
  context: { ...context, source: 'import' },
  recoverable: true,
  timestamp: Date.now(),
});

export const createExportError = (message: string, context?: any): AppError => ({
  id: `export-${Date.now()}`,
  title: 'Export Failed',
  message,
  severity: 'warning',
  context: { ...context, source: 'export' },
  recoverable: true,
  timestamp: Date.now(),
});

export const createDeviceError = (message: string, context?: any): AppError => ({
  id: `device-${Date.now()}`,
  title: 'Audio Device Error',
  message,
  severity: 'warning',
  context: { ...context, source: 'device' },
  recoverable: true,
  recovery: async () => {
    // Trigger device re-enumeration
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('[Recovery] Re-enumerated devices:', devices.length);
    } catch (err) {
      console.error('[Recovery] Failed to re-enumerate:', err);
    }
  },
  timestamp: Date.now(),
});

export const createAudioError = (message: string, context?: any): AppError => ({
  id: `audio-${Date.now()}`,
  title: 'Audio Error',
  message,
  severity: 'error',
  context: { ...context, source: 'audio' },
  recoverable: true,
  timestamp: Date.now(),
});

/**
 * DSP Backend Errors
 */
export const createDSPConnectionError = (message: string, context?: any): AppError => ({
  id: `dsp-connection-${Date.now()}`,
  title: 'DSP Backend Unavailable',
  message: `Cannot connect to audio processing backend: ${message}`,
  severity: 'error',
  context: { ...context, source: 'dsp-backend', retryable: true },
  recoverable: true,
  recovery: async () => {
    console.log('[Recovery] Attempting to reconnect to DSP backend...');
    // This will be called by dspBridge reconnection logic
  },
  timestamp: Date.now(),
});

export const createDSPProcessingError = (effectType: string, message: string, context?: any): AppError => ({
  id: `dsp-processing-${Date.now()}`,
  title: `Effect Processing Failed: ${effectType}`,
  message: `Failed to process ${effectType}: ${message}`,
  severity: 'error',
  context: { ...context, source: 'dsp-effect', effectType },
  recoverable: true,
  timestamp: Date.now(),
});

export const createDSPAnalysisError = (analysisType: string, message: string, context?: any): AppError => ({
  id: `dsp-analysis-${Date.now()}`,
  title: `Audio Analysis Failed: ${analysisType}`,
  message: `Failed to analyze audio (${analysisType}): ${message}`,
  severity: 'warning',
  context: { ...context, source: 'dsp-analysis', analysisType },
  recoverable: true,
  timestamp: Date.now(),
});

export const createCodetteAIError = (operation: string, message: string, context?: any): AppError => ({
  id: `codette-ai-${Date.now()}`,
  title: `Codette AI Error: ${operation}`,
  message: `Codette AI failed during ${operation}: ${message}`,
  severity: 'warning',
  context: { ...context, source: 'codette-ai', operation },
  recoverable: true,
  timestamp: Date.now(),
});

export const createGenericError = (message: string, severity: ErrorSeverity = 'error', context?: any): AppError => ({
  id: `generic-${Date.now()}`,
  title: 'Error',
  message,
  severity,
  context,
  recoverable: true,
  timestamp: Date.now(),
});

export const createFileTooBigError = (filename: string, size: number): AppError => ({
  id: `file-size-${Date.now()}`,
  title: 'File Too Large',
  message: `"${filename}" is ${(size / 1024 / 1024).toFixed(1)}MB. Max 100MB. Try compressing to MP3 first.`,
  severity: 'warning',
  context: { filename, size, recoveryHint: 'compress-mp3' },
  recoverable: true,
  recovery: async () => {
    console.log('[Recovery] Suggestion: Use FFmpeg to compress: ffmpeg -i input.wav -codec:a libmp3lame -q:a 4 output.mp3');
  },
  timestamp: Date.now(),
});

export const createNoTrackSelectedError = (): AppError => ({
  id: `no-track-${Date.now()}`,
  title: 'No Track Selected',
  message: 'Select a track or create one to proceed with this action.',
  severity: 'info',
  context: { action: 'track-operation' },
  recoverable: true,
  timestamp: Date.now(),
});

export const createClippingWarning = (trackName: string): AppError => ({
  id: `clipping-${Date.now()}`,
  title: 'Audio Clipping Detected',
  message: `Track "${trackName}" is clipping. Reduce volume to prevent distortion.`,
  severity: 'warning',
  context: { trackName },
  recoverable: true,
  timestamp: Date.now(),
});

/**
 * Safe async execution wrapper
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => void
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[safeAsync] Error:', message);
    
    if (errorHandler) {
      errorHandler(error);
    }
    
    return null;
  }
}

/**
 * Safe sync execution wrapper
 */
export function safeSync<T>(
  fn: () => T,
  errorHandler?: (error: unknown) => void
): T | null {
  try {
    return fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[safeSync] Error:', message);
    
    if (errorHandler) {
      errorHandler(error);
    }
    
    return null;
  }
}
