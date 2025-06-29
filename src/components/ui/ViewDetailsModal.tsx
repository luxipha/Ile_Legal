import React, { useState } from "react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { 
  ArrowLeftIcon, 
  XIcon, 
  StarIcon, 
  BuildingIcon,
  SendIcon,
  PaperclipIcon
} from "lucide-react";

interface ViewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceBid: () => void;
  gig: {
    id: number;
    title: string;
    company: string;
    budget: string;
    deadline: string;
    postedDate: string;
    description: string;
    requirements: string[];
    companyRating: number;
    projectsPosted: number;
    status?: string;
  };
}

export const ViewDetailsModal: React.FC<ViewDetailsModalProps> = ({
  isOpen,
  onClose,
  onPlaceBid,
  gig,
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "bids" | "messages">("details");
  const [newMessage, setNewMessage] = useState("");

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setNewMessage("");
    }
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back
            </Button>
            <h2 className="text-2xl font-semibold text-gray-900">Gig Details</h2>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <XIcon className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
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
              {gig.status === 'active' ? 'Open for Bids' : 
               gig.status === 'assigned' ? 'In Progress' :
               gig.status === 'completed' ? 'Completed' :
               gig.status === 'suspended' ? 'Suspended' : 
               gig.status === 'pending' ? 'Pending' : 'Open for Bids'}
            </span>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex gap-8">
              {[
                { id: "details", label: "Details" },
                { id: "bids", label: `Bids (${otherBids.length})` },
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

          {/* Content Grid */}
          <div className="grid grid-cols-3 gap-8">
            {/* Main Content - 2/3 width */}
            <div className="col-span-2">
              {activeTab === "details" && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Description</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{gig.description}</p>
                  
                  
                </div>
              )}

              {activeTab === "bids" && (
                <div className="space-y-6">
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
                  <h3 className="font-semibold text-gray-900 mb-2">{gig.company}</h3>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {renderStars(Math.floor(gig.companyRating))}
                    <span className="text-sm text-gray-600 ml-1">{gig.companyRating}</span>
                  </div>
                  <p className="text-sm text-gray-600">{gig.projectsPosted} projects posted</p>
                </CardContent>
              </Card>

              <Button
                onClick={onPlaceBid}
                className="w-full bg-[#1B1828] hover:bg-[#1B1828]/90 text-white py-3"
                disabled={gig.status === 'suspended'}
              >
                {gig.status === 'suspended' ? 'Gig Suspended' : 'Place Bid'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};