import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Send, Paperclip } from 'lucide-react';
import { socket } from '../../lib/socket';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  attachments?: string[];
}

interface ChatInterfaceProps {
  recipientId: string;
  conversationId: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ recipientId, conversationId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to socket
    socket.connect();
    
    // Join conversation room
    socket.emit('join_conversation', conversationId);

    // Listen for new messages
    socket.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for typing status
    socket.on('typing_status', ({ userId, status }) => {
      if (userId === recipientId) {
        setIsTyping(status);
      }
    });

    // Cleanup
    return () => {
      socket.off('new_message');
      socket.off('typing_status');
      socket.disconnect();
    };
  }, [conversationId, recipientId]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      senderId: user!.id,
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    socket.emit('send_message', {
      conversationId,
      message,
    });

    setNewMessage('');
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    socket.emit('typing', {
      conversationId,
      userId: user!.id,
      status: e.target.value.length > 0,
    });
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-card">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Chat</h3>
        {isTyping && (
          <p className="text-sm text-gray-500">Typing...</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === user!.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                message.senderId === user!.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {message.attachments.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline"
                    >
                      Attachment {index + 1}
                    </a>
                  ))}
                </div>
              )}
              <p className="text-xs mt-1 opacity-70">
                {format(new Date(message.timestamp), 'HH:mm')}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="input resize-none"
              rows={3}
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              className="btn-outline p-2"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="btn-primary p-2"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;