import React, { useState, useEffect } from 'react';
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { BuyerSidebar } from "../../components/BuyerSidebar/BuyerSidebar";
import { 
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  StarIcon,
  CheckCircleIcon,
  BuildingIcon,
  BriefcaseIcon,
  Award,
  Shield,
  Wallet,
  ArrowLeftIcon
} from "lucide-react";
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

interface ClientProfileViewProps {
  isOwnProfile?: boolean;
  onBack?: () => void;
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

interface Review {
  id: number;
  lawyerName: string;
  lawyerAvatar: string;
  rating: number;
  date: string;
  comment: string;
  taskType: string;
}

interface Project {
  title: string;
  type: string;
  budget: string;
  status?: string;
  lawyer: string;
  deadline?: string;
  completedDate?: string;
  rating?: number;
}

interface Gig {
  id: string;
  title: string;
  budget?: number;
  user_id: string;
  seller_id?: string;
  lawyer_name?: string;
  seller_name?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  deadline: string;
  categories: string[];
  rating?: number;
}

const ClientProfileView: React.FC<ClientProfileViewProps> = ({ isOwnProfile = false, onBack }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for real data from API
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [userStats, setUserStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Extract profile data from user metadata - handle type safely
  const userMetadata = user?.user_metadata as Record<string, any> || {};
  const profileData = userMetadata.profile_data ? JSON.parse(userMetadata.profile_data as string) : {};
  
  // Client data - mix of real user data and calculated stats
  const clientData = {
    name: user?.name || profileData?.name || "Client",
    title: profileData?.title || "Legal Client",
    company: profileData?.company || (user?.user_metadata as any)?.company || "",
    location: profileData?.location || "",
    rating: averageRating || 0,
    totalReviews: reviews.length || 0,
    projectsPosted: activeProjects.length + completedProjects.length || 0,
    completedProjects: completedProjects.length || 0,
    memberSince: userStats?.memberSince || new Date().getFullYear().toString(),
    avatar: profileData?.avatar || (userMetadata.avatar_url as string) || "",
    walletAddress: profileData?.walletAddress || "",
    verified: profileData?.verified || false,
    bio: profileData?.bio || (user?.user_metadata as any)?.about || "No bio available",
    projectTypes: profileData?.projectTypes || [],
    averageBudget: profileData?.averageBudget || "Not specified",
    responseTime: userStats?.averageResponseTime || "Not specified",
    paymentReliability: profileData?.paymentReliability || 0,
    badges: [
      { name: "Client", color: "bg-yellow-100 text-yellow-800", icon: Award },
      ...(profileData?.verified ? [{ name: "Verified", color: "bg-purple-100 text-purple-800", icon: Shield }] : []),
      ...(profileData?.fastPayer ? [{ name: "Fast Payer", color: "bg-green-100 text-green-800", icon: CheckCircleIcon }] : [])
    ]
  };

  // Load real feedback data
  useEffect(() => {
    const loadReviews = async () => {
      if (!user) {
        console.log('No user available for reviews');
        return;
      }
      
      console.log('Loading reviews for current user');
      setLoadingReviews(true);
      try {
        // getFeedbackForUser uses the currently logged-in user
        const feedbackData: Feedback[] = await api.feedback.getFeedbackForUser();
        console.log('Feedback data received:', feedbackData);
        
        // Convert feedback to review format
        const formattedReviews: Review[] = feedbackData.map((feedback) => ({
          id: feedback.id,
          lawyerName: feedback.creator || "Legal Professional",
          lawyerAvatar: "LP", // Could be enhanced with real avatars
          rating: feedback.rating,
          date: feedback.created_at,
          comment: feedback.free_response,
          taskType: "Legal Service"
        }));
        
        setReviews(formattedReviews);
        
        // Calculate average rating
        if (feedbackData.length > 0) {
          const totalRating = feedbackData.reduce((sum, feedback) => sum + feedback.rating, 0);
          setAverageRating(totalRating / feedbackData.length);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        // Fallback to empty array
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    loadReviews();
  }, [user?.id]);

  // Load real projects data
  useEffect(() => {
    const loadProjects = async () => {
      if (!user) {
        console.log('No user available for projects');
        return;
      }
      
      console.log('Loading projects for current user');
      setLoadingProjects(true);
      try {
        // getMyGigs requires a user ID parameter
        const gigs: Gig[] = await api.gigs.getMyGigs(user.id);
        console.log('Gigs data received:', gigs);
        
        const active: Project[] = [];
        const completed: Project[] = [];
        
        gigs.forEach((gig) => {
          // Format the budget with proper currency formatting
          const formattedBudget = gig.budget ? 
            new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(gig.budget) : 
            'Not specified';
            
          // Create project object from gig data
          const project: Project = {
            title: gig.title || 'Untitled Project',
            type: gig.categories?.length > 0 ? gig.categories[0] : "Legal Service",
            budget: formattedBudget,
            lawyer: gig.lawyer_name || gig.seller_name || "Legal Professional",
            deadline: gig.deadline ? new Date(gig.deadline).toLocaleDateString() : 'No deadline',
            completedDate: gig.status === 'completed' && gig.updated_at ? 
              new Date(gig.updated_at).toLocaleDateString() : 
              undefined,
            status: gig.status || 'unknown',
            rating: gig.rating || 0 // Use actual rating if available
          };
          
          if (gig.status?.toLowerCase() === 'active' || gig.status?.toLowerCase() === 'in progress') {
            active.push(project);
          } else if (gig.status?.toLowerCase() === 'completed') {
            completed.push(project);
          }
        });
        
        setActiveProjects(active);
        setCompletedProjects(completed);
      } catch (error) {
        console.error('Error fetching projects:', error);
        // Fallback to empty arrays
        setActiveProjects([]);
        setCompletedProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [user?.id]);

  // Load user statistics from API
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user?.id) return;
      
      try {
        setLoadingStats(true);
        const stats = await api.metrics.getUserStats(user.id);
        setUserStats(stats);
      } catch (error) {
        console.error('Error loading user stats:', error);
        // Fallback to default values
        setUserStats({
          averageCompletionTime: "N/A",
          memberSince: new Date().getFullYear().toString(),
          verificationAccuracy: "N/A",
          completionRate: "N/A",
          averageResponseTime: "N/A",
          activeClientStatus: "Unknown",
          lifetimeValue: "₦0"
        });
      } finally {
        setLoadingStats(false);
      }
    };

    loadUserStats();
  }, [user?.id]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index: number) => (
      <StarIcon
        key={index}
        className={`w-4 h-4 ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill={index < rating ? 'currentColor' : 'none'}
      />
    ));
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
    { id: "reviews", label: "Reviews" },
    { id: "projects", label: "Projects" },
    { id: "credentials", label: "History" }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="grid md:grid-cols-2 gap-6">
            {/* About Card */}
            <Card className="bg-white border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">About</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {clientData.bio}
                </p>
                
                <div>
                  <h4 className="font-semibold mb-3">Project Types</h4>
                  {clientData.projectTypes.length === 0 ? (
                    <p className="text-gray-500 text-sm">No project types specified</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {clientData.projectTypes.map((type: string, index: number) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="bg-white border border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Client Stats</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Average Budget</span>
                      <span className="text-gray-600">{clientData.averageBudget}</span>
                    </div>
                    {clientData.averageBudget !== "Not specified" && (
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600" style={{ width: '75%' }}></div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Response Time</span>
                      <span className="text-gray-600">{clientData.responseTime}</span>
                    </div>
                    {clientData.responseTime !== "Not specified" && (
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600" style={{ width: '90%' }}></div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Payment Reliability</span>
                      <span className="text-gray-600">{clientData.paymentReliability > 0 ? `${clientData.paymentReliability}%` : "Not available"}</span>
                    </div>
                    {clientData.paymentReliability > 0 && (
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600" style={{ width: `${clientData.paymentReliability}%` }}></div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "reviews":
        return (
          <div>
            {loadingReviews ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No reviews yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((review) => (
                  <Card key={review.id} className="bg-white border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                          {review.lawyerAvatar}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{review.lawyerName}</h4>
                          <p className="text-sm text-gray-500">{review.taskType}</p>
                          <div className="flex mt-1">{renderStars(review.rating)}</div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed mb-3">{review.comment}</p>
                      <p className="text-xs text-gray-400">{formatDate(review.date)}</p>
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
            {loadingProjects ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading projects...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Completed Projects */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Completed Projects</h3>
                  {completedProjects.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No completed projects yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {completedProjects.map((project, index) => (
                        <Card key={index} className="bg-white border border-gray-200">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{project.title}</h4>
                                  <p className="text-sm text-gray-500">
                                    {project.type} • {project.budget} • Lawyer: {project.lawyer}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex">{renderStars(project.rating || 0)}</div>
                                <p className="text-sm text-gray-500 mt-1">Completed: {project.completedDate}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column - Active Projects */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Active Projects</h3>
                  {activeProjects.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No active projects</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeProjects.map((project, index) => (
                        <Card key={index} className="bg-white border border-gray-200">
                          <CardContent className="p-6">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-gray-900">{project.title}</h4>
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                  {project.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">{project.type}</p>
                              <p className="text-lg font-semibold text-green-600">{project.budget}</p>
                              <p className="text-sm text-purple-600">Lawyer: {project.lawyer}</p>
                              <p className="text-sm text-gray-500">Deadline: {project.deadline}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case "credentials":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">{clientData.projectsPosted}</div>
                <div className="text-sm text-gray-600">Projects Posted</div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {loadingStats ? "..." : (userStats?.completionRate || "N/A")}
                </div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {loadingStats ? "..." : (userStats?.lifetimeValue || "₦0")}
                </div>
                <div className="text-sm text-gray-600">Lifetime Value</div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - only show if it's own profile */}
      {isOwnProfile && <BuyerSidebar activePage="profile" />}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${!isOwnProfile ? 'ml-0' : ''}`}>
        <Header 
          title={isOwnProfile ? "Public Profile View" : "Client Profile"} 
          userType="buyer" 
        />

        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Back button for own profile view */}
            {isOwnProfile && (
              <Button
                variant="ghost"
                onClick={() => onBack ? onBack() : navigate('/buyer-profile')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Profile
              </Button>
            )}

            <div className="space-y-6">
              {/* Header Section */}
              <Card className="border-0 shadow-xl bg-white">
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Profile Image & Basic Info */}
                    <div className="flex flex-col items-center lg:items-start space-y-4">
                      <div className="relative">
                        <img
                          src={clientData.avatar}
                          alt={clientData.name}
                          className="w-32 h-32 rounded-full border-4 border-yellow-200 shadow-lg"
                        />
                        {clientData.verified && (
                          <div className="absolute -bottom-2 -right-2 bg-yellow-500 rounded-full p-2">
                            <Shield className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-yellow-600">
                        <Wallet className="w-4 h-4" />
                        <span className="text-sm font-mono">{clientData.walletAddress}</span>
                      </div>
                    </div>

                    {/* Main Profile Info */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900">{clientData.name}</h1>
                        <p className="text-xl text-yellow-600 font-medium">{clientData.title}</p>
                        <div className="flex items-center gap-2 text-gray-600 mt-1">
                          <BuildingIcon className="w-4 h-4" />
                          <span>{clientData.company}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 mt-1">
                          <MapPinIcon className="w-4 h-4" />
                          <span>{clientData.location}</span>
                        </div>
                      </div>

                      {/* Rating & Stats */}
                      <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {renderStars(Math.round(clientData.rating))}
                          </div>
                          <span className="text-lg font-semibold text-gray-900">
                            {clientData.rating.toFixed(1)} ({clientData.totalReviews} reviews)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <BriefcaseIcon className="w-4 h-4" />
                          <span>{clientData.completedProjects} completed projects</span>
                        </div>
                      </div>

                      {/* Status & Member Since */}
                      <div className="flex items-center gap-4">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          Active Client
                        </span>
                        <span className="text-gray-600">Member since {clientData.memberSince}</span>
                      </div>
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
                          onClick={() => setActiveTab(tab.id)}
                          className={`px-12 py-4 text-sm font-medium border-b-2 ${activeTab === tab.id
                            ? 'border-purple-600 text-purple-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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

              {/* Contact Information Card - only show for public view */}
              {!isOwnProfile && (
                <Card className="bg-white border border-gray-200 shadow-lg">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <MailIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">Available through platform messaging</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <PhoneIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">Contact via project proposals</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPinIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">{clientData.location}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientProfileView;