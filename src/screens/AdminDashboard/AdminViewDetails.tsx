import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";
import { ArrowLeft, Flag, Star, CheckCircle, AlertTriangle, MessageSquare, XCircle, User } from "lucide-react";
import { api } from "../../services/api";

type Bid = {
  id: string | number;
  name: string;
  avatar: string;
  title: string;
  rating: number;
  completedJobs: number;
  amount: string;
  deliveryTime: string;
  submittedDate: string;
  proposal: string;
  status?: "pending" | "accepted" | "rejected";
};

type Gig = {
  id: number;
  title: string;
  client: string;
  provider: string;
  amount: string;
  status: string;
  priority?: string;
  postedDate: string;
  dueDate: string;
  description?: string;
  budget?: string;
  deadline?: string;
  bids?: Bid[];
  is_flagged?: boolean;
  attachments?: string[];
};

type AdminViewDetailsProps = {
  gig: Gig | null;
  onBack: () => void;
  onFlag: (gigId: number) => void;
  onUnflag?: (gigId: number) => void;
  onReview: (gigId: number) => void;
  onSuspend: (gigId: number) => void;
};

export const AdminViewDetails = ({
  gig,
  onBack,
  onFlag,
  onUnflag,
  onReview,
  onSuspend
}: AdminViewDetailsProps): JSX.Element => {
  console.log("gig:", gig);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showUnsuspendModal, setShowUnsuspendModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [unsuspendNotes, setUnsuspendNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "bids">("details");
  const [flagAction, setFlagAction] = useState<'flag' | 'unflag'>('flag');
  const [bids, setBids] = useState<Bid[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [loadingClient, setLoadingClient] = useState(false);
  const [adminReviewData, setAdminReviewData] = useState<any>(null);
  
  // Helper function to format date in mm/dd/yyyy format
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid date
      
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${month}/${day}/${year}`;
    } catch (error) {
      return dateString; // Return original if parsing fails
    }
  };

  // Helper function to check if a string is a valid image URL
  const isImageUrl = (url: string | undefined | null): boolean => {
    return Boolean(url && (
      url.startsWith('http://') || 
      url.startsWith('https://') || 
      url.startsWith('data:image/')
    ));
  };

  // Fetch bids when component mounts or when gig changes
  useEffect(() => {
    if (gig?.id) {
      fetchBids();
      fetchClientData();
      fetchAdminReviewData();
    }
  }, [gig?.id]);

  const fetchBids = async () => {
    if (!gig?.id) return;
    
    try {
      setLoadingBids(true);
      const bidsData = await api.bids.getBidsByGigId(gig.id.toString());
      
      // Transform the API bid data to match the UI expectations
      const transformedBids: Bid[] = await Promise.all(
        bidsData.map(async (bid: any) => {
          // Get seller profile data
          const sellerProfile = bid.seller || {};
          const sellerName = sellerProfile.name || 
                           `${sellerProfile.first_name || ''} ${sellerProfile.last_name || ''}`.trim() || 
                           'Anonymous Seller';
          
          // Get seller rating and completed jobs
          let sellerRating = 0;
          let completedJobs = 0;
          
          try {
            if (bid.seller_id) {
              const rating = await api.feedback.getAverageRating(bid.seller_id);
              sellerRating = rating || 0;
              
              // Get completed jobs count (you might need to implement this API)
              // For now, using a default value
              completedJobs = sellerProfile.completed_jobs || 0;
            }
          } catch (error) {
            console.error('Error fetching seller rating:', error);
          }
          
          // Determine avatar - check if it's a valid URL or use initials
          const avatarUrl = sellerProfile.avatar_url;
          const isAvatarUrl = isImageUrl(avatarUrl);
          
          return {
            id: bid.id,
            name: sellerName,
            avatar: isAvatarUrl ? avatarUrl : sellerName.charAt(0).toUpperCase(),
            title: sellerProfile.title || 'Legal Professional',
            rating: sellerRating,
            completedJobs: completedJobs,
            amount: `₦${bid.amount?.toLocaleString() || '0'}`,
            deliveryTime: bid.delivery_time || 'Not specified',
            submittedDate: formatDate(bid.created_at),
            proposal: bid.description || 'No proposal provided',
            status: bid.status || 'pending'
          };
        })
      );
      
      setBids(transformedBids);
    } catch (error) {
      console.error('Error fetching bids:', error);
      setBids([]);
    } finally {
      setLoadingBids(false);
    }
  };

  const fetchClientData = async () => {
    if (!gig?.id) return;
    
    try {
      setLoadingClient(true);
      // Get the gig data which should include buyer information
      const gigData = await api.gigs.getGigById(gig.id.toString());
      
      if (gigData && gigData.buyer_id) {
        // Fetch buyer profile data
        const { supabase } = await import('../../lib/supabase');
        const { data: buyerProfile } = await supabase
          .from('Profiles')
          .select('*')
          .eq('id', gigData.buyer_id)
          .single();
        
        if (buyerProfile) {
          // Get buyer rating
          let buyerRating = 0;
          let projectsPosted = 0;
          
          try {
            buyerRating = await api.feedback.getAverageRating(gigData.buyer_id);
            
            // Get projects posted count
            const buyerGigs = await api.gigs.getMyGigs(gigData.buyer_id);
            projectsPosted = buyerGigs.length;
          } catch (error) {
            console.error('Error fetching buyer data:', error);
          }
          
          setClientData({
            name: buyerProfile.name || 
                  `${buyerProfile.first_name || ''} ${buyerProfile.last_name || ''}`.trim() || 
                  'Anonymous Client',
            avatar: buyerProfile.avatar_url || buyerProfile.name?.charAt(0)?.toUpperCase() || 'C',
            rating: buyerRating,
            projectsPosted: projectsPosted
          });
        }
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
      // Set default client data if fetch fails
      setClientData({
        name: 'Client Information Unavailable',
        avatar: 'C',
        rating: 0,
        projectsPosted: 0
      });
    } finally {
      setLoadingClient(false);
    }
  };

  const fetchAdminReviewData = async () => {
    if (!gig?.id) return;
    
    try {
      // Get the gig data which should include admin review information
      const gigData = await api.gigs.getGigById(gig.id.toString());
      
      if (gigData) {
        setAdminReviewData({
          lastReviewed: gigData.updated_at || gigData.created_at,
          reviewedBy: gigData.verified_by || null,
          reviewNotes: gigData.verification_notes || null,
          status: gigData.status
        });
      }
    } catch (error) {
      console.error('Error fetching admin review data:', error);
      // Set default admin review data if fetch fails
      setAdminReviewData({
        lastReviewed: null,
        reviewedBy: null,
        reviewNotes: null,
        status: gig?.status
      });
    }
  };

  const handleFlagButtonClick = () => {
    if (gig?.is_flagged) {
      setFlagAction('unflag');
    } else {
      setFlagAction('flag');
    }
    setShowFlagModal(true);
  };

  const handleSubmitFlag = () => {
    if (!gig) return;
    if (flagAction === 'flag') {
      onFlag(gig.id);
    } else if (flagAction === 'unflag' && onUnflag) {
      onUnflag(gig.id);
    }
    setFlagReason("");
    setShowFlagModal(false);
  };
  
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const handleSubmitApprove = () => {
    if (!gig) return;
    
    // Call the review/approve handler
    onReview(gig.id);
    
    // Close modal
    setShowApproveModal(false);
  };

  const handleSubmitSuspend = () => {
    if (!gig || !suspendReason.trim()) return;
    
    // Call the suspend handler
    onSuspend(gig.id);
    
    // Reset and close modal
    setSuspendReason("");
    setShowSuspendModal(false);
  };

  const handleSubmitUnsuspend = async () => {
    if (!gig) return;
    
    try {
      await api.admin.unsuspendGig(gig.id.toString(), unsuspendNotes);
      
      // Reset and close modal
      setUnsuspendNotes("");
      setShowUnsuspendModal(false);
      
      // Optionally refresh the gig data or navigate back
      // You might want to add a callback to refresh the gig data
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error("Failed to unsuspend gig:", error);
      // You might want to show an error toast here
    }
  };

  const handleSubmitFeedback = () => {
    if (!gig || !feedback.trim()) return;
    
    // Here you would call a feedback handler
    console.log(`Sending feedback for gig ${gig.id}: ${feedback}`);
    
    // Reset and close modal
    setFeedback("");
    setShowFeedbackModal(false);
  };

  if (!gig) {
    return <div className="p-8">No gig details available</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-50 px-8 py-4">
        <button 
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{gig.title}</h1>
        
        {/* Status Indicator */}
        <div className="mb-4">
          {gig.status === "pending" && (
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Open for Bids {/* Display "Open for Bids" but backend status is still "pending" */}
            </span>
          )}
          {gig.status === "approved" && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Approved
            </span>
          )}
          {gig.status === "flagged" && (
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
              <Flag className="w-4 h-4 inline mr-1" />
              Flagged for Review
            </span>
          )}
          {gig.status === "suspended" && (
            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              <XCircle className="w-4 h-4 inline mr-1" />
              Suspended
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-6 text-gray-600">
          <div>
            <span className="text-sm">Posted: </span>
            <span className="font-medium">{gig.postedDate}</span>
          </div>
          <div>
            <span className="text-sm">Deadline: </span>
            <span className="font-medium">{formatDate(gig.deadline || gig.dueDate)}</span>
          </div>
          <div>
            <span className="text-sm">Budget: </span>
            <span className="font-medium">{gig.budget || gig.amount}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-4 px-4">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex -mb-px">
            <button 
              onClick={() => setActiveTab("details")} 
              className={`mr-8 py-4 border-b-2 ${activeTab === "details" ? "border-blue-600 font-medium text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Details
            </button>
            <button 
              onClick={() => setActiveTab("bids")} 
              className={`mr-8 py-4 border-b-2 ${activeTab === "bids" ? "border-blue-600 font-medium text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Bids ({bids.length})
            </button>
            {activeTab === "bids" && (
              <Button
                onClick={fetchBids}
                disabled={loadingBids}
                variant="outline"
                size="sm"
                className="ml-auto"
              >
                {loadingBids ? "Refreshing..." : "Refresh Bids"}
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - Content (Description or Bids) */}
          <div className="md:col-span-2">
            {activeTab === "details" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Description</h2>
                <div className="text-gray-700">
                  {gig.description ? (
                    <p>{gig.description}</p>
                  ) : (
                    <div className="text-gray-500 italic">
                      <p>No description provided for this gig.</p>
                      <p className="text-sm mt-2">The client has not added a detailed description for this project.</p>
                    </div>
                  )}
                </div>
                {/* Attachments */}
                {gig.attachments && gig.attachments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Attachments</h4>
                    <div className="space-y-2">
                      {gig.attachments.map((attachmentUrl: string, index: number) => {
                        const filename = attachmentUrl.split('/').pop()?.split('?')[0] || `attachment-${index + 1}`;
                        const urlHash = attachmentUrl.split('?')[1]?.slice(0, 6) || attachmentUrl.slice(-6);
                        const shortDisplay = `${filename}...${urlHash}`;
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{shortDisplay}</div>
                                <div className="text-sm text-gray-500">Document</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(attachmentUrl, '_blank')}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                              >
                                View
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = attachmentUrl;
                                  link.download = filename;
                                  link.click();
                                }}
                                className="text-green-600 hover:text-green-700 hover:bg-green-100"
                              >
                                Download
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === "bids" && (
              <div className="space-y-6">
                {loadingBids ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Bids...</h3>
                    <p className="text-gray-600">Please wait while we fetch the bids for this gig.</p>
                  </div>
                ) : bids.length > 0 ? (
                  bids.map((bid) => (
                    <Card key={bid.id} className="border border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700 overflow-hidden">
                            {isImageUrl(bid.avatar) ? (
                              <img 
                                src={bid.avatar} 
                                alt={bid.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to initials if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) {
                                    fallback.classList.remove('hidden');
                                  }
                                }}
                              />
                            ) : null}
                            <span className={isImageUrl(bid.avatar) ? 'hidden' : ''}>
                              {bid.avatar}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900">{bid.name}</h4>
                                <p className="text-gray-600">{bid.title}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">{bid.amount}</div>
                                <div className="text-sm text-gray-500">{bid.deliveryTime}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-1">
                                {renderStars(Math.floor(bid.rating))}
                                <span className="text-sm text-gray-600 ml-1">{bid.rating.toFixed(1)}</span>
                              </div>
                              <span className="text-sm text-gray-600">{bid.completedJobs} jobs completed</span>
                              <span className="text-sm text-gray-500">Submitted: {bid.submittedDate}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">Proposal</h5>
                          <p className="text-gray-600">{bid.proposal}</p>
                        </div>
                        
                        <div className="flex justify-end gap-3">
                          {bid.status === "pending" && (
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                              <AlertTriangle className="w-4 h-4 inline mr-1" />
                              Open {/* Display "Open" for pending bid status */}
                            </span>
                          )}
                          {bid.status === "accepted" && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                              <CheckCircle className="w-4 h-4 inline mr-1" />
                              Accepted
                            </span>
                          )}
                          {bid.status === "rejected" && (
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                              <XCircle className="w-4 h-4 inline mr-1" />
                              Rejected
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Bids Yet</h3>
                    <p className="text-gray-600">This gig hasn't received any bids yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Right Column - Client Info & Actions */}
          <div>
            {/* Client Info Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-4 overflow-hidden">
                  {loadingClient ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                  ) : clientData?.avatar && isImageUrl(clientData.avatar) ? (
                    <img 
                      src={clientData.avatar} 
                      alt={clientData.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.classList.remove('hidden');
                        }
                      }}
                    />
                  ) : null}
                  <span className={clientData?.avatar && isImageUrl(clientData.avatar) ? 'hidden' : 'text-gray-600 font-medium'}>
                    {clientData?.avatar || 'C'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">
                    {loadingClient ? 'Loading...' : clientData?.name || 'Client Information Unavailable'}
                  </h3>
                  <div className="flex items-center text-amber-500">
                    {loadingClient ? (
                      <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
                    ) : (
                      <>
                        <Star className="w-4 h-4 fill-current" />
                        <span className="ml-1 text-sm font-medium">{clientData?.rating?.toFixed(1) || '0.0'}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          {clientData?.projectsPosted || 0} project{clientData?.projectsPosted !== 1 ? 's' : ''} posted
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Admin Actions */}
            <div className="flex flex-col gap-3 mb-6">
              <Button 
                onClick={() => setShowApproveModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white w-full py-6"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Gig
              </Button>
              
              <Button 
                onClick={handleFlagButtonClick}
                variant="outline"
                className={gig.is_flagged ? "border-green-500 text-green-600 hover:bg-green-50 w-full" : "border-yellow-500 text-yellow-600 hover:bg-yellow-50 w-full"}
              >
                <Flag className={gig.is_flagged ? "w-4 h-4 mr-2 text-green-600" : "w-4 h-4 mr-2 text-yellow-600"} />
                {gig.is_flagged ? 'Unflag' : 'Flag for Review'}
              </Button>
              
              <Button 
                onClick={() => setShowFeedbackModal(true)}
                variant="outline"
                className="border-blue-500 text-blue-600 hover:bg-blue-50 w-full"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Feedback
              </Button>
              
              {gig.status === 'suspended' ? (
                <Button 
                  onClick={() => setShowUnsuspendModal(true)}
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-50 w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Unsuspend Gig
                </Button>
              ) : (
                <Button 
                  onClick={() => setShowSuspendModal(true)}
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50 w-full"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Suspend Gig
                </Button>
              )}
            </div>
            
            {/* Admin Info */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Admin Notes</h4>
              <div className="space-y-2 text-xs text-blue-700">
                <p>
                  <span className="font-medium">Status:</span> {adminReviewData?.status || gig.status}
                </p>
                <p>
                  <span className="font-medium">Last reviewed:</span> {
                    adminReviewData?.lastReviewed 
                      ? formatDate(adminReviewData.lastReviewed) 
                      : 'Not reviewed yet'
                  }
                </p>
                {adminReviewData?.reviewedBy && (
                  <p>
                    <span className="font-medium">Reviewed by:</span> {adminReviewData.reviewedBy}
                  </p>
                )}
                {adminReviewData?.reviewNotes && (
                  <p>
                    <span className="font-medium">Notes:</span> {adminReviewData.reviewNotes}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flag Modal */}
      <Dialog open={showFlagModal} onOpenChange={setShowFlagModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{flagAction === 'flag' ? 'Flag Gig for Review' : 'Unflag Gig'}</DialogTitle>
            <DialogDescription>
              {flagAction === 'flag'
                ? 'Please provide a reason for flagging this gig.'
                : 'Are you sure you want to unflag this gig?'}
            </DialogDescription>
          </DialogHeader>
          
          {flagAction === 'flag' && (
            <div className="mt-4">
              <Label htmlFor="flag-reason">Reason</Label>
              <Textarea 
                id="flag-reason"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Enter reason for flagging..."
                className="mt-2"
              />
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowFlagModal(false)}>Cancel</Button>
            <Button onClick={handleSubmitFlag}>{flagAction === 'flag' ? 'Submit' : 'Unflag'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Gig</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this gig? This will make it visible to all users.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowApproveModal(false)}>Cancel</Button>
            <Button onClick={handleSubmitApprove} className="bg-green-600 hover:bg-green-700">Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Suspend Modal */}
      <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Gig</DialogTitle>
            <DialogDescription>
              Please provide a reason for suspending this gig. This will hide it from all users.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Label htmlFor="suspend-reason">Reason</Label>
            <Textarea 
              id="suspend-reason"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Enter reason for suspension..."
              className="mt-2"
            />
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowSuspendModal(false)}>Cancel</Button>
            <Button onClick={handleSubmitSuspend} className="bg-red-600 hover:bg-red-700 text-white">Suspend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Unsuspend Modal */}
      <Dialog open={showUnsuspendModal} onOpenChange={setShowUnsuspendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsuspend Gig</DialogTitle>
            <DialogDescription>
              Are you sure you want to unsuspend this gig? This will restore it to pending status and make it visible to users again.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Label htmlFor="unsuspend-notes">Admin Notes (Optional)</Label>
            <Textarea 
              id="unsuspend-notes"
              value={unsuspendNotes}
              onChange={(e) => setUnsuspendNotes(e.target.value)}
              placeholder="Enter notes about why this gig is being unsuspended..."
              className="mt-2"
            />
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowUnsuspendModal(false)}>Cancel</Button>
            <Button onClick={handleSubmitUnsuspend} className="bg-green-600 hover:bg-green-700 text-white">Unsuspend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Feedback Modal */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              Send feedback to the gig creator. This is useful for minor issues that don't warrant suspension.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea 
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter your feedback..."
              className="mt-2"
            />
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowFeedbackModal(false)}>Cancel</Button>
            <Button onClick={handleSubmitFeedback} className="bg-blue-600 hover:bg-blue-700 text-white">Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
