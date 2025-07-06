import React, { useState, useCallback, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { QrCodeIcon, DownloadIcon, ShareIcon, CopyIcon, CheckCircleIcon, AlertCircleIcon, CloudIcon } from 'lucide-react';
import { blockchainVerifiedSubmissionService } from '../../../services/blockchainVerifiedSubmissionService';
import { FilCDNViewer } from '../../FilCDN';

interface GigVerificationQRProps {
  submissionId: string;
  title?: string;
  description?: string;
  size?: number;
  onVerificationComplete?: (result: any) => void;
}

interface VerificationData {
  submissionId: string;
  isVerified: boolean;
  qrCodeData: string;
  offlineVerificationHash: string;
  blockchainProof: {
    network: string;
    transactionId: string;
    timestamp: string;
  };
}

export const GigVerificationQR: React.FC<GigVerificationQRProps> = ({
  submissionId,
  title = "Gig Deliverable Verification",
  description = "Scan to verify work authenticity",
  size = 200,
  onVerificationComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const generateQRCode = useCallback(async (qrData: string) => {
    try {
      const canvas = canvasRef.current;
      if (canvas && qrData) {
        await QRCode.toCanvas(canvas, qrData, {
          width: size,
          margin: 2,
          color: {
            dark: '#1B1828',
            light: '#FFFFFF'
          }
        });
        
        // Convert canvas to data URL for download
        const dataUrl = canvas.toDataURL('image/png');
        setQrDataUrl(dataUrl);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code');
    }
  }, [size]);

  const loadVerificationData = useCallback(async () => {
    const debugId = `QR_LOAD_${Date.now()}`;
    console.log(`🔍 [${debugId}] Loading verification data for submission:`, {
      submissionId,
      timestamp: new Date().toISOString()
    });

    try {
      setLoading(true);
      setError('');

      console.log(`📡 [${debugId}] Calling blockchain verification service...`);
      // Get verification data from service
      const result = await blockchainVerifiedSubmissionService.verifySubmission(submissionId);
      
      console.log(`📊 [${debugId}] Verification service response:`, {
        hasResult: !!result,
        isVerified: result?.isVerified,
        network: result?.blockchainProof?.network,
        hasTxId: !!result?.blockchainProof?.transactionId
      });
      
      if (!result) {
        console.warn(`⚠️ [${debugId}] No verification result returned`);
        setError('Submission not found or not verified');
        return;
      }

      setVerificationData(result);
      
      console.log(`🎯 [${debugId}] Generating QR code with data length:`, {
        qrDataLength: result.qrCodeData.length,
        qrDataPreview: result.qrCodeData.substring(0, 100) + '...'
      });
      
      // Generate QR code with verification data
      await generateQRCode(result.qrCodeData);
      
      console.log(`✅ [${debugId}] QR code generation completed successfully`);
      
      onVerificationComplete?.(result);

    } catch (error) {
      console.error(`❌ [${debugId}] Failed to load verification data:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        submissionId
      });
      setError(error instanceof Error ? error.message : 'Failed to load verification data');
    } finally {
      setLoading(false);
      console.log(`🏁 [${debugId}] Load verification data completed`);
    }
  }, [submissionId, generateQRCode, onVerificationComplete]);

  useEffect(() => {
    loadVerificationData();
  }, [loadVerificationData]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `gig-verification-${submissionId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyQRData = async () => {
    if (!verificationData?.qrCodeData) return;
    
    try {
      await navigator.clipboard.writeText(verificationData.qrCodeData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy QR data:', err);
    }
  };

  const handleCopyVerificationUrl = async () => {
    if (!verificationData) return;
    
    const verificationUrl = `${window.location.origin}/verify/${submissionId}`;
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleShare = async () => {
    if (!verificationData) return;
    
    const verificationUrl = `${window.location.origin}/verify/${submissionId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `${description} - Blockchain Verified`,
          url: verificationUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
        handleCopyVerificationUrl();
      }
    } else {
      handleCopyVerificationUrl();
    }
  };

  const parseQRData = (qrData: string) => {
    try {
      return JSON.parse(qrData);
    } catch {
      return null;
    }
  };

  const qrParsedData = verificationData ? parseQRData(verificationData.qrCodeData) : null;

  if (loading) {
    return (
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full mb-4 text-purple-600"></div>
            <p className="text-gray-600">Loading verification data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !verificationData) {
    return (
      <Card className="bg-white border border-red-200">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Verification Error</h3>
            <p className="text-red-600 mb-4">{error || 'Failed to load verification data'}</p>
            <Button 
              onClick={loadVerificationData}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200">
      <CardContent className="p-6">
        <div className="text-center">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          
          {/* Verification Status */}
          <div className={`mb-4 p-3 rounded-lg ${
            verificationData.isVerified ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
          }`}>
            <div className={`flex items-center justify-center gap-2 ${
              verificationData.isVerified ? 'text-green-800' : 'text-orange-800'
            }`}>
              {verificationData.isVerified ? (
                <CheckCircleIcon className="w-5 h-5" />
              ) : (
                <AlertCircleIcon className="w-5 h-5" />
              )}
              <span className="font-medium">
                {verificationData.isVerified ? 'Blockchain Verified' : 'Verification Pending'}
              </span>
            </div>
            {verificationData.isVerified && (
              <p className="text-sm mt-1 text-green-700">
                Network: {verificationData.blockchainProof.network.toUpperCase()}
              </p>
            )}
          </div>

          {/* QR Code */}
          <div className="mb-4 flex justify-center">
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
              <canvas 
                ref={canvasRef}
                className="block"
                width={size}
                height={size}
                style={{ width: size, height: size }}
              />
            </div>
          </div>


          {/* FilCDN Direct Access - Track 4 Integration */}
          {qrParsedData?.cid && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <CloudIcon className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-800">Direct File Access via FilCDN</h4>
              </div>
              <FilCDNViewer
                cid={qrParsedData.cid}
                fileName={`Verified Document - ${submissionId.substring(0, 8)}`}
                description="Access the verified document directly from Filecoin network"
                className="border border-blue-200"
                showDetails={true}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-center">
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <DownloadIcon className="w-4 h-4" />
              Download
            </Button>
            
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ShareIcon className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};