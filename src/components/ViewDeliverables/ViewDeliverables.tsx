import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { ArrowLeftIcon, MessageSquareIcon, SendIcon } from "lucide-react";

interface Provider {
  name: string;
  avatar: string;
  rating: number;
  projectsPosted: number;
}

interface ViewDeliverablesProps {
  gigId: number;
  gigTitle: string;
  postedDate: string;
  deadline: string;
  budget: string;
  status: string;
  provider: Provider;
  onBack: () => void;
  onMessage: (providerId: string) => void;
}

export const ViewDeliverables = ({
  // gigId is used for API calls in a real implementation
  gigTitle,
  postedDate,
  deadline,
  budget,
  status,
  provider,
  onBack,
  // onMessage is used in the message sending functionality
}: ViewDeliverablesProps) => {
  const [activeTab, setActiveTab] = useState<"details" | "bids" | "deliverables" | "messages">("messages");
  const [messageText, setMessageText] = useState("");

  const handleSendMessage = () => {
    if (messageText.trim()) {
      console.log("Sending message:", messageText);
      setMessageText("");
      // In a real app, this would send the message to an API
    }
  };

  // Mock messages for demonstration
  const messages = [
    {
      id: 1,
      sender: "provider",
      text: "Hello! I've completed the Property Lease Agreement draft as requested. Please review the deliverables and let me know if you need any revisions.",
      time: "10:30 AM",
      date: "Today"
    }
  ];

  // Mock deliverables for demonstration
  const deliverables = [
    {
      id: 1,
      name: "Property Lease Agreement - Final Draft.pdf",
      size: "2.4 MB",
      uploadDate: "28/04/2025"
    },
    {
      id: 2,
      name: "Lease Terms Summary.docx",
      size: "1.1 MB",
      uploadDate: "28/04/2025"
    }
  ];

  return (
    <div className="w-1/2 mx-auto">
      {/* Header with back button */}
      <div className="mb-6">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
      </div>

      {/* Gig title */}
      <div className="bg-[#1B1828] text-white p-6 rounded-t-xl">
        <h1 className="text-3xl font-bold">{gigTitle}</h1>
      </div>

      {/* Gig details */}
      <div className="bg-white border border-gray-200 p-6 grid grid-cols-4 gap-6">
        <div>
          <p className="text-gray-500 text-sm">Posted</p>
          <p className="font-medium">{postedDate}</p>
        </div>
        <div>
          <p className="text-gray-500 text-sm">Deadline</p>
          <p className="font-medium">{deadline}</p>
        </div>
        <div>
          <p className="text-gray-500 text-sm">Budget</p>
          <p className="font-medium">₦ {budget}</p>
        </div>
        <div>
          <p className="text-gray-500 text-sm">Status</p>
          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            {status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mt-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab("details")}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === "details"
                ? "border-b-2 border-[#1B1828] text-[#1B1828]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("bids")}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === "bids"
                ? "border-b-2 border-[#1B1828] text-[#1B1828]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Bids (1)
          </button>
          <button
            onClick={() => setActiveTab("deliverables")}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === "deliverables"
                ? "border-b-2 border-[#1B1828] text-[#1B1828]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Deliverables
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === "messages"
                ? "border-b-2 border-[#1B1828] text-[#1B1828]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Messages
          </button>
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === "messages" && (
          <div className="flex h-[500px]">
            <div className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 border border-gray-200 rounded-lg mb-4">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex ${message.sender === "provider" ? "justify-start" : "justify-end"}`}
                    >
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender === "provider" 
                          ? "bg-gray-100" 
                          : "bg-[#1B1828]/10"
                      }`}>
                        <p>{message.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{message.time} · {message.date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageSquareIcon className="w-12 h-12 mb-2 text-gray-300" />
                    <p className="text-lg font-medium">No messages yet</p>
                    <p>Start a conversation about this gig.</p>
                  </div>
                )}
              </div>

              {/* Message input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button 
                  onClick={handleSendMessage}
                  className="bg-[#1B1828] hover:bg-[#2D2A3C]"
                >
                  <SendIcon className="w-4 h-4" />
                  <span className="ml-2">Send</span>
                </Button>
              </div>
            </div>

            {/* Provider info */}
            <div className="w-64 ml-6">
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-yellow-200 rounded-lg flex items-center justify-center text-2xl font-bold mb-2">
                      {provider.avatar.length <= 2 ? (
                        provider.avatar
                      ) : (
                        <img src={provider.avatar} alt={provider.name} className="w-full h-full object-cover rounded-lg" />
                      )}
                    </div>
                    <h3 className="font-bold text-lg">{provider.name}</h3>
                    <p className="text-gray-500">Nigeria</p>
                    
                    <div className="flex items-center mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="text-yellow-400">
                          {star <= Math.floor(provider.rating) ? "★" : "☆"}
                        </span>
                      ))}
                      <span className="ml-1 text-gray-700">{provider.rating}</span>
                    </div>
                    
                    <p className="text-gray-600 mt-2">
                      {provider.projectsPosted} projects posted
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "deliverables" && (
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Deliverables</h2>
            
            <div className="space-y-4">
              {deliverables.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">{file.size} · Uploaded on {file.uploadDate}</p>
                    </div>
                  </div>
                  <Button variant="outline">Download</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Gig Details</h2>
            <p className="text-gray-700">
              This gig involves drafting a comprehensive property lease agreement that complies with local regulations.
              The agreement should cover all standard lease terms including rent, security deposit, maintenance responsibilities,
              and termination conditions.
            </p>
          </div>
        )}

        {activeTab === "bids" && (
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Bids</h2>
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-200 rounded-lg flex items-center justify-center font-bold">
                    {provider.avatar.length <= 2 ? (
                      provider.avatar
                    ) : (
                      <img src={provider.avatar} alt={provider.name} className="w-full h-full object-cover rounded-lg" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{provider.name}</p>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="text-yellow-400 text-sm">
                          {star <= Math.floor(provider.rating) ? "★" : "☆"}
                        </span>
                      ))}
                      <span className="ml-1 text-xs text-gray-700">{provider.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">₦ {budget}</p>
                  <p className="text-sm text-gray-500">Accepted</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
