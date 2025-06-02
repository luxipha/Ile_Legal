import React from 'react';
import { Scale, Users, Shield, Globe } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 font-serif">About Ilé Legal</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Connecting property developers with verified legal professionals across Africa
          for seamless property transactions and compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 font-serif">Our Mission</h2>
          <p className="text-gray-600">
            To streamline property transactions in Africa by providing a trusted platform
            that connects property developers with qualified legal professionals, ensuring
            compliance, reducing risks, and accelerating development projects.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 font-serif">Our Vision</h2>
          <p className="text-gray-600">
            To become Africa's leading legal services marketplace for real estate,
            fostering transparency, trust, and efficiency in property transactions
            across the continent.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <Scale className="h-8 w-8 text-primary-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Legal Excellence</h3>
          <p className="text-gray-600">
            We partner with top legal professionals who specialize in property law
            and real estate transactions.
          </p>
        </div>
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Platform</h3>
          <p className="text-gray-600">
            Our platform ensures secure transactions and protects sensitive legal
            documentation.
          </p>
        </div>
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <Globe className="h-8 w-8 text-primary-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Pan-African Reach</h3>
          <p className="text-gray-600">
            We're expanding across Africa to serve property developers in multiple
            markets.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-8 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 font-serif text-center">Our Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-primary-500">500+</p>
            <p className="text-gray-600">Completed Projects</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary-500">200+</p>
            <p className="text-gray-600">Legal Professionals</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary-500">15+</p>
            <p className="text-gray-600">African Countries</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary-500">98%</p>
            <p className="text-gray-600">Client Satisfaction</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 font-serif text-center">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 bg-gray-200 rounded-full mb-4">
              <Users className="h-full w-full p-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Oluwaseun Adebayo</h3>
            <p className="text-gray-600">Chief Executive Officer</p>
          </div>
          <div className="text-center">
            <div className="mx-auto h-24 w-24 bg-gray-200 rounded-full mb-4">
              <Users className="h-full w-full p-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Amina Ibrahim</h3>
            <p className="text-gray-600">Head of Legal Operations</p>
          </div>
          <div className="text-center">
            <div className="mx-auto h-24 w-24 bg-gray-200 rounded-full mb-4">
              <Users className="h-full w-full p-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Kwame Mensah</h3>
            <p className="text-gray-600">Technology Director</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;