'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { getUserPreferences, updateUserPreferences } from './api';

export type DistanceUnit = 'kilometres' | 'miles';

export interface UserPreferences {
  distanceUnit: DistanceUnit;
  defaultCurrency: string;
  theme: 'dark' | 'light' | 'system';
  notifications: {
    reminders: boolean;
    serviceAlerts: boolean;
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  distanceUnit: 'kilometres',
  defaultCurrency: 'AUD',
  theme: 'dark',
  notifications: {
    reminders: true,
    serviceAlerts: true,
  },
};

const STORAGE_KEY = 'autofolio_user_preferences';

export const KM_TO_MILES = 0.621371;

export function convertKmToMiles(km: number): number {
  return km * KM_TO_MILES;
}

export function convertMilesToKm(miles: number): number {
  return miles / KM_TO_MILES;
}

interface PreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  updateNotifications: (updates: Partial<UserPreferences['notifications']>) => void;
  formatDistance: (km: number | null | undefined, showUnit?: boolean) => string;
  getDistanceValue: (km: number | null | undefined) => number | null;
  getUnitLabel: () => string;
  mounted: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();

  // 1. Initial Load from LocalStorage (Immediate feedback)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse preferences', e);
      }
    }
    setMounted(true);
  }, []);

  // 3. Apply Theme to Document
  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    const effectiveTheme = preferences.theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : preferences.theme;

    root.setAttribute('data-theme', effectiveTheme);
    
    // Also apply dark/light classes for standard Tailwind variants if needed
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [preferences.theme, mounted]);

  // 2. Load from Backend when session is available
  useEffect(() => {
    const userId = session?.user?.id;
    if (userId && mounted) {
      getUserPreferences(userId)
        .then(data => {
          if (data?.defaultCurrency) {
            setPreferences(prev => {
              if (prev.defaultCurrency === data.defaultCurrency) return prev;
              
              const newPrefs = { ...prev, defaultCurrency: data.defaultCurrency };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
              return newPrefs;
            });
          }
        })
        .catch((err) => {
          console.error('[Preferences] Failed to load cloud settings:', err);
        });
    }
  }, [session, mounted]);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
      return newPrefs;
    });

    // Sync to backend if currency changed and session exists
    const userId = session?.user?.id;
    if (updates.defaultCurrency && userId) {
      try {
        await updateUserPreferences(userId, { defaultCurrency: updates.defaultCurrency });
      } catch (err) {
        console.error('[Preferences] Failed to sync currency to cloud:', err);
      }
    }
  }, [session]);

  const updateNotifications = useCallback((updates: Partial<UserPreferences['notifications']>) => {
    updatePreferences({ notifications: { ...preferences.notifications, ...updates } });
  }, [preferences.notifications, updatePreferences]);

  const formatDistance = useCallback((km: number | null | undefined, showUnit = true) => {
    if (km === null || km === undefined) return 'Not recorded';
    
    const useMiles = mounted && preferences.distanceUnit === 'miles';
    const value = useMiles ? convertKmToMiles(km) : km;
    const formattedValue = new Intl.NumberFormat('en-US').format(Math.round(value));
    
    if (!showUnit) return formattedValue;
    
    const unitLabel = useMiles ? 'MILES' : 'KMS';
    return `${formattedValue} ${unitLabel}`;
  }, [mounted, preferences.distanceUnit]);

  const getDistanceValue = useCallback((km: number | null | undefined) => {
    if (km === null || km === undefined) return null;
    const useMiles = mounted && preferences.distanceUnit === 'miles';
    const value = useMiles ? convertKmToMiles(km) : km;
    return Math.round(value);
  }, [mounted, preferences.distanceUnit]);

  const getUnitLabel = useCallback(() => {
    return (mounted && preferences.distanceUnit === 'miles') ? 'MILES' : 'KMS';
  }, [mounted, preferences.distanceUnit]);

  return (
    <PreferencesContext.Provider value={{
      preferences,
      updatePreferences,
      updateNotifications,
      formatDistance,
      getDistanceValue,
      getUnitLabel,
      mounted
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    // Robust fallback if used outside provider
    return {
      preferences: DEFAULT_PREFERENCES,
      updatePreferences: () => {},
      updateNotifications: () => {},
      formatDistance: (km: number | null | undefined) => km?.toString() || 'Not recorded',
      getDistanceValue: (km: number | null | undefined) => km || null,
      getUnitLabel: () => 'KMS',
      mounted: false
    };
  }
  return context;
}
