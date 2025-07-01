import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate, formatUser } from '../../utils/formatters';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
// Tabs are implemented manually with buttons instead of the Tabs component
import { 
  Star, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Award, 
  Users, 
  Shield, 
  Wallet,
  ArrowLeftIcon,
  QrCodeIcon
} from 'lucide-react';
import { Header } from '../../components/Header/Header';
import { SellerSidebar } from '../../components/SellerSidebar/SellerSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { QRCodeGenerator } from '../../components/QRCodeGenerator';
import { BadgeCollection } from '../../components/badges';
import { reputationService } from '../../services/reputationService';
import { EarnedBadge } from '../../components/badges';

interface LawyerProfileViewProps {
  isOwnProfile?: boolean;
  onBack?: () => void;
}

const LawyerProfileView: React.FC<LawyerProfileViewProps> = ({ isOwnProfile = false, onBack }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [userStats, setUserStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [completedGigs, setCompletedGigs] = useState(0);
  const [projectsData, setProjectsData] = useState<any[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [currentTierBadge, setCurrentTierBadge] = useState<EarnedBadge | null>(null);
  const [loadingBadges, setLoadingBadges] = useState(true);

  // Extract real user data from auth context and user metadata
  const userMetadata = user?.user_metadata as Record<string, any> || {};
  const profileData = userMetadata.profile_data ? JSON.parse(userMetadata.profile_data as string) : {};

  // Load user statistics and reviews from API
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;
      
      try {
        setLoadingStats(true);
        setLoadingReviews(true);

        // Only load feedback data if it's the user's own profile
        if (isOwnProfile) {
          try {
            const feedbackData = await api.feedback.getFeedbackForUser();
            setReviews(feedbackData);
            if (feedbackData.length > 0) {
              const totalRating = feedbackData.reduce((sum: number, feedback: any) => sum + feedback.rating, 0);
              setAverageRating(totalRating / feedbackData.length);
            }
          } catch (feedbackError) {
            console.log('Could not load feedback data:', feedbackError);
            setReviews([]);
            setAverageRating(0);
          }

          // Load completed gigs count and projects data for own profile
          try {
            const gigs = await api.gigs.getMyGigs(user.id, { status: 'completed' });
            setCompletedGigs(gigs.length);
            
            // Transform gigs data for projects display
            const projectsForDisplay = gigs.map((gig: any) => ({
              title: gig.title || 'Legal Service',
              type: gig.category || 'Legal Service',
              value: formatCurrency.naira(gig.budget, 'N/A'),
              status: 'Completed',
              date: formatDate.short(gig.created_at)
            }));
            setProjectsData(projectsForDisplay);
          } catch (gigsError) {
            console.log('Could not load gigs data:', gigsError);
            setCompletedGigs(0);
            setProjectsData([]);
          }
        }

        // Try to load stats from API
        try {
          const stats = await api.metrics.getUserStats(user.id);
          setUserStats(stats);
        } catch (statsError) {
          console.log('Could not load stats:', statsError);
        }

        // Load user badges
        try {
          setLoadingBadges(true);
          const badgeData = await reputationService.getUserBadges(user.id);
          setEarnedBadges(badgeData.earned);
          setCurrentTierBadge(badgeData.currentTier);
        } catch (badgeError) {
          console.log('Could not load badges:', badgeError);
          setEarnedBadges([]);
          setCurrentTierBadge(null);
        } finally {
          setLoadingBadges(false);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
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
        setLoadingReviews(false);
      }
    };

    loadUserData();
  }, [user?.id, isOwnProfile]);
  
  const lawyerData = {
    name: formatUser.displayName(user, "Legal Professional"),
    title: profileData?.title || (userMetadata.user_type === 'seller' ? 'Legal Professional' : 'Legal Practitioner'),
    location: profileData?.location || userMetadata?.location || "Location not specified",
    rating: averageRating,
    totalReviews: reviews.length,
    completedTasks: completedGigs,
    yearsExperience: profileData?.yearsExperience || 5,
    specializations: userMetadata?.specializations || [],
    verificationAccuracy: userStats?.verificationAccuracy || "N/A",
    avgCompletionTime: userStats?.averageCompletionTime || "N/A",
    responseTime: userStats?.averageResponseTime || "N/A",
    avatar: formatUser.avatar(user, 128),
    walletAddress: profileData?.walletAddress || "Not connected",
    verified: profileData?.verified || false,
    bio: profileData?.bio || userMetadata?.about || "",
    education: userMetadata?.education || [],
    certifications: userMetadata?.certifications || []
  };

  // Calculate dynamic badges based on real achievements
  const dynamicBadges = (() => {
    const badges = [];
    
    if (lawyerData.rating >= 4.5) {
      badges.push({ name: "Top Performer", color: "bg-yellow-100 text-yellow-800", icon: Award });
    }
    
    if (userMetadata?.verification_status === 'verified') {
      badges.push({ name: "Verified Pro", color: "bg-purple-100 text-purple-800", icon: Shield });
    }
    
    if (userStats?.averageResponseTime && userStats.averageResponseTime.includes('min')) {
      badges.push({ name: "Quick Responder", color: "bg-green-100 text-green-800", icon: CheckCircle });
    }
    
    if (userMetadata?.wallet_connected || userMetadata?.eth_address) {
      badges.push({ name: "Web3 Expert", color: "bg-blue-100 text-blue-800", icon: Wallet });
    }
    
    // Default badge if no achievements yet
    if (badges.length === 0) {
      badges.push({ name: "New Member", color: "bg-gray-100 text-gray-800", icon: Users });
    }
    
    return badges;
  })();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - only show if it's own profile */}
      {isOwnProfile && <SellerSidebar activePage="profile" />}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${!isOwnProfile ? 'ml-0' : ''}`}>
        <Header 
          title={isOwnProfile ? "Public Profile View" : "Lawyer Profile"} 
          userType="seller" 
        />

        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Back button for own profile view */}
            {isOwnProfile && (
              <Button
                variant="ghost"
                onClick={() => onBack ? onBack() : navigate(-1)}
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
                          src={lawyerData.avatar}
                          alt={lawyerData.name}
                          className="w-32 h-32 rounded-full border-4 border-purple-200 shadow-lg"
                        />
                        {lawyerData.verified && (
                          <div className="absolute -bottom-2 -right-2 bg-purple-500 rounded-full p-2">
                            <Shield className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-purple-600">
                        <Wallet className="w-4 h-4" />
                        <span className="text-sm font-mono">{lawyerData.walletAddress}</span>
                      </div>
                    </div>

                    {/* Main Profile Info */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900">{lawyerData.name}</h1>
                        <p className="text-xl text-purple-600 font-medium">{lawyerData.title}</p>
                        <div className="flex items-center gap-2 text-gray-600 mt-2">
                          <MapPin className="w-4 h-4" />
                          <span>{lawyerData.location}</span>
                        </div>
                      </div>

                      {/* Rating & Stats */}
                      <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 ${
                                  i < Math.floor(lawyerData.rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold">{lawyerData.rating}</span>
                          <span className="text-gray-600">({lawyerData.totalReviews} reviews)</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{lawyerData.completedTasks} tasks completed</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{lawyerData.yearsExperience} years experience</span>
                        </div>
                      </div>

                      {/* Professional Reputation */}
                      <div className="flex flex-col gap-3">
                        {/* Current Tier Badge - Prominently displayed */}
                        {!loadingBadges && currentTierBadge && (
                          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                            <div className="flex-shrink-0">
                              <BadgeCollection 
                                badges={[currentTierBadge]} 
                                maxVisible={1} 
                                size="md" 
                                showTooltip={false}
                              />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{currentTierBadge.name}</div>
                              <div className="text-sm text-gray-600">{currentTierBadge.description}</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Achievement & Quality Badges */}
                        {!loadingBadges && earnedBadges.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Achievements & Credentials</h4>
                            <BadgeCollection 
                              badges={earnedBadges.filter(badge => badge.type !== 'reputation')} 
                              maxVisible={5} 
                              size="sm" 
                              className="justify-start"
                            />
                          </div>
                        )}
                        
                        {/* Legacy badges for fallback */}
                        {(loadingBadges || earnedBadges.length === 0) && (
                          <div className="flex flex-wrap gap-2">
                            {dynamicBadges.map((badge: any, index: number) => {
                              const IconComponent = badge.icon;
                              return (
                                <span
                                  key={index}
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
                                >
                                  <IconComponent className="w-3 h-3 mr-1" />
                                  {badge.name}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-purple-50 to-yellow-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {loadingStats ? "..." : lawyerData.verificationAccuracy}
                          </div>
                          <div className="text-sm text-gray-600">Verification Accuracy</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {loadingStats ? "..." : lawyerData.responseTime}
                          </div>
                          <div className="text-sm text-gray-600">Response Time</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {loadingStats ? "..." : lawyerData.avgCompletionTime}
                          </div>
                          <div className="text-sm text-gray-600">Avg. Completion Time</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 lg:w-48">
                      {isOwnProfile && (
                        <>
                          {/* <Button 
                            variant="outline" 
                            className="border-purple-300 text-purple-700 hover:bg-purple-50"
                            onClick={() => navigate('/profile')}
                          >
                            Edit Profile
                          </Button> */}
                          <Button 
                            variant="outline" 
                            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 flex items-center gap-2"
                            onClick={() => setActiveTab('qr-code')}
                          >
                            <QrCodeIcon className="w-4 h-4" />
                            Share Profile
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs Section */}
              <div className="mt-8">
                {/* Tabs Navigation */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="flex">
                    {['overview', 'reviews', 'projects', 'credentials', 'qr-code'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-12 py-4 text-sm font-medium border-b-2 ${
                          activeTab === tab
                            ? 'border-purple-600 text-purple-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab === 'qr-code' ? (
                          <span className="flex items-center gap-2">
                            <QrCodeIcon className="w-4 h-4" />
                            QR Code
                          </span>
                        ) : (
                          tab.charAt(0).toUpperCase() + tab.slice(1)
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {activeTab === 'overview' && (
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* About Card */}
                      <Card className="bg-white border border-gray-100 shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">About</h3>
                          <p className="text-gray-700 leading-relaxed mb-6">{lawyerData.bio}</p>
                          
                          <div>
                            <h4 className="font-semibold mb-3">Specializations</h4>
                            <div className="flex flex-wrap gap-2">
                              {lawyerData.specializations.map((spec: string, index: number) => (
                                <span 
                                  key={index} 
                                  className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium"
                                >
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Task Distribution Card */}
                      <Card className="bg-white border border-gray-100 shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">Task Distribution</h3>
                          <div className="space-y-4">
                            {completedGigs > 0 ? (
                              <div className="text-center py-4">
                                <div className="text-2xl font-bold text-gray-900">{completedGigs}</div>
                                <div className="text-gray-600">Completed Tasks</div>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                No task distribution data available yet
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Client Reviews</h3>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(lawyerData.rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-lg font-semibold text-gray-900">
                            {lawyerData.rating} out of 5 ({lawyerData.totalReviews} reviews)
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
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {reviews.map((review, index) => (
                            <Card key={review.id || index} className="border border-gray-200 hover:shadow-lg transition-shadow">
                              <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                    <Users className="w-6 h-6 text-gray-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">Client</h4>
                                    <p className="text-sm text-gray-600">Legal Service</p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-4 h-4 ${
                                          i < review.rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-gray-700 leading-relaxed mb-3">{review.free_response}</p>
                                <div className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString()}</div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'projects' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Projects</h3>
                      {projectsData.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-500">No completed projects yet</div>
                          <p className="text-sm text-gray-400 mt-2">Your completed gigs will appear here</p>
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                          {projectsData.map((project, index) => (
                          <div key={index} className="p-4 border border-purple-100 rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-gray-900">{project.title}</h4>
                              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {project.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{project.type}</p>
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-yellow-600">{project.value}</span>
                              <span className="text-gray-500">{project.date}</span>
                            </div>
                          </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'credentials' && (
                    <div className="space-y-8">

                      {/* Projects Completed Section */}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">Projects Completed</h3>
                        <div className="grid md:grid-cols-3 gap-6">
                          <Card className="bg-white border border-gray-100 shadow-sm">
                            <CardContent className="p-6 text-center">
                              <div className="text-3xl font-bold text-orange-600 mb-2">{completedGigs}</div>
                              <div className="text-sm text-gray-600">Projects Completed</div>
                            </CardContent>
                          </Card>

                          <Card className="bg-white border border-gray-100 shadow-sm">
                            <CardContent className="p-6 text-center">
                              <div className="text-3xl font-bold text-green-600 mb-2">
                                {loadingStats ? "..." : (userStats?.completionRate || "N/A")}
                              </div>
                              <div className="text-sm text-gray-600">Completion Rate</div>
                            </CardContent>
                          </Card>

                          <Card className="bg-white border border-gray-100 shadow-sm">
                            <CardContent className="p-6 text-center">
                              <div className="text-3xl font-bold text-purple-600 mb-2">
                                {loadingStats ? "..." : (userStats?.lifetimeValue || "₦0")}
                              </div>
                              <div className="text-sm text-gray-600">Lifetime Value</div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Education Card */}
                        <Card className="bg-white border border-gray-100 shadow-sm">
                          <CardContent className="p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Education</h3>
                            <div className="space-y-6">
                              {lawyerData.education.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">
                                  No education information added yet
                                </div>
                              ) : (
                                lawyerData.education.map((edu: any, index: number) => (
                                  <div key={index} className="pb-4 last:border-0">
                                    <div className="flex justify-between items-center">
                                      <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                                      <span className="text-purple-600">{edu.year}</span>
                                    </div>
                                    <p className="text-gray-600">{edu.school}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Certifications Card */}
                        <Card className="bg-white border border-gray-100 shadow-sm">
                          <CardContent className="p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Certifications</h3>
                            <div className="space-y-4">
                              {lawyerData.certifications.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">
                                  No certifications added yet
                                </div>
                              ) : (
                                lawyerData.certifications.map((cert: string, index: number) => (
                                  <div key={index} className="flex items-start">
                                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">{cert}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                    </div>
                  )}

                  {activeTab === 'qr-code' && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-2">Share Your Profile</h3>
                        <p className="text-gray-600">Generate a QR code to easily share your legal profile with clients</p>
                      </div>
                      
                      <div className="max-w-md mx-auto">
                        <QRCodeGenerator
                          url={`${window.location.origin}/profile/${user?.id}`}
                          title="Legal Profile QR Code"
                          description="Scan to view this lawyer's public profile"
                          size={250}
                        />
                      </div>
                      
                      {/* Additional sharing options */}
                      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Professional Sharing</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-white rounded border">
                            <span className="text-sm text-gray-700">Public Profile URL</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const url = `${window.location.origin}/public-profile?id=${user?.id}`;
                                navigator.clipboard.writeText(url);
                              }}
                            >
                              Copy Link
                            </Button>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white rounded border">
                            <span className="text-sm text-gray-700">Business Card QR</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // This would trigger a download of a business card format
                                alert('Business card download feature coming soon!');
                              }}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LawyerProfileView;
