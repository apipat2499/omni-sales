import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { List, Switch, Divider, Text } from 'react-native-paper';
import { Card, Button, LoadingSpinner } from '../components';
import { biometricService } from '../services/biometricService';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const available = await biometricService.isAvailable();
    setBiometricAvailable(available);

    if (available && user) {
      const token = await biometricService.getBiometricToken(user.id);
      setBiometricEnabled(!!token);
    }
  };

  const handleBiometricToggle = async () => {
    if (!user) return;

    try {
      setLoading(true);
      if (!biometricEnabled) {
        // Enable biometric
        const token = await biometricService.enableBiometric(user.id);
        setBiometricEnabled(true);
        Alert.alert('Success', 'Biometric authentication enabled');
      } else {
        // Disable biometric
        await biometricService.disableBiometric(user.id);
        setBiometricEnabled(false);
        Alert.alert('Success', 'Biometric authentication disabled');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update biometric settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
          },
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner message="Updating settings..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Security</Text>

          <List.Item
            title="Biometric Authentication"
            description={
              biometricAvailable
                ? 'Use fingerprint or face recognition to login'
                : 'Biometric authentication not available on this device'
            }
            right={() => (
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                disabled={!biometricAvailable || loading}
              />
            )}
          />

          <Divider />

          <List.Item
            title="Two-Factor Authentication"
            description={user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            right={() => (
              <Switch
                value={user?.twoFactorEnabled || false}
                disabled
              />
            )}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <List.Item
            title="Language"
            description="English"
            right={() => <List.Icon icon="chevron-right" />}
            onPress={() => {}}
          />

          <Divider />

          <List.Item
            title="Theme"
            description="Auto"
            right={() => <List.Icon icon="chevron-right" />}
            onPress={() => {}}
          />

          <Divider />

          <List.Item
            title="Currency"
            description="USD"
            right={() => <List.Icon icon="chevron-right" />}
            onPress={() => {}}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <List.Item
            title="Push Notifications"
            description="Receive push notifications"
            right={() => <Switch value={true} onValueChange={() => {}} />}
          />

          <Divider />

          <List.Item
            title="Email Notifications"
            description="Receive email notifications"
            right={() => <Switch value={true} onValueChange={() => {}} />}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>About</Text>

          <List.Item
            title="Version"
            description="1.0.0"
          />

          <Divider />

          <List.Item
            title="Privacy Policy"
            right={() => <List.Icon icon="chevron-right" />}
            onPress={() => {}}
          />

          <Divider />

          <List.Item
            title="Terms of Service"
            right={() => <List.Icon icon="chevron-right" />}
            onPress={() => {}}
          />
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        icon="logout"
      >
        Logout
      </Button>

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  logoutButton: {
    margin: 16,
    marginTop: 24,
  },
  footer: {
    height: 40,
  },
});
