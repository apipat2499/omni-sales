/**
 * Jest configuration for integration tests
 */
const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  displayName: 'integration',
  testMatch: ['**/__tests__/integration/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/e2e/'],
  testTimeout: 30000,
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/setup.ts',
    '<rootDir>/__tests__/integration/setup.ts',
  ],
  collectCoverage: false,
};
