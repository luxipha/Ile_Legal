import React from 'react';
import { 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Award,
  QrCode
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

export const PublicLawyerProfileTest: React.FC = () => {
  // Mock data for testing
  const lawyer = {
    id: 'demo',
    name: 'Sarah Johnson',
    professional_title: 'Senior Legal Counsel',
    bio: 'Experienced legal professional specializing in corporate law, contract negotiation, and business compliance.',
    email: 'demo.lawyer@ilelegal.com',
    phone: '+234 803 456 7890',
    location: 'Lagos, Nigeria',
    specializations: ['Corporate Law', 'Contract Law', 'Business Compliance'],
    average_rating: 4.8,
    total_reviews: 47,
    completed_cases: 156,
    years_experience: 8
  };

  const mockBadges = [
    { id: '1', name: 'Expert', type: 'reputation', color: 'purple' },
    { id: '2', name: '100+ Cases', type: 'achievement', color: 'orange' },
    { id: '3', name: 'Client Favorite', type: 'quality', color: 'blue' },
    { id: '4', name: 'Verified Identity', type: 'verification', color: 'green' }
  ];

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
    window.location.href = `mailto:${lawyer.email}?subject=Legal Service Inquiry&body=Hello ${lawyer.name}, I would like to discuss a legal matter with you.`;
  };

  const generateQRCode = () => {
    alert('QR code generation would be implemented here');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {lawyer.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{lawyer.name}</h1>
                <p className="text-blue-600 font-medium text-lg">{lawyer.professional_title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    {renderStars(lawyer.average_rating)}
                  </div>
                  <span className="text-gray-600">({lawyer.total_reviews} reviews)</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleContactLawyer} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Mail className="w-4 h-4 mr-2" />
                Contact
              </Button>
              <Button onClick={generateQRCode} variant="outline">
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed">{lawyer.bio}</p>
              </CardContent>
            </Card>

            {/* Badges Section */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Professional Badges</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {mockBadges.map((badge) => {
                    const colorClasses = {
                      purple: 'bg-purple-100 text-purple-800',
                      orange: 'bg-orange-100 text-orange-800', 
                      blue: 'bg-blue-100 text-blue-800',
                      green: 'bg-green-100 text-green-800'
                    }[badge.color as 'purple' | 'orange' | 'blue' | 'green'];

                    const icons = {
                      reputation: '👑',
                      achievement: '🏆',
                      quality: '⭐',
                      verification: '✓'
                    }[badge.type as 'reputation' | 'achievement' | 'quality' | 'verification'];

                    return (
                      <div key={badge.id} className={`flex items-center gap-2 px-3 py-2 rounded-full ${colorClasses}`}>
                        <span>{icons}</span>
                        <span className="text-sm font-medium">{badge.name}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Specializations */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Specializations</h2>
                <div className="flex flex-wrap gap-2">
                  {lawyer.specializations.map((spec, index) => (
                    <span key={index} className="bg-blue-50 text-blue-700 px-3 py-2 rounded-full text-sm font-medium">
                      {spec}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{lawyer.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{lawyer.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{lawyer.location}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience</span>
                    <span className="font-semibold">{lawyer.years_experience}+ years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cases Completed</span>
                    <span className="font-semibold">{lawyer.completed_cases}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client Rating</span>
                    <span className="font-semibold">{lawyer.average_rating}/5.0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};