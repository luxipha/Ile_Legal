import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { 
  ArrowLeftIcon,
  StarIcon,
  BuildingIcon,
  PaperclipIcon
} from "lucide-react";

interface Bid {
  id: number;
  name: string;
  avatar: string;
  title: string;
  rating: number;
  completedJobs: number;
  amount: string;
  deliveryTime: string;
  submittedDate: string;
  proposal: string;
}

interface Gig {
  id: number;
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
}

export const ViewBids: React.FC<ViewBidsProps> = ({ 
  gig, 
  onBack, 
  backButtonText
}) => {
  const [activeTab, setActiveTab] = useState<string>("bids");
  const [activeBidder, setActiveBidder] = useState<number | null>(null);
  const [bidderMessages, setBidderMessages] = useState<Record<number, Array<{id: number; text: string; sender: "user" | "other"; timestamp: string}>>>({});
  const [newMessage, setNewMessage] = useState("");

  const receivedBids: Bid[] = [
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
    },
    {
      id: 2,
      name: "Adebayo Ogundimu",
      title: "Senior Legal Counsel",
      rating: 4.8,
      completedJobs: 18,
      amount: "₦60,000",
      deliveryTime: "4 days",
      submittedDate: "22/04/2025",
      proposal: "With 8 years of experience in property law and title verification, I can provide comprehensive verification services with detailed reporting and compliance checks.",
      avatar: "AO"
    },
    {
      id: 3,
      name: "Funmi Adebisi",
      title: "Real Estate Lawyer",
      rating: 4.7,
      completedJobs: 31,
      amount: "₦70,000",
      deliveryTime: "6 days",
      submittedDate: "23/04/2025",
      proposal: "I specialize in Victoria Island properties and have handled similar title verifications. My approach includes thorough documentation review and registry validation.",
      avatar: "FA"
    }
  ];

  const handleSendMessage = () => {
    if (newMessage.trim() && activeBidder !== null) {
      // Get current messages for this bidder
      const currentMessages = bidderMessages[activeBidder] || [];
      
      // Create new message
      const newMsg = {
        id: currentMessages.length > 0 ? Math.max(...currentMessages.map(m => m.id)) + 1 : 1,
        text: newMessage.trim(),
        sender: "user" as const,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      // Update messages for this bidder
      setBidderMessages(prev => ({
        ...prev,
        [activeBidder]: [...(prev[activeBidder] || []), newMsg]
      }));
      
      // Simulate a response after a short delay (in a real app, this would come from the server)
      setTimeout(() => {
        const responseMsg = {
          id: bidderMessages[activeBidder] ? Math.max(...bidderMessages[activeBidder].map(m => m.id)) + 1 : 1,
          text: `Thank you for your message. I'll get back to you shortly regarding "${newMessage.trim()}".`,
          sender: "other" as const,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setBidderMessages(prev => ({
          ...prev,
          [activeBidder]: [...(prev[activeBidder] || []), responseMsg]
        }));
      }, 2000);
      
      setNewMessage("");
    }
  };

  const handleAcceptBid = (bidId: number) => {
    console.log("Accepting bid:", bidId);
    // Reject bid handler - keeping this for future implementation
  };

  const handleRejectBid = (bidId: number) => {
    console.log("Rejecting bid:", bidId);
    // In a real app, this would send a request to the server
    // For now, we'll just log the action
    
    // If we're currently viewing this bidder's messages, go back to bids
    if (activeBidder === bidId) {
      setActiveBidder(null);
      setActiveTab("bids");
    }
  };

  const handleMessageBidder = (bidderId: number) => {
    console.log("Messaging bidder:", bidderId);
    
    // Set the active bidder
    setActiveBidder(bidderId);
    
    // Switch to messages tab
    setActiveTab("messages");
    
    // Initialize messages for this bidder if they don't exist
    if (!bidderMessages[bidderId]) {
      // Find the bidder to get their information
      const bidder = receivedBids.find(bid => bid.id === bidderId);
      
      if (bidder) {
        // Create initial messages
        const initialMessages = [
          {
            id: 1,
            text: `Hello, I'm interested in discussing your bid on my gig: ${gig.title}`,
            sender: "user" as const,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          },
          {
            id: 2,
            text: `Thank you for reaching out! I'd be happy to discuss my proposal for ${gig.title} in more detail.`,
            sender: "other" as const,
            timestamp: new Date(Date.now() + 2*60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }
        ];
        
        setBidderMessages(prev => ({
          ...prev,
          [bidderId]: initialMessages
        }));
      }
    }
  };

  // View details functionality replaced with direct reject button

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
            <span>Posted {gig.postedDate}</span>
            <span>Deadline {gig.deadline}</span>
            <span>Budget {gig.budget}</span>
          </div>
        </div>
        <span className="bg-[#FEC85F] text-[#1B1828] px-4 py-2 rounded-lg font-medium">
          {receivedBids.length} Bids Received
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          {[
            { id: "bids", label: `Bids (${receivedBids.length})` },
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
              {receivedBids.map((bid) => (
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
                      <h5 className="font-medium text-[#1B1828] mb-2">Proposal</h5>
                      <p className="text-gray-600">{bid.proposal}</p>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        onClick={() => handleAcceptBid(bid.id)}
                        className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828]"
                      >
                        Accept Bid
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleMessageBidder(bid.id)}
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "details" && (
            <div>
              <h3 className="text-xl font-semibold text-[#1B1828] mb-4">Description</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">{gig.description}</p>
              
              <h4 className="text-lg font-semibold text-[#1B1828] mb-4">The verification should include:</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-6">
                {gig.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ol>
              
              <p className="text-gray-600">
                The property is a 1,000 sqm commercial plot with existing development. 
                All necessary documents will be provided upon assignment.
              </p>
            </div>
          )}

          {activeTab === "messages" && activeBidder !== null && (
            <div className="space-y-6">
              {/* Bidder Info */}
              <div className="flex items-center gap-4 p-4 border-b border-gray-200 bg-[#1B1828]/5">
                {(() => {
                  const bidder = receivedBids.find(bid => bid.id === activeBidder);
                  return bidder ? (
                    <>
                      <div className="w-12 h-12 bg-[#FEC85F]/20 rounded-full flex items-center justify-center text-sm font-medium text-[#1B1828]">
                        {bidder.avatar}
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#1B1828]">{bidder.name}</h4>
                        <p className="text-gray-600">{bidder.title}</p>
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
                {bidderMessages[activeBidder]?.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-[#1B1828] text-white'
                          : 'bg-[#FEC85F]/20 text-[#1B1828]'
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
                  className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] font-medium"
                >
                  Send
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
              <h3 className="font-semibold text-gray-900 mb-2">{gig.company}</h3>
              <div className="flex items-center justify-center gap-1 mb-2">
                {renderStars(Math.floor(gig.companyRating))}
                <span className="text-sm text-gray-600 ml-1">{gig.companyRating}</span>
              </div>
              <p className="text-sm text-gray-600">{gig.projectsPosted} projects posted</p>
            </CardContent>
          </Card>

          {/* Gig Statistics */}
          <Card className="border border-gray-200 mb-6">
            <CardContent className="p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Gig Statistics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Bids:</span>
                  <span className="font-semibold text-gray-900">{receivedBids.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Bid:</span>
                  <span className="font-semibold text-gray-900">₦65,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lowest Bid:</span>
                  <span className="font-semibold text-gray-900">₦60,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Highest Bid:</span>
                  <span className="font-semibold text-gray-900">₦70,000</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* View Details Button */}
          {/* {onViewDetails && (
            <Button
              onClick={handleViewDetailsClick}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3"
            >
              View Full Details
            </Button>
          )} */}
        </div>
      </div>
    </div>
  );
};