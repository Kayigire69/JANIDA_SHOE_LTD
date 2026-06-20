import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/authApi';

interface SettingsContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  companyName: string;
  logoUrl: string | null;
  refreshSettings: () => Promise<void>;
  API_BASE_URL: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [companyName, setCompanyName] = useState<string>('Smart Shoe Factory');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const refreshSettings = async () => {
    try {
      const { settings } = await authApi.getPublicSettings();
      const nameSetting = settings.find((s) => s.setting_key === 'company_name');
      const logoSetting = settings.find((s) => s.setting_key === 'company_logo_url');

      if (nameSetting) setCompanyName(nameSetting.setting_value);
      if (logoSetting) setLogoUrl(logoSetting.setting_value);
    } catch (err) {
      console.error('Failed to load system settings:', err);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ theme, toggleTheme, companyName, logoUrl, refreshSettings, API_BASE_URL }}>
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
