import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { 
  ShieldCheckIcon, 
  CalendarIcon, 
  BuildingIcon,
  ExternalLinkIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon
} from 'lucide-react';
import { reputationService, LegalCredential } from '../../services/reputationService';

interface LegalCredentialsProps {
  userId: string;
  showAddButton?: boolean;
  className?: string;
}

export const LegalCredentials: React.FC<LegalCredentialsProps> = ({
  userId,
  showAddButton = false,
  className = ''
}) => {
  const [credentials, setCredentials] = useState<LegalCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCredentials = async () => {
      console.log('🔍 Fetching credentials for userId:', userId);
      
      try {
        setLoading(true);
        setError(null);
        
        if (!userId || userId.trim() === '') {
          throw new Error('No user ID provided');
        }
        
        const userCredentials = await reputationService.getUserCredentials(userId);
        console.log('✅ Credentials fetched:', userCredentials);
        setCredentials(userCredentials);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load credentials';
        setError(errorMsg);
        console.error('❌ Error fetching credentials for userId', userId, ':', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchCredentials();
    } else {
      console.warn('⚠️ No userId provided to LegalCredentials');
      setLoading(false);
      setError('No user ID provided');
    }
  }, [userId]);

  const getCredentialIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bar_license':
        return <ShieldCheckIcon className="w-5 h-5 text-blue-600" />;
      case 'certification':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'education':
        return <BuildingIcon className="w-5 h-5 text-purple-600" />;
      default:
        return <ShieldCheckIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'expired':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'revoked':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-yellow-600" />;
      case 'expired':
      case 'revoked':
        return <AlertCircleIcon className="w-4 h-4 text-red-600" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    return expiry <= threeMonthsFromNow && expiry >= now;
  };

  if (loading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardContent className="p-4">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
            Legal Credentials
          </h3>
          {showAddButton && (
            <button 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => {
                // TODO: Open credential upload modal
                console.log('Add new credential');
              }}
            >
              + Add Credential
            </button>
          )}
        </div>

        {error && (
          <div className="text-center text-gray-500 text-sm py-4">
            {error}
          </div>
        )}

        {!error && credentials.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            <ShieldCheckIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>No verified credentials yet</p>
            {showAddButton && (
              <p className="text-xs mt-1">Upload your professional credentials to build trust</p>
            )}
          </div>
        )}

        {credentials.length > 0 && (
          <div className="space-y-3">
            {credentials.map((credential) => (
              <div key={credential.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getCredentialIcon(credential.credential_type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {credential.credential_name}
                        </h4>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(credential.verification_status)}`}>
                          {getStatusIcon(credential.verification_status)}
                          {credential.verification_status.replace('_', ' ').toUpperCase()}
                        </div>
                        {isExpiringSoon(credential.expiry_date) && (
                          <div className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                            Expiring Soon
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1 mb-1">
                          <BuildingIcon className="w-3 h-3" />
                          <span>{credential.issuing_authority}</span>
                        </div>
                        {credential.jurisdiction && (
                          <div className="text-xs text-gray-500">
                            Jurisdiction: {credential.jurisdiction}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {credential.issued_date && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            <span>Issued: {formatDate(credential.issued_date)}</span>
                          </div>
                        )}
                        {credential.expiry_date && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            <span>Expires: {formatDate(credential.expiry_date)}</span>
                          </div>
                        )}
                      </div>

                      {credential.blockchain_tx_id && (
                        <div className="mt-2 text-xs text-blue-600">
                          <div className="flex items-center gap-1">
                            <ShieldCheckIcon className="w-3 h-3" />
                            <span>Blockchain verified: {credential.blockchain_tx_id.substring(0, 16)}...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {credential.ipfs_cid && (
                    <button
                      onClick={() => {
                        // TODO: Open credential document in new tab
                        const ipfsUrl = `https://ipfs.io/ipfs/${credential.ipfs_cid}`;
                        window.open(ipfsUrl, '_blank');
                      }}
                      className="text-gray-400 hover:text-blue-600 p-1"
                      title="View credential document"
                    >
                      <ExternalLinkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {credentials.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <ShieldCheckIcon className="w-3 h-3" />
                <span>All credentials are blockchain verified</span>
              </div>
              <div className="text-right">
                <span>{credentials.filter(c => c.verification_status === 'verified').length} verified</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LegalCredentials;