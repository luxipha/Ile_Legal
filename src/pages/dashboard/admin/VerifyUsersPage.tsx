import React from 'react';
import { useParams } from 'react-router-dom';
import { User, Shield, CheckCircle, XCircle } from 'lucide-react';

const VerifyUsersPage: React.FC = () => {
  const { userId } = useParams();

  // Mock data for pending verifications
  const PENDING_VERIFICATIONS = [
    {
      id: '1',
      name: 'Chinedu Okonkwo',
      email: 'chinedu@example.com',
      role: 'Legal Professional',
      specialization: 'Property Law',
      submittedDate: '2025-04-26',
      documents: [
        { name: 'Bar Certificate', status: 'verified' },
        { name: 'Professional ID', status: 'pending' },
        { name: 'Practice License', status: 'verified' },
      ],
    },
    {
      id: '2',
      name: 'Funke Adeyemi',
      email: 'funke@example.com',
      role: 'Legal Professional',
      specialization: 'Real Estate Compliance',
      submittedDate: '2025-04-25',
      documents: [
        { name: 'Bar Certificate', status: 'verified' },
        { name: 'Professional ID', status: 'verified' },
        { name: 'Practice License', status: 'pending' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Verify Legal Professionals</h1>
        <div className="flex items-center space-x-3">
          <select className="input">
            <option value="all">All Verifications</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-card rounded-lg divide-y divide-gray-200">
        {PENDING_VERIFICATIONS.map((user) => (
          <div key={user.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-500" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{user.name}</h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="mt-1 flex items-center">
                    <Shield className="h-4 w-4 text-secondary-500 mr-1" />
                    <span className="text-sm text-gray-700">{user.specialization}</span>
                  </div>
                </div>
              </div>
              <span className="badge-warning">Pending Verification</span>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700">Submitted Documents</h3>
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {user.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="relative rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {doc.status === 'verified' ? (
                          <CheckCircle className="h-5 w-5 text-success-500" />
                        ) : (
                          <Shield className="h-5 w-5 text-warning-500" />
                        )}
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">{doc.name}</h4>
                        <p className="text-sm text-gray-500 capitalize">{doc.status}</p>
                      </div>
                    </div>
                    <button className="btn-ghost text-sm">View</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button className="btn-primary flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </button>
              <button className="btn-outline text-error-500 border-error-500 hover:bg-error-50">
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </button>
              <button className="btn-ghost">
                Request More Info
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VerifyUsersPage;