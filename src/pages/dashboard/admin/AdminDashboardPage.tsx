import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Briefcase, Flag, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

// Dummy data for demonstration
const PENDING_VERIFICATIONS = [
  { 
    id: '1', 
    name: 'Chinedu Okonkwo', 
    role: 'Legal Professional',
    specialization: 'Property Law',
    submittedDate: '2025-04-26',
  },
  { 
    id: '2', 
    name: 'Funke Adeyemi', 
    role: 'Legal Professional',
    specialization: 'Real Estate Compliance',
    submittedDate: '2025-04-25',
  },
];

const ACTIVE_DISPUTES = [
  { 
    id: '1', 
    title: 'Payment Dispute - Land Survey Project',
    buyer: 'Evergreen Properties',
    seller: 'Solomon Adebayo',
    amount: '₦120,000',
    openDate: '2025-04-24',
    priority: 'high',
  },
];

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Section */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="px-6 py-5 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Welcome, {user?.name.split(' ')[0] || 'Admin'}
              </h1>
              <p className="mt-1 text-gray-500">
                Admin Dashboard - Manage platform operations
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link
                to="/admin/settings"
                className="btn-primary flex items-center"
              >
                <ShieldCheck className="mr-2 h-5 w-5" />
                Platform Settings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow-card rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-primary-500" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">Total Users</h2>
              <p className="text-3xl font-bold text-primary-500">86</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-card rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Briefcase className="h-8 w-8 text-secondary-500" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">Active Gigs</h2>
              <p className="text-3xl font-bold text-secondary-500">24</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-card rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-success-500" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">Revenue</h2>
              <p className="text-3xl font-bold text-success-500">₦1.2M</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-card rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Flag className="h-8 w-8 text-error-500" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">Disputes</h2>
              <p className="text-3xl font-bold text-error-500">{ACTIVE_DISPUTES.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Verifications */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 sm:px-8">
          <h2 className="text-lg font-medium text-gray-800">Pending Verifications</h2>
          <p className="mt-1 text-sm text-gray-500">
            Legal professionals awaiting verification
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {PENDING_VERIFICATIONS.length > 0 ? (
            PENDING_VERIFICATIONS.map((user) => (
              <div key={user.id} className="px-6 py-5 hover:bg-gray-50 sm:px-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div className="mb-2 sm:mb-0">
                    <Link to={`/admin/verify-users/${user.id}`} className="text-lg font-medium text-primary-500 hover:text-primary-600">
                      {user.name}
                    </Link>
                    <div className="mt-1 text-sm text-gray-500">
                      {user.specialization} • {user.role}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="badge-warning">Pending</span>
                    <span className="text-sm text-gray-500">Submitted: {new Date(user.submittedDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <button className="btn-primary text-sm py-1 px-3">
                    Verify
                  </button>
                  <button className="btn-outline text-sm py-1 px-3">
                    Reject
                  </button>
                  <Link to={`/admin/verify-users/${user.id}`} className="btn-ghost text-sm py-1 px-3">
                    View Details
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-10 text-center sm:px-8">
              <ShieldCheck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending verifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                All legal professionals have been verified.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Active Disputes */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 sm:px-8">
          <h2 className="text-lg font-medium text-gray-800">Active Disputes</h2>
          <p className="mt-1 text-sm text-gray-500">
            Disputes requiring admin intervention
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {ACTIVE_DISPUTES.length > 0 ? (
            ACTIVE_DISPUTES.map((dispute) => (
              <div key={dispute.id} className="px-6 py-5 hover:bg-gray-50 sm:px-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div className="mb-2 sm:mb-0">
                    <Link to={`/admin/disputes/${dispute.id}`} className="text-lg font-medium text-primary-500 hover:text-primary-600">
                      {dispute.title}
                    </Link>
                    <div className="mt-1 text-sm text-gray-500">
                      Between: {dispute.buyer} & {dispute.seller}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-gray-700">{dispute.amount}</span>
                    <div className="flex items-center mt-1">
                      {dispute.priority === 'high' ? (
                        <span className="badge-error">High Priority</span>
                      ) : (
                        <span className="badge-warning">Medium Priority</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Opened: {new Date(dispute.openDate).toLocaleDateString()}
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <Link to={`/admin/disputes/${dispute.id}`} className="btn-primary text-sm py-1 px-3">
                    Resolve
                  </Link>
                  <button className="btn-ghost text-sm py-1 px-3">
                    Contact Parties
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-10 text-center sm:px-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active disputes</h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no disputes requiring your attention at this time.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Platform Analytics */}
      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 sm:px-8">
          <h2 className="text-lg font-medium text-gray-800">Platform Analytics</h2>
          <p className="mt-1 text-sm text-gray-500">
            Summary of platform performance
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">User Growth</h3>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Analytics chart placeholder</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Transaction Volume</h3>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Analytics chart placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;