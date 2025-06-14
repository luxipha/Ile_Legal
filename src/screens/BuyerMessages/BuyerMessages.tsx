import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
// Import used components as needed
import { Header } from "../../components/Header";
import { BuyerSidebar } from "../../components/BuyerSidebar/BuyerSidebar";
import { 
  ArrowLeftIcon,
  SendIcon,
  PaperclipIcon,
  MoreVerticalIcon,
  PhoneIcon,
  VideoIcon,
  FileTextIcon,
  SearchIcon,
  MessageSquareIcon
} from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "other";
  timestamp: string;
  type?: "text" | "file";
  fileName?: string;
}

interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  avatar: string;
  online: boolean;
  messages: Message[];
  gigTitle?: string; // Add gig context
}

export const BuyerMessages = (): JSX.Element => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Load conversations from localStorage on component mount
  useEffect(() => {
    // Load stored conversations from localStorage
    const storedConversations = localStorage.getItem('buyerConversations');
    if (storedConversations) {
      try {
        const parsedConversations = JSON.parse(storedConversations);
        
        // Convert the stored conversations to our Conversation interface format
        const formattedConversations: Conversation[] = parsedConversations.map((conv: any) => ({
          id: conv.id,
          name: conv.name,
          lastMessage: conv.lastMessage,
          timestamp: conv.timestamp,
          unread: false, // Default to not unread since we're viewing them
          avatar: conv.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
          online: Math.random() > 0.5, // Randomly set online status for demo
          gigTitle: conv.gigTitle,
          messages: conv.messages.map((msg: any) => ({
            id: msg.id,
            text: msg.text,
            sender: msg.sender,
            timestamp: msg.timestamp,
            type: msg.type || 'text',
            fileName: msg.fileName
          }))
        }));
        
        // Combine with default conversations
        setConversations([...defaultConversations, ...formattedConversations]);
      } catch (error) {
        console.error('Error parsing stored conversations:', error);
        setConversations(defaultConversations);
      }
    } else {
      setConversations(defaultConversations);
    }
  }, []);
  
  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > defaultConversations.length) {
      const conversationsToStore = conversations.slice(defaultConversations.length);
      localStorage.setItem('buyerConversations', JSON.stringify(conversationsToStore));
    }
  }, [conversations]);

  // Default example conversations for demo purposes
  const defaultConversations: Conversation[] = [
    {
      id: 1,
      name: "Chioma Okonkwo",
      lastMessage: "I've completed the title verification report.",
      timestamp: "Jun 2, 7:30 PM",
      unread: true,
      avatar: "CO",
      online: true,
      gigTitle: "Land Title Verification - Victoria Island",
      messages: [
        {
          id: 1,
          text: "Hello! I'm interested in your land title verification project. I have extensive experience with Victoria Island properties.",
          sender: "other",
          timestamp: "6:35 PM"
        },
        {
          id: 2,
          text: "Hi Chioma! Thank you for your interest. Could you provide more details about your experience with similar projects?",
          sender: "user",
          timestamp: "6:37 PM"
        },
        {
          id: 3,
          text: "I've handled over 50 title verifications in Victoria Island over the past 5 years. I have direct contacts at the land registry which helps expedite the process.",
          sender: "other",
          timestamp: "6:39 PM"
        },
        {
          id: 4,
          text: "That sounds excellent. When would you be able to start if we proceed?",
          sender: "user",
          timestamp: "6:40 PM"
        },
        {
          id: 5,
          text: "I can start immediately. I've completed the title verification report.",
          sender: "other",
          timestamp: "7:30 PM"
        },
        {
          id: 6,
          text: "title_verification_report.pdf",
          sender: "other",
          timestamp: "7:30 PM",
          type: "file",
          fileName: "title_verification_report.pdf"
        }
      ]
    },
    {
      id: 2,
      name: "Adebayo Ogundimu",
      lastMessage: "When would you like to schedule a call to discuss the contract details?",
      timestamp: "Jun 1, 2:30 PM",
      unread: false,
      avatar: "AO",
      online: false,
      gigTitle: "Contract Review for Commercial Lease",
      messages: [
        {
          id: 1,
          text: "Hi, I saw your contract review project and would like to discuss the scope.",
          sender: "other",
          timestamp: "2:15 PM"
        },
        {
          id: 2,
          text: "Hello Adebayo! I'd be happy to discuss. What specific aspects would you like to know about?",
          sender: "user",
          timestamp: "2:18 PM"
        },
        {
          id: 3,
          text: "When would you like to schedule a call to discuss the contract details?",
          sender: "other",
          timestamp: "2:30 PM"
        }
      ]
    },
    {
      id: 3,
      name: "Funmi Adebisi",
      lastMessage: "I can provide a comprehensive analysis within 3 days.",
      timestamp: "May 30, 4:45 PM",
      unread: false,
      avatar: "FA",
      online: true,
      gigTitle: "Property Due Diligence",
      messages: [
        {
          id: 1,
          text: "I'm interested in your property due diligence project. I specialize in commercial properties.",
          sender: "other",
          timestamp: "4:30 PM"
        },
        {
          id: 2,
          text: "Great! What's your typical timeline for due diligence projects?",
          sender: "user",
          timestamp: "4:35 PM"
        },
        {
          id: 3,
          text: "I can provide a comprehensive analysis within 3 days.",
          sender: "other",
          timestamp: "4:45 PM"
        }
      ]
    }
  ];

  const selectedConv = conversations.find(conv => conv.id === selectedConversation);

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      // Find the selected conversation
      const updatedConversations = [...conversations];
      const convIndex = updatedConversations.findIndex(c => c.id === selectedConversation);
      
      if (convIndex >= 0) {
        const conv = {...updatedConversations[convIndex]};
        const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Create a new message
        const newMsg = {
          id: conv.messages.length > 0 ? Math.max(...conv.messages.map(m => m.id)) + 1 : 1,
          text: newMessage.trim(),
          sender: "user" as const,
          timestamp
        };
        
        // Add message to conversation
        conv.messages = [...conv.messages, newMsg];
        conv.lastMessage = newMessage.trim();
        conv.timestamp = new Date().toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: 'numeric', 
          minute: 'numeric', 
          hour12: true 
        });
        
        updatedConversations[convIndex] = conv;
        setConversations(updatedConversations);
        
        // In a real app, this would also send the message to the backend
        setNewMessage("");
        
        // If this is from a bid conversation, update the stored conversations
        if (convIndex >= defaultConversations.length) {
          const conversationsToStore = updatedConversations.slice(defaultConversations.length);
          localStorage.setItem('buyerConversations', JSON.stringify(conversationsToStore));
        }
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <BuyerSidebar activePage="messages" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title="Messages" userName="Demo Client" userType="buyer" />

        {/* Messages Content */}
        <main className="flex-1 flex">
          {/* Messages List - 25% when chat is open, 100% when closed */}
          <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
            selectedConversation ? 'w-1/4' : 'w-full'
          }`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
                {selectedConversation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative mb-6">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                />
              </div>

              {/* Conversations List */}
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedConversation === conversation.id ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                          {conversation.avatar}
                        </div>
                        {conversation.online && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{conversation.name}</h3>
                          <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                        </div>
                        {conversation.gigTitle && (
                          <p className="text-xs text-blue-600 mb-1 truncate">Re: {conversation.gigTitle}</p>
                        )}
                        <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                      </div>
                      
                      {conversation.unread && (
                        <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Interface - 75% when open */}
          {selectedConversation && selectedConv && (
            <div className="flex-1 flex flex-col bg-white">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedConversation(null)}
                      className="mr-2"
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                    </Button>
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                        {selectedConv.avatar}
                      </div>
                      {selectedConv.online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedConv.name}</h3>
                      <p className="text-sm text-gray-500">
                        {selectedConv.online ? 'Online' : 'Last seen recently'}
                      </p>
                      {selectedConv.gigTitle && (
                        <p className="text-xs text-blue-600">Re: {selectedConv.gigTitle}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <PhoneIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <VideoIcon className="w-4 h-4" />
                    </Button>
                    <div className="relative">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                      >
                        <MoreVerticalIcon className="w-4 h-4" />
                      </Button>
                      
                      {showDeleteConfirm && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            onClick={() => {
                              // In a real app, this would delete the conversation from the backend
                              setSelectedConversation(null);
                              setShowDeleteConfirm(false);
                            }}
                          >
                            Delete chat
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConv.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-[#1B1828] text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.type === 'file' ? (
                        <div className="flex items-center gap-2">
                          <FileTextIcon className="w-4 h-4 text-[#FEC85F]" />
                          <span className="text-sm">{message.fileName}</span>
                        </div>
                      ) : (
                        <p className="text-sm">{message.text}</p>
                      )}
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-end gap-3">
                  <Button variant="ghost" size="sm" className="mb-2">
                    <PaperclipIcon className="w-5 h-5 text-gray-400" />
                  </Button>
                  
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                      rows={1}
                    />
                  </div>
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] p-3 rounded-lg"
                  >
                    <SendIcon className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State when no conversation is selected */}
          {!selectedConversation && (
            <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquareIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};