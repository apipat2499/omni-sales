import { apiClient } from '../lib/api/client';
import { API_ENDPOINTS } from '../lib/api/endpoints';
import { AuthResponse, User } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      { email, password }
    );

    if (response.token && !response.requiresTwoFactor) {
      apiClient.setAuthToken(response.token);
      await this.saveUser(response.user);
    }

    return response;
  }

  async verify2FA(code: string, tempToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.VERIFY_2FA,
      { code, tempToken }
    );

    if (response.token) {
      apiClient.setAuthToken(response.token);
      await this.saveUser(response.user);
    }

    return response;
  }

  async signup(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.SIGNUP,
      data
    );

    if (response.token) {
      apiClient.setAuthToken(response.token);
      await this.saveUser(response.user);
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue logout even if API call fails
    } finally {
      apiClient.clearAuthToken();
      await this.clearUser();
    }
  }

  async biometricLogin(userId: string, biometricToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.BIOMETRIC_LOGIN,
      { userId, biometricToken }
    );

    if (response.token) {
      apiClient.setAuthToken(response.token);
      await this.saveUser(response.user);
    }

    return response;
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REFRESH_TOKEN,
      { refreshToken }
    );

    if (response.token) {
      apiClient.setAuthToken(response.token);
      await this.saveUser(response.user);
    }

    return response;
  }

  async loadStoredUser(): Promise<User | null> {
    const userJson = await AsyncStorage.getItem('user');
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  }

  private async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  }

  private async clearUser(): Promise<void> {
    await AsyncStorage.multiRemove(['user', 'refresh_token', 'auth_token']);
  }
}

export const authService = new AuthService();
