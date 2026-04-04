import { getConfig, clearClientCache } from '../../services/awsClients';

describe('awsClients — getConfig()', () => {
  beforeEach(() => {
    localStorage.clear();
    clearClientCache();
  });

  test('returns default config when localStorage is empty', () => {
    const cfg = getConfig();
    expect(cfg.endpoint).toBe('http://localhost:4566');
    expect(cfg.region).toBe('us-east-1');
    expect(cfg.credentials.accessKeyId).toBe('test');
    expect(cfg.credentials.secretAccessKey).toBe('test');
    expect(cfg.forcePathStyle).toBe(true);
  });

  test('uses values stored in localStorage', () => {
    localStorage.setItem('ls_endpoint', 'http://localhost:4510');
    localStorage.setItem('ls_region', 'eu-west-1');
    localStorage.setItem('ls_access_key', 'mykey');
    localStorage.setItem('ls_secret_key', 'mysecret');

    const cfg = getConfig();
    expect(cfg.endpoint).toBe('http://localhost:4510');
    expect(cfg.region).toBe('eu-west-1');
    expect(cfg.credentials.accessKeyId).toBe('mykey');
    expect(cfg.credentials.secretAccessKey).toBe('mysecret');
  });

  test('merges overrides on top of base config', () => {
    const cfg = getConfig({ region: 'ap-southeast-1', maxAttempts: 1 });
    expect(cfg.region).toBe('ap-southeast-1');
    expect(cfg.maxAttempts).toBe(1);
    expect(cfg.endpoint).toBe('http://localhost:4566'); // still default
  });

  test('forcePathStyle is always true (required for LocalStack S3)', () => {
    const cfg = getConfig();
    expect(cfg.forcePathStyle).toBe(true);
  });
});
