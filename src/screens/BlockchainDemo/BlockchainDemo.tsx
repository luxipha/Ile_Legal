import React, { useState } from 'react';
import { HashUploader, HashVerifier } from '../../components/blockchain';
import { DocumentHash, HashSubmissionResult, HashVerificationResult } from '../../components/blockchain/shared/types';

export const BlockchainDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'verify'>('upload');
  const [uploadResults, setUploadResults] = useState<HashSubmissionResult[]>([]);
  const [verificationResults, setVerificationResults] = useState<HashVerificationResult[]>([]);

  const handleHashGenerated = (documentHash: DocumentHash) => {
    console.log('Hash generated:', documentHash);
  };

  const handleSubmissionComplete = (result: HashSubmissionResult) => {
    console.log('Submission complete:', result);
    setUploadResults(prev => [result, ...prev]);
  };

  const handleVerificationComplete = (result: HashVerificationResult) => {
    console.log('Verification complete:', result);
    setVerificationResults(prev => [result, ...prev]);
  };

  const handleError = (error: string) => {
    console.error('Blockchain operation error:', error);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Algorand Document Verification
          </h1>
          <p className="text-gray-600">
            Secure document hashing and verification on the Algorand blockchain
          </p>
          
          {/* Demo Notice */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-yellow-800">
              <strong>🎯 Demo Mode:</strong> This demonstration uses simulated blockchain transactions. 
              In production, this would connect to real Algorand accounts and submit actual transactions.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📤 Upload & Hash Documents
              </button>
              <button
                onClick={() => setActiveTab('verify')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'verify'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔍 Verify Documents
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'upload' && (
            <>
              <HashUploader
                onHashGenerated={handleHashGenerated}
                onSubmissionComplete={handleSubmissionComplete}
                onError={handleError}
                className="mb-6"
              />
              
              {/* Upload Results History */}
              {uploadResults.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Upload History</h3>
                  <div className="space-y-4">
                    {uploadResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{result.documentHash.fileName}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(result.documentHash.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {result.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        {result.transaction && (
                          <div className="mt-2 text-xs text-gray-600">
                            <p>TX: {result.transaction.txId}</p>
                            <p>Round: {result.transaction.confirmedRound}</p>
                          </div>
                        )}
                        {result.error && (
                          <p className="mt-2 text-sm text-red-600">{result.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'verify' && (
            <>
              <HashVerifier
                onVerificationComplete={handleVerificationComplete}
                onError={handleError}
                className="mb-6"
                searchRounds={1000}
              />
              
              {/* Verification Results History */}
              {verificationResults.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Verification History</h3>
                  <div className="space-y-4">
                    {verificationResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          result.exists ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{result.documentHash.fileName}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(result.verificationTimestamp).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            result.exists ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {result.exists ? 'Verified' : 'Not Found'}
                          </span>
                        </div>
                        {result.transaction && (
                          <div className="mt-2 text-xs text-gray-600">
                            <p>TX: {result.transaction.txId}</p>
                            <p>Round: {result.transaction.confirmedRound}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">About This Demo</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              This demonstration shows how PDF legal documents can be securely hashed and verified using the Algorand blockchain.
            </p>
            <p>
              <strong>Upload Tab:</strong> Generate SHA-256 hashes of PDF documents and submit them to the Algorand TestNet as transaction notes.
            </p>
            <p>
              <strong>Verify Tab:</strong> Check if a PDF document's hash exists on the blockchain to verify its authenticity and timestamp.
            </p>
            <p>
              <strong>Supported Files:</strong> PDF documents only (up to 50MB)
            </p>
            <p className="text-xs text-blue-600 mt-4">
              Note: This demo uses Algorand TestNet. In production, you would need funded accounts to pay transaction fees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};