import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ls_theme';

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(preference) {
  const resolved = preference === 'system' ? getSystemTheme() : preference;
  document.documentElement.setAttribute('data-theme', resolved);
  return resolved;
}

export function useTheme() {
  const [preference, setPreference] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'dark';
  });

  const [resolved, setResolved] = useState(() => {
    const pref = localStorage.getItem(STORAGE_KEY) || 'dark';
    return applyTheme(pref);
  });

  // Apply theme whenever preference changes
  useEffect(() => {
    const r = applyTheme(preference);
    setResolved(r);
    localStorage.setItem(STORAGE_KEY, preference);
  }, [preference]);

  // Watch system preference changes when in "system" mode
  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setResolved(applyTheme('system'));
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  const setTheme = useCallback((pref) => {
    setPreference(pref);
  }, []);

  return { preference, resolved, setTheme };
}
