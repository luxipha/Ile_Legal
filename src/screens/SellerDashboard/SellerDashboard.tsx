import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate, formatUser } from "../../utils/formatters";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { ViewDetails, Gig as ViewDetailsGig } from "../../components/ViewDetails";
import { Header } from "../../components/Header/Header";
import { SellerSidebar } from "../../components/SellerSidebar/SellerSidebar";
import { SecureLegalUpload, SecureUploadResult } from "../../components/SecureLegalUpload";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { 
  GavelIcon, 
  BriefcaseIcon, 
  CheckCircleIcon, 
  MessageSquareIcon,
  DollarSignIcon,
  UserIcon,
  SearchIcon,
  ArrowLeftIcon,
  ChevronRightIcon
} from "lucide-react";

type ViewMode = "dashboard" | "place-bid" | "view-details" | "submit-work" | "edit-bid";

interface SellerGig {
  id: string;
  title: string;
  company: string;
  price: string;
  deadline: string;
  postedDate: string;
  budget: number;
  deliveryTime: string;
  description: string;
  requirements: string[];
  companyRating: number;
  projectsPosted: number;
  is_flagged: boolean;
  status?: string;
  buyer_id?: string;
}

interface OngoingGig {
  id: string;
  title: string;
  company: string;
  price: string;
  dueDate: string;
  progress: number;
  description: string;
}

export const SellerDashboard = (): JSX.Element => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [selectedGig, setSelectedGig] = useState<SellerGig | null>(null);
  const [selectedOngoingGig, setSelectedOngoingGig] = useState<OngoingGig | null>(null);
  
  // Real data state
  const [availableGigs, setAvailableGigs] = useState<SellerGig[]>([]);
  const [ongoingGigs, setOngoingGigs] = useState<OngoingGig[]>([]);
  const [completedGigs, setCompletedGigs] = useState<any[]>([]);
  const [activeBids, setActiveBids] = useState<any[]>([]);
  const [loadingGigs, setLoadingGigs] = useState(false);
  const [loadingOngoing, setLoadingOngoing] = useState(false);
  const [loadingActiveBids, setLoadingActiveBids] = useState(false);
  const [bidFormData, setBidFormData] = useState({
    bidAmount: "",
    deliveryTime: "",
    proposal: ""
  });


  const [submitWorkData, setSubmitWorkData] = useState({
    description: "",
    secureFiles: [] as SecureUploadResult[]
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load available gigs from API
  useEffect(() => {
    const loadAvailableGigs = async () => {
      setLoadingGigs(true);
      try {
        const gigs = await api.gigs.getAllGigs({status: "pending"});
        // Convert API gigs to SellerGig format
        const formattedGigs: SellerGig[] = await Promise.all(gigs.map(async (gig: any) => {
          // Get average rating for the buyer
          let companyRating = 0;
          try {
            if (gig.buyer?.id) {
              companyRating = await api.feedback.getAverageRating(gig.buyer.id);
            }
          } catch (error) {
            console.error('Error fetching average rating:', error);
          }

          // Get projects posted count for the buyer
          let projectsPosted = 0;
          try {
            if (gig.buyer?.id) {
              const buyerGigs = await api.gigs.getMyGigs(gig.buyer.id);
              projectsPosted = buyerGigs.length;
            }
          } catch (error) {
            console.error('Error fetching buyer gigs:', error);
          }

          return {
            id: gig.id.toString(),
            title: gig.title || "Legal Service",
            company: gig.buyer?.first_name && gig.buyer?.last_name 
              ? `${gig.buyer.first_name} ${gig.buyer.last_name}` 
              : gig.buyer?.first_name || gig.buyer?.last_name,
            price: formatCurrency.naira(gig.budget, "Budget not specified"),
            deadline: formatDate.full(gig.deadline),
            postedDate: formatDate.full(gig.created_at),
            budget: gig.budget || 0,
            deliveryTime: "To be negotiated",
            description: gig.description || "No description provided",
            requirements: gig.categories || [],
            companyRating: companyRating,
            projectsPosted: projectsPosted,
            is_flagged: gig.is_flagged || false,
            status: gig.status || "active",
            avatar: gig.buyer?.avatar_url,
            buyer_id: gig.buyer?.id
          };
        }));
        
        // Only show active gigs for sellers to bid on
        const activeGigs = formattedGigs.filter(gig => gig.status?.toLowerCase() === 'active' || gig.status?.toLowerCase() === 'pending');
        setAvailableGigs(activeGigs);
      } catch (error) {
        console.error('Error loading available gigs:', error);
        setAvailableGigs([]);
      } finally {
        setLoadingGigs(false);
      }
    };

    loadAvailableGigs();
  }, []);

  // Load ongoing gigs (seller's accepted/in-progress gigs)
  useEffect(() => {
    const loadOngoingGigs = async () => {
      if (!user?.id) return;
      
      setLoadingOngoing(true);
      try {
        // Get the seller's accepted bids
        const acceptedBids = await api.bids.getBidsByStatus(user.id, ["accepted"]);
        
        
        
        // Fetch gig data for each accepted bid
        const ongoingGigsWithData = await Promise.all(
          acceptedBids.map(async (bid: any) => {
            try {
              const gigData = await api.gigs.getGigById(bid.gig_id);
              return {
                bid: bid,
                gig: gigData
              };
            } catch (error) {
              console.error(`Error fetching gig data for bid ${bid.id}:`, error);
              return null;
            }
          })
        );
        
        // Filter out any null results and convert to OngoingGig format
        const ongoing: OngoingGig[] = ongoingGigsWithData
          .filter((item: any) => item !== null)
          .filter((item: any) => {
            const status = item.gig.status?.toLowerCase();
            return status !== 'completed' && status !== 'pending_payment' && status !== 'paid';
          })
          .map((item: any) => ({
            id: item.gig.id.toString(),
            title: item.gig.title || "Legal Service",
            company: item.gig.buyer?.first_name && item.gig.buyer?.last_name 
              ? `${item.gig.buyer.first_name} ${item.gig.buyer.last_name}` 
              : item.gig.buyer?.first_name || item.gig.buyer?.last_name || "Anonymous Client",
            price: formatCurrency.naira(item.gig.budget, "Budget not specified"),
            dueDate: formatDate.full(item.gig.deadline),
            progress: item.gig.progress || 0, // Use real progress if available
            description: item.gig.description || "No description provided"
          }));
        
        console.log("acceptedBids:", acceptedBids);
        console.log("ongoing:", ongoing);
        setOngoingGigs(ongoing);
        
        // For completed gigs, we need to get gigs where the seller had accepted bids and the gig status is completed
        const completedGigsWithData = await Promise.all(
          acceptedBids.map(async (bid: any) => {
            try {
              const gigData = await api.gigs.getGigById(bid.gig_id);
              // Only include if the gig status is completed
              if (["completed", "pending_payment", "paid"].includes(gigData.status?.toLowerCase())) {
                return {
                  bid: bid,
                  gig: gigData
                };
              }
              return null;
            } catch (error) {
              console.error(`Error fetching gig data for bid ${bid.id}:`, error);
              return null;
            }
          })
        );
        
        const completed = completedGigsWithData
          .filter((item: any) => item !== null)
          .map((item: any) => ({
            id: item.gig.id.toString(),
            title: item.gig.title || "Legal Service",
            company: item.gig.buyer?.first_name && item.gig.buyer?.last_name 
              ? `${item.gig.buyer.first_name} ${item.gig.buyer.last_name}` 
              : item.gig.buyer?.first_name || item.gig.buyer?.last_name || "Anonymous Client",
            price: formatCurrency.naira(item.gig.budget, "Budget not specified"),
            completedDate: formatDate.full(item.gig.updated_at || item.gig.created_at),
            description: item.gig.description || "No description provided"
          }));
        
        setCompletedGigs(completed);
      } catch (error) {
        console.error('Error loading ongoing gigs:', error);
        setOngoingGigs([]);
        setCompletedGigs([]);
      } finally {
        setLoadingOngoing(false);
      }
    };

    loadOngoingGigs();
  }, [user?.id]);

  // Load active bids (seller's pending bids)
  useEffect(() => {
    const loadActiveBids = async () => {
      if (!user?.id) return;
      
      setLoadingActiveBids(true);
      try {
        const bids = await api.bids.getBidsByStatus(user.id, ["pending"]);
        setActiveBids(bids);
      } catch (error) {
        console.error('Error loading active bids:', error);
        setActiveBids([]);
      } finally {
        setLoadingActiveBids(false);
      }
    };

    loadActiveBids();
  }, [user?.id]);

  const handleViewDetails = (gig: SellerGig) => {
    
    
    setSelectedGig(gig);
    setViewMode("view-details");
  };

  const handlePlaceBid = (gig?: SellerGig) => {
    // Check if seller is verified
    if (user?.user_metadata?.status === 'pending' || user?.user_metadata?.status === 'rejected') {
      alert("Your account needs to be verified before you can place bids. Please contact support to complete verification.");
      return;
    }
    
    if (gig) {
      setSelectedGig(gig);
    }
    setViewMode("place-bid");
  };

  // Convert SellerGig to ViewDetailsGig
  const convertToViewDetailsGig = (gig: SellerGig): ViewDetailsGig => {
    // console.log("convertToViewDetailsGig gig:", gig);
    return {
      id: gig.id,
      title: gig.title,
      company: gig.company,
      price: gig.price,
      deadline: gig.deadline,
      postedDate: gig.postedDate,
      budget: gig.budget,
      deliveryTime: gig.deliveryTime,
      description: gig.description,
      requirements: gig.requirements,
      companyRating: gig.companyRating,
      projectsPosted: gig.projectsPosted,
      is_flagged: gig.is_flagged,
      status: gig.status
    };
  };

  // Handle ViewDetails onPlaceBid callback
  const handleViewDetailsPlaceBid = (gig: ViewDetailsGig) => {
    const sellerGig: SellerGig = {
      id: gig.id,
      title: gig.title,
      company: gig.company || "Client",
      price: gig.price || "Price not specified",
      deadline: gig.deadline,
      postedDate: gig.postedDate || new Date().toLocaleDateString(),
      budget: gig.budget || 0,
      deliveryTime: gig.deliveryTime || "To be negotiated",
      description: gig.description,
      requirements: gig.requirements || [],
      companyRating: gig.companyRating || 4.5,
      projectsPosted: gig.projectsPosted || 1,
      is_flagged: gig.is_flagged,
      status: gig.status,
      buyer_id: gig.buyer_id
    };
    handlePlaceBid(sellerGig);
  };



  const handleSubmitWork = (gig: OngoingGig) => {
    setSelectedOngoingGig(gig);
    setViewMode("submit-work");
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGig) return;
    
    // Check if seller is verified
    if (user?.user_metadata?.verification_status !== "verified") {
      alert("Your account needs to be verified before you can place bids. Please contact support to complete verification.");
      return;
    }
    console.log("selectedGig:", selectedGig);
    try {
      await api.bids.createBid(
        selectedGig.id,
        Number(bidFormData.bidAmount),
        bidFormData.proposal,
        selectedGig.buyer_id || ""
      );

      // Reset form and return to dashboard
      setBidFormData({
        bidAmount: "",
        deliveryTime: "",
        proposal: ""
      });
      setViewMode("dashboard");
    } catch (err) {
      console.error('Error submitting bid:', err);
      alert(err instanceof Error ? err.message : 'Failed to submit bid. Please try again.');
    }
  };

  const handleWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOngoingGig) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Convert secure files to the format expected by the API
      const files = submitWorkData.secureFiles.map(sf => sf.file);
      const blockchainHashes = submitWorkData.secureFiles
        .filter(sf => sf.status === 'completed' && sf.blockchainHash)
        .map(sf => ({
          fileName: sf.file.name,
          hash: sf.blockchainHash,
          txId: sf.ipfsCid // Use IPFS CID as transaction ID
        }));

      await api.submissions.createSubmission({
        gig_id: selectedOngoingGig.id,
        deliverables: files,
        notes: submitWorkData.description,
        blockchain_hashes: blockchainHashes,
        use_ipfs: true // Always use IPFS with secure upload
      });
      
      // Reset form and go back to dashboard
      setSubmitWorkData({ description: "", secureFiles: [] });
      setViewMode("dashboard");
    } catch (error) {
      console.error("Error submitting work:", error);
      setSubmitError("Failed to submit work. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecureUploadComplete = (files: SecureUploadResult[]) => {
    setSubmitWorkData(prev => ({
      ...prev,
      secureFiles: [...prev.secureFiles, ...files]
    }));
  };

  const handleSecureUploadError = (error: string) => {
    setSubmitError(error);
  };


  const renderBackButton = () => (
    <Button
      variant="ghost"
      onClick={() => setViewMode("dashboard")}
      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
    >
      <ArrowLeftIcon className="w-4 h-4" />
      Back to Dashboard
    </Button>
  );

  if (viewMode === "place-bid" && selectedGig) {
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
                <Link to="/seller-dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700 text-white">
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
                <Link to="/seller-messages" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
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
                <div className="text-sm font-medium">{formatUser.displayName(user, 'Seller')}</div>
                <div className="text-xs text-gray-400">{user?.email || 'No email'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Place Bid */}
        <div className="flex-1 flex flex-col">
          <Header title="Place a Bid" />

          {/* Place Bid Content */}
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              {renderBackButton()}

              {/* Gig Summary */}
              <Card className="bg-blue-50 border border-blue-200 mb-8">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{selectedGig.title}</h2>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <span className="text-gray-600">Budget:</span>
                      <div className="font-semibold text-gray-900">{selectedGig.budget}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Deadline:</span>
                      <div className="font-semibold text-gray-900">{selectedGig.deadline}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Delivery Time:</span>
                      <div className="font-semibold text-gray-900">{selectedGig.deliveryTime}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bid Form */}
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-8">
                  <form onSubmit={handleBidSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bid Amount (₦)
                        </label>
                        <input
                          type="number"
                          value={bidFormData.bidAmount}
                          onChange={(e) => setBidFormData(prev => ({ ...prev, bidAmount: e.target.value }))}
                          placeholder="50000"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delivery Time
                        </label>
                        <input
                          type="text"
                          value={bidFormData.deliveryTime}
                          onChange={(e) => setBidFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                          placeholder="e.g., 5 days"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proposal
                      </label>
                      <textarea
                        value={bidFormData.proposal}
                        onChange={(e) => setBidFormData(prev => ({ ...prev, proposal: e.target.value }))}
                        placeholder="Describe your experience and approach to completing this task..."
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none resize-none"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-4 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setViewMode("dashboard")}
                        className="px-8 py-3"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-8 py-3"
                      >
                        Submit Bid
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (viewMode === "view-details" && selectedGig) {
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
                <Link to="/seller-dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700 text-white">
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
                <Link to="/seller-messages" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
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
                <div className="text-sm font-medium">{formatUser.displayName(user, 'Seller')}</div>
                <div className="text-xs text-gray-400">{user?.email || 'No email'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - View Details */}
        <div className="flex-1 flex flex-col">
          <Header title="Gig Details" />

          {/* View Details Content */}
          <main className="flex-1 p-6">
            {selectedGig ? (
              <ViewDetails
                gig={convertToViewDetailsGig(selectedGig)}
                onBack={() => setViewMode("dashboard")}
                onPlaceBid={handleViewDetailsPlaceBid}
                backButtonText="Back to Dashboard"
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No gig selected</p>
                <Button onClick={() => setViewMode("dashboard")} className="mt-4">
                  Back to Dashboard
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  if (viewMode === "submit-work" && selectedOngoingGig) {
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
                <Link to="/seller-dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700 text-white">
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
                <Link to="/seller-messages" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
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
                <div className="text-sm font-medium">{formatUser.displayName(user, 'Seller')}</div>
                <div className="text-xs text-gray-400">{user?.email || 'No email'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Submit Work */}
        <div className="flex-1 flex flex-col">
          <Header title="Submit Work" />

          {/* Submit Work Content */}
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              {renderBackButton()}

              {/* Project Summary */}
              <Card className="bg-green-50 border border-green-200 mb-8">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{selectedOngoingGig.title}</h2>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <span className="text-gray-600">Client:</span>
                      <div className="font-semibold text-gray-900">{selectedOngoingGig.company}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Due Date:</span>
                      <div className="font-semibold text-gray-900">{selectedOngoingGig.dueDate}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Project Value:</span>
                      <div className="font-semibold text-gray-900">{selectedOngoingGig.price}</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Current Progress: {selectedOngoingGig.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${selectedOngoingGig.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Work Form */}
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-8">
                  {submitError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                      {submitError}
                    </div>
                  )}
                  <form onSubmit={handleWorkSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Work Description
                      </label>
                      <textarea
                        value={submitWorkData.description}
                        onChange={(e) => setSubmitWorkData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the work completed, findings, and any recommendations..."
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none resize-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Upload Legal Documents
                      </label>
                      
                      <SecureLegalUpload
                        onUploadComplete={handleSecureUploadComplete}
                        onUploadError={handleSecureUploadError}
                        maxFiles={10}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="flex justify-end gap-4 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setViewMode("dashboard")}
                        className="px-8 py-3"
                      >
                        Save as Draft
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 disabled:opacity-50"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Work"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Default dashboard view
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <SellerSidebar activePage="dashboard" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title="Legal Professional Dashboard" />

        {/* Dashboard Content */}
        <main className="flex-1 p-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-[#FEC85F] to-[#f5c55a] rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#1B1828] mb-2">
                  Welcome back, {user?.name || user?.user_metadata?.firstName || 'User'}
                </h2>
                <p className="text-[#1B1828]/80">Find and manage legal gigs for property services</p>
              </div>
              <Link to="/find-gigs">
                <Button className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white">
                  Find Gigs
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
                    <GavelIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Pending Bids</div>
                    <div className="text-2xl font-bold text-gray-900">{activeBids.length}</div>
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
                    <div className="text-sm text-gray-600">Ongoing Gigs</div>
                    <div className="text-2xl font-bold text-gray-900">{ongoingGigs.length}</div>
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
                    <div className="text-2xl font-bold text-gray-900">{completedGigs.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-2 gap-8">
            {/* Available Gigs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Available Gigs</h3>
                {availableGigs.length > 1 && (
                  <Link to="/find-gigs" className="text-gray-400 hover:text-gray-600">
                    <ChevronRightIcon className="w-5 h-5" />
                  </Link>
                )}
              </div>
              <p className="text-gray-600 mb-6">Recently posted gigs that matches your expertise</p>
              
              {loadingGigs ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading available gigs...</p>
                </div>
              ) : availableGigs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No available gigs at the moment</p>
                  <p className="text-sm text-gray-400 mt-2">Check back later for new opportunities</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableGigs.slice(0, 1).map((gig) => (
                    <Card key={gig.id} className="bg-white border border-gray-200">
                      <CardContent className="p-6">
                        <h4 className="font-semibold text-gray-900 mb-2">{gig.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">Posted by {gig.company}</p>
                        <p className="text-sm text-gray-600 mb-4">Deadline: {gig.deadline}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-gray-900">{gig.price}</span>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handlePlaceBid(gig)}
                              className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
                              disabled={gig.status === 'suspended' || user?.user_metadata?.verification_status === 'pending' || user?.user_metadata?.verification_status === 'rejected'}
                            >
                              {gig.status === 'suspended' ? 'Gig Suspended' : 
                               user?.user_metadata?.verification_status === 'pending' ? 'Verification Pending' :
                               user?.user_metadata?.verification_status === 'rejected' ? 'Verification Rejected' : 'Place Bid'}
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => handleViewDetails(gig)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Your Active Bids */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Your Pending Bids</h3>
                  {activeBids.length > 1 && (
                    <Link to="/active-bids" className="text-gray-400 hover:text-gray-600">
                      <ChevronRightIcon className="w-5 h-5" />
                    </Link>
                  )}
                </div>
                <p className="text-gray-600 mb-6">Bids you've placed that are awaiting client decisions</p>
                
                {loadingActiveBids ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading active bids...</p>
                  </div>
                ) : activeBids.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No pending bids</p>
                    <p className="text-sm text-gray-400 mt-2">Place bids on available gigs to see them here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeBids.slice(0, 1).map((bid) => (
                      bid.gigDeadline = bid.gig?.deadline,
                      bid.gigBudget = bid.gig?.budget,
                      bid.deliveryTime = bid.delivery_time,
                      
                      <Card key={bid.id} className="bg-white border border-gray-200">
                        <CardContent className="p-6">
                          <h4 className="font-semibold text-gray-900 mb-2">Bid #{bid.id}</h4>
                          <p className="text-sm text-gray-600 mb-2">Gig ID: {bid.gig_id}</p>
                          <p className="text-sm text-gray-600 mb-4">Status: {bid.status}</p>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <span className="text-lg font-bold text-gray-900">₦{bid.amount?.toLocaleString()}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{bid.description}</p>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              className="border-[#FEC85F] text-[#FEC85F] hover:bg-[#FEC85F] hover:text-[#1B1828]"
                              onClick={() => navigate('/active-bids', { 
                                state: { 
                                  viewMode: 'edit-bid',
                                  bidData: bid
                                }
                              })}
                            >
                              Edit Bid
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => navigate('/active-bids')}
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Ongoing Gigs */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Jobs</h3>
                  {ongoingGigs.length > 1 && (
                    <Link to="/seller-gigs?tab=ongoing" className="text-gray-400 hover:text-gray-600">
                      <ChevronRightIcon className="w-5 h-5" />
                    </Link>
                  )}
                </div>
                <p className="text-gray-600 mb-6">Gigs you are currently working on</p>
                
                {loadingOngoing ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading ongoing gigs...</p>
                  </div>
                ) : ongoingGigs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No ongoing gigs</p>
                    <p className="text-sm text-gray-400 mt-2">Place bids on available gigs to start working</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ongoingGigs.slice(0, 1).map((gig) => (
                      <Card key={gig.id} className="bg-white border border-gray-200">
                        <CardContent className="p-6">
                          <h4 className="font-semibold text-gray-900 mb-2">{gig.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">Client: {gig.company}</p>
                          <p className="text-sm text-gray-600 mb-2">Due: {gig.dueDate}</p>
                          <p className="text-lg font-bold text-gray-900 mb-4">{gig.price}</p>
                          
                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">Progress: {gig.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${gig.progress}%` }}></div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => navigate("/seller-messages")}
                              className="border-blue-500 text-blue-500 hover:bg-blue-50"
                            >
                              Message Client
                            </Button>
                            <Button 
                              onClick={() => handleSubmitWork(gig)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Submit Work
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};