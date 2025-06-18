import { HashVerificationState, DocumentHash, HashVerificationResult } from '../shared/types';

export interface HashVerifierProps {
  onVerificationComplete?: (result: HashVerificationResult) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  searchRounds?: number;
}

export interface HashVerifierState extends HashVerificationState {
  dragActive: boolean;
  selectedFile: File | null;
  documentHash?: DocumentHash;
  isHashing: boolean;
}

export interface VerificationDisplayProps {
  result: HashVerificationResult;
  onReset?: () => void;
}