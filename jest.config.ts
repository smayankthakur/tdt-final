import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': ['<rootDir>/src/$1', '<rootDir>/$1'],
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', allowJs: true, esModuleInterop: true }, diagnostics: false }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};

export default config;
