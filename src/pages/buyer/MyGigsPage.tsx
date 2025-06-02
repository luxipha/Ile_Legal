import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useMockDataStore } from '../../store/mockData';
import { useAuth } from '../../contexts/AuthContext';

const MyGigsPage: React.FC = () => {
  const { user } = useAuth();
  const { gigs } = useMockDataStore();
  
  // Filter gigs for the current user
  const myGigs = gigs.filter(gig => gig.client.id === user?.id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge-warning">Active</span>;
      case 'assigned':
        return <span className="badge-primary">In Progress</span>;
      case 'completed':
        return <span className="badge-success">Completed</span>;
      default:
        return <span className="badge-error">Cancelled</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Gigs</h1>
        <Link to="/buyer/post-gig" className="btn-primary">
          Post New Gig
        </Link>
      </div>

      <div className="bg-white shadow-card rounded-lg divide-y divide-gray-200">
        {myGigs.length > 0 ? (
          myGigs.map((gig) => (
            <div key={gig.id} className="p-6 hover:bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                <div className="mb-4 sm:mb-0">
                  <Link
                    to={`/gigs/${gig.id}`}
                    className="text-lg font-medium text-primary-500 hover:text-primary-600"
                  >
                    {gig.title}
                  </Link>
                  <div className="mt-2 flex items-center space-x-2">
                    {getStatusBadge(gig.status)}
                    <span className="text-sm text-gray-500">
                      Posted: {new Date(gig.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-lg font-bold text-gray-700">₦{gig.budget.toLocaleString()}</span>
                  <span className="text-sm text-gray-500">
                    Due: {new Date(gig.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                {gig.status === 'active' && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {gig.bids.length} bids received
                  </div>
                )}
                {gig.status === 'assigned' && gig.assignedTo && (
                  <div className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 mr-1 text-success-500" />
                    Assigned to: {gig.assignedTo.name}
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end space-x-3">
                <Link
                  to={`/gigs/${gig.id}`}
                  className="btn-outline text-sm"
                >
                  View Details
                </Link>
                {gig.status === 'active' && (
                  <button className="btn-ghost text-sm">
                    View Bids
                  </button>
                )}
                {gig.status === 'assigned' && (
                  <button className="btn-ghost text-sm">
                    Message Provider
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No gigs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by posting your first gig
            </p>
            <div className="mt-6">
              <Link
                to="/buyer/post-gig"
                className="btn-primary text-sm"
              >
                Post a Gig
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGigsPage;