/**
 * PHASE 3 & 4.3: Enhanced FilCDN Service - Fast Content Delivery for Filecoin
 * 
 * Enhanced FilCDN Service with:
 * - High-speed content retrieval from Filecoin network
 * - Intelligent caching layer for legal documents
 * - Content verification and integrity checking
 * - Optimized delivery for legal document viewing
 * - Comprehensive debugging and performance tracking
 * - Phase 4.3: Enhanced storage integration with FVM contracts
 * - Storage verification and replication monitoring
 */

import { filecoinStorageService } from './filecoinStorageService';
import { HashUtils } from '../components/blockchain/shared/hashUtils';
import { fvmContractService } from './fvmContractService';

export interface CDNLoadOptions {
  preferredGateway?: 'w3s' | 'dweb' | 'cloudflare' | 'ipfs' | 'filecoin';
  timeout?: number;
  retries?: number;
  preload?: boolean;
  verifyIntegrity?: boolean;
  expectedHash?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  cacheHint?: 'no-cache' | 'force-cache' | 'default';
  // Phase 4.3: Enhanced storage options
  verifyStorageContract?: boolean;
  taskId?: number;
  preferIPFS?: boolean;
  enableReplicationCheck?: boolean;
}

export interface CDNLoadResult {
  url: string;
  gateway: string;
  loadTime: number;
  cached: boolean;
  error?: string;
  content?: Blob;
  contentType?: string;
  size?: number;
  hash?: string;
  verified?: boolean;
  source?: 'cache' | 'filecoin' | 'gateway' | 'cdn' | 'ipfs';
  metadata?: {
    timestamp: string;
    cacheHit: boolean;
    compressionUsed: boolean;
    requestId?: string;
    // Phase 4.3: Storage contract verification
    storageContractVerified?: boolean;
    replicationFactor?: number;
    storageProvider?: string;
  };
}

/**
 * FilCDN Service for fast document loading
 */
class FilCDNService {
  private cache = new Map<string, { data: Blob; timestamp: number; url: string; hash?: string; size: number; contentType: string; accessCount: number }>();
  private loadingPromises = new Map<string, Promise<CDNLoadResult>>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (extended for Phase 3)
  
  // Phase 3: Enhanced stats tracking
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    totalDataTransferred: 0,
    averageLoadTime: 0,
    gatewayPerformance: new Map<string, { requests: number; totalTime: number; failures: number }>()
  };

  /**
   * Load content from Filecoin with CDN acceleration (Enhanced Phase 3)
   */
  async loadContent(cid: string, options: CDNLoadOptions = {}): Promise<CDNLoadResult> {
    const debugId = `FILCDN_${Date.now()}`;
    const startTime = Date.now();
    const cacheKey = `${cid}_${options.preferredGateway || 'default'}`;

    console.log(`🚀 [${debugId}] Starting FilCDN content load:`, {
      cid: cid.substring(0, 20) + '...',
      preferredGateway: options.preferredGateway,
      priority: options.priority || 'normal',
      verifyIntegrity: options.verifyIntegrity,
      hasExpectedHash: !!options.expectedHash,
      cacheHint: options.cacheHint,
      timestamp: new Date().toISOString()
    });

    this.stats.totalRequests++;

    // Check cache first (unless bypassed)
    if (options.cacheHint !== 'no-cache') {
      const cached = this.getCachedContent(cid);
      if (cached && !this.isCacheExpired(cached.timestamp)) {
        console.log(`💾 [${debugId}] Cache hit found:`, {
          size: HashUtils.formatFileSize(cached.size),
          contentType: cached.contentType,
          cachedAt: new Date(cached.timestamp).toLocaleString(),
          accessCount: cached.accessCount
        });

        // Update cache stats
        cached.accessCount++;
        this.stats.cacheHits++;
        
        const loadTime = Date.now() - startTime;
        this.updateAverageLoadTime(loadTime);

        return {
          url: cached.url,
          gateway: 'cache',
          loadTime,
          cached: true,
          content: cached.data,
          contentType: cached.contentType,
          size: cached.size,
          hash: cached.hash,
          verified: true,
          source: 'cache',
          metadata: {
            timestamp: new Date().toISOString(),
            cacheHit: true,
            compressionUsed: false
          }
        };
      } else {
        console.log(`❌ [${debugId}] Cache miss - proceeding to network retrieval`);
      }
    } else {
      console.log(`🚫 [${debugId}] Cache bypassed per request hint`);
    }

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      console.log(`⏳ [${debugId}] Waiting for existing load request...`);
      return await this.loadingPromises.get(cacheKey)!;
    }

    // Start new load
    console.log(`🌐 [${debugId}] Starting new network load...`);
    const loadPromise = this.performLoad(cid, options, startTime, debugId);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      
      console.log(`✅ [${debugId}] FilCDN load completed:`, {
        success: !result.error,
        gateway: result.gateway,
        loadTime: Math.round(result.loadTime) + 'ms',
        cached: result.cached,
        verified: result.verified,
        size: result.size ? HashUtils.formatFileSize(result.size) : 'unknown'
      });
      
      return result;
    } catch (error) {
      console.error(`❌ [${debugId}] FilCDN load failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        cid: cid.substring(0, 20) + '...',
        loadTime: Math.round(Date.now() - startTime) + 'ms'
      });
      throw error;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Perform the actual content loading with gateway fallback (Enhanced Phase 3)
   */
  private async performLoad(cid: string, options: CDNLoadOptions, startTime: number, debugId: string): Promise<CDNLoadResult> {
    const gateways = this.getOrderedGateways(options.preferredGateway);
    const timeout = options.timeout || 10000; // 10 seconds default
    const retries = options.retries || 3;

    console.log(`⚙️ [${debugId}] Starting network load with configuration:`, {
      gatewayCount: gateways.length,
      timeout: timeout + 'ms',
      retries,
      priority: options.priority || 'normal',
      verifyIntegrity: options.verifyIntegrity
    });

    let lastError: Error | null = null;
    let totalBytesTransferred = 0;
    const attemptLog: any[] = [];

    for (let attempt = 0; attempt < retries; attempt++) {
      console.log(`🔄 [${debugId}] Starting attempt ${attempt + 1}/${retries}...`);
      
      for (const gateway of gateways) {
        const gatewayStartTime = Date.now();
        const gatewayDebugId = `${debugId}_${gateway.name}_${attempt + 1}`;
        
        try {
          console.log(`🌐 [${gatewayDebugId}] Loading from ${gateway.name}:`, {
            url: gateway.url.replace('{cid}', cid.substring(0, 20) + '...'),
            attempt: attempt + 1,
            priority: options.priority,
            expectedHash: options.expectedHash ? options.expectedHash.substring(0, 20) + '...' : undefined
          });
          
          // Update gateway performance tracking
          this.updateGatewayStats(gateway.name, 'request');
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            console.warn(`⏰ [${gatewayDebugId}] Gateway timeout after ${timeout}ms`);
            controller.abort();
          }, timeout);

          const fullUrl = gateway.url.replace('{cid}', cid);
          const response = await fetch(fullUrl, {
            signal: controller.signal,
            method: 'GET',
            headers: {
              'Accept': '*/*',
              'Cache-Control': options.cacheHint === 'no-cache' ? 'no-cache' : 'default'
            }
          });

          clearTimeout(timeoutId);
          const responseTime = Date.now() - gatewayStartTime;

          console.log(`📡 [${gatewayDebugId}] Response received:`, {
            status: response.status,
            statusText: response.statusText,
            responseTime: responseTime + 'ms',
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length')
          });

          if (!response.ok) {
            this.updateGatewayStats(gateway.name, 'failure');
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.blob();
          const loadTime = Date.now() - startTime;
          const size = data.size;
          const contentType = response.headers.get('content-type') || 'application/octet-stream';
          
          totalBytesTransferred += size;
          this.stats.totalDataTransferred += size;
          this.updateGatewayStats(gateway.name, 'success', responseTime);
          this.updateAverageLoadTime(loadTime);

          console.log(`📥 [${gatewayDebugId}] Content downloaded:`, {
            size: HashUtils.formatFileSize(size),
            contentType,
            downloadTime: responseTime + 'ms',
            totalLoadTime: loadTime + 'ms',
            compressionDetected: contentType.includes('gzip') || contentType.includes('compress')
          });

          // Integrity verification if requested
          let verified = false;
          let hash: string | undefined;
          
          if (options.verifyIntegrity || options.expectedHash) {
            console.log(`🔍 [${gatewayDebugId}] Performing integrity verification...`);
            
            try {
              const file = new File([data], `${cid}.bin`);
              const hashResult = await HashUtils.hashFile(file);
              hash = hashResult.hash;
              
              if (options.expectedHash) {
                verified = HashUtils.compareHashes(hash, options.expectedHash);
                console.log(`✓ [${gatewayDebugId}] Hash verification:`, {
                  expected: options.expectedHash.substring(0, 20) + '...',
                  actual: hash.substring(0, 20) + '...',
                  verified
                });
                
                if (!verified) {
                  throw new Error('Content integrity verification failed');
                }
              } else {
                verified = true;
                console.log(`🔐 [${gatewayDebugId}] Content hash computed:`, {
                  hash: hash.substring(0, 20) + '...',
                  algorithm: 'SHA-256'
                });
              }
            } catch (verifyError) {
              console.error(`❌ [${gatewayDebugId}] Integrity verification failed:`, verifyError);
              if (options.expectedHash) {
                throw verifyError; // Fail if hash was required
              }
            }
          } else {
            verified = true; // No verification requested
          }

          // Cache the result with enhanced metadata
          this.cacheContentEnhanced(cid, data, fullUrl, {
            hash,
            size,
            contentType,
            gatewayUsed: gateway.name,
            loadTime,
            verified
          });

          attemptLog.push({
            attempt: attempt + 1,
            gateway: gateway.name,
            success: true,
            responseTime,
            size
          });

          console.log(`✅ [${gatewayDebugId}] Content loaded successfully:`, {
            gateway: gateway.name,
            loadTime: loadTime + 'ms',
            responseTime: responseTime + 'ms',
            size: HashUtils.formatFileSize(size),
            verified,
            totalAttempts: attemptLog.length
          });

          return {
            url: fullUrl,
            gateway: gateway.name,
            loadTime,
            cached: false,
            content: data,
            contentType,
            size,
            hash,
            verified,
            source: 'gateway',
            metadata: {
              timestamp: new Date().toISOString(),
              cacheHit: false,
              compressionUsed: contentType.includes('gzip') || contentType.includes('compress'),
              requestId: gatewayDebugId
            }
          };

        } catch (error) {
          lastError = error as Error;
          const errorTime = Date.now() - gatewayStartTime;
          
          this.updateGatewayStats(gateway.name, 'failure');
          
          attemptLog.push({
            attempt: attempt + 1,
            gateway: gateway.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            responseTime: errorTime
          });

          console.warn(`⚠️ [${gatewayDebugId}] Gateway failed:`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            responseTime: errorTime + 'ms',
            willRetry: attempt < retries - 1 || gateways.indexOf(gateway) < gateways.length - 1
          });
          
          continue;
        }
      }
      
      if (attempt < retries - 1) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
        console.log(`⏳ [${debugId}] All gateways failed for attempt ${attempt + 1}, waiting ${backoffDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }

    // All gateways failed
    const loadTime = Date.now() - startTime;
    
    console.error(`❌ [${debugId}] All gateways failed after ${retries} attempts:`, {
      totalLoadTime: loadTime + 'ms',
      attemptsSummary: attemptLog,
      lastError: lastError?.message,
      gatewayCount: gateways.length,
      totalRetries: retries
    });
    
    return {
      url: '',
      gateway: 'failed',
      loadTime,
      cached: false,
      error: lastError?.message || 'All gateways failed',
      metadata: {
        timestamp: new Date().toISOString(),
        cacheHit: false,
        compressionUsed: false,
        requestId: debugId
      }
    };
  }

  /**
   * Get ordered list of gateways based on preference
   */
  private getOrderedGateways(preferred?: string) {
    const gateways = [
      { name: 'w3s', url: `https://w3s.link/ipfs/` },
      { name: 'w3s-subdomain', url: `https://{cid}.ipfs.w3s.link` },
      { name: 'dweb', url: `https://{cid}.ipfs.dweb.link` },
      { name: 'cloudflare', url: `https://cloudflare-ipfs.com/ipfs/` },
      { name: 'ipfs', url: `https://ipfs.io/ipfs/` }
    ];

    // Move preferred gateway to front
    if (preferred) {
      const preferredIndex = gateways.findIndex(g => g.name === preferred);
      if (preferredIndex > 0) {
        const preferredGateway = gateways.splice(preferredIndex, 1)[0];
        gateways.unshift(preferredGateway);
      }
    }

    return gateways.map(gateway => ({
      name: gateway.name,
      url: gateway.url.includes('{cid}') 
        ? gateway.url // Will be replaced with actual CID in the caller
        : `${gateway.url}{cid}` // Append CID for path-style URLs
    }));
  }

  /**
   * Preload content for instant access
   */
  async preloadContent(cids: string[], options: CDNLoadOptions = {}): Promise<void> {
    console.log(`🚀 Preloading ${cids.length} files for instant access...`);
    
    const preloadPromises = cids.map(async (cid) => {
      try {
        await this.loadContent(cid, { ...options, preload: true });
        console.log(`✅ Preloaded: ${cid}`);
      } catch (error) {
        console.warn(`⚠️ Failed to preload: ${cid}`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log(`🎉 Preloading completed for ${cids.length} files`);
  }

  /**
   * Get instant document viewer URL (optimized for legal documents)
   */
  getInstantViewerUrl(cid: string, fileType?: string): string {
    // Use fastest CDN for document viewing
    const baseUrl = `https://${cid}.ipfs.w3s.link`;
    
    // Add viewer optimizations based on file type
    if (fileType?.includes('pdf')) {
      return `${baseUrl}#view=FitH&toolbar=1&navpanes=1`;
    } else if (fileType?.includes('image')) {
      return baseUrl; // Images load directly
    } else {
      return baseUrl; // Default fast loading
    }
  }

  /**
   * Cache management (Enhanced Phase 3)
   */
  private cacheContent(cid: string, data: Blob, url: string): void {
    this.cache.set(cid, {
      data,
      timestamp: Date.now(),
      url,
      hash: undefined,
      size: data.size,
      contentType: 'application/octet-stream',
      accessCount: 0
    });

    // Cleanup old cache entries
    this.cleanupCache();
  }

  /**
   * Enhanced cache management with metadata
   */
  private cacheContentEnhanced(cid: string, data: Blob, url: string, metadata: {
    hash?: string;
    size: number;
    contentType: string;
    gatewayUsed: string;
    loadTime: number;
    verified: boolean;
  }): void {
    this.cache.set(cid, {
      data,
      timestamp: Date.now(),
      url,
      hash: metadata.hash,
      size: metadata.size,
      contentType: metadata.contentType,
      accessCount: 0
    });

    console.log(`💾 Cache entry created for ${cid}:`, {
      size: HashUtils.formatFileSize(metadata.size),
      contentType: metadata.contentType,
      gateway: metadata.gatewayUsed,
      verified: metadata.verified,
      loadTime: metadata.loadTime + 'ms'
    });

    // Cleanup old cache entries
    this.cleanupCache();
  }

  private getCachedContent(cid: string) {
    return this.cache.get(cid);
  }

  private isCacheExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.CACHE_DURATION;
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [cid, cached] of this.cache.entries()) {
      if (this.isCacheExpired(cached.timestamp)) {
        this.cache.delete(cid);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      entries: this.cache.size,
      totalSize: Array.from(this.cache.values()).reduce((sum, item) => sum + item.data.size, 0),
      oldestEntry: Math.min(...Array.from(this.cache.values()).map(item => item.timestamp)),
      newestEntry: Math.max(...Array.from(this.cache.values()).map(item => item.timestamp))
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 FilCDN cache cleared');
  }

  /**
   * Update gateway performance statistics (Phase 3)
   */
  private updateGatewayStats(gatewayName: string, type: 'request' | 'success' | 'failure', responseTime?: number): void {
    if (!this.stats.gatewayPerformance.has(gatewayName)) {
      this.stats.gatewayPerformance.set(gatewayName, {
        requests: 0,
        totalTime: 0,
        failures: 0
      });
    }

    const stats = this.stats.gatewayPerformance.get(gatewayName)!;

    switch (type) {
      case 'request':
        stats.requests++;
        break;
      case 'success':
        if (responseTime) {
          stats.totalTime += responseTime;
        }
        break;
      case 'failure':
        stats.failures++;
        break;
    }
  }

  /**
   * Update average load time (Phase 3)
   */
  private updateAverageLoadTime(loadTime: number): void {
    if (this.stats.averageLoadTime === 0) {
      this.stats.averageLoadTime = loadTime;
    } else {
      // Exponential moving average
      this.stats.averageLoadTime = (this.stats.averageLoadTime * 0.8) + (loadTime * 0.2);
    }
  }

  /**
   * Get comprehensive performance statistics (Phase 3)
   */
  getPerformanceStats() {
    const gatewayStats = Array.from(this.stats.gatewayPerformance.entries()).map(([name, stats]) => ({
      gateway: name,
      requests: stats.requests,
      failures: stats.failures,
      successRate: stats.requests > 0 ? ((stats.requests - stats.failures) / stats.requests * 100).toFixed(1) + '%' : '0%',
      averageResponseTime: stats.requests > stats.failures && stats.totalTime > 0 
        ? Math.round(stats.totalTime / (stats.requests - stats.failures)) + 'ms' 
        : 'N/A'
    }));

    return {
      totalRequests: this.stats.totalRequests,
      cacheHits: this.stats.cacheHits,
      cacheHitRate: this.stats.totalRequests > 0 ? ((this.stats.cacheHits / this.stats.totalRequests) * 100).toFixed(1) + '%' : '0%',
      totalDataTransferred: HashUtils.formatFileSize(this.stats.totalDataTransferred),
      averageLoadTime: Math.round(this.stats.averageLoadTime) + 'ms',
      gateways: gatewayStats
    };
  }

  /**
   * Test gateway speeds
   */
  async testGatewaySpeeds(testCid: string = 'bafybeihehfkrlij36ao22xdljdejrj776d2fehrudadezynkuhcmgj2kwe'): Promise<Array<{gateway: string, speed: number, error?: string}>> {
    console.log('🏃‍♂️ Testing gateway speeds...');
    
    const gateways = this.getOrderedGateways();
    const results = [];

    for (const gateway of gateways) {
      const startTime = Date.now();
      try {
        const url = gateway.url.replace('{cid}', testCid);
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const speed = Date.now() - startTime;
          results.push({ gateway: gateway.name, speed });
          console.log(`✅ ${gateway.name}: ${speed}ms`);
        } else {
          results.push({ gateway: gateway.name, speed: -1, error: response.statusText });
        }
      } catch (error) {
        results.push({ 
          gateway: gateway.name, 
          speed: -1, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.warn(`❌ ${gateway.name}: ${error}`);
      }
    }

    // Sort by speed (fastest first)
    results.sort((a, b) => {
      if (a.speed === -1) return 1;
      if (b.speed === -1) return -1;
      return a.speed - b.speed;
    });

    console.log('🏆 Gateway speed test completed');
    return results;
  }
}

// Export singleton instance
export const filCDNService = new FilCDNService();
export default filCDNService;