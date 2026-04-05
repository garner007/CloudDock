/** @type {import('jest').Config} */
module.exports = {
  displayName: 'integration',
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.js'],
  globalSetup: './tests/integration/globalSetup.js',
  setupFiles: ['./tests/integration/setup.js'],
  testTimeout: 30000,
  verbose: true,
  transform: {},
};
