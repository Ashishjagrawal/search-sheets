import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'backend/**/*.js',
        'scripts/**/*.js',
        '!backend/server.js',
        '!**/node_modules/**',
        '!**/tests/**'
      ],
      exclude: [
        'node_modules/**',
        'tests/**',
        'coverage/**'
      ]
    }
  }
});
