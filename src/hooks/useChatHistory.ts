import { useState, useCallback, useEffect } from 'react';
import {
  saveChatSession,
  loadChatSession,
  addChatMessage,
  clearChatHistory,
  type ChatSession,
} from '../lib/database/chatHistoryService';
import type { ChatMessage } from '../types/supabase';

interface UseChatHistoryReturn {
  session: ChatSession | null;
  loading: boolean;
  error: string | null;
  saveSession: (title: string, messages: ChatMessage[]) => Promise<void>;
  addMessage: (message: ChatMessage) => Promise<void>;
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
}

/**
 * Hook for managing chat history with Supabase
 */
export function useChatHistory(userId: string): UseChatHistoryReturn {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load chat history on mount
  useEffect(() => {
    if (userId) {
      loadHistory();
    }
  }, [userId]);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadChatSession(userId);
      if (result.success && result.data) {
        setSession(result.data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[useChatHistory] Load failed:', msg);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const saveSession = useCallback(
    async (title: string, messages: ChatMessage[]) => {
      setLoading(true);
      setError(null);
      try {
        const result = await saveChatSession(userId, messages);
        if (result.success && result.data) {
          setSession(result.data);
          console.log('[useChatHistory] Session saved:', title);
        } else {
          throw new Error(result.error || 'Failed to save session');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        console.error('[useChatHistory] Save failed:', msg);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const addMessage = useCallback(
    async (message: ChatMessage) => {
      setError(null);
      try {
        const result = await addChatMessage(userId, message);
        if (!result.success) {
          throw new Error(result.error || 'Failed to add message');
        }
        // Reload session to get updated messages
        await loadHistory();
        console.log('[useChatHistory] Message added');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        console.error('[useChatHistory] Add message failed:', msg);
      }
    },
    [userId, loadHistory]
  );

  const clearHistoryCallback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await clearChatHistory(userId);
      if (result.success) {
        setSession(null);
        console.log('[useChatHistory] History cleared');
      } else {
        throw new Error(result.error || 'Failed to clear history');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[useChatHistory] Clear failed:', msg);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    session,
    loading,
    error,
    saveSession,
    addMessage,
    loadHistory,
    clearHistory: clearHistoryCallback,
  };
}
