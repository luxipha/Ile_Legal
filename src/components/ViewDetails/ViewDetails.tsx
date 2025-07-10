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
  PaperclipIcon,
  UserIcon,
  AlertTriangleIcon
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
  
  // Buyer profile data from API join
  buyer?: {
    id: string;
    email?: string;
    name?: string;
    created_at?: string;
    verification_status?: string;
    avatar_url?: string;
    profile_picture?: string;
    first_name?: string;
    last_name?: string;
  };
  
  // Additional fields from second component
  location?: string;
  deliveryTime?: string;
  requirements?: string[];
  companyRating?: number;
  projectsPosted?: number;
  
  // Attachments
  attachments?: string[];
  
  // New field from the code block
  is_flagged: boolean;
  
  // Avatar field for buyer profile picture
  avatar?: string;
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
  console.log("gig:", gig);
  console.log(gig.buyer);
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

  // Helper function to format deadline date
  const getFormattedDeadline = (): string => {
    if (!gig.deadline) return "Not specified";
    try {
      const date = new Date(gig.deadline);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.log("error:", error);
      return gig.deadline; // Fallback to original if parsing fails
    }
  };

  // Helper function to get buyer's profile picture
  const getBuyerProfilePicture = (): string | null => {
    if (gig.avatar) return gig.avatar;
    return null;
  };

  // Helper function to get buyer's display name
  const getBuyerDisplayName = (): string => {
    if (gig.buyer?.first_name && gig.buyer?.last_name) {
      return `${gig.buyer.first_name} ${gig.buyer.last_name}`;
    }
    if (gig.buyer?.first_name) return gig.buyer.first_name;
    if (gig.buyer?.last_name) return gig.buyer.last_name;
    if (gig.buyer?.name) return gig.buyer.name;
    if (gig.company) return gig.company;
    return 'Client';
  };

  // Helper function to get buyer's initials
  const getBuyerInitials = (): string => {
    const displayName = getBuyerDisplayName();
    if (displayName === 'Client') return 'C';
    
    const words = displayName.split(' ');
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
    }
    return displayName.charAt(0).toUpperCase();
  };

  // Fetch bids using API and enrich with seller profile data
  useEffect(() => {
    const fetchBids = async () => {
      if (activeTab === "bids" && api?.bids?.getBidsByGigId) {
        try {
          setLoading(true);
          setError(null);
          const bidsData = await api.bids.getBidsByGigId(gig.id);
          
          // Enrich bids with real seller profile data
          const enrichedBids = await Promise.all(
            bidsData.map(async (bid: any) => {
              try {
                // Get seller profile data from Profiles table (accessible to all users)
                const { supabase } = await import('../../lib/supabase');
                const { data: profileData } = await supabase
                  .from('Profiles')
                  .select('*')
                  .eq('id', bid.seller_id)
                  .single();
                
                if (profileData) {
                  return {
                    ...bid,
                    seller: {
                      full_name: profileData.name || `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Anonymous Seller',
                      avatar: profileData.avatar_url || profileData.name?.charAt(0)?.toUpperCase() || 'S',
                      rating: profileData.rating || 0,
                      completed_jobs: profileData.completed_jobs || 0
                    },
                    title: profileData.title || 'Legal Professional'
                  };
                }
                return {
                  ...bid,
                  seller: {
                    full_name: 'Anonymous Seller',
                    avatar: 'S',
                    rating: 0,
                    completed_jobs: 0
                  },
                  title: 'Legal Professional'
                };
              } catch (profileError) {
                console.log('Could not load seller profile for bid:', bid.id);
                return {
                  ...bid,
                  seller: {
                    full_name: 'Anonymous Seller',
                    avatar: 'S',
                    rating: 0,
                    completed_jobs: 0
                  },
                  title: 'Legal Professional'
                };
              }
            })
          );
          
          setBids(enrichedBids);
        } catch (err) {
          console.error('Error fetching bids:', err);
          setError('Failed to load bids. Please try again.');
          setBids([]);
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
      // Determine if current user is buyer or seller
      const isCurrentUserBuyer = user.id === buyerId;
      
      let conversation;
      if (isCurrentUserBuyer) {
        // Current user is the buyer - need to specify which seller to message
        // This case should redirect to Bids tab for seller selection
        addToast?.("Please select a bidder from the Bids tab to start messaging", "info");
        setActiveTab("bids");
        return;
      } else {
        // Current user is a seller wanting to message the buyer
        conversation = await messagingService.getOrCreateConversation(
          buyerId,  // buyer_id
          user.id,  // seller_id (current user)
          gig.id
        );
      }
      
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
    console.log("bid:", bid);
    const name = bid.seller?.full_name || bid.name || 'Anonymous';
    const title = bid.title || 'Professional';
    const rating = bid.seller?.rating || 0;
    const completedJobs = bid.seller?.completed_jobs || 0;
    const amount = bid.amount ? `₦${bid.amount.toLocaleString()}` : 'Not specified';
    const submittedDate = bid.created_at ? new Date(bid.created_at).toLocaleDateString() : bid.submittedDate || 'Unknown';
    const proposal = bid.description || bid.proposal || 'No proposal provided';
    const avatar = bid.seller?.avatar || bid.avatar || name.charAt(0);
    const isRejected = bid.status === 'rejected';
    const isAccepted = bid.status === 'accepted';

    return (
      <Card key={bid.id} className={`border ${isRejected ? 'border-red-200 bg-red-50' : isAccepted ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700 overflow-hidden">
              {avatar.startsWith('http') ? (
                <img 
                  src={avatar} 
                  alt={`${name}'s avatar`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className={avatar.startsWith('http') ? 'hidden' : ''}>
                {avatar}
              </span>
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
              
              {/* Status Badge */}
              {(isRejected || isAccepted) && (
                <div className="mb-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    isRejected 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {isRejected ? 'Rejected' : 'Accepted'}
                  </span>
                </div>
              )}
              
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
            <p className={`${isRejected ? 'text-gray-500' : 'text-gray-600'}`}>{proposal}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-full sm:max-w-6xl mx-auto px-3 sm:px-6 overflow-hidden">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 sm:mb-6 p-2 sm:p-3"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        <span className="text-sm sm:text-base">{backButtonText}</span>
      </Button>

      {/* Title and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2 break-words">{gig.title}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-gray-600 text-sm sm:text-base">
            <span>Posted {getPostedDate()}</span>
            <span>Deadline {getFormattedDeadline()}</span>
            <span>Budget {getBudget()}</span>
          </div>
        </div>
        <span className={
          getStatus() === 'pending'
            ? 'bg-[#FEC85F] text-[#1B1828] px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-medium text-sm sm:text-base self-start sm:self-auto'
            : getStatus() === 'paused'
              ? 'bg-gray-300 text-gray-800 px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-medium text-sm sm:text-base self-start sm:self-auto'
              : 'bg-gray-200 text-gray-500 px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-medium text-sm sm:text-base self-start sm:self-auto'
        }>
          {getStatus() === 'pending'
            ? 'Open for Bids'
            : getStatus() === 'paused'
              ? 'Paused'
              : 'Closed'}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4 sm:mb-6 overflow-hidden">
        <div className="overflow-x-auto -mb-px">
          <nav className="flex gap-4 sm:gap-8 min-w-max sm:min-w-0">
          {[
            { id: "details", label: "Details" },
            { id: "bids", label: `Bids (${getBidCount()})` },
            { id: "messages", label: "Messages" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 sm:pb-4 px-2 sm:px-0 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
      </div>

      {/* Tab Content */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-8">
        {/* Main Content - 2/3 width on desktop */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          {activeTab === "details" && (
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Description</h3>
              <p className="text-gray-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">{gig.description}</p>
              
              {/* Categories */}
              {getCategories().length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {getCategories().map((category, index) => (
                      <span
                        key={index}
                        className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-sm"
                      >
                        {category.replace('-', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements (from second component) */}
              {gig.requirements && gig.requirements.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Requirements</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm sm:text-base">
                    {gig.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Location */}
              {gig.location && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Location</h4>
                  <p className="text-gray-600 text-sm sm:text-base">{gig.location}</p>
                </div>
              )}

              {/* Attachments */}
              {gig.attachments && gig.attachments.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Attachments</h4>
                  <div className="space-y-2 sm:space-y-3">
                    {gig.attachments.map((attachmentUrl, index) => {
                      // Extract filename from URL
                      const filename = attachmentUrl.split('/').pop()?.split('?')[0] || `attachment-${index + 1}`;
                      
                      // Smart filename shortening for mobile responsiveness
                      let displayName = filename;
                      const hasToken = attachmentUrl.includes('?') || attachmentUrl.includes('token=');
                      
                      // More aggressive truncation for mobile and to prevent overflow
                      if (filename.length > 20) {
                        const extension = filename.split('.').pop();
                        const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'));
                        const maxNameLength = hasToken ? 12 : 15; // Leave room for token indicator if needed
                        displayName = `${nameWithoutExt.slice(0, maxNameLength)}...${extension ? `.${extension}` : ''}`;
                      }
                      
                      // Add token indicator only if there's a query string and room for it
                      if (hasToken && displayName.length < 18) {
                        displayName += '...⚡';
                      }
                      
                      return (
                        <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 w-full">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 truncate text-sm sm:text-base" title={filename}>{displayName}</div>
                              <div className="text-xs sm:text-sm text-gray-500">Document</div>
                            </div>
                          </div>
                          <div className="flex gap-1 sm:gap-2 flex-shrink-0 ml-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(attachmentUrl, '_blank')}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 px-2 sm:px-3 text-xs sm:text-sm"
                            >
                              View
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = attachmentUrl;
                                link.download = filename;
                                link.click();
                              }}
                              className="text-green-600 hover:text-green-700 hover:bg-green-100 px-2 sm:px-3 text-xs sm:text-sm"
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
              {(() => {
                const buyerId = getBuyerId();
                const isCurrentUserBuyer = user?.id === buyerId;
                
                if (isCurrentUserBuyer) {
                  // Buyer view - show bidder list
                  return (
                    <>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Bidder Messages</h3>
                      {loading ? (
                        <div className="text-center py-8">Loading conversations...</div>
                      ) : bids.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No bids yet. Once you receive bids, you can message bidders from the Bids tab.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-gray-600 mb-4">
                            To message a specific bidder, go to the Bids tab and click "Message" on their bid.
                          </p>
                          <div className="grid gap-4">
                            {bids.map((bid) => (
                              <Card key={bid.id} className="border border-gray-200 hover:border-gray-300 transition-colors">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                                        {bid.seller?.avatar || 'S'}
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-gray-900">
                                          {bid.seller?.full_name || 'Anonymous Seller'}
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                          Bid: {typeof bid.amount === 'string' ? bid.amount : `₦${bid.amount?.toLocaleString()}`}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      onClick={() => setActiveTab("bids")}
                                      variant="outline"
                                      size="sm"
                                      className="border-[#1B1828] text-[#1B1828] hover:bg-[#1B1828]/10"
                                    >
                                      View & Message
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                } else {
                  // Seller view - show direct messaging with buyer
                  return (
                    <>
                      <div className="flex items-center gap-4 p-4 border-b border-gray-200 bg-[#1B1828]/5 mb-4">
                        <div className="w-12 h-12 bg-[#FEC85F]/20 rounded-full flex items-center justify-center text-sm font-medium text-[#1B1828]">
                          {getBuyerInitials()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#1B1828]">{getBuyerDisplayName()}</h4>
                          <p className="text-gray-600">Gig Owner</p>
                        </div>
                      </div>
                      
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
                    </>
                  );
                }
              })()}
            </div>
          )}
        </div>

        {/* Sidebar - 1/3 width on desktop, full width on mobile */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <Card className="border border-gray-200 mb-4 lg:mb-6">
            <CardContent className="p-4 lg:p-6">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-300 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  {getBuyerProfilePicture() ? (
                    <img
                      src={getBuyerProfilePicture()!}
                      alt={getBuyerDisplayName()}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gray-600">
                      {getBuyerInitials()}
                    </span>
                  )}
                </div>
                
                {/* Company info */}
                {gig.company && (
                  <>
                    <h3 className="font-semibold text-gray-900 mb-2">{gig.company}</h3>
                    {gig.companyRating && (
                      <div className="flex items-center justify-center gap-1 mb-2">
                        {renderStars(Math.floor(gig.companyRating))}
                        <span className="text-sm text-gray-600 ml-1">{gig.companyRating}</span>
                      </div>
                    )}
                    {gig.projectsPosted && (
                      <p className="text-sm text-gray-600 mb-4">{gig.projectsPosted} projects posted</p>
                    )}
                  </>
                )}

                {/* Gig details */}
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Status: <span className="font-medium">{getStatus()}</span></p>
                  <p>Posted: <span className="font-medium">{getPostedDate()}</span></p>
                  <p>Deadline: <span className="font-medium">{getFormattedDeadline()}</span></p>
                  <p>Budget: <span className="font-medium">{getBudget()}</span></p>
                  {gig.deliveryTime && (
                    <p>Delivery: <span className="font-medium">{gig.deliveryTime}</span></p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Only show Place Bid button if showPlaceBid is true and gig is pending */}
          {showPlaceBid && getStatus() === 'pending' && getStatus() !== 'suspended' && (
            <>
              {user?.user_metadata?.verification_status === "verified" ? (
                <Button
                  onClick={() => onPlaceBid(gig)}
                  className="w-full bg-[#1B1828] hover:bg-[#1B1828]/90 text-white py-3 mb-4"
                >
                  Place Bid
                </Button>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangleIcon className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Account Verification Required</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Your account needs to be verified before you can place bids. Please contact support to complete verification.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};