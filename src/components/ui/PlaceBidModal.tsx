import React, { useState } from "react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { ArrowLeftIcon, XIcon } from "lucide-react";

interface PlaceBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  gig: {
    id: number;
    title: string;
    budget: string;
    deadline: string;
    deliveryTime: string;
  };
}

export const PlaceBidModal: React.FC<PlaceBidModalProps> = ({
  isOpen,
  onClose,
  gig,
}) => {
  const [bidFormData, setBidFormData] = useState({
    bidAmount: "",
    deliveryTime: "",
    proposal: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Bid submitted:", bidFormData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
            <h2 className="text-2xl font-semibold text-gray-900">Place a Bid</h2>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <XIcon className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          {/* Gig Summary */}
          <Card className="bg-blue-50 border border-blue-200 mb-8">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{gig.title}</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <span className="text-gray-600">Budget:</span>
                  <div className="font-semibold text-gray-900">{gig.budget}</div>
                </div>
                <div>
                  <span className="text-gray-600">Deadline:</span>
                  <div className="font-semibold text-gray-900">{gig.deadline}</div>
                </div>
                <div>
                  <span className="text-gray-600">Delivery Time:</span>
                  <div className="font-semibold text-gray-900">{gig.deliveryTime}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bid Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                onClick={onClose}
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
        </div>
      </div>
    </div>
  );
};