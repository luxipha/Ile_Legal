import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { CloudIcon, DownloadIcon, EyeIcon, TimerIcon, CheckCircleIcon, AlertTriangleIcon } from 'lucide-react';
import { filCDNService, CDNLoadResult, CDNLoadOptions } from '../../services/filCDNService';

interface FilCDNViewerProps {
  cid: string;
  fileName?: string;
  description?: string;
  className?: string;
  autoLoad?: boolean;
  showDetails?: boolean;
  onLoadComplete?: (result: CDNLoadResult) => void;
  onError?: (error: string) => void;
}

export const FilCDNViewer: React.FC<FilCDNViewerProps> = ({
  cid,
  fileName = 'Document',
  description = 'Load document from FilCDN',
  className = '',
  autoLoad = false,
  showDetails = true,
  onLoadComplete,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [loadResult, setLoadResult] = useState<CDNLoadResult | null>(null);
  const [error, setError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const loadContent = useCallback(async (options: CDNLoadOptions = {}) => {
    if (!cid) {
      const errorMsg = 'CID is required';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log(`🌐 FilCDN: Loading content for CID: ${cid}`);
      
      const result = await filCDNService.loadContent(cid, {
        priority: 'high',
        verifyIntegrity: true,
        preferredGateway: 'w3s',
        ...options
      });

      console.log(`✅ FilCDN: Content loaded successfully:`, {
        gateway: result.gateway,
        loadTime: result.loadTime,
        cached: result.cached,
        source: result.source,
        size: result.size
      });

      setLoadResult(result);
      
      // Create blob URL for preview if content is available
      if (result.content) {
        const blobUrl = URL.createObjectURL(result.content);
        setPreviewUrl(blobUrl);
      } else {
        setPreviewUrl(result.url);
      }
      
      onLoadComplete?.(result);
      
    } catch (loadError: any) {
      const errorMsg = `Failed to load content: ${loadError.message}`;
      console.error('❌ FilCDN load error:', loadError);
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [cid, onLoadComplete, onError]);

  const handleDownload = useCallback(() => {
    if (!loadResult || !previewUrl) return;

    try {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = fileName || `filcdn-${cid.substring(0, 8)}.file`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`📥 Downloaded file: ${fileName}`);
    } catch (downloadError) {
      console.error('Download failed:', downloadError);
      setError('Download failed');
    }
  }, [loadResult, previewUrl, fileName, cid]);

  const handlePreview = useCallback(() => {
    if (!previewUrl) return;
    
    window.open(previewUrl, '_blank');
  }, [previewUrl]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && cid && !loadResult && !loading) {
      loadContent();
    }
  }, [autoLoad, cid, loadResult, loading, loadContent]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const formatLoadTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className={`bg-white border border-gray-200 ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <CloudIcon className="w-6 h-6 text-blue-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{fileName}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>

          {/* CID Display */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Content Identifier (CID)</div>
            <div className="font-mono text-sm break-all text-gray-800">{cid}</div>
          </div>

          {/* Status */}
          {loading && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
              <span className="text-sm">Loading from FilCDN...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangleIcon className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {loadResult && (
            <div className="space-y-3">
              {/* Success Status */}
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Loaded successfully from {loadResult.gateway}
                  {loadResult.cached && ' (cached)'}
                </span>
              </div>

              {/* Load Details */}
              {showDetails && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TimerIcon className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-xs text-blue-600">Load Time</div>
                      <div className="text-sm font-medium text-blue-800">
                        {formatLoadTime(loadResult.loadTime)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CloudIcon className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-xs text-blue-600">Source</div>
                      <div className="text-sm font-medium text-blue-800 capitalize">
                        {loadResult.source}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-blue-600">File Size</div>
                    <div className="text-sm font-medium text-blue-800">
                      {formatFileSize(loadResult.size)}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handlePreview}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <EyeIcon className="w-4 h-4" />
                  Preview
                </Button>
                
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Download
                </Button>
                
                <Button
                  onClick={() => loadContent({ cacheHint: 'no-cache' })}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Reload
                </Button>
              </div>
            </div>
          )}

          {/* Initial Load Button */}
          {!loading && !loadResult && !error && (
            <Button
              onClick={() => loadContent()}
              className="w-full flex items-center gap-2"
              variant="default"
            >
              <CloudIcon className="w-4 h-4" />
              Load from FilCDN
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FilCDNViewer;