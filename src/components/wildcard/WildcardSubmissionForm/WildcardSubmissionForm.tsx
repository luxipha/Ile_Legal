import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Switch } from '../../ui/switch';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { Input } from '../../ui/input';
import { ShieldCheckIcon, ZapIcon, KeyIcon, GlobeIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';
import { wildcardIntegrationService, WildcardSubmissionConfig, WildcardSubmissionResult } from '../../../services/wildcardIntegrationService';

interface WildcardSubmissionFormProps {
  workSubmissionId: string;
  onSubmissionComplete?: (result: WildcardSubmissionResult) => void;
  onError?: (error: string) => void;
}

export const WildcardSubmissionForm: React.FC<WildcardSubmissionFormProps> = ({
  workSubmissionId,
  onSubmissionComplete,
  onError
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [sovereignDID, setSovereignDID] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<WildcardSubmissionResult | null>(null);

  const [config, setConfig] = useState<WildcardSubmissionConfig>({
    enableDoubleAnchor: true,
    enableZKChecksum: true,
    enableSovereignIdentity: false,
    offlineVerificationRequired: true,
    courtAdmissibleMode: true,
    primaryBlockchain: 'algorand',
    secondaryBlockchain: 'filecoin',
    trustScoreThreshold: 75
  });

  const debugId = `WILDCARD_FORM_${Date.now()}`;

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    console.log(`📁 [${debugId}] Files selected:`, {
      count: selectedFiles.length,
      files: selectedFiles.map(f => ({ name: f.name, size: f.size }))
    });
    setFiles(selectedFiles);
  }, [debugId]);

  const handleConfigChange = useCallback((key: keyof WildcardSubmissionConfig, value: any) => {
    console.log(`⚙️ [${debugId}] Config changed:`, { key, value });
    setConfig(prev => ({ ...prev, [key]: value }));
  }, [debugId]);

  const handleSubmit = useCallback(async () => {
    if (files.length === 0) {
      onError?.('Please select files to submit');
      return;
    }

    if (!description.trim()) {
      onError?.('Please provide a description');
      return;
    }

    if (config.enableSovereignIdentity && !sovereignDID.trim()) {
      onError?.('Sovereign Identity DID is required when sovereign identity is enabled');
      return;
    }

    console.log(`🚀 [${debugId}] Starting Wildcard submission:`, {
      workSubmissionId,
      fileCount: files.length,
      config,
      hasSovereignDID: !!sovereignDID
    });

    setSubmitting(true);

    try {
      const submissionResult = await wildcardIntegrationService.submitWithWildcardSecurity({
        workSubmissionId,
        files,
        description: description.trim(),
        config,
        sovereignIdentityDID: sovereignDID.trim() || undefined,
        additionalClaims: {
          submissionType: 'wildcard_secure',
          courtAdmissible: config.courtAdmissibleMode,
          trustScoreTarget: config.trustScoreThreshold
        }
      });

      console.log(`✅ [${debugId}] Wildcard submission completed:`, {
        submissionId: submissionResult.submissionId,
        trustScore: submissionResult.trustScore,
        verificationLevel: submissionResult.verificationLevel,
        courtAdmissible: submissionResult.courtAdmissible
      });

      setResult(submissionResult);
      onSubmissionComplete?.(submissionResult);

    } catch (error) {
      console.error(`❌ [${debugId}] Wildcard submission failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        workSubmissionId,
        config
      });
      onError?.(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [files, description, sovereignDID, config, workSubmissionId, onSubmissionComplete, onError, debugId]);

  const getSecurityLevelIcon = () => {
    if (config.enableSovereignIdentity && config.enableZKChecksum && config.enableDoubleAnchor) {
      return <ShieldCheckIcon className="w-5 h-5 text-green-600" />;
    } else if (config.enableDoubleAnchor || (config.enableZKChecksum && config.enableSovereignIdentity)) {
      return <ZapIcon className="w-5 h-5 text-yellow-600" />;
    } else {
      return <KeyIcon className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSecurityLevelText = () => {
    if (config.enableSovereignIdentity && config.enableZKChecksum && config.enableDoubleAnchor) {
      return 'Sovereign Level Security';
    } else if (config.enableDoubleAnchor || (config.enableZKChecksum && config.enableSovereignIdentity)) {
      return 'Enhanced Security';
    } else {
      return 'Basic Security';
    }
  };

  const getEstimatedTrustScore = () => {
    let score = 60; // Base blockchain score
    if (config.enableDoubleAnchor) score += 20;
    if (config.enableZKChecksum) score += 15;
    if (config.enableSovereignIdentity) score += 15;
    return Math.min(score, 100);
  };

  if (result) {
    return (
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
            Wildcard Submission Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Submission Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-1">Trust Score</h4>
              <p className="text-2xl font-bold text-green-600">{result.trustScore}/100</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-1">Verification Level</h4>
              <p className="text-lg font-semibold text-blue-600 capitalize">{result.verificationLevel}</p>
            </div>
          </div>

          {/* Security Features */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-3">Security Features Enabled</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${result.securityFeatures.doubleAnchorEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Double Anchor Proof</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${result.securityFeatures.zkVerificationEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>ZK Checksum</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${result.securityFeatures.sovereignIdentityEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Sovereign Identity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${result.courtAdmissible ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Court Admissible</span>
              </div>
            </div>
          </div>

          {/* QR Code Info */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">Offline Verification Package</h4>
            <p className="text-sm text-purple-700 mb-3">
              Your submission includes an offline verification package for court use.
            </p>
            <div className="space-y-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  const blob = new Blob([result.offlinePackage.qrData], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `wildcard-verification-${result.submissionId}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download QR Data
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  const url = URL.createObjectURL(result.offlinePackage.evidenceBundle);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `evidence-bundle-${result.submissionId}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download Evidence Bundle
              </Button>
            </div>
          </div>

          {/* Verification URL */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-1">Verification URL</h4>
            <p className="text-sm font-mono text-gray-600 break-all">
              {result.offlinePackage.verificationUrl}
            </p>
          </div>

          <Button 
            onClick={() => setResult(null)}
            variant="outline"
            className="w-full"
          >
            Submit Another Document
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheckIcon className="w-6 h-6 text-purple-600" />
          Wildcard Secure Submission
        </CardTitle>
        <p className="text-sm text-gray-600">
          Submit your work with maximum security using double-anchor proof, ZK-checksums, and sovereign identity.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Level Indicator */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getSecurityLevelIcon()}
              <span className="font-semibold">{getSecurityLevelText()}</span>
            </div>
            <span className="text-sm font-semibold text-purple-600">
              Est. Trust Score: {getEstimatedTrustScore()}/100
            </span>
          </div>
          <p className="text-sm text-purple-700">
            {config.courtAdmissibleMode && (config.enableZKChecksum || config.enableSovereignIdentity) 
              ? '🏛️ Court-admissible verification enabled'
              : '📋 Standard verification'
            }
          </p>
        </div>

        {/* File Selection */}
        <div className="space-y-2">
          <Label htmlFor="files">Documents to Submit</Label>
          <Input
            id="files"
            type="file"
            multiple
            onChange={handleFileSelect}
            className="cursor-pointer"
            accept=".pdf,.doc,.docx,.txt"
          />
          {files.length > 0 && (
            <div className="text-sm text-gray-600">
              Selected: {files.map(f => f.name).join(', ')}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the work being submitted..."
            rows={3}
          />
        </div>

        {/* Security Configuration */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <GlobeIcon className="w-4 h-4" />
            Security Configuration
          </h4>

          {/* Blockchain Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Blockchain</Label>
              <Select 
                value={config.primaryBlockchain} 
                onValueChange={(value: 'algorand' | 'filecoin') => 
                  handleConfigChange('primaryBlockchain', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="algorand">Algorand</SelectItem>
                  <SelectItem value="filecoin">Filecoin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Secondary Blockchain</Label>
              <Select 
                value={config.secondaryBlockchain} 
                onValueChange={(value: 'algorand' | 'filecoin') => 
                  handleConfigChange('secondaryBlockchain', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filecoin">Filecoin</SelectItem>
                  <SelectItem value="algorand">Algorand</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Security Features */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="double-anchor">Double Anchor Proof</Label>
                <p className="text-xs text-gray-600">Verify on both blockchains for maximum security</p>
              </div>
              <Switch
                id="double-anchor"
                checked={config.enableDoubleAnchor}
                onCheckedChange={(checked) => handleConfigChange('enableDoubleAnchor', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="zk-checksum">ZK Checksum Verification</Label>
                <p className="text-xs text-gray-600">Privacy-preserving cryptographic verification</p>
              </div>
              <Switch
                id="zk-checksum"
                checked={config.enableZKChecksum}
                onCheckedChange={(checked) => handleConfigChange('enableZKChecksum', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sovereign-identity">Sovereign Identity Signing</Label>
                <p className="text-xs text-gray-600">Self-sovereign digital identity verification</p>
              </div>
              <Switch
                id="sovereign-identity"
                checked={config.enableSovereignIdentity}
                onCheckedChange={(checked) => handleConfigChange('enableSovereignIdentity', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="court-admissible">Court Admissible Mode</Label>
                <p className="text-xs text-gray-600">Generate legally acceptable verification proofs</p>
              </div>
              <Switch
                id="court-admissible"
                checked={config.courtAdmissibleMode}
                onCheckedChange={(checked) => handleConfigChange('courtAdmissibleMode', checked)}
              />
            </div>
          </div>

          {/* Sovereign Identity DID Input */}
          {config.enableSovereignIdentity && (
            <div className="space-y-2">
              <Label htmlFor="sovereign-did">Sovereign Identity DID</Label>
              <Input
                id="sovereign-did"
                value={sovereignDID}
                onChange={(e) => setSovereignDID(e.target.value)}
                placeholder="did:ile:your-identity-id"
              />
              <p className="text-xs text-gray-600">
                Enter your Decentralized Identity (DID) for document signing
              </p>
            </div>
          )}

          {/* Trust Score Threshold */}
          <div className="space-y-2">
            <Label htmlFor="trust-threshold">Minimum Trust Score</Label>
            <Input
              id="trust-threshold"
              type="number"
              min="0"
              max="100"
              value={config.trustScoreThreshold}
              onChange={(e) => handleConfigChange('trustScoreThreshold', parseInt(e.target.value) || 75)}
            />
            <p className="text-xs text-gray-600">
              Minimum trust score required for successful submission
            </p>
          </div>
        </div>

        {/* Warning for High Security */}
        {(config.enableZKChecksum || config.enableSovereignIdentity) && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangleIcon className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-800">Advanced Security Enabled</p>
                <p className="text-yellow-700">
                  This submission will use advanced cryptographic features. Processing may take longer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || files.length === 0 || !description.trim()}
          className="w-full"
          size="lg"
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              Processing Secure Submission...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4" />
              Submit with Wildcard Security
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};