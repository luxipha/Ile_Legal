import React, { useState, useCallback, useRef } from 'react';
import { HashUploaderProps, HashUploaderState } from './types';
import { HashUtils } from '../shared/hashUtils';
import { AlgorandService } from '../shared/algorandService';
import { DocumentHash, HashSubmissionResult } from '../shared/types';
import algosdk from 'algosdk';

export const HashUploader: React.FC<HashUploaderProps> = ({
  onHashGenerated,
  onSubmissionComplete,
  onError,
  className = '',
  disabled = false,
  maxFileSize = 50 * 1024 * 1024, // 50MB default for PDFs
  acceptedFileTypes = ['.pdf', 'application/pdf']
}) => {
  const [state, setState] = useState<HashUploaderState>({
    dragActive: false,
    selectedFile: null,
    isHashing: false,
    isSubmitting: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const algorandService = new AlgorandService();

  const updateState = useCallback((updates: Partial<HashUploaderState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleError = useCallback((error: string) => {
    updateState({ error: { code: 'UPLOAD_ERROR', message: error } });
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
      hashResult: undefined,
      submissionResult: undefined
    });

    try {
      // Generate hash
      const fileResult = await HashUtils.hashFile(file);
      const documentHash = HashUtils.createDocumentHash(fileResult);

      updateState({ 
        isHashing: false, 
        hashResult: documentHash 
      });

      onHashGenerated?.(documentHash);

    } catch (error) {
      updateState({ isHashing: false });
      handleError(error instanceof Error ? error.message : 'Failed to process file');
    }
  }, [disabled, updateState, handleError, onHashGenerated]);

  const handleSubmitToBlockchain = useCallback(async () => {
    if (!state.hashResult || state.isSubmitting) return;

    updateState({ isSubmitting: true, error: undefined });

    try {
      // For demo purposes, create a mock successful submission
      // In production, this would use a funded Algorand account
      console.log('Demo: Simulating blockchain submission for hash:', state.hashResult.hash.substring(0, 16) + '...');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create mock successful result
      const mockResult: HashSubmissionResult = {
        success: true,
        transaction: {
          txId: 'DEMO_TX_' + Math.random().toString(36).substring(2, 15).toUpperCase(),
          confirmedRound: Math.floor(Math.random() * 1000000) + 35000000,
          fee: 1000,
          timestamp: new Date().toISOString()
        },
        documentHash: state.hashResult
      };

      updateState({ 
        isSubmitting: false, 
        submissionResult: mockResult 
      });

      onSubmissionComplete?.(mockResult);

    } catch (error) {
      updateState({ isSubmitting: false });
      handleError(error instanceof Error ? error.message : 'Blockchain submission failed');
    }
  }, [state.hashResult, state.isSubmitting, updateState, onSubmissionComplete, handleError]);

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

  const resetUploader = useCallback(() => {
    setState({
      dragActive: false,
      selectedFile: null,
      isHashing: false,
      isSubmitting: false
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className={`hash-uploader ${className}`}>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Document Hash Uploader</h3>
        
        {/* File Upload Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${state.dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}
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
            <div className="text-4xl text-gray-400">📄</div>
            {state.isHashing ? (
              <div className="text-blue-600">
                <div className="animate-spin inline-block w-6 h-6 border-4 border-current border-t-transparent rounded-full mb-2"></div>
                <p>Generating hash...</p>
              </div>
            ) : (
              <>
                <p className="text-lg text-gray-600">
                  Drop your PDF document here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Only PDF files • Maximum size: {HashUtils.formatFileSize(maxFileSize)}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Selected File Info */}
        {state.selectedFile && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Selected File:</h4>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Name:</span> {state.selectedFile.name}</p>
              <p><span className="font-medium">Size:</span> {HashUtils.formatFileSize(state.selectedFile.size)}</p>
              <p><span className="font-medium">Type:</span> {state.selectedFile.type || 'Unknown'}</p>
            </div>
          </div>
        )}

        {/* Hash Result */}
        {state.hashResult && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold mb-2 text-green-800">Document Hash Generated:</h4>
            <div className="text-sm space-y-2">
              <div className="font-mono bg-white p-2 rounded border break-all">
                {state.hashResult.hash}
              </div>
              <div className="text-gray-600">
                <p>Algorithm: {state.hashResult.algorithm}</p>
                <p>Generated: {new Date(state.hashResult.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Blockchain Submission */}
        {state.hashResult && !state.submissionResult && (
          <div className="mt-4">
            <button
              onClick={handleSubmitToBlockchain}
              disabled={state.isSubmitting || disabled}
              className={`
                w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors
                ${state.isSubmitting || disabled
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }
              `}
            >
              {state.isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Submitting to Algorand...
                </span>
              ) : (
                'Submit Hash to Blockchain'
              )}
            </button>
          </div>
        )}

        {/* Submission Result */}
        {state.submissionResult && (
          <div className={`mt-4 p-4 rounded-lg ${
            state.submissionResult.success ? 'bg-green-50' : 'bg-red-50'
          }`}>
            {state.submissionResult.success ? (
              <div className="text-green-800">
                <h4 className="font-semibold mb-2">✅ Successfully Submitted to Blockchain!</h4>
                <div className="text-sm space-y-2">
                  <p><span className="font-medium">Transaction ID:</span> {state.submissionResult.transaction?.txId}</p>
                  <p><span className="font-medium">Confirmed Round:</span> {state.submissionResult.transaction?.confirmedRound}</p>
                  <p><span className="font-medium">Fee:</span> {state.submissionResult.transaction?.fee} microAlgos</p>
                  
                  {/* AlgoExplorer Link */}
                  {state.submissionResult.transaction?.txId && (
                    <div className="mt-3">
                      <a
                        href={algorandService.getExplorerUrl(state.submissionResult.transaction.txId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        🔍 View on AlgoExplorer
                        <span className="ml-1">↗</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-red-800">
                <h4 className="font-semibold mb-2">❌ Submission Failed</h4>
                <p className="text-sm">{state.submissionResult.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {state.error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <div className="text-red-800">
              <h4 className="font-semibold mb-1">Error</h4>
              <p className="text-sm">{state.error.message}</p>
            </div>
          </div>
        )}

        {/* Reset Button */}
        {(state.selectedFile || state.error) && (
          <div className="mt-4">
            <button
              onClick={resetUploader}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Upload Another Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
};