import { useState, useCallback } from 'react';
import {
  getMusicSuggestions,
  searchMusicKnowledge,
  getMusicCategories,
  getTopSuggestions,
} from '../lib/database/musicKnowledgeService';
import type { MusicSuggestion } from '../lib/database/musicKnowledgeService';

interface UseMusicKnowledgeReturn {
  suggestions: MusicSuggestion[];
  loading: boolean;
  error: string | null;
  categories: string[];
  getSuggestionsByCategory: (category: string, limit?: number) => Promise<void>;
  searchSuggestions: (topic: string, limit?: number) => Promise<void>;
  loadCategories: () => Promise<void>;
  loadTopSuggestions: (minConfidence?: number) => Promise<void>;
}

/**
 * Hook for accessing music knowledge database
 */
export function useMusicKnowledge(): UseMusicKnowledgeReturn {
  const [suggestions, setSuggestions] = useState<MusicSuggestion[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSuggestionsByCategory = useCallback(
    async (category: string, limit?: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await getMusicSuggestions(category, limit);
        if (result.success && result.data) {
          setSuggestions(result.data);
          console.log('[useMusicKnowledge] Loaded suggestions for category:', category);
        } else {
          throw new Error(result.error || 'Failed to load suggestions');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        console.error('[useMusicKnowledge] Load failed:', msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const searchSuggestions = useCallback(async (topic: string, limit?: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await searchMusicKnowledge(topic, limit);
      if (result.success && result.data) {
        setSuggestions(result.data);
        console.log('[useMusicKnowledge] Search results for topic:', topic);
      } else {
        throw new Error(result.error || 'Failed to search');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[useMusicKnowledge] Search failed:', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMusicCategories();
      if (result.success && result.data) {
        setCategories(result.data);
        console.log('[useMusicKnowledge] Loaded categories:', result.data);
      } else {
        throw new Error(result.error || 'Failed to load categories');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[useMusicKnowledge] Load categories failed:', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTopSuggestions = useCallback(async (minConfidence?: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTopSuggestions(minConfidence);
      if (result.success && result.data) {
        setSuggestions(result.data);
        console.log('[useMusicKnowledge] Loaded top suggestions');
      } else {
        throw new Error(result.error || 'Failed to load top suggestions');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[useMusicKnowledge] Load top suggestions failed:', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    suggestions,
    categories,
    loading,
    error,
    getSuggestionsByCategory,
    searchSuggestions,
    loadCategories,
    loadTopSuggestions,
  };
}
