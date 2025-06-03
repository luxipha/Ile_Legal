import React, { useState, useEffect, useRef } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Send, Paperclip, User } from 'lucide-react';
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

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ recipientId, conversationId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: 'other-user',
      content: 'Hello, I need help with a contract review for my business.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      senderId: 'current-user',
      content: 'Hi there! I would be happy to help with your contract review. Could you provide more details about what type of contract it is?',
      timestamp: new Date(Date.now() - 3500000).toISOString(),
    },
    {
      id: '3',
      senderId: 'other-user',
      content: 'It is a partnership agreement for a tech startup. I want to make sure all the terms are fair and protect my interests.',
      timestamp: new Date(Date.now() - 3400000).toISOString(),
    },
    {
      id: '4',
      senderId: 'current-user',
      content: 'I understand. Partnership agreements are important to get right. Do you have the document ready to share?',
      timestamp: new Date(Date.now() - 3300000).toISOString(),
    },
    {
      id: '5',
      senderId: 'other-user',
      content: 'Yes, I can upload it now. It is about 15 pages long.',
      timestamp: new Date(Date.now() - 180000).toISOString(),
      attachments: ['partnership_agreement_draft.pdf']
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // We'll use setRecipientInfo when implementing the backend
  const [recipientInfo] = useState({
    name: 'John Doe',
    avatar: '',
    status: 'online',
    lastSeen: new Date().toISOString()
  });

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

  // This function will be used when we implement the backend socket connection
  // For now, we're using handleSendWithLoading for the mock implementation
  // const handleSend = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!newMessage.trim()) return;

  //   const message = {
  //     senderId: user?.id || 'current-user',
  //     content: newMessage,
  //     timestamp: new Date().toISOString(),
  //   };

  //   socket.emit('send_message', {
  //     conversationId,
  //     message,
  //   });

  //   setNewMessage('');
  // };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    socket.emit('typing', {
      conversationId,
      userId: user?.id || 'current-user',
      status: e.target.value.length > 0,
    });
  };

  // Function to handle sending a message with loading state
  const handleSendWithLoading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setIsLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      // Create a new message object
      const newMsg: Message = {
        id: `local-${Date.now()}`,
        senderId: 'current-user',
        content: newMessage,
        timestamp: new Date().toISOString(),
      };
      
      // In a real implementation, we would emit to the socket here
      // socket.emit('send_message', { conversationId, message: newMsg });
      
      // Add message to the list
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      setIsLoading(false);
    }, 500);
  };

  // Group messages by date
  const getMessagesByDate = () => {
    const messagesByDate: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      
      if (!messagesByDate[dateKey]) {
        messagesByDate[dateKey] = [];
      }
      
      messagesByDate[dateKey].push(message);
    });
    
    return messagesByDate;
  };

  // Format date label
  const getDateLabel = (date: Date) => {
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-md">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium">{recipientInfo.name}</h3>
            <p className="text-xs text-gray-500">
              {recipientInfo.status === 'online' ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Online
                </span>
              ) : (
                <span>Last seen {format(new Date(recipientInfo.lastSeen), 'h:mm a')}</span>
              )}
            </p>
          </div>
        </div>
        <div className="text-gray-400">
          {isTyping && <p className="text-xs italic">Typing...</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(getMessagesByDate()).map(([dateKey, dateMessages]) => {
          const date = new Date(dateMessages[0].timestamp);
          const dateLabel = getDateLabel(date);
          
          return (
            <div key={dateKey} className="space-y-4">
              <div className="flex justify-center my-4">
                <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                  {dateLabel}
                </div>
              </div>
              
              {dateMessages.map((message) => {
                const isCurrentUser = message.senderId === 'current-user';
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isCurrentUser && (
                      <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mr-2 mt-1">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                    <div className="max-w-[70%]">
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isCurrentUser
                            ? 'bg-primary-500 text-white rounded-tr-none'
                            : 'bg-gray-100 text-gray-900 rounded-tl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((url, index) => (
                              <div 
                                key={index}
                                className={`flex items-center p-2 rounded ${isCurrentUser ? 'bg-primary-600' : 'bg-gray-200'}`}
                              >
                                <div className="mr-2">
                                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-xs ${isCurrentUser ? 'text-white' : 'text-gray-700'} font-medium`}
                                >
                                  {url.split('/').pop()}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${isCurrentUser ? 'text-right' : ''} text-gray-500`}>
                        {format(new Date(message.timestamp), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendWithLoading} className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="input resize-none"
              rows={3}
              disabled={isLoading}
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              className="btn-outline p-2"
              disabled={isLoading}
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <button
              type="submit"
              disabled={!newMessage.trim() || isLoading}
              className="btn-primary p-2 relative"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;