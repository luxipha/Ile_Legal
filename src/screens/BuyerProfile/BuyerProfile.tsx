import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Header } from "../../components/Header";
import { BuyerSidebar } from "../../components/BuyerSidebar/BuyerSidebar";
import { 
  UserIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  GraduationCapIcon,
  EditIcon,
  UploadIcon,
  MinusIcon,
  StarIcon,
  CheckCircleIcon,
  BuildingIcon,
  PlusIcon,
  BriefcaseIcon
} from "lucide-react";
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

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
  company: string;
  industry: string;
  about: string;
  interests: string[];
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

export const BuyerProfile = (): JSX.Element => {
  const { user, updateProfile, getUser, isLoading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("profile");
  const [activeTab, setActiveTab] = useState<"overview" | "experience" | "reviews" | "projects">("overview");
  const [newInterest, setNewInterest] = useState("");
  const [reviews, setReviews] = useState<Feedback[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [editFormData, setEditFormData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [myGigsAverageRating, setMyGigsAverageRating] = useState<number | null>(null);
  const [myGigsCount, setMyGigsCount] = useState<number>(0);
  const [loadingGigsRating, setLoadingGigsRating] = useState(false);

  // Map user/user_metadata to ProfileData
  const mapUserToProfileData = (userObj: any): ProfileData => {
    const meta = userObj?.user_metadata || {};
    // Try to get first/last name from user_metadata, else split user.name
    let firstName = meta.firstName || '';
    let lastName = meta.lastName || '';
    if ((!firstName || !lastName) && userObj?.name) {
      const parts = userObj.name.split(' ');
      firstName = firstName || parts[0] || '';
      lastName = lastName || parts.slice(1).join(' ') || '';
    }
    return {
      firstName,
      lastName,
      email: userObj.email || '',
      phone: meta.phone || '',
      company: meta.company || '',
      industry: meta.industry || '',
      about: meta.about || '',
      interests: Array.isArray(meta.interests) ? meta.interests : [],
      education: Array.isArray(meta.education) ? meta.education : [],
    };
  };

  // On mount, load user profile
  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      let freshUser = user;
      if (!user) {
        freshUser = await getUser();
      }
      if (freshUser) {
        const pd = mapUserToProfileData(freshUser);
        setProfileData(pd);
        setEditFormData(pd);
      }
      setLoadingProfile(false);
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch feedback data when component mounts or when reviews tab is active
  useEffect(() => {
    if (activeTab === "reviews") {
      fetchFeedback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "experience", label: "Experience" },
    { id: "reviews", label: "Reviews" },
    { id: "projects", label: "Projects" }
  ];

  // Notifications removed as they're not used in this component

  const experience = [
    {
      position: "CEO & Founder",
      company: profileData?.company || "",
      period: "2018 - Present",
      description: "Leading a team of 50+ professionals in developing premium residential and commercial properties across Lagos State."
    },
    {
      position: "Senior Project Manager",
      company: "Evergreen Estates",
      period: "2014 - 2018",
      description: "Managed large-scale residential developments with budgets exceeding ₦5 billion."
    }
  ];

  const projects = [
    {
      title: "Victoria Island Commercial Complex",
      date: "2024",
      status: "Completed",
      statusColor: "bg-green-100 text-green-800",
      value: "₦2.5B"
    },
    {
      title: "Lekki Residential Estate",
      date: "2023",
      status: "Completed",
      statusColor: "bg-green-100 text-green-800",
      value: "₦1.8B"
    },
    {
      title: "Ikoyi Mixed-Use Development",
      date: "2024",
      status: "In Progress",
      statusColor: "bg-blue-100 text-blue-800",
      value: "₦3.2B"
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => prev ? { ...prev, [name]: value } : prev);
  };

  const handleEducationChange = (index: number, field: keyof Education, value: string) => {
    setEditFormData(prev => prev ? {
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      )
    } : prev);
  };

  const addEducation = () => {
    setEditFormData(prev => prev ? {
      ...prev,
      education: [...prev.education, { degree: "", institution: "", period: "" }]
    } : prev);
  };

  const removeEducation = (index: number) => {
    setEditFormData(prev => prev ? {
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    } : prev);
  };

  const addInterest = () => {
    if (newInterest.trim()) {
      setEditFormData(prev => prev ? {
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      } : prev);
      setNewInterest("");
    }
  };

  const removeInterest = (index: number) => {
    setEditFormData(prev => prev ? {
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    } : prev);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    setSaving(true);
    try {
      // Compose user_metadata update
      const user_metadata: any = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        phone: editFormData.phone,
        company: editFormData.company,
        industry: editFormData.industry,
        about: editFormData.about,
        interests: editFormData.interests,
        education: editFormData.education,
      };
      await updateProfile({ user_metadata });
      // Refresh user/profileData
      const freshUser = await getUser();
      if (freshUser) {
        const pd = mapUserToProfileData(freshUser);
        setProfileData(pd);
        setEditFormData(pd);
      }
      setViewMode("profile");
    } catch (err) {
      // TODO: show error toast
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setSaving(true);
        await updateProfile({ profile_picture: file });
        // Refresh user/profileData
        const freshUser = await getUser();
        if (freshUser) {
          const pd = mapUserToProfileData(freshUser);
          setProfileData(pd);
          setEditFormData(pd);
        }
      } catch (err) {
        // TODO: show error toast
        console.error('Error uploading profile picture:', err);
      } finally {
        setSaving(false);
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Areas of Interest</h3>
              <div className="space-y-3">
                {profileData.interests.map((interest, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">{interest}</span>
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
              <h3 className="text-xl font-semibold text-gray-900">Professional Reviews</h3>
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
                            <h4 className="font-semibold text-gray-900">Legal Professional</h4>
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

      case "projects":
        return (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Projects</h3>
            <div className="space-y-4">
              {projects.map((project, index) => (
                <Card key={index} className="bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <BuildingIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{project.title}</h4>
                          <p className="text-sm text-gray-500">{project.date} • {project.value}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${project.statusColor}`}>
                        {project.status}
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

  // Fetch my gigs and their average rating
  useEffect(() => {
    const fetchGigsAndRatings = async () => {
      if (!user?.id) return;
      setLoadingGigsRating(true);
      try {
        // Only fetch completed gigs for the count
        const gigs = await api.gigs.getMyGigs(user.id, { status: 'completed' });
        setMyGigsCount(gigs.length);
        // For the average rating, use all feedback for the user
        const feedbacks = await api.feedback.getFeedbackForUser();
        if (!feedbacks || feedbacks.length === 0) {
          setMyGigsAverageRating(null);
        } else {
          const avg = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length;
          setMyGigsAverageRating(avg);
        }
      } catch (err) {
        setMyGigsAverageRating(null);
      } finally {
        setLoadingGigsRating(false);
      }
    };
    if (user?.id) fetchGigsAndRatings();
  }, [user]);

  if (authLoading || loadingProfile || !profileData || !editFormData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Loading profile...</div>
      </div>
    );
  }

  if (viewMode === "edit-profile") {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <BuyerSidebar activePage="profile" />

        {/* Main Content - Edit Profile */}
        <div className="flex-1 flex flex-col">
          <Header title="Edit Profile" userName={`${profileData.firstName} ${profileData.lastName}`} userType="buyer" />

          <main className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <Button
                variant="ghost"
                onClick={() => setViewMode("profile")}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
              >
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

                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company
                        </label>
                        <input
                          type="text"
                          name="company"
                          value={editFormData.company}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Industry
                        </label>
                        <input
                          type="text"
                          name="industry"
                          value={editFormData.industry}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                          required
                        />
                      </div>
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
                            disabled
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
                      placeholder="Tell us about your business and experience..."
                    />
                  </CardContent>
                </Card>

                {/* Areas of Interest */}
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Areas of Interest</h3>
                    <div className="space-y-3">
                      {editFormData.interests.map((interest, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <input
                            type="text"
                            value={interest}
                            onChange={(e) => {
                              const newInterests = [...editFormData.interests];
                              newInterests[index] = e.target.value;
                              setEditFormData(prev => prev ? { ...prev, interests: newInterests } : prev);
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeInterest(index)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          placeholder="Add new area of interest"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addInterest}
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
                                placeholder="Period (e.g., 2015 - 2017)"
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
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-8 py-3"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
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
      <BuyerSidebar activePage="profile" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title="Profile" userName={`${profileData.firstName} ${profileData.lastName}`} userType="buyer" />

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
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-bold text-gray-900">{profileData.firstName} {profileData.lastName}</h2>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          🔵 Verified Client
                        </span>
                      </div>
                      
                      <p className="text-xl text-gray-600 mb-2">{profileData.company}</p>
                      <p className="text-lg text-gray-500 mb-4">{profileData.industry}</p>
                      
                      <div className="flex items-center gap-6 mb-4">
                        <div className="flex items-center gap-1">
                          {loadingGigsRating ? (
                            <span className="text-gray-400">Loading...</span>
                          ) : (
                            renderStars(Math.round(myGigsAverageRating ?? 0))
                          )}
                          <span className="ml-2 font-semibold text-gray-900">
                            {loadingGigsRating
                              ? 'Loading...'
                              : myGigsAverageRating !== null
                                ? `${myGigsAverageRating.toFixed(1)} (${myGigsCount} completed gig${myGigsCount === 1 ? '' : 's'})`
                                : 'No reviewed gigs yet'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <BriefcaseIcon className="w-4 h-4" />
                          <span>{myGigsCount > 0 ? `${myGigsCount} completed project${myGigsCount === 1 ? '' : 's'}` : 'No completed projects yet'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          Active Client
                        </span>
                        <span className="text-gray-600">Member since 2020</span>
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
                      <span className="text-gray-700">Victoria Island, Lagos</span>
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