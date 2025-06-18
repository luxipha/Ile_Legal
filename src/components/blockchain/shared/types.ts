export interface AlgorandConfig {
  server: string;
  port: number;
  token: string;
  network: 'mainnet' | 'testnet' | 'betanet';
}

export interface DocumentHash {
  hash: string;
  algorithm: 'SHA-256';
  fileName: string;
  fileSize: number;
  timestamp: string;
}

export interface AlgorandTransaction {
  txId: string;
  confirmedRound?: number;
  fee: number;
  timestamp: string;
}

export interface HashSubmissionResult {
  success: boolean;
  transaction?: AlgorandTransaction;
  error?: string;
  documentHash: DocumentHash;
}

export interface HashVerificationResult {
  exists: boolean;
  transaction?: AlgorandTransaction;
  documentHash: DocumentHash;
  verificationTimestamp: string;
}

export interface BlockchainError {
  code: string;
  message: string;
  details?: any;
}

export interface HashUploadState {
  isHashing: boolean;
  isSubmitting: boolean;
  hashResult?: DocumentHash;
  submissionResult?: HashSubmissionResult;
  error?: BlockchainError;
}

export interface HashVerificationState {
  isVerifying: boolean;
  verificationResult?: HashVerificationResult;
  error?: BlockchainError;
}

export interface FileProcessingResult {
  hash: string;
  file: File;
  processingTime: number;
}