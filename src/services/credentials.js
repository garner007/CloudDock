/**
 * credentials.js — Secure credential storage
 *
 * In the Electron app:   uses safeStorage via IPC (OS keychain encryption)
 * In browser / dev mode: falls back to localStorage transparently
 *
 * Usage:
 *   import { getCredential, setCredentials, clearCredentials } from './credentials';
 *   const endpoint = await getCredential('ls_endpoint');
 */

const KEYS = ['ls_endpoint', 'ls_region', 'ls_access_key', 'ls_secret_key'];

const DEFAULTS = {
  ls_endpoint:   'http://localhost:4566',
  ls_region:     'us-east-1',
  ls_access_key: 'test',
  ls_secret_key: 'test',
};

// Detect whether we're running inside the Electron shell
const isElectron = () =>
  typeof window !== 'undefined' && window.electronAPI?.credentials != null;

/**
 * Get a single credential value.
 * Returns the default if not set.
 */
export async function getCredential(key) {
  if (isElectron()) {
    try {
      const val = await window.electronAPI.credentials.get(key);
      return val ?? DEFAULTS[key] ?? null;
    } catch {
      // IPC failed (e.g. safeStorage not available on this OS) — fall through
    }
  }
  return localStorage.getItem(key) ?? DEFAULTS[key] ?? null;
}

/**
 * Save all credentials at once.
 * @param {Object} map  e.g. { ls_endpoint: '...', ls_region: '...', ... }
 */
export async function setCredentials(map) {
  let saved = false;
  if (isElectron()) {
    try {
      await window.electronAPI.credentials.set(map);
      saved = true;
    } catch (e) {
      console.warn('Failed to save to Electron safeStorage:', e);
    }
  }
  if (!saved) {
    for (const [k, v] of Object.entries(map)) {
      localStorage.setItem(k, v);
    }
  }
}

/**
 * Clear all credentials (e.g. on "Reset to defaults")
 */
export async function clearCredentials() {
  if (isElectron()) {
    try {
      await window.electronAPI.credentials.clear();
      return;
    } catch {}
  }
  KEYS.forEach(k => localStorage.removeItem(k));
}
