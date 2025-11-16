/**
 * WebAuthn Manager
 * Handles WebAuthn/FIDO2 passwordless authentication
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';

// Configuration
const RP_NAME = process.env.NEXT_PUBLIC_RP_NAME || 'Omni Sales';
const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000';

export interface UserCredential {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  transports?: string[];
  backup_eligible: boolean;
  backup_state: boolean;
  device_type: 'platform' | 'cross-platform';
  name?: string;
  created_at: string;
  last_used_at?: string;
}

export interface Challenge {
  user_id: string;
  challenge: string;
  type: 'registration' | 'authentication';
  created_at: string;
  expires_at: string;
}

export class WebAuthnManager {
  /**
   * Generate registration options for a new credential
   */
  static async generateRegistrationOptions(
    userId: string,
    userName: string,
    userDisplayName: string,
    existingCredentials: UserCredential[] = []
  ) {
    // Convert existing credentials to exclude from registration
    const excludeCredentials = existingCredentials.map((cred) => ({
      id: Buffer.from(cred.credential_id, 'base64'),
      type: 'public-key' as const,
      transports: cred.transports as AuthenticatorTransport[] | undefined,
    }));

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: userId,
      userName,
      userDisplayName,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: undefined, // Allow both platform and cross-platform
      },
      supportedAlgorithmIDs: [-7, -257], // ES256 and RS256
    });

    return options;
  }

  /**
   * Verify registration response from the authenticator
   */
  static async verifyRegistration(
    response: RegistrationResponseJSON,
    expectedChallenge: string
  ): Promise<VerifiedRegistrationResponse> {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    });

    return verification;
  }

  /**
   * Generate authentication options for existing credential
   */
  static async generateAuthenticationOptions(
    allowedCredentials: UserCredential[] = []
  ) {
    const allowCredentials = allowedCredentials.map((cred) => ({
      id: Buffer.from(cred.credential_id, 'base64'),
      type: 'public-key' as const,
      transports: cred.transports as AuthenticatorTransport[] | undefined,
    }));

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'preferred',
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    });

    return options;
  }

  /**
   * Verify authentication response from the authenticator
   */
  static async verifyAuthentication(
    response: AuthenticationResponseJSON,
    expectedChallenge: string,
    credential: UserCredential
  ): Promise<VerifiedAuthenticationResponse> {
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: Buffer.from(credential.credential_id, 'base64'),
        credentialPublicKey: Buffer.from(credential.public_key, 'base64'),
        counter: credential.counter,
        transports: credential.transports as AuthenticatorTransport[] | undefined,
      },
      requireUserVerification: true,
    });

    return verification;
  }

  /**
   * Prepare credential data for storage
   */
  static prepareCredentialForStorage(
    userId: string,
    verification: VerifiedRegistrationResponse,
    deviceType: 'platform' | 'cross-platform',
    name?: string
  ): Omit<UserCredential, 'id' | 'created_at' | 'last_used_at'> {
    const { registrationInfo } = verification;

    if (!registrationInfo) {
      throw new Error('Registration info not found');
    }

    return {
      user_id: userId,
      credential_id: Buffer.from(registrationInfo.credentialID).toString('base64'),
      public_key: Buffer.from(registrationInfo.credentialPublicKey).toString('base64'),
      counter: registrationInfo.counter,
      transports: registrationInfo.credentialDeviceType ? [registrationInfo.credentialDeviceType] : undefined,
      backup_eligible: registrationInfo.credentialBackedUp || false,
      backup_state: registrationInfo.credentialBackedUp || false,
      device_type: deviceType,
      name,
    };
  }

  /**
   * Validate counter to prevent replay attacks
   */
  static validateCounter(newCounter: number, storedCounter: number): boolean {
    // Counter should always increase
    return newCounter > storedCounter;
  }

  /**
   * Generate recovery codes
   */
  static generateRecoveryCodes(count: number = 10): string[] {
    const codes: string[] = [];
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      // Format: XXXX-XXXX
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }

    return codes;
  }

  /**
   * Hash recovery code for storage
   */
  static async hashRecoveryCode(code: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify recovery code
   */
  static async verifyRecoveryCode(
    code: string,
    hashedCode: string
  ): Promise<boolean> {
    const hash = await this.hashRecoveryCode(code);
    return hash === hashedCode;
  }

  /**
   * Detect authenticator type from response
   */
  static detectAuthenticatorType(
    response: RegistrationResponseJSON
  ): 'platform' | 'cross-platform' {
    // Check if the authenticator is a platform authenticator
    // This is a simplified check - in production, you might want more sophisticated detection
    const clientExtensions = response.clientExtensionResults;

    // Platform authenticators typically support resident keys
    if (clientExtensions?.credProps?.rk) {
      return 'platform';
    }

    // Default to cross-platform (security keys)
    return 'cross-platform';
  }

  /**
   * Get user-friendly device name based on type
   */
  static getDeviceName(deviceType: 'platform' | 'cross-platform'): string {
    if (deviceType === 'platform') {
      // Detect platform
      if (typeof navigator !== 'undefined') {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('mac')) return 'Touch ID';
        if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'Face ID';
        if (userAgent.includes('windows')) return 'Windows Hello';
        if (userAgent.includes('android')) return 'Fingerprint';
      }
      return 'Biometric';
    }
    return 'Security Key';
  }

  /**
   * Check if WebAuthn is supported
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
           'credentials' in navigator &&
           'PublicKeyCredential' in window;
  }

  /**
   * Check if platform authenticator is available
   */
  static async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Check if conditional mediation is supported (autofill)
   */
  static async isConditionalMediationAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      return await PublicKeyCredential.isConditionalMediationAvailable();
    } catch {
      return false;
    }
  }
}

export default WebAuthnManager;
