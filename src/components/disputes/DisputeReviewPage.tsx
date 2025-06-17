import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { Dispute } from "./DisputeManagement";

interface DisputeReviewPageProps {
  dispute: Dispute;
  onBack: () => void;
  onSubmit: (resolution: {
    decision: "buyer" | "seller" | "partial";
    reason: string;
    refundAmount?: string;
  }) => void;
}

export const DisputeReviewPage = ({ dispute, onBack, onSubmit }: DisputeReviewPageProps) => {
  const [decision, setDecision] = useState<"buyer" | "seller" | "partial">("buyer");
  const [reason, setReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!reason) {
      alert("Please provide a reason for your decision.");
      return;
    }

    if (decision === "partial" && !refundAmount) {
      alert("Please specify the refund amount for partial resolution.");
      return;
    }

    onSubmit({
      decision,
      reason,
      refundAmount: decision === "partial" ? refundAmount : undefined
    });
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
        <p className="text-gray-600 mb-4">{dispute.description}</p>
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-gray-500">Buyer: {dispute.buyer}</p>
            <p className="text-sm text-gray-500">Seller: {dispute.seller}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{dispute.amount}</p>
            <p className="text-sm text-gray-500">Opened: {dispute.openedDate}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              />
              <Label htmlFor="buyer" className="flex items-center cursor-pointer">
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
              />
              <Label htmlFor="seller" className="flex items-center cursor-pointer">
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
              />
              <Label htmlFor="partial" className="flex items-center cursor-pointer">
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
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
          >
            Submit Resolution
          </Button>
        </div>
      </form>
    </div>
  );
};
