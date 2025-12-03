import { useState, useRef, useEffect } from 'react';
import { useRoomMessages } from '../hooks/useRoomMessages';
import { sendMessage } from '../lib/messagesService';

interface MessagesChatProps {
  roomId: string;
  userId: string;
}

/**
 * Real-time messaging component using Supabase Edge Function
 * Features:
 * - Real-time message updates
 * - Auto-scroll to latest message
 * - Loading and error states
 * - Message input with send button
 * - Responsive design with Tailwind CSS
 */
export function MessagesChat({ roomId, userId }: MessagesChatProps) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, error, addMessage } = useRoomMessages(roomId, {
    autoLoad: true,
    messageLimit: 50,
  });

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    setIsSending(true);
    try {
      const { success, data, error: sendError } = await sendMessage(
        roomId,
        userId,
        inputText.trim()
      );

      if (success && data) {
        addMessage(data);
        setInputText('');
      } else {
        console.error('Failed to send message:', sendError);
        alert(`Error sending message: ${sendError}`);
      }
    } catch (err) {
      console.error('Send error:', err);
      alert('An error occurred while sending the message');
    } finally {
      setIsSending(false);
    }
  };

  // Handle Enter key to send
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-100">Chat Room</h2>
          <p className="text-sm text-gray-400">Room ID: {roomId.substring(0, 8)}...</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-300">Connected</span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-2"></div>
              <p className="text-gray-400 text-sm">Loading messages...</p>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-500 text-sm mb-2">⚠️ Error loading messages</p>
              <p className="text-gray-400 text-xs">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map((message) => {
          const isOwnMessage = message.user_id === userId;
          return (
            <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  isOwnMessage
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-700 text-gray-100 rounded-bl-none'
                }`}
              >
                {!isOwnMessage && (
                  <p className="text-xs font-semibold text-gray-300 mb-1">
                    {message.user_id === userId ? 'You' : 'User'}
                  </p>
                )}
                <p className="text-sm break-words">{message.text}</p>
                <p className="text-xs opacity-70 mt-1 text-right">
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... (Enter to send)"
            disabled={isSending || isLoading}
            maxLength={5000}
            className="flex-1 bg-gray-800 text-gray-100 placeholder-gray-500 px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={isSending || !inputText.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition font-medium disabled:cursor-not-allowed"
          >
            {isSending ? (
              <span className="flex items-center gap-1">
                <span className="inline-block animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                Sending
              </span>
            ) : (
              'Send'
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">{inputText.length}/5000 characters</p>
      </div>
    </div>
  );
}

export default MessagesChat;
