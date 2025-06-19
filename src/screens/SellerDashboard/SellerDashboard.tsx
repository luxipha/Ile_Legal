import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { ViewDetails } from "../../components/ViewDetails";
import { Header } from "../../components/Header/Header";
import { SellerSidebar } from "../../components/SellerSidebar/SellerSidebar";
import { api } from "../../services/api";
import { 
  GavelIcon, 
  BriefcaseIcon, 
  CheckCircleIcon, 
  MessageSquareIcon,
  DollarSignIcon,
  UserIcon,
  SearchIcon,
  ArrowLeftIcon,
  UploadIcon,
  FileTextIcon
} from "lucide-react";

type ViewMode = "dashboard" | "place-bid" | "view-details" | "submit-work" | "edit-bid";

interface Gig {
  id: string;
  title: string;
  company: string;
  price: string;
  deadline: string;
  postedDate: string;
  budget: string;
  deliveryTime: string;
  description: string;
  requirements: string[];
  companyRating: number;
  projectsPosted: number;
  is_flagged: boolean;
  status?: string;
}

interface OngoingGig {
  id: string;
  title: string;
  company: string;
  price: string;
  dueDate: string;
  progress: number;
  description: string;
}

export const SellerDashboard = (): JSX.Element => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [selectedOngoingGig, setSelectedOngoingGig] = useState<OngoingGig | null>(null);
  const [bidFormData, setBidFormData] = useState({
    bidAmount: "",
    deliveryTime: "",
    proposal: ""
  });


  const [submitWorkData, setSubmitWorkData] = useState({
    description: "",
    files: [] as File[]
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockchainHashes, setBlockchainHashes] = useState<Array<{
    fileName: string;
    hash: string;
    txId?: string;
  }>>([]);
  const [showBlockchainUpload, setShowBlockchainUpload] = useState(false);

  const availableGigs: Gig[] = [
    {
      id: "1",
      title: "Land Title Verification - Victoria Island Property",
      company: "Lagos Properties Ltd.",
      price: "₦65,000",
      deadline: "16/05/2025",
      postedDate: "Apr 24, 2024",
      budget: "₦65,000",
      deliveryTime: "e.g, 5 days",
      description: "We are seeking a qualified legal professional to conduct a comprehensive title verification for a property located in Victoria Island, Lagos.",
      requirements: [
        "Confirmation of ownership history",
        "Verification of all relevant documentation", 
        "Checks for any encumbrances or liens",
        "Validation with the local land registry",
        "Preparation of a detailed report on findings"
      ],
      companyRating: 4.8,
      projectsPosted: 15,
      is_flagged: false,
      status: "active"
    },
    {
      id: "2",
      title: "Contract Review for Commercial Lease",
      company: "Commercial Realty",
      price: "₦45,000",
      deadline: "10/05/2025",
      postedDate: "Apr 25, 2024",
      budget: "₦45,000",
      deliveryTime: "e.g, 3 days",
      description: "Review and analysis of commercial lease agreement for office space. Need expert legal opinion on terms and conditions.",
      requirements: [
        "Thorough review of lease terms",
        "Risk assessment",
        "Recommendations for amendments",
        "Legal compliance check"
      ],
      companyRating: 4.6,
      projectsPosted: 8,
      is_flagged: false,
      status: "active"
    }
  ];

  const ongoingGigs: OngoingGig[] = [
    {
      id: "1",
      title: "Due Diligence on Residential Development",
      company: "Evergreen Estates",
      price: "₦90,000",
      dueDate: "18/05/2025",
      progress: 40,
      description: "Complete due diligence investigation for a 50-unit residential complex including title verification, compliance checks, and risk assessment."
    }
  ];

  const handleViewDetails = (gig: Gig) => {
    setSelectedGig(gig);
    setViewMode("view-details");
  };

  const handlePlaceBid = (gig?: Gig) => {
    if (gig) {
      setSelectedGig(gig);
    }
    setViewMode("place-bid");
  };


  const handleEditBid = () => {
    // Navigate to ActiveBids with state to indicate we want to edit a specific bid
    navigate('/active-bids', { 
      state: { 
        viewMode: 'edit-bid',
        bidId: 1, // Using a placeholder ID for the active bid
        bidData: {
          id: 1,
          title: "Property Survey - Lekki Phase 1",
          client: "Prestige Homes",
          bidAmount: "₦75,000",
          deliveryTime: "7 days",
          dueDate: "10/06/2025",
          status: "active",
          proposal: "I'll provide a comprehensive property survey including boundary markers, topographical analysis, and legal documentation review.",
          originalBudget: "₦80,000",
          previousBid: "₦75,000"
        }
      }
    });
  };

  const handleSubmitWork = (gig: OngoingGig) => {
    setSelectedOngoingGig(gig);
    setViewMode("submit-work");
  };

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Bid submitted:", bidFormData);
    setViewMode("dashboard");
  };

  const handleWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOngoingGig) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await api.submissions.createSubmission({
        gig_id: selectedOngoingGig.id,
        deliverables: submitWorkData.files,
        notes: submitWorkData.description,
        blockchain_hashes: blockchainHashes
      });
      
      // Reset form and go back to dashboard
      setSubmitWorkData({ description: "", files: [] });
      setBlockchainHashes([]);
      setViewMode("dashboard");
    } catch (error) {
      console.error("Error submitting work:", error);
      setSubmitError("Failed to submit work. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Add files to regular upload
      setSubmitWorkData(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles]
      }));

      // If blockchain verification is enabled, process files for hashing
      if (showBlockchainUpload) {
        for (const file of newFiles) {
          try {
            // Only hash PDF files for blockchain verification
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
              // Import hash utilities dynamically
              const { HashUtils } = await import('../../components/blockchain/shared/hashUtils');
              
              // Generate hash for the file
              const fileResult = await HashUtils.hashFile(file);
              const documentHash = HashUtils.createDocumentHash(fileResult);
              
              // Add to blockchain hashes (simulate blockchain submission)
              setBlockchainHashes(prev => [...prev, {
                fileName: file.name,
                hash: documentHash.hash,
                txId: `DEMO_TX_${Math.random().toString(36).substring(2, 15).toUpperCase()}`
              }]);
            }
          } catch (error) {
            console.error('Error processing file for blockchain:', error);
            setSubmitError(`Failed to process ${file.name} for blockchain verification`);
          }
        }
      }
    }
  };

  const removeFile = (index: number) => {
    const fileToRemove = submitWorkData.files[index];
    
    setSubmitWorkData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));

    // Also remove from blockchain hashes if it exists
    if (fileToRemove && showBlockchainUpload) {
      setBlockchainHashes(prev => 
        prev.filter(hash => hash.fileName !== fileToRemove.name)
      );
    }
  };


  const renderBackButton = () => (
    <Button
      variant="ghost"
      onClick={() => setViewMode("dashboard")}
      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
    >
      <ArrowLeftIcon className="w-4 h-4" />
      Back to Dashboard
    </Button>
  );

  if (viewMode === "place-bid" && selectedGig) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className="w-64 bg-[#1B1828] text-white flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-700">
            <Link to="/" className="flex items-center gap-3">
              <div className="text-[#FEC85F] text-2xl font-bold">Ilé</div>
              <div className="text-gray-300 text-sm">
                Legal
                <br />
                Marketplace
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <Link to="/seller-dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700 text-white">
                  <UserIcon className="w-5 h-5" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/find-gigs" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <SearchIcon className="w-5 h-5" />
                  Find Gigs
                </Link>
              </li>
              <li>
                <Link to="/active-bids" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <GavelIcon className="w-5 h-5" />
                  Active Bids
                </Link>
              </li>
              <li>
                <Link to="/seller-messages" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <MessageSquareIcon className="w-5 h-5" />
                  Messages
                </Link>
              </li>
              <li>
                <Link to="/earnings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <DollarSignIcon className="w-5 h-5" />
                  Earnings
                </Link>
              </li>
              <li>
                <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <UserIcon className="w-5 h-5" />
                  Profile
                </Link>
              </li>
            </ul>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium">Demo Seller</div>
                <div className="text-xs text-gray-400">seller@example.com</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Place Bid */}
        <div className="flex-1 flex flex-col">
          <Header title="Place a Bid" />

          {/* Place Bid Content */}
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              {renderBackButton()}

              {/* Gig Summary */}
              <Card className="bg-blue-50 border border-blue-200 mb-8">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{selectedGig.title}</h2>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <span className="text-gray-600">Budget:</span>
                      <div className="font-semibold text-gray-900">{selectedGig.budget}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Deadline:</span>
                      <div className="font-semibold text-gray-900">{selectedGig.deadline}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Delivery Time:</span>
                      <div className="font-semibold text-gray-900">{selectedGig.deliveryTime}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bid Form */}
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-8">
                  <form onSubmit={handleBidSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bid Amount (₦)
                        </label>
                        <input
                          type="number"
                          value={bidFormData.bidAmount}
                          onChange={(e) => setBidFormData(prev => ({ ...prev, bidAmount: e.target.value }))}
                          placeholder="50000"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delivery Time
                        </label>
                        <input
                          type="text"
                          value={bidFormData.deliveryTime}
                          onChange={(e) => setBidFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                          placeholder="e.g., 5 days"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proposal
                      </label>
                      <textarea
                        value={bidFormData.proposal}
                        onChange={(e) => setBidFormData(prev => ({ ...prev, proposal: e.target.value }))}
                        placeholder="Describe your experience and approach to completing this task..."
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none resize-none"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-4 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setViewMode("dashboard")}
                        className="px-8 py-3"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-8 py-3"
                      >
                        Submit Bid
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (viewMode === "view-details" && selectedGig) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className="w-64 bg-[#1B1828] text-white flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-700">
            <Link to="/" className="flex items-center gap-3">
              <div className="text-[#FEC85F] text-2xl font-bold">Ilé</div>
              <div className="text-gray-300 text-sm">
                Legal
                <br />
                Marketplace
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <Link to="/seller-dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700 text-white">
                  <UserIcon className="w-5 h-5" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/find-gigs" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <SearchIcon className="w-5 h-5" />
                  Find Gigs
                </Link>
              </li>
              <li>
                <Link to="/active-bids" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <GavelIcon className="w-5 h-5" />
                  Active Bids
                </Link>
              </li>
              <li>
                <Link to="/seller-messages" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <MessageSquareIcon className="w-5 h-5" />
                  Messages
                </Link>
              </li>
              <li>
                <Link to="/earnings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <DollarSignIcon className="w-5 h-5" />
                  Earnings
                </Link>
              </li>
              <li>
                <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <UserIcon className="w-5 h-5" />
                  Profile
                </Link>
              </li>
            </ul>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium">Demo Seller</div>
                <div className="text-xs text-gray-400">seller@example.com</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - View Details */}
        <div className="flex-1 flex flex-col">
          <Header title="Gig Details" />

          {/* View Details Content */}
          <main className="flex-1 p-6">
            <ViewDetails
              gig={selectedGig}
              onBack={() => setViewMode("dashboard")}
              onPlaceBid={handlePlaceBid}
              backButtonText="Back to Dashboard"
            />
          </main>
        </div>
      </div>
    );
  }

  if (viewMode === "submit-work" && selectedOngoingGig) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className="w-64 bg-[#1B1828] text-white flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-700">
            <Link to="/" className="flex items-center gap-3">
              <div className="text-[#FEC85F] text-2xl font-bold">Ilé</div>
              <div className="text-gray-300 text-sm">
                Legal
                <br />
                Marketplace
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <Link to="/seller-dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700 text-white">
                  <UserIcon className="w-5 h-5" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/find-gigs" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <SearchIcon className="w-5 h-5" />
                  Find Gigs
                </Link>
              </li>
              <li>
                <Link to="/active-bids" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <GavelIcon className="w-5 h-5" />
                  Active Bids
                </Link>
              </li>
              <li>
                <Link to="/seller-messages" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <MessageSquareIcon className="w-5 h-5" />
                  Messages
                </Link>
              </li>
              <li>
                <Link to="/earnings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <DollarSignIcon className="w-5 h-5" />
                  Earnings
                </Link>
              </li>
              <li>
                <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <UserIcon className="w-5 h-5" />
                  Profile
                </Link>
              </li>
            </ul>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium">Demo Seller</div>
                <div className="text-xs text-gray-400">seller@example.com</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Submit Work */}
        <div className="flex-1 flex flex-col">
          <Header title="Submit Work" />

          {/* Submit Work Content */}
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              {renderBackButton()}

              {/* Project Summary */}
              <Card className="bg-green-50 border border-green-200 mb-8">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{selectedOngoingGig.title}</h2>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <span className="text-gray-600">Client:</span>
                      <div className="font-semibold text-gray-900">{selectedOngoingGig.company}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Due Date:</span>
                      <div className="font-semibold text-gray-900">{selectedOngoingGig.dueDate}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Project Value:</span>
                      <div className="font-semibold text-gray-900">{selectedOngoingGig.price}</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Current Progress: {selectedOngoingGig.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${selectedOngoingGig.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Work Form */}
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-8">
                  {submitError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                      {submitError}
                    </div>
                  )}
                  <form onSubmit={handleWorkSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Work Description
                      </label>
                      <textarea
                        value={submitWorkData.description}
                        onChange={(e) => setSubmitWorkData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the work completed, findings, and any recommendations..."
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none resize-none"
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Upload Files
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="blockchain-verify"
                            checked={showBlockchainUpload}
                            onChange={(e) => setShowBlockchainUpload(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="blockchain-verify" className="text-sm text-gray-700">
                            🔒 Enable Blockchain Verification
                          </label>
                        </div>
                      </div>

                      {showBlockchainUpload && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700 mb-1">
                            <strong>Blockchain Verification Enabled</strong>
                          </p>
                          <p className="text-xs text-blue-600">
                            Documents will be hashed and submitted to Algorand blockchain for tamper-proof evidence
                          </p>
                        </div>
                      )}

                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">
                          Upload your completed work, reports, and supporting documents
                          {showBlockchainUpload && (
                            <span className="block text-sm text-blue-600 mt-1">
                              Files will be blockchain-verified for authenticity
                            </span>
                          )}
                        </p>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                          accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                        />
                        <label
                          htmlFor="file-upload"
                          className={`px-6 py-2 rounded-lg cursor-pointer transition-colors ${
                            showBlockchainUpload 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-[#1B1828] hover:bg-[#1B1828]/90 text-white'
                          }`}
                        >
                          Choose Files
                        </label>
                      </div>

                      {/* Uploaded Files List */}
                      {submitWorkData.files.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                          {submitWorkData.files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileTextIcon className="w-5 h-5 text-gray-500" />
                                <span className="text-sm text-gray-700">{file.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                                {showBlockchainUpload && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    🔒 Blockchain Verified
                                  </span>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Display blockchain verification status */}
                      {showBlockchainUpload && blockchainHashes.length > 0 && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="text-sm font-medium text-green-800 mb-2">
                            ✅ Blockchain Verification Complete
                          </h4>
                          <div className="space-y-1">
                            {blockchainHashes.map((item, index) => (
                              <div key={index} className="text-xs text-green-700">
                                <span className="font-medium">{item.fileName}</span>
                                {item.txId && <span className="ml-2">TX: {item.txId.substring(0, 12)}...</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-4 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setViewMode("dashboard")}
                        className="px-8 py-3"
                      >
                        Save as Draft
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 disabled:opacity-50"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Work"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Default dashboard view
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <SellerSidebar activePage="dashboard" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title="Legal Professional Dashboard" />

        {/* Dashboard Content */}
        <main className="flex-1 p-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-[#FEC85F] to-[#f5c55a] rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#1B1828] mb-2">Welcome back, Demo</h2>
                <p className="text-[#1B1828]/80">Find and manage legal gigs for property services</p>
              </div>
              <Link to="/find-gigs">
                <Button className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white">
                  Find Gigs
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <GavelIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Active Bids</div>
                    <div className="text-2xl font-bold text-gray-900">1</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BriefcaseIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Ongoing Gigs</div>
                    <div className="text-2xl font-bold text-gray-900">1</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Completed</div>
                    <div className="text-2xl font-bold text-gray-900">12</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-2 gap-8">
            {/* Available Gigs */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Gigs</h3>
              <p className="text-gray-600 mb-6">Recently posted gigs that matches your expertise</p>
              
              <div className="space-y-4">
                {availableGigs.map((gig) => (
                  <Card key={gig.id} className="bg-white border border-gray-200">
                    <CardContent className="p-6">
                      <h4 className="font-semibold text-gray-900 mb-2">{gig.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">Posted by {gig.company}</p>
                      <p className="text-sm text-gray-600 mb-4">Deadline: {gig.deadline}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">{gig.price}</span>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handlePlaceBid(gig)}
                            className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
                            disabled={gig.status === 'suspended'}
                          >
                            {gig.status === 'suspended' ? 'Gig Suspended' : 'Place Bid'}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleViewDetails(gig)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Your Active Bids */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Active Bids</h3>
                <p className="text-gray-600 mb-6">Bids you've placed that are awaiting client decisions</p>
                
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Property Survey - Lekki Phase 1</h4>
                    <p className="text-sm text-gray-600 mb-2">Client: Prestige Homes</p>
                    <p className="text-sm text-gray-600 mb-4">Bid placed on: 25/04/2025</p>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-lg font-bold text-gray-900">₦75,000</span>
                        <span className="text-sm text-gray-500 ml-2">Original: ₦80,000</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="border-[#FEC85F] text-[#FEC85F] hover:bg-[#FEC85F] hover:text-[#1B1828]"
                        onClick={() => handleEditBid()}
                      >
                        Edit Bid
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          // Create a gig object from the active bid data
                          const activeBidGig: Gig = {
                            id: "101", // Using a unique ID for this active bid
                            title: "Property Survey - Lekki Phase 1",
                            company: "Prestige Homes",
                            price: "₦75,000",
                            deadline: "10/06/2025",
                            postedDate: "25/04/2025",
                            budget: "₦80,000",
                            deliveryTime: "7 days",
                            description: "Complete property survey for a residential plot in Lekki Phase 1.",
                            requirements: [
                              "Detailed boundary survey",
                              "Topographical analysis",
                              "Legal documentation review"
                            ],
                            companyRating: 4.8,
                            projectsPosted: 12,
                            is_flagged: false
                          };
                          handleViewDetails(activeBidGig);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ongoing Gigs */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Ongoing Gigs</h3>
                <p className="text-gray-600 mb-6">Gigs you are currently working on</p>
                
                {ongoingGigs.map((gig) => (
                  <Card key={gig.id} className="bg-white border border-gray-200">
                    <CardContent className="p-6">
                      <h4 className="font-semibold text-gray-900 mb-2">{gig.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">Client: {gig.company}</p>
                      <p className="text-sm text-gray-600 mb-2">Due: {gig.dueDate}</p>
                      <p className="text-lg font-bold text-gray-900 mb-4">{gig.price}</p>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Progress: {gig.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${gig.progress}%` }}></div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => navigate("/seller-messages")}
                          className="border-blue-500 text-blue-500 hover:bg-blue-50"
                        >
                          Message Client
                        </Button>
                        <Button 
                          onClick={() => handleSubmitWork(gig)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Submit Work
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};