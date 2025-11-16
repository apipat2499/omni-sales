-- WebAuthn/FIDO2 Passwordless Authentication Tables
-- This migration creates tables for WebAuthn credential storage and management

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Credentials Table
-- Stores WebAuthn public keys and credential information
CREATE TABLE IF NOT EXISTS user_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    transports TEXT[], -- e.g., ['usb', 'nfc', 'ble', 'internal']
    backup_eligible BOOLEAN DEFAULT FALSE,
    backup_state BOOLEAN DEFAULT FALSE,
    device_type TEXT NOT NULL CHECK (device_type IN ('platform', 'cross-platform')),
    name TEXT, -- User-friendly name for the credential
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX idx_user_credentials_user_id ON user_credentials(user_id);
CREATE INDEX idx_user_credentials_credential_id ON user_credentials(credential_id);
CREATE INDEX idx_user_credentials_last_used ON user_credentials(last_used_at DESC);

-- Credential Counter Table (for replay attack prevention)
-- Tracks authentication attempts and counter values
CREATE TABLE IF NOT EXISTS credential_counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credential_id TEXT NOT NULL,
    counter BIGINT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_credential
        FOREIGN KEY (credential_id)
        REFERENCES user_credentials(credential_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_credential_counters_credential_id ON credential_counters(credential_id);

-- Recovery Codes Table
-- Stores hashed backup codes for account recovery
CREATE TABLE IF NOT EXISTS recovery_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    code_hash TEXT NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_user_recovery
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_recovery_codes_user_id ON recovery_codes(user_id);
CREATE INDEX idx_recovery_codes_used ON recovery_codes(used);

-- WebAuthn Challenges Table
-- Stores temporary challenges for registration and authentication
CREATE TABLE IF NOT EXISTS webauthn_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    challenge TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_webauthn_challenges_user_id ON webauthn_challenges(user_id);
CREATE INDEX idx_webauthn_challenges_challenge ON webauthn_challenges(challenge);
CREATE INDEX idx_webauthn_challenges_expires_at ON webauthn_challenges(expires_at);

-- Auth Logs Table
-- Stores authentication history for security monitoring
CREATE TABLE IF NOT EXISTS auth_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    credential_id TEXT,
    auth_method TEXT NOT NULL, -- 'webauthn', 'password', 'recovery_code'
    success BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    location JSONB, -- Store geolocation data if available
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_user_auth_log
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX idx_auth_logs_created_at ON auth_logs(created_at DESC);
CREATE INDEX idx_auth_logs_success ON auth_logs(success);
CREATE INDEX idx_auth_logs_auth_method ON auth_logs(auth_method);

-- Function to clean up expired challenges
CREATE OR REPLACE FUNCTION cleanup_expired_challenges()
RETURNS void AS $$
BEGIN
    DELETE FROM webauthn_challenges
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update credential counter and last used timestamp
CREATE OR REPLACE FUNCTION update_credential_usage(
    p_credential_id TEXT,
    p_new_counter BIGINT
)
RETURNS void AS $$
BEGIN
    -- Update credential
    UPDATE user_credentials
    SET counter = p_new_counter,
        last_used_at = NOW()
    WHERE credential_id = p_credential_id;

    -- Insert counter history
    INSERT INTO credential_counters (credential_id, counter)
    VALUES (p_credential_id, p_new_counter);
END;
$$ LANGUAGE plpgsql;

-- Function to log authentication attempt
CREATE OR REPLACE FUNCTION log_auth_attempt(
    p_user_id UUID,
    p_credential_id TEXT,
    p_auth_method TEXT,
    p_success BOOLEAN,
    p_ip_address INET,
    p_user_agent TEXT,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO auth_logs (
        user_id,
        credential_id,
        auth_method,
        success,
        ip_address,
        user_agent,
        error_message
    ) VALUES (
        p_user_id,
        p_credential_id,
        p_auth_method,
        p_success,
        p_ip_address,
        p_user_agent,
        p_error_message
    ) RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE webauthn_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- User Credentials Policies
CREATE POLICY "Users can view their own credentials"
    ON user_credentials FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials"
    ON user_credentials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials"
    ON user_credentials FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials"
    ON user_credentials FOR DELETE
    USING (auth.uid() = user_id);

-- Recovery Codes Policies
CREATE POLICY "Users can view their own recovery codes"
    ON recovery_codes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recovery codes"
    ON recovery_codes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recovery codes"
    ON recovery_codes FOR UPDATE
    USING (auth.uid() = user_id);

-- Auth Logs Policies
CREATE POLICY "Users can view their own auth logs"
    ON auth_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert auth logs"
    ON auth_logs FOR INSERT
    WITH CHECK (true); -- Allow service to log all attempts

-- Credential Counters Policies (read-only for users)
CREATE POLICY "Users can view credential counters"
    ON credential_counters FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_credentials
            WHERE user_credentials.credential_id = credential_counters.credential_id
            AND user_credentials.user_id = auth.uid()
        )
    );

-- WebAuthn Challenges Policies
CREATE POLICY "Users can view their own challenges"
    ON webauthn_challenges FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role can manage challenges"
    ON webauthn_challenges FOR ALL
    USING (true);

-- Create a scheduled job to clean up expired challenges (if pg_cron is available)
-- This will run every hour
-- SELECT cron.schedule('cleanup-webauthn-challenges', '0 * * * *', 'SELECT cleanup_expired_challenges();');

-- Comments for documentation
COMMENT ON TABLE user_credentials IS 'Stores WebAuthn public key credentials for passwordless authentication';
COMMENT ON TABLE credential_counters IS 'Tracks credential usage counters for replay attack prevention';
COMMENT ON TABLE recovery_codes IS 'Stores hashed backup codes for account recovery';
COMMENT ON TABLE webauthn_challenges IS 'Temporary storage for WebAuthn challenges during registration/authentication';
COMMENT ON TABLE auth_logs IS 'Authentication attempt logs for security monitoring';

COMMENT ON COLUMN user_credentials.credential_id IS 'Base64-encoded credential ID from the authenticator';
COMMENT ON COLUMN user_credentials.public_key IS 'Base64-encoded public key from the authenticator';
COMMENT ON COLUMN user_credentials.counter IS 'Signature counter for replay attack prevention';
COMMENT ON COLUMN user_credentials.device_type IS 'Platform authenticator (Face ID, Touch ID) or cross-platform (security key)';
COMMENT ON COLUMN user_credentials.backup_eligible IS 'Whether the credential can be backed up';
COMMENT ON COLUMN user_credentials.backup_state IS 'Whether the credential is currently backed up';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_credentials TO authenticated;
GRANT SELECT, INSERT, UPDATE ON recovery_codes TO authenticated;
GRANT SELECT ON credential_counters TO authenticated;
GRANT SELECT ON auth_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON webauthn_challenges TO authenticated;
