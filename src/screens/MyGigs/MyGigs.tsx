import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Header } from "../../components/Header";
import { ViewBids } from "../../components/ViewBids/ViewBids";
import { ViewDeliverables } from "../../components/ViewDeliverables/ViewDeliverables";
import { BuyerSidebar } from "../../components/BuyerSidebar/BuyerSidebar";
import { api } from "../../services/api";
import { supabase } from "../../lib/supabase";
import { 
  UserIcon,
  PlusIcon,
  FileTextIcon,
  TrashIcon,
  ArrowLeftIcon,
  UploadIcon,
  XIcon,
  BriefcaseIcon,
  MessageSquareIcon,
  CreditCardIcon,
  GridIcon,
  ListIcon
} from "lucide-react";
import { MultiSelectDropdown } from "../../components/ui/MultiSelectDropdown";

type ViewMode = "list" | "view-gig" | "edit-gig" | "view-deliverables";

interface Gig {
  id: number;
  title: string;
  category: string;
  categories: string[];
  description: string;
  budget: string;
  deadline: string;
  status: "Active" | "Paused" | "Draft" | "Completed" | "Pending" | "Pending Payment";
  statusColor: string;
  orders: number;
  rating: number;
  views: number;
  postedDate: string;
  bidsReceived: number;
  requirements: string[];
  attachments: string[];
  is_flagged: boolean;
  buyer_id: string;
}

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File;
}

export const MyGigs = (): JSX.Element => {
  // Navigation is handled through state changes and component rendering
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("All Gigs");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [gridViewMode, setGridViewMode] = useState<"grid" | "list">("grid");
  const [isDragOver, setIsDragOver] = useState(false);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [, setLoading] = useState(true);
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedGigs, setSelectedGigs] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    categories: [] as string[],
    description: "",
    budget: "",
    deadline: "",
    requirements: [] as string[]
  });

  const filters = ["All Gigs", "Active", "Paused", "Draft", "Pending Payment"];
  const categories = ["All Categories", "Contract Law", "Business Law", "Family Law", "Property Law", "Immigration Law"];

  const categoryOptions = [
    { value: "land-title", label: "Land Title Verification" },
    { value: "contract-review", label: "Contract Review" },
    { value: "property-survey", label: "Property Survey" },
    { value: "due-diligence", label: "Due Diligence" },
    { value: "legal-documentation", label: "Legal Documentation" },
    { value: "compliance-check", label: "Compliance Check" },
    { value: "c-of-o", label: "C of O Processing" },
    { value: "real-estate-law", label: "Real Estate Law" },
    { value: "family-law", label: "Family Law" },
    { value: "business-law", label: "Business Law" },
    { value: "immigration-law", label: "Immigration Law" },
    { value: "other", label: "Other" }
  ];

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("user", user);
      if (!user) return;

      const filters = {
        status: selectedFilter === "All Gigs" ? undefined : 
               selectedFilter === "Pending Payment" ? "pending_payment" : 
               selectedFilter.toLowerCase(),
        categories: selectedCategory === "All Categories" ? undefined : [selectedCategory]
      };

      const fetchedGigs = await api.gigs.getMyGigs(user.id, filters);
      console.log("fetchedGigs:", fetchedGigs);
      
      // Transform the fetched gigs to match our Gig interface
      const transformedGigs: Gig[] = fetchedGigs.map((gig: any) => ({
        id: gig.id,
        title: gig.title,
        category: gig.categories?.[0] || '',
        categories: gig.categories || [],
        description: gig.description,
        budget: `₦${gig.budget}`,
        deadline: new Date(gig.deadline).toLocaleDateString(),
        status: gig.status === 'pending_payment' ? 'Pending Payment' : gig.status.charAt(0).toUpperCase() + gig.status.slice(1),
        statusColor: getStatusColor(gig.status),
        orders: 0, // These would need to be fetched separately
        rating: 0,
        views: 0,
        postedDate: new Date(gig.created_at).toLocaleDateString(),
        bidsReceived: 0,
        requirements: gig.requirements || [],
        attachments: gig.attachments || [],
        is_flagged: false,
        buyer_id: user.id
      }));

      setGigs(transformedGigs);
    } catch (error) {
      console.error('Error fetching gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending_payment':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewGig = (gig: Gig) => {
    setSelectedGig(gig);
    setViewMode("view-gig");
  };

  const handleEditGig = (gig: Gig) => {
    setSelectedGig(gig);
    setAttachmentsToDelete([]);
    setEditFormData({
      title: gig.title,
      categories: Array.isArray((gig as any).categories) ? (gig as any).categories : [gig.category],
      description: gig.description,
      budget: gig.budget.replace('₦', ''),
      deadline: new Date(gig.deadline).toLocaleDateString('en-CA'),
      requirements: [...gig.requirements]
    });

    // Handle attachments - ensure it's an array before mapping
    const attachments = Array.isArray(gig.attachments) ? gig.attachments : [];
    setAttachedFiles(attachments.map(name => ({
      id: Math.random().toString(36).substring(2, 11),
      name,
      size: 0, // We don't have the original size
      type: name.split('.').pop() || '', // Try to guess the type from extension
      file: undefined
    })));

    setViewMode("edit-gig");
  };

  const handleViewDeliverables = (gig: Gig) => {
    setSelectedGig(gig);
    setViewMode("view-deliverables");
  };

  const handlePayNow = (_gig: Gig) => {
    // Navigate to payments page for pending payment gigs
    navigate("/payments");
  };

  const handlePauseGig = async (gig: Gig): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Determine the new status: resume to 'pending', pause to 'paused'
      const newStatus = gig.status === "Paused" ? "pending" : "paused";

      // Prepare the update payload, keeping all required fields
      const gigData = {
        title: gig.title,
        description: gig.description,
        categories: Array.isArray((gig as any).categories) ? (gig as any).categories : [gig.category],
        budget: gig.budget.replace('₦', ''),
        deadline: new Date(gig.deadline).toISOString(),
        status: newStatus,
        buyer_id: user.id,
        requirements: gig.requirements
      };

      const error = await api.gigs.updateGig(gig.id.toString(), gigData);

      if (error) {
        throw new Error('Failed to update gig status');
      }

      // Refresh the gigs list to show updated data
      await fetchGigs();
    } catch (error) {
      console.error('Error updating gig status:', error);
      // Optionally show an error message to the user
    }
    return;
  };

  // Group Delete Functions
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedGigs(new Set());
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
    const deletableGigs = filteredGigs.filter(gig => 
      gig.status === 'Pending'
    );
    setSelectedGigs(new Set(deletableGigs.map(gig => gig.id.toString())));
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
    if (selectedGigs.size === 0) return;
    
    setDeleting(true);
    try {
      const deletePromises = Array.from(selectedGigs).map(gigId => 
        api.gigs.deleteGig(gigId)
      );
      
      const results = await Promise.all(deletePromises);
      const hasErrors = results.some(error => error !== null);
      
      if (hasErrors) {
        console.error('Some gigs could not be deleted');
      } else {
        // Remove deleted gigs from local state
        setGigs(prevGigs => 
          prevGigs.filter(gig => !selectedGigs.has(gig.id.toString()))
        );
        setSelectedGigs(new Set());
        setIsSelectMode(false);
      }
    } catch (err) {
      console.error('Error deleting gigs:', err);
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
    const confirmed = window.confirm('Are you sure you want to delete this gig?');
    if (!confirmed) return;
    
    try {
      const error = await api.gigs.deleteGig(gigId);
      if (error) {
        console.error('Error deleting gig:', error);
      } else {
        setGigs(prevGigs => prevGigs.filter(gig => gig.id.toString() !== gigId));
      }
    } catch (err) {
      console.error('Error deleting gig:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // Requirement management functions removed as they're not used in this component

  const handleFileUpload = (files: FileList) => {
    const newFiles: AttachedFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpdateGig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGig) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete marked attachments first
      if (attachmentsToDelete.length > 0) {
        for (const filename of attachmentsToDelete) {
          try {
            await api.gigs.deleteAttachment(selectedGig.id, selectedGig.buyer_id, filename);
          } catch (err) {
            console.error(`Failed to delete attachment ${filename}:`, err);
            // Continue with other deletions even if one fails
          }
        }
      }

      // Filter out empty requirements
      const validRequirements = editFormData.requirements.filter(req => req.trim() !== '');

      // Get files from attachedFiles state (newly uploaded files)
      const files: File[] = attachedFiles
        .filter(file => file.file) // Only include files that have a File object
        .map(file => file.file!)
        .filter(Boolean); // Remove any undefined values

      const gigData = {
        title: editFormData.title,
        description: editFormData.description,
        categories: editFormData.categories,
        budget: editFormData.budget.replace('₦', ''),
        deadline: new Date(editFormData.deadline).toISOString(),
        status: selectedGig.status.toLowerCase(),
        attachments: files, // Pass File objects from attachedFiles
        buyer_id: user.id,
        requirements: validRequirements
      };

      const error = await api.gigs.updateGig(selectedGig.id.toString(), gigData);
      
      if (error) {
        throw new Error('Failed to update gig');
      }

      // Refresh the gigs list to show updated data
      await fetchGigs();
      setViewMode("list");
    } catch (error) {
      console.error('Error updating gig:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(prevCategory => 
      prevCategory === category ? "All Categories" : category
    );
  };

  // Update the filteredGigs to use the state
  const filteredGigs = gigs.filter(gig => {
    const matchesFilter = selectedFilter === "All Gigs" || gig.status === selectedFilter;
    const matchesCategory = selectedCategory === "All Categories" || 
      gig.categories.includes(selectedCategory) || gig.category === selectedCategory;
    return matchesFilter && matchesCategory;
  });

  const gigStats = {
    total: gigs.length,
    active: gigs.filter(g => g.status === "Active").length,
    paused: gigs.filter(g => g.status === "Paused").length,
    draft: gigs.filter(g => g.status === "Draft").length,
    pendingPayment: gigs.filter(g => g.status === "Pending Payment").length
  };

  const handleCategoriesChange = (selectedCategories: string[]) => {
    setEditFormData(prev => ({ ...prev, categories: selectedCategories }));
  };

  if (viewMode === "view-gig" && selectedGig) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <BuyerSidebar activePage="my-gigs" />

        {/* Main Content - View Gig */}
        <div className="flex-1 flex flex-col pt-16 md:pt-0 pb-20 md:pb-0">
          <div className="hidden md:block">
            <Header title="View Gig" />
          </div>

          <main className="flex-1 p-3 sm:p-6">
            {/* Use the ViewBids component for consistent UI */}
            <ViewBids 
              gig={{
                id: selectedGig.id.toString(),
                title: selectedGig.title,
                company: "Your Company",
                price: selectedGig.budget,
                deadline: selectedGig.deadline,
                category: selectedGig.category,
                description: selectedGig.description,
                postedDate: selectedGig.postedDate,
                budget: selectedGig.budget,
                deliveryTime: "14 days",
                requirements: selectedGig.requirements,
                companyRating: 4.8,
                projectsPosted: 12,
                is_flagged: selectedGig.is_flagged,
                status: selectedGig.status.toLowerCase(),
                attachments: selectedGig.attachments
              }}
              onBack={() => setViewMode("list")}
              backButtonText="Back to My Gigs"
            />
          </main>
        </div>
      </div>
    );
  }

  if (viewMode === "view-deliverables" && selectedGig) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <BuyerSidebar activePage="my-gigs" />

        {/* Main Content - View Deliverables */}
        <div className="flex-1 flex flex-col pt-16 md:pt-0 pb-20 md:pb-0">
          <div className="hidden md:block">
            <Header title="View Deliverables" />
          </div>

          <main className="flex-1 p-3 sm:p-6">
            <ViewDeliverables 
              gigId={selectedGig.id}
              gigTitle={selectedGig.title}
              postedDate={selectedGig.postedDate}
              deadline={selectedGig.deadline}
              budget={selectedGig.budget}
              status={selectedGig.status}
              description={selectedGig.description}
              provider={{
                name: "Provider Name", 
                avatar: "P",
                rating: 4.8,
                projectsPosted: 12,
                location: "Location"
              }}
              onBack={() => setViewMode("list")}
              onMessage={() => {}}
            />
          </main>
        </div>
      </div>
    );
  }

  if (viewMode === "edit-gig" && selectedGig) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className="w-64 bg-[#1B1828] text-white flex flex-col">
          <div className="p-6 border-b border-gray-700">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="Ilé Legal" className="w-10 h-10" />
              <div className="text-gray-300 text-sm">
                Legal
                <br />
                Marketplace
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <Link to="/buyer-dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <UserIcon className="w-5 h-5" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/post-gig" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <PlusIcon className="w-5 h-5" />
                  Post a Gig
                </Link>
              </li>
              <li>
                <Link to="/my-gigs" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700 text-white">
                  <BriefcaseIcon className="w-5 h-5" />
                  My Gigs
                </Link>
              </li>
              <li>
                <Link to="/buyer-messages" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <MessageSquareIcon className="w-5 h-5" />
                  Messages
                </Link>
              </li>
              <li>
                <Link to="/payments" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <CreditCardIcon className="w-5 h-5" />
                  Payments
                </Link>
              </li>
              <li>
                <Link to="/buyer-profile" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                  <UserIcon className="w-5 h-5" />
                  Profile
                </Link>
              </li>
            </ul>
          </nav>

          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium">Demo Client</div>
                <div className="text-xs text-gray-400">client@example.com</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Edit Gig */}
        <div className="flex-1 flex flex-col">
          <Header title="Edit Gig" />

          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <Button
                variant="ghost"
                onClick={() => setViewMode("list")}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to My Gigs
              </Button>

              <Card className="bg-white border border-gray-200">
                <CardContent className="p-4 sm:p-8">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Edit Gig</h1>

                  <form onSubmit={handleUpdateGig} className="space-y-8">
                    {/* Title and Category */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-3">
                          Gig Title
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={editFormData.title}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none text-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-3">
                          Categories
                        </label>
                        <MultiSelectDropdown
                          options={categoryOptions}
                          selectedValues={editFormData.categories}
                          onChange={handleCategoriesChange}
                          placeholder="Select categories..."
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-lg font-semibold text-gray-900 mb-3">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={editFormData.description}
                        onChange={handleInputChange}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none resize-none text-lg"
                        required
                      />
                    </div>

                    {/* Budget and Deadline */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-3">
                          Budget (₦)
                        </label>
                        <input
                          type="number"
                          name="budget"
                          value={editFormData.budget}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none text-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-3">
                          Deadline
                        </label>
                        <input
                          type="date"
                          name="deadline"
                          value={editFormData.deadline}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none text-lg"
                          required
                        />
                      </div>
                    </div>

                    {/* Attachments */}
                    <div>
                      <label className="block text-lg font-semibold text-gray-900 mb-3">
                        Attachments
                      </label>
                      
                      {/* Existing Attachments */}
                      {selectedGig.attachments && selectedGig.attachments.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-md font-medium text-gray-700 mb-3">Existing Attachments</h4>
                          <div className="space-y-2">
                            {selectedGig.attachments.map((attachmentUrl, index) => {
                              // Extract filename from URL
                              console.log("selectedGig:", selectedGig);
                              const filename = attachmentUrl.split('/').pop()?.split('?')[0] || `attachment-${index + 1}`;
                              // Shorten URL for display: show filename + ... + first 6 chars of hash/query
                              const urlHash = attachmentUrl.split('?')[1]?.slice(0, 6) || attachmentUrl.slice(-6);
                              const shortDisplay = `${filename}...${urlHash}`;
                              // Extract file path for deletion (between /object/sign/documents/ and ?)
                              // Note: filePath extraction kept for potential future use
                              // Extract filename for API
                              const filenameForApi = filename;
                              const handleDeleteAttachment = async () => {
                                // Mark attachment for deletion
                                setAttachmentsToDelete(prev => [...prev, filenameForApi]);
                              };
                              const isMarkedForDeletion = attachmentsToDelete.includes(filenameForApi);
                              return (
                                <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${
                                  isMarkedForDeletion 
                                    ? 'bg-red-50 border-red-200' 
                                    : 'bg-blue-50 border-blue-200'
                                }`}>
                                  <div className="flex items-center gap-3">
                                    <FileTextIcon className="w-5 h-5 text-blue-500" />
                                    <div>
                                      <div className="font-medium text-gray-900">{shortDisplay}</div>
                                      <div className="text-sm text-gray-500">
                                        {isMarkedForDeletion ? 'Marked for deletion' : 'Existing file'}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {!isMarkedForDeletion ? (
                                      <>
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
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={handleDeleteAttachment}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-100"
                                        >
                                          Delete
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setAttachmentsToDelete(prev => prev.filter(f => f !== filenameForApi))}
                                          className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                        >
                                          Undo
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          isDragOver 
                            ? 'border-[#1B1828] bg-gray-50' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <div className="mb-2">
                          <span className="text-lg text-gray-700">Drag & drop or </span>
                          <label className="text-lg text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                            Browse
                            <input
                              type="file"
                              multiple
                              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                              className="hidden"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                            />
                          </label>
                        </div>
                        <p className="text-sm text-gray-500">
                          (PDF, DOC, DOCX, JPG, PNG up to 10 MB)
                        </p>
                      </div>
                    </div>

                    {/* New Attachments */}
                    {attachedFiles.filter(f => f.file).length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-md font-medium text-gray-700 mb-3">New Attachments</h4>
                        {attachedFiles.filter(f => f.file).map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileTextIcon className="w-5 h-5 text-gray-500" />
                              <div>
                                <div className="font-medium text-gray-900">{file.name}</div>
                                <div className="text-sm text-gray-500">{formatFileSize(file.size)}</div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setViewMode("list")}
                        className="px-8 py-3 text-lg"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-8 py-3 text-lg font-medium"
                      >
                        Update Gig
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

  // Default list view
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <BuyerSidebar activePage="my-gigs" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="hidden md:block">
          <Header title="My Gigs" />
        </div>

        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header with Stats and Post Button */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6 sm:mb-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Gigs</h1>
                  <div className="md:hidden flex items-center gap-2">
                    {!isSelectMode ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={toggleSelectMode}
                        title="Delete Gigs"
                        className="px-2 py-1.5"
                      >
                        <TrashIcon className="w-3 h-3" />
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1">
                        {selectedGigs.size > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeleteSelected}
                            disabled={deleting}
                            className="bg-red-600 text-white hover:bg-red-700 px-2 py-1.5 text-xs"
                          >
                            {deleting ? 'Del...' : `Del ${selectedGigs.size}`}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleSelectMode}
                          title="Cancel Selection"
                          className="px-2 py-1.5"
                        >
                          <XIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    <Link to="/post-gig">
                      <Button className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-3 py-1.5 text-sm">
                        <PlusIcon className="w-3 h-3 mr-1" />
                        Post a Gig
                      </Button>
                    </Link>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-8">
                  <div className="text-center">
                    <div className="text-xl sm:text-3xl font-bold text-gray-900">{gigStats.total}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Total Gigs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-3xl font-bold text-gray-900">{gigStats.active}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-3xl font-bold text-gray-900">{gigStats.paused}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Paused</div>
                  </div>
                  <div className="text-center hidden md:block">
                    <div className="text-xl sm:text-3xl font-bold text-gray-900">{gigStats.draft}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Draft</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-3xl font-bold text-red-600">{gigStats.pendingPayment}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Pending Payment</div>
                  </div>
                </div>
              </div>

              <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                {!isSelectMode ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={toggleSelectMode}
                    title="Delete Gigs"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    {selectedGigs.size > 0 && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearSelection}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Clear
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDeleteSelected}
                          disabled={deleting}
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          {deleting ? 'Deleting...' : `Delete ${selectedGigs.size} gig(s)`}
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllGigs}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectMode}
                      title="Cancel Selection"
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                {/* View Toggle Buttons */}
                <div className="hidden md:flex items-center gap-2 order-1 sm:order-none">
                  <span className="text-xs sm:text-sm text-gray-600 mr-2">View:</span>
                  <Button
                    variant={gridViewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGridViewMode("grid")}
                    className={gridViewMode === "grid" ? "bg-[#1B1828] text-white" : ""}
                  >
                    <GridIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={gridViewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGridViewMode("list")}
                    className={gridViewMode === "list" ? "bg-[#1B1828] text-white" : ""}
                  >
                    <ListIcon className="w-4 h-4" />
                  </Button>
                </div>
                
                <Link to="/post-gig" className="hidden md:block w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Post a Gig
                  </Button>
                </Link>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedFilter === filter
                      ? "bg-[#1B1828] text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {filter}
                </button>
              ))}
              
              {categories.slice(1).map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-[#FEC85F] text-[#1B1828]"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Gigs List */}
            {filteredGigs.length > 0 ? (
              gridViewMode === "grid" ? (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGigs.map((gig) => {
                    const isSelected = selectedGigs.has(gig.id.toString());
                    const isDeletable = gig.status === 'Pending';
                    
                    return (
                      <Card 
                        key={gig.id} 
                        className={`bg-white border border-gray-200 hover:shadow-lg transition-shadow ${
                          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        } ${
                          isSelectMode && !isDeletable ? 'opacity-50' : ''
                        }`}
                      >
                        <CardContent className="p-4 sm:p-6">
                          {isSelectMode && isDeletable && (
                            <div className="mb-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleGigSelection(gig.id.toString())}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </div>
                          )}
                          <div className="mb-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${gig.statusColor}`}>
                              {gig.status}
                            </span>
                          </div>
                          
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm sm:text-base">{gig.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{gig.description}</p>
                          
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-3">
                            <span>Deadline: {gig.deadline}</span>
                          </div>
                          
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-base sm:text-lg font-bold text-green-600">{gig.budget}</span>
                            <span className="text-xs sm:text-sm text-gray-600">{gig.orders} orders</span>
                          </div>
                          
                          {!isSelectMode && (
                            <div className="flex flex-col sm:flex-row gap-2">
                              {gig.status === 'Pending Payment' ? (
                                /* Pending Payment Actions */
                                <>
                                  <Button
                                    onClick={() => handleViewDeliverables(gig)}
                                    variant="outline"
                                    className="border-blue-500 text-blue-600 hover:bg-blue-50 flex-1 py-2.5 text-sm sm:text-base"
                                  >
                                    View Deliverables
                                  </Button>
                                  <Button
                                    onClick={() => handlePayNow(gig)}
                                    className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] flex-1 py-2.5 text-sm sm:text-base"
                                  >
                                    Pay Now
                                  </Button>
                                </>
                              ) : (
                                /* Regular Actions */
                                <>
                                  <Button
                                    onClick={() => handleViewGig(gig)}
                                    className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white flex-1 py-2.5 text-sm sm:text-base"
                                  >
                                    View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleEditGig(gig)}
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5 text-sm sm:text-base"
                                  >
                                    Edit
                                  </Button>
                                  {gig.status === 'Pending' && (
                                    <Button
                                      variant="outline"
                                      onClick={() => handleSingleDelete(gig.id.toString())}
                                      className="text-red-600 hover:text-red-800 hover:bg-red-50 py-2.5 px-3"
                                      title="Delete Gig"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="space-y-6">
                  {filteredGigs.map((gig) => {
                    const isSelected = selectedGigs.has(gig.id.toString());
                    const isDeletable = gig.status === 'Pending';
                    
                    return (
                      <Card 
                        key={gig.id} 
                        className={`border border-gray-200 hover:border-gray-300 transition-colors rounded-xl ${
                          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        } ${
                          isSelectMode && !isDeletable ? 'opacity-50' : ''
                        }`}
                      >
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                            <div className="flex items-start gap-3 flex-1">
                              {isSelectMode && isDeletable && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleGigSelection(gig.id.toString())}
                                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{gig.title}</h3>
                                  <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start ${gig.statusColor}`}>
                                    {gig.status}
                                  </span>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium self-start">
                                    {gig.category}
                                  </span>
                                  <span className="text-xs sm:text-sm text-gray-600">Posted: {gig.postedDate}</span>
                                  <span className="text-xs sm:text-sm text-gray-600">Deadline: {gig.deadline}</span>
                                </div>

                                <p className="text-sm sm:text-base text-gray-600 mb-4 line-clamp-2">{gig.description}</p>

                                <div className="grid grid-cols-3 sm:flex sm:items-center gap-4 sm:gap-8">
                                  <div className="text-center">
                                    <div className="text-lg sm:text-2xl font-bold text-gray-900">{gig.orders}</div>
                                    <div className="text-xs text-gray-600">Orders</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg sm:text-2xl font-bold text-gray-900">{gig.rating}</div>
                                    <div className="text-xs text-gray-600">Rating</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg sm:text-2xl font-bold text-gray-900">{gig.views}</div>
                                    <div className="text-xs text-gray-600">Views</div>
                                  </div>
                                </div>

                                <div className="mt-4">
                                  <div className="text-xl sm:text-2xl font-bold text-green-600">Starting at {gig.budget}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {!isSelectMode && (
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-0">
                              {gig.status === 'Pending Payment' ? (
                                /* Pending Payment Actions */
                                <>
                                  <Button
                                    onClick={() => handleViewDeliverables(gig)}
                                    variant="outline"
                                    className="border-blue-500 text-blue-600 hover:bg-blue-50 px-4 sm:px-6 py-3 text-sm sm:text-base"
                                  >
                                    View Deliverables
                                  </Button>
                                  <Button
                                    onClick={() => handlePayNow(gig)}
                                    className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-4 sm:px-6 py-3 text-sm sm:text-base"
                                  >
                                    Pay Now
                                  </Button>
                                </>
                              ) : (
                                /* Regular Actions */
                                <>
                                  <Button
                                    onClick={() => handleViewGig(gig)}
                                    className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white px-4 sm:px-6 py-3 text-sm sm:text-base"
                                  >
                                    View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleEditGig(gig)}
                                    className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 sm:px-6 py-3 text-sm sm:text-base"
                                  >
                                    Edit
                                  </Button>
                                  {!(String(gig.status).toLowerCase() === "active" || String(gig.status).toLowerCase() === "completed" || String(gig.status).toLowerCase() === "suspended") && (
                                    <Button
                                      variant="outline"
                                      onClick={() => handlePauseGig(gig)}
                                      className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 sm:px-6 py-3 text-sm sm:text-base"
                                    >
                                      {gig.status === "Paused" ? "Resume" : "Pause"}
                                    </Button>
                                  )}
                                  {gig.status === 'Pending' && (
                                    <Button
                                      variant="outline"
                                      onClick={() => handleSingleDelete(gig.id.toString())}
                                      className="text-red-600 hover:text-red-800 hover:bg-red-50 px-4 sm:px-6 py-3"
                                      title="Delete Gig"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )
            ) : (
              /* Empty State */
              <div className="text-center py-16">
                <div className="w-32 h-32 mx-auto mb-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileTextIcon className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">No gigs found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Get started by posting your first gig
                </p>
                <Link to="/post-gig">
                  <Button className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-8 py-3 text-lg">
                    Post a Gig
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </main>
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
              <Button
                variant="outline"
                onClick={cancelDeleteModal}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteSelected}
                disabled={deleting}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : `Delete ${selectedGigs.size} gig(s)`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};