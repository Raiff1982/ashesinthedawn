# 🔄 Messages Real-Time Integration Guide

**Edge Function**: `messages`  
**Database Table**: `public.messages`  
**Realtime Topic**: `room:{room_id}:messages`  
**Created**: December 2, 2025

---

## 📝 Overview

This guide shows how to integrate the messages Edge Function with real-time broadcasting in your React frontend. Messages are stored in `public.messages` and broadcast via Supabase Realtime.

---

## 🚀 React Integration Example

### 1. Basic Setup

```typescript
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

interface Message {
  id: string;
  user_id: string;
  room_id: string;
  text: string;
  created_at: string;
}
```

### 2. Send Message via Edge Function

```typescript
async function sendMessage(
  roomId: string,
  userId: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      'https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabase.auth.session()?.access_token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          room_id: roomId,
          text: text,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message };
    }

    const data = await response.json();
    console.log('✅ Message sent:', data);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return { success: false, error: String(error) };
  }
}
```

### 3. Subscribe to Real-Time Messages

```typescript
interface SubscriptionOptions {
  onMessage: (message: Message) => void;
  onError?: (error: Error) => void;
  onSubscribed?: () => void;
}

function subscribeToRoomMessages(
  roomId: string,
  options: SubscriptionOptions
) {
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
        console.log('🗑️ Message deleted:', payload.old);
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
```

### 4. React Hook for Messages

```typescript
function useRoomMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load initial messages
    async function loadMessages() {
      try {
        const { data, error: fetchError } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        setMessages(data || []);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      }
    }

    loadMessages();

    // Subscribe to real-time changes
    const subscription = subscribeToRoomMessages(roomId, {
      onMessage: (newMessage) => {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      },
      onError: (err) => {
        setError(err.message);
      },
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  return { messages, isLoading, error };
}
```

### 5. Chat Component Example

```typescript
interface ChatRoomProps {
  roomId: string;
  userId: string;
}

export function ChatRoom({ roomId, userId }: ChatRoomProps) {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { messages, isLoading, error } = useRoomMessages(roomId);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    setIsSending(true);
    const { success, error: sendError } = await sendMessage(
      roomId,
      userId,
      messageText
    );

    if (success) {
      setMessageText('');
    } else {
      alert(`Error sending message: ${sendError}`);
    }

    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-400">Loading messages...</div>
        ) : error ? (
          <div className="text-red-500">Error: {error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400">No messages yet</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.user_id === userId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.user_id === userId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 bg-gray-800 text-gray-100 px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
          />
          <button
            onClick={handleSendMessage}
            disabled={isSending || !messageText.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 6. Usage in App

```typescript
// In your main App.tsx or page component
export function App() {
  const [roomId] = useState('660e8400-e29b-41d4-a716-446655440000');
  const [userId] = useState('550e8400-e29b-41d4-a716-446655440000');

  return (
    <div className="h-screen">
      <ChatRoom roomId={roomId} userId={userId} />
    </div>
  );
}
```

---

## 🔐 Security Considerations

### 1. **Authentication Required**
- User must be authenticated via `supabase.auth.session()`
- Access token included in Authorization header
- Messages Edge Function validates user_id matches authenticated user

### 2. **RLS Policies** (Recommended)
```sql
-- Allow users to insert their own messages
CREATE POLICY "Users can insert their own messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to read messages from rooms they're members of
CREATE POLICY "Users can read room messages"
  ON public.messages
  FOR SELECT
  USING (true); -- Or add room membership check
```

### 3. **Input Validation**
- Frontend: Trim whitespace, check length
- Backend (Edge Function): Validate UUIDs, text length, user authorization
- Database: Constraints on NOT NULL fields

---

## 📊 Data Flow Diagram

```
┌──────────────────────────────┐
│   React Component (ChatRoom) │
│   - Input message text       │
│   - Display messages         │
└──────────────┬───────────────┘
               │
        ┌──────▼──────┐
        │ sendMessage │
        │ Edge Fn     │
        └──────┬──────┘
               │
        ┌──────▼────────────────┐
        │ public.messages table │
        │ - INSERT new message  │
        └──────┬────────────────┘
               │
        ┌──────▼─────────────────────┐
        │ Supabase Realtime          │
        │ - Broadcasts to room:uuid  │
        │ - postgres_changes event   │
        └──────┬─────────────────────┘
               │
        ┌──────▼──────────────────┐
        │ useRoomMessages hook    │
        │ - Receives INSERT event │
        │ - Updates state         │
        └──────┬──────────────────┘
               │
        ┌──────▼──────────────────────┐
        │ ChatRoom component re-renders│
        │ - Shows new message         │
        └─────────────────────────────┘
```

---

## 🧪 Testing the Integration

### 1. **Manual Test with curl**
```bash
# Send message
curl -X POST https://ngvcyxvtorwqocnqcbyz.supabase.co/functions/v1/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "room_id": "660e8400-e29b-41d4-a716-446655440000",
    "text": "Test message"
  }'
```

### 2. **Subscribe with Supabase CLI**
```bash
# In Supabase SQL Editor, test realtime subscription
SELECT * FROM public.messages WHERE room_id = '660e8400-e29b-41d4-a716-446655440000';
```

### 3. **React Integration Test**
```typescript
// Test in browser console
const { ChatRoom } = await import('./ChatRoom.tsx');

// Mount component with test UUIDs
<ChatRoom
  roomId="660e8400-e29b-41d4-a716-446655440000"
  userId="550e8400-e29b-41d4-a716-446655440000"
/>
```

---

## ⚠️ Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| **Messages not appearing** | Not subscribed to channel | Ensure `useRoomMessages()` hook is used |
| **401 Unauthorized** | No auth token | Login user via `supabase.auth.signIn()` |
| **Duplicate messages** | Message received twice | Check for duplicate IDs in message state |
| **Connection drops** | Network issue | Implement reconnection logic in hook |
| **No real-time updates** | Realtime not enabled | Check Supabase project realtime settings |

---

## 📚 Related Resources

- **Edge Function**: `EDGE_FUNCTION_MESSAGES_DEPLOYMENT.md`
- **Database Schema**: `SUPABASE_EDGE_FUNCTIONS_REFERENCE.md`
- **Verification Script**: `verify_edge_functions.py`
- **Supabase Docs**: https://supabase.com/docs/guides/realtime

---

**Last Updated**: December 2, 2025  
**Status**: ✅ Production Ready
