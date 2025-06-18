import { HashUploadState, DocumentHash, HashSubmissionResult } from '../shared/types';

export interface HashUploaderProps {
  onHashGenerated?: (documentHash: DocumentHash) => void;
  onSubmissionComplete?: (result: HashSubmissionResult) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
}

export interface HashUploaderState extends HashUploadState {
  dragActive: boolean;
  selectedFile: File | null;
}

export interface FileUploadEvent {
  file: File;
  hash?: string;
  timestamp: string;
}