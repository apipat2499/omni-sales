/**
 * User preferences and settings
 */

export interface UserSettings {
  userId: string;
  displayName?: string;
  email?: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'th' | 'en';
  timezone?: string;
  currency: string;
  decimalPlaces: number;
  dateFormat: string;
  notifications: {
    enabled: boolean;
    sound: boolean;
    browser: boolean;
  };
  dashboard: {
    itemsPerPage: number;
    defaultSort: 'name' | 'price' | 'quantity' | 'date';
    sortOrder: 'asc' | 'desc';
    compactMode: boolean;
  };
  export: {
    defaultFormat: 'csv' | 'json' | 'excel';
    includeHeaders: boolean;
  };
  keyboard: {
    enabled: boolean;
  };
  privacy: {
    trackingEnabled: boolean;
    analyticsEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export function getDefaultSettings(userId: string): UserSettings {
  return {
    userId,
    displayName: 'User',
    theme: 'auto',
    language: 'th',
    currency: 'THB',
    decimalPlaces: 2,
    dateFormat: 'dd/MM/yyyy',
    notifications: {
      enabled: true,
      sound: true,
      browser: true,
    },
    dashboard: {
      itemsPerPage: 20,
      defaultSort: 'date',
      sortOrder: 'desc',
      compactMode: false,
    },
    export: {
      defaultFormat: 'csv',
      includeHeaders: true,
    },
    keyboard: {
      enabled: true,
    },
    privacy: {
      trackingEnabled: true,
      analyticsEnabled: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function getUserSettings(userId: string): UserSettings {
  try {
    const stored = localStorage.getItem(`user_settings_${userId}`);
    if (!stored) return getDefaultSettings(userId);

    const settings = JSON.parse(stored) as UserSettings;
    return {
      ...settings,
      createdAt: new Date(settings.createdAt),
      updatedAt: new Date(settings.updatedAt),
    };
  } catch {
    return getDefaultSettings(userId);
  }
}

export function saveUserSettings(settings: UserSettings): void {
  try {
    const updated = {
      ...settings,
      updatedAt: new Date(),
    };
    localStorage.setItem(`user_settings_${settings.userId}`, JSON.stringify(updated));
  } catch {
    console.error('Failed to save user settings');
  }
}

export function updateUserSetting<K extends keyof UserSettings>(
  userId: string,
  key: K,
  value: UserSettings[K]
): UserSettings {
  const settings = getUserSettings(userId);
  const updated = {
    ...settings,
    [key]: value,
    updatedAt: new Date(),
  };
  saveUserSettings(updated);
  return updated;
}

export function resetToDefaults(userId: string): UserSettings {
  const defaults = getDefaultSettings(userId);
  saveUserSettings(defaults);
  return defaults;
}

export function exportSettings(userId: string): string {
  const settings = getUserSettings(userId);
  return JSON.stringify(settings, null, 2);
}

export function importSettings(userId: string, jsonString: string): boolean {
  try {
    const settings = JSON.parse(jsonString) as Partial<UserSettings>;
    const updated = {
      ...getUserSettings(userId),
      ...settings,
      userId,
      updatedAt: new Date(),
    };
    saveUserSettings(updated);
    return true;
  } catch {
    return false;
  }
}
