import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { ArrowLeftIcon, MessageSquareIcon, SendIcon, QrCodeIcon, CheckCircleIcon } from "lucide-react";
import { api } from "../../services/api";
import { messagingService } from "../../services/messagingService";
import { useAuth } from "../../contexts/AuthContext";
import { GigVerificationQR } from "../blockchain/GigVerificationQR/GigVerificationQR";

interface Provider {
  name: string;
  avatar: string;
  rating: number;
  projectsPosted: number;
  location?: string;
}

interface Deliverable {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  url?: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: 'user' | 'provider';
}

interface ViewDeliverablesProps {
  gigId: number;
  gigTitle: string;
  postedDate: string;
  deadline: string;
  budget: string;
  status: string;
  description: string;
  provider: Provider;
  onBack: () => void;
  onMessage: (providerId: string) => void;
}

export const ViewDeliverables = ({
  gigId,
  gigTitle,
  postedDate,
  deadline,
  budget,
  status,
  description,
  provider,
  onBack,
  onMessage: _onMessage,
}: ViewDeliverablesProps) => {
  console.log('provider', provider);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"details" | "bids" | "deliverables" | "messages" | "verification">("messages");
  const [messageText, setMessageText] = useState("");
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDeliverables, setLoadingDeliverables] = useState(false);
  const [sellerLocation] = useState<string | undefined>(provider.location);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId || !user?.id) return;
    
    setLoading(true);
    try {
      await messagingService.sendMessage(conversationId, user.id, messageText);
      setMessageText("");
      // Messages will be updated via real-time subscription
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load deliverables and setup messaging on component mount
  useEffect(() => {
    if (!user?.id) return;
    
    const initializeData = async () => {
      // Load deliverables
      setLoadingDeliverables(true);
      try {
        const submissionsData = await api.submissions.getSubmissionsByGig(gigId.toString());
        setSubmissions(submissionsData); // Store submissions for QR verification
        
        const formattedDeliverables: Deliverable[] = submissionsData.flatMap((submission: any) => 
          submission.deliverables.map((filename: string, index: number) => ({
            id: `${submission.id}-${index}`,
            name: filename,
            size: '-- MB', // Size would need to be stored in submission data
            uploadDate: new Date(submission.created_at).toLocaleDateString(),
            url: submission.storage_type === 'ipfs' ? 
              `https://ipfs.io/ipfs/${filename}` : 
              `/api/download/${filename}`
          }))
        );
        setDeliverables(formattedDeliverables);
      } catch (error) {
        console.log('Could not load deliverables:', error);
        setDeliverables([]);
      } finally {
        setLoadingDeliverables(false);
      }

      // Setup conversation - Get real conversation for this gig
      try {
        // Get the gig details to find the assigned seller
        const gigData = await api.gigs.getGigById(gigId.toString());
        if (gigData && gigData.length > 0 && gigData[0].seller_id) {
          const gig = gigData[0];
          // Get or create conversation between buyer and seller
          const conversation = await messagingService.getOrCreateConversation(
            user.id,
            gig.seller_id,
            gigId.toString()
          );
          setConversationId(conversation.id);
          
          // Load real messages for this conversation
          const messagesData = await messagingService.getMessages(conversation.id);
          const formattedMessages = messagesData.map((msg: any) => ({
            id: msg.id,
            sender_id: msg.sender_id,
            content: msg.content,
            created_at: msg.created_at,
            sender: (msg.sender_id === user.id ? 'user' : 'provider') as 'user' | 'provider'
          }));
          setMessages(formattedMessages);
        } else {
          console.log('No seller assigned to this gig yet');
          setMessages([]);
        }
      } catch (error) {
        console.log('Could not load conversation data:', error);
        setMessages([]);
      }
    };
    
    initializeData();
  }, [user?.id, gigId]);

  return (
    <div className="w-full max-w-full sm:max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 overflow-hidden">
        {/* Header with back button */}
        <div className="mb-4 sm:mb-6">
          <button 
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
        </div>

      {/* Gig title */}
      <div className="bg-[#1B1828] text-white p-4 sm:p-6 rounded-t-xl">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{gigTitle}</h1>
      </div>

      {/* Gig details */}
      <div className="bg-white border border-gray-200 p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
        {sellerLocation ? (
          <div>
            <p className="text-gray-500 text-sm">Location</p>
            <p className="font-medium">{sellerLocation}</p>
          </div>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mt-4 sm:mt-6 overflow-hidden">
        <div className="overflow-x-auto -mb-px">
          <nav className="flex min-w-max md:min-w-0 md:flex-wrap gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab("details")}
            className={`py-2 sm:py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === "details"
                ? "border-b-2 border-[#1B1828] text-[#1B1828]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("bids")}
            className={`py-2 sm:py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === "bids"
                ? "border-b-2 border-[#1B1828] text-[#1B1828]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Bids (1)
          </button>
          <button
            onClick={() => setActiveTab("deliverables")}
            className={`py-2 sm:py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === "deliverables"
                ? "border-b-2 border-[#1B1828] text-[#1B1828]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="sm:hidden">Files</span>
            <span className="hidden sm:inline">Deliverables</span>
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`py-2 sm:py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === "messages"
                ? "border-b-2 border-[#1B1828] text-[#1B1828]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => setActiveTab("verification")}
            className={`py-3 sm:py-4 px-3 sm:px-6 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
              activeTab === "verification"
                ? "border-b-2 border-[#1B1828] text-[#1B1828]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <QrCodeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="sm:hidden">QR</span>
            <span className="hidden sm:inline">Verification</span>
          </button>
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-4 sm:mt-6">
        {activeTab === "messages" && (
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[400px] sm:h-[500px] w-full">
            <div className="flex-1 flex flex-col min-w-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 border border-gray-200 rounded-lg mb-3 sm:mb-4">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex ${message.sender === "provider" ? "justify-start" : "justify-end"}`}
                    >
                      <div className={`max-w-[80%] p-3 rounded-lg break-words ${
                        message.sender === "provider" 
                          ? "bg-gray-100" 
                          : "bg-[#1B1828]/10"
                      }`}>
                        <p>{message.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
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
                  className="flex-1 border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={loading || !messageText.trim()}
                  className="bg-[#1B1828] hover:bg-[#2D2A3C] disabled:opacity-50 px-3 sm:px-4 py-2"
                >
                  <SendIcon className="w-4 h-4" />
                  <span className="ml-1 sm:ml-2 text-sm sm:text-base">{loading ? 'Sending...' : 'Send'}</span>
                </Button>
              </div>
            </div>

            {/* Provider info */}
            <div className="w-full lg:w-64 order-first lg:order-last lg:flex-shrink-0">
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-yellow-200 rounded-lg flex items-center justify-center text-2xl font-bold mb-2">
                      {provider.avatar.length <= 2 ? (
                        provider.avatar
                      ) : (
                        <img src={provider.avatar} alt={provider.name} className="w-full h-full object-cover rounded-lg" />
                      )}
                    </div>
                    <h3 className="font-bold text-lg">{provider.name}</h3>
                    <p className="text-gray-500">{provider.location}</p>
                    
                    <div className="flex items-center mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="text-yellow-400">
                          {star <= Math.floor(provider.rating) ? "★" : "☆"}
                        </span>
                      ))}
                      <span className="ml-1 text-gray-700">{provider.rating}</span>
                    </div>
                    
                    <p className="text-gray-600 mt-2">
                      {provider.projectsPosted} gigs completed
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "deliverables" && (
          <div className="border border-gray-200 rounded-lg p-3 sm:p-6 overflow-hidden">
            <h2 className="text-base sm:text-xl font-bold mb-3 sm:mb-4">Files</h2>
            
            {loadingDeliverables ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading deliverables...</div>
              </div>
            ) : deliverables.length > 0 ? (
              <div className="space-y-4">
                {deliverables.map((file) => (
                  <div key={file.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-4 border border-gray-200 rounded-lg gap-2 sm:gap-4 overflow-hidden">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                        <p className="font-medium text-xs sm:text-base break-all pr-2">{file.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          <span className="hidden sm:inline">{file.size} · Uploaded on {file.uploadDate}</span>
                          <span className="sm:hidden">{file.uploadDate}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <Button 
                        variant="outline" 
                        onClick={() => file.url && window.open(file.url, '_blank')}
                        className="flex-1 sm:flex-none px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"
                      >
                        <span className="sm:hidden">↓</span>
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab("verification")}
                        className="flex items-center gap-1 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"
                      >
                        <QrCodeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">QR</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 sm:py-8 text-gray-500">
                <div className="text-center px-4">
                  <p className="text-base sm:text-lg font-medium">No files yet</p>
                  <p className="text-sm sm:text-base">Files will appear here once submitted by the provider.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "details" && (
          <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Gig Details</h2>
            <p className="text-gray-700 text-sm sm:text-base">{description}</p>
          </div>
        )}

        {activeTab === "bids" && (
          <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Bids</h2>
            <div className="p-3 sm:p-4 border border-gray-200 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-200 rounded-lg flex items-center justify-center font-bold">
                    {provider.avatar.length <= 2 ? (
                      provider.avatar
                    ) : (
                      <img src={provider.avatar} alt={provider.name} className="w-full h-full object-cover rounded-lg" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-sm sm:text-base">{provider.name}</p>
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
                <div className="text-right sm:text-right">
                  <p className="font-bold text-base sm:text-lg">₦ {budget}</p>
                  <p className="text-sm text-gray-500">Accepted</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "verification" && (
          <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <QrCodeIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Blockchain Verification</h2>
                <p className="text-xs sm:text-sm text-gray-600">Cryptographically verified and tamper-proof</p>
              </div>
            </div>

            {deliverables.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                {/* QR Code Section */}
                <div>
                  {submissions.length > 0 ? (
                    <GigVerificationQR 
                      submissionId={submissions[0].id}
                      title={`${gigTitle} - Verification`}
                      description="Scan to verify work authenticity on blockchain"
                      size={240}
                      onVerificationComplete={(result) => {
                        console.log('Verification result:', result);
                      }}
                    />
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <QrCodeIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating QR Code</h3>
                      <p className="text-gray-500">Blockchain verification in progress...</p>
                    </div>
                  )}
                </div>

                {/* Quick Info */}
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-lg border border-green-200 p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      <h3 className="font-semibold text-green-900 text-sm sm:text-base">Verified Benefits</h3>
                    </div>
                    <div className="space-y-2 text-xs sm:text-sm text-green-800">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Court-admissible evidence</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Tamper-proof blockchain record</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Instant file access via FilCDN</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Technical Stack</h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Blockchain:</span>
                        <span className="font-medium">Algorand</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Storage:</span>
                        <span className="font-medium">Filecoin + IPFS</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Algorithm:</span>
                        <span className="font-medium">SHA-256</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCodeIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Verification Available</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Blockchain verification will be available once deliverables are submitted.
                </p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
  );
};
