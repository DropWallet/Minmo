// Jest setup file
// Add any global test setup here

// Mock expo-sqlite for testing
jest.mock('expo-sqlite', () => {
  const mockDb = {
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
    closeAsync: jest.fn(),
  };

  return {
    openDatabaseAsync: jest.fn(() => Promise.resolve(mockDb)),
  };
});

// Mock expo-file-system for testing
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation((path) => ({
    uri: path,
    exists: true,
    copy: jest.fn(),
    delete: jest.fn(),
  })),
  Directory: jest.fn().mockImplementation((parent, name) => ({
    uri: `${parent}/${name}`,
    exists: true,
    create: jest.fn(),
  })),
  Paths: {
    document: 'file:///documents',
  },
}));

