import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Message } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Send a message via the messages Edge Function
 */
export async function sendMessage(
  roomId: string,
  userId: string,
  text: string
): Promise<{ success: boolean; data?: Message; error?: string }> {
  try {
    // Get current session for auth token
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          user_id: userId,
          room_id: roomId,
          text: text.trim(),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error.message || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    console.log('✅ Message sent:', data);
    return { success: true, data };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Error sending message:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Subscribe to messages in a room with real-time updates
 */
export interface SubscriptionOptions {
  onMessage: (message: Message) => void;
  onError?: (error: Error) => void;
  onSubscribed?: () => void;
}

export function subscribeToRoomMessages(
  roomId: string,
  options: SubscriptionOptions
): RealtimeChannel {
  // Subscribe to postgres_changes on messages table
  const subscription = supabase
    .channel(`room:${roomId}:messages`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      },
      (payload: RealtimePostgresChangesPayload<Message>) => {
        console.log('📨 New message:', payload.new);
        if (payload.new) {
          options.onMessage(payload.new as Message);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      },
      (payload: RealtimePostgresChangesPayload<Message>) => {
        console.log('✏️ Message updated:', payload.new);
        if (payload.new) {
          options.onMessage(payload.new as Message);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      },
      (payload: RealtimePostgresChangesPayload<Message>) => {
        if (payload.old) {
          console.log('🗑️ Message deleted:', (payload.old as Message).id);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to room: ${roomId}`);
        options.onSubscribed?.();
      } else if (status === 'CLOSED') {
        console.log(`❌ Disconnected from room: ${roomId}`);
      } else if (status === 'CHANNEL_ERROR') {
        const error = new Error('Channel subscription error');
        options.onError?.(error);
      }
    });

  return subscription;
}

/**
 * Load initial messages for a room
 */
export async function loadRoomMessages(
  roomId: string,
  limit: number = 50
): Promise<{ data: Message[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    console.log(`✅ Loaded ${data?.length || 0} messages for room ${roomId}`);
    return { data: data || [] };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Error loading messages:', errorMsg);
    return { data: [], error: errorMsg };
  }
}

/**
 * Get a single message by ID
 */
export async function getMessage(
  messageId: string
): Promise<{ data?: Message; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error) throw error;

    return { data };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Error getting message:', errorMsg);
    return { error: errorMsg };
  }
}

/**
 * Delete a message (if authorized)
 */
export async function deleteMessage(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;

    console.log('✅ Message deleted:', messageId);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Error deleting message:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Search messages in a room by text
 */
export async function searchRoomMessages(
  roomId: string,
  searchText: string
): Promise<{ data: Message[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .ilike('text', `%${searchText}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`✅ Found ${data?.length || 0} messages matching "${searchText}"`);
    return { data: data || [] };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Error searching messages:', errorMsg);
    return { data: [], error: errorMsg };
  }
}

export default {
  sendMessage,
  subscribeToRoomMessages,
  loadRoomMessages,
  getMessage,
  deleteMessage,
  searchRoomMessages,
};
