import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, Trash2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const MyGigsPage: React.FC = () => {
  const { user } = useAuth();
  const [myGigs, setMyGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedGigs, setSelectedGigs] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const toggleSelectMode = () => {
    console.log('Toggle select mode clicked, current state:', isSelectMode);
    setIsSelectMode(!isSelectMode);
    setSelectedGigs(new Set());
    setError(null);
  };

  const toggleGigSelection = (gigId: string) => {
    const newSelected = new Set(selectedGigs);
    if (newSelected.has(gigId)) {
      newSelected.delete(gigId);
    } else {
      newSelected.add(gigId);
    }
    setSelectedGigs(newSelected);
  };

  const selectAllGigs = () => {
    const deletableGigs = myGigs.filter(gig => 
      gig.status === 'pending' || gig.status === 'active'
    );
    setSelectedGigs(new Set(deletableGigs.map(gig => gig.id)));
  };

  const clearSelection = () => {
    setSelectedGigs(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedGigs.size > 0) {
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteSelected = async () => {
    if (!user?.id || selectedGigs.size === 0) return;
    
    setDeleting(true);
    try {
      const deletePromises = Array.from(selectedGigs).map(gigId => 
        api.gigs.deleteGig(gigId)
      );
      
      const results = await Promise.all(deletePromises);
      const hasErrors = results.some(error => error !== null);
      
      if (hasErrors) {
        setError('Some gigs could not be deleted. Please try again.');
      } else {
        // Remove deleted gigs from local state
        setMyGigs(prevGigs => 
          prevGigs.filter(gig => !selectedGigs.has(gig.id))
        );
        setSelectedGigs(new Set());
        setIsSelectMode(false);
      }
    } catch (err) {
      console.error('Error deleting gigs:', err);
      setError('Failed to delete gigs. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const cancelDeleteModal = () => {
    setShowDeleteModal(false);
  };

  // Single delete functionality
  const handleSingleDelete = async (gigId: string) => {
    if (!user?.id) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this gig?');
    if (!confirmed) return;
    
    try {
      const error = await api.gigs.deleteGig(gigId);
      if (error) {
        console.error('Error deleting gig:', error);
        setError('Failed to delete gig. Please try again.');
      } else {
        setMyGigs(prevGigs => prevGigs.filter(gig => gig.id !== gigId));
      }
    } catch (err) {
      console.error('Error deleting gig:', err);
      setError('Failed to delete gig. Please try again.');
    }
  };

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
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSelectMode}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete Gigs"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <Link to="/buyer/post-gig" className="btn-primary">
              Post New Gig
            </Link>
          </div>
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
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleSelectMode}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete Gigs"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <Link to="/buyer/post-gig" className="btn-primary">
              Post New Gig
            </Link>
          </div>
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
        <div className="flex items-center space-x-3">
          {!isSelectMode ? (
            <>
              <button
                onClick={toggleSelectMode}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete Gigs"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <Link to="/buyer/post-gig" className="btn-primary">
                Post New Gig
              </Link>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>{selectedGigs.size} selected</span>
                {selectedGigs.size > 0 && (
                  <button
                    onClick={clearSelection}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={selectAllGigs}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
              </div>
              {selectedGigs.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : `Delete ${selectedGigs.size} gig(s)`}
                </button>
              )}
              <button
                onClick={toggleSelectMode}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title="Cancel Selection"
              >
                <X className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white shadow-card rounded-lg divide-y divide-gray-200">
        {myGigs.length > 0 ? (
          myGigs.map((gig) => {
            const isSelected = selectedGigs.has(gig.id);
            const isDeletable = gig.status === 'pending' || gig.status === 'active';
            
            return (
              <div 
                key={gig.id} 
                className={`p-6 hover:bg-gray-50 ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''} ${isSelectMode && !isDeletable ? 'opacity-50' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <div className="flex items-start space-x-3 mb-4 sm:mb-0">
                    {isSelectMode && isDeletable && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleGigSelection(gig.id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    )}
                    <div>
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

                {!isSelectMode && (
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex space-x-3">
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
                    
                    {/* Single delete button - only show for pending or active gigs */}
                    {isDeletable && (
                      <button
                        onClick={() => handleSingleDelete(gig.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        title="Delete Gig"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedGigs.size} gig(s)? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeleteModal}
                disabled={deleting}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSelected}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : `Delete ${selectedGigs.size} gig(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyGigsPage;