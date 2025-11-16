import { authService } from '../../src/services/authService';
import { apiClient } from '../../src/lib/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../../src/lib/api/client');
jest.mock('@react-native-async-storage/async-storage');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          twoFactorEnabled: false,
        },
        token: 'mock-token',
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.login('test@example.com', 'password');

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/auth/login',
        { email: 'test@example.com', password: 'password' }
      );
    });

    it('should handle 2FA requirement', async () => {
      const mockResponse = {
        requiresTwoFactor: true,
        user: {} as any,
        token: 'temp-token',
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.login('test@example.com', 'password');

      expect(result.requiresTwoFactor).toBe(true);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({});

      await authService.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/logout');
    });
  });

  describe('loadStoredUser', () => {
    it('should load user from storage', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        twoFactorEnabled: false,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockUser));

      const user = await authService.loadStoredUser();

      expect(user).toEqual(mockUser);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('user');
    });

    it('should return null if no user in storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const user = await authService.loadStoredUser();

      expect(user).toBeNull();
    });
  });
});
