import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { ViewDetails } from "../../components/ViewDetails";
import { Header } from "../../components/Header";
import { 
  SearchIcon, 
  FilterIcon, 
  GridIcon, 
  ListIcon,
  MapPinIcon,
  CalendarIcon,
  DollarSignIcon,
  UserIcon,
  GavelIcon,
  MessageSquareIcon,
  ArrowLeftIcon
} from "lucide-react";

type ViewMode = "list" | "view-details" | "place-bid";

interface Gig {
  id: number;
  title: string;
  company: string;
  price: string;
  deadline: string;
  category: string;
  description: string;
  location: string;
  posted: string;
  postedDate: string;
  budget: string;
  deliveryTime: string;
  requirements: string[];
  companyRating: number;
  projectsPosted: number;
}

export const FindGigs = (): JSX.Element => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [gridViewMode, setGridViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [bidFormData, setBidFormData] = useState({
    bidAmount: "",
    deliveryTime: "",
    proposal: ""
  });

  const categories = [
    "All Categories",
    "Land Title Verification",
    "C of O",
    "Contract Review",
    "Property Survey",
    "Due Diligence",
    "Legal Documentation"
  ];

  const gigs: Gig[] = [
    {
      id: 1,
      title: "Land Title Verification - Victoria Island Property",
      company: "Lagos Properties Ltd.",
      price: "₦65,000",
      deadline: "15/05/2025",
      category: "land-title",
      description: "We are seeking a qualified legal professional to conduct a comprehensive title verification for a property located in Victoria Island, Lagos.",
      location: "Victoria Island, Lagos",
      posted: "2 days ago",
      postedDate: "Apr 24, 2024",
      budget: "₦65,000",
      deliveryTime: "e.g, 5 days",
      requirements: [
        "Confirmation of ownership history",
        "Verification of all relevant documentation",
        "Checks for any encumbrances or liens",
        "Validation with the local land registry",
        "Preparation of a detailed report on findings"
      ],
      companyRating: 4.8,
      projectsPosted: 15
    },
    {
      id: 2,
      title: "Contract Review for Commercial Lease",
      company: "Commercial Realty",
      price: "₦45,000",
      deadline: "10/05/2025",
      category: "contract-review",
      description: "Review and analysis of commercial lease agreement for office space. Need expert legal opinion on terms and conditions.",
      location: "Ikoyi, Lagos",
      posted: "1 day ago",
      postedDate: "Apr 25, 2024",
      budget: "₦45,000",
      deliveryTime: "e.g, 3 days",
      requirements: [
        "Thorough review of lease terms",
        "Risk assessment",
        "Recommendations for amendments",
        "Legal compliance check"
      ],
      companyRating: 4.6,
      projectsPosted: 8
    },
    {
      id: 3,
      title: "Certificate of Occupancy Processing",
      company: "Evergreen Estates",
      price: "₦80,000",
      deadline: "20/05/2025",
      category: "c-of-o",
      description: "Assist with C of O application and processing for residential development project. Experience with Lagos State procedures required.",
      location: "Lekki, Lagos",
      posted: "3 hours ago",
      postedDate: "Apr 26, 2024",
      budget: "₦80,000",
      deliveryTime: "e.g, 7 days",
      requirements: [
        "C of O application preparation",
        "Document compilation",
        "Government liaison",
        "Process monitoring"
      ],
      companyRating: 4.9,
      projectsPosted: 22
    },
    {
      id: 4,
      title: "Property Survey and Documentation",
      company: "Prime Developers",
      price: "₦55,000",
      deadline: "25/05/2025",
      category: "property-survey",
      description: "Conduct comprehensive property survey and prepare all necessary documentation for land acquisition.",
      location: "Ajah, Lagos",
      posted: "5 hours ago",
      postedDate: "Apr 26, 2024",
      budget: "₦55,000",
      deliveryTime: "e.g, 6 days",
      requirements: [
        "Property boundary survey",
        "Documentation preparation",
        "Legal verification",
        "Report compilation"
      ],
      companyRating: 4.7,
      projectsPosted: 12
    },
    {
      id: 5,
      title: "Due Diligence for Residential Complex",
      company: "Urban Homes Ltd",
      price: "₦120,000",
      deadline: "30/05/2025",
      category: "due-diligence",
      description: "Complete due diligence investigation for a 50-unit residential complex including title verification, compliance checks, and risk assessment.",
      location: "Ikeja, Lagos",
      posted: "1 day ago",
      postedDate: "Apr 25, 2024",
      budget: "₦120,000",
      deliveryTime: "e.g, 10 days",
      requirements: [
        "Title verification",
        "Compliance checks",
        "Risk assessment",
        "Financial analysis",
        "Comprehensive report"
      ],
      companyRating: 4.8,
      projectsPosted: 18
    },
    {
      id: 6,
      title: "Legal Documentation for Property Transfer",
      company: "Heritage Properties",
      price: "₦35,000",
      deadline: "12/05/2025",
      category: "legal-documentation",
      description: "Prepare and review all legal documents required for property transfer including deed of assignment and power of attorney.",
      location: "Surulere, Lagos",
      posted: "3 days ago",
      postedDate: "Apr 23, 2024",
      budget: "₦35,000",
      deliveryTime: "e.g, 4 days",
      requirements: [
        "Document preparation",
        "Legal review",
        "Compliance verification",
        "Transfer facilitation"
      ],
      companyRating: 4.5,
      projectsPosted: 9
    }
  ];

  const filteredGigs = gigs.filter(gig => {
    const matchesSearch = gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gig.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || 
                           gig.category === selectedCategory.toLowerCase().replace(/\s+/g, '-');
    return matchesSearch && matchesCategory;
  });

  const handleViewDetails = (gig: Gig) => {
    setSelectedGig(gig);
    setViewMode("view-details");
  };

  const handlePlaceBid = (gig?: Gig) => {
    if (gig) {
      setSelectedGig(gig);
    }
    setViewMode("place-bid");
  };

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Bid submitted:", bidFormData);
    setViewMode("list");
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
                <Link to="/seller-dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <UserIcon className="w-5 h-5" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/find-gigs" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700 text-white">
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
                        onClick={() => setViewMode("list")}
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
                <Link to="/seller-dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <UserIcon className="w-5 h-5" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/find-gigs" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700 text-white">
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
          <Header title="Gig Details" />

          {/* View Details Content */}
          <main className="flex-1 p-6">
            <ViewDetails
              gig={selectedGig}
              onBack={() => setViewMode("list")}
              onPlaceBid={handlePlaceBid}
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
              <Link to="/find-gigs" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700 text-white">
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
                          gig.category === 'land-title' ? 'bg-green-100 text-green-800' :
                          gig.category === 'contract-review' ? 'bg-blue-100 text-blue-800' :
                          gig.category === 'c-of-o' ? 'bg-purple-100 text-purple-800' :
                          gig.category === 'property-survey' ? 'bg-orange-100 text-orange-800' :
                          gig.category === 'due-diligence' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {gig.category.replace('-', ' ')}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{gig.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">Posted By {gig.company}</p>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{gig.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Due: {gig.deadline}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">{gig.price}</span>
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
                              gig.category === 'land-title' ? 'bg-green-100 text-green-800' :
                              gig.category === 'contract-review' ? 'bg-blue-100 text-blue-800' :
                              gig.category === 'c-of-o' ? 'bg-purple-100 text-purple-800' :
                              gig.category === 'property-survey' ? 'bg-orange-100 text-orange-800' :
                              gig.category === 'due-diligence' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {gig.category.replace('-', ' ')}
                            </span>
                            <span className="text-sm text-gray-500">{gig.posted}</span>
                          </div>
                          
                          <h3 className="font-semibold text-gray-900 mb-2 text-lg">{gig.title}</h3>
                          <p className="text-sm text-gray-600 mb-3">Posted By {gig.company}</p>
                          <p className="text-gray-600 mb-4">{gig.description}</p>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <MapPinIcon className="w-4 h-4" />
                              <span>{gig.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4" />
                              <span>Due: {gig.deadline}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right ml-6">
                          <div className="text-2xl font-bold text-gray-900 mb-4">{gig.price}</div>
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