import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { Dispute } from "./DisputeManagement";
import { api } from "../../services/api";

interface DisputeReviewPageProps {
  dispute: Dispute;
  onBack: () => void;
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

export const DisputeReviewPage = ({ dispute, onBack }: DisputeReviewPageProps) => {
  const [decision, setDecision] = useState<"buyer" | "seller" | "partial">("buyer");
  const [reason, setReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if dispute is already resolved
  console.log('dispute', dispute)
  const isResolved = dispute.status.toLowerCase() === "resolved";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if already resolved
    if (isResolved) {
      return;
    }
    
    // Validation
    if (!reason) {
      alert("Please provide a reason for your decision.");
      return;
    }
    if (decision === "partial" && !refundAmount) {
      alert("Please specify the refund amount for partial resolution.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      // Always set status to 'resolved'
      await api.disputes.updateDisputeStatus(dispute.id, 'resolved');
      if (reason) {
        await api.disputes.updateDisputeResolutionComment(dispute.id, reason);
      }
      // Determine outcome and refund_amount
      let outcome: string;
      let refund_amount: string | undefined = undefined;
      if (decision === 'buyer') {
        outcome = 'approved';
        // Fetch all bids for the gig and find the seller's bid
        const bids = await api.bids.getBidsByGigId(dispute.gig_id);
        const sellerBid = bids.find((bid: any) => bid.seller_id === dispute.seller_id);
        if (!sellerBid) {
          throw new Error('Could not find the seller\'s bid for this gig.');
        }
        refund_amount = sellerBid.amount?.toString() || '0';
      } else if (decision === 'seller') {
        outcome = 'denied';
        refund_amount = '0';
      } else {
        outcome = 'partial';
        refund_amount = refundAmount;
      }
      await api.disputes.updateDisputeOutcome(dispute.id, outcome, refund_amount);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onBack();
      }, 1200);
    } catch (err: any) {
      setError("Failed to update dispute status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={onBack} 
          className="mr-2 p-0 h-auto hover:bg-transparent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold">Review Dispute Case</h2>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">{dispute.title}</h3>
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            dispute.status.toLowerCase() === "pending" ? "bg-yellow-100 text-yellow-800" :
            dispute.status.toLowerCase() === "in review" ? "bg-blue-100 text-blue-800" :
            dispute.status.toLowerCase() === "resolved" ? "bg-green-100 text-green-800" :
            "bg-gray-100 text-gray-800"
          }`}>
            {dispute.status}
          </span>
        </div>
        <p className="text-gray-600 mb-4">{dispute.description}</p>
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-gray-500">Buyer: {dispute.buyer?.name || dispute.buyer?.email || 'Unknown Buyer'}</p>
            <p className="text-sm text-gray-500">Seller: {dispute.seller?.name || dispute.seller?.email || 'Unknown Seller'}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{dispute.amount}</p>
            <p className="text-sm text-gray-500">Opened: {formatDate(dispute.created_at)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {isResolved && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">This dispute has already been resolved.</p>
            </div>
            <p className="text-green-700 text-sm mt-1">No further action is required.</p>
            {(dispute.outcome || dispute.resolution_comment) && (
              <div className="mt-3 p-3 bg-white rounded border border-green-200">
                {dispute.outcome && (
                  <div className="mb-2">
                    <p className="text-green-800 font-medium text-sm mb-1">Resolution Decision:</p>
                    <p className="text-green-700 text-sm capitalize">{dispute.outcome}</p>
                  </div>
                )}
                {dispute.resolution_comment && (
                  <div>
                    <p className="text-green-800 font-medium text-sm mb-1">Resolution Details:</p>
                    <p className="text-green-700 text-sm">{dispute.resolution_comment}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-3">
          <Label>Resolution Decision</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
              <input 
                type="radio" 
                id="buyer" 
                name="decision" 
                value="buyer" 
                checked={decision === "buyer"} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDecision(e.target.value as "buyer" | "seller" | "partial")} 
                className="h-4 w-4"
                disabled={isResolved}
              />
              <Label htmlFor="buyer" className={`flex items-center cursor-pointer ${isResolved ? 'text-gray-400' : ''}`}>
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Rule in favor of buyer (Full refund)
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
              <input 
                type="radio" 
                id="seller" 
                name="decision" 
                value="seller" 
                checked={decision === "seller"} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDecision(e.target.value as "buyer" | "seller" | "partial")} 
                className="h-4 w-4"
                disabled={isResolved}
              />
              <Label htmlFor="seller" className={`flex items-center cursor-pointer ${isResolved ? 'text-gray-400' : ''}`}>
                <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                Rule in favor of seller (No refund)
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
              <input 
                type="radio" 
                id="partial" 
                name="decision" 
                value="partial" 
                checked={decision === "partial"} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDecision(e.target.value as "buyer" | "seller" | "partial")} 
                className="h-4 w-4"
                disabled={isResolved}
              />
              <Label htmlFor="partial" className={`flex items-center cursor-pointer ${isResolved ? 'text-gray-400' : ''}`}>
                <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                Partial resolution
              </Label>
            </div>
          </div>
        </div>
        {decision === "partial" && (
          <div>
            <Label htmlFor="refund-amount">Refund Amount</Label>
            <div className="mt-1 relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₦</span>
              <input
                id="refund-amount"
                type="text"
                value={refundAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRefundAmount(e.target.value)}
                placeholder="Enter refund amount"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isResolved}
              />
            </div>
          </div>
        )}
        <div>
          <Label htmlFor="resolution-reason">Reason for Decision</Label>
          <Textarea 
            id="resolution-reason"
            value={reason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
            placeholder="Provide a detailed explanation for your decision..."
            className="mt-1 h-24"
            disabled={isResolved}
          />
        </div>
        {error && <div className="text-red-600 mt-2">{error}</div>}
        {success && <div className="text-green-600 mt-2">Dispute status updated successfully!</div>}
        <div className="flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            disabled={loading}
          >
            {isResolved ? 'Back to List' : 'Cancel'}
          </Button>
          {!isResolved && (
            <Button 
              type="submit" 
              className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Resolution"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
