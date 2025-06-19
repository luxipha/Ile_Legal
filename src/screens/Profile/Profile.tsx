import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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

interface Feedback {
  id: number;
  rating: number;
  free_response: string;
  creator: string;
  recipient: string;
  gig_id: number;
  created_at: string;
}

type ViewMode = "profile" | "edit-profile";

export const Profile = (): JSX.Element => {
  const { user, getUser, updateProfile, uploadProfilePicture, logout } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("profile");
  const [activeTab, setActiveTab] = useState<"overview" | "experience" | "reviews" | "cases">("overview");
  const [newSpecialization, setNewSpecialization] = useState("");
  const [reviews, setReviews] = useState<Feedback[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [editFormData, setEditFormData] = useState<ProfileData | null>(null);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch user profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const u = user || (await getUser());
        if (!u) return;
        // Parse name into first/last
        const [firstName, ...rest] = (u.name || '').split(' ');
        const lastName = rest.join(' ');
        // Get education and specializations from user_metadata with type checks
        const education = Array.isArray((u.user_metadata as any)?.education) ? (u.user_metadata as any).education : [];
        const specializations = Array.isArray((u.user_metadata as any)?.specializations) ? (u.user_metadata as any).specializations : [];
        setProfilePicUrl((u.user_metadata as any)?.profile_picture || null);
        const profile: ProfileData = {
          firstName: firstName || '',
          lastName: lastName || '',
          email: u.email,
          phone: (u.user_metadata as any)?.phone || '',
          title: (u.user_metadata as any)?.title || '',
          about: (u.user_metadata as any)?.about || '',
          specializations: specializations,
          education: education,
        };
        setProfileData(profile);
        setEditFormData(profile);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [user]);

  // Fetch feedback data when component mounts or when reviews tab is active
  useEffect(() => {
    if (activeTab === "reviews") {
      fetchFeedback();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchFeedback = async () => {
    setLoadingReviews(true);
    try {
      const feedbackData = await api.feedback.getFeedbackForUser();
      setReviews(feedbackData);
      // Calculate average rating
      if (feedbackData.length > 0) {
        const totalRating = feedbackData.reduce((sum, feedback) => sum + feedback.rating, 0);
        setAverageRating(totalRating / feedbackData.length);
      } else {
        setAverageRating(0);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "experience", label: "Experience" },
    { id: "reviews", label: "Reviews" },
    { id: "cases", label: "Cases" }
  ];

  // Experience and cases can remain static or be made dynamic if needed
  const experience = [
    {
      position: "Senior Associate",
      company: "Adebayo & Partners Law Firm",
      period: "2020 - Present",
      description: "Leading property law practice with focus on high-value transactions and complex title issues."
    },
    {
      position: "Associate",
      company: "Lagos Property Law Chambers",
      period: "2018 - 2020",
      description: "Handled residential and commercial property transactions, contract reviews, and title verifications."
    }
  ];

  const cases = [
    {
      title: "Property Purchase",
      date: "Mar 2024",
      status: "Completed",
      statusColor: "bg-green-100 text-green-800"
    },
    {
      title: "Contract Review",
      date: "Feb 2024",
      status: "Completed",
      statusColor: "bg-green-100 text-green-800"
    },
    {
      title: "Title Verification",
      date: "Apr 2024",
      status: "In Progress",
      statusColor: "bg-blue-100 text-blue-800"
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editFormData) return;
    const { name, value } = e.target;
    setEditFormData(prev => prev ? { ...prev, [name]: value } : prev);
  };

  const handleEducationChange = (index: number, field: keyof Education, value: string) => {
    if (!editFormData) return;
    setEditFormData(prev => prev ? {
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    } : prev);
  };

  const addEducation = () => {
    if (!editFormData) return;
    setEditFormData(prev => prev ? {
      ...prev,
      education: [...prev.education, { degree: "", institution: "", period: "" }]
    } : prev);
  };

  const removeEducation = (index: number) => {
    if (!editFormData) return;
    setEditFormData(prev => prev ? {
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    } : prev);
  };

  const addSpecialization = () => {
    if (!editFormData) return;
    if (newSpecialization.trim()) {
      setEditFormData(prev => prev ? {
        ...prev,
        specializations: [...prev.specializations, newSpecialization.trim()]
      } : prev);
      setNewSpecialization("");
    }
  };

  const removeSpecialization = (index: number) => {
    if (!editFormData) return;
    setEditFormData(prev => prev ? {
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index)
    } : prev);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    // Compose name
    const name = `${editFormData.firstName} ${editFormData.lastName}`.trim();
    // Prepare user_metadata
    const user_metadata: any = {
      phone: editFormData.phone,
      title: editFormData.title,
      about: editFormData.about,
      specializations: editFormData.specializations,
      education: editFormData.education,
    };
    // Handle profile picture upload if changed
    if (profilePicFile) {
      const url = await uploadProfilePicture(profilePicFile);
      user_metadata.profile_picture = url;
      setProfilePicUrl(url);
    }
    await updateProfile({
      name,
      email: editFormData.email,
      user_metadata,
    });
    setProfileData(editFormData);
    setViewMode("profile");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicFile(file);
      setProfilePicUrl(URL.createObjectURL(file));
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
    if (!profileData) return null;
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
                {experience.map((exp, index) => (
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
                  {averageRating > 0 ? `${averageRating.toFixed(1)} (${reviews.length} reviews)` : "No reviews yet"}
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
                        <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
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
          </div>
        );
      default:
        return null;
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Loading profile...</div>
      </div>
    );
  }

  if (viewMode === "edit-profile" && editFormData) {
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
                <div className="text-sm font-medium">{editFormData.firstName} {editFormData.lastName}</div>
                <div className="text-xs text-gray-400">{editFormData.email}</div>
              </div>
            </div>
          </div>
        </div>
        {/* Main Content - Edit Profile */}
        <div className="flex-1 flex flex-col">
          <Header title="Edit Profile" userName={`${editFormData.firstName} ${editFormData.lastName}`} userType="seller" />
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
                        <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                          {profilePicUrl ? (
                            <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <UserIcon className="w-12 h-12 text-gray-600" />
                          )}
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
                              setEditFormData(prev => prev ? { ...prev, specializations: newSpecs } : prev);
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
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
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
  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">No profile data found.</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <SellerSidebar activePage="profile" />
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title="Profile" userName={`${profileData.firstName} ${profileData.lastName}`} userType="seller" />
        {/* Profile Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6 mb-8">
              {/* Main Profile Card */}
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                        {profilePicUrl ? (
                          <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <UserIcon className="w-12 h-12 text-gray-600" />
                        )}
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-bold text-gray-900">{profileData.firstName} {profileData.lastName}</h2>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          🔵 Verified Professional
                        </span>
                      </div>
                      <p className="text-xl text-gray-600 mb-4">{profileData.title}</p>
                      <div className="flex items-center gap-6 mb-4">
                        <div className="flex items-center gap-1">
                          {renderStars(Math.round(averageRating))}
                          <span className="ml-2 font-semibold text-gray-900">
                            {averageRating > 0 ? `${averageRating.toFixed(1)} (${reviews.length} reviews)` : 'No reviews yet'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <BriefcaseIcon className="w-4 h-4" />
                          <span>8+ years experience</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          Available Now
                        </span>
                        <span className="text-gray-600">Response within 2 hours</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setViewMode("edit-profile")}
                      className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
                    >
                      <EditIcon className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
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
                      <span className="text-gray-700">455 Lekki Phase 1, Lagos</span>
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