import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, FileText, Award, Shield, Clock, AlertTriangle, Upload, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@supabase/supabase-js';
import { api } from '../../services/api';

const supabase = createClient('https://govkkihikacnnyqzhtxv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvdmtraWhpa2Fjbm55cXpodHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNTgyMjQsImV4cCI6MjA2NDgzNDIyNH0.0WuGDlY-twGxtmHU5XzfMvDQse_G3CuFVxLyCgZlxIQ');
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  about: z.string().min(50, "About section must be at least 50 characters"),
  specialization: z.string().optional(),
  company: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfilePage: React.FC = () => {
  const { user, updateProfile, setUser, getUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  
  // Determine if the current user is a seller
  const isSeller = user?.role === 'seller';
  
  // Fetch the latest user data from Supabase when the component mounts and whenever the user changes
  useEffect(() => {
    const loadUserData = async () => {
      const userData = await getUser();
      if (userData) {
        setUser(userData);
      }
    };
    loadUserData();
  }, [setUser, getUser]);
  
  // Dummy profile data based on user role
  const getBuyerProfile = () => ({
    
    name: user?.name || 'John Buyer',
    email: user?.email || 'buyer@example.com',
    phone: user?.user_metadata?.phone || 'none',
    address: user?.user_metadata?.address || 'none',
    company: 'Lagos Properties Ltd.',
    about: 'Property developer focused on residential and commercial projects in Lagos.',
    projects: [
      { id: 1, title: 'Ikoyi Heights Apartments', location: 'Ikoyi, Lagos' },
      { id: 2, title: 'Victoria Garden Commercial Plaza', location: 'Victoria Island, Lagos' },
    ]
  });
  
  const getSellerProfile = () => ({
    name: user?.name || 'Jane Seller',
    email: user?.email || 'seller@example.com',
    phone: '+234 987 654 3210',
    address: '456 Lekki Phase 1, Lagos',
    profession: 'Property Lawyer',
    licenseNumber: 'NPL/2020/123456',
    specialization: 'Land Title Verification, Contract Review',
    about: 'Experienced property lawyer with over 8 years in real estate law and property transactions.',
    education: [
      { id: 1, degree: 'LLB, Law', institution: 'University of Lagos', year: '2014' },
      { id: 2, degree: 'BL, Nigerian Law School', institution: 'Lagos Campus', year: '2015' },
    ],
    verificationStatus: 'verified', // pending, verified, rejected
  });
  
  // Get profile data based on user role
  const profileData = user?.role === 'buyer' ? getBuyerProfile() : getSellerProfile();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      address: profileData.address,
      about: profileData.about,
      specialization: isSeller ? profileData.specialization : undefined,
      company: !isSeller ? profileData.company : undefined,
    },
  });

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setProfilePicture(file);
      const previewUrl = URL.createObjectURL(file);
      setProfilePicturePreview(previewUrl);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 5000000, // 5MB
    maxFiles: 1,
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Here you would typically make an API call to update the profile
      console.log('Updating profile:', data);
      console.log('Profile picture:', profilePicture);
      
      // Call updateProfile from AuthContext to update the profile in Supabase
      await updateProfile(data);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-primary-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </button>
      </div>
      
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        {/* Profile Header */}
        <div className="relative">
          <div className="h-32 bg-primary-500"></div>
          <div className="absolute top-16 left-8">
            <div className="h-24 w-24 rounded-full bg-white p-1 shadow-lg">
              <div className="h-full w-full rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                {profilePicturePreview ? (
                  <img 
                    src={profilePicturePreview} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-primary-500" />
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-16 px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{profileData.name}</h1>
              <p className="text-gray-500 mt-1">
                {isSeller ? profileData.profession : profileData.company}
              </p>
              {isSeller && (
                <div className="mt-2 flex items-center">
                  {profileData.verificationStatus === 'verified' ? (
                    <span className="badge-success flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified Professional
                    </span>
                  ) : profileData.verificationStatus === 'pending' ? (
                    <span className="badge-warning flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Verification Pending
                    </span>
                  ) : (
                    <span className="badge-error flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Verification Required
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 sm:mt-0">
              <button 
                className="btn-primary"
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-t border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              className={`border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'profile' ? 'border-primary-500 text-primary-500' : ''
              }`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            {isSeller && (
              <button
                className={`border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'credentials' ? 'border-primary-500 text-primary-500' : ''
                }`}
                onClick={() => setActiveTab('credentials')}
              >
                Credentials
              </button>
            )}
            {!isSeller && (
              <button
                className={`border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'projects' ? 'border-primary-500 text-primary-500' : ''
                }`}
                onClick={() => setActiveTab('projects')}
              >
                Projects
              </button>
            )}
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6 sm:p-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-800 mb-3">About</h2>
                <p className="text-gray-600">{profileData.about}</p>
              </div>
              
              <div>
                <h2 className="text-lg font-medium text-gray-800 mb-3">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-600">{profileData.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-600">{profileData.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-600">{profileData.address}</span>
                  </div>
                </div>
              </div>
              
              {isSeller && (
                <div>
                  <h2 className="text-lg font-medium text-gray-800 mb-3">Specializations</h2>
                  <div className="flex flex-wrap gap-2">
                    {profileData.specialization.split(', ').map((specialization, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                        {specialization}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Credentials Tab (for sellers only) */}
          {activeTab === 'credentials' && isSeller && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-800 mb-3">Professional License</h2>
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">{profileData.licenseNumber}</span>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-medium text-gray-800 mb-3">Education</h2>
                <div className="space-y-4">
                  {profileData.education.map((edu) => (
                    <div key={edu.id} className="flex items-start">
                      <Award className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                      <div>
                        <h3 className="font-medium text-gray-800">{edu.degree}</h3>
                        <p className="text-sm text-gray-600">{edu.institution} • {edu.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-medium text-gray-800 mb-3">Verification Status</h2>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {profileData.verificationStatus === 'verified' ? (
                    <div className="flex items-start">
                      <Shield className="h-5 w-5 text-success-500 mr-3 mt-1" />
                      <div>
                        <h3 className="font-medium text-gray-800">Verified Professional</h3>
                        <p className="text-sm text-gray-600">Your credentials have been verified by Ilé Legal. You can now bid on gigs and accept assignments.</p>
                      </div>
                    </div>
                  ) : profileData.verificationStatus === 'pending' ? (
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-warning-500 mr-3 mt-1" />
                      <div>
                        <h3 className="font-medium text-gray-800">Verification Pending</h3>
                        <p className="text-sm text-gray-600">Your credentials are currently being reviewed by our team. This process typically takes 1-2 business days.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-error-500 mr-3 mt-1" />
                      <div>
                        <h3 className="font-medium text-gray-800">Verification Required</h3>
                        <p className="text-sm text-gray-600">Please upload your credentials to complete the verification process.</p>
                        <button className="btn-primary text-sm mt-2">Upload Documents</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Projects Tab (for buyers only) */}
          {activeTab === 'projects' && !isSeller && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-800 mb-3">Projects</h2>
                <div className="space-y-4">
                  {profileData.projects.map((project) => (
                    <div key={project.id} className="flex items-start">
                      <Briefcase className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                      <div>
                        <h3 className="font-medium text-gray-800">{project.title}</h3>
                        <p className="text-sm text-gray-600">{project.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Edit Profile
            </Dialog.Title>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Profile Picture Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                    {profilePicturePreview ? (
                      <img 
                        src={profilePicturePreview} 
                        alt="Profile Preview" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-primary-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                        ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-500'}`}
                    >
                      <input {...getInputProps()} />
                      <Upload className="mx-auto h-6 w-6 text-gray-400" />
                      <p className="mt-1 text-sm text-gray-500">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-400">
                        JPG or PNG up to 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  className={`mt-1 input ${errors.name ? 'border-error-500' : ''}`}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-error-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className={`mt-1 input ${errors.email ? 'border-error-500' : ''}`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-error-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="text"
                  id="phone"
                  className={`mt-1 input ${errors.phone ? 'border-error-500' : ''}`}
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-error-500">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  className={`mt-1 input ${errors.address ? 'border-error-500' : ''}`}
                  {...register('address')}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-error-500">{errors.address.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="about" className="block text-sm font-medium text-gray-700">
                  About
                </label>
                <textarea
                  id="about"
                  rows={4}
                  className={`mt-1 input ${errors.about ? 'border-error-500' : ''}`}
                  {...register('about')}
                ></textarea>
                {errors.about && (
                  <p className="mt-1 text-sm text-error-500">{errors.about.message}</p>
                )}
              </div>

              {isSeller && (
                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                    Specialization
                  </label>
                  <input
                    type="text"
                    id="specialization"
                    className={`mt-1 input ${errors.specialization ? 'border-error-500' : ''}`}
                    {...register('specialization')}
                  />
                  {errors.specialization && (
                    <p className="mt-1 text-sm text-error-500">{errors.specialization.message}</p>
                  )}
                </div>
              )}

              {!isSeller && (
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    className={`mt-1 input ${errors.company ? 'border-error-500' : ''}`}
                    {...register('company')}
                  />
                  {errors.company && (
                    <p className="mt-1 text-sm text-error-500">{errors.company.message}</p>
                  )}
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ProfilePage;