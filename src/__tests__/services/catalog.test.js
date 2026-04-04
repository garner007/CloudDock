import { SERVICE_CATALOG, GROUPS } from '../../services/catalog';

describe('catalog', () => {
  test('SERVICE_CATALOG is a non-empty array', () => {
    expect(Array.isArray(SERVICE_CATALOG)).toBe(true);
    expect(SERVICE_CATALOG.length).toBeGreaterThan(0);
  });

  test('each service has required fields (id, label, group, emoji)', () => {
    SERVICE_CATALOG.forEach((svc) => {
      expect(svc.id).toBeDefined();
      expect(typeof svc.id).toBe('string');
      expect(svc.label).toBeDefined();
      expect(typeof svc.label).toBe('string');
      expect(svc.group).toBeDefined();
      expect(typeof svc.group).toBe('string');
      expect(svc.emoji).toBeDefined();
    });
  });

  test('GROUPS is a non-empty array', () => {
    expect(Array.isArray(GROUPS)).toBe(true);
    expect(GROUPS.length).toBeGreaterThan(0);
  });

  test('all service groups are present in GROUPS', () => {
    const serviceGroups = new Set(SERVICE_CATALOG.map(s => s.group));
    serviceGroups.forEach((g) => {
      expect(GROUPS).toContain(g);
    });
  });

  test('services cover expected IDs', () => {
    const ids = SERVICE_CATALOG.map(s => s.id);
    expect(ids).toContain('s3');
    expect(ids).toContain('dynamodb');
    expect(ids).toContain('sqs');
    expect(ids).toContain('lambda');
    expect(ids).toContain('iam');
    expect(ids).toContain('cloudwatch');
  });

  test('catalog has a large number of services', () => {
    expect(SERVICE_CATALOG.length).toBeGreaterThan(50);
  });
});
