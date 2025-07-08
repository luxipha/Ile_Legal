import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ViewBids } from "../../components/ViewBids/ViewBids";
import { ViewDeliverables } from "../../components/ViewDeliverables";
import { LeaveFeedback } from "../../components/LeaveFeedback/LeaveFeedback";
import { BuyerSidebar } from "../../components/BuyerSidebar/BuyerSidebar";
import {
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  CheckCircleIcon,
  ChevronRightIcon
} from "lucide-react";
import { api } from "../../services/api";
import { messagingService } from "../../services/messagingService";
import { useAuth } from "../../contexts/AuthContext";

type ViewMode = "dashboard" | "view-bids" | "view-details" | "view-deliverables";

interface Gig {
  id: number;
  title: string;
  status: "Active" | "Open" | "In Progress" | "Completed" | "pending_payment";
  statusColor: string;
  bidsReceived: number;
  budget: string;
  deadline: string;
  postedDate: string;
  description: string;
  company: string;
  price: string;
  category?: string;
  location?: string;
  posted?: string;
  deliveryTime: string;
  requirements: string[];
  companyRating: number;
  projectsPosted: number;
  is_flagged: boolean;
}

interface CompletedGig {
  id: number;
  title: string;
  description: string;
  provider: string;
  providerAvatar: string;
  amount: string;
  completedDate: string;
  postedDate: string;
  deadline: string;
  status: "Completed" | "pending_payment";
  paymentStatus: "completed" | "paid" | "pending" | "pending_payment";
  providerLocation: string;
  providerRating: number;
  completedJobsCount: number;
}

interface InProgressGig {
  id: number;
  title: string;
  provider: string;
  providerAvatar: string;
  dueDate: string;
  amount: string;
  progress: number;
  status: "In Progress";
}

interface RecentActivity {
  id: number;
  type: "posted" | "bid_received" | "completed";
  title: string;
  subtitle?: string;
  time: string;
  icon: string;
}

interface StoredConversation {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  gigTitle?: string;
  messages: Array<{
    id: number;
    text: string;
    sender: "user" | "other";
    timestamp: string;
  }>;
}

// Helper function to format dates to mm/dd/yyyy
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
};

export const BuyerDashboard = (): JSX.Element => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [selectedCompletedGig, setSelectedCompletedGig] = useState<CompletedGig | null>(null);
  const [, setConversations] = useState<StoredConversation[]>([]);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  // New state for gigs
  const [activeGigs, setActiveGigs] = useState<Gig[]>([]);
  const [inProgressGigs, setInProgressGigs] = useState<InProgressGig[]>([]);
  const [completedGigs, setCompletedGigs] = useState<CompletedGig[]>([]);
  const [, setLoadingGigs] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [stats, setStats] = useState({ inProgress: 0, active: 0, completed: 0 });

  useEffect(() => {
    if (!user?.id) return;
    const fetchGigs = async () => {
      setLoadingGigs(true);
      try {
        // Fetch all gigs for the current user
        const gigs = await api.gigs.getMyGigs(user.id);
        console.log("gigs", gigs);
        
        // Map and split gigs by status
        const active: Gig[] = [];
        const inProgress: InProgressGig[] = [];
        const completed: CompletedGig[] = [];
        
        // Process each gig
        for (const gig of gigs) {
          if (gig.status?.toLowerCase() === "pending") {
            active.push({
              ...gig,
              status: gig.status?.toLowerCase() === "pending" ? "Open" : gig.status, // Display "Open" for pending
              statusColor: gig.status?.toLowerCase() === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800",
              bidsReceived: gig.bids_data?.length || 0,
              budget: gig.budget,
              deadline: gig.deadline,
              postedDate: gig.postedDate || "",
              description: gig.description,
              company: gig.company || "",
              price: gig.price || gig.budget,
              deliveryTime: gig.deliveryTime || "",
              requirements: gig.requirements || [],
              companyRating: gig.companyRating || 0,
              projectsPosted: gig.projectsPosted || 0,
              is_flagged: gig.is_flagged || false
            });
          } else if (gig.status?.toLowerCase() === "in progress" || gig.status?.toLowerCase() === "active") {
            // For in-progress gigs, we need to get the accepted bid to find the provider
            try {
              const bids = await api.bids.getBidsByGigId(gig.id.toString());
              const acceptedBid = bids.find((bid: any) => bid.status === 'accepted');
              
              if (acceptedBid) {
                // Get seller profile information using the new getUserProfile function
                const sellerProfile = await api.metrics.getUserProfile(acceptedBid.seller_id);
                
                const providerName = 
                  `${sellerProfile?.first_name || ''} ${sellerProfile?.last_name || ''}`.trim() || 
                  'Legal Professional';
                const providerAvatar = sellerProfile?.avatar_url || providerName.charAt(0).toUpperCase();
                
                inProgress.push({
                  id: gig.id,
                  title: gig.title,
                  provider: providerName,
                  providerAvatar: providerAvatar,
                  dueDate: gig.dueDate || gig.deadline,
                  amount: gig.amount || gig.budget,
                  progress: gig.progress || 0,
                  status: "In Progress"
                });
              }
            } catch (error) {
              console.error(`Error fetching bid data for gig ${gig.id}:`, error);
              // Fallback with default provider info
              inProgress.push({
                id: gig.id,
                title: gig.title,
                provider: "Legal Professional",
                providerAvatar: "L",
                dueDate: gig.dueDate || gig.deadline,
                amount: gig.amount || gig.budget,
                progress: gig.progress || 0,
                status: "In Progress"
              });
            }
          } else if (["completed", "pending_payment"].includes(gig.status?.toLowerCase()) || gig.status?.toLowerCase() === "paid") {
            // For completed gigs, we need to get the accepted bid to find the provider
            try {
              const bids = await api.bids.getBidsByGigId(gig.id.toString());
              const acceptedBid = bids.find((bid: any) => bid.status === 'accepted');
              
              if (acceptedBid) {
                // Get seller profile information using the new getUserProfile function
                const sellerProfile = await api.metrics.getUserProfile(acceptedBid.seller_id);
                
                const providerName = 
                  `${sellerProfile?.first_name || ''} ${sellerProfile?.last_name || ''}`.trim() || 
                  'Legal Professional';
                const providerAvatar = sellerProfile?.avatar_url || providerName.charAt(0).toUpperCase();
                const providerLocation = sellerProfile?.location || '';
                
                // Get seller's rating
                let sellerRating = 0;
                try {
                  sellerRating = await api.feedback.getAverageRating(acceptedBid.seller_id);
                } catch (error) {
                  console.error('Error fetching seller rating:', error);
                }
                
                // Use jobs_completed from the profile instead of calculating manually
                const completedJobsCount = sellerProfile?.jobs_completed || 0;
                console.log('completedJobsCount', completedJobsCount);
                console.log('completed gig', gig);
                completed.push({
                  id: gig.id,
                  title: gig.title,
                  description: gig.description,
                  provider: providerName,
                  providerAvatar: providerAvatar,
                  amount: gig.amount || gig.budget,
                  completedDate: gig.completedDate || gig.deadline,
                  postedDate: gig.postedDate || gig.created_at || "",
                  deadline: gig.deadline || "",
                  status: ["completed", "pending_payment"].includes(gig.status?.toLowerCase()) ? "Completed" : gig.status,
                  paymentStatus: gig.status?.toLowerCase(),
                  providerLocation: providerLocation,
                  providerRating: sellerRating,
                  completedJobsCount: completedJobsCount
                });
              }
            } catch (error) {
              console.error(`Error fetching bid data for gig ${gig.id}:`, error);
              // Fallback with default provider info
              completed.push({
                id: gig.id,
                title: gig.title,
                description: gig.description,
                provider: "Legal Professional",
                providerAvatar: "L",
                amount: gig.amount || gig.budget,
                completedDate: gig.completedDate || gig.deadline,
                postedDate: gig.postedDate || gig.created_at || "",
                deadline: gig.deadline || "",
                status: ["completed", "pending_payment"].includes(gig.status?.toLowerCase()) ? "Completed" : gig.status,
                paymentStatus: "completed",
                providerLocation: '',
                providerRating: 0,
                completedJobsCount: 0
              });
            }
          }
        }
        
        setActiveGigs(active);
        setInProgressGigs(inProgress);
        setCompletedGigs(completed);
        
        // Calculate real stats
        setStats({
          inProgress: inProgress.length,
          active: active.length,
          completed: completed.length
        });
        
        // Generate recent activity from real data
        const activities: RecentActivity[] = [];
        
        // Add recent gigs as activities
        [...active, ...inProgress, ...completed]
          .sort((a, b) => {
            const aDate = (a as any).postedDate || (a as any).created_at || (a as any).completedDate || '';
            const bDate = (b as any).postedDate || (b as any).created_at || (b as any).completedDate || '';
            return new Date(bDate).getTime() - new Date(aDate).getTime();
          })
          .slice(0, 3)
          .forEach((gig, index) => {
            if (gig.status?.toLowerCase() === 'active' || gig.status?.toLowerCase() === 'pending') {
              activities.push({
                id: index + 1,
                type: 'posted',
                title: 'You posted a new gig:',
                subtitle: gig.title,
                time: formatDate((gig as any).postedDate || (gig as any).created_at || ''),
                icon: '🟡'
              });
            } else if (["completed", "pending_payment"].includes(gig.status?.toLowerCase()) || gig.status?.toLowerCase() === 'completed') {
              activities.push({
                id: index + 1,
                type: 'completed',
                title: 'Completed:',
                subtitle: gig.title,
                time: formatDate((gig as any).completedDate || (gig as any).created_at || ''),
                icon: '🟢'
              });
            }
          });
        
        setRecentActivity(activities);
      } catch (error) {
        console.error("Failed to fetch gigs:", error);
      } finally {
        setLoadingGigs(false);
      }
    };
    fetchGigs();
  }, [user?.id]);

  // Load real conversations using messaging API
  useEffect(() => {
    if (!user?.id) return;
    
    const loadConversations = async () => {
      try {
        const realConversations = await messagingService.getConversations(user.id, 'buyer');
        
        // Convert to StoredConversation format
        const formattedConversations: StoredConversation[] = realConversations.map((conv: any) => ({
          id: conv.id,
          name: conv.seller?.full_name || conv.seller?.first_name || 'Legal Professional',
          lastMessage: conv.last_message?.content || 'No messages yet',
          timestamp: conv.last_message?.created_at ? new Date(conv.last_message.created_at).toLocaleTimeString() : '',
          gigTitle: conv.gig?.title,
          messages: [] // Messages would be loaded when conversation is opened
        }));
        
        setConversations(formattedConversations);
      } catch (error) {
        console.error('Failed to load conversations:', error);
        // Fallback to localStorage for now
        const storedConversations = localStorage.getItem('buyerConversations');
        if (storedConversations) {
          try {
            setConversations(JSON.parse(storedConversations));
          } catch (parseError) {
            console.error('Error parsing stored conversations:', parseError);
          }
        }
      }
    };
    
    loadConversations();
  }, [user?.id]);

  // recentActivity is now managed by state and loaded from real data

  const handleViewBids = (gigId: number) => {
    const gig = activeGigs.find(g => g.id === gigId);
    if (gig) {
      setSelectedGig(gig);
      setViewMode("view-bids");
    }
  };
  
  // For buyers, we'll use ViewBids component for both bid viewing and details viewing
  const handleViewDetails = (gigId: number) => {
    const gig = activeGigs.find(g => g.id === gigId);
    if (gig) {
      setSelectedGig(gig);
      // Use view-bids mode instead of view-details for buyers
      setViewMode("view-bids");
    }
  };

  // View details functionality is now handled directly in ViewBids component

  const handleViewDeliverables = (gigId: number) => {
    // Find the completed gig by ID
    const gig = completedGigs.find(g => g.id === gigId);
    if (gig) {
      setSelectedCompletedGig(gig);
      setViewMode("view-deliverables");
    }
  };

  const handleLeaveFeedback = (gigId: number) => {
    // Find the completed gig by ID
    const gig = completedGigs.find(g => g.id === gigId);
    if (gig) {
      if (gig.paymentStatus === "completed" || gig.paymentStatus === "pending_payment") {
        // Navigate to payments page for completed gigs that haven't been paid
        navigate("/payments");
      } else if (gig.paymentStatus === "paid") {
        // Open feedback modal for paid gigs
        setSelectedCompletedGig(gig);
        setFeedbackModalOpen(true);
      }
    }
  };

  // Feedback is now handled directly in the LeaveFeedback component

  const handleMessageProvider = (providerId: string) => {
    navigate("/buyer-messages", { state: { providerId } });
  };

  const handleBackToDashboard = () => {
    setViewMode("dashboard");
    setSelectedGig(null);
  };

  // Removed handlePlaceBid function as it's no longer needed since we're not using ViewDetails

  if (viewMode === "view-bids" && selectedGig) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <BuyerSidebar activePage="dashboard" />

        {/* Main Content - View Bids */}
        <div className="flex-1 flex flex-col">
          <Header title="View Bids" userType="buyer" />

          {/* View Bids Content */}
          <main className="flex-1 p-6">
            <ViewBids
              gig={{...selectedGig, id: selectedGig.id.toString()}}
              onBack={handleBackToDashboard}
              backButtonText="Back to Dashboard"
            />
          </main>
        </div>
      </div>
    );
  }

  // We no longer need the view-details section for buyers as we're using ViewBids for both actions
  // The view-details mode is meant for sellers, while buyers should use ViewBids
  
  if (viewMode === "view-deliverables" && selectedCompletedGig) {
    console.log('selectedCompletedGig', selectedCompletedGig);
    return (
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <BuyerSidebar activePage="dashboard" />

        {/* Main Content - View Deliverables */}
        <div className="flex-1 flex flex-col">
          <Header title="View Deliverables" userType="buyer" />

          {/* View Deliverables Content */}
          <main className="flex-1 p-6">
            <ViewDeliverables
              gigId={selectedCompletedGig.id}
              gigTitle={selectedCompletedGig.title}
              postedDate={formatDate(selectedCompletedGig.completedDate)}
              deadline={formatDate(selectedCompletedGig.completedDate)}
              budget={selectedCompletedGig.amount}
              status={selectedCompletedGig.status}
              description={selectedCompletedGig.description}
              provider={{
                name: selectedCompletedGig.provider,
                avatar: selectedCompletedGig.providerAvatar,
                rating: selectedCompletedGig.providerRating,
                projectsPosted: selectedCompletedGig.completedJobsCount,
                location: selectedCompletedGig.providerLocation
              }}
              onBack={() => setViewMode("dashboard")}
              onMessage={handleMessageProvider}
            />
          </main>
        </div>
      </div>
    );
  }

  const renderActiveGigCard = (gig: Gig) => (
    <Card key={gig.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Title */}
        <h4 className="text-lg font-semibold text-gray-900 mb-4">{gig.title}</h4>
        
        {/* Status Badge */}
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${gig.statusColor}`}>
            {gig.status}
          </span>
        </div>

        {/* Bids Received (only for active/open gigs) */}
        {(gig.status === "Active" || gig.status === "Open") && (
          <div className="mb-6">
            <span className="text-blue-600 font-medium text-sm">{gig.bidsReceived} bids received</span>
          </div>
        )}

        {/* Budget and Deadline Row */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <div className="text-sm font-medium text-gray-900 mb-1">Budget:</div>
            <div className="text-lg font-bold text-gray-900">{gig.budget}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 mb-1">Deadline:</div>
            <div className="text-lg font-bold text-gray-900">{formatDate(gig.deadline)}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {(gig.status === "Active" || gig.status === "Open") && (
            <Button 
              onClick={() => handleViewBids(gig.id)}
              className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white px-6 py-2 rounded-full flex-1"
            >
              View Bids
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={() => handleViewDetails(gig.id)}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-full flex-1"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCompletedGigCard = (gig: CompletedGig) => (
    <Card key={gig.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Title */}
        <h4 className="text-lg font-semibold text-gray-900 mb-4">{gig.title}</h4>
        
        {/* Provider Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium overflow-hidden">
            {gig.providerAvatar && (
              gig.providerAvatar.startsWith('http://') || 
              gig.providerAvatar.startsWith('https://') || 
              gig.providerAvatar.startsWith('data:image/')
            ) ? (
              <img 
                src={gig.providerAvatar} 
                alt={gig.provider}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className={gig.providerAvatar && (
              gig.providerAvatar.startsWith('http://') || 
              gig.providerAvatar.startsWith('https://') || 
              gig.providerAvatar.startsWith('data:image/')
            ) ? 'hidden' : ''}>
              {gig.providerAvatar || gig.provider.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{gig.provider}</div>
            <div className="text-sm text-gray-600">Legal Professional</div>
          </div>
        </div>

        {/* Amount and Completion Date */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold text-gray-900">{gig.amount}</div>
          <div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              gig.paymentStatus === "completed" || gig.paymentStatus === "pending_payment" 
                ? "bg-red-100 text-red-800" 
                : "bg-green-100 text-green-800"
            }`}>
              {gig.paymentStatus === "completed" || gig.paymentStatus === "pending_payment" ? "Pay Now" : "Completed"}
            </span>
          </div>
        </div>

        {/* Completed Date */}
        <div className="text-sm text-gray-600 mb-6">
          Completed: {formatDate(gig.completedDate)}
        </div>

        {/* Action Buttons at Bottom */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <Button 
            onClick={() => handleViewDeliverables(gig.id)}
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-full flex-1"
          >
            View Deliverables
          </Button>
          <Button 
            onClick={() => handleLeaveFeedback(gig.id)}
            className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-6 py-2 rounded-full flex-1"
          >
            {gig.paymentStatus === "completed" || gig.paymentStatus === "pending_payment" ? "Pay Now" : "Leave Feedback"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderInProgressCard = (gig: InProgressGig) => (
    <Card key={gig.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-2">{gig.title}</h4>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium overflow-hidden">
                {gig.providerAvatar && (
                  gig.providerAvatar.startsWith('http://') || 
                  gig.providerAvatar.startsWith('https://') || 
                  gig.providerAvatar.startsWith('data:image/')
                ) ? (
                  <img 
                    src={gig.providerAvatar} 
                    alt={gig.provider}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <span className={gig.providerAvatar && (
                  gig.providerAvatar.startsWith('http://') || 
                  gig.providerAvatar.startsWith('https://') || 
                  gig.providerAvatar.startsWith('data:image/')
                ) ? 'hidden' : ''}>
                  {gig.providerAvatar || gig.provider.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-gray-700">{gig.provider}</span>
            </div>
          </div>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {gig.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{formatDate(gig.dueDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSignIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">{gig.amount}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progress: {gig.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${gig.progress}%` }}
            ></div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={() => handleMessageProvider(gig.provider)}
            variant="outline"
            className="border-blue-500 text-blue-500 hover:bg-blue-50"
          >
            Message Provider
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleViewDetails(gig.id)}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Default dashboard view
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Feedback Modal */}
      {selectedCompletedGig && (
        <LeaveFeedback
          isOpen={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
          gigId={selectedCompletedGig.id}
          gigTitle={selectedCompletedGig.title}
          provider={selectedCompletedGig.provider}
          providerAvatar={selectedCompletedGig.providerAvatar}
          completedDate={selectedCompletedGig.completedDate}
        />
      )}
      
      {/* Sidebar - Hidden on mobile */}
      <BuyerSidebar activePage="dashboard" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <Header title="Dashboard" userType="buyer" />

        {/* Dashboard Content */}
        <main className="flex-1 p-4 sm:p-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-[#FEC85F] to-[#f5c55a] rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1B1828] mb-2">
                  Welcome back, {user?.name || user?.user_metadata?.firstName || 'User'}
                </h2>
                <p className="text-[#1B1828]/80 text-sm sm:text-base">Manage your legal tasks and find qualified professionals</p>
              </div>
              <Link to="/post-gig" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-[#1B1828] hover:bg-[#1B1828]/90 text-white px-4 sm:px-6 py-3 rounded-lg">
                  Post New Gig
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-gray-600">In Progress</div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.inProgress}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BriefcaseIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-gray-600">Active Gigs</div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.active}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-gray-600">Completed</div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.completed}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid - 50/50 Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column - Active Gigs (50%) */}
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Active Gigs</h3>
                  {activeGigs.length > 1 && (
                    <Link to="/buyer-gigs" className="text-gray-400 hover:text-gray-600">
                      <ChevronRightIcon className="w-5 h-5" />
                    </Link>
                  )}
                </div>
                <p className="text-gray-600">Your currently active gigs awaiting bids or assignments.</p>
              </div>
              
              <div className="space-y-4 mb-8">
                {activeGigs.slice(0, 1).map(renderActiveGigCard)}
              </div>

              {/* Completed Gigs */}
              <div>
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Completed Gigs</h3>
                    {completedGigs.length > 1 && (
                      <Link to="/buyer-gigs?tab=completed" className="text-gray-400 hover:text-gray-600">
                        <ChevronRightIcon className="w-5 h-5" />
                      </Link>
                    )}
                  </div>
                  <p className="text-gray-600">Gigs that have been successfully completed.</p>
                </div>
                
                <div className="space-y-4">
                  {completedGigs.slice(0, 1).map(renderCompletedGigCard)}
                </div>
              </div>
            </div>

            {/* Right Column - In Progress & Recent Activity (50%) */}
            <div className="space-y-8">
              {/* In Progress */}
              <div>
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">In Progress</h3>
                    {inProgressGigs.length > 1 && (
                      <Link to="/buyer-gigs?tab=in-progress" className="text-gray-400 hover:text-gray-600">
                        <ChevronRightIcon className="w-5 h-5" />
                      </Link>
                    )}
                  </div>
                  <p className="text-gray-600">Gigs currently being worked on by legal professionals.</p>
                </div>
                
                <div className="space-y-4">
                  {inProgressGigs.slice(0, 1).map(renderInProgressCard)}
                </div>
              </div>

              {/* Recent Activity - Under In Progress */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>
                
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                      <div className="text-lg">{activity.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 font-medium">{activity.title}</p>
                        {activity.subtitle && (
                          <p className="text-sm text-gray-600">{activity.subtitle}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};