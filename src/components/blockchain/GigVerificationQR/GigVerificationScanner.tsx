import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { CameraIcon, UploadIcon, CheckCircleIcon, AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { blockchainVerifiedSubmissionService } from '../../../services/blockchainVerifiedSubmissionService';

interface VerificationResult {
  isValid: boolean;
  submissionId?: string;
  verificationData?: any;
  error?: string;
  scannedData?: any;
}

interface GigVerificationScannerProps {
  onVerificationResult?: (result: VerificationResult) => void;
  onClose?: () => void;
}

export const GigVerificationScanner: React.FC<GigVerificationScannerProps> = ({
  onVerificationResult,
  onClose
}) => {
  const [scanning, setScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string>('');
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check if we have camera access
  const [hasCameraAccess, setHasCameraAccess] = useState(false);

  useEffect(() => {
    checkCameraAccess();
    return () => {
      stopCamera();
    };
  }, []);

  const checkCameraAccess = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      setHasCameraAccess(hasCamera);
    } catch (error) {
      console.warn('Camera access check failed:', error);
      setHasCameraAccess(false);
    }
  };

  const startCamera = async () => {
    try {
      setScanning(true);
      setError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera if available
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      setError('Could not access camera. Please use file upload instead.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const captureAndDecode = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL and try to decode QR
    const imageData = canvas.toDataURL('image/png');
    await processQRImage(imageData);
  }, []);

  const processQRImage = async (imageData: string) => {
    try {
      // Note: In a real implementation, you'd use a QR code library like jsQR
      // For now, we'll simulate QR decoding
      console.log('Processing QR image:', imageData.substring(0, 50) + '...');
      
      // Simulate QR decoding - in real implementation, use jsQR or similar
      // const qrResult = decodeQRFromImage(imageData);
      
      // For demo purposes, we'll handle manual input
      setShowManualInput(true);
      stopCamera();
      setError('QR decoding requires additional library. Please enter QR data manually or upload QR image.');
      
    } catch (error) {
      console.error('QR processing failed:', error);
      setError('Failed to process QR code');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        await processQRImage(imageData);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File upload failed:', error);
      setError('Failed to read uploaded file');
    }
  };

  const verifyQRData = async (qrData: string) => {
    const debugId = `SCAN_${Date.now()}`;
    console.log(`🔍 [${debugId}] Starting QR data verification:`, {
      dataLength: qrData.length,
      dataPreview: qrData.substring(0, 100) + '...',
      timestamp: new Date().toISOString()
    });

    try {
      setVerifying(true);
      setError('');

      // Parse QR data
      console.log(`📋 [${debugId}] Parsing QR data...`);
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
        console.log(`✅ [${debugId}] QR data parsed successfully:`, {
          type: parsedData.type,
          hasSubmissionId: !!parsedData.submission_id,
          hasTxId: !!parsedData.tx_id,
          hasHash: !!parsedData.hash
        });
      } catch (parseError) {
        console.error(`❌ [${debugId}] JSON parsing failed:`, {
          error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          dataPreview: qrData.substring(0, 200)
        });
        throw new Error('Invalid QR data format');
      }

      // Validate QR data structure
      console.log(`🔒 [${debugId}] Validating QR data structure...`);
      if (parsedData.type !== 'gig_verification') {
        console.error(`❌ [${debugId}] Invalid QR type:`, {
          expected: 'gig_verification',
          actual: parsedData.type
        });
        throw new Error('This is not a gig verification QR code');
      }

      if (!parsedData.submission_id) {
        console.error(`❌ [${debugId}] Missing submission ID in QR data`);
        throw new Error('QR code missing submission ID');
      }

      console.log(`✅ [${debugId}] QR data validation passed`);

      // Verify with blockchain service
      console.log(`🌐 [${debugId}] Verifying with blockchain service...`);
      const verificationResult = await blockchainVerifiedSubmissionService.verifySubmission(
        parsedData.submission_id
      );

      console.log(`📊 [${debugId}] Blockchain verification result:`, {
        hasResult: !!verificationResult,
        isVerified: verificationResult?.isVerified,
        txId: verificationResult?.blockchainProof?.transactionId?.substring(0, 16) + '...'
      });

      if (!verificationResult) {
        console.error(`❌ [${debugId}] No verification result from blockchain service`);
        throw new Error('Submission not found');
      }

      // Check if the QR data matches the blockchain data
      const isValidHash = verificationResult.blockchainProof.transactionId === parsedData.tx_id;
      console.log(`🔗 [${debugId}] Transaction ID verification:`, {
        qrTxId: parsedData.tx_id?.substring(0, 16) + '...',
        blockchainTxId: verificationResult.blockchainProof.transactionId?.substring(0, 16) + '...',
        matches: isValidHash
      });
      
      const result: VerificationResult = {
        isValid: verificationResult.isVerified && isValidHash,
        submissionId: parsedData.submission_id,
        verificationData: verificationResult,
        scannedData: parsedData
      };

      console.log(`✅ [${debugId}] Verification completed:`, {
        isValid: result.isValid,
        submissionId: result.submissionId
      });

      setResult(result);
      onVerificationResult?.(result);

    } catch (error) {
      console.error(`❌ [${debugId}] QR verification failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      const errorResult: VerificationResult = {
        isValid: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
      
      setResult(errorResult);
      setError(errorResult.error || 'Unknown error');
      onVerificationResult?.(errorResult);
    } finally {
      setVerifying(false);
      console.log(`🏁 [${debugId}] QR verification process completed`);
    }
  };

  const handleManualVerify = () => {
    if (!manualInput.trim()) {
      setError('Please enter QR data');
      return;
    }
    verifyQRData(manualInput.trim());
  };

  const reset = () => {
    setResult(null);
    setError('');
    setManualInput('');
    setShowManualInput(false);
    setScanning(false);
    stopCamera();
  };

  // Show result if we have one
  if (result) {
    return (
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <div className="text-center">
            {/* Result Header */}
            <div className={`flex items-center justify-center gap-2 mb-4 ${
              result.isValid ? 'text-green-600' : 'text-red-600'
            }`}>
              {result.isValid ? (
                <CheckCircleIcon className="w-8 h-8" />
              ) : (
                <AlertCircleIcon className="w-8 h-8" />
              )}
              <h3 className="text-lg font-semibold">
                {result.isValid ? 'Verification Successful' : 'Verification Failed'}
              </h3>
            </div>

            {/* Result Details */}
            {result.isValid && result.verificationData ? (
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Gig Deliverable Verified</h4>
                  <div className="text-sm text-green-700 space-y-1 text-left">
                    <p><span className="font-medium">Submission ID:</span> {result.submissionId}</p>
                    <p><span className="font-medium">Blockchain Network:</span> {result.verificationData.blockchainProof.network.toUpperCase()}</p>
                    <p><span className="font-medium">Transaction ID:</span> 
                      <span className="font-mono text-xs break-all ml-1">
                        {result.verificationData.blockchainProof.transactionId}
                      </span>
                    </p>
                    <p><span className="font-medium">Verified On:</span> {new Date(result.verificationData.blockchainProof.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                {result.scannedData && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">QR Code Data:</h4>
                    <div className="text-sm space-y-1 text-left">
                      <p><span className="font-medium">Type:</span> {result.scannedData.type}</p>
                      <p><span className="font-medium">Scanned At:</span> {new Date(result.scannedData.verified_at).toLocaleString()}</p>
                      {result.scannedData.verification_url && (
                        <p><span className="font-medium">Verification URL:</span> 
                          <a 
                            href={result.scannedData.verification_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline ml-1 text-xs break-all"
                          >
                            {result.scannedData.verification_url}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-6">
                <h4 className="font-semibold text-red-800 mb-2">Verification Failed</h4>
                <p className="text-sm text-red-700">{result.error || 'This gig deliverable could not be verified on the blockchain.'}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={reset}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCwIcon className="w-4 h-4" />
                Scan Another
              </Button>
              
              {onClose && (
                <Button
                  onClick={onClose}
                  variant="default"
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200">
      <CardContent className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Verify Gig Deliverable</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Camera Scanning */}
          {scanning && (
            <div className="mb-4">
              <video
                ref={videoRef}
                className="w-full max-w-md mx-auto rounded-lg border"
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="mt-3 flex gap-2 justify-center">
                <Button
                  onClick={captureAndDecode}
                  disabled={verifying}
                  className="flex items-center gap-2"
                >
                  <CameraIcon className="w-4 h-4" />
                  Capture QR Code
                </Button>
                
                <Button
                  onClick={stopCamera}
                  variant="outline"
                >
                  Stop Camera
                </Button>
              </div>
            </div>
          )}

          {/* Manual Input */}
          {showManualInput && (
            <div className="mb-4 space-y-3">
              <div>
                <label htmlFor="qr-data" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter QR Code Data:
                </label>
                <textarea
                  id="qr-data"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder='{"type":"gig_verification","submission_id":"...","hash":"...","tx_id":"..."}'
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm font-mono"
                  rows={4}
                />
              </div>
              
              <Button
                onClick={handleManualVerify}
                disabled={verifying || !manualInput.trim()}
                className="flex items-center gap-2"
              >
                {verifying ? (
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <CheckCircleIcon className="w-4 h-4" />
                )}
                {verifying ? 'Verifying...' : 'Verify Data'}
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          {!scanning && !showManualInput && (
            <div className="space-y-4">
              {hasCameraAccess && (
                <Button
                  onClick={startCamera}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <CameraIcon className="w-4 h-4" />
                  Scan with Camera
                </Button>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <UploadIcon className="w-4 h-4" />
                  Upload QR Image
                </Button>
                
                <Button
                  onClick={() => setShowManualInput(true)}
                  variant="outline"
                >
                  Enter QR Data Manually
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left">
            <h4 className="font-semibold text-blue-800 mb-2">How to Verify:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Scan the QR code from a gig deliverable</p>
              <p>• Upload a QR code image file</p>
              <p>• Enter QR data manually if needed</p>
              <p>• Verification checks blockchain authenticity</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};