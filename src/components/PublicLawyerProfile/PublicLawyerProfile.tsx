import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  CheckCircle,
  Award,
  GraduationCap,
  Briefcase,
  MessageSquare,
  Clock,
  Users,
  FileText,
  Shield,
  ExternalLink,
  QrCode,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
// import { BadgeCollection, EarnedBadge } from '../badges';
// import { reputationService } from '../../services/reputationService';
import { api } from '../../services/api';
import { QRCodeGenerator } from '../QRCodeGenerator';
import { MobileHeader } from '../MobileHeader';
import { MobileNavigation } from '../MobileNavigation';
import { useSEO, seoConfigs } from '../../utils/seo';
import { useAnalytics } from '../../utils/analytics';

interface Education {
  degree: string;
  institution: string;
  period: string;
}

interface LawyerProfile {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  professional_title?: string;
  bio?: string;
  email: string;
  phone?: string;
  location?: string;
  avatar_url?: string;
  specializations?: string[];
  education?: Education[];
  linkedin?: string;
  verification_status?: string;
  years_experience?: number;
  // Calculated stats
  average_rating?: number;
  total_reviews?: number;
  completed_cases?: number;
  response_time?: string;
  joined_date?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  client_name: string;
  date: string;
  case_type?: string;
}

interface EarnedBadge {
  id: string;
  name: string;
  description: string;
  type: 'reputation' | 'achievement' | 'quality' | 'verification';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: string;
}

export const PublicLawyerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  // Use 'demo' as default ID if no ID provided (for /profile-demo route)
  const lawyerId = id || 'demo';
  const [lawyer, setLawyer] = useState<LawyerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [currentTierBadge, setCurrentTierBadge] = useState<EarnedBadge | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showQRPopup, setShowQRPopup] = useState(false);
  const { updateSEO } = useSEO();
  const { trackLawyerProfileView, trackServiceInquiry } = useAnalytics();

  useEffect(() => {
    loadLawyerProfile(lawyerId);
  }, [lawyerId]);

  // Update SEO and analytics
  useEffect(() => {
    if (lawyer) {
      // Update SEO
      const seoConfig = seoConfigs.lawyerProfile(
        lawyer.name,
        lawyer.specializations || [],
        lawyer.average_rating || 0,
        lawyer.location || 'Nigeria'
      );
      updateSEO(seoConfig);

      // Track profile view
      trackLawyerProfileView(lawyerId);
    }
  }, [lawyer, lawyerId, updateSEO, trackLawyerProfileView]);

  const loadLawyerProfile = async (lawyerId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load lawyer profile data from API
      let profileData;
      try {
        profileData = await api.metrics.getUserProfile(lawyerId);
        console.log('Profile data loaded from API:', profileData);
        console.log('linkedin', profileData.linkedin);
      } catch (error) {
        console.error('Error loading profile from API:', error);
        setError('Failed to load lawyer profile');
        setLoading(false);
        return;
      }
      
      // If no real data found, show error
      if (!profileData) {
        setError('Lawyer profile not found');
        setLoading(false);
        return;
      }

      // Load feedback/reviews for the lawyer
      let feedbackData = [];
      try {
        feedbackData = await api.feedback.getFeedbackByUserId(lawyerId);
        console.log('Feedback data loaded from API:', feedbackData);
      } catch (feedbackError) {
        console.error('Error loading feedback from API:', feedbackError);
        // Don't fail the entire profile load if feedback fails
        feedbackData = [];
      }

      // Load average response time for the lawyer
      let responseTime = 'N/A';
      try {
        responseTime = await api.metrics.getAverageResponseTime(lawyerId);
        console.log('Response time loaded from API:', responseTime);
      } catch (responseTimeError) {
        console.error('Error loading response time from API:', responseTimeError);
        // Don't fail the entire profile load if response time fails
        responseTime = 'N/A';
      }

      // Transform profile data
      const lawyerProfile: LawyerProfile = {
        id: profileData.id,
        name: profileData.first_name && profileData.last_name 
          ? `${profileData.first_name} ${profileData.last_name}` 
          : profileData.email.split('@')[0],
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        professional_title: profileData.professional_title || 'Legal Professional',
        bio: profileData.bio,
        email: profileData.email,
        phone: profileData.phone,
        location: profileData.location,
        avatar_url: profileData.avatar_url,
        specializations: profileData.specializations,
        education: profileData.education,
        linkedin: profileData.linkedin,
        verification_status: profileData.verification_status,
        years_experience: calculateYearsExperience(profileData.created_at),
        joined_date: profileData.created_at,
        // Real calculated stats from API data
        average_rating: feedbackData.length > 0 
          ? feedbackData.reduce((sum, review) => sum + review.rating, 0) / feedbackData.length 
          : 0,
        total_reviews: feedbackData.length,
        completed_cases: profileData.jobs_completed || 0,
        response_time: responseTime
      };

      setLawyer(lawyerProfile);

      // Load professional badges - temporarily commented out for debugging
      // try {
      //   const badgeData = await reputationService.getUserBadges(lawyerId);
      //   setEarnedBadges(badgeData.earned);
      //   setCurrentTierBadge(badgeData.currentTier);
      // } catch (badgeError) {
        console.log('Using mock badges for demo');
        
        // Mock badges for demonstration
        const mockBadges: EarnedBadge[] = [
          {
            id: 'proficient-tier',
            name: 'Proficient',
            description: 'Demonstrated proficiency in legal services',
            type: 'reputation',
            rarity: 'rare',
            earnedAt: '2024-03-15T00:00:00Z'
          },
          {
            id: 'early-adopter',
            name: 'Early Adopter',
            description: 'Among the first lawyers to join the platform',
            type: 'achievement',
            rarity: 'epic',
            earnedAt: '2021-03-15T00:00:00Z'
          },
          {
            id: 'case-closer',
            name: 'Case Closer',
            description: 'Successfully completed 50+ cases',
            type: 'achievement',
            rarity: 'rare',
            earnedAt: '2023-08-20T00:00:00Z'
          },
          {
            id: 'client-favorite',
            name: 'Client Favorite',
            description: 'Maintained 4.5+ rating with 20+ reviews',
            type: 'quality',
            rarity: 'epic',
            earnedAt: '2024-01-10T00:00:00Z'
          },
          {
            id: 'quick-responder',
            name: 'Quick Responder',
            description: 'Responds to clients within 2 hours',
            type: 'quality',
            rarity: 'common',
            earnedAt: '2023-12-05T00:00:00Z'
          },
          {
            id: 'identity-verified',
            name: 'Identity Verified',
            description: 'Government ID and identity verified',
            type: 'verification',
            rarity: 'common',
            earnedAt: '2021-03-20T00:00:00Z'
          },
          {
            id: 'education-verified',
            name: 'Education Verified',
            description: 'Educational credentials verified',
            type: 'verification',
            rarity: 'common',
            earnedAt: '2021-03-22T00:00:00Z'
          }
        ];
        
        setEarnedBadges(mockBadges);
        setCurrentTierBadge(mockBadges[0]); // Set Proficient as current tier
      // }

      // Transform feedback data to reviews format
      const transformedReviews = feedbackData.map((feedback, index) => ({
        id: feedback.id || `review-${index}`,
        rating: feedback.rating,
        comment: feedback.free_response,
        client_name: feedback.creator_profile?.first_name 
          ? `${feedback.creator_profile.first_name} ${feedback.creator_profile.last_name || ''}`.trim()
          : 'Anonymous Client',
        date: new Date(feedback.created_at).toLocaleDateString(),
        case_type: 'Legal Service' // Could be enhanced to get actual case type from gig
      }));
      
      setReviews(transformedReviews);

    } catch (err) {
      console.error('Error loading lawyer profile:', err);
      setError('Failed to load lawyer profile');
    } finally {
      setLoading(false);
    }
  };

  const calculateYearsExperience = (joinDate?: string): number => {
    if (!joinDate) return 0;
    const joined = new Date(joinDate);
    const now = new Date();
    return Math.max(0, now.getFullYear() - joined.getFullYear());
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const handleContactLawyer = () => {
    if (lawyer?.email) {
      trackServiceInquiry('contact', lawyerId);
      window.location.href = `mailto:${lawyer.email}?subject=Legal Service Inquiry&body=Hello ${lawyer.name}, I would like to discuss a legal matter with you.`;
    }
  };

  const handleRequestQuote = () => {
    if (lawyer?.email) {
      trackServiceInquiry('quote_request', lawyerId);
      window.location.href = `mailto:${lawyer.email}?subject=Quote Request&body=Hello ${lawyer.name}, I would like to request a quote for legal services. Please provide details about your rates and availability.`;
    }
  };

  const generateQRCode = () => {
    setShowQRPopup(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader />
        <MobileNavigation />
        <div className="flex items-center justify-center min-h-screen pt-16 md:pt-0 pb-20 md:pb-0">
          <div className="text-center px-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading lawyer profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lawyer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader />
        <MobileNavigation />
        <div className="flex items-center justify-center min-h-screen pt-16 md:pt-0 pb-20 md:pb-0">
          <div className="text-center px-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">{error || 'This lawyer profile could not be found.'}</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <MobileHeader />
      <MobileNavigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white pt-16 md:pt-0">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row items-start gap-6 sm:gap-8">
            {/* Profile Photo */}
            <div className="flex-shrink-0 w-full lg:w-auto flex flex-col items-center lg:items-start">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30">
                {lawyer.avatar_url ? (
                  <img src={lawyer.avatar_url} alt={lawyer.name} className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-12 h-12 sm:w-16 sm:h-16 text-white/80" />
                )}
              </div>
              {lawyer.verification_status === 'verified' && (
                <div className="flex items-center justify-center mt-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mr-2" />
                  <span className="text-xs sm:text-sm text-white/90">Verified Professional</span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 break-words">{lawyer.name}</h1>
              <p className="text-lg sm:text-xl text-blue-100 mb-4 break-words">{lawyer.professional_title}</p>
              
              {/* Rating & Stats */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {renderStars(lawyer.average_rating || 0)}
                  </div>
                  <span className="font-semibold text-sm sm:text-base">{lawyer.average_rating}</span>
                  <span className="text-blue-100 text-sm sm:text-base">({lawyer.total_reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-sm sm:text-base">{lawyer.completed_cases}+ cases completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm sm:text-base">{lawyer.response_time} response time</span>
                </div>
              </div>

              {/* Current Tier Badge */}
              {currentTierBadge && (
                <div className="flex items-center gap-3 mb-6 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">★</span>
                  </div>
                  <div>
                    <div className="font-semibold">{currentTierBadge.name}</div>
                    <div className="text-sm text-blue-100">{currentTierBadge.description}</div>
                  </div>
                </div>
              )}

              {/* Contact CTAs */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center lg:justify-start">
                <Button 
                  onClick={handleContactLawyer}
                  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base w-full sm:w-auto"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact {lawyer.first_name || 'Lawyer'}
                </Button>
                <Button 
                  onClick={generateQRCode}
                  variant="outline"
                  className="border-white text-white hover:bg-white/20 font-semibold px-4 sm:px-6 py-2 sm:py-3 bg-white/10 text-sm sm:text-base w-full sm:w-auto"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Code
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 lg:py-12 pb-20 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 min-w-0">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8 min-w-0">
            {/* About Section */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">About {lawyer.first_name || lawyer.name}</h2>
                {lawyer.bio ? (
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base break-words">{lawyer.bio}</p>
                ) : (
                  <p className="text-gray-500 italic text-sm sm:text-base">Professional bio not available.</p>
                )}
                
                {/* Location & Experience */}
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 sm:gap-6 mt-6 pt-6 border-t">
                  {lawyer.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm sm:text-base">{lawyer.location}</span>
                    </div>
                  )}
                  { (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm sm:text-base">{lawyer.years_experience}+ years on platform</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Specializations */}
            {lawyer.specializations && lawyer.specializations.length > 0 && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4">Legal Specializations</h2>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {lawyer.specializations.map((spec, index) => (
                      <span 
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 sm:px-4 py-1 sm:py-2 rounded-full font-medium text-sm sm:text-base"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Professional Badges */}
            {earnedBadges.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Professional Achievements & Credentials</h2>
                  
                  {/* Achievement Badges */}
                  {earnedBadges.filter(badge => badge.type === 'achievement').length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-gray-900">🏆 Achievements</h3>
                      <div className="flex flex-wrap gap-3">
                        {earnedBadges.filter(badge => badge.type === 'achievement').map(badge => (
                          <div key={badge.id} className="flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-2 rounded-full">
                            <span className="text-orange-600">🏆</span>
                            <span className="text-sm font-medium">{badge.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Quality Badges */}
                  {earnedBadges.filter(badge => badge.type === 'quality').length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-gray-900">⭐ Quality Standards</h3>
                      <div className="flex flex-wrap gap-3">
                        {earnedBadges.filter(badge => badge.type === 'quality').map(badge => (
                          <div key={badge.id} className="flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-2 rounded-full">
                            <span className="text-purple-600">⭐</span>
                            <span className="text-sm font-medium">{badge.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Verification Badges */}
                  {earnedBadges.filter(badge => badge.type === 'verification').length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-3 text-gray-900">🛡️ Verified Credentials</h3>
                      <div className="flex flex-wrap gap-3">
                        {earnedBadges.filter(badge => badge.type === 'verification').map(badge => (
                          <div key={badge.id} className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-full">
                            <span className="text-green-600">🛡️</span>
                            <span className="text-sm font-medium">{badge.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Show total badge count */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      🎖️ <strong>{earnedBadges.length} total badges earned</strong> - Demonstrating excellence and verified expertise
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Education & Credentials */}
            {lawyer.education && lawyer.education.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Education & Credentials</h2>
                  <div className="space-y-4">
                    {lawyer.education.map((edu, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                        <GraduationCap className="w-6 h-6 text-blue-600 mt-1" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                          <p className="text-gray-700">{edu.institution}</p>
                          <p className="text-gray-500 text-sm">{edu.period}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Client Reviews */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Client Reviews</h2>
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex">{renderStars(review.rating)}</div>
                            <span className="font-semibold">{review.client_name}</span>
                          </div>
                          {review.case_type && (
                            <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {review.case_type}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-500 text-sm">{review.date}</span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Contact Card */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-lg font-bold mb-4">Get In Touch</h3>
                
                <div className="space-y-4 mb-6">
                  {lawyer.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Email available</span>
                    </div>
                  )}
                  {lawyer.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Phone consultation</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{lawyer.response_time} response</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleContactLawyer}
                    className="w-full"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <Button 
                    onClick={handleRequestQuote}
                    variant="outline"
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Get Quote
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-lg font-bold mb-4">Professional Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cases Completed</span>
                    <span className="font-semibold">{lawyer.completed_cases}+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client Rating</span>
                    <span className="font-semibold">{lawyer.average_rating}/5.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Time</span>
                    <span className="font-semibold">{lawyer.response_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Member</span>
                    <span className="font-semibold">{lawyer.years_experience}+ years</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Links */}
            {lawyer.linkedin && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg font-bold mb-4">Professional Profile</h3>
                  <a 
                    href={lawyer.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View LinkedIn Profile
                  </a>
                </CardContent>
              </Card>
            )}

            {/* Trust Signals */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-lg font-bold mb-4">Why Choose {lawyer.first_name || 'This Lawyer'}?</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Verified Professional</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="text-sm">Platform Certified</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="text-sm">Trusted by Clients</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span className="text-sm">Fast Response</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* QR Code Popup */}
      <Dialog open={showQRPopup} onOpenChange={setShowQRPopup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Share Your Profile</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Generate a QR code to easily share your legal profile with clients
              </p>
            </div>
            
            <div className="flex justify-center">
              <QRCodeGenerator
                url={window.location.href}
                title="Legal Profile QR Code"
                description="Scan to view this lawyer's public profile"
                size={200}
              />
            </div>
            
            {/* Additional sharing options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                <span className="text-sm text-gray-700">Public Profile URL</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                  }}
                >
                  Copy Link
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
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
        </DialogContent>
      </Dialog>
    </div>
  );
};