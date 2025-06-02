import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Scale } from 'lucide-react';

const AuthLayout: React.FC = () => {
  const { user } = useAuth();

  // Redirect if user is already logged in
  if (user) {
    const redirectPath = user.role === 'buyer' ? '/buyer/dashboard' : 
                          user.role === 'seller' ? '/seller/dashboard' : 
                          user.role === 'admin' ? '/admin/dashboard' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Scale size={40} className="text-primary-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-800 font-serif">
          Ilé Legal Marketplace
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-card sm:rounded-lg sm:px-10 animate-fadeIn">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;