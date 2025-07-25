import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate, formatUser } from '../../utils/formatters';
import { handleApiError } from '../../utils/apiHelpers';
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { useAuth } from '../../contexts/AuthContext';
import { messagingService } from '../../services/messagingService';
import { useToast } from "../ui/toast";
import { api } from "../../services/api";
import { 
  ArrowLeftIcon,
  StarIcon,
  BuildingIcon,
  PaperclipIcon,
  UserIcon
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "other";
  timestamp: string;
  pending?: boolean;
}

interface Bid {
  id: string;
  userId?: string; // Legacy field for compatibility
  seller_id?: string; // New API field
  name?: string; // Legacy field
  seller_name?: string; // New API field
  avatar?: string; // Legacy field
  seller_avatar?: string; // New API field
  title?: string; // Legacy field
  seller_title?: string; // New API field
  rating?: number; // Legacy field
  seller_rating?: number; // New API field
  completedJobs?: number; // Legacy field
  seller_completed_jobs?: number; // New API field
  amount: string | number;
  deliveryTime?: string;
  submittedDate?: string;
  created_at?: string; // New API field
  proposal?: string;
  description?: string; // New API field
  status?: 'pending' | 'accepted' | 'rejected';
}

interface Gig {
  id: string;
  title: string;
  company: string;
  price: string;
  deadline: string;
  category?: string;
  description: string;
  location?: string;
  posted?: string;
  postedDate: string;
  budget: string;
  deliveryTime: string;
  requirements: string[];
  companyRating: number;
  projectsPosted: number;
  is_flagged: boolean;
  status?: string;
  attachments?: string[]; // Add attachments field
  created_at?: string; // Add created_at field
}

// Extended messaging service interface to handle optional methods
interface ExtendedMessagingService {
  subscribeToMessages: (conversationId: string, callback: (payload: any) => void) => { unsubscribe: () => void };
  getOrCreateConversation: (buyerId: string, sellerId: string, gigId: string) => Promise<{ id: string }>;
  getMessages: (conversationId: string) => Promise<any[]>;
  sendMessage: (conversationId: string, userId: string, content: string) => Promise<any>;
  markMessagesAsRead?: (conversationId: string, userId: string) => Promise<void>;
}

/**
 * ViewBids component is primarily designed for BUYERS to view and manage bids on their gigs.
 * It displays a list of bids from sellers, allows messaging, and provides bid management.
 * This component should be used in the buyer dashboard for viewing bid details.
 */
interface ViewBidsProps {
  gig: Gig;
  onBack: () => void;
  backButtonText: string;
  // Optional prop to determine data source
  useStaticData?: boolean;
}

// Helper function to format dates in mm/dd/yyyy format
const formatDateMMDDYYYY = (dateString: string) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
};

export const ViewBids: React.FC<ViewBidsProps> = ({ 
  gig, 
  onBack, 
  backButtonText,
  useStaticData = false
}) => {
  
  const [activeTab, setActiveTab] = useState<string>("bids");
  const [activeBidder, setActiveBidder] = useState<string | null>(null);
  const [bidderMessages, setBidderMessages] = useState<Record<string, Message[]>>({});
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<Record<string, Set<string>>>({});
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(!useStaticData);
  const [error, setError] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerRating, setBuyerRating] = useState<number>(0);
  const [buyerGigsCount, setBuyerGigsCount] = useState<number>(0);
  const [buyerAvatar, setBuyerAvatar] = useState<string>('');
  const [loadingBuyerData, setLoadingBuyerData] = useState(false);
  
  const { user } = useAuth();
  const { addToast } = useToast();
  
  // Cast messaging service to extended interface
  const extendedMessagingService = messagingService as ExtendedMessagingService;
  

  // Helper functions to normalize bid data
  const getBidSellerId = (bid: Bid): string => bid.seller_id || bid.userId || bid.id;
  const getBidSellerName = (bid: Bid): string => bid.seller_name || bid.name || 'Anonymous';
  const getBidSellerAvatar = (bid: Bid): string => bid.seller_avatar || bid.avatar || 'U';
  const getBidSellerTitle = (bid: Bid): string => bid.seller_title || bid.title || 'Seller';
  const getBidSellerRating = (bid: Bid): number => bid.seller_rating || bid.rating || 0;
  const getBidSellerCompletedJobs = (bid: Bid): number => bid.seller_completed_jobs || bid.completedJobs || 0;
  const getBidAmount = (bid: Bid): string => {
    if (typeof bid.amount === 'string') return bid.amount;
    return `₦${bid.amount.toLocaleString()}`;
  };
  const getBidDescription = (bid: Bid): string => bid.description || bid.proposal || '';
  const getBidSubmittedDate = (bid: Bid): string => {
    if (bid.submittedDate) return bid.submittedDate;
    if (bid.created_at) return new Date(bid.created_at).toLocaleDateString();
    return 'Unknown';
  };

  // Load bids on component mount
  useEffect(() => {
    if (useStaticData) {
      // Static demo data (currently unused but kept for demo purposes)
      const staticBids: Bid[] = [
        {
          id: "demo-1",
          seller_name: "Demo Seller",
          amount: 50000,
          deliveryTime: "3 days",
          created_at: new Date().toISOString(),
          description: "Demo bid description",
          status: 'pending'
        }
      ];
      setBids(staticBids);
      setLoading(false);
    } else {
      loadBids();
    }
  }, [gig.id, useStaticData]);

  // Load buyer data
  useEffect(() => {
    const loadBuyerData = async () => {
      if (!user?.id || useStaticData) return;
      
      setLoadingBuyerData(true);
      try {
        // Get buyer name from user profile
        const { supabase } = await import('../../lib/supabase');
        const { data: profileData } = await supabase
          .from('Profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          const name = profileData.name || `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Anonymous Buyer';
          setBuyerName(name);
          setBuyerAvatar(profileData.avatar_url || profileData.name?.charAt(0)?.toUpperCase() || 'S');
        } else {
          setBuyerName('Anonymous Buyer');
          setBuyerAvatar('S');
        }

        // Get buyer's average rating
        const rating = await api.feedback.getAverageRating(user.id);
        setBuyerRating(rating);

        // Get buyer's gigs count
        const gigs = await api.gigs.getMyGigs(user.id);
        setBuyerGigsCount(gigs.length);
      } catch (error) {
        console.error('Error loading buyer data:', error);
        setBuyerName('Anonymous Buyer');
        setBuyerRating(0);
        setBuyerGigsCount(0);
        setBuyerAvatar('A');
      } finally {
        setLoadingBuyerData(false);
      }
    };

    loadBuyerData();
  }, [user?.id, useStaticData]);

  // Set up subscription to new messages (from first file)
  useEffect(() => {
    if (!activeConversation || !activeBidder || useStaticData) return;
    
    const subscription = extendedMessagingService.subscribeToMessages(
      activeConversation,
      (payload: any) => {
        const newMessage = payload.new;
        
        if (newMessage && activeBidder) {
          const formattedMessage: Message = {
            id: newMessage.id,
            text: newMessage.content,
            sender: newMessage.sender_id === user?.id ? "user" : "other",
            timestamp: new Date(newMessage.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          };
          
          if (newMessage.sender_id === user?.id) {
            setBidderMessages(prev => {
              const updated = { ...prev };
              if (updated[activeBidder]) {
                const pendingSet = pendingMessages[activeBidder] || new Set();
                if (pendingSet.size > 0) {
                  const oldestPending = updated[activeBidder].find(msg => msg.pending === true);
                  if (oldestPending) {
                    updated[activeBidder] = updated[activeBidder].map(msg => 
                      msg.id === oldestPending.id ? formattedMessage : msg
                    );
                    return updated;
                  }
                }
              }
              return prev;
            });
          } else {
            setBidderMessages(prev => ({
              ...prev,
              [activeBidder]: [...(prev[activeBidder] || []), formattedMessage]
            }));
            
            // Mark messages as read if the method exists
            if (user?.id && extendedMessagingService.markMessagesAsRead) {
              extendedMessagingService.markMessagesAsRead(activeConversation, user.id)
                .catch((error: any) => {
                  console.error("Error marking messages as read:", error);
                });
            }
          }
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [activeConversation, activeBidder, user?.id, pendingMessages, useStaticData]);

  const loadBids = async () => {
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
                seller_name: profileData.name || `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Anonymous Seller',
                seller_avatar: profileData.avatar_url || profileData.name?.charAt(0)?.toUpperCase() || 'S',
                seller_title: profileData.title || 'Legal Professional',
                seller_rating: profileData.rating || 0,
                seller_completed_jobs: profileData.completed_jobs || 0
              };
            }
            return {
              ...bid,
              seller_name: 'Anonymous Seller',
              seller_avatar: 'S',
              seller_title: 'Legal Professional',
              seller_rating: 0,
              seller_completed_jobs: 0
            };
          } catch (profileError) {
            console.log('Could not load seller profile for bid:', bid.id);
            return {
              ...bid,
              seller_name: 'Anonymous Seller',
              seller_avatar: 'S',
              seller_title: 'Legal Professional',
              seller_rating: 0,
              seller_completed_jobs: 0
            };
          }
        })
      );
      
      setBids(enrichedBids);
    } catch (err) {
      setError('Failed to load bids. Please try again.');
      console.log('Error loading bids:', err);
      setBids([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      addToast("Please enter a message", "info");
      return;
    }
    
    if (!user?.id) {
      addToast("You need to be logged in to send messages", "error");
      return;
    }
    
    if (!activeBidder) {
      addToast("No active conversation", "error");
      return;
    }

    // Handle static data mode differently
    if (useStaticData) {
      const newMsg: Message = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        sender: "user" as const,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setBidderMessages(prev => ({
        ...prev,
        [activeBidder]: [...(prev[activeBidder] || []), newMsg]
      }));
      
      setNewMessage("");
      addToast("Message sent successfully", "success");
      return;
    }

    // Handle real API messaging
    setIsSending(true);
    const tempId = `temp-${Date.now()}`;
    const messageContent = newMessage.trim();
    
    try {
      const bidder = bids.find(bid => getBidSellerId(bid) === activeBidder);
      if (!bidder) {
        addToast("Could not find bidder information", "error");
        return;
      }
      
      if (!activeConversation) {
        try {
          const conversation = await extendedMessagingService.getOrCreateConversation(
            user.id,
            getBidSellerId(bidder),
            gig.id
          );
          setActiveConversation(conversation.id);
        } catch (error) {
          console.error("Failed to create conversation:", error);
          addToast("Failed to create conversation", "error");
          return;
        }
      }
      
      if (activeConversation) {
        setPendingMessages(prev => ({
          ...prev,
          [activeBidder]: new Set([...(prev[activeBidder] || []), tempId])
        }));
        
        const newMsg: Message = {
          id: tempId,
          text: messageContent,
          sender: "user" as const,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pending: true
        };
        
        setBidderMessages(prev => ({
          ...prev,
          [activeBidder]: [...(prev[activeBidder] || []), newMsg]
        }));
        
        setNewMessage("");
        
        await extendedMessagingService.sendMessage(
          activeConversation,
          user.id,
          messageContent
        );
        
        setPendingMessages(prev => {
          const updated = { ...prev };
          if (updated[activeBidder]) {
            const updatedSet = new Set([...updated[activeBidder]]);
            updatedSet.delete(tempId);
            updated[activeBidder] = updatedSet;
          }
          return updated;
        });
        
        addToast("Message sent successfully", "success");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      addToast("Failed to send message", "error");
      
      setBidderMessages(prev => {
        const updated = { ...prev };
        if (updated[activeBidder]) {
          updated[activeBidder] = updated[activeBidder].filter(msg => msg.id !== tempId);
        }
        return updated;
      });
      
      setPendingMessages(prev => {
        const updated = { ...prev };
        if (updated[activeBidder]) {
          const updatedSet = new Set([...updated[activeBidder]]);
          updatedSet.delete(tempId);
          updated[activeBidder] = updatedSet;
        }
        return updated;
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    if (useStaticData) {
      console.log("Accepting bid:", bidId);
      addToast("Bid accepted (demo mode)", "success");
      return;
    }

    try {
      // Update the bid status to accepted
      await api.bids.updateBid(bidId, { status: 'accepted' });
      
      // Update the gig status to active
      await api.gigs.updateGig(gig.id, {
        title: gig.title,
        description: gig.description,
        categories: gig.category ? [gig.category] : [],
        budget: gig.budget,
        deadline: gig.deadline,
        status: 'active',
        buyer_id: undefined // This will be set by the backend
      });
      
      await loadBids();
      addToast("Bid accepted successfully and gig marked as active", "success");
    } catch (err) {
      console.error('Error accepting bid:', err);
      addToast("Failed to accept bid", "error");
    }
  };

  const handleRejectBid = async (bidId: string) => {
    if (useStaticData) {
      console.log("Rejecting bid:", bidId);
      if (activeBidder === bidId) {
        setActiveBidder(null);
        setActiveTab("bids");
      }
      addToast("Bid rejected (demo mode)", "success");
      return;
    }

    try {
      await api.bids.updateBid(bidId, { status: 'rejected' });
      await loadBids();
      
      if (activeBidder === bidId) {
        setActiveBidder(null);
        setActiveTab("bids");
      }
      addToast("Bid rejected successfully", "success");
    } catch (err) {
      console.error('Error rejecting bid:', err);
      addToast("Failed to reject bid", "error");
    }
  };

  const handleMessageBidder = async (bidderId: string) => {
    console.log("Messaging bidder:", bidderId);
    
    if (!user?.id) {
      addToast("You need to be logged in to send messages", "error");
      return;
    }
    
    setActiveBidder(bidderId);
    setActiveTab("messages");
    
    // Handle static data mode
    if (useStaticData) {
      if (!bidderMessages[bidderId]) {
        const initialMessages: Message[] = [
          {
            id: Date.now().toString(),
            text: `Hello, I'm interested in discussing your bid on my gig: ${gig.title}`,
            sender: "user" as const,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }
        ];
        
        setBidderMessages(prev => ({
          ...prev,
          [bidderId]: initialMessages
        }));
      }
      return;
    }
    
    // Handle real API messaging
    setIsLoadingMessages(true);
    
    try {
      const bidder = bids.find(bid => getBidSellerId(bid) === bidderId);
      if (!bidder) {
        addToast("Could not find bidder information", "error");
        return;
      }
      
      const conversation = await extendedMessagingService.getOrCreateConversation(
        user.id,
        getBidSellerId(bidder),
        gig.id
      );
      
      setActiveConversation(conversation.id);
      
      const messages = await extendedMessagingService.getMessages(conversation.id);
      
      // Mark messages as read if the method exists
      if (extendedMessagingService.markMessagesAsRead) {
        await extendedMessagingService.markMessagesAsRead(conversation.id, user.id);
      }
      
      const formattedMessages: Message[] = messages.map(msg => ({
        id: msg.id,
        text: msg.content,
        sender: msg.sender_id === user.id ? "user" : "other",
        timestamp: new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }));
      
      if (formattedMessages.length === 0) {
        const initialMessage: Message = {
          id: Date.now().toString(),
          text: `Hello, I'm interested in discussing your bid on my gig: ${gig.title}`,
          sender: "user" as const,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        
        try {
          await extendedMessagingService.sendMessage(
            conversation.id,
            user.id,
            initialMessage.text
          );
          
          formattedMessages.push(initialMessage);
        } catch (error) {
          console.error("Error sending initial message:", error);
          addToast("Failed to send initial message", "error");
        }
      }
      
      setBidderMessages(prev => ({
        ...prev,
        [bidderId]: formattedMessages
      }));
      
      addToast("Conversation loaded successfully", "success");
      
    } catch (error) {
      console.error("Error loading conversation:", error);
      addToast("Failed to load conversation", "error");
    } finally {
      setIsLoadingMessages(false);
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

  const calculateBidStatistics = () => {
    if (bids.length === 0) return { average: 0, lowest: 0, highest: 0 };
    
    const amounts = bids.map(bid => {
      const amountStr = getBidAmount(bid);
      const numberStr = amountStr.replace(/[₦,]/g, '');
      return parseInt(numberStr) || 0;
    });
    
    return {
      average: Math.round(amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length),
      lowest: Math.min(...amounts),
      highest: Math.max(...amounts)
    };
  };

  const stats = calculateBidStatistics();

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
            <span>Posted {formatDateMMDDYYYY(gig.created_at || gig.postedDate)}</span>
            <span>Deadline {formatDateMMDDYYYY(gig.deadline)}</span>
            <span>Budget {gig.budget}</span>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-lg font-medium ${
          gig.status === 'suspended' 
            ? 'bg-red-100 text-red-800' 
            : 'bg-[#FEC85F] text-[#1B1828]'
        }`}>
          {gig.status === 'suspended' ? 'Gig Suspended' : `${bids.length} Bids Received`}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Suspended Gig Warning */}
      {gig.status === 'suspended' && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          <strong>Gig Suspended:</strong> This gig has been suspended by an administrator. You cannot accept new bids at this time.
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          {[
            { id: "bids", label: `Bids (${bids.length})` },
            { id: "details", label: "Details" },
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
          {activeTab === "bids" && (
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-8">Loading bids...</div>
              ) : bids.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No bids received yet</div>
              ) : (
                bids.map((bid) => (
                  console.log("bid:", bid),
                  <Card key={bid.id} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700 overflow-hidden">
                          {getBidSellerAvatar(bid).startsWith('http') ? (
                            <img 
                              src={getBidSellerAvatar(bid)} 
                              alt={`${getBidSellerName(bid)}'s avatar`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <span className={getBidSellerAvatar(bid).startsWith('http') ? 'hidden' : ''}>
                            {getBidSellerAvatar(bid)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">{getBidSellerName(bid)}</h4>
                              <p className="text-gray-600">{getBidSellerTitle(bid)}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">{getBidAmount(bid)}</div>
                              <div className="text-sm text-gray-500">
                                {bid.deliveryTime && `${bid.deliveryTime} • `}
                                Submitted: {getBidSubmittedDate(bid)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mb-3">
                            {getBidSellerRating(bid) > 0 && (
                              <div className="flex items-center gap-1">
                                {renderStars(Math.floor(getBidSellerRating(bid)))}
                                <span className="text-sm text-gray-600 ml-1">{getBidSellerRating(bid)}</span>
                              </div>
                            )}
                            {getBidSellerCompletedJobs(bid) > 0 && (
                              <span className="text-sm text-gray-600">{getBidSellerCompletedJobs(bid)} jobs completed</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h5 className="font-medium text-[#1B1828] mb-2">Proposal</h5>
                        <p className="text-gray-600">{getBidDescription(bid)}</p>
                      </div>

                      <div className="flex gap-3">
                        {(!bid.status || bid.status === 'pending') && (
                          <>
                            <Button 
                              onClick={() => handleAcceptBid(bid.id)}
                              className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828]"
                              disabled={gig.status === 'suspended'}
                            >
                              {gig.status === 'suspended' ? 'Gig Suspended' : 'Accept Bid'}
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => handleMessageBidder(getBidSellerId(bid))}
                              className="border-[#1B1828] text-[#1B1828] hover:bg-[#1B1828]/10"
                            >
                              Message
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => handleRejectBid(bid.id)}
                              className="border-red-500 text-red-600 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {bid.status === 'accepted' && (
                          <span className="text-green-600 font-medium">Bid Accepted</span>
                        )}
                        {bid.status === 'rejected' && (
                          <span className="text-red-600 font-medium">Bid Rejected</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === "details" && (
            <div>
              <h3 className="text-xl font-semibold text-[#1B1828] mb-4">Description</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">{gig.description}</p>
              
              

              {/* Attachments Section */}
              {gig.attachments && gig.attachments.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-[#1B1828] mb-4">Attachments</h4>
                  <div className="space-y-3">
                    {gig.attachments.map((attachmentUrl, index) => {
                      // Extract filename from URL
                      const filename = attachmentUrl.split('/').pop()?.split('?')[0] || `attachment-${index + 1}`;
                      // Shorten URL for display: show filename + ... + first 6 chars of hash/query
                      const urlHash = attachmentUrl.split('?')[1]?.slice(0, 6) || attachmentUrl.slice(-6);
                      const shortDisplay = `${filename}...${urlHash}`;
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{shortDisplay}</div>
                              <div className="text-sm text-gray-500">Document</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(attachmentUrl, '_blank')}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
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
                              className="text-green-600 hover:text-green-700 hover:bg-green-100"
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

          {activeTab === "messages" && activeBidder !== null && (
            <div className="space-y-6">
              {/* Bidder Info */}
              <div className="flex items-center gap-4 p-4 border-b border-gray-200 bg-[#1B1828]/5">
                {(() => {
                  const bidder = bids.find(bid => getBidSellerId(bid) === activeBidder);
                  return bidder ? (
                    <>
                      <div className="w-12 h-12 bg-[#FEC85F]/20 rounded-full flex items-center justify-center text-sm font-medium text-[#1B1828] overflow-hidden">
                        {getBidSellerAvatar(bidder).startsWith('http') ? (
                          <img 
                            src={getBidSellerAvatar(bidder)} 
                            alt={`${getBidSellerName(bidder)}'s avatar`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to initials if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <span className={getBidSellerAvatar(bidder).startsWith('http') ? 'hidden' : ''}>
                          {getBidSellerAvatar(bidder)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#1B1828]">{getBidSellerName(bidder)}</h4>
                        <p className="text-gray-600">{getBidSellerTitle(bidder)}</p>
                      </div>
                    </>
                  ) : null;
                })()} 
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("bids")}
                  className="ml-auto border-[#1B1828] text-[#1B1828] hover:bg-[#1B1828]/10"
                >
                  Back to Bids
                </Button>
              </div>
              
              {/* Messages Area */}
              <div className="h-96 overflow-y-auto p-4 space-y-4 border border-gray-200 rounded-lg bg-gray-50">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B1828]"></div>
                  </div>
                ) : bidderMessages[activeBidder]?.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  bidderMessages[activeBidder]?.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'user'
                            ? message.pending 
                              ? 'bg-[#1B1828]/70 text-white' 
                              : 'bg-[#1B1828] text-white'
                            : 'bg-[#FEC85F]/20 text-[#1B1828]'
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
              <div className="flex items-center gap-3 p-4 border-t border-gray-200">
                <Button variant="ghost" className="p-2 text-gray-400 hover:text-gray-600">
                  <PaperclipIcon className="w-5 h-5 text-gray-400" />
                </Button>
                
                <div className="flex-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                </div>
                
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isSending}
                  className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] font-medium"
                >
                  {isSending ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="col-span-1">
          <Card className="border border-gray-200 mb-6">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center mx-auto mb-4 overflow-hidden">
                {loadingBuyerData ? (
                  <UserIcon className="w-8 h-8 text-gray-600" />
                ) : buyerName && buyerName !== 'Anonymous Buyer' ? (
                  <>
                    {buyerAvatar.startsWith('http') ? (
                      <img 
                        src={buyerAvatar} 
                        alt="Buyer's profile picture"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <span className={buyerAvatar.startsWith('http') ? 'hidden' : ''}>
                      {buyerName && buyerName.length > 0 ? buyerName.charAt(0).toUpperCase() : ''}
                    </span>
                  </>
                ) : (
                  <UserIcon className="w-8 h-8 text-gray-600" />
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {loadingBuyerData ? 'Loading...' : buyerName}
              </h3>
              <div className="flex items-center justify-center gap-1 mb-2">
                {loadingBuyerData ? (
                  <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
                ) : (
                  <>
                    {renderStars(Math.floor(buyerRating))}
                    <span className="text-sm text-gray-600 ml-1">{buyerRating.toFixed(1)}</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {loadingBuyerData ? 'Loading...' : `${buyerGigsCount} gigs posted`}
              </p>
            </CardContent>
          </Card>

          {/* Gig Statistics */}
          <Card className="border border-gray-200 mb-6">
            <CardContent className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Gig Statistics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Bids:</span>
                  <span className="font-semibold text-gray-900">{bids.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Bid:</span>
                  <span className="font-semibold text-gray-900">₦{stats.average.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lowest Bid:</span>
                  <span className="font-semibold text-gray-900">₦{stats.lowest.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Highest Bid:</span>
                  <span className="font-semibold text-gray-900">₦{stats.highest.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};