const http = require('http');
const { ENDPOINT } = require('./setup');

/**
 * Simple HTTP GET helper using Node's built-in http module.
 * Avoids dependency on globalThis.fetch which may not be available
 * in Jest's VM context with --experimental-vm-modules.
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, json: () => JSON.parse(data) });
      });
    }).on('error', reject);
  });
}

describe('LocalStack Health', () => {
  test('/_localstack/health returns 200', async () => {
    const res = await httpGet(`${ENDPOINT}/_localstack/health`);
    expect(res.status).toBe(200);
  });

  test('health response includes services map', async () => {
    const res = await httpGet(`${ENDPOINT}/_localstack/health`);
    const body = res.json();
    expect(body).toHaveProperty('services');
    expect(typeof body.services).toBe('object');
  });

  test('core services are running or available', async () => {
    const res = await httpGet(`${ENDPOINT}/_localstack/health`);
    const { services } = res.json();
    const expectedServices = ['s3', 'sqs', 'sns', 'dynamodb', 'lambda'];
    expectedServices.forEach(svc => {
      if (services[svc]) {
        expect(['running', 'available']).toContain(services[svc]);
      }
    });
  });

  test('/_localstack/info returns version info', async () => {
    const res = await httpGet(`${ENDPOINT}/_localstack/info`);
    if (res.ok) {
      const body = res.json();
      expect(body).toHaveProperty('version');
    }
  });
});
