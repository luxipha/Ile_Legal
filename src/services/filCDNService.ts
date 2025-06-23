/**
 * FilCDN Service - Fast Content Delivery for Filecoin
 * Provides instant loading for legal documents stored on Filecoin
 */

import { filecoinStorageService } from './filecoinStorageService';

export interface CDNLoadOptions {
  preferredGateway?: 'w3s' | 'dweb' | 'cloudflare' | 'ipfs';
  timeout?: number;
  retries?: number;
  preload?: boolean;
}

export interface CDNLoadResult {
  url: string;
  gateway: string;
  loadTime: number;
  cached: boolean;
  error?: string;
}

/**
 * FilCDN Service for fast document loading
 */
class FilCDNService {
  private cache = new Map<string, { data: Blob; timestamp: number; url: string }>();
  private loadingPromises = new Map<string, Promise<CDNLoadResult>>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Load content from Filecoin with CDN acceleration
   */
  async loadContent(cid: string, options: CDNLoadOptions = {}): Promise<CDNLoadResult> {
    const startTime = Date.now();
    const cacheKey = `${cid}_${options.preferredGateway || 'default'}`;

    // Check cache first
    const cached = this.getCachedContent(cid);
    if (cached && !this.isCacheExpired(cached.timestamp)) {
      console.log(`📦 Loading from cache: ${cid}`);
      return {
        url: cached.url,
        gateway: 'cache',
        loadTime: Date.now() - startTime,
        cached: true
      };
    }

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      console.log(`⏳ Waiting for existing load: ${cid}`);
      return await this.loadingPromises.get(cacheKey)!;
    }

    // Start new load
    const loadPromise = this.performLoad(cid, options, startTime);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Perform the actual content loading with gateway fallback
   */
  private async performLoad(cid: string, options: CDNLoadOptions, startTime: number): Promise<CDNLoadResult> {
    const gateways = this.getOrderedGateways(options.preferredGateway);
    const timeout = options.timeout || 10000; // 10 seconds default
    const retries = options.retries || 3;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      for (const gateway of gateways) {
        try {
          console.log(`🌐 Loading ${cid} from ${gateway.name} (attempt ${attempt + 1})`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          const response = await fetch(gateway.url, {
            signal: controller.signal,
            method: 'GET'
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.blob();
          const loadTime = Date.now() - startTime;

          // Cache the result
          this.cacheContent(cid, data, gateway.url);

          console.log(`✅ Content loaded successfully from ${gateway.name} in ${loadTime}ms`);

          return {
            url: gateway.url,
            gateway: gateway.name,
            loadTime,
            cached: false
          };

        } catch (error) {
          lastError = error as Error;
          console.warn(`⚠️ Failed to load from ${gateway.name}:`, error);
          continue;
        }
      }
    }

    // All gateways failed
    const loadTime = Date.now() - startTime;
    console.error(`❌ Failed to load content from all gateways after ${retries} attempts`);
    
    return {
      url: '',
      gateway: 'failed',
      loadTime,
      cached: false,
      error: lastError?.message || 'All gateways failed'
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
   * Cache management
   */
  private cacheContent(cid: string, data: Blob, url: string): void {
    this.cache.set(cid, {
      data,
      timestamp: Date.now(),
      url
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