/**
 * Jest globalSetup — runs once before all integration test suites.
 * Verifies LocalStack is reachable.
 * Uses Node's built-in http module to avoid fetch availability issues.
 */
const http = require('http');

function checkHealth(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(res.statusCode >= 200 && res.statusCode < 300));
    }).on('error', () => resolve(false));
  });
}

module.exports = async function globalSetup() {
  const endpoint = process.env.LS_ENDPOINT || 'http://localhost:4566';
  const reachable = await checkHealth(`${endpoint}/_localstack/health`);

  if (!reachable) {
    throw new Error(
      `\n\nLocalStack is not running at ${endpoint}.\n` +
      `Start it with: localstack start\n` +
      `Or: docker run --rm -it -p 4566:4566 localstack/localstack\n`
    );
  }
};
