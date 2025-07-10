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
  DollarSignIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  EyeIcon,
  BadgeCheckIcon,
  Badge
} from "lucide-react";
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { BadgeCollection } from '../../components/badges';
import { reputationService } from '../../services/reputationService';
import { loyaltyService, LoyaltyStats } from '../../services/loyaltyService';
import { EarnedBadge } from '../../components/badges';

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
  address: string;
  about: string;
  specializations: string[];
  education: Education[];
  status?: string;
  user_metadata?: {
    status?: string;
    [key: string]: any;
  };
}

interface Feedback {
  id: number;
  rating: number;
  free_response: string;
  creator: string;
  recipient: string;
  gig_id: number;
  created_at: string;
  creator_profile?: {
    id: string;
    name?: string;
    email?: string;
    created_at?: string;
    verification_status?: string;
  };
}

type ViewMode = "profile" | "edit-profile" | "public-view";

export const Profile = (): JSX.Element => {
  // Get auth functions including storeProfileDocuments and getProfileDocuments for file uploads
  const { user, updateProfile, storeProfileDocuments, getProfileDocuments } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("profile");
  const [activeTab, setActiveTab] = useState<"overview" | "experience" | "reviews" | "cases">("overview");
  const [newSpecialization, setNewSpecialization] = useState("");
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "Loading...",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    address: "",
    about: "",
    specializations: [],
    education: []
  });
  // isLoading state can be used for loading indicators in the future
  const [, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<Feedback[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [cases, setCases] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [currentTierBadge, setCurrentTierBadge] = useState<EarnedBadge | null>(null);
  const [loadingBadges, setLoadingBadges] = useState(true);
  const [loyaltyStats, setLoyaltyStats] = useState<LoyaltyStats | null>(null);
  const [loadingLoyaltyStats, setLoadingLoyaltyStats] = useState(true);


  // Function to load profile documents
  const loadProfileDocuments = async () => {
    if (!user) return;
    
    try {
      const documents = await getProfileDocuments();
      setLoadedDocuments(documents);
      console.log('Profile documents loaded:', documents);
    } catch (error) {
      console.error('Error loading profile documents:', error);
      // Don't throw error, just log it - documents might not exist yet
    }
  };

  // Load real profile data from Supabase
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // First try to get data from Profiles table
        let profileFromTable = null;
        try {
          profileFromTable = await api.metrics.getUserProfile(user.id);
        } catch (error) {
          console.log('Could not fetch from Profiles table, falling back to user metadata:', error);
        }
        
        // Get data from user metadata as fallback
        const meta = user.user_metadata || {};
        let firstName = '';
        let lastName = '';
        let phone = '';
        let location = '';
        let about = '';
        let specializations: string[] = [];
        let education: Education[] = [];
        
        if (profileFromTable) {
          // Use data from Profiles table
          firstName = profileFromTable.first_name || '';
          lastName = profileFromTable.last_name || '';
          phone = profileFromTable.phone || '';
          location = profileFromTable.location || '';
          about = profileFromTable.bio || '';
          // Load specializations and education from Profiles table or fallback to metadata
          specializations = Array.isArray((profileFromTable as any).specializations) ? (profileFromTable as any).specializations : 
                          Array.isArray((meta as any).specializations) ? (meta as any).specializations : [];
          // Load education from Profiles table (JSON column) or fallback to metadata
          if ((profileFromTable as any).education) {
            try {
              // Parse JSON education data from Profiles table
              const educationData = typeof (profileFromTable as any).education === 'string' 
                ? JSON.parse((profileFromTable as any).education) 
                : (profileFromTable as any).education;
              education = Array.isArray(educationData) ? educationData : [];
            } catch (error) {
              console.error('Error parsing education data from Profiles table:', error);
              education = Array.isArray((meta as any).education) ? (meta as any).education : [];
            }
          } else {
            education = Array.isArray((meta as any).education) ? (meta as any).education : [];
          }
          // Load LinkedIn URL from Profiles table
          const linkedinUrl = (profileFromTable as any).linkedin || (profileFromTable as any).website || '';
          setEnhancedFormData(prev => ({ ...prev, linkedinUrl }));
        } else {
          // Fallback to user metadata
          firstName = (meta as any).firstName || '';
          lastName = (meta as any).lastName || '';
          phone = meta.phone || '';
          location = (meta as any).location || '';
          about = (meta as any).about || '';
          specializations = Array.isArray((meta as any).specializations) ? (meta as any).specializations : [];
          education = Array.isArray((meta as any).education) ? (meta as any).education : [];
          // Load LinkedIn URL from metadata
          const linkedinUrl = (meta as any).linkedin || (meta as any).website || '';
          setEnhancedFormData(prev => ({ ...prev, linkedinUrl }));
        }
        
        // If still no names, try to get from user.name
        if ((!firstName || !lastName) && user.name) {
          const parts = user.name.split(' ');
          firstName = firstName || parts[0] || 'User';
          lastName = lastName || parts.slice(1).join(' ') || '';
        }

        // Get professional title from Profiles table or fallback to default
        let professionalTitle = 'Legal Professional'; // Default fallback
        console.log("profileFromTable", profileFromTable)
        if (profileFromTable) {
          professionalTitle = (profileFromTable as any).professional_title ;
        } else {
          professionalTitle = (meta as any).professional_title || (meta as any).title || 'Legal Professional';
        }

        const profileDataObj = {
          firstName,
          lastName,
          email: user.email || '',
          phone,
          title: professionalTitle,
          address: location,
          about,
          specializations,
          education
        };

        console.log('Profile data loaded:', {
          profileFromTable: !!profileFromTable,
          specializations,
          education,
          profileDataObj
        });

        setProfileData(profileDataObj);
        // Also update editFormData to use the same data
        setEditFormData(profileDataObj);

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

        // Load user loyalty stats
        try {
          setLoadingLoyaltyStats(true);
          const loyaltyData = await loyaltyService.getUserLoyaltyStats(user.id);
          setLoyaltyStats(loyaltyData);
          
          // Update login streak
          await loyaltyService.updateLoginStreak(user.id);
        } catch (loyaltyError) {
          console.log('Could not load loyalty stats:', loyaltyError);
          setLoyaltyStats(null);
        } finally {
          setLoadingLoyaltyStats(false);
        }
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
      const { supabase } = await import('../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No active session, skipping feedback fetch');
        setReviews([]);
        setAverageRating(0);
        return;
      }

      const feedbackData = await api.feedback.getFeedbackForUser();
      console.log("feedbackData", feedbackData);
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
      const { supabase } = await import('../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
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

  // Load profile documents when entering edit mode or when user changes
  useEffect(() => {
    if (user?.id && viewMode === "edit-profile") {
      loadProfileDocuments();
    }
  }, [user?.id, viewMode]);

  const [editFormData, setEditFormData] = useState<ProfileData>(profileData);
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Additional profile fields for enhanced verification
  const [enhancedFormData, setEnhancedFormData] = useState({
    linkedinUrl: '',
    barLicenseNumber: '',
    governmentIdType: 'passport',
    governmentIdFile: null as File | null,
    selfieWithIdFile: null as File | null,
    professionalDocuments: [] as File[]
  });

  // State for loaded document URLs
  const [loadedDocuments, setLoadedDocuments] = useState<{
    governmentId?: string;
    selfieWithId?: string;
    otherDocuments: string[];
  }>({ otherDocuments: [] });

  const profileSteps = [
    { id: 1, title: 'Basic Information', description: 'Personal details and contact info' },
    { id: 2, title: 'Professional Details', description: 'Title, specializations, LinkedIn' },
    { id: 3, title: 'Education & Experience', description: 'Degrees and work history' },
    { id: 4, title: 'Identity Verification', description: 'Government ID and selfie' },
    { id: 5, title: 'Professional Licensing', description: 'Bar license and documents' }
  ];

  // Step validation function
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(editFormData.firstName && editFormData.lastName && editFormData.email && editFormData.phone);
      case 2:
        // console.log("editFormData", editFormData);
        return !!(editFormData.title && editFormData.specializations.length > 0);
      case 3:
        return editFormData.education.length > 0;
      case 4:
        // Check if files are uploaded OR if documents already exist
        const hasGovernmentId = enhancedFormData.governmentIdFile || loadedDocuments.governmentId;
        const hasSelfieWithId = enhancedFormData.selfieWithIdFile || loadedDocuments.selfieWithId;
        return !!(hasGovernmentId && hasSelfieWithId);
      case 5:
        return !!enhancedFormData.barLicenseNumber;
      default:
        return false;
    }
  };

  // Handle step navigation
  const handleNextStep = async () => {
    if (validateStep(currentStep)) {
      // Handle file uploads for step 4 (Identity Verification) when clicking Next
      if (currentStep === 4 && user) {
        const uploadedFiles: string[] = [];
        
        // Upload government ID file
        if (enhancedFormData.governmentIdFile) {
          try {
            const fileExt = enhancedFormData.governmentIdFile.name.split('.').pop();
            const filename = `government_id.${fileExt}`;
            const filepath = `${user.id}/profile_documents/${filename}`;
            
            const governmentIdUrl = await storeProfileDocuments(enhancedFormData.governmentIdFile, filepath);
            uploadedFiles.push(governmentIdUrl);
            console.log('Government ID uploaded:', governmentIdUrl);
          } catch (error) {
            console.error('Error uploading government ID:', error);
            alert('Error uploading government ID file. Please try again.');
            return;
          }
        }
        
        // Upload selfie with ID file
        if (enhancedFormData.selfieWithIdFile) {
          try {
            const fileExt = enhancedFormData.selfieWithIdFile.name.split('.').pop();
            const filename = `selfie_with_id.${fileExt}`;
            const filepath = `${user.id}/profile_documents/${filename}`;
            
            const selfieUrl = await storeProfileDocuments(enhancedFormData.selfieWithIdFile, filepath);
            uploadedFiles.push(selfieUrl);
            console.log('Selfie with ID uploaded:', selfieUrl);
          } catch (error) {
            console.error('Error uploading selfie with ID:', error);
            alert('Error uploading selfie with ID file. Please try again.');
            return;
          }
        }
        
        // Store the uploaded file URLs in profile data
        const profileUpdateData: any = {
          // Basic profile information (always included)
          first_name: editFormData.firstName,
          last_name: editFormData.lastName,
          email: editFormData.email,
          phone: editFormData.phone,
          location: editFormData.address,
          bio: editFormData.about,
          professional_title: editFormData.title,
          specializations: editFormData.specializations,
          education: editFormData.education,
          
          // Legacy fields for backward compatibility
          firstName: editFormData.firstName,
          lastName: editFormData.lastName,
          about: editFormData.about,
          
          // Enhanced form data
          ...(enhancedFormData.linkedinUrl && { 
            website: enhancedFormData.linkedinUrl,
            linkedin: enhancedFormData.linkedinUrl 
          }),
          ...(enhancedFormData.barLicenseNumber && { 
            bar_license_number: enhancedFormData.barLicenseNumber,
            role_title: enhancedFormData.barLicenseNumber 
          }),
          ...(enhancedFormData.governmentIdType && { clearance_level: enhancedFormData.governmentIdType }),
          
          // Store uploaded document URLs
          ...(uploadedFiles.length > 0 && { 
            verification_documents: uploadedFiles,
            government_id_url: uploadedFiles[0] || null,
            selfie_with_id_url: uploadedFiles[1] || null
          })
        };
        
        await updateProfile(profileUpdateData);
      } else if (currentStep === 5 && user) {
        // Handle file uploads for step 5 (Professional Licensing) when clicking Next
        const uploadedFiles: string[] = [];
        
        // Upload professional documents (multiple files)
        if (enhancedFormData.professionalDocuments.length > 0) {
          for (const file of enhancedFormData.professionalDocuments) {
            try {
              const filepath = `${user.id}/profile_documents/${file.name}`;
              
              const documentUrl = await storeProfileDocuments(file, filepath);
              uploadedFiles.push(documentUrl);
              console.log('Professional document uploaded:', documentUrl);
            } catch (error) {
              console.error('Error uploading professional document:', error);
              alert(`Error uploading ${file.name}. Please try again.`);
              return;
            }
          }
        }
        
        // Store the uploaded file URLs in profile data
        const profileUpdateData: any = {
          // Basic profile information (always included)
          first_name: editFormData.firstName,
          last_name: editFormData.lastName,
          email: editFormData.email,
          phone: editFormData.phone,
          location: editFormData.address,
          bio: editFormData.about,
          professional_title: editFormData.title,
          specializations: editFormData.specializations,
          education: editFormData.education,
          
          // Legacy fields for backward compatibility
          firstName: editFormData.firstName,
          lastName: editFormData.lastName,
          about: editFormData.about,
          
          // Enhanced form data
          ...(enhancedFormData.linkedinUrl && { 
            website: enhancedFormData.linkedinUrl,
            linkedin: enhancedFormData.linkedinUrl 
          }),
          ...(enhancedFormData.barLicenseNumber && { 
            bar_license_number: enhancedFormData.barLicenseNumber,
            role_title: enhancedFormData.barLicenseNumber 
          }),
          ...(enhancedFormData.governmentIdType && { clearance_level: enhancedFormData.governmentIdType }),
          
          // Store uploaded professional document URLs
          ...(uploadedFiles.length > 0 && { 
            professional_documents: uploadedFiles
          })
        };
        
        await updateProfile(profileUpdateData);
      }
      
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    // Allow navigation to completed steps or the next incomplete step
    if (completedSteps.includes(step) || step === Math.min(...Array.from({length: 5}, (_, i) => i + 1).filter(s => !completedSteps.includes(s)))) {
      setCurrentStep(step);
    }
  };

  // Handle enhanced form data changes
  const handleEnhancedInputChange = (field: string, value: string) => {
    setEnhancedFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setEnhancedFormData(prev => ({ ...prev, [field]: file }));
  };

  // Handle step save
  const handleStepSave = async () => {
    if (validateStep(currentStep)) {
      // Save current step data
      try {
        console.log(`Saving step ${currentStep} data`);
        
        // Handle file uploads for step 4 (Identity Verification)
        if (currentStep === 4 && user) {
          const uploadedFiles: string[] = [];
          
          // Upload government ID file
          if (enhancedFormData.governmentIdFile) {
            try {
              const fileExt = enhancedFormData.governmentIdFile.name.split('.').pop();
              const filename = `government_id.${fileExt}`;
              const filepath = `${user.id}/profile_documents/${filename}`;
              
              const governmentIdUrl = await storeProfileDocuments(enhancedFormData.governmentIdFile, filepath);
              uploadedFiles.push(governmentIdUrl);
              console.log('Government ID uploaded:', governmentIdUrl);
            } catch (error) {
              console.error('Error uploading government ID:', error);
              alert('Error uploading government ID file. Please try again.');
              return;
            }
          }
          
          // Upload selfie with ID file
          if (enhancedFormData.selfieWithIdFile) {
            try {
              const fileExt = enhancedFormData.selfieWithIdFile.name.split('.').pop();
              const filename = `selfie_with_id.${fileExt}`;
              const filepath = `${user.id}/profile_documents/${filename}`;
              
              const selfieUrl = await storeProfileDocuments(enhancedFormData.selfieWithIdFile, filepath);
              uploadedFiles.push(selfieUrl);
              console.log('Selfie with ID uploaded:', selfieUrl);
            } catch (error) {
              console.error('Error uploading selfie with ID:', error);
              alert('Error uploading selfie with ID file. Please try again.');
              return;
            }
          }
          
          // Store the uploaded file URLs in profile data
          const profileUpdateData: any = {
            // Basic profile information (always included)
            first_name: editFormData.firstName,
            last_name: editFormData.lastName,
            email: editFormData.email,
            phone: editFormData.phone,
            location: editFormData.address,
            bio: editFormData.about,
            professional_title: editFormData.title,
            specializations: editFormData.specializations,
            education: editFormData.education,
            
            // Legacy fields for backward compatibility
            firstName: editFormData.firstName,
            lastName: editFormData.lastName,
            about: editFormData.about,
            
            // Enhanced form data
            ...(enhancedFormData.linkedinUrl && { 
              website: enhancedFormData.linkedinUrl,
              linkedin: enhancedFormData.linkedinUrl 
            }),
            ...(enhancedFormData.barLicenseNumber && { 
              bar_license_number: enhancedFormData.barLicenseNumber,
              role_title: enhancedFormData.barLicenseNumber 
            }),
            ...(enhancedFormData.governmentIdType && { clearance_level: enhancedFormData.governmentIdType }),
            
            // Store uploaded document URLs
            ...(uploadedFiles.length > 0 && { 
              verification_documents: uploadedFiles,
              government_id_url: uploadedFiles[0] || null,
              selfie_with_id_url: uploadedFiles[1] || null
            })
          };
          
                  await updateProfile(profileUpdateData);
      } else if (currentStep === 5 && user) {
        // Handle file uploads for step 5 (Professional Licensing) when clicking Save Step
        const uploadedFiles: string[] = [];
        
        // Upload professional documents (multiple files)
        if (enhancedFormData.professionalDocuments.length > 0) {
          for (const file of enhancedFormData.professionalDocuments) {
            try {
              const filepath = `${user.id}/profile_documents/${file.name}`;
              
              const documentUrl = await storeProfileDocuments(file, filepath);
              uploadedFiles.push(documentUrl);
              console.log('Professional document uploaded:', documentUrl);
            } catch (error) {
              console.error('Error uploading professional document:', error);
              alert(`Error uploading ${file.name}. Please try again.`);
              return;
            }
          }
        }
        
        // Store the uploaded file URLs in profile data
        const profileUpdateData: any = {
          // Basic profile information (always included)
          first_name: editFormData.firstName,
          last_name: editFormData.lastName,
          email: editFormData.email,
          phone: editFormData.phone,
          location: editFormData.address,
          bio: editFormData.about,
          professional_title: editFormData.title,
          specializations: editFormData.specializations,
          education: editFormData.education,
          
          // Legacy fields for backward compatibility
          firstName: editFormData.firstName,
          lastName: editFormData.lastName,
          about: editFormData.about,
          
          // Enhanced form data
          ...(enhancedFormData.linkedinUrl && { 
            website: enhancedFormData.linkedinUrl,
            linkedin: enhancedFormData.linkedinUrl 
          }),
          ...(enhancedFormData.barLicenseNumber && { 
            bar_license_number: enhancedFormData.barLicenseNumber,
            role_title: enhancedFormData.barLicenseNumber 
          }),
          ...(enhancedFormData.governmentIdType && { clearance_level: enhancedFormData.governmentIdType }),
          
          // Store uploaded professional document URLs
          ...(uploadedFiles.length > 0 && { 
            professional_documents: uploadedFiles
          })
        };
        
        await updateProfile(profileUpdateData);
      } else {
        // For other steps, save without file uploads
        const profileUpdateData: any = {
          // Basic profile information (always included)
          first_name: editFormData.firstName,
          last_name: editFormData.lastName,
          email: editFormData.email,
          phone: editFormData.phone,
          location: editFormData.address,
          bio: editFormData.about,
          professional_title: editFormData.title, // Save to professional_title field
          specializations: editFormData.specializations,
          education: editFormData.education,
          
          // Legacy fields for backward compatibility
          firstName: editFormData.firstName,
          lastName: editFormData.lastName,
          about: editFormData.about,
          
          // Enhanced form data
          ...(enhancedFormData.linkedinUrl && { 
            website: enhancedFormData.linkedinUrl,
            linkedin: enhancedFormData.linkedinUrl 
          }),
          ...(enhancedFormData.barLicenseNumber && { 
            bar_license_number: enhancedFormData.barLicenseNumber,
            role_title: enhancedFormData.barLicenseNumber 
          }),
          ...(enhancedFormData.governmentIdType && { clearance_level: enhancedFormData.governmentIdType })
        };
        
        await updateProfile(profileUpdateData);
      }
        
        if (!completedSteps.includes(currentStep)) {
          setCompletedSteps(prev => [...prev, currentStep]);
        }
        
        // Show success message
        if (currentStep === 4) {
          alert(`Step ${currentStep} saved successfully! Identity verification documents have been uploaded.`);
        } else {
          alert(`Step ${currentStep} saved successfully!`);
        }
      } catch (error) {
        console.error('Error saving step:', error);
        alert('Error saving step data');
      }
    } else {
      alert('Please fill in all required fields for this step');
    }
  };

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
    console.log("addSpecialization called");
    console.log("editformdata before:", editFormData);
    console.log("newSpecialization:", newSpecialization);
    if (newSpecialization.trim()) {
      const updatedSpecializations = [...editFormData.specializations, newSpecialization.trim()];
      console.log("updatedSpecializations:", updatedSpecializations);
      
      setEditFormData(prev => {
        const newState = {
          ...prev,
          specializations: updatedSpecializations
        };
        console.log("new editFormData state:", newState);
        return newState;
      });
      setNewSpecialization("");
    }
  };

  const removeSpecialization = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index)
    }));
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editFormData) return;
    
    try {
      // Handle file uploads for step 5 (Professional Licensing) when completing profile
      let uploadedFiles: string[] = [];
      
      if (currentStep === 5 && user && enhancedFormData.professionalDocuments.length > 0) {
        // Upload professional documents (multiple files)
        for (const file of enhancedFormData.professionalDocuments) {
          try {
            const filepath = `${user.id}/profile_documents/${file.name}`;
            
            const documentUrl = await storeProfileDocuments(file, filepath);
            uploadedFiles.push(documentUrl);
            console.log('Professional document uploaded:', documentUrl);
          } catch (error) {
            console.error('Error uploading professional document:', error);
            alert(`Error uploading ${file.name}. Please try again.`);
            return;
          }
        }
      }
      
      // Update profile using the comprehensive AuthContext API
      await updateProfile({
        // Basic profile information
        first_name: editFormData.firstName,
        last_name: editFormData.lastName,
        phone: editFormData.phone,
        bio: editFormData.about,
        location: editFormData.address,
        professional_title: editFormData.title, // Save to professional_title field
        
        // Legacy fields for backward compatibility
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        title: editFormData.title, // Keep legacy field for backward compatibility
        about: editFormData.about,
        specializations: editFormData.specializations,
        // Education is now saved to Profiles table (JSON column)
        education: editFormData.education,
        
        // Enhanced verification data
        ...(enhancedFormData.linkedinUrl && { website: enhancedFormData.linkedinUrl }),
        ...(enhancedFormData.barLicenseNumber && { 
          bar_license_number: enhancedFormData.barLicenseNumber,
          role_title: enhancedFormData.barLicenseNumber 
        }),
        ...(enhancedFormData.governmentIdType && { clearance_level: enhancedFormData.governmentIdType }),
        
        // Store uploaded professional document URLs
        ...(uploadedFiles.length > 0 && { 
          professional_documents: uploadedFiles
        })
      });
      
      // Update local state and return to profile view
      setProfileData(editFormData);
      setViewMode("profile");
      
      // Mark final step as completed if we came from step 5
      if (currentStep === 5) {
        setCompletedSteps(prev => [...prev, 5]);
        alert("Profile completed successfully! All verification documents have been submitted for review.");
      } else {
        alert("Profile updated successfully!");
      }
      
      console.log("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Update profile picture using AuthContext API
        await updateProfile({ profile_picture_file: file });
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
                            <h4 className="font-semibold text-gray-900">
                              {review.creator_profile?.name || review.creator_profile?.email || 'Anonymous Client'}
                            </h4>
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
        <SellerSidebar activePage="profile" />

        {/* Main Content - Edit Profile */}
        <div className="flex-1 flex flex-col pt-16 md:pt-0 pb-20 md:pb-0">
          {/* Header - Hidden on mobile since SellerSidebar provides mobile nav */}
          <div className="hidden md:block">
            <Header title="Edit Profile" userType="seller" />
          </div>

          {/* Edit Profile Content */}
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
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

              {/* Progress Indicator */}
              <Card className="bg-white border border-gray-200 mb-6">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Complete Your Profile</h2>
                    <span className="text-sm text-gray-600">{completedSteps.length} of 5 steps completed</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(completedSteps.length / 5) * 100}%` }}
                    ></div>
                  </div>

                  {/* Step Indicators */}
                  <div className="flex justify-between overflow-x-auto pb-2">
                    {profileSteps.map((step) => (
                      <div 
                        key={step.id}
                        className={`flex flex-col items-center cursor-pointer min-w-0 flex-shrink-0 px-1 ${
                          completedSteps.includes(step.id) || currentStep === step.id 
                            ? 'text-purple-600' 
                            : 'text-gray-400'
                        }`}
                        onClick={() => handleStepClick(step.id)}
                      >
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium mb-2 border-2 ${
                          completedSteps.includes(step.id)
                            ? 'bg-purple-600 text-white border-purple-600'
                            : currentStep === step.id
                            ? 'bg-white text-purple-600 border-purple-600'
                            : 'bg-white text-gray-400 border-gray-300'
                        }`}>
                          {completedSteps.includes(step.id) ? (
                            <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            step.id
                          )}
                        </div>
                        <div className="text-center min-w-0 max-w-16 sm:max-w-20">
                          <div className="text-xs font-medium truncate">{step.title}</div>
                          <div className="text-xs text-gray-500 truncate hidden sm:block">{step.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Step Content */}
              <div className="space-y-6">
                
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <Card className="bg-white border border-gray-200">
                    <CardContent className="p-4 sm:p-6 lg:p-8">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-6 text-center sm:text-left">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Basic Information</h3>
                          <p className="text-sm text-gray-600">Personal details and contact information</p>
                        </div>
                      </div>

                      {/* Profile Picture */}
                      <div className="mb-8">
                        <div className="flex flex-col items-center gap-4 text-center">
                          <div className="relative">
                            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                              {user && (user.user_metadata as any)?.profile_picture ? (
                                <img
                                  src={(user.user_metadata as any).profile_picture}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Fallback to UserIcon if image fails to load
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <UserIcon className={`w-12 h-12 text-gray-600 ${user && (user.user_metadata as any)?.profile_picture ? 'hidden' : ''}`} />
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
                            <h4 className="font-semibold text-gray-900">Profile Picture</h4>
                            <p className="text-sm text-gray-600">Upload a professional photo</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={editFormData.firstName}
                            onChange={handleInputChange}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={editFormData.lastName}
                            onChange={handleInputChange}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
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
                              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number *
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
                              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2">
                            <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="address"
                            value={editFormData.address}
                            onChange={handleInputChange}
                            placeholder="Enter your address"
                            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Professional Details */}
                {currentStep === 2 && (
                  <Card className="bg-white border border-gray-200">
                    <CardContent className="p-4 sm:p-6 lg:p-8">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-6 text-center sm:text-left">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <BriefcaseIcon className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Professional Details</h3>
                          <p className="text-sm text-gray-600">Professional information and expertise</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Professional Title *
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={editFormData.title}
                          onChange={handleInputChange}
                          placeholder="e.g., Senior Property Lawyer"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                          required
                        />
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          About
                        </label>
                        <textarea
                          name="about"
                          value={editFormData.about}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                          placeholder="Tell us about your experience and expertise..."
                        />
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          LinkedIn URL
                        </label>
                        <input
                          type="url"
                          value={enhancedFormData.linkedinUrl}
                          onChange={(e) => handleEnhancedInputChange('linkedinUrl', e.target.value)}
                          placeholder="https://linkedin.com/in/yourprofile"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                      </div>

                      {/* Specializations */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Specializations *
                        </label>
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
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
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
                              onChange={(e) => {
                                console.log("e", e.target.value)
                                setNewSpecialization(e.target.value)
                              }}
                              placeholder="Add new specialization"
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                              onKeyDown={(e) => {
                                e.key === 'Enter' && (e.preventDefault(), addSpecialization())
                              }}
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
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Education & Experience */}
                {currentStep === 3 && (
                  <Card className="bg-white border border-gray-200">
                    <CardContent className="p-4 sm:p-6 lg:p-8">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-6 text-center sm:text-left">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <GraduationCapIcon className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Education & Experience</h3>
                          <p className="text-sm text-gray-600">Academic background and work history</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-semibold text-gray-900">Education</h4>
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
                                  <h5 className="font-medium text-gray-900">Education {index + 1}</h5>
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
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                />
                                <input
                                  type="text"
                                  value={edu.institution}
                                  onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                                  placeholder="Institution"
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                />
                                <input
                                  type="text"
                                  value={edu.period}
                                  onChange={(e) => handleEducationChange(index, 'period', e.target.value)}
                                  placeholder="Period (e.g., 2013 - 2017)"
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 4: Identity Verification */}
                {currentStep === 4 && (
                  <Card className="bg-white border border-gray-200">
                    <CardContent className="p-4 sm:p-6 lg:p-8">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-6 text-center sm:text-left">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <ShieldCheckIcon className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Identity Verification</h3>
                          <p className="text-sm text-gray-600">Verify your identity with official documents</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Government ID */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 hover:border-purple-400 transition-colors">
                          <div className="text-center">
                            <BadgeCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h4 className="font-semibold text-gray-900 mb-2">Government ID *</h4>
                            <p className="text-sm text-gray-600 mb-4">
                              Upload a clear photo of your government-issued ID
                            </p>
                            
                            <div className="mb-4">
                              <select
                                value={enhancedFormData.governmentIdType}
                                onChange={(e) => handleEnhancedInputChange('governmentIdType', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                              >
                                <option value="passport">Passport</option>
                                <option value="national_id">National ID Card</option>
                                <option value="drivers_license">Driver's License</option>
                              </select>
                            </div>

                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange('governmentIdFile', e.target.files?.[0] || null)}
                              className="hidden"
                              id="government-id"
                            />
                            <label
                              htmlFor="government-id"
                              className="inline-flex items-center px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 cursor-pointer"
                            >
                              <UploadIcon className="w-4 h-4 mr-2" />
                              {enhancedFormData.governmentIdFile ? 'Change File' : 'Upload File'}
                            </label>
                            {enhancedFormData.governmentIdFile && (
                              <p className="text-sm text-green-600 mt-2">
                                ✓ {enhancedFormData.governmentIdFile.name}
                              </p>
                            )}
                            {!enhancedFormData.governmentIdFile && loadedDocuments.governmentId && (
                              <div className="mt-2">
                                <p className="text-sm text-blue-600 mb-2">✓ Previously uploaded document</p>
                                <a 
                                  href={loadedDocuments.governmentId} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-purple-600 hover:text-purple-800 underline"
                                >
                                  View Document
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Selfie with ID */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-400 transition-colors">
                          <div className="text-center">
                            <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h4 className="font-semibold text-gray-900 mb-2">Selfie with ID *</h4>
                            <p className="text-sm text-gray-600 mb-4">
                              Take a selfie holding your government ID next to your face
                            </p>
                            
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange('selfieWithIdFile', e.target.files?.[0] || null)}
                              className="hidden"
                              id="selfie-with-id"
                            />
                            <label
                              htmlFor="selfie-with-id"
                              className="inline-flex items-center px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 cursor-pointer"
                            >
                              <UploadIcon className="w-4 h-4 mr-2" />
                              {enhancedFormData.selfieWithIdFile ? 'Change Photo' : 'Upload Photo'}
                            </label>
                            {enhancedFormData.selfieWithIdFile && (
                              <p className="text-sm text-green-600 mt-2">
                                ✓ {enhancedFormData.selfieWithIdFile.name}
                              </p>
                            )}
                            {!enhancedFormData.selfieWithIdFile && loadedDocuments.selfieWithId && (
                              <div className="mt-2">
                                <p className="text-sm text-blue-600 mb-2">✓ Previously uploaded document</p>
                                <a 
                                  href={loadedDocuments.selfieWithId} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-purple-600 hover:text-purple-800 underline"
                                >
                                  View Document
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <h5 className="font-medium text-blue-900">Verification Tips</h5>
                            <ul className="text-sm text-blue-700 mt-1 space-y-1">
                              <li>• Ensure all text on your ID is clearly visible</li>
                              <li>• Make sure your face is clearly visible in the selfie</li>
                              <li>• Use good lighting and avoid glare or shadows</li>
                              <li>• Files should be in JPG, PNG, or PDF format</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 5: Professional Licensing */}
                {currentStep === 5 && (
                  <Card className="bg-white border border-gray-200">
                    <CardContent className="p-4 sm:p-6 lg:p-8">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-6 text-center sm:text-left">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <GavelIcon className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Professional Licensing</h3>
                          <p className="text-sm text-gray-600">Legal credentials and professional documents</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bar License Number *
                        </label>
                        <input
                          type="text"
                          value={enhancedFormData.barLicenseNumber}
                          onChange={(e) => handleEnhancedInputChange('barLicenseNumber', e.target.value)}
                          placeholder="Enter your bar license number"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                          required
                        />
                      </div>

                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Professional Documents</h4>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                          <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h5 className="font-medium text-gray-900 mb-2">Upload Professional Documents</h5>
                          <p className="text-sm text-gray-600 mb-4">
                            Bar certificates, professional licenses, or other relevant credentials
                          </p>
                          
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              setEnhancedFormData(prev => ({ ...prev, professionalDocuments: files }));
                            }}
                            className="hidden"
                            id="professional-docs"
                          />
                          <label
                            htmlFor="professional-docs"
                            className="inline-flex items-center px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 cursor-pointer"
                          >
                            <UploadIcon className="w-4 h-4 mr-2" />
                            Upload Documents
                          </label>
                          
                          {enhancedFormData.professionalDocuments.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm text-green-600 mb-2">
                                ✓ {enhancedFormData.professionalDocuments.length} file(s) selected
                              </p>
                              <div className="space-y-1">
                                {enhancedFormData.professionalDocuments.map((file, index) => (
                                  <p key={index} className="text-xs text-gray-600">{file.name}</p>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Show previously uploaded professional documents */}
                          {enhancedFormData.professionalDocuments.length === 0 && loadedDocuments.otherDocuments.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm text-blue-600 mb-2">
                                ✓ {loadedDocuments.otherDocuments.length} previously uploaded document(s)
                              </p>
                              <div className="space-y-2">
                                {loadedDocuments.otherDocuments.map((docUrl, index) => (
                                  <div key={index} className="flex items-center justify-between">
                                    <span className="text-xs text-gray-600">
                                      Document {index + 1}
                                    </span>
                                    <a 
                                      href={docUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-purple-600 hover:text-purple-800 underline"
                                    >
                                      View
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <h5 className="font-medium text-green-900">Professional Benefits</h5>
                            <p className="text-sm text-green-700 mt-1">
                              Complete your professional verification to unlock premium features, higher visibility in search results, and increased client trust.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Navigation Buttons */}
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      {/* Previous Button */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePreviousStep}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Previous
                      </Button>

                      {/* Step Indicator */}
                      <div className="text-center">
                        <div className="text-sm text-gray-600">
                          Step {currentStep} of {profileSteps.length}
                        </div>
                        <div className="text-xs text-gray-500">
                          {profileSteps[currentStep - 1]?.title}
                        </div>
                      </div>

                      {/* Next/Save Button */}
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          onClick={handleStepSave}
                          variant="outline"
                          className="border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          Save Step
                        </Button>
                        
                        {currentStep < 5 ? (
                          <Button
                            type="button"
                            onClick={handleNextStep}
                            disabled={!validateStep(currentStep)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Next
                            <ArrowLeftIcon className="w-4 h-4 ml-2 rotate-180" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={handleSaveProfile}
                            disabled={!validateStep(currentStep)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Complete Profile
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-1 rounded-full transition-all duration-500"
                          style={{ width: `${(currentStep / 5) * 100}%` }}
                        ></div>
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
  }

  // Default profile view
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <SellerSidebar activePage="profile" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col pt-16 md:pt-0 pb-20 md:pb-0">
        {/* Header - Hidden on mobile since SellerSidebar provides mobile nav */}
        <div className="hidden md:block">
          <Header title="Profile" userType="seller" />
        </div>

        {/* Profile Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
              {/* Main Profile Card */}
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                        {user && (user.user_metadata as any)?.profile_picture ? (
                          <img
                            src={(user.user_metadata as any).profile_picture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to UserIcon if image fails to load
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <UserIcon className={`w-12 h-12 text-gray-600 ${user && (user.user_metadata as any)?.profile_picture ? 'hidden' : ''}`} />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{profileData.firstName} {profileData.lastName}</h2>
                        {/* Current Tier Badge */}
                        {!loadingBadges && currentTierBadge && (
                          <div className="flex justify-center sm:justify-start">
                            <BadgeCollection 
                              badges={[currentTierBadge]} 
                              maxVisible={1} 
                              size="sm" 
                              showTooltip={true}
                            />
                          </div>
                        )}
                        {/* Fallback verification badge */}
                        {(loadingBadges || !currentTierBadge) && (
                          <div className="flex justify-center sm:justify-start" title={(user?.user_metadata as any)?.verification_status === 'verified' ? "Verified Professional" : "Pending Verification"}>
                            {(user?.user_metadata as any)?.verification_status === 'verified' ? (
                              <BadgeCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                            ) : (
                              <Badge className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-3 sm:mb-4">{profileData.title}</p>
                      
                      {/* Loyalty Stats */}
                      {!loadingLoyaltyStats && loyaltyStats && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{loyaltyStats.total_bricks}</p>
                                <p className="text-xs text-gray-600">Bricks</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-semibold text-purple-600">{loyaltyStats.loyalty_level}</p>
                                <p className="text-xs text-gray-600">Level</p>
                              </div>
                              {loyaltyStats.streak_days > 0 && (
                                <div className="text-center">
                                  <p className="text-lg font-semibold text-orange-600">{loyaltyStats.streak_days}</p>
                                  <p className="text-xs text-gray-600">Day Streak</p>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              Loyalty Member
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Professional Badges */}
                      {!loadingBadges && earnedBadges.length > 0 && (
                        <div className="mb-4">
                          <BadgeCollection 
                            badges={earnedBadges.filter(badge => badge.type !== 'reputation')} 
                            maxVisible={4} 
                            size="sm" 
                            className="justify-start"
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 mb-3 sm:mb-4">
                        <div className="flex items-center gap-1">
                          {renderStars(Math.round(averageRating))}
                          <span className="ml-2 font-semibold text-gray-900 text-sm sm:text-base">
                            {loadingReviews ? 'Loading...' : 
                             reviews.length > 0 ? 
                               `${averageRating.toFixed(1)} (${reviews.length} review${reviews.length === 1 ? '' : 's'})` : 
                               'No reviews yet'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <BriefcaseIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="text-sm sm:text-base">{experience.length > 0 ? `${experience.length} position${experience.length === 1 ? '' : 's'}` : 'Professional'}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                        <span className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                          Available Now
                        </span>
                        <span className="text-gray-600 text-xs sm:text-sm">Response within 2 hours</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                      <Button
                        variant="outline"
                        onClick={() => setViewMode("edit-profile")}
                        className="flex items-center justify-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 text-sm w-full sm:w-auto"
                      >
                        <EditIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        Edit Profile
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setViewMode("public-view")}
                        className="flex items-center justify-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 text-sm w-full sm:w-auto"
                      >
                        <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        Public View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content with Tabs */}
            <div className="space-y-4 sm:space-y-6">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 bg-white rounded-lg p-1">
                <nav className="flex space-x-4 sm:space-x-8 px-3 sm:px-6 py-3 sm:py-4 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <Card className="bg-white border border-gray-200">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  {renderTabContent()}
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Contact Information</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-3">
                    <MailIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base break-all">{profileData.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">{profileData.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">
                      {profileData.address || "Location not specified"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};
