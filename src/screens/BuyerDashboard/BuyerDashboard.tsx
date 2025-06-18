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
  CheckCircleIcon
} from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

type ViewMode = "dashboard" | "view-bids" | "view-details" | "view-deliverables";

interface Gig {
  id: number;
  title: string;
  status: "Active" | "In Progress" | "Completed";
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
}

interface CompletedGig {
  id: number;
  title: string;
  provider: string;
  providerAvatar: string;
  amount: string;
  completedDate: string;
  status: "Completed";
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

export const BuyerDashboard = (): JSX.Element => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [selectedCompletedGig, setSelectedCompletedGig] = useState<CompletedGig | null>(null);
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  // New state for gigs
  const [activeGigs, setActiveGigs] = useState<Gig[]>([]);
  const [inProgressGigs, setInProgressGigs] = useState<InProgressGig[]>([]);
  const [completedGigs, setCompletedGigs] = useState<CompletedGig[]>([]);
  const [loadingGigs, setLoadingGigs] = useState(true);

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
        gigs.forEach((gig: any) => {
          if (gig.status.toLowerCase() === "active") {
            active.push({
              ...gig,
              statusColor: "bg-green-100 text-green-800",
              bidsReceived: gig.bidsReceived || 0,
              budget: gig.budget,
              deadline: gig.deadline,
              postedDate: gig.postedDate || "",
              description: gig.description,
              company: gig.company || "",
              price: gig.price || gig.budget,
              deliveryTime: gig.deliveryTime || "",
              requirements: gig.requirements || [],
              companyRating: gig.companyRating || 0,
              projectsPosted: gig.projectsPosted || 0
            });
          } else if (gig.status.toLowerCase() === "in progress") {
            inProgress.push({
              id: gig.id,
              title: gig.title,
              provider: gig.provider || "",
              providerAvatar: gig.providerAvatar || "",
              dueDate: gig.dueDate || gig.deadline,
              amount: gig.amount || gig.budget,
              progress: gig.progress || 0,
              status: "In Progress"
            });
          } else if (gig.status.toLowerCase() === "completed") {
            completed.push({
              id: gig.id,
              title: gig.title,
              provider: gig.provider || "",
              providerAvatar: gig.providerAvatar || "",
              amount: gig.amount || gig.budget,
              completedDate: gig.completedDate || gig.deadline,
              status: "Completed"
            });
          }
        });
        setActiveGigs(active);
        setInProgressGigs(inProgress);
        setCompletedGigs(completed);
      } catch (error) {
        console.error("Failed to fetch gigs:", error);
      } finally {
        setLoadingGigs(false);
      }
    };
    fetchGigs();
  }, [user?.id]);

  // Load conversations from localStorage on component mount
  useEffect(() => {
    const storedConversations = localStorage.getItem('buyerConversations');
    if (storedConversations) {
      try {
        setConversations(JSON.parse(storedConversations));
      } catch (error) {
        console.error('Error parsing stored conversations:', error);
      }
    }
  }, []);
  
  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('buyerConversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  const recentActivity: RecentActivity[] = [
    {
      id: 1,
      type: "posted",
      title: "You posted a new gig:",
      subtitle: "Land Title Verification",
      time: "2 hours ago",
      icon: "🟡"
    },
    {
      id: 2,
      type: "bid_received",
      title: "New bid received on:",
      subtitle: "Contract Review",
      time: "5 hours ago",
      icon: "🔵"
    },
    {
      id: 3,
      type: "completed",
      title: "Completed:",
      subtitle: "Regulatory Compliance Check",
      time: "1 day ago",
      icon: "🟢"
    }
  ];

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
      setSelectedCompletedGig(gig);
      setFeedbackModalOpen(true);
    }
  };

  const handleSubmitFeedback = (gigId: number, rating: number, feedback: string) => {
    // In a real app, this would send the feedback to an API
    console.log("Submitting feedback for gig:", gigId, "Rating:", rating, "Feedback:", feedback);
    
    // Close the modal after submission
    setFeedbackModalOpen(false);
    
    // Show a success message (in a real app, you'd use a toast notification)
    alert("Feedback submitted successfully!");
  };

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
          <Header title="View Bids" userName="Demo Client" userType="buyer" />

          {/* View Bids Content */}
          <main className="flex-1 p-6">
            <ViewBids
              gig={selectedGig}
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
    return (
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <BuyerSidebar activePage="dashboard" />

        {/* Main Content - View Deliverables */}
        <div className="flex-1 flex flex-col">
          <Header title="View Deliverables" userName="Demo Client" userType="buyer" />

          {/* View Deliverables Content */}
          <main className="flex-1 p-6">
            <ViewDeliverables
              gigId={selectedCompletedGig.id}
              gigTitle={selectedCompletedGig.title}
              postedDate="12/04/2025" // In a real app, you'd have this data
              deadline="25/04/2025"
              budget={selectedCompletedGig.amount}
              status={selectedCompletedGig.status}
              provider={{
                name: selectedCompletedGig.provider,
                avatar: selectedCompletedGig.providerAvatar,
                rating: 4.9,
                projectsPosted: 12
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
        <div className="flex">
          {/* Left Content - 75% */}
          <div className="flex-1 pr-6">
            {/* Title */}
            <h4 className="text-lg font-semibold text-gray-900 mb-4">{gig.title}</h4>
            
            {/* Status Badge */}
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${gig.statusColor}`}>
                {gig.status}
              </span>
            </div>

            {/* Bids Received (only for active gigs) */}
            {gig.status === "Active" && (
              <div className="mb-6">
                <span className="text-blue-600 font-medium text-sm">{gig.bidsReceived} bids received</span>
              </div>
            )}

            {/* Budget and Deadline Row */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">Budget:</div>
                <div className="text-lg font-bold text-gray-900">{gig.budget}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">Deadline:</div>
                <div className="text-lg font-bold text-gray-900">{gig.deadline}</div>
              </div>
            </div>
          </div>

          {/* Vertical Separator */}
          <div className="w-px bg-gray-200 mx-4"></div>

          {/* Right Action Buttons - 25% */}
          <div className="flex flex-col gap-3 justify-center min-w-[140px]">
            {gig.status === "Active" && (
              <Button 
                onClick={() => handleViewBids(gig.id)}
                className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white px-6 py-2 rounded-full w-full"
              >
                View Bids
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => handleViewDetails(gig.id)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-full w-full"
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCompletedGigCard = (gig: CompletedGig) => (
    <Card key={gig.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex">
          {/* Left Content - 75% */}
          <div className="flex-1 pr-6">
            {/* Title */}
            <h4 className="text-lg font-semibold text-gray-900 mb-4">{gig.title}</h4>
            
            {/* Provider Info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                {gig.providerAvatar}
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
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Completed
                </span>
              </div>
            </div>

            {/* Completed Date */}
            <div className="text-sm text-gray-600">
              Completed: {gig.completedDate}
            </div>
          </div>

          {/* Vertical Separator */}
          <div className="w-px bg-gray-200 mx-4"></div>

          {/* Right Action Buttons - 25% */}
          <div className="flex flex-col gap-3 justify-center min-w-[140px]">
            <Button 
              onClick={() => handleViewDeliverables(gig.id)}
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-full w-full"
            >
              View Deliverables
            </Button>
            <Button 
              onClick={() => handleLeaveFeedback(gig.id)}
              className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-6 py-2 rounded-full w-full"
            >
              Leave Feedback
            </Button>
          </div>
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
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                {gig.providerAvatar}
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
            <span className="text-sm text-gray-600">{gig.dueDate}</span>
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
          onSubmit={handleSubmitFeedback}
        />
      )}
      
      {/* Sidebar */}
      <BuyerSidebar activePage="dashboard" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title="Dashboard" userName="Demo Client" userType="buyer" />

        {/* Dashboard Content */}
        <main className="flex-1 p-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-[#FEC85F] to-[#f5c55a] rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#1B1828] mb-2">Welcome back, Demo</h2>
                <p className="text-[#1B1828]/80">Manage your legal tasks and find qualified professionals</p>
              </div>
              <Link to="/post-gig">
                <Button className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white">
                  Post New Gig
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">In Progress</div>
                    <div className="text-2xl font-bold text-gray-900">1</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BriefcaseIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Active Gigs</div>
                    <div className="text-2xl font-bold text-gray-900">2</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Completed</div>
                    <div className="text-2xl font-bold text-gray-900">12</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid - 50/50 Split */}
          <div className="grid grid-cols-2 gap-8">
            {/* Left Column - Active Gigs (50%) */}
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Active Gigs</h3>
                <p className="text-gray-600">Your currently active gigs awaiting bids or assignments.</p>
              </div>
              
              <div className="space-y-4 mb-8">
                {activeGigs.map(renderActiveGigCard)}
              </div>

              {/* Completed Gigs */}
              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Completed Gigs</h3>
                  <p className="text-gray-600">Gigs that have been successfully completed.</p>
                </div>
                
                <div className="space-y-4">
                  {completedGigs.map(renderCompletedGigCard)}
                </div>
              </div>
            </div>

            {/* Right Column - In Progress & Recent Activity (50%) */}
            <div className="space-y-8">
              {/* In Progress */}
              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">In Progress</h3>
                  <p className="text-gray-600">Gigs currently being worked on by legal professionals.</p>
                </div>
                
                <div className="space-y-4">
                  {inProgressGigs.map(renderInProgressCard)}
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