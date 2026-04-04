const { ENDPOINT } = require('./setup');

describe('LocalStack Health', () => {
  test('/_localstack/health returns 200', async () => {
    const res = await fetch(`${ENDPOINT}/_localstack/health`);
    expect(res.status).toBe(200);
  });

  test('health response includes services map', async () => {
    const res = await fetch(`${ENDPOINT}/_localstack/health`);
    const body = await res.json();
    expect(body).toHaveProperty('services');
    expect(typeof body.services).toBe('object');
  });

  test('core services are running or available', async () => {
    const res = await fetch(`${ENDPOINT}/_localstack/health`);
    const { services } = await res.json();
    const expectedServices = ['s3', 'sqs', 'sns', 'dynamodb', 'lambda'];
    expectedServices.forEach(svc => {
      if (services[svc]) {
        expect(['running', 'available']).toContain(services[svc]);
      }
    });
  });

  test('/_localstack/info returns version info', async () => {
    const res = await fetch(`${ENDPOINT}/_localstack/info`);
    if (res.ok) {
      const body = await res.json();
      expect(body).toHaveProperty('version');
    }
  });
});
