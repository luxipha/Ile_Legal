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
  BriefcaseIcon,
  BadgeCheckIcon,
  Badge,
  CreditCardIcon
} from "lucide-react";
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatUser } from '../../utils/formatters';

interface Education {
  degree: string;
  institution: string;
  period: string;
}

interface Experience {
  position: string;
  company: string;
  period: string;
  description: string;
}

interface Project {
  title: string;
  date: string;
  status: string;
  statusColor: string;
  value: string;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
  location: string;
  about: string;
  interests: string[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
  avatar_url?: string;
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

  // Map profile data from Profiles table to ProfileData
  const mapProfileToProfileData = (profileObj: any, userObj: any): ProfileData => {
    // Parse education from JSON if it exists (same as Profile.tsx)
    let education: Education[] = [];
    if (profileObj?.education) {
      try {
        // Parse JSON education data from Profiles table
        const educationData = typeof profileObj.education === 'string' 
          ? JSON.parse(profileObj.education) 
          : profileObj.education;
        education = Array.isArray(educationData) ? educationData : [];
      } catch (error) {
        console.error('Error parsing education data from Profiles table:', error);
        education = [];
      }
    }

    // Parse areas_of_interest from JSON if it exists (same as Profile.tsx specializations)
    let interests: string[] = [];
    if (profileObj?.areas_of_interest) {
      try {
        // Parse JSON areas_of_interest data from Profiles table
        const interestsData = typeof profileObj.areas_of_interest === 'string' 
          ? JSON.parse(profileObj.areas_of_interest) 
          : profileObj.areas_of_interest;
        interests = Array.isArray(interestsData) ? interestsData : [];
      } catch (error) {
        console.error('Error parsing areas_of_interest data from Profiles table:', error);
        interests = [];
      }
    }
    
    // Fallback to specializations if areas_of_interest is not available
    if (interests.length === 0 && profileObj?.specializations) {
      try {
        interests = typeof profileObj.specializations === 'string' 
          ? JSON.parse(profileObj.specializations) 
          : profileObj.specializations;
      } catch (error) {
        console.error('Error parsing specializations data:', error);
        interests = [];
      }
    }

    return {
      firstName: profileObj?.first_name || '',
      lastName: profileObj?.last_name || '',
      email: userObj?.email || '',
      phone: profileObj?.phone || '',
      company: profileObj?.professional_title || '', // Use professional_title as company
      industry: profileObj?.industry || '',
      location: profileObj?.location || '',
      about: profileObj?.bio || '',
      interests: interests,
      education: education,
      experience: [], // Not available in Profiles table
      projects: [], // Not available in Profiles table
      avatar_url: profileObj?.avatar_url || '',
    };
  };

  // On mount, load user profile
  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        let freshUser = user;
        if (!user) {
          freshUser = await getUser();
        }
        
        if (freshUser?.id) {
          // Load profile data from Profiles table
          const profileData = await api.metrics.getUserProfile(freshUser.id);
          const pd = mapProfileToProfileData(profileData, freshUser);
          setProfileData(pd);
          setEditFormData(pd);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        // Fallback to user metadata if profile data fails to load
        if (user) {
          const pd = mapProfileToProfileData(null, user);
          setProfileData(pd);
          setEditFormData(pd);
        }
      } finally {
        setLoadingProfile(false);
      }
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

  // Get professional experience from profileData (which is derived from user metadata)
  const experience = profileData?.experience || [];

  // Get recent projects from profileData (which is derived from user metadata)
  const projects = profileData?.projects || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => prev ? { ...prev, [name]: value } : prev);
  };

  const handleEducationChange = (index: number, field: keyof Education, value: string) => {
    setEditFormData(prev => prev ? ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }) : prev);
  };

  const addEducation = () => {
    setEditFormData(prev => prev ? ({
      ...prev,
      education: [...prev.education, { degree: "", institution: "", period: "" }]
    }) : prev);
  };

  const removeEducation = (index: number) => {
    setEditFormData(prev => prev ? ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }) : prev);
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
    if (!editFormData || !user?.id) return;
    setSaving(true);
    try {
      console.log('Starting profile update...');
      console.log('Edit form data:', editFormData);
      
      // Prepare profile data for updateProfile function
      const profileUpdateData = {
        first_name: editFormData.firstName,
        last_name: editFormData.lastName,
        phone: editFormData.phone,
        professional_title: editFormData.company,
        industry: editFormData.industry,
        location: editFormData.location,
        bio: editFormData.about,
        areas_of_interest: editFormData.interests, // Save to areas_of_interest field in Profiles table
        education: editFormData.education, // This will be saved to Profiles table JSON column
      };
      
      console.log('Calling updateProfile with data:', profileUpdateData);
      
      // Use updateProfile from AuthContext
      await updateProfile(profileUpdateData);
      
      console.log('Profile updated successfully');
      
      // Refresh profile data
      console.log('Refreshing profile data...');
      const freshProfileData = await api.metrics.getUserProfile(user.id);
      const pd = mapProfileToProfileData(freshProfileData, user);
      setProfileData(pd);
      setEditFormData(pd);
      
      setViewMode("profile");
      console.log('Profile save completed');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      alert(`Error saving profile: ${err?.message || err}`); // Temporary alert for debugging
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.id) {
      try {
        setSaving(true);
        
        // Use updateProfile from AuthContext with file upload
        await updateProfile({ profile_picture_file: file });
        
        // Refresh profile data
        const freshProfileData = await api.metrics.getUserProfile(user.id);
        const pd = mapProfileToProfileData(freshProfileData, user);
        setProfileData(pd);
        setEditFormData(pd);
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
              {experience.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No professional experience added yet</div>
                  <p className="text-sm text-gray-400 mt-2">Use the edit profile form to add your experience</p>
                </div>
              ) : (
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
              )}
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
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No projects added yet</div>
                <p className="text-sm text-gray-400 mt-2">Use the edit profile form to add your projects</p>
              </div>
            ) : (
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
            )}
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
          <Header title="Edit Profile" userType="buyer" />

          <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
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
                  <CardContent className="p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                      <div className="relative">
                        <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                          {profileData?.avatar_url ? (
                            <img 
                              src={profileData.avatar_url} 
                              alt={`${profileData.firstName} ${profileData.lastName}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to UserIcon if image fails to load
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <UserIcon className={`w-12 h-12 text-gray-600 ${profileData?.avatar_url ? 'hidden' : ''}`} />
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
                  <CardContent className="p-4 sm:p-6 lg:p-8">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Basic Information</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                            <MapPinIcon className="w-5 h-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="location"
                            value={editFormData.location}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent outline-none"
                            placeholder="Enter your location"
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                        {/* Empty div to maintain grid layout */}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* About */}
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-4 sm:p-6 lg:p-8">
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
                  <CardContent className="p-4 sm:p-6 lg:p-8">
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
                  <CardContent className="p-4 sm:p-6 lg:p-8">
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
                <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setViewMode("profile")}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828] px-6 sm:px-8 py-3"
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
        <Header title="Profile" userType="buyer" />

        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6 mb-8">
              {/* Main Profile Card */}
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    <div className="relative mx-auto sm:mx-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                        {profileData?.avatar_url ? (
                          <img 
                            src={profileData.avatar_url} 
                            alt={`${profileData.firstName} ${profileData.lastName}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to UserIcon if image fails to load
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <UserIcon className={`w-10 h-10 sm:w-12 sm:h-12 text-gray-600 ${profileData?.avatar_url ? 'hidden' : ''}`} />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{profileData.firstName} {profileData.lastName}</h2>
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          {/* Identity Verification Badge */}
                          <div title={(user?.user_metadata as any)?.verification_status === 'verified' ? "Verified Client" : "Pending Verification"}>
                            {(user?.user_metadata as any)?.verification_status === 'verified' ? (
                              <BadgeCheckIcon className="w-6 h-6 text-green-500" />
                            ) : (
                              <Badge className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          {/* Payment Verification Badge */}
                          <div title={(user?.user_metadata as any)?.payment_verified === true ? "Payment Method Verified" : "Payment Method Not Verified"}>
                            <CreditCardIcon className={`w-6 h-6 ${
                              (user?.user_metadata as any)?.payment_verified === true 
                                ? 'text-blue-500' 
                                : 'text-gray-400'
                            }`} />
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-lg sm:text-xl text-gray-600 mb-2">{profileData.company}</p>
                      <p className="text-base sm:text-lg text-gray-500 mb-4">{profileData.industry}</p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mb-4">
                        <div className="flex items-center gap-1 justify-center sm:justify-start">
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
                        <div className="flex items-center gap-2 text-gray-600 justify-center sm:justify-start">
                          <BriefcaseIcon className="w-4 h-4" />
                          <span className="text-sm sm:text-base">{myGigsCount > 0 ? `${myGigsCount} completed project${myGigsCount === 1 ? '' : 's'}` : 'No completed projects yet'}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-4">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          Active Client
                        </span>
                        <span className="text-gray-600 text-sm sm:text-base">New member</span>
                      </div>
                    </div>

                    <div className="flex justify-center sm:justify-start mt-4 sm:mt-0">
                      <Button
                        onClick={() => setViewMode("edit-profile")}
                        className="w-full sm:w-auto bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
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
                    <nav className="flex overflow-x-auto">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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

                  <div className="p-4 sm:p-6 lg:p-8">
                    {renderTabContent()}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Contact Information</h3>
                  
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
                      <span className="text-gray-700">
                        {profileData.location || "Location not specified"}
                      </span>
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