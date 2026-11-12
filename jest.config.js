module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/__tests__/setup.ts'],
  testMatch: ['<rootDir>/__tests__/**/*.test.{ts,tsx}', '<rootDir>/src/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/__tests__/styleMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|immer|@reduxjs/toolkit|react-redux|redux|reselect)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/backend/'],
  modulePathIgnorePatterns: ['<rootDir>/backend/'],
};
