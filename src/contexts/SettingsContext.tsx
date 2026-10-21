import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ApiKeys } from '../types';

interface SettingsContextType {
  apiKeys: ApiKeys;
  updateApiKeys: (keys: ApiKeys) => void;
  clearApiKeys: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  googleClientId: string;
  updateGoogleClientId: (id: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKeys, setApiKeys] = useState<ApiKeys>(() => {
    const saved = localStorage.getItem('promptflow_api_keys');
    return saved ? JSON.parse(saved) : { providerA: 'mock', providerB: 'mock' };
  });

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [googleClientId, setGoogleClientId] = useState(() => {
    return localStorage.getItem('promptflow_google_client_id') || '';
  });

  useEffect(() => {
    localStorage.setItem('promptflow_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  // Synchronize HTML element class with dark mode theme state
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const updateApiKeys = (keys: ApiKeys) => {
    setApiKeys((prev) => ({ ...prev, ...keys }));
  };

  const clearApiKeys = () => {
    setApiKeys({ providerA: 'mock', providerB: 'mock', openai: '', gemini: '' });
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const updateGoogleClientId = (id: string) => {
    setGoogleClientId(id);
    localStorage.setItem('promptflow_google_client_id', id);
  };

  return (
    <SettingsContext.Provider
      value={{
        apiKeys,
        updateApiKeys,
        clearApiKeys,
        theme,
        toggleTheme,
        notificationsEnabled,
        setNotificationsEnabled,
        googleClientId,
        updateGoogleClientId
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
