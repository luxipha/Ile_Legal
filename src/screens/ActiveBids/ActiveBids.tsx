import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { formatCurrency, formatDate, formatUser } from "../../utils/formatters";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Header } from "../../components/Header/Header";
import { SellerSidebar } from "../../components/SellerSidebar/SellerSidebar";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { 
  CalendarIcon,
  ArrowLeftIcon,
  StarIcon,
  BuildingIcon,
  SendIcon,
  PaperclipIcon,
  UserIcon,
  SearchIcon,
  GavelIcon,
  MessageSquareIcon,
  DollarSignIcon
} from "lucide-react";

type ViewMode = "list" | "edit-bid" | "view-details";

interface Bid {
  id: string;
  gig_id: string;
  seller_id: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
  // Additional fields for UI display
  title?: string;
  company?: string;
  bidSubmitted?: string;
  dueDate?: string;
  statusColor?: string;
  originalBudget?: string;
  deliveryTime?: string;
  companyRating?: number;
  projectsPosted?: number;
  requirements?: string[];
  postedDate?: string;
  previousBid?: string;
  sellerRating?: number;
  gigDeadline?: string | null;
  gigBudget?: number | null;
  // Seller information from Profiles table
  seller?: {
    id: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    title?: string;
    avatar_url?: string;
    bio?: string;
    email?: string;
  };
  gig?: {
    status: string;
  };
}

export const ActiveBids = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "bids" | "messages">("details");
  const [activeBids, setActiveBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gigBids, setGigBids] = useState<Bid[]>([]);
  const [gigData, setGigData] = useState<any>(null);
  const [buyerRating, setBuyerRating] = useState<number>(0);
  const [buyerGigsCount, setBuyerGigsCount] = useState<number>(0);
  
  // Fetch active bids on component mount
  useEffect(() => {
    fetchActiveBids();
  }, []);

  // Fetch gig data when in view-details mode
  useEffect(() => {
    if (viewMode === "view-details" && selectedBid?.gig_id) {
      fetchGigData(selectedBid.gig_id);
      fetchGigBids(selectedBid.gig_id);
    }
  }, [viewMode, selectedBid?.gig_id]);

  // Fetch bids for specific gig when in view-details mode and bids tab is active
  useEffect(() => {
    if (viewMode === "view-details" && activeTab === "bids" && selectedBid?.gig_id) {
      fetchGigBids(selectedBid.gig_id);
    }
  }, [viewMode, activeTab, selectedBid?.gig_id]);

  // Fetch buyer rating when gig data is available
  useEffect(() => {
    if (gigData?.buyer?.id) {
      fetchBuyerRating(gigData.buyer.id);
      fetchBuyerGigsCount(gigData.buyer.id);
    }
  }, [gigData?.buyer?.id]);

  // Handle navigation state for editing bids
  useEffect(() => {
    if (location.state) {
      const { viewMode: navigationViewMode, bidData } = location.state;
      
      if (navigationViewMode === 'edit-bid' && bidData) {
        setSelectedBid(bidData);
        setEditFormData({
          bidAmount: bidData.amount.toString(),
          deliveryTime: bidData.deliveryTime || "",
          proposal: bidData.description
        });
        setViewMode("edit-bid");
      }
    }
  }, [location]);

  const fetchActiveBids = async () => {
    if (!user) {
      setError("Please log in to view your bids");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const bids = await api.bids.getAllBids(user.id);
      
      // Transform the data to match the expected format
      const bidsWithGigData = bids.map((bid) => ({
        ...bid,
        gigDeadline: bid.gig?.deadline,
        gigBudget: bid.gig?.budget,
        previousBid: bid.previous_amount,
        deliveryTime: bid.delivery_time
      }));
      
      setActiveBids(bidsWithGigData);
      setError(null);
    } catch (err) {
      setError("Failed to fetch active bids");
      console.error("Error fetching active bids:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGigBids = async (gigId: string) => {
    try {
      const bids = await api.bids.getBidsByGigId(gigId);
      
      // Fetch average ratings for each seller
      const bidsWithRatings = await Promise.all(
        bids.map(async (bid) => {
          try {
            const averageRating = await api.feedback.getAverageRating(bid.seller_id);
            return {
              ...bid,
              sellerRating: averageRating
            };
          } catch (error) {
            console.error(`Error fetching rating for seller ${bid.seller_id}:`, error);
            return {
              ...bid,
              sellerRating: 0
            };
          }
        })
      );
      
      setGigBids(bidsWithRatings);
    } catch (err) {
      console.error("Error fetching gig bids:", err);
      setError("Failed to fetch bids for this gig");
    }
  };

  const fetchGigData = async (gigId: string) => {
    try {
      const data = await api.gigs.getGigById(gigId);
      setGigData(data);
    } catch (err) {
      console.error("Error fetching gig data:", err);
      setError("Failed to fetch gig data");
    }
  };

  const fetchBuyerRating = async (buyerId: string) => {
    try {
      const rating = await api.feedback.getAverageRating(buyerId);
      setBuyerRating(rating);
    } catch (err) {
      console.error("Error fetching buyer rating:", err);
      setError("Failed to fetch buyer rating");
    }
  };

  const fetchBuyerGigsCount = async (buyerId: string) => {
    try {
      const gigs = await api.gigs.getMyGigs(buyerId);
      setBuyerGigsCount(gigs.length);
    } catch (err) {
      console.error("Error fetching buyer gigs count:", err);
      setError("Failed to fetch buyer gigs count");
    }
  };
  
  const [editFormData, setEditFormData] = useState({
    bidAmount: "",
    deliveryTime: "",
    proposal: ""
  });
  const [newMessage, setNewMessage] = useState("");

  const handleEditBid = (bid: Bid) => {
    // Disable editing for accepted bids
    if (bid.status === 'accepted') {
      return;
    }
    
    console.log('bid:', bid);
    setSelectedBid(bid);
    setEditFormData({
      bidAmount: bid.amount.toString(),
      deliveryTime: bid.deliveryTime || "",
      proposal: bid.description
    });
    setViewMode("edit-bid");
  };

  const handleViewDetails = (bid: Bid) => {
    setSelectedBid(bid);
    setViewMode("view-details");
    setActiveTab("details");
  };

  const handleMessageClient = (bid: Bid) => {
    navigate("/messages", { state: { clientId: bid.company } });
  };

  const handleUpdateBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBid) return;

    try {
      await api.bids.updateBid(selectedBid.id, {
        amount: parseFloat(editFormData.bidAmount),
        description: editFormData.proposal,
        delivery_time: editFormData.deliveryTime
      });
      
      // Refresh the bids list
      await fetchActiveBids();
      setViewMode("list");
    } catch (err) {
      console.error("Error updating bid:", err);
      setError("Failed to update bid");
    }
  };

  const handleDeleteBid = async (bidId: string) => {
    try {
      await api.bids.deleteBid(bidId);
      await fetchActiveBids();
    } catch (err) {
      console.error("Error deleting bid:", err);
      setError("Failed to delete bid");
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Handle message sending
      setNewMessage("");
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

  const renderBackButton = () => (
    <Button
      variant="ghost"
      onClick={() => setViewMode("list")}
      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
    >
      <ArrowLeftIcon className="w-4 h-4" />
      Back to Active Bids
    </Button>
  );

  if (viewMode === "edit-bid" && selectedBid) {
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
                <Link to="/active-bids" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700 text-white">
                  <GavelIcon className="w-5 h-5" />
                  Active Bids
                </Link>
              </li>
              <li>
                <Link to="/messages" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
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

        {/* Main Content - Edit Bid */}
        <div className="flex-1 flex flex-col">
          <Header title="Edit Bid" />

          {/* Edit Bid Content */}
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              {renderBackButton()}

              {/* Gig Summary */}
              <Card className="bg-blue-50 border border-blue-200 mb-8">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{selectedBid.title}</h2>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <span className="text-gray-600">Budget:</span>
                      <div className="font-semibold text-gray-900">{selectedBid.gigBudget ? formatCurrency.naira(selectedBid.gigBudget) : 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Deadline:</span>
                      <div className="font-semibold text-gray-900">{selectedBid.gigDeadline ? formatDate.full(selectedBid.gigDeadline) : 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Previous Bid:</span>
                      <div className="font-semibold text-gray-900">{selectedBid.previousBid ? formatCurrency.naira(selectedBid.previousBid) : 'N/A'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Edit Form */}
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-8">
                  <form onSubmit={handleUpdateBid} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bid Amount (₦)
                        </label>
                        <input
                          type="number"
                          value={editFormData.bidAmount}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, bidAmount: e.target.value }))}
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
                          value={editFormData.deliveryTime}
                          onChange={(e) => {
                            console.log('editFormData:', editFormData);
                            setEditFormData(prev => ({ ...prev, deliveryTime: e.target.value }));
                          }}
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
                        value={editFormData.proposal}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, proposal: e.target.value }))}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none resize-none"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-4 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setViewMode("list")}
                        className="px-8 py-3"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-8 py-3"
                      >
                        Update Bid
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

  if (viewMode === "view-details" && selectedBid) {
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
                <Link to="/active-bids" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700 text-white">
                  <GavelIcon className="w-5 h-5" />
                  Active Bids
                </Link>
              </li>
              <li>
                <Link to="/messages" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
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
          <Header title="Bid Details" />

          {/* View Details Content */}
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              {renderBackButton()}

              {/* Title and Status */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedBid.title}</h1>
                  <div className="flex items-center gap-6 text-gray-600">
                    <span>Posted {formatDate.full(selectedBid.created_at)}</span>
                    <span>Deadline {gigData?.deadline ? formatDate.full(gigData.deadline) : 'N/A'}</span>
                    <span>Budget {gigData?.budget ? formatCurrency.naira(gigData.budget) : 'N/A'}</span>
                  </div>
                </div>
                <span className="bg-[#FEC85F] text-[#1B1828] px-4 py-2 rounded-lg font-medium">
                  Open for Bids
                </span>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex gap-8">
                  {[
                    { id: "details", label: "Details" },
                    { id: "bids", label: `Bids (${viewMode === "view-details" ? gigBids.length : activeBids.length})` },
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
                      <p className="text-gray-600 mb-6 leading-relaxed">{selectedBid.description}</p>
                      
                      
                    </div>
                  )}

                  {activeTab === "bids" && (
                    <div className="space-y-6">
                      {/* Other Bids */}
                      {(viewMode === "view-details" ? gigBids : activeBids).map((bid) => {
                        const isUserBid = bid.seller_id === user?.id;
                        console.log("bid:", bid);
                        return (
                          <Card key={bid.id} className={`border ${isUserBid ? 'border-2 border-[#FEC85F] bg-[#FEC85F]/5' : 'border-gray-200'}`}>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                {isUserBid && (
                                  <span className="bg-[#FEC85F] text-[#1B1828] px-3 py-1 rounded-full text-sm font-medium">
                                    Your Bid
                                  </span>
                                )}
                                <div className="mb-4 flex gap-2">
                                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                    bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {"Bid " + bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                                  </span>
                                  {bid.gig?.status && (
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                      bid.gig.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                                      bid.gig.status === 'active' ? 'bg-green-100 text-green-800' :
                                      bid.gig.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                                      bid.gig.status === 'suspended' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {"Gig " + bid.gig.status.charAt(0).toUpperCase() + bid.gig.status.slice(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700 overflow-hidden">
                                  {bid.seller?.avatar_url ? (
                                    <img 
                                      src={bid.seller.avatar_url} 
                                      alt={`${bid.seller?.first_name} ${bid.seller?.last_name}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // Fallback to initials if image fails to load
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                  ) : null}
                                  <div className={`${bid.seller?.avatar_url ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                                    {bid.seller?.first_name?.charAt(0) || bid.seller?.last_name?.charAt(0) || bid.company?.charAt(0) || 'U'}
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <h4 className="font-semibold text-gray-900">{bid.seller?.first_name + " " + bid.seller?.last_name || bid.company}</h4>
                                      <p className="text-gray-600">{bid.seller?.title || bid.title}</p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-gray-900">{bid.amount}</div>
                                      <div className="text-sm text-gray-500">{bid.deliveryTime}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 mb-3">
                                    <div className="flex items-center gap-1">
                                      {renderStars(Math.floor(bid.sellerRating || 0))}
                                      <span className="text-sm text-gray-600 ml-1">{bid.sellerRating?.toFixed(1) || 'N/A'}</span>
                                    </div>
                                    {/* <span className="text-sm text-gray-600">{bid.projectsPosted} projects posted</span> */}
                                    <span className="text-sm text-gray-500">Submitted: {formatDate.full(bid.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <h5 className="font-medium text-gray-900 mb-2">Proposal</h5>
                                <p className="text-gray-600">{bid.description}</p>
                              </div>

                              {isUserBid && (
                                <div className="flex gap-3">
                                  {bid.status !== 'accepted' && (
                                    <Button 
                                      onClick={() => handleEditBid(bid)}
                                      className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
                                    >
                                      Edit Bid
                                    </Button>
                                  )}
                                  <Button 
                                    variant="outline"
                                    onClick={() => handleMessageClient(bid)}
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                  >
                                    Message Client
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {activeTab === "messages" && (
                    <div className="space-y-4">
                      {/* Messages */}
                      <div className="space-y-4 mb-6">
                        {/* Messages */}
                        {/* Messages */}
                      </div>

                      {/* Message Input */}
                      <div className="flex items-end gap-3 p-4 border border-gray-200 rounded-lg">
                        <Button variant="ghost" size="sm">
                          <PaperclipIcon className="w-5 h-5 text-gray-400" />
                        </Button>
                        
                        <div className="flex-1">
                          <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full px-3 py-2 border-0 resize-none focus:outline-none"
                            rows={1}
                          />
                        </div>
                        
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] p-2"
                        >
                          <SendIcon className="w-4 h-4" />
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
                        {gigData?.buyer?.avatar_url ? (
                          <img 
                            src={gigData.buyer.avatar_url} 
                            alt={`${gigData.buyer?.first_name} ${gigData.buyer?.last_name}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`${gigData?.buyer?.avatar_url ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                          <BuildingIcon className="w-8 h-8 text-gray-600" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {gigData?.buyer?.first_name && gigData?.buyer?.last_name 
                          ? `${gigData.buyer.first_name} ${gigData.buyer.last_name}` 
                          : selectedBid.company || 'Unknown Buyer'
                        }
                      </h3>
                      <div className="flex items-center justify-center gap-1 mb-2">
                        {renderStars(Math.floor(buyerRating || 0))}
                        <span className="text-sm text-gray-600 ml-1">{buyerRating?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <p className="text-sm text-gray-600">{buyerGigsCount} gigs created</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Default list view
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <SellerSidebar activePage="active-bids" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title="Active Bids" />

        {/* Active Bids Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B1828] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading active bids...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {activeBids.map((bid) => (
                  <Card key={bid.id} className="bg-white border border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      {/* Status Badge */}
                      <div className="mb-4 flex gap-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {"Bid " + bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                        </span>
                        {bid.gig?.status && (
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            bid.gig.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                            bid.gig.status === 'active' ? 'bg-green-100 text-green-800' :
                            bid.gig.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                            bid.gig.status === 'suspended' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {"Gig " + bid.gig.status.charAt(0).toUpperCase() + bid.gig.status.slice(1)}
                          </span>
                        )}
                      </div>

                      {/* Bid Title */}
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{bid.title}</h3>
                      <p className="text-gray-600 mb-4">{bid.company}</p>

                      {/* Bid Details */}
                      <div className="flex items-center gap-6 mb-6">
                        <div className="flex items-center gap-2 text-gray-600">
                          <CalendarIcon className="w-4 h-4" />
                          <span className="text-sm">Submitted</span>
                        </div>
                        <div className="text-sm text-gray-900 font-medium">
                          {formatDate.full(bid.created_at)}
                        </div>
                        {bid.gigBudget && (
                          <>
                            <div className="flex items-center gap-2 text-gray-600">
                              <DollarSignIcon className="w-4 h-4" />
                              <span className="text-sm">Gig Budget</span>
                            </div>
                            <div className="text-sm text-gray-900 font-medium">
                              {formatCurrency.naira(bid.gigBudget)}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Price and Due Date */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="text-3xl font-bold text-gray-900">{formatCurrency.naira(bid.amount)}</div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-1">Due Date:</div>
                          <div className="bg-[#FEC85F] text-[#1B1828] px-3 py-1 rounded-lg font-medium">
                            {bid.gigDeadline ? formatDate.full(bid.gigDeadline) : 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        {bid.status !== 'accepted' && (
                          <Button 
                            onClick={() => handleEditBid(bid)}
                            className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
                          >
                            Edit Bid
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          onClick={() => handleMessageClient(bid)}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Message Client
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleViewDetails(bid)}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          View Details
                        </Button>
                        {bid.status === 'pending' && (
                          <Button 
                            variant="outline" 
                            onClick={() => handleDeleteBid(bid.id)}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Delete Bid
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {activeBids.length === 0 && (
                  <div className="text-center py-12">
                    <GavelIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active bids</h3>
                    <p className="text-gray-600 mb-6">You haven't placed any bids yet. Start browsing available gigs to place your first bid.</p>
                    <Link to="/find-gigs">
                      <Button className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white">
                        Find Gigs
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};