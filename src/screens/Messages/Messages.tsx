import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Header } from "../../components/Header";
import { 
  UserIcon,
  SearchIcon,
  GavelIcon,
  MessageSquareIcon,
  DollarSignIcon,
  ArrowLeftIcon,
  SendIcon,
  PaperclipIcon,
  MoreVerticalIcon,
  PhoneIcon,
  VideoIcon,
  FileTextIcon
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
}

export const Messages = (): JSX.Element => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const conversations: Conversation[] = [
    {
      id: 1,
      name: "John Doe",
      lastMessage: "Thanks for your help with the contract review.",
      timestamp: "Jun 2, 7:30 PM",
      unread: true,
      avatar: "JD",
      online: true,
      messages: [
        {
          id: 1,
          text: "Hello, I need help with a contract review for my business.",
          sender: "other",
          timestamp: "6:35 PM"
        },
        {
          id: 2,
          text: "Hi there! I'd be happy help. Could you provide more details about the contract type?",
          sender: "user",
          timestamp: "6:37 PM"
        },
        {
          id: 3,
          text: "It is a partnership agreement for a tech startup. I want to make sure all the terms are fair and protect my interests.",
          sender: "other",
          timestamp: "6:39 PM"
        },
        {
          id: 4,
          text: "I understand. Partnership agreements are important to get right. Do you have the document ready to share?",
          sender: "user",
          timestamp: "6:40 PM"
        },
        {
          id: 5,
          text: "Yes, I can upload it now. It is about 15 pages long.",
          sender: "other",
          timestamp: "7:32 PM"
        },
        {
          id: 6,
          text: "partnership_agreement_draft.pdf",
          sender: "other",
          timestamp: "7:32 PM",
          type: "file",
          fileName: "partnership_agreement_draft.pdf"
        }
      ]
    },
    {
      id: 2,
      name: "Sarah Williams",
      lastMessage: "When can we schedule a call to discuss the case?",
      timestamp: "Jun 1, 2:30 PM",
      unread: false,
      avatar: "SW",
      online: false,
      messages: [
        {
          id: 1,
          text: "Hi, I saw your profile and would like to discuss a property matter.",
          sender: "other",
          timestamp: "2:15 PM"
        },
        {
          id: 2,
          text: "Hello! I'd be happy to help. What type of property matter are you dealing with?",
          sender: "user",
          timestamp: "2:18 PM"
        },
        {
          id: 3,
          text: "When can we schedule a call to discuss the case?",
          sender: "other",
          timestamp: "2:30 PM"
        }
      ]
    },
    {
      id: 3,
      name: "Michael Johnson",
      lastMessage: "Thanks for your help with the contract review.",
      timestamp: "Jun 5, 7:30 PM",
      unread: true,
      avatar: "MJ",
      online: false,
      messages: [
        {
          id: 1,
          text: "I need assistance with a commercial lease agreement.",
          sender: "other",
          timestamp: "7:15 PM"
        },
        {
          id: 2,
          text: "I can definitely help with that. Could you share the lease terms you're concerned about?",
          sender: "user",
          timestamp: "7:20 PM"
        },
        {
          id: 3,
          text: "Thanks for your help with the contract review.",
          sender: "other",
          timestamp: "7:30 PM"
        }
      ]
    },
    {
      id: 4,
      name: "Sarah Williams",
      lastMessage: "When can we schedule a call to discuss the case?",
      timestamp: "Jun 1, 2:30 PM",
      unread: false,
      avatar: "SW",
      online: true,
      messages: [
        {
          id: 1,
          text: "Following up on our previous conversation about the property survey.",
          sender: "other",
          timestamp: "2:25 PM"
        },
        {
          id: 2,
          text: "When can we schedule a call to discuss the case?",
          sender: "other",
          timestamp: "2:30 PM"
        }
      ]
    }
  ];

  const selectedConv = conversations.find(conv => conv.id === selectedConversation);

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      // In a real app, this would send the message to the backend
      setNewMessage("");
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
      <div className="w-64 bg-[#1B1828] text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <Link to="/" className="flex items-center gap-3">
            <div className="text-[#FEC85F] text-2xl font-bold">Ilé</div>
            <div className="text-gray-300 text-sm">
              Legal
              <br />
              Marketplace
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <Link to="/seller-dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                <UserIcon className="w-5 h-5" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/find-gigs" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                <SearchIcon className="w-5 h-5" />
                Find Gigs
              </Link>
            </li>
            <li>
              <Link to="/active-bids" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                <GavelIcon className="w-5 h-5" />
                Active Bids
              </Link>
            </li>
            <li>
              <Link to="/messages" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700 text-white">
                <MessageSquareIcon className="w-5 h-5" />
                Messages
              </Link>
            </li>
            <li>
              <Link to="/earnings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                <DollarSignIcon className="w-5 h-5" />
                Earnings
              </Link>
            </li>
            <li>
              <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                <UserIcon className="w-5 h-5" />
                Profile
              </Link>
            </li>
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-medium">Demo Seller</div>
              <div className="text-xs text-gray-400">seller@example.com</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title="Messages" />

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
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <PhoneIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <VideoIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVerticalIcon className="w-4 h-4" />
                    </Button>
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