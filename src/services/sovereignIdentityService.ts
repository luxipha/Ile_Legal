/**
 * PHASE 2: Wildcard - Secure, Sovereign Track
 * 
 * Sovereign Identity Service
 * - Decentralized identity (DID) management
 * - Self-sovereign document signing
 * - Verifiable credentials integration
 * - Cross-chain identity verification
 */

import { HashUtils } from '../components/blockchain/shared/hashUtils';
import { supabase } from '../lib/supabase';

export interface SovereignIdentityConfig {
  didMethod: 'ile' | 'key' | 'web' | 'ethr';
  keyType: 'ed25519' | 'secp256k1' | 'rsa';
  verificationMethod: 'signature' | 'biometric' | 'multi_factor';
  credentialType: 'document_signer' | 'legal_practitioner' | 'verified_entity';
  requiresAttestation: boolean;
  crossChainCompatible: boolean;
}

export interface DecentralizedIdentifier {
  did: string;
  method: string;
  identifier: string;
  publicKey: string;
  privateKey?: string; // Only stored securely, never transmitted
  createdAt: string;
  isActive: boolean;
  metadata: {
    keyType: string;
    verificationMethod: string;
    credentialTypes: string[];
    attestations: string[];
  };
}

export interface VerifiableCredential {
  id: string;
  type: string[];
  issuer: string; // DID of issuer
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string; // DID of subject
    claims: Record<string, any>;
  };
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    signature: string;
  };
}

export interface SovereignSignature {
  signature: string;
  publicKey: string;
  did: string;
  timestamp: string;
  documentHash: string;
  signatureType: string;
  verificationMethod: string;
  credentialProof?: string;
}

export interface SovereignVerificationResult {
  verified: boolean;
  did: string;
  signature: SovereignSignature;
  credentialValid: boolean;
  identityTrustScore: number;
  verificationDetails: {
    signatureValid: boolean;
    didResolved: boolean;
    credentialVerified: boolean;
    keyOwnership: boolean;
    timestampValid: boolean;
    crossChainVerified: boolean;
  };
  attestations: string[];
  trustChain: string[];
}

class SovereignIdentityService {
  private defaultConfig: SovereignIdentityConfig = {
    didMethod: 'ile',
    keyType: 'ed25519',
    verificationMethod: 'signature',
    credentialType: 'document_signer',
    requiresAttestation: false,
    crossChainCompatible: true
  };

  /**
   * Create new sovereign identity (DID)
   */
  async createSovereignIdentity(
    config: SovereignIdentityConfig = this.defaultConfig
  ): Promise<DecentralizedIdentifier> {
    const debugId = `SOV_CREATE_${Date.now()}`;
    console.log(`👤 [${debugId}] Creating sovereign identity:`, {
      didMethod: config.didMethod,
      keyType: config.keyType,
      verificationMethod: config.verificationMethod,
      credentialType: config.credentialType,
      requiresAttestation: config.requiresAttestation,
      timestamp: new Date().toISOString()
    });

    try {
      // 1. Generate cryptographic key pair
      console.log(`🔐 [${debugId}] Generating ${config.keyType} key pair...`);
      const keyPair = await this.generateKeyPair(config.keyType);
      
      console.log(`✅ [${debugId}] Key pair generated:`, {
        keyType: config.keyType,
        publicKeyLength: keyPair.publicKey.length,
        hasPrivateKey: !!keyPair.privateKey
      });

      // 2. Create DID identifier
      console.log(`🆔 [${debugId}] Creating DID identifier...`);
      const identifier = await this.createDIDIdentifier(keyPair.publicKey, config);
      const did = `did:${config.didMethod}:${identifier}`;
      
      console.log(`✅ [${debugId}] DID created:`, {
        did: did.substring(0, 30) + '...',
        method: config.didMethod,
        identifier: identifier.substring(0, 20) + '...'
      });

      // 3. Create DID document
      console.log(`📄 [${debugId}] Creating DID document...`);
      const didDocument = await this.createDIDDocument(did, keyPair.publicKey, config);

      // 4. Store sovereign identity
      const sovereignIdentity: DecentralizedIdentifier = {
        did,
        method: config.didMethod,
        identifier,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        createdAt: new Date().toISOString(),
        isActive: true,
        metadata: {
          keyType: config.keyType,
          verificationMethod: config.verificationMethod,
          credentialTypes: [config.credentialType],
          attestations: []
        }
      };

      console.log(`💾 [${debugId}] Storing sovereign identity...`);
      await this.storeSovereignIdentity(sovereignIdentity);

      // 5. Register DID on blockchain if cross-chain compatible
      if (config.crossChainCompatible) {
        console.log(`⛓️ [${debugId}] Registering DID on blockchain...`);
        await this.registerDIDOnBlockchain(did, didDocument);
      }

      // 6. Generate initial attestations if required
      if (config.requiresAttestation) {
        console.log(`🏅 [${debugId}] Generating initial attestations...`);
        const attestations = await this.generateInitialAttestations(sovereignIdentity, config);
        sovereignIdentity.metadata.attestations = attestations;
      }

      console.log(`✅ [${debugId}] Sovereign identity creation completed:`, {
        did: did.substring(0, 30) + '...',
        isActive: sovereignIdentity.isActive,
        attestationCount: sovereignIdentity.metadata.attestations.length
      });

      return sovereignIdentity;

    } catch (error) {
      console.error(`❌ [${debugId}] Sovereign identity creation failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        config
      });
      throw new Error(`Sovereign identity creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign document with sovereign identity
   */
  async signDocumentWithSovereignIdentity(
    document: File,
    did: string,
    additionalClaims?: Record<string, any>
  ): Promise<SovereignSignature> {
    const debugId = `SOV_SIGN_${Date.now()}`;
    console.log(`✍️ [${debugId}] Signing document with sovereign identity:`, {
      fileName: document.name,
      fileSize: HashUtils.formatFileSize(document.size),
      did: did.substring(0, 30) + '...',
      hasAdditionalClaims: !!additionalClaims,
      claimCount: additionalClaims ? Object.keys(additionalClaims).length : 0,
      timestamp: new Date().toISOString()
    });

    try {
      // 1. Retrieve sovereign identity
      console.log(`🔍 [${debugId}] Retrieving sovereign identity...`);
      const identity = await this.retrieveSovereignIdentity(did);
      
      console.log(`✅ [${debugId}] Identity retrieved:`, {
        did: identity.did.substring(0, 30) + '...',
        isActive: identity.isActive,
        keyType: identity.metadata.keyType,
        credentialTypes: identity.metadata.credentialTypes
      });

      if (!identity.isActive) {
        throw new Error('Sovereign identity is not active');
      }

      // 2. Generate document hash
      console.log(`📊 [${debugId}] Generating document hash...`);
      const fileResult = await HashUtils.hashFile(document);
      const documentHash = fileResult.hash;
      
      console.log(`✅ [${debugId}] Document hash generated:`, {
        hash: documentHash.substring(0, 16) + '...',
        processingTime: fileResult.processingTime + 'ms'
      });

      // 3. Create signing payload
      console.log(`📝 [${debugId}] Creating signing payload...`);
      const signingPayload = await this.createSigningPayload({
        documentHash,
        did: identity.did,
        timestamp: new Date().toISOString(),
        additionalClaims
      });

      // 4. Generate signature
      console.log(`🔐 [${debugId}] Generating sovereign signature...`);
      const signature = await this.generateSovereignSignature(
        signingPayload,
        identity.privateKey!,
        identity.metadata.keyType
      );

      // 5. Create verifiable credential proof if applicable
      let credentialProof;
      if (identity.metadata.credentialTypes.length > 0) {
        console.log(`🏅 [${debugId}] Creating credential proof...`);
        credentialProof = await this.createCredentialProof(identity, documentHash);
      }

      // 6. Assemble sovereign signature
      const sovereignSignature: SovereignSignature = {
        signature,
        publicKey: identity.publicKey,
        did: identity.did,
        timestamp: new Date().toISOString(),
        documentHash,
        signatureType: identity.metadata.keyType,
        verificationMethod: identity.metadata.verificationMethod,
        credentialProof
      };

      // 7. Store signature record
      console.log(`💾 [${debugId}] Storing signature record...`);
      await this.storeSovereignSignature(sovereignSignature, document.name);

      console.log(`✅ [${debugId}] Document signing completed:`, {
        signatureLength: signature.length,
        did: identity.did.substring(0, 30) + '...',
        hasCredentialProof: !!credentialProof,
        documentHash: documentHash.substring(0, 16) + '...'
      });

      return sovereignSignature;

    } catch (error) {
      console.error(`❌ [${debugId}] Document signing failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        did: did.substring(0, 30) + '...',
        fileName: document.name
      });
      throw new Error(`Document signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify sovereign signature
   */
  async verifySovereignSignature(
    signature: SovereignSignature,
    challengeDocument?: File
  ): Promise<SovereignVerificationResult> {
    const debugId = `SOV_VERIFY_${Date.now()}`;
    console.log(`🔍 [${debugId}] Verifying sovereign signature:`, {
      did: signature.did.substring(0, 30) + '...',
      signatureType: signature.signatureType,
      verificationMethod: signature.verificationMethod,
      hasChallengeDocument: !!challengeDocument,
      hasCredentialProof: !!signature.credentialProof,
      timestamp: new Date().toISOString()
    });

    try {
      // 1. Resolve DID and retrieve identity
      console.log(`🆔 [${debugId}] Resolving DID...`);
      const didResolved = await this.resolveDID(signature.did);
      
      console.log(`✅ [${debugId}] DID resolved:`, {
        didResolved: !!didResolved,
        isActive: didResolved?.isActive,
        keyType: didResolved?.metadata.keyType
      });

      // 2. Verify challenge document if provided
      let challengeVerified = true;
      if (challengeDocument) {
        console.log(`📊 [${debugId}] Verifying challenge document...`);
        const challengeHash = await HashUtils.hashFile(challengeDocument);
        challengeVerified = HashUtils.compareHashes(challengeHash.hash, signature.documentHash);
        
        console.log(`📋 [${debugId}] Challenge document verification:`, {
          verified: challengeVerified,
          challengeHash: challengeHash.hash.substring(0, 16) + '...',
          expectedHash: signature.documentHash.substring(0, 16) + '...'
        });
      }

      // 3. Verify signature cryptographically
      console.log(`🔐 [${debugId}] Verifying cryptographic signature...`);
      const signatureValid = await this.verifyCryptographicSignature(
        signature.signature,
        signature.documentHash,
        signature.publicKey,
        signature.signatureType
      );

      // 4. Verify key ownership
      console.log(`🔑 [${debugId}] Verifying key ownership...`);
      const keyOwnership = didResolved ? 
        didResolved.publicKey === signature.publicKey : false;

      // 5. Verify timestamp validity
      console.log(`⏰ [${debugId}] Verifying timestamp...`);
      const timestampValid = this.verifySignatureTimestamp(signature.timestamp);

      // 6. Verify credentials if present
      let credentialVerified = true;
      if (signature.credentialProof && didResolved) {
        console.log(`🏅 [${debugId}] Verifying credentials...`);
        credentialVerified = await this.verifyCredentialProof(
          signature.credentialProof,
          didResolved,
          signature.documentHash
        );
      }

      // 7. Verify cross-chain registration
      console.log(`⛓️ [${debugId}] Verifying cross-chain registration...`);
      const crossChainVerified = await this.verifyCrossChainRegistration(signature.did);

      // 8. Calculate identity trust score
      const identityTrustScore = this.calculateIdentityTrustScore({
        didResolved: !!didResolved,
        signatureValid,
        keyOwnership,
        credentialVerified,
        timestampValid,
        crossChainVerified,
        attestationCount: didResolved?.metadata.attestations.length || 0
      });

      // 9. Get attestations and trust chain
      const attestations = didResolved?.metadata.attestations || [];
      const trustChain = await this.buildTrustChain(signature.did);

      const verificationResult: SovereignVerificationResult = {
        verified: challengeVerified && 
                  signatureValid && 
                  keyOwnership && 
                  timestampValid && 
                  credentialVerified &&
                  !!didResolved?.isActive,
        did: signature.did,
        signature,
        credentialValid: credentialVerified,
        identityTrustScore,
        verificationDetails: {
          signatureValid,
          didResolved: !!didResolved,
          credentialVerified,
          keyOwnership,
          timestampValid,
          crossChainVerified
        },
        attestations,
        trustChain
      };

      console.log(`✅ [${debugId}] Sovereign signature verification completed:`, {
        verified: verificationResult.verified,
        identityTrustScore,
        signatureValid,
        didResolved: !!didResolved,
        credentialVerified,
        keyOwnership,
        attestationCount: attestations.length
      });

      return verificationResult;

    } catch (error) {
      console.error(`❌ [${debugId}] Sovereign signature verification failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        did: signature.did.substring(0, 30) + '...'
      });
      throw new Error(`Sovereign signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods with debugging
  private async generateKeyPair(keyType: string): Promise<{publicKey: string, privateKey: string}> {
    const debugId = `KEY_GEN_${Date.now()}`;
    console.log(`🔐 [${debugId}] Generating ${keyType} key pair...`);

    try {
      let keyPair: CryptoKeyPair;

      switch (keyType) {
        case 'ed25519':
          keyPair = await crypto.subtle.generateKey(
            { name: 'Ed25519' },
            true,
            ['sign', 'verify']
          );
          break;
        case 'secp256k1':
          keyPair = await crypto.subtle.generateKey(
            { name: 'ECDSA', namedCurve: 'P-256' },
            true,
            ['sign', 'verify']
          );
          break;
        case 'rsa':
          keyPair = await crypto.subtle.generateKey(
            {
              name: 'RSA-PSS',
              modulusLength: 2048,
              publicExponent: new Uint8Array([1, 0, 1]),
              hash: 'SHA-256'
            },
            true,
            ['sign', 'verify']
          );
          break;
        default:
          throw new Error(`Unsupported key type: ${keyType}`);
      }

      const publicKey = await this.exportKey(keyPair.publicKey);
      const privateKey = await this.exportKey(keyPair.privateKey);

      console.log(`✅ [${debugId}] Key pair generated successfully:`, {
        keyType,
        publicKeyLength: publicKey.length,
        privateKeyLength: privateKey.length
      });

      return { publicKey, privateKey };

    } catch (error) {
      console.error(`❌ [${debugId}] Key generation failed:`, error);
      throw error;
    }
  }

  private async createDIDIdentifier(publicKey: string, config: SovereignIdentityConfig): Promise<string> {
    // Create identifier based on public key hash
    const keyData = publicKey + config.didMethod + Date.now();
    const result = await HashUtils.hashFile(new File([keyData], 'did'));
    return result.hash.substring(0, 32);
  }

  private async createDIDDocument(did: string, publicKey: string, config: SovereignIdentityConfig): Promise<any> {
    return {
      "@context": "https://www.w3.org/ns/did/v1",
      id: did,
      verificationMethod: [{
        id: `${did}#keys-1`,
        type: this.getVerificationMethodType(config.keyType),
        controller: did,
        publicKeyBase58: publicKey
      }],
      authentication: [`${did}#keys-1`],
      assertionMethod: [`${did}#keys-1`],
      service: [{
        id: `${did}#ile-legal`,
        type: "LegalDocumentSigning",
        serviceEndpoint: `${window.location.origin}/api/sovereign/${did}`
      }]
    };
  }

  private getVerificationMethodType(keyType: string): string {
    switch (keyType) {
      case 'ed25519': return 'Ed25519VerificationKey2020';
      case 'secp256k1': return 'EcdsaSecp256k1VerificationKey2019';
      case 'rsa': return 'RsaVerificationKey2018';
      default: return 'JsonWebKey2020';
    }
  }

  private async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    const exportedKeyBuffer = new Uint8Array(exported);
    return Array.from(exportedKeyBuffer, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async createSigningPayload(data: {
    documentHash: string;
    did: string;
    timestamp: string;
    additionalClaims?: Record<string, any>;
  }): Promise<string> {
    const payload = {
      documentHash: data.documentHash,
      did: data.did,
      timestamp: data.timestamp,
      claims: data.additionalClaims || {}
    };
    return JSON.stringify(payload);
  }

  private async generateSovereignSignature(
    payload: string,
    privateKey: string,
    keyType: string
  ): Promise<string> {
    // Simplified signature generation - in production, use proper crypto libraries
    const combined = payload + privateKey;
    const result = await HashUtils.hashFile(new File([combined], 'signature'));
    return `${keyType}_sig_${result.hash}`;
  }

  private async verifyCryptographicSignature(
    signature: string,
    documentHash: string,
    publicKey: string,
    signatureType: string
  ): Promise<boolean> {
    // Simplified verification - in production, use proper crypto verification
    return signature.includes(signatureType) && 
           signature.includes('sig_') && 
           signature.length > 64;
  }

  private verifySignatureTimestamp(timestamp: string): boolean {
    const now = Date.now();
    const signTime = Date.parse(timestamp);
    const timeDiff = now - signTime;
    
    // Valid if not from future and not older than 1 year
    return timeDiff >= 0 && timeDiff <= (365 * 24 * 60 * 60 * 1000);
  }

  private calculateIdentityTrustScore(params: {
    didResolved: boolean;
    signatureValid: boolean;
    keyOwnership: boolean;
    credentialVerified: boolean;
    timestampValid: boolean;
    crossChainVerified: boolean;
    attestationCount: number;
  }): number {
    let score = 0;
    
    if (params.didResolved) score += 20;
    if (params.signatureValid) score += 25;
    if (params.keyOwnership) score += 20;
    if (params.credentialVerified) score += 15;
    if (params.timestampValid) score += 10;
    if (params.crossChainVerified) score += 5;
    score += Math.min(params.attestationCount * 1, 5);
    
    return Math.min(score, 100);
  }

  // Storage and retrieval methods
  private async storeSovereignIdentity(identity: DecentralizedIdentifier): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('sovereign_identities')
        .insert({
          did: identity.did,
          user_id: user.user.id,
          method: identity.method,
          identifier: identity.identifier,
          public_key: identity.publicKey,
          metadata: identity.metadata,
          is_active: identity.isActive,
          created_at: identity.createdAt
        });

      if (error) {
        console.error('Failed to store sovereign identity:', error);
      }
    } catch (error) {
      console.error('Sovereign identity storage failed:', error);
    }
  }

  private async retrieveSovereignIdentity(did: string): Promise<DecentralizedIdentifier> {
    const { data, error } = await supabase
      .from('sovereign_identities')
      .select('*')
      .eq('did', did)
      .single();

    if (error || !data) {
      throw new Error(`Sovereign identity not found: ${did}`);
    }

    return {
      did: data.did,
      method: data.method,
      identifier: data.identifier,
      publicKey: data.public_key,
      privateKey: data.private_key, // Should be encrypted in production
      createdAt: data.created_at,
      isActive: data.is_active,
      metadata: data.metadata
    };
  }

  private async resolveDID(did: string): Promise<DecentralizedIdentifier | null> {
    try {
      return await this.retrieveSovereignIdentity(did);
    } catch {
      return null;
    }
  }

  // Placeholder implementations for advanced features
  private async registerDIDOnBlockchain(did: string, didDocument: any): Promise<void> {
    // TODO: Implement blockchain registration
    console.log(`⛓️ Registering DID on blockchain: ${did}`);
  }

  private async generateInitialAttestations(identity: DecentralizedIdentifier, config: SovereignIdentityConfig): Promise<string[]> {
    // TODO: Implement attestation generation
    return ['self_attested', 'ile_legal_verified'];
  }

  private async createCredentialProof(identity: DecentralizedIdentifier, documentHash: string): Promise<string> {
    // TODO: Implement verifiable credential proof
    return `credential_proof_${documentHash.substring(0, 16)}`;
  }

  private async verifyCredentialProof(proof: string, identity: DecentralizedIdentifier, documentHash: string): Promise<boolean> {
    // TODO: Implement credential verification
    return proof.includes('credential_proof_');
  }

  private async verifyCrossChainRegistration(did: string): Promise<boolean> {
    // TODO: Implement cross-chain verification
    return true;
  }

  private async buildTrustChain(did: string): Promise<string[]> {
    // TODO: Implement trust chain building
    return [did];
  }

  private async storeSovereignSignature(signature: SovereignSignature, fileName: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('sovereign_signatures')
        .insert({
          user_id: user.user.id,
          did: signature.did,
          document_hash: signature.documentHash,
          signature_data: signature,
          file_name: fileName,
          created_at: signature.timestamp
        });

      if (error) {
        console.error('Failed to store sovereign signature:', error);
      }
    } catch (error) {
      console.error('Sovereign signature storage failed:', error);
    }
  }
}

export const sovereignIdentityService = new SovereignIdentityService();