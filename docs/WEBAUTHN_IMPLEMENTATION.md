# WebAuthn/FIDO2 Passwordless Authentication

Complete implementation guide for WebAuthn passwordless authentication in Omni Sales.

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flows](#authentication-flows)
3. [Credential Types](#credential-types)
4. [API Endpoints](#api-endpoints)
5. [Components](#components)
6. [Database Schema](#database-schema)
7. [Security Considerations](#security-considerations)
8. [Browser Support](#browser-support)

## Overview

WebAuthn (Web Authentication API) is a web standard published by the W3C that enables passwordless authentication using public key cryptography. This implementation supports:

- **Platform Authenticators**: Face ID, Touch ID, Windows Hello, Android Fingerprint
- **Cross-Platform Authenticators**: Hardware security keys (YubiKey, Titan, etc.)
- **Recovery Codes**: Backup codes for account recovery
- **Multi-Device Support**: Register multiple credentials per user

### Benefits

- **More Secure**: Resistant to phishing, credential stuffing, and replay attacks
- **Better UX**: Faster and easier than passwords
- **Privacy**: Credentials are device-specific and cannot be tracked across sites
- **Standards-Based**: FIDO2/WebAuthn is an industry standard

## Authentication Flows

### Registration Flow Diagram

```
┌──────────┐                ┌──────────┐                ┌──────────────┐
│  Client  │                │  Server  │                │ Authenticator│
│ (Browser)│                │  (API)   │                │   (Device)   │
└────┬─────┘                └────┬─────┘                └──────┬───────┘
     │                           │                              │
     │ 1. Request Registration   │                              │
     │ POST /register/options    │                              │
     ├──────────────────────────>│                              │
     │                           │                              │
     │                           │ 2. Generate Challenge        │
     │                           │    Store in DB               │
     │                           │                              │
     │ 3. Return Options         │                              │
     │ (challenge, user info)    │                              │
     │<──────────────────────────┤                              │
     │                           │                              │
     │ 4. Start Registration     │                              │
     │ navigator.credentials     │                              │
     │    .create()              │                              │
     ├───────────────────────────┼─────────────────────────────>│
     │                           │                              │
     │                           │         5. User Verification │
     │                           │         (Biometric/PIN)      │
     │                           │                              │
     │ 6. Return Attestation     │                              │
     │<──────────────────────────┼──────────────────────────────┤
     │                           │                              │
     │ 7. Send Response          │                              │
     │ POST /register/verify     │                              │
     ├──────────────────────────>│                              │
     │                           │                              │
     │                           │ 8. Verify Attestation        │
     │                           │    Validate Challenge        │
     │                           │    Store Public Key          │
     │                           │                              │
     │ 9. Success                │                              │
     │<──────────────────────────┤                              │
     │                           │                              │
```

### Authentication Flow Diagram

```
┌──────────┐                ┌──────────┐                ┌──────────────┐
│  Client  │                │  Server  │                │ Authenticator│
│ (Browser)│                │  (API)   │                │   (Device)   │
└────┬─────┘                └────┬─────┘                └──────┬───────┘
     │                           │                              │
     │ 1. Request Login          │                              │
     │ POST /authenticate/options│                              │
     ├──────────────────────────>│                              │
     │                           │                              │
     │                           │ 2. Generate Challenge        │
     │                           │    Get User Credentials      │
     │                           │                              │
     │ 3. Return Options         │                              │
     │ (challenge, allowed creds)│                              │
     │<──────────────────────────┤                              │
     │                           │                              │
     │ 4. Start Authentication   │                              │
     │ navigator.credentials     │                              │
     │    .get()                 │                              │
     ├───────────────────────────┼─────────────────────────────>│
     │                           │                              │
     │                           │         5. User Verification │
     │                           │         (Biometric/PIN)      │
     │                           │         6. Sign Challenge    │
     │                           │                              │
     │ 7. Return Assertion       │                              │
     │<──────────────────────────┼──────────────────────────────┤
     │                           │                              │
     │ 8. Send Response          │                              │
     │ POST /authenticate/verify │                              │
     ├──────────────────────────>│                              │
     │                           │                              │
     │                           │ 9. Verify Signature          │
     │                           │    Validate Counter          │
     │                           │    Create Session            │
     │                           │                              │
     │ 10. Success + Session     │                              │
     │<──────────────────────────┤                              │
     │                           │                              │
```

### Recovery Code Flow Diagram

```
┌──────────┐                ┌──────────┐
│  Client  │                │  Server  │
│ (Browser)│                │  (API)   │
└────┬─────┘                └────┬─────┘
     │                           │
     │ 1. Request Recovery       │
     │ POST /recovery-codes      │
     ├──────────────────────────>│
     │                           │
     │                           │ 2. Generate Codes
     │                           │    Hash and Store
     │                           │
     │ 3. Return Codes (ONCE)    │
     │<──────────────────────────┤
     │                           │
     │ 4. User Saves Codes       │
     │                           │
     │                           │
     │ ... Later (Lost Access) ..│
     │                           │
     │ 5. Login with Code        │
     │ POST /recovery-codes/verify
     ├──────────────────────────>│
     │                           │
     │                           │ 6. Verify Hash
     │                           │    Mark as Used
     │                           │    Create Session
     │                           │
     │ 7. Success + Session      │
     │<──────────────────────────┤
     │                           │
```

## Credential Types

### Platform Authenticators

Built-in device authenticators using biometric sensors or device PIN.

| Platform | Authenticator | User Verification |
|----------|--------------|-------------------|
| **iOS/iPadOS** | Face ID | Facial recognition |
| **iOS/iPadOS** | Touch ID | Fingerprint |
| **macOS** | Touch ID | Fingerprint |
| **Android** | Fingerprint | Fingerprint |
| **Android** | Face Unlock | Facial recognition |
| **Windows** | Windows Hello | Face/Fingerprint/PIN |
| **Chrome OS** | Built-in | Fingerprint/PIN |

**Characteristics:**
- ✅ Device-specific (cannot be moved to another device)
- ✅ Synced across devices via platform (e.g., iCloud Keychain)
- ✅ Fast and convenient
- ✅ No additional hardware needed
- ❌ Lost if device is lost (use recovery codes)

### Cross-Platform Authenticators

Physical security keys that can be used across multiple devices.

| Device | Examples | Transports |
|--------|----------|-----------|
| **USB Keys** | YubiKey, Titan Key | USB-A, USB-C |
| **NFC Keys** | YubiKey 5 NFC | NFC + USB |
| **Bluetooth Keys** | Feitian ePass | Bluetooth |
| **Multi-Protocol** | YubiKey 5Ci | USB-C + Lightning |

**Characteristics:**
- ✅ Portable across devices
- ✅ Works on any compatible device
- ✅ Physical possession required
- ✅ Highly secure
- ❌ Requires additional hardware purchase
- ❌ Can be lost/stolen (use recovery codes)

### Recovery Codes

Backup codes for account recovery when losing access to authenticators.

**Format:** `XXXX-XXXX` (8 characters, alphanumeric)

**Properties:**
- Single-use codes
- Hashed with SHA-256 before storage
- Generated in sets of 10
- Can be regenerated (invalidates old codes)
- Should be stored securely (password manager, printed)

## API Endpoints

### Registration

#### `POST /api/auth/webauthn/register/options`

Generate registration options for new credential enrollment.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "challenge": "base64-encoded-challenge",
  "rp": {
    "name": "Omni Sales",
    "id": "yourdomain.com"
  },
  "user": {
    "id": "user-uuid",
    "name": "user@example.com",
    "displayName": "User Name"
  },
  "pubKeyCredParams": [
    { "type": "public-key", "alg": -7 },
    { "type": "public-key", "alg": -257 }
  ],
  "timeout": 60000,
  "attestation": "none",
  "authenticatorSelection": {
    "residentKey": "preferred",
    "userVerification": "preferred"
  }
}
```

#### `POST /api/auth/webauthn/register/verify`

Verify registration response and store credential.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "response": {
    // RegistrationResponseJSON from @simplewebauthn/browser
  },
  "deviceType": "platform" | "cross-platform",
  "credentialName": "My iPhone"
}
```

**Response:**
```json
{
  "success": true,
  "credential": {
    "id": "credential-uuid",
    "name": "My iPhone",
    "device_type": "platform",
    "created_at": "2025-01-16T00:00:00Z"
  }
}
```

### Authentication

#### `POST /api/auth/webauthn/authenticate/options`

Generate authentication options for login.

**Body:**
```json
{
  "email": "user@example.com" // Optional
}
```

**Response:**
```json
{
  "challenge": "base64-encoded-challenge",
  "rpId": "yourdomain.com",
  "timeout": 60000,
  "userVerification": "preferred",
  "allowCredentials": [
    {
      "id": "base64-credential-id",
      "type": "public-key",
      "transports": ["internal"]
    }
  ]
}
```

#### `POST /api/auth/webauthn/authenticate/verify`

Verify authentication response and create session.

**Body:**
```json
{
  "response": {
    // AuthenticationResponseJSON from @simplewebauthn/browser
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  },
  "credential": {
    "id": "credential-uuid",
    "name": "My iPhone"
  }
}
```

### Credential Management

#### `GET /api/auth/webauthn/credentials`

List user's registered credentials.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "credentials": [
    {
      "id": "credential-uuid",
      "name": "My iPhone",
      "device_type": "platform",
      "created_at": "2025-01-16T00:00:00Z",
      "last_used_at": "2025-01-16T12:00:00Z"
    }
  ]
}
```

#### `DELETE /api/auth/webauthn/credentials/:id`

Remove a credential.

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Credential removed successfully"
}
```

#### `PATCH /api/auth/webauthn/credentials/:id`

Rename a credential.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "New Name"
}
```

### Recovery Codes

#### `POST /api/auth/webauthn/recovery-codes`

Generate recovery codes.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "regenerate": false
}
```

**Response:**
```json
{
  "codes": [
    "ABCD-1234",
    "EFGH-5678",
    ...
  ],
  "generated_at": "2025-01-16T00:00:00Z",
  "message": "Store these codes in a safe place..."
}
```

#### `POST /api/auth/webauthn/recovery-codes/verify`

Verify recovery code and login.

**Body:**
```json
{
  "email": "user@example.com",
  "code": "ABCD-1234"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com"
  },
  "remaining_codes": 9
}
```

## Components

### WebAuthnRegisterButton

Button for registering new credentials.

```tsx
import WebAuthnRegisterButton from '@/components/auth/webauthn/WebAuthnRegisterButton';

<WebAuthnRegisterButton
  deviceType="platform" // 'platform' | 'cross-platform' | 'auto'
  credentialName="My Device"
  onSuccess={(credential) => console.log('Registered:', credential)}
  onError={(error) => console.error('Error:', error)}
/>
```

### WebAuthnLoginButton

Button for WebAuthn authentication.

```tsx
import WebAuthnLoginButton from '@/components/auth/webauthn/WebAuthnLoginButton';

<WebAuthnLoginButton
  email="user@example.com" // Optional
  variant="primary" // 'primary' | 'secondary' | 'text'
  autoFill={false} // Enable browser autofill
  onSuccess={(result) => console.log('Login:', result)}
  onError={(error) => console.error('Error:', error)}
/>
```

### CredentialManager

Full credential management interface.

```tsx
import CredentialManager from '@/components/auth/webauthn/CredentialManager';

<CredentialManager />
```

### RecoveryCodesDisplay

Recovery codes display and management.

```tsx
import RecoveryCodesDisplay from '@/components/auth/webauthn/RecoveryCodesDisplay';

<RecoveryCodesDisplay
  codes={['ABCD-1234', ...]} // Optional
  onGenerate={() => console.log('Generated')}
  onDownload={(codes) => console.log('Downloaded:', codes)}
/>
```

## Database Schema

See `supabase/migrations/20250116_webauthn_passwordless.sql` for complete schema.

### Key Tables

- **user_credentials**: Stores public keys and credential metadata
- **credential_counters**: Tracks signature counters for replay protection
- **recovery_codes**: Hashed backup codes
- **webauthn_challenges**: Temporary challenge storage
- **auth_logs**: Authentication attempt history

## Security Considerations

### Challenge Verification

- Challenges expire after 5 minutes
- One-time use only
- Cryptographically random (generated server-side)
- Validated before credential operations

### Replay Attack Prevention

- Signature counter validation
- Counter must always increase
- Failed counter validation triggers security alert

### Origin Verification

- Validates expected origin (domain)
- Prevents phishing attacks
- Requires HTTPS in production

### HTTPS Requirement

WebAuthn requires HTTPS except for localhost development.

**Production:**
```
✅ https://yourdomain.com
❌ http://yourdomain.com
```

**Development:**
```
✅ http://localhost:3000
✅ https://localhost:3000
```

### Rate Limiting

Implement rate limiting on:
- Registration attempts
- Authentication attempts
- Recovery code verification

### Account Recovery

- Multiple recovery codes (10 by default)
- Regeneration invalidates old codes
- Secure storage recommended
- Single-use only

## Browser Support

### Full Support

- ✅ Chrome 67+
- ✅ Edge 18+
- ✅ Firefox 60+
- ✅ Safari 13+
- ✅ Opera 54+

### Platform Authenticator Support

- ✅ Chrome 67+ (Windows Hello, Touch ID)
- ✅ Safari 14+ (Face ID, Touch ID)
- ✅ Edge 18+ (Windows Hello)
- ✅ Android Chrome (Fingerprint)

### Feature Detection

```typescript
import WebAuthnClient from '@/lib/auth/webauthn/webauthn-client';

// Check basic support
const isSupported = WebAuthnClient.isSupported();

// Check platform authenticator
const hasPlatformAuth = await WebAuthnClient.isPlatformAuthenticatorAvailable();

// Check conditional mediation (autofill)
const hasAutofill = await WebAuthnClient.isConditionalMediationAvailable();

// Get all capabilities
const capabilities = await WebAuthnClient.getBrowserCapabilities();
```

### Graceful Degradation

The implementation includes:
- Feature detection before showing UI
- Fallback to password authentication
- Recovery codes for lost credentials
- Clear error messages for unsupported browsers

## Testing

### Manual Testing

1. **Registration:**
   - Visit `/auth/register-webauthn`
   - Try both platform and security key options
   - Verify credential appears in settings

2. **Authentication:**
   - Visit `/login`
   - Use WebAuthn login button
   - Verify successful login

3. **Credential Management:**
   - Visit `/settings/security/credentials`
   - Add, rename, and remove credentials
   - Test with multiple devices

4. **Recovery Codes:**
   - Generate codes in settings
   - Download/print codes
   - Test recovery code login

### Browser Testing Matrix

| Browser | Platform Auth | Security Key | Conditional UI |
|---------|--------------|--------------|----------------|
| Chrome | ✅ | ✅ | ✅ |
| Safari | ✅ | ✅ | ❌ |
| Firefox | ✅ | ✅ | ❌ |
| Edge | ✅ | ✅ | ✅ |

## Troubleshooting

### Common Issues

**"WebAuthn is not supported"**
- Update browser to latest version
- Ensure HTTPS (or localhost)
- Check browser compatibility

**"Registration failed"**
- Clear browser data
- Check authenticator availability
- Verify HTTPS certificate

**"Authentication failed"**
- Ensure credential is registered
- Check user verification (biometric/PIN)
- Verify counter hasn't decreased

**"Invalid counter"**
- Possible replay attack detected
- Contact support to reset credential

## Resources

- [WebAuthn Spec](https://www.w3.org/TR/webauthn-2/)
- [FIDO Alliance](https://fidoalliance.org/)
- [SimpleWebAuthn Docs](https://simplewebauthn.dev/)
- [WebAuthn Guide](https://webauthn.guide/)
