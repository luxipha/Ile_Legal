import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ipfsService, IPFSUploadResult } from '../../services/ipfsService';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { 
  UploadIcon, 
  FileIcon, 
  CheckCircleIcon, 
  AlertCircleIcon,
  ExternalLinkIcon,
  CopyIcon,
  TrashIcon,
  CloudIcon
} from 'lucide-react';

interface IPFSUploaderProps {
  onUploadComplete?: (results: IPFSUploadResult[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  acceptedFileTypes?: { [key: string]: string[] };
  className?: string;
}

interface UploadedFile extends IPFSUploadResult {
  file: File;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export const IPFSUploader: React.FC<IPFSUploaderProps> = ({
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  acceptedFileTypes = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png']
  },
  className = ''
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  // Test IPFS connection on component mount
  React.useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const result = await ipfsService.testConnection();
      setConnectionStatus(result.connected ? 'connected' : 'disconnected');
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      cid: '',
      path: '',
      size: 0,
      url: '',
      status: 'uploading' as const
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    try {
      const uploadPromises = acceptedFiles.map(async (file, index) => {
        try {
          const result = await ipfsService.uploadFile(file);
          
          setUploadedFiles(prev => {
            const updated = [...prev];
            const fileIndex = updated.findIndex(f => f.file === file);
            if (fileIndex !== -1) {
              updated[fileIndex] = {
                ...updated[fileIndex],
                ...result,
                status: 'success'
              };
            }
            return updated;
          });

          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          
          setUploadedFiles(prev => {
            const updated = [...prev];
            const fileIndex = updated.findIndex(f => f.file === file);
            if (fileIndex !== -1) {
              updated[fileIndex] = {
                ...updated[fileIndex],
                status: 'error',
                error: errorMessage
              };
            }
            return updated;
          });

          throw error;
        }
      });

      const results = await Promise.all(uploadPromises);
      onUploadComplete?.(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles,
    disabled: isUploading || connectionStatus === 'disconnected'
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You might want to show a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>;
      case 'success':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircleIcon className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm">
        <CloudIcon className={`w-4 h-4 ${
          connectionStatus === 'connected' ? 'text-green-500' :
          connectionStatus === 'disconnected' ? 'text-red-500' : 'text-gray-400'
        }`} />
        <span className={
          connectionStatus === 'connected' ? 'text-green-700' :
          connectionStatus === 'disconnected' ? 'text-red-700' : 'text-gray-600'
        }>
          IPFS: {
            connectionStatus === 'connected' ? 'Connected' :
            connectionStatus === 'disconnected' ? 'Disconnected' : 'Checking...'
          }
        </span>
        {connectionStatus === 'disconnected' && (
          <Button
            variant="outline"
            size="sm"
            onClick={testConnection}
            className="ml-2"
          >
            Retry
          </Button>
        )}
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive 
            ? 'border-green-400 bg-green-50' 
            : connectionStatus === 'disconnected'
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
        }`}
      >
        <input {...getInputProps()} />
        <UploadIcon className={`w-12 h-12 mx-auto mb-4 ${
          connectionStatus === 'disconnected' ? 'text-gray-300' : 'text-gray-400'
        }`} />
        
        {connectionStatus === 'disconnected' ? (
          <>
            <p className="text-gray-500 mb-2">IPFS Connection Required</p>
            <p className="text-sm text-gray-400">
              Please check your IPFS connection to upload files
            </p>
          </>
        ) : isDragActive ? (
          <>
            <p className="text-green-700 mb-2">Drop the files here...</p>
            <p className="text-sm text-green-600">Files will be uploaded to IPFS</p>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Files will be stored on IPFS for permanent, decentralized access
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supported: PDF, DOC, DOCX, TXT, JPG, PNG (max {maxFiles} files)
            </p>
          </>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Uploaded Files</h3>
          {uploadedFiles.map((file, index) => (
            <Card key={index} className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.file.size)}
                      </p>
                      {file.status === 'success' && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">CID:</span>
                            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono">
                              {file.cid.substring(0, 20)}...
                            </code>
                            <button
                              onClick={() => copyToClipboard(file.cid)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <CopyIcon className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              View on IPFS
                              <ExternalLinkIcon className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )}
                      {file.status === 'error' && (
                        <p className="text-xs text-red-600 mt-1">{file.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(file.status)}
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-600"
                      disabled={file.status === 'uploading'}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Uploading to IPFS...</p>
        </div>
      )}
    </div>
  );
};