/**
 * WebAuthn Client Helper
 * Client-side utilities for WebAuthn operations
 */

import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types';

export class WebAuthnClient {
  /**
   * Start registration flow
   */
  static async register(
    options: PublicKeyCredentialCreationOptionsJSON
  ) {
    try {
      const response = await startRegistration(options);
      return { success: true, response };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * Start authentication flow
   */
  static async authenticate(
    options: PublicKeyCredentialRequestOptionsJSON,
    useBrowserAutofill: boolean = false
  ) {
    try {
      const response = await startAuthentication(options, useBrowserAutofill);
      return { success: true, response };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
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
   * Check if conditional mediation (autofill) is available
   */
  static async isConditionalMediationAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      // @ts-ignore - Not all browsers have this yet
      return await PublicKeyCredential.isConditionalMediationAvailable?.() || false;
    } catch {
      return false;
    }
  }

  /**
   * Get browser capabilities
   */
  static async getBrowserCapabilities() {
    const isSupported = this.isSupported();
    const hasPlatformAuthenticator = isSupported
      ? await this.isPlatformAuthenticatorAvailable()
      : false;
    const hasConditionalMediation = isSupported
      ? await this.isConditionalMediationAvailable()
      : false;

    return {
      isSupported,
      hasPlatformAuthenticator,
      hasConditionalMediation,
    };
  }

  /**
   * Get user-friendly error message
   */
  static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        return 'Authentication was cancelled or timed out';
      }
      if (error.name === 'InvalidStateError') {
        return 'This authenticator is already registered';
      }
      if (error.name === 'NotSupportedError') {
        return 'WebAuthn is not supported on this browser';
      }
      if (error.name === 'SecurityError') {
        return 'Security error. Make sure you are using HTTPS';
      }
      return error.message;
    }
    return 'An unknown error occurred';
  }
}

export default WebAuthnClient;
