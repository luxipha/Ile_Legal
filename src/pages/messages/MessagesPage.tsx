import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { User, Clock, ChevronRight, MessageSquare } from 'lucide-react';
import { ChatInterface } from '../../components/messaging/ChatInterface';
import { useAuth } from '../../contexts/AuthContext';

interface Conversation {
  id: string;
  recipientId: string;
  recipientName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const MessagesPage: React.FC = () => {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const [conversations] = useState<Conversation[]>([
    {
      id: 'conv-1',
      recipientId: 'user-1',
      recipientName: 'John Doe',
      lastMessage: 'Thanks for your help with the contract review.',
      lastMessageTime: '2025-06-02T14:30:00Z',
      unreadCount: 2
    },
    {
      id: 'conv-2',
      recipientId: 'user-2',
      recipientName: 'Sarah Williams',
      lastMessage: 'When can we schedule a call to discuss the case?',
      lastMessageTime: '2025-06-01T09:15:00Z',
      unreadCount: 0
    },
    {
      id: 'conv-3',
      recipientId: 'user-3',
      recipientName: 'Michael Johnson',
      lastMessage: 'I have attached the documents you requested.',
      lastMessageTime: '2025-05-31T16:45:00Z',
      unreadCount: 0
    }
  ]);

  useEffect(() => {
    // In a real implementation, this would fetch conversations from an API
    // For now, we're using the mock data initialized above
    // Example API call would be:
    // const fetchConversations = async () => {
    //   try {
    //     const response = await fetch('/api/conversations');
    //     const data = await response.json();
    //     setConversations(data);
    //   } catch (error) {
    //     console.error('Error fetching conversations:', error);
    //   }
    // };
    // fetchConversations();
  }, []);
  
  // If no conversation is selected, show the conversations list
  if (!conversationId) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Messages</h1>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {conversations.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {conversations.map((conversation) => (
                <Link 
                  key={conversation.id}
                  to={`/${user?.role || 'buyer'}/messages/${conversation.id}`}
                  className="block hover:bg-gray-50 transition-colors"
                >
                  <div className="p-4 flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary-100 text-primary-700 p-2 rounded-full">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium text-gray-900">{conversation.recipientName}</h3>
                          {conversation.unreadCount > 0 && (
                            <span className="ml-2 bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{conversation.lastMessage}</p>
                        <div className="flex items-center mt-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{format(new Date(conversation.lastMessageTime), 'MMM d, h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="inline-flex justify-center items-center p-4 bg-gray-100 rounded-full mb-4">
                <MessageSquare className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No conversations yet</h3>
              <p className="text-gray-500">When you start messaging with other users, your conversations will appear here.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Find the conversation details if it exists in our conversations list
  const currentConversation = conversations.find(conv => conv.id === conversationId);
  
  // If we don't have this conversation in our list but it starts with 'conv-', 
  // it's likely coming from a dashboard link, so we create temporary conversation data
  const isFromDashboard = conversationId?.startsWith('conv-');
  
  // Extract gig ID if it's from dashboard
  const gigId = isFromDashboard ? conversationId.replace('conv-', '') : null;
  
  // Get recipient information
  const recipientId = currentConversation?.recipientId || `provider-${gigId}`;
  const recipientName = currentConversation?.recipientName || 'Service Provider';
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Messages</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to={`/${user?.role || 'buyer'}/messages`} className="text-primary-500 hover:text-primary-600">
              <ChevronRight className="h-5 w-5 transform rotate-180" />
            </Link>
            <div className="flex items-center space-x-2">
              <div className="bg-primary-100 text-primary-700 p-2 rounded-full">
                <User className="h-5 w-5" />
              </div>
              <h2 className="font-medium text-gray-900">{recipientName}</h2>
            </div>
          </div>
        </div>
        <ChatInterface 
          recipientId={recipientId}
          conversationId={conversationId || ''}
        />
      </div>
    </div>
  );
};

export default MessagesPage;