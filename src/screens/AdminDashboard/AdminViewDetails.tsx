import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";
import { ArrowLeft, Flag, Star, CheckCircle, AlertTriangle, MessageSquare, XCircle, User } from "lucide-react";

type Bid = {
  id: number;
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
};

type AdminViewDetailsProps = {
  gig: Gig | null;
  onBack: () => void;
  onFlag: (gigId: number) => void;
  onReview: (gigId: number) => void;
  onSuspend: (gigId: number) => void;
};

export const AdminViewDetails = ({
  gig,
  onBack,
  onFlag,
  onReview,
  onSuspend
}: AdminViewDetailsProps): JSX.Element => {
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "bids">("details");
  
  // Sample bids data - in a real app, this would come from the gig object or API
  const bids: Bid[] = gig?.bids || [
    {
      id: 1,
      name: "Chioma Okonkwo",
      title: "Property Lawyer",
      rating: 4.9,
      completedJobs: 24,
      amount: "₦65,000",
      deliveryTime: "5 days",
      submittedDate: "21/04/2025",
      proposal: "I have over 10 years of experience in title verification in Lagos State, particularly in Victoria Island. I have established connections with the land registry and can complete this task efficiently and accurately.",
      avatar: "CO",
      status: "pending"
    },
    {
      id: 2,
      name: "Adebayo Ogundimu",
      title: "Senior Legal Counsel",
      rating: 4.8,
      completedJobs: 18,
      amount: "₦72,000",
      deliveryTime: "4 days",
      submittedDate: "22/04/2025",
      proposal: "With my background in commercial property law and extensive experience with the Lagos State Land Registry, I can provide a comprehensive verification report that covers all legal aspects of the property.",
      avatar: "AO",
      status: "pending"
    }
  ];

  const handleSubmitFlag = () => {
    if (!gig || !flagReason.trim()) return;
    
    // Call the flag handler
    onFlag(gig.id);
    
    // Reset and close modal
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
              Pending Review
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
            <span className="font-medium">{gig.deadline || gig.dueDate}</span>
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
                    <>
                      <p className="mb-4">We are seeking a qualified legal professional to conduct a comprehensive title verification for a property located in Victoria Island, Lagos.</p>
                      
                      <p className="mb-2">The verification should include:</p>
                      <ol className="list-decimal pl-5 mb-4 space-y-1">
                        <li>Confirmation of ownership history</li>
                        <li>Verification of all relevant documentation</li>
                        <li>Checks for any encumbrances or liens</li>
                        <li>Validation with the local land registry</li>
                        <li>Preparation of a detailed report on findings</li>
                      </ol>
                      
                      <p>The property is a 1,000 sqm commercial plot with existing development. All necessary documents will be provided upon assignment.</p>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === "bids" && (
              <div className="space-y-6">
                {bids.length > 0 ? (
                  bids.map((bid) => (
                    <Card key={bid.id} className="border border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                            {bid.avatar}
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
                                <span className="text-sm text-gray-600 ml-1">{bid.rating}</span>
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
                              Pending
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
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">{gig.client || "Lagos Properties Ltd."}</h3>
                  <div className="flex items-center text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="ml-1 text-sm font-medium">4.8</span>
                    <span className="ml-2 text-xs text-gray-500">15 project posted</span>
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
                onClick={() => setShowFlagModal(true)}
                variant="outline"
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 w-full"
              >
                <Flag className="w-4 h-4 mr-2" />
                Flag for Review
              </Button>
              
              <Button 
                onClick={() => setShowFeedbackModal(true)}
                variant="outline"
                className="border-blue-500 text-blue-600 hover:bg-blue-50 w-full"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Feedback
              </Button>
              
              <Button 
                onClick={() => setShowSuspendModal(true)}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50 w-full"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Suspend Gig
              </Button>
            </div>
            
            {/* Admin Info */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Admin Notes</h4>
              <p className="text-xs text-blue-700">Last reviewed: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Flag Modal */}
      <Dialog open={showFlagModal} onOpenChange={setShowFlagModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Gig for Review</DialogTitle>
            <DialogDescription>
              Please provide a reason for flagging this gig.
            </DialogDescription>
          </DialogHeader>
          
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
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowFlagModal(false)}>Cancel</Button>
            <Button onClick={handleSubmitFlag}>Submit</Button>
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
