import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const MyGigsPage: React.FC = () => {
  const { user } = useAuth();
  const [myGigs, setMyGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyGigs = async () => {
      if (!user?.id) return;
      
      try {
        const data = await api.gigs.getMyGigs(user.id);
        setMyGigs(data);
      } catch (err) {
        console.error('Error fetching gigs:', err);
        setError('Failed to load your gigs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyGigs();
  }, [user?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge-warning">Active</span>;
      case 'assigned':
        return <span className="badge-primary">In Progress</span>;
      case 'completed':
      case 'pending_payment':
        return <span className="badge-success">Completed</span>;
      default:
        return <span className="badge-error">Cancelled</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Gigs</h1>
          <Link to="/buyer/post-gig" className="btn-primary">
            Post New Gig
          </Link>
        </div>
        <div className="bg-white shadow-card rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Gigs</h1>
          <Link to="/buyer/post-gig" className="btn-primary">
            Post New Gig
          </Link>
        </div>
        <div className="bg-white shadow-card rounded-lg p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-error-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Gigs</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

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
                      Posted: {new Date(gig.created_at).toLocaleDateString()}
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
                    {gig.bids?.length || 0} bids received
                  </div>
                )}
                {gig.status === 'assigned' && gig.assigned_to && (
                  <div className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 mr-1 text-success-500" />
                    Assigned to: {gig.assigned_to}
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
                  <Link
                    to={`/gigs/${gig.id}?tab=bids`}
                    className="btn-ghost text-sm"
                  >
                    View Bids
                  </Link>
                )}
                {gig.status === 'assigned' && (
                  <Link
                    to={`/messages/conv-${gig.id}`}
                    className="btn-ghost text-sm"
                  >
                    Message Provider
                  </Link>
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