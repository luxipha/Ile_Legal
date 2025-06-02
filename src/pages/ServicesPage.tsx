import React from 'react';
import { FileCheck, Scale, Search, Shield, Clock, BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const ServicesPage: React.FC = () => {
  const services = [
    {
      icon: Search,
      title: 'Land Title Verification',
      description: 'Comprehensive verification of property titles and ownership history.',
      features: [
        'Ownership history verification',
        'Document authenticity checks',
        'Land registry searches',
        'Encumbrance checks'
      ]
    },
    {
      icon: FileCheck,
      title: 'Contract Review',
      description: 'Expert review and drafting of property-related contracts and agreements.',
      features: [
        'Sales agreements',
        'Lease agreements',
        'Development contracts',
        'Joint venture agreements'
      ]
    },
    {
      icon: Scale,
      title: 'Legal Compliance',
      description: 'Ensure compliance with local property laws and regulations.',
      features: [
        'Regulatory compliance checks',
        'Permit verification',
        'Zoning compliance',
        'Environmental compliance'
      ]
    },
    {
      icon: Shield,
      title: 'Due Diligence',
      description: 'Thorough investigation of property and related legal matters.',
      features: [
        'Property background checks',
        'Legal risk assessment',
        'Financial verification',
        'Documentation review'
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 font-serif">Our Services</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Comprehensive legal services for property developers and investors across Africa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {services.map((service, index) => (
          <div key={index} className="bg-white rounded-lg shadow-card p-6">
            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <service.icon className="h-6 w-6 text-primary-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h2>
            <p className="text-gray-600 mb-4">{service.description}</p>
            <ul className="space-y-2">
              {service.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center text-gray-600">
                  <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-primary-500 text-white rounded-lg p-8 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 font-serif">Why Choose Our Services?</h2>
          <p className="text-lg opacity-90">
            We provide reliable, efficient, and professional legal services tailored to your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <BadgeCheck className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Verified Professionals</h3>
            <p className="opacity-90">Access to thoroughly vetted legal experts</p>
          </div>
          <div className="text-center">
            <Clock className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Fast Turnaround</h3>
            <p className="opacity-90">Quick and efficient service delivery</p>
          </div>
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Secure Platform</h3>
            <p className="opacity-90">Protected transactions and documentation</p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 font-serif">Ready to Get Started?</h2>
        <p className="text-gray-600 mb-6">
          Join our platform today and connect with qualified legal professionals
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/register" className="btn-primary">
            Register Now
          </Link>
          <Link to="/login" className="btn-outline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;