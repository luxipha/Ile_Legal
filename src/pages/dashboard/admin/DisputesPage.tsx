import React from 'react';
import { AlertTriangle, MessageSquare, DollarSign, Scale, Clock } from 'lucide-react';

const DisputesPage: React.FC = () => {
  // Mock data for disputes
  const DISPUTES = [
    {
      id: '1',
      title: 'Payment Dispute - Land Survey Project',
      description: 'Dispute over final payment for land survey services',
      buyer: {
        name: 'Evergreen Properties',
        type: 'Property Developer',
      },
      seller: {
        name: 'Solomon Adebayo',
        type: 'Legal Professional',
      },
      amount: '₦120,000',
      status: 'pending',
      priority: 'high',
      openDate: '2025-04-24',
      lastActivity: '2025-04-26',
      type: 'payment',
    },
    {
      id: '2',
      title: 'Service Quality Dispute',
      description: 'Dispute regarding the quality of contract review services',
      buyer: {
        name: 'Lagos Homes Ltd',
        type: 'Property Developer',
      },
      seller: {
        name: 'Aisha Mohammed',
        type: 'Legal Professional',
      },
      amount: '₦85,000',
      status: 'in_review',
      priority: 'medium',
      openDate: '2025-04-23',
      lastActivity: '2025-04-25',
      type: 'quality',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage Disputes</h1>
        <div className="flex items-center space-x-3">
          <select className="input">
            <option value="all">All Disputes</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-card rounded-lg divide-y divide-gray-200">
        {DISPUTES.map((dispute) => (
          <div key={dispute.id} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  {dispute.title}
                  {dispute.priority === 'high' && (
                    <span className="ml-2 badge-error flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      High Priority
                    </span>
                  )}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{dispute.description}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">{dispute.amount}</span>
                <p className="text-sm text-gray-500">
                  Opened: {new Date(dispute.openDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700">Buyer</h3>
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900">{dispute.buyer.name}</p>
                  <p className="text-sm text-gray-500">{dispute.buyer.type}</p>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700">Seller</h3>
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900">{dispute.seller.name}</p>
                  <p className="text-sm text-gray-500">{dispute.seller.type}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  Last Activity: {new Date(dispute.lastActivity).toLocaleDateString()}
                </div>
                <div className="flex items-center text-gray-500">
                  {dispute.type === 'payment' ? (
                    <>
                      <DollarSign className="h-4 w-4 mr-1" />
                      Payment Dispute
                    </>
                  ) : (
                    <>
                      <Scale className="h-4 w-4 mr-1" />
                      Quality Dispute
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button className="btn-primary text-sm">
                  Review Case
                </button>
                <button className="btn-outline text-sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Parties
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DisputesPage;