import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Boots a single in-memory MongoDB for the whole run.
    globalSetup: ['./src/tests/setup/global-setup.ts'],
    // Runs in every test file: connects to an isolated database per file.
    setupFiles: ['./src/tests/setup/db.ts'],
    // Satisfies env validation; tests connect via the in-memory URI instead.
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/unused-in-tests',
      CLIENT_ORIGIN: 'http://localhost:5173',
    },
    // First run downloads the MongoDB binary.
    hookTimeout: 120_000,
    testTimeout: 15_000,
  },
});
