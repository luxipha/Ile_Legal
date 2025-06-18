import React, { useState, useCallback, useRef } from 'react';
import { HashVerifierProps, HashVerifierState } from './types';
import { HashUtils } from '../shared/hashUtils';
import { AlgorandService } from '../shared/algorandService';
import { DocumentHash, HashVerificationResult } from '../shared/types';
import { DocumentPreview } from '../shared/DocumentPreview';

export const HashVerifier: React.FC<HashVerifierProps> = ({
  onVerificationComplete,
  onError,
  className = '',
  disabled = false,
  maxFileSize = 50 * 1024 * 1024, // 50MB default for PDFs
  acceptedFileTypes = ['.pdf', 'application/pdf'],
  searchRounds = 1000
}) => {
  const [state, setState] = useState<HashVerifierState>({
    dragActive: false,
    selectedFile: null,
    isHashing: false,
    isVerifying: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const algorandService = new AlgorandService();

  const updateState = useCallback((updates: Partial<HashVerifierState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleError = useCallback((error: string) => {
    updateState({ error: { code: 'VERIFICATION_ERROR', message: error } });
    onError?.(error);
  }, [updateState, onError]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (disabled) return;

    // Validate file
    const validation = HashUtils.validateFile(file);
    if (!validation.valid) {
      handleError(validation.error?.message || 'Invalid file');
      return;
    }

    updateState({ 
      selectedFile: file, 
      isHashing: true, 
      error: undefined,
      documentHash: undefined,
      verificationResult: undefined
    });

    try {
      // Generate hash
      const fileResult = await HashUtils.hashFile(file);
      const documentHash = HashUtils.createDocumentHash(fileResult);

      updateState({ 
        isHashing: false, 
        documentHash,
        isVerifying: true
      });

      // Automatically start verification
      await performVerification(documentHash);

    } catch (error) {
      updateState({ isHashing: false, isVerifying: false });
      handleError(error instanceof Error ? error.message : 'Failed to process file');
    }
  }, [disabled, updateState, handleError]);

  const performVerification = useCallback(async (documentHash: DocumentHash) => {
    try {
      updateState({ isVerifying: true, error: undefined });

      const result = await algorandService.verifyDocumentHash(documentHash, searchRounds);

      updateState({ 
        isVerifying: false, 
        verificationResult: result 
      });

      onVerificationComplete?.(result);

    } catch (error) {
      updateState({ isVerifying: false });
      handleError(error instanceof Error ? error.message : 'Verification failed');
    }
  }, [algorandService, searchRounds, updateState, onVerificationComplete, handleError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !state.dragActive) {
      updateState({ dragActive: true });
    }
  }, [disabled, state.dragActive, updateState]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateState({ dragActive: false });
  }, [updateState]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateState({ dragActive: false });

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, updateState, handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleBrowseClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const resetVerifier = useCallback(() => {
    setState({
      dragActive: false,
      selectedFile: null,
      isHashing: false,
      isVerifying: false
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleRetryVerification = useCallback(() => {
    if (state.documentHash) {
      performVerification(state.documentHash);
    }
  }, [state.documentHash, performVerification]);

  return (
    <div className={`hash-verifier ${className}`}>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Document Hash Verifier</h3>
        
        {/* File Upload Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${state.dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-purple-400'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileInputChange}
            accept={acceptedFileTypes.join(',')}
            disabled={disabled}
          />
          
          <div className="space-y-2">
            <div className="text-4xl text-gray-400">🔍</div>
            {state.isHashing ? (
              <div className="text-purple-600">
                <div className="animate-spin inline-block w-6 h-6 border-4 border-current border-t-transparent rounded-full mb-2"></div>
                <p>Generating hash...</p>
              </div>
            ) : state.isVerifying ? (
              <div className="text-purple-600">
                <div className="animate-spin inline-block w-6 h-6 border-4 border-current border-t-transparent rounded-full mb-2"></div>
                <p>Verifying on blockchain...</p>
              </div>
            ) : (
              <>
                <p className="text-lg text-gray-600">
                  Drop your PDF document here to verify its authenticity
                </p>
                <p className="text-sm text-gray-500">
                  Only PDF files • We'll check if this document exists on the Algorand blockchain
                </p>
              </>
            )}
          </div>
        </div>

        {/* Selected File Info with Preview */}
        {state.selectedFile && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Verifying Document:</h4>
            <div className="flex items-start space-x-4">
              {/* Document Preview */}
              <DocumentPreview file={state.selectedFile} size="medium" />
              
              {/* File Details */}
              <div className="flex-grow text-sm space-y-1">
                <p><span className="font-medium">Name:</span> {state.selectedFile.name}</p>
                <p><span className="font-medium">Size:</span> {HashUtils.formatFileSize(state.selectedFile.size)}</p>
                <p><span className="font-medium">Type:</span> {state.selectedFile.type || 'Unknown'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Document Hash */}
        {state.documentHash && (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold mb-2 text-purple-800">Document Hash:</h4>
            <div className="text-sm space-y-2">
              <div className="font-mono bg-white p-2 rounded border break-all text-xs">
                {state.documentHash.hash}
              </div>
              <div className="text-gray-600">
                <p>Algorithm: {state.documentHash.algorithm}</p>
                <p>Generated: {new Date(state.documentHash.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Result */}
        {state.verificationResult && (
          <div className={`mt-4 p-4 rounded-lg ${
            state.verificationResult.exists ? 'bg-green-50' : 'bg-orange-50'
          }`}>
            {state.verificationResult.exists ? (
              <div className="text-green-800">
                <h4 className="font-semibold mb-2 flex items-center">
                  <span className="text-2xl mr-2">✅</span>
                  Document Verified on Blockchain!
                </h4>
                <div className="text-sm space-y-2">
                  <p className="font-medium">This document has been verified and exists on the Algorand blockchain.</p>
                  {state.verificationResult.transaction && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <h5 className="font-semibold mb-1">Transaction Details:</h5>
                      <div className="space-y-2 text-xs">
                        <p><span className="font-medium">Transaction ID:</span> {state.verificationResult.transaction.txId}</p>
                        <p><span className="font-medium">Block Round:</span> {state.verificationResult.transaction.confirmedRound}</p>
                        <p><span className="font-medium">Fee Paid:</span> {state.verificationResult.transaction.fee} microAlgos</p>
                        
                        {/* AlgoExplorer Link */}
                        <div className="mt-2">
                          <a
                            href={algorandService.getExplorerUrl(state.verificationResult.transaction.txId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            🔍 View on AlgoExplorer
                            <span className="ml-1">↗</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-600">
                    Verified on: {new Date(state.verificationResult.verificationTimestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-orange-800">
                <h4 className="font-semibold mb-2 flex items-center">
                  <span className="text-2xl mr-2">⚠️</span>
                  Document Not Found on Blockchain
                </h4>
                <div className="text-sm space-y-2">
                  <p>This document's hash was not found on the Algorand blockchain.</p>
                  <p className="text-xs">This could mean:</p>
                  <ul className="text-xs list-disc list-inside ml-4">
                    <li>The document has not been submitted to the blockchain</li>
                    <li>The document has been modified since submission</li>
                    <li>The document was submitted outside our search range (last {searchRounds} blocks)</li>
                  </ul>
                  <p className="text-xs text-gray-600">
                    Verified on: {new Date(state.verificationResult.verificationTimestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {state.error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <div className="text-red-800">
              <h4 className="font-semibold mb-1">Verification Error</h4>
              <p className="text-sm">{state.error.message}</p>
              {state.documentHash && (
                <button
                  onClick={handleRetryVerification}
                  className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Retry Verification
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          {(state.selectedFile || state.error || state.verificationResult) && (
            <button
              onClick={resetVerifier}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Verify Another Document
            </button>
          )}
          
          {state.verificationResult && !state.verificationResult.exists && state.documentHash && (
            <button
              onClick={handleRetryVerification}
              disabled={state.isVerifying}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                ${state.isVerifying
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
                }
              `}
            >
              {state.isVerifying ? 'Searching...' : 'Search Again'}
            </button>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">How It Works</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• We generate a SHA-256 hash of your uploaded document</p>
            <p>• We search the Algorand blockchain for this exact hash</p>
            <p>• If found, we display the transaction details as proof of authenticity</p>
            <p>• Currently searching the last {searchRounds.toLocaleString()} blocks</p>
          </div>
        </div>
      </div>
    </div>
  );
};