import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, TrendingUp, CheckCircle, Clock, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMockDataStore } from '../../store/mockData';

const SellerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { gigs } = useMockDataStore();
  
  // Filter gigs for the current seller
  const ongoingGigs = gigs.filter(gig => 
    gig.status === 'assigned' && 
    gig.assignedTo?.id === user?.id
  );

  const activeBids = gigs.flatMap(gig => 
    gig.bids.filter(bid => 
      bid.status === 'pending' && 
      bid.provider.id === user?.id
    ).map(bid => ({
      ...bid,
      gig: {
        id: gig.id,
        title: gig.title,
        client: gig.client.name,
        deadline: gig.deadline,
      }
    }))
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Section */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="px-6 py-5 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}
              </h1>
              <p className="mt-1 text-gray-500">
                Find and manage legal gigs for property services
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link
                to="/seller/find-gigs"
                className="btn-primary flex items-center"
              >
                <Search className="mr-2 h-5 w-5" />
                Find Gigs
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow-card rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-primary-500" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">Active Bids</h2>
              <p className="text-3xl font-bold text-primary-500">{activeBids.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-card rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Briefcase className="h-8 w-8 text-secondary-500" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">Ongoing Gigs</h2>
              <p className="text-3xl font-bold text-secondary-500">{ongoingGigs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-card rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-success-500" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">Completed</h2>
              <p className="text-3xl font-bold text-success-500">
                {gigs.filter(g => g.status === 'completed' && g.assignedTo?.id === user?.id).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ongoing Gigs */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 sm:px-8">
          <h2 className="text-lg font-medium text-gray-800">Ongoing Gigs</h2>
          <p className="mt-1 text-sm text-gray-500">
            Gigs you are currently working on
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {ongoingGigs.length > 0 ? (
            ongoingGigs.map((gig) => (
              <div key={gig.id} className="px-6 py-5 hover:bg-gray-50 sm:px-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div className="mb-2 sm:mb-0">
                    <Link to={`/gigs/${gig.id}`} className="text-lg font-medium text-primary-500 hover:text-primary-600">
                      {gig.title}
                    </Link>
                    <div className="mt-1 text-sm text-gray-500">
                      Client: {gig.client.name}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-gray-700">₦{gig.budget.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">Due: {new Date(gig.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <Link 
                    to={`/seller/gig/${gig.id}/submit`}
                    className="btn-primary text-sm"
                  >
                    Submit Work
                  </Link>
                  <button className="btn-ghost text-sm">
                    Message Client
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-10 text-center sm:px-8">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No ongoing gigs</h3>
              <p className="mt-1 text-sm text-gray-500">
                When a client accepts your bid, the gig will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Active Bids */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 sm:px-8">
          <h2 className="text-lg font-medium text-gray-800">Your Active Bids</h2>
          <p className="mt-1 text-sm text-gray-500">
            Bids you've placed that are awaiting client decisions
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {activeBids.length > 0 ? (
            activeBids.map((bid) => (
              <div key={bid.id} className="px-6 py-5 hover:bg-gray-50 sm:px-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div className="mb-2 sm:mb-0">
                    <Link to={`/gigs/${bid.gig.id}`} className="text-lg font-medium text-primary-500 hover:text-primary-600">
                      {bid.gig.title}
                    </Link>
                    <div className="mt-1 text-sm text-gray-500">
                      Client: {bid.gig.client}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-gray-700">₦{bid.amount.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">Due: {new Date(bid.gig.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <Link
                    to={`/seller/bid/${bid.gig.id}/edit/${bid.id}`}
                    className="btn-outline text-sm"
                  >
                    Edit Bid
                  </Link>
                  <Link to={`/gigs/${bid.gig.id}`} className="btn-ghost text-sm">
                    View Details
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-10 text-center sm:px-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active bids</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't placed any bids yet. Browse available gigs to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboardPage;