import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="text-center animate-fadeIn">
        <div className="mx-auto h-24 w-24 text-primary-500">
          <AlertTriangle className="h-full w-full" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 font-serif">Page not found</h1>
        <p className="mt-4 text-base text-gray-500">Sorry, we couldn't find the page you're looking for.</p>
        <div className="mt-8">
          <Link to="/" className="btn-primary flex items-center justify-center mx-auto w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;