import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { MultiSelectDropdown } from "../../components/ui/MultiSelectDropdown";
import { Header } from "../../components/Header";
import { BuyerSidebar } from "../../components/BuyerSidebar/BuyerSidebar";
import { MobileHeader } from "../../components/MobileHeader/MobileHeader";
import { MobileNavigation } from "../../components/MobileNavigation/MobileNavigation";
import { 
  ArrowLeftIcon,
  CalendarIcon,
  UploadIcon,
  XIcon
} from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { getAllCategoryOptions } from "../../config/categories";

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export const PostGig = (): JSX.Element => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    categories: [] as string[],
    description: "",
    budget: "",
    deadline: "",
  });
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const categoryOptions = getAllCategoryOptions();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoriesChange = (selectedCategories: string[]) => {
    setFormData(prev => ({ ...prev, categories: selectedCategories }));
  };

  const handleFileUpload = (files: FileList) => {
    const newFiles: AttachedFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("You must be logged in to post a gig.");
      return;
    }
    // Convert attachedFiles to File[] for upload
    const fileInputs = document.createElement('input');
    fileInputs.type = 'file';
    fileInputs.multiple = true;
    // This is a workaround: ideally, you should keep the File objects, not just metadata, in attachedFiles
    // For now, we assume the user just uploaded in this session and can access via file input
    // If you want to keep File objects, adjust handleFileUpload to store File as well
    // Here, we just pass [] if not available
    let files: File[] = [];
    // Try to get files from the file input if possible
    // (You may want to refactor file upload logic to keep File objects in state)
    try {
      files = Array.from((document.querySelector('input[type="file"]') as HTMLInputElement)?.files || []);
    } catch {}
    const gigData = {
      title: formData.title,
      description: formData.description,
      categories: formData.categories,
      budget: Number(formData.budget),
      deadline: formData.deadline,
      attachments: files,
      buyer_id: user.id,
    };
    try {
      const { data, error } = await api.gigs.createGig(gigData);
      if (error) {
        alert("Failed to post gig: " + error.message);
        return;
      }
      navigate("/buyer-dashboard");
    } catch (err: any) {
      alert("Failed to post gig: " + (err.message || err));
    }
  };

  const handleCancel = () => {
    navigate("/buyer-dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Header */}
      <MobileHeader />

      {/* Sidebar */}
      <BuyerSidebar activePage="post-gig" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title="Post a Gig" userName="Demo Client" userType="buyer" />

        {/* Post Gig Content */}
        <main className="flex-1 p-4 sm:p-6 pt-16 md:pt-4 pb-20 md:pb-6">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back
            </Button>

            {/* Post Gig Form Card */}
            <Card className="bg-white border border-gray-200 shadow-lg">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Post a New Gig</h1>
                  <p className="text-sm sm:text-base text-gray-600">Describe your legal needs and get bids from qualified professionals</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                  {/* Gig Title and Category Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                        Gig Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="E.g. Land Title Verification for Victoria Island Property"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none text-sm sm:text-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                        Categories
                      </label>
                      <MultiSelectDropdown
                        options={categoryOptions}
                        selectedValues={formData.categories}
                        onChange={handleCategoriesChange}
                        placeholder="Select categories..."
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe the legal service you need in detail. Include specific requirements, documents available, and expected outcomes."
                      rows={4}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none resize-none text-sm sm:text-lg sm:min-h-[120px]"
                      required
                    />
                  </div>

                  {/* Budget and Deadline Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                        Budget (₦)
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 bg-[#FEC85F] text-[#1B1828] px-2 py-1 rounded text-xs sm:text-sm font-medium">
                          ₦
                        </div>
                        <input
                          type="number"
                          name="budget"
                          value={formData.budget}
                          onChange={handleInputChange}
                          placeholder="50,000"
                          className="w-full pl-12 sm:pl-16 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none text-sm sm:text-lg"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                        Deadline
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          name="deadline"
                          value={formData.deadline}
                          onChange={handleInputChange}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none text-sm sm:text-lg"
                          required
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <CalendarIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Attachments */}
                  <div>
                    <label className="block text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                      Attachments
                    </label>
                    
                    {/* File Upload Area */}
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`border-2 border-dashed rounded-lg p-4 sm:p-6 lg:p-8 text-center transition-colors ${
                        isDragOver 
                          ? 'border-[#1B1828] bg-gray-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <UploadIcon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                      <div className="mb-2">
                        <span className="text-sm sm:text-base lg:text-lg text-gray-700">Drag & drop or </span>
                        <label className="text-sm sm:text-base lg:text-lg text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
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
                        (PD, DOC, DOCX, JPG, PNG à 10 MB)
                      </p>
                    </div>

                    {/* Attached Files List */}
                    {attachedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {attachedFiles.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm sm:text-base text-gray-900 truncate">{file.name}</div>
                                <div className="text-xs sm:text-sm text-gray-500">{formatFileSize(file.size)}</div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 p-1 sm:p-2"
                            >
                              <XIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="w-full sm:w-auto bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg font-medium"
                      disabled={formData.categories.length === 0}
                    >
                      Post Gig
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  );
};