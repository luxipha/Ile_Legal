// components/messaging/FileAttachmentPreview.tsx
import React from 'react';
import { FileAttachmentPreviewProps } from './types/messaging';

export const FileAttachmentPreview: React.FC<FileAttachmentPreviewProps> = ({
  file,
  onRemove,
  uploadProgress
}) => {
  const isImage = file.type.startsWith('image/');
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
      {/* File preview */}
      <div className="flex-shrink-0">
        {isImage ? (
          <img
            src={URL.createObjectURL(file)}
            alt="Preview"
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
        
        {/* Upload progress */}
        {uploadProgress && (
          <div className="mt-1">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all ${
                  uploadProgress.status === 'completed' ? 'bg-green-500' :
                  uploadProgress.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {uploadProgress.status === 'uploading' && `Uploading... ${uploadProgress.progress}%`}
              {uploadProgress.status === 'completed' && 'Upload complete'}
              {uploadProgress.status === 'failed' && 'Upload failed'}
            </p>
          </div>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
        title="Remove attachment"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};