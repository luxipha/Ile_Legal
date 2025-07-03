import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { QrCodeIcon, DownloadIcon, ShareIcon, CopyIcon } from 'lucide-react';

interface QRCodeGeneratorProps {
  url: string;
  size?: number;
  title?: string;
  description?: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  url, 
  size = 200, 
  title = "QR Code",
  description = "Scan to view profile"
}) => {
  console.log('QRCodeGenerator component rendered with url:', url, 'size:', size);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const generateQRCode = useCallback(async () => {
    console.log('generateQRCode called with url:', url, 'size:', size);
    try {
      setLoading(true);
      const canvas = canvasRef.current;
      console.log('Canvas ref:', canvas);
      if (canvas) {
        console.log('Generating QR code on canvas with dimensions:', canvas.width, 'x', canvas.height);
        await QRCode.toCanvas(canvas, url, {
          width: size,
          margin: 2,
          color: {
            dark: '#1B1828',
            light: '#FFFFFF'
          }
        });
        
        console.log('QR Code drawn to canvas successfully');
        
        // Convert canvas to data URL for download
        const dataUrl = canvas.toDataURL('image/png');
        console.log("QR Code generated successfully, dataUrl length:", dataUrl.length);
        setQrDataUrl(dataUrl);
      } else {
        console.log('Canvas ref is null');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  }, [url, size]);

  useEffect(() => {
    console.log('QRCodeGenerator useEffect triggered, url:', url, 'size:', size);
    console.log('Canvas ref current:', canvasRef.current);
    console.log('Loading state:', loading);
    
    // Check if canvas is available and generate QR code
    if (canvasRef.current) {
      console.log('Canvas is available, generating QR code');
      generateQRCode();
    } else {
      console.log('Canvas not available yet, will retry');
      // Retry after a short delay
      const timer = setTimeout(() => {
        console.log('Retry - Canvas ref current:', canvasRef.current);
        if (canvasRef.current) {
          console.log('Canvas now available, generating QR code');
          generateQRCode();
        } else {
          console.log('Canvas still not available after retry');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [generateQRCode]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `profile-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: url,
        });
      } catch (err) {
        console.error('Error sharing:', err);
        handleCopyUrl();
      }
    } else {
      handleCopyUrl();
    }
  };

  return (
    <Card className="bg-white border border-gray-200">
      <CardContent className="p-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <QrCodeIcon className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          
          {/* QR Code Canvas */}
          <div className="mb-4 flex justify-center">
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm relative">
              <canvas 
                ref={canvasRef}
                className="block"
                width={size}
                height={size}
                style={{ width: size, height: size }}
              />
              {loading && (
                <div 
                  className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center animate-pulse"
                  style={{ width: size, height: size }}
                >
                  <QrCodeIcon className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* URL Display */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 break-all font-mono">{url}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex items-center gap-2 hover:bg-gray-50"
              disabled={loading || !qrDataUrl}
            >
              <DownloadIcon className="w-4 h-4" />
              Download
            </Button>
            
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex items-center gap-2 hover:bg-gray-50"
            >
              <ShareIcon className="w-4 h-4" />
              Share
            </Button>
            
            <Button
              onClick={handleCopyUrl}
              variant="outline"
              className={`flex items-center gap-2 hover:bg-gray-50 ${copied ? 'bg-green-50 text-green-700' : ''}`}
            >
              <CopyIcon className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy URL'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;