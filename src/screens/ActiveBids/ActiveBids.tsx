import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Header } from "../../components/Header";
import { 
  UserIcon,
  SearchIcon,
  GavelIcon,
  MessageSquareIcon,
  DollarSignIcon,
  CalendarIcon,
  ArrowLeftIcon,
  StarIcon,
  BuildingIcon,
  SendIcon,
  PaperclipIcon
} from "lucide-react";

type ViewMode = "list" | "edit-bid" | "view-details";

interface Bid {
  id: number;
  title: string;
  company: string;
  bidAmount: string;
  bidSubmitted: string;
  dueDate: string;
  status: string;
  statusColor: string;
  originalBudget: string;
  deliveryTime: string;
  proposal: string;
  companyRating: number;
  projectsPosted: number;
  description: string;
  requirements: string[];
  postedDate: string;
  previousBid?: string; // Added previous bid field
}

export const ActiveBids = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "bids" | "messages">("details");
  
  // Handle navigation state for editing bids
  useEffect(() => {
    // Check if we have state from navigation
    if (location.state) {
      const { viewMode: navigationViewMode, bidData } = location.state;
      
      // If we have a viewMode and bid data, set them
      if (navigationViewMode === 'edit-bid' && bidData) {
        setSelectedBid(bidData);
        setEditFormData({
          bidAmount: bidData.bidAmount.replace("₦", ""),
          deliveryTime: bidData.deliveryTime,
          proposal: bidData.proposal
        });
        setViewMode("edit-bid");
      }
    }
  }, [location]);
  
  const [editFormData, setEditFormData] = useState({
    bidAmount: "",
    deliveryTime: "",
    proposal: ""
  });
  const [newMessage, setNewMessage] = useState("");

  const activeBids: Bid[] = [
    {
      id: 1,
      title: "Land Title Verification - Victoria Island Property",
      company: "Lagos Properties Ltd.",
      bidAmount: "₦60,000",
      bidSubmitted: "21/04/2025",
      dueDate: "15/05/2025",
      status: "Waiting for Client",
      statusColor: "bg-green-100 text-green-800",
      originalBudget: "₦65,000",
      deliveryTime: "5 days",
      proposal: "I have over 10 years of experience in title verification in Lagos State, particularly in Victoria Island. I have established connections with the land registry and can complete this task efficiently and accurately.",
      companyRating: 4.8,
      projectsPosted: 15,
      description: "We are seeking a qualified legal professional to conduct a comprehensive title verification for a property located in Victoria Island, Lagos.",
      requirements: [
        "Confirmation of ownership history",
        "Verification of all relevant documentation",
        "Checks for any encumbrances or liens",
        "Validation with the local land registry",
        "Preparation of a detailed report on findings"
      ],
      postedDate: "Apr 24, 2024",
      previousBid: "₦65,000" // Added previous bid
    },
    {
      id: 2,
      title: "Land Title Verification - Victoria Island Property",
      company: "Lagos Properties Ltd.",
      bidAmount: "₦60,000",
      bidSubmitted: "21/04/2025",
      dueDate: "15/05/2025",
      status: "2 Clients Bidded",
      statusColor: "bg-green-100 text-green-800",
      originalBudget: "₦65,000",
      deliveryTime: "5 days",
      proposal: "Comprehensive title verification with detailed reporting and compliance checks.",
      companyRating: 4.8,
      projectsPosted: 15,
      description: "We are seeking a qualified legal professional to conduct a comprehensive title verification for a property located in Victoria Island, Lagos.",
      requirements: [
        "Confirmation of ownership history",
        "Verification of all relevant documentation",
        "Checks for any encumbrances or liens",
        "Validation with the local land registry",
        "Preparation of a detailed report on findings"
      ],
      postedDate: "Apr 24, 2024",
      previousBid: "₦70,000" // Added previous bid
    }
  ];

  const otherBids = [
    {
      id: 1,
      name: "Chioma Okonkwo",
      title: "Property Lawyer",
      rating: 4.9,
      completedJobs: 24,
      amount: "₦65,000",
      deliveryTime: "5 days",
      submittedDate: "21/04/2025",
      proposal: "I have over 10 years of experience in title verification in Lagos State, particularly in Victoria Island. I have established connections with the land registry and can complete this task efficiently and accurately.",
      avatar: "CO"
    }
  ];

  const messages = [
    {
      id: 1,
      sender: "client" as const,
      text: "Hello, I'm interested in this project. Can you provide more details about the property location?",
      timestamp: "2:30 PM"
    },
    {
      id: 2,
      sender: "user" as const,
      text: "Hi! The property is located in Victoria Island, Lagos. It's a commercial plot that requires comprehensive title verification.",
      timestamp: "2:35 PM"
    }
  ];

  const handleEditBid = (bid: Bid) => {
    setSelectedBid(bid);
    setEditFormData({
      bidAmount: bid.bidAmount.replace("₦", ""),
      deliveryTime: bid.deliveryTime,
      proposal: bid.proposal
    });
    setViewMode("edit-bid");
  };

  const handleViewDetails = (bid: Bid) => {
    setSelectedBid(bid);
    setViewMode("view-details");
    setActiveTab("details");
  };

  const handleMessageClient = (bid: Bid) => {
    // Navigate to messages page with specific client context
    navigate("/messages", { state: { clientId: bid.company } });
  };

  const handleUpdateBid = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle bid update
    console.log("Updated bid:", editFormData);
    setViewMode("list");
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
                      <div className="font-semibold text-gray-900">{selectedBid.originalBudget}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Deadline:</span>
                      <div className="font-semibold text-gray-900">{selectedBid.dueDate}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Previous Bid:</span>
                      <div className="font-semibold text-gray-900">{selectedBid.previousBid}</div>
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
                          onChange={(e) => setEditFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
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
                    <span>Posted {selectedBid.postedDate}</span>
                    <span>Deadline {selectedBid.dueDate}</span>
                    <span>Budget {selectedBid.originalBudget}</span>
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
                    { id: "bids", label: `Bids (${otherBids.length + 1})` },
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
                      
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">The verification should include:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-6">
                        {selectedBid.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ol>
                      
                      <p className="text-gray-600">
                        The property is a 1,000 sqm commercial plot with existing development. 
                        All necessary documents will be provided upon assignment.
                      </p>
                    </div>
                  )}

                  {activeTab === "bids" && (
                    <div className="space-y-6">
                      {/* Your Bid */}
                      <Card className="border-2 border-[#FEC85F] bg-[#FEC85F]/5">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <span className="bg-[#FEC85F] text-[#1B1828] px-3 py-1 rounded-full text-sm font-medium">
                              Your Bid
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedBid.statusColor}`}>
                              {selectedBid.status}
                            </span>
                          </div>
                          
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                              DS
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-gray-900">Demo Seller</h4>
                                  <p className="text-gray-600">Senior Property Lawyer</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-gray-900">{selectedBid.bidAmount}</div>
                                  <div className="text-sm text-gray-500">{selectedBid.deliveryTime}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 mb-3">
                                <div className="flex items-center gap-1">
                                  {renderStars(5)}
                                  <span className="text-sm text-gray-600 ml-1">4.9</span>
                                </div>
                                <span className="text-sm text-gray-600">127 jobs completed</span>
                                <span className="text-sm text-gray-500">Submitted: {selectedBid.bidSubmitted}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <h5 className="font-medium text-gray-900 mb-2">Proposal</h5>
                            <p className="text-gray-600">{selectedBid.proposal}</p>
                          </div>

                          <div className="flex gap-3">
                            <Button 
                              onClick={() => handleEditBid(selectedBid)}
                              className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
                            >
                              Edit Bid
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => handleMessageClient(selectedBid)}
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              Message Client
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Other Bids */}
                      {otherBids.map((bid) => (
                        <Card key={bid.id} className="border border-gray-200">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                                {bid.avatar}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{bid.name}</h4>
                                    <p className="text-gray-600">{bid.title}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-900">{bid.amount}</div>
                                    <div className="text-sm text-gray-500">{bid.deliveryTime}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 mb-3">
                                  <div className="flex items-center gap-1">
                                    {renderStars(Math.floor(bid.rating))}
                                    <span className="text-sm text-gray-600 ml-1">{bid.rating}</span>
                                  </div>
                                  <span className="text-sm text-gray-600">{bid.completedJobs} jobs completed</span>
                                  <span className="text-sm text-gray-500">Submitted: {bid.submittedDate}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <h5 className="font-medium text-gray-900 mb-2">Proposal</h5>
                              <p className="text-gray-600">{bid.proposal}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {activeTab === "messages" && (
                    <div className="space-y-4">
                      {/* Messages */}
                      <div className="space-y-4 mb-6">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                                message.sender === 'user'
                                  ? 'bg-[#1B1828] text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.text}</p>
                              <p className={`text-xs mt-1 ${
                                message.sender === 'user' ? 'text-gray-300' : 'text-gray-500'
                              }`}>
                                {message.timestamp}
                              </p>
                            </div>
                          </div>
                        ))}
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
                      <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <BuildingIcon className="w-8 h-8 text-gray-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{selectedBid.company}</h3>
                      <div className="flex items-center justify-center gap-1 mb-2">
                        {renderStars(Math.floor(selectedBid.companyRating))}
                        <span className="text-sm text-gray-600 ml-1">{selectedBid.companyRating}</span>
                      </div>
                      <p className="text-sm text-gray-600">{selectedBid.projectsPosted} projects posted</p>
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title="Active Bids" />

        {/* Active Bids Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {activeBids.map((bid) => (
                <Card key={bid.id} className="bg-white border border-gray-200 shadow-sm">
                  <CardContent className="p-6">
                    {/* Status Badge */}
                    <div className="mb-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${bid.statusColor}`}>
                        {bid.status}
                      </span>
                    </div>

                    {/* Bid Title */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{bid.title}</h3>
                    <p className="text-gray-600 mb-4">{bid.company}</p>

                    {/* Bid Details */}
                    <div className="flex items-center gap-6 mb-6">
                      <div className="flex items-center gap-2 text-gray-600">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="text-sm">Bid Submitted</span>
                      </div>
                      <div className="text-sm text-gray-900 font-medium">{bid.bidSubmitted}</div>
                    </div>

                    {/* Price and Due Date */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-3xl font-bold text-gray-900">{bid.bidAmount}</div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">Due Date:</div>
                        <div className="bg-[#FEC85F] text-[#1B1828] px-3 py-1 rounded-lg font-medium">
                          {bid.dueDate}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => handleEditBid(bid)}
                        className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
                      >
                        Edit Bid
                      </Button>
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
          </div>
        </main>
      </div>
    </div>
  );
};