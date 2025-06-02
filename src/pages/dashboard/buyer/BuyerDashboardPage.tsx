import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

// Dummy data for demonstration
const ACTIVE_GIGS = [
  { 
    id: '1', 
    title: 'Land Title Verification - Victoria Island Property', 
    budget: '₦65,000', 
    bids: 4, 
    status: 'active',
    dueDate: '2025-05-15',
  },
  { 
    id: '2', 
    title: 'Contract Review for Commercial Lease', 
    budget: '₦45,000', 
    bids: 2, 
    status: 'active',
    dueDate: '2025-05-10',
  },
];

const ONGOING_GIGS = [
  { 
    id: '3', 
    title: 'Property Survey - Lekki Phase 1', 
    provider: 'Jane Doe',
    progress: 65, 
    budget: '₦80,000',
    dueDate: '2025-05-20',
  },
];

const COMPLETED_GIGS = [
  { 
    id: '4', 
    title: 'Regulatory Compliance Check - Ikoyi Project', 
    provider: 'John Smith',
    budget: '₦55,000',
    completedDate: '2025-04-20',
  },
];

const BuyerDashboardPage: React.FC = () => {
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
                Manage your legal tasks and find qualified professionals
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link
                to="/buyer/post-gig"
                className="btn-primary flex items-center"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Post New Gig
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
              <Clock className="h-8 w-8 text-primary-500" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">Active Gigs</h2>
              <p className="text-3xl font-bold text-primary-500">{ACTIVE_GIGS.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-card rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-secondary-500" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">In Progress</h2>
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
              <p className="text-3xl font-bold text-success-500">{COMPLETED_GIGS.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Gigs */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 sm:px-8">
          <h2 className="text-lg font-medium text-gray-800">Active Gigs</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your currently active gigs awaiting bids or assignment
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {ACTIVE_GIGS.length > 0 ? (
            ACTIVE_GIGS.map((gig) => (
              <div key={gig.id} className="px-6 py-5 hover:bg-gray-50 sm:px-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div className="mb-2 sm:mb-0">
                    <Link to={`/gigs/${gig.id}`} className="text-lg font-medium text-primary-500 hover:text-primary-600">
                      {gig.title}
                    </Link>
                    <div className="flex items-center mt-1">
                      <span className="badge-warning mr-2">
                        Active
                      </span>
                      <span className="text-sm text-gray-500">
                        {gig.bids} bids received
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-gray-700">{gig.budget}</span>
                    <span className="text-sm text-gray-500">Due: {new Date(gig.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <button className="btn-outline text-sm py-1 px-3">
                    View Bids
                  </button>
                  <Link to={`/gigs/${gig.id}`} className="btn-ghost text-sm py-1 px-3">
                    View Details
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-10 text-center sm:px-8">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active gigs</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new gig.
              </p>
              <div className="mt-6">
                <Link to="/buyer/post-gig" className="btn-primary text-sm">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Post New Gig
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Ongoing Gigs */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 sm:px-8">
          <h2 className="text-lg font-medium text-gray-800">In Progress</h2>
          <p className="mt-1 text-sm text-gray-500">
            Gigs currently being worked on by legal professionals
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
                      Provider: {gig.provider}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-gray-700">{gig.budget}</span>
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
                  <button className="btn-ghost text-sm py-1 px-3">
                    Message Provider
                  </button>
                  <Link to={`/gigs/${gig.id}`} className="btn-ghost text-sm py-1 px-3">
                    View Details
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-10 text-center sm:px-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No ongoing gigs</h3>
              <p className="mt-1 text-sm text-gray-500">
                When you assign a gig to a provider, it will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 sm:px-8">
          <h2 className="text-lg font-medium text-gray-800">Recent Activity</h2>
        </div>
        <div className="px-6 py-5 sm:px-8">
          <ul className="space-y-4">
            <li className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <PlusCircle className="h-5 w-5 text-primary-500" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">You posted a new gig: Land Title Verification</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </li>
            <li className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-secondary-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-secondary-500" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">New bid received on: Contract Review</p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
            </li>
            <li className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-success-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success-500" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Completed: Regulatory Compliance Check</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboardPage;