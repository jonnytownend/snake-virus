export default {
  testEnvironment: "node",
  watchman: false,
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.js"],
  collectCoverageFrom: [
    "src/game/constants.js",
    "src/game/game-state.js",
    "src/game/grid.js",
    "src/game/syntax-highlighter.js",
    "src/game/game-engine.js"
  ],
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85
    }
  }
};
