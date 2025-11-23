'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface StoreSettings {
  name: string;
  description: string;
  logo: string | null;
}

export interface BankAccountSettings {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  showInCheckout: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface ShippingMethod {
  id: string;
  method: string;
  cost: number;
  days: string;
}

export interface ShippingSettings {
  methods: ShippingMethod[];
  freeShippingThreshold: number;
}

interface SettingsState {
  store: StoreSettings;
  bankAccount: BankAccountSettings;
  categories: Category[];
  shipping: ShippingSettings;
}

interface SettingsContextType {
  settings: SettingsState;
  updateStoreSettings: (store: StoreSettings) => Promise<void>;
  updateBankAccountSettings: (bankAccount: BankAccountSettings) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateShippingSettings: (shipping: ShippingSettings) => Promise<void>;
  loading: boolean;
}

const defaultSettings: SettingsState = {
  store: {
    name: 'My Store',
    description: 'Quality clothing and accessories',
    logo: null,
  },
  bankAccount: {
    bankName: 'Bangkok Bank',
    accountNumber: '1234567890',
    accountHolder: 'Your Name Here',
    showInCheckout: true,
  },
  categories: [
    { id: '1', name: 'shirts' },
    { id: '2', name: 'pants' },
    { id: '3', name: 'shoes' },
    { id: '4', name: 'accessories' },
  ],
  shipping: {
    methods: [
      { id: '1', method: 'Standard', cost: 50, days: '2-3' },
      { id: '2', method: 'Express', cost: 100, days: '1-2' },
    ],
    freeShippingThreshold: 1000,
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const stored = localStorage.getItem('omni-sales-settings');
        if (stored) {
          setSettings(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings to localStorage whenever they change
  const saveSettings = (newSettings: SettingsState) => {
    try {
      localStorage.setItem('omni-sales-settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };

  const updateStoreSettings = async (store: StoreSettings) => {
    const newSettings = { ...settings, store };
    saveSettings(newSettings);

    // Optionally sync with API
    try {
      await fetch('/api/admin/settings/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(store),
      });
    } catch (error) {
      console.error('Error syncing store settings:', error);
    }
  };

  const updateBankAccountSettings = async (bankAccount: BankAccountSettings) => {
    const newSettings = { ...settings, bankAccount };
    saveSettings(newSettings);

    // Optionally sync with API
    try {
      await fetch('/api/admin/settings/payment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankAccount),
      });
    } catch (error) {
      console.error('Error syncing bank account settings:', error);
    }
  };

  const addCategory = async (name: string) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name,
    };
    const newSettings = {
      ...settings,
      categories: [...settings.categories, newCategory],
    };
    saveSettings(newSettings);

    // Optionally sync with API
    try {
      await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      });
    } catch (error) {
      console.error('Error syncing category:', error);
    }
  };

  const updateCategory = async (id: string, name: string) => {
    const newSettings = {
      ...settings,
      categories: settings.categories.map((cat) =>
        cat.id === id ? { ...cat, name } : cat
      ),
    };
    saveSettings(newSettings);

    // Optionally sync with API
    try {
      await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
    } catch (error) {
      console.error('Error syncing category update:', error);
    }
  };

  const deleteCategory = async (id: string) => {
    const newSettings = {
      ...settings,
      categories: settings.categories.filter((cat) => cat.id !== id),
    };
    saveSettings(newSettings);

    // Optionally sync with API
    try {
      await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error syncing category deletion:', error);
    }
  };

  const updateShippingSettings = async (shipping: ShippingSettings) => {
    const newSettings = { ...settings, shipping };
    saveSettings(newSettings);

    // Optionally sync with API
    try {
      await fetch('/api/admin/settings/shipping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipping),
      });
    } catch (error) {
      console.error('Error syncing shipping settings:', error);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateStoreSettings,
        updateBankAccountSettings,
        addCategory,
        updateCategory,
        deleteCategory,
        updateShippingSettings,
        loading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
