module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testTimeout: 15000,
  maxWorkers: 1,
  bail: 0,
  retry: 1,
}; 