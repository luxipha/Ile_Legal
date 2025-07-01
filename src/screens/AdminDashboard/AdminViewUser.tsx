import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { ArrowLeft, Mail, Eye, CheckCircle, XCircle, Phone, MapPin, GraduationCap, Briefcase, FileText, Shield, Award, User } from "lucide-react";
import { User as AuthUser } from "../../contexts/AuthContext";

type Document = {
  name: string;
  status: "verified" | "pending" | "rejected";
  type?: "government_id" | "selfie_with_id" | "bar_license" | "professional_certificate" | "other";
  uploadDate?: string;
  size?: string;
};

type Education = {
  degree: string;
  institution: string;
  period: string;
  year?: string;
};

type User = AuthUser & {
  // Add mock/placeholder properties for documents since they might not be in AuthUser
  documents?: Document[];
  submittedDate?: string;
  joinedDate?: string;
  type?: "Property Law" | "Contract Law" | "Business Law";
  // Map from user_metadata for compatibility
  first_name?: string;
  last_name?: string;
  professional_title?: string;
  bio?: string;
  linkedin?: string;
  education?: Education[];
  verification_status?: string;
  bar_license_number?: string;
  government_id_type?: string;
  years_experience?: number;
  avatar_url?: string;
  phone?: string;
  location?: string;
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
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentVerificationNotes, setDocumentVerificationNotes] = useState("");

  // Generate mock documents for demonstration if none exist
  const getUserDocuments = (): Document[] => {
    if (user.documents && user.documents.length > 0) {
      return user.documents;
    }
    // Return mock documents to show UI structure
    return [
      {
        name: "Government ID",
        status: "pending",
        type: "government_id",
        uploadDate: "2024-01-15",
        size: "2.1 MB"
      },
      {
        name: "Selfie with ID",
        status: "pending", 
        type: "selfie_with_id",
        uploadDate: "2024-01-15",
        size: "1.8 MB"
      },
      {
        name: "Bar License Certificate",
        status: "pending",
        type: "bar_license",
        uploadDate: "2024-01-16",
        size: "3.2 MB"
      }
    ];
  };

  const handleSubmitRejection = () => {
    if (!user || !rejectionReason.trim()) return;
    
    // Call the reject handler
    onReject(parseInt(user.id) || 0, rejectionReason);
    
    // Reset and close modal
    setRejectionReason("");
    setShowRejectModal(false);
  };

  const handleSubmitInfoRequest = () => {
    if (!user || !infoRequest.trim()) return;
    
    // Call the request info handler
    onRequestInfo(parseInt(user.id) || 0, infoRequest);
    
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
            {/* 📋 Basic Information Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-semibold">
                      {user.user_metadata?.firstName && user.user_metadata?.lastName 
                        ? `${user.user_metadata.firstName} ${user.user_metadata.lastName}` 
                        : user.name}
                    </h2>
                    {(user.status?.toLowerCase() === "verified" || user.user_metadata?.verification_status === "verified") ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (user.status?.toLowerCase() === "rejected" || user.user_metadata?.status === "rejected") ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Pending</span>
                    )}
                  </div>
                  <p className="text-blue-600 font-medium mb-1">
                    {user.user_metadata?.title || user.user_metadata?.role_title || "Legal Professional"}
                  </p>
                  <p className="text-gray-600 mb-4">Joined {user.joinedDate || user.submittedDate || 'Recently'}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                    {user.user_metadata?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{user.user_metadata.phone}</span>
                      </div>
                    )}
                    {user.user_metadata?.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{user.user_metadata.address}</span>
                      </div>
                    )}
                    {user.role && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="text-sm capitalize">{user.role}</span>
                      </div>
                    )}
                  </div>
                  
                  {user.user_metadata?.about && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Bio/About</h4>
                      <p className="text-sm text-gray-600">{user.user_metadata.about}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 🎓 Education & Experience Section */}
            {user.user_metadata?.education && user.user_metadata.education.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Education & Experience</h3>
                </div>
                <div className="space-y-4">
                  {user.user_metadata.education.map((edu, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <GraduationCap className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                        <p className="text-gray-600">{edu.institution}</p>
                        <p className="text-sm text-gray-500">{edu.period}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specializations */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Specializations</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.user_metadata?.specializations && user.user_metadata.specializations.length > 0 ? (
                  user.user_metadata.specializations.map((spec, index) => (
                    <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                      {spec}
                    </span>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No specializations specified</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* 📄 Uploaded Documents Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold">Uploaded Documents</h3>
              </div>
              
              {/* Verification Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
                {user.government_id_type && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">
                      <span className="font-medium">ID Type:</span> {user.government_id_type}
                    </span>
                  </div>
                )}
                {user.bar_license_number && (
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">
                      <span className="font-medium">Bar License:</span> {user.bar_license_number}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {(() => {
                  const documents = getUserDocuments();
                  return documents.length > 0 ? (
                    documents.map((doc, index) => {
                    const getDocumentIcon = (type?: string) => {
                      switch (type) {
                        case 'government_id':
                          return <Shield className="w-5 h-5 text-blue-500" />;
                        case 'selfie_with_id':
                          return <User className="w-5 h-5 text-green-500" />;
                        case 'bar_license':
                          return <Award className="w-5 h-5 text-purple-500" />;
                        case 'professional_certificate':
                          return <GraduationCap className="w-5 h-5 text-orange-500" />;
                        default:
                          return <FileText className="w-5 h-5 text-gray-400" />;
                      }
                    };

                    const getStatusBadge = (status: string) => {
                      switch (status) {
                        case 'verified':
                          return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">✓ Verified</span>;
                        case 'rejected':
                          return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">✗ Rejected</span>;
                        default:
                          return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">⏳ Pending</span>;
                      }
                    };

                    return (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                          {getDocumentIcon(doc.type)}
                          <div>
                            <h4 className="font-medium text-gray-900">{doc.name}</h4>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                              {doc.uploadDate && <span>Uploaded: {doc.uploadDate}</span>}
                              {doc.size && <span>Size: {doc.size}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(doc.status)}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShowDocumentModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No documents submitted yet</p>
                    <p className="text-sm">User hasn't uploaded verification documents</p>
                  </div>
                );
                })()}
              </div>
            </div>
          </div>
          
          {/* Right Column - Actions */}
          <div>
            {/* 🔧 Admin Actions Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold">Admin Actions</h3>
              </div>
              
              {/* Quick Status Overview */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Verification Status:</span>
                    <span className={`font-medium ${
                      user.status === 'verified' ? 'text-green-600' : 
                      user.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Documents:</span>
                    <span className="font-medium">
                      {getUserDocuments().filter(d => d.status === 'verified').length}/
                      {getUserDocuments().length} verified
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* Individual Document Verification */}
                {(() => {
                  const documents = getUserDocuments();
                  return documents.some(d => d.status === 'pending') && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Verify Individual Documents</h4>
                      <div className="space-y-2">
                        {documents.filter(d => d.status === 'pending').map((doc, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedDocument(doc);
                            setShowDocumentModal(true);
                          }}
                        >
                          <CheckCircle className="w-3 h-3 mr-2" />
                          Verify {doc.name}
                        </Button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Main Actions */}
                {(user.status?.toLowerCase() !== "verified" && user.user_metadata?.verification_status !== "verified") && 
                 (user.status?.toLowerCase() !== "rejected" && user.user_metadata?.status !== "rejected") && (
                  <Button 
                    onClick={() => onVerify(parseInt(user.id) || 0)}
                    className="bg-green-600 hover:bg-green-700 text-white w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Seller
                  </Button>
                )}
                
                {(user.status?.toLowerCase() !== "rejected" && user.user_metadata?.status !== "rejected") && (
                  <Button 
                    onClick={() => setShowRejectModal(true)}
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50 w-full"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject with Reason
                  </Button>
                )}
                
                <Button 
                  onClick={() => setShowRequestInfoModal(true)}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Request More Info
                </Button>
              </div>
            </div>

            {/* Verification Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Verification Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Profile Completeness:</span>
                  <span className="font-medium">
                    {Math.round(
                      ((user.user_metadata?.firstName ? 1 : 0) +
                       (user.user_metadata?.title ? 1 : 0) +
                       (user.user_metadata?.about ? 1 : 0) +
                       (user.user_metadata?.specializations?.length ? 1 : 0) +
                       (user.user_metadata?.education?.length ? 1 : 0)) / 5 * 100
                    )}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contact Info:</span>
                  <span className={`font-medium ${user.user_metadata?.phone ? 'text-green-600' : 'text-red-600'}`}>
                    {user.user_metadata?.phone ? '✓ Complete' : '✗ Missing Phone'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Role:</span>
                  <span className={`font-medium ${user.role ? 'text-green-600' : 'text-yellow-600'}`}>
                    {user.role ? `✓ ${user.role}` : '⚠ No Role Set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Document Upload:</span>
                  <span className={`font-medium ${getUserDocuments().length ? 'text-green-600' : 'text-red-600'}`}>
                    {getUserDocuments().length ? `✓ ${getUserDocuments().length} files` : '✗ No uploads'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Verification Modal */}
      <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document Verification</DialogTitle>
            <DialogDescription>
              Review and verify the submitted document: {selectedDocument?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDocument && (
              <>
                {/* Document Preview Placeholder */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-2">Document Preview</p>
                  <p className="text-sm text-gray-500">
                    {selectedDocument.name} • {selectedDocument.size || 'Unknown size'}
                  </p>
                  <Button variant="outline" className="mt-3">
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Document
                  </Button>
                </div>

                {/* Document Details */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Document Type</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedDocument.type?.replace('_', ' ') || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Current Status</label>
                    <p className={`text-sm font-medium ${
                      selectedDocument.status === 'verified' ? 'text-green-600' :
                      selectedDocument.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {selectedDocument.status.charAt(0).toUpperCase() + selectedDocument.status.slice(1)}
                    </p>
                  </div>
                  {selectedDocument.uploadDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Upload Date</label>
                      <p className="text-sm text-gray-900">{selectedDocument.uploadDate}</p>
                    </div>
                  )}
                </div>

                {/* Verification Notes */}
                <div>
                  <Label htmlFor="verification-notes">Verification Notes (Optional)</Label>
                  <Textarea
                    id="verification-notes"
                    placeholder="Add notes about this document verification..."
                    value={documentVerificationNotes}
                    onChange={(e) => setDocumentVerificationNotes(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDocumentModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
              onClick={() => {
                // Handle document rejection
                console.log('Reject document:', selectedDocument?.name);
                setShowDocumentModal(false);
              }}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Document
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                // Handle document verification
                console.log('Verify document:', selectedDocument?.name);
                setShowDocumentModal(false);
              }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Verify Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
