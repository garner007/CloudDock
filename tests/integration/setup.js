/**
 * Integration test setup
 * Requires a running LocalStack instance at http://localhost:4566
 * Run: npm run test:integration
 *
 * Health check is handled by globalSetup.js (runs once before all suites).
 */

// Polyfill structuredClone for Jest's VM sandbox (needed by AWS SDK v3 deserialization)
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}

const ENDPOINT = process.env.LS_ENDPOINT || 'http://localhost:4566';
const REGION   = process.env.LS_REGION   || 'us-east-1';
const ACCESS   = process.env.LS_ACCESS_KEY || 'test';
const SECRET   = process.env.LS_SECRET_KEY || 'test';

const BASE_CONFIG = {
  endpoint: ENDPOINT,
  region: REGION,
  credentials: { accessKeyId: ACCESS, secretAccessKey: SECRET },
  forcePathStyle: true,
};

module.exports = { BASE_CONFIG, ENDPOINT, REGION };
