import speakeasy from "speakeasy";
import QRCode from "qrcode";

export async function generateTwoFactorSecret(userEmail: string) {
  try {
    const secret = speakeasy.generateSecret({
      name: `Omni Sales (${userEmail})`,
      issuer: "Omni Sales",
      length: 32,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url || "");

    return {
      secret: secret.base32,
      qrCode,
      backupCodes: generateBackupCodes(),
    };
  } catch (error) {
    console.error("Generate 2FA secret error:", error);
    throw error;
  }
}

export function verifyTwoFactorToken(secret: string, token: string) {
  try {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2,
    });

    return verified;
  } catch (error) {
    console.error("Verify 2FA token error:", error);
    return false;
  }
}

function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();
    codes.push(code);
  }
  return codes;
}

export async function enable2FA(userId: string, secret: string, db: any) {
  try {
    const { error } = await db
      .from("users")
      .update({
        two_factor_enabled: true,
        two_factor_secret: secret,
      })
      .eq("id", userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Enable 2FA error:", error);
    throw error;
  }
}

export async function disable2FA(userId: string, db: any) {
  try {
    const { error } = await db
      .from("users")
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
      })
      .eq("id", userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Disable 2FA error:", error);
    throw error;
  }
}

export default {
  generateTwoFactorSecret,
  verifyTwoFactorToken,
  enable2FA,
  disable2FA,
};
