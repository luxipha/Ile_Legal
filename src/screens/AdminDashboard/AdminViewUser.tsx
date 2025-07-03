import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { ArrowLeft, Mail, Eye, CheckCircle, XCircle, Phone, MapPin, GraduationCap, Briefcase, FileText, Shield, Award, User } from "lucide-react";
import { User as AuthUser } from "../../contexts/AuthContext";
import { api } from "../../services/api";

type Document = {
  name: string;
  status: "verified" | "pending" | "rejected";
  type?: "government_id" | "selfie_with_id" | "bar_license" | "professional_certificate" | "other";
  uploadDate?: string;
  size?: string;
  url?: string;
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
  onVerify: (userId: string) => void;
  onReject: (userId: string, reason: string) => void;
  onRequestInfo: (userId: string, request: string) => void;
};

export const AdminViewUser = ({
  user,
  onBack,
  onVerify,
  onReject,
  onRequestInfo
}: AdminViewUserProps): JSX.Element => {
  console.log('user', user);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [infoRequest, setInfoRequest] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentVerificationNotes, setDocumentVerificationNotes] = useState("");
  const [localUser, setLocalUser] = useState<User | null>(user);
  const [isVerifying, setIsVerifying] = useState(false);

  // Update local user state when prop changes
  useEffect(() => {
    if (user) {
      setLocalUser(user);
    }
  }, [user]);

  // Fetch real documents from storage
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!localUser?.id) return;
      
      setLoadingDocuments(true);
      try {
        const userDocuments = await api.admin.users.getUserDocuments(localUser.id);
        
        // Transform the API response to match our Document type
        const transformedDocuments: Document[] = userDocuments.map((doc: any) => ({
          name: doc.name,
          status: "pending", // Default status since API doesn't provide verification status
          type: doc.type as any,
          uploadDate: doc.created_at,
          size: "Unknown", // API doesn't provide file size
          url: doc.url // Add URL for viewing
        }));
        
        setDocuments(transformedDocuments);
      } catch (error) {
        console.error('Error fetching user documents:', error);
        setDocuments([]);
      } finally {
        setLoadingDocuments(false);
      }
    };

    fetchDocuments();
  }, [localUser?.id]);

  // Get documents with proper ordering
  const getUserDocuments = (): Document[] => {
    if (loadingDocuments) {
      return [];
    }
    
    // Sort documents to prioritize specific types
    const sortedDocuments = [...documents].sort((a, b) => {
      const priorityOrder = ['government_id', 'selfie_with_id', 'bar_license_certificate'];
      const aIndex = priorityOrder.indexOf(a.name.toLowerCase().replace(/\s+/g, '_'));
      const bIndex = priorityOrder.indexOf(b.name.toLowerCase().replace(/\s+/g, '_'));
      
      // If both are in priority list, sort by priority
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only one is in priority list, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      // Otherwise, sort alphabetically
      return a.name.localeCompare(b.name);
    });
    
    return sortedDocuments;
  };

  const handleSubmitRejection = async () => {
    if (!localUser || !rejectionReason.trim()) return;
    
    try {
      // Call the reject handler
      await onReject(localUser.id, rejectionReason);
      
      // Update local state to reflect the rejection
      setLocalUser(prev => prev ? {
        ...prev,
        status: 'rejected',
        user_metadata: {
          ...prev.user_metadata,
          verification_status: 'rejected'
        }
      } : null);
      
      // Reset and close modal
      setRejectionReason("");
      setShowRejectModal(false);
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };

  const handleSubmitInfoRequest = () => {
    if (!localUser || !infoRequest.trim()) return;
    
    // Call the request info handler
    onRequestInfo(localUser.id, infoRequest);
    
    // Reset and close modal
    setInfoRequest("");
    setShowRequestInfoModal(false);
  };

  const handleVerifyUser = async () => {
    if (!localUser) return;
    
    setIsVerifying(true);
    try {
      // Call the verify handler
      await onVerify(localUser.id);
      
      // Update local state to reflect the verification
      setLocalUser(prev => prev ? {
        ...prev,
        status: 'verified',
        user_metadata: {
          ...prev.user_metadata,
          verification_status: 'verified'
        }
      } : null);
    } catch (error) {
      console.error('Error verifying user:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!localUser) {
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
                  {localUser.avatar_url ? (
                    <img src={localUser.avatar_url} alt={localUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-semibold">
                      {localUser.user_metadata?.firstName && localUser.user_metadata?.lastName 
                        ? `${localUser.user_metadata.firstName} ${localUser.user_metadata.lastName}` 
                        : localUser.name}
                    </h2>
                    {(localUser.status?.toLowerCase() === "verified" || localUser.user_metadata?.verification_status === "verified") ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (localUser.status?.toLowerCase() === "rejected" || localUser.user_metadata?.status === "rejected") ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Pending</span>
                    )}
                  </div>
                  <p className="text-blue-600 font-medium mb-1">
                    {localUser.user_metadata?.title || localUser.user_metadata?.role_title || "Legal Professional"}
                  </p>
                  <p className="text-gray-600 mb-4">Joined {localUser.joinedDate || localUser.submittedDate || 'Recently'}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{localUser.email}</span>
                    </div>
                    {localUser.user_metadata?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{localUser.user_metadata.phone}</span>
                      </div>
                    )}
                    {localUser.user_metadata?.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{localUser.user_metadata.address}</span>
                      </div>
                    )}
                    {localUser.role && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="text-sm capitalize">{localUser.role}</span>
                      </div>
                    )}
                  </div>
                  
                  {localUser.user_metadata?.about && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Bio/About</h4>
                      <p className="text-sm text-gray-600">{localUser.user_metadata.about}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 🎓 Education & Experience Section */}
            {localUser.user_metadata?.education && localUser.user_metadata.education.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Education & Experience</h3>
                </div>
                <div className="space-y-4">
                  {localUser.user_metadata.education.map((edu, index) => (
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
                {localUser.specializations && localUser.specializations.length > 0 ? (
                  localUser.specializations.map((spec, index) => (
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
                {localUser.government_id_type && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">
                      <span className="font-medium">ID Type:</span> {localUser.government_id_type}
                    </span>
                  </div>
                )}
                {localUser.bar_license_number && (
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">
                      <span className="font-medium">Bar License:</span> {localUser.bar_license_number}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {loadingDocuments ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Loading documents...</p>
                  </div>
                ) : (() => {
                  const documents = getUserDocuments();
                  return documents.length > 0 ? (
                    documents.map((doc, index) => {
                    const getDocumentIcon = (type?: string) => {
                      switch (type) {
                        case 'government_id':
                          return <FileText className="w-5 h-5 text-blue-500" />;
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

                    // Determine document type based on filename for better icon display
                    const getDocumentType = (filename: string) => {
                      const lowerName = filename.toLowerCase();
                      if (lowerName.includes('government_id') || lowerName.includes('id')) {
                        return 'government_id';
                      } else if (lowerName.includes('selfie') || lowerName.includes('photo')) {
                        return 'selfie_with_id';
                      } else if (lowerName.includes('bar_license') || lowerName.includes('license') || lowerName.includes('certificate')) {
                        return 'bar_license';
                      } else if (lowerName.includes('certificate') || lowerName.includes('professional')) {
                        return 'professional_certificate';
                      }
                      return 'other';
                    };

                    return (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                          {getDocumentIcon(getDocumentType(doc.name))}
                          <div>
                            <h4 className="font-medium text-gray-900">{doc.name}</h4>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                              {doc.uploadDate && <span>Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</span>}
                              {doc.size && doc.size !== "Unknown" && <span>Size: {doc.size}</span>}
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
                      localUser.status === 'verified' ? 'text-green-600' : 
                      localUser.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {localUser.status ? localUser.status.charAt(0).toUpperCase() + localUser.status.slice(1) : 'Pending'}
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
                {(localUser.status?.toLowerCase() !== "verified" && localUser.user_metadata?.verification_status !== "verified") && 
                 (localUser.status?.toLowerCase() !== "rejected" && localUser.user_metadata?.status !== "rejected") && (
                  <Button 
                    onClick={handleVerifyUser}
                    disabled={isVerifying}
                    className="bg-green-600 hover:bg-green-700 text-white w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isVerifying ? 'Verifying...' : 'Approve Seller'}
                  </Button>
                )}
                
                {(localUser.status?.toLowerCase() !== "rejected" && localUser.user_metadata?.status !== "rejected") && (
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
                      ((localUser.user_metadata?.firstName ? 1 : 0) +
                       (localUser.user_metadata?.title ? 1 : 0) +
                       (localUser.user_metadata?.about ? 1 : 0) +
                       (localUser.user_metadata?.specializations?.length ? 1 : 0) +
                       (localUser.user_metadata?.education?.length ? 1 : 0)) / 5 * 100
                    )}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contact Info:</span>
                  <span className={`font-medium ${localUser.phone ? 'text-green-600' : 'text-red-600'}`}>
                    {localUser.phone ? '✓ Complete' : '✗ Missing Phone'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Role:</span>
                  <span className={`font-medium ${localUser.role ? 'text-green-600' : 'text-yellow-600'}`}>
                    {localUser.role ? `✓ ${localUser.role}` : '⚠ No Role Set'}
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
                {/* Document Preview */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  {selectedDocument.url ? (
                    <div>
                      <img 
                        src={selectedDocument.url} 
                        alt={selectedDocument.name}
                        className="max-w-full max-h-64 mx-auto mb-4 rounded-lg shadow-sm"
                        onError={(e) => {
                          // Fallback to file icon if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden">
                        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-600 mb-2">Document Preview</p>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        {selectedDocument.name} • {selectedDocument.size || 'Unknown size'}
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-3"
                        onClick={() => window.open(selectedDocument.url, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Full Document
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600 mb-2">Document Preview</p>
                      <p className="text-sm text-gray-500">
                        {selectedDocument.name} • {selectedDocument.size || 'Unknown size'}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">Document URL not available</p>
                    </div>
                  )}
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
                      <p className="text-sm text-gray-900">
                        {new Date(selectedDocument.uploadDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
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
              Please provide a reason for rejecting {localUser.name}'s verification request.
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
              Specify what additional information you need from {localUser.name}.
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
