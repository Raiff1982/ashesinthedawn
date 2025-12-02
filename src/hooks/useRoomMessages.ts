import { useEffect, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { subscribeToRoomMessages, loadRoomMessages } from '../lib/messagesService';
import type { Message } from '../types';

export interface UseRoomMessagesOptions {
  autoLoad?: boolean;
  messageLimit?: number;
}

/**
 * Hook for managing messages in a room with real-time subscriptions
 *
 * @param roomId - The room/channel ID to subscribe to
 * @param options - Configuration options
 * @returns Object with messages, loading state, error state, and utility functions
 *
 * @example
 * ```tsx
 * const { messages, isLoading, error, addMessage } = useRoomMessages(roomId);
 * ```
 */
export function useRoomMessages(
  roomId: string,
  options: UseRoomMessagesOptions = {}
) {
  const { autoLoad = true, messageLimit = 50 } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!roomId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: loadError } = await loadRoomMessages(roomId, messageLimit);

      if (loadError) {
        throw new Error(loadError);
      }

      setMessages(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      console.error('Failed to load messages:', errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, messageLimit]);

  // Handle new message from subscription
  const handleNewMessage = useCallback((newMessage: Message) => {
    setMessages((prev) => {
      // Avoid duplicates
      if (prev.some((m) => m.id === newMessage.id)) {
        return prev;
      }
      return [...prev, newMessage];
    });
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!roomId) return;

    // Load initial messages
    if (autoLoad) {
      loadMessages();
    }

    // Subscribe to real-time changes
    const channel = subscribeToRoomMessages(roomId, {
      onMessage: handleNewMessage,
      onError: (err) => {
        setError(err.message);
        console.error('Subscription error:', err);
      },
      onSubscribed: () => {
        console.log(`✅ Subscribed to ${roomId}`);
      },
    });

    setSubscription(channel);

    // Cleanup
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [roomId, autoLoad, loadMessages, handleNewMessage]);

  // Add message to local state (optimistic update)
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Remove message from state
  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  // Update message in state
  const updateMessage = useCallback((messageId: string, updates: Partial<Omit<Message, 'id'>>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, ...updates } : m))
    );
  }, []);

  return {
    messages,
    isLoading,
    error,
    subscription,
    // Utility functions
    addMessage,
    clearMessages,
    removeMessage,
    updateMessage,
    reloadMessages: loadMessages,
  };
}

export default useRoomMessages;
