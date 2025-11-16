# WebAuthn Flow Diagrams & Credential Types

Complete WebAuthn/FIDO2 passwordless authentication implementation for Omni Sales.

## Quick Links

- **Full Documentation**: `/home/user/omni-sales/docs/WEBAUTHN_IMPLEMENTATION.md`
- **Library**: `/home/user/omni-sales/lib/auth/webauthn/`
- **API Routes**: `/home/user/omni-sales/app/api/auth/webauthn/`
- **Components**: `/home/user/omni-sales/components/auth/webauthn/`
- **Pages**:
  - Registration: `/home/user/omni-sales/app/auth/register-webauthn/page.tsx`
  - Settings: `/home/user/omni-sales/app/settings/security/credentials/page.tsx`
  - Login: `/home/user/omni-sales/app/login/page.tsx`

## Authentication Flow Diagrams

### 1. Registration Flow

```
User Journey: Registering a New Passkey
========================================

┌─────────────┐
│   Browser   │
│   (Client)  │
└──────┬──────┘
       │
       │ User clicks "Add Passkey"
       ▼
┌─────────────────────────────────────────────┐
│  Step 1: Request Registration Options      │
│  POST /api/auth/webauthn/register/options  │
└──────┬──────────────────────────────────────┘
       │
       │ Server generates:
       │ • Cryptographic challenge
       │ • User information
       │ • Credential exclusions
       │
       ▼
┌─────────────────────────────────────────────┐
│  Step 2: Prompt User for Authentication    │
│  Browser shows:                             │
│  • Touch ID prompt (iOS/macOS)              │
│  • Face ID prompt (iOS/macOS)               │
│  • Windows Hello prompt (Windows)           │
│  • Insert security key (Hardware)           │
└──────┬──────────────────────────────────────┘
       │
       │ User authenticates:
       │ • Biometric scan
       │ • PIN entry
       │ • Security key tap
       │
       ▼
┌─────────────────────────────────────────────┐
│  Step 3: Authenticator Creates Credential  │
│  • Generates key pair (public/private)      │
│  • Signs challenge with private key         │
│  • Returns attestation to browser           │
└──────┬──────────────────────────────────────┘
       │
       │ Send to server
       ▼
┌─────────────────────────────────────────────┐
│  Step 4: Server Verifies & Stores          │
│  POST /api/auth/webauthn/register/verify   │
│  • Validates attestation                    │
│  • Verifies challenge                       │
│  • Stores public key in database            │
│  • Returns success                          │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Step 5: Generate Recovery Codes           │
│  POST /api/auth/webauthn/recovery-codes    │
│  • Creates 10 backup codes                  │
│  • Shows codes to user ONCE                 │
│  • User downloads/prints codes              │
└─────────────────────────────────────────────┘
```

### 2. Authentication Flow

```
User Journey: Logging In with Passkey
======================================

┌─────────────┐
│   Browser   │
│   (Client)  │
└──────┬──────┘
       │
       │ User clicks "Sign in with Passkey"
       ▼
┌──────────────────────────────────────────────┐
│  Step 1: Request Authentication Options     │
│  POST /api/auth/webauthn/authenticate/options
└──────┬───────────────────────────────────────┘
       │
       │ Server:
       │ • Generates challenge
       │ • Gets user's credentials (if email provided)
       │ • Returns authentication options
       │
       ▼
┌──────────────────────────────────────────────┐
│  Step 2: Browser Prompts for Authentication │
│  Shows available credentials:                │
│  • "Sign in with Touch ID"                   │
│  • "Sign in with Face ID"                    │
│  • "Use security key"                        │
└──────┬───────────────────────────────────────┘
       │
       │ User authenticates
       │ (biometric/PIN/key tap)
       │
       ▼
┌──────────────────────────────────────────────┐
│  Step 3: Authenticator Signs Challenge      │
│  • Uses stored private key                   │
│  • Signs challenge                           │
│  • Increments counter (replay protection)    │
│  • Returns assertion                         │
└──────┬───────────────────────────────────────┘
       │
       │ Send assertion to server
       ▼
┌──────────────────────────────────────────────┐
│  Step 4: Server Verifies Authentication     │
│  POST /api/auth/webauthn/authenticate/verify │
│  • Validates signature with public key       │
│  • Verifies challenge matches                │
│  • Checks counter (prevents replay)          │
│  • Updates last used timestamp               │
└──────┬───────────────────────────────────────┘
       │
       │ Verification successful
       ▼
┌──────────────────────────────────────────────┐
│  Step 5: Create Session                     │
│  • Generate session token                    │
│  • Log authentication attempt                │
│  • Redirect to dashboard                     │
└──────────────────────────────────────────────┘
```

### 3. Recovery Code Flow

```
User Journey: Account Recovery
===============================

┌─────────────┐
│    User     │
│ Lost Device │
└──────┬──────┘
       │
       │ Navigates to login
       ▼
┌──────────────────────────────────────────────┐
│  Login Page                                  │
│  • "Lost access to your passkey?"            │
│  • "Use a recovery code"                     │
└──────┬───────────────────────────────────────┘
       │
       │ Click recovery code link
       ▼
┌──────────────────────────────────────────────┐
│  Recovery Code Input                         │
│  • Enter email                               │
│  • Enter recovery code (XXXX-XXXX)           │
└──────┬───────────────────────────────────────┘
       │
       │ Submit
       ▼
┌──────────────────────────────────────────────┐
│  Server Verification                         │
│  POST /api/auth/webauthn/recovery-codes/verify
│  • Find user by email                        │
│  • Hash submitted code                       │
│  • Compare with stored hashes                │
└──────┬───────────────────────────────────────┘
       │
       │ Code valid?
       ├─── No ──> Show error
       │
       │ Yes
       ▼
┌──────────────────────────────────────────────┐
│  Mark Code as Used                           │
│  • Update database (used = true)             │
│  • Create session                            │
│  • Log recovery authentication               │
└──────┬───────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│  Post-Recovery Actions                       │
│  • Show remaining codes count                │
│  • Prompt to add new passkey                 │
│  • Suggest generating new recovery codes     │
└──────────────────────────────────────────────┘
```

## Credential Types Comparison

### Platform Authenticators vs Cross-Platform Authenticators

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PLATFORM AUTHENTICATORS                          │
│                    (Built into your device)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  iOS/iPadOS          macOS              Windows           Android       │
│  ┌────────┐         ┌────────┐         ┌────────┐       ┌────────┐    │
│  │Face ID │         │Touch ID│         │Windows │       │Finger- │    │
│  │Touch ID│         │        │         │ Hello  │       │ print  │    │
│  └────────┘         └────────┘         └────────┘       └────────┘    │
│                                                                         │
│  ✅ No hardware needed                                                  │
│  ✅ Very fast (instant unlock)                                          │
│  ✅ Synced across your devices (via iCloud/Google/Microsoft)            │
│  ✅ Highly convenient                                                   │
│  ❌ Device-specific (can't use on other people's devices)               │
│  ❌ Lost if device is lost/broken (use recovery codes!)                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     CROSS-PLATFORM AUTHENTICATORS                       │
│                      (Physical security keys)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  USB Keys            NFC Keys           Bluetooth        Multi-Protocol │
│  ┌────────┐         ┌────────┐         ┌────────┐       ┌────────┐    │
│  │YubiKey │         │YubiKey │         │Feitian │       │YubiKey │    │
│  │Titan   │         │5 NFC   │         │ePass   │       │  5Ci   │    │
│  │Security│         │        │         │        │       │        │    │
│  └────────┘         └────────┘         └────────┘       └────────┘    │
│   USB-A/C             NFC + USB          Wireless        USB-C+Lightning│
│                                                                         │
│  ✅ Works on any device                                                 │
│  ✅ Highly portable                                                     │
│  ✅ Most secure option                                                  │
│  ✅ No battery needed (USB/NFC)                                         │
│  ❌ Costs money (~$25-70)                                               │
│  ❌ Can be lost/stolen (keep backup + recovery codes)                   │
│  ❌ Need to carry with you                                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Credential Types Decision Matrix

### When to Use Each Type

```
┌──────────────────────────────────────────────────────────────────┐
│                    RECOMMENDATION MATRIX                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  YOUR SCENARIO                    → RECOMMENDED CREDENTIAL       │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Regular user, one device         → Platform Authenticator      │
│  (iPhone, MacBook, etc.)            (Face ID / Touch ID)        │
│                                                                  │
│  Multiple devices (Apple)         → Platform Authenticator      │
│  (iPhone + iPad + Mac)              (synced via iCloud)         │
│                                                                  │
│  High security needs              → Security Key                │
│  (Admin, finance access)            (YubiKey recommended)       │
│                                                                  │
│  Shared/public computers          → Security Key + Recovery     │
│  (Work stations, labs)              (Never use platform auth)   │
│                                                                  │
│  Multiple OS/platforms            → Security Key                │
│  (Windows + Mac + Android)          (Universal compatibility)   │
│                                                                  │
│  Maximum security                 → Both!                       │
│  (Critical accounts)                Platform + Security Key     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Security Features Comparison

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SECURITY FEATURES                                │
├──────────────┬─────────────────────┬─────────────────────┬──────────────┤
│   Feature    │  Platform Auth      │  Security Key       │ Recovery Code│
├──────────────┼─────────────────────┼─────────────────────┼──────────────┤
│ Phishing     │                     │                     │              │
│ Resistant    │         ✅          │         ✅          │      ❌      │
├──────────────┼─────────────────────┼─────────────────────┼──────────────┤
│ Replay       │                     │                     │              │
│ Protection   │         ✅          │         ✅          │      ✅      │
├──────────────┼─────────────────────┼─────────────────────┼──────────────┤
│ Man-in-the-  │                     │                     │              │
│ Middle Proof │         ✅          │         ✅          │      ⚠️      │
├──────────────┼─────────────────────┼─────────────────────┼──────────────┤
│ Offline      │                     │                     │              │
│ Attack Proof │         ✅          │         ✅          │      ✅      │
├──────────────┼─────────────────────┼─────────────────────┼──────────────┤
│ Brute Force  │                     │                     │              │
│ Resistant    │         ✅          │         ✅          │      ✅      │
├──────────────┼─────────────────────┼─────────────────────┼──────────────┤
│ Physical     │                     │                     │              │
│ Presence Req │         ✅          │         ✅          │      ❌      │
├──────────────┼─────────────────────┼─────────────────────┼──────────────┤
│ Can Be       │                     │                     │              │
│ Shared       │         ❌          │         ❌          │      ✅      │
├──────────────┼─────────────────────┼─────────────────────┼──────────────┤
│ Works        │                     │                     │              │
│ Offline      │         ✅          │         ✅          │      ❌      │
└──────────────┴─────────────────────┴─────────────────────┴──────────────┘
```

## Implementation Details

### File Structure

```
/home/user/omni-sales/
│
├── lib/auth/webauthn/
│   ├── webauthn-manager.ts      # Server-side WebAuthn operations
│   └── webauthn-client.ts       # Client-side browser operations
│
├── app/api/auth/webauthn/
│   ├── register/
│   │   ├── options/route.ts     # Generate registration options
│   │   └── verify/route.ts      # Verify registration response
│   ├── authenticate/
│   │   ├── options/route.ts     # Generate auth options
│   │   └── verify/route.ts      # Verify auth response
│   ├── credentials/
│   │   ├── route.ts             # List credentials (GET)
│   │   └── [id]/route.ts        # Delete/rename credential
│   └── recovery-codes/
│       ├── route.ts             # Generate codes (POST), Check codes (GET)
│       └── verify/route.ts      # Verify recovery code
│
├── app/auth/register-webauthn/
│   └── page.tsx                 # Registration flow UI
│
├── app/settings/security/credentials/
│   └── page.tsx                 # Credential management UI
│
├── app/login/
│   └── page.tsx                 # Login page (updated with WebAuthn)
│
├── components/auth/webauthn/
│   ├── WebAuthnRegisterButton.tsx   # Registration button
│   ├── WebAuthnLoginButton.tsx      # Login button
│   ├── CredentialManager.tsx        # Credential list/management
│   └── RecoveryCodesDisplay.tsx     # Recovery codes UI
│
├── types/
│   └── webauthn.ts              # TypeScript types
│
├── supabase/migrations/
│   └── 20250116_webauthn_passwordless.sql   # Database schema
│
└── docs/
    └── WEBAUTHN_IMPLEMENTATION.md           # Full documentation
```

### Database Tables

```
┌──────────────────────────────────────────────────────────────┐
│ user_credentials                                             │
├──────────────────────────────────────────────────────────────┤
│ • id (UUID)                                                  │
│ • user_id (UUID) → auth.users                                │
│ • credential_id (TEXT, base64)                               │
│ • public_key (TEXT, base64)                                  │
│ • counter (BIGINT) ← Replay protection                       │
│ • device_type ('platform' | 'cross-platform')                │
│ • name (TEXT) ← User-friendly name                           │
│ • transports (TEXT[]) ← ['usb', 'nfc', 'internal']           │
│ • backup_eligible, backup_state (BOOLEAN)                    │
│ • created_at, last_used_at (TIMESTAMP)                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ recovery_codes                                               │
├──────────────────────────────────────────────────────────────┤
│ • id (UUID)                                                  │
│ • user_id (UUID) → auth.users                                │
│ • code_hash (TEXT) ← SHA-256 hash                            │
│ • used (BOOLEAN)                                             │
│ • used_at (TIMESTAMP)                                        │
│ • created_at (TIMESTAMP)                                     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ webauthn_challenges                                          │
├──────────────────────────────────────────────────────────────┤
│ • id (UUID)                                                  │
│ • user_id (UUID, nullable)                                   │
│ • challenge (TEXT)                                           │
│ • type ('registration' | 'authentication')                   │
│ • expires_at (TIMESTAMP) ← 5 minutes                         │
│ • used (BOOLEAN)                                             │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ auth_logs                                                    │
├──────────────────────────────────────────────────────────────┤
│ • id (UUID)                                                  │
│ • user_id (UUID) → auth.users                                │
│ • credential_id (TEXT, nullable)                             │
│ • auth_method ('webauthn' | 'password' | 'recovery_code')    │
│ • success (BOOLEAN)                                          │
│ • ip_address (INET)                                          │
│ • user_agent (TEXT)                                          │
│ • error_message (TEXT, nullable)                             │
│ • created_at (TIMESTAMP)                                     │
└──────────────────────────────────────────────────────────────┘
```

## User Journeys

### First-Time User Setup

```
1. User creates account with email/password
   ↓
2. After verification, prompt: "Secure your account with passkey?"
   ↓
3. User chooses: "Set up Face ID" or "Add Security Key"
   ↓
4. Browser prompts for biometric/PIN
   ↓
5. Credential registered
   ↓
6. Recovery codes generated and shown
   ↓
7. User downloads/prints recovery codes
   ↓
8. Setup complete! Can now login with passkey
```

### Experienced User - Adding Second Device

```
1. Login on new device with existing passkey
   ↓
2. Go to Settings → Security → Passkeys
   ↓
3. Click "Add Passkey"
   ↓
4. Choose device type (built-in biometric)
   ↓
5. Authenticate with new device
   ↓
6. Credential registered for new device
   ↓
7. Can now login from either device
```

### Lost Device Recovery

```
1. User lost phone with Face ID
   ↓
2. Go to login page
   ↓
3. Click "Lost access? Use recovery code"
   ↓
4. Enter email + one recovery code
   ↓
5. Access granted (recovery code now used/invalid)
   ↓
6. Immediately:
   • Remove lost device credential
   • Add new device credential
   • Generate new recovery codes
```

## Browser Support Matrix

```
┌────────────────────────────────────────────────────────────────────┐
│ BROWSER COMPATIBILITY                                              │
├───────────────┬────────────────┬─────────────┬────────────────────┤
│   Browser     │ Platform Auth  │ Security Key│ Conditional UI     │
├───────────────┼────────────────┼─────────────┼────────────────────┤
│ Chrome 67+    │       ✅       │      ✅     │        ✅          │
│ Edge 18+      │       ✅       │      ✅     │        ✅          │
│ Safari 13+    │       ✅       │      ✅     │        ❌          │
│ Firefox 60+   │       ✅       │      ✅     │        ❌          │
│ Opera 54+     │       ✅       │      ✅     │        ✅          │
│ iOS Safari 14+│       ✅       │      ❌     │        ❌          │
│ Android Chrome│       ✅       │      ✅     │        ✅          │
└───────────────┴────────────────┴─────────────┴────────────────────┘

Note: Conditional UI = Autofill/automatic credential selection
```

## Next Steps for Users

1. **Try It Out**
   - Visit: `/auth/register-webauthn`
   - Register your first passkey
   - Test login with passkey

2. **Secure Your Account**
   - Add passkeys for all your devices
   - Generate and save recovery codes
   - Remove old/unused credentials

3. **Manage Credentials**
   - Visit: `/settings/security/credentials`
   - View all your passkeys
   - Rename, add, or remove as needed

## Support Resources

- **Full Documentation**: `/docs/WEBAUTHN_IMPLEMENTATION.md`
- **WebAuthn Spec**: https://www.w3.org/TR/webauthn-2/
- **FIDO Alliance**: https://fidoalliance.org/
- **Browser Support**: https://caniuse.com/webauthn

---

**Implementation Status**: ✅ Complete

All WebAuthn features have been implemented and are ready to use!
