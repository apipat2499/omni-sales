import { useState, useCallback } from 'react';
import {
  getUserSettings,
  saveUserSettings,
  updateUserSetting,
  resetToDefaults,
  type UserSettings,
} from '@/lib/utils/user-preferences';

export function useUserPreferences(userId: string) {
  const [settings, setSettings] = useState<UserSettings>(() => getUserSettings(userId));

  const updateSetting = useCallback(
    <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      const updated = updateUserSetting(userId, key, value);
      setSettings(updated);
      return updated;
    },
    [userId]
  );

  const saveSettings = useCallback(
    (newSettings: Partial<UserSettings>) => {
      const updated = { ...settings, ...newSettings, updatedAt: new Date() };
      saveUserSettings(updated);
      setSettings(updated);
      return updated;
    },
    [settings]
  );

  const reset = useCallback(() => {
    const defaults = resetToDefaults(userId);
    setSettings(defaults);
    return defaults;
  }, [userId]);

  const updateDashboard = useCallback(
    (dashboardSettings: Partial<UserSettings['dashboard']>) => {
      return updateSetting('dashboard', {
        ...settings.dashboard,
        ...dashboardSettings,
      });
    },
    [settings.dashboard, updateSetting]
  );

  const updateNotifications = useCallback(
    (notificationSettings: Partial<UserSettings['notifications']>) => {
      return updateSetting('notifications', {
        ...settings.notifications,
        ...notificationSettings,
      });
    },
    [settings.notifications, updateSetting]
  );

  return {
    settings,
    updateSetting,
    saveSettings,
    reset,
    updateDashboard,
    updateNotifications,
  };
}
