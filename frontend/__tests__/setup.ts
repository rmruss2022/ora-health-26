import '@testing-library/jest-native/extend-expect';

// Mock environment variables for tests
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';

// Mock window for React Native environment
global.window = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
} as any;

// Global test setup
beforeAll(() => {
  // Setup code that runs once before all tests
});

afterAll(() => {
  // Cleanup code that runs once after all tests
});

beforeEach(() => {
  // Setup code that runs before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup code that runs after each test
});

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
