import { useState, useEffect, useCallback } from 'react';
import { errorManager, AppError } from '../lib/errorHandling';

/**
 * Hook for displaying and managing errors in components
 */
export function useErrors() {
  const [errors, setErrors] = useState<AppError[]>([]);

  useEffect(() => {
    // Subscribe to error events
    const unsubscribe = errorManager.subscribe((error) => {
      setErrors(prev => {
        // Don't add duplicate errors within 1 second
        const recentDuplicate = prev.some(
          e => e.title === error.title && 
            (Date.now() - e.timestamp) < 1000
        );
        
        if (recentDuplicate) return prev;
        
        return [...prev, error];
      });
    });

    // Load any existing errors
    setErrors(errorManager.getErrors());

    return unsubscribe;
  }, []);

  const dismissError = useCallback((id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id));
    errorManager.clearError(id);
  }, []);

  const dismissAll = useCallback(() => {
    setErrors([]);
    errorManager.clearAll();
  }, []);

  const retryError = useCallback(async (error: AppError) => {
    if (error.recovery) {
      try {
        await error.recovery();
        dismissError(error.id);
      } catch (err) {
        console.error('[useErrors] Recovery failed:', err);
      }
    }
  }, [dismissError]);

  return {
    errors,
    dismissError,
    dismissAll,
    retryError,
    hasErrors: errors.length > 0,
    errorCount: errors.length,
  };
}

/**
 * Hook for registering single error
 */
export function useErrorHandler() {
  const registerError = useCallback((error: AppError) => {
    errorManager.registerError(error);
  }, []);

  return { registerError };
}
