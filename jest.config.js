module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/renderer/**',
    '!src/preload/**',
    '!src/main/main.ts',
  ],
  moduleNameMapper: {
    '^@main/(.*)$': '<rootDir>/src/main/$1',
    '^@preload/(.*)$': '<rootDir>/src/preload/$1',
    '^@renderer/(.*)$': '<rootDir>/src/renderer/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
};
