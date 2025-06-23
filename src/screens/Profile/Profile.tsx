import React, { useState, useEffect } from "react";
import { formatDate } from "../../utils/formatters";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Header } from "../../components/Header/Header";
import { SellerSidebar } from "../../components/SellerSidebar/SellerSidebar";
import { 
  StarIcon,
  CheckCircleIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  GraduationCapIcon,
  BriefcaseIcon,
  FileTextIcon,
  EditIcon,
  ArrowLeftIcon,
  UploadIcon,
  PlusIcon,
  MinusIcon,
  UserIcon,
  SearchIcon,
  GavelIcon,
  MessageSquareIcon,
  DollarSignIcon
} from "lucide-react";
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

import LawyerProfileView from './LawyerProfileView';

interface Education {
  degree: string;
  institution: string;
  period: string;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  about: string;
  specializations: string[];
  education: Education[];
}

type ViewMode = "profile" | "edit-profile" | "public-view";

export const Profile = (): JSX.Element => {
  const { user, updateProfile } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("profile");
  const [activeTab, setActiveTab] = useState<"overview" | "experience" | "reviews" | "cases">("overview");
  const [newSpecialization, setNewSpecialization] = useState("");
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "Loading...",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    about: "",
    specializations: [],
    education: []
  });
  // isLoading state can be used for loading indicators in the future
  const [, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [cases, setCases] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);

  // Load real profile data from Supabase
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Get data from user metadata like buyer profile
        const meta = user.user_metadata || {};
        let firstName = (meta as any).firstName || '';
        let lastName = (meta as any).lastName || '';
        if ((!firstName || !lastName) && user.name) {
          const parts = user.name.split(' ');
          firstName = firstName || parts[0] || 'User';
          lastName = lastName || parts.slice(1).join(' ') || '';
        }

        setProfileData({
          firstName,
          lastName,
          email: user.email || '',
          phone: meta.phone || '',
          title: 'Legal Professional',
          about: (meta as any).about || '',
          specializations: Array.isArray((meta as any).specializations) ? (meta as any).specializations : [],
          education: Array.isArray((meta as any).education) ? (meta as any).education : []
        });
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  // Fetch feedback data for reviews
  const fetchFeedback = async () => {
    setLoadingReviews(true);
    try {
      // Check if there's a valid session first
      const { supabaseLocal } = await import('../../lib/supabaseLocal');
      const { data: { session } } = await supabaseLocal.auth.getSession();
      if (!session) {
        console.log('No active session, skipping feedback fetch');
        setReviews([]);
        setAverageRating(0);
        return;
      }

      const feedbackData = await api.feedback.getFeedbackForUser();
      setReviews(feedbackData);
      
      // Calculate average rating
      if (feedbackData.length > 0) {
        const totalRating = feedbackData.reduce((sum: number, feedback: any) => sum + feedback.rating, 0);
        setAverageRating(totalRating / feedbackData.length);
      }
    } catch (error) {
      console.log('Could not load feedback data:', error);
      setReviews([]);
      setAverageRating(0);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Fetch cases/gigs data
  const fetchCases = async () => {
    setLoadingCases(true);
    try {
      // Check if there's a valid session first
      const { supabaseLocal } = await import('../../lib/supabaseLocal');
      const { data: { session } } = await supabaseLocal.auth.getSession();
      if (!session) {
        console.log('No active session, skipping cases fetch');
        setCases([]);
        return;
      }

      const gigsData = await api.gigs.getMyGigs(user?.id || '');
      setCases(gigsData.map((gig: any) => ({
        title: gig.title || 'Legal Service',
        date: formatDate.short(gig.created_at),
        status: gig.status === 'completed' ? 'Completed' : 
               gig.status === 'in_progress' ? 'In Progress' : 
               gig.status === 'pending' ? 'Open' : 'Open', // Display "Open" for pending status
        statusColor: gig.status === 'completed' ? 'bg-green-100 text-green-800' :
                    gig.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    gig.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
      })));
    } catch (error) {
      console.log('Could not load cases data:', error);
      setCases([]); // Set empty array on error
    } finally {
      setLoadingCases(false);
    }
  };

  // Fetch reviews and cases on component mount
  useEffect(() => {
    if (user?.id) {
      fetchFeedback();
      fetchCases();
    }
  }, [user?.id]);

  const [editFormData, setEditFormData] = useState<ProfileData>(profileData);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "experience", label: "Experience" },
    { id: "reviews", label: "Reviews" },
    { id: "cases", label: "Cases" }
  ];

  // Get experience from profile data
  const experience = Array.isArray((user?.user_metadata as any)?.experience) ? 
    (user?.user_metadata as any).experience : [];

  // Reviews now come from API state

  // Cases now come from API state

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEducationChange = (index: number, field: keyof Education, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const addEducation = () => {
    setEditFormData(prev => ({
      ...prev,
      education: [...prev.education, { degree: "", institution: "", period: "" }]
    }));
  };

  const removeEducation = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addSpecialization = () => {
    if (newSpecialization.trim()) {
      setEditFormData(prev => ({
        ...prev,
        specializations: [...prev.specializations, newSpecialization.trim()]
      }));
      setNewSpecialization("");
    }
  };

  const removeSpecialization = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index)
    }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    
    try {
      // Update profile using AuthContext API
      await updateProfile({
        user_metadata: {
          firstName: editFormData.firstName,
          lastName: editFormData.lastName,
          phone: editFormData.phone,
          title: editFormData.title,
          about: editFormData.about,
          specializations: editFormData.specializations,
          education: editFormData.education
        }
      });
      
      // Update local state and return to profile view
      setProfileData(editFormData);
      setViewMode("profile");
      
      // TODO: Show success toast
      console.log("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      // TODO: Show error toast
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Update profile picture using AuthContext API
        await updateProfile({ profile_picture: file });
        console.log("Profile picture uploaded successfully");
        // TODO: Show success toast
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        // TODO: Show error toast
      }
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">About</h3>
              <p className="text-gray-600 leading-relaxed">
                {profileData.about}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Specializations</h3>
              <div className="space-y-3">
                {profileData.specializations.map((spec, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "experience":
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Education</h3>
              <div className="space-y-6">
                {profileData.education.map((edu, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <GraduationCapIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                      <p className="text-gray-600">{edu.institution}</p>
                      <p className="text-sm text-gray-500">{edu.period}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Professional Experience</h3>
              <div className="space-y-6">
                {experience.map((exp: any, index: number) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-6">
                    <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                    <p className="text-gray-600">{exp.company}</p>
                    <p className="text-sm text-gray-500 mb-2">{exp.period}</p>
                    <p className="text-gray-600">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "reviews":
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Client Reviews</h3>
              <div className="flex items-center gap-2">
                <div className="flex">{renderStars(Math.round(averageRating))}</div>
                <span className="text-lg font-semibold text-gray-900">
                  {averageRating > 0 ? `${averageRating.toFixed(1)} out of 5` : "No reviews yet"}
                </span>
              </div>
            </div>

            {loadingReviews ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading reviews...</div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No reviews yet</div>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review, index) => (
                  <Card key={review.id || index} className="bg-white border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Client</h4>
                            <div className="flex">{renderStars(review.rating)}</div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600">{review.free_response}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case "cases":
        return (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Cases</h3>
            {loadingCases ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading cases...</div>
              </div>
            ) : cases.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No cases yet</div>
                <p className="text-sm text-gray-400 mt-2">Your completed gigs will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cases.map((case_, index) => (
                <Card key={index} className="bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileTextIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{case_.title}</h4>
                          <p className="text-sm text-gray-500">{case_.date}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${case_.statusColor}`}>
                        {case_.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (viewMode === "public-view") {
    return <LawyerProfileView isOwnProfile={true} onBack={() => setViewMode('profile')} />;
  }

  if (viewMode === "edit-profile") {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className="w-64 bg-[#1B1828] text-white flex flex-col">
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

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <Link to="/seller-dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
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
                <Link to="/messages" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
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
                <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700 text-white">
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
                <div className="text-sm font-medium">{profileData.firstName} {profileData.lastName}</div>
                <div className="text-xs text-gray-400">{profileData.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Edit Profile */}
        <div className="flex-1 flex flex-col">
          <Header title="Edit Profile" userType="seller" />

          {/* Edit Profile Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              {/* Back Button */}
              <Button
                variant="ghost"
                onClick={() => setViewMode("profile")}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Profile
              </Button>

              <form onSubmit={handleSaveProfile} className="space-y-8">
                {/* Profile Picture */}
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                          <UserIcon className="w-12 h-12 text-gray-600" />
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="profile-picture"
                        />
                        <label
                          htmlFor="profile-picture"
                          className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#FEC85F] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#FEC85F]/90"
                        >
                          <UploadIcon className="w-4 h-4 text-[#1B1828]" />
                        </label>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Profile Picture</h3>
                        <p className="text-sm text-gray-600">Upload a professional photo</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Basic Information */}
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h3>
                    
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={editFormData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={editFormData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Professional Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={editFormData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Senior Property Lawyer"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                            <MailIcon className="w-5 h-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            name="email"
                            value={editFormData.email}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                            <PhoneIcon className="w-5 h-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            value={editFormData.phone}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* About */}
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">About</h3>
                    <textarea
                      name="about"
                      value={editFormData.about}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none resize-none"
                      placeholder="Tell us about your experience and expertise..."
                    />
                  </CardContent>
                </Card>

                {/* Specializations */}
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Specializations</h3>
                    <div className="space-y-3">
                      {editFormData.specializations.map((spec, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <input
                            type="text"
                            value={spec}
                            onChange={(e) => {
                              const newSpecs = [...editFormData.specializations];
                              newSpecs[index] = e.target.value;
                              setEditFormData(prev => ({ ...prev, specializations: newSpecs }));
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeSpecialization(index)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={newSpecialization}
                          onChange={(e) => setNewSpecialization(e.target.value)}
                          placeholder="Add new specialization"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addSpecialization}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Education */}
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Education</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addEducation}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add Education
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {editFormData.education.map((edu, index) => (
                        <Card key={index} className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <GraduationCapIcon className="w-5 h-5 text-blue-600" />
                                </div>
                                <h4 className="font-medium text-gray-900">Education {index + 1}</h4>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeEducation(index)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <MinusIcon className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                              <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                                placeholder="Degree/Certification"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                              />
                              <input
                                type="text"
                                value={edu.institution}
                                onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                                placeholder="Institution"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                              />
                              <input
                                type="text"
                                value={edu.period}
                                onChange={(e) => handleEducationChange(index, 'period', e.target.value)}
                                placeholder="Period (e.g., 2013 - 2017)"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setViewMode("profile")}
                    className="px-8 py-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-8 py-3"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Default profile view
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <SellerSidebar activePage="profile" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title="Profile" userType="seller" />

        {/* Profile Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6 mb-8">
              {/* Main Profile Card */}
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                        <UserIcon className="w-12 h-12 text-gray-600" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-bold text-gray-900">{profileData.firstName} {profileData.lastName}</h2>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {(user?.user_metadata as any)?.verification_status === 'verified' ? '🔵 Verified Professional' : '🔵 Pending Verification'}
                        </span>
                      </div>
                      
                      <p className="text-xl text-gray-600 mb-4">{profileData.title}</p>
                      
                      <div className="flex items-center gap-6 mb-4">
                        <div className="flex items-center gap-1">
                          {renderStars(Math.round(averageRating))}
                          <span className="ml-2 font-semibold text-gray-900">
                            {loadingReviews ? 'Loading...' : 
                             reviews.length > 0 ? 
                               `${averageRating.toFixed(1)} (${reviews.length} review${reviews.length === 1 ? '' : 's'})` : 
                               'No reviews yet'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <BriefcaseIcon className="w-4 h-4" />
                          <span>{experience.length > 0 ? `${experience.length} position${experience.length === 1 ? '' : 's'}` : 'Professional'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          Available Now
                        </span>
                        <span className="text-gray-600">Response within 2 hours</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setViewMode("public-view")}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <UserIcon className="w-4 h-4 mr-2" />
                        View Public Profile
                      </Button>
                      <Button
                        onClick={() => setViewMode("edit-profile")}
                        className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
                      >
                        <EditIcon className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>




              {/* Tabs Card */}
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardContent className="p-0">
                  <div className="border-b border-gray-200">
                    <nav className="flex">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.id
                              ? "border-blue-500 text-blue-600"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="p-8">
                    {renderTabContent()}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <MailIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{profileData.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <PhoneIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{profileData.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPinIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">Location not specified</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};