/**
 * Jest Configuration
 * Unit testing setup for the project
 */

module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  moduleNameMapper: {
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@config/(.*)$': '<rootDir>/config/$1'
  },
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  globals: {
    NODE_ENV: 'test'
  }
};
