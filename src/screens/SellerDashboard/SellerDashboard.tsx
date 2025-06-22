import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { ViewDetails } from "../../components/ViewDetails";
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
  ArrowLeftIcon
} from "lucide-react";

type ViewMode = "dashboard" | "place-bid" | "view-details" | "submit-work" | "edit-bid";

// Import Gig type from ViewDetails
import type { Gig } from "../../components/ViewDetails";

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
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [selectedOngoingGig, setSelectedOngoingGig] = useState<OngoingGig | null>(null);
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

  // State for fetched data
  const [availableGigs, setAvailableGigs] = useState<Gig[]>([]);
  const [pendingBids, setPendingBids] = useState<any[]>([]);
  const [activeBids, setActiveBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch available gigs with "pending" status
        const gigsData = await api.gigs.getAllGigs();
        const pendingGigs = gigsData.filter((gig: any) => gig.status === 'pending');
        setAvailableGigs(pendingGigs);

        // Fetch seller's bids
        const bidsData = await api.bids.getActiveBids(user.id);
        
        // Separate bids by status
        const pending = bidsData.filter((bid: any) => bid.status === 'pending');
        const active = bidsData.filter((bid: any) => bid.status === 'active');
        
        setPendingBids(pending);
        setActiveBids(active);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  const handleViewDetails = (gig: Gig) => {
    setSelectedGig(gig);
    setViewMode("view-details");
  };

  const handlePlaceBid = (gig?: Gig) => {
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


  const handleEditBid = () => {
    // Navigate to ActiveBids with state to indicate we want to edit a specific bid
    navigate('/active-bids', { 
      state: { 
        viewMode: 'edit-bid',
        bidId: 1, // Using a placeholder ID for the active bid
        bidData: {
          id: 1,
          title: "Property Survey - Lekki Phase 1",
          client: "Prestige Homes",
          bidAmount: "₦75,000",
          deliveryTime: "7 days",
          dueDate: "10/06/2025",
          status: "active",
          proposal: "I'll provide a comprehensive property survey including boundary markers, topographical analysis, and legal documentation review.",
          originalBudget: "₦80,000",
          previousBid: "₦75,000"
        }
      }
    });
  };

  const handleSubmitWork = (gig: OngoingGig) => {
    setSelectedOngoingGig(gig);
    setViewMode("submit-work");
  };

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if seller is verified
    if (user?.user_metadata?.status === 'pending' || user?.user_metadata?.status === 'rejected') {
      alert("Your account needs to be verified before you can place bids. Please contact support to complete verification.");
      return;
    }
    
    console.log("Bid submitted:", bidFormData);
    setViewMode("dashboard");
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
                <div className="text-sm font-medium">Demo Seller</div>
                <div className="text-xs text-gray-400">seller@example.com</div>
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
                <div className="text-sm font-medium">Demo Seller</div>
                <div className="text-xs text-gray-400">seller@example.com</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - View Details */}
        <div className="flex-1 flex flex-col">
          <Header title="Gig Details" />

          {/* View Details Content */}
          <main className="flex-1 p-6">
            <ViewDetails
              gig={selectedGig}
              onBack={() => setViewMode("dashboard")}
              onPlaceBid={handlePlaceBid}
              backButtonText="Back to Dashboard"
            />
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
                <div className="text-sm font-medium">Demo Seller</div>
                <div className="text-xs text-gray-400">seller@example.com</div>
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
                <h2 className="text-2xl font-bold text-[#1B1828] mb-2">Welcome back, Demo</h2>
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
                    <div className="text-sm text-gray-600">Active Bids</div>
                    <div className="text-2xl font-bold text-gray-900">{pendingBids.length}</div>
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
                    <div className="text-2xl font-bold text-gray-900">{activeBids.length}</div>
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
                    <div className="text-sm text-gray-600">Available Gigs</div>
                    <div className="text-2xl font-bold text-gray-900">{availableGigs.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-2 gap-8">
            {/* Available Gigs */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Gigs</h3>
              <p className="text-gray-600 mb-6">Recently posted gigs that matches your expertise</p>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B1828] mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading gigs...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()}>Try Again</Button>
                </div>
              ) : availableGigs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No pending gigs available at the moment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableGigs.map((gig) => (
                    <Card key={gig.id} className="bg-white border border-gray-200">
                      <CardContent className="p-6">
                        <h4 className="font-semibold text-gray-900 mb-2">{gig.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Posted by {gig.buyer?.name || gig.buyer?.email || 'Unknown Client'}
                        </p>
                        <p className="text-sm text-gray-600 mb-4">Deadline: {new Date(gig.deadline).toLocaleDateString()}</p>
                        <div className="flex flex-col gap-4">
                          <span className="text-lg font-bold text-gray-900">
                            {gig.budget ? `₦${gig.budget.toLocaleString()}` : gig.price || 'Not specified'}
                          </span>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handlePlaceBid(gig)}
                              className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
                              disabled={gig.status === 'suspended' || user?.user_metadata?.status === 'pending' || user?.user_metadata?.status === 'rejected'}
                            >
                              {gig.status === 'suspended' ? 'Gig Suspended' : 
                               user?.user_metadata?.status === 'pending' ? 'Verification Pending' :
                               user?.user_metadata?.status === 'rejected' ? 'Account Rejected' :
                               'Place Bid'}
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
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Active Bids</h3>
                <p className="text-gray-600 mb-6">Bids you've placed that are awaiting client decisions</p>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B1828] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading bids...</p>
                  </div>
                ) : pendingBids.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No pending bids at the moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingBids.map((bid) => (
                      <Card key={bid.id} className="bg-white border border-gray-200">
                        <CardContent className="p-6">
                          <h4 className="font-semibold text-gray-900 mb-2">{bid.gig?.title || 'Unknown Gig'}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            Client: {bid.gig?.buyer?.name || bid.gig?.buyer?.email || bid.gig?.company || 'Unknown Client'}
                          </p>
                          <p className="text-sm text-gray-600 mb-4">Bid placed on: {new Date(bid.created_at).toLocaleDateString()}</p>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <span className="text-lg font-bold text-gray-900">₦{bid.amount?.toLocaleString()}</span>
                              {bid.gig?.budget && (
                                <span className="text-sm text-gray-500 ml-2">Original: ₦{bid.gig.budget.toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              className="border-[#FEC85F] text-[#FEC85F] hover:bg-[#FEC85F] hover:text-[#1B1828]"
                              onClick={() => handleEditBid()}
                            >
                              Edit Bid
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => {
                                if (bid.gig) {
                                  handleViewDetails(bid.gig);
                                }
                              }}
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
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Ongoing Gigs</h3>
                <p className="text-gray-600 mb-6">Gigs you are currently working on</p>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B1828] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading ongoing gigs...</p>
                  </div>
                ) : activeBids.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No ongoing gigs at the moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeBids.map((bid) => (
                      <Card key={bid.id} className="bg-white border border-gray-200">
                        <CardContent className="p-6">
                          <h4 className="font-semibold text-gray-900 mb-2">{bid.gig?.title || 'Unknown Gig'}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            Client: {bid.gig?.buyer?.name || bid.gig?.buyer?.email || bid.gig?.company || 'Unknown Client'}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">Due: {new Date(bid.gig?.deadline).toLocaleDateString()}</p>
                          <p className="text-lg font-bold text-gray-900 mb-4">₦{bid.amount?.toLocaleString()}</p>
                          
                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">Progress: 0%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
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
                              onClick={() => {
                                // Convert bid to OngoingGig format for handleSubmitWork
                                const ongoingGig: OngoingGig = {
                                  id: bid.gig?.id || bid.id,
                                  title: bid.gig?.title || 'Unknown Gig',
                                  company: bid.gig?.buyer?.name || bid.gig?.buyer?.email || bid.gig?.company || 'Unknown Client',
                                  price: `₦${bid.amount?.toLocaleString()}`,
                                  dueDate: bid.gig?.deadline ? new Date(bid.gig.deadline).toLocaleDateString() : 'Unknown',
                                  progress: 0,
                                  description: bid.gig?.description || ''
                                };
                                handleSubmitWork(ongoingGig);
                              }}
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