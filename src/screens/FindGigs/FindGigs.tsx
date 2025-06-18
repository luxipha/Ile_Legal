import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { ViewDetails } from "../../components/ViewDetails";
import { Header } from "../../components/Header/Header";
import { SellerSidebar } from "../../components/SellerSidebar/SellerSidebar";
import { api } from "../../services/api";

import { 
  SearchIcon, 
  FilterIcon, 
  GridIcon, 
  ListIcon,
  CalendarIcon,
  ArrowLeftIcon
} from "lucide-react";

type ViewMode = "list" | "view-details" | "place-bid";


// Remove the local interface Gig definition
interface Gig {
  id: string;
  title: string;
  description: string;
  categories: string[];
  budget: number;
  deadline: string;
  status: string;
  buyer_id: string;
  created_at: string;
  attachments?: string[];
}

export const FindGigs = (): JSX.Element => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [gridViewMode, setGridViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidFormData, setBidFormData] = useState({
    bidAmount: "",
    deliveryTime: "",
    proposal: ""
  });
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);

  const categories = [
    "All Categories",
    "Land Title Verification",
    "C of O",
    "Contract Review",
    "Property Survey",
    "Due Diligence",
    "Legal Documentation"
  ];

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        setLoading(true);
        const data = await api.gigs.getAllGigs({
          status: 'active'
        });
        setGigs(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch gigs. Please try again later.');
        console.error('Error fetching gigs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGigs();
  }, []);

  const filteredGigs = gigs.filter(gig => {
    const matchesSearch = gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gig.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || 
                           gig.categories.includes(selectedCategory.toLowerCase().replace(/\s+/g, '-'));
    return matchesSearch && matchesCategory;
  });

  const handleViewDetails = (gig: Gig) => {
    setSelectedGig(gig);
    setViewMode("view-details");
  };

  const handlePlaceBid = (gig: Gig) => {
    setSelectedGig(gig);
    setViewMode("place-bid");
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGig) return;

    try {
      setIsSubmittingBid(true);
      setBidError(null);

      await api.bids.createBid(
        selectedGig.id,
        Number(bidFormData.bidAmount),
        bidFormData.proposal,
        selectedGig.buyer_id
      );

      // Reset form and return to list view
      setBidFormData({
        bidAmount: "",
        deliveryTime: "",
        proposal: ""
      });
      setViewMode("list");
    } catch (err) {
      console.error('Error submitting bid:', err);
      setBidError(err instanceof Error ? err.message : 'Failed to submit bid. Please try again.');
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const renderBackButton = () => (
    <Button
      variant="ghost"
      onClick={() => setViewMode("list")}
      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
    >
      <ArrowLeftIcon className="w-4 h-4" />
      Back to Find Gigs
    </Button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B1828] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading gigs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (viewMode === "place-bid" && selectedGig) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <SellerSidebar activePage="find-gigs" />

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
                      <div className="font-semibold text-gray-900">₦{selectedGig.budget.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Deadline:</span>
                      <div className="font-semibold text-gray-900">{new Date(selectedGig.deadline).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Posted:</span>
                      <div className="font-semibold text-gray-900">{new Date(selectedGig.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bid Form */}
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-8">
                  <form onSubmit={handleBidSubmit} className="space-y-6">
                    {bidError && (
                      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                        {bidError}
                      </div>
                    )}
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
                          min="0"
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
                        onClick={() => setViewMode("list")}
                        className="px-8 py-3"
                        disabled={isSubmittingBid}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-8 py-3"
                        disabled={isSubmittingBid}
                      >
                        {isSubmittingBid ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1B1828] mr-2"></div>
                            Submitting...
                          </>
                        ) : (
                          'Submit Bid'
                        )}
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
        <SellerSidebar activePage="find-gigs" />

        {/* Main Content - View Details */}
        <div className="flex-1 flex flex-col">
          <Header title="Gig Details" />

          {/* View Details Content */}
          <main className="flex-1 p-6">
            <ViewDetails
              gig={selectedGig}
              onBack={() => setViewMode("list")}
              onPlaceBid={(gig) => handlePlaceBid(gig)}
              backButtonText="Back to Find Gigs"
            />
          </main>
        </div>
      </div>
    );
  }

  // Default list view
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <SellerSidebar activePage="find-gigs" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title="Find Gigs" />

        {/* Search and Filter Section */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search gigs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none min-w-[200px]"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <FilterIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>

              {/* Apply Filters Button */}
              <Button className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white px-6 py-3">
                Apply filters
              </Button>
            </div>

            {/* View Toggle and Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                Showing {filteredGigs.length} of {gigs.length} gigs
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 mr-2">View:</span>
                <Button
                  variant={gridViewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGridViewMode("grid")}
                  className={gridViewMode === "grid" ? "bg-[#1B1828] text-white" : ""}
                >
                  <GridIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant={gridViewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGridViewMode("list")}
                  className={gridViewMode === "list" ? "bg-[#1B1828] text-white" : ""}
                >
                  <ListIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Gigs Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {gridViewMode === "grid" ? (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGigs.map((gig) => (
                  <Card key={gig.id} className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          gig.categories.includes('land-title') ? 'bg-green-100 text-green-800' :
                          gig.categories.includes('contract-review') ? 'bg-blue-100 text-blue-800' :
                          gig.categories.includes('c-of-o') ? 'bg-purple-100 text-purple-800' :
                          gig.categories.includes('property-survey') ? 'bg-orange-100 text-orange-800' :
                          gig.categories.includes('due-diligence') ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {gig.categories[0].replace('-', ' ')}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{gig.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{gig.description.substring(0, 100)}...</p>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Due: {new Date(gig.deadline).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">₦{gig.budget.toLocaleString()}</span>
                        <Button 
                          onClick={() => handleViewDetails(gig)}
                          className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] text-sm"
                        >
                          View Details & Bid
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {filteredGigs.map((gig) => (
                  <Card key={gig.id} className="bg-white border border-gray-200 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              gig.categories.includes('land-title') ? 'bg-green-100 text-green-800' :
                              gig.categories.includes('contract-review') ? 'bg-blue-100 text-blue-800' :
                              gig.categories.includes('c-of-o') ? 'bg-purple-100 text-purple-800' :
                              gig.categories.includes('property-survey') ? 'bg-orange-100 text-orange-800' :
                              gig.categories.includes('due-diligence') ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {gig.categories[0].replace('-', ' ')}
                            </span>
                            <span className="text-sm text-gray-500">
                              Posted {new Date(gig.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <h3 className="font-semibold text-gray-900 mb-2 text-lg">{gig.title}</h3>
                          <p className="text-gray-600 mb-4">{gig.description}</p>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4" />
                              <span>Due: {new Date(gig.deadline).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right ml-6">
                          <div className="text-2xl font-bold text-gray-900 mb-4">₦{gig.budget.toLocaleString()}</div>
                          <Button 
                            onClick={() => handleViewDetails(gig)}
                            className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828]"
                          >
                            View Details & Bid
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredGigs.length === 0 && (
              <div className="text-center py-12">
                <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No gigs found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or filters</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};