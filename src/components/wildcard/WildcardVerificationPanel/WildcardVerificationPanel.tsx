import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Switch } from '../../ui/switch';
import { ShieldCheckIcon, ScanIcon, HashIcon, IdCardIcon, PackageIcon, CheckCircleIcon, XCircleIcon, AlertTriangleIcon } from 'lucide-react';
import { wildcardIntegrationService, WildcardVerificationRequest, WildcardVerificationResult } from '../../../services/wildcardIntegrationService';

interface WildcardVerificationPanelProps {
  onVerificationComplete?: (result: WildcardVerificationResult) => void;
  onError?: (error: string) => void;
}

export const WildcardVerificationPanel: React.FC<WildcardVerificationPanelProps> = ({
  onVerificationComplete,
  onError
}) => {
  const [verificationMethod, setVerificationMethod] = useState<WildcardVerificationRequest['verificationMethod']>('qr_code');
  const [verificationData, setVerificationData] = useState('');
  const [challengeFile, setChallengeFile] = useState<File | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [courtMode, setCourtMode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<WildcardVerificationResult | null>(null);

  const debugId = `WILDCARD_VERIFY_${Date.now()}`;

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    console.log(`📁 [${debugId}] Challenge file selected:`, {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size
    });
    setChallengeFile(file);
  }, [debugId]);

  const handleVerify = useCallback(async () => {
    if (!verificationData.trim()) {
      onError?.('Please provide verification data');
      return;
    }

    console.log(`🔍 [${debugId}] Starting Wildcard verification:`, {
      method: verificationMethod,
      dataLength: verificationData.length,
      hasChallengeFile: !!challengeFile,
      offlineMode,
      courtMode
    });

    setVerifying(true);

    try {
      const verificationResult = await wildcardIntegrationService.verifyWithWildcardSecurity({
        verificationMethod,
        data: verificationData.trim(),
        challengeDocument: challengeFile || undefined,
        offlineMode,
        courtMode
      });

      console.log(`✅ [${debugId}] Wildcard verification completed:`, {
        verified: verificationResult.verified,
        verificationLevel: verificationResult.verificationLevel,
        trustScore: verificationResult.trustScore,
        courtAdmissible: verificationResult.courtAdmissible
      });

      setResult(verificationResult);
      onVerificationComplete?.(verificationResult);

    } catch (error) {
      console.error(`❌ [${debugId}] Wildcard verification failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        method: verificationMethod,
        dataPreview: verificationData.substring(0, 100) + '...'
      });
      onError?.(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  }, [verificationMethod, verificationData, challengeFile, offlineMode, courtMode, onVerificationComplete, onError, debugId]);

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'qr_code': return <ScanIcon className="w-4 h-4" />;
      case 'document_hash': return <HashIcon className="w-4 h-4" />;
      case 'submission_id': return <IdCardIcon className="w-4 h-4" />;
      case 'offline_package': return <PackageIcon className="w-4 h-4" />;
      default: return <ShieldCheckIcon className="w-4 h-4" />;
    }
  };

  const getMethodPlaceholder = () => {
    switch (verificationMethod) {
      case 'qr_code':
        return 'Paste QR code data or JSON verification data...';
      case 'document_hash':
        return 'Enter SHA-256 document hash (64 characters)...';
      case 'submission_id':
        return 'Enter work submission ID...';
      case 'offline_package':
        return 'Paste offline verification package data...';
      default:
        return 'Enter verification data...';
    }
  };

  const reset = () => {
    setResult(null);
    setVerificationData('');
    setChallengeFile(null);
  };

  if (result) {
    return (
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {result.verified ? (
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            ) : (
              <XCircleIcon className="w-6 h-6 text-red-600" />
            )}
            Wildcard Verification Result
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Status */}
          <div className={`p-4 rounded-lg border ${
            result.verified 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className={`font-semibold ${
                result.verified ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.verified ? 'Verification Successful' : 'Verification Failed'}
              </h4>
              <span className={`text-sm font-semibold ${
                result.verified ? 'text-green-600' : 'text-red-600'
              }`}>
                Trust Score: {result.trustScore}/100
              </span>
            </div>
            <p className={`text-sm ${
              result.verified ? 'text-green-700' : 'text-red-700'
            }`}>
              Verification Level: <span className="font-semibold capitalize">{result.verificationLevel}</span>
              {result.courtAdmissible && ' • Court Admissible'}
            </p>
          </div>

          {/* Verification Methods */}
          <div className="space-y-3">
            <h4 className="font-semibold">Verification Methods Checked</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  result.verificationMethods.blockchain ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-sm">Blockchain Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  result.verificationMethods.doubleAnchor ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-sm">Double Anchor Proof</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  result.verificationMethods.zkChecksum ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-sm">ZK Checksum</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  result.verificationMethods.sovereignIdentity ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-sm">Sovereign Identity</span>
              </div>
            </div>
          </div>

          {/* Security Analysis */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-3">Security Analysis</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  result.securityAnalysis.tamperEvident ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span>Tamper Evident</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  result.securityAnalysis.cryptographicallySecure ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span>Cryptographically Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  result.securityAnalysis.offlineCapable ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span>Offline Capable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  result.securityAnalysis.crossChainVerified ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span>Cross-Chain Verified</span>
              </div>
            </div>
          </div>

          {/* Evidence Package */}
          {result.evidencePackage && Object.keys(result.evidencePackage).length > 0 && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">Evidence Package</h4>
              <div className="space-y-2">
                {result.evidencePackage.documentHash && (
                  <div className="text-sm">
                    <span className="font-medium">Document Hash:</span>
                    <div className="font-mono text-xs mt-1 p-2 bg-white rounded border break-all">
                      {result.evidencePackage.documentHash}
                    </div>
                  </div>
                )}
                {result.evidencePackage.verificationTimestamp && (
                  <div className="text-sm">
                    <span className="font-medium">Verified At:</span>
                    <span className="ml-2">{new Date(result.evidencePackage.verificationTimestamp).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={reset} variant="outline" className="flex-1">
              Verify Another Document
            </Button>
            {result.evidencePackage && (
              <Button 
                onClick={() => {
                  const blob = new Blob([JSON.stringify(result.evidencePackage, null, 2)], { 
                    type: 'application/json' 
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `verification-evidence-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                variant="outline"
              >
                Download Evidence
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheckIcon className="w-6 h-6 text-purple-600" />
          Wildcard Document Verification
        </CardTitle>
        <p className="text-sm text-gray-600">
          Verify document authenticity using advanced cryptographic methods including ZK-proofs and sovereign identity.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Verification Method Selection */}
        <div className="space-y-2">
          <Label>Verification Method</Label>
          <Select 
            value={verificationMethod} 
            onValueChange={(value: WildcardVerificationRequest['verificationMethod']) => 
              setVerificationMethod(value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="qr_code">
                <div className="flex items-center gap-2">
                  <ScanIcon className="w-4 h-4" />
                  QR Code / JSON Data
                </div>
              </SelectItem>
              <SelectItem value="document_hash">
                <div className="flex items-center gap-2">
                  <HashIcon className="w-4 h-4" />
                  Document Hash
                </div>
              </SelectItem>
              <SelectItem value="submission_id">
                <div className="flex items-center gap-2">
                  <IdCardIcon className="w-4 h-4" />
                  Submission ID
                </div>
              </SelectItem>
              <SelectItem value="offline_package">
                <div className="flex items-center gap-2">
                  <PackageIcon className="w-4 h-4" />
                  Offline Package
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Verification Data Input */}
        <div className="space-y-2">
          <Label>Verification Data</Label>
          <Textarea
            value={verificationData}
            onChange={(e) => setVerificationData(e.target.value)}
            placeholder={getMethodPlaceholder()}
            rows={verificationMethod === 'qr_code' || verificationMethod === 'offline_package' ? 6 : 3}
            className="font-mono text-sm"
          />
        </div>

        {/* Challenge Document */}
        <div className="space-y-2">
          <Label>Challenge Document (Optional)</Label>
          <Input
            type="file"
            onChange={handleFileSelect}
            className="cursor-pointer"
            accept=".pdf,.doc,.docx,.txt"
          />
          {challengeFile && (
            <p className="text-sm text-gray-600">
              Selected: {challengeFile.name} ({(challengeFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
          <p className="text-xs text-gray-500">
            Upload the original document to verify its hash matches the verification data
          </p>
        </div>

        {/* Verification Options */}
        <div className="space-y-3">
          <h4 className="font-semibold">Verification Options</h4>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="offline-mode">Offline Mode</Label>
              <p className="text-xs text-gray-600">Perform verification without internet connectivity</p>
            </div>
            <Switch
              id="offline-mode"
              checked={offlineMode}
              onCheckedChange={setOfflineMode}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="court-mode">Court Mode</Label>
              <p className="text-xs text-gray-600">Generate court-admissible verification records</p>
            </div>
            <Switch
              id="court-mode"
              checked={courtMode}
              onCheckedChange={setCourtMode}
            />
          </div>
        </div>

        {/* Warning for Court Mode */}
        {courtMode && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangleIcon className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-800">Court Mode Enabled</p>
                <p className="text-blue-700">
                  This verification will generate legally admissible evidence records with enhanced documentation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Method-specific Help */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <h5 className="font-semibold mb-1 flex items-center gap-2">
            {getMethodIcon(verificationMethod)}
            {verificationMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Verification
          </h5>
          <p className="text-sm text-gray-600">
            {verificationMethod === 'qr_code' && 'Scan or paste QR code data from a Wildcard submission. Supports both online and offline verification.'}
            {verificationMethod === 'document_hash' && 'Enter the SHA-256 hash of the document to verify its authenticity across all verification methods.'}
            {verificationMethod === 'submission_id' && 'Enter the work submission ID to verify the submission using blockchain records.'}
            {verificationMethod === 'offline_package' && 'Use offline verification package data for court-ready verification without internet access.'}
          </p>
        </div>

        {/* Verify Button */}
        <Button
          onClick={handleVerify}
          disabled={verifying || !verificationData.trim()}
          className="w-full"
          size="lg"
        >
          {verifying ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              Performing Wildcard Verification...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4" />
              Verify with Wildcard Security
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};