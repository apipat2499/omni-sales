import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export class BiometricService {
  async isAvailable(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  }

  async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  }

  async authenticate(reason: string = 'Authenticate to continue'): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });

    return result.success;
  }

  async saveBiometricToken(userId: string, token: string): Promise<void> {
    await SecureStore.setItemAsync(`biometric_token_${userId}`, token);
  }

  async getBiometricToken(userId: string): Promise<string | null> {
    return await SecureStore.getItemAsync(`biometric_token_${userId}`);
  }

  async deleteBiometricToken(userId: string): Promise<void> {
    await SecureStore.deleteItemAsync(`biometric_token_${userId}`);
  }

  async enableBiometric(userId: string): Promise<string> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error('Biometric authentication is not available on this device');
    }

    const authenticated = await this.authenticate('Enable biometric authentication');
    if (!authenticated) {
      throw new Error('Biometric authentication failed');
    }

    // Generate a secure token for biometric login
    const token = this.generateSecureToken();
    await this.saveBiometricToken(userId, token);

    return token;
  }

  async disableBiometric(userId: string): Promise<void> {
    await this.deleteBiometricToken(userId);
  }

  private generateSecureToken(): string {
    // Generate a random secure token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

export const biometricService = new BiometricService();
