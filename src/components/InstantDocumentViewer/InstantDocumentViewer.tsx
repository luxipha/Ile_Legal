/**
 * Instant Loading Legal Document Viewer
 * Powered by FilCDN for ultra-fast document access
 */

import React, { useState, useEffect } from 'react';
import { filCDNService, CDNLoadResult } from '../../services/filCDNService';
import { 
  FileIcon, 
  DownloadIcon, 
  ExternalLinkIcon, 
  ClockIcon,
  ZapIcon,
  ShieldCheckIcon,
  EyeIcon,
  LoaderIcon
} from 'lucide-react';

interface InstantDocumentViewerProps {
  cid: string;
  filename: string;
  fileType?: string;
  fileSize?: number;
  className?: string;
  showPreview?: boolean;
  autoLoad?: boolean;
}

export const InstantDocumentViewer: React.FC<InstantDocumentViewerProps> = ({
  cid,
  filename,
  fileType = 'application/octet-stream',
  fileSize,
  className = '',
  showPreview = true,
  autoLoad = false
}) => {
  const [loadResult, setLoadResult] = useState<CDNLoadResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      handleInstantLoad();
    }
  }, [cid, autoLoad]);

  const handleInstantLoad = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log(`⚡ Starting instant load for: ${filename} (${cid})`);
      
      const result = await filCDNService.loadContent(cid, {
        preferredGateway: 'w3s',
        timeout: 15000,
        retries: 2
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setLoadResult(result);
      
      // Set preview URL for supported file types
      if (showPreview && isPreviewable(fileType)) {
        const viewerUrl = filCDNService.getInstantViewerUrl(cid, fileType);
        setPreviewUrl(viewerUrl);
      }

      console.log(`✅ Document loaded instantly in ${result.loadTime}ms from ${result.gateway}`);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load document';
      setError(errorMsg);
      console.error('❌ Instant load failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isPreviewable = (type: string): boolean => {
    return type.includes('pdf') || 
           type.includes('image') || 
           type.includes('text') ||
           type.includes('json');
  };

  const getFileIcon = () => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('text')) return '📝';
    if (fileType.includes('video')) return '🎥';
    if (fileType.includes('audio')) return '🎵';
    return '📁';
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getGatewayBadge = (gateway: string) => {
    const badges = {
      'w3s': { color: 'bg-blue-100 text-blue-800', label: 'Web3.Storage CDN' },
      'dweb': { color: 'bg-purple-100 text-purple-800', label: 'IPFS dweb' },
      'cloudflare': { color: 'bg-orange-100 text-orange-800', label: 'Cloudflare' },
      'cache': { color: 'bg-green-100 text-green-800', label: 'Cached' },
      'failed': { color: 'bg-red-100 text-red-800', label: 'Failed' }
    };
    
    const badge = badges[gateway as keyof typeof badges] || badges.failed;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className={`border rounded-lg p-4 bg-white shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getFileIcon()}</span>
          <div>
            <h3 className="font-medium text-gray-900 truncate">{filename}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{formatFileSize(fileSize)}</span>
              <span>•</span>
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                {cid.substring(0, 8)}...
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-green-600">
            <ShieldCheckIcon className="w-4 h-4" />
            <span className="text-xs font-medium">Filecoin Verified</span>
          </div>
        </div>
      </div>

      {/* Load Status */}
      {loadResult && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ZapIcon className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Instant Load Status</span>
            </div>
            {getGatewayBadge(loadResult.gateway)}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Load Time:</span>
              <span className="ml-1 font-medium">{loadResult.loadTime}ms</span>
            </div>
            <div>
              <span className="text-gray-600">Source:</span>
              <span className="ml-1 font-medium">{loadResult.cached ? 'Cache' : 'CDN'}</span>
            </div>
            <div>
              <span className="text-gray-600">Gateway:</span>
              <span className="ml-1 font-medium">{loadResult.gateway}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-600">
            <span className="font-medium">Load Failed:</span>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={handleInstantLoad}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <LoaderIcon className="w-4 h-4 animate-spin" />
          ) : (
            <ZapIcon className="w-4 h-4" />
          )}
          {isLoading ? 'Loading...' : 'Instant Load'}
        </button>

        {loadResult && (
          <>
            <a
              href={loadResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <EyeIcon className="w-4 h-4" />
              View
            </a>
            
            <a
              href={loadResult.url}
              download={filename}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <DownloadIcon className="w-4 h-4" />
              Download
            </a>
          </>
        )}

        <button
          onClick={() => {
            const urls = filCDNService.getMultipleCDNUrls ? 
              filCDNService.getMultipleCDNUrls(cid) : 
              [`https://ipfs.io/ipfs/${cid}`];
            console.log('🌐 Alternative CDN URLs:', urls);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          <ExternalLinkIcon className="w-4 h-4" />
          CDN Options
        </button>
      </div>

      {/* Preview */}
      {showPreview && previewUrl && isPreviewable(fileType) && (
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <EyeIcon className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Instant Preview</span>
          </div>
          
          {fileType.includes('image') ? (
            <img 
              src={previewUrl} 
              alt={filename}
              className="max-w-full h-auto rounded-lg border"
              onLoad={() => console.log('✅ Image preview loaded instantly')}
            />
          ) : fileType.includes('pdf') ? (
            <iframe 
              src={previewUrl}
              className="w-full h-96 border rounded-lg"
              title={filename}
              onLoad={() => console.log('✅ PDF preview loaded instantly')}
            />
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <FileIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm text-gray-600">Preview not available for this file type</span>
            </div>
          )}
        </div>
      )}

      {/* Technical Details */}
      <div className="mt-3 pt-3 border-t">
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
            Technical Details
          </summary>
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <div><strong>CID:</strong> {cid}</div>
            <div><strong>File Type:</strong> {fileType}</div>
            <div><strong>CDN URL:</strong> {filCDNService.getInstantViewerUrl(cid, fileType)}</div>
            {loadResult && (
              <>
                <div><strong>Gateway:</strong> {loadResult.gateway}</div>
                <div><strong>Cached:</strong> {loadResult.cached ? 'Yes' : 'No'}</div>
              </>
            )}
          </div>
        </details>
      </div>
    </div>
  );
};