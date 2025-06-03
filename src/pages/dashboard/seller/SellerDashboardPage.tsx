import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, TrendingUp, CheckCircle, Clock, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

// Dummy data for demonstration
const AVAILABLE_GIGS = [
  { 
    id: '1', 
    title: 'Land Title Verification - Victoria Island Property', 
    budget: '₦65,000', 
    postedBy: 'Lagos Properties Ltd.',
    deadline: '2025-05-15',
  },
  { 
    id: '2', 
    title: 'Contract Review for Commercial Lease', 
    budget: '₦45,000', 
    postedBy: 'Commercial Realty',
    deadline: '2025-05-10',
  },
];

const ACTIVE_BIDS = [
  { 
    id: '3', 
    title: 'Property Survey - Lekki Phase 1', 
    bidAmount: '₦75,000',
    originalBudget: '₦80,000',
    client: 'Prestige Homes',
    bidDate: '2025-04-25',
  },
];

const ONGOING_GIGS = [
  { 
    id: '4', 
    title: 'Due Diligence on Residential Development', 
    client: 'Evergreen Estates',
    dueDate: '2025-05-18',
    payment: '₦90,000',
    progress: 40,
  },
];

const SellerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Section */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="px-6 py-5 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Welcome back, {user?.name.split(' ')[0] || 'User'}
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
              <p className="text-3xl font-bold text-primary-500">{ACTIVE_BIDS.length}</p>
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
              <p className="text-3xl font-bold text-secondary-500">{ONGOING_GIGS.length}</p>
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
              <p className="text-3xl font-bold text-success-500">12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Gigs */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 sm:px-8">
          <h2 className="text-lg font-medium text-gray-800">Available Gigs</h2>
          <p className="mt-1 text-sm text-gray-500">
            Recently posted gigs that match your expertise
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {AVAILABLE_GIGS.length > 0 ? (
            AVAILABLE_GIGS.map((gig) => (
              <div key={gig.id} className="px-6 py-5 hover:bg-gray-50 sm:px-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div className="mb-2 sm:mb-0">
                    <Link to={`/gigs/${gig.id}`} className="text-lg font-medium text-primary-500 hover:text-primary-600">
                      {gig.title}
                    </Link>
                    <div className="mt-1 text-sm text-gray-500">
                      Posted by: {gig.postedBy}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-gray-700">{gig.budget}</span>
                    <span className="text-sm text-gray-500">Deadline: {new Date(gig.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <Link to={`/seller/bid/${gig.id}`} className="btn-primary text-sm py-1 px-3">
                    Place Bid
                  </Link>
                  <Link to={`/gigs/${gig.id}`} className="btn-ghost text-sm py-1 px-3">
                    View Details
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-10 text-center sm:px-8">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No available gigs</h3>
              <p className="mt-1 text-sm text-gray-500">
                No gigs matching your expertise are currently available.
              </p>
              <div className="mt-6">
                <Link to="/seller/find-gigs" className="btn-primary text-sm">
                  <Search className="mr-2 h-5 w-5" />
                  Browse All Gigs
                </Link>
              </div>
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
          {ACTIVE_BIDS.length > 0 ? (
            ACTIVE_BIDS.map((bid) => (
              <div key={bid.id} className="px-6 py-5 hover:bg-gray-50 sm:px-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div className="mb-2 sm:mb-0">
                    <Link to={`/gigs/${bid.id}`} className="text-lg font-medium text-primary-500 hover:text-primary-600">
                      {bid.title}
                    </Link>
                    <div className="mt-1 text-sm text-gray-500">
                      Client: {bid.client}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-gray-700">{bid.bidAmount}</span>
                    <span className="text-sm text-gray-500">Original: {bid.originalBudget}</span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Bid placed on: {new Date(bid.bidDate).toLocaleDateString()}
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <Link to={`/seller/bid/${bid.id}/edit/${bid.id}`} className="btn-ghost text-sm py-1 px-3">
                    Edit Bid
                  </Link>
                  <Link to={`/gigs/${bid.id}?tab=details`} className="btn-ghost text-sm py-1 px-3">
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
      
      {/* Ongoing Gigs */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 sm:px-8">
          <h2 className="text-lg font-medium text-gray-800">Ongoing Gigs</h2>
          <p className="mt-1 text-sm text-gray-500">
            Gigs you are currently working on
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {ONGOING_GIGS.length > 0 ? (
            ONGOING_GIGS.map((gig) => (
              <div key={gig.id} className="px-6 py-5 hover:bg-gray-50 sm:px-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div className="mb-2 sm:mb-0">
                    <Link to={`/gigs/${gig.id}`} className="text-lg font-medium text-primary-500 hover:text-primary-600">
                      {gig.title}
                    </Link>
                    <div className="mt-1 text-sm text-gray-500">
                      Client: {gig.client}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-gray-700">{gig.payment}</span>
                    <span className="text-sm text-gray-500">Due: {new Date(gig.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Progress</span>
                    <span>{gig.progress}%</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-secondary-500 h-2 rounded-full" 
                      style={{ width: `${gig.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <Link to={`/seller/gig/${gig.id}/submit`} className="btn-outline text-sm py-1 px-3">
                    Submit Work
                  </Link>
                  <Link to={`/seller/messages/conv-${gig.id}`} className="btn-ghost text-sm py-1 px-3">
                    Message Client
                  </Link>
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
    </div>
  );
};

export default SellerDashboardPage;