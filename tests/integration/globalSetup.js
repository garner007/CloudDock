/**
 * Jest globalSetup — runs once before all integration test suites.
 * Verifies LocalStack is reachable.
 */
module.exports = async function globalSetup() {
  const endpoint = process.env.LS_ENDPOINT || 'http://localhost:4566';
  let reachable = false;

  try {
    const res = await fetch(`${endpoint}/_localstack/health`, {
      signal: AbortSignal.timeout(5000),
    });
    reachable = res.ok;
  } catch {}

  if (!reachable) {
    throw new Error(
      `\n\nLocalStack is not running at ${endpoint}.\n` +
      `Start it with: localstack start\n` +
      `Or: docker run --rm -it -p 4566:4566 localstack/localstack\n`
    );
  }
};
