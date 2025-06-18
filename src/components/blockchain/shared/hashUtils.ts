import { DocumentHash, FileProcessingResult, BlockchainError } from './types';

export class HashUtils {
  /**
   * Generate SHA-256 hash from a file
   */
  static async hashFile(file: File): Promise<FileProcessingResult> {
    const startTime = performance.now();
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const processingTime = performance.now() - startTime;
      
      return {
        hash,
        file,
        processingTime
      };
    } catch (error) {
      throw new Error(`Failed to hash file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create DocumentHash object from file processing result
   */
  static createDocumentHash(fileResult: FileProcessingResult): DocumentHash {
    return {
      hash: fileResult.hash,
      algorithm: 'SHA-256',
      fileName: fileResult.file.name,
      fileSize: fileResult.file.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate PDF file before processing
   */
  static validateFile(file: File): { valid: boolean; error?: BlockchainError } {
    // Maximum file size: 50MB for PDFs
    const maxSize = 50 * 1024 * 1024;
    
    // Check file type - only PDFs allowed
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return {
        valid: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'Only PDF files are supported',
          details: { fileName: file.name, fileType: file.type }
        }
      };
    }
    
    if (file.size > maxSize) {
      return {
        valid: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `PDF file size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(maxSize)})`,
          details: { fileSize: file.size, maxSize }
        }
      };
    }

    if (file.size === 0) {
      return {
        valid: false,
        error: {
          code: 'EMPTY_FILE',
          message: 'Cannot process empty PDF file',
          details: { fileName: file.name }
        }
      };
    }

    return { valid: true };
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate short hash for display purposes
   */
  static formatHashForDisplay(hash: string): string {
    if (hash.length <= 16) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  }

  /**
   * Verify hash format
   */
  static isValidHash(hash: string): boolean {
    // SHA-256 hash should be 64 characters of hexadecimal
    const sha256Regex = /^[a-fA-F0-9]{64}$/;
    return sha256Regex.test(hash);
  }

  /**
   * Compare two hashes
   */
  static compareHashes(hash1: string, hash2: string): boolean {
    return hash1.toLowerCase() === hash2.toLowerCase();
  }

  /**
   * Process multiple files concurrently
   */
  static async hashMultipleFiles(files: File[]): Promise<FileProcessingResult[]> {
    const validFiles = files.filter(file => this.validateFile(file).valid);
    
    if (validFiles.length !== files.length) {
      const invalidCount = files.length - validFiles.length;
      console.warn(`Skipping ${invalidCount} invalid file(s)`);
    }

    const hashPromises = validFiles.map(file => this.hashFile(file));
    return Promise.all(hashPromises);
  }
}