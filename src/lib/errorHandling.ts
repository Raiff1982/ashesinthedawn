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

export const createGenericError = (message: string, severity: ErrorSeverity = 'error', context?: any): AppError => ({
  id: `generic-${Date.now()}`,
  title: 'Error',
  message,
  severity,
  context,
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
