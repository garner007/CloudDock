import { getCredential, setCredentials, clearCredentials } from '../../services/credentials';

describe('credentials service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getCredential', () => {
    test('returns localStorage value when available', async () => {
      localStorage.setItem('ls_endpoint', 'http://custom:4566');
      const val = await getCredential('ls_endpoint');
      expect(val).toBe('http://custom:4566');
    });

    test('returns default when localStorage is empty', async () => {
      const val = await getCredential('ls_endpoint');
      expect(val).toBe('http://localhost:4566');
    });

    test('returns default region when not set', async () => {
      const val = await getCredential('ls_region');
      expect(val).toBe('us-east-1');
    });

    test('returns null for unknown key with no default', async () => {
      const val = await getCredential('unknown_key');
      expect(val).toBeNull();
    });
  });

  describe('setCredentials', () => {
    test('writes values to localStorage', async () => {
      await setCredentials({
        ls_endpoint: 'http://remote:4566',
        ls_region: 'eu-west-1',
      });
      expect(localStorage.getItem('ls_endpoint')).toBe('http://remote:4566');
      expect(localStorage.getItem('ls_region')).toBe('eu-west-1');
    });
  });

  describe('clearCredentials', () => {
    test('removes credential keys from localStorage', async () => {
      localStorage.setItem('ls_endpoint', 'http://custom:4566');
      localStorage.setItem('ls_region', 'eu-west-1');
      localStorage.setItem('ls_access_key', 'mykey');
      localStorage.setItem('ls_secret_key', 'mysecret');

      await clearCredentials();

      expect(localStorage.getItem('ls_endpoint')).toBeNull();
      expect(localStorage.getItem('ls_region')).toBeNull();
      expect(localStorage.getItem('ls_access_key')).toBeNull();
      expect(localStorage.getItem('ls_secret_key')).toBeNull();
    });
  });
});
