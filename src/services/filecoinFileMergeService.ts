import { ipfsService } from './ipfsService';
import { HashUtils } from '../components/blockchain/shared/hashUtils';
import { supabase } from '../lib/supabase';

export interface FileMergeOptions {
  mergeStrategy: 'concatenate' | 'archive' | 'json_bundle';
  compressionLevel?: number;
  includeMetadata?: boolean;
  description?: string;
}

export interface MergedFileResult {
  mergedFile: File;
  originalFiles: File[];
  mergeHash: string;
  filecoinCid: string;
  pieceCid: string;
  metadata: {
    originalCount: number;
    totalSize: number;
    mergedSize: number;
    compressionRatio: number;
    mergeStrategy: string;
    timestamp: string;
  };
}

export interface FileManifest {
  version: '1.0';
  mergeStrategy: string;
  timestamp: string;
  originalFiles: Array<{
    name: string;
    size: number;
    hash: string;
    mimeType: string;
    lastModified: number;
  }>;
  mergedFileInfo: {
    name: string;
    size: number;
    hash: string;
    mimeType: string;
  };
}

class FilecoinFileMergeService {
  private ipfsService: typeof ipfsService;

  constructor() {
    this.ipfsService = ipfsService;
  }

  /**
   * Merge multiple files for efficient Filecoin storage
   */
  async mergeAndStoreFiles(
    files: File[],
    options: FileMergeOptions = { mergeStrategy: 'json_bundle' }
  ): Promise<MergedFileResult> {
    const debugId = `MERGE_${Date.now()}`;
    console.log(`🔄 [${debugId}] Starting file merge operation:`, {
      fileCount: files.length,
      strategy: options.mergeStrategy,
      includeMetadata: options.includeMetadata,
      compressionLevel: options.compressionLevel,
      timestamp: new Date().toISOString()
    });

    try {
      if (files.length === 0) {
        console.error(`❌ [${debugId}] No files provided for merging`);
        throw new Error('No files provided for merging');
      }

      console.log(`📁 [${debugId}] File details:`, files.map((file, i) => ({
        index: i,
        name: file.name,
        size: HashUtils.formatFileSize(file.size),
        type: file.type
      })));

      // 1. Generate hashes for all individual files
      console.log(`🔗 [${debugId}] Generating hashes for ${files.length} files...`);
      const fileResults = await HashUtils.hashMultipleFiles(files);
      const originalTotalSize = files.reduce((sum, file) => sum + file.size, 0);

      console.log(`📊 [${debugId}] Hash generation completed:`, {
        totalSize: HashUtils.formatFileSize(originalTotalSize),
        hashCount: fileResults.length,
        hashes: fileResults.map((result, i) => ({
          file: files[i].name,
          hash: result.hash.substring(0, 16) + '...'
        }))
      });

      // 2. Create merged file based on strategy
      let mergedFile: File;
      switch (options.mergeStrategy) {
        case 'concatenate':
          mergedFile = await this.concatenateFiles(files, options);
          break;
        case 'archive':
          mergedFile = await this.createArchive(files, options);
          break;
        case 'json_bundle':
        default:
          mergedFile = await this.createJsonBundle(files, fileResults, options);
          break;
      }

      console.log(`✅ [FileMerge] Merged file created: ${mergedFile.name}, size: ${HashUtils.formatFileSize(mergedFile.size)}`);

      // 3. Generate hash for merged file
      const mergedFileResult = await HashUtils.hashFile(mergedFile);
      const mergeHash = mergedFileResult.hash;

      // 4. Store merged file using IPFS service
      const uploadResult = await this.ipfsService.uploadFile(mergedFile, {
        legalDocumentType: 'merged-file-bundle',
        blockchainIntegrated: true
      });
      
      const filecoinResult = {
        ipfsCid: uploadResult.cid,
        pieceCid: `piece_${uploadResult.cid}`,
        contractTxId: undefined
      };

      // 5. Calculate compression ratio
      const compressionRatio = originalTotalSize > 0 ? mergedFile.size / originalTotalSize : 1;

      console.log(`📈 [FileMerge] Compression ratio: ${(compressionRatio * 100).toFixed(1)}%`);

      // 6. Store merge record in database
      await this.storeMergeRecord({
        mergedFileHash: mergeHash,
        filecoinCid: filecoinResult.ipfsCid,
        pieceCid: filecoinResult.pieceCid,
        originalFiles: fileResults,
        mergeStrategy: options.mergeStrategy,
        originalTotalSize,
        mergedSize: mergedFile.size,
        compressionRatio
      });

      return {
        mergedFile,
        originalFiles: files,
        mergeHash,
        filecoinCid: filecoinResult.ipfsCid,
        pieceCid: filecoinResult.pieceCid,
        metadata: {
          originalCount: files.length,
          totalSize: originalTotalSize,
          mergedSize: mergedFile.size,
          compressionRatio,
          mergeStrategy: options.mergeStrategy,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ [FileMerge] File merge failed:', error);
      throw new Error(`File merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a JSON bundle containing all files as base64
   */
  private async createJsonBundle(
    files: File[],
    fileResults: any[],
    options: FileMergeOptions
  ): Promise<File> {
    try {
      const manifest: FileManifest = {
        version: '1.0',
        mergeStrategy: 'json_bundle',
        timestamp: new Date().toISOString(),
        originalFiles: fileResults.map((result, index) => ({
          name: files[index].name,
          size: files[index].size,
          hash: result.hash,
          mimeType: files[index].type || 'application/octet-stream',
          lastModified: files[index].lastModified
        })),
        mergedFileInfo: {
          name: `merged_bundle_${Date.now()}.json`,
          size: 0, // Will be calculated
          hash: '', // Will be calculated
          mimeType: 'application/json'
        }
      };

      const bundle: any = {
        manifest,
        files: {}
      };

      // Convert each file to base64 and add to bundle
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        bundle.files[file.name] = {
          content: base64,
          encoding: 'base64',
          originalSize: file.size,
          hash: fileResults[i].hash
        };
      }

      const bundleJson = JSON.stringify(bundle, null, options.includeMetadata ? 2 : 0);
      const bundleBlob = new Blob([bundleJson], { type: 'application/json' });
      
      return new File([bundleBlob], manifest.mergedFileInfo.name, {
        type: 'application/json'
      });

    } catch (error) {
      throw new Error(`JSON bundle creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Concatenate files with separators
   */
  private async concatenateFiles(files: File[], options: FileMergeOptions): Promise<File> {
    try {
      const chunks: Uint8Array[] = [];
      const separator = new TextEncoder().encode('\n---FILE_SEPARATOR---\n');

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Add file header
        const header = new TextEncoder().encode(`\n---FILE: ${file.name} (${file.size} bytes)---\n`);
        chunks.push(header);
        
        // Add file content
        const arrayBuffer = await file.arrayBuffer();
        chunks.push(new Uint8Array(arrayBuffer));
        
        // Add separator (except for last file)
        if (i < files.length - 1) {
          chunks.push(separator);
        }
      }

      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const mergedArray = new Uint8Array(totalLength);
      
      let offset = 0;
      for (const chunk of chunks) {
        mergedArray.set(chunk, offset);
        offset += chunk.length;
      }

      const mergedBlob = new Blob([mergedArray]);
      return new File([mergedBlob], `merged_${Date.now()}.txt`, {
        type: 'text/plain'
      });

    } catch (error) {
      throw new Error(`File concatenation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create ZIP archive (placeholder - would need ZIP library)
   */
  private async createArchive(files: File[], options: FileMergeOptions): Promise<File> {
    // Note: This would require a ZIP library like JSZip
    // For now, fall back to JSON bundle
    console.warn('Archive strategy not implemented, falling back to JSON bundle');
    return this.createJsonBundle(files, await HashUtils.hashMultipleFiles(files), options);
  }

  /**
   * Extract files from a merged bundle
   */
  async extractFiles(mergedFile: File): Promise<File[]> {
    try {
      if (mergedFile.type !== 'application/json') {
        throw new Error('Can only extract from JSON bundle files');
      }

      const bundleText = await mergedFile.text();
      const bundle = JSON.parse(bundleText);

      if (!bundle.manifest || bundle.manifest.mergeStrategy !== 'json_bundle') {
        throw new Error('Invalid or unsupported bundle format');
      }

      const extractedFiles: File[] = [];

      for (const originalFile of bundle.manifest.originalFiles) {
        const fileData = bundle.files[originalFile.name];
        if (!fileData) {
          console.warn(`File data not found for: ${originalFile.name}`);
          continue;
        }

        // Decode base64 content
        const binaryString = atob(fileData.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const extractedFile = new File([bytes], originalFile.name, {
          type: originalFile.mimeType,
          lastModified: originalFile.lastModified
        });

        extractedFiles.push(extractedFile);
      }

      console.log(`✅ [FileMerge] Extracted ${extractedFiles.length} files from bundle`);
      return extractedFiles;

    } catch (error) {
      throw new Error(`File extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify integrity of merged file
   */
  async verifyMergedFile(mergedFile: File, expectedHash: string): Promise<boolean> {
    try {
      const fileResult = await HashUtils.hashFile(mergedFile);
      return HashUtils.compareHashes(fileResult.hash, expectedHash);
    } catch (error) {
      console.error('File verification failed:', error);
      return false;
    }
  }

  /**
   * Store merge record in database
   */
  private async storeMergeRecord(data: {
    mergedFileHash: string;
    filecoinCid: string;
    pieceCid: string;
    originalFiles: any[];
    mergeStrategy: string;
    originalTotalSize: number;
    mergedSize: number;
    compressionRatio: number;
  }) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        console.warn('No authenticated user for merge record');
        return;
      }

      const { error } = await supabase
        .from('filecoin_storage')
        .insert({
          user_id: user.user.id,
          original_filename: `merged_bundle_${Date.now()}.json`,
          file_size: data.mergedSize,
          ipfs_cid: data.filecoinCid,
          piece_id: data.pieceCid,
          storage_duration: 365,
          is_verified: true,
          metadata: {
            type: 'merged_file_bundle',
            mergeStrategy: data.mergeStrategy,
            originalFileCount: data.originalFiles.length,
            originalTotalSize: data.originalTotalSize,
            compressionRatio: data.compressionRatio,
            originalFileHashes: data.originalFiles.map(f => f.hash),
            mergedFileHash: data.mergedFileHash
          }
        });

      if (error) {
        console.error('Failed to store merge record:', error);
      } else {
        console.log('✅ [FileMerge] Merge record stored in database');
      }

    } catch (error) {
      console.error('Database storage failed:', error);
    }
  }

  /**
   * Get merge statistics
   */
  async getMergeStatistics(userId?: string): Promise<{
    totalMergedFiles: number;
    totalOriginalFiles: number;
    totalSizeSaved: number;
    averageCompressionRatio: number;
  }> {
    try {
      let query = supabase
        .from('filecoin_storage')
        .select('file_size, metadata')
        .not('metadata->type', 'is', null)
        .eq('metadata->type', 'merged_file_bundle');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          totalMergedFiles: 0,
          totalOriginalFiles: 0,
          totalSizeSaved: 0,
          averageCompressionRatio: 0
        };
      }

      const totalMergedFiles = data.length;
      const totalOriginalFiles = data.reduce((sum, record) => 
        sum + (record.metadata?.originalFileCount || 0), 0);
      
      const totalSizeSaved = data.reduce((sum, record) => {
        const originalSize = record.metadata?.originalTotalSize || 0;
        const mergedSize = record.file_size || 0;
        return sum + Math.max(0, originalSize - mergedSize);
      }, 0);

      const averageCompressionRatio = data.reduce((sum, record) => 
        sum + (record.metadata?.compressionRatio || 1), 0) / data.length;

      return {
        totalMergedFiles,
        totalOriginalFiles,
        totalSizeSaved,
        averageCompressionRatio
      };

    } catch (error) {
      console.error('Failed to get merge statistics:', error);
      return {
        totalMergedFiles: 0,
        totalOriginalFiles: 0,
        totalSizeSaved: 0,
        averageCompressionRatio: 0
      };
    }
  }
}

export const filecoinFileMergeService = new FilecoinFileMergeService();