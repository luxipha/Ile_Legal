/**
 * PHASE 3: FilCDN Content Viewer Component
 * 
 * React component for viewing content loaded through FilCDN with:
 * - Fast content loading from Filecoin network
 * - Real-time loading progress and debug information
 * - Content verification and integrity checking
 * - Performance metrics display
 * - Gateway fallback visualization
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Switch } from '../../ui/switch';
import { 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Chip,
  Typography,
  Box
} from '@mui/material';
import { 
  PlayIcon, 
  PauseIcon, 
  DownloadIcon, 
  RefreshCcwIcon, 
  ZapIcon, 
  ShieldCheckIcon,
  ClockIcon,
  DatabaseIcon,
  BarChart3Icon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon
} from 'lucide-react';
import { filCDNService, CDNLoadOptions, CDNLoadResult } from '../../../services/filCDNService';

interface FilCDNContentViewerProps {
  defaultCID?: string;
  onContentLoad?: (result: CDNLoadResult) => void;
  onError?: (error: string) => void;
  showDebugInfo?: boolean;
}

export const FilCDNContentViewer: React.FC<FilCDNContentViewerProps> = ({
  defaultCID = '',
  onContentLoad,
  onError,
  showDebugInfo = true
}) => {
  const [cid, setCid] = useState(defaultCID);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CDNLoadResult | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showPerformanceStats, setShowPerformanceStats] = useState(false);

  const [options, setOptions] = useState<CDNLoadOptions>({
    preferredGateway: 'w3s',
    timeout: 10000,
    retries: 3,
    verifyIntegrity: false,
    priority: 'normal',
    cacheHint: 'default'
  });

  const debugId = `FILCDN_VIEWER_${Date.now()}`;

  // Capture console logs for debugging display
  useEffect(() => {
    if (!showDebugInfo) return;

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const captureLog = (level: string, ...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      if (message.includes('FILCDN_')) {
        setDebugLogs(prev => [...prev.slice(-19), `[${level}] ${new Date().toLocaleTimeString()}: ${message}`]);
      }
    };

    console.log = (...args) => {
      originalLog(...args);
      captureLog('LOG', ...args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      captureLog('WARN', ...args);
    };

    console.error = (...args) => {
      originalError(...args);
      captureLog('ERROR', ...args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, [showDebugInfo]);

  const handleLoadContent = useCallback(async () => {
    if (!cid.trim()) {
      onError?.('Please enter a valid CID');
      return;
    }

    console.log(`🎬 [${debugId}] Starting FilCDN content load from viewer:`, {
      cid: cid.substring(0, 20) + '...',
      options,
      timestamp: new Date().toISOString()
    });

    setLoading(true);
    setResult(null);
    setDebugLogs([]);

    try {
      const loadResult = await filCDNService.loadContent(cid.trim(), options);
      
      console.log(`🎉 [${debugId}] FilCDN viewer load completed:`, {
        success: !loadResult.error,
        gateway: loadResult.gateway,
        loadTime: loadResult.loadTime + 'ms',
        size: loadResult.size,
        cached: loadResult.cached
      });

      setResult(loadResult);
      onContentLoad?.(loadResult);

      if (loadResult.error) {
        onError?.(loadResult.error);
      }

    } catch (error) {
      console.error(`❌ [${debugId}] FilCDN viewer load failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        cid: cid.substring(0, 20) + '...'
      });
      onError?.(error instanceof Error ? error.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [cid, options, onContentLoad, onError, debugId]);

  const handleOptionChange = useCallback((key: keyof CDNLoadOptions, value: any) => {
    console.log(`⚙️ [${debugId}] Option changed:`, { key, value });
    setOptions(prev => ({ ...prev, [key]: value }));
  }, [debugId]);

  const handleDownload = useCallback(() => {
    if (!result?.content) return;

    const url = URL.createObjectURL(result.content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filecoin-content-${cid.substring(0, 12)}.bin`;
    a.click();
    URL.revokeObjectURL(url);

    console.log(`💾 [${debugId}] Content downloaded:`, {
      cid: cid.substring(0, 20) + '...',
      size: result.size,
      contentType: result.contentType
    });
  }, [result, cid, debugId]);

  const handleClearCache = useCallback(() => {
    filCDNService.clearCache();
    console.log(`🧹 [${debugId}] Cache cleared from viewer`);
  }, [debugId]);

  const performanceStats = filCDNService.getPerformanceStats();
  const cacheStats = filCDNService.getCacheStats();

  const getStatusIcon = () => {
    if (loading) return <RefreshCcwIcon className="w-5 h-5 animate-spin text-blue-600" />;
    if (result?.error) return <XCircleIcon className="w-5 h-5 text-red-600" />;
    if (result && !result.error) return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
    return <EyeIcon className="w-5 h-5 text-gray-600" />;
  };

  const getStatusText = () => {
    if (loading) return 'Loading...';
    if (result?.error) return 'Load Failed';
    if (result && !result.error) return 'Content Loaded';
    return 'Ready to Load';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Main Content Viewer */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ZapIcon className="w-6 h-6 text-purple-600" />
            FilCDN Content Viewer
          </CardTitle>
          <p className="text-sm text-gray-600">
            Load and view content from Filecoin network with high-speed CDN acceleration
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Indicator */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-semibold">{getStatusText()}</span>
            </div>
            {result && !result.error && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Gateway: <Chip label={result.gateway} variant="outlined" size="small" /></span>
                <span>Load Time: <Chip label={`${result.loadTime}ms`} variant="outlined" size="small" /></span>
                {result.cached && <Chip label="Cached" color="success" size="small" />}
                {result.verified && <Chip label="Verified" color="primary" size="small" />}
              </div>
            )}
          </div>

          {/* CID Input */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
            <TextField
              label="Content Identifier (CID)"
              value={cid}
              onChange={(e) => setCid(e.target.value)}
              placeholder="bafybeihehfkrlij36ao22xdljdejrj776d2fehrudadezynkuhcmgj2kwe"
              fullWidth
              variant="outlined"
              sx={{ fontFamily: 'monospace' }}
            />
            <Button
              onClick={handleLoadContent}
              disabled={loading || !cid.trim()}
              className="min-w-[100px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCcwIcon className="w-4 h-4 animate-spin" />
                  Loading
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <PlayIcon className="w-4 h-4" />
                  Load
                </div>
              )}
            </Button>
          </Box>

          {/* Load Options */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Preferred Gateway</InputLabel>
              <Select
                value={options.preferredGateway || 'w3s'}
                label="Preferred Gateway"
                onChange={(e) => handleOptionChange('preferredGateway', e.target.value)}
              >
                <MenuItem value="w3s">Web3.Storage</MenuItem>
                <MenuItem value="dweb">Dweb.link</MenuItem>
                <MenuItem value="cloudflare">Cloudflare</MenuItem>
                <MenuItem value="ipfs">IPFS.io</MenuItem>
                <MenuItem value="filecoin">Filecoin</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={options.priority || 'normal'}
                label="Priority"
                onChange={(e) => handleOptionChange('priority', e.target.value)}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Cache Hint</InputLabel>
              <Select
                value={options.cacheHint || 'default'}
                label="Cache Hint"
                onChange={(e) => handleOptionChange('cacheHint', e.target.value)}
              >
                <MenuItem value="default">Default</MenuItem>
                <MenuItem value="force-cache">Force Cache</MenuItem>
                <MenuItem value="no-cache">No Cache</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Advanced Options */}
          <div className="space-y-3">
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Advanced Options</Typography>
            
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Verify Content Integrity</Typography>
                <Typography variant="caption" color="text.secondary">Compute and verify SHA-256 hash</Typography>
              </div>
              <Switch
                checked={options.verifyIntegrity || false}
                onChange={(e) => handleOptionChange('verifyIntegrity', e.target.checked)}
              />
            </div>

            {options.verifyIntegrity && (
              <TextField
                label="Expected Hash (Optional)"
                value={options.expectedHash || ''}
                onChange={(e) => handleOptionChange('expectedHash', e.target.value)}
                placeholder="SHA-256 hash to verify against..."
                fullWidth
                variant="outlined"
                sx={{ fontFamily: 'monospace' }}
              />
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Timeout (ms)"
                type="number"
                value={options.timeout || 10000}
                onChange={(e) => handleOptionChange('timeout', parseInt(e.target.value) || 10000)}
                inputProps={{ min: 1000, max: 60000 }}
                variant="outlined"
              />
              <TextField
                label="Retries"
                type="number"
                value={options.retries || 3}
                onChange={(e) => handleOptionChange('retries', parseInt(e.target.value) || 3)}
                inputProps={{ min: 1, max: 10 }}
                variant="outlined"
              />
            </Box>
          </div>

          {/* Result Display */}
          {result && !result.error && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3">Content Loaded Successfully</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Size:</span>
                  <span className="ml-2">{formatFileSize(result.size)}</span>
                </div>
                <div>
                  <span className="font-medium">Content Type:</span>
                  <span className="ml-2">{result.contentType || 'Unknown'}</span>
                </div>
                <div>
                  <span className="font-medium">Gateway:</span>
                  <span className="ml-2">{result.gateway}</span>
                </div>
                <div>
                  <span className="font-medium">Source:</span>
                  <span className="ml-2 capitalize">{result.source || 'Unknown'}</span>
                </div>
                {result.hash && (
                  <div className="col-span-2">
                    <span className="font-medium">Hash:</span>
                    <div className="font-mono text-xs mt-1 p-2 bg-white rounded border break-all">
                      {result.hash}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleDownload} variant="outline">
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {result?.error && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-2">Load Failed</h4>
              <p className="text-sm text-red-700">{result.error}</p>
              <div className="mt-3">
                <Button size="sm" onClick={handleLoadContent} variant="outline">
                  <RefreshCcwIcon className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3Icon className="w-5 h-5 text-blue-600" />
              Performance & Cache Statistics
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowPerformanceStats(!showPerformanceStats)}
            >
              {showPerformanceStats ? 'Hide' : 'Show'} Stats
            </Button>
          </CardTitle>
        </CardHeader>
        {showPerformanceStats && (
          <CardContent className="space-y-4">
            {/* Overall Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <ClockIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Avg Load Time</span>
                </div>
                <p className="text-lg font-bold text-blue-800">{performanceStats.averageLoadTime}</p>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DatabaseIcon className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Cache Hit Rate</span>
                </div>
                <p className="text-lg font-bold text-green-800">{performanceStats.cacheHitRate}</p>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DownloadIcon className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Data Transferred</span>
                </div>
                <p className="text-lg font-bold text-purple-800">{performanceStats.totalDataTransferred}</p>
              </div>
              
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCcwIcon className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Total Requests</span>
                </div>
                <p className="text-lg font-bold text-orange-800">{performanceStats.totalRequests}</p>
              </div>
            </div>

            {/* Gateway Performance */}
            <div>
              <h5 className="font-semibold mb-3">Gateway Performance</h5>
              <div className="space-y-2">
                {performanceStats.gateways.map((gateway, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{gateway.gateway}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span>Success Rate: <Chip label={gateway.successRate} variant="outlined" size="small" /></span>
                      <span>Avg Response: <Chip label={gateway.averageResponseTime} variant="outlined" size="small" /></span>
                      <span>Requests: <Chip label={gateway.requests} variant="outlined" size="small" /></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cache Management */}
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-semibold">Cache Management</h5>
                <p className="text-sm text-gray-600">
                  {cacheStats.entries} entries, {formatFileSize(cacheStats.totalSize)} total
                </p>
              </div>
              <Button size="sm" onClick={handleClearCache} variant="outline">
                Clear Cache
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Debug Logs */}
      {showDebugInfo && debugLogs.length > 0 && (
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="w-5 h-5 text-yellow-600" />
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-60 overflow-y-auto">
              {debugLogs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};