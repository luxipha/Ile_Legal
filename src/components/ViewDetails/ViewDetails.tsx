import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { api } from "../../services/api";
import { 
  ArrowLeftIcon,
  StarIcon,
  BuildingIcon,
  SendIcon,
  PaperclipIcon
} from "lucide-react";

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

interface Bid {
  id: string;
  gig_id: string;
  seller_id: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
  seller?: {
    full_name: string;
    rating: number;
    completed_jobs: number;
    avatar?: string;
  };
}

/**
 * ViewDetails component is primarily designed for SELLERS to view gig details and place bids.
 * It includes a "Place Bid" button and displays gig information from a seller's perspective.
 * This component should be used in the seller dashboard for viewing gig details.
 */
interface ViewDetailsProps {
  gig: Gig;
  onBack: () => void;
  onPlaceBid: (gig: Gig) => void;
  backButtonText?: string;
  showPlaceBid?: boolean; // Controls Place Bid button visibility (true for sellers, false for buyers)
}

export const ViewDetails: React.FC<ViewDetailsProps> = ({ 
  gig, 
  onBack, 
  onPlaceBid,
  backButtonText = "Back",
  showPlaceBid = true, // Default to true for backward compatibility
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "bids" | "messages">("details");
  const [newMessage, setNewMessage] = useState("");
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBids = async () => {
      if (activeTab === "bids") {
        try {
          setLoading(true);
          setError(null);
          const data = await api.bids.getBidsByGigId(gig.id);
          setBids(data);
        } catch (err) {
          console.error('Error fetching bids:', err);
          setError('Failed to load bids. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchBids();
  }, [activeTab, gig.id]);

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

  const handleSendMessage = () => {
    if (newMessage.trim()) {
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
            <span>Posted {new Date(gig.created_at).toLocaleDateString()}</span>
            <span>Deadline {new Date(gig.deadline).toLocaleDateString()}</span>
            <span>Budget ₦{gig.budget.toLocaleString()}</span>
          </div>
        </div>
        <span className="bg-[#FEC85F] text-[#1B1828] px-4 py-2 rounded-lg font-medium">
          {gig.status === 'active' ? 'Open for Bids' : 'Closed'}
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          {[
            { id: "details", label: "Details" },
            { id: "bids", label: `Bids (${bids.length})` },
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
              <p className="text-gray-600 mb-6 leading-relaxed">{gig.description}</p>
              
              {gig.categories.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {gig.categories.map((category, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {category.replace('-', ' ')}
                      </span>
                    ))}
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
                bids.map((bid) => (
                  <Card key={bid.id} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                          {bid.seller?.avatar || bid.seller?.full_name?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">{bid.seller?.full_name || 'Anonymous'}</h4>
                              <p className="text-gray-600">Legal Professional</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">₦{bid.amount.toLocaleString()}</div>
                              <div className="text-sm text-gray-500">
                                Submitted: {new Date(bid.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          {bid.seller && (
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-1">
                                {renderStars(Math.floor(bid.seller.rating || 0))}
                                <span className="text-sm text-gray-600 ml-1">{bid.seller.rating || 0}</span>
                              </div>
                              <span className="text-sm text-gray-600">
                                {bid.seller.completed_jobs || 0} jobs completed
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Proposal</h5>
                        <p className="text-gray-600">{bid.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
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
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BuildingIcon className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Gig Details</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Status: <span className="font-medium">{gig.status}</span></p>
                  <p>Posted: <span className="font-medium">{new Date(gig.created_at).toLocaleDateString()}</span></p>
                  <p>Deadline: <span className="font-medium">{new Date(gig.deadline).toLocaleDateString()}</span></p>
                  <p>Budget: <span className="font-medium">₦{gig.budget.toLocaleString()}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Only show Place Bid button if showPlaceBid is true */}
          {showPlaceBid && gig.status === 'active' && (
            <Button
              onClick={() => onPlaceBid(gig)}
              className="w-full bg-[#1B1828] hover:bg-[#1B1828]/90 text-white py-3 mb-4"
            >
              Place Bid
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};