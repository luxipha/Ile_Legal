import React, { useState } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { AlertCircleIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

interface DisputeFormProps {
  transactionId: string | number;
  transactionTitle: string;
  transactionAmount: string;
  counterpartyName?: string;
  onSubmit: (disputeData: DisputeData) => void;
  onCancel: () => void;
}

export interface DisputeData {
  transactionId: string | number;
  disputeType: 'payment' | 'quality' | 'delivery' | 'other';
  description: string;
  evidenceUrls?: string[];
  requestedResolution: string;
}

export const DisputeForm: React.FC<DisputeFormProps> = ({
  transactionId,
  transactionTitle,
  transactionAmount,
  counterpartyName = 'Counterparty',
  onSubmit,
  onCancel
}) => {
  const [disputeData, setDisputeData] = useState<Omit<DisputeData, 'transactionId'>>({
    disputeType: 'payment',
    description: '',
    evidenceUrls: [],
    requestedResolution: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDisputeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        transactionId,
        ...disputeData
      });
    } catch (error) {
      console.error('Error submitting dispute:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-gray-50 border border-gray-200 mt-2 mb-4">
      <CardContent className="p-4">
        <div className="flex items-center mb-4">
          <AlertCircleIcon className="h-5 w-5 text-amber-500 mr-2" />
          <h3 className="text-lg font-medium">Report Issue with Transaction</h3>
        </div>
        
        <div className="bg-white p-4 rounded-md border border-gray-200 mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Transaction:</span>
            <span className="font-medium">{transactionTitle}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium">{transactionAmount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">With:</span>
            <span className="font-medium">{counterpartyName}</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="disputeType" className="block text-sm font-medium text-gray-700 mb-1">
                Issue Type
              </label>
              <select
                id="disputeType"
                name="disputeType"
                value={disputeData.disputeType}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FEC85F]"
                required
              >
                <option value="payment">Payment Issue</option>
                <option value="quality">Quality of Work</option>
                <option value="delivery">Delivery Timeline</option>
                <option value="other">Other Issue</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description of Issue
              </label>
              <textarea
                id="description"
                name="description"
                value={disputeData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FEC85F]"
                placeholder="Please describe the issue in detail..."
                required
              />
            </div>
            
            <div>
              <label htmlFor="requestedResolution" className="block text-sm font-medium text-gray-700 mb-1">
                Requested Resolution
              </label>
              <textarea
                id="requestedResolution"
                name="requestedResolution"
                value={disputeData.requestedResolution}
                onChange={handleInputChange}
                rows={2}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FEC85F]"
                placeholder="What would you like as a resolution to this issue?"
                required
              />
            </div>
            
            <div>
              <label htmlFor="evidenceUrls" className="block text-sm font-medium text-gray-700 mb-1">
                Evidence Links (Optional)
              </label>
              <input
                type="text"
                id="evidenceUrls"
                name="evidenceUrls"
                value={disputeData.evidenceUrls?.join(', ')}
                onChange={(e) => {
                  const urls = e.target.value.split(',').map(url => url.trim());
                  setDisputeData(prev => ({
                    ...prev,
                    evidenceUrls: urls.filter(url => url !== '')
                  }));
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FEC85F]"
                placeholder="Enter URLs separated by commas"
              />
              <p className="text-xs text-gray-500 mt-1">
                Add links to screenshots, documents, or other evidence
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
