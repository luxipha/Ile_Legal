import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, ShieldCheck, Scale, Clock, BadgeCheck, Briefcase } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <div className="bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-serif text-primary-500">
              Simplifying Legal Due Diligence for<br />
              Property Transactions
            </h1>
            <p className="text-lg md:text-xl mb-8 text-gray-600 max-w-3xl mx-auto">
              Connect with verified legal professionals for property due diligence and
              compliance tasks in Africa's real estate market
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                to="/register"
                className="btn bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-md font-medium text-lg shadow-lg transition-all duration-300"
              >
                Hire Legal Professionals
              </Link>
              <Link
                to="/register"
                className="btn bg-white hover:bg-gray-50 text-primary-500 border border-primary-500 px-8 py-3 rounded-md font-medium text-lg transition-colors"
              >
                Join as Legal Professional
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary-500 font-serif">How Ilé Legal Works</h2>
            <p className="mt-4 text-lg text-gray-500">
              Our marketplace simplifies property due diligence by connecting you with verified legal professionals.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                <Briefcase className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-gray-800">Post Your Requirements</h3>
              <p className="mt-2 text-gray-600">
                Specify your property due diligence needs, budget, and timeline for legal professionals to review.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-gray-800">Receive Expert Bids</h3>
              <p className="mt-2 text-gray-600">
                Verified legal professionals submit proposals based on your requirements and budget.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-primary-500" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-gray-800">Get Work Completed</h3>
              <p className="mt-2 text-gray-600">
                Select the best provider, use secure escrow payments, and receive quality legal work on time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Section */}
      <div className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary-500 font-serif">Why Choose Ilé Legal</h2>
            <p className="mt-4 text-lg text-gray-500">
              Our platform offers unique advantages for property transactions in Africa.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <BadgeCheck className="h-6 w-6 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Verified Professionals</h3>
              <p className="mt-2 text-gray-600">
                All legal experts on our platform are thoroughly vetted and have their credentials verified.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Time-Saving</h3>
              <p className="mt-2 text-gray-600">
                Reduce the time spent finding and vetting legal professionals for your property transactions.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Secure Transactions</h3>
              <p className="mt-2 text-gray-600">
                Our escrow system ensures payment is released only when work meets your requirements.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold font-serif mb-4">
              Ready to streamline your property<br />due diligence?
            </h2>
            <p className="text-lg mb-8">
              Join Ilé Legal today and connect with verified legal professionals across Africa.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                to="/register"
                className="btn bg-white hover:bg-gray-50 text-primary-500 px-8 py-3 rounded-md font-medium text-lg"
              >
                Register Now
              </Link>
              <Link
                to="/login"
                className="btn bg-transparent hover:bg-primary-600 text-white border border-white px-8 py-3 rounded-md font-medium text-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;