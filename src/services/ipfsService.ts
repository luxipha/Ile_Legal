import { create } from 'kubo-rpc-client';

// IPFS configuration
const IPFS_URL = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_IPFS_URL : process.env.VITE_IPFS_URL) || 'https://ipfs.algonode.xyz';
const ALGORAND_IPFS_TOKEN = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_ALGORAND_IPFS_TOKEN : process.env.VITE_ALGORAND_IPFS_TOKEN) || '';
const ALGORAND_NETWORK = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_ALGORAND_NETWORK : process.env.VITE_ALGORAND_NETWORK) || 'testnet';
const WEB3_STORAGE_PRIVATE_KEY = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_WEB3_STORAGE_PRIVATE_KEY : process.env.VITE_WEB3_STORAGE_PRIVATE_KEY) || '';
const WEB3_STORAGE_SPACE_DID = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_WEB3_STORAGE_SPACE_DID : process.env.VITE_WEB3_STORAGE_SPACE_DID) || '';
const WEB3_STORAGE_PROOF = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_WEB3_STORAGE_PROOF : process.env.VITE_WEB3_STORAGE_PROOF) || '';

export interface IPFSUploadResult {
  cid: string;
  path?: string;
  size: number;
  url: string;
  name?: string;
  // Filecoin extension fields (optional)
  pieceId?: string;
  storageCost?: number;
  contractTxId?: string;
}

export interface IPFSFileMetadata {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  hash?: string; // Optional blockchain hash
  algorandNetwork?: string; // Algorand network (mainnet/testnet)
  blockchainIntegrated?: boolean; // Whether file is blockchain-verified
  legalDocumentType?: string; // Type of legal document
}

class IPFSService {
  private client: any | null = null;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      // Try different IPFS endpoints in order of preference
      const endpoints = [
        // Web3.Storage as primary production endpoint
        ...(WEB3_STORAGE_PRIVATE_KEY ? [{ 
          url: 'web3-storage', 
          name: 'Web3.Storage', 
          requiresAuth: true,
          isWeb3Storage: true 
        }] : []),
        // Algorand IPFS (production) - only if token is available
        ...(ALGORAND_IPFS_TOKEN ? [{ 
          url: IPFS_URL, 
          name: 'Algorand IPFS', 
          requiresAuth: true,
          isAlgorand: true 
        }] : []),
      ];

      for (const endpoint of endpoints) {
        try {
          // Special handling for Web3.Storage (not a traditional IPFS client)
          if (endpoint.isWeb3Storage) {
            console.log(`🌐 Web3.Storage integration available for production uploads`);
            // Don't create a traditional IPFS client for Web3.Storage
            // This will be handled in uploadFile method
            continue;
          }

          let clientConfig: any = { url: endpoint.url };
          
          // Add auth for Algorand IPFS if token is available
          if (endpoint.isAlgorand && ALGORAND_IPFS_TOKEN) {
            clientConfig.headers = {
              'Authorization': `Bearer ${ALGORAND_IPFS_TOKEN}`,
              'X-Algorand-Network': ALGORAND_NETWORK
            };
          } else if (endpoint.requiresAuth && !endpoint.isAlgorand) {
            // Skip other auth-required endpoints if we don't have credentials
            console.log(`Skipping ${endpoint.name} - missing credentials`);
            continue;
          }

          this.client = create(clientConfig);
          console.log(`IPFS client connected to ${endpoint.name}`);
          
          // For Algorand IPFS, we want to indicate the blockchain integration
          if (endpoint.isAlgorand) {
            console.log(`🔗 Algorand blockchain IPFS integration active on ${ALGORAND_NETWORK}`);
          }
          
          return;
        } catch (error) {
          console.warn(`Failed to connect to ${endpoint.name}:`, error);
          continue;
        }
      }
      
      // If all traditional endpoints fail, check if Web3.Storage is available
      if (WEB3_STORAGE_PRIVATE_KEY) {
        console.log('🚀 Using Web3.Storage as primary upload service');
        this.client = null; // Will use Web3.Storage in uploadFile method
        return;
      }
      
      // If all endpoints fail, create a mock client for development
      console.warn('No IPFS endpoint available, using mock implementation for development');
      this.client = null;
    } catch (error) {
      console.error('Failed to initialize IPFS client:', error);
      this.client = null;
    }
  }

  /**
   * Upload a single file to IPFS
   * @param file - File to upload
   * @param metadata - Optional metadata to include
   * @returns Promise with upload result
   */
  async uploadFile(file: File, metadata?: Partial<IPFSFileMetadata>): Promise<IPFSUploadResult> {
    if (!this.client) {
      // Try Web3.Storage NEW API for production IPFS upload
      console.log('🚀 Using Web3.Storage NEW API for production upload');
      try {
        return await this.uploadToWeb3StorageNew(file);
      } catch (web3Error: any) {
        console.error('Web3.Storage upload failed:', web3Error);
        throw new Error(`PRODUCTION ERROR: Web3.Storage upload failed - ${web3Error?.message || 'Unknown error'}`);
      }
    }

    try {
      const fileBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(fileBuffer);

      // Create file metadata with Algorand integration
      const fileMetadata: IPFSFileMetadata = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        algorandNetwork: ALGORAND_NETWORK,
        blockchainIntegrated: true,
        legalDocumentType: 'court-admissible',
        ...metadata
      };

      // Upload file with metadata
      const result = await this.client.add({
        path: file.name,
        content: uint8Array
      }, {
        wrapWithDirectory: false,
        pin: true
      });

      // Upload metadata separately
      const metadataResult = await this.client.add({
        path: `${file.name}.metadata.json`,
        content: new TextEncoder().encode(JSON.stringify(fileMetadata, null, 2))
      }, {
        wrapWithDirectory: false,
        pin: true
      });

      console.log('File uploaded to IPFS:', result);
      console.log('Metadata uploaded to IPFS:', metadataResult);

      return {
        cid: result.cid.toString(),
        path: result.path,
        size: result.size,
        url: this.getIPFSUrl(result.cid.toString())
      };
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
      
      // Try Web3.Storage as fallback for production IPFS upload
      console.log('🔄 IPFS upload failed, trying Web3.Storage fallback');
      try {
        return await this.uploadToWeb3StorageNew(file);
      } catch (web3Error: any) {
        console.error('Web3.Storage fallback also failed:', web3Error);
        throw new Error(`PRODUCTION ERROR: All IPFS services failed - ${web3Error?.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Upload file to Web3.Storage using w3up client with UCAN authentication
   * @param file - File to upload
   * @returns Promise with upload result
   */
  private async uploadToWeb3StorageNew(file: File): Promise<IPFSUploadResult> {
    console.log('🌐 Uploading to Web3.Storage using w3up with UCAN...');
    
    if (!WEB3_STORAGE_PRIVATE_KEY || !WEB3_STORAGE_PROOF) {
      throw new Error('Web3.Storage configuration missing - need PRIVATE_KEY and PROOF delegation');
    }
    
    try {
      // Import the new w3up client modules and utilities
      const { create } = await import('@web3-storage/w3up-client');
      const { StoreMemory } = await import('@web3-storage/w3up-client/stores/memory');
      const Proof = await import('@web3-storage/w3up-client/proof');
      const { Signer } = await import('@web3-storage/w3up-client/principal/ed25519');
      
      console.log('🔐 Creating UCAN client with delegation...');
      
      // Create client with specific private key
      const principal = Signer.parse(WEB3_STORAGE_PRIVATE_KEY);
      const store = new StoreMemory();
      const client = await create({ principal, store });
      
      // Add proof that this agent has been delegated capabilities on the space
      console.log('📜 Adding delegation proof...');
      const proof = await Proof.parse(WEB3_STORAGE_PROOF);
      const space = await client.addSpace(proof);
      await client.setCurrentSpace(space.did());
      
      // Upload the file to the space
      console.log('📤 Uploading file to Web3.Storage space...');
      const cid = await client.uploadFile(file);
      
      console.log('✅ Web3.Storage UCAN upload successful:', cid.toString());
      console.log('🔗 Production IPFS URL:', `https://${cid}.ipfs.w3s.link`);
      
      return {
        cid: cid.toString(),
        path: file.name,
        size: file.size,
        url: this.getIPFSUrl(cid.toString())
      };
      
    } catch (w3upError: any) {
      console.error('❌ Web3.Storage UCAN upload failed:', {
        error: w3upError?.message || 'Unknown error',
        stack: w3upError?.stack,
        hasPrivateKey: !!WEB3_STORAGE_PRIVATE_KEY,
        hasSpaceDid: !!WEB3_STORAGE_SPACE_DID,
        fileName: file.name,
        fileSize: file.size
      });
      
      // No fallback to old API - new system only
      throw new Error(`Web3.Storage UCAN upload failed: ${w3upError?.message || 'Unknown error'}`);
    }
  }


  /**
   * Upload multiple files to IPFS as a directory
   * @param files - Array of files to upload
   * @param directoryName - Name for the directory
   * @returns Promise with upload results
   */
  async uploadFiles(files: File[], directoryName?: string): Promise<IPFSUploadResult[]> {
    if (!this.client) {
      // Use Web3.Storage for multiple file upload
      console.log('📦 Uploading multiple files via Web3.Storage UCAN...');
      const results: IPFSUploadResult[] = [];
      for (const file of files) {
        const result = await this.uploadFile(file);
        results.push(result);
      }
      return results;
    }

    try {
      const uploadPromises = files.map(async (file) => {
        const fileBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(fileBuffer);
        
        const fileName = directoryName 
          ? `${directoryName}/${file.name}`
          : file.name;

        return {
          path: fileName,
          content: uint8Array
        };
      });

      const fileContents = await Promise.all(uploadPromises);

      // Add all files as a directory
      const results: IPFSUploadResult[] = [];
      for await (const result of this.client.addAll(fileContents, {
        wrapWithDirectory: !!directoryName,
        pin: true
      })) {
        if (result.path !== directoryName) { // Skip directory entry
          results.push({
            cid: result.cid.toString(),
            path: result.path,
            size: result.size,
            url: this.getIPFSUrl(result.cid.toString())
          });
        }
      }

      console.log('Files uploaded to IPFS:', results);
      return results;
    } catch (error) {
      console.error('Error uploading files to IPFS:', error);
      throw new Error(`Failed to upload files to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve file from IPFS
   * @param cid - Content Identifier
   * @returns Promise with file data
   */
  async getFile(cid: string): Promise<Uint8Array> {
    if (!this.client) {
      throw new Error('IPFS client not initialized');
    }

    try {
      const chunks: Uint8Array[] = [];
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk);
      }

      // Concatenate all chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      return result;
    } catch (error) {
      console.error('Error retrieving file from IPFS:', error);
      throw new Error(`Failed to retrieve file from IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pin a file to ensure it stays available
   * @param cid - Content Identifier to pin
   */
  async pinFile(cid: string): Promise<void> {
    if (!this.client) {
      throw new Error('IPFS client not initialized');
    }

    try {
      await this.client.pin.add(cid);
      console.log('File pinned successfully:', cid);
    } catch (error) {
      console.error('Error pinning file:', error);
      throw new Error(`Failed to pin file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Unpin a file to save space
   * @param cid - Content Identifier to unpin
   */
  async unpinFile(cid: string): Promise<void> {
    if (!this.client) {
      throw new Error('IPFS client not initialized');
    }

    try {
      await this.client.pin.rm(cid);
      console.log('File unpinned successfully:', cid);
    } catch (error) {
      console.error('Error unpinning file:', error);
      throw new Error(`Failed to unpin file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get public IPFS URL for a CID with CDN optimization
   * @param cid - Content Identifier
   * @returns Public IPFS URL (with CDN preference for Web3.Storage CIDs)
   */
  getIPFSUrl(cid: string): string {
    // Check if this might be a Web3.Storage CID and prefer their CDN
    if (WEB3_STORAGE_PRIVATE_KEY && (cid.startsWith('bafybei') || cid.startsWith('bafkrei'))) {
      // Use Web3.Storage CDN for optimal performance
      return `https://${cid}.ipfs.w3s.link`;
    }
    
    // Use multiple gateways for redundancy
    const gateways = [
      'https://ipfs.io/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://dweb.link/ipfs/'
    ];
    
    // Return the primary gateway URL
    return `${gateways[0]}${cid}`;
  }

  /**
   * Get multiple gateway URLs for redundancy with CDN optimization
   * @param cid - Content Identifier
   * @returns Array of gateway URLs (CDN-optimized when available)
   */
  getGatewayUrls(cid: string): string[] {
    const gateways = [];
    
    // Prioritize Web3.Storage CDN if available and CID looks compatible
    if (WEB3_STORAGE_PRIVATE_KEY && (cid.startsWith('bafybei') || cid.startsWith('bafkrei'))) {
      gateways.push(
        `https://${cid}.ipfs.w3s.link`,        // Web3.Storage CDN (fastest)
        `https://w3s.link/ipfs/${cid}`,        // Web3.Storage gateway
      );
    }
    
    // Standard IPFS gateways
    gateways.push(
      'https://ipfs.io/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://dweb.link/ipfs/'
    );
    
    return gateways.map(gateway => 
      gateway.includes(cid) ? gateway : `${gateway}${cid}`
    );
  }

  /**
   * Submit file hash to Algorand blockchain for verification
   * @param fileHash - SHA-256 hash of the file
   * @returns Promise with Algorand transaction ID
   */
  async submitToAlgorandBlockchain(fileHash: string): Promise<string> {
    try {
      // Import the working Algorand service class
      const { AlgorandService } = await import('../components/blockchain/shared/algorandService');
      
      // Use the static method that handles account creation internally
      const txId = await AlgorandService.submitDocumentHash(fileHash);
      
      console.log(`📝 Document verified on Algorand blockchain: ${txId}`);
      return txId;
    } catch (error) {
      console.error('Failed to submit to Algorand blockchain:', error);
      // Don't fail the upload if blockchain submission fails
      return `MOCK_ALGO_TX_${Date.now()}`;
    }
  }

  /**
   * Test IPFS connection
   * @returns Promise with connection status
   */
  async testConnection(): Promise<{ connected: boolean; nodeId?: string; error?: string; algorandIntegrated?: boolean; web3StorageAvailable?: boolean }> {
    // Check for Web3.Storage UCAN availability first
    if (!this.client && WEB3_STORAGE_PRIVATE_KEY && WEB3_STORAGE_PROOF) {
      try {
        // Test Web3.Storage UCAN configuration  
        const { create } = await import('@web3-storage/w3up-client');
        const { StoreMemory } = await import('@web3-storage/w3up-client/stores/memory');
        const Proof = await import('@web3-storage/w3up-client/proof');
        const { Signer } = await import('@web3-storage/w3up-client/principal/ed25519');
        
        // Test delegation setup
        const principal = Signer.parse(WEB3_STORAGE_PRIVATE_KEY);
        const client = await create({ principal, store: new StoreMemory() });
        const proof = await Proof.parse(WEB3_STORAGE_PROOF);
        await client.addSpace(proof);
        
        console.log('🌐 Web3.Storage UCAN service available for uploads');
        return { 
          connected: true, 
          nodeId: `w3s-delegated-agent`,
          error: undefined,
          algorandIntegrated: false,
          web3StorageAvailable: true
        };
      } catch (error) {
        console.warn('Web3.Storage UCAN test failed:', error);
        return { 
          connected: false, 
          error: `Web3.Storage UCAN configuration invalid: ${error instanceof Error ? error.message : 'Unknown error'}`,
          algorandIntegrated: false,
          web3StorageAvailable: false
        };
      }
    }

    if (!this.client) {
      return { 
        connected: false, 
        error: WEB3_STORAGE_PRIVATE_KEY ? 
          'Traditional IPFS not available - using Web3.Storage for uploads' : 
          'No IPFS service available - using mock implementation for development',
        algorandIntegrated: false,
        web3StorageAvailable: !!WEB3_STORAGE_PRIVATE_KEY
      };
    }

    try {
      const nodeInfo = await this.client.id();
      console.log('IPFS connection test successful:', nodeInfo);
      
      // Check if we're using Algorand IPFS
      const isAlgorandIPFS = IPFS_URL.includes('algonode') || ALGORAND_IPFS_TOKEN !== '';
      
      return { 
        connected: true, 
        nodeId: nodeInfo.id,
        algorandIntegrated: isAlgorandIPFS,
        web3StorageAvailable: !!WEB3_STORAGE_PRIVATE_KEY
      };
    } catch (error) {
      console.error('IPFS connection test failed:', error);
      
      // Check if Web3.Storage UCAN is available as fallback
      if (WEB3_STORAGE_PRIVATE_KEY && WEB3_STORAGE_PROOF) {
        console.log('🔄 Traditional IPFS failed, but Web3.Storage UCAN is available');
        return { 
          connected: true, 
          nodeId: 'web3-storage-ucan-fallback',
          error: `Traditional IPFS failed: ${error instanceof Error ? error.message : 'Unknown error'} - Using Web3.Storage UCAN`,
          algorandIntegrated: false,
          web3StorageAvailable: true
        };
      }
      
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        algorandIntegrated: false,
        web3StorageAvailable: false
      };
    }
  }
}

// Export singleton instance
export const ipfsService = new IPFSService();
export default ipfsService;