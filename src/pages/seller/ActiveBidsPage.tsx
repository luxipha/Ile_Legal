import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, DollarSign, MessageSquare } from 'lucide-react';
import { useMockDataStore } from '../../store/mockData';

const ActiveBidsPage: React.FC = () => {
  const { gigs } = useMockDataStore();
  
  // Filter gigs to get active bids
  const activeBids = gigs.flatMap(gig => 
    gig.bids.map(bid => ({
      ...bid,
      gig: {
        id: gig.id,
        title: gig.title,
        client: gig.client.name,
        deadline: gig.deadline
      }
    }))
  ).filter(bid => bid.status === 'pending');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Active Bids</h1>

      <div className="bg-white shadow-card rounded-lg divide-y divide-gray-200">
        {activeBids.length > 0 ? (
          activeBids.map((bid) => (
            <div key={bid.id} className="p-6 hover:bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                <div className="mb-4 sm:mb-0">
                  <Link
                    to={`/gigs/${bid.gig.id}`}
                    className="text-lg font-medium text-primary-500 hover:text-primary-600"
                  >
                    {bid.gig.title}
                  </Link>
                  <div className="mt-1 text-sm text-gray-500">
                    Client: {bid.gig.client}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    Bid submitted: {new Date(bid.submittedDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center text-lg font-bold text-gray-900">
                    <DollarSign className="h-5 w-5 text-gray-500" />
                    ₦{bid.amount.toLocaleString()}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Due: {new Date(bid.gig.deadline).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-3">
                <Link
                  to={`/seller/bid/${bid.gig.id}/edit/${bid.id}`}
                  className="btn-outline text-sm"
                >
                  Edit Bid
                </Link>
                <Link
                  to={`/seller/messages/${bid.gig.id}`}
                  className="btn-ghost text-sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message Client
                </Link>
                <Link
                  to={`/gigs/${bid.gig.id}`}
                  className="btn-ghost text-sm"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <Clock className="h-full w-full" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No active bids</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start bidding on gigs to see them here.
            </p>
            <div className="mt-6">
              <Link
                to="/seller/find-gigs"
                className="btn-primary text-sm"
              >
                Find Gigs
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveBidsPage;