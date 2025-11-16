import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { Button, TextInput, LoadingSpinner, ErrorMessage } from '../../components';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

interface TwoFactorScreenProps {
  route: {
    params: {
      tempToken: string;
      email: string;
    };
  };
  navigation: any;
}

export const TwoFactorScreen: React.FC<TwoFactorScreenProps> = ({ route, navigation }) => {
  const { tempToken, email } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useAuthStore();

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.verify2FA(code, tempToken);
      setUser(response.user);
      // Navigation will be handled by App.tsx based on auth state
    } catch (err: any) {
      setError(err.message || 'Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Verifying code..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Two-Factor Authentication</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to {email}
        </Text>

        <TextInput
          label="Verification Code"
          value={code}
          onChangeText={setCode}
          keyboardType="numeric"
          maxLength={6}
          placeholder="000000"
          error={!!error}
          style={styles.input}
        />

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <Button
          mode="contained"
          onPress={handleVerify}
          style={styles.button}
          disabled={loading}
        >
          Verify Code
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Back to Login
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  backButton: {
    marginTop: 8,
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginTop: 8,
  },
});
