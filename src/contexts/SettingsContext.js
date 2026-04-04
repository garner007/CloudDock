import React, { createContext, useState, useCallback } from 'react';

const DEFAULTS = {
  ls_endpoint: 'http://localhost:4566',
  ls_region: 'us-east-1',
  ls_access_key: 'test',
  ls_secret_key: 'test',
  ls_backend: 'localstack',
};

export const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const initial = {};
    for (const [key, defaultVal] of Object.entries(DEFAULTS)) {
      initial[key] = localStorage.getItem(key) || defaultVal;
    }
    return initial;
  });

  const updateSettings = useCallback((map) => {
    setSettings(prev => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(map)) {
        next[k] = v;
        localStorage.setItem(k, v);
      }
      return next;
    });
  }, []);

  const value = {
    endpoint: settings.ls_endpoint,
    region: settings.ls_region,
    accessKey: settings.ls_access_key,
    secretKey: settings.ls_secret_key,
    backendId: settings.ls_backend,
    updateSettings,
    raw: settings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
