import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { api } from "../../services/api";
import { useAuth } from '../../contexts/AuthContext';
import { messagingService } from '../../services/messagingService';
import { useToast } from "../ui/toast";
import { 
  ArrowLeftIcon,
  StarIcon,
  BuildingIcon,
  SendIcon,
  PaperclipIcon
} from "lucide-react";

// Unified Gig interface that supports both data structures
export interface Gig {
  id: string;
  title: string;
  description: string;
  
  // Budget fields (supporting both formats)
  budget?: number; // From first component
  price?: string;  // From second component (alternative)
  
  // Date fields (supporting both formats)
  deadline: string;
  created_at?: string;    // From first component
  postedDate?: string;    // From second component
  posted?: string;        // From second component (alternative)
  
  // Status and categories
  status?: string;        // From first component
  categories?: string[];  // From first component
  category?: string;      // From second component (single category)
  
  // Company/Buyer information
  buyer_id?: string;      // From first component
  buyerId?: string;       // From second component
  company?: string;       // From second component
  
  // Additional fields from second component
  location?: string;
  deliveryTime?: string;
  requirements?: string[];
  companyRating?: number;
  projectsPosted?: number;
  
  // Attachments
  attachments?: string[];
}

// Unified Bid interface
interface Bid {
  id: string;
  gig_id?: string;        // From first component
  seller_id?: string;     // From first component
  userId?: string;        // From second component
  amount?: number;        // From first component
  description?: string;   // From first component
  status?: string;        // From first component
  created_at?: string;    // From first component
  
  // Seller information (supporting both structures)
  seller?: {
    full_name: string;
    rating: number;
    completed_jobs: number;
    avatar?: string;
  };
  
  // Alternative structure from second component
  name?: string;
  title?: string;
  rating?: number;
  completedJobs?: number;
  proposal?: string;
  deliveryTime?: string;
  submittedDate?: string;
  avatar?: string;
}

// Message interface
interface Message {
  id: string;
  text: string;
  sender: "user" | "client";
  timestamp: string;
  pending?: boolean;
}

interface ViewDetailsProps {
  gig: Gig;
  onBack: () => void;
  onPlaceBid: (gig: Gig) => void;
  backButtonText?: string;
  showPlaceBid?: boolean;
  bidCount?: number;
}

export const ViewDetails: React.FC<ViewDetailsProps> = ({ 
  gig, 
  onBack, 
  onPlaceBid,
  backButtonText = "Back",
  showPlaceBid = true,
  bidCount
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  // UI state
  const [activeTab, setActiveTab] = useState<"details" | "bids" | "messages">("details");
  const [newMessage, setNewMessage] = useState("");
  
  // Bids state (from first component's API integration)
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Messaging state (from second component)
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<Set<string>>(new Set());

  // Helper functions for data normalization
  const getBudget = (): string => {
    if (gig.budget) return `₦${gig.budget.toLocaleString()}`;
    if (gig.price) return gig.price;
    return "Not specified";
  };

  const getPostedDate = (): string => {
    if (gig.created_at) return new Date(gig.created_at).toLocaleDateString();
    if (gig.postedDate) return gig.postedDate;
    if (gig.posted) return gig.posted;
    return "Unknown";
  };

  const getBuyerId = (): string | undefined => {
    return gig.buyer_id || gig.buyerId;
  };

  const getCategories = (): string[] => {
    if (gig.categories) return gig.categories;
    if (gig.category) return [gig.category];
    return [];
  };

  const getStatus = (): string => {
    return gig.status || 'active';
  };

  const getBidCount = (): number => {
    return bidCount ?? bids.length;
  };

  // Fetch bids using API (from first component)
  useEffect(() => {
    const fetchBids = async () => {
      if (activeTab === "bids" && api?.bids?.getBidsByGigId) {
        try {
          setLoading(true);
          setError(null);
          const data = await api.bids.getBidsByGigId(gig.id);
          setBids(data);
        } catch (err) {
          console.error('Error fetching bids:', err);
          setError('Failed to load bids. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchBids();
  }, [activeTab, gig.id]);

  // Load or create conversation when switching to messages tab (from second component)
  useEffect(() => {
    if (activeTab === "messages" && user?.id && getBuyerId()) {
      loadConversation();
    }
  }, [activeTab, user?.id, getBuyerId()]);
  
  // Set up subscription to new messages (from second component)
  useEffect(() => {
    if (!activeConversation || !user?.id || !messagingService?.subscribeToMessages) return;
    
    const subscription = messagingService.subscribeToMessages(
      activeConversation,
      (payload) => {
        const newMessage = payload.new;
        
        if (newMessage) {
          const formattedMessage: Message = {
            id: newMessage.id,
            text: newMessage.content,
            sender: newMessage.sender_id === user.id ? "user" : "client",
            timestamp: new Date(newMessage.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          };
          
          if (newMessage.sender_id === user.id) {
            setMessages(prev => {
              const pendingMsg = prev.find(msg => msg.pending === true);
              if (pendingMsg && pendingMessages.has(pendingMsg.id)) {
                return prev.map(msg => 
                  msg.id === pendingMsg.id ? formattedMessage : msg
                );
              }
              return [...prev, formattedMessage];
            });
          } else {
            setMessages(prev => [...prev, formattedMessage]);
            
            // Mark messages as read if the method exists
            if ('markMessagesAsRead' in messagingService && typeof messagingService.markMessagesAsRead === 'function') {
              messagingService.markMessagesAsRead(activeConversation, user.id)
                .catch((error: any) => {
                  console.error("Error marking messages as read:", error);
                });
            }
          }
        }
      }
    );
    
    return () => {
      subscription?.unsubscribe?.();
    };
  }, [activeConversation, user?.id, pendingMessages]);
  
  // Load conversation between seller and buyer
  const loadConversation = async () => {
    const buyerId = getBuyerId();
    if (!user?.id || !buyerId || !messagingService?.getOrCreateConversation) {
      addToast?.("Cannot load conversation: missing user information", "error");
      return;
    }
    
    setIsLoadingMessages(true);
    
    try {
      const conversation = await messagingService.getOrCreateConversation(
        buyerId,
        user.id,
        gig.id
      );
      
      setActiveConversation(conversation.id);
      
      if (messagingService.getMessages) {
        const conversationMessages = await messagingService.getMessages(conversation.id);
        
        // Mark messages as read if the method exists
        if ('markMessagesAsRead' in messagingService && typeof messagingService.markMessagesAsRead === 'function') {
          await messagingService.markMessagesAsRead(conversation.id, user.id);
        }
        
        const formattedMessages: Message[] = conversationMessages.map(msg => ({
          id: msg.id,
          text: msg.content,
          sender: msg.sender_id === user.id ? "user" : "client",
          timestamp: new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }));
        
        setMessages(formattedMessages);
      }
      
      addToast?.("Conversation loaded successfully", "success");
      
    } catch (error) {
      console.error("Error loading conversation:", error);
      addToast?.("Failed to load conversation", "error");
    } finally {
      setIsLoadingMessages(false);
    }
  };
  
  // Handle sending a new message
  const handleSendMessage = async () => {
    if (newMessage.trim() && user?.id && messagingService?.sendMessage) {
      setIsSending(true);
      
      const tempId = `temp-${Date.now()}`;
      const messageContent = newMessage.trim();
      
      try {
        if (!activeConversation && getBuyerId() && messagingService.getOrCreateConversation) {
          try {
            const conversation = await messagingService.getOrCreateConversation(
              getBuyerId()!,
              user.id,
              gig.id
            );
            setActiveConversation(conversation.id);
          } catch (error) {
            console.error("Failed to create conversation:", error);
            addToast?.("Failed to create conversation", "error");
            return;
          }
        }
        
        if (activeConversation) {
          setPendingMessages(prev => new Set([...prev, tempId]));
          
          const newMsg: Message = {
            id: tempId,
            text: messageContent,
            sender: "user",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            pending: true
          };
          
          setMessages(prev => [...prev, newMsg]);
          setNewMessage("");
          
          await messagingService.sendMessage(
            activeConversation,
            user.id,
            messageContent
          );
          
          setPendingMessages(prev => {
            const updated = new Set([...prev]);
            updated.delete(tempId);
            return updated;
          });
          
          addToast?.("Message sent successfully", "success");
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        addToast?.("Failed to send message", "error");
        
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        setPendingMessages(prev => {
          const updated = new Set([...prev]);
          updated.delete(tempId);
          return updated;
        });
      } finally {
        setIsSending(false);
      }
    } else if (!newMessage.trim()) {
      addToast?.("Please enter a message", "info");
    } else if (!user?.id) {
      addToast?.("You need to be logged in to send messages", "error");
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  // Render individual bid (supporting both data structures)
  const renderBid = (bid: Bid) => {
    const name = bid.seller?.full_name || bid.name || 'Anonymous';
    const title = bid.title || 'Professional';
    const rating = bid.seller?.rating || bid.rating || 0;
    const completedJobs = bid.seller?.completed_jobs || bid.completedJobs || 0;
    const amount = bid.amount ? `₦${bid.amount.toLocaleString()}` : 'Not specified';
    const submittedDate = bid.created_at ? new Date(bid.created_at).toLocaleDateString() : bid.submittedDate || 'Unknown';
    const proposal = bid.description || bid.proposal || 'No proposal provided';
    const avatar = bid.seller?.avatar || bid.avatar || name.charAt(0);

    return (
      <Card key={bid.id} className="border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
              {avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{name}</h4>
                  <p className="text-gray-600">{title}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{amount}</div>
                  {bid.deliveryTime && (
                    <div className="text-sm text-gray-500">{bid.deliveryTime}</div>
                  )}
                  <div className="text-sm text-gray-500">
                    Submitted: {submittedDate}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  {renderStars(Math.floor(rating))}
                  <span className="text-sm text-gray-600 ml-1">{rating}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {completedJobs} jobs completed
                </span>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h5 className="font-medium text-gray-900 mb-2">Proposal</h5>
            <p className="text-gray-600">{proposal}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        {backButtonText}
      </Button>

      {/* Title and Status */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{gig.title}</h1>
          <div className="flex items-center gap-6 text-gray-600">
            <span>Posted {getPostedDate()}</span>
            <span>Deadline {gig.deadline}</span>
            <span>Budget {getBudget()}</span>
          </div>
        </div>
        <span className="bg-[#FEC85F] text-[#1B1828] px-4 py-2 rounded-lg font-medium">
          {getStatus() === 'active' ? 'Open for Bids' : 'Closed'}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          {[
            { id: "details", label: "Details" },
            { id: "bids", label: `Bids (${getBidCount()})` },
            { id: "messages", label: "Messages" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#FEC85F] text-[#1B1828]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-3 gap-8">
        {/* Main Content - 2/3 width */}
        <div className="col-span-2">
          {activeTab === "details" && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">{gig.description}</p>
              
              {/* Categories */}
              {getCategories().length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {getCategories().map((category, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {category.replace('-', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements (from second component) */}
              {gig.requirements && gig.requirements.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600">
                    {gig.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Location */}
              {gig.location && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Location</h4>
                  <p className="text-gray-600">{gig.location}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "bids" && (
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B1828] mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading bids...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={() => setActiveTab("bids")}>Try Again</Button>
                </div>
              ) : bids.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No bids have been placed yet.</p>
                </div>
              ) : (
                bids.map(renderBid)
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div className="space-y-4">
              {/* Messages */}
              <div className="h-96 overflow-y-auto space-y-4 mb-6 border border-gray-200 rounded-lg bg-gray-50 p-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B1828]"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                          message.sender === 'user'
                            ? message.pending 
                              ? 'bg-[#1B1828]/70 text-white' 
                              : 'bg-[#1B1828] text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <div className="flex items-center justify-between">
                          <p className={`text-xs mt-1 ${
                            message.sender === 'user' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            {message.timestamp}
                          </p>
                          {message.pending && (
                            <span className="ml-2 text-xs text-gray-300">Sending...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="flex items-end gap-3 p-4 border border-gray-200 rounded-lg">
                <Button variant="ghost" size="sm" disabled={isSending}>
                  <PaperclipIcon className="w-5 h-5 text-gray-400" />
                </Button>
                
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full px-3 py-2 border-0 resize-none focus:outline-none"
                    rows={1}
                    disabled={isSending}
                  />
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] p-2 relative"
                >
                  {isSending ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-b-transparent border-white rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <SendIcon className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="col-span-1">
          <Card className="border border-gray-200 mb-6">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BuildingIcon className="w-8 h-8 text-gray-600" />
                </div>
                
                {/* Company info (from second component) or gig details (from first component) */}
                {gig.company ? (
                  <>
                    <h3 className="font-semibold text-gray-900 mb-2">{gig.company}</h3>
                    {gig.companyRating && (
                      <div className="flex items-center justify-center gap-1 mb-2">
                        {renderStars(Math.floor(gig.companyRating))}
                        <span className="text-sm text-gray-600 ml-1">{gig.companyRating}</span>
                      </div>
                    )}
                    {gig.projectsPosted && (
                      <p className="text-sm text-gray-600">{gig.projectsPosted} projects posted</p>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold text-gray-900 mb-2">Gig Details</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Status: <span className="font-medium">{getStatus()}</span></p>
                      <p>Posted: <span className="font-medium">{getPostedDate()}</span></p>
                      <p>Deadline: <span className="font-medium">{gig.deadline}</span></p>
                      <p>Budget: <span className="font-medium">{getBudget()}</span></p>
                      {gig.deliveryTime && (
                        <p>Delivery: <span className="font-medium">{gig.deliveryTime}</span></p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Only show Place Bid button if showPlaceBid is true and gig is active */}
          {showPlaceBid && getStatus() === 'active' && (
            <Button
              onClick={() => onPlaceBid(gig)}
              className="w-full bg-[#1B1828] hover:bg-[#1B1828]/90 text-white py-3 mb-4"
            >
              Place Bid
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};