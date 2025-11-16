/**
 * WebAuthn Type Definitions
 */

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

export interface CredentialCounter {
  id: string;
  credential_id: string;
  counter: number;
  updated_at: string;
}

export interface RecoveryCode {
  id: string;
  user_id: string;
  code_hash: string;
  used: boolean;
  used_at?: string;
  created_at: string;
}

export interface WebAuthnChallenge {
  id: string;
  user_id?: string;
  challenge: string;
  type: 'registration' | 'authentication';
  created_at: string;
  expires_at: string;
  used: boolean;
}

export interface AuthLog {
  id: string;
  user_id: string;
  credential_id?: string;
  auth_method: 'webauthn' | 'password' | 'recovery_code';
  success: boolean;
  ip_address?: string;
  user_agent?: string;
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  error_message?: string;
  created_at: string;
}

export interface WebAuthnRegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: 'public-key';
    alg: number;
  }>;
  timeout?: number;
  excludeCredentials?: Array<{
    id: string;
    type: 'public-key';
    transports?: string[];
  }>;
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    requireResidentKey?: boolean;
    residentKey?: 'discouraged' | 'preferred' | 'required';
    userVerification?: 'required' | 'preferred' | 'discouraged';
  };
  attestation?: 'none' | 'indirect' | 'direct' | 'enterprise';
}

export interface WebAuthnAuthenticationOptions {
  challenge: string;
  timeout?: number;
  rpId: string;
  allowCredentials?: Array<{
    id: string;
    type: 'public-key';
    transports?: string[];
  }>;
  userVerification?: 'required' | 'preferred' | 'discouraged';
}

export interface WebAuthnBrowserCapabilities {
  isSupported: boolean;
  hasPlatformAuthenticator: boolean;
  hasConditionalMediation: boolean;
}

export interface CredentialManagementAction {
  type: 'add' | 'remove' | 'rename';
  credentialId?: string;
  newName?: string;
}

export interface RecoveryCodesResponse {
  codes: string[];
  generated_at: string;
}

export interface AuthenticationResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: string;
  };
  credential?: UserCredential;
  error?: string;
}

export interface RegistrationResult {
  success: boolean;
  credential?: UserCredential;
  error?: string;
}
