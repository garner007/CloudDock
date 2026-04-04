import { BACKENDS, BACKEND_LIST, isServiceSupported, checkBackendHealth } from '../../services/backends';

describe('backends', () => {
  test('BACKENDS has expected entries', () => {
    expect(BACKENDS.localstack).toBeDefined();
    expect(BACKENDS.moto).toBeDefined();
    expect(BACKENDS.floci).toBeDefined();
    expect(BACKENDS.ministack).toBeDefined();
  });

  test('BACKEND_LIST is an array derived from BACKENDS', () => {
    expect(Array.isArray(BACKEND_LIST)).toBe(true);
    expect(BACKEND_LIST.length).toBe(Object.keys(BACKENDS).length);
  });

  test('each backend has required fields', () => {
    BACKEND_LIST.forEach((b) => {
      expect(b.id).toBeDefined();
      expect(b.name).toBeDefined();
      expect(b.defaultPort).toBeGreaterThan(0);
      expect(b.defaultEndpoint).toMatch(/^https?:\/\//);
    });
  });

  test('isServiceSupported returns true for S3 on localstack', () => {
    expect(isServiceSupported('s3', 'localstack')).toBe(true);
  });

  test('isServiceSupported returns true for S3 on moto', () => {
    expect(isServiceSupported('s3', 'moto')).toBe(true);
  });

  test('isServiceSupported returns false for pro-only services on moto', () => {
    // EKS, MSK, Bedrock are LocalStack-only
    expect(isServiceSupported('eks', 'moto')).toBe(false);
    expect(isServiceSupported('msk', 'moto')).toBe(false);
    expect(isServiceSupported('bedrock', 'moto')).toBe(false);
  });

  test('isServiceSupported returns false for unknown service', () => {
    expect(isServiceSupported('nonexistent-service', 'localstack')).toBe(false);
  });

  test('checkBackendHealth handles network errors gracefully', async () => {
    // Use a port that nothing is listening on
    const result = await checkBackendHealth('http://localhost:19999', 'localstack');
    expect(result.status).toBe('disconnected');
    expect(result.backend).toBe('localstack');
  });

  test('checkBackendHealth handles moto network errors gracefully', async () => {
    const result = await checkBackendHealth('http://localhost:19999', 'moto');
    expect(result.status).toBe('disconnected');
    expect(result.backend).toBe('moto');
  });
});
