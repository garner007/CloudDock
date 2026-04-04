/**
 * Integration test setup
 * Requires a running LocalStack instance at http://localhost:4566
 * Run: npm run test:integration
 */

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

// Check LocalStack is reachable before running any tests
beforeAll(async () => {
  let reachable = false;
  try {
    const res = await fetch(`${ENDPOINT}/_localstack/health`, {
      signal: AbortSignal.timeout(5000),
    });
    reachable = res.ok;
  } catch {}

  if (!reachable) {
    throw new Error(
      `\n\nLocalStack is not running at ${ENDPOINT}.\n` +
      `Start it with: localstack start\n` +
      `Or: docker run --rm -it -p 4566:4566 localstack/localstack\n`
    );
  }
});

module.exports = { BASE_CONFIG, ENDPOINT, REGION };
