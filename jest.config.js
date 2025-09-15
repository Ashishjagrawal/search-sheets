export default {
  testEnvironment: "node",
  transform: {},
  moduleNameMapping: {
    "^(\.{1,2}/.*)\.js$": "$1"
  },
  testMatch: [
    "**/tests/**/*.test.js",
    "**/tests/**/*.spec.js"
  ],
  collectCoverageFrom: [
    "backend/**/*.js",
    "scripts/**/*.js",
    "!backend/server.js",
    "!**/node_modules/**",
    "!**/tests/**"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 30000,
  verbose: true
};
