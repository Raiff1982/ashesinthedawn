import { useState, useCallback } from 'react';
import {
  saveAnalysisResult,
  getAnalysisResults,
  getLatestAnalysis,
  cleanupOldAnalysis,
} from '../lib/database/analysisService';
import type { AnalysisResult } from '../lib/database/analysisService';

interface UseAnalysisReturn {
  results: AnalysisResult[];
  latest: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  saveAnalysis: (
    trackId: string,
    analysisType: string,
    score: number,
    findings: string[],
    recommendations: string[],
    metadata?: Record<string, unknown>
  ) => Promise<void>;
  getResults: (trackId: string, analysisType?: string) => Promise<void>;
  getLatest: (trackId: string) => Promise<void>;
  cleanup: (daysOld?: number) => Promise<void>;
}

/**
 * Hook for managing audio analysis results
 */
export function useAudioAnalysis(): UseAnalysisReturn {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [latest, setLatest] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveAnalysis = useCallback(
    async (
      trackId: string,
      analysisType: string,
      score: number,
      findings: string[],
      recommendations: string[],
      metadata?: Record<string, unknown>
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await saveAnalysisResult(
          trackId,
          analysisType,
          score,
          findings,
          recommendations,
          metadata
        );
        if (result.success && result.data) {
          console.log('[useAudioAnalysis] Analysis saved');
          // Reload latest
          await getLatest(trackId);
        } else {
          throw new Error(result.error || 'Failed to save analysis');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        console.error('[useAudioAnalysis] Save failed:', msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getResults = useCallback(async (trackId: string, analysisType?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAnalysisResults(trackId, analysisType);
      if (result.success && result.data) {
        setResults(result.data);
        console.log('[useAudioAnalysis] Retrieved analysis results');
      } else {
        throw new Error(result.error || 'Failed to get results');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[useAudioAnalysis] Get results failed:', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const getLatest = useCallback(async (trackId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLatestAnalysis(trackId);
      if (result.success && result.data) {
        setLatest(result.data);
        console.log('[useAudioAnalysis] Retrieved latest analysis');
      } else if (result.success) {
        setLatest(null);
      } else {
        throw new Error(result.error || 'Failed to get latest');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[useAudioAnalysis] Get latest failed:', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const cleanup = useCallback(async (daysOld?: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await cleanupOldAnalysis(daysOld);
      if (result.success) {
        console.log('[useAudioAnalysis] Cleanup completed');
      } else {
        throw new Error(result.error || 'Failed to cleanup');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[useAudioAnalysis] Cleanup failed:', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    results,
    latest,
    loading,
    error,
    saveAnalysis,
    getResults,
    getLatest,
    cleanup,
  };
}
