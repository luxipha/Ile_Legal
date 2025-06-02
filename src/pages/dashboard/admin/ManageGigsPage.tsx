import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react';

const ManageGigsPage: React.FC = () => {
  // Mock data for gigs
  const GIGS = [
    {
      id: '1',
      title: 'Land Title Verification - Victoria Island Property',
      client: 'Lagos Properties Ltd.',
      provider: 'Chinedu Okonkwo',
      budget: '₦65,000',
      status: 'active',
      postedDate: '2025-04-26',
      deadline: '2025-05-15',
      flags: ['high_value', 'urgent'],
    },
    {
      id: '2',
      title: 'Contract Review for Commercial Lease',
      client: 'Commercial Realty',
      provider: 'Pending Assignment',
      budget: '₦45,000',
      status: 'pending',
      postedDate: '2025-04-25',
      deadline: '2025-05-10',
      flags: ['new'],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage Gigs</h1>
        <div className="flex items-center space-x-3">
          <select className="input">
            <option value="all">All Gigs</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-card rounded-lg divide-y divide-gray-200">
        {GIGS.map((gig) => (
          <div key={gig.id} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <Link to={`/gigs/${gig.id}`} className="text-lg font-medium text-primary-500 hover:text-primary-600">
                  {gig.title}
                </Link>
                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                  <span>Client: {gig.client}</span>
                  <span>Provider: {gig.provider}</span>
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  {gig.flags.includes('high_value') && (
                    <span className="badge-warning flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      High Value
                    </span>
                  )}
                  {gig.flags.includes('urgent') && (
                    <span className="badge-error flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Urgent
                    </span>
                  )}
                  {gig.flags.includes('new') && (
                    <span className="badge-success flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      New
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">{gig.budget}</span>
                <p className="text-sm text-gray-500">
                  Posted: {new Date(gig.postedDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  Due: {new Date(gig.deadline).toLocaleDateString()}
                </div>
                <div className="flex items-center text-gray-500">
                  <Shield className="h-4 w-4 mr-1" />
                  {gig.status === 'active' ? 'In Progress' : 'Pending Assignment'}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Link to={`/gigs/${gig.id}`} className="btn-outline text-sm">
                  View Details
                </Link>
                <button className="btn-ghost text-sm text-error-500">
                  Flag for Review
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageGigsPage;