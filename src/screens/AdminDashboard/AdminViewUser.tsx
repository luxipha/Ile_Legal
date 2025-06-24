import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { ArrowLeft, Mail, Eye, CheckCircle, XCircle } from "lucide-react";

type Document = {
  name: string;
  status: "Verified" | "Pending" | "Rejected";
};

type User = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  type: string;
  status: "Pending" | "Verified" | "Rejected";
  submittedDate: string;
  joinedDate?: string;
  documents: Document[];
  specializations?: string[];
};

type AdminViewUserProps = {
  user: User | null;
  onBack: () => void;
  onVerify: (userId: number) => void;
  onReject: (userId: number, reason: string) => void;
  onRequestInfo: (userId: number, request: string) => void;
};

export const AdminViewUser = ({
  user,
  onBack,
  onVerify,
  onReject,
  onRequestInfo
}: AdminViewUserProps): JSX.Element => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [infoRequest, setInfoRequest] = useState("");

  const handleSubmitRejection = () => {
    if (!user || !rejectionReason.trim()) return;
    
    // Call the reject handler
    onReject(user.id, rejectionReason);
    
    // Reset and close modal
    setRejectionReason("");
    setShowRejectModal(false);
  };

  const handleSubmitInfoRequest = () => {
    if (!user || !infoRequest.trim()) return;
    
    // Call the request info handler
    onRequestInfo(user.id, infoRequest);
    
    // Reset and close modal
    setInfoRequest("");
    setShowRequestInfoModal(false);
  };

  if (!user) {
    return <div className="p-8">No user details available</div>;
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gray-50 px-8 py-4 border-b border-gray-200">
        <button 
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </button>
        <h1 className="text-2xl font-bold mt-4">User Details</h1>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - User Info */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-semibold">{user.name}</h2>
                    {user.status.toLowerCase() === "verified" ? (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Pending</span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">Legal Professional • Joined {user.joinedDate || user.submittedDate}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.location && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{user.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Specializations */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {user.specializations ? (
                  user.specializations.map((spec, index) => (
                    <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                      {spec}
                    </span>
                  ))
                ) : (
                  <>
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                      Property Law
                    </span>
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                      Contract Review
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {/* Submitted Documents */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Submitted Documents</h3>
              <div className="space-y-4">
                {user.documents && user.documents.length > 0 ? (
                  user.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{doc.name}</span>
                      </div>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No documents submitted yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Column - Actions */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Actions</h3>
              <div className="flex flex-col gap-3">
                {user.status.toLowerCase() !== "verified" && (
                  <>
                    <Button 
                      onClick={() => onVerify(user.id)}
                      className="bg-green-600 hover:bg-green-700 text-white w-full"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify User
                    </Button>
                    
                    <Button 
                      onClick={() => setShowRejectModal(true)}
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50 w-full"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject User
                    </Button>
                    
                    <Button 
                      onClick={() => setShowRequestInfoModal(true)}
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Request More Info
                    </Button>
                  </>
                )}
                
                <Button 
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full"
                >
                  View Activity Log
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User Verification</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {user.name}'s verification request.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rejection-reason">Reason for Rejection</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide detailed reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white" 
              onClick={handleSubmitRejection}
              disabled={!rejectionReason.trim()}
            >
              Submit Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request More Info Modal */}
      <Dialog open={showRequestInfoModal} onOpenChange={setShowRequestInfoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request More Information</DialogTitle>
            <DialogDescription>
              Specify what additional information you need from {user.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="info-request">Information Request</Label>
              <Textarea
                id="info-request"
                placeholder="Please specify what additional documents or information you need..."
                value={infoRequest}
                onChange={(e) => setInfoRequest(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestInfoModal(false)}>Cancel</Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={handleSubmitInfoRequest}
              disabled={!infoRequest.trim()}
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
