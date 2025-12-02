import { supabase } from '../supabase';
import type { ChatMessage } from '../../types/supabase';

/**
 * Chat History Service
 * Manages saving and loading chat conversations from Supabase
 */

export interface ChatSession {
  id?: string;
  user_id: string;
  messages: ChatMessage[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Save a chat session to the database
 */
export async function saveChatSession(
  userId: string,
  messages: ChatMessage[]
): Promise<{ success: boolean; data?: ChatSession; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .upsert(
        {
          user_id: userId,
          messages: messages,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('[ChatHistoryService] Save error:', error);
      return { success: false, error: error.message };
    }

    console.log('[ChatHistoryService] Chat session saved:', data);
    return { success: true, data: data as ChatSession };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[ChatHistoryService] Save failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Load chat session for a user
 */
export async function loadChatSession(
  userId: string
): Promise<{ success: boolean; data?: ChatSession; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[ChatHistoryService] Load error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.log('[ChatHistoryService] No chat history found for user:', userId);
      return { success: true, data: undefined };
    }

    console.log('[ChatHistoryService] Chat session loaded:', data);
    return { success: true, data: data as ChatSession };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[ChatHistoryService] Load failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Add a message to existing chat session
 */
export async function addChatMessage(
  userId: string,
  message: ChatMessage
): Promise<{ success: boolean; error?: string }> {
  try {
    // Load existing session
    const { data: existing } = await supabase
      .from('chat_history')
      .select('messages')
      .eq('user_id', userId)
      .maybeSingle();

    const messages = existing?.messages || [];
    messages.push({
      ...message,
      timestamp: message.timestamp || Date.now(),
    });

    // Save updated session
    const { error } = await supabase
      .from('chat_history')
      .upsert(
        {
          user_id: userId,
          messages: messages,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('[ChatHistoryService] Add message error:', error);
      return { success: false, error: error.message };
    }

    console.log('[ChatHistoryService] Message added');
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[ChatHistoryService] Add message failed:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Clear chat history for a user
 */
export async function clearChatHistory(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[ChatHistoryService] Clear error:', error);
      return { success: false, error: error.message };
    }

    console.log('[ChatHistoryService] Chat history cleared');
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[ChatHistoryService] Clear failed:', msg);
    return { success: false, error: msg };
  }
}
