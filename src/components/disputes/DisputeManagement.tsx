import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { DisputeReviewPage } from "./DisputeReviewPage";
import { ContactPartiesPage } from "./ContactPartiesPage";
import { DollarSignIcon, UserIcon, UsersIcon } from "lucide-react";
import { api } from "../../services/api";
import { disputeMessagingService, DisputeMessage } from "../../services/disputeMessagingService";
import { useAuth } from "../../contexts/AuthContext";

export interface Dispute {
  id: number;
  title: string;
  description: string;
  amount: string;
  status: string;
  priority: string;
  openedDate: string;
  lastActivity: string;
  created_at: string;
  resolution_comment?: string;
  outcome?: string;
  type: "Payment Dispute" | "Quality Dispute" | "Delivery Dispute";
  gig_id: string;
  seller_id: string;
  buyer_id: string;
  buyer?: {
    id: string;
    name?: string;
    email?: string;
    created_at?: string;
    verification_status?: string;
  };
  seller?: {
    id: string;
    name?: string;
    email?: string;
    created_at?: string;
    verification_status?: string;
  };
}

interface DisputeManagementProps {
  disputes: Dispute[];
  selectedTab: "all" | "pending" | "review" | "resolved";
  onTabChange: (tab: "all" | "pending" | "review" | "resolved") => void;
}

// Helper function to format dates
const formatDate = (dateString: string) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
};

export const DisputeManagement = ({ 
  disputes, 
  selectedTab, 
  onTabChange 
}: DisputeManagementProps) => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<"list" | "review" | "contact">("list");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messageSuccess, setMessageSuccess] = useState(false);

  const handleReviewCase = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setCurrentView("review");
  };

  const handleContactParties = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setCurrentView("contact");
  };
  
  const handleBackToList = () => {
    setCurrentView("list");
  };

  const handleReviewSubmit = async (resolution: {
    decision: "buyer" | "seller" | "partial";
    reason: string;
    refundAmount?: string;
  }) => {
    if (!selectedDispute) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      // Map decision to status
      let status: 'approved' | 'denied';
      if (resolution.decision === 'buyer' || resolution.decision === 'partial') {
        status = 'approved';
      } else {
        status = 'denied';
      }
      await api.disputes.updateDisputeStatus(selectedDispute.id, status);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCurrentView("list");
      }, 1200);
    } catch (err: any) {
      setError("Failed to update dispute status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleContactSend = async (message: {
    recipient: "buyer" | "seller" | "both";
    subject: string;
    message: string;
  }) => {
    if (!selectedDispute || !user?.id) {
      setMessageError("Authentication required or no dispute selected");
      return;
    }

    setMessageLoading(true);
    setMessageError(null);
    setMessageSuccess(false);

    try {
      const messageData: DisputeMessage = {
        recipient: message.recipient,
        subject: message.subject,
        message: message.message
      };

      // Send message using the dispute messaging service
      const results = await disputeMessagingService.sendDisputeMessage(
        selectedDispute.id,
        user.id,
        messageData
      );

      // Check if all messages were sent successfully
      const failedMessages = results.filter(result => !result.success);
      
      if (failedMessages.length > 0) {
        const errorMsg = `Failed to send message to: ${failedMessages.map(f => f.recipient).join(', ')}`;
        setMessageError(errorMsg);
      } else {
        setMessageSuccess(true);
        // Return to the list view after success
        setTimeout(() => {
          setMessageSuccess(false);
          setCurrentView("list");
        }, 2000);
      }

    } catch (error) {
      console.error("Error sending dispute message:", error);
      setMessageError("Failed to send message. Please try again.");
    } finally {
      setMessageLoading(false);
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    if (selectedTab === "all") return true;
    if (selectedTab === "review") return dispute.status.toLowerCase() === "in review";
    return dispute.status.toLowerCase() === selectedTab;
  });

  if (currentView === "review" && selectedDispute) {
    return (
      <DisputeReviewPage
        dispute={selectedDispute}
        onBack={handleBackToList}
      />
    );
  }

  if (currentView === "contact" && selectedDispute) {
    return (
      <ContactPartiesPage
        dispute={selectedDispute}
        onBack={handleBackToList}
        onSend={handleContactSend}
        loading={messageLoading}
        error={messageError}
        success={messageSuccess}
      />
    );
  }

  return (
    <>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          {[
            { id: "all", label: "All Disputes" },
            { id: "pending", label: "Pending" },
            { id: "review", label: "In Review" },
            { id: "resolved", label: "Resolved" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as any)}
              className={`pb-4 px-6 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                selectedTab === tab.id
                  ? "border-[#FEC85F] text-[#1B1828] bg-[#FEC85F]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Dispute Cards */}
      <div className="space-y-6">
        {filteredDisputes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No disputes found in this category.</p>
          </div>
        ) : (
          filteredDisputes.map((dispute) => (
            <Card key={dispute.id} className="bg-white border border-gray-200">
              <CardContent className="p-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{dispute.title}</h3>
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                        {dispute.priority}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        dispute.status.toLowerCase() === "pending" ? "bg-yellow-100 text-yellow-800" :
                        dispute.status.toLowerCase() === "in review" ? "bg-blue-100 text-blue-800" :
                        dispute.status.toLowerCase() === "resolved" ? "bg-green-100 text-green-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {dispute.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{dispute.description}</p>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-gray-600">Buyer: {dispute.buyer?.name || dispute.buyer?.email || 'Unknown Buyer'}</span>
                          <div className="text-sm text-gray-500">Property developer</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-gray-600">Seller: {dispute.seller?.name || dispute.seller?.email || 'Unknown Seller'}</span>
                          <div className="text-sm text-gray-500">Legal professional</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        onClick={() => handleReviewCase(dispute)}
                        className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
                      >
                        Review Case
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleContactParties(dispute)}
                        className="border-[#FEC85F] text-[#FEC85F] hover:bg-[#FEC85F] hover:text-[#1B1828]"
                      >
                        Contact Parties
                      </Button>
                    </div>
                  </div>

                  <div className="text-right ml-6">
                    <div className="text-2xl font-bold text-gray-900 mb-2">{dispute.amount}</div>
                    <div className="text-sm text-gray-500 mb-2">
                      <div>Opened: {formatDate(dispute.created_at)}</div>
                      <div>Last Activity: {formatDate(dispute.lastActivity)}</div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <DollarSignIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{dispute.type}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
};
