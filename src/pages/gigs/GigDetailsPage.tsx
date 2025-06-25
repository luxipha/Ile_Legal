import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Calendar, DollarSign, MessageSquare, FileText, Clock, Shield, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const GigDetailsPage: React.FC = () => {
  const { gigId } = useParams<{ gigId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingBid, setAcceptingBid] = useState(false);
  const [acceptedBidId, setAcceptedBidId] = useState<string | null>(null);
  
  // Check for tab query parameter
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tabParam = queryParams.get('tab');
    if (tabParam && ['details', 'bids', 'messages', 'deliverables'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);
  
  useEffect(() => {
    if (gigId) {
      const fetchGig = async () => {
        try {
          const gigData = await api.gigs.getGigById(gigId);
          if (gigData && gigData.length > 0) {
            // Add default client values if not present
            const gigWithClient = {
              ...gigData[0],
              client: gigData[0].client || {
                name: 'Not Assigned',
                rating: 0,
                projectsPosted: 0
              }
            };
            setGig(gigWithClient);
          }
        } catch (error) {
          console.error('Error fetching gig:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchGig();
    }
  }, [gigId]);

  
  // Determine if the current user is the gig owner (buyer)
  const isOwner = user?.role === 'buyer';
  // Determine if the current user is a seller
  const isSeller = user?.role === 'seller';
  // Determine if the current user is an admin
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white shadow-card rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white shadow-card rounded-lg p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-800">Gig Not Found</h2>
          <p className="mt-2 text-gray-600">The gig you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/gigs')}
            className="mt-6 btn-primary"
          >
            Browse Gigs
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="mb-6">
        <Link
          to={`/${user?.role}/dashboard`}
          className="flex items-center text-primary-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        {/* Gig Header */}
        <div className="px-6 py-5 border-b border-gray-200 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 font-serif">{gig.title}</h1>
              <button className="btn-primary" onClick={() => {
                api.gigs.updateGig(gig.id, {
                  ...gig,
                  status: 'active'
                });
              }}>
                Complete Gig
              </button>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="mr-1 h-4 w-4 text-gray-400" />
                  Posted: {new Date(gig.postedDate).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="mr-1 h-4 w-4 text-gray-400" />
                  Deadline: {new Date(gig.deadline).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <DollarSign className="mr-1 h-4 w-4 text-gray-400" />
                  Budget: {gig.budget}
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <span className="badge-warning">
                {gig.status === 'active' ? 'Open for Bids' : 
                 gig.status === 'assigned' ? 'In Progress' :
                 gig.status === 'completed' ? 'Completed' :
                 gig.status === 'suspended' ? 'Suspended' : 'Cancelled'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              className={`border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'details' ? 'border-primary-500 text-primary-500' : ''
              }`}
              onClick={() => {
                setActiveTab('details');
                navigate(`/gigs/${gigId}?tab=details`, { replace: true });
              }}
            >
              Details
            </button>
            <button
              className={`border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'bids' ? 'border-primary-500 text-primary-500' : ''
              }`}
              onClick={() => {
                setActiveTab('bids');
                navigate(`/gigs/${gigId}?tab=bids`, { replace: true });
              }}
            >
              Bids ({gig.bids.length})
            </button>
            {(gig.status === 'assigned' || gig.status === 'completed') && (
              <button
                className={`border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'deliverables' ? 'border-primary-500 text-primary-500' : ''
                }`}
                onClick={() => {
                  setActiveTab('deliverables');
                  navigate(`/gigs/${gigId}?tab=deliverables`, { replace: true });
                }}
              >
                Deliverables
              </button>
            )}
            <button
              className={`border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'messages' ? 'border-primary-500 text-primary-500' : ''
              }`}
              onClick={() => {
                setActiveTab('messages');
                navigate(`/gigs/${gigId}?tab=messages`, { replace: true });
              }}
            >
              Messages
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-800 mb-2">Description</h2>
                <div className="text-gray-600 prose max-w-none">
                  {gig.description.split('\n\n').map((paragraph: string, index: number) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-medium text-gray-800 mb-2">Client Information</h2>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary-500" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-base font-medium text-gray-800">{gig.client.name}</h3>
                    <div className="flex items-center mt-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(gig.client.rating ?? 0)
                                ? 'text-secondary-500'
                                : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-1 text-sm text-gray-500">{(gig.client.rating ?? 0).toFixed(1)}</span>
                      </div>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-sm text-gray-500">{gig.client.projectsPosted ?? 0} projects posted</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action buttons based on user role and gig status */}
              {isSeller && gig.status === 'active' && gig.status !== 'suspended' && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-end">
                    <button className="btn-primary">
                      Place Bid
                    </button>
                  </div>
                </div>
              )}
              {isAdmin && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-end space-x-3">
                    <button className="btn-outline flex items-center">
                      <Shield className="mr-2 h-5 w-5" />
                      Review Gig
                    </button>
                    {gig.status !== 'cancelled' && (
                      <button className="btn-ghost text-error-500">
                        Suspend Gig
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Bids Tab */}
          {activeTab === 'bids' && (
            <div className="space-y-6">
              {gig.bids.length > 0 ? (
                <div className="space-y-6">
                  {gig.bids.map((bid: any) => (
                    <div key={bid.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                        <div className="mb-4 sm:mb-0">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <User className="h-6 w-6 text-primary-500" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <h3 className="text-base font-medium text-gray-800">{bid.provider.name}</h3>
                              <p className="text-sm text-gray-500">{bid.provider.profession}</p>
                              <div className="flex items-center mt-1">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <svg
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < Math.floor(bid.provider.rating ?? 0)
                                          ? 'text-secondary-500'
                                          : 'text-gray-300'
                                      }`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                  <span className="ml-1 text-sm text-gray-500">{(bid.provider.rating ?? 0).toFixed(1)}</span>
                                </div>
                                <span className="mx-2 text-gray-300">•</span>
                                <span className="text-sm text-gray-500">{bid.provider.completedJobs ?? 0} jobs completed</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-start sm:items-end">
                          <span className="text-lg font-bold text-gray-700">{bid.amount}</span>
                          <div className="flex items-center mt-1">
                            <Clock className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-500">{bid.deliveryTime}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Submitted: {new Date(bid.submittedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Proposal</h4>
                        <p className="text-sm text-gray-600">{bid.proposal}</p>
                      </div>
                      
                      {/* Bid actions for buyer */}
                      {isOwner && gig.status === 'active' && (
                        <div className="mt-6 flex justify-end space-x-3">
                          {acceptedBidId === bid.id ? (
                            <div className="text-success-500 font-medium flex items-center">
                              <CheckCircle className="h-5 w-5 mr-1" />
                              Bid Accepted
                            </div>
                          ) : acceptedBidId ? (
                            <button className="btn-disabled" disabled>
                              Accept Bid
                            </button>
                          ) : (
                            <button 
                              className={`btn-primary ${acceptingBid ? 'opacity-75 cursor-wait' : ''}`}
                              disabled={acceptingBid}
                              onClick={() => {
                                setAcceptingBid(true);
                                // Simulate API call to accept bid
                                setTimeout(() => {
                                  setAcceptedBidId(bid.id);
                                  setAcceptingBid(false);
                                  // Update gig status
                                  setGig((prev: any) => ({
                                    ...prev,
                                    status: 'in-progress',
                                    assignedProvider: bid.provider.name,
                                    acceptedBid: bid
                                  }));
                                }, 1000);
                              }}
                            >
                              {acceptingBid ? 'Processing...' : 'Accept Bid'}
                            </button>
                          )}
                          <Link 
                            to={`/buyer/messages/conv-${bid.id}`}
                            className="btn-ghost"
                          >
                            Message
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No bids yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    There are no bids on this gig yet. Check back later.
                  </p>
                </div>
              )}
              
              {/* Bid action for seller */}
              {isSeller && gig.status === 'active' && gig.status !== 'suspended' && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-end">
                    <button className="btn-primary">
                      Place a Bid
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start a conversation about this gig.
                </p>
                <div className="mt-6">
                  <Link 
                    to={`/${user?.role || 'buyer'}/messages/conv-${gig.id}`} 
                    className="btn-primary"
                  >
                    Send Message
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {/* Deliverables Tab (only visible for assigned or completed gigs) */}
          {activeTab === 'deliverables' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No deliverables yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  The legal professional will upload deliverables here when ready.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GigDetailsPage;